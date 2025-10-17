import Joyride, { Step, CallBackProps, STATUS, ACTIONS } from 'react-joyride';
import { useState } from 'react';

interface OnboardingTourProps {
  tourName: 'dashboard' | 'report' | 'application';
  run: boolean;
  onComplete: () => void;
}

const tourSteps: Record<string, Step[]> = {
  dashboard: [
    {
      target: 'body',
      content: 'Welcome to SiteIntel™! Let\'s take a quick tour of your dashboard.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="new-application"]',
      content: 'Click here to start a new feasibility application. Our AI will analyze your property in under 10 minutes.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="reports-list"]',
      content: 'All your completed reports appear here. Click any report to view detailed analysis.',
      placement: 'top',
    },
    {
      target: '[data-tour="subscription-status"]',
      content: 'Upgrade to Pro for unlimited reports, portfolio analytics, and priority support.',
      placement: 'left',
    },
  ],
  report: [
    {
      target: 'body',
      content: 'Your feasibility report is ready! Let\'s explore the key sections.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="score-circle"]',
      content: 'Your feasibility score (0-100). Higher scores indicate better development potential.',
      placement: 'right',
    },
    {
      target: '[data-tour="zoning-section"]',
      content: 'Detailed zoning analysis with all data cited from official sources.',
      placement: 'top',
    },
    {
      target: '[data-tour="download-pdf"]',
      content: 'Download a lender-ready PDF with all citations and appendices included.',
      placement: 'left',
    },
  ],
  application: [
    {
      target: '[data-tour="intent-step"]',
      content: 'First, tell us your goal: Are you building or buying?',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour="progress-indicator"]',
      content: 'Track your progress through 6 simple steps. You can save and resume anytime.',
      placement: 'bottom',
    },
  ],
};

export const OnboardingTour = ({ tourName, run, onComplete }: OnboardingTourProps) => {
  const [stepIndex, setStepIndex] = useState(0);

  const handleCallback = (data: CallBackProps) => {
    const { status, action, index } = data;
    
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem(`tour_completed_${tourName}`, 'true');
      onComplete();
    }
    
    if (action === ACTIONS.NEXT) {
      setStepIndex(index + 1);
    } else if (action === ACTIONS.PREV) {
      setStepIndex(index - 1);
    }
  };

  return (
    <Joyride
      steps={tourSteps[tourName]}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      callback={handleCallback}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
      styles={{
        options: {
          primaryColor: '#FF7A00',
          zIndex: 10000,
          arrowColor: '#fff',
        },
        buttonNext: {
          backgroundColor: '#FF7A00',
          borderRadius: '8px',
          fontSize: '14px',
          padding: '10px 20px',
        },
        buttonBack: {
          color: '#0A0F2C',
          marginRight: '10px',
        },
        buttonSkip: {
          color: '#9ca3af',
        },
        tooltip: {
          borderRadius: '12px',
          padding: '20px',
          fontSize: '14px',
        },
        tooltipContent: {
          padding: '10px 0',
        },
      }}
    />
  );
};
