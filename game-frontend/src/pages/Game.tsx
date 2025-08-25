import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { postScore } from "../api/scores";
// import { emitScoresUpdated } from "../lib/events"; // 원하면 사용

// 고정 해상도
const WIDTH = 480;
const HEIGHT = 320;

// 플레이어/아이템
const PLAYER = { w: 40, h: 16, speed: 240 }; // px/s
const ITEM_BASE = { w: 12, h: 12, fallSpeedMin: 90, fallSpeedMax: 180 };

// 게임성 강화 상수
const MAX_HP = 3;
const SLOW_DURATION = 4;   // 초
const SLOW_FACTOR = 0.6;   // 속도 60%

// 난이도
const BASE_SPAWN_INTERVAL_MS = 900;
const LEVEL_TIME_SEC = 20;
const LEVEL_SCORE_STEP = 10;
const MAX_ITEMS_BASE = 3;
const MAX_ITEMS_PER_LEVEL = 1;

// 타입
type Vec = { x: number; y: number };
type Rect = Vec & { w: number; h: number };
type ItemKind = "good" | "bad" | "bonus" | "slow" | "skull";
type Item = Rect & { vy: number; kind: ItemKind };

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

// 충돌 판정(패딩)
function aabb(a: Rect, b: Rect) {
  const pad = 4;
  const A = { x: a.x - pad, y: a.y - pad, w: a.w + pad * 2, h: a.h + pad * 2 };
  const B = { x: b.x - pad, y: b.y - pad, w: b.w + pad * 2, h: b.h + pad * 2 };
  return A.x < B.x + B.w && A.x + A.w > B.x && A.y < B.y + B.h && A.y + A.h > B.y;
}

// 🔥 아이템 종류 확률 (하나만 유지: 이전의 단순 버전은 삭제)
function randomKind(level: number): ItemKind {
  const pBad   = Math.min(0.2 + level * 0.05, 0.5);     // 20% → 50%
  const pBonus = 0.08;                                  // +5점
  const pSlow  = 0.08;                                  // SLOW_DURATION 동안 느려짐
  const pSkull = Math.min(0.05 + level * 0.02, 0.15);   // HP-1

  const r = Math.random();
  if (r < pBad) return "bad";
  if (r < pBad + pBonus) return "bonus";
  if (r < pBad + pBonus + pSlow) return "slow";
  if (r < pBad + pBonus + pSlow + pSkull) return "skull";
  return "good";
}

