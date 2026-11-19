import React from 'react';
import ReactDOM from 'react-dom';
import Keyboard from '../../../packages/arcodesign/components/keyboard/index.tsx';
import Tabs from '../../../packages/arcodesign/components/tabs/index.tsx';
import Uploader from '../../../packages/arcodesign/components/uploader/index.tsx';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const result = (status, ...observations) => ({ status, observations });
const noop = () => {};

// 每项只卸载自己创建的节点，包括 Keyboard 通过 Portal 挂载的内容
async function inScene(root, measure) {
    try {
        if (!root || !root.isConnected) throw new Error('挂载容器未连接到页面');
        const scene = root.ownerDocument.createElement('section');
        const view = root.ownerDocument.createElement('div');
        scene.appendChild(view);
        root.appendChild(scene);
        try {
            return await measure(scene, view);
        } finally {
            try {
                ReactDOM.unmountComponentAtNode(view);
            } finally {
                scene.remove();
            }
        }
    } catch (error) {
        return result('inconclusive', `测量出错：${error.message || String(error)}`);
    }
}

function AfterMount({ ready, children }) {
    React.useEffect(() => { ready(); }, [ready]);
    return children;
}

function renderReady(view, component) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('组件挂载未在 3 秒内完成')), 3000);
        const ready = () => { clearTimeout(timer); resolve(); };
        try {
            ReactDOM.render(<AfterMount ready={ready}>{component}</AfterMount>, view);
        } catch (error) {
            clearTimeout(timer);
            reject(error);
        }
    });
}

async function openKeyboard(scene, view, key, randomOrder, ref) {
    await renderReady(view, <Keyboard key={key} ref={ref} visible randomOrder={randomOrder}
        close={noop} className="adm-check-keyboard" getContainer={() => scene} />);
    const deadline = performance.now() + 3000;
    do {
        const node = scene.querySelector('.adm-check-keyboard');
        if (node && node.isConnected && node.offsetWidth && node.offsetHeight) return node;
        await delay(25);
    } while (performance.now() < deadline);
    throw new Error('3 秒内未找到有尺寸的键盘节点');
}

export async function keyboard(root) {
    return inScene(root, async (scene, view) => {
        const ref = React.createRef();
        const node = await openKeyboard(scene, view, 'first', false, ref);
        const handle = ref.current;
        const same = handle && handle.keyboard === node;
        const value = !handle ? '未取得句柄' : same ? '指向页面键盘' :
            handle.keyboard === null ? 'null' : '与页面键盘不符';
        return result(handle ? (same ? 'normal' : 'reproduced') : 'inconclusive',
            `首次 visible，键盘尺寸 ${node.offsetWidth} × ${node.offsetHeight} px，按钮 ${node.querySelectorAll('button').length} 个`,
            `ref.current.keyboard：${value}`);
    });
}

function digits(node) {
    const sequence = Array.from(node.querySelectorAll('button'), button => button.textContent.trim())
        .filter(text => /^\d$/.test(text)).join('');
    if ([...sequence].sort().join('') !== '0123456789') {
        throw new Error(`数字键读取不全，读到「${sequence}」`);
    }
    return sequence;
}

export async function order(root) {
    return inScene(root, async (scene, view) => {
        const baseline = digits(await openKeyboard(scene, view, 'before', false));
        const observations = [`乱序前普通键盘：${baseline}`];
        if (baseline !== '1234567890') {
            return result('inconclusive', ...observations, '起始顺序已异常，请刷新页面后重试');
        }
        for (let attempt = 1; attempt <= 3; attempt++) {
            const random = digits(await openKeyboard(scene, view, `random-${attempt}`, true));
            observations.push(`第 ${attempt} 次乱序键盘：${random}`);
            if (random === baseline) continue;
            const after = digits(await openKeyboard(scene, view, 'after', false));
            observations.push(`新挂载的普通键盘：${after}`);
            if (after === baseline) return result('normal', ...observations);
            if (after === random) return result('reproduced', ...observations);
            return result('inconclusive', ...observations, '后续顺序与前两次均不同');
        }
        return result('inconclusive', ...observations, '三次随机排列都恰好与普通顺序相同');
    });
}

