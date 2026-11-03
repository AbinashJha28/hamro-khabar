import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export interface CommentItem {
  id: number;
  author: string;
  text: string;
  time: string;
}

export interface NewsItem {
  id: number;
  title: string;
  category: "Technology" | "Education" | "Sports";
  summary: string;
  time: string;
  likes: number;
  comments: CommentItem[];
}

const DB_FILE_PATH = path.join(process.cwd(), "news-db.json");

const INITIAL_NEWS: NewsItem[] = [
  {
    id: 1,
    title: "Kathmandu Tech Ecosystem Sees Record Growth in 2026",
    category: "Technology",
    summary:
      "Local software companies and startups in Kupondole and Pulchowk expand hiring for full-stack developers.",
    time: "10 mins ago",
    likes: 14,
    comments: [
      {
        id: 101,
        author: "Ramesh K.",
        text: "Great news for freshers learning Next.js and TypeScript!",
        time: "5 mins ago",
      },
    ],
  },
  {
    id: 2,
    title: "Nepal Engineering Council Updates Licensing Guidelines",
    category: "Education",
    summary:
      "New syllabus and modern engineering domains prioritized for the upcoming technical licensing exams.",
    time: "1 hour ago",
    likes: 9,
    comments: [],
  },
  {
    id: 3,
    title: "Nagarjun-Shivapuri Trail Marathon Announced",
    category: "Sports",
    summary:
      "Over five hundred domestic and international runners register for the grueling high-altitude trail race.",
    time: "3 hours ago",
    likes: 6,
    comments: [],
  },
  {
    id: 4,
    title: "New Cloud & AI Hub Launched in Patan",
    category: "Technology",
    summary:
      "Incubator provides free server credits and mentorship for junior engineers building production apps.",
    time: "4 hours ago",
    likes: 21,
    comments: [],
  },
];

async function readDatabase(): Promise<NewsItem[]> {
  try {
    const fileData = await fs.readFile(DB_FILE_PATH, "utf-8");
    const parsed = JSON.parse(fileData);
    // Ensure older articles in news-db.json automatically get likes & comments fields
    return parsed.map((item: NewsItem) => ({
      ...item,
      likes: item.likes ?? 0,
      comments: item.comments ?? [],
    }));
  } catch {
    await fs.writeFile(DB_FILE_PATH, JSON.stringify(INITIAL_NEWS, null, 2));
    return INITIAL_NEWS;
  }
}

// 1. GET: Read all articles
export async function GET() {
  const articles = await readDatabase();
  return NextResponse.json(articles);
}

// 2. POST: Create a new article
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const articles = await readDatabase();

    const newArticle: NewsItem = {
      id: Date.now(),
      title: body.title,
      category: body.category,
      summary: body.summary,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      likes: 0,
      comments: [],
    };

    const updatedArticles = [newArticle, ...articles];
    await fs.writeFile(DB_FILE_PATH, JSON.stringify(updatedArticles, null, 2));

    return NextResponse.json(newArticle, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to publish article" },
      { status: 400 }
    );
  }
}

// 3. PUT: Update an article (Edit text, Like, or Add Comment)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const articles = await readDatabase();

    let updatedItem: NewsItem | null = null;

    const updatedArticles = articles.map((item) => {
      if (item.id !== body.id) return item;

      // Action A: Increment Likes
      if (body.action === "like") {
        updatedItem = { ...item, likes: (item.likes || 0) + 1 };
        return updatedItem;
      }

      // Action B: Add a Comment
      if (body.action === "comment") {
        const newComment: CommentItem = {
          id: Date.now(),
          author: body.author || "Reader",
          text: body.text,
          time: "Just now",
        };
        updatedItem = {
          ...item,
          comments: [...(item.comments || []), newComment],
        };
        return updatedItem;
      }

      // Action C: Edit Article Title / Category / Summary
      updatedItem = {
        ...item,
        title: body.title ?? item.title,
        category: body.category ?? item.category,
        summary: body.summary ?? item.summary,
      };
      return updatedItem;
    });

    await fs.writeFile(DB_FILE_PATH, JSON.stringify(updatedArticles, null, 2));
    return NextResponse.json(updatedItem);
  } catch {
    return NextResponse.json(
      { error: "Failed to update article" },
      { status: 400 }
    );
  }
}

// 4. DELETE: Remove an article
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    const articles = await readDatabase();
    const updatedArticles = articles.filter((item) => item.id !== id);

    await fs.writeFile(DB_FILE_PATH, JSON.stringify(updatedArticles, null, 2));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete article" },
      { status: 400 }
    );
  }
}