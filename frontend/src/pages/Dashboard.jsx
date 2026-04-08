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

const mainStats = [
  { title: 'Total Calls', value: 50 },
  { title: 'Completed Calls', value: 35 },
  { title: 'Pending Calls', value: 10 },
  { title: 'Needs Follow-up', value: 5 }
];

const sentiments = [
  { title: 'Positive', value: 20 },
  { title: 'Negative', value: 18 },
  { title: 'Neutral', value: 12 }
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
  neutral: 'default'
};

const priorityColor = {
  high: 'error',
  medium: 'warning',
  low: 'success'
};

function SectionCard({ title, subtitle, children }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h5">{title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {subtitle}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {children}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monitor call analysis performance and key insights
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <SectionCard title="Overview" subtitle="Summary of system activity">
          <Grid container spacing={2}>
            {mainStats.map((metric) => (
              <Grid item xs={12} sm={6} md={3} key={metric.title}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent
                    sx={{
                      minHeight: 150,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {metric.title}
                    </Typography>
                    <Typography variant="h3">{metric.value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </SectionCard>
      </Grid>

      <Grid item xs={12}>
        <SectionCard title="Sentiment Analysis" subtitle="Distribution of call sentiment results">
          <Grid container spacing={2}>
            {sentiments.map((metric) => (
              <Grid item xs={12} sm={4} key={metric.title}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent
                    sx={{
                      minHeight: 150,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {metric.title}
                    </Typography>
                    <Chip label={metric.title} color={sentimentColor[metric.title.toLowerCase()]} size="small" sx={{ mb: 1 }} />
                    <Typography variant="h3">{metric.value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Card variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Sentiment Distribution Chart
              </Typography>
              <Box sx={{ height: 120, bgcolor: 'grey.100', borderRadius: 1 }} />
            </CardContent>
          </Card>
        </SectionCard>
      </Grid>

      <Grid item xs={12}>
        <SectionCard title="Priority Distribution" subtitle="Priority levels for current calls">
          <Grid container spacing={2}>
            {priorities.map((metric) => (
              <Grid item xs={12} sm={4} key={metric.title}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent
                    sx={{
                      minHeight: 150,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {metric.title}
                    </Typography>
                    <Chip label={metric.title} color={priorityColor[metric.title.toLowerCase()]} size="small" sx={{ mb: 1 }} />
                    <Typography variant="h3">{metric.value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Card variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Priority Distribution Chart
              </Typography>
              <Box sx={{ height: 120, bgcolor: 'grey.100', borderRadius: 1 }} />
            </CardContent>
          </Card>
        </SectionCard>
      </Grid>

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

      <Grid item xs={12}>
        <SectionCard title="Follow-ups" subtitle="Follow-up workload and progress snapshot">
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent
                  sx={{
                    minHeight: 150,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Needs Follow-up
                  </Typography>
                  <Typography variant="h3">5</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent
                  sx={{
                    minHeight: 150,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Total Follow-ups
                  </Typography>
                  <Typography variant="h3">8</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </SectionCard>
      </Grid>

      <Grid item xs={12}>
        <SectionCard title="Latest Calls" subtitle="Most recent calls requiring monitoring">
          <Table size="small">
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
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" variant="outlined">
                        View
                      </Button>
                      <Button size="small" variant="outlined" color="warning" disabled={call.status === 'completed'}>
                        Process
                      </Button>
                      <Button size="small" variant="contained" disabled={call.reviewed === 'Yes'}>
                        Review
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>
      </Grid>
    </Grid>
  );
}
