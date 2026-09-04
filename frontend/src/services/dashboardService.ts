import api from "./api";

/* ===========================
   TYPES
=========================== */

export interface DashboardStats {
  total_medicines: number;
  active_medicines: number;
  today_reminders: number;
  expiring_soon: number;
  refill_soon: number;
}

export interface Medicine {
  id: number;
  medicine_name: string;
  dosage: string;
  reminder_time: string;
  frequency: string;
  instructions: string;
  is_active: boolean;
}

export interface Notification {
  description: string;
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

export interface WeeklyAnalytics {
  taken: number;
  missed: number;
}

export interface MonthlyAnalytics {
  taken: number;
  missed: number;
}

export interface Activity {
  id: number;
  medicine_name: string;
  dosage: string;
  reminder_time: string;
  status: string;
  sent_at: string;
}

/* ===========================
   DASHBOARD STATS
=========================== */

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get("/dashboard/stats");
  return response.data;
};

/* ===========================
   TODAY MEDICINES
=========================== */

export const getTodayMedicines = async (): Promise<Medicine[]> => {
  const response = await api.get("/dashboard/today-medicines");
  return response.data;
};

/* ===========================
   NOTIFICATIONS
=========================== */

export const getRecentNotifications = async (): Promise<Notification[]> => {
  const response = await api.get("/dashboard/notifications");
  return response.data;
};

/* ===========================
   WEEKLY ANALYTICS
=========================== */

export const getWeeklyAnalytics =
  async (): Promise<WeeklyAnalytics> => {

    const response = await api.get("/dashboard/weekly");

    return response.data;

};

/* ===========================
   MONTHLY ANALYTICS
=========================== */

export const getMonthlyAnalytics =
  async (): Promise<MonthlyAnalytics> => {

    const response = await api.get("/dashboard/monthly");

    return response.data;

};

/* ===========================
   RECENT ACTIVITY
=========================== */

export const getRecentActivity =
  async (): Promise<Activity[]> => {

    const response = await api.get("/dashboard/activity");

    return response.data;

};