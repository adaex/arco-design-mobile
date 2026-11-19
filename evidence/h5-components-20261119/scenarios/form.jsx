import React from 'react';
import ReactDOM from 'react-dom';
import Form from '../../../packages/arcodesign/components/form/index.tsx';
import { getMsgTemplate, messageTemplate } from '../../../packages/common-widgets/utils/validator/message.ts';

// 单独测查找函数，不改模板，也不把人为缺键的输入塞进 Form
function probeTemplate() {
    const values = ['items', 'number'];
    const lookup = key => {
        try {
            return { text: getMsgTemplate(messageTemplate, key, values) };
        } catch (error) {
            return { error: error.name, message: error.message };
        }
    };
    const missingParent = lookup('notExist');
    const missingChild = lookup('array.equal'); // #373 修正前使用的键
    const expected = 'items is not a number type';
    let status = 'inconclusive';
    if (missingParent.text === expected && !('equal' in messageTemplate.array)) {
        if (missingChild.error === 'TypeError') status = 'reproduced';
        if (missingChild.text === expected) status = 'normal';
    }
    return { status, missingParent, missingChild };
}

function Items({ value }) {
    return <output>{JSON.stringify(value)}</output>;
}

async function submitCase(root, value) {
    const host = document.createElement('div');
    root.appendChild(host);
    let timer;
    try {
        let finish;
        const result = new Promise(resolve => { finish = resolve; });
        const record = (callback, values, info) => finish({
            callback,
            value: values?.items,
            errors: Array.isArray(info) ? info.find(x => x.field === 'items')?.errors : undefined,
        });
        ReactDOM.render(
            <Form initialValues={{ items: value }}
                onSubmit={(...args) => record('onSubmit', ...args)}
                onSubmitFailed={(...args) => record('onSubmitFailed', ...args)}>
                <Form.Item field="items" rules={[{ type: 'array', deepEqual: [2] }]}>
                    <Items />
                </Form.Item>
                <button type="submit">提交</button>
            </Form>, host);
        // 用原生提交按钮，验证真实 Form 的 onSubmit 事件和字段注册，不调用内部方法
        timer = setTimeout(() => finish({ callback: 'timeout' }), 3000);
        host.querySelector('button').click();
        return await result;
    } catch (error) {
        return { callback: 'exception', message: String(error) };
    } finally {
        clearTimeout(timer);
        ReactDOM.unmountComponentAtNode(host);
        host.remove();
    }
}

function describeSubmit(value, result) {
    let observed = result.callback;
    if (observed === 'timeout') observed = '3 秒内未收到提交回调';
    else if (observed === 'exception') observed = result.message;
    else if (result.errors?.length) observed += `，提示「${result.errors.join('；')}」`;
    return `Form 提交 [${value}]，要求与 [2] 完全相等：${observed}`;
}

export async function form(root) {
    const template = probeTemplate();
    const failed = await submitCase(root, [1]);
    const passed = await submitCase(root, [2]);
    const failedAsExpected = failed.callback === 'onSubmitFailed' &&
        JSON.stringify(failed.value) === '[1]' && failed.errors?.length === 1 &&
        typeof failed.errors[0] === 'string' && failed.errors[0].includes('items') &&
        failed.errors[0].includes('[2]');
    const passedAsExpected = passed.callback === 'onSubmit' &&
        JSON.stringify(passed.value) === '[2]' && passed.errors?.length === 0;
    const showLookup = r => r.error ? `抛出 ${r.error}` : `返回「${r.text}」`;
    return {
        // 顶层只判公开提交；超时本身不能证明是缺键引起的挂起
        status: failedAsExpected && passedAsExpected ? 'normal' : 'inconclusive',
        observations: [
            describeSubmit(1, failed),
            describeSubmit(2, passed),
            `独立调用 getMsgTemplate：缺一级键 notExist ${showLookup(template.missingParent)}；缺二级键 array.equal ${showLookup(template.missingChild)}`,
        ],
        publicForm: { failed, passed },
        template,
    };
}
