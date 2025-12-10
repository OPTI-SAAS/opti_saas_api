import { ExtractEnumTypes } from '@lib/shared/helpers';

export const QuestionType = {
  text: 'text',
  yes_no: 'yes_no',
  section: 'section',
  multi_choice: 'multi_choice',
} as const;
export type TQuestionType = ExtractEnumTypes<typeof QuestionType>;
