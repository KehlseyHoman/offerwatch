export interface BehavioralStory {
  id:                   string;
  theme:                string;
  title?:               string;
  situation?:           string;
  task?:                string;
  action?:              string;
  result?:              string;
  applicableQuestions?: string;
  createdAt?:           string;
  updatedAt?:           string;
}

export const STORY_THEMES = [
  'Leadership',
  'Failure',
  'Teamwork',
  'Conflict',
  'Achievement',
  'Growth',
  'Communication',
  'Problem-Solving',
  'Innovation',
  'Other',
] as const;

export type StoryTheme = typeof STORY_THEMES[number];

/** Tip text shown per theme to help the user remember what to write. */
export const THEME_TIPS: Record<string, string> = {
  Leadership:       'Leading a team, initiative, influencing without authority.',
  Failure:          'A mistake or failure. Focus on what you learned and changed.',
  Teamwork:         'Collaborating across teams or disciplines to achieve a shared goal.',
  Conflict:         'Navigating disagreement with a colleague, manager, or stakeholder.',
  Achievement:      'A project or result you are proud of. Quantify the impact.',
  Growth:           'A skill you developed quickly or a mindset shift you made.',
  Communication:    'Conveying complex info clearly, persuasion, stakeholder alignment.',
  'Problem-Solving':'Diagnosing a tricky problem and engineering or designing a solution.',
  Innovation:       'Proposing and shipping something new that drove measurable value.',
  Other:            'Anything that doesn\'t fit neatly elsewhere.',
};
