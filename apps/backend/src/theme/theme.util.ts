/**
 * Derivação de tema por lojinha. Funções puras (sem Nest/Prisma) pra serem
 * testáveis. O dono escolhe uma cor primária (e opcionalmente a do CTA); daqui
 * sai a escala completa em OKLCH com contraste AA garantido e o mapa de
 * variáveis CSS que o frontend/edge injetam em /:slug/**.
 *
 * Política: BLOQUEAR cor inválida ou clara demais pra servir de marca;
 * AJUSTAR automaticamente o que dá (texto de marca escurecido até AA);
 * AVISAR quando não há ajuste possível.
 */
import { BadRequestException } from '@nestjs/common';

export const THEME_VERSION = 1;
export const THEME_HISTORY_LIMIT = 5;

const WHITE = '#ffffff';
const NAVY = '#00182e';
const MIN_CONTRAST = 4.5;
const MAX_PRIMARY_LIGHTNESS = 0.93;

export type ThemeRadius = 'sm' | 'md' | 'lg';
export type ThemeFont = 'inter' | 'system' | 'serif';

export interface ThemeInput {
  preset?: string;
  primary?: string;
  action?: string;
  radius?: ThemeRadius;
  font?: ThemeFont;
  logoUrl?: string;
  coverUrl?: string;
}

export interface ResolvedTheme {
  cssVars: Record<string, string>;
  themeColor: string;
  warnings: string[];
  adjustments: string[];
}

export interface StoredTheme extends ThemeInput {
  version: number;
  rev: number;
  resolved: ResolvedTheme;
  history: ThemeInput[];
}

export const THEME_PRESETS: Record<
  string,
  Required<Pick<ThemeInput, 'primary' | 'action'>>
> = {
  jogae: { primary: '#013ff6', action: '#acec00' },
  quadra: { primary: '#0b7a3b', action: '#f5c518' },
  areia: { primary: '#c2410c', action: '#0b3d91' },
  noite: { primary: '#5b2bd9', action: '#ffd43b' },
  classico: { primary: '#243447', action: '#e8590c' },
};

export const DEFAULT_PRESET = 'jogae';

// ---------- cor ----------

type Rgb = [number, number, number]; // 0..255

