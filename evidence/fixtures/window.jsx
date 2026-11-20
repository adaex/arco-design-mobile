import React from 'react';
import ReactDOM from 'react-dom';
import Sticky from './packages/arcodesign/components/sticky';
const ref=React.createRef();
const samples=[], scrolls=[], touches=[], callbacks=[], changes=[];
let initial,started=false,frozen=false,raf=0,until=0,num=0,lastPos;
function sample(){
  const dom=ref.current.dom, placeholder=dom.previousElementSibling.getBoundingClientRect(), vv=window.visualViewport;
  return {at:performance.now(),scrollY:window.scrollY,documentScrollTop:document.scrollingElement.scrollTop,offset:placeholder.top,placeholderTop:placeholder.top,placeholderBottom:placeholder.bottom,headerTop:dom.getBoundingClientRect().top,position:getComputedStyle(dom).position,visualOffsetTop:vv?vv.offsetTop:null,visualPageTop:vv?vv.pageTop:null};
}
function signal(){until=performance.now()+1800;if(!raf&&!frozen)raf=requestAnimationFrame(tick);}
function tick(){raf=0;if(frozen||performance.now()>until)return;const row=sample();samples.push(row);
  if(row.position!==lastPos){changes.push(row);lastPos=row.position;if(changes.length<=3)window.record('逐帧读取',`${row.position}，占位顶边 ${row.offset.toFixed(2)} px`,row);}
  raf=requestAnimationFrame(tick);
}
function state(payload){if(!started||frozen)return;const row={...sample(),...payload};callbacks.push(row);window.record('onStickyStateChange',`${payload.wasSticky} → ${payload.isSticky}，占位顶边 ${row.offset.toFixed(2)} px`,row,{hidden:callbacks.length>3});}
ReactDOM.render(<Sticky ref={ref} topOffset={0} onStickyStateChange={state}><div className="header">吸顶标题</div></Sticky>,document.getElementById('mount'));
function ready(){
  initial=sample();window.record('手势前',`scrollY=${initial.scrollY}，占位顶边 ${initial.offset.toFixed(2)} px，${initial.position}`,initial);
  const surface=document.getElementById('surface');surface.dataset.action='swipe';
  for(const kind of ['touchstart','touchmove','touchend','touchcancel']) surface.addEventListener(kind,e=>{if(frozen)return;const t=e.changedTouches[0];if(kind==='touchstart'){started=true;num++;}const data={...sample(),kind,num,x:t.clientX,y:t.clientY,id:t.identifier,trusted:e.isTrusted};touches.push(data);if(kind!=='touchmove')window.record(kind,`触点 y=${data.y.toFixed(1)}，scrollY=${data.scrollY.toFixed(2)}`,data);signal();},{passive:true});
  window.addEventListener('scroll',()=>{if(started&&!frozen){scrolls.push({...sample(),source:'window'});signal();}},{passive:true});
  if(window.visualViewport)window.visualViewport.addEventListener('scroll',()=>{if(started&&!frozen){scrolls.push({...sample(),source:'visualViewport'});signal();}},{passive:true});
  document.getElementById('read').onclick=()=>{if(frozen)return;frozen=true;cancelAnimationFrame(raf);const last=sample();const all=[...touches,...scrolls,...samples].sort((a,b)=>a.at-b.at);const min=(k)=>all.length?Math.min(...all.map(s=>s[k])):null;const max=(k)=>all.length?Math.max(...all.map(s=>s[k])):null;const band=samples.filter(s=>s.offset>0.5&&s.offset<=1);const y=min('scrollY'),low=min('offset'),high=max('offset');const fmt=n=>n===null?'—':n.toFixed(2);const lowest=all.find(v=>v.scrollY===y);if(lowest)window.record('最小 scrollY',`${fmt(lowest.scrollY)} px，占位顶边 ${fmt(lowest.offset)} px`,lowest);window.record('停稳后读取',`占位顶边 ${fmt(low)}～${fmt(high)} px；边界内 ${band.length}／${samples.length} 帧；最后 ${last.position}`,{initial,last,gestureCount:num,minScrollY:y,minOffset:low,maxOffset:high,bandFrames:band.length,samples,touches,scrolls,callbacks,changes});window.finish();};
}
requestAnimationFrame(()=>requestAnimationFrame(ready));
