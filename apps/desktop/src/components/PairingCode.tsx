"use client";

import { useState, useEffect } from "react";
import { Button } from "@clipsync/ui";
import { api } from "@/lib/api";
import { Copy, RefreshCw, Check } from "lucide-react";
import { useToast } from "@clipsync/ui";
import { QRCodeSVG } from "qrcode.react";
import { useTheme } from "next-themes";

interface PairingCodeData {
  code: string;
  expiresAt: string;
  qrData: string;
}

export default function PairingCode() {
  const { theme, resolvedTheme } = useTheme();
  const [pairingData, setPairingData] = useState<PairingCodeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  // Determine if dark mode is active
  const isDark = resolvedTheme === "dark" || theme === "dark";

  const generateCode = async () => {
    try {
      setLoading(true);
      const data = await api.pairing.generateCode();
      setPairingData(data);
      const expiresAt = new Date(data.expiresAt).getTime();
      const now = Date.now();
      setTimeLeft(Math.max(0, Math.floor((expiresAt - now) / 1000)));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate pairing code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!pairingData) return;

    const interval = setInterval(() => {
      const expiresAt = new Date(pairingData.expiresAt).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeLeft(remaining);

      if (remaining === 0) {
        // Code expired, generate new one
        generateCode();
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairingData]);

  const copyCode = () => {
    if (pairingData) {
      navigator.clipboard.writeText(pairingData.code);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Pairing code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const renderQRCode = () => {
    if (!pairingData) return null;
    
    // QR code colors adapt to theme
    const qrFgColor = isDark ? "#ffffff" : "#000000";
    const qrBgColor = isDark ? "#000000" : "#ffffff";
    
    return (
      <div className="flex flex-col items-center justify-center">
        <div className={`p-5 rounded-lg border transition-colors ${
          isDark 
            ? "bg-black/50 border-border" 
            : "bg-white border-border"
        }`}>
          <QRCodeSVG
            value={pairingData.qrData || pairingData.code}
            size={220}
            level="H"
            includeMargin={true}
            fgColor={qrFgColor}
            bgColor={qrBgColor}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-4">Scan with your mobile device</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
        {pairingData ? (
          <>
            {/* QR Code */}
            <div className="flex justify-center py-2">
              {renderQRCode()}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-border"></div>
              <span className="text-xs text-muted-foreground px-3 font-medium">OR</span>
              <div className="flex-1 h-px bg-border"></div>
            </div>

            {/* Pairing Code */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Pairing Code</label>
              <div className="flex items-center gap-3">
                <div className={`flex-1 px-6 py-4 rounded-lg border text-center transition-colors ${
                  isDark 
                    ? "bg-secondary/50 border-border" 
                    : "bg-muted/50 border-border"
                }`}>
                  <span className="text-2xl font-mono font-bold tracking-widest text-foreground">
                    {pairingData.code.toUpperCase()}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyCode}
                  title="Copy code"
                  className="h-12 w-12 shrink-0"
                >
                  {copied ? (
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Timer */}
            <div className={`text-center py-3 px-4 rounded-lg border ${
              isDark 
                ? "bg-secondary/30 border-border" 
                : "bg-muted/30 border-border"
            }`}>
              <p className="text-sm text-muted-foreground">
                Code expires in{" "}
                <span className={`font-mono font-semibold ${
                  timeLeft <= 30 
                    ? "text-red-600 dark:text-red-400" 
                    : "text-foreground"
                }`}>
                  {formatTime(timeLeft)}
                </span>
              </p>
            </div>

            <Button
              onClick={generateCode}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Generating..." : "Generate New Code"}
            </Button>
          </>
        ) : (
          <div className="text-center py-12">
            <Button 
              onClick={generateCode} 
              disabled={loading}
              size="lg"
            >
              {loading ? "Generating..." : "Generate Pairing Code"}
            </Button>
          </div>
        )}
    </div>
  );
}
