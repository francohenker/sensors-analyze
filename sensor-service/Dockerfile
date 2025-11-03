FROM python:3.11-slim
WORKDIR /app
COPY sensor_service.py .
RUN pip install flask
EXPOSE 5001
CMD ["python", "sensor_service.py"]
