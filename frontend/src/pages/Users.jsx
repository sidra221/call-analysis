import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
  Box, Button, Typography, IconButton, Dialog,
  DialogTitle, DialogContent, DialogContentText, DialogActions,
  TextField, MenuItem, Stack, Avatar, Checkbox, Chip, Card, CardContent,
  FormControl, InputLabel, Select, Drawer, Divider, Switch,
  FormControlLabel, List, ListItem, ListItemText,
  CircularProgress, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  IconEdit, IconPlus, IconTrashX, IconArrowUp, IconArrowDown,
  IconEye, IconX, IconDeviceFloppy, IconPhone, IconClipboardText,
  IconFileAnalytics, IconHistory
} from '@tabler/icons-react';
import useUsersStore from 'hooks/useUsersStore';
import { usersApi } from 'api/api';
import useAuth from 'hooks/useAuth';
import useTranslation from 'hooks/useTranslation';
import usePaginationLabels from 'hooks/usePaginationLabels';
import PageCard from 'ui-component/PageCard';
import PageTitle from 'ui-component/PageTitle';
import FilterToolbar from 'ui-component/FilterToolbar';
import FilterPopover from 'ui-component/FilterPopover';
import DialogCancelButton from 'ui-component/DialogCancelButton';
import UserAvatarWithName from 'ui-component/UserAvatarWithName';
import { getRoleColor } from 'constants/colors';
import { getAvatarInitial, getAvatarUrl, getRoleAvatarBorderSx } from 'utils/avatar';
import {
  TABLE_LAYOUT_SX,
  TABLE_CHECKBOX_CELL_SX,
  TABLE_ACTIONS_CELL_SX,
  TABLE_HEADER_CELL_SX,
  TABLE_HEADER_SORT_SX,
  TABLE_BODY_CELL_SX
} from 'constants/table';

const rowsPerPage = 6;

const formatMemberSince = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatLastLogin = (dateStr, neverLabel) => {
  if (!dateStr) return neverLabel;
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const STAT_CARDS = [
  { key: 'calls_uploaded', labelKey: 'users.callsUploaded', Icon: IconPhone },
  { key: 'followups_created', labelKey: 'users.followupsCreated', Icon: IconClipboardText },
  { key: 'reports_created', labelKey: 'users.reportsCreated', Icon: IconFileAnalytics },
];

const formatActivityDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function DrawerInfoRow({ label, children }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 0.5 }}>
      <Typography variant="body2" color="text.secondary" sx={{ width: 100, flexShrink: 0 }}>
        {label}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Stack>
  );
}

