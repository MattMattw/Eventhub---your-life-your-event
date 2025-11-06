import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  TablePagination,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState(null);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleBlockClick = (user) => {
    setSelectedUser(user);
    setBlockDialogOpen(true);
  };

  const handleAdminClick = (user) => {
    setSelectedUser(user);
    setAdminDialogOpen(true);
  };

  const handleBlock = async () => {
    try {
      const response = await fetch(`/api/admin/users/${selectedUser._id}/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: blockReason }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      const updatedUser = await response.json();
      setUsers(users.map(u => u._id === selectedUser._id ? updatedUser : u));
      setBlockDialogOpen(false);
      setSelectedUser(null);
      setBlockReason('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAdminToggle = async () => {
    try {
      const response = await fetch(`/api/admin/users/${selectedUser._id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isAdmin: !selectedUser.isAdmin }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to update user role');
      }

      const updatedUser = await response.json();
      setUsers(users.map(u => u._id === selectedUser._id ? updatedUser : u));
      setAdminDialogOpen(false);
      setSelectedUser(null);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Manage Users
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((user) => (
                <TableRow key={user._id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.isAdmin ? 'Admin' : 'User'}
                      color={user.isAdmin ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.status}
                      color={
                        user.status === 'active' ? 'success' :
                        user.status === 'blocked' ? 'error' :
                        'default'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => handleBlockClick(user)}
                      color={user.status === 'blocked' ? 'success' : 'warning'}
                      title={user.status === 'blocked' ? 'Unblock' : 'Block'}
                    >
                      {user.status === 'blocked' ? <CheckCircleIcon /> : <BlockIcon />}
                    </IconButton>
                    <IconButton
                      onClick={() => handleAdminClick(user)}
                      color={user.isAdmin ? 'primary' : 'default'}
                      title="Toggle Admin Role"
                    >
                      <AdminIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={users.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Block Dialog */}
      <Dialog open={blockDialogOpen} onClose={() => setBlockDialogOpen(false)}>
        <DialogTitle>
          {selectedUser?.status === 'blocked' ? 'Unblock' : 'Block'} User
        </DialogTitle>
        <DialogContent>
          {selectedUser?.status !== 'blocked' && (
            <TextField
              autoFocus
              margin="dense"
              label="Reason for blocking"
              type="text"
              fullWidth
              multiline
              rows={3}
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBlockDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleBlock} color="primary">
            {selectedUser?.status === 'blocked' ? 'Unblock' : 'Block'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Admin Role Dialog */}
      <Dialog open={adminDialogOpen} onClose={() => setAdminDialogOpen(false)}>
        <DialogTitle>Update User Role</DialogTitle>
        <DialogContent>
          <FormControlLabel
            control={
              <Switch
                checked={selectedUser?.isAdmin || false}
                onChange={handleAdminToggle}
              />
            }
            label="Admin Role"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdminDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAdminToggle} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}