import { useNavigate } from "react-router-dom";
import StatCard from './StatCard';
import { Paper } from '@mui/material';
import StatsRow from "./StatsRow";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Chip,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);
const data = [

  {
    label: "Neural Calls",
    value: 90,
    color: "#673ab7"
  },
  {
    label: "Positive Calls",
    value: 120,
    color: "#2ecc71"
  },
  {
    label: "Negative Calls",
    value: 45,
    color: "#e74c3c"
  },
  {
    label: "Follow-up",
    value: 30,
    color: "#f1c40f"
  }
];


const priorities = [
  { title: 'High', value: 10 },
  { title: 'Medium', value: 25 },
  { title: 'Low', value: 15 }
];

const latestCalls = [
  { id: 1, status: 'completed', sentiment: 'positive', priority: 'high', reviewed: 'Yes' },
  { id: 2, status: 'pending', sentiment: 'negative', priority: 'medium', reviewed: 'No' },
  { id: 3, status: 'completed', sentiment: 'neutral', priority: 'low', reviewed: 'Yes' },
  { id: 4, status: 'pending', sentiment: 'positive', priority: 'medium', reviewed: 'No' },
  { id: 5, status: 'completed', sentiment: 'negative', priority: 'high', reviewed: 'Yes' }
];


const sentimentColor = {
  positive: 'success',
  negative: 'error',
  neutral: 'info'
};

const priorityColor = {
  high: 'error',
  medium: 'warning',
  low: 'success'
};

const priorityStyles = {
  high: {
    bg: "linear-gradient(135deg, #f44336 0%, #ef9a9a 100%)",
    shadow: "0 8px 20px rgba(211,47,47,0.35)"
  },
  medium: {
    bg: "linear-gradient(135deg, #FFE57F 0%, #fff8e1 100%)",
    shadow: "0 8px 20px rgba(241,196,15,0.35)"
  },
  low: {
    bg: "linear-gradient(135deg, #69f0ae 0%, #b9f6ca 100%)",
    shadow: "0 8px 20px rgba(46,204,113,0.35)"
  }
};

const priorityPill = {
  high: {
    bg: "rgba(255,255,255,0.25)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.35)"
  },
  medium: {
    bg: "rgba(255,255,255,0.25)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.35)"
  },
  low: {
    bg: "rgba(255,255,255,0.25)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.35)"
  }
};


