"use client";

import React, { useState, useEffect } from "react";

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
}

function timeAgo(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NewsCard({ article }: { article: NewsItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`border-[3px] border-black bg-white transition-all duration-200 overflow-hidden ${
        expanded ? "neo-shadow-lg" : "neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
      }`}
    >
      {/* Header row — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 flex items-start gap-3 cursor-pointer group"
      >
        {/* Expand indicator */}
        <div
          className={`shrink-0 mt-0.5 w-5 h-5 border-2 border-black flex items-center justify-center transition-transform duration-200 bg-neo-yellow ${
            expanded ? "rotate-45" : ""
          }`}
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          {/* Tags row */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="font-black text-[9px] uppercase tracking-widest bg-[#EAE8E0] border border-black px-1.5 py-0.5 shrink-0">
              {article.source}
            </span>
            <span className="font-bold text-[9px] text-black/40 uppercase tracking-wider">
              {timeAgo(article.publishedAt)}
            </span>
          </div>

          {/* Headline */}
          <p className="font-black text-sm leading-snug text-black group-hover:text-neo-orange transition-colors">
            {article.title}
          </p>

          {/* Teaser — first sentence of summary */}
          {!expanded && (
            <p className="font-bold text-[11px] text-black/50 leading-relaxed mt-1 line-clamp-1">
              {article.summary.split(". ")[0]}.
            </p>
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 border-t-2 border-black/10 pt-3 flex flex-col gap-3">
          <p className="font-bold text-xs text-black/70 leading-relaxed">
            {article.summary}
          </p>
          <div className="flex items-center gap-3">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-black text-white border-2 border-black px-3 py-1.5 font-black text-[10px] uppercase tracking-widest hover:bg-neo-orange hover:text-black transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
            >
              Read Full Article
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
            <span className="font-bold text-[9px] uppercase tracking-widest text-black/30">
              AI-summarized by Hodegos
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewsSection() {
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/news");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setArticles(data.articles || []);
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNews();
  }, []);

  return (
    <div className="flex flex-col gap-4 mt-2">
      {/* Section header */}
      <div className="flex items-center justify-between border-b-4 border-black pb-3">
        <div className="flex items-center gap-3">
          <h2 className="font-black text-base uppercase tracking-widest">Market Briefing</h2>
          <div className="bg-neo-orange border-2 border-black px-2 py-0.5 font-black text-[9px] uppercase tracking-widest">
            AI Narrated
          </div>
        </div>
        <span className="font-bold text-[10px] uppercase tracking-wider text-black/40">
          {articles.length > 0 ? `${articles.length} stories` : ""}
        </span>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-[#EAE8E0] border-[3px] border-black animate-pulse"
              style={{ opacity: 1 - i * 0.15 }}
            />
          ))}
          <p className="font-bold text-[10px] uppercase tracking-widest text-black/40 text-center">
            Hodegos AI is reading the market...
          </p>
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="border-[3px] border-black bg-neo-yellow p-4 text-center">
          <p className="font-black text-xs uppercase tracking-widest">Could not load news at this time.</p>
          <p className="font-bold text-[10px] text-black/60 mt-1">Check back shortly.</p>
        </div>
      )}

      {/* News list */}
      {!isLoading && !error && articles.length > 0 && (
        <div className="flex flex-col gap-3">
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
