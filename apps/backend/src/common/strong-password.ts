import { registerDecorator } from 'class-validator';
import type { ValidationOptions } from 'class-validator';

export const PASSWORD_MIN_LENGTH = 8;
// bcrypt só lê os 72 primeiros bytes: acima disso a senha seria cortada em silêncio.
export const PASSWORD_MAX_LENGTH = 72;

const COMMON_PASSWORDS = new Set([
  '12345678',
  '123456789',
  '1234567890',
  '87654321',
  '11111111',
  '00000000',
  'qwertyui',
  'qwerty123',
  'qwertyuiop',
  'asdfghjk',
  'abcd1234',
  'abc12345',
  'senha123',
  'senha1234',
  'senha@123',
  'senhasenha',
  'mudar123',
  'mudar@123',
  'password',
  'password1',
  'password123',
  'admin123',
  'admin1234',
  'jogae123',
  'jogae1234',
  'jogaesports',
  'iloveyou',
  'brasil123',
  'futebol1',
  'futebol123',
  'corinthians',
  'flamengo123',
  'quadra123',
]);

/** Devolve o motivo da recusa em português, ou null se a senha serve. */
export function weakPasswordReason(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres`;
  }
  if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_LENGTH) {
    return `A senha deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres`;
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return 'Essa senha é muito comum. Escolha outra';
  }
  if (new Set(password).size <= 2) {
    return 'A senha não pode repetir só um ou dois caracteres';
  }
  if (/^\d+$/.test(password)) {
    return 'A senha não pode ter só números';
  }
  return null;
}

/** Valida senha nova (cadastro, redefinição, funcionário). O login NÃO usa isto: contas antigas têm 6 ou 7 caracteres. */
export function IsStrongPassword(options?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && weakPasswordReason(value) === null,
        defaultMessage: (args) => {
          const value = args?.value as unknown;
          return (
            (typeof value === 'string' ? weakPasswordReason(value) : null) ??
            'Senha inválida'
          );
        },
      },
    });
  };
}
