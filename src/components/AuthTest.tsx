import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthTest: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading authentication...</div>;
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      backgroundColor: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px', 
      fontSize: '0.9em',
      zIndex: 9999,
      minWidth: '200px'
    }}>
      <h4>Auth Status</h4>
      <div>User: {user ? user.name : 'Not logged in'}</div>
      <div>Role: {user?.role || 'N/A'}</div>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>Timestamp: {new Date().toLocaleTimeString()}</div>
    </div>
  );
};

export default AuthTest;
