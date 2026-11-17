import { TestBed } from '@angular/core/testing';
import { TimelineStore } from '../timeline/timeline-store';
import { UnitPanel } from './unit-panel';

describe('UnitPanel', () => {
  async function render(unitId: string, day = 0) {
    const store = TestBed.inject(TimelineStore);
    store.selectUnit(unitId);
    store.seek(day);
    const fixture = TestBed.createComponent(UnitPanel);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const badges = () => [...element.querySelectorAll('.badge')].map((e) => e.textContent?.trim());
    return { fixture, element, store, badges };
  }

  it('shows nothing when no unit is selected', async () => {
    const fixture = TestBed.createComponent(UnitPanel);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe('');
  });

  it('names the unit and its side, and says what the map shows at its location', async () => {
    const { element } = await render('xxxix-motorized-corps', 1);
    expect(element.querySelector('.faction')?.textContent?.trim()).toBe('德軍');
    expect(element.querySelector('h2')?.textContent).toBe('第 39 摩托化軍');
    expect(element.querySelector('.english-name')?.textContent).toBe('XXXIX Motorized Corps');
    expect(element.querySelector('.date')?.textContent).toBe('1941年6月23日');
    expect(element.querySelector('.description')?.textContent).toContain('第 7 裝甲師');
    expect(element.querySelector('.description')?.textContent).toContain('Woronowo');
    expect(element.querySelector('.placement')?.textContent).toContain('最靠前');
  });

  it('tells a reading the author checked from one only relayed to him', async () => {
    const checked = await render('xxxix-motorized-corps', 1);
    expect(checked.badges()).toEqual(['來源指明的位置', '已親自核對原圖或原文']);

    checked.store.seek(2);
    await checked.fixture.whenStable();
    expect(checked.badges()).toEqual(['來源指明的位置', '由他人讀出或轉述，尚未親自核對']);
  });

  it('labels an estimated location and explains the estimate', async () => {
    const { element, badges } = await render('xxxxvi-motorized-corps', 7);
    expect(badges()[0]).toBe('約略位置（估計）');
    expect(element.querySelector('.note')?.textContent).toContain('Kutschinka');
  });

  it('lists the sources of the position shown', async () => {
    const { element } = await render('soviet-4th-army', 1);
    expect(element.querySelector('.sources summary')?.textContent).toBe('來源（1）');
    expect(element.querySelector('.sources li')?.textContent).toContain('Сандалов');
  });

  it('says so on a day when no source places the unit', async () => {
    const { element } = await render('soviet-13th-army', 7);
    expect(element.querySelector('.absent')?.textContent).toContain('沒有來源記載');
    expect(element.querySelector('.description')).toBeNull();
    expect(element.querySelector('.sources')).toBeNull();
  });

  it('closes when asked', async () => {
    const { fixture, element, store } = await render('lvii-motorized-corps');
    element.querySelector<HTMLButtonElement>('.close')!.click();
    await fixture.whenStable();
    expect(store.selectedUnit()).toBeUndefined();
    expect(element.textContent?.trim()).toBe('');
  });
});
