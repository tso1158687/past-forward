import { MAX_TRAVEL_SECONDS, travelTo } from './story';

describe('travelTo', () => {
  it('plays forwards through the days in between at a day a second', () => {
    expect(travelTo(2, 5)).toEqual({ kind: 'play', daysPerSecond: 1 });
  });

  it('plays faster when the gap is long, so that the reader waits at most a few seconds', () => {
    const travel = travelTo(0, 12);
    expect(travel).toEqual({ kind: 'play', daysPerSecond: 12 / MAX_TRAVEL_SECONDS });
  });

  it('jumps when going back or staying on the same day', () => {
    expect(travelTo(6, 2)).toEqual({ kind: 'jump' });
    expect(travelTo(6, 6)).toEqual({ kind: 'jump' });
  });
});
