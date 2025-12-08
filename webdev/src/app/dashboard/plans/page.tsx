"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";

// Define Plans (Should match backend ideally, or fetch from API)
const PLANS = [
  {
    id: "STARTER",
    name: "Starter Plan",
    price: 499,
    description: "Perfect for testing and small apps.",
    credits: 5000,
    features: ["5,000 API Credits", "Basic Support", "Standard Rate Limit"],
  },
  {
    id: "GROWTH",
    name: "Growth Plan",
    price: 1999,
    description: "For scaling applications.",
    credits: 50000,
    features: [
      "50,000 API Credits",
      "Priority Support",
      "Higher Rate Limit",
      "Email & WhatsApp Support",
    ],
    highlight: true,
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise Plan",
    price: 7999,
    description: "For high-volume business needs.",
    credits: 250000,
    features: [
      "250,000 API Credits",
      "Dedicated Account Manager",
      "Custom Rate Limits",
      "SLA 99.9% Uptime",
    ],
  },
];

export default function PlansPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  // Load Razorpay Script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePurchase = async (plan: (typeof PLANS)[0]) => {
    setLoading(plan.id);
    try {
      // 1. Create Order
      // Use raw fetch to debug
      const res = await fetch("/api/business/subscription/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planType: plan.id }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Order Creation Failed (Fetch):", res.status, errText);
        alert("Failed to create order");
        setLoading(null);
        return;
      }

      const rawText = await res.text();
      console.log("Create Order Raw Response:", rawText);
      const orderData = rawText ? JSON.parse(rawText) : {};
      console.log("Create Order Response (Fetch):", orderData);

      const orderError = null; // Emulate structure for minimal diff if needed, or just proceed

      /*
      // Eden code was:
      const { data: orderData, error: orderError } = await api.api.business.subscription['create-order'].post({
        planType: plan.id as any,
      });
      */

      // 2. Open Razorpay
      const keyToUse =
        (orderData as any).keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      const orderIdToUse = (orderData as any).orderId;

      if (!keyToUse || !orderIdToUse) {
        console.error("Missing Key ID or Order ID", { keyToUse, orderIdToUse });
        alert("Configuration Error: Missing Payment Details");
        setLoading(null);
        return;
      }

      const options = {
        key: keyToUse,
        amount: (orderData as any).amount, // Already in paise
        currency: (orderData as any).currency,
        name: "EcoTrack API",
        description: `Purchase ${plan.name}`,
        order_id: orderIdToUse,
        handler: async function (response: any) {
          console.log("Razorpay Response Handler Triggered", response);

          if (!response.razorpay_order_id || !response.razorpay_signature) {
            console.error(
              "Invalid Razorpay Response: Missing Order ID or Signature. This implies a Standard Checkout was performed instead of Order Checkout."
            );
            alert("Payment Failed: Validation Missing");
            return;
          }

          // 3. Verify Payment
          try {
            // Use raw fetch for verification too
            const verifyRes = await fetch("/api/business/subscription/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planType: plan.id,
              }),
            });

            if (!verifyRes.ok) {
              const errText = await verifyRes.text();
              console.error(
                "Verification Failed (Fetch):",
                verifyRes.status,
                errText
              );
              alert("Payment Verification Failed on Server");
              return;
            }

            const verifyData = await verifyRes.json();
            console.log("Verify Response:", verifyData);

            alert(`Success! ${plan.credits} credits added.`);
            router.refresh();
          } catch (err) {
            console.error(err);
            alert("Payment Verification Failed");
          }
        },
        prefill: {
          name: "User Name", // You could fetch this from User context
          email: "user@example.com",
        },
        theme: {
          color: "#3399cc",
        },
      };

      console.log(
        "Razorpay Options Prepared:",
        JSON.stringify(options, null, 2)
      );

      // @ts-ignore
      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b border-slate-200/60">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
          Plans & Billing
        </h1>
        <p className="text-slate-500 mt-2 text-sm font-medium">
          Choose the plan that best fits your API usage needs
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 py-4">
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={`flex flex-col relative border rounded-lg transition-all duration-500 hover:shadow-2xl hover:scale-105 group border-slate-200/60 bg-white shadow-sm hover:bg-linear-to-b hover:from-slate-900 hover:to-slate-950 hover:border-teal-500/40`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-0 right-0 mx-auto w-fit bg-linear-to-r from-teal-600 to-teal-700 text-white px-3 py-1 rounded-md text-xs font-semibold shadow-lg">
                Most Popular
              </div>
            )}
            <CardHeader
              className={`pb-4 transition-all duration-500 bg-slate-50/50 group-hover:bg-linear-to-b group-hover:from-slate-900/20 group-hover:to-slate-950/20`}
            >
              <CardTitle
                className={`text-lg font-semibold transition-colors duration-500 text-slate-900 group-hover:text-white`}
              >
                {plan.name}
              </CardTitle>
              <CardDescription
                className={`transition-colors duration-500 mt-2 text-xs text-slate-500 group-hover:text-slate-300`}
              >
                {plan.description}
              </CardDescription>
            </CardHeader>
            <CardContent
              className={`flex-1 pt-4 transition-colors duration-500 group-hover:bg-slate-900/30`}
            >
              <div className="mb-6">
                <span
                  className={`text-4xl font-bold transition-colors duration-500 text-slate-900 group-hover:text-white`}
                >
                  ₹{plan.price}
                </span>
                <span
                  className={`transition-colors duration-500 text-slate-500 group-hover:text-slate-300`}
                >
                  /month
                </span>
              </div>
              <div className="space-y-3">
                <div
                  className={`flex items-center gap-2 font-semibold transition-colors duration-500 text-slate-900 group-hover:text-teal-300`}
                >
                  <Check className="h-4 w-4 text-teal-500" />
                  {plan.credits.toLocaleString()} Credits
                </div>
                {plan.features.slice(1).map((feature, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 text-sm transition-colors duration-500 text-slate-600 group-hover:text-slate-300`}
                  >
                    <Check className="h-3.5 w-3.5 text-teal-500" />
                    {feature}
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter
              className={`transition-colors duration-500 pt-4 group-hover:bg-slate-900/30`}
            >
              <Button
                className={`w-full transition-all duration-500 border border-teal-600/40 text-teal-600 hover:bg-teal-50 group-hover:border-teal-400 group-hover:text-white group-hover:bg-teal-600`}
                variant="outline"
                disabled={loading === plan.id}
                onClick={() => handlePurchase(plan)}
              >
                {loading === plan.id ? "Processing..." : "Select Plan"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
