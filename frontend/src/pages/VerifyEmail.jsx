import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, Button, Alert, CircularProgress } from '@mui/material';
import api from '../services/api';

export default function VerifyEmail(){
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState({ loading: true, error: null, success: null });

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await api.post('/users/verify-email', { token });
        setStatus({ loading: false, error: null, success: res.data.message || 'Email verified successfully' });
        setTimeout(() => navigate('/login'), 2500);
      } catch (err) {
        setStatus({ loading: false, error: err.response?.data?.message || 'Verification failed', success: null });
      }
    };

    if (token) verify();
  }, [token, navigate]);

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto', mt: 8, textAlign: 'center' }}>
      <Typography variant="h5" gutterBottom>Verify your email</Typography>

      {status.loading && <CircularProgress />}

      {status.error && (
        <Alert severity="error" sx={{ mt: 2 }}>{status.error}</Alert>
      )}

      {status.success && (
        <Alert severity="success" sx={{ mt: 2 }}>{status.success}</Alert>
      )}

      <Box sx={{ mt: 3 }}>
        <Button variant="contained" onClick={() => navigate('/login')}>Go to Login</Button>
      </Box>
    </Box>
  );
}
