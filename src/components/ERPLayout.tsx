import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  List,
  Typography,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  useTheme,
  useMediaQuery,
  Paper,
  Avatar,
  Chip,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
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
import { useLanguage } from '../contexts/LanguageContext';
import type { Locale } from '../i18n/translations';
import ShiftOpeningDialog from './ShiftOpeningDialog';
import axios from 'axios';
import { alpha } from '@mui/material/styles';

const drawerWidth = 300;
const collapsedDrawerWidth = 72;

interface NavigationItem {
  path: string;
  labelKey: string;
  icon: React.ReactElement;
  roles: string[];
  platformAdminOnly?: boolean; // if true, only for platform admin (lab_id null)
  labAdminOnly?: boolean;     // if true, only for lab admin (admin with lab_id)
}

const navigationItems: NavigationItem[] = [
  // Platform Admin only - system control
  { path: '/platform/dashboard', labelKey: 'nav.platform_dashboard', icon: <Dashboard />, roles: ['admin'], platformAdminOnly: true },
  { path: '/platform/labs', labelKey: 'nav.platform_labs', icon: <Business />, roles: ['admin'], platformAdminOnly: true },
  { path: '/platform/plans', labelKey: 'nav.platform_plans', icon: <CreditCard />, roles: ['admin'], platformAdminOnly: true },
  { path: '/platform/subscriptions', labelKey: 'nav.platform_subscriptions', icon: <AttachMoney />, roles: ['admin'], platformAdminOnly: true },
  { path: '/platform/master-catalog', labelKey: 'nav.master_catalog', icon: <Science />, roles: ['admin'], platformAdminOnly: true },

  // Lab Admin only - lab operations (admin with lab_id)
  { path: '/admin/dashboard', labelKey: 'nav.admin_dashboard', icon: <Dashboard />, roles: ['admin'], labAdminOnly: true },
  { path: '/admin/dashboard?tab=catalog', labelKey: 'nav.catalog_tests', icon: <Science />, roles: ['admin'], labAdminOnly: true },
  { path: '/patients', labelKey: 'nav.patients', icon: <People />, roles: ['admin'], labAdminOnly: true },
  { path: '/patient-registration', labelKey: 'nav.patient_registration', icon: <PersonAdd />, roles: ['admin'], labAdminOnly: true },
  { path: '/doctors', labelKey: 'nav.doctors', icon: <LocalHospital />, roles: ['admin'], labAdminOnly: true },
  { path: '/organizations', labelKey: 'nav.organizations', icon: <Business />, roles: ['admin'], labAdminOnly: true },
  { path: '/lab-requests', labelKey: 'nav.lab_requests', icon: <Assignment />, roles: ['admin'], labAdminOnly: true },
  { path: '/accounts', labelKey: 'nav.accounts', icon: <Business />, roles: ['admin'], labAdminOnly: true },
  { path: '/receipts', labelKey: 'nav.receipts', icon: <Receipt />, roles: ['admin'], labAdminOnly: true },
  { path: '/expenses', labelKey: 'nav.expenses', icon: <AttachMoney />, roles: ['admin'], labAdminOnly: true },
  { path: '/users', labelKey: 'nav.users', icon: <Person />, roles: ['admin'], labAdminOnly: true },
  { path: '/inventory', labelKey: 'nav.inventory', icon: <Inventory />, roles: ['admin'], labAdminOnly: true },
  { path: '/reports', labelKey: 'nav.reports', icon: <Assessment />, roles: ['admin'], labAdminOnly: true },
  { path: '/enhanced-reports', labelKey: 'nav.completed_reports', icon: <Assessment />, roles: ['admin'], labAdminOnly: true },
  { path: '/disease-search', labelKey: 'nav.disease_search', icon: <Search />, roles: ['admin'], labAdminOnly: true },
  { path: '/lab-insights', labelKey: 'nav.lab_insights', icon: <BarChart />, roles: ['admin'], labAdminOnly: true },

  { path: '/staff/dashboard', labelKey: 'nav.staff_dashboard', icon: <Dashboard />, roles: ['staff'] },
  { path: '/shift-management', labelKey: 'nav.shift_management', icon: <Schedule />, roles: ['staff'] },
  { path: '/today-clients', labelKey: 'nav.today_clients', icon: <Today />, roles: ['staff'] },
  { path: '/patients', labelKey: 'nav.patients_search', icon: <People />, roles: ['staff'] },
  { path: '/patient-registration', labelKey: 'nav.patient_registration', icon: <PersonAdd />, roles: ['staff'] },
  { path: '/doctors', labelKey: 'nav.doctors', icon: <LocalHospital />, roles: ['staff'] },
  { path: '/organizations', labelKey: 'nav.organizations', icon: <Business />, roles: ['staff'] },
  { path: '/lab-requests', labelKey: 'nav.lab_requests', icon: <Assignment />, roles: ['staff'] },
  { path: '/unpaid-invoices', labelKey: 'nav.unpaid_invoices', icon: <CreditCard />, roles: ['staff'] },
  { path: '/notifications', labelKey: 'nav.notifications', icon: <Notifications />, roles: ['staff'] },
  { path: '/accounts', labelKey: 'nav.accounts', icon: <Business />, roles: ['staff'] },
  { path: '/receipts', labelKey: 'nav.receipts', icon: <Receipt />, roles: ['staff'] },
  { path: '/expenses', labelKey: 'nav.expenses', icon: <AttachMoney />, roles: ['staff'] },
  { path: '/reports', labelKey: 'nav.reports', icon: <Assessment />, roles: ['staff'] },
  { path: '/barcode-demo', labelKey: 'nav.barcode_hub', icon: <QrCodeScanner />, roles: ['staff'] },
  { path: '/enhanced-reports', labelKey: 'nav.completed_reports', icon: <Assessment />, roles: ['staff'] },

  { path: '/doctor/dashboard', labelKey: 'nav.doctor_dashboard', icon: <Dashboard />, roles: ['doctor'] },
  { path: '/doctor/reports', labelKey: 'nav.doctor_reports', icon: <Assessment />, roles: ['doctor'] },
  { path: '/enhanced-reports', labelKey: 'nav.completed_reports', icon: <Assessment />, roles: ['doctor'] },

  { path: '/patient/dashboard', labelKey: 'nav.patient_dashboard', icon: <Dashboard />, roles: ['patient'] },
  { path: '/patient/reports', labelKey: 'nav.patient_reports', icon: <Assessment />, roles: ['patient'] },
];

const ERPLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { locale, setLocale, t } = useLanguage();
  const { user, lab, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [hasCheckedShift, setHasCheckedShift] = useState(false);

  /** EN: sidebar on the left. AR: sidebar on the right. */
  const drawerAnchor = locale === 'ar' ? 'right' : 'left';

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
        bgcolor: alpha(theme.palette.primary.main, 0.06),
        borderInlineEnd: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        backgroundImage: `linear-gradient(180deg, ${alpha('#fff', 0.92)} 0%, ${alpha(theme.palette.primary.light, 0.08)} 100%)`,
      }}
    >
      {/* Header — compact */}
      <Box
        sx={{
          flexShrink: 0,
          px: sidebarOpen ? 2 : 1,
          py: sidebarOpen ? 2 : 1.5,
          textAlign: 'center',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          bgcolor: alpha('#fff', 0.55),
        }}
      >
        {sidebarOpen ? (
          <Box>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                mx: 'auto',
                mb: 1,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: 'primary.main',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
              }}
            >
              <Science sx={{ fontSize: 26 }} />
            </Avatar>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                fontSize: '0.95rem',
                color: 'text.primary',
                lineHeight: 1.2,
                mb: 0.25,
              }}
            >
              {t('layout.brand')}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                display: 'block',
                px: 0.5,
                lineHeight: 1.35,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={isPlatformAdmin ? t('layout.system_platform') : lab?.name || t('layout.laboratory')}
            >
              {isPlatformAdmin ? t('layout.system_platform') : lab?.name || t('layout.laboratory')}
            </Typography>
            <Chip
              icon={<AdminPanelSettings sx={{ fontSize: '16px !important' }} />}
              label={user?.name || 'User'}
              size="small"
              sx={{
                mt: 1,
                maxWidth: '100%',
                height: 26,
                fontWeight: 600,
                fontSize: '0.7rem',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.dark',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                '& .MuiChip-label': {
                  px: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                },
              }}
            />
          </Box>
        ) : (
          <Avatar
            sx={{
              width: 40,
              height: 40,
              mx: 'auto',
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: 'primary.main',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
            }}
          >
            <Science sx={{ fontSize: 22 }} />
          </Avatar>
        )}
      </Box>

      {/* Navigation — scrolls; minHeight:0 so flex child can shrink */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          py: 1,
          px: sidebarOpen ? 1 : 0.5,
        }}
      >
        <List dense disablePadding>
          {filteredNavItems.map((item) => {
            const tabParam = new URLSearchParams(location.search).get('tab');
            let isActive = location.pathname === item.path;
            if (item.path === '/admin/dashboard?tab=catalog') {
              isActive = location.pathname === '/admin/dashboard' && tabParam === 'catalog';
            } else if (item.path === '/admin/dashboard') {
              isActive = location.pathname === '/admin/dashboard' && tabParam !== 'catalog';
            }
            return (
              <ListItem key={`${item.path}__${item.labelKey}`} disablePadding sx={{ mb: 0.35 }}>
                <ListItemButton
                  selected={isActive}
                  onClick={() => handleNavigation(item.path)}
                  title={sidebarOpen ? undefined : t(item.labelKey)}
                  sx={{
                    py: 0.65,
                    px: sidebarOpen ? 1 : 0.75,
                    minHeight: sidebarOpen ? 44 : 40,
                    borderRadius: 1.5,
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    alignItems: 'center',
                    color: 'text.secondary',
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, 0.14),
                      color: 'primary.dark',
                      borderInlineStart: '3px solid',
                      borderInlineStartColor: 'primary.main',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                      },
                    },
                    '&:hover': {
                      bgcolor: alpha(theme.palette.action.hover, 0.5),
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: 'inherit',
                      minWidth: sidebarOpen ? 36 : 0,
                      justifyContent: 'center',
                      '& svg': { fontSize: 22 },
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {sidebarOpen && (
                    <ListItemText
                      primary={t(item.labelKey)}
                      primaryTypographyProps={{
                        variant: 'body2',
                        sx: {
                          fontWeight: isActive ? 600 : 500,
                          fontSize: '0.8125rem',
                          lineHeight: 1.35,
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                        },
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Logout */}
      <Box
        sx={{
          flexShrink: 0,
          p: sidebarOpen ? 1 : 0.75,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          bgcolor: alpha('#fff', 0.4),
        }}
      >
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            title={sidebarOpen ? undefined : t('layout.logout')}
            sx={{
              py: 0.75,
              px: sidebarOpen ? 1 : 0.75,
              minHeight: 44,
              borderRadius: 1.5,
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              color: 'error.main',
              '&:hover': {
                bgcolor: alpha(theme.palette.error.main, 0.08),
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: 'inherit',
                minWidth: sidebarOpen ? 36 : 0,
                justifyContent: 'center',
                '& svg': { fontSize: 22 },
              }}
            >
              <Logout />
            </ListItemIcon>
            {sidebarOpen && (
              <ListItemText
                primary={t('layout.logout')}
                primaryTypographyProps={{
                  variant: 'body2',
                  sx: { fontWeight: 600, fontSize: '0.8125rem' },
                }}
              />
            )}
          </ListItemButton>
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
        anchor={drawerAnchor}
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            border: 'none',
            boxShadow:
              drawerAnchor === 'left'
                ? '8px 0 32px rgba(0,0,0,0.3)'
                : '-8px 0 32px rgba(0,0,0,0.3)',
            zIndex: 9998,
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        anchor={drawerAnchor}
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: sidebarOpen ? drawerWidth : collapsedDrawerWidth,
            border: 'none',
            boxShadow:
              drawerAnchor === 'left'
                ? '4px 0 24px rgba(0,0,0,0.15)'
                : '-4px 0 24px rgba(0,0,0,0.15)',
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
          marginInlineStart: {
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
        <Box
          sx={{
            mb: 0.5,
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            gap: 1,
            px: 1,
            pt: 1,
            flexWrap: 'wrap',
          }}
        >
          <Tooltip title={sidebarOpen ? t('layout.collapse_sidebar') : t('layout.expand_sidebar')}>
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
              {sidebarOpen
                ? theme.direction === 'rtl'
                  ? <ChevronRight />
                  : <ChevronLeft />
                : theme.direction === 'rtl'
                  ? <ChevronLeft />
                  : <ChevronRight />}
            </IconButton>
          </Tooltip>

          <ToggleButtonGroup
            value={locale}
            exclusive
            size="small"
            onChange={(_, v: Locale | null) => {
              if (v) setLocale(v);
            }}
            aria-label="language"
            sx={{
              background: 'rgba(255, 255, 255, 0.75)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              '& .MuiToggleButton-root': {
                px: 1.25,
                py: 0.5,
                fontWeight: 700,
                fontSize: '0.8rem',
                color: '#1a1a2e',
                border: 'none',
                '&.Mui-selected': {
                  bgcolor: 'rgba(13, 148, 136, 0.2)',
                  color: '#0d9488',
                },
              },
            }}
          >
            <ToggleButton value="en">EN</ToggleButton>
            <ToggleButton value="ar">AR</ToggleButton>
          </ToggleButtonGroup>

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
