import type { Pick } from "@/lib/domain/scoring";

export type UserStatus = "pending" | "active" | "disabled";
export type UserRole = "user" | "admin";

export type MatchPhase =
  | "group_stage"
  | "round_of_32"
  | "round_of_16"
  | "quarter_final"
  | "semi_final"
  | "third_place"
  | "final";

export interface Profile {
  id: string;
  full_name: string;
  alias: string;
  phone: string;
  status: UserStatus;
  role: UserRole;
  created_at: string;
}

export interface Match {
  id: number;
  phase: MatchPhase;
  /** Fecha de jornada (YYYY-MM-DD) en America/Mexico_City */
  match_date: string;
  kickoff_at: string;
  home_team: string;
  away_team: string;
  /** Códigos de bandera ISO 3166-1 alfa-2 (o regional: gb-eng); null = por definir */
  home_code: string | null;
  away_code: string | null;
  group_label: string | null;
  home_goals: number | null;
  away_goals: number | null;
}

export interface Prediction {
  user_id: string;
  match_id: number;
  pick: Pick;
  updated_at: string;
}
