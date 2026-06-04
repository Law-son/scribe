import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import connectDB from "@/lib/db";
import Devotional from "@/models/Devotional";
import Comment from "@/models/Comment";
import { RichTextRenderer } from "@/components/content/RichTextRenderer";
import { BibleVerseModal } from "@/components/content/BibleVerseModal";
import { LikeButton } from "@/components/content/LikeButton";
import { CommentSection } from "@/components/content/CommentSection";
import { ReadingProgress } from "@/components/content/ReadingProgress";
import { ViewTracker } from "@/components/content/ViewTracker";
import { format } from "date-fns";

export default async function DevotionalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  const now = new Date();

  await connectDB();
  const [doc, comments] = await Promise.all([
    Devotional.findOne({ _id: id, status: "approved" as const, scheduledAt: { $lte: now } }).lean(),
    Comment.find({ contentType: "devotional", contentId: id }).sort({ createdAt: -1 }).limit(50).populate("authorId", "name").lean(),
  ]);

  if (!doc) notFound();

  const isLiked = userId ? doc.likes.some((l) => l.toString() === userId) : false;

  return (
    <>
      <ReadingProgress />
      <ViewTracker contentType="devotionals" contentId={id} />
      <article className="max-w-2xl mx-auto px-4 py-8 lg:py-12">
        <nav className="mb-6">
          <Link href="/devotionals" className="text-sm text-navy/50 font-body hover:text-navy">← Devotionals</Link>
        </nav>

        <p className="text-sm text-gold-dark font-body font-medium mb-2">
          {format(new Date(doc.scheduledAt), "EEEE, MMMM d, yyyy")}
        </p>

        <h1 className="font-heading text-3xl sm:text-4xl text-navy font-bold leading-tight mb-4">
          {doc.title}
        </h1>

        {doc.verse && (
          <div className="bg-cream border border-gold/30 rounded-xl px-6 py-4 mb-8">
            <p className="text-sm text-gold-dark font-body font-semibold mb-1">{doc.verse}</p>
            {doc.verseText && (
              <p className="font-heading text-navy-dark italic leading-relaxed">&ldquo;{doc.verseText}&rdquo;</p>
            )}
          </div>
        )}

        <div className="border-t border-cream-dark pt-6 mb-6" />

        <BibleVerseModal><RichTextRenderer content={doc.content} className="mb-10" /></BibleVerseModal>

        <div className="flex items-center gap-4 py-6 border-t border-b border-cream-dark mb-8">
          <LikeButton contentType="devotionals" contentId={id} initialLiked={isLiked} initialCount={doc.likesCount} />
        </div>

        <CommentSection
          contentType="devotionals"
          contentId={id}
          initialComments={comments.map((c) => ({
            id: c._id.toString(),
            text: c.text,
            authorId: c.authorId._id?.toString() ?? c.authorId.toString(),
            authorName: (c.authorId as unknown as { name?: string }).name ?? "Member",
            createdAt: c.createdAt.toISOString(),
          }))}
        />
      </article>
    </>
  );
}
