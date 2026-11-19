import React from 'react';
import ReactDOM from 'react-dom';
import Notify from '../../../packages/arcodesign/components/notify/index.tsx';
import CountDown from '../../../packages/arcodesign/components/count-down/index.tsx';
import ArcoImage from '../../../packages/arcodesign/components/image/index.tsx';

const delay = ms => new Promise(resolve => window.setTimeout(resolve, ms));
const clock = () => {
    const origin = performance.now();
    return () => Math.round((performance.now() - origin) * 10) / 10;
};

async function waitFor(test, timeout) {
    const deadline = performance.now() + timeout;
    while (!test()) {
        if (performance.now() >= deadline) return false;
        await delay(20);
    }
    return true;
}

async function observeNotify(host, replaceCallback) {
    const now = clock();
    const original = [];
    const updated = [];
    const duration = 200;
    const selector = '.timing-notification';
    const snapshot = () => ({
        ms: now(),
        mounts: host.childElementCount,
        notices: host.querySelectorAll(selector).length,
    });
    const before = snapshot();
    const handle = Notify.info({
        className: selector.slice(1),
        content: '通知关闭验证',
        duration: 0,
        transitionDuration: duration,
        getContainer: () => host,
        onClose: () => original.push(now()),
    });
    const opened = await waitFor(() => {
        const node = host.querySelector(selector);
        const target = node && parseFloat(node.style.height);
        return target > 0 && Math.abs(node.getBoundingClientRect().height - target) < 1;
    }, 1500);
    const open = snapshot();
    if (replaceCallback) handle.update({ onClose: () => updated.push(now()) });
    const closeAt = now();
    handle.close();
    const immediate = snapshot();
    await delay(duration + 300);
    const final = snapshot();
    return { opened, before, open, closeAt, immediate, final, original, updated, duration };
}

export async function notify(root) {
    const left = React.createRef();
    const right = React.createRef();
    ReactDOM.render(<><div ref={left} /><div ref={right} /></>, root);
    const [control, changed] = await Promise.all([
        observeNotify(left.current, false), observeNotify(right.current, true),
    ]);
    const validOpen = r => r.opened && r.before.mounts === 0 && r.open.mounts === 1 && r.open.notices === 1;
    const cleared = r => r.final.mounts === 0 && r.final.notices === 0;
    const valid = validOpen(control) && validOpen(changed) && cleared(control) &&
        control.original.length === 1 && changed.original.length === 0 && changed.updated.length === 1;
    let status = 'inconclusive';
    if (valid && cleared(changed)) status = 'normal';
    if (valid && changed.final.mounts === 1) status = 'reproduced';
    const describe = (label, r) => `${label}：${r.opened ? '已展开' : '未确认展开'}，关闭当下挂载节点 ${r.immediate.mounts} 个，` +
        `${Math.round(r.final.ms - r.closeAt)} ms 后剩 ${r.final.mounts} 个、通知 ${r.final.notices} 个；` +
        `原回调 ${r.original.length} 次，新回调 ${r.updated.length} 次`;
    return { status, observations: [describe('原回调对照', control), describe('更新 onClose', changed)], control, changed };
}

