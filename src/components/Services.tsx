import { useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
} from '@mui/material';
import {
  Science,
  Visibility,
  Layers,
  Description,
  Support,
  Search,
} from '@mui/icons-material';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navbar from './Navbar';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import paImage from '../assets/pa.jpg';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

const services = [
  {
    icon: <Science sx={{ fontSize: 48, color: '#5EC3E6' }} />,
    title: "Tissue Biopsy Analysis",
    description: "Comprehensive examination of tissue samples for accurate diagnosis and treatment planning with advanced staining techniques."
  },
  {
    icon: <Visibility sx={{ fontSize: 48, color: '#5EC3E6' }} />,
    title: "Microscopic Examination",
    description: "Detailed microscopic analysis of cellular structures and tissue morphology using state-of-the-art equipment."
  },
  {
    icon: <Layers sx={{ fontSize: 48, color: '#5EC3E6' }} />,
    title: "Tissue Processing",
    description: "Professional tissue processing, embedding, and sectioning for optimal histological examination and diagnosis."
  },
  {
    icon: <Description sx={{ fontSize: 48, color: '#5EC3E6' }} />,
    title: "Pathology Reports",
    description: "Comprehensive pathology reports with detailed findings, diagnosis, and treatment recommendations for healthcare providers."
  },
  {
    icon: <Support sx={{ fontSize: 48, color: '#5EC3E6' }} />,
    title: "Expert Consultation",
    description: "Specialized consultation services with experienced pathologists for complex cases and second opinions."
  },
  {
    icon: <Search sx={{ fontSize: 48, color: '#5EC3E6' }} />,
    title: "Research Support",
    description: "Support for research projects with tissue analysis, data interpretation, and collaborative research opportunities."
  }
];

const Services = () => {
  useDocumentTitle('Services - Lab System Medical Clinic');
  const titleRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate title on mount
    if (titleRef.current) {
      gsap.fromTo(titleRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }
      );
    }

    // Animate services on scroll
    if (servicesRef.current) {
      const serviceCards = servicesRef.current.querySelectorAll('.service-card');
      
      gsap.fromTo(serviceCards,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: servicesRef.current,
            start: 'top 80%',
            end: 'bottom 20%',
          }
        }
      );
    }
  }, []);

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
              Our Medical Services
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
              Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae
            </Typography>
          </Box>

          {/* Services Grid */}
          <Box ref={servicesRef}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(1, 1fr)',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(3, 1fr)',
                },
                gap: 3,
                justifyItems: 'center',
              }}
            >
              {services.map((service, index) => (
                <Paper
                  className="service-card"
                  elevation={8}
                  sx={{
                    p: 4,
                    height: '280px',
                    width: '100%',
                    maxWidth: '320px',
                    mx: 'auto',
                    textAlign: 'center',
                    backgroundColor: 'rgba(35, 39, 47, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(94, 195, 230, 0.1)',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 20px 40px rgba(94, 195, 230, 0.2)',
                      borderColor: 'rgba(94, 195, 230, 0.3)',
                    },
                  }}
                  key={index}
                >
                  <Box sx={{ mb: 2, flex: '0 0 auto' }}>
                    {service.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#ffffff',
                      fontWeight: 600,
                      mb: 2,
                      fontSize: '1.1rem',
                      flex: '0 0 auto',
                    }}
                  >
                    {service.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#b0b3b8',
                      lineHeight: 1.6,
                      fontSize: '0.9rem',
                      flex: '1 1 auto',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {service.description}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default Services;
