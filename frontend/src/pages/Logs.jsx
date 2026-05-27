import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Avatar,
  Chip,
  CircularProgress
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

export default function Logs() {
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
    // Call actions
    if (action === 'upload_call') return <IconPhone size={18} />;
    if (action === 'delete_call') return <IconTrash size={18} />;
    if (action === 'call_processing') return <IconRefresh size={18} />;
    if (action === 'call_status_change') return <IconRefresh size={18} />;
    if (action === 'review_call') return <IconCheck size={18} />;
    
    // Report actions
    if (action === 'publish_report') return <IconReportAnalytics size={18} />;
    if (action === 'generate_report') return <IconFileText size={18} />;
    if (action === 'delete_report') return <IconTrash size={18} />;
    
    // User actions
    if (action === 'user_created') return <IconUserPlus size={18} />;
    if (action === 'user_deleted') return <IconUserMinus size={18} />;
    
    // Followup actions
    if (action === 'create_followup') return <IconMessagePlus size={18} />;
    if (action === 'delete_followup') return <IconMessageMinus size={18} />;
    if (action === 'update_followup') return <IconEdit size={18} />;
    
    return <IconRefresh size={18} />;
  };

  const getActionColor = (action) => {
    // Call actions - Blue
    if (action === 'upload_call') return '#1976d2';
    if (action === 'delete_call') return '#d32f2f';
    if (action === 'call_processing') return '#ed6c02';
    if (action === 'call_status_change') return '#9c27b0';
    if (action === 'review_call') return '#2e7d32';
    
    // Report actions - Purple
    if (action === 'publish_report') return '#7b1fa2';
    if (action === 'generate_report') return '#6a1b9a';
    if (action === 'delete_report') return '#c62828';
    
    // User actions - Teal
    if (action === 'user_created') return '#00897b';
    if (action === 'user_deleted') return '#d32f2f';
    
    // Followup actions - Orange
    if (action === 'create_followup') return '#2e7d32';
    if (action === 'delete_followup') return '#d32f2f';
    if (action === 'update_followup') return '#ed6c02';
    
    // Default - Grey
    return '#757575';
  };

  const getActionLabel = (action) => {
    const labels = {
      // Call actions
      'upload_call': 'Uploaded a call',
      'delete_call': 'Deleted a call',
      'call_processing': 'Started processing call',
      'call_status_change': 'Call status changed',
      'review_call': 'Reviewed a call',
      
      // Report actions
      'publish_report': 'Published a report',
      'generate_report': 'Generated a report',
      'delete_report': 'Deleted a report',
      
      // User actions
      'user_created': 'User was created',
      'user_deleted': 'User was deleted',
      
      // Followup actions
      'create_followup': 'Created a followup',
      'delete_followup': 'Deleted a followup',
      'update_followup': 'Updated a followup',
    };
    return labels[action] || action.replace(/_/g, ' ');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Box>
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
            System Logs
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={4}>
              {logs.map((log, index) => {
                const actionColor = getActionColor(log.action);
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
                        bgcolor: `${actionColor}20`, // لون فاتح (20% opacity)
                        width: 46,
                        height: 46
                      }}
                    >
                      <Box sx={{ color: actionColor }}> {/* اللون الغامق للأيقونة */}
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
                            bgcolor: `${actionColor}15`,
                            color: actionColor,
                            borderColor: `${actionColor}30`,
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
        </CardContent>
      </Card>
    </Box>
  );
}