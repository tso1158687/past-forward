import { CITIES } from './cities';

describe('cities', () => {
  it('has 26 places with unique ids', () => {
    expect(CITIES.length).toBe(26);
    expect(new Set(CITIES.map((city) => city.id)).size).toBe(CITIES.length);
  });

  it('says who held every place on 22 June 1941', () => {
    for (const city of CITIES) expect(city.in1941.heldBy['zh-TW'], city.id).toBeTruthy();
  });

  it('gives every place either an official name of 1941 or a note on why there is none', () => {
    for (const { id, in1941 } of CITIES) {
      if (in1941.officialNames.length === 0) expect(in1941.note?.['zh-TW'], id).toBeTruthy();
      for (const official of in1941.officialNames) {
        expect(official.name, id).toBeTruthy();
        expect(official.lang, id).toMatch(/^[a-z]{2}$/);
        expect(official.language['zh-TW'], id).toBeTruthy();
      }
    }
  });

  it('gives the atlas spelling only where it could be read, and explains the two where it could not', () => {
    const unread = CITIES.filter((city) => !city.in1941.atlasSpelling).map((city) => city.id);
    expect(unread).toEqual(['volkovysk', 'suwalki']);
    for (const id of unread) {
      expect(CITIES.find((city) => city.id === id)?.in1941.note?.['zh-TW']).toContain('看不清');
    }
  });

  it('has no official name for the three Baltic towns, and says what was found instead', () => {
    const baltic = ['vilnius', 'kaunas', 'daugavpils'];
    for (const city of CITIES.filter((c) => baltic.includes(c.id))) {
      expect(city.in1941.officialNames, city.id).toEqual([]);
      expect(city.in1941.note?.['zh-TW'], city.id).toContain('紅軍文件');
    }
  });
});
