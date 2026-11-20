import React from 'react';
import ReactDOM from 'react-dom';
import Area from './packages/arcodesign/components/scroll-area';

const root = document.getElementById('mount');
const ref = React.createRef();
const wait = ms => new Promise(done => setTimeout(done, ms));
const rows = Array.from({ length: 20 }, (_, i) => <div key={i} style={{ height: 40 }}>Row {i + 1}</div>);
function onScroll(label, event) {
    const current = event.currentTarget;
    const data = { top: current.scrollTop, left: current.scrollLeft, ownTarget: event.target === current };
    window.record(label, `scrollTop = ${data.top}   scrollLeft = ${data.left}   target === currentTarget: ${data.ownTarget}`, data);
}
window.nested = () => ReactDOM.render(
    <Area className="outer" direction="horizontal" scrollbarVisibility="always" style={{ width: 260, height: 126 }} onScroll={e => onScroll('outer onScroll', e)}>
        <div style={{ width: 500 }}><Area className="inner" direction="vertical" scrollbarVisibility="auto" style={{ width: 230, height: 100 }} onScroll={e => onScroll('inner onScroll', e)}>
            {rows}
        </Area></div>
    </Area>, root,
);
window.innerViewport = () => root.querySelector('.inner > .arco-scroll-area-viewport');
window.readWheel = label => {
    const v = window.innerViewport();
    const data = { overflowY: getComputedStyle(v).overflowY, clientHeight: v.clientHeight, scrollHeight: v.scrollHeight, top: v.scrollTop };
    window.record(label, `overflow-y: ${data.overflowY}   viewport/content: ${data.clientHeight}/${data.scrollHeight} px   scrollTop = ${data.top}`, data);
};
window.watchWheel = () => window.innerViewport().addEventListener('wheel', e => {
    window.record('wheel event', `deltaY = ${e.deltaY}   trusted = ${e.isTrusted}`, { deltaY: e.deltaY, trusted: e.isTrusted });
}, { once: true });
function single(props, child) {
    ReactDOM.render(<Area ref={ref} scrollbarVisibility="always" style={{ width: 200, height: 100 }} {...props}>{child}</Area>, root);
}
window.checkUpdates = async () => {
    single({direction:'vertical'}, <div id="anchor" style={{position:'relative', height:40}}>List</div>);
    await wait(250);
    function vertical(label) {
        const v = ref.current.viewport;
        const data = { viewport: v.clientHeight, content: v.scrollHeight, thumb: !!root.querySelector('.arco-scroll-area-thumb-vertical') };
        window.record(label, `viewport/content: ${data.viewport}/${data.content} px   vertical thumb: ${data.thumb}`, data);
    }
    vertical('initial read');
    const extra = document.createElement('div');
    extra.style.cssText = 'position:absolute;top:0;width:12px;height:600px;background:#cbe2f2';
    document.getElementById('anchor').appendChild(extra);
    await wait(550);
    vertical('after insertion');
    ref.current.update(); await wait(80);
    vertical('after update()');
    const child = <div style={{width:600,height:32}}>Horizontal content</div>;
    single({direction:'horizontal',viewportStyle:{direction:'ltr'}}, child); await wait(250);
    single({direction:'horizontal',viewportStyle:{direction:'rtl'}}, child); await wait(350);
    function horizontal(label) {
        const v = ref.current.viewport;
        const rel = root.querySelector('.arco-scroll-area-thumb-horizontal').getBoundingClientRect().left - v.getBoundingClientRect().left;
        const dir = getComputedStyle(v).direction;
        window.record(label, `direction: ${dir}   thumb left = ${rel.toFixed(2)} px`, { dir, rel });
    }
    horizontal('after LTR → RTL'); ref.current.update(); await wait(80); horizontal('after update()');
    single({direction:'both'}, <div style={{width:500,height:200}}>Both axes</div>); await wait(200);
    ref.current.scrollTo({top:1000,left:1000}); await wait(200);
    const v = root.querySelector('.arco-scroll-area-thumb-vertical').getBoundingClientRect();
    const h = root.querySelector('.arco-scroll-area-thumb-horizontal').getBoundingClientRect();
    const dx = Math.max(0,Math.min(v.right,h.right)-Math.max(v.left,h.left));
    const dy = Math.max(0,Math.min(v.bottom,h.bottom)-Math.max(v.top,h.top));
    window.record('bottom-right', `thumb rectangles overlap by ${dx.toFixed(2)} × ${dy.toFixed(2)} CSS px`, { dx, dy });
};
