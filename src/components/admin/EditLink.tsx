import Link from "next/link";
import { Pencil } from "lucide-react";

export function EditLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      title="Edit"
      className="inline-flex items-center gap-1.5 text-sm text-gold-dark hover:underline font-body"
    >
      <Pencil size={15} strokeWidth={1.75} className="sm:hidden" />
      <span className="hidden sm:inline">Edit</span>
    </Link>
  );
}
