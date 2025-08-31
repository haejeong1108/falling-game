from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func, SQLModel
from models import Score, ScoreRead, User
from routers.auth import get_current_user, get_session

router = APIRouter()

class ScoreBody(SQLModel):
    score: int

@router.post("", response_model=ScoreRead, status_code=201)
def create_score(
    body: ScoreBody,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user)
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
    scope: str = "all",
    session: Session = Depends(get_session)
):
    if scope == "best":
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

    rows = session.exec(
        select(Score).order_by(Score.score.desc(), Score.created_at.desc()).limit(limit)
    ).all()
    return rows
