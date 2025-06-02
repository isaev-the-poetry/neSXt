import { useState } from 'react';
import { trpc } from '../utils/trpc';

export default function Home() {
  const [userId, setUserId] = useState('123');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // Используем новые методы
  const { data: helloData, isLoading: helloLoading, error: helloError } = trpc.getHello.useQuery();
  
  const { data: messageData, isLoading: messageLoading, error: messageError } = trpc.getMessageById.useQuery(userId, {
    enabled: userId.length > 0,
  });

  const createUserMutation = trpc.createUser.useMutation();

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName && userEmail) {
      createUserMutation.mutate(
        { name: userName, email: userEmail },
        {
          onSuccess: (data) => {
            console.log('User created:', data);
            setUserName('');
            setUserEmail('');
          },
          onError: (error) => {
            console.error('Error creating user:', error);
          }
        }
      );
    }
  };

  return (
    <div style={{ 
      padding: '2rem',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50' }}>
        NextJS + NestJS + TRPC с Декораторами
      </h1>
      
      {/* Секция Hello */}
      <div style={{
        margin: '2rem 0',
        padding: '1.5rem',
        border: '2px solid #3498db',
        borderRadius: '8px',
        backgroundColor: '#f8f9fa'
      }}>
        <h2>🔥 @Query() getHello</h2>
        {helloLoading && <p>Loading hello message...</p>}
        {helloError && <p style={{ color: 'red' }}>Error: {helloError.message}</p>}
        {helloData && (
          <p style={{ fontSize: '1.2rem', color: '#2c3e50' }}>
            <strong>{helloData}</strong>
          </p>
        )}
      </div>

      {/* Секция Message By ID */}
      <div style={{
        margin: '2rem 0',
        padding: '1.5rem',
        border: '2px solid #e67e22',
        borderRadius: '8px',
        backgroundColor: '#f8f9fa'
      }}>
        <h2>🎯 @Query() @Input() @Output() getMessageById</h2>
        <div style={{ marginBottom: '1rem' }}>
          <label>
            User ID: 
            <input 
              type="text" 
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              style={{
                marginLeft: '0.5rem',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </label>
        </div>
        {messageLoading && <p>Loading message...</p>}
        {messageError && <p style={{ color: 'red' }}>Error: {messageError.message}</p>}
        {messageData && (
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#e8f5e8', 
            borderRadius: '4px',
            border: '1px solid #27ae60'
          }}>
            <p><strong>ID:</strong> {messageData.id}</p>
            <p><strong>Message:</strong> {messageData.message}</p>
          </div>
        )}
      </div>

      {/* Секция Create User */}
      <div style={{
        margin: '2rem 0',
        padding: '1.5rem',
        border: '2px solid #9b59b6',
        borderRadius: '8px',
        backgroundColor: '#f8f9fa'
      }}>
        <h2>✨ @Mutation() @Input() @Output() createUser</h2>
        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label>
              Name: 
              <input 
                type="text" 
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                minLength={2}
                style={{
                  marginLeft: '0.5rem',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  width: '200px'
                }}
              />
            </label>
          </div>
          <div>
            <label>
              Email: 
              <input 
                type="email" 
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                required
                style={{
                  marginLeft: '0.5rem',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  width: '200px'
                }}
              />
            </label>
          </div>
          <button 
            type="submit"
            disabled={createUserMutation.isLoading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#9b59b6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: createUserMutation.isLoading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              width: 'fit-content'
            }}
          >
            {createUserMutation.isLoading ? 'Creating...' : 'Create User'}
          </button>
        </form>
        
        {createUserMutation.error && (
          <div style={{ 
            marginTop: '1rem',
            padding: '1rem', 
            backgroundColor: '#fdf2f2', 
            border: '1px solid #e53e3e',
            borderRadius: '4px',
            color: '#e53e3e'
          }}>
            <strong>Error:</strong> {createUserMutation.error.message}
          </div>
        )}
        
        {createUserMutation.data && (
          <div style={{ 
            marginTop: '1rem',
            padding: '1rem', 
            backgroundColor: '#f0fff4', 
            border: '1px solid #38a169',
            borderRadius: '4px',
            color: '#2d3748'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#38a169' }}>User Created Successfully! 🎉</h3>
            <p><strong>ID:</strong> {createUserMutation.data.id}</p>
            <p><strong>Name:</strong> {createUserMutation.data.name}</p>
            <p><strong>Email:</strong> {createUserMutation.data.email}</p>
            <p><strong>Created At:</strong> {new Date(createUserMutation.data.createdAt).toLocaleString()}</p>
          </div>
        )}
      </div>

      <div style={{
        margin: '2rem 0',
        padding: '1rem',
        backgroundColor: '#ecf0f1',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <p>
          🚀 <strong>Все методы используют декораторы NestJS-стиля:</strong><br/>
          <code>@Query()</code>, <code>@Mutation()</code>, <code>@Input()</code>, <code>@Output()</code>
        </p>
      </div>
    </div>
  );
} 