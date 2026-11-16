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

  it('starts paused on the first day of the scenario', () => {
    const store = TestBed.inject(TimelineStore);
    expect(store.timeline()).toMatchObject({ currentDay: 0, playing: false });
    expect(store.currentDate()).toEqual({ year: 1941, month: 6, day: 22 });
    expect(pendingFrames).toHaveLength(0);
  });

  it('advances by real elapsed time while playing', () => {
    const store = TestBed.inject(TimelineStore);
    store.setSpeed(2);
    store.play();
    runFrame(1000);
    runFrame(1100);
    runFrame(1200);
    expect(store.timeline().currentDay).toBeCloseTo(0.4);
  });

  it('stops requesting frames once paused, and resumes from the same day', () => {
    const store = TestBed.inject(TimelineStore);
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
    const store = TestBed.inject(TimelineStore);
    store.play();
    runFrame(0);
    runFrame(30_000);
    expect(store.timeline().currentDay).toBeCloseTo(0.25);
  });

  it('pauses by itself at the end of the scenario', () => {
    const store = TestBed.inject(TimelineStore);
    store.seek(18.9);
    store.play();
    runFrame(0);
    runFrame(200);
    expect(store.timeline()).toMatchObject({ currentDay: 19, playing: false });
    expect(store.currentDate()).toEqual({ year: 1941, month: 7, day: 10 });
    expect(pendingFrames).toHaveLength(0);
  });

  it('updates the world state when seeking', () => {
    const store = TestBed.inject(TimelineStore);
    store.seek(2);
    const before = store.worldState();
    store.seek(8);
    expect(store.worldState()).not.toEqual(before);
    expect(store.worldState().day).toBe(8);
  });
});
