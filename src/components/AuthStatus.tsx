import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthStatus: React.FC = () => {
  const { user, loading } = useAuth();

  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      left: 10, 
      backgroundColor: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px', 
      fontSize: '0.9em',
      zIndex: 9999,
      minWidth: '250px'
    }}>
      <h4>🔐 Authentication Status</h4>
      <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
      <div><strong>User:</strong> {user ? user.name : 'Not logged in'}</div>
      <div><strong>Role:</strong> {user?.role || 'N/A'}</div>
      <div><strong>Email:</strong> {user?.email || 'N/A'}</div>
      <div><strong>Last Update:</strong> {new Date().toLocaleTimeString()}</div>
    </div>
  );
};

export default AuthStatus;
