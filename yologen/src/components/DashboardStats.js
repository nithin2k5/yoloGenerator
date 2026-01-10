"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FiZap, FiCpu, FiDatabase, FiTrendingUp } from "react-icons/fi";

export default function DashboardStats({ onNavigate }) {
  const stats = [
    {
      title: "Total Inferences",
      value: "1,234",
      change: "+12.5%",
      icon: FiZap,
      color: "text-primary"
    },
    {
      title: "Training Jobs",
      value: "8",
      change: "+2",
      icon: FiCpu,
      color: "text-accent"
    },
    {
      title: "Models Trained",
      value: "24",
      change: "+4",
      icon: FiDatabase,
      color: "text-primary"
    },
    {
      title: "Avg Accuracy",
      value: "94.2%",
      change: "+3.1%",
      icon: FiTrendingUp,
      color: "text-accent"
    }
  ];

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-card border-border hover:border-primary transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`text-xl ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-primary mt-1">{stat.change} from last month</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <FiZap />
              Quick Inference
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Upload an image and get instant object detection results using pre-trained YOLO models.
            </p>
            <div className="flex gap-3">
              <div className="w-16 h-16 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
                <FiZap className="text-2xl text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Ready to detect</p>
                <p className="text-xs text-muted-foreground">
                  <button onClick={() => onNavigate && onNavigate("inference")} className="text-primary hover:underline">
                    Go to Inference tab
                  </button>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-primary/10 border-accent/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <FiCpu />
              Start Training
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Train custom YOLO models on your own datasets with full control over hyperparameters.
            </p>
            <div className="flex gap-3">
              <div className="w-16 h-16 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center">
                <FiCpu className="text-2xl text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">No active training</p>
                <p className="text-xs text-muted-foreground">
                  <button onClick={() => onNavigate && onNavigate("datasets")} className="text-primary hover:underline">
                    Create a dataset first
                  </button>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="mt-6 bg-card border-border">
        <CardHeader>
          <CardTitle className="text-primary">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: "Inference completed", model: "yolov8n.pt", time: "2 minutes ago", status: "success" },
              { action: "Training started", model: "custom_v1", time: "1 hour ago", status: "running" },
              { action: "Model exported", model: "yolov8s.pt", time: "3 hours ago", status: "success" },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === "success" ? "bg-primary" : 
                    activity.status === "running" ? "bg-accent animate-pulse" : "bg-muted"
                  }`} />
                  <div>
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.model}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

