import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

// assets
import { IconChevronRight } from '@tabler/icons-react';

const SearchList = ({ results, onItemClick }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleSelect = (item) => {
    if (item.url) {
      navigate(item.url);
    }
    onItemClick();
  };

  if (results.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 0.5 }}>
          No results found
        </Typography>
        <Typography variant="caption" color="textSecondary">
          Try searching for pages, calls, or users
        </Typography>
      </Box>
    );
  }

  return (
    <List
      sx={{
        width: '100%',
        py: 0.5,
        maxHeight: 450,
        overflow: 'auto',
        '& .MuiListItemButton-root': {
          py: 1,
          px: 2,
          mx: 1,
          borderRadius: 1.5,
          mb: 0.5,
          '&:hover': {
            bgcolor: theme.vars.palette.primary.light + '40'
          }
        }
      }}
    >
      {results.map((item, index) => (
        <ListItemButton key={index} onClick={() => handleSelect(item)}>
          <ListItemIcon sx={{ minWidth: 36, color: theme.vars.palette.primary.main }}>
            {item.icon ? <item.icon stroke={1.5} size="20px" /> : <IconChevronRight size="18px" />}
          </ListItemIcon>
          <ListItemText
            primary={
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {item.title}
                </Typography>
                {item.type && (
                  <Chip
                    label={item.type}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      bgcolor: theme.vars.palette.primary.light,
                      color: theme.vars.palette.primary.main,
                      border: 'none'
                    }}
                  />
                )}
              </Stack>
            }
            secondary={
              item.description && (
                <Typography
                  variant="caption"
                  color="textSecondary"
                  sx={{
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%'
                  }}
                >
                  {item.description}
                </Typography>
              )
            }
          />
          <Box sx={{ textAlign: 'right', ml: 1 }}>
            <Typography
              variant="caption"
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: 1,
                bgcolor: theme.vars.palette.divider,
                color: 'text.secondary',
                fontSize: '0.65rem',
                fontWeight: 600,
                textTransform: 'uppercase'
              }}
            >
              {item.category}
            </Typography>
          </Box>
        </ListItemButton>
      ))}
    </List>
  );
};

SearchList.propTypes = {
  results: PropTypes.array.isRequired,
  onItemClick: PropTypes.func.isRequired
};

export default SearchList;
