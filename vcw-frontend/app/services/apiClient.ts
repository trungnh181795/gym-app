// Centralized API client with automatic authentication handling
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Try to get token from localStorage (prioritize clientToken for client routes)
    const clientToken = localStorage.getItem('clientToken');
    const adminToken = localStorage.getItem('adminToken');
    
    // Use clientToken if available, otherwise fall back to adminToken
    const token = clientToken || adminToken;
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Handle the API response format: { success: true, data: ... }
    if (data.success && data.data !== undefined) {
      return data.data;
    }
    
    // Fallback for direct data responses
    return data;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  // Special method for authentication endpoints (no auto-auth headers)
  async auth<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const responseData = await response.json();
    
    // For auth endpoints, return the full response structure
    return responseData;
  }
}

// Export a singleton instance
export const apiClient = new ApiClient();

// Export types for common API responses
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface AuthData {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export interface AuthResponse extends ApiResponse<AuthData> {}