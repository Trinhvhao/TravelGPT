#!/bin/bash
# Start TravelGPT Backend

cd "$(dirname "$0")"

echo "Starting TravelGPT backend..."
source /opt/anaconda/etc/profile.d/conda.sh 2>/dev/null || source ~/anaconda3/etc/profile.d/conda.sh 2>/dev/null
conda activate travelgpt

python -m uvicorn app.main:app --host 0.0.0.0 --port 3008
