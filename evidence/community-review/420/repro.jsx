import React from 'react';
import ReactDOM from 'react-dom';
import Form from './packages/arcodesign/components/form';
import { Validator } from '@arco-design/mobile-utils';

const root = document.getElementById('mount');
function report(mode, name, values) {
    window.record(name, `${mode}   ${JSON.stringify(values)}`, { mode, name, values });
}
window.mountRule = mode => {
    ReactDOM.unmountComponentAtNode(root);
    const validator = (value, callback) => {
        if (mode === 'callback') return callback('boom');
        if (mode === 'throw') throw new Error('boom');
        return Promise.reject(new Error('boom'));
    };
    ReactDOM.render(
        <Form initialValues={{ name: 'A' }} onSubmit={v => report(mode, 'onSubmit', v)}
            onSubmitFailed={v => report(mode, 'onSubmitFailed', v)}>
            <Form.Item field="name" label="Name" rules={[{ validateLevel: 'warning', validator }]}><input /></Form.Item>
            <button type="submit">Submit warning rule ({mode})</button>
        </Form>, root,
    );
};
window.checkCollect = () => {
    const rules = { name: [{ validator: () => Promise.reject(new Error('boom')) }] };
    new Validator(rules, { first: false }).validate({ name: 'A' }, result => {
        window.record('Validator callback', `first = false   ${JSON.stringify(result)}`, { result });
    });
};
window.checkUnprintable = () => {
    let calls = 0;
    const start = performance.now();
    const rules = { name: [{ validator: () => Promise.reject(Object.create(null)) }] };
    new Validator(rules, {}).validate({ name: 'A' }, () => {
        calls += 1;
        window.record('Validator callback', `null-prototype reason   calls = ${calls}`, { calls });
    });
    setTimeout(() => {
        const elapsed = performance.now() - start;
        window.record('Timer read', `null-prototype reason   after ${Math.round(elapsed)} ms   callbacks = ${calls}`, { elapsed, calls });
    }, 500);
};
