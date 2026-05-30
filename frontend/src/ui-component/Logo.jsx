import Box from '@mui/material/Box';
import logoImage from 'assets/images/logo.png';

export default function Logo() {
  return (
    <Box
      component="img"
      src={logoImage}
      alt="Call Analysis Logo"
      sx={{
        width: 200,
        height: 'auto',
        maxHeight: 45,
        objectFit: 'contain'
      }}
    />
  );
}