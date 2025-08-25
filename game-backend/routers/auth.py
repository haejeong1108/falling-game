from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, create_engine
from models import User, UserCreate, UserRead, Token, LoginInput
from auth import hash_password, verify_password, create_access_token, get_user_by_email, decode_token

DATABASE_URL = "sqlite:///./app.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

def get_session():
    with Session(engine) as s:
        yield s

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

router = APIRouter()

@router.post("/signup", response_model=UserRead, status_code=201)
def signup(payload: UserCreate, session: Session = Depends(get_session)):
    if get_user_by_email(session, payload.email):
        raise HTTPException(status_code=400, detail="Email already exists")
    user = User(email=payload.email, hashed_password=hash_password(payload.password), nickname=payload.nickname)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@router.post("/login", response_model=Token)
def login(payload: LoginInput, session: Session = Depends(get_session)):
    user = get_user_by_email(session, payload.email)
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(sub=user.email)
    return Token(access_token=token)

def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)) -> User:
    email = decode_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = get_user_by_email(session, email)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.get("/me", response_model=UserRead)
def me(user: User = Depends(get_current_user)):
    return user
