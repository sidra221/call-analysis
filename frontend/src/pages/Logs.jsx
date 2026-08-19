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
  IconLoader2,
  IconCheck,
  IconTrash,
  IconFileText,
  IconFileX,
  IconUserMinus,
  IconUserEdit,
  IconClock,
  IconEdit,
  IconMessagePlus,
  IconMessageMinus,
  IconSwitchHorizontal,
  IconHistory
} from '@tabler/icons-react';

import { useCallback, useEffect, useMemo, useState } from 'react';
import useTranslation from 'hooks/useTranslation';
import usePaginationLabels from 'hooks/usePaginationLabels';
import { logsApi } from 'api/api';
import PageCard from 'ui-component/PageCard';
import PageTitle from 'ui-component/PageTitle';
import FilterToolbar from 'ui-component/FilterToolbar';
import FilterPopover from 'ui-component/FilterPopover';
import { getActionColor, resolveThemeColor } from 'constants/colors';

const rowsPerPage = 6;

const LOG_ACTION_VALUES = [
  'all',
  'upload_call',
  'delete_call',
  'call_processing',
  'call_status_change',
  'review_call',
  'generate_report',
  'publish_report',
  'delete_report',
  'user_created',
  'user_updated',
  'user_deleted',
  'create_followup',
  'delete_followup',
  'update_followup',
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
  const { t, locale } = useTranslation();
  const paginationLabels = usePaginationLabels();

  const actionOptions = useMemo(
    () => LOG_ACTION_VALUES.map((value) => ({
      value,
      label: t(`logActions.${value}`),
    })),
    [t]
  );

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
      setError(err.message || t('logs.loadFailed'));
      setAllLogs([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

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
    if (action === 'call_processing') return <IconLoader2 size={18} />;
    if (action === 'call_status_change') return <IconSwitchHorizontal size={18} />;
    if (action === 'review_call') return <IconCheck size={18} />;
    if (action === 'publish_report') return <IconReportAnalytics size={18} />;
    if (action === 'generate_report') return <IconFileText size={18} />;
    if (action === 'delete_report') return <IconFileX size={18} />;
    if (action === 'user_created') return <IconUserPlus size={18} />;
    if (action === 'user_updated') return <IconUserEdit size={18} />;
    if (action === 'user_deleted') return <IconUserMinus size={18} />;
    if (action === 'create_followup') return <IconMessagePlus size={18} />;
    if (action === 'delete_followup') return <IconMessageMinus size={18} />;
    if (action === 'update_followup') return <IconEdit size={18} />;
    return <IconHistory size={18} />;
  };

  const getActionLabel = (action) => {
    const key = `activity.${action}`;
    const translated = t(key);
    return translated === key ? action.replace(/_/g, ' ') : translated;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString(locale);
  };

  return (
    <PageCard>
      <PageTitle title={t('logs.title')} />

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
        searchPlaceholder={t('logs.searchPlaceholder')}
        activeFilterCount={activeFilterCount}
        onOpenFilters={openFilters}
        onResetFilters={handleResetFilters}
        showReset={hasFilters}
      />

      {hasFilters && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2, maxWidth: '100%' }}>
          {searchQuery && (
            <Chip
              label={`${t('logs.searchLabel')}: ${searchQuery}`}
              size="small"
              onDelete={() => { setSearchQuery(''); setPage(0); }}
            />
          )}
          {actionFilter !== 'all' && (
            <Chip
              label={`${t('logs.action')}: ${actionOptions.find((o) => o.value === actionFilter)?.label || actionFilter}`}
              size="small"
              onDelete={() => { setActionFilter('all'); setDraftAction('all'); setPage(0); }}
            />
          )}
          {usernameFilter && (
            <Chip
              label={`${t('logs.user')}: ${usernameFilter}`}
              size="small"
              sx={{ maxWidth: '100%' }}
              onDelete={() => { setUsernameFilter(''); setDraftUsername(''); setPage(0); }}
            />
          )}
          {dateFilter && (
            <Chip
              label={`${t('common.date')}: ${dateFilter}`}
              size="small"
              onDelete={() => { setDateFilter(''); setDraftDate(''); setPage(0); }}
            />
          )}
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
            {t(filteredLogs.length === 1 ? 'logs.resultsCount' : 'logs.resultsCountPlural', { count: filteredLogs.length })}
          </Typography>
        </Stack>
      )}

      <FilterPopover
        open={Boolean(filterAnchorEl)}
        anchorEl={filterAnchorEl}
        onClose={closeFilters}
        onApply={applyDraftFilters}
        title={t('logs.filterTitle')}
        width={320}
      >
        <FormControl fullWidth size="small">
          <InputLabel>{t('logs.action')}</InputLabel>
          <Select
            value={draftAction}
            label={t('logs.action')}
            onChange={(e) => setDraftAction(e.target.value)}
            MenuProps={{
              disablePortal: false,
              PaperProps: { sx: { maxWidth: 320 } }
            }}
          >
            {actionOptions.map((option) => (
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
              label={t('users.username')}
              size="small"
              placeholder={t('logs.searchUserPlaceholder')}
            />
          )}
          renderOption={(props, option) => {
            const { key, ...optionProps } = props;
            return (
              <li key={key} {...optionProps}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, maxWidth: '100%' }}>
                  <Avatar sx={{ width: 24, height: 24, fontSize: 12, flexShrink: 0 }}>
                    {option?.[0]?.toUpperCase()}
                  </Avatar>
                  <Typography noWrap>{option}</Typography>
                </Stack>
              </li>
            );
          }}
          slotProps={{
            popper: {
              sx: { zIndex: 1400, minWidth: '280px', maxWidth: 'min(360px, calc(100vw - 24px))' },
              modifiers: [
                { name: 'flip', enabled: true },
                {
                  name: 'preventOverflow',
                  enabled: true,
                  options: { boundary: 'viewport', padding: 8 }
                }
              ]
            }
          }}
        />

        <TextField
          fullWidth
          size="small"
          label={t('common.date')}
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
                        insetInlineStart: 23,
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
                        label={t(`logActions.${log.action}`)}
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
                {hasFilters ? t('logs.noMatchFilters') : t('logs.noLogsYet')}
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
              {...paginationLabels}
            />
          </Box>
        </>
      )}
    </PageCard>
  );
}
