import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Box
} from '@mui/material';
import {
  Event as EventIcon,
  Group as GroupIcon,
  AttachMoney as MoneyIcon,
  Report as ReportIcon
} from '@mui/icons-material';

const StatCard = ({ title, value, icon, loading, error }) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {icon}
        <Typography variant="h6" component="h3" sx={{ ml: 1 }}>
          {title}
        </Typography>
      </Box>
      {loading ? (
        <CircularProgress size={20} />
      ) : error ? (
        <Typography color="error">Error loading data</Typography>
      ) : (
        <Typography variant="h4" component="p">
          {value}
        </Typography>
      )}
    </CardContent>
  </Card>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalEvents: { value: 0, loading: true, error: null },
    totalUsers: { value: 0, loading: true, error: null },
    totalRevenue: { value: 0, loading: true, error: null },
    activeReports: { value: 0, loading: true, error: null }
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }

        const data = await response.json();
        setStats({
          totalEvents: { value: data.totalEvents, loading: false, error: null },
          totalUsers: { value: data.totalUsers, loading: false, error: null },
          totalRevenue: { 
            value: new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(data.totalRevenue),
            loading: false,
            error: null 
          },
          activeReports: { value: data.activeReports, loading: false, error: null }
        });
      } catch (err) {
        setStats(prev => ({
          totalEvents: { ...prev.totalEvents, loading: false, error: err.message },
          totalUsers: { ...prev.totalUsers, loading: false, error: err.message },
          totalRevenue: { ...prev.totalRevenue, loading: false, error: err.message },
          activeReports: { ...prev.activeReports, loading: false, error: err.message }
        }));
      }
    };

    fetchStats();
  }, []);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Events"
            value={stats.totalEvents.value}
            icon={<EventIcon color="primary" />}
            loading={stats.totalEvents.loading}
            error={stats.totalEvents.error}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers.value}
            icon={<GroupIcon color="primary" />}
            loading={stats.totalUsers.loading}
            error={stats.totalUsers.error}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={stats.totalRevenue.value}
            icon={<MoneyIcon color="primary" />}
            loading={stats.totalRevenue.loading}
            error={stats.totalRevenue.error}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Reports"
            value={stats.activeReports.value}
            icon={<ReportIcon color="primary" />}
            loading={stats.activeReports.loading}
            error={stats.activeReports.error}
          />
        </Grid>
      </Grid>
    </Box>
  );
}