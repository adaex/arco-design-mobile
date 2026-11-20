# React component PR review captures

The PNGs capture the demo and its live event log in desktop Google Chrome on macOS. Each JSON contains the full commit, Chrome version, run ID and unrounded values for that screenshot. Times are milliseconds since the demo initialized its log. The adjacent `repro.js` or `repro.jsx` is the fixture used for the capture.

The fixtures are bundled from the root of the indicated checkout, with the repository's React and React DOM. The Form fixture resolves `@arco-design/mobile-utils` to `packages/common-widgets/utils/index.ts` from the same commit. The ScrollArea fixture loads the component's compiled Less stylesheet. For the track measurements, the root font size is 50 px, the default thumb is 4 px wide and the gutter is 2 px.

To run a fixture in an existing browser test page, give it `<div id="mount"></div>` and a `window.record(source, text, data)` function that appends the event to a log. The captures used these actions.

| PR | Action |
| --- | --- |
| 347 | Call `run()` on each checkout. The fixture translates the actual placeholder, calls `recalculatePosition()` and reads the DOM after two animation frames at each position |
| 402 | Call `run()` on each checkout. The fixture logs the return value directly and calculates a reference from the polynomial for the same control points |
| 419 | Call `nested()`, then `watchWheel()` and `readWheel('before wheel')`. Scroll the inner list with a wheel, read its position again, then set its `scrollTop` to `120`. On a fresh page, call `checkUpdates()` for the content growth, RTL and track measurements |
| 420 | Call `mountRule(mode)` and click the rendered submit button for each of `callback`, `throw` and `reject`. Then call `checkCollect()` and `checkUnprintable()` to exercise the public Validator directly |
