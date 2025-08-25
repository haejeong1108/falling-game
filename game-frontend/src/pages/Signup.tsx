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
    if (!email.trim()) return "이메일을 입력하세요.";
    const ok = /\S+@\S+\.\S+/.test(email);
    return ok ? "" : "올바른 이메일 형식이 아닙니다.";
  }, [email, submitted]);

  const passwordError = useMemo(() => {
    if (!submitted) return "";
    if (!password) return "비밀번호를 입력하세요.";
    return password.length >= 6 ? "" : "비밀번호는 최소 6자 이상이어야 합니다.";
  }, [password, submitted]);

  const confirmError = useMemo(() => {
    if (!submitted) return "";
    if (!confirm) return "비밀번호 확인을 입력하세요.";
    return confirm === password ? "" : "비밀번호가 일치하지 않습니다.";
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
      <h2>회원가입</h2>
      <form onSubmit={handleSubmit} style={grid} noValidate>
        <label>
          이메일
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
          닉네임 (선택)
          <input
            placeholder="예: gamer_jae"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </label>

        <label>
          비밀번호
          <input
            type="password"
            placeholder="최소 6자"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setSubmitted(true)}
            required
          />
        </label>
        {passwordError && <span style={errorStyle}>{passwordError}</span>}

        <label>
          비밀번호 확인
          <input
            type="password"
            placeholder="다시 입력"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onBlur={() => setSubmitted(true)}
            required
          />
        </label>
        {confirmError && <span style={errorStyle}>{confirmError}</span>}

        <button type="submit" disabled={!isValid || busy}>
          {busy ? "가입 중..." : "회원가입"}
        </button>
      </form>

      <p style={{ marginTop: 12 }}>
        이미 계정이 있나요? <Link to="/login">로그인</Link>
      </p>
    </div>
  );
};

export default Signup;
