import { useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Link,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  LocationOn,
  AccessTime,
  Star,
} from '@mui/icons-material';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import Navbar from './Navbar';
import paImage from '../assets/pa.jpg';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

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

// Create theme with custom palette and typography
const theme = createTheme({
  palette: {
    primary: {
      main: '#2F5E79',
    },
    secondary: {
      main: '#5EC3E6',
    },
    background: {
      default: '#F5F8FB',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#294B63',
    },
    custom: {
      darkBlue: '#294B63',
      midBlue: '#3C7BA0',
      lightBlue: '#7ED0EF',
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h2: {
      fontWeight: 800,
      letterSpacing: '0.08em',
    },
    h3: {
      fontWeight: 800,
      letterSpacing: '0.08em',
    },
    h4: {
      fontWeight: 800,
      letterSpacing: '0.08em',
    },
    body1: {
      fontSize: '15px',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '14px',
      lineHeight: 1.5,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
  },
});

// Hero Component
const Hero = ({ heroImage = paImage }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate headline lines
    const lines = headlineRef.current?.children;
    if (lines) {
      gsap.fromTo(lines,
        { y: 30, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.8, 
          stagger: 0.08, 
          ease: 'power2.out',
          delay: 0.3
        }
      );
    }

    // Parallax effect for background
    if (heroRef.current) {
      gsap.to(heroRef.current, {
        x: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    }
  }, []);

  return (
    <Box
      ref={heroRef}
      sx={{
        position: 'relative',
        minHeight: 560,
        display: 'flex',
        alignItems: 'center',
        backgroundImage: `linear-gradient(90deg, rgba(41,75,99,.75) 0%, rgba(41,75,99,.35) 35%, rgba(0,0,0,0) 70%), url(${heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        color: 'white',
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box
          ref={headlineRef}
          sx={{
            maxWidth: 640,
            mb: 4,
          }}
        >
          <Typography
            component="span"
            variant="h2"
            sx={{
              display: 'block',
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              lineHeight: 1.1,
              mb: 1,
            }}
          >
            EMPOWERING PEOPLE
          </Typography>
          <Typography
            component="span"
            variant="h2"
            sx={{
              display: 'block',
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              lineHeight: 1.1,
              mb: 3,
            }}
          >
            TO IMPROVE THEIR LIVES
          </Typography>
          
          <Typography
            variant="body1"
            sx={{
              fontSize: '18px',
              opacity: 0.9,
              mb: 4,
              maxWidth: 480,
            }}
          >
            Experience world-class healthcare with cutting-edge technology and compassionate care. 
            Our team of experts is dedicated to your well-being.
          </Typography>

          {/* Navigation Arrows */}
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <IconButton
              aria-label="Previous slide"
              sx={{
                width: 44,
                height: 44,
                border: '2px solid white',
                borderRadius: 1.5,
                color: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              <ArrowBack />
            </IconButton>
            <IconButton
              aria-label="Next slide"
              sx={{
                width: 44,
                height: 44,
                border: '2px solid white',
                borderRadius: 1.5,
                color: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              <ArrowForward />
            </IconButton>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

// InfoPanels Component
const InfoPanels = () => {
  const panelsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const panels = panelsRef.current?.children;
    if (panels) {
      gsap.fromTo(panels,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.12,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: panelsRef.current,
            start: 'top 80%',
            end: 'bottom 20%',
          },
        }
      );
    }
  }, []);

  const workingHours = [
    { day: 'MONDAY', time: '08:00 AM — 12:00 PM' },
    { day: 'TUESDAY', time: '08:00 AM — 12:00 PM' },
    { day: 'WEDNESDAY', time: '08:00 AM — 12:00 PM' },
    { day: 'THURSDAY', time: '08:00 AM — 12:00 PM' },
    { day: 'FRIDAY', time: 'CLOSED' },
    { day: 'SATURDAY', time: '08:00 AM — 12:00 PM' },
    { day: 'SUNDAY', time: '08:00 AM — 12:00 PM' },
  ];

  return (
         <Container
       maxWidth="lg"
       sx={{
         px: { xs: 2, sm: 3 },
         position: 'relative',
         mt: -8,
         mb: 6,
         zIndex: 5,
       }}
     >
      <Box
        ref={panelsRef}
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 3,
        }}
      >
        {/* Working Hours Panel */}
        <Box>
          <Paper
            sx={{
              borderRadius: 2,
              py: 3.5,
              px: 3,
              bgcolor: 'custom.darkBlue',
              color: 'white',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AccessTime sx={{ fontSize: 24 }} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Working Hours
              </Typography>
            </Box>
            <List sx={{ py: 0 }}>
              {workingHours.map((item, index) => (
                <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 24 }}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: 'white',
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.day}
                    secondary={item.time}
                    primaryTypographyProps={{
                      sx: {
                        fontSize: '14px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      },
                    }}
                    secondaryTypographyProps={{
                      sx: {
                        fontSize: '13px',
                        opacity: 1,
                        color: 'white',
                        mt: 0.5,
                        fontWeight: 500,
                      },
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>

        {/* Contact Details Panel */}
        <Box>
          <Paper
            sx={{
              borderRadius: 2,
              py: 3.5,
              px: 3,
              bgcolor: 'custom.midBlue',
              color: 'white',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <LocationOn sx={{ fontSize: 24 }} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Contact Details
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{
                mb: 2,
                opacity: 0.9,
                lineHeight: 1.6,
              }}
            >
              ش5 محمد ناجي متفرع من ش ابوقير جناكليس - امام كنيسة الكتاب المقدس
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="body2"
                sx={{
                  opacity: 0.9,
                  lineHeight: 1.6,
                  mb: 1,
                }}
              >
                <strong>Phone:</strong> 01270259292 : 03/5805512-5855966
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  opacity: 0.9,
                  lineHeight: 1.6,
                }}
              >
                <strong>WhatsApp:</strong> 01029558529
              </Typography>
            </Box>
            <Button
              variant="contained"
              sx={{
                bgcolor: 'white',
                color: 'custom.midBlue',
                mt: 'auto',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.9)',
                },
              }}
              onClick={() => navigate('/contact')}
            >
              Get Directions on the Map ▸
            </Button>
          </Paper>
        </Box>

        {/* Appointment Panel */}
        <Box>
          <Paper
            sx={{
              borderRadius: 2,
              py: 3.5,
              px: 3,
              bgcolor: 'custom.lightBlue',
              color: 'custom.darkBlue',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                mb: 1,
              }}
            >
              Make Appointment
            </Typography>
            <Typography
              variant="body2"
              sx={{
                mb: 3,
                opacity: 0.8,
                lineHeight: 1.6,
              }}
            >
              Choose the right time and date for you. Book your appointment online and get instant confirmation.
            </Typography>
            <Button
              variant="contained"
              size="large"
              sx={{
                bgcolor: 'custom.darkBlue',
                color: 'white',
                mt: 'auto',
                py: 1.5,
                fontSize: '16px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                '&:hover': {
                  bgcolor: 'custom.darkBlue',
                  opacity: 0.9,
                },
              }}
            >
              Make an Appointment
            </Button>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

// Footer Component
const Footer = () => {
  return (
    <Box
      sx={{
        py: 3,
        textAlign: 'center',
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            fontSize: '14px',
            mb: 1,
          }}
        >
         ©2025 DR. Yassaer EL DOWIK Lab. All Rights Reserved
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
          }}
        >
          <span>Developed By</span>
          <Link
            href="https://semou.it.com/"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: 'primary.main',
              textDecoration: 'none',
              fontWeight: 600,
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            SEMOU
          </Link>
          <Star sx={{ fontSize: 12, color: 'primary.main' }} />
        </Typography>
      </Container>
    </Box>
  );
};

// Main MedicalLanding Component
const MedicalLanding = ({ heroImage }: { heroImage?: string }) => {
  useDocumentTitle('Lab System Medical Clinic - Empowering People to Improve Their Lives');
  
  useEffect(() => {
    // Cleanup GSAP ScrollTriggers on unmount
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        <Navbar />
        <Hero heroImage={heroImage} />
        <InfoPanels />
        <Footer />
      </Box>
    </ThemeProvider>
  );
};

export default MedicalLanding;
