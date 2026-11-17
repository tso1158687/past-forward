import { TestBed } from '@angular/core/testing';
import { HistoricalEvent } from '../../core/history/historical-event';
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
    const chosen: HistoricalEvent[] = [];
    fixture.componentInstance.eventChosen.subscribe((event) => chosen.push(event));
    await fixture.whenStable();
    return {
      fixture,
      element: fixture.nativeElement as HTMLElement,
      store: TestBed.inject(TimelineStore),
      chosen,
    };
  }

  it('shows the first day of the scenario', async () => {
    const { element } = await render();
    expect(element.querySelector('.date strong')?.textContent).toBe('1941年6月22日');
    expect(element.querySelector('.day-counter')?.textContent).toBe('第 1 天／共 18 天');
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
    expect(await dragTo(18)).toBe('1941年7月9日');
    expect(await dragTo(1.2)).toBe('1941年6月23日');
  });

  it('changes the playback speed', async () => {
    const { element, store } = await render();
    const select = element.querySelector<HTMLSelectElement>('.speed select')!;
    select.value = '4';
    select.dispatchEvent(new Event('change'));
    expect(store.timeline().daysPerSecond).toBe(4);
  });

  it('marks every event on the track, coloured by how well it is supported', async () => {
    const { element, store } = await render();
    const markers = [...element.querySelectorAll<HTMLButtonElement>('.event-marker')];
    expect(markers).toHaveLength(store.scenario.events.length);
    const certaintyOf = (title: string) =>
      markers.find((m) => m.getAttribute('aria-label') === title)?.getAttribute('data-certainty');
    expect(certaintyOf('明斯克陷落')).toBe('confirmed');
    expect(certaintyOf('德軍渡過別列津納河')).toBe('reported');
    expect(certaintyOf('外層包圍圈合攏')).toBe('disputed');
  });

  it('places a marker at the day of its event', async () => {
    const { element } = await render();
    const marker = element.querySelector<HTMLButtonElement>(
      '.event-marker[aria-label="明斯克陷落"]',
    )!;
    // Day 6 of 18.
    expect(parseFloat(marker.style.left)).toBeCloseTo((6 / 18) * 100);
    expect(parseFloat(marker.style.width)).toBeCloseTo((1 / 18) * 100);
  });

  it('reports the event when its marker is clicked', async () => {
    const { element, chosen } = await render();
    element.querySelector<HTMLButtonElement>('.event-marker[aria-label="明斯克陷落"]')!.click();
    expect(chosen.map((event) => event.id)).toEqual(['minsk-falls']);
  });

  it('does not show a demonstration badge for researched history', async () => {
    const { element } = await render();
    expect(element.querySelector('.demo-badge')).toBeNull();
  });
});
