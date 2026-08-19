import {
  Backdrop, Box, Button, Card, CircularProgress, Paper, Stack, Typography
} from '@mui/material';
import { IconArrowLeft, IconArrowRight, IconCheck } from '@tabler/icons-react';
import useCallsStore from 'hooks/useCallsStore';
import useTranslation from 'hooks/useTranslation';

import { VOCALYS_CYAN, VOCALYS_CYAN_DARK } from 'constants/brand';

export default function UploadJobOverlay() {
  const { t, isAr } = useTranslation();
  const { uploadJob, continueWorking } = useCallsStore();

  if (!uploadJob.active) return null;

  const isDone = uploadJob.phase === 'done';
  const progressLabel = isDone
    ? t('calls.uploadComplete')
    : uploadJob.phase === 'analyzing'
      ? (uploadJob.total > 1
        ? t('calls.analyzingCount', { current: uploadJob.current, total: uploadJob.total })
        : t('calls.processing'))
      : (uploadJob.label || t('calls.processing'));

  return (
    <>
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.modal + 1,
          flexDirection: 'column',
          backdropFilter: 'blur(4px)'
        }}
        open={uploadJob.overlayVisible}
      >
        <Card sx={{ p: 4, boxShadow: 24, width: 400, textAlign: 'center' }}>
          <Stack spacing={3} alignItems="center">
            {!isDone ? (
              <>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress
                    variant="determinate"
                    value={uploadJob.progress}
                    size={80}
                    thickness={4}
                    sx={{ color: VOCALYS_CYAN }}
                  />
                  <Box sx={{
                    top: 0, left: 0, bottom: 0, right: 0, position: 'absolute',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                      {`${Math.round(uploadJob.progress)}%`}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {progressLabel}
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={isAr ? <IconArrowLeft size={18} /> : <IconArrowRight size={18} />}
                  onClick={continueWorking}
                  sx={{
                    bgcolor: VOCALYS_CYAN,
                    '&:hover': { bgcolor: VOCALYS_CYAN_DARK }
                  }}
                >
                  {t('calls.uploadContinue')}
                </Button>
              </>
            ) : (
              <>
                <Box sx={{
                  width: 90, height: 90, borderRadius: '50%', bgcolor: VOCALYS_CYAN,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <IconCheck size={50} stroke={3} color="#fff" />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: VOCALYS_CYAN }}>
                  {t('calls.uploadComplete')}
                </Typography>
              </>
            )}
          </Stack>
        </Card>
      </Backdrop>

      {!uploadJob.overlayVisible && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: (theme) => theme.zIndex.snackbar,
            px: 2,
            py: 1.25,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            borderRadius: 2,
            minWidth: 280
          }}
        >
          {isDone ? (
            <IconCheck size={22} color={VOCALYS_CYAN} />
          ) : (
            <CircularProgress size={22} sx={{ color: VOCALYS_CYAN }} />
          )}
          <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
            {isDone ? t('calls.uploadComplete') : (progressLabel || t('calls.uploadInBackground'))}
          </Typography>
        </Paper>
      )}
    </>
  );
}
