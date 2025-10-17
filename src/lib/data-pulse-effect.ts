/**
 * Corporate AI Data Pulse Effect
 * Replaces confetti with subtle, professional data verification animation
 * Per SiteIntel™ Brand Guidelines: "Motion should inform, not entertain"
 */

export const triggerDataPulse = (element?: HTMLElement) => {
  // Create data pulse ring
  const pulse = document.createElement('div');
  pulse.className = 'data-pulse-ring';
  pulse.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    width: 100px;
    height: 100px;
    margin: -50px 0 0 -50px;
    border: 2px solid hsl(var(--feasibility-orange));
    border-radius: 50%;
    opacity: 0;
    pointer-events: none;
    z-index: 9999;
    animation: dataPulseExpand 800ms ease-out;
  `;
  
  document.body.appendChild(pulse);
  setTimeout(() => pulse.remove(), 800);
};

export const triggerVerificationEffect = (score: number) => {
  // Create subtle verification indicator
  if (score >= 80) {
    triggerDataPulse();
  }
};
