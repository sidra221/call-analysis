import { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';

export default function UploadCall() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploaded, setUploaded] = useState(false);

  const onFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setUploaded(false);
  };

  const onUpload = () => {
    if (!selectedFile) return;
    setUploaded(true);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h4" gutterBottom>
          Upload Call
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Upload audio files for call analysis workflow
        </Typography>

        <Stack spacing={2}>
          <Button variant="outlined" component="label">
            Select Audio File
            <input type="file" accept="audio/*" hidden onChange={onFileChange} />
          </Button>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Selected file
            </Typography>
            <Typography variant="body1">{selectedFile ? selectedFile.name : 'No file selected'}</Typography>
          </Box>

          <Box>
            <Button variant="contained" onClick={onUpload} disabled={!selectedFile}>
              Upload
            </Button>
          </Box>

          {uploaded && <Alert severity="success">File uploaded successfully (mock).</Alert>}
        </Stack>
      </CardContent>
    </Card>
  );
}
