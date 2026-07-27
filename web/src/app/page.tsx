import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Root-domain fallback (no tenant subdomain). Deliberately minimal and
 * neutral: partner recruitment lives on aspira.study gateway pages, and no
 * legal entity names appear on any public surface.
 */
export default function PlatformPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-md text-center">
        <p className="text-sm uppercase tracking-widest text-muted">Aspira Web</p>
        <h1 className="mt-3 text-2xl font-semibold">
          Websites for the Aspira education partner network
        </h1>
        <p className="mt-4 text-muted">
          Partner sites are served on their own addresses. Learn more at{" "}
          <a className="underline" href="https://www.aspira.study">
            aspira.study
          </a>
          .
        </p>
      </div>
    </main>
  );
}
