import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import NavBar from "./components/NavBar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Game from "./pages/Game";
import Leaderboard from "./pages/Leaderboard";

// ホーム画面コンポーネント
const Home: React.FC = () => (
  <div style={{ padding: 24 }}>
    <h2>ホーム</h2>
    <p>Falling Items ゲームプロジェクト (React + FastAPI)</p>
  </div>
);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NavBar />
        <Routes>
          {/* ホーム */}
          <Route path="/" element={<Home />} />
          {/* ログイン */}
          <Route path="/login" element={<Login />} />
          {/* 新規登録 */}
          <Route path="/signup" element={<Signup />} />
          {/* ゲーム (ログイン必須) */}
          <Route
            path="/game"
            element={
              <ProtectedRoute>
                <Game />
              </ProtectedRoute>
            }
          />
          {/* ランキング */}
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