export function normalizeHex(value: string): string {
  const v = value.trim().toLowerCase();
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(v);
  if (short) {
    return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
  }
  if (/^#[0-9a-f]{6}$/.test(v)) return v;
  throw new BadRequestException(
    `Cor inválida: "${value}". Use o formato #RRGGBB.`,
  );
}

function hexToRgb(hex: string): Rgb {
  const n = normalizeHex(hex);
  return [1, 3, 5].map((i) => parseInt(n.slice(i, i + 2), 16)) as Rgb;
}

function rgbToHex([r, g, b]: Rgb): string {
  return (
    '#' +
    [r, g, b]
      .map((c) =>
        Math.round(Math.min(255, Math.max(0, c)))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}

const toLinear = (c: number) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const fromLinear = (c: number) => {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return v * 255;
};

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export interface Oklch {
  l: number;
  c: number;
  h: number;
}

export function hexToOklch(hex: string): Oklch {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return {
    l: L,
    c: Math.hypot(A, B),
    h: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360,
  };
}

export function oklchToHex({ l, c, h }: Oklch): string {
  const A = c * Math.cos((h * Math.PI) / 180);
  const B = c * Math.sin((h * Math.PI) / 180);
  const l_ = Math.pow(l + 0.3963377774 * A + 0.2158037573 * B, 3);
  const m_ = Math.pow(l - 0.1055613458 * A - 0.0638541728 * B, 3);
  const s_ = Math.pow(l - 0.0894841775 * A - 1.291485548 * B, 3);
  const r = 4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
  const g = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
  const b = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_;
  return rgbToHex([fromLinear(r), fromLinear(g), fromLinear(b)]);
}

/** Texto legível sobre `bg`: branco ou azul-marinho, o que tiver mais contraste. */
export function bestOn(bg: string): string {
  return contrastRatio(WHITE, bg) >= contrastRatio(NAVY, bg) ? WHITE : NAVY;
}

// ---------- derivação ----------

const RADIUS_PX: Record<ThemeRadius, { sm: number; md: number; card: number }> =
  {
    sm: { sm: 6, md: 10, card: 12 },
    md: { sm: 10, md: 16, card: 20 },
    lg: { sm: 14, md: 22, card: 28 },
  };

const FONT_STACK: Record<ThemeFont, string> = {
  inter: "'Inter', system-ui, sans-serif",
  system: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
};

export function resolveTheme(input: ThemeInput): ResolvedTheme {
  const warnings: string[] = [];
  const adjustments: string[] = [];

  const preset =
    THEME_PRESETS[input.preset ?? DEFAULT_PRESET] ??
    THEME_PRESETS[DEFAULT_PRESET];
  const primary = normalizeHex(input.primary ?? preset.primary);
  const primaryOk = hexToOklch(primary);

  if (primaryOk.l > MAX_PRIMARY_LIGHTNESS) {
    throw new BadRequestException(
      'Essa cor é clara demais pra ser a cor principal da lojinha (some no fundo branco). Escolha um tom mais escuro.',
    );
  }

  const action = normalizeHex(
    input.action ?? (input.primary ? primary : preset.action),
  );

  const onBrand = bestOn(primary);
  if (contrastRatio(onBrand, primary) < MIN_CONTRAST) {
    warnings.push(
      'O texto sobre a cor principal fica com contraste baixo; considere um tom mais escuro ou mais claro.',
    );
  }
  const onAction = bestOn(action);
  if (contrastRatio(onAction, action) < MIN_CONTRAST) {
    warnings.push(
      'O texto do botão de reservar fica com contraste baixo; considere outra cor de ação.',
    );
  }

  // Texto/link/preço de marca sobre fundo branco: escurece até passar AA.
  let brandText = primary;
  let lightness = primaryOk.l;
  while (contrastRatio(brandText, WHITE) < MIN_CONTRAST && lightness > 0.2) {
    lightness -= 0.01;
    brandText = oklchToHex({ ...primaryOk, l: lightness });
  }
  if (brandText !== primary) {
    adjustments.push(
      'Escurecemos a cor dos links e preços pra manter a leitura confortável (contraste AA).',
    );
  }

  const hue = primaryOk.h;
  const chroma = primaryOk.c;
  const brand50 = oklchToHex({ l: 0.97, c: Math.min(chroma, 0.03), h: hue });
  const brand600 = oklchToHex({
    l: Math.max(primaryOk.l - 0.08, 0.15),
    c: chroma,
    h: hue,
  });
  const brandDark = oklchToHex({ l: 0.2, c: Math.min(chroma, 0.07), h: hue });

  const radius = RADIUS_PX[input.radius ?? 'md'];

  return {
    cssVars: {
      '--brand-primary': primary,
      '--brand-50': brand50,
      '--brand-600': brand600,
      '--brand-text': brandText,
      '--on-brand': onBrand,
      '--brand-action': action,
      '--on-action': onAction,
      '--brand-dark': brandDark,
      '--radius-sm': `${radius.sm}px`,
      '--radius-md': `${radius.md}px`,
      '--radius-card': `${radius.card}px`,
      '--font-body': FONT_STACK[input.font ?? 'inter'],
    },
    themeColor: primary,
    warnings,
    adjustments,
  };
}

const HTTP_OR_DATA_IMAGE = /^(https?:\/\/|data:image\/)/i;

function cleanUrl(
  value: string | undefined,
  label: string,
): string | undefined {
  if (!value) return undefined;
  if (!HTTP_OR_DATA_IMAGE.test(value)) {
    throw new BadRequestException(
      `${label} inválido: use um link http(s) ou uma imagem enviada.`,
    );
  }
  return value;
}

export function stripStored(theme: StoredTheme): ThemeInput {
  return {
    preset: theme.preset,
    primary: theme.primary,
    action: theme.action,
    radius: theme.radius,
    font: theme.font,
    logoUrl: theme.logoUrl,
    coverUrl: theme.coverUrl,
  };
}

/** Valida a entrada do dono e devolve o objeto pronto pra gravar (com `resolved`, `rev` e histórico). */
export function buildStoredTheme(
  input: ThemeInput,
  previous?: StoredTheme | null,
): StoredTheme {
  if (input.preset !== undefined && !THEME_PRESETS[input.preset]) {
    throw new BadRequestException('Preset de tema inexistente.');
  }
  const clean: ThemeInput = {
    preset: input.preset,
    primary: input.primary ? normalizeHex(input.primary) : undefined,
    action: input.action ? normalizeHex(input.action) : undefined,
    radius: input.radius,
    font: input.font,
    logoUrl: cleanUrl(input.logoUrl, 'Logo'),
    coverUrl: cleanUrl(input.coverUrl, 'Capa'),
  };
  const resolved = resolveTheme(clean);

  const history = previous
    ? [stripStored(previous), ...(previous.history ?? [])].slice(
        0,
        THEME_HISTORY_LIMIT,
      )
    : [];

  return {
    ...clean,
    version: THEME_VERSION,
    rev: (previous?.rev ?? 0) + 1,
    resolved,
    history,
  };
}

/** Tema padrão Jogaê, usado quando a lojinha não personalizou nada. */
export function defaultTheme(): StoredTheme {
  return buildStoredTheme({ preset: DEFAULT_PRESET });
}

const RADIUS_VALUES: ThemeRadius[] = ['sm', 'md', 'lg'];
const FONT_VALUES: ThemeFont[] = ['inter', 'system', 'serif'];

/**
 * Parâmetros do embed (?primary=%23rrggbb&action=...&radius=sm|md|lg&font=inter|system|serif).
 * Qualquer valor fora do formato dá 400; chaves desconhecidas são ignoradas.
 */
export function parseThemeOverrides(
  query: Record<string, unknown>,
): ThemeInput {
  const overrides: ThemeInput = {};
  const str = (key: string) =>
    typeof query[key] === 'string' && query[key] !== ''
      ? query[key]
      : undefined;

  const primary = str('primary');
  if (primary) overrides.primary = normalizeHex(primary);
  const action = str('action');
  if (action) overrides.action = normalizeHex(action);

  const radius = str('radius');
  if (radius) {
    if (!RADIUS_VALUES.includes(radius as ThemeRadius)) {
      throw new BadRequestException('radius deve ser sm, md ou lg.');
    }
    overrides.radius = radius as ThemeRadius;
  }
  const font = str('font');
  if (font) {
    if (!FONT_VALUES.includes(font as ThemeFont)) {
      throw new BadRequestException('font deve ser inter, system ou serif.');
    }
    overrides.font = font as ThemeFont;
  }
  return overrides;
}
