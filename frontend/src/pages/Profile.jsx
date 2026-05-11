import { Button, Card, CardContent, Grid, Typography } from '@mui/material';
import useAuth from 'hooks/useAuth';
import { Divider } from "@mui/material";
export default function Profile() {
  const { user } = useAuth();

  return (
    <Card>
      <CardContent>
        <Typography variant="h4" gutterBottom>
          Profile
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          View your account details
        </Typography>
        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Username
            </Typography>
            <Typography variant="h6">{user.username}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Email
            </Typography>
            <Typography variant="h6">{user.email}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Role
            </Typography>
            <Typography variant="h6">{user.role}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Button variant="outlined">Edit</Button>
          </Grid>
          
        </Grid>
      </CardContent>
    </Card>
  );
}
