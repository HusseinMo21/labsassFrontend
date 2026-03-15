import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

// Helper function to get dashboard route based on user role and lab_id
const getDashboardRoute = (user: { role?: string; lab_id?: number | null } | null): string => {
  if (!user) return '/dashboard';
  // Platform admin (lab_id null) controls the system, not lab operations
  if (user.role === 'admin' && user.lab_id == null) {
    return '/platform/dashboard';
  }
  switch (user.role) {
    case 'admin':
      return '/admin/dashboard';
    case 'staff':
      return '/staff/dashboard';
    case 'doctor':
      return '/doctor/dashboard';
    case 'patient':
      return '/patient/dashboard';
    case 'accountant':
      return '/accountant/dashboard';
    default:
      return '/dashboard';
  }
};

const DashboardRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getDashboardRoute(user)} replace />;
};

export default DashboardRedirect;

