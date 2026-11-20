import React from 'react';
import ReactDOM from 'react-dom';
import Area from './packages/arcodesign/components/scroll-area';

const root = document.getElementById('mount');
const ref = React.createRef();
const wait = ms => new Promise(done => setTimeout(done, ms));
const mode = new URLSearchParams(location.search).get('mode');
const events = [];
const counts = {inner: 0, outer: 0};
let phase = 'initial';
const get = which => root.querySelector(`.${which} > .arco-scroll-area-viewport`);
function offsets() {
    const inner = get('inner'); const outer = get('outer');
    return {innerTop: inner.scrollTop, innerLeft: inner.scrollLeft, outerTop: outer.scrollTop, outerLeft: outer.scrollLeft, pageY: window.scrollY};
}
function onScroll(owner, e) {
    const data = {at: performance.now(), phase, owner, ownTarget: e.currentTarget === e.target, target: e.target === get('inner') ? 'inner' : e.target === get('outer') ? 'outer' : 'other', ...offsets()};
    events.push(data); counts[owner]++;
    if (counts[owner] === 1) window.record(`${owner} onScroll`, `目标 ${data.target}，自身 ${data.ownTarget}，内层 y=${data.innerTop}，外层 x=${data.outerLeft}`, data);
}
function logSample(label) {
    const v = get('inner'); const data = {...offsets(), phase, counts: {...counts}, overflowY: getComputedStyle(v).overflowY, viewport: v.clientHeight, content: v.scrollHeight, events: events.slice()};
    window.record(label, `内层 y=${data.innerTop}，外层 x=${data.outerLeft}、y=${data.outerTop}；回调 内 ${counts.inner}、外 ${counts.outer}`, data);
}
function nested() {
    ReactDOM.render(<Area className="outer" direction="horizontal" scrollbarVisibility="always" style={{width:260,height:126}} onScroll={e=>onScroll('outer',e)}>
        <div style={{width:500}}><Area className="inner" direction="vertical" scrollbarVisibility="auto" style={{width:230,height:100}} onScroll={e=>onScroll('inner',e)}>
          {Array.from({length:20}, (_,i)=><div className="item" key={i}>内层列表 · 第 {i+1} 行</div>)}
        </Area></div>
    </Area>, root);
    const v=get('inner'); v.dataset.action='swipe';
    document.getElementById('hint').textContent='在内层白色列表内向上划动，停稳后点「读取位移」';
    for (const kind of ['touchstart','touchmove','touchend','touchcancel']) {
        v.addEventListener(kind, e=>{
            const t=e.changedTouches[0]; if (kind==='touchstart') {phase='touch';counts.inner=counts.outer=0;}
            const data={at:performance.now(),kind,id:t.identifier,x:t.clientX,y:t.clientY,trusted:e.isTrusted,...offsets()}; events.push(data);
            if(kind!=='touchmove') window.record(kind,`触点 (${data.x.toFixed(0)}, ${data.y.toFixed(0)})，内层 y=${data.innerTop}`,data);
        },{passive:true});
    }
    window.record('初始读取',`内层高 ${v.clientHeight}，内容高 ${v.scrollHeight}，overflow-y=${getComputedStyle(v).overflowY}，y=${v.scrollTop}`,{...offsets(),viewport:v.clientHeight,content:v.scrollHeight,overflowY:getComputedStyle(v).overflowY});
    document.getElementById('read').onclick=()=>{logSample('停稳后读取');window.finish();};
    document.getElementById('program').onclick=async()=>{phase='program';counts.inner=counts.outer=0;const before=offsets();window.record('程序滚动',`将内层 y 从 ${before.innerTop} 设为 120`,{before,requested:120});v.scrollTop=120;await wait(350);logSample('程序滚动后读取');window.finish();};
}
function single(props, child) {ReactDOM.render(<Area ref={ref} scrollbarVisibility="always" style={{width:200,height:100}} {...props}>{child}</Area>,root);}
async function updates() {
    document.getElementById('actions').hidden=true; document.getElementById('hint').textContent='依次读取内容增高、从左到右切为从右到左、滚动到底时的滑块位置';
    single({direction:'vertical'},<div id="anchor" style={{position:'relative',height:40}}>内容增高</div>); await wait(250);
    function vertical(label){const v=ref.current.viewport;const data={viewport:v.clientHeight,content:v.scrollHeight,thumb:!!root.querySelector('.arco-scroll-area-thumb-vertical')};window.record(label,`视口／内容 ${data.viewport}／${data.content}，滑块 ${data.thumb?'有':'无'}`,data);}
    vertical('初始高度');const extra=document.createElement('div'); extra.style.cssText='position:absolute;top:0;width:12px;height:600px;background:#abccde';document.getElementById('anchor').appendChild(extra); await wait(550);vertical('内容增高');ref.current.update(); await wait(80);vertical('主动 update()');
    const child=<div style={{width:600,height:32}}>横向内容</div>;
    function horizontal(label){const v=ref.current.viewport;const h=root.querySelector('.arco-scroll-area-thumb-horizontal');const dir=getComputedStyle(v).direction;const rel=h?h.getBoundingClientRect().left-v.getBoundingClientRect().left:null;window.record(label,`方向 ${dir}，滑块 x=${rel===null?'无':rel.toFixed(2)}`,{dir,rel});}
    single({direction:'horizontal',viewportStyle:{direction:'ltr'}},child);await wait(250); horizontal('切换前');single({direction:'horizontal',viewportStyle:{direction:'rtl'}},child);await wait(350);horizontal('切为 RTL');ref.current.update();await wait(80);horizontal('主动 update()');
    single({direction:'both'},<div style={{width:500,height:200,background:'repeating-linear-gradient(45deg,#ecf3f5,#ecf3f5 16px,#fff 16px,#fff 36px)'}}>横纵均滚动</div>);await wait(200);ref.current.scrollTo({top:1000,left:1000});await wait(200);
    const h=root.querySelector('.arco-scroll-area-thumb-horizontal').getBoundingClientRect(); const v=root.querySelector('.arco-scroll-area-thumb-vertical').getBoundingClientRect();const dx=Math.max(0,Math.min(v.right,h.right)-Math.max(v.left,h.left));const dy=Math.max(0,Math.min(v.bottom,h.bottom)-Math.max(v.top,h.top));const rect=r=>({left:r.left,right:r.right,top:r.top,bottom:r.bottom});window.record('右下角',`滑块相交 ${dx.toFixed(2)} × ${dy.toFixed(2)} CSS px`,{dx,dy,horizontal:rect(h),vertical:rect(v),top:ref.current.viewport.scrollTop,left:ref.current.viewport.scrollLeft});window.finish();
}
if(mode==='updates')updates();else nested();