export async function countdown(root) {
    const now = clock();
    const counts = [0, 0];
    const events = [];
    const refs = [React.createRef(), React.createRef()];
    const snapshot = () => ({ ms: now(), counts: counts.slice() });
    let startAt, startWall, latestStartWall, firstTick, firstFrame, frameId;
    let stayedVisible = !document.hidden;
    const visibility = () => { if (document.hidden) stayedVisible = false; };
    document.addEventListener('visibilitychange', visibility);

    function finished(index) {
        counts[index] += 1;
        events.push({ instance: index === 0 ? 'A' : 'B', ms: now(), wall: Date.now() });
        if (events.length === 1) {
            // 两个回调都可能在组件的同一次队列遍历里执行，须等该任务返回再取数
            Promise.resolve().then(() => { firstTick = snapshot(); });
            frameId = requestAnimationFrame(() => { firstFrame = snapshot(); });
        }
    }
    function Pair() {
        React.useEffect(() => {
            startAt = now();
            startWall = Date.now();
            refs[0].current.start();
            refs[1].current.start();
            latestStartWall = Date.now();
        }, []);
        return <>{refs.map((ref, i) => <div key={i}>
            {i === 0 ? 'A' : 'B'} <CountDown ref={ref} time={1000} autoStart={false}
                format="s" onFinish={() => finished(i)} />
        </div>)}</>;
    }
    try {
        ReactDOM.render(<Pair />, root);
        await delay(3300);
        const final = snapshot();
        const first = events[0];
        // start() 内部使用 Date.now()。同一毫秒启动，或首次结束时两个截止时刻都已到达，才比较批次
        const sameDeadlineOrBothDue = !!first && (startWall === latestStartWall || first.wall >= latestStartWall + 1000);
        const onceEach = s => s && s.counts[0] === 1 && s.counts[1] === 1;
        const onlyA = s => s && s.counts[0] === 1 && s.counts[1] === 0;
        const enoughTime = events.length > 0 && final.ms - events[events.length - 1].ms >= 1000;
        let status = 'inconclusive';
        if (stayedVisible && sameDeadlineOrBothDue && enoughTime && onceEach(final)) {
            if (onlyA(firstTick) && onlyA(firstFrame)) status = 'reproduced';
            if (onceEach(firstTick) && onceEach(firstFrame)) status = 'normal';
        }
        const show = s => s ? `[${s.counts.join(', ')}]（启动后 ${Math.round(s.ms - startAt)} ms）` : '未采到';
        const times = events.map(e => `${e.instance} ${Math.round(e.ms - startAt)} ms`).join('、') || '未收到';
        return {
            status,
            observations: [`两个 1000 ms 倒计时，onFinish 到时：${times}`,
                `首个结束任务返回后 ${show(firstTick)}，紧接的绘制帧 ${show(firstFrame)}`,
                `最终 ${show(final)}；${sameDeadlineOrBothDue ? '已确认同批到期' : '到期边界未确认'}，${stayedVisible ? '页面持续可见' : '页面曾隐藏'}`],
            startAt, startWall, latestStartWall, sameDeadlineOrBothDue, stayedVisible, events, firstTick, firstFrame, final,
        };
    } finally {
        document.removeEventListener('visibilitychange', visibility);
        if (frameId !== undefined) cancelAnimationFrame(frameId);
        refs.forEach(ref => ref.current && ref.current.pause());
    }
}

export async function image(root) {
    const now = clock();
    const src = new URL('timing-cache-check.png', document.baseURI).href;
    const warm = new window.Image();
    const state = img => img && ({ complete: img.complete, width: img.naturalWidth, height: img.naturalHeight });
    const ready = s => s && s.complete && s.width > 0;
    let preload;
    warm.onload = e => { preload = { event: e.type, trusted: e.isTrusted, ms: now(), ...state(warm) }; };
    warm.onerror = e => { preload = { event: e.type, trusted: e.isTrusted, ms: now(), ...state(warm) }; };
    warm.src = src;
    await waitFor(() => preload, 3000);
    warm.onload = warm.onerror = null;
    if (!preload || preload.event !== 'load' || !preload.trusted || !ready(preload)) {
        return { status: 'inconclusive', observations: [`预载图片${preload ? '失败' : '超时'}，自然宽度 ${warm.naturalWidth} px`], preload };
    }

    const loads = [], callbacks = [], errors = [];
    let commit;
    const target = () => root.querySelector('img');
    const nativeLoad = e => {
        if (e.target === target()) loads.push({ ms: now(), trusted: e.isTrusted, ...state(e.target) });
    };
    function CachedPicture() {
        React.useLayoutEffect(() => { commit = { ms: now(), ...state(target()) }; }, []);
        return <ArcoImage src={src} staticLabel width={96} height={64} alt="缓存验证图"
            onError={e => errors.push({ ms: now(), event: e && e.type })}
            onLoad={(e, img) => callbacks.push({ ms: now(), event: e ? e.type : null,
                trusted: e ? e.isTrusted : null, sameImage: img === target() && img.src === src, ...state(img) })} />;
    }
    root.addEventListener('load', nativeLoad, true);
    try {
        ReactDOM.render(<CachedPicture />, root);
        await waitFor(() => loads.length || errors.length, 3000);
        await delay(250);
        const final = { ms: now(), ...state(target()) };
        const valid = loads.length === 1 && loads[0].trusted && ready(final) && !errors.length &&
            callbacks.every(c => c.sameImage && ready(c));
        const fallback = c => c.event === null;
        const native = c => c.event === 'load' && c.trusted;
        let status = 'inconclusive';
        if (valid && callbacks.length === 2 && fallback(callbacks[0]) && native(callbacks[1])) status = 'reproduced';
        if (valid && callbacks.length === 1 && (fallback(callbacks[0]) || (ready(commit) && native(callbacks[0])))) status = 'normal';
        const describe = callbacks.map(c => `${fallback(c) ? '挂载补发' : c.event} ${c.ms} ms`).join('、') || '无';
        return { status, observations: [
            `预载成功，挂载时 complete=${commit.complete}，自然宽度 ${commit.width} px`,
            `组件图片收到原生 load ${loads.length} 次，onLoad ${callbacks.length} 次（${describe}）`,
            `最终自然宽度 ${final.width} px，错误 ${errors.length} 次（${final.ms} ms）`,
        ], preload, commit, loads, callbacks, errors, final };
    } finally {
        root.removeEventListener('load', nativeLoad, true);
    }
}
