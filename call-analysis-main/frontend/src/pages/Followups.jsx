import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  IconButton
} from '@mui/material';

import { IconCheck, IconPlus, IconRefresh } from '@tabler/icons-react';

const initialFollowups = [
  { id: 'F-1001', callId: 'C-1002', assignedTo: 'Maya', status: 'pending', notes: 'Escalation callback', createdAt: '2026-04-08' },
  { id: 'F-1002', callId: 'C-1004', assignedTo: 'Ali', status: 'done', notes: 'Resolved', createdAt: '2026-04-07' },
  { id: 'F-1003', callId: 'C-1006', assignedTo: 'Rama', status: 'pending', notes: 'Send guide', createdAt: '2026-04-06' }
];

const statusColor = {
  pending: 'warning',
  done: 'success'
};

export default function Followups() {
  const location = useLocation();

  const [followups, setFollowups] = useState(initialFollowups);
  const [statusFilter, setStatusFilter] = useState('all');

  const [openDialog, setOpenDialog] = useState(false);
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');
  const [callId, setCallId] = useState('');

  useEffect(() => {
    if (location.state?.openCreateFollowup) {
      setOpenDialog(true);
      setCallId(location.state.callId || '');
    }
  }, [location.state]);

  const filtered = useMemo(() => {
    return statusFilter === 'all'
      ? followups
      : followups.filter((f) => f.status === statusFilter);
  }, [followups, statusFilter]);

  const handleDone = (id) => {
    setFollowups((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'done' } : f))
    );
  };

  const handleCreate = () => {
    const newItem = {
      id: `F-${Date.now()}`,
      callId: callId || 'C-auto',
      assignedTo,
      status: 'pending',
      notes,
      createdAt: new Date().toISOString().slice(0, 10)
    };

    setFollowups((prev) => [newItem, ...prev]);
    setOpenDialog(false);
    setAssignedTo('');
    setNotes('');
    setCallId('');
  };

  return (
    <>
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>

          {/* HEADER */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Follow-ups Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track and manage follow-up tasks
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<IconPlus size={18} />}
              onClick={() => setOpenDialog(true)}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500 }}
            >
              Create
            </Button>
          </Stack>

          {/* FILTERS */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="done">Done</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<IconRefresh size={18} />}
                onClick={() => setStatusFilter('all')}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Reset
              </Button>
            </Grid>
          </Grid>

          {/* TABLE */}
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Call</TableCell>
                  <TableCell>Assigned</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filtered.map((f) => (
                  <TableRow key={f.id} hover>
                    <TableCell>{f.callId}</TableCell>
                    <TableCell>{f.assignedTo}</TableCell>

                    <TableCell>
                      <Chip
                        label={f.status}
                        color={statusColor[f.status]}
                        size="small"
                      />
                    </TableCell>

                    <TableCell>{f.notes}</TableCell>
                    <TableCell>{f.createdAt}</TableCell>

                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          disabled={f.status === 'done'}
                          startIcon={<IconCheck size={16} />}
                          onClick={() => handleDone(f.id)}
                          sx={{ textTransform: 'none', borderRadius: 2 }}
                        >
                          Done
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

        </CardContent>
      </Card>

      {/* DIALOG */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Create Follow-up</DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>

            <TextField
              label="Call ID"
              value={callId}
              onChange={(e) => setCallId(e.target.value)}
              size="small"
            />

            <TextField
              label="Assigned To"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              size="small"
            />

            <TextField
              label="Notes"
              multiline
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              size="small"
            />

          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!assignedTo || !notes}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}