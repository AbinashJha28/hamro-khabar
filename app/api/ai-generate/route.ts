import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import os from "os";

interface NewsItem {
  id: number;
  title: string;
  category: "Technology" | "Education" | "Business" | "Politics" | "Sports";
  summary: string;
  imageUrl: string;
  author: string;
  isBreaking: boolean;
  time: string;
  likes: number;
  views: number;
  comments: {
    id: number;
    author: string;
    text: string;
    time: string;
  }[];
}

const DB_FILE_PATH =
  process.env.NODE_ENV === "production"
    ? path.join(os.tmpdir(), "news-db.json")
    : path.join(process.cwd(), "news-db.json");

export async function POST(request: Request) {
  try {
    const { topic, category = "Technology" } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    // Simulated high-fidelity AI generation tailored for Nepal & Kathmandu
    // (You can replace this block with an official Google Gemini SDK fetch call using process.env.GEMINI_API_KEY)
    const generatedTitle = `AI Report: ${topic} Growth and Impact Across Kathmandu Valley`;
    const generatedSummary = `Recent industry analyses highlight significant milestones regarding ${topic}. Stakeholders, local developers, and institutional leaders in Kathmandu report positive shifts, paving the way for enhanced infrastructure, digital transformation, and sustainable expansion throughout Nepal.`;
    
    const randomImages = [
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=85",
    ];
    const imageUrl = randomImages[Math.floor(Math.random() * randomImages.length)];

    const newArticle: NewsItem = {
      id: Date.now(),
      title: generatedTitle,
      category: category,
      summary: generatedSummary,
      imageUrl: imageUrl,
      author: "Hamro AI Reporter",
      isBreaking: true,
      time: "Just now",
      likes: 1,
      views: 5,
      comments: [
        {
          id: Date.now() + 1,
          author: "System Bot",
          text: `Automatically synthesized via AI analysis on "${topic}".`,
          time: "Just now",
        }
      ],
    };

    // Read existing database and prepend AI article
    let articles: NewsItem[] = [];
    try {
      const fileData = await fs.readFile(DB_FILE_PATH, "utf-8");
      articles = JSON.parse(fileData);
    } catch {
      articles = [];
    }

    const updatedArticles = [newArticle, ...articles];
    await fs.writeFile(DB_FILE_PATH, JSON.stringify(updatedArticles, null, 2));

    return NextResponse.json(newArticle, { status: 201 });
  } catch (err) {
    console.error("AI Generation Error:", err);
    return NextResponse.json({ error: "Failed to generate AI article" }, { status: 500 });
  }
}