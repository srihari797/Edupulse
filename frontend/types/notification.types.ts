import type { APIResponse } from "./common.types";

export interface NotificationDTO {
  id: number;
  user_id: number;
  title: string;
  content: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  is_active: boolean;
}

export interface NotificationListDTO {
  items: NotificationDTO[];
  page: number;
  size: number;
  total: number;
  total_pages: number;
}

export type NotificationListResponse = APIResponse<NotificationListDTO>;
export type NotificationResponse = APIResponse<NotificationDTO>;
