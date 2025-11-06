import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Event as EventIcon,
  Group as GroupIcon,
  Report as ReportIcon
} from '@mui/icons-material';
import AdminDashboard from './AdminDashboard';
import AdminEvents from './AdminEvents';
import AdminUsers from './AdminUsers';
import AdminReports from './AdminReports';

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
  { text: 'Events', icon: <EventIcon />, path: '/admin/events' },
  { text: 'Users', icon: <GroupIcon />, path: '/admin/users' },
  { text: 'Reports', icon: <ReportIcon />, path: '/admin/reports' }
];

export default function AdminPanel() {
  const location = useLocation();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Sidebar */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Admin Panel
            </Typography>
            <Divider sx={{ my: 2 }} />
            <List>
              {menuItems.map((item) => (
                <ListItem
                  key={item.text}
                  button
                  component={Link}
                  to={item.path}
                  selected={location.pathname === item.path}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 2 }}>
            <Routes>
              <Route index element={<AdminDashboard />} />
              <Route path="events/*" element={<AdminEvents />} />
              <Route path="users/*" element={<AdminUsers />} />
              <Route path="reports/*" element={<AdminReports />} />
            </Routes>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}