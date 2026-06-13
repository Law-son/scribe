import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import connectDB from "@/lib/db";
import Devotional from "@/models/Devotional";
import Comment from "@/models/Comment";
import { RichTextRenderer } from "@/components/content/RichTextRenderer";
import { BibleVerseModal } from "@/components/content/BibleVerseModal";
import { LikeButton } from "@/components/content/LikeButton";
import { ShareButton } from "@/components/content/ShareButton";
import { CommentSection } from "@/components/content/CommentSection";
import { SocialSidebar } from "@/components/content/SocialSidebar";
import { ReadingProgress } from "@/components/content/ReadingProgress";
import { ViewTracker } from "@/components/content/ViewTracker";
import type { SerializedComment } from "@/types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();
  const doc = await Devotional.findOne({ _id: id, status: "approved" as const }).select("title topic verse").lean();
  if (!doc) return { title: "Devotional" };

  const title = doc.topic ?? doc.title ?? "Devotional";
  const description = doc.verse ? `${title} — ${doc.verse}` : title;
  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/devotionals/${id}`;

  return {
    title,
    description,
    openGraph: { title, description, url, type: "article" },
    twitter: { card: "summary", title, description },
  };
}

export default async function DevotionalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  const role = headersList.get("x-user-role");
  const now = new Date();

  await connectDB();
  const query =
    role === "admin"
      ? { _id: id }
      : { _id: id, status: "approved" as const, scheduledAt: { $lte: now } };
  const [doc, allComments] = await Promise.all([
    Devotional.findOne(query).lean(),
    Comment.find({ contentType: "devotional", contentId: id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("authorId", "name")
      .lean(),
  ]);

  if (!doc) notFound();

  const isLiked = userId ? doc.likes.some((l) => l.toString() === userId) : false;
  const displayTitle = doc.topic ?? doc.title ?? "Devotional";

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

  return (
    <>
      <ReadingProgress />
      <ViewTracker contentType="devotionals" contentId={id} />
      <article className="max-w-2xl mx-auto px-4 py-8 lg:py-12">
        {(doc.status !== "approved" || doc.scheduledAt > now) && (
          <div className="mb-6 rounded-lg bg-gold/10 border border-gold/30 px-4 py-2.5 text-sm font-body text-gold-dark">
            Preview mode — this devotional is not yet visible to members.
          </div>
        )}
        <nav className="mb-6">
          <Link href="/devotionals" className="text-sm text-navy/50 font-body hover:text-navy">← Devotionals</Link>
        </nav>

        {doc.dayNumber ? (
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-navy/8 text-navy text-xs font-body font-semibold px-3 py-1.5 rounded-full">
              Day {doc.dayNumber}
            </span>
            {doc.weekNumber && (
              <span className="inline-flex items-center gap-1.5 bg-gold/15 text-gold-dark text-xs font-body font-semibold px-3 py-1.5 rounded-full">
                Week {doc.weekNumber}
              </span>
            )}
            {doc.weekTheme && (
              <span className="text-xs text-navy/50 font-body italic">{doc.weekTheme}</span>
            )}
          </div>
        ) : null}

        <h1 className="font-heading text-3xl sm:text-4xl text-navy font-bold leading-tight mb-4">
          {displayTitle}
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
          <ShareButton title={displayTitle} />
        </div>

        <SocialSidebar />

        <CommentSection
          contentType="devotionals"
          contentId={id}
          initialComments={serializedComments}
          currentUserId={userId ?? undefined}
        />
      </article>
    </>
  );
}
