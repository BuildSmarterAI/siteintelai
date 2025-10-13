import Joyride, { CallBackProps, Step, STATUS } from "react-joyride";

interface ReportTourProps {
  run: boolean;
  onComplete: () => void;
}

export function ReportTour({ run, onComplete }: ReportTourProps) {
  const steps: Step[] = [
    {
      target: '.score-circle',
      content: 'This is your overall feasibility score (0-100). Higher scores indicate stronger development potential!',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '.zoning-section',
      content: 'Zoning analysis shows what you can build on this site. Click any data badge to see the official source.',
      placement: 'right',
    },
    {
      target: '.flood-section',
      content: 'FEMA flood risk analysis with base flood elevation. Critical information for lenders and insurance.',
      placement: 'top',
    },
    {
      target: '.utilities-section',
      content: 'Infrastructure availability including water, sewer, power, and fiber internet.',
      placement: 'left',
    },
    {
      target: '.download-button',
      content: 'Download a lender-ready PDF with all citations and data sources included.',
      placement: 'left',
    },
    {
      target: '.data-sources-sidebar',
      content: 'Every fact in your report is cited. Click any badge throughout the report to verify the source.',
      placement: 'left',
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as typeof STATUS.FINISHED | typeof STATUS.SKIPPED)) {
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
      styles={{
        options: {
          primaryColor: '#FF7A00',
          zIndex: 10000,
        },
        buttonNext: {
          backgroundColor: '#FF7A00',
        },
        buttonBack: {
          color: '#FF7A00',
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
}
