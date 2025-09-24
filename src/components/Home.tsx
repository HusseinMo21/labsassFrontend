import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          py: 4,
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to Dryasser
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Medical Laboratory Management System
        </Typography>
        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/login')}
          >
            Login
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/services')}
          >
            Our Services
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Home;
