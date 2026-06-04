import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import connectDB from "@/lib/db";
import BibleStudy from "@/models/BibleStudy";
import Comment from "@/models/Comment";
import { RichTextRenderer } from "@/components/content/RichTextRenderer";
import { BibleVerseModal } from "@/components/content/BibleVerseModal";
import { LikeButton } from "@/components/content/LikeButton";
import { ShareButton } from "@/components/content/ShareButton";
import { CommentSection } from "@/components/content/CommentSection";
import { ReadingProgress } from "@/components/content/ReadingProgress";
import { ViewTracker } from "@/components/content/ViewTracker";
import { format } from "date-fns";

export default async function BibleStudyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const headersList = await headers();
  const userId = headersList.get("x-user-id");

  await connectDB();
  const [doc, comments] = await Promise.all([
    BibleStudy.findOne({ _id: id, status: "published" }).lean(),
    Comment.find({ contentType: "bible_study", contentId: id }).sort({ createdAt: -1 }).limit(50).populate("authorId", "name").lean(),
  ]);

  if (!doc) notFound();

  const isLiked = userId ? doc.likes.some((l) => l.toString() === userId) : false;

  return (
    <>
      <ReadingProgress />
      <ViewTracker contentType="bible-study" contentId={id} />
      <article className="max-w-2xl mx-auto px-4 py-8 lg:py-12">
        <nav className="mb-6">
          <Link href="/bible-study" className="text-sm text-navy/50 font-body hover:text-navy">← All Bible Study Notes</Link>
        </nav>
        <h1 className="font-heading text-3xl sm:text-4xl text-navy font-bold leading-tight mb-3">{doc.topic ?? doc.title}</h1>
        <p className="text-sm text-navy/50 font-body mb-8 pb-6 border-b border-cream-dark">
          {format(new Date(doc.date ?? doc.createdAt), "MMMM d, yyyy")}
        </p>
        <BibleVerseModal><RichTextRenderer content={doc.content} className="mb-10" /></BibleVerseModal>
        <div className="flex items-center gap-4 py-6 border-t border-b border-cream-dark mb-8">
          <LikeButton contentType="bible-study" contentId={id} initialLiked={isLiked} initialCount={doc.likesCount} />
          <ShareButton title={doc.topic ?? doc.title ?? "Bible Study"} />
        </div>
        <CommentSection
          contentType="bible-study"
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
