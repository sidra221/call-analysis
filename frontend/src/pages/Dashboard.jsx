import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableHead, TableRow, Chip, Divider, Avatar, Stack, CircularProgress,
  Select, MenuItem, FormControl, InputLabel, IconButton, LinearProgress, useTheme
} from "@mui/material";
import { alpha } from '@mui/material/styles';
import { useNavigate } from "react-router-dom";
import {
  IconEye,
  IconEdit,
  IconArrowUp,
  IconArrowDown,
  IconMinus,
  IconAlertTriangle
} from '@tabler/icons-react';
import useCallsStore from 'hooks/useCallsStore';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { useState, useMemo, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { dashboardApi } from 'api/api';
import { getSentimentChipColor } from 'constants/status';
import { formatKeywords } from 'utils/keywords';
import StatusChip from 'ui-component/StatusChip';
import UserAvatarWithName from 'ui-component/UserAvatarWithName';
import {
  TABLE_LAYOUT_SX,
  TABLE_ACTIONS_CELL_SX,
  TABLE_HEADER_CELL_SX,
  TABLE_HEADER_SORT_SX,
  TABLE_BODY_CELL_SX
} from 'constants/table';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const PRIORITY_HIGH_ORANGE = '#ff9800';

const getPriorityCardStyle = (theme, level) => {
  const accent = {
    critical: {
      main: theme.palette.error.main,
      hover: theme.palette.error.main
    },
    high: {
      main: PRIORITY_HIGH_ORANGE,
      hover: '#e65100'
    },
    medium: {
      main: theme.palette.warning.dark,
      hover: theme.palette.warning.dark
    },
    low: {
      main: theme.palette.success.dark,
      hover: theme.palette.success.dark
    }
  }[level] || {
    main: theme.palette.text.secondary,
    hover: theme.palette.text.secondary
  };

  return {
    avatarBg: alpha(accent.main, 0.14),
    iconColor: accent.main,
    hoverColor: accent.hover
  };
};

const getPriorityChipSx = (theme, level) => {
  const { iconColor } = getPriorityCardStyle(theme, level);
  return {
    bgcolor: alpha(iconColor, 0.12),
    color: iconColor,
    borderColor: alpha(iconColor, 0.35),
    fontWeight: 600,
  };
};

const getSentimentChipSx = (theme, sentiment) => {
  const color = getSentimentChipColor(theme, sentiment);
  return {
    bgcolor: alpha(color, 0.12),
    color,
    borderColor: alpha(color, 0.35),
    fontWeight: 600,
  };
};

const getIssueRingColor = (theme, type) => (
  type === 'negative' ? theme.palette.error.main : theme.palette.success.dark
);

function OverviewMetric({ label, value, total, color, progressColor, onClick }) {
  const percent = total > 0 ? (value / total) * 100 : 0;
  const usesThemeColor = Boolean(progressColor);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          onClick={onClick}
          sx={{
            cursor: onClick ? 'pointer' : 'default',
            '&:hover': onClick ? { textDecoration: 'underline', color } : undefined
          }}
        >
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {value}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percent}
        color={usesThemeColor ? progressColor : undefined}
        sx={{
          height: 8,
          borderRadius: 5,
          ...(!usesThemeColor && {
            bgcolor: alpha(color, 0.12),
            '& .MuiLinearProgress-bar': { borderRadius: 5, bgcolor: color }
          }),
          ...(usesThemeColor && {
            '& .MuiLinearProgress-bar': { borderRadius: 5 }
          })
        }}
      />
    </Box>
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const filterCallsByRange = (calls, range) => {
  const list = Array.isArray(calls) ? calls : [];
  const today = startOfDay(new Date());

  switch (range) {
    case 'day':
      return list.filter((call) => startOfDay(call.created_at).getTime() === today.getTime());
    case 'week': {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return list.filter((call) => startOfDay(call.created_at) >= start);
    }
    case 'month': {
      const start = new Date(today);
      start.setDate(start.getDate() - 27);
      return list.filter((call) => startOfDay(call.created_at) >= start);
    }
    case 'year': {
      const start = new Date(today);
      start.setMonth(start.getMonth() - 11, 1);
      return list.filter((call) => new Date(call.created_at) >= start);
    }
    default:
      return list;
  }
};

const buildSentimentChartData = (calls, range, theme) => {
  const positiveColor = getSentimentChipColor(theme, 'positive');
  const negativeColor = getSentimentChipColor(theme, 'negative');
  const filtered = filterCallsByRange(calls, range);
  const today = startOfDay(new Date());

  const makeDatasets = (labels, posData, negData) => ({
    labels,
    datasets: [
      { label: 'Positive', data: posData, backgroundColor: positiveColor, borderRadius: 5 },
      { label: 'Negative', data: negData, backgroundColor: negativeColor, borderRadius: 5 }
    ]
  });

  if (range === 'day') {
    const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const posData = new Array(24).fill(0);
    const negData = new Array(24).fill(0);

    filtered.forEach((call) => {
      const hour = new Date(call.created_at).getHours();
      if (call.analysis?.sentiment === 'positive') posData[hour] += 1;
      if (call.analysis?.sentiment === 'negative') negData[hour] += 1;
    });

    return makeDatasets(labels, posData, negData);
  }

  if (range === 'week') {
    const labels = [];
    const dayStarts = [];

    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dayStarts.push(d.getTime());
      labels.push(d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }));
    }

    const posData = new Array(7).fill(0);
    const negData = new Array(7).fill(0);

    filtered.forEach((call) => {
      const idx = dayStarts.indexOf(startOfDay(call.created_at).getTime());
      if (idx === -1) return;
      if (call.analysis?.sentiment === 'positive') posData[idx] += 1;
      if (call.analysis?.sentiment === 'negative') negData[idx] += 1;
    });

    return makeDatasets(labels, posData, negData);
  }

  if (range === 'month') {
    const rangeStart = new Date(today);
    rangeStart.setDate(rangeStart.getDate() - 27);

    const labels = Array.from({ length: 4 }, (_, w) => {
      const ws = new Date(rangeStart);
      ws.setDate(ws.getDate() + w * 7);
      const we = new Date(ws);
      we.setDate(we.getDate() + 6);
      return `${ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${we.toLocaleDateString('en-US', { day: 'numeric' })}`;
    });

    const posData = new Array(4).fill(0);
    const negData = new Array(4).fill(0);

    filtered.forEach((call) => {
      const callDay = startOfDay(call.created_at);
      const diffDays = Math.floor((callDay.getTime() - rangeStart.getTime()) / DAY_MS);
      if (diffDays < 0 || diffDays > 27) return;
      const idx = Math.min(3, Math.floor(diffDays / 7));
      if (call.analysis?.sentiment === 'positive') posData[idx] += 1;
      if (call.analysis?.sentiment === 'negative') negData[idx] += 1;
    });

    return makeDatasets(labels, posData, negData);
  }

  const labels = [];
  const monthKeys = [];

  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    monthKeys.push(`${d.getFullYear()}-${d.getMonth()}`);
    labels.push(d.toLocaleDateString('en-US', { month: 'short' }));
  }

  const posData = new Array(12).fill(0);
  const negData = new Array(12).fill(0);

  filtered.forEach((call) => {
    const d = new Date(call.created_at);
    const idx = monthKeys.indexOf(`${d.getFullYear()}-${d.getMonth()}`);
    if (idx === -1) return;
    if (call.analysis?.sentiment === 'positive') posData[idx] += 1;
    if (call.analysis?.sentiment === 'negative') negData[idx] += 1;
  });

  return makeDatasets(labels, posData, negData);
};

