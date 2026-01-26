"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/better-auth";
import Sidebar from "@/components/Sidebar";
import PairingCode from "@/components/PairingCode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@clipsync/ui";

export default function DevicesPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/login");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Devices</h1>
            <p className="text-muted-foreground">
              Connect your mobile device to sync clips across all your devices
            </p>
          </div>
          
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Pair Mobile Device</CardTitle>
              <CardDescription>
                Scan the QR code or enter the pairing code on your mobile app
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <PairingCode />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
