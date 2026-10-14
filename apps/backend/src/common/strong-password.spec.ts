import { validate } from 'class-validator';
import { IsStrongPassword, weakPasswordReason } from './strong-password';

class Sample {
  @IsStrongPassword()
  password: string;
}

describe('weakPasswordReason', () => {
  it('recusa senha curta', () => {
    expect(weakPasswordReason('abc123')).toMatch(/pelo menos 8/);
    expect(weakPasswordReason('abcdef1')).toMatch(/pelo menos 8/);
  });

  it('recusa senhas comuns, sem diferenciar maiúsculas', () => {
    expect(weakPasswordReason('Senha123')).toMatch(/muito comum/);
    expect(weakPasswordReason('PASSWORD')).toMatch(/muito comum/);
    expect(weakPasswordReason('12345678')).toMatch(/muito comum/);
  });

  it('recusa repetição e só números', () => {
    expect(weakPasswordReason('aaaaaaaa')).toMatch(/repetir/);
    expect(weakPasswordReason('abababab')).toMatch(/repetir/);
    expect(weakPasswordReason('48201937')).toMatch(/só números/);
  });

  it('recusa acima do limite do bcrypt (72 bytes)', () => {
    expect(weakPasswordReason('a1'.repeat(37))).toMatch(/no máximo 72/);
  });

  it('aceita senha razoável', () => {
    expect(weakPasswordReason('quadra-azul-47')).toBeNull();
    expect(weakPasswordReason('Jogae#Manhã9')).toBeNull();
  });
});

describe('IsStrongPassword', () => {
  it('devolve a mensagem em português no erro de validação', async () => {
    const sample = Object.assign(new Sample(), { password: 'senha123' });
    const errors = await validate(sample);
    expect(Object.values(errors[0].constraints ?? {})[0]).toMatch(
      /muito comum/,
    );
  });

  it('não reclama de senha boa e recusa valor que não é texto', async () => {
    expect(
      await validate(
        Object.assign(new Sample(), { password: 'quadra-azul-47' }),
      ),
    ).toHaveLength(0);
    expect(
      await validate(Object.assign(new Sample(), { password: 12345678 })),
    ).toHaveLength(1);
  });
});
