import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Typography, Dialog,
  DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Stack, Chip, Table, TableBody,
  TableCell, TableHead, TableRow, Divider, IconButton,
  DialogContentText, Grid,
  CircularProgress, Alert, TablePagination,
  FormControl, InputLabel, Select, Checkbox
} from '@mui/material';
import {
  IconPlus, IconTrash, IconTrashX, IconClipboardText, IconChecks,
  IconClockHour4, IconMoodSmile, IconMoodNeutral, IconMoodSad,
  IconEye, IconDownload, IconArrowUp, IconArrowDown
} from '@tabler/icons-react';
import { reportsApi } from 'api/api';
import useAuth from 'hooks/useAuth';
import UserAvatarWithName from 'ui-component/UserAvatarWithName';
import PageCard from 'ui-component/PageCard';
import PageTitle from 'ui-component/PageTitle';
import FilterToolbar from 'ui-component/FilterToolbar';
import FilterPopover from 'ui-component/FilterPopover';
import StatSummaryCard from 'ui-component/StatSummaryCard';
import StatusChip from 'ui-component/StatusChip';
import DialogCancelButton from 'ui-component/DialogCancelButton';
import {
  TABLE_LAYOUT_SX,
  TABLE_CHECKBOX_CELL_SX,
  TABLE_ACTIONS_CELL_SX,
  TABLE_HEADER_CELL_SX,
  TABLE_HEADER_SORT_SX,
  TABLE_BODY_CELL_SX
} from 'constants/table';

const rowsPerPage = 6;

