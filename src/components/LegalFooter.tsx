import Link from "next/link";

export function LegalFooter({ className = "" }: { className?: string }) {
  return (
    <p className={`legalFooter small muted ${className}`.trim()}>
      <Link href="/privacy">Privacy</Link>
      <span aria-hidden="true"> · </span>
      <Link href="/terms">Terms</Link>
    </p>
  );
}
