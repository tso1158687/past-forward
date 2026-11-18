import { Component, input, output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { HistoricalBorder } from './core/history/scenario';
import { City } from './data/map/cities';
import type { PlaceMarker } from './scene/layers/place-layer';
import type { UnitMarker, UnitTrail, UnitTransition } from './scene/layers/unit-layer';
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
  readonly borders = input<readonly HistoricalBorder[]>([]);
  readonly units = input<readonly UnitMarker[]>([]);
  readonly unitTrails = input<readonly UnitTrail[]>([]);
  readonly unitTransition = input<UnitTransition>({ seconds: 0, easing: 'eased' });
  readonly places = input<readonly PlaceMarker[]>([]);
  readonly citySelected = output<string>();
  readonly unitSelected = output<string>();
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

  it('shows the brand and chapter, and says where unit positions come from', async () => {
    const { element } = await render();
    expect(element.querySelector('.brand')?.textContent).toContain('歷史進行式');
    expect(element.querySelector('h1')?.textContent).toContain('巴巴羅薩行動');
    expect(element.querySelector('.data-notice')?.textContent).toContain('1942 年德軍參謀本部圖集');
  });

  it('asks the map to draw both borders, and says where they come from and that one is no longer a border', async () => {
    const { element, map } = await render();
    expect(map.borders().map((border) => border.id)).toEqual([
      'german-soviet-1941',
      'polish-soviet-1939',
    ]);
    const notice = element.querySelector('.data-notice')?.textContent;
    expect(notice).toContain('OpenHistoricalMap');
    expect(notice).toContain('1941 年它已經不是國界');
  });

  const unitIds = (map: MapViewStub) => map.units().map((unit) => unit.id);

  it('puts on the map the units that a source places on the first day, and no demonstration badge', async () => {
    const { element, map } = await render();
    expect(unitIds(map)).toEqual([
      'xxiv-motorized-corps',
      'xxxxvii-motorized-corps',
      'xxxix-motorized-corps',
      'lvii-motorized-corps',
      'german-4th-army',
      'german-9th-army',
      'soviet-3rd-army',
      'soviet-10th-army',
      'soviet-4th-army',
    ]);
    expect(element.querySelector('.demo-badge')).toBeNull();
  });

  it('moves the units with the timeline and drops those without a source for the day', async () => {
    const { fixture, map, store } = await render();
    const corpsAt = () => map.units().find((unit) => unit.id === 'xxiv-motorized-corps')?.location;
    expect(corpsAt()).toEqual({ lon: 24, lat: 52 });

    store.seek(6.5);
    await fixture.whenStable();

    expect(corpsAt()).toEqual({ lon: 29.193, lat: 53.127 });
    expect(unitIds(map)).toContain('soviet-13th-army');
    expect(unitIds(map)).not.toContain('soviet-3rd-army');
  });

  it('draws a trail behind each unit and breaks it where the marker was re-placed', async () => {
    const { fixture, map, store } = await render();
    const linesOf = (unitId: string) =>
      map.unitTrails().find((trail) => trail.unitId === unitId)?.lines ?? [];
    expect(linesOf('xxiv-motorized-corps').map((line) => line.length)).toEqual([1]);
    expect(linesOf('xxxxvi-motorized-corps')).toEqual([]);

    store.seek(6.5);
    await fixture.whenStable();

    expect(linesOf('xxiv-motorized-corps').map((line) => line.length)).toEqual([7]);
    // The 12th Panzer Division led LVII Corps until 27 June; on the 28th the marker is re-placed.
    expect(linesOf('lvii-motorized-corps').map((line) => line.length)).toEqual([6, 1]);
    // The 3rd Army was last placed on 27 June; its trail stays although it is off the map today.
    expect(linesOf('soviet-3rd-army').map((line) => line.length)).toEqual([1, 1]);
  });

  it('slides the pieces at the pace of the playback', async () => {
    const { fixture, map, store } = await render();
    expect(map.unitTransition()).toEqual({ seconds: 0.6, easing: 'eased' });
    store.play();
    await fixture.whenStable();
    expect(map.unitTransition()).toEqual({ seconds: 1, easing: 'linear' });
    store.pause();
  });

  it('shows the selected unit with its sources, and keeps it selected when it leaves the map', async () => {
    const { fixture, element, map, store } = await render();
    expect(element.querySelector('app-unit-panel')).toBeNull();

    map.unitSelected.emit('soviet-3rd-army');
    await fixture.whenStable();

    expect(element.querySelector('app-unit-panel h2')?.textContent).toBe('第 3 集團軍');
    expect(element.querySelector('app-unit-panel .description')?.textContent).toContain('格羅德諾');
    expect(
      map
        .units()
        .filter((unit) => unit.selected)
        .map((unit) => unit.id),
    ).toEqual(['soviet-3rd-army']);

    store.seek(2);
    await fixture.whenStable();
    expect(element.querySelector('app-unit-panel .absent')?.textContent).toContain('沒有來源');

    element.querySelector<HTMLButtonElement>('app-unit-panel .close')!.click();
    await fixture.whenStable();
    expect(element.querySelector('app-unit-panel')).toBeNull();
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
