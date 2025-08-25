# 루트에서
echo "# Falling Items Game (React + FastAPI)

## 구조
- game-frontend: React (CRA + TS)
- game-backend: FastAPI + SQLModel (SQLite)

## 로컬 실행
### Backend
cd game-backend
python -m venv .venv
# Win: .venv\\Scripts\\activate / Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

### Frontend
cd game-frontend
cp .env.example .env  # API 주소 확인
npm install
npm start
