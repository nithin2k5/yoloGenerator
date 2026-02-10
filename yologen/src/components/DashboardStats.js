"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FiZap, FiCpu, FiDatabase, FiTrendingUp, FiActivity, FiClock, FiCheck, FiArrowRight } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { API_ENDPOINTS } from "@/lib/config";

export default function DashboardStats({ onNavigate }) {
  const [liveStats, setLiveStats] = useState({
    totalDatasets: 0,
    totalImages: 0,
    totalAnnotated: 0,
    totalModels: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveStats();
    const interval = setInterval(fetchLiveStats, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveStats = async () => {
    try {
      const [datasetsRes, modelsRes] = await Promise.allSettled([
        fetch(API_ENDPOINTS.DATASETS.LIST),
        fetch("http://localhost:8000/api/models/list"),
      ]);

      let totalDatasets = 0, totalImages = 0, totalAnnotated = 0, totalReviewed = 0;
      if (datasetsRes.status === 'fulfilled' && datasetsRes.value.ok) {
        const datasets = await datasetsRes.value.json();
        totalDatasets = datasets.length;

        const statsPromises = datasets.map(ds =>
          fetch(API_ENDPOINTS.DATASETS.STATS(ds.id)).then(r => r.ok ? r.json() : null).catch(() => null)
        );
        const allStats = await Promise.allSettled(statsPromises);
        allStats.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            totalImages += result.value.total_images || 0;
            totalAnnotated += result.value.annotated_images || 0;
            totalReviewed += result.value.reviewed_images || 0;
          }
        });
      }

      let totalModels = 0;
      if (modelsRes.status === 'fulfilled' && modelsRes.value.ok) {
        const modelsData = await modelsRes.value.json();
        totalModels = modelsData.models?.length || 0;
      }

      setLiveStats({ totalDatasets, totalImages, totalAnnotated, totalModels, totalReviewed });
    } catch (e) {
      console.error("Stats fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const annotationPercent = liveStats.totalImages > 0
    ? Math.round((liveStats.totalAnnotated / liveStats.totalImages) * 100) : 0;

  const stats = [
    {
      title: "Datasets",
      value: liveStats.totalDatasets.toString(),
      sub: `${liveStats.totalImages} images total`,
      icon: FiDatabase,
      color: "text-blue-400 bg-blue-400/10",
    },
    {
      title: "Annotated",
      value: liveStats.totalAnnotated.toString(),
      sub: `${annotationPercent}% complete`,
      icon: FiActivity,
      color: "text-emerald-400 bg-emerald-400/10",
    },
    {
      title: "Reviewed",
      value: (liveStats.totalReviewed || 0).toString(),
      sub: "Quality checked",
      icon: FiCheck,
      color: "text-indigo-400 bg-indigo-400/10",
    },
    {
      title: "Models",
      value: liveStats.totalModels.toString(),
      sub: "In registry",
      icon: FiCpu,
      color: "text-purple-400 bg-purple-400/10",
    },
    {
      title: "Pipeline",
      value: annotationPercent >= 80 ? "Ready" : "Building",
      sub: annotationPercent >= 80 ? "Ready to train" : "Need more labels",
      icon: FiTrendingUp,
      color: "text-amber-400 bg-amber-400/10",
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={cn(
              "group relative p-6 rounded-2xl bg-card/40 backdrop-blur-md border border-white/5",
              "hover:bg-white/5 transition-all duration-300 hover:-translate-y-1 shadow-lg shadow-black/10",
              loading && "animate-shimmer"
            )}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-3 rounded-xl", stat.color)}>
                <stat.icon className="text-xl" />
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">{stat.title}</p>
              <h3 className="text-3xl font-bold mt-1 text-white tracking-tight">{stat.value}</h3>
              <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-[1px] rounded-2xl bg-gradient-to-br from-indigo-500/20 via-transparent to-transparent">
          <div className="h-full rounded-2xl bg-card/60 backdrop-blur-md border border-white/5 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                  <FiZap />
                </div>
                <h3 className="text-lg font-bold">Quick Inference</h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Drag & drop images to test your best model instantly. Supported formats: JPG, PNG, WEBP.
              </p>
            </div>
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white border-0 shadow-lg shadow-indigo-500/20"
              onClick={() => onNavigate && onNavigate("inference")}
            >
              Start Detection
              <FiArrowRight className="ml-2" />
            </Button>
          </div>
        </div>

        <div className="p-[1px] rounded-2xl bg-gradient-to-br from-purple-500/20 via-transparent to-transparent">
          <div className="h-full rounded-2xl bg-card/60 backdrop-blur-md border border-white/5 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                  <FiCpu />
                </div>
                <h3 className="text-lg font-bold">Start New Training</h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Configure a new training run on your GPU. Requires a prepared dataset version.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full border-white/10 hover:bg-white/5 bg-transparent"
              onClick={() => onNavigate && onNavigate("datasets")}
            >
              Create Dataset
              <FiArrowRight className="ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="rounded-2xl bg-card/40 backdrop-blur-md border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-lg font-bold">Recent Pipeline Activity</h3>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">View All</Button>
        </div>
        <div className="divide-y divide-white/5">
          {liveStats.totalDatasets > 0 ? (
            [
              { action: `${liveStats.totalAnnotated} annotations saved`, model: `Across ${liveStats.totalDatasets} dataset(s)`, time: "Now", status: "success", icon: FiCheck },
              { action: `${liveStats.totalModels} model(s) in registry`, model: "Ready for inference", time: "Latest", status: liveStats.totalModels > 0 ? "success" : "pending", icon: liveStats.totalModels > 0 ? FiCheck : FiClock },
              { action: `${liveStats.totalImages} images uploaded`, model: `${annotationPercent}% annotated`, time: "Total", status: "success", icon: FiCheck },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs",
                    activity.status === "success" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                  )}>
                    <activity.icon />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.model}</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-gray-500">{activity.time}</span>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No activity yet. Create a dataset to get started!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
