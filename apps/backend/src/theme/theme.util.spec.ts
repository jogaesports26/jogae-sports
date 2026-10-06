import { BadRequestException } from '@nestjs/common';
import {
  buildStoredTheme,
  contrastRatio,
  defaultTheme,
  hexToOklch,
  normalizeHex,
  oklchToHex,
  resolveTheme,
  THEME_HISTORY_LIMIT,
  THEME_PRESETS,
} from './theme.util';

describe('theme.util', () => {
  describe('conversão de cor', () => {
    it('normaliza #abc e maiúsculas', () => {
      expect(normalizeHex('#ABC')).toBe('#aabbcc');
      expect(normalizeHex(' #013FF6 ')).toBe('#013ff6');
    });

    it('rejeita cor inválida', () => {
      expect(() => normalizeHex('azul')).toThrow(BadRequestException);
      expect(() => normalizeHex('#12345')).toThrow(BadRequestException);
    });

    it('faz ida e volta hex -> oklch -> hex sem perder a cor', () => {
      for (const hex of [
        '#013ff6',
        '#0b7a3b',
        '#d9480f',
        '#5b2bd9',
        '#243447',
      ]) {
        const back = oklchToHex(hexToOklch(hex));
        expect(contrastRatio(hex, back)).toBeCloseTo(1, 1);
      }
    });

    it('calcula contraste WCAG (preto/branco = 21)', () => {
      expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
    });
  });

  describe('resolveTheme', () => {
    it('todo preset resolve com texto de marca AA sobre branco e on-brand legível', () => {
      for (const preset of Object.keys(THEME_PRESETS)) {
        const { cssVars } = resolveTheme({ preset });
        expect(
          contrastRatio(cssVars['--brand-text'], '#ffffff'),
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          contrastRatio(cssVars['--on-brand'], cssVars['--brand-primary']),
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          contrastRatio(cssVars['--on-action'], cssVars['--brand-action']),
        ).toBeGreaterThanOrEqual(4.5);
      }
    });

    it('escurece o texto de marca quando a primária não passa AA no branco, e registra o ajuste', () => {
      const result = resolveTheme({ primary: '#f08c00' });
      expect(result.cssVars['--brand-primary']).toBe('#f08c00');
      expect(result.cssVars['--brand-text']).not.toBe('#f08c00');
      expect(
        contrastRatio(result.cssVars['--brand-text'], '#ffffff'),
      ).toBeGreaterThanOrEqual(4.5);
      expect(result.adjustments).toHaveLength(1);
    });

    it('bloqueia cor clara demais', () => {
      expect(() => resolveTheme({ primary: '#f8f8ff' })).toThrow(
        BadRequestException,
      );
    });

    it('sem cor de ação própria, o CTA deriva da primária', () => {
      expect(
        resolveTheme({ primary: '#0b7a3b' }).cssVars['--brand-action'],
      ).toBe('#0b7a3b');
    });

    it('cor de ação própria sobrescreve', () => {
      expect(
        resolveTheme({ primary: '#0b7a3b', action: '#ffd43b' }).cssVars[
          '--brand-action'
        ],
      ).toBe('#ffd43b');
    });

    it('raio e fonte entram nas variáveis', () => {
      const { cssVars } = resolveTheme({ radius: 'lg', font: 'serif' });
      expect(cssVars['--radius-card']).toBe('28px');
      expect(cssVars['--font-body']).toContain('Georgia');
    });
  });

  describe('buildStoredTheme', () => {
    it('incrementa rev e guarda no máximo N versões anteriores', () => {
      let theme = buildStoredTheme({ preset: 'quadra' });
      expect(theme.rev).toBe(1);
      for (let i = 0; i < THEME_HISTORY_LIMIT + 3; i++) {
        theme = buildStoredTheme(
          { preset: 'areia', radius: i % 2 ? 'sm' : 'lg' },
          theme,
        );
      }
      expect(theme.rev).toBe(THEME_HISTORY_LIMIT + 4);
      expect(theme.history).toHaveLength(THEME_HISTORY_LIMIT);
    });

    it('rejeita preset inexistente e URL de imagem insegura', () => {
      expect(() => buildStoredTheme({ preset: 'nao-existe' })).toThrow(
        BadRequestException,
      );
      expect(() =>
        buildStoredTheme({ logoUrl: 'javascript:alert(1)' }),
      ).toThrow(BadRequestException);
    });

    it('o tema padrão usa o preset Jogaê', () => {
      expect(defaultTheme().resolved.cssVars['--brand-primary']).toBe(
        '#013ff6',
      );
    });
  });
});
