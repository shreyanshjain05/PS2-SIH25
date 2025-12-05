"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

export default function ApiKeysPage() {
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [newKeyName, setNewKeyName] = useState("");
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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

    useEffect(() => {
        fetchKeys();
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
                setError(error.message || "Unknown error");
            } else if (data) {
                setGeneratedKey(data.key);
                setNewKeyName("");
                fetchKeys(); // Refresh list
            }
        } catch (err) {
            setError("An unexpected error occurred.");
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
            <h1 className="text-3xl font-bold">API Access Management</h1>
            <p className="text-muted-foreground">
                Manage your API keys for accessing the Enterprise/Industry API Layer.
            </p>

            {/* Create Key Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Generate New API Key</CardTitle>
                    <CardDescription>Create a new key for your application or integration.</CardDescription>
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
                        <Button type="submit" disabled={loading}>
                            {loading ? "Generating..." : "Generate Key"}
                        </Button>
                    </form>
                    {error && <p className="text-destructive mt-2">{error}</p>}
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

            {/* List Keys Section */}
            <Card>
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
        </div>
    );
}
