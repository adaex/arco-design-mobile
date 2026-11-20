import React from 'react';
import ReactDOM from 'react-dom';
import Sticky from './packages/arcodesign/components/sticky';

const ref = React.createRef();
const getScrollContainer = () => document.getElementById('scroller');
const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));
ReactDOM.render(
    <div id="scroller" style={{ height: 88, overflow: 'auto', background: '#eef2f5' }}>
        <Sticky ref={ref} getScrollContainer={getScrollContainer} topOffset={0}>
            <div style={{ padding: 10, background: '#cbe2f2' }}>Sticky header</div>
        </Sticky>
        <div style={{ height: 140, padding: 8 }}>Content below the header</div>
    </div>,
    document.getElementById('mount'),
);

window.run = async () => {
    await nextFrame();
    await nextFrame();
    for (const requested of [0.49, 0.51, 0.49]) {
        const placeholder = ref.current.dom.previousElementSibling;
        placeholder.style.transform = `translateY(${requested}px)`;
        ref.current.recalculatePosition();
        await nextFrame();
        await nextFrame();
        const offset = placeholder.getBoundingClientRect().top - getScrollContainer().getBoundingClientRect().top;
        const position = getComputedStyle(ref.current.dom).position;
        window.record('DOM read', `top difference = ${offset.toFixed(3)} px   position = ${position}`, { requested, offset, position });
    }
};
