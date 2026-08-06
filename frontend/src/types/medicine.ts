export interface Medicine {
  id: number;
  medicine_name: string;
  dosage: string;
  frequency: string;
  reminder_time: string;
  start_date: string;
  end_date: string;
  instructions?: string;
  is_active: boolean;
}