export default function UsersPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { users, loading, error, fetchUsers, addUser, updateUser, deleteUser } = useUsersStore();
  const { user: currentUser } = useAuth();
  const { t, roleLabel } = useTranslation();
  const paginationLabels = usePaginationLabels();
  const role = (currentUser?.role || '').toLowerCase();

  const getActivityLabel = (action) => {
    const key = `activity.${action}`;
    const label = t(key);
    return label === key ? action : label;
  };

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [selected, setSelected] = useState([]);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);

  // Sorting states
  const [sortByDate, setSortByDate] = useState('desc');
  const [sortByUsername, setSortByUsername] = useState('asc');
  const [activeSortColumn, setActiveSortColumn] = useState('date');

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'qa' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [isUserDrawerOpen, setIsUserDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDrawerEditMode, setIsDrawerEditMode] = useState(false);
  const [drawerDraft, setDrawerDraft] = useState({ email: '', role: 'qa', is_active: true });
  const [drawerError, setDrawerError] = useState('');
  const [drawerSaving, setDrawerSaving] = useState(false);
  const [drawerStats, setDrawerStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [drawerActivity, setDrawerActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);

  const openFilters = (event) => setFilterAnchorEl(event.currentTarget);
  const closeFilters = () => setFilterAnchorEl(null);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const validate = () => {
    const newErrors = {};
    if (!form.username.trim()) newErrors.username = t('users.usernameRequired');
    if (!form.email.trim()) {
      newErrors.email = t('users.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = t('users.invalidEmail');
    }
    if (!form.password) {
      newErrors.password = t('users.passwordRequired');
    } else if (form.password.length < 8) {
      newErrors.password = t('users.passwordMinLength');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const filteredUsers = useMemo(() => {
    let result = users.filter((u) => {
      const matchesSearch =
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'All' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });

    if (activeSortColumn === 'username') {
      result = [...result].sort((a, b) => {
        const nameA = a.username.toLowerCase();
        const nameB = b.username.toLowerCase();
        if (sortByUsername === 'asc') {
          return nameA.localeCompare(nameB);
        }
        return nameB.localeCompare(nameA);
      });
    } else {
      result = [...result].sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        if (sortByDate === 'desc') {
          return dateB - dateA;
        }
        return dateA - dateB;
      });
    }

    return result;
  }, [users, search, roleFilter, sortByUsername, sortByDate, activeSortColumn]);

  const activeFilterCount = (search ? 1 : 0) + (roleFilter !== 'All' ? 1 : 0);

  const handleReset = () => {
    setSearch('');
    setRoleFilter('All');
    setSelected([]);
    setSortByUsername('asc');
    setSortByDate('desc');
    setPage(0);
  };

  const toggleSortByUsername = () => {
    setActiveSortColumn('username');
    setSortByUsername(prev => prev === 'asc' ? 'desc' : 'asc');
    setPage(0);
  };

  const toggleSortByDate = () => {
    setActiveSortColumn('date');
    setSortByDate(prev => prev === 'desc' ? 'asc' : 'desc');
    setPage(0);
  };

  const isAllSelected = filteredUsers.length > 0 && selected.length === filteredUsers.length;

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelected(filteredUsers.map((u) => u.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelect = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    try {
      for (const userId of selected) {
        await deleteUser(userId);
      }
      await fetchUsers();
      setSelected([]);
      setBulkDeleteDialog(false);
      setPage(0);
    } catch (err) {
      setFormError(err.message || t('users.bulkDeleteFailed'));
    }
  };

  const handleAddUser = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      setFormError('');
      await addUser(form);
      await fetchUsers();
      resetForm();
      setOpen(false);
      setPage(0);
    } catch (err) {
      setFormError(err.message || t('users.createFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({ username: '', email: '', password: '', role: 'qa' });
    setErrors({});
    setFormError('');
  };

  const openAddUserDialog = () => {
    resetForm();
    setOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete.id);
      await fetchUsers();
      setSelected(prev => prev.filter(id => id !== userToDelete.id));
      setPage(0);
      setOpenDeleteDialog(false);
      setUserToDelete(null);
      if (isUserDrawerOpen && selectedUser?.id === userToDelete.id) {
        setIsUserDrawerOpen(false);
        setSelectedUser(null);
      }
    } catch (err) {
      setFormError(err.message || t('users.deleteFailed'));
    }
  };

  const buildDrawerDraft = (user) => ({
    email: user?.email || '',
    role: user?.role || 'qa',
    is_active: user?.is_active !== false,
  });

  const isDrawerDirty = useMemo(() => {
    if (!selectedUser) return false;
    return (
      drawerDraft.email !== selectedUser.email
      || drawerDraft.role !== selectedUser.role
      || drawerDraft.is_active !== (selectedUser.is_active !== false)
    );
  }, [selectedUser, drawerDraft]);

  const handleDrawerEditToggle = () => {
    if (isDrawerEditMode) {
      if (isDrawerDirty) {
        handleDrawerSave();
      } else {
        setDrawerDraft(buildDrawerDraft(selectedUser));
        setDrawerError('');
        setIsDrawerEditMode(false);
      }
    } else {
      setIsDrawerEditMode(true);
    }
  };

  const fetchDrawerStats = useCallback(async (userId) => {
    try {
      setStatsLoading(true);
      const res = await usersApi.stats(userId);
      setDrawerStats(res?.data || res);
    } catch {
      setDrawerStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchDrawerActivity = useCallback(async (userId) => {
    try {
      setActivityLoading(true);
      const res = await usersApi.activity(userId);
      setDrawerActivity(res?.data || res || []);
    } catch {
      setDrawerActivity([]);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  const openUserDrawer = async (user, edit = false) => {
    setDrawerError('');
    setDrawerStats(null);
    setDrawerActivity([]);
    setIsDrawerEditMode(edit);
    setIsUserDrawerOpen(true);

    try {
      const res = await usersApi.get(user.id);
      const fresh = res?.data || res;
      setSelectedUser(fresh);
      setDrawerDraft(buildDrawerDraft(fresh));
    } catch {
      setSelectedUser(user);
      setDrawerDraft(buildDrawerDraft(user));
    }

    fetchDrawerStats(user.id);
    fetchDrawerActivity(user.id);
  };

  const closeUserDrawer = () => {
    setIsUserDrawerOpen(false);
    setSelectedUser(null);
    setIsDrawerEditMode(false);
    setDrawerDraft({ email: '', role: 'qa', is_active: true });
    setDrawerError('');
    setDrawerStats(null);
    setDrawerActivity([]);
  };

  const handleDrawerSave = async () => {
    if (!selectedUser || !isDrawerDirty) return;

    if (!drawerDraft.email.trim()) {
      setDrawerError(t('users.emailRequired'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(drawerDraft.email)) {
      setDrawerError(t('users.invalidEmail'));
      return;
    }

    if (
      !drawerDraft.is_active
      && selectedUser.is_active !== false
      && !window.confirm(t('users.deactivateConfirm', { username: selectedUser.username }))
    ) {
      return;
    }

    const payload = {};
    if (drawerDraft.email !== selectedUser.email) payload.email = drawerDraft.email;
    if (drawerDraft.role !== selectedUser.role) payload.role = drawerDraft.role;
    if (drawerDraft.is_active !== (selectedUser.is_active !== false)) {
      payload.is_active = drawerDraft.is_active;
    }

    try {
      setDrawerSaving(true);
      setDrawerError('');
      const updated = await updateUser(selectedUser.id, payload);
      setSelectedUser(updated);
      setDrawerDraft(buildDrawerDraft(updated));
      setIsDrawerEditMode(false);
    } catch (err) {
      setDrawerError(err.message || t('users.updateFailed'));
    } finally {
      setDrawerSaving(false);
    }
  };

  const openDeleteConfirmation = () => {
    if (selected.length === 0) return;
    if (selected.length === 1) {
      const userToDel = filteredUsers.find(u => u.id === selected[0]);
      setUserToDelete(userToDel);
      setOpenDeleteDialog(true);
    } else {
      setBulkDeleteDialog(true);
    }
  };

  return (
    <PageCard>
        <PageTitle title={t('users.title')} />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        <FilterToolbar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          searchPlaceholder={t('users.searchPlaceholder')}
          activeFilterCount={activeFilterCount}
          onOpenFilters={openFilters}
          onResetFilters={handleReset}
          actions={role === 'manager' ? (
            <>
              {selected.length > 0 && (
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<IconTrashX size={18} />}
                  onClick={openDeleteConfirmation}
                >
                  {t('users.deleteSelected', { count: selected.length })}
                </Button>
              )}
              <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={openAddUserDialog}>
                {t('users.addUser')}
              </Button>
            </>
          ) : null}
        />

        <FilterPopover
          open={Boolean(filterAnchorEl)}
          anchorEl={filterAnchorEl}
          onClose={closeFilters}
          title={t('users.filterTitle')}
        >
          <FormControl fullWidth size="small">
            <InputLabel>{t('users.role')}</InputLabel>
            <Select value={roleFilter} label={t('users.role')} onChange={(e) => setRoleFilter(e.target.value)}>
              <MenuItem value="All">{t('common.all')}</MenuItem>
              <MenuItem value="manager">{roleLabel('manager')}</MenuItem>
              <MenuItem value="qa">{roleLabel('qa')}</MenuItem>
            </Select>
          </FormControl>
        </FilterPopover>

        <TableContainer sx={{ overflowX: 'auto', width: '100%' }}>
          <Table size="small" sx={TABLE_LAYOUT_SX}>
            <TableHead>
              <TableRow>
                {role === 'manager' && (
                  <TableCell padding="checkbox" sx={TABLE_CHECKBOX_CELL_SX}>
                    <Checkbox
                      size="small"
                      checked={isAllSelected}
                      indeterminate={selected.length > 0 && selected.length < filteredUsers.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                )}
                <TableCell sx={{ ...TABLE_HEADER_CELL_SX, width: role === 'manager' ? '24%' : '28%' }}>
                  <Box component="span" sx={TABLE_HEADER_SORT_SX}>
                    {t('users.username')}
                    <IconButton size="small" onClick={toggleSortByUsername} sx={{ p: 0, flexShrink: 0 }}>
                      {sortByUsername === 'asc' ? <IconArrowUp size={16} /> : <IconArrowDown size={16} />}
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell sx={{ ...TABLE_HEADER_CELL_SX, width: role === 'manager' ? '26%' : '30%' }}>{t('users.email')}</TableCell>
                <TableCell sx={{ ...TABLE_HEADER_CELL_SX, width: '14%', display: { xs: 'none', sm: 'table-cell' } }}>{t('users.role')}</TableCell>
                <TableCell sx={{ ...TABLE_HEADER_CELL_SX, width: '16%', display: { xs: 'none', md: 'table-cell' } }}>
                  <Box component="span" sx={TABLE_HEADER_SORT_SX}>
                    {t('users.createdAt')}
                    <IconButton size="small" onClick={toggleSortByDate} sx={{ p: 0, flexShrink: 0 }}>
                      {sortByDate === 'desc' ? <IconArrowDown size={16} /> : <IconArrowUp size={16} />}
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell align="center" sx={{ ...TABLE_ACTIONS_CELL_SX, ...TABLE_HEADER_CELL_SX }}>{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((u) => (
                    <TableRow key={u.id} hover selected={selected.includes(u.id)}>
                      {role === 'manager' && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selected.includes(u.id)}
                            onChange={() => handleSelect(u.id)}
                            disabled={u.username === currentUser?.user}
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <UserAvatarWithName
                            username={u.username}
                            role={u.role}
                            avatar={u.avatar}
                            avatarStyle={u.avatar_style}
                          />
                          {u.is_active === false && (
                            <Chip label={t('users.inactive')} size="small" color="error" variant="outlined" />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell sx={TABLE_BODY_CELL_SX}>{u.email}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <Chip label={roleLabel(u.role)} size="small"
                          sx={{ bgcolor: getRoleColor(u.role, theme).bg, color: getRoleColor(u.role, theme).color }} />
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Box component="span" sx={{ unicodeBidi: 'isolate', display: 'inline-block' }}>
                          {u.created_at ? u.created_at.split('T')[0] : ''}
                        </Box>
                      </TableCell>
                      <TableCell align="center" sx={{ ...TABLE_ACTIONS_CELL_SX, paddingInlineStart: 0.5, paddingInlineEnd: 1 }}>
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <IconButton
                            size="small"
                            sx={{ color: 'info.main' }}
                            onClick={() => openUserDrawer(u, false)}
                            title={t('users.viewUser')}
                          >
                            <IconEye size={18} />
                          </IconButton>
                          {role === 'manager' && (
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => openUserDrawer(u, true)}
                              title={t('users.editUser')}
                            >
                              <IconEdit size={18} />
                            </IconButton>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
              )}
              {!loading && filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">{t('users.noUsersFound')}</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 1 }}>
          <TablePagination
            component="div"
            count={filteredUsers.length}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[]}
            {...paginationLabels}
          />
        </Box>

        {/* Bulk Delete Dialog */}
        <Dialog open={bulkDeleteDialog} onClose={() => setBulkDeleteDialog(false)} maxWidth="sm" fullWidth
          >
          <DialogTitle>{t('calls.confirmBulkDelete')}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {t('users.bulkDeleteBody', { count: selected.length })}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <DialogCancelButton onClick={() => setBulkDeleteDialog(false)} />
            <Button onClick={handleBulkDelete} variant="contained" color="error">{t('common.deleteAll')}</Button>
          </DialogActions>
        </Dialog>

        {/* Add User Dialog */}
        <Dialog open={open} onClose={() => { setOpen(false); resetForm(); }} fullWidth maxWidth="sm">
          <DialogTitle>{t('users.addUser')}</DialogTitle>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{formError}</Alert>}
            <Stack component="form" autoComplete="off" spacing={2} mt={1}>
              <TextField label={t('users.username')} fullWidth autoComplete="off"
                error={!!errors.username} helperText={errors.username}
                value={form.username}
                onChange={(e) => { setForm({ ...form, username: e.target.value }); if (errors.username) setErrors({ ...errors, username: null }); }} />
              <TextField label={t('users.email')} fullWidth type="email" autoComplete="off" name="new-user-email"
                error={!!errors.email} helperText={errors.email}
                value={form.email}
                onChange={(e) => { setForm({ ...form, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: null }); }} />
              <TextField label={t('users.password')} type="password" fullWidth autoComplete="new-password" name="new-user-password"
                error={!!errors.password} helperText={errors.password}
                value={form.password}
                onChange={(e) => { setForm({ ...form, password: e.target.value }); if (errors.password) setErrors({ ...errors, password: null }); }} />
              <TextField select label={t('users.role')} fullWidth value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <MenuItem value="manager">{roleLabel('manager')}</MenuItem>
                <MenuItem value="qa">{roleLabel('qa')}</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <DialogCancelButton onClick={() => { setOpen(false); resetForm(); }} />
            <Button variant="contained" onClick={handleAddUser} disabled={submitting}>
              {submitting ? <CircularProgress size={18} color="inherit" /> : t('users.add')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Single User Dialog */}
        <Dialog open={openDeleteDialog} onClose={() => { setOpenDeleteDialog(false); setUserToDelete(null); setFormError(''); }} maxWidth="sm" fullWidth
          >
          <DialogTitle>{t('calls.confirmDelete')}</DialogTitle>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <DialogContentText>
              {t('users.confirmDeleteBody', { username: userToDelete?.username })}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <DialogCancelButton onClick={() => setOpenDeleteDialog(false)} />
            <Button onClick={handleDeleteUser} variant="contained" color="error">{t('common.delete')}</Button>
          </DialogActions>
        </Dialog>

        {/* User Drawer - View/Edit */}
        <Drawer anchor="right" open={isUserDrawerOpen} onClose={closeUserDrawer}>
          <Box sx={{ width: { xs: 320, sm: 420 }, p: 3 }}>
            {selectedUser && (
              <>
                {/* Header — matches Calls drawer rhythm */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
                    <Avatar
                      src={getAvatarUrl(selectedUser, selectedUser.username)}
                      sx={{
                        width: 44,
                        height: 44,
                        fontSize: 16,
                        fontWeight: 700,
                        flexShrink: 0,
                        ...getRoleAvatarBorderSx(selectedUser.role, 2, theme),
                        color: getRoleColor(selectedUser.role, theme).color,
                        '& img': { objectFit: 'cover' },
                      }}
                    >
                      {!getAvatarUrl(selectedUser, selectedUser.username)
                        && getAvatarInitial(selectedUser.username)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h5" noWrap>{selectedUser.username}</Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {isDrawerEditMode ? drawerDraft.email : selectedUser.email}
                      </Typography>
                    </Box>
                  </Box>
                  <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0, ml: 1 }}>
                    {role === 'manager' && (
                      <IconButton
                        size="small"
                        disabled={drawerSaving}
                        onClick={handleDrawerEditToggle}
                        sx={{ color: isDrawerDirty ? 'primary.main' : 'text.primary' }}
                      >
                        {drawerSaving
                          ? <CircularProgress size={18} />
                          : isDrawerEditMode
                            ? <IconDeviceFloppy size={22} />
                            : <IconEdit size={18} />}
                      </IconButton>
                    )}
                    <IconButton onClick={closeUserDrawer} size="small"><IconX size={18} /></IconButton>
                  </Stack>
                </Box>

                {selectedUser.username === currentUser?.user && (
                  <Chip label={t('users.you')} size="small" variant="outlined" color="primary" sx={{ mb: 2 }} />
                )}

                {drawerError && <Alert severity="error" sx={{ mb: 2 }}>{drawerError}</Alert>}

                <Divider sx={{ mb: 2 }} />

                <Typography variant="subtitle1" sx={{ mb: 1 }}>{t('users.userInformation')}</Typography>

                {isDrawerEditMode ? (
                  <Stack spacing={2} sx={{ mb: 2 }}>
                    <TextField
                      label={t('users.email')}
                      fullWidth
                      size="small"
                      type="email"
                      value={drawerDraft.email}
                      onChange={(e) => {
                        setDrawerDraft((prev) => ({ ...prev, email: e.target.value }));
                        setDrawerError('');
                      }}
                    />
                    <TextField
                      select
                      label={t('users.role')}
                      fullWidth
                      size="small"
                      disabled={selectedUser.username === currentUser?.user}
                      value={drawerDraft.role}
                      onChange={(e) => {
                        setDrawerDraft((prev) => ({ ...prev, role: e.target.value }));
                        setDrawerError('');
                      }}
                      helperText={
                        selectedUser.username === currentUser?.user
                          ? t('users.cannotChangeOwnRole')
                          : undefined
                      }
                    >
                      <MenuItem value="manager">{roleLabel('manager')}</MenuItem>
                      <MenuItem value="qa">{roleLabel('qa')}</MenuItem>
                    </TextField>
                    {role === 'manager' && selectedUser.username !== currentUser?.user && (
                      <FormControlLabel
                        sx={{ ml: 0 }}
                        control={(
                          <Switch
                            checked={drawerDraft.is_active}
                            onChange={(e) => {
                              setDrawerDraft((prev) => ({ ...prev, is_active: e.target.checked }));
                              setDrawerError('');
                            }}
                            color="success"
                          />
                        )}
                        label={drawerDraft.is_active ? t('users.accountActive') : t('users.accountInactive')}
                      />
                    )}
                  </Stack>
                ) : (
                  <Box sx={{ mb: 2 }}>
                    <DrawerInfoRow label={t('users.email')}>
                      <Typography variant="body2">{selectedUser.email}</Typography>
                    </DrawerInfoRow>
                    <DrawerInfoRow label={t('users.role')}>
                      <Chip
                        label={roleLabel(selectedUser.role)}
                        size="small"
                        sx={{
                          bgcolor: getRoleColor(selectedUser.role, theme).bg,
                          color: getRoleColor(selectedUser.role, theme).color,
                          fontWeight: 600,
                        }}
                      />
                    </DrawerInfoRow>
                    <DrawerInfoRow label={t('users.status')}>
                      <Typography variant="body2">
                        {selectedUser.is_active !== false ? t('users.active') : t('users.inactive')}
                      </Typography>
                    </DrawerInfoRow>
                  </Box>
                )}

                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary">{t('users.memberSince')}</Typography>
                    <Typography variant="body2" sx={{ mt: 0.25 }}>
                      {formatMemberSince(selectedUser.created_at)}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary">{t('users.lastLogin')}</Typography>
                    <Typography variant="body2" sx={{ mt: 0.25 }}>
                      {formatLastLogin(selectedUser.last_login, t('common.never'))}
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ mb: 2 }} />

                <Typography variant="subtitle1" sx={{ mb: 1 }}>{t('users.statistics')}</Typography>
                {statsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, mb: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <Card
                    variant="outlined"
                    sx={{ boxShadow: 'none', borderColor: 'divider', mb: 2 }}
                  >
                    <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                      <Grid container spacing={1}>
                        {STAT_CARDS.map((card) => {
                          const StatIcon = card.Icon;
                          return (
                            <Grid key={card.key} size={4}>
                              <Stack alignItems="center" spacing={0.5} sx={{ textAlign: 'center' }}>
                                <StatIcon size={18} stroke={1.75} style={{ opacity: 0.7 }} />
                                <Typography variant="h5" fontWeight={700}>
                                  {drawerStats?.[card.key] ?? 0}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                                  {t(card.labelKey)}
                                </Typography>
                              </Stack>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </CardContent>
                  </Card>
                )}

                <Divider sx={{ mb: 2 }} />

                <Typography variant="subtitle1" sx={{ mb: 1 }}>{t('users.recentActivity')}</Typography>
                {activityLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, mb: 2 }}>
                    <CircularProgress size={22} />
                  </Box>
                ) : drawerActivity.length === 0 ? (
                  <Stack alignItems="center" spacing={0.75} sx={{ py: 2.5, mb: 2 }}>
                    <IconHistory size={28} stroke={1.5} style={{ opacity: 0.3 }} />
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      {t('users.noActivityRecorded')}
                      <br />
                      {t('users.userActionsAppear')}
                    </Typography>
                  </Stack>
                ) : (
                  <List dense disablePadding sx={{ mb: 2 }}>
                    {drawerActivity.map((entry, index) => (
                      <ListItem
                        key={`${entry.action}-${entry.created_at}-${index}`}
                        disableGutters
                        sx={{ py: 0.5, alignItems: 'flex-start' }}
                      >
                        <ListItemText
                          primary={entry.description || getActivityLabel(entry.action)}
                          secondary={formatActivityDate(entry.created_at)}
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}

                <Divider sx={{ mb: 2 }} />

                <Typography variant="subtitle1" sx={{ mb: 1 }}>{t('users.quickActions')}</Typography>
                <Stack spacing={1}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="small"
                    startIcon={<IconPhone size={16} />}
                    onClick={() => navigate('/calls', {
                      state: { filter: 'user', value: selectedUser.username },
                    })}
                  >
                    {t('users.viewCalls')}
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<IconClipboardText size={16} />}
                    onClick={() => navigate('/followups', {
                      state: { filter: 'assignee', value: selectedUser.username },
                    })}
                  >
                    {t('users.viewFollowUps')}
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<IconFileAnalytics size={16} />}
                    onClick={() => navigate('/reports', {
                      state: { filter: 'creator', value: selectedUser.username },
                    })}
                  >
                    {t('users.viewReports')}
                  </Button>
                </Stack>
              </>
            )}
          </Box>
        </Drawer>
    </PageCard>
  );
}