import {
  freeWindows,
  hourLabel,
  mergeRanges,
  priceForWindow,
  subtractRanges,
} from './availability';

describe('availability', () => {
  it('junta intervalos que se encostam', () => {
    expect(
      mergeRanges([
        { start: 600, end: 660 },
        { start: 660, end: 720 },
        { start: 900, end: 960 },
      ]),
    ).toEqual([
      { start: 600, end: 720 },
      { start: 900, end: 960 },
    ]);
  });

  it('subtrai as ocupações do horário de funcionamento', () => {
    expect(
      subtractRanges([{ start: 480, end: 1320 }], [{ start: 600, end: 720 }]),
    ).toEqual([
      { start: 480, end: 600 },
      { start: 720, end: 1320 },
    ]);
  });

  it('ocupação que cobre tudo não deixa janela', () => {
    expect(
      subtractRanges([{ start: 480, end: 600 }], [{ start: 0, end: 1440 }]),
    ).toEqual([]);
  });

  it('descarta o passado e janelas menores que a reserva mínima', () => {
    const rules = [{ startMinute: 480, endMinute: 1320, pricePerHour: 60 }];
    // são 17h10; há reserva das 19h às 21h45
    const windows = freeWindows({
      rules,
      busy: [{ start: 1140, end: 1305 }],
      minDuration: 60,
      nowMinute: 1030,
    });
    expect(windows).toEqual([{ start: 1030, end: 1140 }]);
  });

  it('formata horas e escolhe o menor preço da janela', () => {
    expect(hourLabel(1170)).toBe('19h30');
    expect(hourLabel(1200)).toBe('20h');
    const rules = [
      { startMinute: 480, endMinute: 1080, pricePerHour: 60 },
      { startMinute: 1080, endMinute: 1320, pricePerHour: 80 },
    ];
    expect(priceForWindow(rules, { start: 1000, end: 1200 })).toBe(60);
    expect(priceForWindow(rules, { start: 1100, end: 1200 })).toBe(80);
  });
});
