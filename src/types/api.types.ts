// types/api.types.ts
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}
