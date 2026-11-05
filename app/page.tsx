"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface CommentItem {
  id: number;
  author: string;
  text: string;
  time: string;
}

interface Article {
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

const CATEGORIES = ["All", "Technology", "Education", "Sports", "National", "Business", "Saved ★"] as const;

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"web" | "mobile">("web");

  // Modals
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [isPublishOpen, setIsPublishOpen] = useState<boolean>(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  // Form States
  const [formTitle, setFormTitle] = useState<string>("");
  const [formCategory, setFormCategory] = useState<"Technology" | "Education" | "Sports" | "National" | "Business">("Technology");
  const [formSummary, setFormSummary] = useState<string>("");
  const [formContent, setFormContent] = useState<string>("");
  const [formImageUrl, setFormImageUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Comments
  const [commentAuthor, setCommentAuthor] = useState<string>("");
  const [commentText, setCommentText] = useState<string>("");

  useEffect(() => {
    async function loadNews() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/news");
        const data = await res.json();
        setArticles(data);
      } catch (err) {
        console.error("Failed to load news:", err);
      } finally {
        setIsLoading(false);
      }
    }
    queueMicrotask(() => {
      const stored = localStorage.getItem("hamro_khabar_saved");
      if (stored) setSavedIds(JSON.parse(stored));
    });
    loadNews();
  }, []);

  function toggleBookmark(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    const updated = savedIds.includes(id) ? savedIds.filter(i => i !== id) : [...savedIds, id];
    setSavedIds(updated);
    localStorage.setItem("hamro_khabar_saved", JSON.stringify(updated));
  }

