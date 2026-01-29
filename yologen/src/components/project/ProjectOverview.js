"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FiImage, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

export default function ProjectOverview({ dataset, stats }) {
    if (!stats) return <div className="p-4">Loading stats...</div>;

    const completionPercentage = stats.completion_percentage || 0;

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Images</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.total_images}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.train_images} train • {stats.val_images} val • {stats.test_images} test
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Annotation Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end justify-between">
                            <div className="text-3xl font-bold">{completionPercentage.toFixed(0)}%</div>
                            <div className="mb-1 text-sm text-muted-foreground">
                                {stats.annotated_images} / {stats.total_images}
                            </div>
                        </div>
                        <Progress value={completionPercentage} className="h-2 mt-3" />
                        <p className="text-xs text-muted-foreground mt-2">
                            {stats.total_images - stats.annotated_images} images remaining
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Classes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{dataset.classes?.length || 0}</div>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {dataset.classes?.slice(0, 3).map((c, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">{c}</Badge>
                            ))}
                            {dataset.classes?.length > 3 && (
                                <Badge variant="outline" className="text-xs">+{dataset.classes.length - 3} more</Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Health Check / Suggestions */}
            <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FiAlertCircle className="text-blue-500" />
                        Dataset Health Check
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {stats.total_images === 0 ? (
                        <div className="flex items-center justify-between">
                            <p className="text-muted-foreground">Start by uploading images to your dataset.</p>
                            {/* Note: The parent component controls tabs, so we can't easily jump tabs here without a callback or context, 
                                 but for now we'll rely on the user navigating. 
                              */}
                        </div>
                    ) : stats.annotated_images < stats.total_images ? (
                        <div className="space-y-2">
                            <p className="text-muted-foreground">You have {stats.total_images - stats.annotated_images} unannotated images. Label them to improve model accuracy.</p>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-green-500">
                            <FiCheckCircle />
                            <p>Dataset is fully annotated and ready for versioning!</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
