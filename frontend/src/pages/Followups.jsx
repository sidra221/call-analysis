import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Avatar, Box, Button, Card, CardContent, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, Grid, InputLabel, MenuItem,
  Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Typography, alpha, useTheme, Drawer, Divider,
  IconButton, CircularProgress, Alert, Popover, Badge, InputAdornment,
  TablePagination, Autocomplete
} from '@mui/material';
import {
  IconChecks, IconClipboardText, IconPlus, IconUser,
  IconClockHour4, IconRefresh, IconX, IconEdit, IconDeviceFloppy,
  IconEye, IconSearch, IconAdjustmentsHorizontal,
  IconArrowUp, IconArrowDown
} from '@tabler/icons-react';
import { followupsApi } from 'api/api';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const rowsPerPage = 6;

export default function Followups() {
  const theme = useTheme();
  const location = useLocation();

  const [followups, setFollowups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);

  const [statusFilter, setStatusFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  // Sorting states
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

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

  // Filter popover state
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const openFilters = (event) => setFilterAnchorEl(event.currentTarget);
  const closeFilters = () => setFilterAnchorEl(null);

  // Active filters count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (assignedFilter !== 'all') count++;
    if (dateFilter) count++;
    return count;
  }, [statusFilter, assignedFilter, dateFilter]);

  // Reset all filters
  const handleReset = () => {
    setStatusFilter('all');
    setAssignedFilter('all');
    setDateFilter('');
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(0);
  };

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
      const token = localStorage.getItem('access_token');
      // Use the new endpoint for followups
      const res = await fetch(`${API_URL}/api/accounts/users-for-followups/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(data?.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
      setUsers([]);
    }
  };

  // Sorting function
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(0);
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) {
      return <IconArrowUp size={14} style={{ opacity: 0.4 }} />;
    }
    return sortOrder === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />;
  };

  const filteredAndSorted = useMemo(() => {
    // First filter
    let result = followups.filter((f) => {
      const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
      const assignedName = f.assigned_to_username || '';
      const matchesAssigned = assignedFilter === 'all' || assignedName === assignedFilter;
      const createdDate = f.created_at ? f.created_at.split('T')[0] : '';
      const matchesDate = !dateFilter || createdDate === dateFilter;
      return matchesStatus && matchesAssigned && matchesDate;
    });

    // Then sort
    result = [...result].sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'call_id':
          aVal = a.call_id || a.call;
          bVal = b.call_id || b.call;
          break;
        case 'assigned_to':
          aVal = (a.assigned_to_username || '').toLowerCase();
          bVal = (b.assigned_to_username || '').toLowerCase();
          break;
        case 'created_at':
          aVal = new Date(a.created_at);
          bVal = new Date(b.created_at);
          break;
        default:
          aVal = a.created_at;
          bVal = b.created_at;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return result;
  }, [followups, statusFilter, assignedFilter, dateFilter, sortBy, sortOrder]);

  const paginatedFollowups = filteredAndSorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
      await loadFollowups();
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

      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ padding: '16px 2px' }}>
            Follow-ups Management
          </Typography>

          {/* Stats Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
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
              <Card sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
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
              <Card sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
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

          {/* Filters Row */}
          <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth size="small" placeholder="Search by date..."
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconSearch size={18} style={{ color: '#9e9e9e' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      {dateFilter ? (
                        <IconButton size="small" onClick={() => setDateFilter('')}>
                          <IconX size={14} />
                        </IconButton>
                      ) : null}
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid size={{ xs: 6, md: 'auto' }}>
              <Badge badgeContent={activeFilterCount} color="primary">
                <Button
                  variant="outlined"
                  startIcon={<IconAdjustmentsHorizontal size={18} />}
                  onClick={openFilters}
                  sx={{
                    borderRadius: 2, textTransform: 'none', fontWeight: 600, height: 40,
                    borderColor: activeFilterCount > 0 ? 'primary.main' : 'divider',
                    bgcolor: activeFilterCount > 0 ? 'primary.light' : 'transparent'
                  }}
                >
                  Filters
                </Button>
              </Badge>
            </Grid>

            {activeFilterCount > 0 && (
              <Grid size={{ xs: 6, md: 'auto' }}>
                <Button
                  variant="text" color="error"
                  startIcon={<IconRefresh size={18} />}
                  onClick={handleReset}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Reset All
                </Button>
              </Grid>
            )}

            <Grid size={{ xs: 12, md: 'auto' }} sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<IconPlus size={18} />}
                onClick={() => setOpenCreateDialog(true)}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, height: 40 }}
              >
                Create
              </Button>
            </Grid>
          </Grid>

          {/* Filters Popover */}
          <Popover
            open={Boolean(filterAnchorEl)}
            anchorEl={filterAnchorEl}
            onClose={closeFilters}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            PaperProps={{ sx: { p: 3, width: 280, borderRadius: 3, mt: 1.5 } }}
          >
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>Filter Follow-ups</Typography>
            <Stack spacing={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="done">Done</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Assigned To</InputLabel>
                <Select value={assignedFilter} label="Assigned To" onChange={(e) => setAssignedFilter(e.target.value)}>
                  <MenuItem value="all">All</MenuItem>
                  {uniqueAssignees.map((name) => (
                    <MenuItem key={name} value={name}>{name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth size="small" type="date" label="Date"
                value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              <Button variant="contained" fullWidth onClick={closeFilters} sx={{ borderRadius: 2, textTransform: 'none' }}>
                Apply Filters
              </Button>
            </Stack>
          </Popover>

          {/* Table */}
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 650, tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '14%', whiteSpace: 'nowrap' }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Typography variant="body2" fontWeight={600}>Call ID</Typography>
                      <IconButton size="small" onClick={() => handleSort('call_id')} sx={{ p: 0 }}>
                        {getSortIcon('call_id')}
                      </IconButton>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ width: '16%', whiteSpace: 'nowrap' }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Typography variant="body2" fontWeight={600}>Assigned To</Typography>
                      <IconButton size="small" onClick={() => handleSort('assigned_to')} sx={{ p: 0 }}>
                        {getSortIcon('assigned_to')}
                      </IconButton>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ width: '12%', whiteSpace: 'nowrap' }}>Status</TableCell>
                  <TableCell sx={{ width: '28%', whiteSpace: 'nowrap' }}>Notes</TableCell>
                  <TableCell sx={{ width: '14%', whiteSpace: 'nowrap' }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Typography variant="body2" fontWeight={600}>Created At</Typography>
                      <IconButton size="small" onClick={() => handleSort('created_at')} sx={{ p: 0 }}>
                        {getSortIcon('created_at')}
                      </IconButton>
                    </Stack>
                  </TableCell>
                  <TableCell align="center" sx={{ width: '16%', whiteSpace: 'nowrap' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : paginatedFollowups.map((item) => (
                  <TableRow key={item.id} sx={{ '& td': { py: 1.5 } }}>
                    <TableCell>
                      <Typography sx={{ whiteSpace: 'nowrap' }}>#{item.call_id || item.call}</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: alpha(theme.palette.primary.main, 0.12), color: theme.palette.primary.main }}>
                          <IconUser size={14} />
                        </Avatar>
                        <Typography sx={{ whiteSpace: 'nowrap' }}>{item.assigned_to_username}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{statusChip(item.status)}</TableCell>
                    <TableCell>
                      <Typography
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={item.notes}
                      >
                        {item.notes}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box component="span" sx={{ whiteSpace: 'nowrap' }}>
                        {item.created_at ? item.created_at.split('T')[0] : ''}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <IconButton 
                          size="small" 
                          sx={{ color: '#0288d1' }}
                          onClick={() => openFollowupDrawer(item)}
                          title="View Follow-up"
                        >
                          <IconEye size={18} />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="success"
                          disabled={item.status === 'done'}
                          onClick={() => handleMarkDone(item.id)}
                          title="Mark Done"
                        >
                          <IconChecks size={18} />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && paginatedFollowups.length === 0 && (
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

          {/* Pagination */}
          <Box sx={{ mt: 1 }}>
            <TablePagination
              component="div"
              count={filteredAndSorted.length}
              page={page}
              onPageChange={(event, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[]}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Create Dialog - مع Autocomplete للكتابة والاختيار */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)}
        fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Create Follow-up</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Call ID" size="small" value={callIdInput} type="number"
                onChange={(e) => setCallIdInput(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                options={users}
                getOptionLabel={(option) => option.username || ''}
                value={users.find(u => u.id === assignedTo) || null}
                onChange={(event, newValue) => {
                  setAssignedTo(newValue ? newValue.id : '');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Assigned To"
                    size="small"
                    placeholder="Type to search..."
                    fullWidth
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                        {option.username?.[0]?.toUpperCase()}
                      </Avatar>
                      <span>{option.username}</span>
                      <Chip label={option.role} size="small" variant="outlined" />
                    </Stack>
                  </li>
                )}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Notes" multiline minRows={4} value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setOpenCreateDialog(false)} variant="outlined"
            sx={{ color: 'text.secondary', borderColor: 'grey.400' }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreateFollowup}
            disabled={!assignedTo || !notes.trim() || !callIdInput || creating}
            sx={{ borderRadius: 2, textTransform: 'none', px: 2.5 }}>
            {creating ? <CircularProgress size={18} color="inherit" /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Follow-up Drawer */}
      <Drawer anchor="right" open={openDrawer} onClose={() => setOpenDrawer(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 450 } } }}>
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
                <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>{selectedFollowup.notes}</Typography>
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