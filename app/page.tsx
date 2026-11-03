"use client";

import { useState, useEffect } from "react";

interface CommentItem {
  id: number;
  author: string;
  text: string;
  time: string;
}

interface Article {
  id: number;
  title: string;
  category: "Technology" | "Education" | "Sports";
  summary: string;
  time: string;
  likes: number;
  comments: CommentItem[];
}

const CATEGORIES = ["All", "Technology", "Education", "Sports", "Saved ★"] as const;

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [isPublishOpen, setIsPublishOpen] = useState<boolean>(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  // Publish / Edit Form States
  const [formTitle, setFormTitle] = useState<string>("");
  const [formCategory, setFormCategory] = useState<"Technology" | "Education" | "Sports">("Technology");
  const [formSummary, setFormSummary] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Comment Form States
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
        console.error("Failed to fetch news:", err);
      } finally {
        setIsLoading(false);
      }
    }

    const storedBookmarks = localStorage.getItem("hamro_khabar_saved");
    if (storedBookmarks) {
      setSavedIds(JSON.parse(storedBookmarks));
    }

    loadNews();
  }, []);

  function toggleBookmark(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    const updated = savedIds.includes(id)
      ? savedIds.filter((item) => item !== id)
      : [...savedIds, id];

    setSavedIds(updated);
    localStorage.setItem("hamro_khabar_saved", JSON.stringify(updated));
  }

  // Open Publish Modal
  function openCreateModal() {
    setEditingArticle(null);
    setFormTitle("");
    setFormCategory("Technology");
    setFormSummary("");
    setIsPublishOpen(true);
  }

  // Open Edit Modal with existing article data
  function openEditModal(article: Article, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingArticle(article);
    setFormTitle(article.title);
    setFormCategory(article.category);
    setFormSummary(article.summary);
    setIsPublishOpen(true);
  }

  // Handle Create (POST) or Update (PUT)
  async function handleSaveArticle(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle.trim() || !formSummary.trim()) return;

    try {
      setIsSubmitting(true);

      if (editingArticle) {
        // PUT Request (Edit existing article)
        const res = await fetch("/api/news", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingArticle.id,
            title: formTitle,
            category: formCategory,
            summary: formSummary,
          }),
        });

        if (res.ok) {
          const updated = await res.json();
          setArticles(articles.map((a) => (a.id === updated.id ? updated : a)));
          if (activeArticle?.id === updated.id) setActiveArticle(updated);
          setIsPublishOpen(false);
        }
      } else {
        // POST Request (Create new article)
        const res = await fetch("/api/news", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formTitle,
            category: formCategory,
            summary: formSummary,
          }),
        });

        if (res.ok) {
          const created = await res.json();
          setArticles([created, ...articles]);
          setIsPublishOpen(false);
        }
      }
    } catch (err) {
      console.error("Error saving article:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Like (PUT)
  async function handleLike(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const res = await fetch("/api/news", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "like" }),
      });
      if (res.ok) {
        const updated = await res.json();
        setArticles(articles.map((a) => (a.id === id ? updated : a)));
        if (activeArticle?.id === id) setActiveArticle(updated);
      }
    } catch (err) {
      console.error("Failed to like:", err);
    }
  }

  // Handle Add Comment (PUT)
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
          author: commentAuthor.trim() || "Anonymous Reader",
          text: commentText.trim(),
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setArticles(articles.map((a) => (a.id === updated.id ? updated : a)));
        setActiveArticle(updated);
        setCommentText("");
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
    }
  }

  // Handle Delete (DELETE)
  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/news?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setArticles(articles.filter((item) => item.id !== id));
        if (activeArticle?.id === id) setActiveArticle(null);
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  }

  const filteredNews = articles.filter((item) => {
    const matchesCategory =
      selectedCategory === "All"
        ? true
        : selectedCategory === "Saved ★"
        ? savedIds.includes(item.id)
        : item.category === selectedCategory;

    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 font-sans pb-16">
      {/* Top Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/60 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
              LIVE
            </span>
            <h1 className="text-2xl font-black tracking-tight text-white">
              हाम्रो <span className="text-red-500">Khabar</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-xs text-neutral-400 font-medium">
              Saved: {savedIds.length}
            </span>
            <button
              onClick={openCreateModal}
              className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
            >
              + Publish News
            </button>
          </div>
        </div>
      </header>

      {/* Banner */}
      <section className="max-w-6xl mx-auto px-6 pt-8 pb-4">
        <div className="bg-gradient-to-r from-red-950/40 to-neutral-900 border border-red-900/40 rounded-xl p-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
            Complete REST API (GET, POST, PUT, DELETE)
          </span>
          <h2 className="text-xl md:text-2xl font-bold mt-2 text-white">
            Interactive Kathmandu News & Community Portal
          </h2>
          <p className="text-neutral-400 text-sm mt-1">
            Now displaying:{" "}
            <strong className="text-red-400">{selectedCategory}</strong> (
            {filteredNews.length} articles)
          </p>
        </div>
      </section>

      {/* Search Bar */}
      <section className="max-w-6xl mx-auto px-6 pt-2 pb-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search news by headline, keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-3 text-xs text-neutral-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </section>

      {/* Category & Bookmark Pills */}
      <section className="max-w-6xl mx-auto px-6 py-2 flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
              selectedCategory === cat
                ? "bg-red-600 text-white shadow-md shadow-red-900/40"
                : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white hover:border-neutral-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </section>

      {/* News Grid */}
      <section className="max-w-6xl mx-auto px-6 py-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-neutral-900/50 border border-neutral-800/60 rounded-lg p-5 animate-pulse"
              >
                <div className="h-4 bg-neutral-800 rounded w-1/3 mb-4"></div>
                <div className="h-6 bg-neutral-800 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-neutral-800 rounded w-full mb-2"></div>
              </div>
            ))}
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-neutral-800 rounded-xl">
            <p className="text-neutral-400 text-sm">
              No articles found in this view.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredNews.map((item) => {
              const isSaved = savedIds.includes(item.id);
              return (
                <article
                  key={item.id}
                  onClick={() => setActiveArticle(item)}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 flex flex-col justify-between hover:border-neutral-700 transition cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className="text-red-400 font-medium">
                        {item.category}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500">{item.time}</span>
                        <button
                          onClick={(e) => toggleBookmark(item.id, e)}
                          title="Save article"
                          className={`text-sm px-1.5 py-0.5 rounded border transition ${
                            isSaved
                              ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                              : "border-neutral-800 text-neutral-500 hover:text-white"
                          }`}
                        >
                          ★
                        </button>
                      </div>
                    </div>
                    <h4 className="font-semibold text-white leading-snug mb-2 hover:text-red-400">
                      {item.title}
                    </h4>
                    <p className="text-neutral-400 text-sm leading-relaxed">
                      {item.summary}
                    </p>
                  </div>

                  {/* Card Footer: Likes, Comments, Edit, Delete */}
                  <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => handleLike(item.id, e)}
                        className="flex items-center gap-1 text-neutral-400 hover:text-red-400 transition"
                      >
                        <span>❤️</span>
                        <span>{item.likes || 0}</span>
                      </button>
                      <span className="text-neutral-500">
                        💬 {item.comments?.length || 0}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => openEditModal(item, e)}
                        className="text-neutral-400 hover:text-white transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        className="text-neutral-500 hover:text-red-400 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* MODAL 1: Read Story + Comments Section */}
      {activeArticle && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="bg-red-950 text-red-400 border border-red-800/50 px-2.5 py-1 rounded font-medium">
                {activeArticle.category}
              </span>
              <span className="text-neutral-400">{activeArticle.time}</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              {activeArticle.title}
            </h3>
            <p className="text-neutral-300 text-sm leading-relaxed mb-6">
              {activeArticle.summary}
            </p>

            {/* Like Button Inside Reader */}
            <div className="flex items-center justify-between border-y border-neutral-800 py-3 mb-4">
              <button
                onClick={(e) => handleLike(activeArticle.id, e)}
                className="bg-red-950/50 hover:bg-red-900/50 border border-red-800/40 text-red-300 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
              >
                ❤️ Upvote Story ({activeArticle.likes || 0})
              </button>
              <span className="text-xs text-neutral-400">
                {activeArticle.comments?.length || 0} Comments
              </span>
            </div>

            {/* Comments List */}
            <div className="mb-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Reader Discussion
              </h4>
              {(!activeArticle.comments ||
                activeArticle.comments.length === 0) ? (
                <p className="text-xs text-neutral-500 italic">
                  No comments yet. Be the first to share your thoughts!
                </p>
              ) : (
                activeArticle.comments.map((c) => (
                  <div
                    key={c.id}
                    className="bg-neutral-950 border border-neutral-800 rounded-lg p-3"
                  >
                    <div className="flex justify-between text-xs mb-1">
                      <strong className="text-red-400">{c.author}</strong>
                      <span className="text-neutral-500">{c.time}</span>
                    </div>
                    <p className="text-xs text-neutral-300">{c.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="space-y-2 mb-6">
              <input
                type="text"
                placeholder="Your Name (optional)"
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
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                >
                  Post
                </button>
              </div>
            </form>

            <div className="flex justify-end">
              <button
                onClick={() => setActiveArticle(null)}
                className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold px-4 py-2 rounded-lg"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Publish OR Edit Article Form */}
      {isPublishOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSaveArticle}
            className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-lg w-full p-6"
          >
            <h3 className="text-lg font-bold text-white mb-4">
              {editingArticle ? "Edit News Article" : "Publish Breaking News"}
            </h3>

            <div className="mb-4">
              <label className="block text-xs text-neutral-400 mb-1">
                Headline Title
              </label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs text-neutral-400 mb-1">
                Category
              </label>
              <select
                value={formCategory}
                onChange={(e) =>
                  setFormCategory(
                    e.target.value as "Technology" | "Education" | "Sports"
                  )
                }
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              >
                <option value="Technology">Technology</option>
                <option value="Education">Education</option>
                <option value="Sports">Sports</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-xs text-neutral-400 mb-1">
                News Summary / Full Story
              </label>
              <textarea
                rows={4}
                required
                value={formSummary}
                onChange={(e) => setFormSummary(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsPublishOpen(false)}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2 rounded-lg"
              >
                {isSubmitting
                  ? "Saving..."
                  : editingArticle
                  ? "Update Article"
                  : "Publish Now"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}