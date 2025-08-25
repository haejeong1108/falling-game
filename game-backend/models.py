from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel

# ===== User =====
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True, max_length=255)
    hashed_password: str
    nickname: Optional[str] = Field(default=None, max_length=50)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

class UserCreate(SQLModel):
    email: str
    password: str
    nickname: Optional[str] = None

class UserRead(SQLModel):
    id: int
    email: str
    nickname: Optional[str]
    created_at: datetime

# ===== Score =====  (기존 유지)
class ScoreBase(SQLModel):
    email: str = Field(index=True, max_length=255)
    nickname: Optional[str] = Field(default=None, max_length=50)
    score: int = Field(ge=0)

class Score(ScoreBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)

class ScoreCreate(ScoreBase): pass

class ScoreRead(SQLModel):
    id: int
    email: str
    nickname: Optional[str]
    score: int
    created_at: datetime

# ===== Auth schemas =====
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"

class LoginInput(SQLModel):
    email: str
    password: str
