import { treaty } from '@elysiajs/eden';
import type { App } from '../app/api/[[...slugs]]/route';

// Use your domain or localhost + port
export const api = treaty<App>(process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000');
