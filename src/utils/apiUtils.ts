// src/utils/apiUtils.ts
/**
 * API Utilities for eBay Helper
 * Handles proper URL construction and request patterns
 */

const API_BASE_URL: string = process.env.REACT_APP_API_URL || 'https://ebay-freeagent-backend.onrender.com/api';
/**
 * Get auth headers with bearer token
 */
export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

/**
 * Make authenticated API request
 * Use for endpoints that require user authentication
 */
export const makeAuthenticatedRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  // Ensure endpoint starts with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  const url = `${API_BASE_URL}${cleanEndpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: getAuthHeaders(),
    credentials: 'include',
  };

  const mergedOptions: RequestInit = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  console.log(`🔗 API Request: ${options.method || 'GET'} ${url}`);

  const response = await fetch(url, mergedOptions);
  
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      const errorText = await response.text();
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

/**
 * Make public API request (no authentication required)
 * Use for login, register, password reset, etc.
 */
export const makePublicRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  // Ensure endpoint starts with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  const url = `${API_BASE_URL}${cleanEndpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  const mergedOptions: RequestInit = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  console.log(`🔗 Public API Request: ${options.method || 'GET'} ${url}`);

  const response = await fetch(url, mergedOptions);
  
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      const errorText = await response.text();
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

/**
 * Helper for GET requests with authentication
 */
export const apiGet = (endpoint: string): Promise<any> => 
  makeAuthenticatedRequest(endpoint, { method: 'GET' });

/**
 * Helper for POST requests with authentication
 */
export const apiPost = (endpoint: string, data?: any): Promise<any> =>
  makeAuthenticatedRequest(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });

/**
 * Helper for PUT requests with authentication
 */
export const apiPut = (endpoint: string, data?: any): Promise<any> =>
  makeAuthenticatedRequest(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });

/**
 * Helper for DELETE requests with authentication
 */
export const apiDelete = (endpoint: string): Promise<any> =>
  makeAuthenticatedRequest(endpoint, { method: 'DELETE' });

const apiUtils = {
  makeAuthenticatedRequest,
  makePublicRequest,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
};

export default apiUtils;