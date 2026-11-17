import { TestBed } from '@angular/core/testing';
import { TimelineStore } from './timeline-store';

describe('TimelineStore', () => {
  let pendingFrames: FrameRequestCallback[];
  /** Runs the frame the store asked for, as if the browser called it at `timeMs`. */
  const runFrame = (timeMs: number) => pendingFrames.shift()?.(timeMs);

  beforeEach(() => {
    pendingFrames = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      pendingFrames.push(callback),
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  function setUp() {
    const store = TestBed.inject(TimelineStore);
    const eventById = (id: string) => store.scenario.events.find((event) => event.id === id)!;
    return { store, eventById };
  }

  describe('playback', () => {
    it('starts paused on the first day of the scenario', () => {
      const { store } = setUp();
      expect(store.timeline()).toMatchObject({ currentDay: 0, playing: false });
      expect(store.currentDate()).toEqual({ year: 1941, month: 6, day: 22 });
      expect(pendingFrames).toHaveLength(0);
    });

    it('advances by real elapsed time while playing', () => {
      const { store } = setUp();
      store.setSpeed(2);
      store.play();
      runFrame(1000);
      runFrame(1100);
      runFrame(1200);
      expect(store.timeline().currentDay).toBeCloseTo(0.4);
    });

    it('stops requesting frames once paused, and resumes from the same day', () => {
      const { store } = setUp();
      store.play();
      runFrame(0);
      runFrame(200);
      store.pause();
      runFrame(400);
      expect(pendingFrames).toHaveLength(0);
      const pausedAt = store.timeline().currentDay;

      store.play();
      runFrame(60_000);
      expect(store.timeline().currentDay).toBe(pausedAt);
    });

    it('does not leap forward after a long gap between frames', () => {
      const { store } = setUp();
      store.play();
      runFrame(0);
      runFrame(30_000);
      expect(store.timeline().currentDay).toBeCloseTo(0.25);
    });

    it('pauses by itself at the end of the scenario, still showing 9 July', () => {
      const { store } = setUp();
      store.seek(17.9);
      store.play();
      runFrame(0);
      runFrame(200);
      expect(store.timeline()).toMatchObject({ currentDay: 18, playing: false });
      expect(store.currentDate()).toEqual({ year: 1941, month: 7, day: 9 });
      expect(pendingFrames).toHaveLength(0);
    });
  });

  describe('events', () => {
    const idsOf = (events: readonly { id: string }[]) => events.map((event) => event.id);

    it('reports the events of the current day', () => {
      const { store } = setUp();
      expect(idsOf(store.worldState().events)).toEqual(['invasion', 'neman-bridges']);
      store.seek(6.5);
      expect(idsOf(store.worldState().events)).toEqual(['minsk-falls', 'inner-ring']);
      store.seek(5);
      expect(store.worldState().events).toEqual([]);
    });

    it('has nothing selected until the user picks an event', () => {
      const { store } = setUp();
      expect(store.selectedEvent()).toBeUndefined();
    });

    it('selecting an event pauses on its first day', () => {
      const { store, eventById } = setUp();
      store.play();
      store.selectEvent(eventById('grodno-counterattack'));
      expect(store.timeline()).toMatchObject({ currentDay: 1, playing: false });
      expect(store.selectedEvent()?.id).toBe('grodno-counterattack');
    });

    it('keeps the selection while the timeline stays within the event, and drops it outside', () => {
      const { store, eventById } = setUp();
      store.selectEvent(eventById('grodno-counterattack'));
      store.seek(3.9);
      expect(store.selectedEvent()?.id).toBe('grodno-counterattack');
      store.seek(4);
      expect(store.selectedEvent()).toBeUndefined();
    });

    it('steps from the selected event to its neighbours in the list', () => {
      const { store, eventById } = setUp();
      store.selectEvent(eventById('minsk-falls'));
      expect(store.previousEvent()?.id).toBe('slonim-withdrawal');
      expect(store.nextEvent()?.id).toBe('inner-ring');
    });

    it('steps from the current day when nothing is selected', () => {
      const { store } = setUp();
      store.seek(5);
      expect(store.previousEvent()?.id).toBe('slonim-withdrawal');
      expect(store.nextEvent()?.id).toBe('minsk-falls');
    });

    it('starts with the first event of the first day, without skipping it', () => {
      const { store } = setUp();
      expect(store.previousEvent()).toBeUndefined();
      expect(store.nextEvent()?.id).toBe('invasion');
    });

    it('has no next event after the last one', () => {
      const { store, eventById } = setUp();
      store.selectEvent(eventById('battle-ends'));
      expect(store.nextEvent()).toBeUndefined();
    });
  });
});
