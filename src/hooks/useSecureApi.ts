import { useState, useCallback } from 'react';
import { auth } from '@/config/firebase';


export function useSecureApi() {
  const [loading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSecure = useCallback(async (url: string, options: RequestInit = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      await auth.authStateReady();
      
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('User not connected (Firebase Session missing)');
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
        let message = `Error HTTP: ${response.status}`;
        try {
          const body = await response.json();
          if (body?.error) message = body.error;
        } catch {
          message = `Error HTTP: ${response.status}`;
        }
        throw new Error(message);
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchSecure, loading, error };
}
