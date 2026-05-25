export interface Followup {
  id: string;
  reason?: string;
  dueDate?: string;   // ISO yyyy-MM-dd
  completed: boolean;
}
