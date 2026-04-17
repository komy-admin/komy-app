import { shadowsCss } from './shadows.tokens';

/**
 * Directional JS shadow tokens for style prop / StyleSheet usage.
 *
 * Uses React Native's native `boxShadow` prop (RN 0.76+) which renders
 * directional shadows identically on iOS, Android, and Web — no platform
 * branching needed.
 *
 * Pick the direction that matches the element's placement:
 *   - `left`   — element is flush against right edge (shadow casts leftward)
 *   - `right`  — element is flush against left edge (shadow casts rightward)
 *   - `top`    — element is flush against bottom edge (shadow casts upward)
 *   - `bottom` — element is flush against top edge (shadow casts downward)
 *   - `all`    — floating element (shadow radiates in all directions)
 *
 * Usage:
 *   import { shadows } from '~/theme';
 *   <View style={[styles.card, shadows.right]} />
 */
export const shadows = {
  left: { boxShadow: shadowsCss.left },
  right: { boxShadow: shadowsCss.right },
  top: { boxShadow: shadowsCss.top },
  bottom: { boxShadow: shadowsCss.bottom },
  all: { boxShadow: shadowsCss.all },
} as const;

/**
 * CSS strings re-exported for symmetry. Components should use
 * className="shadow-left|right|top|bottom|all" instead of importing this.
 */
export { shadowsCss };
