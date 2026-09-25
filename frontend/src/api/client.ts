// API Client for Knowledge Twin Backend

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export class ApiClient {
  private static baseUrl = BASE_URL;

  static async get<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      throw new Error(`API GET error: ${res.statusText}`);
    }
    return res.json();
  }

  static async post<T>(endpoint: string, data: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error(`API POST error: ${res.statusText}`);
    }
    return res.json();
  }

  static async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      throw new Error(`Upload error: ${res.statusText}`);
    }
    return res.json();
  }
}

export default ApiClient;
