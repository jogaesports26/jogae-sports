import { Logger } from '@nestjs/common';

const MIN_JWT_SECRET_LENGTH = 32;

/**
 * Valida o ambiente na subida. Só derruba se JWT_SECRET estiver ausente (sem ele os tokens
 * seriam assinados com `undefined`); segredo curto apenas avisa, para não derrubar ambientes
 * já em uso (Render).
 */
export function validateEnv(
  env: NodeJS.ProcessEnv = process.env,
  logger: Pick<Logger, 'warn'> = new Logger('Env'),
): void {
  const secret = env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error('JWT_SECRET é obrigatório e não foi definido.');
  }
  if (secret.length < MIN_JWT_SECRET_LENGTH) {
    logger.warn(
      `JWT_SECRET tem ${secret.length} caracteres; use pelo menos ${MIN_JWT_SECRET_LENGTH} (ex.: openssl rand -hex 32).`,
    );
  }
}

/**
 * CORS_ORIGINS: lista separada por vírgulas. Sem a variável, aceita só o localhost de
 * desenvolvimento (o front de produção usa o mesmo domínio da API, via /api, sem CORS).
 */
export function resolveCorsOrigins(
  value: string | undefined = process.env.CORS_ORIGINS,
): string[] {
  const list = (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (list.length === 0) {
    return ['http://localhost:5173', 'http://127.0.0.1:5173'];
  }
  return list.filter((item) => item !== '*');
}

/** Quantos proxies reversos confiáveis ficam na frente (Caddy = 1). */
export function resolveTrustProxy(
  value: string | undefined = process.env.TRUST_PROXY,
): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 1;
}

export function isOtpDevCodeExposed(
  value: string | undefined = process.env.OTP_EXPOSE_DEV_CODE,
): boolean {
  return value?.trim().toLowerCase() === 'true';
}
