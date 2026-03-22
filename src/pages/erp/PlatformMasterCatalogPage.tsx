import React from 'react';
import { Box, Typography } from '@mui/material';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PlatformMasterCatalogPanel from '../../components/erp/PlatformMasterCatalogPanel';

/**
 * مدير المنصة فقط: التصنيفات والتحاليل المرجعية العامة.
 */
const PlatformMasterCatalogPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  if (user.lab_id != null) {
    return <Navigate to="/admin/dashboard?tab=catalog" replace />;
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        التحاليل والتصنيفات المرجعية
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        القوالب التي يراها كل معمل ثم يفعّلها ويحدد أسعارها من لوحة المعمل.
      </Typography>
      <PlatformMasterCatalogPanel />
    </Box>
  );
};

export default PlatformMasterCatalogPage;
