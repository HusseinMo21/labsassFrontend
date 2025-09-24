import React from 'react';

const SafeDebugInfo: React.FC = () => {
  if (import.meta.env.MODE !== 'development') {
    return null;
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <div><strong>🔧 Safe Debug Info</strong></div>
      <div>Time: {new Date().toLocaleTimeString()}</div>
      <div>Status: Stable (No Auth)</div>
      <div>Environment: {import.meta.env.MODE}</div>
    </div>
  );
};

export default SafeDebugInfo;
