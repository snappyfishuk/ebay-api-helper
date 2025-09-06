// services/ValidationService.ts
import { DateRange, ValidationResult } from '../types';

export class ValidationService {
  /**
   * CRITICAL: Validate date range for eBay API requirements
   * - Dates cannot be in the future
   * - Start date cannot be after end date
   * - Maximum 90-day range for eBay API
   */
  public validateDateRange(startDate: string, endDate: string): ValidationResult {
    const today = new Date().toISOString().split("T")[0];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const todayDate = new Date(today);

    if (start > end) {
      return { isValid: false, error: "Start date cannot be after end date" };
    }

    if (start > todayDate || end > todayDate) {
      return { isValid: false, error: "Dates cannot be in the future" };
    }

    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 90) {
      return { isValid: false, error: "Date range cannot exceed 90 days" };
    }

    return { isValid: true };
  }

  /**
   * Create date presets for quick selection
   */
  public createDatePreset(days: number): DateRange {
    const today = new Date();
    const pastDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);

    return {
      startDate: pastDate.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
    };
  }
}