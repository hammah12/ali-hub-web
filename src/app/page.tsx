"use client";

import { useState, useEffect } from "react";

type QueueItem = {
  id: string;
  type: "recipe" | "task" | "restaurant" | "update";
  status: "pending" | "approved" | "archived";
  createdAt: string;
  title: string;
  prepTime?: string;
  sourceUrl?: string;
  ingredients?: string;
  instructions?: string;
  image?: string;
  dueDate?: string;
  priority?: string;
  notes?: string;
  location?: string;
  cuisine?: string;
  halalStatus?: string;
  rating?: string;
  category?: string;
  summary?: string;
  actionNeeded?: string;
};

type Report = {
  name: string;
  content: string;
  date: string;
};

type DailyLog = {
  name: string;
  content: string;
  date: string;
};

const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/hammah12/ali-hub-data/main";
const ARCHIVE_KEY = "ali-hub-archived";
const AUTH_KEY = "ali-hub-auth";
const LIKED_RECIPES_KEY = "ali-hub-liked-recipes";
const DISLIKED_RECIPES_KEY = "ali-hub-disliked-recipes";
const EXPECTED_USERNAME = "hammah1";
const EXPECTED_PASSWORD = "shah1033";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "queue" | "archive" | "reports" | "logs">("dashboard");
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  const [reports, setReports] = useState<Report[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [likedRecipes, setLikedRecipes] = useState<Set<string>>(new Set());
  const [dislikedRecipes, setDislikedRecipes] = useState<Set<string>>(new Set());
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedLog, setSelectedLog] = useState<DailyLog | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const authed = localStorage.getItem(AUTH_KEY) === "true";
    if (authed) {
      setIsAuthorized(true);
      initializeData();
    }
  }, []);

  function initializeData() {
    // Load archived IDs from localStorage
    const saved = localStorage.getItem(ARCHIVE_KEY);
    if (saved) {
      setArchivedIds(new Set(JSON.parse(saved)));
    }

    const liked = localStorage.getItem(LIKED_RECIPES_KEY);
    if (liked) {
      setLikedRecipes(new Set(JSON.parse(liked)));
    }

    const disliked = localStorage.getItem(DISLIKED_RECIPES_KEY);
    if (disliked) {
      setDislikedRecipes(new Set(JSON.parse(disliked)));
    }

    loadData();
  }

  function saveArchivedIds(ids: Set<string>) {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify([...ids]));
    setArchivedIds(ids);
  }

  function archiveItem(id: string) {
    const newIds = new Set(archivedIds);
    newIds.add(id);
    saveArchivedIds(newIds);
    setSelectedItem(null);
  }

  function restoreItem(id: string) {
    const newIds = new Set(archivedIds);
    newIds.delete(id);
    saveArchivedIds(newIds);
    setSelectedItem(null);
  }

  function saveLikedRecipes(ids: Set<string>) {
    localStorage.setItem(LIKED_RECIPES_KEY, JSON.stringify([...ids]));
    setLikedRecipes(ids);
  }

  function saveDislikedRecipes(ids: Set<string>) {
    localStorage.setItem(DISLIKED_RECIPES_KEY, JSON.stringify([...ids]));
    setDislikedRecipes(ids);
  }

  function likeRecipe(id: string) {
    const newLiked = new Set(likedRecipes);
    const newDisliked = new Set(dislikedRecipes);
    newLiked.add(id);
    newDisliked.delete(id);
    saveLikedRecipes(newLiked);
    saveDislikedRecipes(newDisliked);
  }

  function dislikeRecipe(id: string) {
    const newLiked = new Set(likedRecipes);
    const newDisliked = new Set(dislikedRecipes);
    newDisliked.add(id);
    newLiked.delete(id);
    saveLikedRecipes(newLiked);
    saveDislikedRecipes(newDisliked);
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (username === EXPECTED_USERNAME && password === EXPECTED_PASSWORD) {
      localStorage.setItem(AUTH_KEY, "true");
      setIsAuthorized(true);
      setLoginError(null);
      initializeData();
    } else {
      setLoginError("Invalid credentials");
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      const cacheBust = `?t=${Date.now()}`;
      const queueRes = await fetch(`${GITHUB_RAW_BASE}/queue.json${cacheBust}`);
      if (queueRes.ok) {
        const data = await queueRes.json();
        setQueueItems(data.items || []);
      }

      const reportsRes = await fetch(`${GITHUB_RAW_BASE}/reports/index.json${cacheBust}`);
      if (reportsRes.ok) {
        const data = await reportsRes.json();
        setReports(data.reports || []);
      }

      const logsRes = await fetch(`${GITHUB_RAW_BASE}/memory/index.json${cacheBust}`);
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error("Failed to load data:", e);
    }
    setLoading(false);
  }

  async function loadReportContent(report: Report) {
    try {
      const res = await fetch(`${GITHUB_RAW_BASE}/reports/${report.name}.md`);
      if (res.ok) {
        const content = await res.text();
        setSelectedReport({ ...report, content });
      }
    } catch (e) {
      console.error("Failed to load report:", e);
    }
  }

  async function loadLogContent(log: DailyLog) {
    try {
      const res = await fetch(`${GITHUB_RAW_BASE}/memory/${log.name}.md`);
      if (res.ok) {
        const content = await res.text();
        setSelectedLog({ ...log, content });
      }
    } catch (e) {
      console.error("Failed to load log:", e);
    }
  }

  // Active items (not archived)
  const activeItems = queueItems.filter((item) => !archivedIds.has(item.id));
  const archivedItems = queueItems.filter((item) => archivedIds.has(item.id));

  const filteredItems = activeItems.filter((item) => {
    if (filter === "all") return true;
    return item.type === filter;
  });

  const pendingCount = activeItems.length;
  const archivedCount = archivedItems.length;

  const typeConfig: Record<string, { icon: string; color: string; bg: string }> = {
    recipe: { icon: "🍲", color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
    task: { icon: "✅", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
    restaurant: { icon: "🍽️", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
    update: { icon: "📢", color: "text-violet-600", bg: "bg-violet-50 border-violet-200" },
  };

  const statusConfig: Record<string, { color: string; bg: string }> = {
    pending: { color: "text-amber-700", bg: "bg-amber-100" },
    approved: { color: "text-green-700", bg: "bg-green-100" },
    archived: { color: "text-gray-600", bg: "bg-gray-100" },
  };

  const isArchived = selectedItem ? archivedIds.has(selectedItem.id) : false;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-lg shadow-lg shadow-violet-200">
              🙂
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Ali Hub Access</h1>
              <p className="text-xs text-slate-500">Sign in to view your dashboard</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                autoComplete="current-password"
              />
            </div>
            {loginError && (
              <p className="text-xs text-red-600">{loginError}</p>
            )}
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors"
           >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-lg shadow-lg shadow-violet-200">
              🙂
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Ali Hub</h1>
              <p className="text-xs text-slate-500">Your personal command center</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-slate-100 sticky top-[72px] z-40">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex">
            {[
              { id: "dashboard", icon: "📊", label: "Dashboard" },
              { id: "queue", icon: "📋", label: "Queue", badge: pendingCount },
              { id: "archive", icon: "📦", label: "Archive", badge: archivedCount },
              { id: "reports", icon: "📄", label: "Reports" },
              { id: "logs", icon: "📝", label: "Logs" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 py-3 px-1 text-center text-xs font-medium transition-all relative ${
                  activeTab === tab.id
                    ? "text-violet-600"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <span className="text-base block mb-0.5">{tab.icon}</span>
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute top-1 right-1 bg-violet-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-violet-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
            <p className="text-slate-500 mt-3">Loading...</p>
          </div>
        ) : (
          <>
            {/* Dashboard */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
                    <div className="text-2xl font-bold text-violet-600">{pendingCount}</div>
                    <div className="text-xs text-slate-500 mt-1">Active</div>
                  </div>
                  <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
                    <div className="text-2xl font-bold text-slate-400">{archivedCount}</div>
                    <div className="text-xs text-slate-500 mt-1">Archived</div>
                  </div>
                  <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
                    <div className="text-2xl font-bold text-emerald-600">{reports.length}</div>
                    <div className="text-xs text-slate-500 mt-1">Reports</div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-slate-800 mb-3">Recent Items</h2>
                  <div className="space-y-3">
                    {activeItems.slice(0, 4).map((item) => (
                      <ItemCard key={item.id} item={item} typeConfig={typeConfig} statusConfig={statusConfig} onClick={() => setSelectedItem(item)} />
                    ))}
                    {activeItems.length === 0 && (
                      <div className="text-center py-8 text-slate-500">No active items</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Queue */}
            {activeTab === "queue" && (
              <div>
                <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-4 px-4">
                  {[
                    { id: "all", label: "All", icon: "📋" },
                    { id: "recipe", label: "Recipes", icon: "🍲" },
                    { id: "task", label: "Tasks", icon: "✅" },
                    { id: "restaurant", label: "Restaurants", icon: "🍽️" },
                    { id: "update", label: "Updates", icon: "📢" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilter(f.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                        filter === f.id
                          ? "bg-violet-600 text-white shadow-lg shadow-violet-200"
                          : "bg-white text-slate-600 border border-slate-200 hover:border-violet-300"
                      }`}
                    >
                      <span>{f.icon}</span>
                      {f.label}
                    </button>
                  ))}
                </div>

                {filteredItems.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-5xl mb-3">✨</div>
                    <p className="text-slate-500">No active items</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredItems.map((item) => (
                      <ItemCard key={item.id} item={item} typeConfig={typeConfig} statusConfig={statusConfig} onClick={() => setSelectedItem(item)} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Archive */}
            {activeTab === "archive" && (
              <div>
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Archived Items</h2>
                {archivedItems.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-5xl mb-3">📦</div>
                    <p className="text-slate-500">No archived items</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {archivedItems.map((item) => (
                      <ItemCard key={item.id} item={item} typeConfig={typeConfig} statusConfig={statusConfig} onClick={() => setSelectedItem(item)} isArchived />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reports */}
            {activeTab === "reports" && (
              <div>
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Nightly Operations Reports</h2>
                {reports.length === 0 ? (
                  <div className="text-center py-16 text-slate-500">No reports yet</div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div
                        key={report.name}
                        onClick={() => loadReportContent(report)}
                        className="bg-white rounded-xl p-4 border border-slate-200 cursor-pointer hover:shadow-md hover:border-violet-200 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-lg">
                            📊
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-slate-800">{report.name}</div>
                            <div className="text-sm text-slate-500">{report.date}</div>
                          </div>
                          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Logs */}
            {activeTab === "logs" && (
              <div>
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Daily Activity Logs</h2>
                {logs.length === 0 ? (
                  <div className="text-center py-16 text-slate-500">No logs yet</div>
                ) : (
                  <div className="space-y-3">
                    {logs.map((log) => (
                      <div
                        key={log.name}
                        onClick={() => loadLogContent(log)}
                        className="bg-white rounded-xl p-4 border border-slate-200 cursor-pointer hover:shadow-md hover:border-violet-200 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-lg">
                            📝
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-slate-800">{log.name}</div>
                            <div className="text-sm text-slate-500">{log.date}</div>
                          </div>
                          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{typeConfig[selectedItem.type]?.icon}</span>
                {isArchived && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    Archived
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-5">
              <h2 className="text-xl font-bold text-slate-800 mb-4">{selectedItem.title}</h2>

              {selectedItem.image && (
                <img
                  src={selectedItem.image}
                  alt=""
                  className="w-full h-48 object-cover rounded-xl mb-4"
                />
              )}

              <div className="space-y-4">
                {selectedItem.type === "recipe" && (
                  <>
                    <InfoCard icon="⏱️" label="Prep Time" value={selectedItem.prepTime} />
                    <InfoCard
                      icon="🔗"
                      label="Source"
                      value={
                        selectedItem.sourceUrl ? (
                          <a href={selectedItem.sourceUrl} target="_blank" className="text-violet-600 underline">
                            View Recipe
                          </a>
                        ) : undefined
                      }
                    />
                    <InfoCard icon="🥗" label="Ingredients" value={selectedItem.ingredients} pre />
                    <InfoCard icon="👨‍🍳" label="Instructions" value={selectedItem.instructions} pre />
                  </>
                )}

                {selectedItem.type === "task" && (
                  <>
                    <InfoCard icon="📅" label="Due Date" value={selectedItem.dueDate} />
                    <InfoCard icon="🎯" label="Priority" value={selectedItem.priority} />
                    <InfoCard icon="📝" label="Notes" value={selectedItem.notes} pre />
                  </>
                )}

                {selectedItem.type === "restaurant" && (
                  <>
                    <InfoCard icon="📍" label="Location" value={selectedItem.location} />
                    <InfoCard icon="🍴" label="Cuisine" value={selectedItem.cuisine} />
                    <InfoCard icon="✅" label="Halal Status" value={selectedItem.halalStatus} />
                    <InfoCard icon="⭐" label="Rating" value={selectedItem.rating} />
                    {selectedItem.summary && <InfoCard icon="💬" label="Notes" value={selectedItem.summary} />}
                  </>
                )}

                {selectedItem.type === "update" && (
                  <>
                    <InfoCard icon="📁" label="Category" value={selectedItem.category} />
                    <InfoCard icon="📋" label="Summary" value={selectedItem.summary} />
                    <InfoCard icon="⚡" label="Action Needed" value={selectedItem.actionNeeded} />
                  </>
                )}
              </div>

              <div className="mt-6">
                {isArchived ? (
                  <button 
                    onClick={() => restoreItem(selectedItem.id)}
                    className="w-full bg-violet-500 hover:bg-violet-600 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <span>↩️</span> Restore to Queue
                  </button>
                ) : (
                  <button 
                    onClick={() => archiveItem(selectedItem.id)}
                    className="w-full border-2 border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <span>📦</span> Move to Archive
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {selectedReport && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">{selectedReport.name}</h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-200">
                {selectedReport.content}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Log Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">{selectedLog.name}</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-200">
                {selectedLog.content}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemCard({ 
  item, 
  typeConfig, 
  statusConfig, 
  onClick,
  isArchived 
}: { 
  item: QueueItem; 
  typeConfig: Record<string, { icon: string; bg: string }>; 
  statusConfig: Record<string, { color: string; bg: string }>;
  onClick: () => void;
  isArchived?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-4 border cursor-pointer hover:shadow-md transition-all ${
        isArchived ? "border-slate-200 opacity-75" : typeConfig[item.type]?.bg || "border-slate-200"
      }`}
    >
      {item.image && (
        <img src={item.image} alt="" className="w-full h-40 object-cover rounded-lg mb-3" />
      )}
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${typeConfig[item.type]?.bg}`}>
          {typeConfig[item.type]?.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isArchived && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                Archived
              </span>
            )}
            {item.priority && !isArchived && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                {item.priority}
              </span>
            )}
          </div>
          <div className="font-semibold text-slate-800">{item.title}</div>
          {item.summary && (
            <div className="text-sm text-slate-500 mt-1 line-clamp-2">{item.summary}</div>
          )}
          <div className="text-xs text-slate-400 mt-2">
            {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </div>
        </div>
        <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  pre,
}: {
  icon: string;
  label: string;
  value?: React.ReactNode;
  pre?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
        <span>{icon}</span>
        {label}
      </div>
      <div className={`text-slate-800 ${pre ? "whitespace-pre-wrap font-mono text-sm" : ""}`}>
        {value}
      </div>
    </div>
  );
}
