import { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Typography, Dialog,
  DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Stack, Chip, Table, TableBody,
  TableCell, TableHead, TableRow, Divider, IconButton,
  DialogContentText, alpha, useTheme, Grid, Avatar,
  CircularProgress, Alert
} from '@mui/material';
import {
  IconPlus, IconTrash, IconClipboardText, IconChecks,
  IconClockHour4, IconMoodSmile, IconMoodNeutral, IconMoodSad
} from '@tabler/icons-react';
import { reportsApi } from 'api/api';
import useAuth from 'hooks/useAuth';

export default function Reports() {
  const theme = useTheme();
  const { user } = useAuth();
  const role = (user?.role || '').toLowerCase();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  const [openForm, setOpenForm] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ type: 'daily', from: '', to: '' });

  useEffect(() => {
    loadReports();
  }, []);
  
  const loadReports = async () => {
    try {
      setLoading(true);
  
      const res = await reportsApi.list();
  
      console.log('REPORTS LIST:', res);
  
      const reportsData =
        res?.results ||
        [];
  
      setReports(reportsData);
  
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

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
    await reportsApi.delete(reportToDelete.id);
    await loadReports(); // ✅ أضف هذا السطر
  } catch (err) {
    setError(err.message || 'Delete failed');
  } finally {
    setDeleteDialog(false);
    setReportToDelete(null);
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

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>
      )}

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
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
              <Card sx={{ borderRadius: '20px', boxShadow: 'none', border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}` }}>
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
              <Card sx={{ borderRadius: '20px', boxShadow: 'none', border: `1px solid ${alpha(theme.palette.success.main, 0.15)}` }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.12), color: theme.palette.success.main }}>
                      <IconChecks size={20} />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Published</Typography>
                      <Typography variant="h4" fontWeight={700}>{reports.filter((r) => r.status === 'published').length}</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: '20px', boxShadow: 'none', border: `1px solid ${alpha(theme.palette.warning.main, 0.15)}` }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.12), color: theme.palette.warning.main }}>
                      <IconClockHour4 size={20} />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Drafts</Typography>
                      <Typography variant="h4" fontWeight={700}>{reports.filter((r) => r.status === 'draft').length}</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            {loading ? (
              <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress /></Box>
            ) : (
              <Table sx={{ minWidth: 600 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '30%' }}>Period</TableCell>
                    <TableCell sx={{ width: '20%' }}>Type</TableCell>
                    <TableCell sx={{ width: '20%', display: { xs: 'none', sm: 'table-cell' } }}>Status</TableCell>
                    <TableCell sx={{ width: '20%', display: { xs: 'none', md: 'table-cell' } }}>Created By</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...reports].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((r) => (
                    <TableRow key={r.id} hover sx={{ cursor: 'pointer' }}
                      onClick={() => { setSelectedReport(r); setOpenView(true); }}>
                      <TableCell>{r.date_from} → {r.date_to}</TableCell>
                      <TableCell>
                        <Chip label={r.period} size="small" color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <Chip label={r.status} color={r.status === 'published' ? 'success' : 'warning'} size="small" />
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        {r.created_by_username}
                      </TableCell>
                      <TableCell align="right">
                        {role === 'qa' && (
                          <IconButton color="error" onClick={(e) => {
                            e.stopPropagation();
                            setReportToDelete(r);
                            setDeleteDialog(true);
                          }}>
                            <IconTrash size={18} />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {reports.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No reports yet</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
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
            sx={{ backgroundColor: 'error.dark' }}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openView} onClose={() => setOpenView(false)} fullWidth maxWidth="md">
        <DialogTitle>Report Details</DialogTitle>
        {selectedReport && (
          <DialogContent>
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
        <DialogActions sx={{ justifyContent: 'flex-end', px: 3, pb: 3, gap: 1 }}>
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
          {role === 'manager' && (
            <Button variant="contained" color="success">Download</Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}