import {
  Box,
  Typography,
  Stack,
  Avatar,
  Chip,
  CircularProgress,
  alpha,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  TablePagination,
  Autocomplete,
  Alert
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

import { useCallback, useEffect, useMemo, useState } from 'react';
import { logsApi } from 'api/api';
import PageCard from 'ui-component/PageCard';
import PageTitle from 'ui-component/PageTitle';
import FilterToolbar from 'ui-component/FilterToolbar';
import FilterPopover from 'ui-component/FilterPopover';
import { getActionColor, resolveThemeColor } from 'constants/colors';

const rowsPerPage = 6;

const ACTION_OPTIONS = [
  { value: 'all', label: 'All Actions' },
  { value: 'upload_call', label: 'Upload Call' },
  { value: 'delete_call', label: 'Delete Call' },
  { value: 'call_processing', label: 'Call Processing' },
  { value: 'call_status_change', label: 'Call Status Change' },
  { value: 'review_call', label: 'Review Call' },
  { value: 'generate_report', label: 'Generate Report' },
  { value: 'publish_report', label: 'Publish Report' },
  { value: 'delete_report', label: 'Delete Report' },
  { value: 'user_created', label: 'User Created' },
  { value: 'user_updated', label: 'User Updated' },
  { value: 'user_deleted', label: 'User Deleted' },
  { value: 'create_followup', label: 'Create Followup' },
  { value: 'delete_followup', label: 'Delete Followup' },
  { value: 'update_followup', label: 'Update Followup' },
];

const parseLogsResponse = (res) => {
  const results = res?.results || res?.data?.results || (Array.isArray(res?.data) ? res.data : []);
  const count = res?.count ?? res?.data?.count ?? results.length;
  return { results, count };
};

const fetchAllLogs = async () => {
  let all = [];
  let page = 1;
  let total = Infinity;

  while (all.length < total) {
    const res = await logsApi.list({ page, page_size: 100 });
    const { results, count } = parseLogsResponse(res);
    all = [...all, ...results];
    total = count;
    if (!results.length) break;
    page += 1;
  }

  return all;
};

export default function Logs() {
  const theme = useTheme();

  const [allLogs, setAllLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [usernameFilter, setUsernameFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const [draftAction, setDraftAction] = useState('all');
  const [draftUsername, setDraftUsername] = useState('');
  const [draftDate, setDraftDate] = useState('');

  const [filterAnchorEl, setFilterAnchorEl] = useState(null);

  const userOptions = useMemo(
    () => [...new Set(allLogs.map((log) => log.username).filter(Boolean))].sort(),
    [allLogs]
  );

  const openFilters = (event) => {
    setDraftAction(actionFilter);
    setDraftUsername(usernameFilter);
    setDraftDate(dateFilter);
    setFilterAnchorEl(event.currentTarget);
  };

  const closeFilters = () => setFilterAnchorEl(null);

  const applyDraftFilters = () => {
    setActionFilter(draftAction);
    setUsernameFilter(draftUsername.trim());
    setDateFilter(draftDate);
    setPage(0);
  };

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const logs = await fetchAllLogs();
      setAllLogs(logs);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load logs');
      setAllLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (actionFilter !== 'all') count++;
    if (usernameFilter) count++;
    if (dateFilter) count++;
    return count;
  }, [actionFilter, usernameFilter, dateFilter]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setActionFilter('all');
    setUsernameFilter('');
    setDateFilter('');
    setDraftAction('all');
    setDraftUsername('');
    setDraftDate('');
    setPage(0);
  };

  const filteredLogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allLogs.filter((log) => {
      const matchesAction = actionFilter === 'all' || log.action === actionFilter;

      const matchesUsername = !usernameFilter
        || (log.username || '').toLowerCase().includes(usernameFilter.toLowerCase());

      const logDate = log.created_at ? log.created_at.split('T')[0] : '';
      const matchesDate = !dateFilter || logDate === dateFilter;

      if (!query) {
        return matchesAction && matchesUsername && matchesDate;
      }

      const searchable = [
        log.username,
        log.description,
        log.action,
        log.action?.replace(/_/g, ' '),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = searchable.includes(query);
      return matchesAction && matchesUsername && matchesDate && matchesSearch;
    });
  }, [allLogs, searchQuery, actionFilter, usernameFilter, dateFilter]);

  const paginatedLogs = useMemo(
    () => filteredLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredLogs, page]
  );

  const hasFilters = searchQuery || activeFilterCount > 0;

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
      user_updated: 'User was updated',
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

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <FilterToolbar
        search={searchQuery}
        onSearchChange={(e) => {
          setSearchQuery(e.target.value);
          setPage(0);
        }}
        searchPlaceholder="Search by user, action, or description..."
        activeFilterCount={activeFilterCount}
        onOpenFilters={openFilters}
        onResetFilters={handleResetFilters}
        showReset={hasFilters}
      />

      {hasFilters && (
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
          {searchQuery && (
            <Chip
              label={`Search: ${searchQuery}`}
              size="small"
              onDelete={() => { setSearchQuery(''); setPage(0); }}
            />
          )}
          {actionFilter !== 'all' && (
            <Chip
              label={`Action: ${ACTION_OPTIONS.find((o) => o.value === actionFilter)?.label || actionFilter}`}
              size="small"
              onDelete={() => { setActionFilter('all'); setDraftAction('all'); setPage(0); }}
            />
          )}
          {usernameFilter && (
            <Chip
              label={`User: ${usernameFilter}`}
              size="small"
              onDelete={() => { setUsernameFilter(''); setDraftUsername(''); setPage(0); }}
            />
          )}
          {dateFilter && (
            <Chip
              label={`Date: ${dateFilter}`}
              size="small"
              onDelete={() => { setDateFilter(''); setDraftDate(''); setPage(0); }}
            />
          )}
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
            {filteredLogs.length} result{filteredLogs.length !== 1 ? 's' : ''}
          </Typography>
        </Stack>
      )}

      <FilterPopover
        open={Boolean(filterAnchorEl)}
        anchorEl={filterAnchorEl}
        onClose={closeFilters}
        onApply={applyDraftFilters}
        title="Filter Logs"
        width={320}
      >
        <FormControl fullWidth size="small">
          <InputLabel>Action</InputLabel>
          <Select
            value={draftAction}
            label="Action"
            onChange={(e) => setDraftAction(e.target.value)}
            MenuProps={{ disablePortal: true }}
          >
            {ACTION_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Autocomplete
          freeSolo
          options={userOptions}
          inputValue={draftUsername}
          onInputChange={(event, value) => setDraftUsername(value)}
          onChange={(event, value) => setDraftUsername(value || '')}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Username"
              size="small"
              placeholder="Type to search users..."
            />
          )}
          renderOption={(props, option) => {
            const { key, ...optionProps } = props;
            return (
              <li key={key} {...optionProps}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                    {option?.[0]?.toUpperCase()}
                  </Avatar>
                  <span>{option}</span>
                </Stack>
              </li>
            );
          }}
          slotProps={{
            popper: {
              disablePortal: true,
              sx: { zIndex: 1400 }
            }
          }}
        />

        <TextField
          fullWidth
          size="small"
          label="Date"
          type="date"
          value={draftDate}
          onChange={(e) => setDraftDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </FilterPopover>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Stack spacing={4}>
            {paginatedLogs.map((log, index) => {
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
                  {index !== paginatedLogs.length - 1 && (
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

            {paginatedLogs.length === 0 && (
              <Typography color="text.secondary" textAlign="center" py={4}>
                {hasFilters ? 'No logs match the selected filters.' : 'No logs yet'}
              </Typography>
            )}
          </Stack>

          <Box sx={{ mt: 1 }}>
            <TablePagination
              component="div"
              count={filteredLogs.length}
              page={page}
              onPageChange={(event, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[]}
            />
          </Box>
        </>
      )}
    </PageCard>
  );
}
