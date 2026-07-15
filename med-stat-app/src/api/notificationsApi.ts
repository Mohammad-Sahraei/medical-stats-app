import api from "./axios";

export interface Notification {
  id: number;
  date: string; // "YYYY-MM-DD"
  message: string;
  professor_id: number;
  created_at: string;
  /** Only present for students. */
  unread?: boolean;
}

export async function getNotifications(): Promise<Notification[]> {
  const response = await api.get<{ notifications: Notification[] }>("/notifications");
  return response.data.notifications;
}

export async function saveNotification(date: string, message: string): Promise<Notification> {
  const response = await api.post<{ notification: Notification }>("/notifications", {
    date,
    message,
  });
  return response.data.notification;
}

export async function deleteNotification(id: number): Promise<void> {
  await api.delete(`/notifications/${id}`);
}

export async function getUnreadNotificationsCount(): Promise<number> {
  const response = await api.get<{ count: number }>("/notifications/unread-count");
  return response.data.count;
}

export async function markNotificationsRead(): Promise<void> {
  await api.post("/notifications/mark-read");
}
