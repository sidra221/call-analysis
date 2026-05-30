import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableHead, TableRow, Chip, Divider, Avatar, Stack, CircularProgress,
  Select, MenuItem, FormControl, InputLabel, IconButton, useTheme
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { IconEye, IconEdit, IconArrowUp, IconArrowDown, IconAlertCircle } from '@tabler/icons-react';
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import LowPriorityIcon from "@mui/icons-material/LowPriority";
import WarningIcon from "@mui/icons-material/Warning";
import useCallsStore from 'hooks/useCallsStore';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { useState, useMemo, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { dashboardApi } from 'api/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const stateColor = {
  pending: 'warning',
  processing: 'info',
  completed: 'success',
  failed: 'error'
};

const statusLabel = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed'
};

const sentimentColor = {
  positive: 'success',
  negative: 'error',
  neutral: 'default'
};

const priorityColor = {
  high: 'error',
  medium: 'warning',
  low: 'success',
  critical: 'error'
};

const roleColors = {
  manager: { bg: '#ede7f6', color: '#5e35b1' },
  agent: { bg: '#e3f2fd', color: '#1e88e5' },
  qa: { bg: '#fff3e0', color: '#ef6c00' }
};

const getCircularColor = (percent, theme, type) => {
  if (type === 'negative') {
    if (percent > 40) return theme.palette.error.main;
    if (percent > 30) return theme.palette.error.light;
    if (percent > 20) return theme.palette.warning.main;
    return theme.palette.grey[500];
  } else {
    if (percent > 40) return theme.palette.success.main;
    if (percent > 30) return theme.palette.success.light;
    if (percent > 20) return theme.palette.warning.main;
    return theme.palette.grey[500];
  }
};

