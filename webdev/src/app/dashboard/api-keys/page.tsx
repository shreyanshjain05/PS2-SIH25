"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
}

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
        if (!confirm("Are you sure you want to delete this API key? This action cannot be undone.")) return;
        
        try {
            await authClient.apiKey.delete({
                keyId: id
            });
            fetchKeys();
        } catch (err) {
            console.error("Failed to delete key", err);
        }
    };

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                 <div>
                    <h1 className="text-3xl font-bold">API Access Management</h1>
                    <p className="text-muted-foreground">
                        Manage your API keys for accessing the Enterprise/Industry API Layer.
                    </p>
                 </div>
                 {/* Credit Display */}
                 <Card className="min-w-[200px]">
                    <CardHeader className="p-4 pb-2">
                        <CardDescription>Current Balance</CardDescription>
                        <CardTitle className="text-2xl">
                            {loadingUsage ? <Loader2 className="h-6 w-6 animate-spin" /> : credits?.toLocaleString() ?? 0}
                            <span className="text-sm font-normal text-muted-foreground ml-1">Credits</span>
                        </CardTitle>
                    </CardHeader>
                     <CardContent className="p-4 pt-0">
                         <div className="flex items-center justify-between text-sm">
                             <Badge variant="outline">{plan}</Badge>
                             <Link href="/dashboard/plans" className="text-primary hover:underline">
                                 Top Up
                             </Link>
                         </div>
                     </CardContent>
                 </Card>
            </div>

            {/* Create Key Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Generate New API Key</CardTitle>
                    <CardDescription>Create a new key for your application or integration. Requires active credits.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreateKey} className="flex gap-4 items-end">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="keyName">Key Name</Label>
                            <Input
                                id="keyName"
                                placeholder="e.g. My Prod App"
                                value={newKeyName}
                                onChange={(e) => setNewKeyName(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" disabled={loading || (credits !== null && credits < 1)}>
                            {loading ? "Generating..." : "Generate Key"}
                        </Button>
                    </form>
                    {error && <p className="text-destructive mt-2">{error}</p>}
                    {credits !== null && credits < 1 && (
                        <p className="text-destructive mt-2 text-sm">
                            Insufficient credits to generate a new key. Please <Link href="/dashboard/plans" className="underline">top up</Link>.
                        </p>
                    )}
                </CardContent>
                {generatedKey && (
                    <CardFooter className="bg-muted/50 border-t p-4">
                        <div className="w-full space-y-2">
                            <p className="text-sm font-medium text-green-600">Key Generated Successfully!</p>
                            <div className="flex items-center gap-2">
                                <Input value={generatedKey} readOnly className="font-mono bg-white" />
                                <Button
                                    variant="outline"
                                    onClick={() => navigator.clipboard.writeText(generatedKey)}
                                >
                                    Copy
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Warning: This key will only be shown once. Copy it now.
                            </p>
                        </div>
                    </CardFooter>
                )}
            </Card>

            <div className="grid gap-8 md:grid-cols-2">
                {/* List Keys Section */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Your API Keys</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {keys.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No API keys found.</p>
                        ) : (
                            <div className="space-y-4">
                                {keys.map((key) => (
                                    <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                            <p className="font-medium">{key.name || "Unnamed Key"}</p>
                                            <p className="text-xs text-muted-foreground font-mono">
                                                Created: {new Date(key.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-xs text-muted-foreground">Rate Limit</p>
                                                <p className="text-sm font-medium">{key.rateLimit || 1000} req/hr</p>
                                            </div>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDeleteKey(key.id)}
                                            >
                                                Revoke
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                 {/* Usage History Section */}
                 <Card className="md:col-span-1">
                     <CardHeader>
                         <CardTitle>Usage History</CardTitle>
                         <CardDescription>Recent credit consumption</CardDescription>
                     </CardHeader>
                     <CardContent>
                         {loadingUsage ? (
                             <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                         ) : usageLogs.length === 0 ? (
                             <p className="text-muted-foreground text-sm">No usage history found.</p>
                         ) : (
                             <Table>
                                 <TableHeader>
                                     <TableRow>
                                         <TableHead>Date</TableHead>
                                         <TableHead>Action</TableHead>
                                         <TableHead className="text-right">Amount</TableHead>
                                     </TableRow>
                                 </TableHeader>
                                 <TableBody>
                                     {usageLogs.map((log) => (
                                         <TableRow key={log.id}>
                                             <TableCell className="text-xs">
                                                 {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                             </TableCell>
                                             <TableCell className="text-xs font-medium">
                                                 {log.action}
                                                 {log.resource && <div className="text-[10px] text-muted-foreground truncate max-w-[100px]">{log.resource}</div>}
                                             </TableCell>
                                             <TableCell className="text-right text-xs text-red-500">
                                                 -{log.amount}
                                             </TableCell>
                                         </TableRow>
                                     ))}
                                 </TableBody>
                             </Table>
                         )}
                     </CardContent>
                 </Card>
            </div>
        </div>
    );
}
