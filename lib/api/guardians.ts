import { guardianApiFetch } from "./client";
import type {
  GuardianChild,
  GuardianNotification,
  GuardianProfile,
  TrendWindow,
  WardAttendance,
  WardCases,
  WardFinance,
  WardResults,
  WardTimetable,
  WardTrend,
} from "./types";

export function getGuardianProfile() {
  return guardianApiFetch<GuardianProfile>("/parents/me/profile");
}

export function listGuardianChildren() {
  return guardianApiFetch<{ children: GuardianChild[] }>("/parents/me/children");
}

export function getWardResults(childId: string) {
  return guardianApiFetch<WardResults>(`/parents/me/children/${childId}/results`);
}

export function getWardAttendance(childId: string) {
  return guardianApiFetch<WardAttendance>(`/parents/me/children/${childId}/attendance`);
}

export function getWardTimetable(childId: string) {
  return guardianApiFetch<WardTimetable>(`/parents/me/children/${childId}/timetable`);
}

export function getWardCases(childId: string) {
  return guardianApiFetch<WardCases>(`/parents/me/children/${childId}/cases`);
}

export function getWardFinance(childId: string) {
  return guardianApiFetch<WardFinance>(`/parents/me/children/${childId}/finance`);
}

export function getWardTrend(childId: string, metric: "results" | "attendance", window: TrendWindow) {
  const params = new URLSearchParams({ metric, window });
  return guardianApiFetch<WardTrend>(`/parents/me/children/${childId}/performance-trend?${params.toString()}`);
}

export function listGuardianNotifications() {
  return guardianApiFetch<GuardianNotification[]>("/notifications/me");
}

export function markGuardianNotificationRead(id: string) {
  return guardianApiFetch<unknown>(`/notifications/${id}/read`, { method: "PUT" });
}

export function markAllGuardianNotificationsRead() {
  return guardianApiFetch<unknown>("/notifications/read-all", { method: "PUT" });
}
