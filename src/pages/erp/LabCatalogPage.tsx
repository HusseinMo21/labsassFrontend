import React from 'react';
import { Box, Typography } from '@mui/material';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import LabCatalogAdminPanel from '../../components/erp/LabCatalogAdminPanel';

/**
 * Lab admin: manage test categories and catalog offerings (sidebar — not dashboard tabs).
 */
const LabCatalogPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'admin' || user.lab_id == null) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const labId = user.lab_id as number;

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
        {t('nav.catalog_tests')}
      </Typography>
      <LabCatalogAdminPanel labId={labId} />
    </Box>
  );
};

export default LabCatalogPage;
