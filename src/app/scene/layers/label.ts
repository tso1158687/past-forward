import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

/**
 * A DOM label anchored to a scene position. DOM text keeps CJK names crisp without shipping a
 * font atlas. Styling lives in map-labels.css, keyed by `className`.
 */
export function createLabel(className: string, text: string): CSS2DObject {
  const element = document.createElement('div');
  element.className = className;
  element.textContent = text;
  return new CSS2DObject(element);
}
