import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { apiKey } from "better-auth/plugins";

export const auth = betterAuth({
  basePath: '/auth',
  database: prismaAdapter(prisma, {
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
