import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

@Injectable()
export class CepService {
  async lookup(rawCep: string) {
    const cep = rawCep.replace(/\D/g, '');

    if (cep.length !== 8) {
      throw new BadRequestException('CEP inválido — informe 8 dígitos');
    }

    let response: Response;
    try {
      response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    } catch {
      throw new ServiceUnavailableException(
        'Não foi possível consultar o CEP agora, tente de novo',
      );
    }

    if (!response.ok) {
      throw new ServiceUnavailableException(
        'Não foi possível consultar o CEP agora, tente de novo',
      );
    }

    const data = (await response.json()) as ViaCepResponse;

    if (data.erro) {
      throw new NotFoundException('CEP não encontrado');
    }

    return {
      cep: data.cep,
      logradouro: data.logradouro,
      bairro: data.bairro,
      cidade: data.localidade,
      uf: data.uf,
    };
  }
}
