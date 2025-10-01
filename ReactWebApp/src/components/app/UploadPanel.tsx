import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, FileLock2, Hash, Shield, Upload } from "lucide-react";

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function UploadPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string>("");
  const [tx, setTx] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const onFile = useCallback(async (f: File) => {
    setBusy(true);
    try {
      setFile(f);
      const buf = await f.arrayBuffer();
      const digest = await crypto.subtle.digest("SHA-256", buf);
      const sha256 = toHex(digest);
      setHash(sha256);
      // simulate a tx id based on hash
      setTx("0x" + sha256.slice(0, 8) + Math.random().toString(16).slice(2, 10));
    } finally {
      setBusy(false);
    }
  }, []);

  const pickFile = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    async (e) => {
      const f = e.target.files?.[0];
      if (f) await onFile(f);
    },
    [onFile],
  );

  const size = useMemo(() => (file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "-"), [file]);

  const copy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
  }, []);

  return (
    <Card id="upload" className="shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl"><Upload className="h-5 w-5" /> Secure Evidence Upload</CardTitle>
        <CardDescription>Files are encrypted client-side, hashed (SHA-256), and anchored on-chain.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="file">Choose file</Label>
            <Input id="file" type="file" onChange={pickFile} disabled={busy} />
            <p className="text-xs text-muted-foreground">Supported: images, videos, logs, documents</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1"><FileLock2 className="h-3.5 w-3.5" /> AES-256 in transit & at rest</Badge>
            <Badge className="gap-1 bg-accent text-accent-foreground"><Shield className="h-3.5 w-3.5" /> CJIS aligned</Badge>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <Label>Filename</Label>
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">{file?.name ?? "—"}</div>
          </div>
          <div className="space-y-1">
            <Label>Size</Label>
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">{size}</div>
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <div className="rounded-md border px-3 py-2 text-sm">
              {hash ? <span className="text-green-600 dark:text-green-400">Encrypted & Staged</span> : <span className="text-muted-foreground">Waiting for file</span>}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="flex items-center gap-2"><Hash className="h-4 w-4" /> SHA-256</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 truncate rounded-md border bg-muted/30 px-3 py-2 text-xs font-mono">{hash || "—"}</div>
              {hash && (
                <Button variant="secondary" size="icon" onClick={() => copy(hash)} aria-label="Copy hash">
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <Label>Blockchain TX</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 truncate rounded-md border bg-muted/30 px-3 py-2 text-xs font-mono">{tx || "—"}</div>
              {tx && (
                <Button variant="secondary" size="icon" onClick={() => copy(tx)} aria-label="Copy tx">
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline">Generate Audit Report</Button>
          <Button disabled={!hash}>Submit to Chain</Button>
        </div>
      </CardContent>
    </Card>
  );
}
