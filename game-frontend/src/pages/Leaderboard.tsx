import React, { useEffect, useState, useCallback } from "react";
import { getScores } from "../api/scores";
import { onScoresUpdated } from "../lib/events";
import { useAuth } from "../hooks/useAuth";

type ScoreRead = {
  id: number;
  email: string;
  nickname?: string;
  score: number;
  created_at: string;
};

const Leaderboard: React.FC = () => {
  const [rows, setRows] = useState<ScoreRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<"all" | "best">("all");
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getScores(20, scope);
      setRows(data);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  const parseISO = (s: string) => {
    const hasTZ = /[zZ]|[+\-]\d{2}:?\d{2}$/.test(s);
    return new Date(hasTZ ? s : `${s}Z`);
  };

  const fmtJP = (iso: string) =>
    new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Tokyo",
      hour12: false,
    }).format(parseISO(iso));

  useEffect(() => {
    fetchData();
    const off = onScoresUpdated(() => fetchData());
    return off;
  }, [fetchData]);

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold tracking-tight">リーダーボード</h2>

      <div className="mt-3 flex gap-2">
        <button
          className={`px-3 py-1.5 rounded-md border text-sm ${scope === "all"
            ? "bg-blue-600 text-white"
            : "border-gray-300 hover:bg-gray-50"
            }`}
          onClick={() => setScope("all")}
        >
          全体
        </button>
        <button
          className={`px-3 py-1.5 rounded-md border text-sm ${scope === "best"
            ? "bg-blue-600 text-white"
            : "border-gray-300 hover:bg-gray-50"
            }`}
          onClick={() => setScope("best")}
        >
          ユーザー別 最高スコア
        </button>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={fetchData}
          className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 active:scale-[0.99] transition"
        >
          🔄 更新
        </button>
        {loading && <span className="text-sm text-gray-500">読み込み中…</span>}
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {rows.length === 0 ? (
          <div className="p-6 text-gray-600">
            まだスコアがありません。ゲームで <span className="font-medium">スコア送信</span> を押して保存してください。
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 w-16">順位</th>
                <th className="px-4 py-3">ニックネーム</th>
                <th className="px-4 py-3 w-24">スコア</th>
                <th className="px-4 py-3 w-48">保存日時</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const isTop3 = i < 3;
                const isMe = user && r.email === user.email;

                return (
                  <tr
                    key={r.id}
                    className={[
                      "border-t",
                      isMe
                        ? "bg-blue-50 dark:bg-blue-900/30" // 自分のアカウントなら青で強調
                        : isTop3
                          ? "bg-amber-50/60"
                          : "bg-white",
                      "hover:bg-gray-50 dark:hover:bg-gray-800/40",
                      "border-gray-100 dark:border-gray-700",
                    ].join(" ")}
                  >
                    <td className="px-4 py-3 font-semibold">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isTop3 && <span>🏅</span>}
                        <span className="font-medium">{r.nickname || r.email}</span>
                        <span className="text-xs text-gray-400 truncate max-w-[180px]">{r.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold">{r.score}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {fmtJP(r.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
