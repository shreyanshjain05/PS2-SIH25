
import { prismaAuth } from "./src/lib/db/auth";
import { auth } from "./src/lib/auth";

async function main() {
  console.log("Connecting to Auth DB...");
  const keys = await prismaAuth.apiKey.findMany();
  console.log("Found keys:", keys.length);
  
  const testKey = "nGZFunkrzJLVKgtQWqjVspEDYueMxyshyJpqoHMuRncySHUZJwWqixKjKIXzHRCb"; 
  console.log("Testing Key:", testKey);

  try {
      // Trying likely method names based on Better Auth patterns
      // Note: 'verifyKey' might be on the client or server API. 
      // check 'auth.api' structure
      console.log("Auth API methods:", Object.keys(auth.api));
      
      // Attempt verification with verifyApiKey
      // @ts-ignore
      if (auth.api.verifyApiKey) {
           console.log("Calling auth.api.verifyApiKey...");
           
           try {
               // Try with body
               // @ts-ignore
               const resBody = await auth.api.verifyApiKey({
                   body: { key: testKey }
               });
               console.log("Result (Body method):", resBody);
           } catch(e) { console.log("Body method failed", e); }

      } else {
          console.log("No verifyApiKey method found");
      }

  } catch (err) {
      console.error("Verification Error:", err);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prismaAuth.$disconnect());
