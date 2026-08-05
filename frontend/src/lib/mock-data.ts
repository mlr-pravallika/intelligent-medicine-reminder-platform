export type MedicineStatus = "Active" | "Paused" | "Completed" | "Expired";

export type Medicine = {
  id: string;
  name: string;
  generic: string;
  category: string;
  dosage: string;
  form: string;
  frequency: string;
  times: string[];
  status: MedicineStatus;
  stock: number;
  dailyUse: number;
  doctor: string;
  clinic: string;
  startedOn: string;
  endsOn: string;
  adherence: number;
  notes: string;
};

export const medicines: Medicine[] = [
  {
    id: "MED-1042",
    name: "Metformin",
    generic: "Metformin Hydrochloride",
    category: "Diabetes",
    dosage: "500 mg",
    form: "Tablet",
    frequency: "Twice daily",
    times: ["08:00", "20:00"],
    status: "Active",
    stock: 24,
    dailyUse: 2,
    doctor: "Dr. Anita Raman",
    clinic: "Northside Endocrinology",
    startedOn: "2026-02-11",
    endsOn: "2026-09-11",
    adherence: 96,
    notes: "Take with meals to reduce stomach upset.",
  },
  {
    id: "MED-1055",
    name: "Atorvastatin",
    generic: "Atorvastatin Calcium",
    category: "Cardiovascular",
    dosage: "20 mg",
    form: "Tablet",
    frequency: "Once daily",
    times: ["21:30"],
    status: "Active",
    stock: 9,
    dailyUse: 1,
    doctor: "Dr. Marcus Lee",
    clinic: "Cardio Care Institute",
    startedOn: "2026-01-04",
    endsOn: "2026-12-04",
    adherence: 91,
    notes: "Evening dose recommended for best lipid control.",
  },
  {
    id: "MED-1071",
    name: "Levothyroxine",
    generic: "Levothyroxine Sodium",
    category: "Endocrine",
    dosage: "75 mcg",
    form: "Tablet",
    frequency: "Once daily",
    times: ["06:30"],
    status: "Active",
    stock: 41,
    dailyUse: 1,
    doctor: "Dr. Anita Raman",
    clinic: "Northside Endocrinology",
    startedOn: "2025-11-20",
    endsOn: "2026-11-20",
    adherence: 88,
    notes: "Take on an empty stomach, 30 minutes before breakfast.",
  },
  {
    id: "MED-1088",
    name: "Amoxicillin",
    generic: "Amoxicillin Trihydrate",
    category: "Antibiotic",
    dosage: "500 mg",
    form: "Capsule",
    frequency: "Three times daily",
    times: ["08:00", "14:00", "22:00"],
    status: "Completed",
    stock: 0,
    dailyUse: 3,
    doctor: "Dr. Priya Nair",
    clinic: "Riverside Family Clinic",
    startedOn: "2026-06-02",
    endsOn: "2026-06-12",
    adherence: 100,
    notes: "Full course completed on schedule.",
  },
  {
    id: "MED-1093",
    name: "Vitamin D3",
    generic: "Cholecalciferol",
    category: "Supplement",
    dosage: "2000 IU",
    form: "Softgel",
    frequency: "Once daily",
    times: ["09:00"],
    status: "Paused",
    stock: 55,
    dailyUse: 1,
    doctor: "Dr. Priya Nair",
    clinic: "Riverside Family Clinic",
    startedOn: "2026-03-15",
    endsOn: "2027-03-15",
    adherence: 74,
    notes: "Paused pending latest serum vitamin D results.",
  },
  {
    id: "MED-1101",
    name: "Salbutamol Inhaler",
    generic: "Albuterol Sulfate",
    category: "Respiratory",
    dosage: "100 mcg / puff",
    form: "Inhaler",
    frequency: "As needed",
    times: ["As needed"],
    status: "Expired",
    stock: 1,
    dailyUse: 1,
    doctor: "Dr. Marcus Lee",
    clinic: "Pulmonary Associates",
    startedOn: "2025-05-01",
    endsOn: "2026-05-01",
    adherence: 62,
    notes: "Prescription expired — renewal required before refill.",
  },
];

export type DoseStatus = "completed" | "upcoming" | "missed" | "skipped" | "snoozed";

export type Dose = {
  id: string;
  time: string;
  medicine: string;
  dosage: string;
  instruction: string;
  status: DoseStatus;
};

