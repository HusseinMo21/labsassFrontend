import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  CalendarToday,
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
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.jpg';
import ShiftOpeningDialog from './ShiftOpeningDialog';
import axios from 'axios';
import { useEffect } from 'react';

const drawerWidth = 280;

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ReactElement;
  roles: string[];
}

const navigationItems: NavigationItem[] = [
  // Admin - Only specified tabs
  { path: '/admin/dashboard', label: 'Admin Dashboard', icon: <Dashboard />, roles: ['admin'] },
  { path: '/patients', label: 'Patients', icon: <People />, roles: ['admin'] },
  { path: '/patient-registration', label: 'Patient Registration', icon: <PersonAdd />, roles: ['admin'] },
  { path: '/doctors', label: 'Doctors', icon: <LocalHospital />, roles: ['admin'] },
  { path: '/organizations', label: 'Organizations', icon: <Business />, roles: ['admin'] },
  { path: '/lab-requests', label: 'Lab Requests', icon: <Assignment />, roles: ['admin'] },
  // { path: '/visits', label: 'Visits', icon: <CalendarToday />, roles: ['admin'] }, // Hidden temporarily
  // { path: '/invoices', label: 'Invoices', icon: <Receipt />, roles: ['admin'] }, // Hidden temporarily
  { path: '/accounts', label: 'Accounts', icon: <Business />, roles: ['admin'] },
  { path: '/receipts', label: 'Receipts', icon: <Receipt />, roles: ['admin'] },
  { path: '/expenses', label: 'Expenses', icon: <AttachMoney />, roles: ['admin'] },
  { path: '/users', label: 'Users', icon: <Person />, roles: ['admin'] },
  { path: '/inventory', label: 'Inventory', icon: <Inventory />, roles: ['admin'] },
  { path: '/reports', label: 'Reports', icon: <Assessment />, roles: ['admin'] },
  { path: '/enhanced-reports', label: 'Enhanced Reports', icon: <Assessment />, roles: ['admin'] },
  { path: '/lab-insights', label: 'Lab Insights', icon: <BarChart />, roles: ['admin'] },

  // Staff - Limited access (including Extra Payments Management and Unpaid Invoices)
  { path: '/staff/dashboard', label: 'Staff Dashboard', icon: <Dashboard />, roles: ['staff'] },
  { path: '/shift-management', label: 'Shift Management', icon: <Schedule />, roles: ['staff'] },
  { path: '/patients', label: 'Patients Search', icon: <People />, roles: ['staff'] },
  { path: '/patient-registration', label: 'Patient Registration', icon: <PersonAdd />, roles: ['staff'] },
  { path: '/doctors', label: 'Doctors', icon: <LocalHospital />, roles: ['staff'] },
  { path: '/organizations', label: 'Organizations', icon: <Business />, roles: ['staff'] },
  { path: '/lab-requests', label: 'Lab Requests', icon: <Assignment />, roles: ['staff'] },
  { path: '/unpaid-invoices', label: 'Unpaid Invoices', icon: <CreditCard />, roles: ['staff'] },
  // { path: '/visits', label: 'Visits', icon: <CalendarToday />, roles: ['staff'] }, // Hidden temporarily
  { path: '/notifications', label: 'Notifications', icon: <Notifications />, roles: ['staff'] },
  // { path: '/invoices', label: 'Invoices', icon: <Receipt />, roles: ['staff'] }, // Hidden temporarily
  { path: '/accounts', label: 'Accounts', icon: <Business />, roles: ['staff'] },
  { path: '/receipts', label: 'Receipts', icon: <Receipt />, roles: ['staff'] },
  { path: '/expenses', label: 'Expenses', icon: <AttachMoney />, roles: ['staff'] },
  { path: '/reports', label: 'Reports', icon: <Assessment />, roles: ['staff'] },
  { path: '/barcode-demo', label: 'Barcode Scanner Hub', icon: <QrCodeScanner />, roles: ['staff'] },
  { path: '/enhanced-reports', label: 'Completed Reports', icon: <Assessment />, roles: ['staff'] },

  // Doctor - Can view and approve reports
  { path: '/doctor/dashboard', label: 'Doctor Dashboard', icon: <Dashboard />, roles: ['doctor'] },
  { path: '/doctor/reports', label: 'Reports', icon: <Assessment />, roles: ['doctor'] },
  { path: '/enhanced-reports', label: 'Enhanced Reports', icon: <Assessment />, roles: ['doctor'] },

  // Patient - Can view their own reports after payment
  { path: '/patient/dashboard', label: 'My Dashboard', icon: <Dashboard />, roles: ['patient'] },
  { path: '/patient/reports', label: 'My Reports', icon: <Assessment />, roles: ['patient'] },
];

const ERPLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [hasCheckedShift, setHasCheckedShift] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setAnchorEl(null);
  };

  // Check for active shift when staff user loads the layout
  useEffect(() => {
    const checkActiveShift = async () => {
      if (user?.role === 'staff' && !hasCheckedShift) {
        try {
          const response = await axios.get('/api/shifts/current');
          if (response.data.success && !response.data.data) {
            // No active shift found, show dialog
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

  const getRoleDisplayName = (role: string) => {
    const roleNames: { [key: string]: string } = {
      admin: 'Administrator',
      staff: 'Staff',
      doctor: 'Doctor',
      patient: 'Patient'
    };
    return roleNames[role] || role;
  };

  const filteredNavItems = navigationItems.filter(item => 
    item.roles.includes(user?.role || '')
  );

  const drawer = (
    <Box>
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <img
          src={logo}
          alt="Logo"
          style={{
            maxWidth: 120,
            maxHeight: 120,
            borderRadius: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            background: '#fff',
            padding: 8,
          }}
        />
      </Box>
      <Divider />
      <List>
        {filteredNavItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) {
                  setMobileOpen(false);
                }
              }}
              sx={{
                mx: 1,
                borderRadius: 2,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                '&:hover': {
                  bgcolor: 'rgba(47, 94, 121, 0.1)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? 'white' : 'text.secondary',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: location.pathname === item.path ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'white',
          color: 'text.primary',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 'auto' }}>
            <img
              src={logo}
              alt="Logo"
              style={{
                height: 40,
                borderRadius: 8,
                background: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                padding: 4,
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Welcome, {user?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getRoleDisplayName(user?.role || '')}
              </Typography>
            </Box>
            
            <IconButton
              onClick={handleMenuOpen}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'transparent' }}>
                {user?.name.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={handleMenuClose}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                    {user?.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {user?.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {getRoleDisplayName(user?.role || '')}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: 'background.paper',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          bgcolor: 'background.default',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {children}
      </Box>

      {/* Shift Opening Dialog for Staff */}
      <ShiftOpeningDialog
        open={showShiftDialog}
        onClose={() => setShowShiftDialog(false)}
        onShiftOpened={handleShiftOpened}
      />
    </Box>
  );
};

export default ERPLayout;




