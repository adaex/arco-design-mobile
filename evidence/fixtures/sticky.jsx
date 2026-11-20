import React from 'react';
import ReactDOM from 'react-dom';
import Sticky from './packages/arcodesign/components/sticky';

const ref = React.createRef();
const scroller = () => document.getElementById('scroller');
const frame = () => new Promise(done=>requestAnimationFrame(done));
const mode = new URLSearchParams(location.search).get('mode') || 'controlled';
const gesture = mode === 'gesture';
let started=false, frozen=false, tracing=false, until=0, num=0;
const samples=[], touches=[], callbacks=[], changes=[], scrolls=[];
function sample(){const box=scroller().getBoundingClientRect(), placeholder=ref.current.dom.previousElementSibling.getBoundingClientRect(), header=ref.current.dom.getBoundingClientRect();return {at:performance.now(), offset:placeholder.top-box.top, scrollTop:scroller().scrollTop, position:getComputedStyle(ref.current.dom).position,headerTop:header.top,containerTop:box.top,placeholderTop:placeholder.top,pageY:window.scrollY};}
function state(payload){if(!gesture||!started||frozen)return;const data={...sample(),...payload};callbacks.push(data);if(callbacks.length<=3)window.record('onStickyStateChange',`${payload.wasSticky} → ${payload.isSticky}，顶边差 ${data.offset.toFixed(3)} px`,data);}
ReactDOM.render(<div id="scroller" data-action={gesture?'swipe':undefined} style={{height:gesture?194:88,overflow:'auto',WebkitOverflowScrolling:'touch',background:'#f1f4f5'}}>
    <Sticky ref={ref} getScrollContainer={scroller} topOffset={0} onStickyStateChange={state}><div className="header">吸顶标题</div></Sticky>
    {Array.from({length:gesture?16:4},(_,i)=><div className="item" key={i}>内容 · 第 {i+1} 行</div>)}
</div>,document.getElementById('mount'));
async function controlled(){
    document.getElementById('actions').hidden=true;document.getElementById('hint').textContent='控制占位元素的顶边位置，每次重算后等待两帧，再读取实际坐标与标题样式';await frame();await frame();
    for(const requested of [0.49,0.51,0.49]){ref.current.dom.previousElementSibling.style.transform=`translateY(${requested}px)`;ref.current.recalculatePosition();await frame();await frame();const data=sample();window.record('DOM 读取',`顶边差 ${data.offset.toFixed(3)} px，position=${data.position}`,{requested,...data});}
    window.finish();
}
function runTrace(){if(tracing||frozen)return;tracing=true;const tick=()=>{if(frozen || performance.now()>until){tracing=false;return;} const data=sample();const prev=samples[samples.length-1];samples.push(data);if(!prev||prev.position!==data.position){changes.push(data);if(changes.length<=3)window.record('逐帧读取',`${data.position}，顶边差 ${data.offset.toFixed(3)} px`,data);} requestAnimationFrame(tick);};tick();}
async function native(){
    document.getElementById('program').hidden=true;document.getElementById('read').textContent='读取回弹轨迹';document.getElementById('hint').textContent='从滚动区中部向下拖动，松手让 Safari 自行回弹，停稳后读取轨迹';
    await frame();await frame();const initial=sample();window.record('手势前',`scrollTop=${initial.scrollTop}，顶边差 ${initial.offset.toFixed(3)} px，${initial.position}`,initial);
    for(const kind of ['touchstart','touchmove','touchend','touchcancel'])scroller().addEventListener(kind,e=>{if(frozen)return;const t=e.changedTouches[0];if(kind==='touchstart'){started=true;num++;}const data={...sample(),kind,id:t.identifier,gesture:num,x:t.clientX,y:t.clientY,trusted:e.isTrusted};touches.push(data);until=performance.now()+1800;if(kind!=='touchmove')window.record(kind,`y=${data.y.toFixed(1)}，顶边差 ${data.offset.toFixed(3)} px，${data.position}`,data);runTrace();},{passive:true});
    scroller().addEventListener('scroll',()=>{if(!started||frozen)return;scrolls.push(sample());until=performance.now()+1550;runTrace();},{passive:true});
    document.getElementById('read').onclick=()=>{if(frozen)return;frozen=true;const last=sample(); const vals=samples.map(s=>s.offset);const min=vals.length?Math.min(...vals):null,max=vals.length?Math.max(...vals):null;const near=samples.filter(s=>s.offset>0.5&&s.offset<=1);const first=near[0];if(first)window.record('边界内首帧',`顶边差 ${first.offset.toFixed(3)} px，${first.position}`,first);window.record('停稳后读取',`共 ${samples.length} 帧，顶边差 ${min===null?'—':min.toFixed(2)}～${max===null?'—':max.toFixed(2)} px；(0.5, 1] 内 ${near.length} 帧；最后 ${last.position}`,{last,min,max,bandFrames:near.length,gestureCount:num,initial,samples,touches,scrolls,changes,callbacks});window.finish();};
}
if(gesture)native();else controlled();
