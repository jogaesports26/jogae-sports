import { parseForecast, rateHour, WeatherService } from './weather.service';

describe('WeatherService', () => {
  const originalFetch = global.fetch;
  const originalFlag = process.env.WEATHER_ENABLED;
  afterEach(() => {
    global.fetch = originalFetch;
    process.env.WEATHER_ENABLED = originalFlag;
  });

  it('classifica o horário: chuva, vento ou UV altos pedem atenção', () => {
    expect(rateHour(10, 10, 3)).toBe('good');
    expect(rateHour(60, 10, 3)).toBe('attention');
    expect(rateHour(10, 40, 3)).toBe('attention');
    expect(rateHour(10, 10, 9)).toBe('attention');
  });

  it('agrupa a série horária por dia', () => {
    const days = parseForecast({
      hourly: {
        time: ['2026-10-18T09:00', '2026-10-18T10:00', '2026-10-19T09:00'],
        temperature_2m: [27.4, 28.6, 26],
        precipitation_probability: [10, 50, 0],
        wind_speed_10m: [12, 14, 8],
        uv_index: [5, 7, 4],
        weather_code: [0, 61, 1],
      },
    });
    expect(days).toHaveLength(2);
    expect(days[0].hours[1]).toMatchObject({
      hour: 10,
      temperature: 29,
      rating: 'attention',
    });
  });

  it('desligado, não chama a API externa', async () => {
    process.env.WEATHER_ENABLED = 'false';
    global.fetch = jest.fn();
    await expect(new WeatherService().forecast()).resolves.toEqual({
      enabled: false,
      days: [],
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
