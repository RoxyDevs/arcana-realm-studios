const defaultHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('vibedj_token') : null;
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
};

export async function apiFetch(path: string, options: RequestInit = {}) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      ...defaultHeaders(),
      ...(options.headers ?? {}),
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }

  return response.json();
}

export function saveToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('vibedj_token', token);
  }
}

export function clearToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('vibedj_token');
  }
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('vibedj_token');
}
