import { useState,useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Typography, Dialog,
  DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Stack, Chip, Table, TableBody,
  TableCell, TableHead, TableRow, Divider,Checkbox ,IconButton ,
  DialogContentText
} from '@mui/material';
import { IconPlus,IconTrash  } from '@tabler/icons-react';
import { IconMoodSmile, IconMoodNeutral, IconMoodSad } from '@tabler/icons-react';
export default function Reports() {
  const [reports, setReports] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const [form, setForm] = useState({
    type: 'daily',
    from: '',
    to: ''
  });

  const handleGenerate = () => {
    const newReport = {
      id: Date.now(),
      type: form.type,
      from: form.from,
      to: form.to,
      status: 'draft',
      createdBy: 'QA',
      createdAt: new Date().toISOString(),
      summary: '',
      positives: '',
      recommendations: '',
      sentiment: 'neutral',
      topIssues: []
    };

    setReports([newReport, ...reports]);
    setOpenForm(false);
  };

  const handlePublish = () => {
    setReports(reports.map(r =>
      r.id === selectedReport.id ? { ...r, status: 'published' } : r
    ));
    setOpenView(false);
  };

useEffect(() => {
  const saved = localStorage.getItem('reports');
  if (saved) {
    setReports(JSON.parse(saved));
  }
}, []);

useEffect(() => {
  localStorage.setItem('reports', JSON.stringify(reports));
}, [reports]);

const handleFieldChange = (field, value) => {
  const updated = reports.map(r =>
    r.id === selectedReport.id ? { ...r, [field]: value } : r
  );

  setReports(updated);

  setSelectedReport(prev => ({
    ...prev,
    [field]: value
  }));
};

const getSentimentConfig = (sentiment) => {
  switch (sentiment) {
    case 'positive':
      return {
        color: 'success',
        icon: <IconMoodSmile size={16} />
      };
    case 'neutral':
      return {
        color: 'default',
        icon: <IconMoodNeutral size={16} />
      };
    case 'negative':
      return {
        color: 'error',
        icon: <IconMoodSad size={16} />
      };
    default:
      return {
        color: 'default',
        icon: null
      };
  }
};
const sentimentConfig = selectedReport
  ? getSentimentConfig(selectedReport.sentiment)
  : { color: 'default', icon: null };


  const [deleteDialog, setDeleteDialog] = useState(false);
const [reportToDelete, setReportToDelete] = useState(null);

const handleDeleteClick = (report) => {
  setReportToDelete(report);
  setDeleteDialog(true);
};

const confirmDelete = () => {
  setReports(reports.filter(r => r.id !== reportToDelete.id));
  setDeleteDialog(false);
  setReportToDelete(null);
};
  return (
   <Box p={3}>

  <Card sx={{ borderRadius: 3 }}>
    <CardContent>

      {/* HEADER INSIDE CARD */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h4" gutterBottom sx={{ padding: '16px 2px' }}>
          Reports
        </Typography>

        <Button
          variant="contained"
          startIcon={<IconPlus />}
          onClick={() => setOpenForm(true)}
        >
          Generate 
        </Button>
      </Stack>

      {/* TABLE */}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: "30%" }} >Period</TableCell>
            <TableCell sx={{ width: "20%" }}>Type</TableCell>
            <TableCell sx={{ width: "20%" }}>Status</TableCell>
            <TableCell sx={{ width: "20%" }}>Created By</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {[...reports]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map(r => (
            <TableRow
              key={r.id}
              hover
              sx={{ cursor: 'pointer' }}
              onClick={() => {
                setSelectedReport(r);
                setOpenView(true);
              }}
            >
              <TableCell>{r.from} → {r.to}</TableCell>

              <TableCell>
                <Chip label={r.type} size="small" color="primary" variant="outlined" />
              </TableCell>

              <TableCell>
                <Chip
                  label={r.status}
                  color={r.status === 'published' ? 'success' : 'warning'}
                  size="small"
                />
              </TableCell>

              <TableCell>{r.createdBy}</TableCell>
              <TableCell>
  <IconButton
    color="error"
    onClick={(e) => {
      e.stopPropagation(); // 🔥 مهم حتى ما يفتح التقرير
      handleDeleteClick(r);
    }}
  >
    <IconTrash size={18} />
  </IconButton>
</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

    </CardContent>
  </Card>

      {/* CREATE DIALOG */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="sm">
        <DialogTitle>Generate New Report</DialogTitle>

        <DialogContent>
          <Stack spacing={2} mt={2}>

            <TextField
              select
              label="Report Type"
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
              fullWidth
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
            </TextField>

            <Stack direction="row" spacing={2}>
              <TextField
                type="date"
                label="From"
                InputLabelProps={{ shrink: true }}
                fullWidth
                onChange={e => setForm({ ...form, from: e.target.value })}
              />

              <TextField
                type="date"
                label="To"
                InputLabelProps={{ shrink: true }}
                fullWidth
                onChange={e => setForm({ ...form, to: e.target.value })}
              />
            </Stack>

          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleGenerate}>
            Generate
          </Button>
        </DialogActions>
      </Dialog>

<Dialog
  open={deleteDialog}
  onClose={() => setDeleteDialog(false)}
  maxWidth="sm"
  fullWidth
  PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
>
  <DialogTitle>Confirm Delete</DialogTitle>

  <DialogContent>
    <DialogContentText>
      Are you sure you want to delete this report?
    </DialogContentText>
  </DialogContent>

  <DialogActions>
    <Button
      onClick={() => setDeleteDialog(false)}
      variant="outlined"
      sx={{
        color: 'text.secondary',
        borderColor: 'grey.400',
        '&:hover': {
          borderColor: 'grey.600',
          backgroundColor: 'grey.100',
        },
      }}
    >
      Cancel
    </Button>

    <Button
      color="error"
      variant="contained"
      onClick={confirmDelete}
      sx={{
        backgroundColor: 'error.dark',
        '&:hover': {
          backgroundColor: 'error.main',
        },
      }}
    >
      Delete
    </Button>
  </DialogActions>
</Dialog>
      {/* VIEW REPORT */}
      <Dialog open={openView} onClose={() => setOpenView(false)} fullWidth maxWidth="md">
        <DialogTitle>Report Details</DialogTitle>

        {selectedReport && (
          <DialogContent>
            <Stack spacing={3} mt={1}>

              <TextField
                label="Summary (Issues & Solutions)"
                multiline
                minRows={3}
                value={selectedReport.summary}
                onChange={e =>
                  setSelectedReport({ ...selectedReport, summary: e.target.value })
                }
              />

              <TextField
                label="Positives"
                multiline
                minRows={2}
                value={selectedReport.positives}
                onChange={e =>
                  setSelectedReport({ ...selectedReport, positives: e.target.value })
                }
              />

              <TextField
                label="Recommendations"
                multiline
                minRows={2}
                value={selectedReport.recommendations}
                onChange={e =>
                  setSelectedReport({ ...selectedReport, recommendations: e.target.value })
                }
              />

              <Divider />

              {/* Sentiment */}

<TextField
  select
  label="Overall Sentiment"
  value={selectedReport.sentiment}
  onChange={e => handleFieldChange('sentiment', e.target.value)}
  fullWidth
  SelectProps={{
    renderValue: (selected) => {
      const config = getSentimentConfig(selected);

      return (
        <Chip
          label={
            selected
              ? selected.charAt(0).toUpperCase() + selected.slice(1)
              : ''
          }
          color={config.color}
          icon={config.icon}
          size="small"
        />
      );
    }
  }}
>
 <MenuItem value="positive">
  <Chip label="Positive" color="success" size="small" />
</MenuItem>
  <MenuItem value="neutral">
  <Chip label="neutral" color="default" size="small" />
</MenuItem>
 <MenuItem value="negative">
  <Chip label="negative" color="error" size="small" />
</MenuItem>
</TextField>
              {/* Issues */}
<TextField
  select
  label="Top Issues"
  value={selectedReport.topIssues || []}
  onChange={(e) => {
    const value = e.target.value;
    handleFieldChange('topIssues',e.target.value);
  }}
  fullWidth
  SelectProps={{
    multiple: true,
    renderValue: (selected) => (
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        {selected.map((value) => (
          <Chip key={value} label={value} size="small" />
        ))}
      </Box>
    )
  }}
>
  {['Delay', 'Bad audio', 'Agent tone', 'Missing info', 'Escalation'].map(issue => (
    <MenuItem key={issue} value={issue}>
      <Checkbox checked={selectedReport.topIssues?.indexOf(issue) > -1} />
      {issue}
    </MenuItem>
  ))}
</TextField>

            </Stack>
          </DialogContent>
        )}

        <DialogActions>
          <Button onClick={() => setOpenView(false)}>Close</Button>

          {selectedReport?.status === 'draft' && (
            <Button variant="contained" onClick={handlePublish}>
              Publish 
            </Button>
          )}
        </DialogActions>
      </Dialog>

    </Box>
  );
}