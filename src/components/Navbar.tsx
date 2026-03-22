import React, { useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  Drawer,
  useTheme,
  useMediaQuery,
  Divider,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close,
  Login,
  Logout,
  Dashboard,
  Person,
} from '@mui/icons-material';
import { gsap } from 'gsap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.jpg';

const navLinks = [
  { text: 'الرئيسية', path: '/' },
  { text: 'المميزات', path: '/services' },
  { text: 'تواصل معنا', path: '/contact' },
];

const MainNav = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const navRef = useRef(null);

  useEffect(() => {
    if (navRef.current) {
      gsap.fromTo(navRef.current, { y: -12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' });
    }
  }, []);

  const handleLoginClick = () => navigate('/login');
  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setAnchorEl(null);
  };
  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleDashboardClick = () => {
    if (user) {
      const routes: Record<string, string> = {
        admin: '/admin/dashboard',
        staff: '/staff/dashboard',
        doctor: '/doctor/dashboard',
        patient: '/patient/dashboard',
        accountant: '/accountant/dashboard',
      };
      navigate(routes[user.role] || '/dashboard');
    } else {
      navigate('/dashboard');
    }
    setAnchorEl(null);
  };

  const AuthButton = () => {
    if (user) {
      return (
        <>
          <Button
            variant="outlined"
            startIcon={<Dashboard />}
            onClick={handleDashboardClick}
            sx={{
              ml: 2,
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': { borderColor: 'primary.dark', bgcolor: 'rgba(13,148,136,0.04)' },
            }}
          >
            لوحة التحكم
          </Button>
          <IconButton onClick={handleMenuOpen} sx={{ ml: 1, bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}>
            <Person />
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }}>
            <MenuItem onClick={handleMenuClose}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>{user.name.charAt(0).toUpperCase()}</Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{user.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{user.role}</Typography>
                </Box>
              </Box>
            </MenuItem>
            <MenuItem onClick={handleLogout}><Logout sx={{ mr: 1 }} />تسجيل الخروج</MenuItem>
          </Menu>
        </>
      );
    }
    return (
      <Button variant="contained" startIcon={<Login />} onClick={handleLoginClick} sx={{ bgcolor: 'primary.main', color: 'white', ml: 2, '&:hover': { bgcolor: 'primary.dark' } }}>
        تسجيل الدخول
      </Button>
    );
  };

  return (
    <>
      <Paper
        ref={navRef}
        elevation={4}
        sx={{
          borderRadius: 3,
          px: 3,
          py: 1.25,
          mt: 2,
          position: 'relative',
          zIndex: 10,
          mx: { xs: 2, sm: 3 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <img src={logo} alt="ساس لاب" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', display: { xs: 'none', sm: 'block' } }}>
              ساس لاب
            </Typography>
          </Box>

          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {navLinks.map((link) => (
                <Button
                  key={link.text}
                  onClick={() => navigate(link.path)}
                  sx={{
                    color: 'text.primary',
                    fontSize: '14px',
                    fontWeight: 600,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 2,
                    '&:hover': { bgcolor: 'rgba(13,148,136,0.1)' },
                  }}
                >
                  {link.text}
                </Button>
              ))}
              <AuthButton />
            </Box>
          )}

          {isMobile && (
            <IconButton onClick={() => setDrawerOpen(true)} aria-label="القائمة">
              <MenuIcon />
            </IconButton>
          )}
        </Box>
      </Paper>

      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: 280, p: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>القائمة</Typography>
          <IconButton onClick={() => setDrawerOpen(false)}><Close /></IconButton>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
          {navLinks.map((link) => (
            <Button key={link.text} fullWidth onClick={() => { navigate(link.path); setDrawerOpen(false); }} sx={{ justifyContent: 'flex-start', py: 1.5, fontWeight: 600 }}>
              {link.text}
            </Button>
          ))}
        </Box>
        <Divider sx={{ my: 2 }} />
        <AuthButton />
      </Drawer>
    </>
  );
};

const Navbar = () => <Box dir="rtl"><MainNav /></Box>;

export default Navbar;
