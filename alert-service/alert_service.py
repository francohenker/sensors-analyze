import grpc
from concurrent import futures
import alert_service_pb2
import alert_service_pb2_grpc
import redis
import json
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AlertServicer(alert_service_pb2_grpc.AlertServiceServicer):
    def __init__(self):
        try:
            self.redis = redis.Redis(host='redis', port=6379, decode_responses=True)
            logger.info("Connected to Redis")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
    
    def CheckTemperature(self, request, context):
        alert_triggered = False
        alert_type = ""
        severity = ""
        
        if request.gpu_temp > 85:
            alert_triggered = True
            alert_type = "HIGH_TEMPERATURE"
            severity = "CRITICAL" if request.gpu_temp > 90 else "HIGH"
            
            # Publicar evento de alerta
            alert_event = {
                "gpu_uuid": request.gpu_uuid,
                "alert_type": alert_type,
                "severity": severity,
                "temperature": request.gpu_temp,
                "threshold": 85
            }
            try:
                self.redis.publish('alerts', json.dumps(alert_event))
                logger.info(f"Alert published for GPU {request.gpu_uuid}")
            except Exception as e:
                logger.error(f"Failed to publish alert: {e}")
        
        return alert_service_pb2.AlertResponse(
            alert_triggered=alert_triggered,
            alert_type=alert_type,
            severity=severity,
            message=f"GPU temperature: {request.gpu_temp}°C"
        )
    
    def ProcessTelemetry(self, request, context):
        # Implementar lógica de procesamiento de telemetría
        logger.info(f"Processing telemetry for GPU {request.gpu_uuid}")
        
        return alert_service_pb2.ProcessResponse(
            processed=True,
            status="success",
            message="Telemetry processed successfully"
        )

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    alert_service_pb2_grpc.add_AlertServiceServicer_to_server(AlertServicer(), server)
    server.add_insecure_port('[::]:50051')
    
    logger.info("Starting gRPC server on port 50051...")
    server.start()
    logger.info("gRPC server started successfully")
    
    try:
        server.wait_for_termination()
    except KeyboardInterrupt:
        logger.info("Shutting down server...")
        server.stop(0)

if __name__ == '__main__':
    serve()