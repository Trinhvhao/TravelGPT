#!/bin/bash
cd /home/nhannv/Hello/TrinhHao/TravelGPT/backend
/opt/anaconda/envs/trinhhao/bin/python3 -m uvicorn app.main:app --host 0.0.0.0 --port 3008
