# ADR 0003: Previsão do tempo como recurso temporário

- Data: 2026-10-17
- Status: Aceita (remover depois)

## Contexto
O trabalho interdisciplinar de Clima precisa mostrar a previsão no sistema, que a banca vai ver.

## Decisão
Integrar a Open-Meteo na página de reserva, atrás da chave WEATHER_ENABLED, sem migração de banco e com local fixo (Fortaleza).

## Consequências
Remoção simples (ver docs/gestao/09-clima-temporario.md). Open-Meteo é gratuita só para uso não comercial; não manter em produto pago. Sem alerta por quadra coberta.