export const todaysDoses: Dose[] = [
  {
    id: "D-01",
    time: "06:30",
    medicine: "Levothyroxine",
    dosage: "75 mcg",
    instruction: "Empty stomach",
    status: "completed",
  },
  {
    id: "D-02",
    time: "08:00",
    medicine: "Metformin",
    dosage: "500 mg",
    instruction: "With breakfast",
    status: "completed",
  },
  {
    id: "D-03",
    time: "09:00",
    medicine: "Vitamin D3",
    dosage: "2000 IU",
    instruction: "After food",
    status: "skipped",
  },
  {
    id: "D-04",
    time: "14:00",
    medicine: "Amoxicillin",
    dosage: "500 mg",
    instruction: "With water",
    status: "missed",
  },
  {
    id: "D-05",
    time: "18:00",
    medicine: "Metformin",
    dosage: "500 mg",
    instruction: "With dinner",
    status: "snoozed",
  },
  {
    id: "D-06",
    time: "20:00",
    medicine: "Metformin",
    dosage: "500 mg",
    instruction: "With dinner",
    status: "upcoming",
  },
  {
    id: "D-07",
    time: "21:30",
    medicine: "Atorvastatin",
    dosage: "20 mg",
    instruction: "Before sleep",
    status: "upcoming",
  },
];

export const weeklyAdherence = [
  { label: "Mon", taken: 6, missed: 1, adherence: 86 },
  { label: "Tue", taken: 7, missed: 0, adherence: 100 },
  { label: "Wed", taken: 6, missed: 1, adherence: 86 },
  { label: "Thu", taken: 7, missed: 0, adherence: 100 },
  { label: "Fri", taken: 5, missed: 2, adherence: 71 },
  { label: "Sat", taken: 7, missed: 0, adherence: 100 },
  { label: "Sun", taken: 6, missed: 1, adherence: 86 },
];

export const monthlyAdherence = [
  { label: "Week 1", adherence: 88, reminders: 92 },
  { label: "Week 2", adherence: 92, reminders: 95 },
  { label: "Week 3", adherence: 84, reminders: 90 },
  { label: "Week 4", adherence: 94, reminders: 97 },
];

export const yearlyAdherence = [
  { label: "Jan", adherence: 82 },
  { label: "Feb", adherence: 85 },
  { label: "Mar", adherence: 88 },
  { label: "Apr", adherence: 84 },
  { label: "May", adherence: 90 },
  { label: "Jun", adherence: 93 },
  { label: "Jul", adherence: 91 },
];

export const doseBreakdown = [
  { name: "Taken on time", value: 268 },
  { name: "Taken late", value: 34 },
  { name: "Missed", value: 18 },
  { name: "Skipped", value: 11 },
];

export const insights = [
  {
    title: "Evening adherence dips on Fridays",
    body: "Your 21:30 Atorvastatin dose is missed 3x more on Fridays. Shifting the reminder to 20:45 could raise weekly adherence by ~6%.",
    tag: "Reminder optimization",
  },
  {
    title: "Atorvastatin refill needed in 9 days",
    body: "At your current rate of 1 tablet/day you will run out on 07 Aug 2026. Request a renewal from Dr. Marcus Lee this week.",
    tag: "Refill prediction",
  },
  {
    title: "Take Levothyroxine 30 min before food",
    body: "Logged intake times overlap with breakfast on 4 days this month, which reduces absorption.",
    tag: "Safety tip",
  },
];

export type Notification = {
  id: string;
  title: string;
  body: string;
  channel: "Push" | "SMS" | "Email";
  type: "Reminder" | "Missed dose" | "Refill" | "Emergency" | "Caregiver";
  time: string;
  read: boolean;
};

