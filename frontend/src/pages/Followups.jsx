import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

// MUI
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  alpha,
  useTheme,
  Drawer,
Divider,
IconButton
} from '@mui/material';

// Icons
import {
  IconChecks,
  IconClipboardText,
  IconPlus,
  IconUser,
  IconClockHour4,
  IconRefresh ,
  IconX,
IconEdit,
IconDeviceFloppy
} from '@tabler/icons-react';

const initialFollowups = [
  {
    id: 'F-1001',
    callId: 'C-1002',
    assignedTo: 'Maya',
    status: 'pending',
    notes: 'Customer asked for escalation callback within 24h',
    createdAt: '2026-04-08'
  },
  {
    id: 'F-1002',
    callId: 'C-1004',
    assignedTo: 'Ali',
    status: 'done',
    notes: 'Issue resolved and customer confirmed closure',
    createdAt: '2026-04-07'
  },
  {
    id: 'F-1003',
    callId: 'C-1006',
    assignedTo: 'Rama',
    status: 'pending',
    notes: 'Share final setup guide via follow-up call',
    createdAt: '2026-04-06'
  },
  {
    id: 'F-1004',
    callId: 'C-1008',
    assignedTo: 'Omar',
    status: 'done',
    notes: 'Final check completed successfully',
    createdAt: '2026-04-05'
  }
];

const assignees = ['Maya', 'Ali', 'Rama', 'Omar'];

export default function Followups() {


const [assignedFilter, setAssignedFilter] = useState('all');
const [dateFilter, setDateFilter] = useState('');

  const theme = useTheme();
  const location = useLocation();

  const [statusFilter, setStatusFilter] = useState('all');
  const [followups, setFollowups] = useState(initialFollowups);

  const [openCreateDialog, setOpenCreateDialog] = useState(false);

  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');
  const [callIdInput, setCallIdInput] = useState('');

  // Fake calls data as state
  const [calls, setCalls] = useState([
    {
      id: 'C-1002',
      status: 'pending',
      createdAt: '2026-04-08',
      uploadedBy: 'Admin',
      mainIssue: 'Customer requested escalation callback',
      sentiment: 'negative',
      priority: 'high',
      keywords: 'callback, escalation, support',
      transcript: 'Customer was frustrated and requested escalation.',
      reviewed: 'No',
      audio: 'https://www.w3schools.com/html/horse.mp3'
    },
    {
      id: 'C-1004',
      status: 'done',
      createdAt: '2026-04-07',
      uploadedBy: 'Ali',
      mainIssue: 'Issue resolved successfully',
      sentiment: 'positive',
      priority: 'low',
      keywords: 'resolved, setup',
      transcript: 'Customer confirmed everything works.',
      reviewed: 'Yes',
      audio: 'https://www.w3schools.com/html/horse.mp3'
    },
    {
      id: 'C-1006',
      status: 'pending',
      createdAt: '2026-04-06',
      uploadedBy: 'Maya',
      mainIssue: 'Need final setup guidance',
      sentiment: 'neutral',
      priority: 'medium',
      keywords: 'guide, setup',
      transcript: 'Customer asked for final setup walkthrough.',
      reviewed: 'No',
      audio: 'https://www.w3schools.com/html/horse.mp3'
    },
    {
      id: 'C-1008',
      status: 'done',
      createdAt: '2026-04-05',
      uploadedBy: 'Omar',
      mainIssue: 'Final check completed successfully',
      sentiment: 'positive',
      priority: 'low',
      keywords: 'final, check, completed',
      transcript: 'All tests passed and final check is complete.',
      reviewed: 'Yes',
      audio: 'https://www.w3schools.com/html/horse.mp3'
    }
  ]);

  useEffect(() => {
    if (location.state?.openCreateFollowup) {
      setOpenCreateDialog(true);
      setCallIdInput(location.state.callId || '');
    }
  }, [location.state]);

const filtered = useMemo(() => {
  return followups.filter((f) => {
    const matchesStatus =
      statusFilter === 'all' || f.status === statusFilter;

    const matchesAssigned =
      assignedFilter === 'all' || f.assignedTo === assignedFilter;

    const matchesDate =
      !dateFilter || f.createdAt === dateFilter;

    return matchesStatus && matchesAssigned && matchesDate;
  });
}, [followups, statusFilter, assignedFilter, dateFilter]);


  const pendingCount = followups.filter((f) => f.status === 'pending').length;
  const doneCount = followups.filter((f) => f.status === 'done').length;

  const handleMarkDone = (id) => {
    setFollowups((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'done' } : item
      )
    );
  };

  const handleCreateFollowup = () => {
    if (!assignedTo || !notes.trim()) return;

    const nextId = `F-${Date.now()}`;
    const targetCallId = callIdInput || `C-${1000 + followups.length + 1}`;

    const newItem = {
      id: nextId,
      callId: targetCallId,
      assignedTo,
      status: 'pending',
      notes: notes.trim(),
      createdAt: new Date().toISOString().slice(0, 10)
    };

    setFollowups((prev) => [newItem, ...prev]);

    // Ensure the call exists in our state so the drawer can open
    if (!calls.find((c) => c.id === targetCallId)) {
      setCalls((prev) => [
        ...prev,
        {
          id: targetCallId,
          status: 'pending',
          createdAt: new Date().toISOString().slice(0, 10),
          uploadedBy: 'System',
          mainIssue: notes.trim(),
          sentiment: 'neutral',
          priority: 'medium',
          keywords: 'manual, entry',
          transcript: 'Transcript not available for manually created follow-up.',
          reviewed: 'No',
          audio: 'https://www.w3schools.com/html/horse.mp3'
        }
      ]);
    }

    setOpenCreateDialog(false);

    setAssignedTo('');
    setNotes('');
    setCallIdInput('');
  };


  // Drawer States
