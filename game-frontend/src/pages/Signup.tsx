import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const card: React.CSSProperties = {
  maxWidth: 420,
  margin: "48px auto",
  padding: 24,
  border: "1px solid #eee",
  borderRadius: 8,
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
};
const grid: React.CSSProperties = { display: "grid", gap: 12 };
const errorStyle: React.CSSProperties = { color: "#c62828", fontSize: 12 };

const Signup: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const emailError = useMemo(() => {
    if (!submitted) return "";
    if (!email.trim()) return "メールアドレスを入力してください。";
    const ok = /\S+@\S+\.\S+/.test(email);
    return ok ? "" : "正しいメールアドレス形式ではありません。";
  }, [email, submitted]);

  const passwordError = useMemo(() => {
    if (!submitted) return "";
    if (!password) return "パスワードを入力してください。";
    return password.length >= 6 ? "" : "パスワードは6文字以上で入力してください。";
  }, [password, submitted]);

  const confirmError = useMemo(() => {
    if (!submitted) return "";
    if (!confirm) return "パスワード確認を入力してください。";
    return confirm === password ? "" : "パスワードが一致しません。";
  }, [confirm, password, submitted]);

  const isValid =
    !emailError &&
    !passwordError &&
    !confirmError &&
    email.trim() &&
    password.length >= 6 &&
    confirm === password;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!isValid) return;

    try {
      setBusy(true);
      await signup(email.trim(), password, nickname.trim() || undefined);
      navigate("/game", { replace: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={card}>
      <h2>新規登録</h2>
      <form onSubmit={handleSubmit} style={grid} noValidate>
        <label>
          メールアドレス
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setSubmitted(true)}
            required
          />
        </label>
        {emailError && <span style={errorStyle}>{emailError}</span>}

        <label>
          ニックネーム（任意）
          <input
            placeholder="例: gamer_jae"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </label>

        <label>
          パスワード
          <input
            type="password"
            placeholder="6文字以上"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setSubmitted(true)}
            required
          />
        </label>
        {passwordError && <span style={errorStyle}>{passwordError}</span>}

        <label>
          パスワード確認
          <input
            type="password"
            placeholder="もう一度入力"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onBlur={() => setSubmitted(true)}
            required
          />
        </label>
        {confirmError && <span style={errorStyle}>{confirmError}</span>}

        <button type="submit" disabled={!isValid || busy}>
          {busy ? "登録中..." : "新規登録"}
        </button>
      </form>

      <p style={{ marginTop: 12 }}>
        すでにアカウントをお持ちですか？ <Link to="/login">ログイン</Link>
      </p>
    </div>
  );
};

export default Signup;
