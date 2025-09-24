import { createBrowserRouter, Navigate } from 'react-router-dom';
import { config } from './config/environment';
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
import EnhancedReports from './pages/erp/EnhancedReports';
import ReviewReports from './pages/erp/ReviewReports';
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
import Expenses from './pages/erp/Expenses';
import PatientRegistration from './pages/erp/PatientRegistration';
import PathologyRecordForm from './pages/erp/PathologyRecordForm';
import PatientDocuments from './pages/erp/PatientDocuments';
import ShiftManagement from './pages/ShiftManagement';

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

// Determine basename based on environment
const basename = config.ENVIRONMENT === 'production' ? '/dryasser' : '';

const router = createBrowserRouter([
  // Public routes
  {
    path: '/*',
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
    path: '/patient-registration',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <PatientRegistration />
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
            path: '/reports/:visitId',
            element: (
              <ProtectedRoute>
                <ERPLayout>
                  <PathologyRecordForm />
                </ERPLayout>
              </ProtectedRoute>
            ),
          },
          {
            path: '/documents/:visitId',
            element: (
              <ProtectedRoute>
                <ERPLayout>
                  <PatientDocuments />
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
    path: '/expenses',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <Expenses />
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
  // Review Reports (Admin Only)
  {
    path: '/review-reports',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <ReviewReports />
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
  // Shift Management
  {
    path: '/shift-management',
    element: (
      <ProtectedRoute>
        <ERPLayout>
          <ShiftManagement />
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
  // Catch-all route for 404 errors
  {
    path: '*',
    element: (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        textAlign: 'center',
        padding: '20px'
      }}>
        <h1 style={{ fontSize: '4rem', margin: '0', color: '#666' }}>404</h1>
        <h2 style={{ margin: '10px 0', color: '#333' }}>Page Not Found</h2>
        <p style={{ margin: '10px 0', color: '#666' }}>
          The page you're looking for doesn't exist.
        </p>
        <button 
          onClick={() => window.location.href = basename + '/'}
          style={{
            padding: '10px 20px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            marginTop: '20px'
          }}
        >
          Go Home
        </button>
      </div>
    ),
  },
], {
  basename: basename
});

export default router;
