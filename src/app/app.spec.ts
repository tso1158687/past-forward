import { Component, input, output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { City } from './data/map/cities';
import type { PlaceMarker } from './scene/layers/place-layer';
import type { UnitMarker } from './scene/layers/unit-layer';
import { MapView } from './ui/map-view/map-view';
import { TimelineStore } from './ui/timeline/timeline-store';

/**
 * The real map needs WebGL, which the unit-test environment does not provide. The stub registers
 * itself under the MapView token so that App's view query still finds it, and records what the
 * app asks the map to do.
 */
@Component({
  selector: 'app-map-view',
  template: '',
  providers: [{ provide: MapView, useExisting: MapViewStub }],
})
class MapViewStub {
  readonly cities = input.required<readonly City[]>();
  readonly units = input<readonly UnitMarker[]>([]);
  readonly places = input<readonly PlaceMarker[]>([]);
  readonly citySelected = output<string>();
  readonly cameraRequests: unknown[] = [];
  focusOn(location: unknown, distanceKm?: number): void {
    this.cameraRequests.push({ location, distanceKm });
  }
  resetView(): void {
    this.cameraRequests.push('reset');
  }
}

describe('App', () => {
  async function render() {
    TestBed.overrideComponent(App, {
      remove: { imports: [MapView] },
      add: { imports: [MapViewStub] },
    });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const map = fixture.debugElement.children
      .map((child) => child.componentInstance as unknown)
      .find((instance): instance is MapViewStub => instance instanceof MapViewStub)!;
    return { fixture, element, map, store: TestBed.inject(TimelineStore) };
  }

  const eventLink = (element: HTMLElement, title: string) =>
    [...element.querySelectorAll<HTMLButtonElement>('.event-link')].find((button) =>
      button.textContent?.includes(title),
    )!;

  it('shows the brand and chapter, and says that unit positions are not on the map yet', async () => {
    const { element } = await render();
    expect(element.querySelector('.brand')?.textContent).toContain('歷史進行式');
    expect(element.querySelector('h1')?.textContent).toContain('巴巴羅薩行動');
    expect(element.querySelector('.data-notice')?.textContent).toContain('位置尚未查證');
  });

  it('shows no units and no demonstration badge', async () => {
    const { element, map } = await render();
    expect(map.units()).toEqual([]);
    expect(element.querySelector('.demo-badge')).toBeNull();
  });

  it('shows the selected city and asks the map to focus on it', async () => {
    const { fixture, element, map } = await render();
    expect(element.querySelector('.city-panel')).toBeNull();

    map.citySelected.emit('minsk');
    await fixture.whenStable();

    expect(element.querySelector('.city-panel h2')?.textContent).toContain('明斯克');
    expect(element.querySelector('.city-panel')?.textContent).toContain('53.90°N, 27.57°E');
    expect(map.cameraRequests).toEqual([
      { location: { lon: 27.565, lat: 53.902 }, distanceKm: undefined },
    ]);
  });

  it('goes to an event: moves the timeline, points out its places and turns the camera', async () => {
    const { fixture, element, map, store } = await render();
    expect(map.places()).toEqual([]);

    eventLink(element, '尼曼河').click();
    await fixture.whenStable();

    expect(store.timeline()).toMatchObject({ currentDay: 0, playing: false });
    expect(element.querySelector('app-event-panel h2')?.textContent).toContain('尼曼河');
    expect(map.places().map((place) => place.label)).toEqual(['阿利圖斯', '梅爾基內']);
    expect(map.cameraRequests).toEqual([{ location: { lon: 24.1, lat: 54.25 }, distanceKm: 260 }]);
  });

  it('shows the whole map for an event that spans the whole front', async () => {
    const { fixture, element, map } = await render();
    eventLink(element, '德軍全線進攻').click();
    await fixture.whenStable();
    expect(map.places()).toEqual([]);
    expect(map.cameraRequests).toEqual(['reset']);
  });

  it('goes to an event clicked on the timeline track', async () => {
    const { fixture, element, store } = await render();
    element.querySelector<HTMLButtonElement>('.event-marker[aria-label="明斯克陷落"]')!.click();
    await fixture.whenStable();
    expect(store.timeline().currentDay).toBe(6);
    expect(element.querySelector('app-event-panel h2')?.textContent).toBe('明斯克陷落');
    expect(element.querySelector('.event-marker.selected')?.getAttribute('aria-label')).toBe(
      '明斯克陷落',
    );
  });

  it('stops pointing out places once the timeline leaves the event', async () => {
    const { fixture, element, map, store } = await render();
    eventLink(element, '尼曼河').click();
    await fixture.whenStable();
    store.seek(4.5);
    await fixture.whenStable();
    expect(map.places()).toEqual([]);
  });
});
