import React from 'react';
import ReactDOM from 'react-dom';
import Popup from './packages/arcodesign/components/popup';
import Picker from './packages/arcodesign/components/picker';
import Form from './packages/arcodesign/components/form';

const { scenario, tag, commit, version } = window.probeVersion;
const params = new URLSearchParams(location.search);
const form = params.has('mode') ? params.get('mode') === 'form' : tag === '234';
const early = params.get('early') === '1';
const config = { scenario, commit, version };
if (scenario === 'picker') Object.assign(config, { form, early, initialValue: ['1'] });
window.initRun(config);
const note = document.getElementById('note');
const mount = document.getElementById('mount');
const log = window.record;

function rect(node) {
    if (!node) return null;
    const r = node.getBoundingClientRect();
    return { x:r.x, y:r.y, width:r.width, height:r.height };
}

function PopupPage() {
    const [visible, setVisible] = React.useState(false);
    const popupRef = React.useRef(null);
    const shownAt = React.useRef(null);
    const openedAt = React.useRef(null);
    function inspect(event) {
        const readAt = performance.now();
        const handle = popupRef.current;
        const inside = event.currentTarget;
        const root = inside.closest('.arco-masking');
        const content = inside.closest('.arco-masking-content');
        const mask = root?.querySelector('.arco-masking-mask');
        const visibleContent = rect(content);
        const point = rect(inside);
        const hit = document.elementFromPoint(point.x + point.width / 2, point.y + point.height / 2);
        log('读取 Popup', `公开句柄 ${handle == null ? String(handle) : '存在'}，按钮${inside.contains(hit) ? '可见' : '被遮挡'}`, {
            readAt, trusted:event.isTrusted, handlePresent:handle != null, afterOpenMs:readAt-openedAt.current,
            afterShownMs:shownAt.current == null ? null : readAt-shownAt.current,
            buttonHit:inside.contains(hit), contentRect:visibleContent,
            contentOpacity:content && getComputedStyle(content).opacity,
            maskOpacity:mask && getComputedStyle(mask).opacity,
        });
        for (const [name, node] of Object.entries({dom:root, mask, content})) {
            const exposed = handle?.[name];
            const value = exposed === null ? 'null' : exposed === undefined ? 'undefined' : exposed.nodeName || typeof exposed;
            const bounds = rect(node);
            const connected = !!(node && node.isConnected);
            const size = bounds ? `${Math.round(bounds.width)} × ${Math.round(bounds.height)}` : '缺失';
            log(name, `页面 ${node?.nodeName || '缺失'} ${size}　ref.${name} = ${value}`, {
                readAt, field:name, selector:node?.className || null, connected,
                nodeType:node?.nodeName || null, rect:bounds, publicValue:value,
                identical:!!node && node === exposed,
            });
        }
        window.finish();
    }
    return <><button className="probe-button" data-action="open" onClick={e=>{
        openedAt.current = performance.now();
        log('打开 Popup', 'visible 改为 true', {trusted:e.isTrusted, openedAt:openedAt.current});
        setVisible(true);
    }}>打开 Popup</button><Popup visible={visible} ref={popupRef} onOpen={()=>{
        shownAt.current = performance.now();
        log('onOpen', '弹层进入动画结束', {sinceOpen:shownAt.current-openedAt.current}, {hidden:true});
    }}><section className="sheet-content"><strong>Popup 内容</strong><button className="probe-button" data-action="read" onClick={inspect}>读取三个节点</button></section></Popup></>;
}

const options = [ {label:'male',value:'1'}, {label:'female',value:'2'}, {label:'others',value:'3'} ];
let phase = '打开前';
let calls = 0;
let previous = '';
function PickerPage() {
    const [value, setValue] = React.useState(['1']);
    const pickerProps = {
        data: form ? [options] : options,
        cascade:false, maskClosable:true, title:'选择选项', okText:'确定', dismissText:'取消',
        ...(early ? {mountOnEnter:false,unmountOnExit:false} : {}),
        onOk(v,d) {
            log('onOk', `value=${JSON.stringify(v)}，label=${JSON.stringify(d.map(item=>item.label))}`, {value:[...v],data:JSON.parse(JSON.stringify(d))}, {hidden:true});
        },
        renderLinkedContainer(v,d) {
            const n = ++calls;
            const args = { n, phase, value:[...v], data:JSON.parse(JSON.stringify(d)), early, form };
            const fingerprint = JSON.stringify([phase,args.value,args.data]);
            const text = `value=${JSON.stringify(v)}　data=${d.length ? JSON.stringify(d.map(i=>({label:i.label,value:i.value}))) : '[]'}`;
            log(`回调 #${n} · ${phase}`, text, args, {hidden:previous === fingerprint});
            previous = fingerprint;
            const label = form ? v.map(val=>d.find(item=>item.value===val)?.label).join('-') || 'empty' : d.map(item=>item.label).join(',');
            return <span className="picker-value" data-action="open" aria-label="打开 Picker" onClick={e=>{
                phase='点击打开后';
                log('点击选择框', '打开 Picker', {trusted:e.isTrusted}, {hidden:true});
            }}>{label}</span>;
        }
    };
    return form ? <Form initialValues={{gender:['1']}}><Form.Item field="gender" label="性别"><Picker {...pickerProps}/></Form.Item></Form> : <Picker {...pickerProps} value={value} onChange={setValue}/>;
}
if (scenario === 'popup') {
    note.textContent='打开弹层后，点底部的「读取三个节点」';
    ReactDOM.render(<PopupPage/>, mount);
} else {
    note.textContent=`${form ? 'Form 内的 Picker' : '独立 Picker'} · ${early ? '提前挂载' : '默认挂载'} · 初始值 ["1"]`;
    const observeConfirm = () => {
        const confirm = document.querySelector('.arco-picker-header-btn.right');
        if (!confirm || confirm.hasAttribute('data-action')) return;
        confirm.dataset.action='confirm';
        confirm.addEventListener('click', e=>{
            phase='点击确定后';
            log('点击确定', '确认当前选择', {trusted:e.isTrusted}, {hidden:true});
        }, true);
    };
    new MutationObserver(observeConfirm).observe(document.body,{subtree:true,childList:true});
    ReactDOM.render(<PickerPage/>, mount);
    observeConfirm();
}
