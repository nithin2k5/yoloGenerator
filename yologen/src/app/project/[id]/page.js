"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { API_ENDPOINTS } from "@/lib/config";
import { FiArrowLeft, FiUpload, FiImage, FiCpu, FiLayers, FiCode, FiGrid, FiSettings } from "react-icons/fi";
import { toast } from 'sonner';

// Components for each tab
import ProjectOverview from "@/components/project/ProjectOverview";
import ProjectUpload from "@/components/project/ProjectUpload";
import ProjectAnnotate from "@/components/project/ProjectAnnotate";
import ProjectGenerate from "@/components/project/ProjectGenerate";
import ProjectTrain from "@/components/project/ProjectTrain";

export default function ProjectPage() {
    const params = useParams();
    const router = useRouter();
    const [dataset, setDataset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        if (params.id) {
            fetchDataset(params.id);
            fetchStats(params.id);
        }
    }, [params.id]);

    const fetchDataset = async (id) => {
        try {
            const res = await fetch(API_ENDPOINTS.DATASETS.GET(id));
            if (!res.ok) throw new Error("Dataset not found");
            const data = await res.json();
            setDataset(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load project: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async (id) => {
        try {
            const res = await fetch(API_ENDPOINTS.DATASETS.STATS(id));
            if (res.ok) setStats(await res.json());
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        if (params?.id) {
            fetchDataset(params.id);
            fetchStats(params.id);
        } else {
            // If no ID, stop loading and show error
            setLoading(false);
        }
    }, [params]);

    // Safety timeout
    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading) {
                setLoading(false);
                toast.error("Loading timed out. Please check your connection.");
            }
        }, 10000);
        return () => clearTimeout(timer);
    }, [loading]);

    if (loading) return <div className="p-8">Loading project...</div>;
    if (!dataset) return <div className="p-8">Project not found</div>;

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            {/* Project Header */}
            <header className="h-16 border-b border-border bg-background/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
                        <FiArrowLeft />
                    </Button>
                    <div>
                        <h1 className="font-bold text-lg flex items-center gap-2">
                            {dataset.name}
                            <Badge variant="outline" className="font-normal text-xs">{dataset.type || "Object Detection"}</Badge>
                        </h1>
                        <p className="text-xs text-muted-foreground">{stats?.total_images || 0} images • {dataset.classes?.length || 0} classes</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Global Project Actions if any */}
                </div>
            </header>

            {/* Tabs Navigation similar to Roboflow */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <div className="border-b border-border bg-muted/5 px-6">
                    <TabsList className="h-12 bg-transparent p-0 gap-6">
                        <TabTrigger value="overview" icon={FiGrid}>Overview</TabTrigger>
                        <TabTrigger value="upload" icon={FiUpload}>Upload</TabTrigger>
                        <TabTrigger value="annotate" icon={FiImage}>Annotate</TabTrigger>
                        <TabTrigger value="generate" icon={FiLayers}>Generate</TabTrigger>
                        <TabTrigger value="train" icon={FiCpu}>Train</TabTrigger>
                        <TabTrigger value="deploy" icon={FiCode}>Deploy</TabTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 overflow-auto bg-muted/5 p-6">
                    <div className="max-w-7xl mx-auto h-full">
                        <TabsContent value="overview" className="mt-0 h-full">
                            <ProjectOverview dataset={dataset} stats={stats} onRefresh={() => { fetchDataset(dataset.id); fetchStats(dataset.id); }} />
                        </TabsContent>

                        <TabsContent value="upload" className="mt-0 h-full">
                            <ProjectUpload dataset={dataset} onUploadComplete={() => fetchStats(dataset.id)} />
                        </TabsContent>

                        <TabsContent value="annotate" className="mt-0 h-full">
                            <ProjectAnnotate dataset={dataset} stats={stats} />
                        </TabsContent>

                        <TabsContent value="generate" className="mt-0 h-full">
                            <ProjectGenerate dataset={dataset} stats={stats} onGenerate={() => fetchStats(dataset.id)} />
                        </TabsContent>

                        <TabsContent value="train" className="mt-0 h-full">
                            <ProjectTrain dataset={dataset} />
                        </TabsContent>

                        <TabsContent value="deploy" className="mt-0 h-full">
                            <div className="p-12 text-center text-muted-foreground">
                                <FiCode className="mx-auto text-4xl mb-4 opacity-20" />
                                <h3 className="text-lg font-medium">Deployment API</h3>
                                <p>Train a model first to get your API endpoint.</p>
                            </div>
                        </TabsContent>
                    </div>
                </div>
            </Tabs>
        </div>
    );
}

function TabTrigger({ value, icon: Icon, children }) {
    return (
        <TabsTrigger
            value={value}
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 text-muted-foreground data-[state=active]:text-foreground transition-all gap-2"
        >
            <Icon />
            {children}
        </TabsTrigger>
    );
}
