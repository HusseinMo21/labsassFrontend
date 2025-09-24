import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const DebugInfo: React.FC = () => {
  const { user, loading } = useAuth();
  
  if (import.meta.env.MODE !== 'development') {
    return null;
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>User: {user ? user.name : 'None'}</div>
      <div>Role: {user ? user.role : 'None'}</div>
      <div>Time: {new Date().toLocaleTimeString()}</div>
    </div>
  );
};

export default DebugInfo;
