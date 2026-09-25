// API Client for Knowledge Twin Backend

const DEFAULT_BASE_URL = '/api';

export class ApiClient {
  public static baseUrl: string = import.meta.env.VITE_API_URL || DEFAULT_BASE_URL;

  private static buildUrl(endpoint: string): string {
    const base = this.baseUrl.replace(/\/+$/, '');
    const cleanEndpoint = endpoint.replace(/^\/+/, '');
    return `${base}/${cleanEndpoint}`;
  }

  static async get<T>(endpoint: string): Promise<T> {
    const url = this.buildUrl(endpoint);
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      throw new Error(`API GET error (${res.status}): ${res.statusText}`);
    }
    return res.json();
  }

  static async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const url = this.buildUrl(endpoint);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) {
      throw new Error(`API POST error (${res.status}): ${res.statusText}`);
    }
    return res.json();
  }

  static async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    const url = this.buildUrl(endpoint);
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) {
      throw new Error(`API PATCH error (${res.status}): ${res.statusText}`);
    }
    return res.json();
  }

  static async delete<T>(endpoint: string): Promise<T> {
    const url = this.buildUrl(endpoint);
    const res = await fetch(url, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error(`API DELETE error (${res.status}): ${res.statusText}`);
    }
    if (res.status === 204) {
      return {} as T;
    }
    return res.json();
  }

  static async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = this.buildUrl(endpoint);
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      throw new Error(`Upload error (${res.status}): ${res.statusText}`);
    }
    return res.json();
  }
}

export default ApiClient;
