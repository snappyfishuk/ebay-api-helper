// utils/formatters.ts
/**
 * Format date to UK format (DD/MM/YYYY)
 * IMPORTANT: Used for display in the UI
 */
export const formatUKDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Get auth headers with bearer token
 * CRITICAL: Required for all API calls
 */
export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};