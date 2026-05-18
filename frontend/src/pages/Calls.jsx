import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IconEye, IconEdit, IconTrash, IconUsers, IconX, IconDots, 
  IconRefresh, IconUpload, IconDeviceFloppy,IconCheck, IconFilter ,IconAdjustmentsHorizontal,
  IconSearch
 } from '@tabler/icons-react';
import useCallsStore from 'hooks/useCallsStore';
import {
  Box, Button, Card, CardContent, Chip, CircularProgress, Divider, Drawer,
  FormControl, Grid, IconButton, InputAdornment, InputLabel, MenuItem, Select,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, TablePagination, Typography, Menu, ListItemIcon, ListItemText, Checkbox,
    Backdrop,  LinearProgress,Dialog, DialogTitle, DialogContent, DialogContentText, 
    DialogActions, Popover, Badge
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

 const {
  calls,
  setCalls,
  isProcessing,
  setIsProcessing,
  processingProgress,
  setProcessingProgress
} = useCallsStore();

const handleFileUpload = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const audioUrl = URL.createObjectURL(file);
  const newCallId = `C-${Date.now().toString().slice(-5)}`;

  // افتح البوب اب
  setIsProcessing(true);
  setProcessingProgress(0);

  // ضيف المكالمة مباشرة
  const newCall = {
    id: newCallId,
    status: 'in_progress',
    sentiment: 'neutral',
    priority: 'medium',
    reviewed: 'No',
    issue: 'AI is processing the uploaded call...',
    transcript: 'Transcribing audio and analyzing sentiment...',
    audio: audioUrl,
    duration: '00:00',
    createdAt: new Date().toISOString().split('T')[0],
    uploadedBy: user?.name || 'System'
  };

  setCalls((prev) => [newCall, ...prev]);

  // محاكاة المعالجة
  let progress = 0;

  const interval = setInterval(() => {
    progress += 10;

    setProcessingProgress(progress);

    if (progress >= 100) {
      clearInterval(interval);

      // بعد اكتمال المعالجة
      setTimeout(() => {
        setCalls((prev) =>
          prev.map((c) =>
            c.id === newCallId
              ? {
                  ...c,
                  status: 'completed',
                  sentiment: 'positive',
                  priority: 'low',
                  issue: 'Billing issue resolved successfully',
                  transcript:
                    'Customer issue was resolved and the client confirmed satisfaction.',
                  duration: '02:45'
                }
              : c
          )
        );

       setTimeout(() => {
  setIsProcessing(false);
  setProcessingProgress(0);
}, 1200);
        window.dispatchEvent(new Event('calls-updated'));
      }, 500);
    }
  }, 400);

  e.target.value = '';
};

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
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [reviewedFilter, setReviewedFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCall, setSelectedCall] = useState(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);

  const openFilters = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const closeFilters = () => {
    setFilterAnchorEl(null);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (sentimentFilter !== 'all') count++;
    if (priorityFilter !== 'all') count++;
    if (reviewedFilter !== 'all') count++;
    if (startDate) count++;
    if (endDate) count++;
    return count;
  }, [statusFilter, sentimentFilter, priorityFilter, reviewedFilter, startDate, endDate]);

  const [openDrawer, setOpenDrawer] = useState(false);
  const [editableTranscript, setEditableTranscript] = useState('');
  const [editableSentiment, setEditableSentiment] = useState('neutral');
  const [editablePriority, setEditablePriority] = useState('medium');
  const [editableKeywords, setEditableKeywords] = useState('');

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, [search, statusFilter, sentimentFilter, priorityFilter, reviewedFilter, startDate, endDate]);

  const filteredCalls = useMemo(() => {
    if (!Array.isArray(calls)) return [];
    return calls.filter((call) => {
      const matchesSearch =
        String(call.id).toLowerCase().includes(search.toLowerCase()) ||
        call.status.toLowerCase().includes(search.toLowerCase()) ||
        call.sentiment.toLowerCase().includes(search.toLowerCase()) ||
        call.priority.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || call.status === statusFilter;
      const matchesSentiment = sentimentFilter === 'all' || call.sentiment === sentimentFilter;
      const matchesPriority = priorityFilter === 'all' || call.priority === priorityFilter;
      const matchesReviewed = reviewedFilter === 'all' || call.reviewed === reviewedFilter;

      // Date range filter
      let matchesDate = true;
      if (startDate || endDate) {
        const callDate = new Date(call.createdAt);
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (callDate < start) matchesDate = false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (callDate > end) matchesDate = false;
        }
      }

      return matchesSearch && matchesStatus && matchesSentiment && matchesPriority && matchesReviewed && matchesDate;
    });
  }, [search, statusFilter, sentimentFilter, priorityFilter, reviewedFilter, startDate, endDate, calls]);

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
  onChange={handleFileUpload}
