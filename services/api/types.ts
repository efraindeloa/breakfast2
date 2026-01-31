/**
 * Tipos compartidos para las APIs
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface FilterParams {
  [key: string]: any;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}
