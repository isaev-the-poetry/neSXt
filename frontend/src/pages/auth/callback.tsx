import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';

export default function AuthCallback() {
  const router = useRouter();
  const { login } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    // Предотвращаем повторную обработку
    if (processedRef.current || !router.isReady) {
      return;
    }

    const { token, user } = router.query;

    if (token && user) {
      try {
        processedRef.current = true;
        const userData = JSON.parse(user as string);
        login(token as string, userData);
        router.push('/');
      } catch (error) {
        processedRef.current = true;
        console.error('Failed to parse user data:', error);
        router.push('/auth/error?message=Invalid user data');
      }
    } else if (!token || !user) {
      processedRef.current = true;
      router.push('/auth/error?message=Missing authentication data');
    }
  }, [router.query, router.isReady]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <div>🔄</div>
      <h2>Authenticating...</h2>
      <p>Please wait while we log you in.</p>
    </div>
  );
} 