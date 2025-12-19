import Joyride, { Step, STATUS } from 'react-joyride';
import { buildPathTourStyles, tourLocale, markTourCompleted } from '@/lib/tourStyles';

const buildSteps: Step[] = [
  {
    target: '[data-tour="quickcheck-widget"]',
    content: 'Start by analyzing any development site instantly — no account required.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="zoning-insight"]',
    content: 'See immediate zoning compatibility for your planned use.',
    placement: 'top',
  },
  {
    target: '[data-tour="utility-insight"]',
    content: 'Check water, sewer, and force main proximity — critical for construction timelines.',
    placement: 'top',
  },
  {
    target: '[data-tour="unlock-cta"]',
    content: 'Get a full lender-ready report with permit timelines, entitlement risk, and construction cost estimates.',
    placement: 'top',
  },
];

interface BuildPathTourProps {
  run: boolean;
  onFinish?: () => void;
}

export function BuildPathTour({ run, onFinish }: BuildPathTourProps) {
  return (
    <Joyride
      steps={buildSteps}
      run={run}
      continuous
      showSkipButton
      showProgress
      callback={(data) => {
        if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
          markTourCompleted('build_path');
          onFinish?.();
        }
      }}
      styles={buildPathTourStyles}
      locale={tourLocale}
    />
  );
}
