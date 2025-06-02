import { useState } from 'react';
import Head from 'next/head';
import { trpc } from '../utils/trpc';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [messageId, setMessageId] = useState('user123');
  const [userName, setUserName] = useState('John Doe');
  const [userEmail, setUserEmail] = useState('john@example.com');

  // TRPC Queries
  const { data: hello, isLoading: helloLoading } = trpc.getHello.useQuery();
  const { data: message, isLoading: messageLoading } = trpc.getMessageById.useQuery(messageId);
  
  // Auth Queries
  const { data: authStatus } = trpc.auth.getAuthStatus.useQuery();
  const { data: googleAuthUrl } = trpc.auth.getGoogleAuthUrl.useQuery();
  const { data: allUsers } = trpc.auth.getAllUsers.useQuery({});

  // TRPC Mutations
  const createUserMutation = trpc.createUser.useMutation();
  const signInMutation = trpc.auth.signIn.useMutation();
  const signOutMutation = trpc.auth.signOut.useMutation();

  const handleCreateUser = () => {
    createUserMutation.mutate({
      name: userName,
      email: userEmail
    });
  };

  const handleSignOut = async () => {
    try {
      await signOutMutation.mutateAsync();
      logout();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleGoogleSignIn = () => {
    if (googleAuthUrl) {
      window.location.href = googleAuthUrl;
    }
  };

  return (
    <>
      <Head>
        <title>NeSXt - NestJS + NextJS + TRPC с Авторизацией</title>
        <meta name="description" content="Full-stack приложение с TRPC декораторами и Google OAuth" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ color: '#333', marginBottom: '2rem' }}>
            🚀 NeSXt с Авторизацией
          </h1>

          {/* Auth Status */}
          <div style={{ 
            background: isAuthenticated ? '#d4edda' : '#f8d7da', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '2rem',
            border: `1px solid ${isAuthenticated ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            <h3>🔐 Статус авторизации</h3>
            {isAuthenticated ? (
              <div>
                <p>✅ Вы авторизованы как: <strong>{user?.name}</strong> ({user?.email})</p>
                {user?.avatar && (
                  <img 
                    src={user.avatar} 
                    alt="Avatar" 
                    style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '10px' }}
                  />
                )}
                <button 
                  onClick={handleSignOut}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginLeft: '10px'
                  }}
                >
                  Выйти
                </button>
              </div>
            ) : (
              <div>
                <p>❌ Вы не авторизованы</p>
                <button 
                  onClick={handleGoogleSignIn}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#4285f4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  🔍 Войти через Google
                </button>
                {googleAuthUrl && (
                  <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                    {googleAuthUrl.instructions}
                  </p>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            
            {/* Основные TRPC методы */}
            <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px' }}>
              <h2>📡 Основные TRPC методы</h2>
              
              <div style={{ marginBottom: '1rem' }}>
                <h3>@Query() getHello</h3>
                <p>{helloLoading ? 'Загрузка...' : hello}</p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <h3>@Query() getMessageById</h3>
                <input
                  type="text"
                  value={messageId}
                  onChange={(e) => setMessageId(e.target.value)}
                  placeholder="Введите ID"
                  style={{ padding: '8px', marginRight: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                <p>{messageLoading ? 'Загрузка...' : message?.message}</p>
              </div>

              <div>
                <h3>@Mutation() createUser</h3>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Имя"
                  style={{ padding: '8px', marginRight: '10px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="Email"
                  style={{ padding: '8px', marginRight: '10px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                <button 
                  onClick={handleCreateUser}
                  disabled={createUserMutation.isLoading}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {createUserMutation.isLoading ? 'Создание...' : 'Создать'}
                </button>
                
                {createUserMutation.data && (
                  <div style={{ marginTop: '10px', padding: '10px', background: '#d4edda', borderRadius: '4px' }}>
                    <p>✅ Пользователь создан:</p>
                    <pre>{JSON.stringify(createUserMutation.data, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>

            {/* Auth TRPC методы */}
            <div style={{ background: '#fff3cd', padding: '1.5rem', borderRadius: '8px' }}>
              <h2>🔐 Auth TRPC методы</h2>
              
              <div style={{ marginBottom: '1rem' }}>
                <h3>auth.getAuthStatus</h3>
                <p>{authStatus?.message}</p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <h3>auth.getAllUsers</h3>
                <p>Зарегистрированные пользователи: {allUsers?.users?.length || 0}</p>
                {allUsers?.users && allUsers.users.length > 0 && (
                  <div style={{ maxHeight: '200px', overflow: 'auto', background: 'white', padding: '10px', borderRadius: '4px' }}>
                    {allUsers.users.map((user: any) => (
                      <div key={user.id} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                        <strong>{user.name}</strong> ({user.email})
                        {user.avatar && (
                          <img 
                            src={user.avatar} 
                            alt="Avatar" 
                            style={{ width: '30px', height: '30px', borderRadius: '50%', marginLeft: '10px' }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3>auth.signIn / auth.signOut</h3>
                <p>Используйте кнопки выше для авторизации через Google OAuth</p>
              </div>
            </div>
          </div>

          {/* Информация о технологиях */}
          <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#e9ecef', borderRadius: '8px' }}>
            <h2>🛠 Технологии</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <h4>Backend</h4>
                <ul>
                  <li>✅ NestJS с TRPC декораторами</li>
                  <li>✅ Google OAuth через Passport</li>
                  <li>✅ JWT токены</li>
                  <li>✅ Zod валидация</li>
                </ul>
              </div>
              <div>
                <h4>Frontend</h4>
                <ul>
                  <li>✅ NextJS с TRPC клиентом</li>
                  <li>✅ React Context для auth</li>
                  <li>✅ Cookie управление</li>
                  <li>✅ TypeScript повсюду</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
} 