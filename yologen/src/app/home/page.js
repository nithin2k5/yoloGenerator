"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FiZap,
  FiArrowRight,
  FiDatabase,
  FiCpu,
  FiImage,
  FiActivity,
  FiCheckCircle,
  FiBox,
  FiCode,
  FiStar,
  FiShield,
  FiTrendingUp,
  FiGithub,
  FiTwitter,
  FiMail
} from "react-icons/fi";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

// Animated counter hook
function useCounter(end, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, end, duration]);

  return { count, startCounter: () => setStarted(true) };
}

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();

  // Intersection observer to trigger counters
  const [statsVisible, setStatsVisible] = useState(false);

  const counter1 = useCounter(50000, 2000);
  const counter2 = useCounter(99, 1500);
  const counter3 = useCounter(24, 1200);
  const counter4 = useCounter(10, 1000);

  useEffect(() => {
    if (statsVisible) {
      counter1.startCounter();
      counter2.startCounter();
      counter3.startCounter();
      counter4.startCounter();
    }
  }, [statsVisible]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    const el = document.getElementById("stats-section");
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: FiDatabase,
      title: "Dataset Management",
      description: "Organize, version, and collaborate on your computer vision datasets with enterprise-grade lineage tracking.",
      color: "text-blue-400 bg-blue-400/10 border-blue-400/20"
    },
    {
      icon: FiImage,
      title: "Smart Annotation",
      description: "Accelerate labeling with keyboard shortcuts, zoom & pan, undo/redo, and intelligent class management.",
      color: "text-purple-400 bg-purple-400/10 border-purple-400/20"
    },
    {
      icon: FiCpu,
      title: "One-Click Training",
      description: "Train YOLOv8–v11 models on your GPU cluster. Full hyperparameter control, zero configuration hell.",
      color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
    },
    {
      icon: FiActivity,
      title: "Instant Inference",
      description: "Deploy models and run real-time object detection with visual bounding box overlays and latency metrics.",
      color: "text-amber-400 bg-amber-400/10 border-amber-400/20"
    }
  ];

  const stats = [
    { value: counter1.count.toLocaleString() + "+", label: "Detections Run", icon: FiZap },
    { value: counter2.count + ".2%", label: "Platform Uptime", icon: FiShield },
    { value: counter3.count + "+", label: "Model Versions", icon: FiBox },
    { value: counter4.count + "x", label: "Faster Than Manual", icon: FiTrendingUp },
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30 selection:text-indigo-200 font-sans overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px] animate-mesh" />
        <div className="absolute top-[40%] left-[-10%] w-[400px] h-[400px] rounded-full bg-blue-600/8 blur-[100px] animation-delay-2000 animate-mesh" />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/60 backdrop-blur-2xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push("/")}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-all duration-300 group-hover:scale-105">
              <FiZap className="text-white text-lg" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              Nebula
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
            <a href="#stats-section" className="hover:text-white transition-colors">Stats</a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Button
                onClick={() => router.push("/dashboard")}
                className="bg-white text-black hover:bg-white/90 rounded-full px-6 font-semibold shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] h-9 text-sm"
              >
                Dashboard
                <FiArrowRight className="ml-2" />
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={() => router.push("/login")}
                  className="text-gray-400 hover:text-white h-9 text-sm"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => router.push("/register")}
                  className="bg-white text-black hover:bg-white/90 rounded-full px-5 font-semibold h-9 text-sm"
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-16">
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-24 lg:py-36">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-8">
            <Badge variant="outline" className="rounded-full px-4 py-1.5 border-white/10 bg-white/5 text-sm backdrop-blur-md hover:bg-white/10 transition-colors animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
              v2.0 — YOLO11 Now Supported
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] animate-slide-up">
              Build Computer Vision{" "}
              <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-gradient-x">
                Without Limits
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 max-w-2xl leading-relaxed animate-slide-up stagger-2" style={{ opacity: 0 }}>
              Upload → Annotate → Train → Deploy. The complete ML pipeline for object detection,
              built for speed and simplicity.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 animate-slide-up stagger-3" style={{ opacity: 0 }}>
              <Button
                size="lg"
                onClick={() => router.push(user ? '/dashboard' : '/register')}
                className="h-12 px-8 rounded-full text-base bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 hover:shadow-indigo-500/40"
              >
                Start Building Free
                <FiArrowRight className="ml-2" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 rounded-full text-base border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white backdrop-blur-sm"
              >
                <FiCode className="mr-2" />
                View API Docs
              </Button>
            </div>

            {/* Hero Preview */}
            <div className="mt-16 relative w-full aspect-video max-w-5xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-indigo-500/10 group animate-slide-up stagger-4" style={{ opacity: 0 }}>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-transparent group-hover:from-indigo-600/15 transition-all duration-700" />
              <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-zinc-900 to-zinc-950">
                {/* Dashboard mockup skeleton */}
                <div className="w-[90%] h-[85%] rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden flex">
                  {/* Sidebar skeleton */}
                  <div className="w-48 border-r border-white/5 p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-6 h-6 rounded-lg bg-indigo-500/30" />
                      <div className="h-3 w-16 bg-white/10 rounded" />
                    </div>
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={cn("h-8 rounded-lg", i === 0 ? "bg-indigo-500/20" : "bg-white/5")} />
                    ))}
                  </div>
                  {/* Content skeleton */}
                  <div className="flex-1 p-6 space-y-4">
                    <div className="h-4 w-48 bg-white/10 rounded mb-6" />
                    <div className="grid grid-cols-3 gap-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-24 rounded-xl bg-white/5 animate-shimmer" style={{ animationDelay: `${i * 0.3}s` }} />
                      ))}
                    </div>
                    <div className="h-48 rounded-xl bg-white/5 mt-4 animate-shimmer" style={{ animationDelay: '0.9s' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="container mx-auto px-6 py-24 border-t border-white/5">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-gray-400 max-w-xl mx-auto">A complete toolkit for building, training, and deploying YOLO models.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.05] transition-all duration-300 group hover:-translate-y-1"
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-5 border transition-transform group-hover:scale-110 duration-300", feature.color)}>
                  <feature.icon />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-100">{feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Workflow Section */}
        <section id="workflow" className="py-24 bg-white/[0.02] border-t border-white/5">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Four Steps to Production</h2>
              <p className="text-gray-400 max-w-xl mx-auto">From raw images to a production-ready API in minutes, not weeks.</p>
            </div>

            <div className="grid md:grid-cols-4 gap-8 relative max-w-4xl mx-auto">
              {/* Connecting Line */}
              <div className="hidden md:block absolute top-10 left-[12.5%] w-[75%] h-[2px] bg-gradient-to-r from-indigo-500/50 via-purple-500/50 to-pink-500/50" />

              {[
                { step: "01", title: "Upload", desc: "Drag & drop your images", icon: FiBox, color: "text-blue-400" },
                { step: "02", title: "Annotate", desc: "Label with smart tools", icon: FiImage, color: "text-purple-400" },
                { step: "03", title: "Train", desc: "One-click GPU training", icon: FiCpu, color: "text-emerald-400" },
                { step: "04", title: "Deploy", desc: "Instant API endpoint", icon: FiActivity, color: "text-amber-400" },
              ].map((item, i) => (
                <div key={i} className="relative flex flex-col items-center text-center group">
                  <div className={cn(
                    "w-20 h-20 rounded-2xl bg-black border-2 border-white/10 flex items-center justify-center text-2xl z-10 shadow-xl shadow-black/50",
                    "group-hover:border-indigo-500/50 transition-all duration-300 group-hover:scale-110",
                    item.color
                  )}>
                    <item.icon />
                  </div>
                  <div className="mt-5">
                    <span className="text-xs font-mono text-indigo-500/70 mb-1 block">{item.step}</span>
                    <h3 className="text-lg font-bold mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section id="stats-section" className="py-24 border-t border-white/5">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Scale</h2>
              <p className="text-gray-400 max-w-xl mx-auto">Trusted by teams building the next generation of computer vision applications.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              {stats.map((stat, i) => (
                <div key={i} className="text-center group">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 text-indigo-400 group-hover:scale-110 transition-transform">
                    <stat.icon className="text-xl" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold mb-1 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 border-t border-white/5">
          <div className="container mx-auto px-6">
            <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-transparent p-12 md:p-16 text-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15),transparent_70%)]" />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold mb-4">Ready to Build?</h2>
                <p className="text-gray-400 max-w-lg mx-auto mb-8 text-lg">
                  Create your free account and start training YOLO models in under 5 minutes.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button
                    size="lg"
                    onClick={() => router.push(user ? '/dashboard' : '/register')}
                    className="h-12 px-8 rounded-full text-base bg-white text-black hover:bg-white/90 font-semibold shadow-[0_0_40px_rgba(255,255,255,0.15)] transition-all hover:scale-105"
                  >
                    Get Started Free
                    <FiArrowRight className="ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 px-8 rounded-full text-base border-white/20 bg-white/5 hover:bg-white/10 text-white"
                  >
                    <FiStar className="mr-2" />
                    Star on GitHub
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-12 bg-black">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <FiZap className="text-white text-sm" />
                </div>
                <span className="font-semibold text-gray-200">Nebula</span>
                <Badge variant="outline" className="border-white/10 text-xs">v2.1.0</Badge>
              </div>

              <div className="flex items-center gap-6">
                <a href="#" className="text-gray-500 hover:text-white transition-colors"><FiGithub /></a>
                <a href="#" className="text-gray-500 hover:text-white transition-colors"><FiTwitter /></a>
                <a href="#" className="text-gray-500 hover:text-white transition-colors"><FiMail /></a>
              </div>

              <p className="text-sm text-gray-600">
                &copy; {new Date().getFullYear()} Nebula ML. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
