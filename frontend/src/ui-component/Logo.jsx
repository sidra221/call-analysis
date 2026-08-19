import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { brandLogoSrc } from 'constants/brand';

export default function Logo() {
  const theme = useTheme();

  return (
    <Box
      component="img"
      src={brandLogoSrc(theme)}
      alt="Vocalys"
      sx={{
        width: 220,
        height: 'auto',
        maxHeight: 48,
        objectFit: 'contain'
      }}
    />
  );
}
