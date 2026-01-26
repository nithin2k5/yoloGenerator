"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FiZap, FiCpu, FiDatabase, FiTrendingUp } from "react-icons/fi";
import { Button } from "@/components/ui/button";

export default function DashboardStats({ onNavigate }) {
  const stats = [
    {
      title: "Total Inferences",
      value: "1,234",
      change: "+12.5%",
      icon: FiZap,
    },
    {
      title: "Training Jobs",
      value: "8",
      change: "+2",
      icon: FiCpu,
    },
    {
      title: "Models Trained",
      value: "24",
      change: "+4",
      icon: FiDatabase,
    },
    {
      title: "Avg Accuracy",
      value: "94.2%",
      change: "+3.1%",
      icon: FiTrendingUp,
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="text-xl text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-primary mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiZap className="text-primary" />
              Quick Inference
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-6">
              Upload an image and get instant object detection results using pre-trained YOLO models.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onNavigate && onNavigate("inference")}
            >
              Start Detection
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiCpu className="text-primary" />
              Start Training
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-6">
              Train custom YOLO models on your own datasets with full control over hyperparameters.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onNavigate && onNavigate("datasets")}
            >
              Create Dataset
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {[
              { action: "Inference completed", model: "yolov8n.pt", time: "2 minutes ago", status: "success" },
              { action: "Training started", model: "custom_v1", time: "1 hour ago", status: "running" },
              { action: "Model exported", model: "yolov8s.pt", time: "3 hours ago", status: "success" },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${activity.status === "success" ? "bg-primary" : "bg-muted"
                    }`} />
                  <div>
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.model} • {activity.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