const [openDrawer, setOpenDrawer] = useState(false);
const [selectedCall, setSelectedCall] = useState(null);

const [isEditMode, setIsEditMode] = useState(false);
const [isDirty, setIsDirty] = useState(false);

const [editableIssue, setEditableIssue] = useState('');
const [editableSentiment, setEditableSentiment] = useState('');
const [editablePriority, setEditablePriority] = useState('');
const [editableKeywords, setEditableKeywords] = useState('');
const [editableTranscript, setEditableTranscript] = useState('');

// Colors
const sentimentColor = {
  positive: 'success',
  negative: 'error',
  neutral: 'default'
};

const priorityColor = {
  high: 'error',
  medium: 'warning',
  low: 'success'
};

const stateColor = {
  pending: 'warning',
  done: 'success'
};

  const openCallDrawer = (callId) => {
    try {
      console.log('--- openCallDrawer Started ---');
      console.log('Call ID provided:', callId);

      if (!callId) {
        console.error('No Call ID provided');
        return;
      }

      if (!Array.isArray(calls)) {
        console.error('Calls state is not an array:', calls);
        return;
      }

      const call = calls.find((c) =>
        c && c.id && String(c.id).trim() === String(callId).trim()
      );

      if (!call) {
        console.warn('Call not found in state. Available IDs:', calls.map(c => c.id));
        alert(`Call ${callId} not found. Please try again or refresh the page.`);
        return;
      }

      console.log('Call successfully found:', call);

      setSelectedCall(call);
      setEditableIssue(call.mainIssue || call.issue || '');
      setEditableSentiment(call.sentiment || 'neutral');
      setEditablePriority(call.priority || 'medium');
      setEditableKeywords(call.keywords || '');
      setEditableTranscript(call.transcript || '');

      setOpenDrawer(true);
      console.log('Drawer state set to open');
    } catch (error) {
      console.error('Critical error in openCallDrawer:', error);
      alert('An error occurred while trying to open call details.');
    }
  };

  const closeCallDrawer = () => {
    setOpenDrawer(false);
    setSelectedCall(null);
    setIsEditMode(false);
    setIsDirty(false);
  };

