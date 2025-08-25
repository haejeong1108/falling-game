import api from "./client";

export type ScoreRead = { id:number; email:string; nickname?:string; score:number; created_at:string };

export async function postScore(score: number) {
  const { data } = await api.post<ScoreRead>("/scores", { score });
  return data;
}
export async function getScores(limit = 20, scope: "all" | "best" = "all") {
  const { data } = await api.get<ScoreRead[]>("/scores/top", { params: { limit, scope } });
  return data;
}

