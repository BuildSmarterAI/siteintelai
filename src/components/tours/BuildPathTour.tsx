import Joyride, { Step } from 'react-joyride';

const buildSteps: Step[] = [
  {
    target: '.quickcheck-widget',
    content: 'Start by analyzing any development site instantly — no account required.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.zoning-insight',
    content: 'See immediate zoning compatibility for your planned use.',
    placement: 'top',
  },
  {
    target: '.utility-insight',
    content: 'Check water, sewer, and force main proximity — critical for construction timelines.',
    placement: 'top',
  },
  {
    target: '.unlock-cta',
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
        if (data.status === 'finished' || data.status === 'skipped') {
          onFinish?.();
        }
      }}
      styles={{
        options: {
          primaryColor: 'hsl(226 63% 11%)', // Build path primary (midnight blue)
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '12px',
        },
        buttonNext: {
          backgroundColor: 'hsl(24 100% 50%)', // Feasibility orange
        },
      }}
    />
  );
}