const getCircularColor = (percent, theme, type) => getIssueRingColor(theme, type);

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

  const totalCalls = dashboardData?.overview?.total_calls || 0;

  const overviewMetrics = useMemo(() => [
    {
      label: 'Neutral Calls',
      value: dashboardData?.sentiment?.neutral || 0,
      color: getSentimentChipColor(theme, 'neutral'),
      filter: { type: 'sentiment', value: 'neutral' }
    },
    {
      label: 'Positive Calls',
      value: dashboardData?.sentiment?.positive || 0,
      color: getSentimentChipColor(theme, 'positive'),
      progressColor: 'success',
      filter: { type: 'sentiment', value: 'positive' }
    },
    {
      label: 'Negative Calls',
      value: dashboardData?.sentiment?.negative || 0,
      color: getSentimentChipColor(theme, 'negative'),
      progressColor: 'error',
      filter: { type: 'sentiment', value: 'negative' }
    },
    {
      label: 'Needs Follow-up',
      value: dashboardData?.follow_ups?.needs_followup || 0,
      color: theme.palette.warning.dark,
      progressColor: 'warning',
      filter: { type: 'needs_followup', value: 'true' }
    }
  ], [dashboardData, theme]);

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

  const latestCalls = useMemo(() => {
    if (!Array.isArray(calls)) return [];
    return calls.map((call) => ({
      ...call,
      sentiment: call.analysis?.sentiment || 'neutral',
      priority: call.analysis?.priority || 'low',
      is_reviewed: call.analysis?.is_reviewed || false,
      issue: call.analysis?.main_issue || '',
      transcript: call.analysis?.transcript || '',
      keywords: formatKeywords(call.analysis?.keywords),
      uploadedBy: call.uploaded_by_username || '',
      uploadedByRole: call.uploaded_by_role || 'qa',
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

  const sentimentChartData = useMemo(
    () => buildSentimentChartData(calls, chartTimeRange, theme),
    [calls, chartTimeRange, theme]
  );

  const sentimentChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    datasets: {
      bar: {
        barPercentage: 0.72,
        categoryPercentage: 0.82,
        maxBarThickness: chartTimeRange === 'day' ? 14 : chartTimeRange === 'year' ? 28 : 36
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          maxRotation: chartTimeRange === 'month' ? 25 : 0,
          autoSkip: true,
          maxTicksLimit: chartTimeRange === 'day' ? 12 : undefined
        }
      },
      y: {
        beginAtZero: true,
        grace: '8%',
        ticks: { stepSize: 1, precision: 0 },
        grid: { drawBorder: false }
      }
    },
    layout: { padding: { top: 4 } }
  }), [chartTimeRange]);

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
        {[
          {
            level: 'critical',
            label: 'Critical Priority',
            value: criticalCount,
            filter: 'critical',
            Icon: IconAlertTriangle
          },
          {
            level: 'high',
            label: 'High Priority',
            value: dashboardData?.priority?.high || 0,
            filter: 'high',
            Icon: IconArrowUp
          },
          {
            level: 'medium',
            label: 'Medium Priority',
            value: dashboardData?.priority?.medium || 0,
            filter: 'medium',
            Icon: IconMinus
          },
          {
            level: 'low',
            label: 'Low Priority',
            value: dashboardData?.priority?.low || 0,
            filter: 'low',
            Icon: IconArrowDown
          }
        ].map(({ level, label, value, filter, Icon }) => {
          const accent = getPriorityCardStyle(theme, level);

          return (
            <Card key={level} sx={{ flex: 1, minWidth: 0 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: accent.avatarBg, width: 48, height: 48 }}>
                  <Icon size={26} color={accent.iconColor} stroke={2} />
                </Avatar>
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline', color: accent.hoverColor }
                    }}
                    onClick={() => navigateToCallsWithFilter('priority', filter)}
                  >
                    {label}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Overview + Sentiment Section */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "stretch" }}>
        
        <Card sx={{ flex: 1, minWidth: 0, display: "flex" }}>
          <CardContent
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              py: 3,
              px: 3,
              "&:last-child": { pb: 3 }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, minHeight: 40 }}>
              <Typography variant="h4" sx={{ fontWeight: 600, lineHeight: 1.2 }}>Overview</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" fontWeight={600}>
                  Total Calls:
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {totalCalls}
                </Typography>
              </Box>
            </Box>
            <Stack sx={{ flex: 1, justifyContent: "space-evenly" }}>
              {overviewMetrics.map(({ label, value, color, progressColor, filter }) => (
                <OverviewMetric
                  key={label}
                  label={label}
                  value={value}
                  total={totalCalls}
                  color={color}
                  progressColor={progressColor}
                  onClick={() => navigateToCallsWithFilter(filter.type, filter.value)}
                />
              ))}
            </Stack>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: 1, minWidth: 0, display: "flex" }}>
          <CardContent
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              py: 3,
              px: 3,
              "&:last-child": { pb: 3 }
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1.5,
                mb: 2,
                minHeight: 40
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 600, lineHeight: 1.2 }}>Sentiment Analysis</Typography>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: 0.5,
                        bgcolor: getSentimentChipColor(theme, 'positive')
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Positive
                    </Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: 0.5,
                        bgcolor: getSentimentChipColor(theme, 'negative')
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Negative
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
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
            <Box sx={{ flex: 1, minHeight: 300, position: 'relative' }}>
              <Bar
                key={chartTimeRange}
                data={sentimentChartData}
                options={sentimentChartOptions}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Latest Calls Table */}
      <Card sx={{ width: "100%" }}>
        <CardContent>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>Latest Calls</Typography>
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <Table size="small" sx={{ ...TABLE_LAYOUT_SX, minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ ...TABLE_HEADER_CELL_SX, width: '8%' }}>ID</TableCell>
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
                  <TableCell sx={{ ...TABLE_HEADER_CELL_SX, width: '15%', display: { xs: 'none', lg: 'table-cell' } }}>
                    <Box component="span" sx={TABLE_HEADER_SORT_SX}>
                      Uploaded By
                      <IconButton size="small" onClick={toggleSortByUploader} sx={{ p: 0, flexShrink: 0 }}>
                        {sortByUploader === 'asc' ? <IconArrowUp size={16} /> :
                          sortByUploader === 'desc' ? <IconArrowDown size={16} /> :
                            <IconArrowUp size={16} style={{ opacity: 0.5 }} />}
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell align="center" sx={{ ...TABLE_ACTIONS_CELL_SX, ...TABLE_HEADER_CELL_SX }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedCalls.map((call) => (
                    <TableRow key={call.id} hover>
                      <TableCell sx={TABLE_BODY_CELL_SX}>#{call.id}</TableCell>
                      <TableCell>
                        <Chip
                          label={call.priority}
                          size="small"
                          variant="outlined"
                          sx={getPriorityChipSx(theme, call.priority)}
                        />
                      </TableCell>
                      <TableCell><StatusChip status={call.status} /></TableCell>
                      <TableCell>
                        <Chip
                          label={call.sentiment}
                          size="small"
                          variant="outlined"
                          sx={getSentimentChipSx(theme, call.sentiment)}
                        />
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{call.duration}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{call.createdAt}</TableCell>
                      <TableCell><Chip label={call.is_reviewed ? 'Yes' : 'No'} color={call.is_reviewed ? 'success' : 'error'} size="small" /></TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                        <UserAvatarWithName username={call.uploadedBy} role={call.uploadedByRole} />
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
                ))}
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
        
        <Card sx={{ flex: 1, minWidth: 0 }}>
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
                  <Chip
                    label={`#${idx + 1}`}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.error.main,
                      borderColor: alpha(theme.palette.error.main, 0.35),
                      bgcolor: alpha(theme.palette.error.main, 0.08),
                    }}
                  />
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

        <Card sx={{ flex: 1, minWidth: 0 }}>
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
                  <Chip
                    label={`#${idx + 1}`}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.success.dark,
                      borderColor: alpha(theme.palette.success.dark, 0.35),
                      bgcolor: alpha(theme.palette.success.dark, 0.08),
                    }}
                  />
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