/* 🔥 بيانات الشارت */
const sentimentChartData = {
  labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  datasets: [
    {
      label: "Positive",
      data: [3, 5, 4, 6, 2, 4, 3],
      backgroundColor: "#2ecc71",
      borderRadius: 5,
      barThickness: 14
    },
    {
      label: "Negative",
      data: [2, 3, 5, 2, 4, 3, 2],
      backgroundColor: "#e74c3c",
      borderRadius: 5,
      barThickness: 14
    }
  ]
};
const sentimentChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: "index",
    intersect: false
  },
  plugins: {
    legend: {
      position: "top",
      align: "end",
      labels: {
        boxWidth: 10,
        boxHeight: 10,
        usePointStyle: true,
        pointStyle: "circle",
        color: "#6b7280",
        font: {
          size: 12,
          weight: "500"
        }
      }
    },
    tooltip: {
      backgroundColor: "#111827",
      titleColor: "#fff",
      bodyColor: "#fff",
      padding: 10,
      cornerRadius: 6,
      displayColors: true
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: "#9CA3AF",
        font: {
          size: 12
        }
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: "rgba(203,213,225,0.3)",
        drawBorder: false
      },
      ticks: {
        color: "#9CA3AF",
        font: {
          size: 12
        },
        stepSize: 1
      }
    }
  },
  animation: {
    duration: 800,
    easing: "easeOutCubic"
  }
};
function SectionCard({ title, subtitle, children, noPadding }) {
  return (
    <Card sx={{ height: '100%', width:"100%" }}>
      <CardContent sx={{ p: noPadding ? 0 : 2 }}>
        <Box sx={{ px: noPadding ? 2 : 0, pt: noPadding ? 2 : 0 }}>
          <Typography variant="h5">{title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {subtitle}
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Box>

        {children}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate(); 
  return (
    <Grid container spacing={2}>
       <Grid item xs={12}>
        <Card>
          <CardContent>
            <Grid container spacing={3}>

              {/* 🔥 Overview */}

              <Grid item xs={12}>
                <SectionCard title="Overview" subtitle="Summary of system activity">
                  <StatCard data={data} />
                </SectionCard>
              </Grid>

              {/* 🔥 Sentiment Chart */}

              <Grid item xs={12}>
                <SectionCard
                  title="Sentiment Analysis"
                  subtitle="Calls per day (positive vs negative)"
                >
                <Box
                  sx={{
                  p: 3,
                  borderRadius: 3,
                  background: "#ffffff",
                  boxShadow: "0px 2px 14px rgba(32,40,45,0.08)"
                  }}
                >
                  <Box sx={{ height: 300,width:400}}>
                    <Bar data={sentimentChartData} options={sentimentChartOptions} />
                  </Box>
                </Box>
                </SectionCard>
                
              </Grid>
    

              {/* Priority */}
<Grid item xs={12} sx={{ width: "100%" }}>
  <SectionCard
    title="Priority Distribution"
    subtitle="Priority levels for current calls"
      noPadding
  >
    
    <Grid container spacing={3} alignItems="stretch" >
      {priorities.map((metric) => {
        const key = metric.title.toLowerCase();
        const style = priorityStyles[key];

        return (
       <Grid item xs={12} sm={6} md={4} lg={4} key={metric.title}>
           <Paper
  elevation={0}
  sx={{
    p: 3,
    borderRadius: 3,
    textAlign: "center",
    background: style.bg,
    color: "#fff",
    boxShadow: style.shadow,
    transition: "0.25s ease",

    width: "100%",       
    height: "100%",
    display: "flex",        // ✅ يخليه يتمدد
    flexDirection: "column",
    justifyContent: "center",

    "&:hover": {
      transform: "translateY(-6px)",
      boxShadow: style.shadow.replace("0.35", "0.55")
    }
  }}
>
  
              {/* Pill */}
              <Box
                sx={{
                  display: "inline-block",
                  px: 2,
                  py: 0.5,
                  mb: 2,
                  borderRadius: "50px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  background: priorityPill[key].bg,
                  color: priorityPill[key].color,
                  border: priorityPill[key].border
                }}
              >
                {metric.title}
              </Box>

              {/* Value */}
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  mt: 1
                }}
              >
                {metric.value}
              </Typography>
            </Paper>
          </Grid>
          
        );
      })}
    </Grid>
  </SectionCard>
</Grid>

              {/* Keywords */}
              <Grid item xs={12} md={6}>
                <SectionCard title="Top Keywords" subtitle="Most frequent terms in recent calls">
                  <Stack spacing={1}>
                    <Typography variant="body2">- delayed delivery</Typography>
                    <Typography variant="body2">- invoice issue</Typography>
                    <Typography variant="body2">- payment retry</Typography>
                    <Typography variant="body2">- follow-up request</Typography>
                  </Stack>
                </SectionCard>
              </Grid>

              {/* Issues */}
              <Grid item xs={12} md={6}>
                <SectionCard title="Top Issues" subtitle="Most reported customer concerns">
                  <Stack spacing={1}>
                    <Typography variant="body2">- Service interruption</Typography>
                    <Typography variant="body2">- Billing mismatch</Typography>
                    <Typography variant="body2">- Onboarding clarification</Typography>
                    <Typography variant="body2">- App usability feedback</Typography>
                  </Stack>
                </SectionCard>
              </Grid>

              {/* Table */}
              
              <Grid item xs={12}>
                <SectionCard title="Latest Calls" subtitle="Most recent calls requiring monitoring">
                  <Table size="small" sx={{ minWidth: 650 }}>
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
                      {latestCalls.map((call) => (
                        <TableRow key={call.id}>
                          <TableCell>{call.id}</TableCell>
                          <TableCell>{call.status}</TableCell>
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
                            <Stack direction="row" spacing={1}>
                              <Button size="small" variant="outlined"   onClick={() => navigate('/Calls')}>View</Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </SectionCard>
              </Grid>

            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}