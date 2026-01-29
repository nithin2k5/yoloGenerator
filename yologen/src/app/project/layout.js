"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { FiDatabase, FiImage, FiSettings, FiBarChart2, FiCpu, FiLayers, FiCode, FiGrid } from "react-icons/fi";
import { Toaster } from 'sonner';

export default function ProjectLayout({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside className="w-16 md:w-64 border-r border-border bg-muted/10 flex flex-col fixed inset-y-0 z-50">
                <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-border/50">
                    <div className="flex items-center gap-2 font-bold text-lg">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                            <FiLayers />
                        </div>
                        <span className="hidden md:inline">YOLO Gen</span>
                    </div>
                </div>

                <nav className="flex-1 py-6 px-2 md:px-4 space-y-1">
                    <SidebarItem icon={FiBarChart2} label="Overview" href="/dashboard" />
                    <div className="pt-4 pb-2 px-2 hidden md:block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Project
                    </div>
                    {/* These links will interact with the page content via Tabs mostly, 
                        but for now we'll structure them valid for the layout 
                        (Note: The actual tab switching logic will be inside the page, 
                        or we can use URL-based tabs. For this layout, we'll assume the children carry the context)
                     */}
                </nav>

                <div className="p-4 border-t border-border/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {user.username?.[0]?.toUpperCase()}
                        </div>
                        <div className="hidden md:block overflow-hidden">
                            <p className="text-sm font-medium truncate">{user.username}</p>
                            <p className="text-xs text-muted-foreground truncate">Free Plan</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 pl-16 md:pl-64">
                {children}
            </main>
            <Toaster />
        </div>
    );
}

function SidebarItem({ icon: Icon, label, href, active }) {
    return (
        <a
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
        >
            <Icon className="text-xl md:text-lg" />
            <span className="hidden md:inline">{label}</span>
        </a>
    )
}
