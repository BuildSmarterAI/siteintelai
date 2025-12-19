import { Styles, Locale } from 'react-joyride';

// Brand colors from design system
const FEASIBILITY_ORANGE = '#FF7A00';
const MIDNIGHT_BLUE = '#0A0F2C';
const DATA_CYAN = 'hsl(191, 91%, 43%)';

/**
 * Shared Joyride styles for consistent tour appearance across the app
 */
export const baseTourStyles: Partial<Styles> = {
  options: {
    primaryColor: FEASIBILITY_ORANGE,
    zIndex: 10000,
    arrowColor: '#fff',
    backgroundColor: '#fff',
    textColor: MIDNIGHT_BLUE,
    overlayColor: 'rgba(10, 15, 44, 0.5)',
  },
  buttonNext: {
    backgroundColor: FEASIBILITY_ORANGE,
    borderRadius: '8px',
    fontSize: '14px',
    padding: '10px 20px',
  },
  buttonBack: {
    color: MIDNIGHT_BLUE,
    marginRight: '10px',
  },
  buttonSkip: {
    color: '#9ca3af',
  },
  buttonClose: {
    color: MIDNIGHT_BLUE,
  },
  tooltip: {
    borderRadius: '12px',
    padding: '20px',
    fontSize: '14px',
  },
  tooltipContent: {
    padding: '10px 0',
  },
  spotlight: {
    borderRadius: '8px',
  },
};

/**
 * Build path tour styles (developer-focused, uses primary orange)
 */
export const buildPathTourStyles: Partial<Styles> = {
  ...baseTourStyles,
  options: {
    ...baseTourStyles.options,
    primaryColor: FEASIBILITY_ORANGE,
  },
  buttonNext: {
    ...baseTourStyles.buttonNext,
    backgroundColor: FEASIBILITY_ORANGE,
  },
};

/**
 * Buy path tour styles (investor-focused, uses data cyan)
 */
export const buyPathTourStyles: Partial<Styles> = {
  ...baseTourStyles,
  options: {
    ...baseTourStyles.options,
    primaryColor: DATA_CYAN,
  },
  buttonNext: {
    ...baseTourStyles.buttonNext,
    backgroundColor: DATA_CYAN,
  },
};

/**
 * Shared locale settings for all tours
 */
export const tourLocale: Locale = {
  back: 'Back',
  close: 'Close',
  last: 'Finish',
  next: 'Next',
  skip: 'Skip Tour',
};

/**
 * Helper to check if a tour has been completed
 */
export function isTourCompleted(tourName: string): boolean {
  return localStorage.getItem(`tour_completed_${tourName}`) === 'true';
}

/**
 * Helper to mark a tour as completed
 */
export function markTourCompleted(tourName: string): void {
  localStorage.setItem(`tour_completed_${tourName}`, 'true');
}

/**
 * Helper to reset a tour (for testing/debugging)
 */
export function resetTour(tourName: string): void {
  localStorage.removeItem(`tour_completed_${tourName}`);
}
