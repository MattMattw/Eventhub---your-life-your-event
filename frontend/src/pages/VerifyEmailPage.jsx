import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { apiClient } from '../api/apiClient';

export default function VerifyEmailPage() {
  // Estrae il token dall'URL (es. /verify-email/IL_TUO_TOKEN)
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('Verifica in corso...');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Token di verifica non fornito o non valido.');
        return;
      }

      try {
        // Chiama l'endpoint del backend per la verifica
        const response = await apiClient(`/users/verify-email/${token}`, {
          method: 'POST',
        });

        setStatus('success');
        setMessage(response.message);

      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Si è verificato un errore durante la verifica.');
      }
    };

    verifyToken();
  }, [token]); // L'effetto si attiva solo quando il token è disponibile

  return (
    <Box sx={{ textAlign: 'center', mt: 8 }}>
      <Typography variant="h4" gutterBottom>
        Verifica Email
      </Typography>
      {status === 'loading' && (
        <Box>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>{message}</Typography>
        </Box>
      )}
      {status === 'success' && <Alert severity="success">{message}</Alert>}
      {status === 'error' && <Alert severity="error">{message}</Alert>}
      <Button component={RouterLink} to="/login" variant="contained" sx={{ mt: 4 }}>
        Vai al Login
      </Button>
    </Box>
  );
}