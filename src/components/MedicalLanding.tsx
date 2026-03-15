import { useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from '@mui/material';
import {
  Science,
  Speed,
  Description,
  Notifications,
  Cloud,
  Payment,
  ArrowForward,
} from '@mui/icons-material';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import Navbar from './Navbar';

gsap.registerPlugin(ScrollTrigger);

const theme = createTheme({
  palette: {
    primary: { main: '#0d9488' },
    secondary: { main: '#06b6d4' },
    background: { default: '#f8fafc', paper: '#ffffff' },
  },
  typography: {
    fontFamily: '"Cairo", "Tajawal", Inter, sans-serif',
  },
});

const TAGLINE_AR = 'أول SaaS لإدارة معامل التحاليل في مصر بواجهة حديثة + نتائج أونلاين + تقارير + إشعارات واتساب — مناسب للمعامل الصغيرة والمتوسطة باشتراك شهري.';

const features = [
  {
    icon: <Speed sx={{ fontSize: 40, color: '#0d9488' }} />,
    title: 'بواجهة حديثة',
    desc: 'واجهة سهلة وسريعة لإدارة المعمل بدون تعقيد',
  },
  {
    icon: <Cloud sx={{ fontSize: 40, color: '#0d9488' }} />,
    title: 'نتائج أونلاين',
    desc: 'المرضى يشوفوا نتائجهم من أي مكان على الموبايل',
  },
  {
    icon: <Description sx={{ fontSize: 40, color: '#0d9488' }} />,
    title: 'تقارير احترافية',
    desc: 'تقارير طبية منسقة وجاهزة للطباعة',
  },
  {
    icon: <Notifications sx={{ fontSize: 40, color: '#0d9488' }} />,
    title: 'إشعارات واتساب',
    desc: 'إرسال النتائج للمرضى على واتساب تلقائياً',
  },
  {
    icon: <Payment sx={{ fontSize: 40, color: '#0d9488' }} />,
    title: 'اشتراك شهري',
    desc: 'بدون تكلفة مبدئية — ادفع شهرياً حسب احتياجك',
  },
];

const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const lines = headlineRef.current?.children;
    if (lines) {
      gsap.fromTo(lines, { y: 30, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.7, stagger: 0.1, ease: 'power2.out', delay: 0.2,
      });
    }
  }, []);

  return (
    <Box
      ref={heroRef}
      sx={{
        position: 'relative',
        minHeight: { xs: 520, md: 580 },
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)',
        color: 'white',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(6,182,212,0.2) 0%, transparent 50%)',
          pointerEvents: 'none',
        }}
      />
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, px: { xs: 2, sm: 3 } }}>
        <Box ref={headlineRef} sx={{ maxWidth: 720 }}>
          <Typography
            component="span"
            sx={{
              display: 'block',
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              fontWeight: 700,
              mb: 1,
              opacity: 0.95,
            }}
          >
            ساس لاب
          </Typography>
          <Typography
            component="span"
            sx={{
              display: 'block',
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
              fontWeight: 800,
              lineHeight: 1.2,
              mb: 2,
            }}
          >
            أول نظام سحابي لإدارة معامل التحاليل في مصر
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '1rem', md: '1.15rem' },
              opacity: 0.95,
              mb: 4,
              maxWidth: 560,
              lineHeight: 1.7,
            }}
          >
            {TAGLINE_AR}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/login')}
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 700,
                borderRadius: 3,
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                '&:hover': { bgcolor: '#f0fdfa', color: 'primary.dark' },
              }}
            >
              ابدأ الآن
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/services')}
              sx={{
                borderColor: 'white',
                color: 'white',
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: 3,
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              المميزات
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

const FeaturesSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cards = cardsRef.current?.children;
    if (cards) {
      gsap.fromTo(cards, { y: 40, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
      });
    }
  }, []);

  return (
    <Box ref={sectionRef} sx={{ py: 8, bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}>
            لماذا ساس لاب؟
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
            نظام مصمم خصيصاً للمعامل الصغيرة والمتوسطة في مصر
          </Typography>
        </Box>
        <Box
          ref={cardsRef}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' },
            gap: 3,
          }}
        >
          {features.map((f, i) => (
            <Paper
              key={i}
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                transition: 'all 0.3s',
                '&:hover': {
                  boxShadow: '0 12px 40px rgba(13,148,136,0.15)',
                  borderColor: 'primary.light',
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <Box sx={{ mb: 2 }}>{f.icon}</Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                {f.title}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                {f.desc}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

const CtaSection = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ py: 8, bgcolor: 'primary.main', color: 'white' }}>
      <Container maxWidth="md" sx={{ textAlign: 'center', px: { xs: 2, sm: 3 } }}>
        <Science sx={{ fontSize: 64, opacity: 0.9, mb: 2 }} />
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
          جاهز لترقية معملك؟
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95, mb: 4, fontSize: '1.1rem' }}>
          انضم لمعامل التحاليل في مصر اللي بيستخدموا ساس لاب — ابدأ تجربة مجانية اليوم
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/login')}
          sx={{
            bgcolor: 'white',
            color: 'primary.main',
            px: 5,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 700,
            borderRadius: 3,
            '&:hover': { bgcolor: '#f0fdfa' },
          }}
        >
          تسجيل الدخول
        </Button>
      </Container>
    </Box>
  );
};

const Footer = () => (
  <Box sx={{ py: 4, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
    <Container maxWidth="lg">
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        © {new Date().getFullYear()} ساس لاب — أول SaaS لإدارة معامل التحاليل في مصر
      </Typography>
    </Container>
  </Box>
);

const MedicalLanding = () => {
  useDocumentTitle('ساس لاب | أول SaaS لإدارة معامل التحاليل في مصر');

  useEffect(() => {
    return () => ScrollTrigger.getAll().forEach(t => t.kill());
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box dir="rtl" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        <Navbar />
        <Hero />
        <FeaturesSection />
        <CtaSection />
        <Footer />
      </Box>
    </ThemeProvider>
  );
};

export default MedicalLanding;
