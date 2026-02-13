"use client";

import DatasetWorkflow from "@/components/DatasetWorkflow";

export default function ProjectOverview({ dataset, onRefresh }) {
    // ProjectOverview now delegates to the Workflow component
    // which handles the lifecycle visualization
    return (
        <div className="h-full">
            <DatasetWorkflow dataset={dataset} onRefresh={onRefresh} />
        </div>
    );
}
