from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, create_engine

from routers import scores, auth

DATABASE_URL = "sqlite:///./app.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

app = FastAPI(title="Falling Game API")

origins = [
  "http://localhost:3000", "http://127.0.0.1:3000",
  "http://localhost:3001", "http://127.0.0.1:3001",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(scores.router, prefix="/scores", tags=["scores"])

# 테이블 생성
@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)

@app.get("/health")
def health():
    return {"ok": True}
