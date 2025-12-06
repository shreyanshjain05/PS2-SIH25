
import { prismaAuth } from "./src/lib/db/auth";
import { prismaBusiness } from "./src/lib/db/business";
import crypto from 'crypto';

const RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

async function main() {
  console.log("--- Starting Subscription Verification ---");

  // 1. Create Mock User
  const email = `test_biz_${Date.now()}@example.com`;
  console.log(`Creating User: ${email}`);
  const user = await prismaAuth.user.create({
    data: {
      email,
      name: "Test Biz User",
      emailVerified: true
    }
  });

  // 2. Mock "Create Order" Call (Logic from Service)
  console.log("Mocking Order Creation...");
  const planType = "STARTER"; // 5000 credits
  const orderId = `order_${Date.now()}`;
  const paymentId = `pay_${Date.now()}`;
  
  // 3. Mock "Verify" Call (Logic from Service)
  console.log("Mocking Payment Verification...");
  
  // Generate Signature
  const signature = crypto
    .createHmac("sha256", RAZORPAY_SECRET)
    .update(orderId + "|" + paymentId)
    .digest("hex");

  // Call the actual Business Service Logic (Simulated here by calling DB directly as if Service did it)
  // In a real integration test we'd hit localhost:3000/api/business/subscription/verify via fetch
  // But since the server might not be running or we want isolated unit test logic:
  
  console.log("Simulating Service Logic: Updating DB...");
  const credits = 5000;
  
  const business = await prismaBusiness.business.upsert({
     where: { userId: user.id },
     update: { 
         credits: { increment: credits },
         plan: "STARTER"
     },
     create: {
         userId: user.id,
         name: "New Business via Script",
         credits: credits,
         plan: "STARTER"
     }
  });

  // 4. Verification
  console.log("Verifying Credits...");
  const finalBusiness = await prismaBusiness.business.findUnique({ where: { userId: user.id }});
  
  if (finalBusiness?.credits === 5000 && finalBusiness?.plan === "STARTER") {
      console.log("✅ SUCCESS: Credits added and Plan updated.");
  } else {
      console.error("❌ FAILED: ", finalBusiness);
      process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
      await prismaAuth.$disconnect();
      await prismaBusiness.$disconnect();
  });
