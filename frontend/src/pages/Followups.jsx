import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box, Button, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, Grid, InputLabel, MenuItem,
  Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Typography, Drawer, Divider,
  IconButton, CircularProgress, Alert, TablePagination, Autocomplete
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  IconChecks, IconClipboardText, IconPlus,
  IconClockHour4, IconX, IconEdit, IconDeviceFloppy,
  IconEye, IconArrowUp, IconArrowDown, IconMessage, IconWriting, IconTrash,
} from '@tabler/icons-react';
import { followupsApi } from 'api/api';
import { API_URL } from 'api/baseUrl';
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
import UserAvatarWithName from 'ui-component/UserAvatarWithName';
import useAuth from 'hooks/useAuth';
import useTranslation from 'hooks/useTranslation';
import usePaginationLabels from 'hooks/usePaginationLabels';

const rowsPerPage = 6;

const followupStatusColor = {
  pending: 'warning',
  in_progress: 'info',
  done: 'success',
};

const creatorNotesBoxSx = {
  p: 2,
  mb: 2,
  borderRadius: 1.5,
  bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1),
  border: '1px solid',
  borderColor: 'warning.light',
};

const assigneeNotesBoxSx = {
  p: 2,
  mb: 2,
  borderRadius: 1.5,
  bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
  border: '1px solid',
  borderColor: 'info.light',
};

