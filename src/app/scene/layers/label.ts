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

/** A press that moves further than this is a map drag, not a click on the label. */
const CLICK_TOLERANCE_PIXELS = 5;

/**
 * Panning keeps the label under the pointer, so a plain `click` listener would also fire at the
 * end of a drag that started on a label.
 */
export function onClickWithoutDrag(element: HTMLElement, handler: () => void): void {
  let pressX = 0;
  let pressY = 0;
  element.addEventListener('pointerdown', (event) => {
    pressX = event.clientX;
    pressY = event.clientY;
  });
  element.addEventListener('click', (event) => {
    const moved = Math.hypot(event.clientX - pressX, event.clientY - pressY);
    if (moved <= CLICK_TOLERANCE_PIXELS) handler();
  });
}

export function setLabelText(label: CSS2DObject, text: string): void {
  const textElement = label.element.querySelector(`.${TEXT_CLASS}`);
  if (textElement && textElement.textContent !== text) textElement.textContent = text;
}
