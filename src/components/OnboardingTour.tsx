import Joyride, { Step, CallBackProps, STATUS, ACTIONS } from 'react-joyride';
import { useState } from 'react';
import { baseTourStyles, tourLocale, markTourCompleted } from '@/lib/tourStyles';

interface OnboardingTourProps {
  tourName: 'dashboard' | 'application';
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
      markTourCompleted(tourName);
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
      locale={tourLocale}
      styles={baseTourStyles}
    />
  );
};
