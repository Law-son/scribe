import { headers } from "next/headers";
import { notFound } from "next/navigation";
import connectDB from "@/lib/db";
import Sermon from "@/models/Sermon";
import Comment from "@/models/Comment";
import { RichTextRenderer } from "@/components/content/RichTextRenderer";
import { BibleVerseModal } from "@/components/content/BibleVerseModal";
import { LikeButton } from "@/components/content/LikeButton";
import { ShareButton } from "@/components/content/ShareButton";
import { CommentSection } from "@/components/content/CommentSection";
import { SocialSidebar } from "@/components/content/SocialSidebar";
import { Badge } from "@/components/ui/Badge";
import { ReadingProgress } from "@/components/content/ReadingProgress";
import { ViewTracker } from "@/components/content/ViewTracker";
import { format } from "date-fns";
import Link from "next/link";
import type { SerializedComment } from "@/types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();
  const sermon = await Sermon.findById(id).select("title preacher").lean();
  if (!sermon) return { title: "Sermon" };

  const title = `${sermon.title} — ${sermon.preacher}`;
  const description = `A sermon by ${sermon.preacher} on UCM Scribe.`;
  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/sermons/${id}`;

  return {
    title,
    description,
    openGraph: { title, description, url, type: "article" },
    twitter: { card: "summary", title, description },
  };
}

export default async function SermonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  const role = headersList.get("x-user-role");

  await connectDB();

  const query = role === "admin" ? { _id: id } : { _id: id, status: "published" as const };
  const [sermon, allComments] = await Promise.all([
    Sermon.findOne(query).lean(),
    Comment.find({ contentType: "sermon", contentId: id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("authorId", "name")
      .lean(),
  ]);

  if (!sermon) notFound();

  const isLiked = userId ? sermon.likes.some((l) => l.toString() === userId) : false;

  function serializeComment(c: (typeof allComments)[0]): SerializedComment {
    return {
      id: c._id.toString(),
      text: c.text,
      authorId: c.authorId._id?.toString() ?? c.authorId.toString(),
      authorName: (c.authorId as unknown as { name?: string }).name ?? "Member",
      createdAt: c.createdAt.toISOString(),
      parentId: c.parentId?.toString(),
      likesCount: c.likesCount ?? 0,
      isLiked: userId ? (c.likes ?? []).some((l) => l.toString() === userId) : false,
      replies: [],
    };
  }

  const roots = allComments.filter((c) => !c.parentId);
  const replies = allComments.filter((c) => c.parentId);
  const serializedComments: SerializedComment[] = roots.map((root) => ({
    ...serializeComment(root),
    replies: replies
      .filter((r) => r.parentId?.toString() === root._id.toString())
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map(serializeComment),
  }));

  const wordCount = JSON.stringify(sermon.content).split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <>
      <ReadingProgress />
      <ViewTracker contentType="sermons" contentId={id} />

      <article className="max-w-2xl mx-auto px-4 py-8 lg:py-12">
        {sermon.status !== "published" && (
          <div className="mb-6 rounded-lg bg-gold/10 border border-gold/30 px-4 py-2.5 text-sm font-body text-gold-dark">
            Preview mode — this sermon is currently a draft and not visible to members.
          </div>
        )}
        <nav className="mb-6">
          <Link href="/sermons" className="text-sm text-navy/50 font-body hover:text-navy">
            ← All Sermons
          </Link>
        </nav>

        <div className="flex flex-wrap gap-2 mb-4">
          {sermon.tags?.map((tag) => <Badge key={tag} variant="navy">{tag}</Badge>)}
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl text-navy font-bold leading-tight mb-4">
          {sermon.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-navy/60 font-body mb-8 pb-6 border-b border-cream-dark">
          <span className="font-medium text-navy">{sermon.preacher}</span>
          <span>·</span>
          <span>{format(new Date(sermon.date ?? sermon.createdAt), "MMMM d, yyyy")}</span>
          <span>·</span>
          <span>{readingTime} min read</span>
          <span>·</span>
          <span>👁 {sermon.viewsCount ?? 0}</span>
        </div>

        {sermon.videoUrl && (
          <div className="mb-8 rounded-xl overflow-hidden aspect-video bg-navy">
            <iframe
              src={sermon.videoUrl.replace("watch?v=", "embed/")}
              className="w-full h-full"
              allowFullScreen
              title={sermon.title}
            />
          </div>
        )}

        <BibleVerseModal>
          <RichTextRenderer content={sermon.content} className="mb-10" />
        </BibleVerseModal>

        <div className="flex items-center gap-4 py-6 border-t border-b border-cream-dark mb-8">
          <LikeButton
            contentType="sermons"
            contentId={id}
            initialLiked={isLiked}
            initialCount={sermon.likesCount}
          />
          {sermon.pdfUrl && (
            <a
              href={sermon.pdfUrl}
              download
              className="flex items-center gap-2 text-sm font-body text-navy/60 hover:text-navy border border-cream-dark rounded-full px-3 py-1.5 transition-colors"
            >
              📄 Download PDF
            </a>
          )}
          <ShareButton title={sermon.title} />
        </div>

        <SocialSidebar />

        <CommentSection
          contentType="sermons"
          contentId={id}
          initialComments={serializedComments}
          currentUserId={userId ?? undefined}
        />
      </article>
    </>
  );
}
