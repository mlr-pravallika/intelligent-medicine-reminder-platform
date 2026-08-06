import api from "./api";

export async function getCurrentReminders() {
    const response = await api.get("/reminders/current");
    return response.data;
}

export async function getReminderHistory() {
    const response = await api.get("/reminders/history");
    return response.data;
}

export async function markTaken(id:number){
    const response=await api.post(`/reminders/${id}/taken`);
    return response.data;
}

export async function markMissed(id:number){
    const response=await api.post(`/reminders/${id}/missed`);
    return response.data;
}

export async function snoozeReminder(id:number){
    const response=await api.post(`/reminders/${id}/snooze`);
    return response.data;
}

export async function clearReminderHistory() {
  const response = await api.delete("/reminders/history");
  return response.data;
}