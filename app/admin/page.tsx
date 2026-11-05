/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Article {
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
  comments: unknown[];
}

export default function AdminDashboard() {
  // Authentication State (Default password set to "admin123" - change as desired)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [loginError, setLoginError] = useState<boolean>(false);

  // Dashboard Data State
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // AI Prompt State
  const [aiTopic, setAiTopic] = useState<string>("");
  const [aiCategory, setAiCategory] = useState<"Technology" | "Education" | "Business" | "Politics" | "Sports">("Technology");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const ADMIN_SECRET = "admin123"; // You can modify your admin password here

  useEffect(() => {
    if (isAuthenticated) {
      fetchArticles();
    }
  }, [isAuthenticated]);

  async function fetchArticles() {
    try {
      setIsLoading(true);
      const res = await fetch("/api/news");
      const data = await res.json();
      setArticles(data);
    } catch (err) {
      console.error("Failed to load articles", err);
    } finally {
      setIsLoading(false);
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (passwordInput === ADMIN_SECRET) {
      setIsAuthenticated(true);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  }

  async function handleAIGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!aiTopic.trim()) return;

    try {
      setIsGenerating(true);
      const res = await fetch("/api/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: aiTopic, category: aiCategory }),
      });

      if (res.ok) {
        const newArticle = await res.json();
        setArticles([newArticle, ...articles]);
        setAiTopic("");
        alert("AI successfully generated and published a new article!");
      }
    } catch (err) {
      console.error("AI generation failed", err);
      alert("Failed to generate AI article.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this article?")) return;
    try {
      const res = await fetch(`/api/news?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setArticles(articles.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
  }

  // If not logged in, show Password Lock screen
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-sm w-full p-8 shadow-2xl"
        >
          <div className="text-center mb-6">
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
              SECURE ADMIN
            </span>
            <h1 className="text-xl font-black mt-3">Hamro Khabar Portal</h1>
            <p className="text-xs text-neutral-400 mt-1">
              Enter password to access control panel
            </p>
          </div>

          <div className="mb-4">
            <input
              type="password"
              placeholder="Admin Password (admin123)"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500"
              required
            />
            {loginError && (
              <p className="text-xs text-red-500 mt-2">
                Incorrect password. Try &quot;admin123&quot;.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-500 text-white text-xs font-semibold py-3 rounded-xl transition shadow-lg shadow-red-900/40"
          >
            Unlock Dashboard
          </button>

          <div className="mt-6 text-center">
            <Link href="/" className="text-xs text-neutral-500 hover:text-neutral-300">
              ← Return to Public Website
            </Link>
          </div>
        </form>
      </main>
    );
  }

  // Total Analytics Computations
  const totalArticles = articles.length;
  const totalLikes = articles.reduce((acc, curr) => acc + (curr.likes || 0), 0);
  const totalViews = articles.reduce((acc, curr) => acc + (curr.views || 0), 0);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 font-sans pb-16">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
              ADMIN
            </span>
            <h1 className="text-xl font-black tracking-tight text-white">
              हाम्रो Khabar Control Panel
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="text-xs text-neutral-400 hover:text-white"
            >
              View Live Site ↗
            </Link>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold px-3 py-1.5 rounded-lg"
            >
              Lock Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 pt-8 space-y-8">
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <span className="text-xs text-neutral-400 uppercase tracking-wider">
              Total Articles
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-1">
              {totalArticles}
            </h2>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <span className="text-xs text-neutral-400 uppercase tracking-wider">
              Total Upvotes (❤️)
            </span>
            <h2 className="text-3xl font-extrabold text-red-500 mt-1">
              {totalLikes}
            </h2>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <span className="text-xs text-neutral-400 uppercase tracking-wider">
              Total Reader Views (👁️)
            </span>
            <h2 className="text-3xl font-extrabold text-amber-500 mt-1">
              {totalViews}
            </h2>
          </div>
        </div>

        {/* AI Content Generator Box */}
        <div className="bg-linear-to-r from-red-950/30 to-neutral-900 border border-red-900/40 rounded-2xl p-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
            🤖 Automated AI News Generator
          </span>
          <h2 className="text-lg font-bold text-white mt-1 mb-3">
            Generate & Publish Content Instantly with AI
          </h2>
          <form onSubmit={handleAIGenerate} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              required
              placeholder="Enter topic (e.g. Kathmandu Valley Electric Bus Expansion, AI in Nepal)..."
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500"
            />
            <select
              value={aiCategory}
              onChange={(e: unknown) => setAiCategory(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500"
            >
              <option value="Technology">Technology</option>
              <option value="Education">Education</option>
              <option value="Business">Business</option>
              <option value="Politics">Politics</option>
              <option value="Sports">Sports</option>
            </select>
            <button
              type="submit"
              disabled={isGenerating}
              className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-6 py-3 rounded-xl transition shrink-0 shadow-lg shadow-red-950"
            >
              {isGenerating ? "Generating AI..." : "✨ Generate & Publish"}
            </button>
          </form>
        </div>

        {/* Article Management Table */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-neutral-800 flex justify-between items-center">
            <h3 className="font-bold text-white">All Published Articles ({articles.length})</h3>
            <button
              onClick={fetchArticles}
              className="text-xs text-neutral-400 hover:text-white"
            >
              Refresh List ⟳
            </button>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-neutral-500">
              Loading admin database...
            </div>
          ) : articles.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500">
              No articles found.
            </div>
          ) : (
            <div className="divide-y divide-neutral-800">
              {articles.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-neutral-950/40 transition"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="w-14 h-14 rounded-lg object-cover bg-neutral-800 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 text-[11px] mb-1">
                        <span className="text-red-400 font-semibold">
                          {item.category}
                        </span>
                        <span className="text-neutral-500">
                          {item.time} • By {item.author}
                        </span>
                        {item.isBreaking && (
                          <span className="bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                            BREAKING
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-white line-clamp-1">
                        {item.title}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 text-xs">
                    <span className="text-neutral-400">❤️ {item.likes || 0}</span>
                    <span className="text-neutral-400">👁️ {item.views || 0}</span>
                    <span className="text-neutral-400">
                      💬 {item.comments?.length || 0}
                    </span>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="bg-red-950/60 hover:bg-red-900 border border-red-800/50 text-red-300 px-3 py-1.5 rounded-lg font-semibold transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}