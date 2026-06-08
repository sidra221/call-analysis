import PropTypes from 'prop-types';
import { CircularProgress, IconButton, InputAdornment, TextField, useTheme } from '@mui/material';
import { IconSearch, IconX } from '@tabler/icons-react';

export default function SearchField({
  value,
  onChange,
  placeholder = 'Search...',
  loading = false,
  onClear,
  size = 'small',
  fullWidth = true
}) {
  const theme = useTheme();

  const handleClear = () => {
    if (onClear) {
      onClear();
      return;
    }
    onChange({ target: { value: '' } });
  };

  return (
    <TextField
      fullWidth={fullWidth}
      size={size}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <IconSearch size={18} color={theme.palette.text.secondary} />
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position="end">
            {loading ? (
              <CircularProgress size={16} />
            ) : value ? (
              <IconButton size="small" onClick={handleClear}>
                <IconX size={14} />
              </IconButton>
            ) : null}
          </InputAdornment>
        )
      }}
    />
  );
}

SearchField.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  loading: PropTypes.bool,
  onClear: PropTypes.func,
  size: PropTypes.string,
  fullWidth: PropTypes.bool
};
