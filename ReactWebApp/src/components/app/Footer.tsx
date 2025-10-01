export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-10 grid gap-6 md:grid-cols-3 text-sm">
        <div>
          <p className="font-semibold">ChainGuard Evidence</p>
          <p className="text-muted-foreground mt-2">Trust, transparency, and accountability for digital investigations.</p>
        </div>
        <div className="space-y-2">
          <p className="font-medium">Compliance</p>
          <ul className="text-muted-foreground space-y-1">
            <li>FIPS 140-2 AES-256</li>
            <li>CJIS-aligned controls</li>
            <li>Immutable audit trails</li>
          </ul>
        </div>
        <div className="space-y-2">
          <p className="font-medium">Contact</p>
          <ul className="text-muted-foreground space-y-1">
            <li><a className="hover:text-foreground" href="mailto:security@chainguard.app">security@chainguard.app</a></li>
            <li><a className="hover:text-foreground" href="#">Status</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} ChainGuard. All rights reserved.</div>
    </footer>
  );
}
