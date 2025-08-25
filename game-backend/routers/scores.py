from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func, SQLModel
from models import Score, ScoreRead, User  # User 타입은 인증 의존성 리턴용
from routers.auth import get_current_user, get_session  # ★ 인증/세션 의존성

router = APIRouter()

# ★ JSON 바디로 score만 받기 위한 모델
class ScoreBody(SQLModel):
    score: int

@router.post("", response_model=ScoreRead, status_code=201)
def create_score(
    body: ScoreBody,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)  # ★ 토큰 필수
):
    if body.score < 0:
        raise HTTPException(status_code=400, detail="score must be >= 0")
    obj = Score(email=user.email, nickname=user.nickname, score=body.score)
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

@router.get("/top", response_model=List[ScoreRead])
def get_top_scores(
    limit: int = 20,
    scope: str = "all",   # "all" | "best"
    session: Session = Depends(get_session)
):
    if scope == "best":
        # 이메일별 최고점만 추출 (동점이면 최근 기록 우선)
        sub = select(
            Score.email,
            func.max(Score.score).label("best_score"),
            func.max(Score.created_at).label("latest_at"),
        ).group_by(Score.email).subquery()

        rows = session.exec(
            select(Score)
            .join(sub, (Score.email == sub.c.email) & (Score.score == sub.c.best_score))
            .order_by(Score.score.desc(), Score.created_at.desc())
            .limit(limit)
        ).all()
        return rows

    # 전체 기록 중 상위
    rows = session.exec(
        select(Score).order_by(Score.score.desc(), Score.created_at.desc()).limit(limit)
    ).all()
    return rows
