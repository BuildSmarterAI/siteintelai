import Joyride, { CallBackProps, Step, STATUS } from "react-joyride";
import { baseTourStyles, tourLocale, markTourCompleted } from '@/lib/tourStyles';

interface ReportTourProps {
  run: boolean;
  onComplete: () => void;
}

export function ReportTour({ run, onComplete }: ReportTourProps) {
  const steps: Step[] = [
    {
      target: '[data-tour="score-circle"]',
      content: 'This is your overall feasibility score (0-100). Higher scores indicate stronger development potential!',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour="zoning-section"]',
      content: 'Zoning analysis shows what you can build on this site. Click any data badge to see the official source.',
      placement: 'right',
    },
    {
      target: '[data-tour="flood-section"]',
      content: 'FEMA flood risk analysis with base flood elevation. Critical information for lenders and insurance.',
      placement: 'top',
    },
    {
      target: '[data-tour="utilities-section"]',
      content: 'Infrastructure availability including water, sewer, power, and fiber internet.',
      placement: 'left',
    },
    {
      target: '[data-tour="download-button"]',
      content: 'Download a lender-ready PDF with all citations and data sources included.',
      placement: 'left',
    },
    {
      target: '[data-tour="data-sources-sidebar"]',
      content: 'Every fact in your report is cited. Click any badge throughout the report to verify the source.',
      placement: 'left',
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as typeof STATUS.FINISHED | typeof STATUS.SKIPPED)) {
      markTourCompleted('report');
      onComplete();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={baseTourStyles}
      locale={tourLocale}
    />
  );
}
