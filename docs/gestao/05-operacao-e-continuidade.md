# 5. Operação e continuidade

Operação do servidor em geral: `/srv/docs/RUNBOOK.md`. Aqui, o que é específico do Jogaê.

## 5.1 Inventário de serviços

| Serviço | Contêiner | Saúde | Porta | Observação |
|---|---|---|---|---|
| Banco | `jogae-db` (postgres:16.15-alpine) | healthcheck | só rede interna | Dados em `./data` |
| API | `jogae-api` | `GET /health` | 3000 interna | Roda `prisma migrate deploy` ao subir |
| Web | `jogae-web` | `GET /healthz` | 127.0.0.1:8101 | Publicado pelo Caddy |

Comandos úteis (na pasta do projeto):

```bash
docker compose ps
docker compose logs -f --tail=100 jogae-api
./publicar.sh --status
```

## 5.2 Monitoramento

| O que | Ferramenta | Estado |
|---|---|---|
| Disponibilidade externa | Uptime Kuma (`status.razielhub.cloud`) | [pendente: confirmar monitor dedicado do Jogaê] |
| CPU/RAM/contêineres | Beszel (`monitor.razielhub.cloud`) | Ativo no servidor |
| Logs | `docker compose logs` (rotação 10 MB × 3) | Ativo |
| Erros de aplicação | Sem agregador | [pendente] avaliar (custo zero primeiro) |
| Abuso | fail2ban (`caddy-auth`, `sshd`), throttling na API | Ativo |

**Indicadores a acompanhar (mensal):** disponibilidade, nº de publicações, publicações revertidas, tempo de restauração testado, erros 5xx, uso de disco, custo mensal, mensagens do chat vs. teto diário.

## 5.3 Backup e restauração

| Item | Valor |
|---|---|
| O que | `pg_dump` do banco (`jogae-db.sql.gz`) + `.env` + `compose.yaml` (`jogae-files.tar.gz`), via [`backup.sh`](../../backup.sh) |
| Quando | Diário 03:30 (`srv-backup.timer`) e antes de cada publicação |
| Onde | `/srv/backups/jogae/<data>/`, pasta 700, arquivos 600 |
| Retenção | 7 dias de backups diários; os pré-publicação acumulam e hoje há 35 pastas [verificado] |
| Cópia externa | **Não existe.** Perder o servidor perde os backups [decisão do dono de adiar o R2] |
| Restauração | Procedimento testado em `/srv/infra/backup/restore.md` (container temporário, `--network none`) |

Objetivos: **RPO 24 h** (backup diário) e **RTO 2 h**. Teste de restauração completo: a cada trimestre e a cada migração destrutiva.

## 5.4 Manutenção recorrente (automática no servidor)

| Rotina | Quando |
|---|---|
| Backup | Diário 03:30 |
| Atualização automática (patch/minor, quarentena 7 dias, rollback) | Domingo 04:30 |
| Reinício se o kernel exigir | Domingo 05:00 |
| Relatório de atualizações | Dia 1, 09:00 |

As imagens do Jogaê (`jogae-api`, `jogae-web`) são locais, logo **não** entram na atualização automática (política `off`); só o Postgres entra. Dependências npm são atualizadas manualmente, por lote, com lockfile e testes [pendente: rotina trimestral com `npm audit`].

## 5.5 Gestão de incidentes

**Severidades**

| Nível | Definição | Meta de resposta |
|---|---|---|
| S1 | Sistema fora do ar ou perda/exposição de dados | Imediata |
| S2 | Função crítica quebrada (reservar, login) | ≤ 4 h |
| S3 | Falha parcial com contorno | ≤ 2 dias |
| S4 | Cosmético | Próxima publicação |

**Roteiro**

1. **Detectar**: alerta, relato ou verificação (`docker compose ps`, `curl https://jogae.razielhub.cloud/api/health`).
2. **Conter**: se foi a última publicação, `./publicar.sh --rollback`; se envolve segredo, trocar o segredo.
3. **Diagnosticar**: logs (`docker compose logs`), mudança mais recente, uso de recursos.
4. **Recuperar**: corrigir à frente ou restaurar backup (`restore.md`).
5. **Comunicar**: avisar clientes afetados quando existirem (e-mail/WhatsApp de suporte).
6. **Aprender**: pós-incidente curto (o que houve, causa, ação preventiva) em `docs/incidentes/AAAA-MM-DD-titulo.md`. Sem culpados; foco em processo.

## 5.6 Segurança operacional

- Segredos só no `.env` (600); nunca em log, chat ou git. Trocar `JWT_SECRET` invalida as sessões.
- Contêineres rodam como `node` (sem root); banco sem porta publicada.
- SSH: senha ligada por decisão do dono, com fail2ban e `MaxAuthTries 3`; acesso equivale a root, então a senha deve ser forte e única.
- Acesso ao Dockge só por túnel SSH.

## 5.7 Plano de continuidade (resumo)

| Cenário | Resposta |
|---|---|
| Publicação ruim | Rollback automático ou `--rollback` |
| Corrupção do banco | Restaurar o dump mais recente |
| Disco cheio | Limpar imagens antigas e logs; aumentar plano se recorrente |
| **Perda do servidor** | **Hoje: perda dos dados** (sem cópia externa). Mitigação prevista: backup no R2 antes do 1º cliente (R3) |
| Provedor de IA fora | Chat degrada para mensagem padrão |
| Domínio expira | Lembrete 30 dias antes de 2027-10-09 |