export const notifications: Notification[] = [
  {
    id: "N-1",
    title: "Time for Metformin 500 mg",
    body: "Evening dose scheduled at 20:00. Mark as taken once completed.",
    channel: "Push",
    type: "Reminder",
    time: "2 min ago",
    read: false,
  },
  {
    id: "N-2",
    title: "Missed dose: Amoxicillin",
    body: "The 14:00 dose was not confirmed. Your caregiver has been notified.",
    channel: "SMS",
    type: "Missed dose",
    time: "3 hours ago",
    read: false,
  },
  {
    id: "N-3",
    title: "Low stock: Atorvastatin",
    body: "9 tablets remaining — predicted to run out on 07 Aug 2026.",
    channel: "Email",
    type: "Refill",
    time: "Yesterday",
    read: false,
  },
  {
    id: "N-4",
    title: "Caregiver check-in",
    body: "Sara Whitfield reviewed your weekly adherence report.",
    channel: "Push",
    type: "Caregiver",
    time: "2 days ago",
    read: true,
  },
  {
    id: "N-5",
    title: "Emergency contact updated",
    body: "Primary emergency contact changed to Daniel Ortiz.",
    channel: "Email",
    type: "Emergency",
    time: "5 days ago",
    read: true,
  },
];

export const activity = [
  { time: "20:04", text: "Marked Metformin 500 mg as taken", tone: "success" as const },
  { time: "18:12", text: "Snoozed evening reminder by 30 minutes", tone: "warning" as const },
  { time: "14:00", text: "Missed Amoxicillin 500 mg", tone: "danger" as const },
  { time: "11:36", text: "Prescription scanned via OCR (94% confidence)", tone: "info" as const },
  { time: "08:02", text: "Marked Metformin 500 mg as taken", tone: "success" as const },
];

export const emergencyContacts = [
  { name: "Sara Whitfield", relation: "Primary caregiver", phone: "+1 (415) 555-0184" },
  { name: "Daniel Ortiz", relation: "Son", phone: "+1 (415) 555-0132" },
  { name: "Dr. Anita Raman", relation: "Endocrinologist", phone: "+1 (415) 555-0110" },
];

export const appointments = [
  { date: "04 Aug 2026", title: "Endocrinology follow-up", doctor: "Dr. Anita Raman" },
  { date: "12 Aug 2026", title: "Lipid panel review", doctor: "Dr. Marcus Lee" },
  { date: "27 Aug 2026", title: "Annual physical", doctor: "Dr. Priya Nair" },
];

export const refillForecast = medicines
  .filter((m) => m.status === "Active")
  .map((m) => ({
    id: m.id,
    name: m.name,
    dosage: m.dosage,
    stock: m.stock,
    daysLeft: Math.floor(m.stock / m.dailyUse),
    refillDate: m.stock / m.dailyUse < 12 ? "07 Aug 2026" : "22 Aug 2026",
    risk: m.stock / m.dailyUse < 12 ? ("high" as const) : ("low" as const),
  }));

export const consumptionTrend = [
  { label: "Mar", units: 118 },
  { label: "Apr", units: 126 },
  { label: "May", units: 121 },
  { label: "Jun", units: 134 },
  { label: "Jul", units: 129 },
];

export type Patient = {
  id: string;
  name: string;
  age: number;
  condition: string;
  adherence: number;
  lastDose: string;
  status: "On track" | "At risk" | "Critical";
  missedToday: number;
};

export const patients: Patient[] = [
  {
    id: "PT-2201",
    name: "Eleanor Whitfield",
    age: 72,
    condition: "Type 2 Diabetes, Hyperlipidemia",
    adherence: 94,
    lastDose: "20:04 today",
    status: "On track",
    missedToday: 0,
  },
  {
    id: "PT-2214",
    name: "Harold Grimes",
    age: 68,
    condition: "Hypertension",
    adherence: 71,
    lastDose: "08:15 today",
    status: "At risk",
    missedToday: 2,
  },
  {
    id: "PT-2231",
    name: "Marta Silva",
    age: 81,
    condition: "Post-stroke, Atrial fibrillation",
    adherence: 58,
    lastDose: "Yesterday 21:10",
    status: "Critical",
    missedToday: 3,
  },
  {
    id: "PT-2245",
    name: "Owen Baptiste",
    age: 45,
    condition: "Asthma",
    adherence: 89,
    lastDose: "09:30 today",
    status: "On track",
    missedToday: 0,
  },
];

export const criticalAlerts = [
  {
    id: "A-1",
    patient: "Marta Silva",
    text: "3 consecutive missed anticoagulant doses",
    severity: "Critical",
    time: "12 min ago",
  },
  {
    id: "A-2",
    patient: "Harold Grimes",
    text: "Blood pressure medicine missed twice today",
    severity: "High",
    time: "1 hour ago",
  },
  {
    id: "A-3",
    patient: "Eleanor Whitfield",
    text: "Atorvastatin stock below 10 tablets",
    severity: "Medium",
    time: "3 hours ago",
  },
];

