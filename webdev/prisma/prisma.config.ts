import { defineConfig } from '@prisma/migrate';

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
