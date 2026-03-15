import { useEffect, useRef } from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import {
  Speed,
  Cloud,
  Description,
  Notifications,
  Payment,
  Assessment,
  People,
  Receipt,
  QrCode2,
} from '@mui/icons-material';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navbar from './Navbar';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

gsap.registerPlugin(ScrollTrigger);

const services = [
  { icon: <Speed sx={{ fontSize: 48, color: '#0d9488' }} />, title: 'بواجهة حديثة وسريعة', desc: 'واجهة سهلة الاستخدام مصممة خصيصاً لسير عمل المعامل المصري' },
  { icon: <Cloud sx={{ fontSize: 48, color: '#0d9488' }} />, title: 'نتائج أونلاين', desc: 'المرضى يشوفوا نتائجهم من أي مكان على الموبايل أو الكمبيوتر' },
  { icon: <Description sx={{ fontSize: 48, color: '#0d9488' }} />, title: 'تقارير احترافية', desc: 'تقارير طبية منسقة وجاهزة للطباعة مع إمكانية التخصيص' },
  { icon: <Notifications sx={{ fontSize: 48, color: '#0d9488' }} />, title: 'إشعارات واتساب', desc: 'إرسال النتائج للمرضى على واتساب تلقائياً عند الجاهزية' },
  { icon: <Payment sx={{ fontSize: 48, color: '#0d9488' }} />, title: 'اشتراك شهري مرن', desc: 'بدون تكلفة مبدئية — ادفع شهرياً حسب حجم معملك' },
  { icon: <Assessment sx={{ fontSize: 48, color: '#0d9488' }} />, title: 'إدارة التحاليل', desc: 'كتالوج تحاليل كامل، بانلات، وأسعار قابلة للتعديل' },
  { icon: <People sx={{ fontSize: 48, color: '#0d9488' }} />, title: 'إدارة المرضى والدكاترة', desc: 'سجل مرضي، دكاترة، ومنظمات — كل شيء في مكان واحد' },
  { icon: <Receipt sx={{ fontSize: 48, color: '#0d9488' }} />, title: 'فواتير ومتابعة مديونيات', desc: 'فواتير، إيصالات، ومتابعة أرصدة المرضى' },
  { icon: <QrCode2 sx={{ fontSize: 48, color: '#0d9488' }} />, title: 'باركود وعينات', desc: 'باركود لكل عينة، مسح سريع، وتتبع دقيق' },
];

const Services = () => {
  useDocumentTitle('المميزات - ساس لاب | أول SaaS لإدارة معامل التحاليل في مصر');
  const titleRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (titleRef.current) {
      gsap.fromTo(titleRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out' });
    }
    const cards = servicesRef.current?.querySelectorAll('.service-card');
    if (cards?.length) {
      gsap.fromTo(cards, { y: 50, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out',
        scrollTrigger: { trigger: servicesRef.current, start: 'top 80%' },
      });
    }
    return () => ScrollTrigger.getAll().forEach(t => t.kill());
  }, []);

  return (
    <Box dir="rtl" sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <Navbar />
      <Container maxWidth="lg" sx={{ pt: 12, pb: 10, px: { xs: 2, sm: 3 } }}>
        <Box ref={titleRef} sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h3" sx={{ color: 'primary.main', fontWeight: 800, fontSize: { xs: '2rem', md: '2.75rem' }, mb: 2 }}>
            مميزات ساس لاب
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 640, mx: 'auto', lineHeight: 1.7 }}>
            أول SaaS لإدارة معامل التحاليل في مصر — مناسب للمعامل الصغيرة والمتوسطة باشتراك شهري
          </Typography>
        </Box>

        <Box ref={servicesRef} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          {services.map((s, i) => (
            <Paper
              key={i}
              className="service-card"
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                transition: 'all 0.3s',
                '&:hover': {
                  boxShadow: '0 12px 40px rgba(13,148,136,0.15)',
                  borderColor: 'primary.light',
                  transform: 'translateY(-6px)',
                },
              }}
            >
              <Box sx={{ mb: 2 }}>{s.icon}</Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{s.title}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>{s.desc}</Typography>
            </Paper>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default Services;
