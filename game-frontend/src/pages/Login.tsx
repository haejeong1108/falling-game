import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";

const Login: React.FC = () => {
  const { login } = useAuth();
  const nav = useNavigate();
  const location = useLocation() as any;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login(email.trim(), password);
      const to = location.state?.from || "/game";
      nav(to, { replace: true });
    } catch (err: any) {
      console.error("[LOGIN] error:", err?.response?.status, err?.response?.data || err);
      alert("로그인 실패: 이메일/비밀번호를 확인해주세요.");
    }
  }

  return (
    <div className="px-4 py-6 max-w-sm mx-auto">
      <h2 className="text-xl font-bold">로그인</h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="email" className="w-full rounded border px-3 py-2" />
        <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="password" className="w-full rounded border px-3 py-2" />
        <button className="rounded-md border px-3 py-2">로그인</button>
      </form>
    </div>
  );
};
export default Login;
