import { Component, input, output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { City } from './data/map/cities';
import { MapView } from './ui/map-view/map-view';

/**
 * The real map needs WebGL, which the unit-test environment does not provide. The stub registers
 * itself under the MapView token so that App's view query still finds it.
 */
@Component({
  selector: 'app-map-view',
  template: '',
  providers: [{ provide: MapView, useExisting: MapViewStub }],
})
class MapViewStub {
  readonly cities = input.required<readonly City[]>();
  readonly citySelected = output<string>();
  readonly focusedLocations: unknown[] = [];
  focusOn(location: unknown): void {
    this.focusedLocations.push(location);
  }
  resetView(): void {
    // Not needed by these tests.
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
    return { fixture, element, map };
  }

  it('shows the brand, the chapter and states that the map has no historical data yet', async () => {
    const { element } = await render();
    expect(element.querySelector('.brand')?.textContent).toContain('歷史進行式');
    expect(element.querySelector('h1')?.textContent).toContain('巴巴羅薩行動');
    expect(element.querySelector('.data-notice')?.textContent).toContain('尚未包含任何部隊');
  });

  it('shows the selected city and asks the map to focus on it', async () => {
    const { fixture, element, map } = await render();
    expect(element.querySelector('.city-panel')).toBeNull();

    map.citySelected.emit('minsk');
    await fixture.whenStable();

    expect(element.querySelector('.city-panel h2')?.textContent).toContain('明斯克');
    expect(element.querySelector('.city-panel')?.textContent).toContain('53.90°N, 27.57°E');
    expect(map.focusedLocations).toEqual([{ lon: 27.565, lat: 53.902 }]);
  });
});