export const platformStats = [
  { label: "Total users", value: "48,219", delta: "+6.4%" },
  { label: "Active patients", value: "39,842", delta: "+4.1%" },
  { label: "Caregivers", value: "7,118", delta: "+2.8%" },
  { label: "Reminders sent (30d)", value: "2.4M", delta: "+11.2%" },
];

export const platformGrowth = [
  { label: "Feb", patients: 26800, caregivers: 4200 },
  { label: "Mar", patients: 29500, caregivers: 4800 },
  { label: "Apr", patients: 32100, caregivers: 5400 },
  { label: "May", patients: 34900, caregivers: 6100 },
  { label: "Jun", patients: 37400, caregivers: 6700 },
  { label: "Jul", patients: 39842, caregivers: 7118 },
];

export const ocrStats = [
  { label: "Mon", scans: 820, success: 782 },
  { label: "Tue", scans: 910, success: 868 },
  { label: "Wed", scans: 764, success: 705 },
  { label: "Thu", scans: 1032, success: 991 },
  { label: "Fri", scans: 1184, success: 1123 },
  { label: "Sat", scans: 640, success: 612 },
  { label: "Sun", scans: 512, success: 489 },
];

export const auditLogs = [
  {
    id: "L-9012",
    actor: "admin@medicare.ai",
    action: "Updated notification template",
    target: "reminder_push_v3",
    ip: "10.24.8.11",
    time: "29 Jul 2026, 09:41",
  },
  {
    id: "L-9011",
    actor: "s.whitfield@care.org",
    action: "Viewed patient adherence report",
    target: "PT-2231",
    ip: "10.24.9.44",
    time: "29 Jul 2026, 08:55",
  },
  {
    id: "L-9010",
    actor: "system",
    action: "APScheduler dispatched reminder batch",
    target: "batch#48221",
    ip: "internal",
    time: "29 Jul 2026, 08:00",
  },
  {
    id: "L-9009",
    actor: "admin@medicare.ai",
    action: "Suspended caregiver account",
    target: "CG-4410",
    ip: "10.24.8.11",
    time: "28 Jul 2026, 17:22",
  },
];

export const adminUsers = [
  {
    id: "U-8801",
    name: "Eleanor Whitfield",
    email: "eleanor.w@example.com",
    role: "Patient",
    status: "Active",
    joined: "12 Feb 2026",
  },
  {
    id: "U-8815",
    name: "Sara Whitfield",
    email: "sara.w@care.org",
    role: "Caregiver",
    status: "Active",
    joined: "12 Feb 2026",
  },
  {
    id: "U-8822",
    name: "Dr. Anita Raman",
    email: "a.raman@northside.health",
    role: "Administrator",
    status: "Active",
    joined: "03 Jan 2026",
  },
  {
    id: "U-8840",
    name: "Harold Grimes",
    email: "h.grimes@example.com",
    role: "Patient",
    status: "Suspended",
    joined: "28 Mar 2026",
  },
  {
    id: "U-8851",
    name: "Owen Baptiste",
    email: "o.baptiste@example.com",
    role: "Patient",
    status: "Invited",
    joined: "19 Jul 2026",
  },
];

export const systemServices = [
  { name: "FastAPI Gateway", status: "Operational", uptime: "99.99%", latency: "112 ms" },
  { name: "PostgreSQL Cluster", status: "Operational", uptime: "99.97%", latency: "18 ms" },
  { name: "APScheduler Workers", status: "Operational", uptime: "99.95%", latency: "—" },
  { name: "OCR Engine", status: "Degraded", uptime: "98.71%", latency: "1.9 s" },
  { name: "AI Inference Service", status: "Operational", uptime: "99.92%", latency: "740 ms" },
  { name: "Firebase Push", status: "Operational", uptime: "99.98%", latency: "230 ms" },
];

export const aiUsage = [
  { label: "Mon", requests: 4120 },
  { label: "Tue", requests: 4680 },
  { label: "Wed", requests: 4310 },
  { label: "Thu", requests: 5240 },
  { label: "Fri", requests: 5890 },
  { label: "Sat", requests: 3410 },
  { label: "Sun", requests: 2980 },
];
