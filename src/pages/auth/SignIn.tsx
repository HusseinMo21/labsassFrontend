import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Tabs,
  Tab,
  Avatar,
  createTheme,
  ThemeProvider,
  CssBaseline,
} from '@mui/material';
import {
  LockOutlined as LockOutlinedIcon,
  Person as PersonIcon,
  MedicalServices as MedicalServicesIcon,
} from '@mui/icons-material';
import { keyframes } from '@emotion/react';
import { styled } from '@mui/material/styles';
import { gsap } from 'gsap';
import Navbar from '../../components/Navbar';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#181a20',
      paper: '#23272f',
    },
    text: {
      primary: '#fff',
      secondary: '#b0b3b8',
    },
    primary: {
      main: '#1976d2',
    },
  },
});

// Animated moving rainbow border for the login card
const movingBorder = keyframes`
  0% { background-position: 0% 50%; }
  100% { background-position: 400% 50%; }
`;

const BorderWrapper = styled('div')({
  position: 'relative',
  padding: '2px',
  borderRadius: 12,
  background:
    'linear-gradient(90deg, #ff0055, #ffb300, #00e676, #00b0ff, #d500f9, #ff0055)',
  backgroundSize: '400% 100%',
  animation: `${movingBorder} 12s linear infinite`,
  boxShadow: '0 0 18px rgba(66,165,245,0.25)'
});

export default function SignIn() {
  useDocumentTitle('Login - Lab System Medical Clinic');
  const [activeTab, setActiveTab] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate form on mount
    if (formRef.current) {
      gsap.fromTo(formRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }
      );
    }
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    
    // Animate form on tab change
    if (formRef.current) {
      gsap.fromTo(formRef.current,
        { y: 20, opacity: 0.8 },
        { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
      );
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Handle sign in logic here
    console.log('Login type:', activeTab === 0 ? 'Staff' : 'Patient');
  };

  return (
         <ThemeProvider theme={darkTheme}>
       <CssBaseline />
       <Box sx={{ minHeight: '100vh', backgroundColor: darkTheme.palette.background.default }}>
        <Navbar />
         <Box
           sx={{
             minHeight: 'calc(100vh - 120px)', // Subtract navbar height
             backgroundColor: darkTheme.palette.background.default,
             display: 'grid',
             placeItems: 'center',
           }}
         >
           <Box sx={{ width: { xs: '100%', sm: '66%', md: '40%' }, maxWidth: 500 }}>
             <BorderWrapper>
              <Paper elevation={8} square
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  py: 6,
                  backgroundColor: darkTheme.palette.background.paper,
                  color: darkTheme.palette.text.primary,
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
          <Box ref={formRef} sx={{ width: '100%', textAlign: 'center' }}>
           <Avatar sx={{ m: 1, bgcolor: 'primary.main', mx: 'auto' }}>
             <LockOutlinedIcon />
           </Avatar>
           <Typography component="h1" variant="h5" sx={{ color: 'text.primary', mb: 3 }}>
             Login
           </Typography>
           
           {/* Animated Tabs */}
           <Box sx={{ width: '100%', mb: 4 }}>
             <Tabs
               value={activeTab}
               onChange={handleTabChange}
               variant="fullWidth"
               sx={{
                 '& .MuiTabs-indicator': {
                   height: 3,
                   borderRadius: '2px',
                   background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                 },
                 '& .MuiTab-root': {
                   color: darkTheme.palette.text.secondary,
                   fontWeight: 600,
                   fontSize: '14px',
                   textTransform: 'none',
                   transition: 'all 0.3s ease',
                   '&.Mui-selected': {
                     color: '#1976d2',
                     transform: 'scale(1.05)',
                   },
                   '&:hover': {
                     color: '#1976d2',
                     transform: 'scale(1.02)',
                   },
                 },
               }}
             >
               <Tab 
                 icon={<PersonIcon sx={{ mb: 1 }} />} 
                 label="Staff Login" 
                 iconPosition="top"
               />
               <Tab 
                 icon={<MedicalServicesIcon sx={{ mb: 1 }} />} 
                 label="Patient Login" 
                 iconPosition="top"
               />
             </Tabs>
           </Box>
           
           <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '80%', mx: 'auto' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
            />
            <FormControlLabel
              control={<Checkbox value="remember" color="primary" />}
              label="Remember me"
            />
                         <Button
               type="submit"
               fullWidth
               variant="contained"
               sx={{ mt: 3, mb: 2 }}
             >
               Login
             </Button>
            </Box>
           </Box>
              </Paper>
            </BorderWrapper>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
