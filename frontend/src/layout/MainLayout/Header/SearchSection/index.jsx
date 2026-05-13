import PropTypes from 'prop-types';
import { useState, useEffect, useRef, useMemo } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import Popper from '@mui/material/Popper';
import Box from '@mui/material/Box';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Paper from '@mui/material/Paper';

// third party
import PopupState, { bindPopper, bindToggle } from 'material-ui-popup-state';

// project imports
import Transitions from 'ui-component/extended/Transitions';
import useSearchStore from 'hooks/useSearchStore';
import useCallsStore from 'hooks/useCallsStore';
import useUsersStore from 'hooks/useUsersStore';
import menuItems from 'menu-items';
import SearchList from './SearchList';

// assets
import { IconAdjustmentsHorizontal, IconSearch, IconX, IconCommand } from '@tabler/icons-react';

function HeaderAvatar({ children, ref, ...others }) {
  const theme = useTheme();

  return (
    <Avatar
      ref={ref}
      variant="rounded"
      sx={{
        ...theme.typography.commonAvatar,
        ...theme.typography.mediumAvatar,
        color: theme.vars.palette.primary.dark,
        background: theme.vars.palette.primary.light,
        '&:hover': {
          color: theme.vars.palette.primary.light,
          background: theme.vars.palette.primary.dark
        }
      }}
      {...others}
    >
      {children}
    </Avatar>
  );
}

// ==============================|| SEARCH INPUT - MOBILE ||============================== //

function MobileSearch({ value, setValue, popupState }) {
  const theme = useTheme();

  return (
    <OutlinedInput
      id="input-search-header"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Search"
      startAdornment={
        <InputAdornment position="start">
          <IconSearch stroke={1.5} size="16px" />
        </InputAdornment>
      }
      endAdornment={
        <InputAdornment position="end">
          <HeaderAvatar>
            <IconAdjustmentsHorizontal stroke={1.5} size="20px" />
          </HeaderAvatar>

          <Box sx={{ ml: 2 }}>
            <Avatar
              variant="rounded"
              sx={{
                ...theme.typography.commonAvatar,
                ...theme.typography.mediumAvatar,
                bgcolor: 'orange.light',
                color: 'orange.dark',
                '&:hover': {
                  bgcolor: 'orange.dark',
                  color: 'orange.light'
                }
              }}
              {...bindToggle(popupState)}
            >
              <IconX stroke={1.5} size="20px" />
            </Avatar>
          </Box>
        </InputAdornment>
      }
      aria-describedby="search-helper-text"
      slotProps={{
        input: {
          'aria-label': 'search',
          sx: {
            bgcolor: 'transparent',
            pl: 0.5
          }
        }
      }}
      sx={{
        width: '100%',
        ml: 0.5,
        px: 2,
        bgcolor: 'background.paper'
      }}
    />
  );
}

// ==============================|| SEARCH INPUT ||============================== //

