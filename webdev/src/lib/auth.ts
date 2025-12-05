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
            // we will simply map to our ApiKey model but the plugin might handle its own table 
            // Better Auth API plugin usually creates its own table or fields. 
            // Let's rely on the plugin's default behavior or customization if needed.
            // For now, using defaults. 
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
