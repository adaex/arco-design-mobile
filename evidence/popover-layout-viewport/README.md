# Popover layout-viewport real-device evidence

Evidence for [arco-design/arco-design-mobile#404](https://github.com/arco-design/arco-design-mobile/pull/404).

## Test setup

Each device ran six scenarios against the real component bundles:

- `normal-original-follow`: `width=device-width`, original `screen.availWidth`
- `normal-fixed-follow`: `width=device-width`, fixed `document.documentElement.clientWidth || window.innerWidth`
- `wide-original-follow`: fixed-width H5 layout with `width=600`, original implementation
- `wide-fixed-follow`: fixed-width H5 layout with `width=600`, fixed implementation
- `normal-fixed-global`: normal viewport, body-mounted popover
- `wide-fixed-global`: fixed-width H5 layout, body-mounted popover

No device-metrics override, UA override, or JavaScript property mocks were used. The wide scenario creates a real mismatch between the screen width and layout viewport on each physical device. It is not presented as a physical foldable test.

The page reads `getBoundingClientRect()` and viewport properties after the popover opens, displays the values on the page, and posts the same snapshot to the per-run JSON report. Red outlines mark the original implementation, green outlines mark the fix, blue outlines mark the anchor, and the dashed green line marks the expected right edge.

Comparison images are generated from the raw screenshots by adding headers and metric footers. Browser chrome, local network addresses, and remote-control status indicators are cropped or masked. Popover pixels and geometry are not edited. Sanitized raw screenshots, run IDs, and raw JSON are included alongside the comparisons.

## Devices and results

| Device | Browser | Normal original / fixed right edge | Wide original right edge | Wide fixed right edge | Wide expected right edge | Fixed global normal / wide |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| vivo iQOO Neo10 Pro+ (V2463A), Android 15 | VivoBrowser 23.6.10, Chromium 123 | 328 / 328 | 354 | 568 | 568 | 328 / 568 |
| LG Velvet 5G (LM-G900), Android 11 | Chrome 157.0.8103.50 | 379.4 / 379.4 | 406 | 568 | 568 | 379.4 / 568 |
| iPhone 16 Pro, iOS 18.5 | Safari 18.5, WebKit 605.1.15 | 370 / 370 | 396 | 568 | 568 | 370 / 568 |

All fixed scenarios have `rightDeltaFromExpected = 0` and `viewportOverflow = 0`. The original wide scenarios are displaced by `-214px`, `-162px`, and `-172px`, respectively.

The LG operating system version uses the recorded physical-device system version. Chrome's reduced UA reports `Android 10; K`, while the physical device runs Android 11. No rendering or viewport command-line flags were used.

## Evidence index

### vivo iQOO Neo10 Pro+

- [Wide original / fixed comparison](vivo/comparison-wide.png)
- [Normal original / fixed comparison](vivo/comparison-normal.png)
- [Fixed global comparison](vivo/comparison-global.png)
- [Raw screenshots and JSON](vivo/)

### LG Velvet 5G

- [Wide original / fixed comparison](LG/comparison-wide.png)
- [Normal original / fixed comparison](LG/comparison-normal.png)
- [Fixed global comparison](LG/comparison-global.png)
- [Raw screenshots and JSON](LG/)

### iPhone 16 Pro

- [Wide original / fixed comparison](iPhone/comparison-wide.png)
- [Normal original / fixed comparison](iPhone/comparison-normal.png)
- [Fixed global comparison](iPhone/comparison-global.png)
- [Raw screenshots and JSON](iPhone/)

### Physical foldable follow-up

- [iPhone Duo and Android PHN110 evidence](foldable/README.md)
- [iPhone Duo unfolded comparison](foldable/iPhone-Duo/comparison-unfolded.png)
- [iPhone Duo folded comparison](foldable/iPhone-Duo/comparison-folded.png)
- [Android PHN110 folded / unfolded comparison](foldable/Android-PHN110/comparison.png)

See [manifest.json](manifest.json) for the initial 18 runs and the 8 foldable reports, including run IDs, UA strings, viewport values, coordinates, and report paths.

## Physical foldable follow-up

Two additional physical foldable devices were checked after the initial matrix:

- iPhone Duo unfolded: original right edge `460` versus expected `648` (`-188px`); fixed right edge `648` with zero overflow
- iPhone Duo folded: original and fixed right edge both `310`, unchanged
- Android PHN110 folded and unfolded: original and fixed positions unchanged, with zero overflow

The iPhone Duo unfolded result verifies both the original issue and the fix on physical foldable hardware. The other states provide no-regression coverage. See the [foldable evidence README](foldable/README.md) for the full data and sanitization notes.
