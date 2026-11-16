import { TestBed } from '@angular/core/testing';
import { TimelineBar } from './timeline-bar';
import { TimelineStore } from './timeline-store';

describe('TimelineBar', () => {
  beforeEach(() => {
    // Playback asks for animation frames; these tests never need them to run.
    vi.stubGlobal('requestAnimationFrame', () => 1);
  });

  afterEach(() => vi.unstubAllGlobals());

  async function render() {
    const fixture = TestBed.createComponent(TimelineBar);
    await fixture.whenStable();
    return {
      fixture,
      element: fixture.nativeElement as HTMLElement,
      store: TestBed.inject(TimelineStore),
    };
  }

  it('shows the first day of the scenario', async () => {
    const { element } = await render();
    expect(element.querySelector('.date strong')?.textContent).toBe('1941年6月22日');
    expect(element.querySelector('.day-counter')?.textContent).toBe('第 1 天／共 19 天');
  });

  it('toggles between play and pause', async () => {
    const { fixture, element, store } = await render();
    const button = element.querySelector<HTMLButtonElement>('.play')!;
    expect(button.getAttribute('aria-label')).toBe('播放');

    button.click();
    await fixture.whenStable();
    expect(store.timeline().playing).toBe(true);
    expect(button.getAttribute('aria-label')).toBe('暫停');

    button.click();
    await fixture.whenStable();
    expect(store.timeline().playing).toBe(false);
  });

  it('moves the date when the scrubber is dragged, forwards and back', async () => {
    const { fixture, element } = await render();
    const scrubber = element.querySelector<HTMLInputElement>('.scrubber')!;
    const dragTo = async (day: number) => {
      scrubber.value = String(day);
      scrubber.dispatchEvent(new Event('input'));
      await fixture.whenStable();
      return element.querySelector('.date strong')?.textContent;
    };

    expect(await dragTo(9.5)).toBe('1941年7月1日');
    expect(await dragTo(19)).toBe('1941年7月10日');
    expect(await dragTo(1.2)).toBe('1941年6月23日');
  });

  it('changes the playback speed', async () => {
    const { element, store } = await render();
    const select = element.querySelector<HTMLSelectElement>('.speed select')!;
    select.value = '4';
    select.dispatchEvent(new Event('change'));
    expect(store.timeline().daysPerSecond).toBe(4);
  });
});