export default function Dashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { calls, fetchCalls, loading } = useCallsStore();
  const [dashboardData, setDashboardData] = useState(null);
  const [topicsData, setTopicsData] = useState(null);
  const [dashLoading, setDashLoading] = useState(true);
  const [chartTimeRange, setChartTimeRange] = useState('week');
  
  const [sortByDate, setSortByDate] = useState('desc');
  const [sortByUploader, setSortByUploader] = useState(null);
  const [page, setPage] = useState(0);
  const rowsPerPage = 5;

  const criticalCount = useMemo(() => {
    if (!Array.isArray(calls)) return 0;
    return calls.filter(call => 
      call.priority === 'critical' || call.analysis?.priority === 'critical'
    ).length;
  }, [calls]);

  useEffect(() => {
    fetchCalls();
    loadDashboard();
  }, [fetchCalls]);

  const loadDashboard = async () => {
    try {
      setDashLoading(true);
      const [summary, topics] = await Promise.all([
        dashboardApi.summary(),
        dashboardApi.topics(),
      ]);
      setDashboardData(summary?.data);
      setTopicsData(topics?.data);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setDashLoading(false);
    }
  };

  const navigateToCallsWithFilter = (filterType, filterValue) => {
    navigate("/calls", { state: { filter: filterType, value: filterValue } });
  };

  const getUserRoleColor = (roleName) => {
    return roleColors[roleName] || { bg: '#f5f5f5', color: '#757575' };
  };

  const getFilteredCallsForChart = () => {
    let filtered = [...calls];
    const now = new Date();
    
    switch (chartTimeRange) {
      case 'day':
        const today = new Date().toDateString();
        filtered = calls.filter(call => new Date(call.created_at).toDateString() === today);
        break;
      case 'week':
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        filtered = calls.filter(call => new Date(call.created_at) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        filtered = calls.filter(call => new Date(call.created_at) >= monthAgo);
        break;
      case 'year':
        const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
        filtered = calls.filter(call => new Date(call.created_at) >= yearAgo);
        break;
      default:
        filtered = calls;
    }
    return filtered;
  };

  const latestCalls = useMemo(() => {
    if (!Array.isArray(calls)) return [];
    return calls.map((call) => ({
      ...call,
      sentiment: call.analysis?.sentiment || 'neutral',
      priority: call.analysis?.priority || 'low',
      is_reviewed: call.analysis?.is_reviewed || false,
      issue: call.analysis?.main_issue || '',
      transcript: call.analysis?.transcript || '',
      keywords: Array.isArray(call.analysis?.keywords)
        ? call.analysis.keywords.join(', ')
        : '',
      uploadedBy: call.uploaded_by_username || '',
      uploadedByRole: call.uploaded_by_role || 'agent',
      createdAt: call.created_at ? call.created_at.split('T')[0] : '',
      duration: call.duration
        ? `${Math.floor(call.duration / 60)}:${String(Math.round(call.duration % 60)).padStart(2, '0')}`
        : '00:00',
    }));
  }, [calls]);

  const sortedCalls = useMemo(() => {
    let result = [...latestCalls];

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

    return result.slice(0, 5);
  }, [latestCalls, sortByDate, sortByUploader]);

  const toggleSortByDate = () => {
    setSortByDate(prev => prev === 'desc' ? 'asc' : 'desc');
    setSortByUploader(null);
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
  };

  const topIssues = useMemo(() => {
    const negativeIssues = topicsData?.negative_issues || [];
    const positiveIssues = topicsData?.positive_issues || [];
    const totalNeg = negativeIssues.reduce((sum, i) => sum + i.count, 0);
    const totalPos = positiveIssues.reduce((sum, i) => sum + i.count, 0);
    
    const negativeWithPercent = negativeIssues.map(issue => ({
      issue: issue.main_issue,
      count: issue.count,
      percent: totalNeg > 0 ? Math.round((issue.count / totalNeg) * 100) : 0,
      type: 'negative'
    }));
    
    const positiveWithPercent = positiveIssues.map(issue => ({
      issue: issue.main_issue,
      count: issue.count,
      percent: totalPos > 0 ? Math.round((issue.count / totalPos) * 100) : 0,
      type: 'positive'
    }));
    
    return { negative: negativeWithPercent.slice(0, 6), positive: positiveWithPercent.slice(0, 6) };
  }, [topicsData]);

  const sentimentChartData = useMemo(() => {
    const filteredCalls = getFilteredCallsForChart();
    
    if (chartTimeRange === 'day') {
      const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
      const posData = new Array(24).fill(0);
      const negData = new Array(24).fill(0);
      
      filteredCalls.forEach((call) => {
        const hour = new Date(call.created_at).getHours();
        if (call.analysis?.sentiment === 'positive') posData[hour]++;
        if (call.analysis?.sentiment === 'negative') negData[hour]++;
      });
      
      return {
        labels: hours,
        datasets: [
          { label: "Positive", data: posData, backgroundColor: theme.palette.success.main, borderRadius: 5, barThickness: 10 },
          { label: "Negative", data: negData, backgroundColor: theme.palette.error.main, borderRadius: 5, barThickness: 10 }
        ]
      };
    } else {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const posData = new Array(7).fill(0);
      const negData = new Array(7).fill(0);
      
      filteredCalls.forEach((call) => {
        const day = new Date(call.created_at).getDay();
        if (call.analysis?.sentiment === 'positive') posData[day]++;
        if (call.analysis?.sentiment === 'negative') negData[day]++;
      });
      
      return {
        labels: days,
        datasets: [
          { label: "Positive", data: posData, backgroundColor: theme.palette.success.main, borderRadius: 5, barThickness: 14 },
          { label: "Negative", data: negData, backgroundColor: theme.palette.error.main, borderRadius: 5, barThickness: 14 }
        ]
      };
    }
  }, [calls, chartTimeRange, theme]);

  if (dashLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 3 }}>

      {/* Priority Cards */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        
        <Card sx={{ flex: 1, minWidth: 0, borderRadius: 2 }}>
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: theme.palette.error.light, width: 48, height: 48 }}>
              <WarningIcon sx={{ color: theme.palette.error.main, fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline', color: theme.palette.error.main } }}
                onClick={() => navigateToCallsWithFilter('priority', 'critical')}
              >
                Critical Priority
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {criticalCount}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 0, borderRadius: 2 }}>
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: theme.palette.error.light, width: 48, height: 48 }}>
              <PriorityHighIcon sx={{ color: theme.palette.error.main, fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline', color: theme.palette.error.main } }}
                onClick={() => navigateToCallsWithFilter('priority', 'high')}
              >
                High Priority
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {dashboardData?.priority?.high || 0}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 0, borderRadius: 2 }}>
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: theme.palette.warning.light, width: 48, height: 48 }}>
              <ReportProblemIcon sx={{ color: theme.palette.warning.main, fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline', color: theme.palette.warning.main } }}
                onClick={() => navigateToCallsWithFilter('priority', 'medium')}
              >
                Medium Priority
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {dashboardData?.priority?.medium || 0}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 0, borderRadius: 2 }}>
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: theme.palette.success.light, width: 48, height: 48 }}>
              <LowPriorityIcon sx={{ color: theme.palette.success.main, fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline', color: theme.palette.success.main } }}
                onClick={() => navigateToCallsWithFilter('priority', 'low')}
              >
                Low Priority
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {dashboardData?.priority?.low || 0}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Overview + Sentiment Section */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        
        <Card sx={{ flex: 1, minWidth: 0, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>Overview</Typography>
            <Box sx={{ width: "100%", p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
              
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 3 }}>
                <Typography variant="body1" fontWeight={600}>Total Calls:</Typography>
                <Typography variant="h4" fontWeight={700}>{dashboardData?.overview?.total_calls || 0}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline', color: theme.palette.info.main } }}
                    onClick={() => navigateToCallsWithFilter('sentiment', 'neutral')}
                  >
                    Neutral Calls
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>{dashboardData?.sentiment?.neutral || 0}</Typography>
                </Box>
                <Box sx={{ height: 8, borderRadius: 5, bgcolor: "action.hover", overflow: "hidden" }}>
                  <Box sx={{ width: `${((dashboardData?.sentiment?.neutral || 0) / (dashboardData?.overview?.total_calls || 1)) * 100}%`, height: "100%", borderRadius: 5, bgcolor: theme.palette.info.main }} />
                </Box>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline', color: theme.palette.success.main } }}
                    onClick={() => navigateToCallsWithFilter('sentiment', 'positive')}
                  >
                    Positive Calls
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>{dashboardData?.sentiment?.positive || 0}</Typography>
                </Box>
                <Box sx={{ height: 8, borderRadius: 5, bgcolor: "action.hover", overflow: "hidden" }}>
                  <Box sx={{ width: `${((dashboardData?.sentiment?.positive || 0) / (dashboardData?.overview?.total_calls || 1)) * 100}%`, height: "100%", borderRadius: 5, bgcolor: theme.palette.success.main }} />
                </Box>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline', color: theme.palette.error.main } }}
                    onClick={() => navigateToCallsWithFilter('sentiment', 'negative')}
                  >
                    Negative Calls
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>{dashboardData?.sentiment?.negative || 0}</Typography>
                </Box>
                <Box sx={{ height: 8, borderRadius: 5, bgcolor: "action.hover", overflow: "hidden" }}>
                  <Box sx={{ width: `${((dashboardData?.sentiment?.negative || 0) / (dashboardData?.overview?.total_calls || 1)) * 100}%`, height: "100%", borderRadius: 5, bgcolor: theme.palette.error.main }} />
                </Box>
              </Box>
              
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline', color: theme.palette.warning.main } }}
                    onClick={() => navigateToCallsWithFilter('needs_followup', 'true')}
                  >
                    Needs Follow-up
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>{dashboardData?.follow_ups?.needs_followup || 0}</Typography>
                </Box>
                <Box sx={{ height: 8, borderRadius: 5, bgcolor: "action.hover", overflow: "hidden" }}>
                  <Box sx={{ width: `${((dashboardData?.follow_ups?.needs_followup || 0) / (dashboardData?.overview?.total_calls || 1)) * 100}%`, height: "100%", borderRadius: 5, bgcolor: theme.palette.warning.main }} />
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: 1, minWidth: 0, borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>Sentiment Analysis</Typography>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <Select
                  value={chartTimeRange}
                  onChange={(e) => setChartTimeRange(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="day">Day</MenuItem>
                  <MenuItem value="week">Week</MenuItem>
                  <MenuItem value="month">Month</MenuItem>
                  <MenuItem value="year">Year</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ height: 280, mt: 1 }}>
              <Bar data={sentimentChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Latest Calls Table */}
      <Card sx={{ width: "100%", borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>Latest Calls</Typography>
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Sentiment</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Duration</TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Typography variant="body2" fontWeight={600}>Created At</Typography>
                      <IconButton size="small" onClick={toggleSortByDate} sx={{ p: 0 }}>
                        {sortByDate === 'desc' ? <IconArrowDown size={16} /> : <IconArrowUp size={16} />}
                      </IconButton>
                    </Stack>
                  </TableCell>
                  <TableCell>Reviewed</TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Typography variant="body2" fontWeight={600}>Uploaded By</Typography>
                      <IconButton size="small" onClick={toggleSortByUploader} sx={{ p: 0 }}>
                        {sortByUploader === 'asc' ? <IconArrowUp size={16} /> :
                          sortByUploader === 'desc' ? <IconArrowDown size={16} /> :
                            <IconArrowUp size={16} style={{ opacity: 0.5 }} />}
                      </IconButton>
                    </Stack>
                  </TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedCalls.map((call) => {
                  const roleColor = getUserRoleColor(call.uploadedByRole);
                  return (
                    <TableRow key={call.id} sx={{ '& td': { py: 1.5 } }}>
                      <TableCell>#{call.id}</TableCell>
                      <TableCell><Chip label={call.priority} color={priorityColor[call.priority]} size="small" /></TableCell>
                      <TableCell><Chip label={statusLabel[call.status] || call.status} color={stateColor[call.status]} size="small" /></TableCell>
                      <TableCell><Chip label={call.sentiment} color={sentimentColor[call.sentiment]} size="small" /></TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{call.duration}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{call.createdAt}</TableCell>
                      <TableCell><Chip label={call.is_reviewed ? 'Yes' : 'No'} color={call.is_reviewed ? 'success' : 'error'} size="small" /></TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar sx={{ width: 28, height: 28, bgcolor: roleColor.bg, color: roleColor.color, fontSize: 12, fontWeight: 600 }}>
                            {call.uploadedBy?.[0]?.toUpperCase() || '?'}
                          </Avatar>
                          <Typography variant="body2">{call.uploadedBy}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <IconButton size="small" sx={{ color: theme.palette.info.main }} onClick={() => navigate("/calls", { state: { selectedCallId: call.id, mode: 'view' } })}>
                            <IconEye size={18} />
                          </IconButton>
                          <IconButton size="small" color="primary" onClick={() => navigate("/calls", { state: { selectedCallId: call.id, mode: 'edit' } })}>
                            <IconEdit size={18} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {sortedCalls.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">No calls yet</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>

      {/* Top Issues Section */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        
        <Card sx={{ flex: 1, minWidth: 0, borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>Top Negative Issues</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={2}>
              {topIssues.negative.map((issue, idx) => (
                <Box 
                  key={idx}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    p: 1.5,
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: '0.2s',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                  onClick={() => navigateToCallsWithFilter('issue', issue.issue)}
                >
                  <Box sx={{ position: 'relative', display: 'inline-flex', minWidth: 60 }}>
                    <CircularProgress
                      variant="determinate"
                      value={issue.percent}
                      size={50}
                      thickness={5}
                      sx={{ color: getCircularColor(issue.percent, theme, 'negative') }}
                    />
                    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>{issue.percent}%</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                      {issue.issue.length > 35 ? issue.issue.substring(0, 35) + '...' : issue.issue}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {issue.count} occurrence{issue.count !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  <Chip label={`#${idx + 1}`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                </Box>
              ))}
            </Stack>
            {topIssues.negative.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No negative issues data available
              </Typography>
            )}
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 0, borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>Positive Highlights</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={2}>
              {topIssues.positive.map((issue, idx) => (
                <Box 
                  key={idx}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    p: 1.5,
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: '0.2s',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                  onClick={() => navigateToCallsWithFilter('issue', issue.issue)}
                >
                  <Box sx={{ position: 'relative', display: 'inline-flex', minWidth: 60 }}>
                    <CircularProgress
                      variant="determinate"
                      value={issue.percent}
                      size={50}
                      thickness={5}
                      sx={{ color: getCircularColor(issue.percent, theme, 'positive') }}
                    />
                    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>{issue.percent}%</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                      {issue.issue.length > 35 ? issue.issue.substring(0, 35) + '...' : issue.issue}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {issue.count} occurrence{issue.count !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  <Chip label={`#${idx + 1}`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                </Box>
              ))}
            </Stack>
            {topIssues.positive.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No positive highlights data available
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>

    </Box>
  );
}