// src/utils/apiUtils.ts

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

interface ApiResponse<T = any> {
  status: string;
  data?: T;
  message?: string;
}

// Centralized API request handler with auth
export const makeAuthenticatedRequest = async <T = any>(
  endpoint: string, 
  options: RequestOptions = {}
): Promise<T> => {
  const token = localStorage.getItem("token");
  
  if (!token) {
    // Redirect to login if no token
    window.location.href = '/login';
    throw new Error("No authentication token found");
  }

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };

  const requestOptions: RequestInit = {
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: "include", // Important for cookies
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, requestOptions);
    
    // Handle 401 errors globally
    if (response.status === 401) {
      // Token is invalid/expired
      localStorage.removeItem("token");
      window.location.href = '/login';
      throw new Error("Authentication failed. Please log in again.");
    }
    
    if (!response.ok) {
      let errorMessage = `Request failed: ${response.statusText}`;
      try {
        const errorData: ApiResponse = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If response body isn't JSON, use default message
      }
      throw new Error(errorMessage);
    }
    
    const data: ApiResponse<T> = await response.json();
    return data.data || data as T;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

// Helper for non-authenticated requests (login, register, etc.)
export const makePublicRequest = async <T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> => {
  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const requestOptions: RequestInit = {
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: "include",
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, requestOptions);
    
    if (!response.ok) {
      let errorMessage = `Request failed: ${response.statusText}`;
      try {
        const errorData: ApiResponse = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If response body isn't JSON, use default message
      }
      throw new Error(errorMessage);
    }
    
    const data: ApiResponse<T> = await response.json();
    return data.data || data as T;
  } catch (error) {
    console.error(`Public API Error (${endpoint}):`, error);
    throw error;
  }
};

export default makeAuthenticatedRequest;