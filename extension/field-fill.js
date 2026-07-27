"use strict";
function getNativeValueSetter(element) {
    const prototype = element instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : element instanceof HTMLInputElement
            ? HTMLInputElement.prototype
            : null;
    if (!prototype) {
        return null;
    }
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    if (!setter) {
        return null;
    }
    return (value) => {
        setter.call(element, value);
    };
}
function dispatchInputLifecycleEvents(element) {
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.dispatchEvent(new Event("blur", { bubbles: true }));
}
function setSelectValue(select, value) {
    const normalized = value.trim();
    if (!normalized) {
        return false;
    }
    const options = Array.from(select.options);
    const exact = options.find((option) => option.value === normalized || option.text.trim() === normalized);
    if (exact) {
        select.value = exact.value;
        dispatchInputLifecycleEvents(select);
        return true;
    }
    const partial = options.find((option) => option.text.toLowerCase().includes(normalized.toLowerCase()) ||
        normalized.toLowerCase().includes(option.text.toLowerCase()));
    if (partial) {
        select.value = partial.value;
        dispatchInputLifecycleEvents(select);
        return true;
    }
    return false;
}
function setFormControlValue(element, value) {
    const nextValue = value.trim();
    if (!nextValue) {
        return false;
    }
    element.focus();
    if (element instanceof HTMLSelectElement) {
        return setSelectValue(element, nextValue);
    }
    const setNativeValue = getNativeValueSetter(element);
    if (setNativeValue) {
        setNativeValue(nextValue);
    }
    else {
        element.value = nextValue;
    }
    dispatchInputLifecycleEvents(element);
    return true;
}
