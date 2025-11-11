import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  TablePagination,
} from '@mui/material';
import { auditAPI } from '../services/api';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [page, rowsPerPage]);

  const fetchLogs = async () => {
    try {
      const response = await auditAPI.getLogs({
        page: page + 1,
        limit: rowsPerPage,
      });
      setLogs(response.data.logs || response.data);
      setTotal(response.data.total || response.data.length);
    } catch (err) {
      setError('Failed to fetch audit logs');
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getActionColor = (action) => {
    const colorMap = {
      USER_CREATED: 'success',
      USER_UPDATED: 'info',
      USER_DELETED: 'error',
      ROLE_CREATED: 'success',
      ROLE_UPDATED: 'info',
      ROLE_DELETED: 'error',
      LOGIN: 'primary',
      LOGOUT: 'default',
    };
    return colorMap[action] || 'default';
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Audit Logs
      </Typography>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Action</TableCell>
              <TableCell>Entity Type</TableCell>
              <TableCell>Performed By</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>IP Address</TableCell>
              <TableCell>Timestamp</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log._id}>
                <TableCell>
                  <Chip
                    label={log.action}
                    color={getActionColor(log.action)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{log.entityType}</TableCell>
                <TableCell>
                  {log.performedBy?.username || log.performedBy}
                </TableCell>
                <TableCell>{log.description}</TableCell>
                <TableCell>{log.metadata?.ipAddress || '-'}</TableCell>
                <TableCell>
                  {new Date(log.timestamp).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Container>
  );
};

export default AuditLogs;
