import { Box, Container, Typography, Paper, Button, CardContent, CardMedia } from '@mui/material';
import { styled } from '@mui/material/styles';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';

const HeroSection = styled(Box)(() => ({
  backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(/src/assets/images/hero-bg.jpg)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  height: '80vh',
  display: 'flex',
  alignItems: 'center',
  color: 'white'
}));

const FeatureCard = styled(Paper)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(3),
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-10px)',
  }
}));

export default function HomePage() {
  return (
    <Box>
      <HeroSection>
        <Container>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4, alignItems: 'center' }}>
            <Box>
              <Typography variant="h2" component="h1" gutterBottom>
                Welcome to Dr. Yasser Medical Center
              </Typography>
              <Typography variant="h5" paragraph>
                Providing Quality Healthcare Services
              </Typography>
              <Button variant="contained" size="large" sx={{ mt: 4 }}>
                Book Appointment
              </Button>
            </Box>
          </Box>
        </Container>
      </HeroSection>

      <Container sx={{ py: 8 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 4 }}>
          <FeatureCard>
            <MedicalServicesIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" component="h2" gutterBottom>
              Expert Doctors
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center">
              Our team of experienced medical professionals provides the highest quality care
            </Typography>
          </FeatureCard>
          <FeatureCard>
            <AccessTimeIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" component="h2" gutterBottom>
              24/7 Service
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center">
              Round-the-clock medical care for all your emergency needs
            </Typography>
          </FeatureCard>
          <FeatureCard>
            <LocalHospitalIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" component="h2" gutterBottom>
              Modern Facilities
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center">
              State-of-the-art medical equipment and comfortable facilities
            </Typography>
          </FeatureCard>
        </Box>
      </Container>

      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container>
          <Typography variant="h3" component="h2" align="center" gutterBottom>
            Our Services
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 4, mt: 4 }}>
            {services.map((service, index) => (
              <Paper key={index}>
                <CardMedia
                  component="img"
                  height="200"
                  image={`/src/assets/images/service-${index + 1}.jpg`}
                  alt={service.title}
                />
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {service.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {service.description}
                  </Typography>
                </CardContent>
              </Paper>
            ))}
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

const services = [
  {
    title: 'General Medicine',
    description: 'Comprehensive medical care for all your health needs'
  },
  {
    title: 'Specialized Care',
    description: 'Expert treatment in various medical specialties'
  },
  {
    title: 'Laboratory Services',
    description: 'Advanced diagnostic and testing facilities'
  }
];

