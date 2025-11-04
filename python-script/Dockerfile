FROM python:3.11-slim
WORKDIR /app
COPY script_gpu_data.py .
RUN pip install requests
CMD ["python", "script_gpu_data.py"]
