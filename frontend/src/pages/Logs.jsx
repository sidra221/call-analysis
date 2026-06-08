import {
  Box,
  Typography,
  Stack,
  Avatar,
  Chip,
  CircularProgress,
  alpha,
  useTheme
} from '@mui/material';

import {
  IconPhone,
  IconReportAnalytics,
  IconUserPlus,
  IconRefresh,
  IconCheck,
  IconTrash,
  IconFileText,
  IconUserMinus,
  IconClock,
  IconEdit,
  IconMessagePlus,
  IconMessageMinus
} from '@tabler/icons-react';

import { useEffect, useState } from 'react';
import { logsApi } from 'api/api';
import PageCard from 'ui-component/PageCard';
import PageTitle from 'ui-component/PageTitle';
import { getActionColor, resolveThemeColor } from 'constants/colors';

export default function Logs() {
  const theme = useTheme();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await logsApi.list();
      setLogs(res?.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (action) => {
    if (action === 'upload_call') return <IconPhone size={18} />;
    if (action === 'delete_call') return <IconTrash size={18} />;
    if (action === 'call_processing') return <IconRefresh size={18} />;
    if (action === 'call_status_change') return <IconRefresh size={18} />;
    if (action === 'review_call') return <IconCheck size={18} />;
    if (action === 'publish_report') return <IconReportAnalytics size={18} />;
    if (action === 'generate_report') return <IconFileText size={18} />;
    if (action === 'delete_report') return <IconTrash size={18} />;
    if (action === 'user_created') return <IconUserPlus size={18} />;
    if (action === 'user_deleted') return <IconUserMinus size={18} />;
    if (action === 'create_followup') return <IconMessagePlus size={18} />;
    if (action === 'delete_followup') return <IconMessageMinus size={18} />;
    if (action === 'update_followup') return <IconEdit size={18} />;
    return <IconRefresh size={18} />;
  };

  const getActionLabel = (action) => {
    const labels = {
      upload_call: 'Uploaded a call',
      delete_call: 'Deleted a call',
      call_processing: 'Started processing call',
      call_status_change: 'Call status changed',
      review_call: 'Reviewed a call',
      publish_report: 'Published a report',
      generate_report: 'Generated a report',
      delete_report: 'Deleted a report',
      user_created: 'User was created',
      user_deleted: 'User was deleted',
      create_followup: 'Created a followup',
      delete_followup: 'Deleted a followup',
      update_followup: 'Updated a followup'
    };
    return labels[action] || action.replace(/_/g, ' ');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <PageCard>
      <PageTitle title="System Logs" />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={4}>
          {logs.map((log, index) => {
            const actionColor = resolveThemeColor(theme, getActionColor(log.action));
            return (
              <Box
                key={log.id || index}
                sx={{
                  display: 'flex',
                  gap: 2,
                  position: 'relative'
                }}
              >
                {index !== logs.length - 1 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 23,
                      top: 50,
                      bottom: -35,
                      width: 2,
                      bgcolor: 'divider'
                    }}
                  />
                )}

                <Avatar
                  sx={{
                    bgcolor: alpha(actionColor, 0.12),
                    width: 46,
                    height: 46
                  }}
                >
                  <Box sx={{ color: actionColor }}>
                    {getIcon(log.action)}
                  </Box>
                </Avatar>

                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={700}>
                    {log.username}
                  </Typography>

                  <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                    {getActionLabel(log.action)}: {log.description}
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip
                      icon={<IconClock size={14} />}
                      label={formatDate(log.created_at)}
                      size="small"
                      variant="outlined"
                    />

                    <Chip
                      label={log.action.replace(/_/g, ' ')}
                      size="small"
                      sx={{
                        bgcolor: alpha(actionColor, 0.08),
                        color: actionColor,
                        borderColor: alpha(actionColor, 0.2),
                        fontWeight: 500
                      }}
                      variant="outlined"
                    />
                  </Stack>
                </Box>
              </Box>
            );
          })}

          {logs.length === 0 && (
            <Typography color="text.secondary" textAlign="center" py={4}>
              No logs yet
            </Typography>
          )}
        </Stack>
      )}
    </PageCard>
  );
}
