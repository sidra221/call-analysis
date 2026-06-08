import { useState, useEffect, useMemo } from 'react';
import {
  Box, Button, Card, CardContent, Typography, Dialog,
  DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Stack, Chip, Table, TableBody,
  TableCell, TableHead, TableRow, Divider, IconButton,
  DialogContentText, alpha, useTheme, Grid, Avatar,
  CircularProgress, Alert, TablePagination, Badge, Popover,
  FormControl, InputLabel, Select, InputAdornment
} from '@mui/material';
import {
  IconPlus, IconTrash, IconClipboardText, IconChecks,
  IconClockHour4, IconMoodSmile, IconMoodNeutral, IconMoodSad,
  IconEye, IconDownload, IconArrowUp, IconArrowDown,
  IconSearch, IconX, IconAdjustmentsHorizontal, IconRefresh
} from '@tabler/icons-react';
import { reportsApi } from 'api/api';
import useAuth from 'hooks/useAuth';
import UserAvatarWithName from 'ui-component/UserAvatarWithName';

const rowsPerPage = 6;

export default function Reports() {
  const theme = useTheme();
  const { user } = useAuth();
  const role = (user?.role || '').toLowerCase();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [page, setPage] = useState(0);

  const [openForm, setOpenForm] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [openNotesDialog, setOpenNotesDialog] = useState(false);
  const [managerNotesInput, setManagerNotesInput] = useState('');
  const [submittingNotes, setSubmittingNotes] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);

  const [form, setForm] = useState({ type: 'daily', from: '', to: '' });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await reportsApi.list();
      const reportsData = res?.data || res?.results || [];
      setReports(reportsData);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(0);
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) {
      return <IconArrowUp size={14} style={{ opacity: 0.4 }} />;
    }
    return sortOrder === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />;
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (typeFilter !== 'all') count++;
    return count;
  }, [statusFilter, typeFilter]);

  const handleResetFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setSearchQuery('');
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(0);
  };

  const openFilters = (event) => setFilterAnchorEl(event.currentTarget);
  const closeFilters = () => setFilterAnchorEl(null);

  const filteredReports = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return reports.filter((report) => {
      const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
      const matchesType = typeFilter === 'all' || report.period === typeFilter;

      if (!query) {
        return matchesStatus && matchesType;
      }

      const searchable = [
        report.summary,
        report.positives,
        report.recommendations,
        report.period,
        report.status,
        report.date_from,
        report.date_to,
        report.created_by_username,
        report.created_at,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = searchable.includes(query);
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [reports, statusFilter, typeFilter, searchQuery]);

  const sortedReports = useMemo(() => {
    return [...filteredReports].sort((a, b) => {
      let aVal;
      let bVal;

      switch (sortBy) {
        case 'period_dates':
          aVal = a.date_from || '';
          bVal = b.date_from || '';
          break;
        case 'created_at':
        default:
          aVal = new Date(a.created_at);
          bVal = new Date(b.created_at);
          break;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });
  }, [filteredReports, sortBy, sortOrder]);

  const paginatedReports = sortedReports.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const publishedCount = reports.filter((r) => r.status === 'published' || r.status === 'reviewed' || r.status === 'approved').length;
  const draftCount = reports.filter((r) => r.status === 'draft').length;
  const reviewedCount = reports.filter((r) => r.status === 'reviewed' || r.status === 'approved').length;

  const handleGenerate = async () => {
    if (!form.from || !form.to) {
      setError('Please select date range');
      return;
    }
    try {
      setGenerating(true);
      const res = await reportsApi.generate({
        period: form.type,
        date_from: form.from,
        date_to: form.to,
      });
      if (res?.data) {
        setReports((prev) => [res.data, ...prev]);
        setPage(0);
      }
      setOpenForm(false);
      setForm({ type: 'daily', from: '', to: '' });
    } catch (err) {
      setError(err.message || 'Generation failed. You can try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedReport) return;
    try {
      const res = await reportsApi.publish(selectedReport.id);
      const updated = res?.data;
      setReports((prev) => prev.map((r) => r.id === selectedReport.id ? updated : r));
      setSelectedReport(updated);
      setOpenView(false);
    } catch (err) {
      setError(err.message || 'Publish failed');
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedReport) return;
    try {
      setSaving(true);
      const res = await reportsApi.patch(selectedReport.id, {
        summary: selectedReport.summary,
        positives: selectedReport.positives,
        recommendations: selectedReport.recommendations,
      });
      const updated = res?.data;
      setReports((prev) => prev.map((r) => r.id === selectedReport.id ? updated : r));
      setOpenView(false);
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!reportToDelete) return;
    try {
      setDeleting(true);
      await reportsApi.delete(reportToDelete.id);
      setReports((prev) => prev.filter((r) => r.id !== reportToDelete.id));
      setDeleteDialog(false);
      setReportToDelete(null);
    } catch (err) {
      setError(err.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async (report) => {
    try {
      setDownloadingId(report.id);
      const token = localStorage.getItem('access_token');
      const response = await fetch(reportsApi.downloadUrl(report.id), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData?.error?.message ||
          errData?.message ||
          errData?.detail ||
          `Download failed (${response.status})`
        );
      }

      const blob = await response.blob();
      const pdfBlob = blob.type.includes('pdf')
        ? blob
        : new Blob([blob], { type: 'application/pdf' });

      if (pdfBlob.size < 100) {
        throw new Error('Received an empty or invalid PDF file');
      }

      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report_${report.id}_${report.period}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  const openReportView = async (report) => {
    setSelectedReport(report);
    setManagerNotesInput(report.manager_notes || '');
    setOpenView(true);
    try {
      setLoadingReport(true);
      const res = await reportsApi.get(report.id);
      const freshReport = res?.data || res;
      if (freshReport?.id) {
        setSelectedReport(freshReport);
        setManagerNotesInput(freshReport.manager_notes || '');
      }
    } catch (err) {
      setError(err.message || 'Failed to load report details');
    } finally {
      setLoadingReport(false);
    }
  };

  const handleReview = async () => {
    if (!selectedReport) return;
    try {
      setReviewing(true);
      const res = await reportsApi.approve(selectedReport.id);
      const updated = res?.data;
      setReports((prev) => prev.map((r) => r.id === selectedReport.id ? updated : r));
      setSelectedReport(updated);
    } catch (err) {
      setError(err.message || 'Review failed');
    } finally {
      setReviewing(false);
    }
  };

  const handleSubmitNotes = async () => {
    if (!selectedReport || !managerNotesInput.trim()) {
      setError('Please enter notes before sending');
      return;
    }
    try {
      setSubmittingNotes(true);
      const res = await reportsApi.addNotes(selectedReport.id, managerNotesInput.trim());
      const updated = res?.data;
      setReports((prev) => prev.map((r) => r.id === selectedReport.id ? updated : r));
      setSelectedReport(updated);
      setOpenNotesDialog(false);
    } catch (err) {
      setError(err.message || 'Failed to send notes');
    } finally {
      setSubmittingNotes(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setSelectedReport((prev) => ({ ...prev, [field]: value }));
  };

  const isEditable = role === 'qa' && selectedReport?.status === 'draft';

  const getSentimentConfig = (sentiment) => {
    switch (sentiment) {
      case 'positive': return { color: 'success', icon: <IconMoodSmile size={16} /> };
      case 'neutral': return { color: 'default', icon: <IconMoodNeutral size={16} /> };
      case 'negative': return { color: 'error', icon: <IconMoodSad size={16} /> };
      default: return { color: 'default', icon: null };
    }
  };

  const getOverallSentiment = (report) => {
    if (!report?.sentiment_stats) return 'neutral';
    const stats = report.sentiment_stats;
    const pos = stats.positive || 0;
    const neg = stats.negative || 0;
    const neu = stats.neutral || 0;
    if (pos >= neg && pos >= neu) return 'positive';
    if (neg >= pos && neg >= neu) return 'negative';
    return 'neutral';
  };

  const statusChip = (status) => {
    if (status === 'reviewed' || status === 'approved') {
      return (
        <Chip label="Reviewed" size="small" sx={{
          borderRadius: '10px',
          bgcolor: alpha(theme.palette.info.main, 0.12),
          color: theme.palette.info.dark,
        }} />
      );
    }
    if (status === 'published') {
      return (
        <Chip label="Published" size="small" sx={{
          borderRadius: '10px',
          bgcolor: alpha(theme.palette.success.main, 0.12),
          color: theme.palette.success.dark,
        }} />
      );
    }
    return (
      <Chip label="Draft" size="small" sx={{
        borderRadius: '10px',
        bgcolor: alpha(theme.palette.warning.main, 0.12),
        color: theme.palette.warning.dark,
      }} />
    );
  };

  const isManager = role === 'manager';
  const isReviewed = (report) => report?.status === 'reviewed' || report?.status === 'approved';
  const tableColSpan = isManager ? 5 : 4;

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>
      )}

      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }}
            justifyContent="space-between" spacing={2} mb={3}>
            <Typography variant="h4" gutterBottom sx={{ padding: '16px 2px' }}>Reports</Typography>
            {role === 'qa' && (
              <Button variant="contained" startIcon={<IconPlus />} onClick={() => setOpenForm(true)}>
                Generate
              </Button>
            )}
          </Stack>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.12), color: theme.palette.primary.main }}>
                      <IconClipboardText size={20} />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Total Reports</Typography>
                      <Typography variant="h4" fontWeight={700}>{reports.length}</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.12), color: theme.palette.success.main }}>
                      <IconChecks size={20} />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Published</Typography>
                      <Typography variant="h4" fontWeight={700}>{publishedCount}</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.12), color: theme.palette.warning.main }}>
                      <IconClockHour4 size={20} />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {role === 'manager' ? 'Reviewed' : 'Drafts'}
                      </Typography>
                      <Typography variant="h4" fontWeight={700}>
                        {role === 'manager' ? reviewedCount : draftCount}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search summary, dates, status..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconSearch size={18} style={{ color: '#9e9e9e' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => { setSearchQuery(''); setPage(0); }}>
                        <IconX size={14} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
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
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    height: 40,
                    borderColor: activeFilterCount > 0 ? 'primary.main' : 'divider',
                    bgcolor: activeFilterCount > 0 ? 'primary.light' : 'transparent',
                  }}
                >
                  Filters
                </Button>
              </Badge>
            </Grid>

            {(activeFilterCount > 0 || searchQuery) && (
              <Grid size={{ xs: 6, md: 'auto' }}>
                <Button
                  variant="text"
                  color="error"
                  startIcon={<IconRefresh size={18} />}
                  onClick={handleResetFilters}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Reset All
                </Button>
              </Grid>
            )}
          </Grid>

          <Popover
            open={Boolean(filterAnchorEl)}
            anchorEl={filterAnchorEl}
            onClose={closeFilters}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            PaperProps={{ sx: { p: 3, width: 280, borderRadius: 3, mt: 1.5 } }}
          >
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>Filter Reports</Typography>
            <Stack spacing={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                >
                  <MenuItem value="all">All</MenuItem>
                  {role === 'qa' && <MenuItem value="draft">Draft</MenuItem>}
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="reviewed">Reviewed</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  label="Type"
                  onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                </Select>
              </FormControl>

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

          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 650, tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: isManager ? '24%' : '32%', whiteSpace: 'nowrap' }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Typography variant="body2" fontWeight={600}>Period</Typography>
                      <IconButton size="small" onClick={() => handleSort('period_dates')} sx={{ p: 0 }}>
                        {getSortIcon('period_dates')}
                      </IconButton>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ width: '12%', whiteSpace: 'nowrap' }}>
                    <Typography variant="body2" fontWeight={600}>Type</Typography>
                  </TableCell>
                  <TableCell sx={{ width: '14%', whiteSpace: 'nowrap', display: { xs: 'none', sm: 'table-cell' } }}>
                    <Typography variant="body2" fontWeight={600}>Status</Typography>
                  </TableCell>
                  {isManager && (
                    <TableCell sx={{ width: '20%', whiteSpace: 'nowrap', display: { xs: 'none', md: 'table-cell' } }}>
                      <Typography variant="body2" fontWeight={600}>Created By</Typography>
                    </TableCell>
                  )}
                  <TableCell align="center" sx={{ width: '16%', whiteSpace: 'nowrap' }}>
                    <Typography variant="body2" fontWeight={600}>Actions</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={tableColSpan}>
                      <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress /></Box>
                    </TableCell>
                  </TableRow>
                ) : paginatedReports.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>
                      <Box component="span" sx={{ whiteSpace: 'nowrap' }}>
                        {r.date_from} → {r.date_to}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={r.period} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      {statusChip(r.status)}
                    </TableCell>
                    {isManager && (
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <UserAvatarWithName
                          username={r.created_by_username}
                          role={r.created_by_role}
                        />
                      </TableCell>
                    )}
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <IconButton
                          size="small"
                          sx={{ color: '#0288d1' }}
                          onClick={() => openReportView(r)}
                          title="View Report"
                        >
                          <IconEye size={18} />
                        </IconButton>
                        {role === 'qa' && (
                          <IconButton
                            size="small"
                            color="error"
                            disabled={r.status !== 'draft'}
                            onClick={() => {
                              setReportToDelete(r);
                              setDeleteDialog(true);
                            }}
                            title={r.status === 'draft' ? 'Delete Draft Report' : 'Only draft reports can be deleted'}
                          >
                            <IconTrash size={18} />
                          </IconButton>
                        )}
                        {isManager && (
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleDownload(r)}
                            disabled={downloadingId === r.id}
                            title="Download PDF Report"
                          >
                            {downloadingId === r.id
                              ? <CircularProgress size={16} color="inherit" />
                              : <IconDownload size={18} />}
                          </IconButton>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && paginatedReports.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={tableColSpan}>
                      <Box sx={{ py: 5, textAlign: 'center' }}>
                        <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5 }}>No reports found</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {searchQuery || activeFilterCount > 0
                            ? 'No reports match the selected filters.'
                            : 'No reports have been generated yet.'}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>

          <Box sx={{ mt: 1 }}>
            <TablePagination
              component="div"
              count={sortedReports.length}
              page={page}
              onPageChange={(event, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[]}
            />
          </Box>
        </CardContent>
      </Card>

      <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="sm">
        <DialogTitle>Generate New Report</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={2}>
            <TextField select label="Report Type" value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })} fullWidth>
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
            </TextField>
            <Stack direction="row" spacing={2}>
              <TextField type="date" label="From" InputLabelProps={{ shrink: true }} fullWidth
                value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} />
              <TextField type="date" label="To" InputLabelProps={{ shrink: true }} fullWidth
                value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'flex-end', px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setOpenForm(false)} variant="outlined"
            sx={{ color: 'text.secondary', borderColor: 'grey.400' }}>Cancel</Button>
          <Button variant="contained" onClick={handleGenerate} disabled={generating}>
            {generating ? <CircularProgress size={18} color="inherit" /> : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete this report?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)} variant="outlined"
            sx={{ color: 'text.secondary', borderColor: 'grey.400' }}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}
            disabled={deleting} sx={{ backgroundColor: 'error.dark' }}>
            {deleting ? <CircularProgress size={18} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openView} onClose={() => setOpenView(false)} fullWidth maxWidth="md">
        <DialogTitle>Report Details</DialogTitle>
        {selectedReport && (
          <DialogContent>
            {loadingReport && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
            <Stack spacing={3} mt={1}>
              <TextField
                label="Summary (Issues & Solutions)" multiline minRows={3}
                value={selectedReport.summary || ''}
                onChange={(e) => handleFieldChange('summary', e.target.value)}
                disabled={!isEditable} fullWidth
              />
              <TextField
                label="Positives" multiline minRows={2}
                value={selectedReport.positives || ''}
                onChange={(e) => handleFieldChange('positives', e.target.value)}
                disabled={!isEditable} fullWidth
              />
              <TextField
                label="Recommendations" multiline minRows={2}
                value={selectedReport.recommendations || ''}
                onChange={(e) => handleFieldChange('recommendations', e.target.value)}
                disabled={!isEditable} fullWidth
              />

              {(selectedReport.manager_notes || '').trim() && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                    Manager Notes
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {(selectedReport.manager_notes || '').trim()}
                  </Typography>
                  {selectedReport.reviewed_by_username && selectedReport.reviewed_at && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      By {selectedReport.reviewed_by_username} · {selectedReport.reviewed_at.split('T')[0]}
                    </Typography>
                  )}
                </Alert>
              )}

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Overall Sentiment
                </Typography>
                {(() => {
                  const s = getOverallSentiment(selectedReport);
                  const config = getSentimentConfig(s);
                  return <Chip label={s} color={config.color} icon={config.icon} size="small" />;
                })()}
              </Box>

              <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: 0 }}>
                <CardContent>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><Typography fontWeight={700}>Top Issues</Typography></TableCell>
                        <TableCell align="right"><Typography fontWeight={700}>Count</Typography></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(selectedReport.top_issues || []).map((item, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip label={`#${index + 1}`} size="small" color="primary" variant="outlined" />
                              <Typography fontWeight={500}>
                                {item.issue || item.main_issue || 'Unknown'}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="right">
                            <Chip label={item.count} color="error" size="small" />
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!selectedReport.top_issues || selectedReport.top_issues.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={2} align="center">
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                              No issues data
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Stack>
          </DialogContent>
        )}
        <DialogActions sx={{ justifyContent: 'flex-end', px: 3, pb: 3, gap: 1, flexWrap: 'wrap' }}>
          <Button onClick={() => setOpenView(false)} variant="outlined"
            sx={{ color: 'text.secondary', borderColor: 'grey.400' }}>Cancel</Button>
          {role === 'qa' && selectedReport?.status === 'draft' && (
            <>
              <Button variant="outlined" onClick={handleSaveDraft} disabled={saving}>
                {saving ? <CircularProgress size={16} /> : 'Save Draft'}
              </Button>
              <Button variant="contained" onClick={handlePublish}>Publish</Button>
            </>
          )}
          {role === 'manager' && selectedReport && (
            <>
              <Button
                variant={isReviewed(selectedReport) ? 'contained' : 'outlined'}
                color="primary"
                disabled={isReviewed(selectedReport) || reviewing}
                onClick={handleReview}
              >
                {reviewing
                  ? <CircularProgress size={16} />
                  : isReviewed(selectedReport) ? 'Reviewed ✓' : 'Review'}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => setOpenNotesDialog(true)}
              >
                Add Notes
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={downloadingId === selectedReport.id
                  ? <CircularProgress size={16} color="inherit" />
                  : <IconDownload size={16} />}
                disabled={downloadingId === selectedReport.id}
                onClick={() => handleDownload(selectedReport)}
              >
                Download PDF
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Dialog
        open={openNotesDialog}
        onClose={() => setOpenNotesDialog(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle>Add Notes for QA</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Write feedback for the QA team. They will see these notes when they open the report.
          </DialogContentText>
          <TextField
            label="Manager Notes"
            multiline
            minRows={4}
            fullWidth
            value={managerNotesInput}
            onChange={(e) => setManagerNotesInput(e.target.value)}
            placeholder="Enter your notes here..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setOpenNotesDialog(false)}
            variant="outlined"
            sx={{ color: 'text.secondary', borderColor: 'grey.400' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitNotes}
            disabled={!managerNotesInput.trim() || submittingNotes}
          >
            {submittingNotes ? <CircularProgress size={16} color="inherit" /> : 'Send to QA'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
