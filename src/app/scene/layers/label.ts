import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const TEXT_CLASS = 'label-text';

/**
 * A DOM label anchored to a scene position. DOM text keeps CJK names crisp without shipping a
 * font atlas. Styling lives in map-labels.css, keyed by `className`; the text sits in its own
 * element so that a label can also draw a marker shape next to it.
 */
export function createLabel(className: string, text: string): CSS2DObject {
  const element = document.createElement('div');
  element.className = className;
  const textElement = document.createElement('span');
  textElement.className = TEXT_CLASS;
  textElement.textContent = text;
  element.append(textElement);
  return new CSS2DObject(element);
}

export function setLabelText(label: CSS2DObject, text: string): void {
  const textElement = label.element.querySelector(`.${TEXT_CLASS}`);
  if (textElement && textElement.textContent !== text) textElement.textContent = text;
}