export default function Followups() {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  const paginationLabels = usePaginationLabels();
  const role = (user?.role || '').toLowerCase();
  const isManager = role === 'manager';
  const isQA = role === 'qa';
  const canCreateFollowup = isManager || isQA;
  const currentUserId = user?.id;
  const currentUsername = (user?.user || user?.username || '').toLowerCase();

  const [followups, setFollowups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);

  const [statusFilter, setStatusFilter] = useState('all');
  const [createdByFilter, setCreatedByFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  // Sorting states
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [assignedTo, setAssignedTo] = useState('');
  const [creatorNotes, setCreatorNotes] = useState('');
  const [callIdInput, setCallIdInput] = useState('');
  const [creating, setCreating] = useState(false);

  const [openDrawer, setOpenDrawer] = useState(false);
  const [selectedFollowup, setSelectedFollowup] = useState(null);
  const [editableAssigneeNotes, setEditableAssigneeNotes] = useState('');
  const [editableCreatorNotes, setEditableCreatorNotes] = useState('');
  const [editableStatus, setEditableStatus] = useState('pending');
  const [isEditMode, setIsEditMode] = useState(false);
  const [savingFollowup, setSavingFollowup] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [followupToDelete, setFollowupToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const matchFollowupUserId = (fieldId) => {
    if (fieldId == null || currentUserId == null) return false;
    return Number(fieldId) === Number(currentUserId);
  };

  const isFollowupCreator = (item) => {
    if (!item) return false;
    if (matchFollowupUserId(item.created_by)) return true;
    return (item.created_by_username || '').toLowerCase() === currentUsername;
  };

  const isFollowupAssignee = (item) => {
    if (!item) return false;
    if (matchFollowupUserId(item.assigned_to)) return true;
    return (item.assigned_to_username || '').toLowerCase() === currentUsername;
  };

  const canEditFollowup = (item) => (
    !isManager
    && item?.status !== 'done'
    && (isFollowupCreator(item) || isFollowupAssignee(item))
  );

  const canDeleteFollowup = (item) => !isManager && isFollowupCreator(item);

  const visibleFollowups = useMemo(() => {
    if (isManager) return followups;
    return followups.filter((f) => isFollowupCreator(f) || isFollowupAssignee(f));
  }, [followups, isManager, currentUserId, currentUsername]);

  // Filter popover state
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const openFilters = (event) => setFilterAnchorEl(event.currentTarget);
  const closeFilters = () => setFilterAnchorEl(null);

  // Active filters count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (createdByFilter !== 'all') count++;
    if (dateFilter) count++;
    return count;
  }, [statusFilter, createdByFilter, dateFilter]);

  // Reset all filters
  const handleReset = () => {
    setStatusFilter('all');
    setCreatedByFilter('all');
    setDateFilter('');
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(0);
  };

  useEffect(() => {
    loadFollowups();
    if (canCreateFollowup) {
      loadUsers();
    }
  }, [canCreateFollowup]);

  useEffect(() => {
    if (location.state?.openCreateFollowup) {
      setOpenCreateDialog(true);
      setCallIdInput(location.state.callId ? String(location.state.callId) : '');
      if (location.state.creatorNotes) {
        setCreatorNotes(location.state.creatorNotes);
      }
      if (location.state.assignedToUsername && users.length) {
        const match = users.find(
          (u) => (u.username || '').toLowerCase() === location.state.assignedToUsername.toLowerCase()
        );
        if (match) setAssignedTo(match.id);
      } else if (isQA && currentUserId && !assignedTo) {
        setAssignedTo(currentUserId);
      }
      window.history.replaceState({}, document.title);
    }
    if (location.state?.filter === 'assignee' && location.state?.value) {
      setCreatedByFilter(location.state.value);
      setPage(0);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, users, isQA, currentUserId, assignedTo]);

  const handleMarkDone = async () => {
    if (!selectedFollowup || !isFollowupAssignee(selectedFollowup)) return;
    if (!editableAssigneeNotes.trim()) {
      setError(t('followups.notesRequired'));
      return;
    }
    try {
      setSavingFollowup(true);
      await followupsApi.patch(selectedFollowup.id, {
        status: 'done',
        assignee_notes: editableAssigneeNotes.trim(),
      });
      const updated = {
        ...selectedFollowup,
        status: 'done',
        assignee_notes: editableAssigneeNotes.trim(),
      };
      setFollowups((prev) =>
        prev.map((f) => (f.id === selectedFollowup.id ? updated : f))
      );
      setSelectedFollowup(updated);
      setEditableStatus('done');
      setIsEditMode(false);
    } catch (err) {
      setError(err.message || t('followups.updateFailed'));
    } finally {
      setSavingFollowup(false);
    }
  };

  const loadFollowups = async () => {
    try {
      setLoading(true);
      const res = await followupsApi.list();
      setFollowups(res?.data || []);
    } catch (err) {
      setError(err.message || t('followups.loadFailed'));
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
    let result = visibleFollowups.filter((f) => {
      const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
      const creatorName = f.created_by_username || '';
      const matchesCreatedBy = createdByFilter === 'all' || creatorName === createdByFilter;
      const createdDate = f.created_at ? f.created_at.split('T')[0] : '';
      const matchesDate = !dateFilter || createdDate === dateFilter;
      return matchesStatus && matchesCreatedBy && matchesDate;
    });

    // Then sort
    result = [...result].sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'call_id':
          aVal = a.call_id || a.call;
          bVal = b.call_id || b.call;
          break;
        case 'created_by':
          aVal = (a.created_by_username || '').toLowerCase();
          bVal = (b.created_by_username || '').toLowerCase();
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
  }, [visibleFollowups, statusFilter, createdByFilter, dateFilter, sortBy, sortOrder]);

  const paginatedFollowups = filteredAndSorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const pendingCount = visibleFollowups.filter((f) => f.status === 'pending').length;
  const doneCount = visibleFollowups.filter((f) => f.status === 'done').length;

  const handleCreateFollowup = async () => {
    if (!assignedTo || !callIdInput) return;
    try {
      setCreating(true);
      const res = await followupsApi.create({
        call_id: parseInt(callIdInput, 10),
        assigned_to: parseInt(assignedTo, 10),
        creator_notes: creatorNotes.trim(),
      });
      if (res?.data) {
        setFollowups((prev) => [res.data, ...prev]);
      }
      await loadFollowups();
      setOpenCreateDialog(false);
      setAssignedTo('');
      setCreatorNotes('');
      setCallIdInput('');
    } catch (err) {
      setError(err.message || t('followups.createFailed'));
    } finally {
      setCreating(false);
    }
  };

  const handleSaveFollowup = async () => {
    if (!selectedFollowup || isManager || selectedFollowup.status === 'done') return;
    const payload = {};
    if (isFollowupCreator(selectedFollowup)) {
      payload.creator_notes = editableCreatorNotes.trim();
    }
    if (isFollowupAssignee(selectedFollowup)) {
      payload.assignee_notes = editableAssigneeNotes.trim();
      payload.status = editableStatus;
    }
    if (Object.keys(payload).length === 0) return;
    try {
      setSavingFollowup(true);
      await followupsApi.patch(selectedFollowup.id, payload);
      const updated = { ...selectedFollowup, ...payload };
      setFollowups((prev) =>
        prev.map((f) => (f.id === selectedFollowup.id ? updated : f))
      );
      setSelectedFollowup(updated);
      setIsEditMode(false);
    } catch (err) {
      setError(err.message || t('followups.saveFailed'));
    } finally {
      setSavingFollowup(false);
    }
  };

  const handleDeleteFollowup = async () => {
    if (!followupToDelete) return;
    try {
      setDeleting(true);
      await followupsApi.delete(followupToDelete.id);
      setFollowups((prev) => prev.filter((f) => f.id !== followupToDelete.id));
      if (selectedFollowup?.id === followupToDelete.id) {
        closeFollowupDrawer();
      }
      setOpenDeleteDialog(false);
      setFollowupToDelete(null);
    } catch (err) {
      setError(err.message || t('followups.deleteFailed'));
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteConfirm = (item) => {
    setFollowupToDelete(item);
    setOpenDeleteDialog(true);
  };

  const openFollowupDrawer = (item, edit = false) => {
    setSelectedFollowup(item);
    setEditableCreatorNotes(item.creator_notes || '');
    setEditableAssigneeNotes(item.assignee_notes || '');
    setEditableStatus(item.status);
    setIsEditMode(edit);
    setOpenDrawer(true);
  };

  const closeFollowupDrawer = () => {
    setOpenDrawer(false);
    setSelectedFollowup(null);
    setIsEditMode(false);
  };

  const uniqueCreators = [...new Set(visibleFollowups.map((f) => f.created_by_username).filter(Boolean))];

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>
      )}

      {createdByFilter !== 'all' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('followups.showingCreatedBy', { name: createdByFilter })}
        </Alert>
      )}

      <PageCard bordered>
          <PageTitle title={t('followups.title')} />

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <StatSummaryCard icon={<IconClipboardText size={20} />} label={t('followups.total')} value={visibleFollowups.length} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <StatSummaryCard icon={<IconClockHour4 size={20} />} label={t('followups.pending')} value={pendingCount} color="warning" />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <StatSummaryCard icon={<IconChecks size={20} />} label={t('followups.completed')} value={doneCount} color="success" />
            </Grid>
          </Grid>

          <FilterToolbar
            search={dateFilter}
            onSearchChange={(e) => setDateFilter(e.target.value)}
            searchPlaceholder={t('followups.searchPlaceholder')}
            activeFilterCount={activeFilterCount}
            onOpenFilters={openFilters}
            onResetFilters={handleReset}
            actions={canCreateFollowup ? (
              <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => {
                if (isQA && currentUserId) setAssignedTo(currentUserId);
                setOpenCreateDialog(true);
              }}>
                {t('common.create')}
              </Button>
            ) : null}
          />

          <FilterPopover
            open={Boolean(filterAnchorEl)}
            anchorEl={filterAnchorEl}
            onClose={closeFilters}
            title={t('followups.filterTitle')}
          >
            <FormControl fullWidth size="small">
              <InputLabel>{t('common.status')}</InputLabel>
              <Select value={statusFilter} label={t('common.status')} onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="all">{t('common.all')}</MenuItem>
                <MenuItem value="pending">{t('status.pending')}</MenuItem>
                <MenuItem value="in_progress">{t('status.in_progress')}</MenuItem>
                <MenuItem value="done">{t('status.done')}</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>{t('followups.createdBy')}</InputLabel>
              <Select value={createdByFilter} label={t('followups.createdBy')} onChange={(e) => setCreatedByFilter(e.target.value)}>
                <MenuItem value="all">{t('common.all')}</MenuItem>
                {uniqueCreators.map((name) => (
                  <MenuItem key={name} value={name}>{name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth size="small" type="date" label={t('common.date')}
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
                      {t('followups.callId')}
                      <IconButton size="small" onClick={() => handleSort('call_id')} sx={{ p: 0, flexShrink: 0 }}>
                        {getSortIcon('call_id')}
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ ...TABLE_HEADER_CELL_SX, width: '18%' }}>
                    <Box component="span" sx={TABLE_HEADER_SORT_SX}>
                      {t('followups.createdBy')}
                      <IconButton size="small" onClick={() => handleSort('created_by')} sx={{ p: 0, flexShrink: 0 }}>
                        {getSortIcon('created_by')}
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ ...TABLE_HEADER_CELL_SX, width: '12%' }}>{t('common.status')}</TableCell>
                  <TableCell sx={{ ...TABLE_HEADER_CELL_SX, width: '18%' }}>{t('followups.creatorNotes')}</TableCell>
                  <TableCell sx={{ ...TABLE_HEADER_CELL_SX, width: '18%' }}>{t('followups.followUpNotes')}</TableCell>
                  <TableCell sx={{ ...TABLE_HEADER_CELL_SX, width: '12%' }}>
                    <Box component="span" sx={TABLE_HEADER_SORT_SX}>
                      {t('table.createdAt')}
                      <IconButton size="small" onClick={() => handleSort('created_at')} sx={{ p: 0, flexShrink: 0 }}>
                        {getSortIcon('created_at')}
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell align="center" sx={{ ...TABLE_ACTIONS_CELL_SX, ...TABLE_HEADER_CELL_SX }}>{t('common.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : paginatedFollowups.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={TABLE_BODY_CELL_SX}>
                      #{item.call_id || item.call}
                    </TableCell>
                    <TableCell>
                      <UserAvatarWithName
                        username={item.created_by_username}
                        role={item.created_by_role || 'qa'}
                        avatar={item.created_by_avatar}
                        avatarStyle={item.created_by_avatar_style}
                      />
                    </TableCell>
                    <TableCell><StatusChip status={item.status} /></TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        title={item.creator_notes}
                      >
                        {item.creator_notes || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        title={item.assignee_notes}
                      >
                        {item.assignee_notes || '—'}
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
                          onClick={() => openFollowupDrawer(item, false)}
                          title={t('followups.viewFollowup')}
                        >
                          <IconEye size={18} />
                        </IconButton>
                        {canEditFollowup(item) && (
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => openFollowupDrawer(item, true)}
                            title={t('followups.editFollowup')}
                          >
                            <IconEdit size={18} />
                          </IconButton>
                        )}
                        {canDeleteFollowup(item) && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => openDeleteConfirm(item)}
                            title={t('followups.deleteFollowup')}
                          >
                            <IconTrash size={18} />
                          </IconButton>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && paginatedFollowups.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Box sx={{ py: 5, textAlign: 'center' }}>
                        <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5 }}>{t('followups.noFollowupsFound')}</Typography>
                        <Typography variant="body2" color="text.secondary">{t('followups.noMatchFilters')}</Typography>
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
              {...paginationLabels}
            />
          </Box>
      </PageCard>

      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>{t('followups.createFollowup')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label={t('followups.callId')} size="small" value={callIdInput} type="number"
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
                    label={t('followups.assignedTo')}
                    size="small"
                    placeholder={t('followups.searchUserPlaceholder')}
                    fullWidth
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <UserAvatarWithName
                      username={option.username}
                      role={option.role}
                      avatar={option.avatar}
                      avatarStyle={option.avatar_style}
                      size={24}
                    />
                  </li>
                )}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label={t('followups.creatorNotes')} multiline minRows={3} value={creatorNotes}
                onChange={(e) => setCreatorNotes(e.target.value)}
                fullWidth
                placeholder={t('followups.creatorNotesPlaceholder')}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <DialogCancelButton onClick={() => setOpenCreateDialog(false)} />
          <Button variant="contained" onClick={handleCreateFollowup}
            disabled={!assignedTo || !callIdInput || creating}
            sx={{ px: 2.5 }}>
            {creating ? <CircularProgress size={18} color="inherit" /> : t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Follow-up Drawer */}
      <Drawer anchor="right" open={openDrawer} onClose={closeFollowupDrawer}>
        <Box sx={{ width: { xs: 320, sm: 420 }, p: 3 }}>
          {selectedFollowup && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: (theme) => theme.palette[followupStatusColor[selectedFollowup.status] || 'grey']?.main || theme.palette.text.disabled,
                  }} />
                  <Typography variant="h5">
                    {t('followups.followUpTitle', { id: selectedFollowup.id })}
                  </Typography>
                  {canEditFollowup(selectedFollowup) && (
                    <IconButton
                      size="small"
                      title={isEditMode ? t('common.save') : t('followups.editFollowup')}
                      onClick={() => { if (isEditMode) { handleSaveFollowup(); } else { setIsEditMode(true); } }}
                      sx={{ color: 'text.primary' }}
                    >
                      {isEditMode ? <IconDeviceFloppy size={22} /> : <IconEdit size={18} />}
                    </IconButton>
                  )}
                </Box>
                <IconButton onClick={closeFollowupDrawer} size="small"><IconX size={18} /></IconButton>
              </Box>

              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {selectedFollowup.created_at ? selectedFollowup.created_at.split('T')[0] : '—'}
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Typography variant="body2" color="text.secondary">{t('followups.createdByLower')}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {selectedFollowup.created_by_username || '—'}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Typography variant="body2" color="text.secondary">{t('followups.assignedToLower')}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {selectedFollowup.assigned_to_username || '—'}
                  </Typography>
                </Stack>
              </Stack>

              <Divider sx={{ my: 2 }} />

              {!isManager && isEditMode && isFollowupAssignee(selectedFollowup) && selectedFollowup.status !== 'done' ? (
                <>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>{t('common.status')}</Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={editableStatus}
                    onChange={(e) => setEditableStatus(e.target.value)}
                    sx={{ mb: 2 }}
                  >
                    <MenuItem value="pending">{t('status.pending')}</MenuItem>
                    <MenuItem value="in_progress">{t('status.in_progress')}</MenuItem>
                  </Select>
                  <Divider sx={{ my: 2 }} />
                </>
              ) : (
                <>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>{t('common.status')}</Typography>
                  <Box sx={{ mb: 2 }}>
                    <StatusChip status={selectedFollowup.status} />
                  </Box>
                  <Divider sx={{ my: 2 }} />
                </>
              )}

              <Box sx={creatorNotesBoxSx}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, color: 'warning.dark' }}>
                  <IconMessage size={18} />
                  <Typography variant="subtitle2" color="warning.dark" fontWeight={700}>
                    {t('followups.creatorNotes')}
                  </Typography>
                </Stack>
                {isEditMode && isFollowupCreator(selectedFollowup) && selectedFollowup.status !== 'done' ? (
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    value={editableCreatorNotes}
                    onChange={(e) => setEditableCreatorNotes(e.target.value)}
                    placeholder={t('followups.creatorNotesPlaceholder')}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'background.paper',
                      },
                    }}
                  />
                ) : (
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedFollowup.creator_notes || '—'}
                  </Typography>
                )}
              </Box>

              <Box sx={assigneeNotesBoxSx}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, color: 'info.dark' }}>
                  <IconWriting size={18} />
                  <Typography variant="subtitle2" color="info.dark" fontWeight={700}>
                    {t('followups.followUpNotes')}
                  </Typography>
                </Stack>
                {!isManager && isEditMode && isFollowupAssignee(selectedFollowup) && selectedFollowup.status !== 'done' ? (
                  <TextField
                    fullWidth
                    multiline
                    minRows={4}
                    value={editableAssigneeNotes}
                    onChange={(e) => setEditableAssigneeNotes(e.target.value)}
                    placeholder={t('followups.assigneeNotesPlaceholder')}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'background.paper',
                      },
                    }}
                  />
                ) : (
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedFollowup.assignee_notes || '—'}
                  </Typography>
                )}
              </Box>

              {isEditMode && isFollowupAssignee(selectedFollowup) && selectedFollowup.status !== 'done' && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={savingFollowup ? <CircularProgress size={18} color="inherit" /> : <IconChecks size={18} />}
                  onClick={handleMarkDone}
                  disabled={!editableAssigneeNotes.trim() || savingFollowup}
                  fullWidth
                  sx={{ mt: 1 }}
                >
                  {t('followups.markAsDone')}
                </Button>
              )}

              {canDeleteFollowup(selectedFollowup) && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<IconTrash size={18} />}
                  onClick={() => openDeleteConfirm(selectedFollowup)}
                  fullWidth
                  sx={{ mt: 1 }}
                >
                  {t('followups.deleteFollowup')}
                </Button>
              )}
            </>
          )}
        </Box>
      </Drawer>

      <Dialog open={openDeleteDialog} onClose={() => { setOpenDeleteDialog(false); setFollowupToDelete(null); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{t('followups.deleteFollowup')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {t('followups.deleteConfirmBody', {
              id: followupToDelete?.id,
              callId: followupToDelete?.call_id || followupToDelete?.call,
            })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <DialogCancelButton onClick={() => { setOpenDeleteDialog(false); setFollowupToDelete(null); }} />
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteFollowup}
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={18} color="inherit" /> : t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}