/>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom sx={{ padding: '16px 2px' }}>
            Calls Management
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth size="small" placeholder="Search calls ..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                sx={{
                  borderRadius: '12px',
                  bgcolor: 'background.paper',
                  '& .MuiOutlinedInput-notchedOutline': { borderRadius: '12px' }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconSearch size={18} style={{ color: '#9e9e9e' }} />
                    </InputAdornment>
                  ),
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

            <Grid item xs={6} md="auto">
              <Badge badgeContent={activeFilterCount} color="primary">
                <Button
                  variant="outlined"
                  startIcon={<IconAdjustmentsHorizontal size={18} />}
                  onClick={openFilters}
                  sx={{ 
                    borderRadius: 2, 
                    textTransform: 'none', 
                    fontWeight: 600,
                    height: 40,
                    borderColor: activeFilterCount > 0 ? 'primary.main' : 'divider',
                    bgcolor: activeFilterCount > 0 ? 'primary.light' : 'transparent'
                  }}
                >
                  Filters
                </Button>
              </Badge>
            </Grid>

            {activeFilterCount > 0 && (
              <Grid item xs={6} md="auto">
                <Button
                  variant="text"
                  color="error"
                  startIcon={<IconRefresh size={18} />}
                  onClick={() => {
                    setStatusFilter('all');
                    setSentimentFilter('all');
                    setPriorityFilter('all');
                    setReviewedFilter('all');
                    setStartDate('');
                    setEndDate('');
                  }}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Reset All
                </Button>
              </Grid>
            )}

            <Grid item xs={12} md="auto" sx={{ ml: 'auto' }}>
              <Button 
                variant="contained" 
                startIcon={<IconUpload size={18} />}
                onClick={() => fileInputRef.current?.click()}
                sx={{ 
                  borderRadius: 2, 
                  textTransform: 'none', 
                  fontWeight: 600,
                  height: 40,
                  boxShadow: (theme) => theme.vars.customShadows.z1
                }}
              >
                Upload Call
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
            PaperProps={{
              sx: {
                p: 3,
                width: 320,
                borderRadius: 3,
                mt: 1.5,
                boxShadow: (theme) => theme.vars.customShadows.z1
              }
            }}
          >
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>Filter Calls</Typography>
            <Stack spacing={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status"
                  onChange={(event) => setStatusFilter(event.target.value)}>
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select value={priorityFilter} label="Priority"
                  onChange={(event) => setPriorityFilter(event.target.value)}>
                  <MenuItem value="all">All Priorities</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Sentiment</InputLabel>
                <Select value={sentimentFilter} label="Sentiment"
                  onChange={(event) => setSentimentFilter(event.target.value)}>
                  <MenuItem value="all">All Sentiments</MenuItem>
                  <MenuItem value="positive">Positive</MenuItem>
                  <MenuItem value="negative">Negative</MenuItem>
                  <MenuItem value="neutral">Neutral</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Reviewed</InputLabel>
                <Select value={reviewedFilter} label="Reviewed"
                  onChange={(event) => setReviewedFilter(event.target.value)}>
                  <MenuItem value="all">All Reviews</MenuItem>
                  <MenuItem value="Yes">Reviewed</MenuItem>
                  <MenuItem value="No">Not Reviewed</MenuItem>
                </Select>
              </FormControl>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                  Date Range
                </Typography>
                <Stack direction="row" spacing={1}>
                  <TextField
                    fullWidth size="small" type="date"
                    label="From" InputLabelProps={{ shrink: true }}
                    value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  />
                  <TextField
                    fullWidth size="small" type="date"
                    label="To" InputLabelProps={{ shrink: true }}
                    value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  />
                </Stack>
              </Box>

              <Button 
                variant="contained" 
                fullWidth 
                onClick={closeFilters}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Apply Filters
              </Button>
            </Stack>
          </Popover>

          <TableContainer sx={{ overflowX: 'auto', width: '100%' }}>
            <Table size="small" sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell sx={{ width: 120 }}>Priority</TableCell>
                  <TableCell sx={{ width: 140 }}>Status</TableCell>
                  <TableCell sx={{ width: 120 }}>Sentiment</TableCell>
                  <TableCell sx={{ width: 100, display: { xs: 'none', md: 'table-cell' } }}>Duration</TableCell>
                  <TableCell sx={{ width: 140, display: { xs: 'none', lg: 'table-cell' } }}>Created At</TableCell>
                  <TableCell sx={{ width: 120 }}>Reviewed</TableCell>
                  <TableCell sx={{ width: 150, display: { xs: 'none', lg: 'table-cell' } }}>Uploaded By</TableCell>
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
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{call.duration}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                      <Box component="span" sx={{ direction: 'ltr', unicodeBidi: 'isolate', display: 'inline-block' }}>
                        {call.createdAt}
                      </Box>
                    </TableCell>
                    <TableCell><Chip label={call.reviewed} color={call.reviewed === 'Yes' ? 'success' : 'error'} size="small" /></TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{call.uploadedBy}</TableCell>
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
            sx={{ color: 'text.secondary',
             borderColor: 'grey.400', 
             '&:hover': 
             { borderColor: 'grey.600', 
             backgroundColor: 'grey.100' } }}>
            Cancel
          </Button>
          <Button onClick={() => { handleDelete(callToDelete); setOpenDeleteDialog(false); }}
            variant="contained" color="error"
            sx={{ backgroundColor: 'error.dark', '&:hover': { backgroundColor: 'error.main' } }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>


<Backdrop
  sx={{
    color: '#fff',
    zIndex: (theme) => theme.zIndex.drawer + 1,
    flexDirection: 'column',
    backdropFilter: 'blur(4px)',
    bgcolor: (theme) => theme.vars.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)'
  }}
  open={isProcessing}
>
  <Card
    sx={{
      p: 4,
      borderRadius: 4,
      boxShadow: 24,
      width: 400,
      textAlign: 'center',
      transition: '0.3s'
    }}
  >
    <Stack spacing={3} alignItems="center">
      {processingProgress < 100 ? (
        <>
          {/* Progress Circle */}
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate"
              value={processingProgress}
              size={80}
              thickness={4}
              sx={{ color: 'primary.main' }}
            />

            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography
                variant="caption"
                component="div"
                color="text.secondary"
                sx={{
                  fontWeight: 700,
                  fontSize: '1rem'
                }}
              >
                {`${Math.round(processingProgress)}%`}
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography
              variant="h4"
              sx={{
                color: 'text.primary',
                fontWeight: 700,
                mb: 1
              }}
            >
               Processing...
            </Typography>
          </Box>

         


        </>
      ) : (
        <>
          {/* Success State */}
          <Box
            sx={{
              width: 90,
              height: 90,
              borderRadius: '50%',
              bgcolor: 'success.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pop 0.4s ease'
            }}
          >
            <IconCheck size={50} stroke={3} />
          </Box>

          <Box >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: 'success.main',
                mb: 1
              }}
            >
              Completed
            </Typography>

          </Box>
        </>
      )}
    </Stack>
  </Card>
</Backdrop>

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