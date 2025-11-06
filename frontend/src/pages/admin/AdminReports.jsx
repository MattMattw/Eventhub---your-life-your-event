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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Chip,
  TablePagination
} from '@mui/material';

const REPORT_STATUS_COLORS = {
  pending: 'warning',
  resolved: 'success',
  dismissed: 'default'
};

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/admin/reports', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setReports(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (report) => {
    setSelectedReport(report);
    setDetailsDialogOpen(true);
  };

  const handleUpdateStatus = async (reportId, newStatus) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to update report status');
      }

      const updatedReport = await response.json();
      setReports(reports.map(r => r._id === reportId ? updatedReport : r));
      setDetailsDialogOpen(false);
      setSelectedReport(null);
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
        Manage Reports
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
              <TableCell>Type</TableCell>
              <TableCell>Reported Item</TableCell>
              <TableCell>Reporter</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((report) => (
                <TableRow key={report._id}>
                  <TableCell>
                    <Chip
                      label={report.type}
                      size="small"
                      color={
                        report.type === 'event' ? 'primary' :
                        report.type === 'user' ? 'secondary' :
                        'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {report.type === 'event' ? report.event?.title : report.user?.username}
                  </TableCell>
                  <TableCell>{report.reporter.username}</TableCell>
                  <TableCell>
                    {new Date(report.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={report.status}
                      color={REPORT_STATUS_COLORS[report.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleViewDetails(report)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={reports.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Report Details</DialogTitle>
        <DialogContent>
          {selectedReport && (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Type
                </Typography>
                <Typography variant="body1">
                  {selectedReport.type}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Reported {selectedReport.type === 'event' ? 'Event' : 'User'}
                </Typography>
                <Typography variant="body1">
                  {selectedReport.type === 'event' 
                    ? selectedReport.event?.title 
                    : selectedReport.user?.username}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Reporter
                </Typography>
                <Typography variant="body1">
                  {selectedReport.reporter.username}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Reason
                </Typography>
                <Typography variant="body1">
                  {selectedReport.reason}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Description
                </Typography>
                <Typography variant="body1">
                  {selectedReport.description}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Date Reported
                </Typography>
                <Typography variant="body1">
                  {new Date(selectedReport.createdAt).toLocaleString()}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Status
                </Typography>
                <Chip
                  label={selectedReport.status}
                  color={REPORT_STATUS_COLORS[selectedReport.status]}
                />
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>
            Close
          </Button>
          {selectedReport?.status === 'pending' && (
            <>
              <Button 
                onClick={() => handleUpdateStatus(selectedReport._id, 'resolved')}
                color="primary"
              >
                Mark as Resolved
              </Button>
              <Button 
                onClick={() => handleUpdateStatus(selectedReport._id, 'dismissed')}
                color="secondary"
              >
                Dismiss
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}