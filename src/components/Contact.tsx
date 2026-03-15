import { useEffect, useRef } from 'react';
import { Box, Container, Typography, Button, Paper } from '@mui/material';
import { Email, Phone, WhatsApp, Support } from '@mui/icons-material';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navbar from './Navbar';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

gsap.registerPlugin(ScrollTrigger);

const Contact = () => {
  useDocumentTitle('تواصل معنا - ساس لاب | أول SaaS لإدارة معامل التحاليل في مصر');
  const titleRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (titleRef.current) {
      gsap.fromTo(titleRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out' });
    }
    const sections = contentRef.current?.children;
    if (sections) {
      gsap.fromTo(sections, { y: 40, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.5, stagger: 0.12, ease: 'power2.out',
        scrollTrigger: { trigger: contentRef.current, start: 'top 80%' },
      });
    }
    return () => ScrollTrigger.getAll().forEach(t => t.kill());
  }, []);

  const handleWhatsApp = () => window.open('https://wa.me/201029558529', '_blank');
  const handleEmail = () => window.location.href = 'mailto:support@saaslab.com';

  return (
    <Box dir="rtl" sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <Navbar />
      <Container maxWidth="md" sx={{ pt: 12, pb: 10, px: { xs: 2, sm: 3 } }}>
        <Box ref={titleRef} sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h3" sx={{ color: 'primary.main', fontWeight: 800, fontSize: { xs: '2rem', md: '2.75rem' }, mb: 2 }}>
            تواصل معنا
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
            نسعد بمساعدتك — تواصل معنا لأي استفسار عن ساس لاب أو طلب تجربة مجانية
          </Typography>
        </Box>

        <Box ref={contentRef}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Support sx={{ color: 'primary.main' }} />
              الدعم الفني والاستفسارات
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <WhatsApp sx={{ color: '#25D366', fontSize: 28, mt: 0.5 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>واتساب</Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>01029558529</Typography>
                  <Button variant="outlined" size="small" onClick={handleWhatsApp} sx={{ mt: 1 }}>
                    تواصل الآن
                  </Button>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Phone sx={{ color: 'primary.main', fontSize: 28, mt: 0.5 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>هاتف</Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>01270259292 — 03/5805512</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Email sx={{ color: 'primary.main', fontSize: 28, mt: 0.5 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>بريد إلكتروني</Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>support@saaslab.com</Typography>
                  <Button variant="outlined" size="small" onClick={handleEmail} sx={{ mt: 1 }}>
                    أرسل بريد
                  </Button>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default Contact;
