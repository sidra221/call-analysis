import { useState, useMemo, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Typography, IconButton, Dialog,
  DialogTitle, DialogContent, DialogContentText, DialogActions,
  TextField, MenuItem, Stack, Avatar, Checkbox, Chip, Grid,
  FormControl, InputLabel, Select, Drawer, Divider,
  CircularProgress, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Popover, Badge, InputAdornment,
  TablePagination
} from '@mui/material';
import {
  IconEdit, IconTrash, IconPlus, IconRefresh, IconClipboardList, 
  IconFileAnalytics, IconTrashX, IconSearch, IconX,
  IconArrowUp, IconArrowDown, IconAdjustmentsHorizontal, IconEye
} from '@tabler/icons-react';
import useUsersStore from 'hooks/useUsersStore';
import useAuth from 'hooks/useAuth';

const roleColors = {
  manager: { bg: '#ede7f6', color: '#5e35b1' },
  agent:   { bg: '#e3f2fd', color: '#1e88e5' },
  qa:      { bg: '#fff3e0', color: '#ef6c00' }
};

const rowsPerPage = 6;

export default function UsersPage() {
  const { users, loading, error, fetchUsers, addUser, deleteUser } = useUsersStore();
  const { user: currentUser } = useAuth();
  const role = (currentUser?.role || '').toLowerCase();

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [selected, setSelected] = useState([]);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);

  // Sorting states
  const [sortByDate, setSortByDate] = useState('desc');
  const [sortByUsername, setSortByUsername] = useState('asc');

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'agent' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [openUserDrawer, setOpenUserDrawer] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);

  const openFilters = (event) => setFilterAnchorEl(event.currentTarget);
  const closeFilters = () => setFilterAnchorEl(null);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const validate = () => {
    const newErrors = {};
    if (!form.username.trim()) newErrors.username = 'Username is required';
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
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

    result = [...result].sort((a, b) => {
      const nameA = a.username.toLowerCase();
      const nameB = b.username.toLowerCase();
      if (sortByUsername === 'asc') {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });

    result = [...result].sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      if (sortByDate === 'desc') {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });

    return result;
  }, [users, search, roleFilter, sortByUsername, sortByDate]);

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
    setSortByUsername(prev => prev === 'asc' ? 'desc' : 'asc');
    setPage(0);
  };

  const toggleSortByDate = () => {
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
      setFormError(err.message || 'Bulk delete failed');
    }
  };

  const handleAddUser = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      setFormError('');
      await addUser(form);
      await fetchUsers();
      setForm({ username: '', email: '', password: '', role: 'agent' });
      setErrors({});
      setOpen(false);
      setPage(0);
    } catch (err) {
      setFormError(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete.id);
      await fetchUsers();
      setSelected(prev => prev.filter(id => id !== userToDelete.id));
      setPage(0);
    } catch (err) {
      // silently ignore
    } finally {
      setOpenDeleteDialog(false);
      setUserToDelete(null);
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
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h4" gutterBottom sx={{ padding: '16px 2px' }}>
          Users Management
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        {/* Filters Row */}
        <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth size="small" placeholder="Search user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconSearch size={18} style={{ color: '#9e9e9e' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {search ? (
                      <IconButton size="small" onClick={() => setSearch('')}>
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
            {role === 'manager' && selected.length > 0 && (
              <Button
                variant="contained"
                color="error"
                startIcon={<IconTrashX size={18} />}
                onClick={openDeleteConfirmation}
                sx={{ borderRadius: 2, textTransform: 'none', height: 40 }}
              >
                Delete Selected ({selected.length})
              </Button>
            )}
            
            {role === 'manager' && (
              <Button
                variant="contained"
                startIcon={<IconPlus size={18} />}
                onClick={() => setOpen(true)}
                sx={{ borderRadius: 2, textTransform: 'none', height: 40 }}
              >
                Add User
              </Button>
            )}
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
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>Filter Users</Typography>
          <Stack spacing={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Role</InputLabel>
              <Select value={roleFilter} label="Role" onChange={(e) => setRoleFilter(e.target.value)}>
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="agent">Agent</MenuItem>
                <MenuItem value="qa">QA</MenuItem>
              </Select>
            </FormControl>

            <Button variant="contained" fullWidth onClick={closeFilters} sx={{ borderRadius: 2, textTransform: 'none' }}>
              Apply Filters
            </Button>
          </Stack>
        </Popover>

        <TableContainer sx={{ overflowX: 'auto', width: '100%' }}>
          <Table size="small" sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
                {role === 'manager' && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={selected.length > 0 && selected.length < filteredUsers.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography variant="body2" fontWeight={600}>Username</Typography>
                    <IconButton size="small" onClick={toggleSortByUsername} sx={{ p: 0 }}>
                      {sortByUsername === 'asc' ? <IconArrowUp size={16} /> : <IconArrowDown size={16} />}
                    </IconButton>
                  </Stack>
                </TableCell>
                <TableCell>Email</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Role</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography variant="body2" fontWeight={600}>Created At</Typography>
                    <IconButton size="small" onClick={toggleSortByDate} sx={{ p: 0 }}>
                      {sortByDate === 'desc' ? <IconArrowDown size={16} /> : <IconArrowUp size={16} />}
                    </IconButton>
                  </Stack>
                </TableCell>
                <TableCell align="center">Actions</TableCell>
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
                          <Avatar sx={{ width: 32, height: 32, bgcolor: roleColors[u.role]?.bg || '#eee', color: roleColors[u.role]?.color || '#333', fontSize: 14 }}>
                            {u.username?.[0]?.toUpperCase()}
                          </Avatar>
                          <Typography variant="subtitle2">{u.username}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <Chip label={u.role} size="small"
                          sx={{ bgcolor: roleColors[u.role]?.bg, color: roleColors[u.role]?.color }} />
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Box component="span" sx={{ unicodeBidi: 'isolate', display: 'inline-block' }}>
                          {u.created_at ? u.created_at.split('T')[0] : ''}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => { setSelectedUser(u); setOpenUserDrawer(true); }}
                            title="View User"
                          >
                            <IconEye size={18} />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => { setSelectedUser(u); setOpenUserDrawer(true); }}
                            title="Edit User"
                          >
                            <IconEdit size={18} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
              )}
              {!loading && filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No users found</Typography>
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
          />
        </Box>

        {/* Bulk Delete Dialog */}
        <Dialog open={bulkDeleteDialog} onClose={() => setBulkDeleteDialog(false)} maxWidth="sm" fullWidth
          PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
          <DialogTitle>Confirm Bulk Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete <strong>{selected.length}</strong> selected user(s)? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setBulkDeleteDialog(false)} variant="outlined"
              sx={{ color: 'text.secondary', borderColor: 'grey.400' }}>Cancel</Button>
            <Button onClick={handleBulkDelete} variant="contained" color="error">Delete All</Button>
          </DialogActions>
        </Dialog>

        {/* Add User Dialog */}
        <Dialog open={open} onClose={() => { setOpen(false); setFormError(''); }} fullWidth maxWidth="sm">
          <DialogTitle>Add User</DialogTitle>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{formError}</Alert>}
            <Stack spacing={2} mt={1}>
              <TextField label="Username" fullWidth
                error={!!errors.username} helperText={errors.username}
                value={form.username}
                onChange={(e) => { setForm({ ...form, username: e.target.value }); if (errors.username) setErrors({ ...errors, username: null }); }} />
              <TextField label="Email" fullWidth
                error={!!errors.email} helperText={errors.email}
                value={form.email}
                onChange={(e) => { setForm({ ...form, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: null }); }} />
              <TextField label="Password" type="password" fullWidth
                error={!!errors.password} helperText={errors.password}
                value={form.password}
                onChange={(e) => { setForm({ ...form, password: e.target.value }); if (errors.password) setErrors({ ...errors, password: null }); }} />
              <TextField select label="Role" fullWidth value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="agent">Agent</MenuItem>
                <MenuItem value="qa">QA</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button onClick={() => { setOpen(false); setFormError(''); }} variant="outlined"
              sx={{ color: 'text.secondary', borderColor: 'grey.400' }}>Cancel</Button>
            <Button variant="contained" onClick={handleAddUser} disabled={submitting}>
              {submitting ? <CircularProgress size={18} color="inherit" /> : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Single User Dialog */}
        <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} maxWidth="sm" fullWidth
          PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete <strong>{userToDelete?.username}</strong>? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setOpenDeleteDialog(false)} variant="outlined"
              sx={{ color: 'text.secondary', borderColor: 'grey.400' }}>Cancel</Button>
            <Button onClick={handleDeleteUser} variant="contained" color="error">Delete</Button>
          </DialogActions>
        </Dialog>

        {/* User Drawer - View/Edit User */}
        <Drawer anchor="right" open={openUserDrawer} onClose={() => setOpenUserDrawer(false)}>
          <Box sx={{ width: 380, p: 3, height: '100%', bgcolor: '#fafafa' }}>
            {selectedUser && (
              <>
                <Stack alignItems="center" spacing={2}>
                  <Avatar sx={{
                    width: 90, height: 90, fontSize: 32, fontWeight: 700,
                    bgcolor: roleColors[selectedUser.role]?.bg || '#eee',
                    color: roleColors[selectedUser.role]?.color || '#333'
                  }}>
                    {selectedUser.username?.[0]?.toUpperCase()}
                  </Avatar>
                  <Box textAlign="center">
                    <Typography variant="h5" fontWeight={700}>{selectedUser.username}</Typography>
                    <Typography color="text.secondary">{selectedUser.email}</Typography>
                    <Chip label={selectedUser.role} sx={{
                      mt: 1,
                      bgcolor: roleColors[selectedUser.role]?.bg,
                      color: roleColors[selectedUser.role]?.color,
                      fontWeight: 600
                    }} />
                  </Box>
                </Stack>

                <Divider sx={{ my: 3 }} />

                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Username</Typography>
                    <Typography variant="body1" fontWeight={500}>{selectedUser.username}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                    <Typography variant="body1" fontWeight={500}>{selectedUser.email}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Role</Typography>
                    <Chip label={selectedUser.role} size="small"
                      sx={{ bgcolor: roleColors[selectedUser.role]?.bg, color: roleColors[selectedUser.role]?.color }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString() : '—'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">User ID</Typography>
                    <Typography variant="body1" fontWeight={500}>{selectedUser.id}</Typography>
                  </Box>
                </Stack>

                <Divider sx={{ my: 3 }} />

                <Grid container spacing={2}>
                  <Grid size={6}>
                    <Card sx={{ borderRadius: 3, textAlign: 'center', py: 2 }}>
                      <IconClipboardList size={28} />
                      <Typography variant="h6" fontWeight={700}>—</Typography>
                      <Typography variant="body2" color="text.secondary">Tasks</Typography>
                    </Card>
                  </Grid>
                  <Grid size={6}>
                    <Card sx={{ borderRadius: 3, textAlign: 'center', py: 2 }}>
                      <IconFileAnalytics size={28} />
                      <Typography variant="h6" fontWeight={700}>—</Typography>
                      <Typography variant="body2" color="text.secondary">Reports</Typography>
                    </Card>
                  </Grid>
                </Grid>
              </>
            )}
          </Box>
        </Drawer>
      </CardContent>
    </Card>
  );
}