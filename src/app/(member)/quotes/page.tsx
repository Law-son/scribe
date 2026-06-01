import { headers } from "next/headers";
import connectDB from "@/lib/db";
import Quote from "@/models/Quote";
import { LikeButton } from "@/components/content/LikeButton";

export const metadata = { title: "Quotes" };

export default async function QuotesPage() {
  const headersList = await headers();
  const userId = headersList.get("x-user-id");

  await connectDB();
  const quotes = await Quote.find({ status: "published" }).sort({ createdAt: -1 }).limit(30).lean();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-navy font-bold">Inspirational Quotes</h1>
        <p className="text-navy/60 font-body mt-1">Words that light the path of faith.</p>
      </div>

      {quotes.length === 0 ? (
        <p className="text-center text-navy/50 font-body py-16">No quotes yet.</p>
      ) : (
        <div className="space-y-5">
          {quotes.map((q) => {
            const isLiked = userId ? q.likes.some((l) => l.toString() === userId) : false;
            return (
              <div key={q._id.toString()} className="bg-white border border-cream-dark rounded-2xl p-7 hover:border-gold/40 transition-colors">
                <p className="font-heading text-xl text-navy-dark italic leading-relaxed mb-4">
                  &ldquo;{q.text}&rdquo;
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-body text-gold-dark font-medium">— {q.author}</span>
                  <LikeButton
                    contentType="quotes"
                    contentId={q._id.toString()}
                    initialLiked={isLiked}
                    initialCount={q.likesCount}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
