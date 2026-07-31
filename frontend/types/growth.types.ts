/**
 * growth.types.ts — Growth module type definitions.
 * 1-to-1 mirror of backend modules/growth/schemas.py
 */
import { APIResponse } from "./common.types";

/** AchievementDTO */
export interface AchievementDTO {
  id: number;
  student_id: number;
  title: string;
  description: string | null;
  category: string;
  date_earned: string; // ISO date string
  badge_name: string | null;
  created_at: string;
  is_active: boolean;
}

/** ActivityDTO */
export interface ActivityDTO {
  id: number;
  student_id: number;
  name: string;
  description: string | null;
  activity_type: string;
  hours_spent: number;
  created_at: string;
  is_active: boolean;
}

/** GET /api/v1/students/growth-passport */
export interface GrowthPassportDTO {
  id: number;
  student_id: number;
  holistic_score: number;
  growth_level: string;
  achievements: AchievementDTO[];
  activities: ActivityDTO[];
}

export type GrowthPassportResponse = APIResponse<GrowthPassportDTO>;

/** GET /api/v1/students/recognition */
export interface RecognitionDTO {
  badges: Record<string, unknown>[];
  milestones: Record<string, unknown>[];
  recent_achievements: AchievementDTO[];
}

export type RecognitionResponse = APIResponse<RecognitionDTO>;
