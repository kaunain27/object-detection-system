import uuid
import aiofiles
import mimetypes
from pathlib import Path
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from collections import Counter

from app.core.database import get_db
from app.core.config import get_settings
from app.core.security import get_current_user
from app.core.schemas import DetectionResult, DetectionListItem, DetectionStats
from app.models.user import User
from app.models.detection import Detection
from app.services.detection_service import DetectionService

router = APIRouter(prefix="/detections", tags=["Detection"])
settings = get_settings()

MAX_SIZE = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


def _is_allowed_media(mime: str, ext: str, allowed_mimes: list[str], allowed_exts: list[str]) -> bool:
    mime = (mime or "").strip().lower()
    ext = (ext or "").strip().lower()

    if mime:
        for allowed in allowed_mimes:
            allowed = allowed.strip().lower()
            if allowed.endswith("/*"):
                if mime.startswith(f"{allowed[:-1]}"):
                    return True
            elif mime == allowed:
                return True

    return ext in allowed_exts


@router.post("/", response_model=DetectionResult, status_code=201)
async def run_detection(
    file: UploadFile = File(...),
    confidence: float = Form(default=settings.CONFIDENCE_THRESHOLD, ge=0.25, le=1.0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate content type
    mime = file.content_type or ""
    ext = Path(file.filename or "upload").suffix.lower()

    if not mime or mime in {"application/octet-stream", "binary/octet-stream"}:
        guessed_mime, _ = mimetypes.guess_type(file.filename or "")
        if guessed_mime:
            mime = guessed_mime

    is_image = _is_allowed_media(
        mime,
        ext,
        settings.allowed_image_types_list,
        settings.allowed_image_extensions_list,
    )
    is_video = _is_allowed_media(
        mime,
        ext,
        settings.allowed_video_types_list,
        settings.allowed_video_extensions_list,
    )

    if not (is_image or is_video):
        raise HTTPException(
            status_code=422,
            detail=(
                f"Unsupported file type: {mime or 'unknown'}. "
                f"Allowed image extensions: {', '.join(settings.allowed_image_extensions_list)}; "
                f"allowed video extensions: {', '.join(settings.allowed_video_extensions_list)}."
            ),
        )

    # Read file & check size
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=413, detail=f"File exceeds {settings.MAX_UPLOAD_SIZE_MB} MB limit.")

    # Save upload
    upload_ext = ext or (".jpg" if is_image else ".mp4")
    unique_name = f"{uuid.uuid4().hex}{upload_ext}"
    upload_path = settings.upload_path / unique_name

    async with aiofiles.open(upload_path, "wb") as f:
        await f.write(content)

    # Create DB record (pending)
    record = Detection(
        user_id=current_user.id,
        filename=unique_name,
        original_filename=file.filename or unique_name,
        file_type="image" if is_image else "video",
        file_size=len(content),
        mime_type=mime,
        confidence_threshold=confidence,
        model_used=settings.YOLO_MODEL,
        status="processing",
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)

    # Run detection
    try:
        if is_image:
            result = await DetectionService.detect_image(upload_path, confidence=confidence)
        else:
            result = await DetectionService.detect_video(upload_path, confidence=confidence)

        record.objects_detected = result["objects_detected"]
        record.detection_data = result
        record.processing_time_ms = result["processing_time_ms"]
        record.result_filename = result["result_filename"]
        record.status = "done"
        record.completed_at = datetime.now(timezone.utc)

    except Exception as e:
        record.status = "failed"
        record.error_message = str(e)
        await db.commit()
        raise HTTPException(status_code=500, detail=f"Detection failed: {e}")

    await db.commit()
    await db.refresh(record)
    return DetectionResult.model_validate(record)


@router.get("/", response_model=list[DetectionListItem])
async def list_detections(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Detection)
        .where(Detection.user_id == current_user.id)
        .order_by(desc(Detection.created_at))
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/stats", response_model=DetectionStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Detection)
        .where(Detection.user_id == current_user.id, Detection.status == "done")
    )
    detections = result.scalars().all()

    total = len(detections)
    total_objects = sum(d.objects_detected for d in detections)
    avg = total_objects / total if total > 0 else 0.0

    label_counter: Counter = Counter()
    for d in detections:
        if d.detection_data and "class_counts" in d.detection_data:
            label_counter.update(d.detection_data["class_counts"])

    most_common = [{"label": k, "count": v} for k, v in label_counter.most_common(10)]

    recent_result = await db.execute(
        select(Detection)
        .where(Detection.user_id == current_user.id)
        .order_by(desc(Detection.created_at))
        .limit(5)
    )
    recent = recent_result.scalars().all()

    return DetectionStats(
        total_detections=total,
        total_objects=total_objects,
        avg_objects_per_detection=round(avg, 2),
        most_common_objects=most_common,
        recent_detections=[DetectionListItem.model_validate(r) for r in recent],
    )


@router.get("/{detection_id}", response_model=DetectionResult)
async def get_detection(
    detection_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Detection).where(
            Detection.id == detection_id,
            Detection.user_id == current_user.id,
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Detection not found")
    return DetectionResult.model_validate(record)


@router.get("/{detection_id}/result-image")
async def get_result_image(
    detection_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Detection).where(
            Detection.id == detection_id,
            Detection.user_id == current_user.id,
        )
    )
    record = result.scalar_one_or_none()
    if not record or not record.result_filename:
        raise HTTPException(status_code=404, detail="Result not found")

    result_path = settings.results_path / record.result_filename
    if not result_path.exists():
        raise HTTPException(status_code=404, detail="Result file not found")

    return FileResponse(str(result_path), media_type="image/jpeg")


@router.get("/{detection_id}/original")
async def get_original_file(
    detection_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Detection).where(
            Detection.id == detection_id,
            Detection.user_id == current_user.id,
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Detection not found")

    file_path = settings.upload_path / record.filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Original file not found")

    return FileResponse(str(file_path), media_type=record.mime_type)


@router.delete("/{detection_id}", status_code=204)
async def delete_detection(
    detection_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Detection).where(
            Detection.id == detection_id,
            Detection.user_id == current_user.id,
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Detection not found")

    # Clean up files
    for path in [settings.upload_path / record.filename]:
        if path.exists():
            path.unlink(missing_ok=True)
    if record.result_filename:
        result_path = settings.results_path / record.result_filename
        result_path.unlink(missing_ok=True)

    await db.delete(record)
    await db.commit()