const handleSave = () => {
  // Update the calls state so changes persist during the session
  setCalls((prev) =>
    prev.map((c) =>
      c.id === selectedCall.id
        ? {
            ...c,
            mainIssue: editableIssue,
            sentiment: editableSentiment,
            priority: editablePriority,
            keywords: editableKeywords,
            transcript: editableTranscript
          }
        : c
    )
  );

  // Also update the selected call so the UI reflects changes immediately
  setSelectedCall((prev) => ({
    ...prev,
    mainIssue: editableIssue,
    sentiment: editableSentiment,
    priority: editablePriority,
    keywords: editableKeywords,
    transcript: editableTranscript
  }));

  setIsEditMode(false);
};

  const statusChip = (status) => {
    if (status === 'pending') {
      return (
        <Chip
          label="Pending"
          size="small"
          sx={{
            
            borderRadius: '10px',
            bgcolor: alpha(theme.palette.warning.main, 0.12),
            color: theme.palette.warning.dark,
          }}
        />
      );
    }

    return (
      <Chip
        label="Done"
        size="small"
        sx={{
          borderRadius: '10px',
          bgcolor: alpha(theme.palette.success.main, 0.12),
          color: theme.palette.success.dark,
        }}
      />
    );
  };

  return (
    <>
      <Card
      sx={{ borderRadius: 3 }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
            spacing={2}
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography
                variant="h4"
                 gutterBottom sx={{ padding: '16px 2px' }}
              >
                Follow-ups Management
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<IconPlus size={18} />}
              onClick={() => setOpenCreateDialog(true)}
              sx={{
                borderRadius: '14px',
                textTransform: 'none',
                px: 2.5,
                height: 44,
                fontWeight: 600,
                boxShadow: 'none'
              }}
            >
              Create 
            </Button>
          </Stack>

          {/* Stats */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  borderRadius: '20px',
                  boxShadow: 'none',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`
                }}
              >
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                        color: theme.palette.primary.main
                      }}
                    >
                      <IconClipboardText size={20} />
                    </Avatar>

                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Follow-ups
                      </Typography>

                      <Typography variant="h4" fontWeight={700}>
                        {followups.length}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  borderRadius: '20px',
                  boxShadow: 'none',
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.15)}`
                }}
              >
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      sx={{
                        bgcolor: alpha(theme.palette.warning.main, 0.12),
                        color: theme.palette.warning.main
                      }}
                    >
                      <IconClockHour4 size={20} />
                    </Avatar>

                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Pending
                      </Typography>

                      <Typography variant="h4" fontWeight={700}>
                        {pendingCount}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  borderRadius: '20px',
                  boxShadow: 'none',
                  border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`
                }}
              >
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      sx={{
                        bgcolor: alpha(theme.palette.success.main, 0.12),
                        color: theme.palette.success.main
                      }}
                    >
                      <IconChecks size={20} />
                    </Avatar>

                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Completed
                      </Typography>

                      <Typography variant="h4" fontWeight={700}>
                        {doneCount}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

{/* FILTERS */}
<Grid container spacing={2} sx={{ mb: 3 }}>

  {/* STATUS */}
  <Grid size={{ xs: 12, md: 3 }}>
    <FormControl fullWidth size="small">
      <InputLabel>Status</InputLabel>

      <Select
        value={statusFilter}
        label="Status"
        onChange={(e) => setStatusFilter(e.target.value)}
        sx={{ borderRadius: 2 }}
      >
        <MenuItem value="all">All</MenuItem>
        <MenuItem value="pending">Pending</MenuItem>
        <MenuItem value="done">Done</MenuItem>
      </Select>
    </FormControl>
  </Grid>

  {/* ASSIGNED */}
  <Grid size={{ xs: 12, md: 3 }}>
    <FormControl fullWidth size="small">
      <InputLabel>Assigned To</InputLabel>

      <Select
        value={assignedFilter}
        label="Assigned To"
        onChange={(e) => setAssignedFilter(e.target.value)}
        sx={{ borderRadius: 2 }}
      >
        <MenuItem value="all">All</MenuItem>

        {[...new Set(followups.map((f) => f.assignedTo))].map((name) => (
          <MenuItem key={name} value={name}>
            {name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Grid>

  {/* DATE */}
  <Grid size={{ xs: 12, md: 3 }}>
    <TextField
      fullWidth
      size="small"
      type="date"
      label="Date"
      value={dateFilter}
      onChange={(e) => setDateFilter(e.target.value)}
      InputLabelProps={{ shrink: true }}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 2
        }
      }}
    />
  </Grid>

  {/* RESET */}
  <Grid size={{ xs: 12, md: 3 }}>
    <Button
      fullWidth
      variant="outlined"
      startIcon={<IconRefresh size={18} />}
      onClick={() => {
        setStatusFilter('all');
        setAssignedFilter('all');
        setDateFilter('');
      }}
      sx={{
        height: '40px',
        borderRadius: 2,
        textTransform: 'none'
      }}
    >
      Reset
    </Button>
  </Grid>

</Grid>

        
{/* Table */}


    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 800 }}>
        <TableHead>
          <TableRow>
            <TableCell> ID</TableCell>
            <TableCell sx={{ width: 180 }}>Assigned To</TableCell>
            <TableCell sx={{ width: 120 }}>Status</TableCell>
            <TableCell sx={{ minWidth: 260 }}>Notes</TableCell>
            <TableCell
              sx={{
                width: 140,
                display: { xs: 'none', md: 'table-cell' }
              }}
            >
              Created At
            </TableCell>
            <TableCell align="center" sx={{ width: 240 }}>
              Actions
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {filtered.map((item) => (
            <TableRow
              key={item.id}
              sx={{
                '& td': {
                  py: 1.5
                }
              }}
            >
              <TableCell>
                <Typography >
                  {item.callId}
                </Typography>
              </TableCell>

              <TableCell>
                <Stack direction="row" spacing={1.2} alignItems="center">
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: 14,
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      color: theme.palette.primary.main
                    }}
                  >
                    <IconUser size={16} />
                  </Avatar>

                  <Typography >
                    {item.assignedTo}
                  </Typography>
                </Stack>
              </TableCell>

              <TableCell>
                {statusChip(item.status)}
              </TableCell>

              <TableCell
                sx={{
                  maxWidth: 280,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {item.notes}
              </TableCell>

              <TableCell
                sx={{
                  display: { xs: 'none', md: 'table-cell' }
                }}
              >
                <Box
                  component="span"
                  sx={{
                    unicodeBidi: 'isolate',
                    display: 'inline-block'
                  }}
                >
                  {item.createdAt}
                </Box>
              </TableCell>

              <TableCell align="center">
                <Stack
                  direction="row"
                  spacing={1}
                  justifyContent="center"
                >
<Button
  size="small"
  variant="outlined"
  onClick={() => openCallDrawer(item.callId)}
  sx={{
    borderRadius: '10px',
    textTransform: 'none',
    minWidth: 95
  }}
>
  View Call
</Button>

                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    disabled={item.status === 'done'}
                    onClick={() => handleMarkDone(item.id)}
                    sx={{
                      borderRadius: '10px',
                      textTransform: 'none',
                      boxShadow: 'none',
                      minWidth: 120
                    }}
                  >
                    Mark Done
                  </Button>
                </Stack>
              </TableCell>
            </TableRow>
          ))}

          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={6}>
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <Typography
                    variant="body1"
                    fontWeight={600}
                    sx={{ mb: 0.5 }}
                  >
                    No follow-ups found
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    No follow-ups match the selected status.
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Box>
  </CardContent>
  
</Card>
         

      {/* Dialog */}
      <Dialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: '24px',
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Create Follow-up
        </DialogTitle>

        <DialogContent>
          <Grid container spacing={2} sx={{ mt:1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Call ID"
                size="small"
                
                value={callIdInput}
                onChange={(event) => setCallIdInput(event.target.value)}
                sx={{width:"215px",
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '14px'
                  }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormControl
              size="small"
             sx={{width:"215px"}} 
              >
                <InputLabel>Assigned To</InputLabel>

                <Select
                  value={assignedTo}
                  label="Assigned To"
                  onChange={(event) => setAssignedTo(event.target.value)}
                  sx={{
                    borderRadius: '14px'
                  }}
                >
                  {assignees.map((name) => (
                    <MenuItem value={name} key={name}>
                      {name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Notes"
                multiline
                minRows={4}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                sx={{ width:"450px",
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '14px'
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setOpenCreateDialog(false)}
            variant="outlined"
             sx={{ color: 'text.secondary',
             borderColor: 'grey.400', 
             '&:hover': 
             { borderColor: 'grey.600', 
             backgroundColor: 'grey.100' } }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleCreateFollowup}
            disabled={!assignedTo || !notes.trim()}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              px: 2.5,
              boxShadow: 'none'
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Drawer */}
<Drawer
  anchor="right"
  open={openDrawer}
  onClose={closeCallDrawer}
  PaperProps={{
    sx: {
      width: { xs: '100%', sm: 450 },
      borderRadius: { xs: 0, sm: '20px 0 0 20px' },
      boxShadow: (theme) => theme.vars.customShadows.z1,
      zIndex: 1500
    }
  }}
>
  <Box sx={{ p: 3 }}>
    {selectedCall && (
      <>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor:
                  theme.palette[stateColor[selectedCall.status]]?.main || '#999'
              }}
            />

            <Typography variant="h5">
              Call Details - {selectedCall.id}
            </Typography>
          </Box>

          <IconButton onClick={closeCallDrawer} size="small">
            <IconX size={18} />
          </IconButton>
        </Box>

        <Stack direction="row" spacing={2} sx={{ mb: 2, mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {selectedCall.createdAt}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Uploaded by{' '}
            <Box
              component="span"
              sx={{
                fontWeight: 600,
                color: 'text.primary'
              }}
            >
              {selectedCall.uploadedBy}
            </Box>
          </Typography>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Main Issue
        </Typography>

        {isEditMode ? (
          <TextField
            fullWidth
            size="small"
            value={editableIssue}
            onChange={(e) => {
              setEditableIssue(e.target.value);
              setIsDirty(true);
            }}
            sx={{ mb: 2 }}
          />
        ) : (
          <Typography variant="body2" sx={{ mb: 3 }}>
            {editableIssue}
          </Typography>
        )}

        <Typography variant="subtitle1" gutterBottom>
          Analysis
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
{isEditMode ? (
  <Stack direction="row" spacing={1} width="100%">
    <Select
      fullWidth
      size="small"
      value={editableSentiment}
      onChange={(e) => {
        setEditableSentiment(e.target.value);
        setIsDirty(true);
      }}
    >
      <MenuItem value="positive">Positive</MenuItem>
      <MenuItem value="negative">Negative</MenuItem>
      <MenuItem value="neutral">Neutral</MenuItem>
    </Select>

    <Select
      fullWidth
      size="small"
      value={editablePriority}
      onChange={(e) => {
        setEditablePriority(e.target.value);
        setIsDirty(true);
      }}
    >
      <MenuItem value="high">High</MenuItem>
      <MenuItem value="medium">Medium</MenuItem>
      <MenuItem value="low">Low</MenuItem>
    </Select>
  </Stack>
) : (
            <>
              <Chip
                label={editableSentiment}
                color={sentimentColor[editableSentiment]}
                size="small"
              />

              <Chip
                label={`${editablePriority} Priority`}
                color={priorityColor[editablePriority]}
                size="small"
              />
            </>
          )}
        </Stack>

        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Keywords
        </Typography>

        {isEditMode ? (
          <TextField
            fullWidth
            size="small"
            placeholder="comma separated..."
            value={editableKeywords}
            onChange={(e) => {
              setEditableKeywords(e.target.value);
              setIsDirty(true);
            }}
            sx={{ mb: 3 }}
          />
        ) : (
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 3 }}>
            {editableKeywords.split(',').map((k, i) => (
              <Chip key={i} label={k.trim()} size="small" />
            ))}
          </Stack>
        )}

        <Divider sx={{ mb: 2 }} />

        <Typography variant="subtitle1" gutterBottom>
          Transcript
        </Typography>

        <TextField
          fullWidth
          multiline
          minRows={4}
          value={editableTranscript}
          disabled={!isEditMode}
          onChange={(e) => {
            setEditableTranscript(e.target.value);
            setIsDirty(true);
          }}
          sx={{ mb: 2 }}
        />

        <Divider sx={{ mb: 2 }} />

        <Typography variant="subtitle1" gutterBottom>
          Audio
        </Typography>

        <Box sx={{ mb: 3 }}>
          <audio
            controls
            style={{ width: '100%' }}
            src={selectedCall.audio}
          />
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            onClick={() => {
              if (isEditMode) {
                handleSave();
                setIsDirty(false);
              } else {
                setIsEditMode(true);
              }
            }}
          >
            {isEditMode ? 'Save' : 'Edit'}
          </Button>

          <Button
            variant={
              selectedCall.reviewed === 'Yes'
                ? 'contained'
                : 'outlined'
            }
          >
            {selectedCall.reviewed === 'Yes'
              ? 'Reviewed'
              : 'Not Reviewed'}
          </Button>
        </Stack>
      </>
    )}
  </Box>
</Drawer>

    </>
  );
}