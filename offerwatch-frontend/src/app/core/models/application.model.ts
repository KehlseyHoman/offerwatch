export type ApplicationStatus =
  | 'saved'
  | 'applied'
  | 'phone_screen'
  | 'interview'
  | 'offer'
  | 'rejected';

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'saved', 'applied', 'phone_screen', 'interview', 'offer', 'rejected'
];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved:        'Saved',
  applied:      'Applied',
  phone_screen: 'Phone Screen',
  interview:    'Interview',
  offer:        'Offer',
  rejected:     'Rejected'
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  saved:        'default',
  applied:      'primary',
  phone_screen: 'accent',
  interview:    'accent',
  offer:        'primary',   // will be overridden with green in CSS
  rejected:     'warn'
};

export interface Application {
  id?: string;
  company: string;
  roleTitle?: string;
  status: ApplicationStatus;
  location?: string;
  jobUrl?: string;
  salaryMin?: number;
  salaryMax?: number;
  appliedDate?: string;          // ISO date string yyyy-MM-dd
  source?: string;               // e.g. "LinkedIn", "Referral", "Company site"
  applicationQuestions?: string; // paste unusual questions from the application form
  resumeVersion?: string;        // e.g. "engineering-v3", "generic-2026"
  coverLetterNotes?: string;     // e.g. "Custom - led with distributed systems" or "None"
  createdAt?: string;
  updatedAt?: string;
}
