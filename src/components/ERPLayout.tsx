import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  List,
  Typography,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  useTheme,
  useMediaQuery,
  Paper,
  Avatar,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  Receipt,
  Person,
  Inventory,
  Assessment,
  BarChart,
  Notifications,
  PersonAdd,
  CreditCard,
  Logout,
  LocalHospital,
  Business,
  Assignment,
  QrCodeScanner,
  AttachMoney,
  Schedule,
  Today,
  Search,
  ChevronLeft,
  ChevronRight,
  Science,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ShiftOpeningDialog from './ShiftOpeningDialog';
import axios from 'axios';

const drawerWidth = 280;
const collapsedDrawerWidth = 80;

const textOnGlass = '#1a1a2e';
const textOnGlassMuted = 'rgba(26, 26, 46, 0.75)';

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ReactElement;
  roles: string[];
  platformAdminOnly?: boolean; // if true, only for platform admin (lab_id null)
  labAdminOnly?: boolean;     // if true, only for lab admin (admin with lab_id)
}

const navigationItems: NavigationItem[] = [
  // Platform Admin only - system control
  { path: '/platform/dashboard', label: 'لوحة المنصة', icon: <Dashboard />, roles: ['admin'], platformAdminOnly: true },
  { path: '/platform/labs', label: 'المعامل', icon: <Business />, roles: ['admin'], platformAdminOnly: true },
  { path: '/platform/plans', label: 'خطط الاشتراك', icon: <CreditCard />, roles: ['admin'], platformAdminOnly: true },
  { path: '/platform/subscriptions', label: 'الاشتراكات', icon: <AttachMoney />, roles: ['admin'], platformAdminOnly: true },

  // Lab Admin only - lab operations (admin with lab_id)
  { path: '/admin/dashboard', label: 'Admin Dashboard', icon: <Dashboard />, roles: ['admin'], labAdminOnly: true },
  { path: '/patients', label: 'Patients', icon: <People />, roles: ['admin'], labAdminOnly: true },
  { path: '/patient-registration', label: 'Patient Registration', icon: <PersonAdd />, roles: ['admin'], labAdminOnly: true },
  { path: '/doctors', label: 'Doctors', icon: <LocalHospital />, roles: ['admin'], labAdminOnly: true },
  { path: '/organizations', label: 'Organizations', icon: <Business />, roles: ['admin'], labAdminOnly: true },
  { path: '/lab-requests', label: 'Lab Requests', icon: <Assignment />, roles: ['admin'], labAdminOnly: true },
  { path: '/accounts', label: 'Accounts', icon: <Business />, roles: ['admin'], labAdminOnly: true },
  { path: '/receipts', label: 'Receipts', icon: <Receipt />, roles: ['admin'], labAdminOnly: true },
  { path: '/expenses', label: 'Expenses', icon: <AttachMoney />, roles: ['admin'], labAdminOnly: true },
  { path: '/users', label: 'Users', icon: <Person />, roles: ['admin'], labAdminOnly: true },
  { path: '/inventory', label: 'Inventory', icon: <Inventory />, roles: ['admin'], labAdminOnly: true },
  { path: '/reports', label: 'Reports', icon: <Assessment />, roles: ['admin'], labAdminOnly: true },
  { path: '/enhanced-reports', label: 'Completed Reports', icon: <Assessment />, roles: ['admin'], labAdminOnly: true },
  { path: '/disease-search', label: 'Disease Search', icon: <Search />, roles: ['admin'], labAdminOnly: true },
  { path: '/lab-insights', label: 'Lab Insights', icon: <BarChart />, roles: ['admin'], labAdminOnly: true },

  { path: '/staff/dashboard', label: 'Staff Dashboard', icon: <Dashboard />, roles: ['staff'] },
  { path: '/shift-management', label: 'Shift Management', icon: <Schedule />, roles: ['staff'] },
  { path: '/today-clients', label: 'Today Clients', icon: <Today />, roles: ['staff'] },
  { path: '/patients', label: 'Patients Search', icon: <People />, roles: ['staff'] },
  { path: '/patient-registration', label: 'Patient Registration', icon: <PersonAdd />, roles: ['staff'] },
  { path: '/doctors', label: 'Doctors', icon: <LocalHospital />, roles: ['staff'] },
  { path: '/organizations', label: 'Organizations', icon: <Business />, roles: ['staff'] },
  { path: '/lab-requests', label: 'Lab Requests', icon: <Assignment />, roles: ['staff'] },
  { path: '/unpaid-invoices', label: 'Unpaid Invoices', icon: <CreditCard />, roles: ['staff'] },
  { path: '/notifications', label: 'Notifications', icon: <Notifications />, roles: ['staff'] },
  { path: '/accounts', label: 'Accounts', icon: <Business />, roles: ['staff'] },
  { path: '/receipts', label: 'Receipts', icon: <Receipt />, roles: ['staff'] },
  { path: '/expenses', label: 'Expenses', icon: <AttachMoney />, roles: ['staff'] },
  { path: '/reports', label: 'Reports', icon: <Assessment />, roles: ['staff'] },
  { path: '/barcode-demo', label: 'Barcode Scanner Hub', icon: <QrCodeScanner />, roles: ['staff'] },
  { path: '/enhanced-reports', label: 'Completed Reports', icon: <Assessment />, roles: ['staff'] },

  { path: '/doctor/dashboard', label: 'Doctor Dashboard', icon: <Dashboard />, roles: ['doctor'] },
  { path: '/doctor/reports', label: 'Reports', icon: <Assessment />, roles: ['doctor'] },
  { path: '/enhanced-reports', label: 'Completed Reports', icon: <Assessment />, roles: ['doctor'] },

  { path: '/patient/dashboard', label: 'My Dashboard', icon: <Dashboard />, roles: ['patient'] },
  { path: '/patient/reports', label: 'My Reports', icon: <Assessment />, roles: ['patient'] },
];

const ERPLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, lab, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [hasCheckedShift, setHasCheckedShift] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    const checkActiveShift = async () => {
      if (user?.role === 'staff' && !hasCheckedShift) {
        try {
          const response = await axios.get('/api/shifts/current');
          if (response.data.success && !response.data.data) {
            setShowShiftDialog(true);
          }
        } catch (error) {
          console.error('Failed to check current shift:', error);
        } finally {
          setHasCheckedShift(true);
        }
      }
    };
    checkActiveShift();
  }, [user, hasCheckedShift]);

  const handleShiftOpened = () => {
    setShowShiftDialog(false);
    setHasCheckedShift(true);
  };

  const isPlatformAdmin = user?.role === 'admin' && user?.lab_id == null;
  const filteredNavItems = navigationItems.filter((item) => {
    if (!item.roles.includes(user?.role || '')) return false;
    if (item.platformAdminOnly) return isPlatformAdmin;
    if (item.labAdminOnly) return !isPlatformAdmin; // lab admin has lab_id
    return true;
  });

  const drawer = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: 'rgba(13, 148, 136, 0.25)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.18)',
        boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Header - glassy */}
      <Box
        sx={{
          p: sidebarOpen ? 3 : 2,
          background: 'rgba(255, 255, 255, 0.35)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          color: textOnGlass,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 1,
          borderBottom: '1px solid rgba(255, 255, 255, 0.25)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}
      >
        {sidebarOpen ? (
          <>
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Avatar
                sx={{
                  width: 70,
                  height: 70,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'rgba(13, 148, 136, 0.15)',
                  border: '2px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  color: '#0d9488',
                }}
              >
                <Science sx={{ fontSize: 35 }} />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '1.1rem', color: textOnGlass }}>
                SaaS Lab
              </Typography>
              <Typography variant="body2" sx={{ color: textOnGlassMuted, mb: 1, fontSize: '0.85rem' }}>
                {isPlatformAdmin ? 'منصة النظام' : (lab?.name || 'Laboratory')}
              </Typography>
              <Chip
                icon={<AdminPanelSettings sx={{ color: 'inherit !important', fontSize: '16px !important' }} />}
                label={user?.name || 'User'}
                size="small"
                sx={{
                  mt: 1,
                  bgcolor: 'rgba(255, 255, 255, 0.7)',
                  color: textOnGlass,
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  height: '24px',
                  border: '1px solid rgba(255, 255, 255, 0.8)',
                  '& .MuiChip-icon': { color: 'inherit' },
                }}
              />
            </Box>
          </>
        ) : (
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Avatar
              sx={{
                width: 50,
                height: 50,
                mx: 'auto',
                bgcolor: 'rgba(13, 148, 136, 0.15)',
                border: '2px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                color: '#0d9488',
              }}
            >
              <Science sx={{ fontSize: 25 }} />
            </Avatar>
          </Box>
        )}
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ flexGrow: 1, py: 2, px: sidebarOpen ? 2 : 1, position: 'relative', zIndex: 1, overflow: 'auto' }}>
        <List sx={{ p: 0 }}>
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  mb: 1.5,
                  borderRadius: 3,
                  px: sidebarOpen ? 2 : 1.5,
                  py: 1.5,
                  minHeight: 56,
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  background: isActive ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.08)',
                  color: isActive ? textOnGlass : textOnGlassMuted,
                  boxShadow: isActive ? '0 4px 16px rgba(0, 0, 0, 0.06)' : 'none',
                  border: isActive ? '1px solid rgba(255, 255, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  cursor: 'pointer',
                  '&:hover': {
                    background: isActive ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.2)',
                    color: textOnGlass,
                    transform: 'translateX(4px)',
                    boxShadow: isActive ? '0 6px 20px rgba(0, 0, 0, 0.1)' : '0 2px 12px rgba(0, 0, 0, 0.06)',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  '&::before': isActive ? {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 4,
                    height: '60%',
                    background: textOnGlass,
                    borderRadius: '0 4px 4px 0',
                  } : {},
                }}
              >
                <ListItemIcon
                  sx={{
                    color: 'inherit',
                    minWidth: sidebarOpen ? 45 : 'auto',
                    justifyContent: 'center',
                    mr: sidebarOpen ? 2 : 0,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {sidebarOpen && (
                  <ListItemText
                    primary={item.label}
                    sx={{
                      '& .MuiListItemText-primary': {
                        fontWeight: isActive ? 'bold' : 600,
                        fontSize: '0.95rem',
                        letterSpacing: '0.3px',
                      },
                    }}
                  />
                )}
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Logout Section */}
      <Box sx={{ p: sidebarOpen ? 2 : 1, borderTop: '1px solid rgba(255, 255, 255, 0.4)', position: 'relative', zIndex: 1 }}>
        <ListItem
          onClick={handleLogout}
          sx={{
            borderRadius: 3,
            px: sidebarOpen ? 2 : 1.5,
            py: 1.5,
            minHeight: 56,
            justifyContent: sidebarOpen ? 'flex-start' : 'center',
            color: textOnGlassMuted,
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            cursor: 'pointer',
            '&:hover': {
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#b91c1c',
              transform: 'translateX(4px)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <ListItemIcon
            sx={{
              color: 'inherit',
              minWidth: sidebarOpen ? 45 : 'auto',
              justifyContent: 'center',
              mr: sidebarOpen ? 2 : 0,
            }}
          >
            <Logout />
          </ListItemIcon>
          {sidebarOpen && (
            <ListItemText
              primary="تسجيل الخروج"
              sx={{
                '& .MuiListItemText-primary': {
                  fontWeight: 600,
                  fontSize: '0.95rem',
                },
              }}
            />
          )}
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 50%, #99f6e4 100%)',
        backgroundAttachment: 'fixed',
        '&::before': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(2px)',
          zIndex: 0,
        },
      }}
    >
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            border: 'none',
            boxShadow: '8px 0 32px rgba(0,0,0,0.3)',
            zIndex: 9998,
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: sidebarOpen ? drawerWidth : collapsedDrawerWidth,
            border: 'none',
            boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
            zIndex: 9998,
            top: 0,
            height: '100vh',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
          },
        }}
        open
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 0.5, sm: 1, md: 1 },
          width: {
            md: `calc(100% - ${sidebarOpen ? drawerWidth : collapsedDrawerWidth}px)`,
            xs: '100%',
          },
          marginLeft: {
            md: `${sidebarOpen ? drawerWidth : collapsedDrawerWidth}px`,
            xs: 0,
          },
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Sidebar Toggle Button */}
        <Box sx={{ mb: 0.5, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 1, px: 1, pt: 1 }}>
          <Tooltip title={sidebarOpen ? 'طي الشريط الجانبي' : 'توسيع الشريط الجانبي'}>
            <IconButton
              onClick={handleSidebarToggle}
              sx={{
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                color: '#1a1a2e',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.9)',
                  transform: 'scale(1.05)',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
                  borderColor: 'rgba(255, 255, 255, 0.8)',
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
            </IconButton>
          </Tooltip>

          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerToggle}
              sx={{
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                color: '#1a1a2e',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.9)',
                  transform: 'scale(1.05)',
                  borderColor: 'rgba(255, 255, 255, 0.8)',
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Box>

        {/* Content */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.82)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            minHeight: 'calc(100vh - 120px)',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
            {children}
          </Box>
        </Paper>
      </Box>

      <ShiftOpeningDialog
        open={showShiftDialog}
        onClose={() => setShowShiftDialog(false)}
        onShiftOpened={handleShiftOpened}
      />
    </Box>
  );
};

export default ERPLayout;
