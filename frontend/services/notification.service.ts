import { api } from "@/lib/api";
import type { NotificationListResponse, NotificationResponse } from "@/types/notification.types";

export const notificationService = {
  getNotifications: (page: number = 1, size: number = 20) =>
    api.get<NotificationListResponse>(`/notifications?page=${page}&size=${size}`),

  markAsRead: (notificationId: number) =>
    api.put<NotificationResponse>(`/notifications/${notificationId}/read`),
};
