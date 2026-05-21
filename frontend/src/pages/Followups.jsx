import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Avatar, Box, Button, Card, CardContent, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, Grid, InputLabel, MenuItem,
  Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Typography, alpha, useTheme, Drawer, Divider,
  IconButton, CircularProgress, Alert
} from '@mui/material';
import {
  IconChecks, IconClipboardText, IconPlus, IconUser,
  IconClockHour4, IconRefresh, IconX, IconEdit, IconDeviceFloppy
} from '@tabler/icons-react';
import { followupsApi, accountsApi } from 'api/api';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function Followups() {
  const theme = useTheme();
  const location = useLocation();

  const [followups, setFollowups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');
  const [callIdInput, setCallIdInput] = useState('');
  const [creating, setCreating] = useState(false);

  const [openDrawer, setOpenDrawer] = useState(false);
  const [selectedFollowup, setSelectedFollowup] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editableNotes, setEditableNotes] = useState('');
  const [editableStatus, setEditableStatus] = useState('pending');

  useEffect(() => {
    loadFollowups();
    loadUsers();
  }, []);

  useEffect(() => {
    if (location.state?.openCreateFollowup) {
      setOpenCreateDialog(true);
      setCallIdInput(location.state.callId ? String(location.state.callId) : '');
    }
  }, [location.state]);

  const loadFollowups = async () => {
    try {
      setLoading(true);
      const res = await followupsApi.list();
      setFollowups(res?.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/accounts/me/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      });
      const data = await res.json();
      if (data?.data) {
        setUsers([data.data]);
      }
    } catch {
      // silently fail
    }
  };

  const filtered = useMemo(() => {
    return followups.filter((f) => {
      const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
      const assignedName = f.assigned_to_username || '';
      const matchesAssigned = assignedFilter === 'all' || assignedName === assignedFilter;
      const createdDate = f.created_at ? f.created_at.split('T')[0] : '';
      const matchesDate = !dateFilter || createdDate === dateFilter;
      return matchesStatus && matchesAssigned && matchesDate;
    });
  }, [followups, statusFilter, assignedFilter, dateFilter]);

  const pendingCount = followups.filter((f) => f.status === 'pending').length;
  const doneCount = followups.filter((f) => f.status === 'done').length;

  const handleMarkDone = async (id) => {
    try {
      await followupsApi.patch(id, { status: 'done' });
      setFollowups((prev) => prev.map((f) => f.id === id ? { ...f, status: 'done' } : f));
    } catch (err) {
      setError(err.message || 'Update failed');
    }
  };

  const handleCreateFollowup = async () => {
    if (!assignedTo || !notes.trim() || !callIdInput) return;
    try {
      setCreating(true);
      const res = await followupsApi.create({
        call_id: parseInt(callIdInput, 10),
        assigned_to: parseInt(assignedTo, 10),
        notes: notes.trim(),
      });
      if (res?.data) {
        setFollowups((prev) => [res.data, ...prev]);
      }
      setOpenCreateDialog(false);
      setAssignedTo('');
      setNotes('');
      setCallIdInput('');
    } catch (err) {
      setError(err.message || 'Failed to create follow-up');
    } finally {
      setCreating(false);
    }
  };

  const openFollowupDrawer = (item) => {
    setSelectedFollowup(item);
    setEditableNotes(item.notes || '');
    setEditableStatus(item.status);
    setIsEditMode(false);
    setOpenDrawer(true);
  };

  const handleSaveFollowup = async () => {
    if (!selectedFollowup) return;
    try {
      await followupsApi.patch(selectedFollowup.id, {
        notes: editableNotes,
        status: editableStatus,
      });
      setFollowups((prev) =>
        prev.map((f) =>
          f.id === selectedFollowup.id
            ? { ...f, notes: editableNotes, status: editableStatus }
            : f
        )
      );
      setIsEditMode(false);
      setOpenDrawer(false);
    } catch (err) {
      setError(err.message || 'Save failed');
    }
  };

  const uniqueAssignees = [...new Set(followups.map((f) => f.assigned_to_username).filter(Boolean))];

  const statusChip = (status) => {
    if (status === 'pending') {
      return (
        <Chip label="Pending" size="small" sx={{
          borderRadius: '10px',
          bgcolor: alpha(theme.palette.warning.main, 0.12),
          color: theme.palette.warning.dark,
        }} />
      );
    }
    if (status === 'in_progress') {
      return (
        <Chip label="In Progress" size="small" sx={{
          borderRadius: '10px',
          bgcolor: alpha(theme.palette.info.main, 0.12),
          color: theme.palette.info.dark,
        }} />
      );
    }
    return (
      <Chip label="Done" size="small" sx={{
        borderRadius: '10px',
        bgcolor: alpha(theme.palette.success.main, 0.12),
        color: theme.palette.success.dark,
      }} />
    );
  };

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>
      )}

      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
            spacing={2} sx={{ mb: 3 }}
          >
            <Typography variant="h4" gutterBottom sx={{ padding: '16px 2px' }}>
              Follow-ups Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<IconPlus size={18} />}
              onClick={() => setOpenCreateDialog(true)}
              sx={{ borderRadius: '14px', textTransform: 'none', px: 2.5, height: 44, fontWeight: 600 }}
            >
              Create
            </Button>
          </Stack>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: '20px', boxShadow: 'none', border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}` }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.12), color: theme.palette.primary.main }}>
                      <IconClipboardText size={20} />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Total Follow-ups</Typography>
                      <Typography variant="h4" fontWeight={700}>{followups.length}</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: '20px', boxShadow: 'none', border: `1px solid ${alpha(theme.palette.warning.main, 0.15)}` }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.12), color: theme.palette.warning.main }}>
                      <IconClockHour4 size={20} />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Pending</Typography>
                      <Typography variant="h4" fontWeight={700}>{pendingCount}</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: '20px', boxShadow: 'none', border: `1px solid ${alpha(theme.palette.success.main, 0.15)}` }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.12), color: theme.palette.success.main }}>
                      <IconChecks size={20} />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Completed</Typography>
                      <Typography variant="h4" fontWeight={700}>{doneCount}</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)} sx={{ borderRadius: 2 }}>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="done">Done</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Assigned To</InputLabel>
                <Select value={assignedFilter} label="Assigned To" onChange={(e) => setAssignedFilter(e.target.value)} sx={{ borderRadius: 2 }}>
                  <MenuItem value="all">All</MenuItem>
                  {uniqueAssignees.map((name) => (
                    <MenuItem key={name} value={name}>{name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField fullWidth size="small" type="date" label="Date"
                value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Button fullWidth variant="outlined" startIcon={<IconRefresh size={18} />}
                onClick={() => { setStatusFilter('all'); setAssignedFilter('all'); setDateFilter(''); }}
                sx={{ height: '40px', borderRadius: 2, textTransform: 'none' }}>
                Reset
              </Button>
            </Grid>
          </Grid>

          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Call ID</TableCell>
                  <TableCell sx={{ width: 180 }}>Assigned To</TableCell>
                  <TableCell sx={{ width: 120 }}>Status</TableCell>
                  <TableCell sx={{ minWidth: 260 }}>Notes</TableCell>
                  <TableCell sx={{ width: 140, display: { xs: 'none', md: 'table-cell' } }}>Created At</TableCell>
                  <TableCell align="center" sx={{ width: 240 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : filtered.map((item) => (
                  <TableRow key={item.id} sx={{ '& td': { py: 1.5 } }}>
                    <TableCell>
                      <Typography>#{item.call_id || item.call}</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1.2} alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: alpha(theme.palette.primary.main, 0.12), color: theme.palette.primary.main }}>
                          <IconUser size={16} />
                        </Avatar>
                        <Typography>{item.assigned_to_username}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{statusChip(item.status)}</TableCell>
                    <TableCell sx={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.notes}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <Box component="span" sx={{ unicodeBidi: 'isolate', display: 'inline-block' }}>
                        {item.created_at ? item.created_at.split('T')[0] : ''}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button size="small" variant="outlined" onClick={() => openFollowupDrawer(item)}
                          sx={{ borderRadius: '10px', textTransform: 'none', minWidth: 95 }}>
                          View
                        </Button>
                        <Button size="small" variant="contained" color="success"
                          disabled={item.status === 'done'}
                          onClick={() => handleMarkDone(item.id)}
                          sx={{ borderRadius: '10px', textTransform: 'none', boxShadow: 'none', minWidth: 120 }}>
                          Mark Done
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Box sx={{ py: 5, textAlign: 'center' }}>
                        <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5 }}>No follow-ups found</Typography>
                        <Typography variant="body2" color="text.secondary">No follow-ups match the selected filters.</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>

      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)}
        fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Create Follow-up</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Call ID" size="small" value={callIdInput} type="number"
                onChange={(e) => setCallIdInput(e.target.value)}
                sx={{ width: '215px', '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Assigned To (User ID)" size="small" value={assignedTo} type="number"
                onChange={(e) => setAssignedTo(e.target.value)}
                sx={{ width: '215px', '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
                helperText="Enter the numeric user ID"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Notes" multiline minRows={4} value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{ width: '450px', '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenCreateDialog(false)} variant="outlined"
            sx={{ color: 'text.secondary', borderColor: 'grey.400' }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreateFollowup}
            disabled={!assignedTo || !notes.trim() || !callIdInput || creating}
            sx={{ borderRadius: '10px', textTransform: 'none', px: 2.5 }}>
            {creating ? <CircularProgress size={18} color="inherit" /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Drawer anchor="right" open={openDrawer} onClose={() => setOpenDrawer(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 450 }, borderRadius: { xs: 0, sm: '20px 0 0 20px' } } }}>
        <Box sx={{ p: 3 }}>
          {selectedFollowup && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Follow-up Details</Typography>
                <IconButton onClick={() => setOpenDrawer(false)} size="small"><IconX size={18} /></IconButton>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>Call ID</Typography>
              <Typography sx={{ mb: 2 }}>#{selectedFollowup.call_id || selectedFollowup.call}</Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>Assigned To</Typography>
              <Typography sx={{ mb: 2 }}>{selectedFollowup.assigned_to_username}</Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>Status</Typography>
              {isEditMode ? (
                <Select fullWidth size="small" value={editableStatus}
                  onChange={(e) => setEditableStatus(e.target.value)} sx={{ mb: 2 }}>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="done">Done</MenuItem>
                </Select>
              ) : (
                <Box sx={{ mb: 2 }}>{statusChip(selectedFollowup.status)}</Box>
              )}

              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>Notes</Typography>
              {isEditMode ? (
                <TextField fullWidth multiline minRows={3} value={editableNotes}
                  onChange={(e) => setEditableNotes(e.target.value)} sx={{ mb: 2 }} />
              ) : (
                <Typography variant="body2" sx={{ mb: 2 }}>{selectedFollowup.notes}</Typography>
              )}

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Created: {selectedFollowup.created_at ? selectedFollowup.created_at.split('T')[0] : ''}
              </Typography>

              <Stack direction="row" spacing={1}>
                {isEditMode ? (
                  <>
                    <Button variant="contained" startIcon={<IconDeviceFloppy size={16} />}
                      onClick={handleSaveFollowup}>Save</Button>
                    <Button variant="outlined" onClick={() => setIsEditMode(false)}>Cancel</Button>
                  </>
                ) : (
                  <Button variant="outlined" startIcon={<IconEdit size={16} />}
                    onClick={() => setIsEditMode(true)}>Edit</Button>
                )}
              </Stack>
            </>
          )}
        </Box>
      </Drawer>
    </>
  );
}