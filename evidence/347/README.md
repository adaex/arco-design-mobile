# Sticky on four phones

The controlled fixture moves the placeholder by 0.49, 0.51 and 0.49 CSS px, recalculates, then reads the computed position after two frames. The Safari window fixture records a system swipe into the document and a swipe back to the top, including touch events, animation frames and state callbacks.

[Fixture](../fixtures/sticky.jsx) · [Safari window fixture](../fixtures/window.jsx)

## vivo V2425A · Android 15 · vivo Browser 21.6.11.1

| Run | Commit | Capture and events |
| --- | --- | --- |
| `sticky-old-controlled` | `7a8fe9f4` | [screen](android1/sticky-old-controlled/readings.png) · [events](android1/sticky-old-controlled/events.json) |
| `sticky-new-controlled` | `c4088916` | [screen](android1/sticky-new-controlled/readings.png) · [events](android1/sticky-new-controlled/events.json) |

## vivo V2458A · Android 15 · vivo Browser 23.6.10.2

| Run | Commit | Capture and events |
| --- | --- | --- |
| `sticky-old-controlled` | `7a8fe9f4` | [screen](android2/sticky-old-controlled/readings.png) · [events](android2/sticky-old-controlled/events.json) |
| `sticky-new-controlled` | `c4088916` | [screen](android2/sticky-new-controlled/readings.png) · [events](android2/sticky-new-controlled/events.json) |

## iPhone 16 Pro · iOS 18.5 · Safari 18.5

| Run | Commit | Capture and events |
| --- | --- | --- |
| `sticky-old-controlled` | `7a8fe9f4` | [screen](ios1/sticky-old-controlled/screen.png) · [events](ios1/sticky-old-controlled/events.json) |
| `sticky-new-controlled` | `c4088916` | [screen](ios1/sticky-new-controlled/screen.png) · [events](ios1/sticky-new-controlled/events.json) |
| `sticky-window-old-fling` | `7a8fe9f4` | [screen](ios1/sticky-window-old-fling/screen.png) · [events](ios1/sticky-window-old-fling/events.json) |
| `sticky-window-new-fling` | `c4088916` | [screen](ios1/sticky-window-new-fling/screen.png) · [events](ios1/sticky-window-new-fling/events.json) |

## iPhone 17 · iOS 26.2 · Safari 26.2

| Run | Commit | Capture and events |
| --- | --- | --- |
| `sticky-old-controlled` | `7a8fe9f4` | [screen](ios2/sticky-old-controlled/screen.png) · [events](ios2/sticky-old-controlled/events.json) |
| `sticky-new-controlled` | `c4088916` | [screen](ios2/sticky-new-controlled/screen.png) · [events](ios2/sticky-new-controlled/events.json) |
| `sticky-window-old-fling` | `7a8fe9f4` | [screen](ios2/sticky-window-old-fling/screen.png) · [events](ios2/sticky-window-old-fling/events.json) |
| `sticky-window-new-fling` | `c4088916` | [screen](ios2/sticky-window-new-fling/screen.png) · [events](ios2/sticky-window-new-fling/events.json) |
