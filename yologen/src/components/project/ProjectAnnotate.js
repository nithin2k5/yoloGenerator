"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FiExternalLink, FiImage, FiSettings } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

export default function ProjectAnnotate({ dataset, stats }) {
    const router = useRouter();

    // Calculate stats
    const total = stats?.total_images || 0;
    const annotated = stats?.annotated_images || 0;
    const progress = total > 0 ? (annotated / total) * 100 : 0;

    return (
        <div className="h-full flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold">Annotate</h2>
                    <p className="text-muted-foreground text-sm">Label objects in your images.</p>
                </div>
                <Button onClick={() => router.push(`/annotate?dataset=${dataset.id}`)}>
                    Open Annotation Tool <FiExternalLink className="ml-2" />
                </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                <FiImage className="text-2xl" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Unannotated Images</h3>
                                <p className="text-sm text-muted-foreground">{total - annotated} images waiting</p>
                            </div>
                        </div>
                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={() => router.push(`/annotate?dataset=${dataset.id}`)}
                            disabled={total - annotated === 0}
                        >
                            Start Labeling
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center text-green-500">
                                <FiSettings className="text-2xl" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Classes</h3>
                                <p className="text-sm text-muted-foreground">{dataset.classes?.length || 0} classes defined</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {dataset.classes?.map((c, i) => (
                                <Badge key={i} variant="outline">{c}</Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Visual preview of annotated items could go here */}
        </div>
    );
}
