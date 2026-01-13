"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FiZap, FiArrowRight, FiCheckCircle, FiDatabase, FiCpu, FiImage, FiActivity, FiLayers, FiLogOut } from "react-icons/fi";

export default function HomePage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const features = [
    {
      icon: FiDatabase,
      title: "Dataset Management",
      description: "Create, upload, and manage custom datasets with ease",
      color: "from-blue-500/20 to-blue-600/10"
    },
    {
      icon: FiImage,
      title: "Smart Annotation",
      description: "Precise bounding box annotations with real-time preview",
      color: "from-purple-500/20 to-purple-600/10"
    },
    {
      icon: FiCpu,
      title: "Model Training",
      description: "Train custom YOLO models with 30+ pre-trained options",
      color: "from-green-500/20 to-green-600/10"
    },
    {
      icon: FiZap,
      title: "Fast Inference",
      description: "Real-time object detection with industry-leading speed",
      color: "from-amber-500/20 to-amber-600/10"
    }
  ];

  const stats = [
    { label: "YOLO Models", value: "30+", icon: FiLayers },
    { label: "Supported Formats", value: "YAML", icon: FiDatabase },
    { label: "Real-time", value: "Detection", icon: FiActivity },
    { label: "Custom", value: "Training", icon: FiCpu }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-background to-black relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/20 backdrop-blur-xl">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
                  <FiZap className="text-2xl text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">YOLO Generator</h1>
                  <p className="text-xs text-muted-foreground">AI-Powered Object Detection</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                {user ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary px-3 py-1.5">
                      {user.username}
                    </Badge>
                    <Badge variant="outline" className="capitalize px-2 py-1">
                      {user.role}
                    </Badge>
                    <Button
                      onClick={logout}
                      variant="outline"
                      size="sm"
                      className="ml-2"
                    >
                      <FiLogOut className="mr-1" />
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => router.push("/login")}
                      variant="outline"
                      size="sm"
                    >
                      Login
                    </Button>
                    <Button
                      onClick={() => router.push("/register")}
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                    >
                      Sign Up
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <Badge className="bg-primary/10 text-primary border-primary/30 px-4 py-2 text-sm">
              <FiZap className="mr-2" />
              Professional ML Training Platform
            </Badge>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-6xl md:text-7xl font-bold text-foreground tracking-tight">
                Build Custom
                <span className="block mt-2 bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent">
                  YOLO Models
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Create, train, and deploy state-of-the-art object detection models with our intuitive platform. No coding required.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center justify-center gap-4 pt-4">
              {user ? (
                <Button
                  onClick={() => router.push('/dashboard')}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-semibold shadow-lg shadow-primary/30 group"
                >
                  Go to Dashboard
                  <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => router.push('/register')}
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-semibold shadow-lg shadow-primary/30 group"
                  >
                    Get Started
                    <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    onClick={() => router.push('/login')}
                    size="lg"
                    variant="outline"
                    className="border-border hover:bg-card px-8 py-6 text-lg"
                  >
                    Sign In
                  </Button>
                </>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="p-4 rounded-2xl bg-card/40 border border-border/50 backdrop-blur-sm">
                    <Icon className="text-2xl text-primary mb-2 mx-auto" />
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Everything You Need</h2>
            <p className="text-muted-foreground text-lg">
              Complete toolset for building production-ready object detection models
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index} 
                  className="bg-card/40 border-border/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 group cursor-pointer"
                >
                  <CardHeader>
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="text-2xl text-foreground" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Workflow Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-foreground mb-4">Simple Workflow</h2>
              <p className="text-muted-foreground text-lg">
                From dataset to deployment in 4 easy steps
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              {[
                { num: "01", title: "Create Dataset", desc: "Upload and organize your images" },
                { num: "02", title: "Annotate", desc: "Draw boxes around objects" },
                { num: "03", title: "Train", desc: "Let AI learn from your data" },
                { num: "04", title: "Deploy", desc: "Use your custom model" }
              ].map((step, index) => (
                <div key={index} className="text-center relative">
                  <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-2xl font-bold text-primary mx-auto mb-4">
                    {step.num}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                  
                  {index < 3 && (
                    <FiArrowRight className="hidden md:block absolute top-8 -right-8 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 py-20">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-card/80 to-card/60 border-border/50 backdrop-blur-xl">
            <CardContent className="p-12 text-center">
              <FiCheckCircle className="text-5xl text-primary mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Ready to Build Your AI?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                Join developers and teams building custom object detection models with YOLO Generator.
              </p>
              <Button
                onClick={() => router.push('/dashboard')}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-6 text-lg font-semibold shadow-lg shadow-primary/30"
              >
                Launch Platform
                <FiArrowRight className="ml-2" />
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50 bg-card/20 backdrop-blur-xl mt-20">
          <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <FiZap className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">YOLO Generator</p>
                  <p className="text-xs text-muted-foreground">Professional ML Platform</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">v1.0.0</Badge>
                <Badge variant="outline" className="text-xs">YOLOv5-11</Badge>
                <Badge variant="outline" className="text-xs">Production Ready</Badge>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

