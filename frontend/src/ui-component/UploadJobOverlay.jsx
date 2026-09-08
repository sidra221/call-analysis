import { useEffect, useState } from 'react';
import {
  Backdrop, Box, Button, Card, LinearProgress, Paper, Stack, Typography
} from '@mui/material';
import { IconArrowLeft, IconArrowRight, IconCheck } from '@tabler/icons-react';
import useCallsStore from 'hooks/useCallsStore';
import useTranslation from 'hooks/useTranslation';
import AiWorkingAnimation from 'ui-component/AiWorkingAnimation';

import { VOCALYS_CYAN, VOCALYS_CYAN_DARK } from 'constants/brand';

const AI_STEP_KEYS = [
  'calls.aiStepTranscribing',
  'calls.aiStepSpeakers',
  'calls.aiStepSentiment',
  'calls.aiStepIssues'
];

export default function UploadJobOverlay() {
  const { t, isAr } = useTranslation();
  const { uploadJob, continueWorking } = useCallsStore();
  const [stepIndex, setStepIndex] = useState(0);

  const isAnalyzing = uploadJob.phase === 'analyzing';

  useEffect(() => {
    if (!uploadJob.active || uploadJob.phase === 'done') return undefined;
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % AI_STEP_KEYS.length);
    }, 2200);
    return () => clearInterval(timer);
  }, [uploadJob.active, uploadJob.phase]);

  if (!uploadJob.active) return null;

  const isDone = uploadJob.phase === 'done';
  const progressLabel = isDone
    ? t('calls.uploadComplete')
    : isAnalyzing
      ? (uploadJob.total > 1
        ? t('calls.analyzingCount', { current: uploadJob.current, total: uploadJob.total })
        : t('calls.aiWorking'))
      : (uploadJob.label || t('calls.processing'));
  const stepLabel = isDone
    ? t('calls.uploadComplete')
    : t(isAnalyzing ? AI_STEP_KEYS[stepIndex] : 'calls.aiStepUploading');

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
        <Card sx={{ p: 4, boxShadow: 24, width: 420, textAlign: 'center' }}>
          <Stack spacing={2.5} alignItems="center">
            {!isDone ? (
              <>
                <AiWorkingAnimation />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.75 }}>
                    {progressLabel}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ minHeight: 24 }}>
                    {stepLabel}
                  </Typography>
                </Box>
                <Box sx={{ width: '100%' }}>
                  <LinearProgress
                    variant="determinate"
                    value={uploadJob.progress}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: `${VOCALYS_CYAN}22`,
                      '& .MuiLinearProgress-bar': { bgcolor: VOCALYS_CYAN, borderRadius: 4 }
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
                    {`${Math.round(uploadJob.progress)}%`}
                  </Typography>
                </Box>
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
            <AiWorkingAnimation compact />
          )}
          <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
            {isDone ? t('calls.uploadComplete') : (stepLabel || progressLabel || t('calls.uploadInBackground'))}
          </Typography>
        </Paper>
      )}
    </>
  );
}
