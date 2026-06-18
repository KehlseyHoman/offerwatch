export type ApplicationStatus =
  | 'saved'
  | 'applied'
  | 'phone_screen'
  | 'technical_interview'
  | 'final_round'
  | 'offer'
  | 'rejected';

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'saved', 'applied', 'phone_screen', 'technical_interview', 'final_round', 'offer', 'rejected'
];

/** Forward pipeline order — rejected is terminal and excluded. */
export const STAGE_ORDER: ApplicationStatus[] = [
  'saved', 'applied', 'phone_screen', 'technical_interview', 'final_round', 'offer'
];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved:               'Saved',
  applied:             'Applied',
  phone_screen:        'Phone Screen',
  technical_interview: 'Technical Interview',
  final_round:         'Final Round',
  offer:               'Offer',
  rejected:            'Rejected'
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  saved:               'default',
  applied:             'primary',
  phone_screen:        'accent',
  technical_interview: 'accent',
  final_round:         'accent',
  offer:               'primary',
  rejected:            'warn'
};

export interface Application {
  id?: string;
  company: string;
  roleTitle?: string;
  status: ApplicationStatus;
  /** Furthest pipeline stage reached — preserved when status moves to rejected. */
  stageReached?: ApplicationStatus;
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
