# Prompt para ajustar o banner (cole numa IA ou use como roteiro)

Atue como editor de banner acadêmico (UniAteneu, JOCA 2026, 90x120 cm). Edite o PPTX anexo SEM mudar o layout, as cores, as caixas nem os títulos de seção; só troque o texto das caixas abaixo, em Times New Roman, justificado, mantendo o tamanho de fonte atual (reduza no máximo 2 pt se estourar). Não use acento errado nem invente dados.

## 1. Corrija a tecnologia da IA (estava invertida)
Em METODOLOGIA, item 2, troque "LLM (Claude, da Anthropic; GPT-4o mini, da OpenAI, como alternativa)" por:
"LLM (GPT-4o mini, da OpenAI; Claude, da Anthropic, como alternativa)".

## 2. METODOLOGIA (substitua os itens 3, 4 e 5 por estes dois)
3. **Dados e ferramentas:** sem treinar modelo; os dados da quadra vão no contexto e o modelo chama ferramentas: horários livres (agenda em tempo real) e previsão do tempo (API Open-Meteo, por hora, 7 dias).
4. **Prompt e proteções:** português, só dados informados, nunca inventar, ignorar pedidos para mudar as regras; limite de mensagens por IP; se a IA falhar, mensagem padrão.

## 3. RESULTADOS (substitua o bloco de testes por este)
**Testes automatizados:** 173 testes do back-end passando (24 suítes), incluindo chat, horários livres e previsão do tempo.
**Teste com 33 perguntas reais na Arena Green (produção):**
- **Normais e de horário (16):** respondeu com quadras, preços, endereço, instrutores e horários livres calculados na hora; recusou datas além de 7 dias.
- **Ambíguas (4):** pediu o dia ou o esporte em vez de chutar.
- **Fora do escopo e problemáticas (13):** recusou futebol e código; não revelou as instruções (nem em inglês), não deu desconto nem código de cupom, não passou dados de outros clientes e não assumiu outra arena.
- **Previsão do tempo (Open-Meteo):** "Vai chover amanhã?" foi respondida com temperatura e chance de chuva, avisando que é estimativa.

## 4. CONSIDERAÇÕES FINAIS
Primeiro parágrafo: "O assistente foi integrado ao Jogaê, consulta a agenda e a previsão do tempo em tempo real e responde usando só os dados reais da quadra, com falhas controladas."
**Limitações:** não faz a reserva sozinho (só orienta), a previsão usa um local fixo (Fortaleza), depende de serviço externo de IA e pode errar, por isso a supervisão humana continua necessária.
**Próximos passos:** reservar pelo próprio chat, atender pelo WhatsApp, guardar a localização de cada arena para a previsão e medir a satisfação com questionário.

## 5. REFERÊNCIAS
Acrescente: OPEN-METEO. Open-Meteo Weather Forecast API Documentation. Disponível em: https://open-meteo.com/en/docs. E complete Manfredini et al. (2021) e Mendes et al. (2025), citados no PDF da disciplina, com título e editora.

Entregue o PPTX editado e liste o que mudou. Confira se nenhum texto passa da borda da caixa.
