import { csvEscape, toCsv } from './csv.util';

describe('csv.util', () => {
  it('neutraliza células que viram fórmula', () => {
    expect(csvEscape('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');
    expect(csvEscape('+5585999999999')).toBe("'+5585999999999");
    expect(csvEscape('@cmd')).toBe("'@cmd");
  });

  it('mantém texto comum e escapa separadores', () => {
    expect(csvEscape('Maria')).toBe('Maria');
    expect(csvEscape('a;b')).toBe('"a;b"');
    expect(toCsv(['n'], [['x']])).toBe('n\nx');
  });
});
