import { useState, useMemo } from 'react';
// MUI
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Avatar,
  Checkbox,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';

// Icons
import { IconEdit, IconTrash, IconPlus,IconRefresh,IconUsers} from '@tabler/icons-react';

// Table
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';

import useUsersStore from 'hooks/useUsersStore';

export default function UsersPage() {
  const { users, setUsers } = useUsersStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [selected, setSelected] = useState([]);

  // Delete State
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'Agent'
  });

  const [errors, setErrors] = useState({});

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
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🎨 Role Colors (ستايلك)
  const roleColors = {
    Admin: { bg: '#ede7f6', color: '#5e35b1' },
    Agent: { bg: '#e3f2fd', color: '#1e88e5' }
  };

  // فلترة + سيرش
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());

      const matchesRole =
        roleFilter === 'All' || u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  // checkbox
  const handleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };
  const isAllSelected =
  filteredUsers.length > 0 &&
  selected.length === filteredUsers.length;

  const handleSelectAll = (e) => {
  if (e.target.checked) {
    setSelected(filteredUsers.map((u) => u.id));
  } else {
    setSelected([]);
  }
};

  const handleAddUser = () => {
    if (!validate()) return;

    const newUser = {
      id: Date.now(),
      username: form.username,
      email: form.email,
      role: form.role,
      createdAt: new Date().toISOString().slice(0, 10),
      avatar: `https://i.pravatar.cc/150?u=${Date.now()}`
    };

    setUsers([...users, newUser]);

    setForm({
      username: '',
      email: '',
      password: '',
      role: 'Agent'
    });
    setErrors({});
    setOpen(false);
  };

  const handleDeleteUser = () => {
    if (userToDelete) {
      setUsers(users.filter((user) => user.id !== userToDelete.id));
      setOpenDeleteDialog(false);
      setUserToDelete(null);
    }
  };

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>

        {/* Header */}
          <Typography variant="h4" gutterBottom sx={{ padding: '16px 2px' }}>
            Users Management
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{
                  borderRadius: '16px',
                  bgcolor: '#fff',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#90caf9'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1e88e5',
                    borderWidth: '2px'
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Roles</InputLabel>
                <Select
                  value={roleFilter}
                  label="Role"
                  onChange={(e) => setRoleFilter(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="All">All </MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Agent">Agent</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<IconRefresh size={18} />}
                onClick={() => {
                  setSearch('');
                  setRoleFilter('All');
                  setSelected([]);
                }}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                  whiteSpace: 'nowrap'
                }}
              >
                Reset
              </Button>
            </Grid>

            <Grid item xs={12} md={2} sx={{ ml: 'auto' }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<IconPlus size={18} />}
                onClick={() => setOpen(true)}
                sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
              >
                Add User
              </Button>
            </Grid>
          </Grid>

        {/* Table */}
        <TableContainer sx={{ overflowX: 'auto', width: '100%' }}>
          <Table size="small" sx={{ borderCollapse: 'separate', borderSpacing: '0 2px', minWidth: 700 }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={
                      selected.length > 0 &&
                      selected.length < filteredUsers.length
                    }
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell sx={{ width: '25%' }}>Username</TableCell>
                <TableCell sx={{ width: '25%' }}>Email</TableCell>
                <TableCell sx={{ width: '15%', display: { xs: 'none', sm: 'table-cell' } }}>Role</TableCell>
                <TableCell sx={{ width: '15%', display: { xs: 'none', md: 'table-cell' } }}>Created At</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(u.id)}
                      onChange={() => handleSelect(u.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar src={u.avatar} sx={{ width: 32, height: 32 }} />
                      <Typography variant="subtitle2">{u.username}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    <Chip
                      label={u.role}
                      size="small"
                      sx={{
                        bgcolor: roleColors[u.role].bg,
                        color: roleColors[u.role].color,
                        
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{u.createdAt}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <IconButton size="small" color="primary">
                        <IconEdit size={18} />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setUserToDelete(u);
                          setOpenDeleteDialog(true);
                        }}
                      >
                        <IconTrash size={18} />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Dialog */}
        <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
          <DialogTitle>Add User</DialogTitle>

          <DialogContent>
            <Stack spacing={2} mt={1}>
              <TextField
                label="Username"
                name="username"
                fullWidth
                error={!!errors.username}
                helperText={errors.username}
                onChange={(e) => {
                  setForm({ ...form, username: e.target.value });
                  if (errors.username) setErrors({ ...errors, username: null });
                }}
              />
              <TextField
                label="Email"
                name="email"
                fullWidth
                error={!!errors.email}
                helperText={errors.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: null });
                }}
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                error={!!errors.password}
                helperText={errors.password}
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value });
                  if (errors.password) setErrors({ ...errors, password: null });
                }}
              />

              <TextField
                select
                label="Role"
                fullWidth
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="Agent">Agent</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ justifyContent: 'flex-end', px: 3, pb: 3, gap: 1 }}>

            <Button 
              onClick={() => setOpen(false)}
              variant="outlined"
              sx={{
                px: 3,
                color: 'text.secondary',
                borderColor: 'grey.400',
                '&:hover': {
                  borderColor: 'grey.600',
                  backgroundColor: 'grey.100',
                },
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleAddUser}
              sx={{ px: 4}}
            >
              Add
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog 
          open={openDeleteDialog} 
          onClose={() => setOpenDeleteDialog(false)}
          maxWidth="sm" 
          fullWidth 
          PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete user <strong>{userToDelete?.username}</strong>? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'flex-end', px: 3, pb: 3 }}>

            <Button 
              onClick={() => setOpenDeleteDialog(false)} 
              variant="outlined"
              sx={{ 
                color: 'text.secondary', 
                borderColor: 'grey.400', 
                '&:hover': { borderColor: 'grey.600', backgroundColor: 'grey.100' } 
              }}
            >
              Cancel
            </Button>

            <Button 
              onClick={handleDeleteUser}
              variant="contained" 
              color="error"
              sx={{ backgroundColor: 'error.dark', '&:hover': { backgroundColor: 'error.main' } }}
            >
              Delete
            </Button>

          </DialogActions>
        </Dialog>

      </CardContent>
    </Card>
  );
}