"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  FiZap,
  FiArrowRight,
  FiDatabase,
  FiCpu,
  FiImage,
  FiActivity,
  FiCheckCircle,
  FiBox,
  FiCode
} from "react-icons/fi";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();

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
      description: "Accelerate labeling with AI-assisted cursors, magic hulls, and auto-segmentation tools.",
      color: "text-purple-400 bg-purple-400/10 border-purple-400/20"
    },
    {
      icon: FiCpu,
      title: "One-Click Training",
      description: "Train YOLOv8-v10 models on our GPU cluster. No configuration hell, just results.",
      color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
    },
    {
      icon: FiActivity,
      title: "Instant Inference",
      description: "Deploy models to valid endpoints in seconds. High throughput, low latency API ready for production.",
      color: "text-amber-400 bg-amber-400/10 border-amber-400/20"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30 selection:text-indigo-200 font-sans overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px] animate-mesh" />
        <div className="absolute top-[40%] left-[-10%] w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push("/")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300">
              <FiZap className="text-white text-xl" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Nebula
            </span>
          </div>

          <div className="flex items-center gap-6">
            {user ? (
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="bg-white text-black hover:bg-white/90 rounded-full px-6 font-semibold shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
                >
                  Go to Dashboard
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => router.push("/login")}
                  className="text-gray-400 hover:text-white"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => router.push("/register")}
                  className="bg-white text-black hover:bg-white/90 rounded-full px-6 font-semibold"
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-32">
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-20 lg:py-32">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-8 animate-fade-in">
            <Badge variant="outline" className="rounded-full px-4 py-1.5 border-white/10 bg-white/5 text-sm backdrop-blur-md hover:bg-white/10 transition-colors">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
              v2.0 Model Engine Live
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
              The Next Generation of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-gradient-x">
                Computer Vision
              </span>
            </h1>

            <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">
              Build, train, and deploy state-of-the-art computer vision models in minutes.
              Enterprise-grade infrastructure with a beautiful developer experience.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Button
                size="lg"
                onClick={() => router.push(user ? '/dashboard' : '/register')}
                className="h-14 px-8 rounded-full text-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-105"
              >
                Start Building Free
                <FiArrowRight className="ml-2" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="h-14 px-8 rounded-full text-lg border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white backdrop-blur-sm"
              >
                <FiCode className="mr-2" />
                View API Docs
              </Button>
            </div>

            {/* Hero Image / Preview */}
            <div className="mt-20 relative w-full aspect-video max-w-5xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-indigo-500/10 group">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
              <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors duration-500" />
              <img
                src="/dashboard_preview.svg"
                alt="Dashboard Interface"
                className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML += '<div class="flex items-center justify-center w-full h-full bg-white/5 text-white/20"><svg class="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>';
                }}
              />
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="container mx-auto px-6 py-24 border-t border-white/5">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors group"
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-4 border transition-transform group-hover:scale-110 duration-300", feature.color)}>
                  <feature.icon />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-100">{feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Workflow Section */}
        <section className="py-24 bg-white/5 border-t border-white/5">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Workflow Simplified</h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-lg">From raw data to production API in four simple steps.</p>
            </div>

            <div className="grid md:grid-cols-4 gap-8 relative">
              {/* Connecting Line (Desktop) */}
              <div className="hidden md:block absolute top-8 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

              {[
                { step: "01", title: "Upload", icon: FiBox },
                { step: "02", title: "Annotate", icon: FiImage },
                { step: "03", title: "Train", icon: FiCpu },
                { step: "04", title: "Deploy", icon: FiActivity },
              ].map((item, i) => (
                <div key={i} className="relative flex flex-col items-center text-center group">
                  <div className="w-16 h-16 rounded-full bg-black border border-white/10 flex items-center justify-center text-2xl text-indigo-400 z-10 shadow-xl shadow-black group-hover:border-indigo-500/50 group-hover:text-indigo-300 transition-all duration-300">
                    <item.icon />
                  </div>
                  <div className="mt-6">
                    <span className="text-xs font-mono text-indigo-500 mb-2 block">{item.step}</span>
                    <h3 className="text-xl font-bold">{item.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-12 bg-black">
          <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 text-gray-400">
              <FiZap className="text-indigo-500" />
              <span className="font-semibold text-gray-200">Nebula</span>
              <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white">v2.1.0</span>
            </div>
            <p className="text-sm text-gray-600">
              &copy; {new Date().getFullYear()} YOLO Generator Inc. All systems normal.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
