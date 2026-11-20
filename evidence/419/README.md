# ScrollArea on four phones

The inner viewport is 100 CSS px high with 800 px of content. Each nested run records a system swipe, the settled inner and outer offsets, and a separate programmatic scroll to 120 px. The layout runs cover content growth, direction changes and the bottom-right corner.

[Fixture](../fixtures/scroll.jsx)

## vivo V2425A · Android 15 · vivo Browser 21.6.11.1

| Run | Commit | Capture and events |
| --- | --- | --- |
| `scroll-old` | `d46f4f15` | [swipe](android1/scroll-old/after-swipe.png) · [set scrollTop](android1/scroll-old/after-program.png) · [events](android1/scroll-old/events.json) |
| `scroll-new` | `33868c03` | [swipe](android1/scroll-new/after-swipe.png) · [set scrollTop](android1/scroll-new/after-program.png) · [events](android1/scroll-new/events.json) |
| `scroll-old-updates` | `d46f4f15` | [screen](android1/scroll-old-updates/layout.png) · [events](android1/scroll-old-updates/events.json) |
| `scroll-new-updates` | `33868c03` | [screen](android1/scroll-new-updates/layout.png) · [events](android1/scroll-new-updates/events.json) |

## vivo V2458A · Android 15 · vivo Browser 23.6.10.2

| Run | Commit | Capture and events |
| --- | --- | --- |
| `scroll-old` | `d46f4f15` | [swipe](android2/scroll-old/after-swipe.png) · [set scrollTop](android2/scroll-old/after-program.png) · [events](android2/scroll-old/events.json) |
| `scroll-new` | `33868c03` | [swipe](android2/scroll-new/after-swipe.png) · [set scrollTop](android2/scroll-new/after-program.png) · [events](android2/scroll-new/events.json) |
| `scroll-old-updates` | `d46f4f15` | [screen](android2/scroll-old-updates/layout.png) · [events](android2/scroll-old-updates/events.json) |
| `scroll-new-updates` | `33868c03` | [screen](android2/scroll-new-updates/layout.png) · [events](android2/scroll-new-updates/events.json) |

## iPhone 16 Pro · iOS 18.5 · Safari 18.5

| Run | Commit | Capture and events |
| --- | --- | --- |
| `scroll-old` | `d46f4f15` | [swipe](ios1/scroll-old/gesture.png) · [set scrollTop](ios1/scroll-old/program.png) · [events](ios1/scroll-old/events.json) |
| `scroll-new` | `33868c03` | [swipe](ios1/scroll-new/gesture.png) · [set scrollTop](ios1/scroll-new/program.png) · [events](ios1/scroll-new/events.json) |
| `scroll-old-updates` | `d46f4f15` | [screen](ios1/scroll-old-updates/screen.png) · [events](ios1/scroll-old-updates/events.json) |
| `scroll-new-updates` | `33868c03` | [screen](ios1/scroll-new-updates/screen.png) · [events](ios1/scroll-new-updates/events.json) |

## iPhone 17 · iOS 26.2 · Safari 26.2

| Run | Commit | Capture and events |
| --- | --- | --- |
| `scroll-old` | `d46f4f15` | [swipe](ios2/scroll-old/gesture.png) · [set scrollTop](ios2/scroll-old/program.png) · [events](ios2/scroll-old/events.json) |
| `scroll-new` | `33868c03` | [swipe](ios2/scroll-new/gesture.png) · [set scrollTop](ios2/scroll-new/program.png) · [events](ios2/scroll-new/events.json) |
| `scroll-old-updates` | `d46f4f15` | [screen](ios2/scroll-old-updates/screen.png) · [events](ios2/scroll-old-updates/events.json) |
| `scroll-new-updates` | `33868c03` | [screen](ios2/scroll-new-updates/screen.png) · [events](ios2/scroll-new-updates/events.json) |
