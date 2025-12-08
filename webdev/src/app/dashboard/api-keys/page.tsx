"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/eden";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import Link from "next/link";

// Define a type for the API Key structure returned by the client
type ApiKey = {
  id: string;
  name?: string;
  key?: string; // key is usually only returned on creation
  createdAt: Date;
  lastUsed?: Date;
  expiresAt?: Date;
  rateLimit?: number;
};

type UsageLog = {
  id: string;
  amount: number;
  action: string;
  resource: string | null;
  createdAt: Date;
};

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Credit & Usage State
  const [credits, setCredits] = useState<number | null>(null);
  const [plan, setPlan] = useState<string>("FREE");
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [loadingUsage, setLoadingUsage] = useState(true);

  const fetchKeys = async () => {
    try {
      const { data } = await authClient.apiKey.list();
      if (data) {
        setKeys(data as unknown as ApiKey[]);
      }
    } catch (err) {
      console.error("Failed to fetch keys", err);
    }
  };

  const fetchCreditsAndUsage = async () => {
    setLoadingUsage(true);
    try {
      // Fetch Credits
      const { data: creditData } = await api.api.business.credits.get();
      if (creditData) {
        setCredits(creditData.credits);
        setPlan(creditData.plan);
      }

      // Fetch Usage
      const { data: usageData } = await api.api.business.usage.get();
      if (usageData) {
        setUsageLogs(usageData.usage);
      }
    } catch (err) {
      console.error("Failed to fetch usage data", err);
    } finally {
      setLoadingUsage(false);
    }
  };

  useEffect(() => {
    fetchKeys();
    fetchCreditsAndUsage();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setGeneratedKey(null);

    try {
      const { data, error } = await authClient.apiKey.create({
        name: newKeyName,
        // You could set metadata or expiration here if needed/supported
      });

      if (error) {
        // Better Auth might return specific error message or generic one
        // If intercepted by our route handler, it typically returns 403
        setError(error.message || "Failed to create key. Check your credits.");
      } else if (data) {
        setGeneratedKey(data.key);
        setNewKeyName("");
        fetchKeys(); // Refresh list
        fetchCreditsAndUsage(); // Refresh usage potentially if we decide to charge for keys later
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this API key? This action cannot be undone."
      )
    )
      return;

    try {
      await authClient.apiKey.delete({
        keyId: id,
      });
      fetchKeys();
    } catch (err) {
      console.error("Failed to delete key", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="pb-6 border-b border-slate-200/60">
        <h1 className="text-4xl font-bold text-slate-900">API Keys</h1>
        <p className="text-slate-600 mt-2 text-sm">
          Generate and manage your API keys to access our platform securely
        </p>
      </div>

      {/* Balance & Create Section */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Balance Card - Dark Theme */}
        <Card className="border border-slate-700/40 bg-slate-900 text-white shadow-lg rounded-xl overflow-hidden md:col-span-1">
          <CardContent className="pt-6 pb-6">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">
              Available Credits
            </p>
            <p className="text-4xl font-bold text-white mb-4">
              {loadingUsage ? (
                <Loader2 className="h-6 w-6 animate-spin inline" />
              ) : (
                credits?.toLocaleString() ?? 0
              )}
            </p>
            <div className="flex items-center justify-between gap-3">
              <Badge
                variant="outline"
                className="bg-slate-800 border-slate-700 text-slate-300 text-xs"
              >
                {plan}
              </Badge>
              <Link
                href="/dashboard/plans"
                className="text-teal-400 hover:text-teal-300 font-semibold text-xs transition-colors"
              >
                Top Up →
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Create Key Card */}
        <Card className="border border-slate-200/60 bg-white shadow-md rounded-xl md:col-span-2">
          <CardHeader className="pb-4 border-b border-slate-200/40 bg-linear-to-r from-slate-50/80 via-slate-50/40 to-transparent">
            <CardTitle className="text-lg font-bold text-slate-900">
              Generate New API Key
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <Label
                  htmlFor="keyName"
                  className="text-sm font-semibold text-slate-900 mb-2 block"
                >
                  Key Name
                </Label>
                <Input
                  id="keyName"
                  placeholder="e.g. Production API, Staging, Mobile App"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="text-sm border-slate-200/60 focus:border-teal-500 focus:ring-teal-500/20 h-10"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={loading || (credits !== null && credits < 1)}
                className="w-full bg-linear-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold text-sm h-10 shadow-md hover:shadow-lg transition-all"
              >
                {loading ? "Generating..." : "Generate Key"}
              </Button>
              {error && (
                <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200/50">
                  {error}
                </p>
              )}
              {credits !== null && credits < 1 && (
                <p className="text-amber-600 text-sm bg-amber-50 p-3 rounded-lg border border-amber-200/50">
                  Insufficient credits.{" "}
                  <Link href="/dashboard/plans" className="font-bold underline">
                    Add credits
                  </Link>
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Generated Key Success */}
      {generatedKey && (
        <Card className="border border-emerald-200/60 bg-emerald-50/80 rounded-xl shadow-md overflow-hidden">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600/20">
                <Check className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-emerald-700 text-sm">
                  Key Generated Successfully!
                </p>
                <p className="text-emerald-600 text-xs mt-1">
                  Save this key now. You won't see it again.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white border border-emerald-200 rounded-lg p-3 mb-3">
              <Input
                value={generatedKey}
                readOnly
                className="font-mono text-xs border-0 bg-transparent"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigator.clipboard.writeText(generatedKey)}
                className="text-teal-600 hover:text-teal-700 hover:bg-teal-50/50 font-semibold text-xs"
              >
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Keys and Usage */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Your Keys */}
        <Card className="border border-slate-200/60 bg-white shadow-md rounded-xl overflow-hidden">
          <CardHeader className="pb-4 border-b border-slate-200/40 bg-linear-to-r from-slate-50/80 via-slate-50/40 to-transparent">
            <CardTitle className="text-lg font-bold text-slate-900">
              Your API Keys ({keys.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {keys.length === 0 ? (
              <div className="text-center py-12">
              
                <p className="text-slate-600 font-medium">
                  No API keys created yet
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  Generate your first key to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {keys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-4 border border-slate-200/60 rounded-lg bg-slate-50/50 hover:bg-slate-100/60 hover:border-teal-300/50 transition-all group"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 group-hover:text-teal-600 transition-colors text-sm">
                        {key.name || "Unnamed Key"}
                      </p>
                      <div className="flex gap-3 mt-2 text-xs text-slate-500">
                        <span>
                          Created {new Date(key.createdAt).toLocaleDateString()}
                        </span>
                        {key.lastUsed && (
                          <span>
                            Last used{" "}
                            {new Date(key.lastUsed).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteKey(key.id)}
                      className="text-xs border-red-300/60 text-red-600 hover:bg-red-50 ml-3 shrink-0"
                    >
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage History */}
        <Card className="border border-slate-200/60 bg-white shadow-md rounded-xl overflow-hidden">
          <CardHeader className="pb-4 border-b border-slate-200/40 bg-linear-to-r from-slate-50/80 via-slate-50/40 to-transparent">
            <CardTitle className="text-lg font-bold text-slate-900">
              Usage History
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 mt-1">
              Recent credit consumption
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 max-h-[400px] overflow-y-auto">
            {loadingUsage ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
              </div>
            ) : usageLogs.length === 0 ? (
              <div className="text-center py-12">
               
                <p className="text-slate-600 font-medium">
                  No usage recorded yet
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {usageLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors text-sm"
                  >
                    <div className="flex-1">
                      <p className="text-slate-900 font-medium">{log.action}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">-{log.amount}</p>
                      {log.resource && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {log.resource}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
