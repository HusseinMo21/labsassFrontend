import { useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
} from '@mui/material';
import {
  Phone,
  LocationOn,
  AccessTime,
  WhatsApp,
} from '@mui/icons-material';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navbar from './Navbar';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import paImage from '../assets/pa.jpg';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

const Contact = () => {
  useDocumentTitle('Contact Us - Lab System Medical Clinic');
  const titleRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate title on mount
    if (titleRef.current) {
      gsap.fromTo(titleRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }
      );
    }

    // Animate contact sections on scroll
    const contactSections = contactRef.current?.children;
    if (contactSections) {
      gsap.fromTo(contactSections,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.15,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: contactRef.current,
            start: 'top 80%',
            end: 'bottom 20%',
          },
        }
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  const handleGetDirections = () => {
    const address = "5 ش محمد ناجي متفرع من ش ابوقير جناكليس - اما كنيسة الكتاب المقدس";
    const encodedAddress = encodeURIComponent(address);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(googleMapsUrl, '_blank');
  };

  return (
    <>
      <Box sx={{ minHeight: '100vh', backgroundColor: '#0a0a0a' }}>
        <Navbar />
        
        {/* Background Image */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
                         backgroundImage: `url(${paImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(8px) brightness(0.3)',
            zIndex: -1,
          }}
        />
        
        <Container maxWidth="lg" sx={{ pt: 15, pb: 10, position: 'relative', zIndex: 1 }}>
          {/* Header Section */}
          <Box ref={titleRef} sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="h2"
              sx={{
                color: '#5EC3E6',
                fontWeight: 700,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                mb: 3,
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              Contact Us
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: '#b0b3b8',
                maxWidth: '800px',
                mx: 'auto',
                lineHeight: 1.6,
                fontSize: { xs: '1rem', md: '1.1rem' },
              }}
            >
              Get in touch with us for any inquiries about our services or to schedule an appointment
            </Typography>
          </Box>

          {/* Contact Content */}
          <Box ref={contactRef}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 4 }}>
              {/* Contact Information */}
              <Box>
                <Paper
                  className="contact-section"
                  elevation={8}
                  sx={{
                    p: 4,
                    height: 'fit-content',
                    backgroundColor: 'rgba(35, 39, 47, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(94, 195, 230, 0.1)',
                    borderRadius: 3,
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      color: '#ffffff',
                      fontWeight: 700,
                      mb: 4,
                      fontSize: { xs: '1.8rem', md: '2.2rem' },
                    }}
                  >
                    Get In Touch
                  </Typography>

                  {/* Address */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
                    <LocationOn sx={{ color: '#5EC3E6', fontSize: 24, mt: 0.5 }} />
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          color: '#ffffff',
                          fontWeight: 600,
                          mb: 1,
                          fontSize: '1.1rem',
                        }}
                      >
                        Address
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: '#b0b3b8',
                          lineHeight: 1.6,
                          fontSize: '1rem',
                        }}
                      >
                         ش5 محمد ناجي متفرع من ش ابوقير جناكليس - اما كنيسة الكتاب المقدس
                      </Typography>
                    </Box>
                  </Box>

                  {/* Phone */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Phone sx={{ color: '#5EC3E6', fontSize: 24 }} />
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          color: '#ffffff',
                          fontWeight: 600,
                          mb: 1,
                          fontSize: '1.1rem',
                        }}
                      >
                        Phone
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: '#b0b3b8',
                          fontSize: '1rem',
                        }}
                      >
                        01270259292 : 03/5805512-5855966
                      </Typography>
                    </Box>
                  </Box>

                  {/* WhatsApp */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <WhatsApp sx={{ color: '#5EC3E6', fontSize: 24 }} />
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          color: '#ffffff',
                          fontWeight: 600,
                          mb: 1,
                          fontSize: '1.1rem',
                        }}
                      >
                        WhatsApp
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: '#b0b3b8',
                          fontSize: '1rem',
                        }}
                      >
                        01029558529
                      </Typography>
                    </Box>
                  </Box>

                  {/* Working Hours */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 4 }}>
                    <AccessTime sx={{ color: '#5EC3E6', fontSize: 24, mt: 0.5 }} />
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          color: '#ffffff',
                          fontWeight: 600,
                          mb: 1,
                          fontSize: '1.1rem',
                        }}
                      >
                        Working Hours
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: '#b0b3b8',
                          lineHeight: 1.6,
                          fontSize: '1rem',
                        }}
                      >
                        Monday: 08:00 AM — 12:00 PM<br />
                        Tuesday: 08:00 AM — 12:00 PM<br />
                        Wednesday: 08:00 AM — 12:00 PM<br />
                        Thursday: 08:00 AM — 12:00 PM<br />
                        Friday: Closed<br />
                        Saturday: 08:00 AM — 12:00 PM<br />
                        Sunday: 08:00 AM — 12:00 PM
                      </Typography>
                    </Box>
                  </Box>

                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleGetDirections}
                    sx={{
                      bgcolor: '#5EC3E6',
                      color: '#ffffff',
                      py: 1.5,
                      px: 3,
                      fontSize: '16px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      '&:hover': {
                        bgcolor: '#4BA8C7',
                      },
                    }}
                  >
                    Get Directions
                  </Button>
                </Paper>
              </Box>

              {/* Map */}
              <Box>
                <Paper
                  className="contact-section"
                  elevation={8}
                  sx={{
                    height: '500px',
                    backgroundColor: 'rgba(35, 39, 47, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(94, 195, 230, 0.1)',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3411.5!2d29.9187!3d31.2017!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzHCsDEyJzA2LjEiTiAyOcKwNTUnMDcuMyJF!5e0!3m2!1sen!2seg!4v1234567890"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Lab System Medical Clinic Location"
                  />
                </Paper>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default Contact;

