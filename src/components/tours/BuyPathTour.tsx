import Joyride, { Step, STATUS } from 'react-joyride';
import { buyPathTourStyles, tourLocale, markTourCompleted } from '@/lib/tourStyles';

const buySteps: Step[] = [
  {
    target: '[data-tour="quickcheck-widget"]',
    content: 'Evaluate any investment property in 10 seconds — free, no login.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="market-value-insight"]',
    content: 'See instant market value ranges from county appraisal data.',
    placement: 'top',
  },
  {
    target: '[data-tour="flood-insurance-insight"]',
    content: 'Estimate annual flood insurance costs — critical for ROI calculations.',
    placement: 'top',
  },
  {
    target: '[data-tour="unlock-cta"]',
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
        if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
          markTourCompleted('buy_path');
          onFinish?.();
        }
      }}
      styles={buyPathTourStyles}
      locale={tourLocale}
    />
  );
}
