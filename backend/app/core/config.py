from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path


class Settings(BaseSettings):
    APP_NAME: str = "Object Detection System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./detection.db"

    # Upload settings
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 50
    MAX_IMAGE_SIDE: int = 1024
    ALLOWED_IMAGE_TYPES: str = "image/*"
    ALLOWED_VIDEO_TYPES: str = "video/*"
    ALLOWED_IMAGE_EXTENSIONS: str = ".jpg,.jpeg,.jpe,.png,.webp,.gif,.bmp,.tif,.tiff,.heic,.heif,.avif"
    ALLOWED_VIDEO_EXTENSIONS: str = ".mp4,.avi,.mov,.mkv,.webm,.m4v,.mpeg,.mpg,.wmv,.flv,.3gp"

    # YOLO settings
    YOLO_MODEL: str = "yolov8n.pt"
    CONFIDENCE_THRESHOLD: float = 0.45
    IOU_THRESHOLD: float = 0.45
    MAX_DETECTIONS: int = 100
    YOLO_IMAGE_SIZE: int = 640
    YOLO_AUGMENT: bool = False
    YOLO_AGNOSTIC_NMS: bool = False
    VIDEO_SAMPLE_FPS: int = 5
    MIN_BOX_AREA_RATIO: float = 0.003
    SMALL_BOX_HIGH_CONF_THRESHOLD: float = 0.65

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"

    @property
    def upload_path(self) -> Path:
        path = Path(self.UPLOAD_DIR)
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def results_path(self) -> Path:
        path = Path(self.UPLOAD_DIR) / "results"
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def allowed_image_types_list(self) -> list[str]:
        return [t.strip() for t in self.ALLOWED_IMAGE_TYPES.split(",")]

    @property
    def allowed_video_types_list(self) -> list[str]:
        return [t.strip() for t in self.ALLOWED_VIDEO_TYPES.split(",")]

    @property
    def allowed_image_extensions_list(self) -> list[str]:
        return [ext.strip().lower() for ext in self.ALLOWED_IMAGE_EXTENSIONS.split(",")]

    @property
    def allowed_video_extensions_list(self) -> list[str]:
        return [ext.strip().lower() for ext in self.ALLOWED_VIDEO_EXTENSIONS.split(",")]


@lru_cache()
def get_settings() -> Settings:
    return Settings()
