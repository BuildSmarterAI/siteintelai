import Joyride, { Step } from 'react-joyride';

const buySteps: Step[] = [
  {
    target: '.quickcheck-widget',
    content: 'Evaluate any investment property in 10 seconds — free, no login.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.market-value-insight',
    content: 'See instant market value ranges from county appraisal data.',
    placement: 'top',
  },
  {
    target: '.flood-insurance-insight',
    content: 'Estimate annual flood insurance costs — critical for ROI calculations.',
    placement: 'top',
  },
  {
    target: '.unlock-cta',
    content: 'Get a full investor-grade report with ROI analysis, risk factors, and market demographics.',
    placement: 'top',
  },
];

interface BuyPathTourProps {
  run: boolean;
  onFinish?: () => void;
}

export function BuyPathTour({ run, onFinish }: BuyPathTourProps) {
  return (
    <Joyride
      steps={buySteps}
      run={run}
      continuous
      showSkipButton
      showProgress
      callback={(data) => {
        if (data.status === 'finished' || data.status === 'skipped') {
          onFinish?.();
        }
      }}
      styles={{
        options: {
          primaryColor: 'hsl(191 91% 43%)', // Buy path cyan
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '12px',
        },
        buttonNext: {
          backgroundColor: 'hsl(191 91% 43%)', // Data cyan
        },
      }}
    />
  );
}
