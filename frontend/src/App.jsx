import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';
import { useAuth } from './context/AuthContext';

const Navigation = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}>
          EventHub
        </Typography>
        {user ? (
          <>
            <Button color="inherit" onClick={() => navigate('/events/my')}>My Events</Button>
            <Button color="inherit" onClick={() => navigate('/events/new')}>Create Event</Button>
            {isAdmin && (
              <Button color="inherit" onClick={() => navigate('/admin')}>Admin Panel</Button>
            )}
            <Button color="inherit" onClick={logout}>Logout</Button>
          </>
        ) : (
          <>
            <Button color="inherit" onClick={() => navigate('/login')}>Login</Button>
            <Button color="inherit" onClick={() => navigate('/register')}>Register</Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default function App() {
  return (
    <div>
      <Navigation />
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Outlet />
        </Box>
      </Container>
    </div>
  );
}