export default function Reports() {
  const location = useLocation();
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
  const [creatorFilter, setCreatorFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [selected, setSelected] = useState([]);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);

  const [form, setForm] = useState({ type: 'daily', from: '', to: '' });

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    if (location.state?.filter === 'creator' && location.state?.value) {
      setCreatorFilter(location.state.value);
      setPage(0);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
    if (creatorFilter) count++;
    return count;
  }, [statusFilter, typeFilter, creatorFilter]);

  const handleResetFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setCreatorFilter('');
    setSearchQuery('');
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(0);
    setSelected([]);
  };

  const openFilters = (event) => setFilterAnchorEl(event.currentTarget);
  const closeFilters = () => setFilterAnchorEl(null);

  const filteredReports = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return reports.filter((report) => {
      const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
      const matchesType = typeFilter === 'all' || report.period === typeFilter;
      const matchesCreator = !creatorFilter || report.created_by_username === creatorFilter;

      if (!query) {
        return matchesStatus && matchesType && matchesCreator;
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
      return matchesStatus && matchesType && matchesCreator && matchesSearch;
    });
  }, [reports, statusFilter, typeFilter, creatorFilter, searchQuery]);

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

  const canSelectReport = (report) => role !== 'qa' || report.status === 'draft';

  const selectableOnPage = paginatedReports.filter(canSelectReport);

  const isAllPageSelected = selectableOnPage.length > 0
    && selectableOnPage.every((r) => selected.includes(r.id));

  const isSomePageSelected = selectableOnPage.some((r) => selected.includes(r.id)) && !isAllPageSelected;

  const handleSelectAll = (e) => {
    const pageIds = selectableOnPage.map((r) => r.id);
    if (e.target.checked) {
      setSelected((prev) => [...new Set([...prev, ...pageIds])]);
    } else {
      setSelected((prev) => prev.filter((id) => !pageIds.includes(id)));
    }
  };

  const handleSelectReport = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectedDeletable = selected.filter((id) => {
    const report = reports.find((r) => r.id === id);
    return report && canSelectReport(report);
  });

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
      setSelected((prev) => prev.filter((id) => id !== reportToDelete.id));
      setDeleteDialog(false);
      setReportToDelete(null);
    } catch (err) {
      setError(err.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDeletable.length === 0) return;
    try {
      setDeleting(true);
      for (const id of selectedDeletable) {
        await reportsApi.delete(id);
      }
      setReports((prev) => prev.filter((r) => !selectedDeletable.includes(r.id)));
      setSelected((prev) => prev.filter((id) => !selectedDeletable.includes(id)));
      setBulkDeleteDialog(false);
    } catch (err) {
      setError(err.message || 'Bulk delete failed');
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

  const isManager = role === 'manager';
  const isReviewed = (report) => report?.status === 'reviewed' || report?.status === 'approved';
  const tableColSpan = isManager ? 6 : 5;

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>
      )}

      {creatorFilter && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Showing reports created by <strong>{creatorFilter}</strong>
        </Alert>
      )}

      <PageCard bordered>
          <PageTitle
            title="Reports"
            action={role === 'qa' ? (
              <Button variant="contained" startIcon={<IconPlus />} onClick={() => setOpenForm(true)}>
                Generate
              </Button>
            ) : null}
          />

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <StatSummaryCard icon={<IconClipboardText size={20} />} label="Total Reports" value={reports.length} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <StatSummaryCard icon={<IconChecks size={20} />} label="Published" value={publishedCount} color="success" />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <StatSummaryCard
                icon={<IconClockHour4 size={20} />}
                label={role === 'manager' ? 'Reviewed' : 'Drafts'}
                value={role === 'manager' ? reviewedCount : draftCount}
                color="warning"
              />
            </Grid>
          </Grid>

          <FilterToolbar
            search={searchQuery}
            onSearchChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            onSearchClear={() => { setSearchQuery(''); setPage(0); }}
            searchPlaceholder="Search summary, dates, status..."
            activeFilterCount={activeFilterCount}
            onOpenFilters={openFilters}
            onResetFilters={handleResetFilters}
            showReset={activeFilterCount > 0 || !!searchQuery}
            actions={role === 'qa' && selectedDeletable.length > 0 ? (
              <Button
                variant="contained"
                color="error"
                startIcon={<IconTrashX size={18} />}
                onClick={() => setBulkDeleteDialog(true)}
              >
                Delete Selected ({selectedDeletable.length})
              </Button>
            ) : null}
          />

          <FilterPopover
            open={Boolean(filterAnchorEl)}
            anchorEl={filterAnchorEl}
            onClose={closeFilters}
            title="Filter Reports"
          >
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
          </FilterPopover>

          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <Table size="small" sx={TABLE_LAYOUT_SX}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={TABLE_CHECKBOX_CELL_SX}>
                    <Checkbox
                      size="small"
                      checked={isAllPageSelected}
                      indeterminate={isSomePageSelected}
                      onChange={handleSelectAll}
                      disabled={selectableOnPage.length === 0}
                    />
                  </TableCell>
                  <TableCell sx={{ ...TABLE_HEADER_CELL_SX, width: isManager ? '24%' : '30%' }}>
                    <Box component="span" sx={TABLE_HEADER_SORT_SX}>
                      Period
                      <IconButton size="small" onClick={() => handleSort('period_dates')} sx={{ p: 0, flexShrink: 0 }}>
                        {getSortIcon('period_dates')}
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ ...TABLE_HEADER_CELL_SX, width: isManager ? '14%' : '18%' }}>Type</TableCell>
                  <TableCell sx={{ ...TABLE_HEADER_CELL_SX, width: isManager ? '14%' : '18%', display: { xs: 'none', sm: 'table-cell' } }}>
                    Status
                  </TableCell>
                  {isManager && (
                    <TableCell sx={{ ...TABLE_HEADER_CELL_SX, width: '22%', display: { xs: 'none', md: 'table-cell' } }}>
                      Created By
                    </TableCell>
                  )}
                  <TableCell align="center" sx={{ ...TABLE_ACTIONS_CELL_SX, ...TABLE_HEADER_CELL_SX }}>
                    Actions
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
                  <TableRow key={r.id} hover selected={selected.includes(r.id)}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        checked={selected.includes(r.id)}
                        onChange={() => handleSelectReport(r.id)}
                        disabled={!canSelectReport(r)}
                      />
                    </TableCell>
                    <TableCell sx={TABLE_BODY_CELL_SX}>
                      {r.date_from} → {r.date_to}
                    </TableCell>
                    <TableCell>
                      <Chip label={r.period} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      <StatusChip status={r.status} />
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
                          sx={{ color: 'info.main' }}
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
      </PageCard>

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
          <DialogCancelButton onClick={() => setOpenForm(false)} />
          <Button variant="contained" onClick={handleGenerate} disabled={generating}>
            {generating ? <CircularProgress size={18} color="inherit" /> : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete this report?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <DialogCancelButton onClick={() => setDeleteDialog(false)} />
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={deleting}>
            {deleting ? <CircularProgress size={18} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bulkDeleteDialog} onClose={() => setBulkDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Selected Reports</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{selectedDeletable.length}</strong> selected report(s)?
            Only draft reports can be deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <DialogCancelButton onClick={() => setBulkDeleteDialog(false)} />
          <Button color="error" variant="contained" onClick={handleBulkDelete} disabled={deleting}>
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
                <Alert severity="info">
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

              <Card sx={{ boxShadow: 0 }}>
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
          <DialogCancelButton onClick={() => setOpenView(false)} />
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

      <Dialog open={openNotesDialog} onClose={() => setOpenNotesDialog(false)} fullWidth maxWidth="sm">
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
          <DialogCancelButton onClick={() => setOpenNotesDialog(false)} />
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
