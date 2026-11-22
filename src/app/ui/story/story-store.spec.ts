import { TestBed } from '@angular/core/testing';
import { TimelineStore } from '../timeline/timeline-store';
import { StoryStore } from './story-store';

describe('StoryStore', () => {
  beforeEach(() => {
    // The story's journeys ask for animation frames; none are run here.
    vi.stubGlobal('requestAnimationFrame', () => 0);
  });

  afterEach(() => vi.unstubAllGlobals());

  function setUp() {
    return { story: TestBed.inject(StoryStore), timeline: TestBed.inject(TimelineStore) };
  }

  it('is not running until started', () => {
    const { story } = setUp();
    expect(story.active()).toBe(false);
    expect(story.currentStop()).toBeUndefined();
    expect(story.resumeIndex()).toBeNull();
  });

  it('starts on the first stop and moves between stops', () => {
    const { story, timeline } = setUp();
    story.start();
    expect(story.currentStop()?.id).toBe('chapter');

    story.next();
    expect(story.currentIndex()).toBe(1);
    story.previous();
    expect(story.currentIndex()).toBe(0);
    story.previous();
    expect(story.currentIndex()).toBe(0);
    expect(timeline.userActions()).toBe(0);
  });

  it('jumps back when going to an earlier stop', () => {
    const { story, timeline } = setUp();
    story.start();
    const minsk = story.stops.findIndex((stop) => stop.id === 'minsk-falls');
    for (let i = 0; i < minsk; i++) story.next();
    timeline.travelTo(6);
    story.previous();
    expect(timeline.timeline()).toMatchObject({ currentDay: story.stops[minsk - 1].day });
  });

  it('steps aside when the user moves the timeline, and resumes from the same stop', () => {
    const { story, timeline } = setUp();
    story.start();
    story.next();
    story.next();
    timeline.seek(10);
    expect(story.active()).toBe(false);
    expect(story.currentStop()).toBeUndefined();
    expect(story.resumeIndex()).toBe(2);

    story.resume();
    expect(story.active()).toBe(true);
    expect(story.currentIndex()).toBe(2);
  });

  it('does not go past the last stop, and can be left', () => {
    const { story } = setUp();
    story.start();
    for (let i = 0; i < story.stops.length + 2; i++) story.next();
    expect(story.currentIndex()).toBe(story.stops.length - 1);
    story.leave();
    expect(story.active()).toBe(false);
  });

  it('stops the timeline where it is when the story is left on the way to a stop', () => {
    const { story, timeline } = setUp();
    story.start();
    const ring = story.stops.findIndex((stop) => stop.id === 'bialystok-ring');
    for (let i = 0; i < ring; i++) story.next();
    expect(timeline.timeline().playing).toBe(true);
    story.leave();
    expect(timeline.timeline().playing).toBe(false);
    expect(timeline.timeline().currentDay).toBe(0);
  });
});
