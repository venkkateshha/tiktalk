/**
 * TikTalk Motion & Animation Design Tokens
 * Fluid, responsive micro-animations for MNC-level UX
 */

export const Motion = {
  duration: {
    instant: 0,
    fast: 150,     // Tooltips, badges, quick micro-interactions
    normal: 250,   // Tab switches, button press, modal fade
    slow: 400,     // Screen transitions, story progress, drawer open
    extended: 600, // Video swipe, immersive card expands
  },
  easing: {
    standard: 'cubic-bezier(0.2, 0.0, 0, 1.0)',
    accelerate: 'cubic-bezier(0.3, 0.0, 1, 1)',
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;