// 只读取浏览器派发到目标或其子节点的可信事件。松手后再留 400 ms 接收点击及滚动
async function observeTouch(target, marker, onStart) {
    const names = ['touchstart', 'touchmove', 'touchend', 'touchcancel', 'scroll', 'contextmenu', 'click'];
    const counts = Object.fromEntries(names.map(name => [name, 0]));
    let start, last, id, startTime, elapsed = 0, maxDrift = 0, multiple = false;
    let topBefore = target.scrollTop;
    let stop;
    const done = new Promise(resolve => { stop = resolve; });
    let pageError;
    function recordError(event) {
        pageError = event.message || String(event.reason || '未知错误');
        stop(`页面出错：${pageError}`);
    }
    function record(event) {
        if (!event.isTrusted) return;
        const type = event.type;
        if (type === 'scroll' && event.target !== target) return;
        if (type === 'touchstart' && !start) {
            const touch = event.changedTouches[0];
            start = last = { x: touch.clientX, y: touch.clientY };
            startTime = event.timeStamp;
            id = touch.identifier;
            topBefore = target.scrollTop;
            onStart(event);
        }
        if (!start) return;
        counts[type]++;
        if (!event.changedTouches) return;
        if (event.touches.length > 1 || counts.touchstart > 1) multiple = true;
        const touch = Array.from(event.changedTouches).find(point => point.identifier === id);
        if (!touch) return;
        last = { x: touch.clientX, y: touch.clientY };
        maxDrift = Math.max(maxDrift, Math.hypot(last.x - start.x, last.y - start.y));
        if (type === 'touchend' || type === 'touchcancel') {
            elapsed = Math.round(event.timeStamp - startTime);
            stop(type);
        }
    }
    const options = { capture: true, passive: true };
    names.forEach(name => target.addEventListener(name, record, options));
    window.addEventListener('error', recordError);
    window.addEventListener('unhandledrejection', recordError);
    const timer = setTimeout(() => stop('等待手势超时（45 秒）'), 45000);
    try {
        target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        target.dataset.gesture = marker;
        let end = await done;
        if (end === 'touchend' || end === 'touchcancel') await delay(400);
        if (pageError) end = `页面出错：${pageError}`;
        if (!target.isConnected) end = '手势目标已离开页面';
        return { counts, end, multiple, elapsed, maxDrift: Math.round(maxDrift),
            dx: start ? Math.round(last.x - start.x) : 0, dy: start ? Math.round(last.y - start.y) : 0,
            topBefore, topAfter: target.scrollTop };
    } finally {
        clearTimeout(timer);
        names.forEach(name => target.removeEventListener(name, record, options));
        window.removeEventListener('error', recordError);
        window.removeEventListener('unhandledrejection', recordError);
        delete target.dataset.gesture;
    }
}

function touchLine({ counts, end, multiple }) {
    return `原生触摸：开始 ${counts.touchstart}，移动 ${counts.touchmove}，结束 ${counts.touchend}，取消 ${counts.touchcancel}；${end}${multiple ? '，出现额外触点' : ''}`;
}

