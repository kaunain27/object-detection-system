from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, Any


# ─── Auth ─────────────────────────────────────────────
class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


# ─── User ─────────────────────────────────────────────
class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Detection ────────────────────────────────────────
class DetectionObject(BaseModel):
    label: str
    confidence: float
    bbox: list[float]  # [x1, y1, x2, y2] normalized 0-1


class DetectionResult(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    result_filename: Optional[str]
    objects_detected: int
    detection_data: Optional[Any]
    processing_time_ms: Optional[float]
    confidence_threshold: float
    model_used: str
    status: str
    error_message: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]

    model_config = {"from_attributes": True}


class DetectionListItem(BaseModel):
    id: int
    original_filename: str
    file_type: str
    objects_detected: int
    status: str
    processing_time_ms: Optional[float]
    created_at: datetime

    model_config = {"from_attributes": True}


class DetectionStats(BaseModel):
    total_detections: int
    total_objects: int
    avg_objects_per_detection: float
    most_common_objects: list[dict]
    recent_detections: list[DetectionListItem]
