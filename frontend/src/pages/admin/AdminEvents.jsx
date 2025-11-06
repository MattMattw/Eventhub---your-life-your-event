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
  TablePagination
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/admin/events', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      setEvents(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteClick = (event) => {
    setSelectedEvent(event);
    setDeleteDialogOpen(true);
  };

  const handleBlockClick = (event) => {
    setSelectedEvent(event);
    setBlockDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/admin/events/${selectedEvent._id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      setEvents(events.filter(e => e._id !== selectedEvent._id));
      setDeleteDialogOpen(false);
      setSelectedEvent(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBlock = async () => {
    try {
      const response = await fetch(`/api/admin/events/${selectedEvent._id}/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: blockReason }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to block event');
      }

      const updatedEvent = await response.json();
      setEvents(events.map(e => e._id === selectedEvent._id ? updatedEvent : e));
      setBlockDialogOpen(false);
      setSelectedEvent(null);
      setBlockReason('');
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
        Manage Events
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
              <TableCell>Title</TableCell>
              <TableCell>Organizer</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((event) => (
                <TableRow key={event._id}>
                  <TableCell>{event.title}</TableCell>
                  <TableCell>{event.organizer.username}</TableCell>
                  <TableCell>
                    {new Date(event.startDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={event.status}
                      color={
                        event.status === 'active' ? 'success' :
                        event.status === 'blocked' ? 'error' :
                        'default'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => handleBlockClick(event)}
                      color={event.status === 'blocked' ? 'success' : 'warning'}
                      title={event.status === 'blocked' ? 'Unblock' : 'Block'}
                    >
                      {event.status === 'blocked' ? <CheckCircleIcon /> : <BlockIcon />}
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteClick(event)}
                      color="error"
                      title="Delete"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={events.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Event</DialogTitle>
        <DialogContent>
          Are you sure you want to delete "{selectedEvent?.title}"? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Block Dialog */}
      <Dialog open={blockDialogOpen} onClose={() => setBlockDialogOpen(false)}>
        <DialogTitle>
          {selectedEvent?.status === 'blocked' ? 'Unblock' : 'Block'} Event
        </DialogTitle>
        <DialogContent>
          {selectedEvent?.status !== 'blocked' && (
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
            {selectedEvent?.status === 'blocked' ? 'Unblock' : 'Block'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}