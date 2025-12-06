import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { apiKey } from "better-auth/plugins";
import { prismaAuth } from "@/lib/db/auth"; // Multi-DB Client

export const auth = betterAuth({
  basePath: '/auth',
  database: prismaAdapter(prismaAuth, {
    provider: "postgresql",
  }),
  emailAndPassword: {  
    enabled: true,
  },
  plugins: [
    apiKey({
        schema: {
            apikey: {
                modelName: "ApiKey"
            }
        }
    })
  ],
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "CITIZEN",
      },
    },
  },
});
