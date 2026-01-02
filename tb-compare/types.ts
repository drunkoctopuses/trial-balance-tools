export interface TBRow {
  accountNumber: string;
  description: string;
  amount: number;
}

export enum CompareMode {
  VERSION = 'VERSION',
  YEAR = 'YEAR'
}

export enum RowStatus {
  NEW = 'NEW',
  REMOVED = 'REMOVED',
  CHANGED = 'AMOUNT_CHANGED', // For Version Compare
  RENAMED = 'RENAMED',        // For Year Compare
  UNCHANGED = 'UNCHANGED'
}

export interface ComparisonResultRow {
  accountNumber: string;
  descriptionA?: string;
  descriptionB?: string;
  amountA?: number; // Optional because it can be blank/undefined for New items
  amountB?: number; // Optional because it can be blank/undefined for Removed items
  delta?: number;
  status: RowStatus;
}

export interface ComparisonSummary {
  changed: number;
  new: number;
  removed: number;
  renamed: number;
  unchanged: number;
  netDelta: number;
  totalRows: number;
  // Balance Check
  sumA: number;
  sumB: number;
  isBalancedA: boolean;
  isBalancedB: boolean;
}

export interface ProcessedData {
  rows: ComparisonResultRow[];
  summary: ComparisonSummary;
}

export interface AnalysisResult {
  text: string;
}