  async function handleLike(id: number, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    try {
      const res = await fetch("/api/news", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "like" }),
      });
      if (res.ok) {
        const updated = await res.json();
        setArticles(articles.map(a => a.id === id ? updated : a));
        if (activeArticle?.id === id) setActiveArticle(updated);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this article?")) return;
    try {
      const res = await fetch(`/api/news?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setArticles(articles.filter(a => a.id !== id));
        if (activeArticle?.id === id) setActiveArticle(null);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSaveArticle(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle.trim() || !formSummary.trim()) return;

    try {
      setIsSubmitting(true);
      if (editingArticle) {
        const res = await fetch("/api/news", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingArticle.id,
            title: formTitle,
            category: formCategory,
            summary: formSummary,
            content: formContent || formSummary,
            imageUrl: formImageUrl,
          }),
        });
        if (res.ok) {
          const updated = await res.json();
          setArticles(articles.map(a => a.id === updated.id ? updated : a));
          setIsPublishOpen(false);
        }
      } else {
        const res = await fetch("/api/news", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formTitle,
            category: formCategory,
            summary: formSummary,
            content: formContent || formSummary,
            imageUrl: formImageUrl,
          }),
        });
        if (res.ok) {
          const created = await res.json();
          setArticles([created, ...articles]);
          setIsPublishOpen(false);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!activeArticle || !commentText.trim()) return;
    try {
      const res = await fetch("/api/news", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeArticle.id,
          action: "comment",
          author: commentAuthor.trim() || "Reader",
          text: commentText.trim(),
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setArticles(articles.map(a => a.id === updated.id ? updated : a));
        setActiveArticle(updated);
        setCommentText("");
      }
    } catch (err) {
      console.error(err);
    }
  }

  const filtered = articles.filter(item => {
    const matchesCat = selectedCategory === "All" ? true : selectedCategory === "Saved ★" ? savedIds.includes(item.id) : item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 font-sans pb-20">
      {/* Top Bar */}
      <header className="border-b border-neutral-800 bg-neutral-900/80 backdrop-blur sticky top-0 z-40 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">LIVE</span>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
            हाम्रो <span className="text-red-500">Khabar</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Device Simulator Toggle */}
          <div className="bg-neutral-950 border border-neutral-800 p-1 rounded-lg hidden sm:flex gap-1 text-xs">
            <button
              onClick={() => setViewMode("web")}
              className={`px-3 py-1 rounded ${viewMode === "web" ? "bg-neutral-800 text-white font-bold" : "text-neutral-400 hover:text-white"}`}
            >
              💻 Web App
            </button>
            <button
              onClick={() => setViewMode("mobile")}
              className={`px-3 py-1 rounded ${viewMode === "mobile" ? "bg-red-600 text-white font-bold" : "text-neutral-400 hover:text-white"}`}
            >
              📱 Mobile App View
            </button>
          </div>

          <button
            onClick={() => {
              setEditingArticle(null);
              setFormTitle(""); setFormSummary(""); setFormContent(""); setFormImageUrl("");
              setIsPublishOpen(true);
            }}
            className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-lg shadow-red-900/30 cursor-pointer"
          >
            + Publish
          </button>
        </div>
      </header>

      {/* Main Container Wrapper (Switches to Mobile Phone Frame if Mobile View is active) */}
      <div className={`mx-auto transition-all duration-300 ${viewMode === "mobile" ? "max-w-sm my-8 border-10 border-neutral-800 rounded-[40px] overflow-hidden bg-neutral-950 shadow-2xl ring-8 ring-neutral-900" : "max-w-6xl px-6"}`}>
        
        {/* Mobile Notch Bar if mobile view */}
        {viewMode === "mobile" && (
          <div className="bg-neutral-900 py-2 text-center border-b border-neutral-800 text-[10px] text-neutral-400 font-mono tracking-widest uppercase">
            Hamro Khabar • Android / iOS View
          </div>
        )}

        {/* Hero Banner */}
        <section className="pt-6 pb-2 px-4 md:px-0">
          <div className="bg-linear-to-r from-red-950/50 to-neutral-900 border border-red-900/40 rounded-xl p-5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-red-400">Nepal&apos;s Unified News Engine</span>
            <h2 className="text-lg md:text-xl font-bold mt-1 text-white">
              Real-time Kathmandu & National Feed
            </h2>
            <p className="text-neutral-400 text-xs mt-1">
              Active Category: <strong className="text-red-400">{selectedCategory}</strong> ({filtered.length} stories)
            </p>
          </div>
        </section>

        {/* Search Bar */}
        <section className="py-2 px-4 md:px-0">
          <input
            type="text"
            placeholder="Search breaking news, tech, exams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
          />
        </section>

        {/* Category Pills */}
        <section className="py-2 px-4 md:px-0 flex gap-1.5 overflow-x-auto no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat ? "bg-red-600 text-white shadow" : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </section>

        {/* News Feed Grid */}
        <section className="py-3 px-4 md:px-0">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map(n => (
                <div key={n} className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4 animate-pulse h-36"></div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-neutral-800 rounded-xl">
              <p className="text-neutral-400 text-xs">No news stories found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filtered.map(item => {
                const isSaved = savedIds.includes(item.id);
                return (
                  <article
                    key={item.id}
                    onClick={() => setActiveArticle(item)}
                    className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex flex-col sm:flex-row hover:border-neutral-700 transition cursor-pointer group"
                  >
                    <div className="sm:w-36 h-32 sm:h-auto bg-neutral-950 relative overflow-hidden shrink-0">
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 144px"
                        unoptimized
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <span className="absolute top-2 left-2 bg-black/70 backdrop-blur text-[10px] text-red-400 font-semibold px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                    </div>

                    <div className="p-4 flex flex-col justify-between flex-1">
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-1">
                          <span>{item.time}</span>
                          <button onClick={(e) => toggleBookmark(item.id, e)} className={`text-sm ${isSaved ? "text-amber-400" : "text-neutral-500 hover:text-white"}`}>
                            ★
                          </button>
                        </div>
                        <h3 className="font-bold text-white text-sm leading-snug group-hover:text-red-400 transition mb-1">
                          {item.title}
                        </h3>
                        <p className="text-neutral-400 text-xs line-clamp-2 leading-relaxed">
                          {item.summary}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                        <div className="flex items-center gap-3">
                          <button onClick={(e) => handleLike(item.id, e)} className="flex items-center gap-1 hover:text-red-400 transition">
                            <span>❤️</span> {item.likes || 0}
                          </button>
                          <span>💬 {item.comments?.length || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingArticle(item);
                              setFormTitle(item.title);
                              setFormCategory(item.category);
                              setFormSummary(item.summary);
                              setFormContent(item.content);
                              setFormImageUrl(item.imageUrl);
                              setIsPublishOpen(true);
                            }}
                            className="hover:text-white"
                          >
                            Edit
                          </button>
                          <button onClick={(e) => handleDelete(item.id, e)} className="hover:text-red-400">
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ARTICLE READER MODAL */}
      {activeArticle && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="bg-red-950 text-red-400 border border-red-800/50 px-2.5 py-1 rounded font-medium">
                {activeArticle.category}
              </span>
              <span className="text-neutral-400">{activeArticle.time}</span>
            </div>

            <h2 className="text-xl font-black text-white mb-3 leading-snug">
              {activeArticle.title}
            </h2>

            <div className="relative w-full h-56 rounded-xl overflow-hidden mb-4 bg-neutral-950">
              <Image
                src={activeArticle.imageUrl}
                alt={activeArticle.title}
                fill
                unoptimized
                sizes="(max-width: 640px) 100vw, 576px"
                className="object-cover"
              />
            </div>

            <p className="text-neutral-300 text-xs md:text-sm leading-relaxed mb-6 whitespace-pre-line">
              {activeArticle.content}
            </p>

            <div className="flex items-center justify-between border-y border-neutral-800 py-3 mb-6">
              <button
                onClick={() => handleLike(activeArticle.id)}
                className="bg-red-950/50 hover:bg-red-900/50 border border-red-800/40 text-red-300 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-2 transition"
              >
                ❤️ Upvote Story ({activeArticle.likes || 0})
              </button>
              <span className="text-xs text-neutral-400">
                💬 {activeArticle.comments?.length || 0} Comments
              </span>
            </div>

            {/* Comments List */}
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Community Discussion</h4>
              {(!activeArticle.comments || activeArticle.comments.length === 0) ? (
                <p className="text-xs text-neutral-500 italic">No comments yet. Join the conversation!</p>
              ) : (
                activeArticle.comments.map(c => (
                  <div key={c.id} className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
                    <div className="flex justify-between text-[11px] mb-1">
                      <strong className="text-red-400">{c.author}</strong>
                      <span className="text-neutral-500">{c.time}</span>
                    </div>
                    <p className="text-xs text-neutral-300">{c.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment */}
            <form onSubmit={handleAddComment} className="space-y-2 mb-6">
              <input
                type="text"
                placeholder="Your Name"
                value={commentAuthor}
                onChange={(e) => setCommentAuthor(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
                <button type="submit" className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2 rounded-lg">
                  Post
                </button>
              </div>
            </form>

            <div className="flex justify-end">
              <button onClick={() => setActiveArticle(null)} className="bg-neutral-800 hover:bg-neutral-750 text-white text-xs font-semibold px-4 py-2 rounded-xl">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PUBLISH / EDIT MODAL */}
      {isPublishOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSaveArticle} className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white mb-4">
              {editingArticle ? "Edit Article" : "Publish Breaking News"}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">Headline</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  placeholder="e.g., Nepal Telecom Launches 5G..."
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as Article["category"])}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                >
                  <option value="Technology">Technology</option>
                  <option value="Education">Education</option>
                  <option value="Sports">Sports</option>
                  <option value="National">National</option>
                  <option value="Business">Business</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Image URL (Optional)</label>
                <input
                  type="url"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Short Summary</label>
                <textarea
                  rows={2}
                  required
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  placeholder="Brief preview..."
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Full Article Content</label>
                <textarea
                  rows={4}
                  required
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  placeholder="Detailed news coverage..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setIsPublishOpen(false)}
                className="bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-semibold px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2 rounded-xl"
              >
                {isSubmitting ? "Saving..." : editingArticle ? "Update Story" : "Publish Now"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}