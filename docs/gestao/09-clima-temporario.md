# 9. Previsão do tempo (recurso temporário)

Criado em 2026-10-17 para o trabalho interdisciplinar de Clima: a página de reserva da quadra mostra a previsão do dia escolhido. **O Jogaê não vai manter isso** depois da apresentação.

## O que faz
- Back: `GET /weather/forecast` ([apps/backend/src/weather](../../apps/backend/src/weather)) consulta a Open-Meteo (gratuita, sem chave), 7 dias, por hora: temperatura, chance de chuva, vento, UV e condição. Cache de 30 min; se a API falhar, usa o cache ou responde 503.
- Front: `WeatherCard` ([componente](../../apps/frontend/src/components/portal/WeatherCard.tsx)) aparece acima de "Horários", para o dia selecionado, com o selo "atenção" por hora (chuva >40%, vento >30 km/h ou UV ≥8).
- Local fixo: Fortaleza (`WEATHER_LAT`/`WEATHER_LON` mudam). O sistema não guarda coordenadas por estabelecimento nem se a quadra é coberta, por isso não há alerta por tipo de quadra.

## Liga e desliga
Desligado por padrão. Para ligar: `WEATHER_ENABLED=true` no `.env` de produção e `docker compose up -d`. Desligado, a API responde `enabled:false` e o front não mostra nada.

## Remoção definitiva
1. `WEATHER_ENABLED=false` (já desliga tudo).
2. Apagar `apps/backend/src/weather/`, a linha do `WeatherModule` em `app.module.ts`, `apps/frontend/src/lib/weather.ts`, `components/portal/WeatherCard.*` e o uso em `CourtBookingPage.tsx`.
3. Tirar `WEATHER_ENABLED` do `compose.yaml` e do `.env.example`; publicar.

Não há migração de banco.

## Cuidados
- Open-Meteo é gratuita para uso não comercial; **não manter em produto pago**.
- Previsão é estimativa; a tela diz isso.
