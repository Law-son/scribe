export type UserRole = "member" | "admin";
export type ContentStatus = "draft" | "published";
export type DevotionalStatus = "pending" | "approved" | "rejected";

export type PointAction =
  | "daily_login"
  | "view_sermon"
  | "read_bible_study"
  | "read_devotional"
  | "read_quote"
  | "register_convert";

export interface TokenPayload {
  sub: string;
  role: UserRole;
  name: string;
  iat?: number;
  exp?: number;
}

export interface SerializedUser {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  totalPoints: number;
  isActive: boolean;
  createdAt: string;
}

export interface SerializedSermon {
  id: string;
  title: string;
  preacher: string;
  date: string;
  content: object;
  videoUrl?: string;
  pdfUrl?: string;
  tags: string[];
  likesCount: number;
  viewsCount: number;
  status: ContentStatus;
  publishedAt?: string;
  authorId: string;
  createdAt: string;
  isLiked?: boolean;
}

export interface SerializedBibleStudy {
  id: string;
  title: string;
  topic: string;
  date: string;
  content: object;
  category?: string;
  likesCount: number;
  status: ContentStatus;
  authorId: string;
  createdAt: string;
  isLiked?: boolean;
}

export interface SerializedDevotional {
  id: string;
  title: string;
  verse?: string;
  verseText?: string;
  content: object;
  scheduledAt: string;
  status: DevotionalStatus | "published";
  likesCount: number;
  authorId: string;
  createdAt: string;
  isLiked?: boolean;
}

export interface SerializedQuote {
  id: string;
  text: string;
  author: string;
  likesCount: number;
  status: ContentStatus;
  authorId: string;
  createdAt: string;
  isLiked?: boolean;
}

export interface SerializedAnnouncement {
  id: string;
  title: string;
  body: string;
  isUrgent: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface SerializedComment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
  parentId?: string;
  likesCount: number;
  isLiked: boolean;
  replies: SerializedComment[];
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  points: number;
  rank: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newThisMonth: number;
  sermons: { month: number; year: number };
  bibleStudies: { month: number; year: number };
  devotionals: { month: number; year: number };
  announcements: { month: number; year: number };
  soulsWon: { month: number; year: number };
}
