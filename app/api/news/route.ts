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
  category: "Technology" | "Education" | "Sports" | "National" | "Business";
  summary: string;
  content: string;
  imageUrl: string;
  time: string;
  views: number;
  likes: number;
  comments: CommentItem[];
}

const DB_FILE_PATH = path.join(process.cwd(), "news-db.json");

const INITIAL_NEWS: NewsItem[] = [
  {
    id: 1,
    title: "Kathmandu Tech Ecosystem Sees Record Growth in 2026",
    category: "Technology",
    summary: "Local software companies and startups in Kupondole and Pulchowk expand hiring for full-stack developers.",
    content: "The tech corridor across Kupondole, Pulchowk, and Thapathali has recorded a 40% surge in junior software developer placements this year. Tech leaders attribute this to a booming outsourcing market and government digital transformation initiatives.",
    imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80",
    time: "10 mins ago",
    views: 342,
    likes: 45,
    comments: [
      { id: 101, author: "Aayush Shrestha", text: "Exciting times for freshers building Next.js apps!", time: "5 mins ago" }
    ],
  },
  {
    id: 2,
    title: "Nepal Engineering Council Updates Licensing Guidelines",
    category: "Education",
    summary: "New syllabus and modern engineering domains prioritized for the upcoming technical licensing exams.",
    content: "The Nepal Engineering Council has released updated directives emphasizing practical software architecture, cloud deployment, and cybersecurity standards for upcoming Computer Engineering license candidates.",
    imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80",
    time: "1 hour ago",
    views: 512,
    likes: 88,
    comments: [],
  },
  {
    id: 3,
    title: "Nagarjun-Shivapuri Trail Marathon Announced",
    category: "Sports",
    summary: "Over five hundred domestic and international runners register for the grueling high-altitude trail race.",
    content: "Registration numbers have shattered previous records for the annual Kathmandu valley ridge marathon, promoting sports tourism and endurance fitness across the hills.",
    imageUrl: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=800&q=80",
    time: "3 hours ago",
    views: 230,
    likes: 31,
    comments: [],
  },
];

async function readDatabase(): Promise<NewsItem[]> {
  try {
    const fileData = await fs.readFile(DB_FILE_PATH, "utf-8");
    const parsed = JSON.parse(fileData);
    return parsed.map((item: NewsItem) => ({
      ...item,
      content: item.content || item.summary,
      imageUrl: item.imageUrl || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80",
      views: item.views ?? Math.floor(Math.random() * 200) + 50,
      likes: item.likes ?? 0,
      comments: item.comments ?? [],
    }));
  } catch {
    await fs.writeFile(DB_FILE_PATH, JSON.stringify(INITIAL_NEWS, null, 2));
    return INITIAL_NEWS;
  }
}

export async function GET() {
  const articles = await readDatabase();
  return NextResponse.json(articles);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const articles = await readDatabase();

    const newArticle: NewsItem = {
      id: Date.now(),
      title: body.title,
      category: body.category || "Technology",
      summary: body.summary,
      content: body.content || body.summary,
      imageUrl: body.imageUrl || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80",
      time: "Just now",
      views: 1,
      likes: 0,
      comments: [],
    };

    const updatedArticles = [newArticle, ...articles];
    await fs.writeFile(DB_FILE_PATH, JSON.stringify(updatedArticles, null, 2));

    return NextResponse.json(newArticle, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to publish" }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const articles = await readDatabase();
    let updatedItem: NewsItem | null = null;

    const updatedArticles = articles.map((item) => {
      if (item.id !== body.id) return item;

      if (body.action === "like") {
        updatedItem = { ...item, likes: (item.likes || 0) + 1 };
        return updatedItem;
      }

      if (body.action === "comment") {
        const newComment = {
          id: Date.now(),
          author: body.author || "Reader",
          text: body.text,
          time: "Just now",
        };
        updatedItem = { ...item, comments: [...(item.comments || []), newComment] };
        return updatedItem;
      }

      updatedItem = {
        ...item,
        title: body.title ?? item.title,
        category: body.category ?? item.category,
        summary: body.summary ?? item.summary,
        content: body.content ?? item.content,
        imageUrl: body.imageUrl ?? item.imageUrl,
      };
      return updatedItem;
    });

    await fs.writeFile(DB_FILE_PATH, JSON.stringify(updatedArticles, null, 2));
    return NextResponse.json(updatedItem);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    const articles = await readDatabase();
    const updatedArticles = articles.filter((item) => item.id !== id);

    await fs.writeFile(DB_FILE_PATH, JSON.stringify(updatedArticles, null, 2));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 400 });
  }
}