import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Avatar, Box, Button, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, Grid, InputLabel, MenuItem,
  Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Typography, alpha, useTheme, Drawer, Divider,
  IconButton, CircularProgress, Alert, TablePagination, Autocomplete
} from '@mui/material';
import {
  IconChecks, IconClipboardText, IconPlus,
  IconClockHour4, IconX, IconEdit, IconDeviceFloppy,
  IconEye, IconArrowUp, IconArrowDown, IconUser
} from '@tabler/icons-react';
import { followupsApi } from 'api/api';
import PageCard from 'ui-component/PageCard';
import PageTitle from 'ui-component/PageTitle';
import FilterToolbar from 'ui-component/FilterToolbar';
import FilterPopover from 'ui-component/FilterPopover';
import StatSummaryCard from 'ui-component/StatSummaryCard';
import {
  TABLE_LAYOUT_SX,
  TABLE_ACTIONS_CELL_SX,
  TABLE_HEADER_CELL_SX,
  TABLE_HEADER_SORT_SX,
  TABLE_BODY_CELL_SX
} from 'constants/table';
import StatusChip from 'ui-component/StatusChip';
import DialogCancelButton from 'ui-component/DialogCancelButton';

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

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>
      )}

      <PageCard bordered>
          <PageTitle title="Follow-ups Management" />

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <StatSummaryCard icon={<IconClipboardText size={20} />} label="Total Follow-ups" value={followups.length} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <StatSummaryCard icon={<IconClockHour4 size={20} />} label="Pending" value={pendingCount} color="warning" />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <StatSummaryCard icon={<IconChecks size={20} />} label="Completed" value={doneCount} color="success" />
            </Grid>
          </Grid>

          <FilterToolbar
            search={dateFilter}
            onSearchChange={(e) => setDateFilter(e.target.value)}
            searchPlaceholder="Search by date..."
            activeFilterCount={activeFilterCount}
            onOpenFilters={openFilters}
            onResetFilters={handleReset}
            actions={(
              <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => setOpenCreateDialog(true)}>
                Create
              </Button>
            )}
          />

          <FilterPopover
            open={Boolean(filterAnchorEl)}
            anchorEl={filterAnchorEl}
            onClose={closeFilters}
            title="Filter Follow-ups"
          >
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
          </FilterPopover>

          {/* Table */}
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <Table size="small" sx={TABLE_LAYOUT_SX}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ ...TABLE_HEADER_CELL_SX, width: '14%' }}>
                    <Box component="span" sx={TABLE_HEADER_SORT_SX}>
                      Call ID
                      <IconButton size="small" onClick={() => handleSort('call_id')} sx={{ p: 0, flexShrink: 0 }}>
                        {getSortIcon('call_id')}
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ ...TABLE_HEADER_CELL_SX, width: '18%' }}>
                    <Box component="span" sx={TABLE_HEADER_SORT_SX}>
                      Assigned To
                      <IconButton size="small" onClick={() => handleSort('assigned_to')} sx={{ p: 0, flexShrink: 0 }}>
                        {getSortIcon('assigned_to')}
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ ...TABLE_HEADER_CELL_SX, width: '14%' }}>Status</TableCell>
                  <TableCell sx={{ ...TABLE_HEADER_CELL_SX, width: '26%' }}>Notes</TableCell>
                  <TableCell sx={{ ...TABLE_HEADER_CELL_SX, width: '14%' }}>
                    <Box component="span" sx={TABLE_HEADER_SORT_SX}>
                      Created At
                      <IconButton size="small" onClick={() => handleSort('created_at')} sx={{ p: 0, flexShrink: 0 }}>
                        {getSortIcon('created_at')}
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell align="center" sx={{ ...TABLE_ACTIONS_CELL_SX, ...TABLE_HEADER_CELL_SX }}>Actions</TableCell>
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
                  <TableRow key={item.id} hover>
                    <TableCell sx={TABLE_BODY_CELL_SX}>
                      #{item.call_id || item.call}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: alpha(theme.palette.primary.main, 0.12), color: theme.palette.primary.main }}>
                          <IconUser size={14} />
                        </Avatar>
                        <Typography sx={{ whiteSpace: 'nowrap' }}>{item.assigned_to_username}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell><StatusChip status={item.status} /></TableCell>
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
                          sx={{ color: 'info.main' }}
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
      </PageCard>

      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} fullWidth maxWidth="sm">
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
          <DialogCancelButton onClick={() => setOpenCreateDialog(false)} />
          <Button variant="contained" onClick={handleCreateFollowup}
            disabled={!assignedTo || !notes.trim() || !callIdInput || creating}
            sx={{ px: 2.5 }}>
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
                <Box sx={{ mb: 2 }}><StatusChip status={selectedFollowup.status} /></Box>
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