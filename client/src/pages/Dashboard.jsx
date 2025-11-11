import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SecurityIcon from '@mui/icons-material/Security';
import HistoryIcon from '@mui/icons-material/History';
import { useAuth } from '../context/AuthContext';
import { usersAPI, rolesAPI, auditAPI } from '../services/api';

const StatCard = ({ title, value, icon, color }) => (
  <Paper
    elevation={3}
    sx={{
      p: 3,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}
  >
    <Box>
      <Typography color="textSecondary" gutterBottom variant="h6">
        {title}
      </Typography>
      <Typography variant="h4">{value}</Typography>
    </Box>
    <Box sx={{ color, fontSize: 48 }}>{icon}</Box>
  </Paper>
);

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    users: 0,
    roles: 0,
    auditLogs: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (isAdmin()) {
          const [usersRes, rolesRes, auditRes] = await Promise.all([
            usersAPI.getAll(),
            rolesAPI.getAll(),
            auditAPI.getLogs({ limit: 1 }),
          ]);
          
          setStats({
            users: usersRes.data.length,
            roles: rolesRes.data.length,
            auditLogs: auditRes.data.total || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [isAdmin]);

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Welcome back, {user?.username}! Role: {user?.role}
      </Typography>

      {isAdmin() && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Total Users"
              value={stats.users}
              icon={<PeopleIcon fontSize="inherit" />}
              color="primary.main"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Total Roles"
              value={stats.roles}
              icon={<SecurityIcon fontSize="inherit" />}
              color="secondary.main"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Audit Logs"
              value={stats.auditLogs}
              icon={<HistoryIcon fontSize="inherit" />}
              color="success.main"
            />
          </Grid>
        </Grid>
      )}

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Use the navigation menu to manage users, roles, and view audit logs.
        </Typography>
      </Paper>
    </Container>
  );
};

export default Dashboard;
