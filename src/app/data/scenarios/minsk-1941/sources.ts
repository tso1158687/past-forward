import { HistoricalSource } from '../../../core/history/historical-event';

/**
 * Sources for the Białystok–Minsk chapter. How each one was consulted, and which quotations were
 * checked first-hand, is recorded in docs/research/minsk-events-verified.md (events) and
 * docs/research/minsk-unit-positions.md (unit positions).
 */
export const MINSK_SOURCES: readonly HistoricalSource[] = [
  {
    id: 'halder',
    citation:
      'Franz Halder, The Halder War Journal (U.S. Army translation), daily entries for June–July 1941.',
    kind: 'primary',
    url: 'https://archive.org/details/HalderWarJournal',
  },
  {
    id: 'dapam',
    citation:
      'U.S. Department of the Army, Pamphlet 20-261a, The German Campaign in Russia: Planning and Operations (1940–1942), 1955.',
    kind: 'official-history',
  },
  {
    id: 'krivosheev',
    citation:
      'Г. Ф. Кривошеев (ред.), Россия и СССР в войнах XX века: потери вооружённых сил, 2001. Белорусская стратегическая оборонительная операция.',
    kind: 'statistical',
    url: 'http://www.lib.ru/MEMUARY/1939-1945/KRIWOSHEEW/poteri.txt',
  },
  {
    id: 'hoth',
    citation: 'Hermann Hoth, Panzer Operations, Casemate, 2015 (first published 1956), ch. 3.',
    kind: 'memoir',
    url: 'https://www.perlego.com/book/2444022/panzer-operations-germanys-panzer-group-3-during-the-invasion-of-russia-1941-pdf',
  },
  {
    id: 'stahel',
    citation:
      "David Stahel, Operation Barbarossa and Germany's Defeat in the East, Cambridge University Press, 2009, ch. 5.",
    kind: 'scholarly',
    url: 'https://www.cambridge.org/core/books/operation-barbarossa-and-germanys-defeat-in-the-east/awakening-the-bear/90B4C3CB32E017D5FE0E1DB9D40299F8',
  },
  {
    id: 'stolfi',
    citation: "R. H. S. Stolfi, Hitler's Panzers East, 1992, ch. 8.",
    kind: 'scholarly',
    url: 'https://militera.lib.ru/h/stolfi/08.html',
  },
  {
    id: 'anfilov',
    citation: 'В. А. Анфилов, Начало Великой Отечественной войны, гл. 5.',
    kind: 'scholarly',
    url: 'http://militera.lib.ru/research/anfilov/05.html',
  },
  {
    id: 'guderian-fms',
    citation:
      'Heinz Guderian, Flank Defense in Far-Reaching Operations (post-war study for the U.S. Army).',
    kind: 'memoir',
    url: 'https://allworldwars.com/Flank-Defense-in-Far-Reaching-Operations-by-Heinz-Guderian.html',
  },
  {
    id: 'glantz',
    citation:
      'David M. Glantz, Barbarossa Derailed, vol. 1, Helion, 2010. Page numbers still to be confirmed.',
    kind: 'scholarly',
  },
  {
    id: 'okh-atlas',
    citation:
      'Generalstab des Heeres, Der Feldzug gegen Sowjet-Russland, Band I: Operationen Sommer–Herbst 1941, 1942. Daily situation maps ("Lage am … abds."), Library of Congress map51000141.',
    kind: 'primary',
  },
  {
    id: 'sandalov',
    citation: 'Л. М. Сандалов, Пережитое (воспоминания начальника штаба 4-й армии).',
    kind: 'memoir',
  },
  {
    id: 'boldin',
    citation:
      'И. В. Болдин, Страницы жизни (воспоминания заместителя командующего Западным фронтом).',
    kind: 'memoir',
  },
  {
    id: 'isaev',
    citation:
      'А. В. Исаев, Неизвестный 1941. Остановленный блицкриг, 2010, гл. «Контрудар группы Болдина».',
    kind: 'scholarly',
  },
  // Railways: when each line opened. Checked in docs/research/minsk-railways.md.
  {
    id: 'nes-moscow-brest',
    citation:
      '«Московско-Брестская железная дорога», Новый энциклопедический словарь (Брокгауз — Ефрон), 1911–1916.',
    kind: 'reference',
    url: 'https://ru.wikisource.org/wiki/НЭС/Московско-Брестская_железная_дорога',
  },
  {
    id: 'wiki-warsaw-terespol',
    citation: 'Wikipedia (en), «Warsaw–Terespol railway».',
    kind: 'reference',
    url: 'https://en.wikipedia.org/wiki/Warsaw%E2%80%93Terespol_railway',
  },
  {
    id: 'wiki-st-petersburg-warsaw',
    citation: 'Wikipedia (en), «Saint Petersburg–Warsaw railway».',
    kind: 'reference',
    url: 'https://en.wikipedia.org/wiki/Saint_Petersburg%E2%80%93Warsaw_railway',
  },
  {
    id: 'wiki-kaunas-kybartai',
    citation:
      'Wikipedia (en), «Kaunas railway station» 與 «Kybartai railway station»（引立陶宛鐵路博物館與立陶宛鐵路公司）。',
    kind: 'reference',
    url: 'https://en.wikipedia.org/wiki/Kybartai_railway_station',
  },
  {
    id: 'wiki-libau-romny',
    citation: 'Википедия (ru), «Либаво-Роменская железная дорога»（引 РГИА, ф. 446, оп. 27）.',
    kind: 'reference',
    url: 'https://ru.wikipedia.org/wiki/Либаво-Роменская_железная_дорога',
  },
  {
    id: 'wiki-riga-oryol',
    citation: 'Википедия (ru), «Риго-Орловская железная дорога»（引 РГИА, ф. 446, оп. 26 и 31）.',
    kind: 'reference',
    url: 'https://ru.wikipedia.org/wiki/Риго-Орловская_железная_дорога',
  },
  {
    id: 'wiki-polesie',
    citation: 'Википедия (ru), «Полесские железные дороги».',
    kind: 'reference',
    url: 'https://ru.wikipedia.org/wiki/Полесские_железные_дороги',
  },
  {
    id: 'wiki-pl-line-37',
    citation: 'Wikipedia (pl), „Linia kolejowa nr 37”.',
    kind: 'reference',
    url: 'https://pl.wikipedia.org/wiki/Linia_kolejowa_nr_37',
  },
];
