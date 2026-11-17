import { TestBed } from '@angular/core/testing';
import { HistoricalEvent } from '../../core/history/historical-event';
import { TimelineStore } from '../timeline/timeline-store';
import { EventPanel } from './event-panel';

describe('EventPanel', () => {
  async function render() {
    const fixture = TestBed.createComponent(EventPanel);
    const chosen: HistoricalEvent[] = [];
    fixture.componentInstance.eventChosen.subscribe((event) => chosen.push(event));
    await fixture.whenStable();
    const store = TestBed.inject(TimelineStore);
    const eventById = (id: string) => store.scenario.events.find((event) => event.id === id)!;
    return { fixture, element: fixture.nativeElement as HTMLElement, store, chosen, eventById };
  }

  it('lists the events of the current day when none is selected', async () => {
    const { element } = await render();
    expect(element.querySelector('.day-events .date')?.textContent).toBe('1941年6月22日');
    const titles = [...element.querySelectorAll('.event-link')].map((e) => e.textContent?.trim());
    expect(titles).toEqual(['德軍全線進攻', '第 3 裝甲集群奪取尼曼河上的橋']);
  });

  it('says so when the current day has no event', async () => {
    const { fixture, element, store } = await render();
    store.seek(5);
    await fixture.whenStable();
    expect(element.querySelector('.empty')?.textContent).toContain('這一天沒有事件節點');
  });

  it('asks for an event when it is clicked in the list', async () => {
    const { element, chosen } = await render();
    element.querySelector<HTMLButtonElement>('.event-link')!.click();
    expect(chosen.map((event) => event.id)).toEqual(['invasion']);
  });

  it('shows the selected event with its date, certainty and sources', async () => {
    const { fixture, element, store, eventById } = await render();
    store.selectEvent(eventById('outer-ring'));
    await fixture.whenStable();

    expect(element.querySelector('.event .date')?.textContent).toBe('1941年6月29日');
    expect(element.querySelector('h2')?.textContent).toBe('外層包圍圈合攏');
    expect(element.querySelector('.certainty')?.getAttribute('data-certainty')).toBe('disputed');
    expect(element.querySelector('.certainty-badge')?.textContent).toBe('各來源說法不一');
    expect(element.querySelector('.certainty-note')?.textContent).toContain('6 月 27 日');
    expect(element.querySelector('.sources summary')?.textContent).toBe('來源（3）');
    const kinds = [...element.querySelectorAll('.source-kind')].map((e) => e.textContent);
    expect(kinds).toEqual(['一手史料', '官方戰史', '學術著作']);
    expect(element.querySelector('.heading')?.textContent?.trim()).toBe('事件 8／12');
  });

  it('writes a multi-day event as a date range', async () => {
    const { fixture, element, store, eventById } = await render();
    store.selectEvent(eventById('grodno-counterattack'));
    await fixture.whenStable();
    expect(element.querySelector('.event .date')?.textContent).toBe('1941年6月23日至6月25日');
  });

  it('steps to the neighbouring events, and stops at both ends of the list', async () => {
    const { fixture, element, store, chosen, eventById } = await render();
    const [previous, next] = element.querySelectorAll<HTMLButtonElement>('.step');

    store.selectEvent(eventById('invasion'));
    await fixture.whenStable();
    expect(previous.disabled).toBe(true);
    next.click();
    expect(chosen.at(-1)?.id).toBe('neman-bridges');

    store.selectEvent(eventById('battle-ends'));
    await fixture.whenStable();
    expect(next.disabled).toBe(true);
    previous.click();
    expect(chosen.at(-1)?.id).toBe('lepel-counterstroke');
  });

  it('drops the selection when the timeline leaves the days of the event', async () => {
    const { fixture, element, store, eventById } = await render();
    store.selectEvent(eventById('minsk-falls'));
    await fixture.whenStable();
    expect(element.querySelector('h2')?.textContent).toBe('明斯克陷落');

    store.seek(9.5);
    await fixture.whenStable();
    expect(element.querySelector('.event')).toBeNull();
    expect(element.querySelector('.day-events .date')?.textContent).toBe('1941年7月1日');
  });
});
