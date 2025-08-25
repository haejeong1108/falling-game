export type User = {
  email: string;
  nickname?: string;
};

export type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, nickname?: string) => Promise<void>;
  logout: () => void;
};