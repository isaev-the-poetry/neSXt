import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';

export default function AuthCallback() {
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const { token, user } = router.query;

    if (token && user) {
      try {
        const userData = JSON.parse(user as string);
        login(token as string, userData);
        router.push('/');
      } catch (error) {
        console.error('Failed to parse user data:', error);
        router.push('/auth/error?message=Invalid user data');
      }
    } else if (router.isReady && (!token || !user)) {
      router.push('/auth/error?message=Missing authentication data');
    }
  }, [router.query, router.isReady, login, router]);

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