"use client";

import { useState, useEffect } from "react";

type QueueItem = {
  id: string;
  type: "recipe" | "task" | "restaurant" | "update";
  status: "pending" | "approved" | "archived";
  createdAt: string;
  title: string;
  // Recipe
  prepTime?: string;
  sourceUrl?: string;
  ingredients?: string;
  instructions?: string;
  image?: string;
  // Task
  dueDate?: string;
  priority?: string;
  notes?: string;
  // Restaurant
  location?: string;
  cuisine?: string;
  halalStatus?: string;
  rating?: string;
  // Update
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

// This will be replaced with actual data fetching
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/hammah12/ali-hub-data/main";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "queue" | "reports" | "logs">("dashboard");
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Load queue from GitHub
      const queueRes = await fetch(`${GITHUB_RAW_BASE}/queue.json`);
      if (queueRes.ok) {
        const data = await queueRes.json();
        setQueueItems(data.items || []);
      }

      // Load reports index
      const reportsRes = await fetch(`${GITHUB_RAW_BASE}/reports/index.json`);
      if (reportsRes.ok) {
        const data = await reportsRes.json();
        setReports(data.reports || []);
      }

      // Load logs index
      const logsRes = await fetch(`${GITHUB_RAW_BASE}/memory/index.json`);
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

  const filteredItems = queueItems.filter((item) => {
    if (filter === "all") return true;
    return item.type === filter;
  });

  const pendingCount = queueItems.filter((i) => i.status === "pending").length;

  const badgeColors: Record<string, string> = {
    recipe: "bg-amber-500/20 text-amber-400",
    task: "bg-blue-500/20 text-blue-400",
    restaurant: "bg-green-500/20 text-green-400",
    update: "bg-purple-500/20 text-purple-400",
    pending: "bg-amber-500/20 text-amber-400",
    approved: "bg-green-500/20 text-green-400",
    archived: "bg-gray-500/20 text-gray-400",
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-purple-800 px-4 py-5 sticky top-0 z-50">
        <h1 className="text-2xl font-bold">🙂 Ali Hub</h1>
        <p className="text-sm text-purple-200">Your personal command center</p>
      </header>

      {/* Navigation */}
      <nav className="flex bg-gray-900 border-b border-gray-800 overflow-x-auto">
        {[
          { id: "dashboard", icon: "📊", label: "Dashboard" },
          { id: "queue", icon: "📋", label: "Queue" },
          { id: "reports", icon: "📄", label: "Reports" },
          { id: "logs", icon: "📝", label: "Logs" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 min-w-[80px] py-3 px-3 text-center text-xs font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? "text-purple-400 border-purple-500"
                : "text-gray-500 border-transparent hover:text-gray-300"
            }`}
          >
            <span className="text-lg block mb-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="p-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <>
            {/* Dashboard */}
            {activeTab === "dashboard" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-900 rounded-xl p-4 text-center border border-gray-800">
                    <div className="text-3xl font-bold text-purple-400">{pendingCount}</div>
                    <div className="text-xs text-gray-500 mt-1">Pending Items</div>
                  </div>
                  <div className="bg-gray-900 rounded-xl p-4 text-center border border-gray-800">
                    <div className="text-3xl font-bold text-purple-400">{reports.length}</div>
                    <div className="text-xs text-gray-500 mt-1">Reports</div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-3">Recent Updates</h2>
                  {queueItems.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="bg-gray-900 rounded-xl p-4 mb-3 border border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${badgeColors[item.type]}`}>
                          {item.type}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${badgeColors[item.status]}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Queue */}
            {activeTab === "queue" && (
              <div>
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  {["all", "recipe", "task", "restaurant", "update"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                        filter === f
                          ? "bg-purple-600 text-white"
                          : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                      }`}
                    >
                      {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>

                {filteredItems.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-2">✨</div>
                    <p>Queue is empty</p>
                  </div>
                ) : (
                  filteredItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="bg-gray-900 rounded-xl p-4 mb-3 border border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors"
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt=""
                          className="w-full h-40 object-cover rounded-lg mb-3"
                        />
                      )}
                      <div className="flex gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${badgeColors[item.type]}`}>
                          {item.type}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${badgeColors[item.status]}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="font-medium">{item.title}</div>
                      {item.summary && (
                        <div className="text-sm text-gray-400 mt-1 line-clamp-2">{item.summary}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Reports */}
            {activeTab === "reports" && (
              <div>
                <h2 className="text-lg font-semibold mb-3">All Reports</h2>
                {reports.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No reports yet</div>
                ) : (
                  reports.map((report) => (
                    <div
                      key={report.name}
                      onClick={() => loadReportContent(report)}
                      className="bg-gray-900 rounded-xl p-4 mb-3 border border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors"
                    >
                      <div className="font-medium">{report.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{report.date}</div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Logs */}
            {activeTab === "logs" && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Daily Logs</h2>
                {logs.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No logs yet</div>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.name}
                      className="bg-gray-900 rounded-xl p-4 mb-3 border border-gray-800"
                    >
                      <div className="font-medium">{log.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{log.date}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-gray-900 rounded-t-2xl w-full max-h-[85vh] overflow-y-auto p-5 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold">{selectedItem.title}</h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-500 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <span className={`text-xs px-2 py-1 rounded-full ${badgeColors[selectedItem.type]}`}>
                {selectedItem.type}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${badgeColors[selectedItem.status]}`}>
                {selectedItem.status}
              </span>
            </div>

            {selectedItem.image && (
              <img
                src={selectedItem.image}
                alt=""
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}

            <div className="space-y-3">
              {selectedItem.type === "recipe" && (
                <>
                  <DetailRow label="Prep Time" value={selectedItem.prepTime} />
                  <DetailRow
                    label="Source"
                    value={
                      selectedItem.sourceUrl ? (
                        <a
                          href={selectedItem.sourceUrl}
                          target="_blank"
                          className="text-purple-400 underline"
                        >
                          View Source
                        </a>
                      ) : null
                    }
                  />
                  <DetailRow label="Ingredients" value={selectedItem.ingredients} pre />
                  <DetailRow label="Instructions" value={selectedItem.instructions} pre />
                </>
              )}

              {selectedItem.type === "task" && (
                <>
                  <DetailRow label="Due Date" value={selectedItem.dueDate} />
                  <DetailRow label="Priority" value={selectedItem.priority} />
                  <DetailRow label="Notes" value={selectedItem.notes} pre />
                </>
              )}

              {selectedItem.type === "restaurant" && (
                <>
                  <DetailRow label="Location" value={selectedItem.location} />
                  <DetailRow label="Cuisine" value={selectedItem.cuisine} />
                  <DetailRow label="Halal Status" value={selectedItem.halalStatus} />
                  <DetailRow label="Rating" value={selectedItem.rating} />
                  {selectedItem.summary && <DetailRow label="Notes" value={selectedItem.summary} />}
                </>
              )}

              {selectedItem.type === "update" && (
                <>
                  <DetailRow label="Category" value={selectedItem.category} />
                  <DetailRow label="Summary" value={selectedItem.summary} />
                  <DetailRow label="Action Needed" value={selectedItem.actionNeeded} />
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              {selectedItem.status === "pending" && (
                <>
                  <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors">
                    ✓ Approve
                  </button>
                  <button className="flex-1 border border-red-500 text-red-500 hover:bg-red-500/10 py-3 rounded-lg font-medium transition-colors">
                    Archive
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {selectedReport && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="bg-gray-900 rounded-t-2xl w-full max-h-[85vh] overflow-y-auto p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold">{selectedReport.name}</h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-500 text-2xl"
              >
                ×
              </button>
            </div>
            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
              {selectedReport.content}
            </pre>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

function DetailRow({
  label,
  value,
  pre,
}: {
  label: string;
  value: React.ReactNode;
  pre?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex border-b border-gray-800 py-3">
      <div className="w-24 text-sm text-gray-500 shrink-0">{label}</div>
      <div className={`flex-1 text-sm ${pre ? "whitespace-pre-wrap font-mono" : ""}`}>
        {value}
      </div>
    </div>
  );
}
