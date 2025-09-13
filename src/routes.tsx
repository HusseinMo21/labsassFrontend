import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import App from './App';
import Login from './pages/auth/Login';
import Services from './components/Services';
import Contact from './components/Contact';
import ERPLayout from './components/ERPLayout';
import LoadingSpinner from './components/LoadingSpinner';
import Dashboard from './pages/erp/Dashboard';
import Patients from './pages/erp/Patients';
import Doctors from './pages/erp/Doctors';
import Organizations from './pages/erp/Organizations';
import LabTests from './pages/erp/LabTests';
import Visits from './pages/erp/Visits';
import Invoices from './pages/erp/Invoices';
import Users from './pages/erp/Users';
import Inventory from './pages/erp/Inventory';
import Reports from './pages/erp/Reports';
import AccountantDashboard from './pages/erp/AccountantDashboard';
import PatientDashboard from './pages/erp/PatientDashboard';
import BarcodeDemo from './pages/BarcodeDemo';
import LabInsightsDashboard from './pages/erp/LabInsightsDashboard';
import PatientTestSearch from './pages/erp/PatientTestSearch';
import QualityControl from './pages/erp/QualityControl';
import TestValidation from './pages/erp/TestValidation';
import EnhancedReports from './pages/erp/EnhancedReports';
import SampleTracking from './pages/erp/SampleTracking';
import Notifications from './pages/erp/Notifications';
import CheckIn from './pages/erp/CheckIn';
import UnpaidInvoices from './pages/erp/UnpaidInvoices';
import LabRequests from './pages/erp/LabRequests';
import StaffDashboard from './pages/erp/StaffDashboard';
import DoctorDashboard from './pages/erp/DoctorDashboard';
import PatientReports from './pages/erp/PatientReports';
import PatientVisits from './pages/erp/PatientVisits';
import PatientInvoices from './pages/erp/PatientInvoices';
import Receipts from './pages/erp/Receipts';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Public Route Component (redirect to dashboard if authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const router = createBrowserRouter([
  // Public routes
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/services',
    element: <Services />,
  },
  {
    path: '/contact',
    element: <Contact />,
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  
  // Protected ERP routes
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <Dashboard />
        </ERPLayout>
      </ProtectedRoute>
    ),
  },
  // Admin Dashboard
  {
    path: '/admin/dashboard',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <Dashboard />
        </ERPLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/accountant/dashboard',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <AccountantDashboard />
        </ERPLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/patient/dashboard',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <PatientDashboard />
        </ERPLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/patients',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <Patients />
        </ERPLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/doctors',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <Doctors />
        </ERPLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/organizations',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <Organizations />
        </ERPLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/lab-requests',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <LabRequests />
        </ERPLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/tests',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <LabTests />
        </ERPLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/visits',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <Visits />
        </ERPLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/invoices',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <Invoices />
        </ERPLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/users',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <Users />
        </ERPLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/inventory',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <Inventory />
        </ERPLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/reports',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <Reports />
        </ERPLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/barcode-demo',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <BarcodeDemo />
        </ERPLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/receipts',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <Receipts />
        </ERPLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/lab-insights',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <LabInsightsDashboard />
        </ERPLayout>
      </ProtectedRoute>
    ),
  },
  // Quality Control
  {
    path: '/quality-control',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <QualityControl />
        </ERPLayout>
      </ProtectedRoute>
    ),
  },
  // Test Validation
  {
    path: '/test-validation',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <TestValidation />
        </ERPLayout>
      </ProtectedRoute>
    ),
  },
  // Enhanced Reports
  {
    path: '/enhanced-reports',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <EnhancedReports />
        </ERPLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/patient-test-search',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <PatientTestSearch />
        </ERPLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/sample-tracking',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <SampleTracking />
        </ERPLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/notifications',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <Notifications />
        </ERPLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/check-in',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <CheckIn />
        </ERPLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/unpaid-invoices',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <UnpaidInvoices />
        </ERPLayout>
      </ProtectedRoute>
    ),
  },
  // Staff Dashboard
  {
    path: '/staff/dashboard',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <StaffDashboard />
        </ERPLayout>
      </ProtectedRoute>
    ),
  },
  // Doctor Dashboard
  {
    path: '/doctor/dashboard',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <DoctorDashboard />
        </ERPLayout>
      </ProtectedRoute>
    ),
  },
  // Doctor Reports
  {
    path: '/doctor/reports',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <Reports />
        </ERPLayout>
      </ProtectedRoute>
    ),
  },
  // Patient Dashboard
  {
    path: '/patient/dashboard',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <PatientDashboard />
        </ERPLayout>
      </ProtectedRoute>
    ),
  },
  // Patient Reports
  {
    path: '/patient/reports',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <PatientReports />
        </ERPLayout>
      </ProtectedRoute>
    ),
  },
  // Patient Visits
  {
    path: '/patient/visits',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <PatientVisits />
        </ERPLayout>
      </ProtectedRoute>
    ),
  },
  // Patient Invoices
  {
    path: '/patient/invoices',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <PatientInvoices />
        </ERPLayout>
      </ProtectedRoute>
    ),
  },
]);

export default router;