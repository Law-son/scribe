"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";

interface RichTextEditorProps {
  value: object | null;
  onChange: (json: object) => void;
  placeholder?: string;
  className?: string;
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded text-sm transition-colors ${
        active
          ? "bg-navy text-cream"
          : "text-navy hover:bg-cream-dark"
      }`}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({ value, onChange, placeholder, className = "" }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ HTMLAttributes: { class: "rounded-lg max-w-full" } }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-gold-dark underline" } }),
      Placeholder.configure({ placeholder: placeholder ?? "Begin writing…" }),
    ],
    content: value ?? "",
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
    editorProps: {
      attributes: {
        class: "prose-church outline-none min-h-[400px] p-6 focus:outline-none",
      },
    },
  });

  // Sync external value changes (e.g. on edit load)
  useEffect(() => {
    if (editor && value && JSON.stringify(editor.getJSON()) !== JSON.stringify(value)) {
      editor.commands.setContent(value);
    }
  // Only run on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!editor) return null;

  return (
    <div className={`border border-cream-dark rounded-xl overflow-hidden bg-white tiptap-editor ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-cream-dark bg-cream-light">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1">
          H1
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
          H2
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
          H3
        </ToolbarButton>
        <div className="w-px bg-cream-dark mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
          • List
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered List">
          1. List
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Quote">
          ❝
        </ToolbarButton>
        <div className="w-px bg-cream-dark mx-1" />
        <ToolbarButton
          onClick={() => {
            const url = prompt("Enter URL:");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          active={editor.isActive("link")}
          title="Add Link"
        >
          🔗
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            const url = prompt("Enter image URL:");
            if (url) editor.chain().focus().setImage({ src: url }).run();
          }}
          title="Add Image"
        >
          🖼️
        </ToolbarButton>
        <div className="w-px bg-cream-dark mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
          ↩
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
          ↪
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
