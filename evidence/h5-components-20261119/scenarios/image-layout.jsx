import React from 'react';
import ReactDOM from 'react-dom';
import ArcoImage from '../../../packages/arcodesign/components/image/index.tsx';

const delay = ms => new Promise(resolve => window.setTimeout(resolve, ms));
const state = img => img && ({ complete: img.complete, width: img.naturalWidth, height: img.naturalHeight });
const ready = s => s && s.complete && s.width > 0;

async function round(root, src, updateLayout) {
    const start = performance.now();
    const now = () => Math.round((performance.now() - start) * 10) / 10;
    const warm = new window.Image();
    const preload = await new Promise(resolve => {
        const finish = e => {
            clearTimeout(timer);
            warm.onload = warm.onerror = null;
            resolve({ event: e && e.type, trusted: e && e.isTrusted, ms: now(), ...state(warm) });
        };
        const timer = setTimeout(() => finish(null), 3000);
        warm.onload = warm.onerror = finish;
        warm.src = src;
    });
    if (preload.event !== 'load' || !preload.trusted || !ready(preload)) {
        return { status: 'inconclusive', preload, reason: '预载图片失败或超时' };
    }
    await delay(0); // 两组都在预载事件完成后的独立任务内挂载

    const timeline = [], loads = [], callbacks = [], errors = [];
    const stamp = (phase, data) => {
        const record = { seq: timeline.length + 1, phase, ms: now(), ...data };
        timeline.push(record);
        return record;
    };
    let node, capturedLoad, commit, passive, layoutCommit, returned;
    const target = () => root.querySelector('img');
    const onLoad = (e, img) => callbacks.push(stamp('onLoad', {
        event: e && e.type, trusted: e && e.isTrusted, sameImage: img === node && img.src === src,
        isCapturedLoad: !!e && e === capturedLoad, ...state(img),
    }));
    const capture = e => {
        if (e.target !== target()) return;
        capturedLoad = e;
        loads.push(stamp('native-load', { trusted: e.isTrusted, sameImage: e.target === node, ...state(e.target) }));
    };
    function Panel() {
        const panel = React.useRef(null);
        const [width, setWidth] = React.useState(null);
        React.useLayoutEffect(() => {
            if (width === null) {
                node = target();
                const measured = panel.current.getBoundingClientRect().width;
                commit = stamp('layout-read', { measured, ...state(node) });
                if (updateLayout && measured > 0) setWidth(measured);
            } else {
                layoutCommit = stamp('layout-applied', { measured: width, sameImage: node === target(), ...state(node) });
            }
        }, [width]);
        React.useEffect(() => { passive = stamp('parent-passive', state(node)); }, []);
        // 模拟响应式图文卡：宽度仅用于排版说明文字；图片节点、src 和尺寸不随测量改变
        return <div ref={panel} style={{ display: 'flex', flexDirection: width !== null && width < 480 ? 'column' : 'row' }}>
            <ArcoImage src={src} staticLabel width={96} height={64} alt="缓存验证图" onLoad={onLoad}
                onError={e => errors.push(stamp('onError', { event: e && e.type }))} />
            <span>同源缓存图</span>
        </div>;
    }
    root.addEventListener('load', capture, true);
    try {
        ReactDOM.render(<Panel />, root);
        returned = stamp('render-return', state(target()));
        const until = performance.now() + 3000;
        while (!loads.length && !errors.length && performance.now() < until) await delay(20);
        await delay(250);
        const final = stamp('final', { sameImage: node === target(), ...state(target()) });
        const earlyPassive = !!passive && passive.seq < returned.seq;
        const applied = !!layoutCommit && layoutCommit.sameImage && layoutCommit.seq < returned.seq;
        const valid = commit && commit.measured > 0 && passive && (!updateLayout || applied) && ready(final) && final.sameImage &&
            loads.length === 1 && loads[0].trusted && loads[0].sameImage && !errors.length &&
            callbacks.every(c => c.sameImage && ready(c));
        const isNative = c => c.event === 'load' && c.trusted && c.isCapturedLoad;
        let status = 'inconclusive';
        if (valid && callbacks.length === 2 && callbacks[0].event === null && callbacks[0].seq < loads[0].seq && isNative(callbacks[1])) {
            status = 'reproduced';
        } else if (valid && callbacks.length === 1 && (isNative(callbacks[0]) || callbacks[0].event === null)) {
            status = 'normal';
        }
        return { status, preload, commit, layoutCommit, passive, earlyPassive, applied, loads, callbacks, errors, final, timeline };
    } finally {
        root.removeEventListener('load', capture, true);
    }
}

export async function layoutimage(root) {
    const src = new URL('timing-cache-check.png', document.baseURI).href;
    const control = await round(root, src, false);
    ReactDOM.unmountComponentAtNode(root);
    const changed = await round(root, src, true);
    const describe = (label, r) => {
        if (r.reason) return `${label}：${r.reason}`;
        const events = r.callbacks.map(c => `${c.event === null ? '挂载补发' : c.event} ${c.ms} ms`).join('、') || '无';
        return `${label}：实测宽 ${r.commit.measured.toFixed(1)} px，挂载时 complete=${r.commit.complete}；` +
            `原生 load ${r.loads.length} 次，onLoad ${r.callbacks.length} 次（${events}）`;
    };
    const observations = [describe('只读取容器宽度', control), describe('读宽度并更新父布局', changed)];
    if (control.passive && changed.passive) {
        const timing = r => r.earlyPassive ? '返回前' : '返回后';
        observations.push(`父组件 useEffect：对照在 render ${timing(control)}，更新组在 ${timing(changed)}；` +
            `父布局${changed.applied ? '已同步更新' : '未确认同步更新'}`);
    }
    // 状态针对更新组；即使对照也能复现，也不能说是父布局更新独有的问题
    const status = changed.status === 'normal' && (!changed.earlyPassive || control.status === 'inconclusive')
        ? 'inconclusive' : changed.status;
    return { status, observations, control, changed };
}
