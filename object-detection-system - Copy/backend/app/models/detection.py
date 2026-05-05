from sqlalchemy import Integer, String, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
from app.core.database import Base


class Detection(Base):
    __tablename__ = "detections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)

    # File info
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str] = mapped_column(String(20), nullable=False)  # "image" or "video"
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)  # bytes
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)

    # Result info
    result_filename: Mapped[str] = mapped_column(String(255), nullable=True)
    objects_detected: Mapped[int] = mapped_column(Integer, default=0)
    detection_data: Mapped[dict] = mapped_column(JSON, nullable=True)  # full detection results
    processing_time_ms: Mapped[float] = mapped_column(Float, nullable=True)

    # Settings used
    confidence_threshold: Mapped[float] = mapped_column(Float, default=0.5)
    model_used: Mapped[str] = mapped_column(String(50), default="yolov8n.pt")

    # Status
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, processing, done, failed
    error_message: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="detections")  # noqa
