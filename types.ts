
export enum AppStep {
  WISH = 'WISH',
  INFO_GATHERING = 'INFO_GATHERING',
  RESULT = 'RESULT',
}

export interface RequiredField {
  name: string;
  label: string;
  type: 'text' | 'datetime-local' | 'select';
  options?: string[];
  placeholder?: string;
}

export interface FortuneMethod {
  name: string;
  description: string;
  required_fields: RequiredField[];
}

export type UserInfo = Record<string, string>;
