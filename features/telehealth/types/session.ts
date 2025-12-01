export interface Provider {
  id: string;
  first_name: string;
  last_name: string;
  specialty: string | null;
  credentials: string;
  photoUrl?: string;
}

export type SessionStatus = "upcoming" | "ready" | "in-progress" | "completed";

export interface Session {
  id: string;
  provider: Provider;
  date: string;
  time: string;
  duration: number;
  type: string;
  status: SessionStatus;
  timeToStart?: number;
  reason?: string;
}
