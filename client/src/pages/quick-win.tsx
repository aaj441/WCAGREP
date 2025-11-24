import React, { useState } from "react";

export default function QuickWin() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleScan = async () => {
    if (!url) return;

    setLoading(true);
    try {
      const res = await fetch("/api/scan/quick-win", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, companyName: "Test Company" }),
      });

      const data = await res.json();
      setResult(data);

      // Poll for completion
      if (data.id) {
        pollScanStatus(data.id);
      }
    } catch (error) {
      console.error("Scan failed:", error);
    }
  };

  const pollScanStatus = async (scanId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/scan/${scanId}`);
        const data = await res.json();

        if (data.status === "completed" || data.status === "failed") {
          clearInterval(interval);
          setResult(data);
          setLoading(false);
        }
      } catch (error) {
        console.error("Poll failed:", error);
        clearInterval(interval);
        setLoading(false);
      }
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-4">Quick Win WCAG Scan</h1>
      <p className="text-muted-foreground mb-8">
        Get a comprehensive accessibility audit in 5 minutes
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Website URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <button
          onClick={handleScan}
          disabled={loading || !url}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
        >
          {loading ? "Scanning..." : "Start Scan"}
        </button>

        {result && (
          <div className="mt-8 p-6 border rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Scan Results</h2>
            <div className="space-y-2">
              <p><strong>Status:</strong> {result.status}</p>
              <p><strong>Scan ID:</strong> {result.id}</p>
              {result.wcagScore !== undefined && (
                <>
                  <p><strong>WCAG Score:</strong> {result.wcagScore}/100</p>
                  <p><strong>Critical Issues:</strong> {result.criticalCount}</p>
                  <p><strong>Serious Issues:</strong> {result.seriousCount}</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
