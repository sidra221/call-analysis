import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  IconEye, IconEdit, IconTrash, IconX, IconDots,
  IconUpload, IconDeviceFloppy, IconCheck,
  IconTrashX, IconArrowUp, IconArrowDown,
  IconRefresh, IconClipboardText
} from '@tabler/icons-react';
import useCallsStore from 'hooks/useCallsStore';
import UserAvatarWithName from 'ui-component/UserAvatarWithName';
import PageCard from 'ui-component/PageCard';
import PageTitle from 'ui-component/PageTitle';
import FilterToolbar from 'ui-component/FilterToolbar';
import FilterPopover from 'ui-component/FilterPopover';
import StatusChip from 'ui-component/StatusChip';
import DialogCancelButton from 'ui-component/DialogCancelButton';
import { stateColor, sentimentColor, priorityColor } from 'constants/status';
import {
  Box, Button, Card, Chip, CircularProgress, Divider, Drawer,
  FormControl, IconButton, InputLabel, MenuItem, Select,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, TablePagination, Typography, Menu, ListItemIcon, ListItemText,
  Backdrop, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Alert, Checkbox
} from '@mui/material';
import useAuth from 'hooks/useAuth';
import { formatKeywords, parseKeywords, getKeywordChipColor } from 'utils/keywords';
import { callsApi } from 'api/api';
import {
  TABLE_LAYOUT_SX,
  TABLE_CHECKBOX_CELL_SX,
  TABLE_HEADER_CELL_SX,
  TABLE_HEADER_SORT_SX,
  TABLE_BODY_CELL_SX
} from 'constants/table';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const WS_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000';
const rowsPerPage = 6;

const CALLS_CHECKBOX_CELL_SX = {
  ...TABLE_CHECKBOX_CELL_SX,
  width: 68,
  minWidth: 68,
  maxWidth: 68,
  pr: 3.5
};

const CALLS_ID_PL = 2.5;

const CALLS_ID_CELL_SX = {
  ...TABLE_HEADER_CELL_SX,
  width: '8%',
  pl: CALLS_ID_PL
};

const CALLS_ID_BODY_SX = {
  ...TABLE_BODY_CELL_SX,
  pl: CALLS_ID_PL
};

const CALLS_UPLOADED_BY_CELL_SX = {
  ...TABLE_HEADER_CELL_SX,
  width: '12%',
  pr: 0.5,
  display: { xs: 'none', lg: 'table-cell' }
};

const CALLS_ACTIONS_CELL_SX = {
  ...TABLE_HEADER_CELL_SX,
  width: '11%',
  minWidth: 84,
  pl: 0.5,
  pr: 1
};

function buildNormalizedCall(call) {
  if (!call) return null;
  return {
    ...call,
    sentiment: call.analysis?.sentiment || 'neutral',
    priority: call.analysis?.priority || 'low',
    is_reviewed: call.analysis?.is_reviewed || false,
    issue: call.analysis?.main_issue || '',
    transcript: call.analysis?.transcript || '',
    keywordItems: parseKeywords(call.analysis?.keywords),
    keywords: formatKeywords(call.analysis?.keywords),
    uploadedBy: call.uploaded_by_username || '',
    uploadedByRole: call.uploaded_by_role,
    uploadedByAvatar: call.uploaded_by_avatar || null,
    uploadedByAvatarStyle: call.uploaded_by_avatar_style || 'initial',
    needs_followup: Boolean(call.analysis?.needs_followup),
    createdAt: call.created_at ? call.created_at.split('T')[0] : '',
    duration: call.duration
      ? `${Math.floor(call.duration / 60)}:${String(Math.round(call.duration % 60)).padStart(2, '0')}`
      : '00:00',
  };
}

