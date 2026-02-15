export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const API_ENDPOINTS = {
    DATASETS: {
        LIST: `${API_BASE_URL}/api/annotations/datasets/list`,
        CREATE: `${API_BASE_URL}/api/annotations/datasets/create`,
        GET: (id) => `${API_BASE_URL}/api/annotations/datasets/${id}`,
        STATS: (id) => `${API_BASE_URL}/api/annotations/datasets/${id}/stats`,
        UPLOAD: (id) => `${API_BASE_URL}/api/annotations/datasets/${id}/upload`,
        EXPORT: (id) => `${API_BASE_URL}/api/annotations/datasets/${id}/export`,
        ANALYZE: (id) => `${API_BASE_URL}/api/annotations/datasets/${id}/analyze`,
    },
    TRAINING: {
        START: `${API_BASE_URL}/api/training/start`,
        START_FROM_DATASET: `${API_BASE_URL}/api/training/start-from-dataset`,
        EXPORT_AND_TRAIN: `${API_BASE_URL}/api/training/export-and-train`,
        JOBS: `${API_BASE_URL}/api/training/jobs`,
        JOB: (id) => `${API_BASE_URL}/api/training/job/${id}`,
    },
    INFERENCE: {
        PREDICT: `${API_BASE_URL}/api/inference/predict`,
    }
};
