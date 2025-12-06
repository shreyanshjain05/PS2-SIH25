import { createAuthClient } from "better-auth/react"

import { auth } from "./auth"

import { apiKeyClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL,
    plugins: [
        apiKeyClient()
    ]
})

export const { 
    signIn, 
    signUp, 
    signOut, 
    useSession 
} = authClient;