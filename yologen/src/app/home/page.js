"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FiZap, FiArrowRight, FiDatabase, FiCpu, FiImage, FiActivity, FiLogOut, FiCheckCircle, FiBox, FiLayers } from "react-icons/fi";

export default function HomePage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const features = [
    {
      icon: FiDatabase,
      title: "Dataset Management",
      description: "Organize, version, and collaborate on your computer vision datasets efficiently."
    },
    {
      icon: FiImage,
      title: "Smart Annotation",
      description: "Accelerate labeling with AI-assisted tools and intuitive interfaces."
    },
    {
      icon: FiCpu,
      title: "Model Training",
      description: "Train custom YOLO models on optimized cloud infrastructure with one click."
    },
    {
      icon: FiActivity,
      title: "Real-time Inference",
      description: "Deploy and test your models instantly with our low-latency inference API."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => router.push("/")}>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <FiZap className="text-primary-foreground text-lg" />
            </div>
            <span className="text-lg font-semibold tracking-tight">YOLO Gen</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#workflow" className="hover:text-foreground transition-colors">How it Works</a>
            <a href="#" className="hover:text-foreground transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Badge variant="outline" className="hidden sm:flex border-border/50 font-normal">
                  {user.username}
                </Badge>
                <Button onClick={() => router.push("/dashboard")} size="sm">
                  Dashboard
                </Button>
                <Button onClick={logout} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <FiLogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => router.push("/login")} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Login
                </Button>
                <Button onClick={() => router.push("/register")} size="sm">
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-24 md:py-32 px-6 border-b border-border/40 bg-muted/10">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 space-y-8 text-center lg:text-left">
                <Badge variant="secondary" className="rounded-full px-4 py-1 text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                  v2.0 is now live
                </Badge>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
                  Train Custom <br className="hidden lg:block" />
                  <span className="text-primary">Vision Models</span>
                </h1>

                <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  The all-in-one platform to create, train, and deploy YOLO models. Streamline your workflow from raw data to API.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Button
                    onClick={() => router.push(user ? '/dashboard' : '/register')}
                    size="lg"
                    className="h-12 px-8 text-base rounded-md w-full sm:w-auto shadow-md"
                  >
                    Start Building Free
                    <FiArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 px-8 text-base rounded-md w-full sm:w-auto bg-background"
                  >
                    View Documentation
                  </Button>
                </div>

                <div className="pt-8 flex items-center justify-center lg:justify-start gap-8 text-muted-foreground text-sm">
                  <div className="flex items-center gap-2">
                    <FiCheckCircle className="text-primary" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiCheckCircle className="text-primary" />
                    <span>Free tier available</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 w-full max-w-[600px] lg:max-w-none">
                <div className="relative rounded-xl overflow-hidden border border-border bg-card shadow-2xl">
                  {/* Simple Preview UI */}
                  <div className="h-10 bg-muted border-b border-border flex items-center px-4 gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                  </div>
                  <div className="aspect-[4/3] bg-muted/30 flex items-center justify-center relative group">
                    <img
                      src="/dashboard_preview.svg"
                      alt="Platform Interface"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden absolute inset-0 flex-col items-center justify-center text-muted-foreground">
                      <FiLayers className="text-6xl mb-4 opacity-20" />
                      <span className="text-sm font-medium opacity-50">Dashboard Preview</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16 max-w-3xl mx-auto space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">Everything you need to ship</h2>
              <p className="text-muted-foreground text-lg">
                Stop stitching together disparate tools. Get a complete pipeline integrated into a single workflow.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="bg-card border-border/50 hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                        <Icon className="text-2xl" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Workflow Steps */}
        <section id="workflow" className="py-24 px-6 bg-muted/30 border-t border-border/40">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4 bg-background">Workflow</Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">From Image to Inference</h2>
            </div>

            <div className="space-y-12">
              {[
                {
                  step: "01",
                  title: "Upload & Organize",
                  desc: "Drag and drop your raw images. We verify formats and check for duplicates automatically.",
                  icon: FiBox
                },
                {
                  step: "02",
                  title: "Annotate with AI",
                  desc: "Use our Smart Hulls and Magic Wand tools to label objects 10x faster than manual bounding boxes.",
                  icon: FiImage
                },
                {
                  step: "03",
                  title: "One-Click Training",
                  desc: "Select a base model (YOLOv8, v9, v10), configure epochs, and hit train. We handle the GPUs.",
                  icon: FiCpu
                },
                {
                  step: "04",
                  title: "Deploy via API",
                  desc: "Get a dedicated endpoint for your model. Send images and get JSON predictions in milliseconds.",
                  icon: FiActivity
                }
              ].map((item, i) => (
                <div key={i} className="flex flex-col md:flex-row gap-8 items-start md:items-center p-6 rounded-xl bg-background border border-border/50 shadow-sm">
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-primary/5 flex items-center justify-center text-xl font-bold text-primary border border-primary/10">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-6 border-t border-border/40">
          <div className="container mx-auto max-w-4xl text-center bg-primary text-primary-foreground rounded-3xl p-12 shadow-xl">
            <h2 className="text-3xl font-bold mb-6">Ready to build your model?</h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
              Join thousands of developers building the future of computer vision today.
            </p>
            <Button
              onClick={() => router.push(user ? '/dashboard' : '/register')}
              size="lg"
              className="h-12 px-10 text-lg bg-background text-foreground hover:bg-background/90 font-semibold"
            >
              Get Started for Free
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/10 py-12 px-6">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-80">
            <FiZap className="text-primary" />
            <span className="font-bold text-sm">YOLO Gen</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} YOLO Generator Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
