import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IconEye, IconEdit, IconTrash, IconUsers, IconX, IconDots, IconRefresh, IconUpload, IconDeviceFloppy } from '@tabler/icons-react';
import { Menu, ListItemIcon, ListItemText, Checkbox } from '@mui/material';
import useCallsStore from 'hooks/useCallsStore';
import {
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import {
  Box, Button, Card, CardContent, Chip, CircularProgress, Divider, Drawer,
  FormControl, Grid, IconButton, InputAdornment, InputLabel, MenuItem, Select,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, TablePagination, Typography
} from '@mui/material';
import useAuth from 'hooks/useAuth';

const stateColor = {
  pending: 'warning', in_progress: 'info', completed: 'success', rejected: 'error'
};
const statusLabel = {
  pending: 'Pending', in_progress: 'In Progress', completed: 'Completed', rejected: 'Rejected'
};
const sentimentColor = { positive: 'success', negative: 'error', neutral: 'default' };
const priorityColor = { high: 'error', medium: 'warning', low: 'success' };
const employees = ['Ahmad Ali', 'Sara Mohamed', 'Omar Khaled', 'Lina Hassan', 'Yousef Nasser'];
const rowsPerPage = 6;

export default function Calls() {
  const [page, setPage] = useState(0);
  const [editableIssue, setEditableIssue] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const location = useLocation();
  const state = location.state;

  const { calls, setCalls } = useCallsStore();

  // ✅ استخدم position بدل anchor element
  const [usersMenuPosition, setUsersMenuPosition] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);

  const closeUsersMenu = () => {
    setUsersMenuPosition(null);
    setUserSearch('');
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((name) =>
      name.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [userSearch]);

  const [anchorEl, setAnchorEl] = useState(null);
  const [menuCallId, setMenuCallId] = useState(null);

  const openMenu = (event, callId) => {
    setAnchorEl(event.currentTarget);
    setMenuCallId(callId);
  };
  const closeMenu = () => {
    setAnchorEl(null);
    setMenuCallId(null);
  };

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [callToDelete, setCallToDelete] = useState(null);

  const handleDelete = (id) => {
    const updated = calls.filter((c) => c.id !== id);
    setCalls(updated);
    window.dispatchEvent(new Event('calls-updated'));
  };

  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = (user?.role || '').toLowerCase();
  const isManager = role === 'manager';

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [reviewedFilter, setReviewedFilter] = useState('all');
  const [selectedCall, setSelectedCall] = useState(null);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [editableTranscript, setEditableTranscript] = useState('');
  const [editableSentiment, setEditableSentiment] = useState('neutral');
  const [editablePriority, setEditablePriority] = useState('medium');
  const [editableKeywords, setEditableKeywords] = useState('');

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, [search, statusFilter, sentimentFilter, reviewedFilter]);

  const filteredCalls = useMemo(() => {
    return calls.filter((call) => {
      const matchesSearch =
        call.id.toLowerCase().includes(search.toLowerCase()) ||
        call.status.toLowerCase().includes(search.toLowerCase()) ||
        call.sentiment.toLowerCase().includes(search.toLowerCase()) ||
        call.priority.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || call.status === statusFilter;
      const matchesSentiment = sentimentFilter === 'all' || call.sentiment === sentimentFilter;
      const matchesReviewed = reviewedFilter === 'all' || call.reviewed === reviewedFilter;
      return matchesSearch && matchesStatus && matchesSentiment && matchesReviewed;
    });
  }, [search, statusFilter, sentimentFilter, reviewedFilter, calls]);

  const openCallDrawer = (call, edit = false) => {
    setSelectedCall(call);
    setEditableTranscript(call.transcript);
    setEditableSentiment(call.sentiment);
    setEditablePriority(call.priority);
    setEditableIssue(call.issue || '');
    setEditableKeywords(call.keywords || 'billing, escalation');
    setIsEditMode(edit);
    setOpenDrawer(true);
  };

  useEffect(() => {
    const selectedId = state?.selectedCallId;
    if (!selectedId || !calls.length) return;

    const foundCall = calls.find((c) => String(c.id) === String(selectedId));
    if (!foundCall) return;

    if (!state?.openUsers) {
      if (state?.mode === 'edit') {
        openCallDrawer(foundCall, true);
      } else {
        openCallDrawer(foundCall, false);
      }
    }

    // ✅ فتح users menu بمنتصف يمين الشاشة لما يجي من Dashboard
    if (state?.openUsers) {
      setTimeout(() => {
        setUsersMenuPosition({
          top: window.innerHeight / 2,
          left: window.innerWidth / 2
        });
      }, 300);
    }

    window.history.replaceState({}, document.title);
  }, []);

  const closeCallDrawer = () => {
    setOpenDrawer(false);
    setSelectedCall(null);
  };

  const handleSave = () => {
    const updated = calls.map((c) =>
      c.id === selectedCall.id
        ? {
            ...c,
            transcript: editableTranscript,
            sentiment: editableSentiment,
            priority: editablePriority,
            issue: editableIssue,
            keywords: editableKeywords,
            status: selectedCall.status,
            reviewed: selectedCall.reviewed
          }
        : c
    );
    setIsDirty(false);
    setCalls(updated);
    window.dispatchEvent(new Event('calls-updated'));
    setIsEditMode(false);
    setOpenDrawer(false);
  };

  return (
    <>
      <input
        type="file"
        accept="audio/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const audioUrl = URL.createObjectURL(file);
          const newCall = {
            id: `C-${Date.now()}`,
            status: 'pending',
            sentiment: 'neutral',
            priority: 'medium',
            reviewed: 'No',
            issue: 'Uploaded audio call',
            transcript: 'Auto-generated call from uploaded audio file',
            audio: audioUrl,
            duration: '00:00',
            createdAt: new Date().toISOString().split('T')[0],
            uploadedBy: user?.name || 'System'
          };
          const updated = [newCall, ...calls];
          setCalls(updated);
          window.dispatchEvent(new Event('calls-updated'));
          e.target.value = '';
        }}
      />

      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom sx={{ padding: '16px 2px' }}>
            Calls Management
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth size="small" placeholder="Search calls..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {loading ? <CircularProgress size={16} /> : search ? (
                        <IconButton size="small" onClick={() => setSearch('')}>
                          <IconX size={14} />
                        </IconButton>
                      ) : null}
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12} md={3} sx={{ minWidth: 80 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" sx={{ borderRadius: 2 }}
                  onChange={(event) => setStatusFilter(event.target.value)}>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3} sx={{ minWidth: 80 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Sentiment</InputLabel>
                <Select value={sentimentFilter} label="Sentiment" sx={{ borderRadius: 2 }}
                  onChange={(event) => setSentimentFilter(event.target.value)}>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="positive">Positive</MenuItem>
                  <MenuItem value="negative">Negative</MenuItem>
                  <MenuItem value="neutral">Neutral</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3} sx={{ minWidth: 80 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Reviewed</InputLabel>
                <Select value={reviewedFilter} label="Reviewed" sx={{ borderRadius: 2 }}
                  onChange={(event) => setReviewedFilter(event.target.value)}>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2} sx={{ minWidth: 80 }}>
              <Button fullWidth variant="outlined" startIcon={<IconRefresh size={18} />}
                onClick={() => { setStatusFilter('all'); setSentimentFilter('all'); setReviewedFilter('all'); }}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500 }}>
                Reset
              </Button>
            </Grid>

            <Grid item xs={12} md={2} sx={{ ml: 'auto', minWidth: 80 }}>
              <Button fullWidth variant="contained" startIcon={<IconUpload size={18} />}
                onClick={() => fileInputRef.current?.click()}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500 }}>
                Upload
              </Button>
            </Grid>
          </Grid>

          <TableContainer sx={{ overflowX: 'hidden' }}>
            <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell sx={{ width: 120 }}>Priority</TableCell>
                  <TableCell sx={{ width: 140 }}>Status</TableCell>
                  <TableCell sx={{ width: 120 }}>Sentiment</TableCell>
                  <TableCell sx={{ width: 100 }}>Duration</TableCell>
                  <TableCell sx={{ width: 140 }}>Created At</TableCell>
                  <TableCell sx={{ width: 120 }}>Reviewed</TableCell>
                  <TableCell sx={{ width: 150 }}>Uploaded By</TableCell>
                  <TableCell align="center" sx={{ width: 160 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCalls.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((call) => (
                  <TableRow key={call.id} sx={{ '& td': { py: 1.5 } }}>
                    <TableCell sx={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {call.id.length > 14 ? call.id.slice(0, 14) + '...' : call.id}
                    </TableCell>
                    <TableCell><Chip label={call.priority} color={priorityColor[call.priority]} size="small" /></TableCell>
                    <TableCell><Chip label={statusLabel[call.status] || call.status} color={stateColor[call.status]} size="small" /></TableCell>
                    <TableCell><Chip label={call.sentiment} color={sentimentColor[call.sentiment]} size="small" /></TableCell>
                    <TableCell>{call.duration}</TableCell>
                    <TableCell>
                      <Box component="span" sx={{ direction: 'ltr', unicodeBidi: 'isolate', display: 'inline-block' }}>
                        {call.createdAt}
                      </Box>
                    </TableCell>
                    <TableCell><Chip label={call.reviewed} color={call.reviewed === 'Yes' ? 'success' : 'error'} size="small" /></TableCell>
                    <TableCell>{call.uploadedBy}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <IconButton size="small" onClick={() => openCallDrawer(call, false)} sx={{ color: '#673ab7' }}>
                          <IconEye size={18} />
                        </IconButton>
                        <IconButton size="small" onClick={(e) => openMenu(e, call.id)} sx={{ color: '#1e88e5' }}>
                          <IconDots size={18} />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCalls.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Box sx={{ py: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">No results found</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 1 }}>
            <TablePagination
              component="div"
              count={filteredCalls.length}
              page={page}
              onPageChange={(event, newPage) => setPage(newPage)}
              rowsPerPage={6}
              rowsPerPageOptions={[]}
            />
          </Box>
        </CardContent>
      </Card>

      {/* 3 Dots Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
        <MenuItem onClick={() => {
          const call = calls.find((c) => c.id === menuCallId);
          if (call) { openCallDrawer(call); setIsEditMode(true); }
          closeMenu();
        }}>
          <ListItemIcon><IconEdit size={16} /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>

        {/* ✅ احفظ position الزر لما تضغط Users */}
        <MenuItem onClick={(e) => {
          const rect = anchorEl.getBoundingClientRect();
          setUsersMenuPosition({ top: rect.top, left: rect.left });
          closeMenu();
        }}>
          <ListItemIcon><IconUsers size={16} /></ListItemIcon>
          <ListItemText>Users</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => {
          setCallToDelete(menuCallId);
          setOpenDeleteDialog(true);
          closeMenu();
        }}>
          <ListItemIcon><IconTrash size={16} /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* ✅ Users Menu بـ anchorPosition */}
      <Menu
        open={Boolean(usersMenuPosition)}
        onClose={closeUsersMenu}
        anchorReference="anchorPosition"
        anchorPosition={usersMenuPosition ?? undefined}
        disableAutoFocusItem
        disableEnforceFocus
        PaperProps={{ sx: { width: 280, p: 1 } }}
      >
        <Box sx={{ px: 1, py: 1 }}>
          <TextField
            onKeyDown={(e) => e.stopPropagation()}
            size="small" fullWidth placeholder="Search employees..."
            value={userSearch} autoFocus
            onChange={(e) => setUserSearch(e.target.value)}
          />
        </Box>
        <Divider />
        {filteredEmployees.map((name) => (
          <MenuItem key={name} onClick={() => {
            setSelectedUsers((prev) =>
              prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
            );
          }}>
            <Checkbox checked={selectedUsers.includes(name)} />
            <ListItemText>{name}</ListItemText>
          </MenuItem>
        ))}
        <Divider />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
          <Button variant="contained" size="small" onClick={() => {
            console.log('Selected Users:', selectedUsers);
             setSelectedUsers([]);
            closeUsersMenu();
          }}>
            send
          </Button>
        </Box>
      </Menu>

      {/* Delete Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}
        maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete {callToDelete}?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} variant="outlined"
            sx={{ color: 'text.secondary', borderColor: 'grey.400', '&:hover': { borderColor: 'grey.600', backgroundColor: 'grey.100' } }}>
            Cancel
          </Button>
          <Button onClick={() => { handleDelete(callToDelete); setOpenDeleteDialog(false); }}
            variant="contained" color="error"
            sx={{ backgroundColor: 'error.dark', '&:hover': { backgroundColor: 'error.main' } }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Drawer */}
      <Drawer anchor="right" open={openDrawer} onClose={closeCallDrawer}>
        <Box sx={{ width: { xs: 320, sm: 420 }, p: 3 }}>
          {selectedCall && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{
                    width: 10, height: 10, borderRadius: '50%',
                    backgroundColor: (theme) => theme.palette[stateColor[selectedCall.status]]?.main || '#999'
                  }} />
                  <Typography variant="h5">Call Details - {selectedCall.id}</Typography>
                  <IconButton size="small"
                    onClick={() => { if (isEditMode) { handleSave(); setIsDirty(false); } else { setIsEditMode(true); } }}
                    sx={{ color: isDirty ? 'primary.main' : 'text.primary', transition: '0.2s' }}>
                    {isEditMode ? <IconDeviceFloppy size={22} /> : <IconEdit size={18} />}
                  </IconButton>
                </Box>
                <IconButton onClick={closeCallDrawer} size="small"><IconX size={18} /></IconButton>
              </Box>

              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">{selectedCall.createdAt}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Uploaded by{' '}
                  <Box component="span"
                    onClick={() => console.log('Go to user:', selectedCall.uploadedBy)}
                    sx={{ fontWeight: 600, color: 'text.primary', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                    {selectedCall.uploadedBy}
                  </Box>
                </Typography>
              </Stack>

              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Main Issue</Typography>
              {isEditMode ? (
                <TextField fullWidth size="small" value={editableIssue}
                  onChange={(e) => { setEditableIssue(e.target.value); setIsDirty(true); }} sx={{ mb: 2 }} />
              ) : (
                <Typography variant="body2" sx={{ mb: 5 }}>{editableIssue}</Typography>
              )}

              <Typography variant="subtitle1" gutterBottom>Analysis</Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                {isEditMode ? (
                  <Select fullWidth size="small" value={editableSentiment}
                    onChange={(e) => { setEditableSentiment(e.target.value); setIsDirty(true); }} sx={{ mb: 2 }}>
                    <MenuItem value="positive">Positive</MenuItem>
                    <MenuItem value="negative">Negative</MenuItem>
                    <MenuItem value="neutral">Neutral</MenuItem>
                  </Select>
                ) : (
                  <Chip label={editableSentiment} color={sentimentColor[editableSentiment]} size="small" sx={{ mb: 5 }} />
                )}
                {isEditMode ? (
                  <Select fullWidth size="small" value={editablePriority}
                    onChange={(e) => { setEditablePriority(e.target.value); setIsDirty(true); }} sx={{ mb: 2 }}>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                  </Select>
                ) : (
                  <Chip label={`${editablePriority} Priority`} color={priorityColor[editablePriority]} size="small" sx={{ mb: 5 }} />
                )}
              </Stack>

              <Typography variant="subtitle1" sx={{ mb: 1 }}>Keywords</Typography>
              {isEditMode ? (
                <TextField fullWidth size="small" placeholder="comma separated..." value={editableKeywords}
                  onChange={(e) => { setEditableKeywords(e.target.value); setIsDirty(true); }} sx={{ mb: 2 }} />
              ) : (
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 5 }}>
                  {editableKeywords.split(',').map((k, i) => <Chip key={i} label={k.trim()} size="small" />)}
                </Stack>
              )}

              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle1" gutterBottom>Transcript</Typography>
              <TextField fullWidth multiline minRows={4} value={editableTranscript}
                disabled={!isEditMode}
                onChange={(e) => { setEditableTranscript(e.target.value); setIsDirty(true); }} sx={{ mb: 2 }} />

              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle1" gutterBottom>Audio</Typography>
              <Box sx={{ mb: 2 }}>
                <audio controls style={{ width: '100%' }}
                  src={selectedCall?.audio || 'https://www.w3schools.com/html/horse.mp3'} />
              </Box>

              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle1" gutterBottom>Actions</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                <Button variant="contained" size="small"
                  onClick={() => navigate('/followups', { state: { openCreateFollowup: true, callId: selectedCall.id } })}>
                  {isManager ? 'Assign Follow-up' : 'Needs Follow-up'}
                </Button>
                <Button variant={selectedCall.reviewed === 'Yes' ? 'contained' : 'outlined'} size="small"
                  onClick={() => {
                    const updated = calls.map((c) =>
                      c.id === selectedCall.id ? { ...c, reviewed: c.reviewed === 'Yes' ? 'No' : 'Yes' } : c
                    );
                    setCalls(updated);
                    setSelectedCall((prev) => ({ ...prev, reviewed: prev.reviewed === 'Yes' ? 'No' : 'Yes' }));
                    window.dispatchEvent(new Event('calls-updated'));
                  }}>
                  {selectedCall.reviewed === 'Yes' ? 'Reviewed' : 'No Reviewed'}
                </Button>
              </Stack>
            </>
          )}
        </Box>
      </Drawer>
    </>
  );
}