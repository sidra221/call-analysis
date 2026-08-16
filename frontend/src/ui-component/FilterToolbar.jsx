import PropTypes from 'prop-types';
import { Badge, Button, Grid } from '@mui/material';
import { IconAdjustmentsHorizontal, IconRefresh } from '@tabler/icons-react';
import SearchField from './SearchField';
import useTranslation from 'hooks/useTranslation';

export default function FilterToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  searchLoading,
  onSearchClear,
  activeFilterCount = 0,
  onOpenFilters,
  onResetFilters,
  showReset,
  actions,
  searchGridSize = { xs: 12, md: 4 }
}) {
  const { t } = useTranslation();
  const shouldShowReset = showReset ?? activeFilterCount > 0;
  return (
    <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
      <Grid size={searchGridSize}>
        <SearchField
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder || t('common.search')}
          loading={searchLoading}
          onClear={onSearchClear}
        />
      </Grid>

      <Grid size={{ xs: 6, md: 'auto' }}>
        <Badge badgeContent={activeFilterCount} color="primary">
          <Button
            variant="outlined"
            startIcon={<IconAdjustmentsHorizontal size={18} />}
            onClick={onOpenFilters}
            sx={{
              borderColor: activeFilterCount > 0 ? 'primary.main' : 'divider',
              bgcolor: activeFilterCount > 0 ? 'primary.light' : 'transparent'
            }}
          >
            {t('common.filters')}
          </Button>
        </Badge>
      </Grid>

      {shouldShowReset && (
        <Grid size={{ xs: 6, md: 'auto' }}>
          <Button
            variant="text"
            color="error"
            startIcon={<IconRefresh size={18} />}
            onClick={onResetFilters}
          >
            {t('common.resetAll')}
          </Button>
        </Grid>
      )}

      {actions && (
        <Grid size={{ xs: 12, md: 'auto' }} sx={{ ml: 'auto', display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          {actions}
        </Grid>
      )}
    </Grid>
  );
}

FilterToolbar.propTypes = {
  search: PropTypes.string,
  onSearchChange: PropTypes.func.isRequired,
  searchPlaceholder: PropTypes.string,
  searchLoading: PropTypes.bool,
  onSearchClear: PropTypes.func,
  activeFilterCount: PropTypes.number,
  onOpenFilters: PropTypes.func.isRequired,
  onResetFilters: PropTypes.func,
  showReset: PropTypes.bool,
  actions: PropTypes.node,
  searchGridSize: PropTypes.object
};
