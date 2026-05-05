import time
import uuid
import asyncio
import os
from pathlib import Path
from typing import Optional
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import cv2

try:
    import pillow_avif  # noqa: F401
except Exception:
    pillow_avif = None

from app.core.config import get_settings

settings = get_settings()

# YOLO color palette for bounding boxes
COLORS = [
    (0, 201, 167), (46, 134, 193), (142, 68, 173), (231, 76, 60),
    (243, 156, 18), (39, 174, 96), (52, 73, 94), (22, 160, 133),
    (41, 128, 185), (192, 57, 43), (243, 156, 18), (26, 188, 156),
]


class DetectionService:
    _model = None

    @staticmethod
    def _predict_kwargs(confidence: float, iou: float) -> dict:
        return {
            "conf": confidence,
            "iou": iou,
            "max_det": settings.MAX_DETECTIONS,
            "imgsz": settings.YOLO_IMAGE_SIZE,
            "augment": settings.YOLO_AUGMENT,
            "agnostic_nms": settings.YOLO_AGNOSTIC_NMS,
            "verbose": False,
        }

    @staticmethod
    def _keep_detection(confidence: float, x1: float, y1: float, x2: float, y2: float, img_w: int, img_h: int) -> bool:
        """Drop tiny low-confidence boxes that are often false positives."""
        box_w = max(0.0, x2 - x1)
        box_h = max(0.0, y2 - y1)
        area_ratio = (box_w * box_h) / max(1.0, float(img_w * img_h))
        if area_ratio < settings.MIN_BOX_AREA_RATIO and confidence < settings.SMALL_BOX_HIGH_CONF_THRESHOLD:
            return False
        return True

    @staticmethod
    def _load_trusted_yolo_model():
        """Load YOLO while opting out of torch weights-only mode for trusted checkpoints."""
        from ultralytics import YOLO

        env_var = "TORCH_FORCE_NO_WEIGHTS_ONLY_LOAD"
        previous_value = os.environ.get(env_var)
        os.environ[env_var] = "1"

        try:
            return YOLO(settings.YOLO_MODEL)
        finally:
            if previous_value is None:
                os.environ.pop(env_var, None)
            else:
                os.environ[env_var] = previous_value

    @staticmethod
    def _allowlist_ultralytics_checkpoint_globals() -> None:
        """Allow trusted Ultralytics model classes for torch weights-only loading."""
        try:
            import torch
            from ultralytics.nn import tasks as ultralytics_tasks

            add_safe_globals = getattr(torch.serialization, "add_safe_globals", None)
            if not callable(add_safe_globals):
                return

            # Torch 2.6+ may default to weights_only=True, which requires
            # explicit allowlisting for checkpoint classes.
            class_names = [
                "DetectionModel",
                "SegmentationModel",
                "ClassificationModel",
                "PoseModel",
                "OBBModel",
                "RTDETRDetectionModel",
                "WorldModel",
            ]

            safe_globals = [
                getattr(ultralytics_tasks, class_name)
                for class_name in class_names
                if hasattr(ultralytics_tasks, class_name)
            ]

            if safe_globals:
                add_safe_globals(safe_globals)
        except Exception as exc:
            print(f"⚠️ Could not register torch safe globals for YOLO: {exc}")

    @classmethod
    def get_model(cls):
        """Lazy-load YOLO model (singleton)."""
        if cls._model is None:
            try:
                cls._allowlist_ultralytics_checkpoint_globals()
                cls._model = cls._load_trusted_yolo_model()
                print(f"✅ Loaded YOLO model: {settings.YOLO_MODEL}")
            except Exception as e:
                print(f"❌ Failed to load YOLO model: {e}")
                raise
        return cls._model

    @classmethod
    async def detect_image(
        cls,
        file_path: Path,
        confidence: float = settings.CONFIDENCE_THRESHOLD,
        iou: float = settings.IOU_THRESHOLD,
    ) -> dict:
        """Run YOLO detection on an image file. Returns detection results dict."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, cls._detect_image_sync, file_path, confidence, iou)

    @classmethod
    def _detect_image_sync(cls, file_path: Path, confidence: float, iou: float) -> dict:
        start = time.perf_counter()

        model = cls.get_model()
        try:
            img = Image.open(file_path).convert("RGB")
        except Exception as exc:
            raise ValueError(
                f"Could not decode image file '{file_path.name}'. "
                "If this is AVIF/HEIC, ensure decoder support is installed."
            ) from exc

        # Use in-memory pixels instead of file path so inference is not blocked
        # by Ultralytics file-extension source filtering.
        results = model.predict(np.array(img), **cls._predict_kwargs(confidence, iou))

        result = results[0]
        img_w, img_h = img.size

        detections = []
        class_counts: dict[str, int] = {}

        if result.boxes is not None:
            boxes = result.boxes
            for i in range(len(boxes)):
                cls_id = int(boxes.cls[i].item())
                conf = float(boxes.conf[i].item())
                xyxy = boxes.xyxy[i].tolist()  # [x1, y1, x2, y2] in pixels
                label = model.names[cls_id]

                if not cls._keep_detection(conf, xyxy[0], xyxy[1], xyxy[2], xyxy[3], img_w, img_h):
                    continue

                # Normalize bbox to 0-1
                bbox_norm = [
                    xyxy[0] / img_w,
                    xyxy[1] / img_h,
                    xyxy[2] / img_w,
                    xyxy[3] / img_h,
                ]

                detections.append({
                    "label": label,
                    "confidence": round(conf, 4),
                    "bbox": [round(v, 4) for v in bbox_norm],
                    "bbox_pixels": [int(v) for v in xyxy],
                    "class_id": cls_id,
                })

                class_counts[label] = class_counts.get(label, 0) + 1

        # Draw annotated image
        result_filename = cls._draw_detections(img, detections, img_w, img_h)

        elapsed_ms = (time.perf_counter() - start) * 1000

        return {
            "objects_detected": len(detections),
            "detections": detections,
            "class_counts": class_counts,
            "image_size": {"width": img_w, "height": img_h},
            "result_filename": result_filename,
            "processing_time_ms": round(elapsed_ms, 2),
        }

    @classmethod
    def _draw_detections(cls, img: Image.Image, detections: list, img_w: int, img_h: int) -> str:
        """Draw bounding boxes on image and save to results dir."""
        draw = ImageDraw.Draw(img)

        for i, det in enumerate(detections):
            color = COLORS[i % len(COLORS)]
            x1, y1, x2, y2 = det["bbox_pixels"]
            label = det["label"]
            conf = det["confidence"]

            # Draw bounding box
            draw.rectangle([x1, y1, x2, y2], outline=color, width=3)

            # Label background
            text = f"{label} {conf:.0%}"
            font_size = max(12, int((x2 - x1) * 0.08))
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
            except Exception:
                font = ImageFont.load_default()

            bbox_text = draw.textbbox((x1, y1), text, font=font)
            text_w = bbox_text[2] - bbox_text[0]
            text_h = bbox_text[3] - bbox_text[1]
            padding = 4
            label_y = max(0, y1 - text_h - padding * 2)
            draw.rectangle(
                [x1, label_y, x1 + text_w + padding * 2, label_y + text_h + padding * 2],
                fill=color,
            )
            draw.text((x1 + padding, label_y + padding), text, fill=(255, 255, 255), font=font)

        result_filename = f"result_{uuid.uuid4().hex}.jpg"
        result_path = settings.results_path / result_filename
        img.save(result_path, "JPEG", quality=92)
        return result_filename

    @classmethod
    async def detect_video(
        cls,
        file_path: Path,
        confidence: float = settings.CONFIDENCE_THRESHOLD,
        iou: float = settings.IOU_THRESHOLD,
    ) -> dict:
        """Process video and extract frame-level detections + annotated video."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, cls._detect_video_sync, file_path, confidence, iou)

    @classmethod
    def _detect_video_sync(cls, file_path: Path, confidence: float, iou: float) -> dict:
        start = time.perf_counter()
        model = cls.get_model()

        cap = cv2.VideoCapture(str(file_path))
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {file_path}")

        fps = cap.get(cv2.CAP_PROP_FPS) or 25
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        result_filename = f"result_{uuid.uuid4().hex}.mp4"
        result_path = settings.results_path / result_filename

        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        out = cv2.VideoWriter(str(result_path), fourcc, fps, (width, height))

        all_detections = []
        class_counts: dict[str, int] = {}
        frame_idx = 0
        sample_every = max(1, int(fps / max(1, settings.VIDEO_SAMPLE_FPS)))

        colors_bgr = [(c[2], c[1], c[0]) for c in COLORS]

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % sample_every == 0:
                results = model.predict(frame, **cls._predict_kwargs(confidence, iou))
                result = results[0]

                if result.boxes is not None:
                    for i, box in enumerate(result.boxes):
                        cls_id = int(box.cls[0].item())
                        conf = float(box.conf[0].item())
                        x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]
                        label = model.names[cls_id]

                        if not cls._keep_detection(conf, x1, y1, x2, y2, width, height):
                            continue
                        color = colors_bgr[cls_id % len(colors_bgr)]

                        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                        text = f"{label} {conf:.0%}"
                        cv2.putText(
                            frame, text, (x1, max(20, y1 - 8)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2
                        )

                        all_detections.append({"label": label, "confidence": conf, "frame": frame_idx})
                        class_counts[label] = class_counts.get(label, 0) + 1

            out.write(frame)
            frame_idx += 1

        cap.release()
        out.release()

        elapsed_ms = (time.perf_counter() - start) * 1000

        return {
            "objects_detected": len(all_detections),
            "detections": all_detections[:200],  # cap for JSON size
            "class_counts": class_counts,
            "video_info": {"width": width, "height": height, "fps": fps, "total_frames": total_frames},
            "result_filename": result_filename,
            "processing_time_ms": round(elapsed_ms, 2),
        }
