#!/bin/bash

# Strict Training Script Wrapper
# This script provides an easy way to run strict training from command line

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_SCRIPT="${SCRIPT_DIR}/strict_train.py"

# Check if Python script exists
if [ ! -f "$PYTHON_SCRIPT" ]; then
    echo "Error: strict_train.py not found at $PYTHON_SCRIPT"
    exit 1
fi

# Check if data.yaml path is provided
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 <data.yaml_path> <epochs> [additional_args...]"
    echo ""
    echo "Examples:"
    echo "  $0 datasets/my_dataset/data.yaml 100"
    echo "  $0 datasets/my_dataset/data.yaml 200 --batch-size 32"
    echo "  $0 datasets/my_dataset/data.yaml 150 --model yolov8s.pt --img-size 640"
    exit 1
fi

DATA_YAML="$1"
EPOCHS="$2"
shift 2  # Remove first two arguments

# Run the Python script with all arguments
python3 "$PYTHON_SCRIPT" --data "$DATA_YAML" --epochs "$EPOCHS" "$@"
