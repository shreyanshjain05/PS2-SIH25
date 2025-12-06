import { Elysia, t } from "elysia";
import { prismaBusiness } from "@/lib/db/business";
import Razorpay from "razorpay";
import crypto from "crypto";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "secret_placeholder",
});

const PLANS = {
  STARTER: { amount: 49900, credits: 5000, name: "Starter Plan" }, // Amount in paise
  GROWTH: { amount: 199900, credits: 50000, name: "Growth Plan" },
  ENTERPRISE: { amount: 799900, credits: 250000, name: "Enterprise Plan" },
};

export const businessService = new Elysia({ prefix: "/business" })
  .get("/plans", () => ({ plans: PLANS }))

  .get("/credits", async (context: any) => {
    const { headers, user } = context;
    const userId = user?.id || headers['x-user-id'];
     if (!userId) {
            console.error("Authorization Failed: No userId found in Context or Headers");
            throw new Error("Unauthorized");
        }
    
    // Find business by userId
    const business = await prismaBusiness.business.findUnique({ where: { userId } });
    if (!business) return { credits: 0, plan: "FREE" };
    
    return { credits: business.credits, plan: business.plan, balance: business.walletBalance };
  })

  .post("/subscription/create-order", async (context: any) => {
    const { body, headers, user } = context;
    console.log("Create Order Request Received");
    console.log("Headers:", headers);
    console.log("User from Context:", user);
    
    try {
        const { planType, amount } = body as { planType?: keyof typeof PLANS, amount?: number };
        const userId = user?.id || headers['x-user-id']; // Fallback for testing
        console.log("Resolved UserId:", userId);

        if (!userId) {
            console.error("Authorization Failed: No userId found in Context or Headers");
            throw new Error("Unauthorized");
        }

    let price = 0;
    if (planType && PLANS[planType]) {
      price = PLANS[planType].amount;
    } else if (amount) {
        price = amount * 100; // Custom amount in rupees to paise
    } else {
        throw new Error("Invalid Plan or Amount");
    }

    const order = await razorpay.orders.create({
      amount: price,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: { userId, planType: planType || "CREDIT_TOPUP" }
    });

    console.log("Order Created:", order);

    return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID
    };

    } catch (error) {
        console.error("Create Order Error:", error);
        throw new Error("Failed to create subscription order");
    }
  })

  .post("/subscription/verify", async (context: any) => {
    const { body, headers, user } = context;
     try {
     const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planType } = body as any;
     const userId = user?.id || headers['x-user-id'];
     if (!userId) throw new Error("Unauthorized");

     // Verify Signature
     const secret = process.env.RAZORPAY_KEY_SECRET || "secret_placeholder";
     console.log("Verifying Payment:", { razorpay_order_id, razorpay_payment_id, razorpay_signature });
     
     const generated_signature = crypto
        .createHmac("sha256", secret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

     console.log("Generated Signature:", generated_signature);
     console.log("Received Signature:", razorpay_signature);

     if (generated_signature !== razorpay_signature) {
        throw new Error("Payment Verification Failed");
     }

     // Update DB
     const credits = planType && PLANS[planType as keyof typeof PLANS] 
        ? PLANS[planType as keyof typeof PLANS].credits 
        : 0; // If just wallet topup vs plan purchase - simple logic for now: Plan = Credits

     // Upsert Business
     const business = await prismaBusiness.business.upsert({
         where: { userId },
         update: { 
             credits: { increment: credits },
             plan: planType && PLANS[planType as keyof typeof PLANS] ? planType as any : undefined
         },
         create: {
             userId,
             name: "New Business", // Default name
             credits: credits,
             plan: planType && PLANS[planType as keyof typeof PLANS] ? planType as any : "FREE"
         }
     });

     // Log Transaction
     await prismaBusiness.transaction.create({
         data: {
             businessId: business.id,
             amount: 0, // Should fetch from order, simplified for now
             type: "PLAN_PURCHASE",
             status: "SUCCESS",
             razorpayOrderId: razorpay_order_id,
             razorpayPaymentId: razorpay_payment_id
         }
     });

     return { success: true, credits: business.credits, plan: business.plan };
     } catch (error) {
        console.error("Verify Subscription Error:", error);
        throw new Error("Payment Verification Failed");
     }
  })
  
  // Internal endpoint for Gateway to call
  .post("/credits/consume", async ({ body }) => {
      const { userId, count } = body as { userId: string, count: number };
      const business = await prismaBusiness.business.findUnique({ where: { userId } });
      
      if (!business || business.credits < count) {
          return { success: false, error: "Insufficient Credits" };
      }
      
      await prismaBusiness.business.update({
          where: { userId },
          data: { credits: { decrement: count }}
      });
      
      return { success: true, remaining: business.credits - count };
  });

// Export type for Eden
export type BusinessApp = typeof businessService;
