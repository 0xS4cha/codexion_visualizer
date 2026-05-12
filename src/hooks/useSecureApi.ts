import { useState, useCallback } from 'react';
import { auth } from '@/config/firebase';


export function useSecureApi() {
  const [loading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSecure = useCallback(async (url: string, options: RequestInit = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not connected');
      }

      const token = await currentUser.getIdToken();

      const headers = new Headers(options.headers);
      headers.set('Authorization', `Bearer ${token}`);
      headers.set('Content-Type', 'application/json');

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchSecure, loading, error };
}
