import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CepService } from './cep.service';

describe('CepService', () => {
  let service: CepService;
  const originalFetch = global.fetch;

  beforeEach(() => {
    service = new CepService();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('rejeita CEP com formato inválido antes de chamar a API externa', async () => {
    await expect(service.lookup('123')).rejects.toThrow(BadRequestException);
  });

  it('aceita CEP formatado com hífen, removendo os não-dígitos', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          cep: '60000-000',
          logradouro: 'Rua Teste',
          bairro: 'Centro',
          localidade: 'Fortaleza',
          uf: 'CE',
        }),
    }) as any;

    const result = await service.lookup('60000-000');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://viacep.com.br/ws/60000000/json/',
    );
    expect(result.cidade).toBe('Fortaleza');
  });

  it('lança NotFound quando o ViaCEP retorna erro (CEP inexistente)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ erro: true }),
    }) as any;

    await expect(service.lookup('99999999')).rejects.toThrow(NotFoundException);
  });
});
