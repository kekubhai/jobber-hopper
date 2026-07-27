function getNativeValueSetter(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
): ((value: string) => void) | null {
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

  return (value: string) => {
    setter.call(element, value);
  };
}

function dispatchInputLifecycleEvents(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): void {
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  element.dispatchEvent(new Event("blur", { bubbles: true }));
}

function setSelectValue(select: HTMLSelectElement, value: string): boolean {
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

  const partial = options.find((option) =>
    option.text.toLowerCase().includes(normalized.toLowerCase()) ||
    normalized.toLowerCase().includes(option.text.toLowerCase())
  );

  if (partial) {
    select.value = partial.value;
    dispatchInputLifecycleEvents(select);
    return true;
  }

  return false;
}

function setFormControlValue(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  value: string
): boolean {
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
  } else {
    element.value = nextValue;
  }

  dispatchInputLifecycleEvents(element);
  return true;
}
