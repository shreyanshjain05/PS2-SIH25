// app/api/[[...slugs]]/route.ts
import { Elysia, t } from 'elysia';

const app = new Elysia({ prefix: '/api' })
  .get('/', () => 'Hello from Elysia + Next.js!')
  .post('/', ({ body }) => {
    return { received: body };
  }, {
    body: t.Object({
      name: t.String(),
      age: t.Number()
    })
  })
  .group('/aqi', (app) => app
    .get('/sites', async () => {
      try {
        const res = await fetch('http://localhost:8000/sites/');
        if (!res.ok) throw new Error('Failed to fetch sites');
        return await res.json();
      } catch (error) {
        console.error('Error fetching sites:', error);
        return { error: 'Failed to connect to AQI server' };
      }
    })
    .post('/predict', async ({ body }) => {
      try {
        const res = await fetch('http://localhost:8000/predict/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        return await res.json();
      } catch (error) {
         return { error: 'Prediction failed' };
      }
    }, {
      body: t.Object({
        site_id: t.String(),
        data: t.Array(t.Any())
      })
    })
    .post('/forecast/timeseries', async ({ body }) => {
      try {
        const res = await fetch('http://localhost:8000/forecast/timeseries/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        return await res.json();
      } catch (error) {
        return { error: 'Forecast failed' };
      }
    }, {
      body: t.Object({
        site_id: t.String(),
        data: t.Array(t.Any()),
        historical_points: t.Optional(t.Number())
      })
    })
  );

// Export handler(s) for HTTP methods you want to support
export const GET = app.fetch;
export const POST = app.fetch;
// (Similarly for PUT, DELETE etc. if needed)

// same route file
export type App = typeof app;
