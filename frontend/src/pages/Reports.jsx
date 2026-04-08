import { Card, CardContent, Typography } from '@mui/material';

export default function Reports() {
  return (
    <Card>
      <CardContent>
        <Typography variant="h4" gutterBottom>
          Reports
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Reports will be generated here
        </Typography>
      </CardContent>
    </Card>
  );
}
