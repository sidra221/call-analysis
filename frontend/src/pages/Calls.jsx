import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
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
  Typography
} from '@mui/material';
import { IconX } from '@tabler/icons-react';
import useAuth from 'hooks/useAuth';

const calls = [
  {
    id: 'C-1001',
    status: 'pending',
    sentiment: 'positive',
    priority: 'high',
    reviewed: 'No',
    transcript: 'Customer requested an urgent callback regarding delayed delivery and billing mismatch.',
    issue: 'Delivery delay and invoice mismatch'
  },
  {
    id: 'C-1002',
    status: 'completed',
    sentiment: 'negative',
    priority: 'high',
    reviewed: 'Yes',
    transcript: 'Caller was frustrated due to repeated service interruption and asked for escalation.',
    issue: 'Service interruption complaint'
  },
  {
    id: 'C-1003',
    status: 'pending',
    sentiment: 'neutral',
    priority: 'medium',
    reviewed: 'No',
    transcript: 'Customer asked about subscription details and follow-up pricing confirmation.',
    issue: 'Subscription clarification'
  },
  {
    id: 'C-1004',
    status: 'completed',
    sentiment: 'negative',
    priority: 'low',
    reviewed: 'Yes',
    transcript: 'Caller provided feedback about app usability issues and requested minor UI updates.',
    issue: 'Usability feedback'
  },
  {
    id: 'C-1005',
    status: 'pending',
    sentiment: 'positive',
    priority: 'medium',
    reviewed: 'No',
    transcript: 'Client appreciated quick response and asked for a feature walkthrough next week.',
    issue: 'Feature onboarding request'
  },
  {
    id: 'C-1006',
    status: 'completed',
    sentiment: 'neutral',
    priority: 'low',
    reviewed: 'Yes',
    transcript: 'General inquiry call resolved after sharing setup instructions and account verification.',
    issue: 'General support inquiry'
  },
  {
    id: 'C-1007',
    status: 'pending',
    sentiment: 'negative',
    priority: 'high',
    reviewed: 'No',
    transcript: 'Customer reported payment retry failures and requested immediate support assistance.',
    issue: 'Payment processing failure'
  },
  {
    id: 'C-1008',
    status: 'completed',
    sentiment: 'positive',
    priority: 'low',
    reviewed: 'Yes',
    transcript: 'Follow-up confirmation call completed successfully with no pending concerns.',
    issue: 'Follow-up confirmation'
  }
];

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

export default function Calls() {
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
  }, [search, statusFilter, sentimentFilter, reviewedFilter]);

  const openCallDrawer = (call) => {
    setSelectedCall(call);
    setEditableTranscript(call.transcript);
    setEditableSentiment(call.sentiment);
    setEditablePriority(call.priority);
    setEditableKeywords('billing, escalation, callback');
    setOpenDrawer(true);
  };

  const closeCallDrawer = () => {
    setOpenDrawer(false);
    setSelectedCall(null);
  };

  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Calls Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Search, review and manage all calls
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search calls..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {loading ? (
                        <CircularProgress size={16} />
                      ) : search ? (
                        <IconButton size="small" onClick={() => setSearch('')}>
                          <IconX size={14} />
                        </IconButton>
                      ) : null}
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4} md={2.66}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(event) => setStatusFilter(event.target.value)}>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="pending">pending</MenuItem>
                  <MenuItem value="completed">completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4} md={2.66}>
              <FormControl fullWidth size="small">
                <InputLabel>Sentiment</InputLabel>
                <Select value={sentimentFilter} label="Sentiment" onChange={(event) => setSentimentFilter(event.target.value)}>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="positive">positive</MenuItem>
                  <MenuItem value="negative">negative</MenuItem>
                  <MenuItem value="neutral">neutral</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4} md={2.66}>
              <FormControl fullWidth size="small">
                <InputLabel>Reviewed</InputLabel>
                <Select value={reviewedFilter} label="Reviewed" onChange={(event) => setReviewedFilter(event.target.value)}>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Sentiment</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Reviewed</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCalls.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell>{call.id}</TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{call.status}</TableCell>
                    <TableCell>
                      <Chip label={call.sentiment} color={sentimentColor[call.sentiment]} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip label={call.priority} color={priorityColor[call.priority]} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip label={call.reviewed} color={call.reviewed === 'Yes' ? 'success' : 'error'} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
                        <Button size="small" variant="outlined" onClick={() => openCallDrawer(call)}>
                          View
                        </Button>
                        <Button size="small" variant="outlined" color="warning" disabled={call.status === 'completed'}>
                          Process
                        </Button>
                        {isManager && (
                          <Button size="small" variant="contained" disabled={call.reviewed === 'Yes'}>
                            Review
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCalls.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Box sx={{ py: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          No results found
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Drawer anchor="right" open={openDrawer} onClose={closeCallDrawer}>
        <Box sx={{ width: { xs: 320, sm: 420 }, p: 3 }}>
          {selectedCall && (
            <>
              <Typography variant="h5" gutterBottom>
                Call Details - {selectedCall.id}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Review workflow for selected call
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <Typography variant="subtitle1" gutterBottom>
                Audio
              </Typography>
              <Box sx={{ mb: 2 }}>
                <audio controls style={{ width: '100%' }}>
                  <source src="" type="audio/mpeg" />
                </audio>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Typography variant="subtitle1" gutterBottom>
                Transcript
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={4}
                value={editableTranscript}
                onChange={(event) => setEditableTranscript(event.target.value)}
                sx={{ mb: 2 }}
              />

              <Divider sx={{ mb: 2 }} />

              <Typography variant="subtitle1" gutterBottom>
                Analysis
              </Typography>
              <Grid container spacing={2} sx={{ mb: 1 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Sentiment</InputLabel>
                    <Select value={editableSentiment} label="Sentiment" onChange={(event) => setEditableSentiment(event.target.value)}>
                      <MenuItem value="positive">positive</MenuItem>
                      <MenuItem value="negative">negative</MenuItem>
                      <MenuItem value="neutral">neutral</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Priority</InputLabel>
                    <Select value={editablePriority} label="Priority" onChange={(event) => setEditablePriority(event.target.value)}>
                      <MenuItem value="high">high</MenuItem>
                      <MenuItem value="medium">medium</MenuItem>
                      <MenuItem value="low">low</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <Chip label={`Sentiment: ${editableSentiment}`} color={sentimentColor[editableSentiment]} size="small" />
                <Chip label={`Priority: ${editablePriority}`} color={priorityColor[editablePriority]} size="small" />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Main Issue: {selectedCall.issue}
              </Typography>
              <TextField
                label="Keywords"
                size="small"
                fullWidth
                value={editableKeywords}
                onChange={(event) => setEditableKeywords(event.target.value)}
                sx={{ mb: 2 }}
              />

              <Divider sx={{ mb: 2 }} />

              <Typography variant="subtitle1" gutterBottom>
                Actions
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button size="small" variant="outlined" color="warning" disabled={selectedCall.status === 'completed'}>
                  Process
                </Button>
                {isManager && (
                  <Button size="small" variant="contained" disabled={selectedCall.reviewed === 'Yes'}>
                    Mark Reviewed
                  </Button>
                )}
                <Button
                  size="small"
                  variant="text"
                  onClick={() =>
                    navigate('/followups', {
                      state: { openCreateFollowup: true, callId: selectedCall.id }
                    })
                  }
                >
                  {isManager ? 'Assign Follow-up' : 'Needs Follow-up'}
                </Button>
              </Stack>
            </>
          )}
        </Box>
      </Drawer>
    </>
  );
}
