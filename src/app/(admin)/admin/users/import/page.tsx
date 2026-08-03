"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Papa from "papaparse";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { CSV_FIELD_INFO, CSV_MAX_ROWS } from "@/lib/csvImport";

interface Failure {
  row: number;
  name?: string;
  phone?: string;
  reason: string;
}

interface ImportResult {
  total: number;
  successCount: number;
  failCount: number;
  failures: Failure[];
}

type PageState = "instructions" | "processing" | "results";

function downloadTemplate() {
  const headers = CSV_FIELD_INFO.map((f) => f.header);
  const csv = headers.join(",") + "\n";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "member-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function BulkImportPage() {
  const [state, setState] = useState<PageState>("instructions");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setState("instructions");
    setFile(null);
    setError("");
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleUpload() {
    if (!file) return;
    setError("");

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        if (rows.length === 0) {
          setError("This file has no data rows.");
          return;
        }
        if (rows.length > CSV_MAX_ROWS) {
          setError(`This file has ${rows.length} rows — the limit per upload is ${CSV_MAX_ROWS}. Please split it into smaller files.`);
          return;
        }

        setState("processing");
        try {
          const res = await fetch("/api/admin/users/bulk-import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rows }),
          });
          const data = await res.json();
          if (!res.ok) {
            setError(data.error ?? "Import failed");
            setState("instructions");
            return;
          }
          setResult(data);
          setState("results");
        } catch {
          setError("Network error. Please try again.");
          setState("instructions");
        }
      },
      error: () => setError("Could not read this file. Please make sure it's a valid CSV."),
    });
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/users" className="text-navy/50 hover:text-navy font-body text-sm">← Members</Link>
        <span className="text-navy/30">/</span>
        <h1 className="font-heading text-2xl text-navy font-bold">Bulk Import Members</h1>
      </div>

      {state === "processing" && (
        <div className="bg-white border border-cream-dark rounded-xl p-12 flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-navy/60 font-body">Importing members…</p>
        </div>
      )}

      {state === "instructions" && (
        <div className="space-y-6">
          <div className="bg-white border border-cream-dark rounded-xl p-6 space-y-4">
            <h2 className="font-heading text-base text-navy font-semibold">How it works</h2>
            <p className="text-sm text-navy/70 font-body">
              Upload a CSV file of members using the exact column headings below. Members are identified by
              phone number — rows with a phone number that already exists are skipped. Fields left out (or
              left blank) still create the account, but that member&apos;s profile is marked incomplete and
              they&apos;ll be asked to fill it in the next time they log in.
            </p>
            <p className="text-sm text-navy/70 font-body">
              Since imported accounts have no password, members will need to use{" "}
              <span className="font-medium text-navy">&quot;Set your password&quot;</span> on the login screen
              (verified via an SMS code to their phone) before they can sign in.
            </p>
          </div>

          <div className="bg-white border border-cream-dark rounded-xl overflow-hidden">
            <div className="px-6 pt-6 pb-2">
              <h2 className="font-heading text-base text-navy font-semibold">Column headings</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cream-light border-b border-cream-dark">
                  <tr>
                    <th className="text-left px-5 py-2 text-xs font-body font-semibold text-navy/50 uppercase">Heading</th>
                    <th className="text-left px-5 py-2 text-xs font-body font-semibold text-navy/50 uppercase">Required</th>
                    <th className="text-left px-5 py-2 text-xs font-body font-semibold text-navy/50 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-dark">
                  {CSV_FIELD_INFO.map((f) => (
                    <tr key={f.header}>
                      <td className="px-5 py-2.5 text-sm font-body font-medium text-navy whitespace-nowrap">{f.header}</td>
                      <td className="px-5 py-2.5">
                        {f.required ? <Badge variant="burgundy">Required</Badge> : <Badge variant="gray">Optional</Badge>}
                      </td>
                      <td className="px-5 py-2.5 text-sm text-navy/60 font-body">{f.hint ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-cream-light/50 border-t border-cream-dark">
              <Button type="button" variant="secondary" size="sm" onClick={downloadTemplate}>
                Download CSV Template
              </Button>
            </div>
          </div>

          <div className="bg-white border border-cream-dark rounded-xl p-6 space-y-4">
            <h2 className="font-heading text-base text-navy font-semibold">Upload file</h2>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(""); }}
              className="block w-full text-sm font-body text-navy/70 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-navy file:text-cream file:text-sm file:font-medium hover:file:bg-navy-light file:cursor-pointer cursor-pointer"
            />
            {error && (
              <p className="text-sm text-burgundy font-body bg-burgundy/5 border border-burgundy/20 rounded-lg px-3 py-2">{error}</p>
            )}
            <Button type="button" onClick={handleUpload} disabled={!file}>
              Upload and Import
            </Button>
          </div>
        </div>
      )}

      {state === "results" && result && (
        <div className="space-y-6">
          <div className="bg-white border border-cream-dark rounded-xl p-6">
            <h2 className="font-heading text-base text-navy font-semibold mb-4">Import complete</h2>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="green">{result.successCount} imported</Badge>
              <Badge variant="burgundy">{result.failCount} failed</Badge>
              <span className="text-sm text-navy/50 font-body">{result.total} rows processed</span>
            </div>
          </div>

          {result.failures.length > 0 && (
            <div className="bg-white border border-cream-dark rounded-xl overflow-hidden">
              <div className="px-6 pt-6 pb-2">
                <h2 className="font-heading text-base text-navy font-semibold">Rows that couldn&apos;t be processed</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-cream-light border-b border-cream-dark">
                    <tr>
                      <th className="text-left px-5 py-2 text-xs font-body font-semibold text-navy/50 uppercase">Row</th>
                      <th className="text-left px-5 py-2 text-xs font-body font-semibold text-navy/50 uppercase">Member</th>
                      <th className="text-left px-5 py-2 text-xs font-body font-semibold text-navy/50 uppercase">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-dark">
                    {result.failures.map((f) => (
                      <tr key={f.row}>
                        <td className="px-5 py-2.5 text-sm font-body text-navy">{f.row}</td>
                        <td className="px-5 py-2.5 text-sm font-body text-navy/70">
                          {f.name ?? f.phone ? [f.name, f.phone].filter(Boolean).join(" — ") : "—"}
                        </td>
                        <td className="px-5 py-2.5 text-sm font-body text-navy/60">{f.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button type="button" onClick={reset}>Import another file</Button>
            <Link href="/admin/users">
              <Button type="button" variant="secondary">Back to Members</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
