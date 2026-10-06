import { SITE } from '../lib/site'

export interface LegalSection {
  title: string
  paragraphs: string[]
}

export interface LegalDocument {
  title: string
  intro: string
  sections: LegalSection[]
}

const contact = SITE.contactEmail
  ? `pelo e-mail ${SITE.contactEmail}`
  : 'pelos canais de contato informados no rodapé do site'

/** Texto-base das páginas /termos e /privacidade. Revisar com assessoria jurídica antes de cobrar de clientes. */
export const TERMS: LegalDocument = {
  title: 'Termos de uso',
  intro:
    'Estes termos explicam como funciona o Jogaê Sports, plataforma de agenda e reservas online para quadras esportivas. Ao criar uma conta ou fazer uma reserva, você concorda com eles.',
  sections: [
    {
      title: '1. O que é o Jogaê Sports',
      paragraphs: [
        'O Jogaê Sports oferece ao dono de um estabelecimento um painel para gerir quadras, horários, preços e reservas, e uma página pública (a "lojinha") em que jogadores escolhem um horário e reservam.',
        'O Jogaê Sports é a ferramenta. Quem oferece a quadra, define preços, regras e atende o jogador é o estabelecimento.',
      ],
    },
    {
      title: '2. Conta do estabelecimento',
      paragraphs: [
        'Para usar o painel é preciso criar uma conta com e-mail e senha. Você é responsável pela veracidade dos dados que cadastra (nome, endereço, telefone, preços, fotos) e por manter a senha em segredo.',
        'O link da lojinha é escolhido por você e não pode violar direitos de terceiros nem usar nomes reservados pelo sistema.',
      ],
    },
    {
      title: '3. Reservas e pagamentos',
      paragraphs: [
        'A reserva feita pela lojinha é um acordo entre o jogador e o estabelecimento. O preço exibido é o definido pelo estabelecimento para aquele horário.',
        'No momento, o Jogaê Sports não processa pagamentos: a cobrança é combinada diretamente entre jogador e estabelecimento. Quando o pagamento online for lançado, estes termos serão atualizados antes.',
        'A lojinha informa a regra de cancelamento (até 2 horas antes do horário). Casos fora dessa regra devem ser tratados com o estabelecimento.',
      ],
    },
    {
      title: '4. Uso adequado',
      paragraphs: [
        'É proibido usar o serviço para fraudar reservas, coletar dados de outras pessoas, tentar acessar áreas restritas ou sobrecarregar o sistema.',
        'Podemos suspender contas que violem estes termos ou a lei.',
      ],
    },
    {
      title: '5. Disponibilidade',
      paragraphs: [
        'Trabalhamos para manter o serviço no ar, mas ele pode ficar indisponível por manutenção ou falhas de terceiros (hospedagem, banco de dados). Não garantimos funcionamento ininterrupto.',
      ],
    },
    {
      title: '6. Planos e preço',
      paragraphs: [
        'Hoje criar conta e usar o painel é gratuito, sem taxa por reserva. Se planos pagos forem lançados, o modelo será de mensalidade fixa e você será avisado antes de qualquer cobrança.',
      ],
    },
    {
      title: '7. Alterações destes termos',
      paragraphs: [
        `Podemos atualizar estes termos. A data da última atualização aparece no topo desta página (${SITE.legalUpdatedAt}). Continuar usando o serviço depois da mudança significa que você concorda com a nova versão.`,
      ],
    },
    {
      title: '8. Contato',
      paragraphs: [`Dúvidas sobre estes termos podem ser enviadas ${contact}.`],
    },
  ],
}

export const PRIVACY: LegalDocument = {
  title: 'Política de privacidade',
  intro:
    'Aqui explicamos quais dados o Jogaê Sports coleta, por quê, com quem compartilha e quais são os seus direitos, conforme a Lei Geral de Proteção de Dados (LGPD).',
  sections: [
    {
      title: '1. Quais dados coletamos',
      paragraphs: [
        'Donos de estabelecimento: nome, e-mail, senha (guardada apenas de forma criptografada), dados do estabelecimento (nome, endereço, telefone, descrição, fotos) e as informações de quadras, preços e reservas que você cadastra.',
        'Jogadores: nome, telefone (usado para confirmar o acesso por código e identificar suas reservas), data de nascimento (opcional) e o histórico das reservas e avaliações.',
        'Dados técnicos: o navegador guarda no seu aparelho informações de sessão (para manter você conectado) e preferências, como o tema claro/escuro. Não usamos cookies de publicidade.',
      ],
    },
    {
      title: '2. Para que usamos',
      paragraphs: [
        'Para criar e manter sua conta, mostrar horários, registrar e confirmar reservas, avisar sobre reservas (quando o envio estiver ativo), gerar relatórios para o estabelecimento e manter o serviço seguro.',
        'A base legal é a execução do serviço que você pediu (criar conta, reservar) e, quando for o caso, o seu consentimento.',
      ],
    },
    {
      title: '3. Com quem compartilhamos',
      paragraphs: [
        'O estabelecimento em que você reserva recebe seu nome, telefone e dados da reserva, porque precisa deles para atender você.',
        'Usamos provedores para operar o serviço: hospedagem do site e da API, banco de dados e, no assistente virtual, um provedor de inteligência artificial que recebe o texto das mensagens que você digita no chat. Não envie dados sensíveis nesse chat.',
        'Não vendemos dados pessoais.',
      ],
    },
    {
      title: '4. Por quanto tempo guardamos',
      paragraphs: [
        'Mantemos os dados enquanto a conta existir ou for necessário para cumprir obrigações legais. Você pode pedir a exclusão a qualquer momento.',
      ],
    },
    {
      title: '5. Seus direitos',
      paragraphs: [
        'Você pode pedir confirmação de que tratamos seus dados, acesso, correção, anonimização, portabilidade, exclusão e informação sobre compartilhamento, além de revogar consentimentos.',
        `Para exercer qualquer direito, fale com a gente ${contact}.`,
      ],
    },
    {
      title: '6. Segurança',
      paragraphs: [
        'Adotamos medidas como senhas criptografadas, conexão segura (HTTPS) e controle de acesso por conta. Nenhum sistema é 100% imune, e avisaremos sobre incidentes relevantes conforme a lei.',
      ],
    },
    {
      title: '7. Atualizações',
      paragraphs: [`Esta política pode mudar. A data da última atualização é ${SITE.legalUpdatedAt}.`],
    },
  ],
}
