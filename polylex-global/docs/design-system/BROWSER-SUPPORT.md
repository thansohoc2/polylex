# PolyLex Web Browser Support

## Supported baseline

| Browser family | Minimum version |
| --- | ---: |
| Chrome and Chromium Edge | 100 |
| Firefox | 100 |
| Safari on macOS | 15.4 |
| Safari on iOS/iPadOS | 15.4 |

Internet Explorer and end-of-life browsers are unsupported. Critical journeys must remain usable at the baseline versions; newer CSS may progressively enhance presentation.

## Required fallback policy

- **`color-mix()`**: declare a solid hex or rgba value first. Put the mixed color in a later declaration guarded by `@supports (color: color-mix(in srgb, black, white))` when losing it would affect readability.
- **`backdrop-filter`**: provide an opaque or sufficiently legible rgba background first. Apply blur in `@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))`; never depend on blur for contrast.
- **Safe areas**: provide ordinary spacing first, then add `env(safe-area-inset-*)`, for example `padding-bottom: 1rem; padding-bottom: max(1rem, env(safe-area-inset-bottom));`. Content and controls must remain reachable when every safe-area inset resolves to zero.
- Vendor prefixes are used only where a supported browser requires them. Feature detection is preferred over browser detection.

## Verification

Changed critical journeys are checked at 320, 375, 430, 768, and 1024 px. Test keyboard operation, readable fallback colors, fixed navigation, overlays, and safe-area spacing without assuming progressive enhancements are available.
