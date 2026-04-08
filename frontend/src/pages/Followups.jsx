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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';

const initialFollowups = [
  {
    id: 'F-1001',
    callId: 'C-1002',
    assignedTo: 'Maya',
    status: 'pending',
    notes: 'Customer asked for escalation callback within 24h',
    createdAt: '2026-04-08'
  },
  {
    id: 'F-1002',
    callId: 'C-1004',
    assignedTo: 'Ali',
    status: 'done',
    notes: 'Issue resolved and customer confirmed closure',
    createdAt: '2026-04-07'
  },
  {
    id: 'F-1003',
    callId: 'C-1006',
    assignedTo: 'Rama',
    status: 'pending',
    notes: 'Share final setup guide via follow-up call',
    createdAt: '2026-04-06'
  },
  {
    id: 'F-1004',
    callId: 'C-1008',
    assignedTo: 'Omar',
    status: 'done',
    notes: 'Final check completed successfully',
    createdAt: '2026-04-05'
  }
];

const assignees = ['Maya', 'Ali', 'Rama', 'Omar'];

export default function Followups() {
  const location = useLocation();
  const [statusFilter, setStatusFilter] = useState('all');
  const [followups, setFollowups] = useState(initialFollowups);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');
  const [callIdInput, setCallIdInput] = useState('');

  useEffect(() => {
    if (location.state?.openCreateFollowup) {
      setOpenCreateDialog(true);
      setCallIdInput(location.state.callId || '');
    }
  }, [location.state]);

  const filteredFollowups = useMemo(() => {
    if (statusFilter === 'all') return followups;
    return followups.filter((item) => item.status === statusFilter);
  }, [followups, statusFilter]);

  const handleMarkDone = (id) => {
    setFollowups((prev) => prev.map((item) => (item.id === id ? { ...item, status: 'done' } : item)));
  };

  const handleCreateFollowup = () => {
    if (!assignedTo || !notes.trim()) return;

    const nextId = `F-${1000 + followups.length + 1}`;
    const newItem = {
      id: nextId,
      callId: callIdInput || `C-${1000 + followups.length + 1}`,
      assignedTo,
      status: 'pending',
      notes: notes.trim(),
      createdAt: new Date().toISOString().slice(0, 10)
    };

    setFollowups((prev) => [newItem, ...prev]);
    setOpenCreateDialog(false);
    setAssignedTo('');
    setNotes('');
    setCallIdInput('');
  };

  return (
    <>
      <Card>
        <CardContent>
          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="h4" gutterBottom>
                Follow-ups Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track and manage all follow-up tasks
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(event) => setStatusFilter(event.target.value)}>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="pending">pending</MenuItem>
                  <MenuItem value="done">done</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button variant="contained" fullWidth onClick={() => setOpenCreateDialog(true)}>
                Create Follow-up
              </Button>
            </Grid>
          </Grid>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Call ID</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFollowups.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.callId}</TableCell>
                    <TableCell>{item.assignedTo}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.status}
                        color={item.status === 'done' ? 'success' : 'warning'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{item.notes}</TableCell>
                    <TableCell>{item.createdAt}</TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined" sx={{ mr: 1 }}>
                        View Call
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        disabled={item.status === 'done'}
                        onClick={() => handleMarkDone(item.id)}
                      >
                        Mark as Done
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredFollowups.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Box sx={{ py: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          No follow-ups match the selected status.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Follow-up</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                label="Call ID"
                size="small"
                fullWidth
                value={callIdInput}
                onChange={(event) => setCallIdInput(event.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Assigned To</InputLabel>
                <Select value={assignedTo} label="Assigned To" onChange={(event) => setAssignedTo(event.target.value)}>
                  {assignees.map((name) => (
                    <MenuItem value={name} key={name}>
                      {name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes"
                fullWidth
                multiline
                minRows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateFollowup} disabled={!assignedTo || !notes.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
