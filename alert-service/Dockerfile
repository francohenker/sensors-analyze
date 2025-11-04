FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Copiar archivos del servicio
COPY alert_service.py alert_service.proto requirements.txt ./

# Instalar dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Generar código gRPC
RUN python -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. alert_service.proto

EXPOSE 50051

# Verificar que los archivos generados existan antes de ejecutar
RUN ls -la *.py

CMD ["python", "alert_service.py"]