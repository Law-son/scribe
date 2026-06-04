import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const translation = searchParams.get("translation") ?? "NKJV";
  const book = searchParams.get("book");
  const chapter = searchParams.get("chapter");

  if (!book || !chapter) {
    return NextResponse.json({ error: "Missing book or chapter" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://bolls.life/get-chapter/${translation}/${book}/${chapter}/`,
      { next: { revalidate: 86400 } } // cache for 24h — scripture doesn't change
    );
    if (!res.ok) throw new Error(`bolls.life responded ${res.status}`);
    const verses = await res.json();
    return NextResponse.json({ verses });
  } catch (err) {
    console.error("Bible API error:", err);
    return NextResponse.json({ error: "Failed to fetch chapter" }, { status: 502 });
  }
}