const Game: React.FC = () => {
  const { user } = useAuth();

  // 캔버스 & 컨텍스트
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [ready, setReady] = useState(false);
  const reqRef = useRef<number | null>(null);

  // 상태
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeSec, setTimeSec] = useState(0);
  const [hp, setHp] = useState(MAX_HP);
  const [gameOver, setGameOver] = useState(false);
  const gameOverRef = useRef(false); // 🔑 P키 토글을 위한 최신 상태 보관

  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  // 입력
  const keys = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });

  // 엔티티
  const player = useRef<Rect>({ x: WIDTH / 2 - PLAYER.w / 2, y: HEIGHT - 40, w: PLAYER.w, h: PLAYER.h });
  const items = useRef<Item[]>([]);

  // 시계/스폰
  const lastTs = useRef<number>(performance.now());
  const spawnAccMs = useRef<number>(0);

  // 점수 누적
  const scorePending = useRef(0);

  // 느려짐 효과: until 타임스탬프(ms) 저장
  const slowUntilMs = useRef<number>(0);

  // 컨텍스트 준비
  useEffect(() => {
    if (canvasRef.current) {
      ctxRef.current = canvasRef.current.getContext("2d");
      setReady(true);
    }
  }, []);

  // 키보드 (의존성 없이 1회 등록, 최신 상태는 ref에서 읽음)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a") keys.current.left = true;
      if (k === "arrowright" || k === "d") keys.current.right = true;
      if (k === "p") {
        if (gameOverRef.current) return; // 게임오버 때는 무시
        setRunning((v) => !v);
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a") keys.current.left = false;
      if (k === "arrowright" || k === "d") keys.current.right = false;
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // 난이도 헬퍼
  function computeLevel(totalSec: number, scoreVal: number) {
    const lvTime = Math.floor(totalSec / LEVEL_TIME_SEC);
    const lvScore = Math.floor(scoreVal / LEVEL_SCORE_STEP);
    return 1 + lvTime + lvScore;
  }
  function fallSpeedRange(lv: number, mul = 1) {
    const boost = 1 + (lv - 1) * 0.12;
    return {
      min: ITEM_BASE.fallSpeedMin * boost * mul,
      max: ITEM_BASE.fallSpeedMax * boost * mul,
    };
  }
  function maxItemsAllowed(lv: number) {
    return MAX_ITEMS_BASE + (lv - 1) * MAX_ITEMS_PER_LEVEL;
  }
  function spawnIntervalMs(lv: number) {
    const factor = 1 + (lv - 1) * 0.15;
    return Math.max(350, Math.floor(BASE_SPAWN_INTERVAL_MS / factor));
  }
  function currentSpeedMul(nowMs: number) {
    return nowMs < slowUntilMs.current ? SLOW_FACTOR : 1;
  }

  // 스폰
  function spawnItem(lv: number) {
    const now = performance.now();
    const mul = currentSpeedMul(now);
    const { min, max } = fallSpeedRange(lv, mul);
    const kind = randomKind(lv);
    const w = ITEM_BASE.w, h = ITEM_BASE.h;
    const it: Item = {
      x: rand(0, WIDTH - w),
      y: -h,
      w, h,
      vy: rand(min, max),
      kind,
    };
    items.current.push(it);
  }

  // 그리기
  function draw(c: CanvasRenderingContext2D) {
    c.clearRect(0, 0, WIDTH, HEIGHT);

    // 배경
    c.fillStyle = "#f8fafc";
    c.fillRect(0, 0, WIDTH, HEIGHT);

    // 상단 UI
    c.fillStyle = "#111827";
    c.font = "bold 14px Arial";
    c.fillText(`Player: ${user?.nickname || user?.email}`, 8, 18);
    c.fillText(`Score: ${score}`, WIDTH - 100, 18);
    c.fillText(`Level: ${level}`, WIDTH / 2 - 30, 18);

    // 플레이어
    c.fillStyle = "#2563eb";
    c.fillRect(player.current.x, player.current.y, player.current.w, player.current.h);

    // HP
    c.fillStyle = "#dc2626";
    c.fillText(`HP: ${"❤".repeat(hp)}${"♡".repeat(Math.max(0, MAX_HP - hp))}`, 8, 36);

    // SLOW 남은 시간
    const remainMs = Math.max(0, slowUntilMs.current - performance.now());
    if (remainMs > 0) {
      c.fillStyle = "#0ea5e9";
      c.fillText(`SLOW ${Math.ceil(remainMs / 1000)}s`, WIDTH - 100, 36);
    }

    // 아이템
    for (const it of items.current) {
      switch (it.kind) {
        case "good":  c.fillStyle = "#16a34a"; break;
        case "bad":   c.fillStyle = "#dc2626"; break;
        case "bonus": c.fillStyle = "#f59e0b"; break;
        case "slow":  c.fillStyle = "#0ea5e9"; break;
        case "skull": c.fillStyle = "#6b7280"; break;
      }
      c.fillRect(it.x, it.y, it.w, it.h);
    }

    // Paused 오버레이 (게임오버 아닐 때만)
    if (!running && !gameOver) {
      c.fillStyle = "rgba(0,0,0,0.35)";
      c.fillRect(0, 0, WIDTH, HEIGHT);
      c.fillStyle = "#fff";
      c.font = "bold 18px Arial";
      c.fillText("Paused (P to toggle)", WIDTH / 2 - 90, HEIGHT / 2);
    }
  }

  // 게임 루프
  useEffect(() => {
    if (!ready) return;
    const ctx = ctxRef.current;
    if (!ctx) return;

    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - lastTs.current) / 1000);
      lastTs.current = now;

      if (running) {
        // 시간/레벨
        const totalSec = timeSec + dt;
        setTimeSec(totalSec);
        const nextLevel = computeLevel(totalSec, score);
        if (nextLevel !== level) setLevel(nextLevel);

        // 플레이어 이동
        const vx = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0);
        player.current.x += vx * PLAYER.speed * dt;
        player.current.x = Math.max(0, Math.min(WIDTH - player.current.w, player.current.x));

        // 느려짐 멀티플라이어
        const speedMul = currentSpeedMul(now);

        // 아이템 이동/충돌/삭제
        const arr = items.current;
        for (let i = arr.length - 1; i >= 0; i--) {
          const it = arr[i];
          it.y += it.vy * speedMul * dt;

          // 충돌
          if (aabb(player.current, it)) {
            switch (it.kind) {
              case "good":  scorePending.current += 1; break;
              case "bad":   scorePending.current = Math.max(scorePending.current - 1, -score); break;
              case "bonus": scorePending.current += 5; break;
              case "slow":
                slowUntilMs.current = Math.max(slowUntilMs.current, performance.now() + SLOW_DURATION * 1000);
                break;
              case "skull":
                setHp((h) => {
                  const nh = Math.max(h - 1, 0);
                  if (nh === 0) {
                    setRunning(false);
                    setGameOver(true);
                  }
                  return nh;
                });
                break;
            }
            arr.splice(i, 1);
            continue;
          }

          if (it.y > HEIGHT) arr.splice(i, 1);
        }

        // 스폰 (이번 프레임 기준 레벨 사용)
        spawnAccMs.current += dt * 1000;
        const interval = spawnIntervalMs(nextLevel);
        const maxAllowed = maxItemsAllowed(nextLevel);
        if (spawnAccMs.current >= interval && items.current.length < maxAllowed) {
          spawnAccMs.current = 0;
          spawnItem(nextLevel);
        }
      }

      // 점수 반영
      if (scorePending.current !== 0) {
        const delta = scorePending.current;
        setScore((s) => Math.max(s + delta, 0));
        scorePending.current = 0;
      }

      draw(ctx);
      reqRef.current = requestAnimationFrame(loop);
    };

    reqRef.current = requestAnimationFrame(loop);
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [ready, running, level, timeSec, score, user?.email, user?.nickname]);

  // 컨트롤러
  function handleStart() {
    items.current = [];
    player.current = { x: WIDTH / 2 - PLAYER.w / 2, y: HEIGHT - 40, w: PLAYER.w, h: PLAYER.h };
    scorePending.current = 0;
    spawnAccMs.current = 0;
    lastTs.current = performance.now();
    slowUntilMs.current = 0;
    setScore(0);
    setLevel(1);
    setTimeSec(0);
    setHp(MAX_HP);
    setGameOver(false);
    setRunning(true);
  }
  function handlePauseToggle() {
    if (gameOver) return; // 오버에서 토글 방지
    setRunning((v) => !v);
  }
  function handleReset() {
    items.current = [];
    player.current = { x: WIDTH / 2 - PLAYER.w / 2, y: HEIGHT - 40, w: PLAYER.w, h: PLAYER.h };
    scorePending.current = 0;
    spawnAccMs.current = 0;
    lastTs.current = performance.now();
    slowUntilMs.current = 0;
    setScore(0);
    setLevel(1);
    setTimeSec(0);
    setHp(MAX_HP);
    setGameOver(false);
    setRunning(false);
  }

  async function handleSubmitScore() {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }
    if (score <= 0) {
      alert("0점 이하는 저장하지 않습니다.");
      return;
    }
    try {
      await postScore(score);
      // emitScoresUpdated();
      alert(`점수 저장 완료! (${score}점)`);
    } catch (err: any) {
      console.error("[POST /scores] error:", err?.response?.status, err?.response?.data || err);
      alert("점수 저장 실패 (로그인/백엔드 확인)");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-6 py-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-2 text-center">Game</h2>
        <p className="text-center mb-4">
          환영합니다, <span className="font-semibold">{user?.nickname || user?.email}</span>!
        </p>

        {/* 컨트롤 */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          <button onClick={handleStart} className="px-3 py-1.5 border rounded dark:border-gray-700">Start</button>
          <button onClick={handlePauseToggle} className="px-3 py-1.5 border rounded dark:border-gray-700">
            {running ? "Pause" : "Resume"}
          </button>
          <button onClick={handleReset} className="px-3 py-1.5 border rounded dark:border-gray-700">Reset</button>
          <button onClick={handleSubmitScore} disabled={score <= 0} className="px-3 py-1.5 border rounded dark:border-gray-700">
            Submit Score
          </button>
        </div>

        <div className="text-center text-sm text-gray-500 dark:text-gray-400 mb-3">
          ←/A, →/D 이동 · P 일시정지
        </div>

        {/* 캔버스 + 상태 오버레이 */}
        <div className="flex justify-center">
          <div className="relative" style={{ width: WIDTH, height: HEIGHT }}>
            <canvas
              ref={canvasRef}
              width={WIDTH}
              height={HEIGHT}
              className="rounded-lg border-2 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-950"
            />

            {/* 일시정지 (게임오버 아닐 때만) */}
            {!running && !gameOver && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
                <div className="px-4 py-2 rounded bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 shadow">
                  Paused (P to toggle)
                </div>
              </div>
            )}

            {/* 게임오버 */}
            {gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-black/55">
                <div className="text-2xl font-bold text-red-500 drop-shadow">Game Over</div>
                <div className="text-sm text-red-500 drop-shadow">최종 점수: {score}</div>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={async () => {
                      try {
                        if (score > 0) {
                          const saved = await postScore(score);
                          alert(`점수 저장 완료! (${saved.score}점)`);
                        } else {
                          alert("0점은 저장하지 않습니다.");
                        }
                      } catch (e) {
                        console.error(e);
                        alert("점수 저장 실패 (로그인/백엔드 확인)");
                      }
                    }}
                    className="px-3 py-1.5 rounded-md border bg-white text-black"
                  >
                    Submit Score
                  </button>
                  <button onClick={handleStart} className="px-3 py-1.5 rounded-md border bg-white text-black">
                    Restart
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
