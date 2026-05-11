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

const defaultUsers = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@test.com',
    role: 'Admin',
    createdAt: '01-05-2026',
    avatar: 'https://i.pravatar.cc/150?img=1'
  },
  {
    id: 2,
    username: 'agent1',
    email: 'agent@test.com',
    role: 'Agent',
    createdAt: '11-03-2026',
    avatar: 'https://i.pravatar.cc/150?img=2'
  }
];

export default function UsersPage() {
  const [users, setUsers] = useState(defaultUsers);
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
    <Card>
      <CardContent>

        {/* Header */}
         <Typography variant="h4" gutterBottom sx={{ padding: '16px 2px' }}>
                    Users Management
                  </Typography>
<Stack
  direction="row"
  alignItems="center"
  justifyContent="space-between"
  mb={2}
>

  {/* LEFT: search + filter */}
  <Stack direction="row" spacing={2}>
    <TextField
      placeholder="Search user..."
      size="small"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />

    <TextField
      select
      size="small"
      value={roleFilter}
      onChange={(e) => setRoleFilter(e.target.value)}
    >
      <MenuItem value="All">All Roles</MenuItem>
      <MenuItem value="Admin">Admin</MenuItem>
      <MenuItem value="Agent">Agent</MenuItem>
    </TextField>

    {/* Reset Button */}
     
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
        minWidth: 100
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
  >
    Add User
  </Button>
</Stack>

        {/* Table */}
        <TableContainer>
<Table  size="small" sx={{ borderCollapse: 'separate', borderSpacing: '0 2px' }}>
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
                <TableCell sx={{ width: '25%' }} >Username</TableCell>
                <TableCell sx={{ width: '20%' }}>Email</TableCell>
                <TableCell sx={{ width: '15%' }}>Role</TableCell>
                <TableCell sx={{ width: '15%' }}>Created At</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} hover>

                  {/* Checkbox */}
                  <TableCell padding="checkbox" sx={{ width: 50, pr: 1 }}>
<Checkbox
  checked={selected.includes(user.id)}
  onChange={() => handleSelect(user.id)}
/>
                  </TableCell>

                  {/* Avatar + Name */}
<TableCell sx={{ pl: 2 }}>
  <Stack direction="row" spacing={1} alignItems="center">
    <Avatar
      src={user.avatar}
      sx={{ width: 28, height: 28 }}
    />
    <Typography>{user.username}</Typography>
  </Stack>
</TableCell>

                  <TableCell >{user.email}</TableCell>

                  {/* Role Chip */}
                  <TableCell>
                    <Chip
                      label={user.role}
                      sx={{
                        backgroundColor: roleColors[user.role].bg,
                        color: roleColors[user.role].color,
                      }}
                       size="small"
                    />
                  </TableCell>

                  <TableCell >{user.createdAt}</TableCell>

                  <TableCell align="center">
                    <IconButton sx={{ color: '#5e35b1' }}>
                      <IconEdit size={18} />
                    </IconButton>

                    <IconButton
                      sx={{ color: '#d32f2f' }}
                      onClick={() =>
                        setUsers(users.filter((u) => u.id !== user.id))
                      }
                    >
                      <IconTrash size={18} />
                    </IconButton>
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