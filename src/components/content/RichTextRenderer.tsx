import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";

interface RichTextRendererProps {
  content: object;
  className?: string;
}

export function RichTextRenderer({ content, className = "" }: RichTextRendererProps) {
  let html = "";
  try {
    html = generateHTML(content as Parameters<typeof generateHTML>[0], [
      StarterKit,
      Image.configure({ HTMLAttributes: { class: "rounded-lg max-w-full my-4" } }),
      Link.configure({ HTMLAttributes: { class: "text-gold-dark underline underline-offset-2", target: "_blank", rel: "noopener noreferrer" } }),
    ]);
  } catch {
    html = "<p>Content unavailable.</p>";
  }

  return (
    <div
      className={`prose-church ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
