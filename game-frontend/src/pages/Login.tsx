import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";

const Login: React.FC = () => {
  const { login } = useAuth();
  const nav = useNavigate();
  const location = useLocation() as any;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // フォーム送信処理
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login(email.trim(), password);
      const to = location.state?.from || "/game";
      nav(to, { replace: true });
    } catch (err: any) {
      console.error("[LOGIN] error:", err?.response?.status, err?.response?.data || err);
      alert("ログイン失敗：メールアドレス／パスワードを確認してください。");
    }
  }

  return (
    <div className="px-4 py-6 max-w-sm mx-auto">
      <h2 className="text-xl font-bold">ログイン</h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="メールアドレス"
          className="w-full rounded border px-3 py-2"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="パスワード"
          className="w-full rounded border px-3 py-2"
        />
        <button className="rounded-md border px-3 py-2">ログイン</button>
      </form>
    </div>
  );
};
export default Login;
