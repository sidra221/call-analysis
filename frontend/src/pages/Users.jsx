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
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Avatar,
  Checkbox,
  Chip,
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

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'Agent'
  });

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

    setOpen(false);
  };

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>

        {/* Header */}
         <Typography variant="h4" gutterBottom sx={{ padding: '16px 2px' }}>
                    Users Management
                  </Typography>
<Stack
  direction={{ xs: 'column', sm: 'row' }}
  alignItems={{ xs: 'stretch', sm: 'center' }}
  justifyContent="space-between"
  spacing={2}
  mb={3}
>

  {/* LEFT: search + filter */}
  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexGrow={1}>
    <TextField
      placeholder="Search user..."
      size="small"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      sx={{ minWidth: { md: 200 } }}
    />

    <TextField
      select
      size="small"
      value={roleFilter}
      onChange={(e) => setRoleFilter(e.target.value)}
      sx={{ minWidth: { md: 150 } }}
    >
      <MenuItem value="All">All Roles</MenuItem>
      <MenuItem value="Admin">Admin</MenuItem>
      <MenuItem value="Agent">Agent</MenuItem>
    </TextField>

    <Button
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
  </Stack>

  {/* RIGHT: button */}
  <Button
    variant="contained"
    startIcon={<IconPlus size={18} />}
    onClick={() => setOpen(true)}
    sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
  >
    Add User
  </Button>
</Stack>

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
                        fontWeight: 600
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
                        onClick={() => setUsers(users.filter((user) => user.id !== u.id))}
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
              <TextField label="Username" name="username" onChange={(e) => setForm({ ...form, username: e.target.value })} />
              <TextField label="Email" name="email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <TextField label="Password" type="password" onChange={(e) => setForm({ ...form, password: e.target.value })} />

              <TextField
                select
                label="Role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="Agent">Agent</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleAddUser}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

      </CardContent>
    </Card>
  );
}