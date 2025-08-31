# 🎮 Falling Game

React + FastAPI で構築したシンプルなミニゲームです。  
プレイヤーは左右に移動して落ちてくるアイテムをキャッチし、スコアを稼ぎます。  
スコアはバックエンドに送信され、リーダーボードでランキングを確認できます。

---

## 🚀 技術スタック

- **フロントエンド**: React (TypeScript, TailwindCSS)
- **バックエンド**: FastAPI, SQLModel, SQLite
- **認証**: JWT によるログイン／サインアップ
- **その他**: CORS, REST API, 簡易的なモノレポ構成

---

## ✨ 主な機能

- ゲームプレイ  
  - 良いアイテムを取るとスコア加算  
  - 悪いアイテム／ドクロを取るとHP減少  
  - ボーナスアイテム (+5点)、スロウアイテム (落下速度低下)  
- スコア保存（JWT 認証必須）  
- リーダーボード表示  
  - 全スコア順  
  - ユーザーごとの最高スコア  
- ユーザー登録・ログイン機能

---

## 🛠 セットアップ方法

### フロントエンド
```bash
cd game-frontend
npm install
npm start
```

### バックエンド
```bash
cd game-backend
python -m venv .venv
.\.venv\Scriptsctivate    # Windows PowerShell の場合
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## 🌐 アクセス方法

- フロントエンド: http://localhost:3000  
- バックエンド API: http://localhost:8000
