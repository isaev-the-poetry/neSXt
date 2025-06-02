import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import Cookies from 'js-cookie';

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
    
    console.log('[AuthCallback] Received query params:', { 
      token: token ? '***' + (token as string).slice(-10) : 'none', 
      user: user ? 'present' : 'none' 
    });
    
    // Проверяем, установил ли backend cookie
    const backendCookie = Cookies.get('auth-token');
    console.log('[AuthCallback] Backend cookie:', backendCookie ? '***' + backendCookie.slice(-10) : 'none');

    if (token && user) {
      try {
        processedRef.current = true;
        const userData = JSON.parse(user as string);
        console.log('[AuthCallback] Parsed user data:', userData.email);
        login(token as string, userData);
        router.push('/');
      } catch (error) {
        processedRef.current = true;
        console.error('Failed to parse user data:', error);
        router.push('/auth/error?message=Invalid user data');
      }
    } else if (!token || !user) {
      processedRef.current = true;
      console.error('[AuthCallback] Missing authentication data:', { token: !!token, user: !!user });
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