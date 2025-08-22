import { Box, Fab, Tooltip } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

const WhatsAppChat = () => {
  const handleWhatsAppClick = () => {
    const phoneNumber = '+201029558529';
    const message = 'Hello! I would like to get more information about your lab services.';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 1000,
      }}
    >
      <Tooltip title="Chat with us on WhatsApp" placement="left">
        <Fab
          color="success"
          aria-label="WhatsApp Chat"
          onClick={handleWhatsAppClick}
          sx={{
            width: 60,
            height: 60,
            boxShadow: '0 4px 20px rgba(37, 211, 102, 0.3)',
            '&:hover': {
              boxShadow: '0 6px 25px rgba(37, 211, 102, 0.4)',
              transform: 'scale(1.05)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          <WhatsAppIcon sx={{ fontSize: 28 }} />
        </Fab>
      </Tooltip>
    </Box>
  );
};

export default WhatsAppChat;
