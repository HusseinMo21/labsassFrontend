import React, { useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  IconButton,
  Paper,
  Drawer,
  useTheme,
  useMediaQuery,
  Link as MuiLink,
  Divider,
  Avatar,
  Menu,
  MenuItem
} from '@mui/material';

// Extend the theme to include custom colors
declare module '@mui/material/styles' {
  interface Palette {
    custom: {
      darkBlue: string;
      midBlue: string;
      lightBlue: string;
    };
  }
  interface PaletteOptions {
    custom?: {
      darkBlue?: string;
      midBlue?: string;
      lightBlue?: string;
    };
  }
}
import {
  Phone,
  Facebook,
  Twitter,
  YouTube,
  Google,
  Menu as MenuIcon,
  Close,
  Login,
  Logout,
  Dashboard,
  Person
} from '@mui/icons-material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { gsap } from 'gsap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.jpg';

// TopBar Component
const TopBar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        height: 40,
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontWeight: 500,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Phone sx={{ fontSize: 16 }} />
            {!isMobile && <span>LAB TEL</span>}
            <span>01270259292 : 03/5805512-5855966</span>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {!isMobile && <span>WHATSAPP</span>}
            <WhatsAppIcon sx={{ fontSize: 16 }} />
            <span>01029558529</span>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

// MainNav Component
const MainNav = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const navRef = useRef(null);

  const navLinks = [
    { text: 'Home', active: true, path: '/' },
    { text: 'Services', active: false, path: '/services' },
    { text: 'Contact Us', active: false, path: '/contact' },
  ];

  const socialIcons = [
    { icon: Facebook, label: 'Facebook' },
    { icon: Twitter, label: 'Twitter' },
    { icon: YouTube, label: 'YouTube' },
    { icon: Google, label: 'Google' },
  ];

  useEffect(() => {
    // Animate nav on mount
    gsap.fromTo(navRef.current,
      { y: -12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }
    );
  }, []);

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setAnchorEl(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDashboardClick = () => {
    navigate('/dashboard');
    setAnchorEl(null);
  };

  const NavLinks = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {navLinks.map((link) => (
        <Button
          key={link.text}
          onClick={() => handleNavClick(link.path)}
          sx={{
            color: 'text.primary',
            fontSize: '14px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            px: 1.25,
            py: 0.5,
            borderRadius: 2.5,
            ...(link.active && {
              bgcolor: 'rgba(47, 94, 121, 0.18)',
              color: 'primary.main',
            }),
            '&:hover': {
              bgcolor: 'rgba(47, 94, 121, 0.1)',
            },
          }}
        >
          {link.text}
        </Button>
      ))}
    </Box>
  );

  const SocialIcons = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {socialIcons.map(({ icon: Icon, label }) => (
        <IconButton
          key={label}
          size="small"
          aria-label={label}
          sx={{
            color: 'text.secondary',
            '&:hover': { color: 'primary.main' },
          }}
        >
          <Icon fontSize="small" />
        </IconButton>
      ))}
    </Box>
  );

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
              '&:hover': {
                borderColor: 'primary.dark',
                bgcolor: 'rgba(47, 94, 121, 0.04)',
              },
            }}
          >
            Dashboard
          </Button>
          <IconButton
            onClick={handleMenuOpen}
            sx={{
              ml: 1,
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }}
          >
            <Person />
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
                <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {user.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user.role}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </>
      );
    }

    return (
      <Button
        variant="contained"
        startIcon={<Login />}
        onClick={handleLoginClick}
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          ml: 2,
          '&:hover': {
            bgcolor: 'primary.dark',
          },
        }}
      >
        Login
      </Button>
    );
  };

  return (
    <>
             <Paper
         ref={navRef}
         elevation={6}
         sx={{
           borderRadius: 4,
           px: 3,
           py: 1.25,
           mt: 2,
           position: 'relative',
           zIndex: 10,
           mx: { xs: 2, sm: 3 },
         }}
       >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
                     {/* Logo */}
           <Box sx={{ display: 'flex', alignItems: 'center' }}>
             <img
               src={logo}
               alt="Lab System Logo"
               style={{
                 height: '40px',
                 width: 'auto',
                 objectFit: 'contain',
               }}
             />
           </Box>

          {/* Desktop Navigation */}
          {!isMobile && (
            <>
              <NavLinks />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SocialIcons />
                <AuthButton />
              </Box>
            </>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <MenuIcon />
            </IconButton>
          )}
        </Box>
      </Paper>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            p: 3,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
            Menu
          </Typography>
          <IconButton onClick={() => setDrawerOpen(false)}>
            <Close />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
          {navLinks.map((link) => (
            <Button
              key={link.text}
              component={MuiLink}
              href={link.path}
              fullWidth
              sx={{
                justifyContent: 'flex-start',
                color: 'text.primary',
                fontSize: '16px',
                fontWeight: 600,
                textTransform: 'uppercase',
                py: 1.5,
                ...(link.active && {
                  bgcolor: 'rgba(47, 94, 121, 0.18)',
                  color: 'primary.main',
                }),
              }}
            >
              {link.text}
            </Button>
          ))}
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <SocialIcons />
          <AuthButton />
        </Box>
      </Drawer>
    </>
  );
};

// Main Navbar Component
const Navbar = () => {
  return (
    <>
      <TopBar />
      <MainNav />
    </>
  );
};

export default Navbar;