export default function Calls() {
  const [page, setPage] = useState(0);
  const [editableIssue, setEditableIssue] = useState('');
  const [editableTranscript, setEditableTranscript] = useState('');
  const [editableSentiment, setEditableSentiment] = useState('neutral');
  const [editablePriority, setEditablePriority] = useState('medium');
  const [editableKeywords, setEditableKeywords] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  const [selectedCalls, setSelectedCalls] = useState([]);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [sortByDate, setSortByDate] = useState('desc');
  const [sortByUploader, setSortByUploader] = useState(null);

  const location = useLocation();
  const state = location.state;
  const wsRef = useRef(null);
  const pollRef = useRef(null);
  const audioRef = useRef(null);

  const {
    calls, loading, error,
    fetchCalls, uploadCall, processCall,
    updateCallFromWebSocket, markReviewed, patchCall, removeCall
  } = useCallsStore();

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const finishProcessing = (callId) => {
    stopPolling();
    updateCallFromWebSocket(callId);
    setProcessingProgress(100);
    setReanalyzingId(null);
    setTimeout(async () => {
      setIsProcessing(false);
      setProcessingProgress(0);
      await fetchCalls();
      try {
        const res = await callsApi.get(callId);
        const fresh = buildNormalizedCall(res?.data || res);
        if (fresh) {
          if (openViewDrawer && viewingCall?.id === callId) {
            setViewingCall(fresh);
            setEditableKeywords(fresh.keywords || '');
            setEditableIssue(fresh.issue || '');
            setEditableTranscript(fresh.transcript || '');
            setEditableSentiment(fresh.sentiment || 'neutral');
            setEditablePriority(fresh.priority || 'low');
          }
        }
      } catch { /* ignore */ }
    }, 1200);
  };

  const connectWebSocket = (callId) => {
    if (wsRef.current) wsRef.current.close();
    try {
      const ws = new WebSocket(`${WS_URL}/ws/calls/${callId}/`);
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'analysis_completed' || data.type === 'analysis_failed') {
            finishProcessing(callId);
          } else if (data.type === 'analysis_started') {
            setProcessingProgress(60);
          }
        } catch { }
      };
      ws.onerror = () => { };
      wsRef.current = ws;
    } catch { }
  };

  const startPolling = (callId) => {
    stopPolling();
    let waited = 0;
    const maxWait = 300;

    pollRef.current = setInterval(async () => {
      waited += 2;
      setProcessingProgress((prev) => Math.min(prev + 2, 95));

      try {
        const res = await callsApi.get(callId);
        const callData = res?.data || res;
        const status = callData?.status;
        if (status === 'completed' || status === 'failed') {
          finishProcessing(callId);
          return;
        }
      } catch { }

      if (waited >= maxWait) {
        stopPolling();
        setIsProcessing(false);
        setProcessingProgress(0);
        setReanalyzingId(null);
      }
    }, 2000);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');

    try {
      setIsProcessing(true);
      setProcessingProgress(10);
      const formData = new FormData();
      formData.append('audio_file', file);
      const newCall = await uploadCall(formData);
      setProcessingProgress(30);
      const callId = newCall?.id || newCall?.call_id || newCall?.data?.id;
      if (!callId) {
        throw new Error('Upload failed — no call ID returned');
      }
      connectWebSocket(callId);
      setProcessingProgress(50);
      startPolling(callId);
    } catch (err) {
      console.error('UPLOAD ERROR:', err);
      setUploadError(err?.response?.data?.message || err?.message || 'Upload failed');
      setIsProcessing(false);
      setProcessingProgress(0);
      stopPolling();
    }
    e.target.value = '';
  };

  useEffect(() => {
    const userFromState = state?.filter === 'user' ? state?.value : null;
    if (userFromState) {
      setUserFilter(userFromState);
      fetchCalls({ user: userFromState });
    } else {
      fetchCalls();
    }
    return () => {
      if (wsRef.current) wsRef.current.close();
      stopPolling();
    };
  }, []);

  const [anchorEl, setAnchorEl] = useState(null);
  const [menuCallId, setMenuCallId] = useState(null);
  const openMenu = (event, callId) => { setAnchorEl(event.currentTarget); setMenuCallId(callId); };
  const closeMenu = () => { setAnchorEl(null); setMenuCallId(null); };

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [callToDelete, setCallToDelete] = useState(null);
  const [openViewDrawer, setOpenViewDrawer] = useState(false);
  const [viewingCall, setViewingCall] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [reanalyzingId, setReanalyzingId] = useState(null);

  // Force reload audio when viewingCall changes
  useEffect(() => {
    if (audioRef.current && viewingCall) {
      audioRef.current.load();
    }
  }, [viewingCall]);

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await callsApi.delete(id);
      setSelectedCalls(prev => prev.filter(cid => cid !== id));
      await fetchCalls();
    } catch (err) {
      console.error('Delete failed:', err);
      setUploadError(err.message || 'Delete failed');
    } finally {
      setDeleting(false);
      setOpenDeleteDialog(false);
    }
  };

  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = (user?.role || '').toLowerCase();
  const isManager = role === 'manager';
  const canCreateFollowup = isManager || role === 'qa';

  const handleAssignFollowup = (call) => {
    closeCallDrawer();
    navigate('/followups', {
      state: {
        openCreateFollowup: true,
        callId: call.id,
        assignedToUsername: call.uploadedByRole === 'qa' ? call.uploadedBy : undefined,
      }
    });
  };

  const renderFollowUpSection = (call) => {
    const followUpChip = call.status !== 'completed'
      ? { label: 'Awaiting AI analysis', color: 'default', variant: 'outlined' }
      : call.needs_followup
        ? { label: 'Needs Follow-up', color: 'warning', variant: 'filled' }
        : { label: 'No Follow-up Needed', color: 'success', variant: 'outlined' };

    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Follow-up</Typography>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={1}>
          <Chip label={followUpChip.label} color={followUpChip.color} variant={followUpChip.variant} size="small" />
          {call.needs_followup && call.status === 'completed' && canCreateFollowup && (
            <Button
              variant="contained"
              size="small"
              color="warning"
              startIcon={<IconClipboardText size={16} />}
              onClick={() => handleAssignFollowup(call)}
            >
              Create Follow-up
            </Button>
          )}
        </Stack>
      </Box>
    );
  };

  const renderDrawerActions = (call) => (
    <>
      <Typography variant="subtitle1" gutterBottom>Actions</Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
        {call.status === 'completed' && !call.keywordItems?.length && (
          <Button
            variant="outlined"
            size="small"
            disabled={reanalyzingId === call.id}
            startIcon={reanalyzingId === call.id ? <CircularProgress size={16} /> : <IconRefresh size={16} />}
            onClick={() => handleReanalyze(call.id)}
          >
            Re-analyze
          </Button>
        )}
        <Button
          variant={call.is_reviewed ? 'contained' : 'outlined'}
          size="small"
          color={call.is_reviewed ? 'success' : 'primary'}
          disabled={call.is_reviewed}
          startIcon={<IconCheck size={16} />}
          onClick={() => handleMarkReviewed(call.id)}
        >
          {call.is_reviewed ? 'Reviewed' : 'Mark Reviewed'}
        </Button>
      </Stack>
    </>
  );

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [reviewedFilter, setReviewedFilter] = useState('all');
  const [needsFollowupFilter, setNeedsFollowupFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);

  const openFilters = (event) => setFilterAnchorEl(event.currentTarget);
  const closeFilters = () => setFilterAnchorEl(null);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (sentimentFilter !== 'all') count++;
    if (priorityFilter !== 'all') count++;
    if (reviewedFilter !== 'all') count++;
    if (needsFollowupFilter !== 'all') count++;
    if (startDate) count++;
    if (endDate) count++;
    if (userFilter) count++;
    return count;
  }, [statusFilter, sentimentFilter, priorityFilter, reviewedFilter, needsFollowupFilter, startDate, endDate, userFilter]);

  const initEditableFields = (call) => {
    setEditableTranscript(call.transcript || '');
    setEditableSentiment(call.sentiment || 'neutral');
    setEditablePriority(call.priority || 'low');
    setEditableIssue(call.issue || '');
    setEditableKeywords(call.keywords || '');
    setIsDirty(false);
  };

  const openCallDrawer = async (call, edit = false) => {
    setOpenViewDrawer(true);
    setViewingCall(buildNormalizedCall(call));
    initEditableFields(call);
    setIsEditMode(edit);
    setDrawerLoading(true);
    try {
      const res = await callsApi.get(call.id);
      const fresh = buildNormalizedCall(res?.data || res);
      if (fresh) {
        setViewingCall(fresh);
        initEditableFields(fresh);
      }
    } catch (err) {
      console.error('Failed to refresh call details:', err);
    } finally {
      setDrawerLoading(false);
    }
  };

  const openViewDrawerFunc = (call) => openCallDrawer(call, false);

  const normalizedCalls = useMemo(() => {
    if (!Array.isArray(calls)) return [];
    return calls.map(buildNormalizedCall).filter(Boolean);
  }, [calls]);

  const filteredCalls = useMemo(() => {
    let result = normalizedCalls.filter((call) => {
      const searchStr = search.toLowerCase();
      const matchesSearch =
        String(call.id).toLowerCase().includes(searchStr) ||
        (call.status || '').toLowerCase().includes(searchStr) ||
        (call.sentiment || '').toLowerCase().includes(searchStr) ||
        (call.issue || '').toLowerCase().includes(searchStr);
      const matchesStatus = statusFilter === 'all' || call.status === statusFilter;
      const matchesSentiment = sentimentFilter === 'all' || call.sentiment === sentimentFilter;
      const matchesPriority = priorityFilter === 'all' || call.priority === priorityFilter;
      const matchesReviewed = reviewedFilter === 'all' ||
        (reviewedFilter === 'Yes' ? call.is_reviewed : !call.is_reviewed);
      const matchesNeedsFollowup = needsFollowupFilter === 'all' ||
        (needsFollowupFilter === 'yes' ? call.needs_followup : !call.needs_followup);

      let matchesDate = true;
      if (startDate || endDate) {
        const callDate = new Date(call.createdAt);
        if (startDate && callDate < new Date(startDate)) matchesDate = false;
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (callDate > end) matchesDate = false;
        }
      }

      return matchesSearch && matchesStatus && matchesSentiment &&
        matchesPriority && matchesReviewed && matchesNeedsFollowup && matchesDate;
    });

    result = [...result].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      if (sortByDate === 'desc') {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });

    if (sortByUploader === 'asc') {
      result = [...result].sort((a, b) => a.uploadedBy.localeCompare(b.uploadedBy));
    } else if (sortByUploader === 'desc') {
      result = [...result].sort((a, b) => b.uploadedBy.localeCompare(a.uploadedBy));
    }

    return result;
  }, [search, statusFilter, sentimentFilter, priorityFilter, reviewedFilter, needsFollowupFilter,
    startDate, endDate, normalizedCalls, sortByDate, sortByUploader]);

  // Apply filter from navigation state (from Dashboard)
  useEffect(() => {
    const filter = state?.filter;
    const filterValue = state?.value;
    
    if (filter && filterValue) {
      // Reset all filters first
      setStatusFilter('all');
      setSentimentFilter('all');
      setPriorityFilter('all');
      setReviewedFilter('all');
      setNeedsFollowupFilter('all');
      setSearch('');
      setStartDate('');
      setEndDate('');
      
      // Apply the specific filter
      if (filter === 'priority') {
        setPriorityFilter(filterValue);
      } else if (filter === 'sentiment') {
        setSentimentFilter(filterValue);
      } else if (filter === 'needs_followup') {
        setNeedsFollowupFilter(filterValue === 'true' ? 'yes' : 'no');
      } else if (filter === 'issue') {
        setSearch(filterValue);
      } else if (filter === 'user') {
        setUserFilter(filterValue);
        fetchCalls({ user: filterValue });
      }
      // Clear the state after applying to avoid re-applying on re-render
      window.history.replaceState({}, document.title);
    }
  }, [state]);

  const toggleSortByDate = () => {
    setSortByDate(prev => prev === 'desc' ? 'asc' : 'desc');
    setSortByUploader(null);
    setPage(0);
  };

  const toggleSortByUploader = () => {
    if (sortByUploader === null) {
      setSortByUploader('asc');
    } else if (sortByUploader === 'asc') {
      setSortByUploader('desc');
    } else {
      setSortByUploader(null);
    }
    setSortByDate('desc');
    setPage(0);
  };

  const handleReanalyze = async (callId) => {
    try {
      setReanalyzingId(callId);
      setUploadError('');
      connectWebSocket(callId);
      await processCall(callId);
      startPolling(callId);
    } catch (err) {
      setReanalyzingId(null);
      setUploadError(err?.message || 'Re-analysis failed');
    }
  };

  useEffect(() => {
    const selectedId = state?.selectedCallId;
    if (!selectedId || !normalizedCalls.length) return;
    const foundCall = normalizedCalls.find((c) => String(c.id) === String(selectedId));
    if (!foundCall) return;
    if (state?.mode === 'edit') {
      openCallDrawer(foundCall, true);
    } else {
      openCallDrawer(foundCall, false);
    }
    window.history.replaceState({}, document.title);
  }, [normalizedCalls]);

  const closeCallDrawer = () => {
    setOpenViewDrawer(false);
    setViewingCall(null);
    setIsEditMode(false);
    setIsDirty(false);
  };

  const handleSave = async () => {
    if (!viewingCall) return;
    try {
      await patchCall(viewingCall.id, {
        main_issue: editableIssue,
        sentiment: editableSentiment,
        priority: editablePriority,
        transcript: editableTranscript,
        keywords: editableKeywords.split(',').map((k) => k.trim()).filter(Boolean),
      });
      setIsDirty(false);
      setIsEditMode(false);
      await fetchCalls();
      const res = await callsApi.get(viewingCall.id);
      const fresh = buildNormalizedCall(res?.data || res);
      if (fresh) {
        setViewingCall(fresh);
        initEditableFields(fresh);
      }
    } catch (err) {
      setUploadError(err.message || 'Save failed');
    }
  };

  const handleMarkReviewed = async (callId) => {
    try {
      await markReviewed(callId);
      if (viewingCall?.id === callId) {
        setViewingCall((prev) => ({ ...prev, is_reviewed: true }));
      }
      await fetchCalls();
    } catch (err) {
      setUploadError(err.message || 'Mark reviewed failed');
    }
  };

  const isAllSelected = filteredCalls.length > 0 && selectedCalls.length === filteredCalls.length;

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedCalls(filteredCalls.map((call) => call.id));
    } else {
      setSelectedCalls([]);
    }
  };

  const handleSelectCall = (id) => {
    setSelectedCalls((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedCalls.length === 0) return;
    setDeleting(true);
    try {
      for (const callId of selectedCalls) {
        await callsApi.delete(callId);
      }
      await fetchCalls();
      setSelectedCalls([]);
      setBulkDeleteDialog(false);
    } catch (err) {
      setUploadError(err.message || 'Bulk delete failed');
    } finally {
      setDeleting(false);
    }
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

      {uploadError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setUploadError('')}>
          {uploadError}
        </Alert>
      )}

      {userFilter && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Showing calls uploaded by <strong>{userFilter}</strong>
        </Alert>
      )}

      <PageCard>
          <PageTitle title="Calls Management" />

          <FilterToolbar
            search={search}
            onSearchChange={(event) => setSearch(event.target.value)}
            searchPlaceholder="Search calls ..."
            searchLoading={loading}
            activeFilterCount={activeFilterCount}
            onOpenFilters={openFilters}
            onResetFilters={() => {
              setStatusFilter('all'); setSentimentFilter('all');
              setPriorityFilter('all'); setReviewedFilter('all');
              setNeedsFollowupFilter('all');
              setStartDate(''); setEndDate('');
              setUserFilter('');
              setSortByDate('desc');
              setSortByUploader(null);
              fetchCalls();
            }}
            searchGridSize={{ xs: 12, md: 5 }}
            actions={(
              <>
                {isManager && selectedCalls.length > 0 && (
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={deleting ? <CircularProgress size={18} color="inherit" /> : <IconTrashX size={18} />}
                    onClick={() => setBulkDeleteDialog(true)}
                    disabled={deleting}
                  >
                    Delete ({selectedCalls.length})
                  </Button>
                )}
                <Button
                  variant="contained"
                  startIcon={<IconUpload size={18} />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload Call
                </Button>
              </>
            )}
          />

          <FilterPopover
            open={Boolean(filterAnchorEl)}
            anchorEl={filterAnchorEl}
            onClose={closeFilters}
            title="Filter Calls"
            width={320}
          >
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="processing">Processing</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select value={priorityFilter} label="Priority" onChange={(e) => setPriorityFilter(e.target.value)}>
                  <MenuItem value="all">All Priorities</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Sentiment</InputLabel>
                <Select value={sentimentFilter} label="Sentiment" onChange={(e) => setSentimentFilter(e.target.value)}>
                  <MenuItem value="all">All Sentiments</MenuItem>
                  <MenuItem value="positive">Positive</MenuItem>
                  <MenuItem value="negative">Negative</MenuItem>
                  <MenuItem value="neutral">Neutral</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Reviewed</InputLabel>
                <Select value={reviewedFilter} label="Reviewed" onChange={(e) => setReviewedFilter(e.target.value)}>
                  <MenuItem value="all">All Reviews</MenuItem>
                  <MenuItem value="Yes">Reviewed</MenuItem>
                  <MenuItem value="No">Not Reviewed</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Follow-up</InputLabel>
                <Select value={needsFollowupFilter} label="Follow-up" onChange={(e) => setNeedsFollowupFilter(e.target.value)}>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="yes">Needs Follow-up</MenuItem>
                  <MenuItem value="no">No Follow-up</MenuItem>
                </Select>
              </FormControl>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                  Date Range
                </Typography>
                <Stack direction="row" spacing={1}>
                  <TextField fullWidth size="small" type="date" label="From"
                    InputLabelProps={{ shrink: true }} value={startDate}
                    onChange={(e) => setStartDate(e.target.value)} />
                  <TextField fullWidth size="small" type="date" label="To"
                    InputLabelProps={{ shrink: true }} value={endDate}
                    onChange={(e) => setEndDate(e.target.value)} />
                </Stack>
              </Box>

          </FilterPopover>

          <TableContainer sx={{ overflowX: 'auto', width: '100%' }}>
            <Table size="small" sx={{ ...TABLE_LAYOUT_SX, minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  {isManager && (
                    <TableCell padding="checkbox" sx={CALLS_CHECKBOX_CELL_SX}>
                      <Checkbox
                        size="small"
                        checked={isAllSelected}
                        indeterminate={selectedCalls.length > 0 && selectedCalls.length < filteredCalls.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                  )}
                  <TableCell sx={CALLS_ID_CELL_SX}>ID</TableCell>
                  <TableCell sx={{ ...TABLE_HEADER_CELL_SX, width: '11%' }}>Priority</TableCell>
                  <TableCell sx={{ ...TABLE_HEADER_CELL_SX, width: '12%' }}>Status</TableCell>
                  <TableCell sx={{ ...TABLE_HEADER_CELL_SX, width: '11%' }}>Sentiment</TableCell>
                  <TableCell sx={{ ...TABLE_HEADER_CELL_SX, width: '9%', display: { xs: 'none', md: 'table-cell' } }}>Duration</TableCell>
                  <TableCell sx={{ ...TABLE_HEADER_CELL_SX, width: '13%', display: { xs: 'none', lg: 'table-cell' } }}>
                    <Box component="span" sx={TABLE_HEADER_SORT_SX}>
                      Created At
                      <IconButton size="small" onClick={toggleSortByDate} sx={{ p: 0, flexShrink: 0 }}>
                        {sortByDate === 'desc' ? <IconArrowDown size={16} /> : <IconArrowUp size={16} />}
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ ...TABLE_HEADER_CELL_SX, width: '10%' }}>Reviewed</TableCell>
                  <TableCell sx={CALLS_UPLOADED_BY_CELL_SX}>
                    <Box component="span" sx={TABLE_HEADER_SORT_SX}>
                      Uploaded By
                      <IconButton size="small" onClick={toggleSortByUploader} sx={{ p: 0, flexShrink: 0 }}>
                        {sortByUploader === 'asc' ? <IconArrowUp size={16} /> :
                          sortByUploader === 'desc' ? <IconArrowDown size={16} /> :
                            <IconArrowUp size={16} style={{ opacity: 0.5 }} />}
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell align="center" sx={CALLS_ACTIONS_CELL_SX}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCalls.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((call) => (
                    <TableRow key={call.id} hover selected={selectedCalls.includes(call.id)}>
                      {isManager && (
                        <TableCell padding="checkbox" sx={CALLS_CHECKBOX_CELL_SX}>
                          <Checkbox
                            size="small"
                            checked={selectedCalls.includes(call.id)}
                            onChange={() => handleSelectCall(call.id)}
                          />
                        </TableCell>
                      )}
                      <TableCell sx={CALLS_ID_BODY_SX}>
                        #{call.id}
                      </TableCell>
                      <TableCell><Chip label={call.priority} color={priorityColor[call.priority]} size="small" /></TableCell>
                      <TableCell><StatusChip status={call.status} /></TableCell>
                      <TableCell><Chip label={call.sentiment} color={sentimentColor[call.sentiment]} size="small" /></TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{call.duration}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                        <Box component="span" sx={{ direction: 'ltr', unicodeBidi: 'isolate', display: 'inline-block', whiteSpace: 'nowrap' }}>
                          {call.createdAt}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={call.is_reviewed ? 'Yes' : 'No'}
                          color={call.is_reviewed ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ ...CALLS_UPLOADED_BY_CELL_SX, pl: 1 }}>
                        <UserAvatarWithName
                          username={call.uploadedBy}
                          role={call.uploadedByRole}
                          avatar={call.uploadedByAvatar}
                          avatarStyle={call.uploadedByAvatarStyle}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ ...CALLS_ACTIONS_CELL_SX, pl: 0.5, pr: 1 }}>
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <IconButton
                            size="small"
                            sx={{ color: 'info.main' }}
                            onClick={() => openViewDrawerFunc(call)}
                            title="View Call"
                          >
                            <IconEye size={18} />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => openCallDrawer(call, true)}
                            title="Edit Call"
                          >
                            <IconEdit size={18} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                ))}
                {filteredCalls.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isManager ? 10 : 9}>
                      <Box sx={{ py: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          {loading ? 'Loading...' : 'No results found'}
                        </Typography>
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
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[]}
            />
          </Box>
      </PageCard>

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete call #{callToDelete}?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <DialogCancelButton onClick={() => setOpenDeleteDialog(false)} />
          <Button onClick={() => handleDelete(callToDelete)} variant="contained" color="error" disabled={deleting}>
            {deleting ? <CircularProgress size={18} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bulkDeleteDialog} onClose={() => setBulkDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Bulk Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{selectedCalls.length}</strong> selected call(s)? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <DialogCancelButton onClick={() => setBulkDeleteDialog(false)} />
          <Button onClick={handleBulkDelete} variant="contained" color="error" disabled={deleting}>
            {deleting ? <CircularProgress size={18} /> : 'Delete All'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Call Drawer */}
      <Drawer anchor="right" open={openViewDrawer} onClose={closeCallDrawer}>
        <Box sx={{ width: { xs: 320, sm: 420 }, p: 3 }}>
          {viewingCall && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{
                    width: 10, height: 10, borderRadius: '50%',
                    backgroundColor: (theme) => theme.palette[stateColor[viewingCall.status]]?.main || '#999'
                  }} />
                  <Typography variant="h5">Call #{viewingCall.id}</Typography>
                  <IconButton
                    size="small"
                    title={isEditMode ? 'Save' : 'Edit Call'}
                    onClick={() => { if (isEditMode) { handleSave(); } else { setIsEditMode(true); } }}
                    sx={{ color: isDirty ? 'primary.main' : 'text.primary' }}
                  >
                    {isEditMode ? <IconDeviceFloppy size={22} /> : <IconEdit size={18} />}
                  </IconButton>
                </Box>
                <IconButton onClick={closeCallDrawer} size="small"><IconX size={18} /></IconButton>
              </Box>

              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">{viewingCall.createdAt}</Typography>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Typography variant="body2" color="text.secondary">Uploaded by</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {viewingCall.uploadedBy}
                  </Typography>
                </Stack>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" sx={{ mb: 1 }}>Main Issue</Typography>
              {isEditMode ? (
                <TextField
                  fullWidth
                  size="small"
                  value={editableIssue}
                  onChange={(e) => { setEditableIssue(e.target.value); setIsDirty(true); }}
                  sx={{ mb: 2 }}
                />
              ) : (
                <Typography variant="body2" sx={{ mb: 2 }}>{editableIssue || '—'}</Typography>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" gutterBottom>Analysis</Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                {isEditMode ? (
                  <>
                    <Select fullWidth size="small" value={editableSentiment}
                      onChange={(e) => { setEditableSentiment(e.target.value); setIsDirty(true); }}>
                      <MenuItem value="positive">Positive</MenuItem>
                      <MenuItem value="negative">Negative</MenuItem>
                      <MenuItem value="neutral">Neutral</MenuItem>
                    </Select>
                    <Select fullWidth size="small" value={editablePriority}
                      onChange={(e) => { setEditablePriority(e.target.value); setIsDirty(true); }}>
                      <MenuItem value="critical">Critical</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="low">Low</MenuItem>
                    </Select>
                  </>
                ) : (
                  <>
                    <Chip label={editableSentiment} color={sentimentColor[editableSentiment]} size="small" />
                    <Chip label={`${editablePriority} Priority`} color={priorityColor[editablePriority]} size="small" />
                  </>
                )}
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" sx={{ mb: 1.5 }}>Keywords</Typography>
              {isEditMode ? (
                <TextField
                  fullWidth
                  size="small"
                  placeholder="comma separated..."
                  value={editableKeywords}
                  onChange={(e) => { setEditableKeywords(e.target.value); setIsDirty(true); }}
                  sx={{ mb: 3 }}
                />
              ) : (
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 3, gap: 1 }}>
                  {drawerLoading ? (
                    <CircularProgress size={18} />
                  ) : viewingCall.keywordItems?.length ? viewingCall.keywordItems.map((item, i) => (
                    <Chip
                      key={`${item.text}-${i}`}
                      label={item.text}
                      size="small"
                      color={getKeywordChipColor(item.polarity)}
                      variant={item.polarity === 'neutral' ? 'outlined' : 'filled'}
                    />
                  )) : (
                    <Typography variant="body2" color="text.secondary">—</Typography>
                  )}
                </Stack>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" gutterBottom>Transcript</Typography>
              <TextField
                fullWidth
                multiline
                minRows={4}
                maxRows={8}
                value={editableTranscript}
                disabled={!isEditMode}
                onChange={(e) => { setEditableTranscript(e.target.value); setIsDirty(true); }}
                variant="outlined"
                size="small"
                sx={{
                  mb: 2,
                  '& .MuiInputBase-input': {
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    lineHeight: 1.5
                  }
                }}
              />

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" gutterBottom>Audio</Typography>
              <Box sx={{ mb: 2, width: '100%' }}>
                {viewingCall.audio_file && (
                  <audio
                    ref={audioRef}
                    controls
                    preload="metadata"
                    style={{ width: '100%', height: '40px', display: 'block' }}
                    key={`audio-${viewingCall.id}`}
                  >
                    <source
                      src={viewingCall.audio_file?.startsWith('http') ? viewingCall.audio_file : `${API_URL}${viewingCall.audio_file}`}
                      type="audio/wav"
                    />
                    Your browser does not support the audio element.
                  </audio>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {renderFollowUpSection(viewingCall)}

              <Divider sx={{ my: 2 }} />

              {renderDrawerActions(viewingCall)}
            </>
          )}
        </Box>
      </Drawer>

      {/* Processing Backdrop */}
      <Backdrop
        sx={{
          color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1,
          flexDirection: 'column', backdropFilter: 'blur(4px)',
        }}
        open={isProcessing}
      >
        <Card sx={{ p: 4, boxShadow: 24, width: 400, textAlign: 'center' }}>
          <Stack spacing={3} alignItems="center">
            {processingProgress < 100 ? (
              <>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress
                    variant="determinate"
                    value={processingProgress}
                    size={80} thickness={4}
                    sx={{ color: 'primary.main' }}
                  />
                  <Box sx={{
                    top: 0, left: 0, bottom: 0, right: 0, position: 'absolute',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                      {`${Math.round(processingProgress)}%`}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>Processing...</Typography>
              </>
            ) : (
              <>
                <Box sx={{
                  width: 90, height: 90, borderRadius: '50%', bgcolor: 'success.main',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <IconCheck size={50} stroke={3} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                  Completed
                </Typography>
              </>
            )}
          </Stack>
        </Card>
      </Backdrop>
    </>
  );
}