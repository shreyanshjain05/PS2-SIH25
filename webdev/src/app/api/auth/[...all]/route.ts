import { auth } from "@/lib/auth";
 
export const GET = async (req: Request) => {
    return auth.handler(req);
}
 
import { prismaBusiness } from "@/lib/db/business";

export const POST = async (req: Request) => {
    const url = new URL(req.url);
    if (url.pathname.endsWith("/api-key/create")) {
        const session = await auth.api.getSession({
            headers: req.headers
        });

        if (session?.user) {
            const business = await prismaBusiness.business.findUnique({
                where: { userId: session.user.id }
            });

            // Require at least 1 credit to generate keys
            if (!business || business.credits < 1) {
                return new Response(JSON.stringify({ 
                    message: "Insufficient credits. Please upgrade your plan or top up credits." 
                }), { 
                    status: 403,
                    headers: { "Content-Type": "application/json" }
                });
            }
        }
    }
    return auth.handler(req);
}
