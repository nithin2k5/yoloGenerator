"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FiAlertTriangle, FiHome, FiArrowLeft } from "react-icons/fi";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-background to-black flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-card/60 backdrop-blur-xl border-border/50">
        <CardHeader className="text-center">
          <div className="w-20 h-20 rounded-full bg-destructive/10 border-2 border-destructive/30 flex items-center justify-center mx-auto mb-4">
            <FiAlertTriangle className="text-4xl text-destructive" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription className="text-base">
            You don't have permission to access this resource
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-sm text-muted-foreground">
              This page or action requires special permissions that your current role doesn't have. 
              Please contact an administrator if you believe this is an error.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="flex-1"
            >
              <FiArrowLeft className="mr-2" />
              Go Back
            </Button>
            <Button
              onClick={() => router.push("/dashboard")}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <FiHome className="mr-2" />
              Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

