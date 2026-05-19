import { useState,useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Typography, Dialog,
  DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Stack, Chip, Table, TableBody,
  TableCell, TableHead, TableRow, Divider,Checkbox ,IconButton ,
  DialogContentText,alpha, useTheme,
  Grid,Avatar 
} from '@mui/material';
import { IconPlus,IconTrash , IconClipboardText,IconChecks,IconClockHour4,IconMoodSmile, IconMoodNeutral, IconMoodSad  } from '@tabler/icons-react';

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
const theme = useTheme();

  
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

  topIssues: [
    {
      issue: 'Delay',
      count: Math.floor(Math.random() * 20) + 1
    },
    {
      issue: 'Bad audio',
      count: Math.floor(Math.random() * 15) + 1
    },
    {
      issue: 'Agent tone',
      count: Math.floor(Math.random() * 10) + 1
    },
    {
      issue: 'Missing info',
      count: Math.floor(Math.random() * 8) + 1
    },
    {
      issue: 'Escalation',
      count: Math.floor(Math.random() * 5) + 1
    }
  ],

  sentimentStats: {
    positive: Math.floor(Math.random() * 30),
    neutral: Math.floor(Math.random() * 15),
    negative: Math.floor(Math.random() * 10)
  }
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

  const handleSaveDraft = () => {
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
const role = 'qa'; // qa | manager
const isEditable =
  role === 'qa' &&
  selectedReport?.status === 'draft';

  return (
   <Box >

  <Card sx={{ borderRadius: 3 }}>
    <CardContent >

      {/* HEADER INSIDE CARD */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
  alignItems={{ xs: 'stretch', sm: 'center' }}
  justifyContent="space-between"
  spacing={2}
  mb={3}
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


{/* SUMMARY CARDS */}
<Grid container spacing={2} sx={{ mb: 3 }}>

  {/* Total Reports */}
  <Grid size={{ xs: 12, md: 4 }}>
    <Card
      sx={{
        borderRadius: '20px',
        boxShadow: 'none',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
        height: '100%'
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
              Total Reports
            </Typography>

            <Typography variant="h4" fontWeight={700}>
              {reports.length}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  </Grid>

  {/* Published Reports */}
  <Grid size={{ xs: 12, md: 4 }}>
    <Card
      sx={{
        borderRadius: '20px',
        boxShadow: 'none',
        border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
        height: '100%'
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
              Published Reports
            </Typography>

            <Typography variant="h4" fontWeight={700}>
              {
                reports.filter(r => r.status === 'published').length
              }
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  </Grid>

  {/* Draft Reports */}
  <Grid size={{ xs: 12, md: 4 }}>
    <Card
      sx={{
        borderRadius: '20px',
        boxShadow: 'none',
        border: `1px solid ${alpha(theme.palette.warning.main, 0.15)}`,
        height: '100%'
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
              Draft Reports
            </Typography>

            <Typography variant="h4" fontWeight={700}>
              {
                reports.filter(r => r.status === 'draft').length
              }
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  </Grid>

</Grid>
      {/* TABLE */}
      <Box sx={{ width: '100%', overflowX: 'auto' }}>
        <Table sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: "30%" }} >Period</TableCell>
              <TableCell sx={{ width: "20%" }}>Type</TableCell>
              <TableCell sx={{ width: "20%", display: { xs: 'none', sm: 'table-cell' } }}>Status</TableCell>
              <TableCell sx={{ width: "20%", display: { xs: 'none', md: 'table-cell' } }}>Created By</TableCell>
              <TableCell align="right">Actions</TableCell>
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

                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                  <Chip
                    label={r.status}
                    color={r.status === 'published' ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>

                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{r.createdBy}</TableCell>
                <TableCell align="right">
                  <IconButton
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
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
      </Box>

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

        <DialogActions sx={{ justifyContent: 'flex-end', px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setOpenForm(false)}
                 variant="outlined"
      sx={{
        color: 'text.secondary',
        borderColor: 'grey.400',
        '&:hover': {
          borderColor: 'grey.600',
          backgroundColor: 'grey.100',
        },
      }}
      >Cancel</Button>
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

  <DialogActions >
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
  onChange={(e) =>
    handleFieldChange('summary', e.target.value)
  }
  disabled={!isEditable}
/>

<TextField
  label="Positives"
  multiline
  minRows={2}
  value={selectedReport.positives}
  onChange={(e) =>
    handleFieldChange('positives', e.target.value)
  }
  disabled={!isEditable}
/>

<TextField
  label="Recommendations"
  multiline
  minRows={2}
  value={selectedReport.recommendations}
  onChange={(e) =>
    handleFieldChange('recommendations', e.target.value)
  }
  disabled={!isEditable}
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
  disabled={!isEditable}
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
disabled={!isEditable}
</TextField>
              {/* Issues */}
{/* Top Issues Analytics */}
<Card
  sx={{
    borderRadius: 4,
    border: '1px solid',
    borderColor: 'divider',
    boxShadow: 0
  }}
>
  <CardContent>

    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      mb={2}
    >
    </Stack>

    <Table size="small">

      <TableHead>
        <TableRow>
          <TableCell>
            <Typography fontWeight={700}>
             top 5 Issue
            </Typography>
          </TableCell>

          <TableCell align="right">
            <Typography fontWeight={700}>
              Count
            </Typography>
          </TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {selectedReport.topIssues?.map((item, index) => (
          <TableRow key={index} hover>

            <TableCell>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
              >
                <Chip
                  label={`#${index + 1}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />

                <Typography fontWeight={500}>
                  {item.issue}
                </Typography>
              </Stack>
            </TableCell>

            <TableCell align="right">
              <Chip
                label={item.count}
                color="error"
                size="small"
              />
            </TableCell>

          </TableRow>
        ))}
      </TableBody>

    </Table>

  </CardContent>
</Card>

            </Stack>
          </DialogContent>
        )}

<DialogActions
  sx={{
    justifyContent: 'flex-end',
    px: 3,
    pb: 3,
    gap: 1
  }}
>
  <Button
    onClick={() => setOpenView(false)}
    variant="outlined"
    sx={{
      color: 'text.secondary',
      borderColor: 'grey.400',
      '&:hover': {
        borderColor: 'grey.600',
        backgroundColor: 'grey.100'
      }
    }}
  >
    Cancel
  </Button>
{/* QA Actions */}
{role === 'qa' && selectedReport?.status === 'draft' && (
  <>
    <Button
      variant="outlined"
      onClick={handleSaveDraft}
      sx={{
       
        px: 3
      }}
    >
      Save 
    </Button>

    <Button
      variant="contained"
      onClick={handlePublish}
    >
      Publish
    </Button>
  </>
)}

{/* Manager Action */}
{role === 'manager' && (
  <Button
    variant="contained"
    color="success"
    sx={{
     
      px: 3
    }}
  >
    Download 
  </Button>
)}
    
 
</DialogActions>
      </Dialog>

    </Box>
  );
}