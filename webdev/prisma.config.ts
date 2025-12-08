import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Using the Auth Database URL
    url: env("DATABASE_URL_AUTH"),
  },
});
