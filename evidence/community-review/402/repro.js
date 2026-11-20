import bezierEasing from './packages/common-widgets/utils/bezier-easing';

window.run = () => {
    const easing = bezierEasing(1, 0, 0, 1);
    const xs = [0.4996, 0.4999999999999945, 0.49999999999999456];
    let previous;
    for (const x of xs) {
        const actual = easing(x);
        // For these control points, x(t) = 0.5 + 4(t - 0.5)^3 and y(t) = 3t² - 2t³.
        const t = 0.5 + Math.cbrt((x - 0.5) / 4);
        const reference = t * t * (3 - 2 * t);
        window.record('easing(x)', `x = ${x}\nreturned  ${actual}\nreference ${reference}`, { x, actual, reference });
        if (x === xs[2]) {
            window.record('difference', `last output minus previous output = ${(actual - previous).toExponential(8)}`, { difference: actual - previous });
        }
        previous = actual;
    }
};
