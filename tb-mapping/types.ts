
export interface TBRawRow {
  [key: string]: any;
}

export interface TBCleanedRow {
  accountNumber: string;
  accountDescription: string;
  amount: number;
}

export interface ProcessingResult {
  data: TBCleanedRow[];
  isBalanced: boolean;
  totalSum: number;
  error?: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  PARSING = 'PARSING',
  MAPPING = 'MAPPING',
  VALIDATING = 'VALIDATING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}
