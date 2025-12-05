import { createAuthClient } from "better-auth/react"

import { auth } from "./auth"

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL // Make sure to change this in production
})

export const { 
    signIn, 
    signUp, 
    signOut, 
    useSession 
} = authClient;