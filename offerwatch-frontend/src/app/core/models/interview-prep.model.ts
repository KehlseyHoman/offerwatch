export interface InterviewPrep {
  id:          string;
  category:    string;
  question:    string;
  notes?:      string;
  createdAt?:  string;
  updatedAt?:  string;
}

export const PREP_CATEGORIES = [
  'Behavioral',
  'Technical',
  'Situational',
  'Culture & Fit',
  'Logistics',
] as const;

export type PrepCategory = typeof PREP_CATEGORIES[number];

/** Curated suggested questions organized by category. */
export const SUGGESTED_QUESTIONS: { category: string; questions: string[] }[] = [
  {
    category: 'Behavioral',
    questions: [
      'Tell me about a time you failed. What did you learn from it?',
      'Describe a situation where you had to work with a difficult team member.',
      'Give me an example of when you led a project under a tight deadline.',
      'Tell me about a time you had to learn something quickly.',
      'Describe a conflict you had at work and how you resolved it.',
      'Tell me about your most significant professional achievement.',
      'Describe a time you made a mistake and how you recovered from it.',
      'Tell me about a time you had to adapt to a significant change.',
      'Describe a situation where you went above and beyond your role.',
      'Tell me about a time you disagreed with a decision and what you did.',
    ],
  },
  {
    category: 'Technical',
    questions: [
      'Walk me through your most complex technical project.',
      'How do you approach debugging a production issue under pressure?',
      'How do you ensure code quality in your work?',
      'Describe your approach to system design and architecture decisions.',
      'How do you handle technical debt in a codebase?',
      'Tell me about a time you had to make a significant architectural decision.',
      'How do you stay current with new technologies and industry trends?',
      'Describe your experience with code reviews: giving and receiving feedback.',
      'How do you approach testing your code?',
    ],
  },
  {
    category: 'Situational',
    questions: [
      'If you had to push back on a product requirement, how would you handle it?',
      'How would you handle a situation where you disagreed with your manager?',
      'What would you do if you discovered a critical bug right before a release?',
      'How would you prioritize when you have multiple urgent tasks?',
      "If a team member wasn't pulling their weight on a project, what would you do?",
      'How would you handle receiving harsh negative feedback from a peer?',
      'What would you do if you realized mid-project that requirements had changed?',
    ],
  },
  {
    category: 'Culture & Fit',
    questions: [
      'Why do you want to work here specifically?',
      'What type of work environment helps you do your best work?',
      'Where do you see yourself in 5 years?',
      'What motivates you most in your work?',
      'How do you prefer to receive feedback?',
      'Describe your ideal manager and team dynamic.',
      'What does work-life balance mean to you?',
      'How do you handle periods of ambiguity or unclear direction?',
    ],
  },
  {
    category: 'Logistics',
    questions: [
      'Why are you looking for a new role?',
      'What are your salary expectations?',
      'When would you be able to start?',
      'Are you interviewing with any other companies?',
      "What questions do you have for us? (Always have 3–5 ready!)",
    ],
  },
];
