/**
 * Directional shadow tokens.
 * CommonJS so tailwind.config.js (Node context) can require it,
 * and shadows.ts can import it for the JS API.
 *
 * Uses the CSS box-shadow string format (React Native 0.76+ supports
 * `boxShadow` natively on iOS/Android/Web with full directional support).
 *
 * Conventions:
 *  - Same blur radius, color, and opacity everywhere — only offset direction changes.
 *  - Shadow is always cast *outward* from the element in the named direction.
 *  - No platform-specific branching: one string read identically by all 3 platforms.
 *
 * Change here = change everywhere (JS + Tailwind).
 */
const BLUR = 8;
const OFFSET = 2;
const OPACITY = 0.1;

const DIRECTIONS = {
  left: { x: -OFFSET, y: 0 },
  right: { x: OFFSET, y: 0 },
  top: { x: 0, y: -OFFSET },
  bottom: { x: 0, y: OFFSET },
  all: { x: 0, y: 0 },
};

const shadowsCss = Object.fromEntries(
  Object.entries(DIRECTIONS).map(([name, { x, y }]) => [
    name,
    `${x}px ${y}px ${BLUR}px rgba(0, 0, 0, ${OPACITY})`,
  ])
);

module.exports = {
  shadowsCss,
};