export default function SearchSection() {
  const theme = useTheme();
  const { search, setSearch, results, setResults, isOpen, setIsOpen } = useSearchStore();
  const { calls } = useCallsStore();
  const { users } = useUsersStore();
  const anchorRef = useRef(null);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        document.getElementById('input-search-header')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search logic
  useEffect(() => {
    if (!search) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const searchLower = search.toLowerCase();
    const newResults = [];

    // 1. Search Menu Items
    if (Array.isArray(menuItems.items)) {
      menuItems.items.forEach((group) => {
        if (Array.isArray(group.children)) {
          group.children.forEach((item) => {
            if (item.title.toLowerCase().includes(searchLower)) {
              newResults.push({
                title: item.title,
                url: item.url,
                icon: item.icon,
                category: 'Page',
                type: 'navigation'
              });
            }
          });
        }
      });
    }

    // 2. Search Calls
    if (Array.isArray(calls)) {
      calls.forEach((call) => {
        if (
          (call.id && call.id.toLowerCase().includes(searchLower)) ||
          (call.issue && call.issue.toLowerCase().includes(searchLower)) ||
          (call.transcript && call.transcript.toLowerCase().includes(searchLower)) ||
          (call.keywords && call.keywords.toLowerCase().includes(searchLower))
        ) {
          newResults.push({
            title: `Call ${call.id}`,
            description: call.issue,
            url: `/calls`,
            category: 'Call',
            type: call.status
          });
        }
      });
    }

    // 3. Search Users
    if (Array.isArray(users)) {
      users.forEach((user) => {
        if (
          (user.username && user.username.toLowerCase().includes(searchLower)) ||
          (user.email && user.email.toLowerCase().includes(searchLower))
        ) {
          newResults.push({
            title: user.username,
            description: user.email,
            url: `/users`,
            category: 'User',
            type: user.role
          });
        }
      });
    }

    setResults(newResults.slice(0, 10)); // Limit results
    setIsOpen(true);
  }, [search, calls, users, setResults, setIsOpen]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSelect = () => {
    setIsOpen(false);
    setSearch('');
  };

  return (
    <>
      {/* Mobile */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <PopupState variant="popper" popupId="demo-popup-popper">
          {(popupState) => (
            <>
              <Box sx={{ ml: 2 }}>
                <HeaderAvatar {...bindToggle(popupState)}>
                  <IconSearch stroke={1.5} size="19.2px" />
                </HeaderAvatar>
              </Box>

              <Popper
                {...bindPopper(popupState)}
                transition
                sx={{
                  zIndex: 1100,
                  width: '99%',
                  top: '-55px !important',
                  px: { xs: 1.25, sm: 1.5 }
                }}
              >
                {({ TransitionProps }) => (
                  <Transitions
                    type="zoom"
                    {...TransitionProps}
                    sx={{ transformOrigin: 'center left' }}
                  >
                    <Card
                      sx={{
                        bgcolor: 'background.default',
                        border: 0,
                        boxShadow: 'none'
                      }}
                    >
                      <Box sx={{ p: 2 }}>
                        <Grid
                          container
                          sx={{
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <Grid size="grow">
                            <MobileSearch
                              value={search}
                              setValue={setSearch}
                              popupState={popupState}
                            />
                          </Grid>
                        </Grid>
                        {search && (
                          <Box sx={{ mt: 2, bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden' }}>
                            <SearchList
                              results={results}
                              onItemClick={() => {
                                handleSelect();
                                popupState.close();
                              }}
                            />
                          </Box>
                        )}
                      </Box>
                    </Card>
                  </Transitions>
                )}
              </Popper>
            </>
          )}
        </PopupState>
      </Box>

      {/* Desktop */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }} ref={anchorRef}>
        <OutlinedInput
          id="input-search-header"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => search && setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handleClose();
              e.target.blur();
            }
          }}
          placeholder="Search..."
          startAdornment={
            <InputAdornment position="start">
              <IconSearch stroke={1.5} size="16px" />
            </InputAdornment>
          }
          endAdornment={
            <InputAdornment position="end">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
             
                <HeaderAvatar>
                  <IconAdjustmentsHorizontal stroke={1.5} size="20px" />
                </HeaderAvatar>
              </Box>
            </InputAdornment>
          }
          aria-describedby="search-helper-text"
          slotProps={{
            input: {
              'aria-label': 'search',
              sx: {
                bgcolor: 'transparent',
                pl: 0.5
              }
            }
          }}
          sx={{
            width: { md: 250, lg: 434 },
            ml: 2,
            px: 2,
             height: 48,
  borderRadius: '16px',
  bgcolor: '#fff',
   '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: '#90caf9'
  },

  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#1e88e5',
    borderWidth: '2px'
  },
  '& input': {
    fontSize: '0.95rem',
    fontWeight: 500
  }
          }}
        />

        <Popper
          open={isOpen}
          anchorEl={anchorRef.current}
          placement="bottom-start"
          transition
          disablePortal
          sx={{
            zIndex: 1200,
            width: { md: 250, lg: 434 },
            mt: '12px !important'
          }}
        >
          {({ TransitionProps }) => (
            <Transitions type="zoom" {...TransitionProps}>
              <Paper
                sx={{
                  boxShadow: theme.vars.customShadows.z1,
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: `1px solid ${theme.vars.palette.divider}`
                }}
              >
                <ClickAwayListener onClickAway={handleClose}>
                  <Box>
                    <SearchList results={results} onItemClick={handleSelect} />
                  </Box>
                </ClickAwayListener>
              </Paper>
            </Transitions>
          )}
        </Popper>
      </Box>
    </>
  );
}

HeaderAvatar.propTypes = {
  children: PropTypes.node,
  ref: PropTypes.any,
  others: PropTypes.any
};

MobileSearch.propTypes = {
  value: PropTypes.string,
  setValue: PropTypes.func,
  popupState: PropTypes.any
};