/**
 * Global motion system — single source of truth.
 * Every component imports from here.
 * Changing a value here changes it everywhere.
 */

// ─── Durations (seconds) ─────────────────────────────────────────────────────
export const DUR = {
  micro:   0.14,   // 140ms — instant feedback (hover color, border flash)
  fast:    0.20,   // 200ms — button state, small UI response
  std:     0.25,   // 250ms — standard transitions
  base:    0.45,   // 450ms — component sub-elements (numbers, labels)
  enter:   0.55,   // 550ms — section / card entrance
  reveal:  0.55,   // alias of enter
  slow:    0.65,   // 650ms — large text, hero elements
} as const;

// ─── Easing ──────────────────────────────────────────────────────────────────
// Smooth deceleration — content settles, never overshoots
export const EASE_OUT  = [0.22, 0.1, 0.36, 1]  as const;
// Very gentle ease for opacity-only fades
export const EASE_FADE = [0.4, 0, 0.2, 1]       as const;

// ─── Spring configs ──────────────────────────────────────────────────────────
// Tilt / surface rotation — heavy, damped, no overshoot
export const SPRING_TILT   = { stiffness: 160, damping: 30, mass: 0.6  } as const;
// Navbar hide/show — resolves cleanly
export const SPRING_NAV    = { stiffness: 220, damping: 36, mass: 0.5  } as const;
// Progress line — feels connected to scroll
export const SPRING_SCROLL = { stiffness: 100, damping: 30, mass: 0.35 } as const;

// ─── Transform limits ────────────────────────────────────────────────────────
export const HOVER_LIFT  = -2;    // px — max hover translateY (restrained)
export const HOVER_SCALE =  1.008; // max hover scale for primary CTA
export const MAX_TILT    =  2.0;  // deg — tilt card max rotation

// ─── Y travel for entrances ──────────────────────────────────────────────────
export const Y_ENTER = 8;   // px — card / section entrance (was 16)
export const Y_SMALL = 4;   // px — sub-element, text lines

// ─── Utility: prefers-reduced-motion guard ───────────────────────────────────
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Reduced-motion variant: opacity only, no transforms
export const REDUCED_TRANSITION = {
  duration: DUR.std,
  ease: EASE_FADE,
} as const;
