# Physical foldable follow-up evidence

This directory supplements the initial three-device matrix with two physical foldable devices. The same guided H5 page was re-run after changing the physical folded/unfolded state. No device-metrics override, UA override, or JavaScript property mocks were used.

The page displays original and fixed implementations together. The JSON files are the corresponding per-run DOM snapshots, including `getBoundingClientRect()` geometry and viewport values.

| Device | State | `screen.availWidth` | `clientWidth` | Original right edge / delta | Fixed right edge / delta |
| --- | --- | ---: | ---: | ---: | ---: |
| iPhone Duo, Safari (`iOS 18_7` UA) | Unfolded | 466 | 680 | 460 / -188px | 648 / 0 |
| iPhone Duo, Safari (`iOS 18_7` UA) | Folded | 466 | 342 | 310 / 0 | 310 / 0 |
| Android foldable (PHN110), Android 16, HeyTapBrowser 40.10.7.1 | Unfolded | 698 | 658 | 626.2 / 0 | 626.2 / 0 |
| Android foldable (PHN110), Android 16, HeyTapBrowser 40.10.7.1 | Folded | 344 | 304 | 272 / approximately 0 | 272 / approximately 0 |

The iPhone Duo unfolded state reproduces the original incorrect horizontal shift and confirms the fix. Its folded state confirms that the normal position remains unchanged. The Android device provides an additional no-regression check: both states already had sufficient space, so the original implementation did not need to shift the popover.

## Evidence index

### iPhone Duo

- [Unfolded comparison](iPhone-Duo/comparison-unfolded.png)
- [Folded comparison](iPhone-Duo/comparison-folded.png)
- [Unfolded original JSON](iPhone-Duo/reports/unfolded-original.json) · [Unfolded fixed JSON](iPhone-Duo/reports/unfolded-fixed.json)
- [Folded original JSON](iPhone-Duo/reports/folded-original.json) · [Folded fixed JSON](iPhone-Duo/reports/folded-fixed.json)

### Android foldable (PHN110)

- [Folded and unfolded comparison](Android-PHN110/comparison.png)
- [Unfolded original JSON](Android-PHN110/reports/unfolded-original.json) · [Unfolded fixed JSON](Android-PHN110/reports/unfolded-fixed.json)
- [Folded original JSON](Android-PHN110/reports/folded-original.json) · [Folded fixed JSON](Android-PHN110/reports/folded-fixed.json)

## Public-evidence sanitization

Browser network addresses are cropped or masked. Device photos are cropped to the phone screen area. Personal names, chat identifiers, message identifiers, and private-chat text are not included. PNG export drops the source photos' metadata. Only external headers and metric labels are added; Popover geometry and the displayed measurement values are not edited.
