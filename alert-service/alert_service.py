import grpc
from concurrent import futures
import alert_service_pb2
import alert_service_pb2_grpc
import redis
import json
import logging
import threading
from datetime import datetime

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AlertServicer(alert_service_pb2_grpc.AlertServiceServicer):
    def __init__(self):
        try:
            self.redis_client = redis.Redis(host='redis', port=6379, decode_responses=True)
            self.redis_pubsub = self.redis_client.pubsub()
            logger.info("✅ Connected to Redis")
            
            # Iniciar listener de alertas en un thread separado
            self.start_alert_listener()
        except Exception as e:
            logger.error(f"❌ Failed to connect to Redis: {e}")
    
    def start_alert_listener(self):
        """Suscribirse al canal de alertas de Redis"""
        def listen_for_alerts():
            try:
                self.redis_pubsub.subscribe('gpu_alerts')
                logger.info("📡 Subscribed to gpu_alerts channel")
                
                for message in self.redis_pubsub.listen():
                    if message['type'] == 'message':
                        try:
                            alert_data = json.loads(message['data'])
                            self.process_alert(alert_data)
                        except Exception as e:
                            logger.error(f"❌ Error processing alert: {e}")
            except Exception as e:
                logger.error(f"❌ Error in alert listener: {e}")
        
        thread = threading.Thread(target=listen_for_alerts, daemon=True)
        thread.start()
    
    def process_alert(self, alert_data):
        """Procesar alertas recibidas de Redis"""
        logger.info(f"🚨 Processing alert for GPU {alert_data.get('gpu_uuid')}")
        logger.info(f"   Alerts: {len(alert_data.get('alerts', []))}")
        
        for alert in alert_data.get('alerts', []):
            logger.warning(
                f"   [{alert['severity']}] {alert['alert_type']}: "
                f"{alert['triggered_value']} (threshold: {alert['threshold_value']})"
            )
        
    def CheckTemperature(self, request, context):
        """gRPC endpoint para verificar temperatura (llamado por query-service)"""
        alert_triggered = False
        alert_type = ""
        severity = ""
        
        if request.gpu_temp > 85:
            alert_triggered = True
            alert_type = "HIGH_TEMPERATURE"
            severity = "CRITICAL" if request.gpu_temp > 90 else "WARNING"
            
            # Publicar evento de alerta
            alert_event = {
                "gpu_uuid": request.gpu_uuid,
                "alert_type": alert_type,
                "severity": severity,
                "temperature": request.gpu_temp,
                "threshold": 85,
                "triggered_at": datetime.utcnow().isoformat() + 'Z',
                "source": "grpc_check"
            }
            try:
                self.redis_client.publish('gpu_alerts', json.dumps(alert_event))
                logger.info(f"🚨 Alert published for GPU {request.gpu_uuid}")
            except Exception as e:
                logger.error(f"❌ Failed to publish alert: {e}")
        
        return alert_service_pb2.AlertResponse(
            alert_triggered=alert_triggered,
            alert_type=alert_type,
            severity=severity,
            message=f"GPU temperature: {request.gpu_temp}°C"
        )
    
    def ProcessTelemetry(self, request, context):
        """gRPC endpoint para procesar telemetría completa"""
        logger.info(f"📊 Processing telemetry for GPU {request.gpu_uuid}")
        
        alerts_triggered = []
        
        # Verificar temperatura GPU
        if request.gpu_temp > 80:
            alerts_triggered.append({
                "type": "HIGH_GPU_TEMP",
                "value": request.gpu_temp,
                "threshold": 80
            })
        
        # Verificar temperatura memoria
        if request.memory_temp > 85:
            alerts_triggered.append({
                "type": "HIGH_MEMORY_TEMP",
                "value": request.memory_temp,
                "threshold": 85
            })
        
        # Verificar consumo de energía
        if request.power_consumption > 300:
            alerts_triggered.append({
                "type": "HIGH_POWER",
                "value": request.power_consumption,
                "threshold": 300
            })
        
        if alerts_triggered:
            alert_event = {
                "gpu_uuid": request.gpu_uuid,
                "rig_name": getattr(request, 'rig_name', None),
                "alerts": alerts_triggered,
                "triggered_at": datetime.utcnow().isoformat() + 'Z',
                "source": "grpc_telemetry"
            }
            self.redis_client.publish('gpu_alerts', json.dumps(alert_event))
            logger.warning(f"🚨 {len(alerts_triggered)} alert(s) for GPU {request.gpu_uuid}")
        
        return alert_service_pb2.ProcessResponse(
            processed=True,
            status="success",
            message=f"Telemetry processed, {len(alerts_triggered)} alert(s) triggered"
        )

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    alert_service_pb2_grpc.add_AlertServiceServicer_to_server(AlertServicer(), server)
    server.add_insecure_port('[::]:50051')
    
    logger.info("🚀 Starting gRPC Alert Service on port 50051...")
    server.start()
    logger.info("✅ gRPC Alert Service started successfully")
    logger.info("📡 Listening for alerts on Redis channel 'gpu_alerts'")
    
    try:
        server.wait_for_termination()
    except KeyboardInterrupt:
        logger.info("⛔ Shutting down server...")
        server.stop(0)

if __name__ == '__main__':
    serve()