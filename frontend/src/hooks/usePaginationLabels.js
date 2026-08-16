import useTranslation from 'hooks/useTranslation';

export default function usePaginationLabels() {
  const { t } = useTranslation();

  return {
    labelRowsPerPage: t('pagination.rowsPerPage'),
    labelDisplayedRows: ({ from, to, count }) =>
      count !== -1
        ? t('pagination.displayedRows', { from, to, count })
        : t('pagination.moreThan', { to })
  };
}