export async function tabs(root) {
    return inScene(root, async (scene, view) => {
        let calls = 0, changes = 0, lastIndex;
        const labels = [{ title: '第一段' }, { title: '第二段' }, { title: '第三段' }];
        const getPane = () => scene.querySelector('.adm-check-scroll-pane');
        await renderReady(view, <>
            <p>在下方内容框内，从下往上滑动半个框高后松手</p>
            <Tabs mode="scroll" tabs={labels} tabPaneClass="adm-check-scroll-pane"
                tabPaneStyle={{ height: '38vh', maxHeight: '220px', overflowY: 'auto', touchAction: 'pan-y',
                    overscrollBehaviorY: 'contain', outline: '2px solid #31689e' }}
                getScrollContainer={getPane} scrollThrottle={0} scrollWhenMounted={false}
                onScroll={() => { calls++; }}
                onChange={(_, index) => { changes++; lastIndex = index; }}>
                {labels.map(({ title }) => <div key={title} style={{ height: 260, padding: 12 }}>{title}内容</div>)}
            </Tabs>
        </>);
        const pane = getPane();
        if (!pane || !pane.clientHeight || pane.scrollHeight <= pane.clientHeight) {
            return result('inconclusive', 'Tabs 内容区未形成可滚动区域');
        }
        let callsBefore = 0, changesBefore = 0;
        const sample = await observeTouch(pane, 'swipe', () => {
            callsBefore = calls;
            changesBefore = changes;
        });
        const publicCalls = calls - callsBefore;
        const valid = sample.end === 'touchend' && !sample.multiple && sample.dy < -20 &&
            -sample.dy > Math.abs(sample.dx) && sample.counts.scroll > 0 && sample.topAfter > sample.topBefore;
        return result(valid ? (publicCalls > 0 ? 'normal' : 'reproduced') : 'inconclusive',
            touchLine(sample), `手指纵移 ${sample.dy} px，原生 scroll ${sample.counts.scroll} 次，scrollTop 从 ${Math.round(sample.topBefore)} 到 ${Math.round(sample.topAfter)} px`,
            `公开 onScroll ${publicCalls} 次，onChange ${changes - changesBefore} 次${changes > changesBefore ? `，末次下标 ${lastIndex}` : ''}`);
    });
}

export async function upload(root) {
    return inScene(root, async (scene, view) => {
        const file = new File(['H5'], '长按验证.txt', { type: 'text/plain' });
        const item = { file, status: 'loaded' };
        const presses = [];
        let clicks = 0, onDelete = false;
        await renderReady(view, <>
            <p>按住下方文件行中央约 1.2 秒再松手，避开右侧删除图标</p>
            <Uploader files={[item]} limit={1} hideStatus
                onLongPress={(_, received, index) => { presses.push({ file: received.file, index }); }}
                onClick={() => { clicks++; }} />
        </>);
        const row = scene.querySelector('.arco-uploader-list-item');
        if (!row) return result('inconclusive', '未找到默认文件列表中的文件行');
        Object.assign(row.style, { display: 'flex', alignItems: 'center', minHeight: '64px',
            outline: '2px solid #31689e', userSelect: 'none', webkitUserSelect: 'none', webkitTouchCallout: 'none' });
        row.querySelector('.arco-uploader-list-item-container').style.flex = '1';
        let pressesBefore = 0, clicksBefore = 0;
        const sample = await observeTouch(row, 'hold', event => {
            onDelete = !!event.target.closest('.arco-uploader-list-item-delete');
            pressesBefore = presses.length;
            clicksBefore = clicks;
        });
        const observed = presses.slice(pressesBefore);
        const matches = observed.filter(call => call.file === file && call.index === 0).length;
        const valid = sample.end === 'touchend' && !sample.multiple && !onDelete && sample.elapsed >= 900 && sample.maxDrift <= 12;
        return result(valid ? (observed.length === 1 && matches === 1 ? 'normal' : 'reproduced') : 'inconclusive',
            touchLine(sample), `按住 ${sample.elapsed} ms，最大偏移 ${sample.maxDrift} px${onDelete ? '，按在删除区' : ''}`,
            `原生 contextmenu ${sample.counts.contextmenu} 次，click ${sample.counts.click} 次，公开 onClick ${clicks - clicksBefore} 次`,
            `公开 onLongPress ${observed.length} 次，文件与下标 0 匹配 ${matches} 次`);
    });
}
