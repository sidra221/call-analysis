import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableHead, TableRow, Chip, Divider, Avatar, Stack, CircularProgress
} from "@mui/material";
import StatCard from './StatCard';
import { useNavigate } from "react-router-dom";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import LowPriorityIcon from "@mui/icons-material/LowPriority";
import useCallsStore from 'hooks/useCallsStore';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { useState, useMemo, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { dashboardApi } from 'api/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function Dashboard() {
  const navigate = useNavigate();
  const { calls, fetchCalls, loading } = useCallsStore();
  const [dashboardData, setDashboardData] = useState(null);
  const [topicsData, setTopicsData] = useState(null);
  const [dashLoading, setDashLoading] = useState(true);

  useEffect(() => {
    fetchCalls();
    loadDashboard();
  }, []);

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

  const sentimentColor = { positive: 'success', negative: 'error', neutral: 'default' };
  const priorityColor = { high: 'error', medium: 'warning', low: 'success', critical: 'error' };
  const stateColor = { pending: 'warning', processing: 'info', completed: 'success', failed: 'error' };
  const statusLabel = { pending: 'Pending', processing: 'Processing', completed: 'Completed', failed: 'Failed' };

  const latestCalls = useMemo(() => {
    if (!Array.isArray(calls)) return [];
    return calls.slice(0, 5).map((call) => ({
      ...call,
      sentiment: call.analysis?.sentiment || 'neutral',
      priority: call.analysis?.priority || 'low',
      is_reviewed: call.analysis?.is_reviewed || false,
      uploadedBy: call.uploaded_by_username || '',
      createdAt: call.created_at ? call.created_at.split('T')[0] : '',
      duration: call.duration
        ? `${Math.floor(call.duration / 60)}:${String(Math.round(call.duration % 60)).padStart(2, '0')}`
        : '00:00',
    }));
  }, [calls]);

  const overviewData = [
    { label: "Neutral Calls", value: dashboardData?.sentiment?.neutral || 0, color: "secondary" },
    { label: "Positive Calls", value: dashboardData?.sentiment?.positive || 0, color: "success" },
    { label: "Negative Calls", value: dashboardData?.sentiment?.negative || 0, color: "error" },
    { label: "Follow-up", value: dashboardData?.follow_ups?.needs_followup || 0, color: "warning" }
  ];

  const topNegativeIssues = topicsData?.negative_issues || [];
  const topPositiveIssues = topicsData?.positive_issues || [];
  const topKeywords = topicsData?.top_keywords || [];

  const sentimentChartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const posData = new Array(7).fill(0);
    const negData = new Array(7).fill(0);

    latestCalls.forEach((call) => {
      const day = new Date(call.createdAt).getDay();
      if (call.sentiment === 'positive') posData[day]++;
      if (call.sentiment === 'negative') negData[day]++;
    });

    return {
      labels: days,
      datasets: [
        { label: "Positive", data: posData, backgroundColor: "#2ecc71", borderRadius: 5, barThickness: 14 },
        { label: "Negative", data: negData, backgroundColor: "#e74c3c", borderRadius: 5, barThickness: 14 }
      ]
    };
  }, [latestCalls]);

  if (dashLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 3 }}>

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Card sx={{ flex: 1, minWidth: 0, borderRadius: 3 }}>
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: "error.light", width: 48, height: 48 }}>
              <PriorityHighIcon color="error" />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">High Priority</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {(dashboardData?.priority?.high || 0) + (dashboardData?.priority?.critical || 0)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 0, borderRadius: 3 }}>
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: "warning.light", width: 48, height: 48 }}>
              <ReportProblemIcon color="warning" />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Medium Priority</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {dashboardData?.priority?.medium || 0}
              </Typography>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 0, borderRadius: 3 }}>
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: "success.light", width: 48, height: 48 }}>
              <LowPriorityIcon color="success" />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Low Priority</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {dashboardData?.priority?.low || 0}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Card sx={{ flex: 1, minWidth: 0, borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h4" gutterBottom sx={{ padding: '16px 2px' }}>Overview</Typography>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <StatCard data={overviewData} />
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 0, borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h4" gutterBottom sx={{ padding: '16px 2px' }}>Sentiment</Typography>
            <Box sx={{ height: 250, mt: 2 }}>
              <Bar data={sentimentChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Card sx={{ width: "100%", borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom sx={{ padding: '16px 2px' }}>Latest Calls</Typography>
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
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
                  <TableCell align="center" sx={{ width: 100 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {latestCalls.map((call) => (
                  <TableRow key={call.id} sx={{ '& td': { py: 1.5 } }}>
                    <TableCell>#{call.id}</TableCell>
                    <TableCell><Chip label={call.priority} color={priorityColor[call.priority]} size="small" /></TableCell>
                    <TableCell><Chip label={statusLabel[call.status] || call.status} color={stateColor[call.status]} size="small" /></TableCell>
                    <TableCell><Chip label={call.sentiment} color={sentimentColor[call.sentiment]} size="small" /></TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{call.duration}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                      <Box component="span" sx={{ unicodeBidi: 'isolate', display: 'inline-block' }}>{call.createdAt}</Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={call.is_reviewed ? 'Yes' : 'No'}
                        color={call.is_reviewed ? 'success' : 'error'} size="small" />
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{call.uploadedBy}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label="View"
                        size="small"
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate("/calls", { state: { selectedCallId: call.id } })}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {latestCalls.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Box sx={{ py: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">No calls yet</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Card sx={{ flex: 1, minWidth: 0, borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>Top Negative Issues</Typography>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={1.5}>
              {topNegativeIssues.length > 0 ? topNegativeIssues.map((item, i) => (
                <Box key={i} sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{item.main_issue}</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>{item.count}x</Typography>
                  </Box>
                </Box>
              )) : (
                <Typography variant="body2" color="text.secondary">No data yet</Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 0, borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>Top Keywords</Typography>
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {topKeywords.length > 0 ? topKeywords.map((item, i) => (
                <Chip key={i} label={`${item.keyword} (${item.count})`} size="small" variant="outlined" />
              )) : (
                <Typography variant="body2" color="text.secondary">No data yet</Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Box>

    </Box>
  );
}