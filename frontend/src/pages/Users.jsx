import { useState, useMemo, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Typography, IconButton, Dialog,
  DialogTitle, DialogContent, DialogContentText, DialogActions,
  TextField, MenuItem, Stack, Avatar, Checkbox, Chip, Grid,
  FormControl, InputLabel, Select, Drawer, Divider, List, ListItem,
  ListItemText, CircularProgress, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  IconEdit, IconTrash, IconPlus, IconRefresh, IconClipboardList, IconFileAnalytics
} from '@tabler/icons-react';
import useUsersStore from 'hooks/useUsersStore';
import useAuth from 'hooks/useAuth';

const roleColors = {
  manager: { bg: '#ede7f6', color: '#5e35b1' },
  agent:   { bg: '#e3f2fd', color: '#1e88e5' },
  qa:      { bg: '#fff3e0', color: '#ef6c00' }
};

export default function UsersPage() {
  const { users, loading, error, fetchUsers, addUser, deleteUser } = useUsersStore();
  const { user: currentUser } = useAuth();
  const role = (currentUser?.role || '').toLowerCase();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [selected, setSelected] = useState([]);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'agent' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [openUserDrawer, setOpenUserDrawer] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

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
    return users.filter((u) => {
      const matchesSearch =
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'All' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

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

  const handleAddUser = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      setFormError('');
      await addUser(form);
      setForm({ username: '', email: '', password: '', role: 'agent' });
      setErrors({});
      setOpen(false);
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
    } catch (err) {
      // silently ignore
    } finally {
      setOpenDeleteDialog(false);
      setUserToDelete(null);
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

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth size="small" placeholder="Search user..."
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Role</InputLabel>
              <Select value={roleFilter} label="Role" onChange={(e) => setRoleFilter(e.target.value)} sx={{ borderRadius: 2 }}>
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="agent">Agent</MenuItem>
                <MenuItem value="qa">QA</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Button fullWidth variant="outlined" startIcon={<IconRefresh size={18} />}
              onClick={() => { setSearch(''); setRoleFilter('All'); setSelected([]); }}
              sx={{ borderRadius: 2, textTransform: 'none', height: 40 }}>
              Reset
            </Button>
          </Grid>
          {role === 'manager' && (
            <Grid size={{ xs: 12, md: 2 }} sx={{ ml: 'auto' }}>
              <Button fullWidth variant="contained" startIcon={<IconPlus size={18} />}
                onClick={() => setOpen(true)}
                sx={{ borderRadius: 2, textTransform: 'none', height: 40 }}>
                Add User
              </Button>
            </Grid>
          )}
        </Grid>

        <TableContainer sx={{ overflowX: 'auto', width: '100%' }}>
          <Table size="small" sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={selected.length > 0 && selected.length < filteredUsers.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Role</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Created At</TableCell>
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
              ) : filteredUsers.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox checked={selected.includes(u.id)} onChange={() => handleSelect(u.id)} />
                  </TableCell>
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
                      <IconButton size="small" color="primary" onClick={() => { setSelectedUser(u); setOpenUserDrawer(true); }}>
                        <IconEdit size={18} />
                      </IconButton>
                      {role === 'manager' && (
                        <IconButton size="small" color="error"
                          onClick={() => { setUserToDelete(u); setOpenDeleteDialog(true); }}>
                          <IconTrash size={18} />
                        </IconButton>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
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

        {/* Delete Dialog */}
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

        {/* User Drawer */}
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

                <Divider sx={{ my: 3 }} />

                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>Created At:</strong>{' '}
                    {selectedUser.created_at ? selectedUser.created_at.split('T')[0] : '—'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Role:</strong> {selectedUser.role}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Email:</strong> {selectedUser.email}
                  </Typography>
                </Stack>
              </>
            )}
          </Box>
        </Drawer>
      </CardContent>
    </Card>
  );
}