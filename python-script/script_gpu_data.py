# script_gpu_data.py
import requests
import json
import random
import time


class GPUDataGenerator:
    def __init__(self, ingestion_service_url):
        self.ingestion_url = f"{ingestion_service_url}/api/v1/telemetry"
        self.mining_session = f"{ingestion_service_url}/api/v1/mining-session"

    def generate_gpu_data(self):
        """Genera datos completos de GPU incluyendo info del hardware"""
        return {
            # Identificación de GPU
            "gpu_uuid": f"gpu-{random.randint(10, 20)}",
            "rig_name": f"rig-{random.choice(['A', 'B', 'C'])}",
            "gpu_index": random.randint(0, 7),
            
            # Información del hardware (para tabla gpus)
            "model": random.choice(['RTX 3080', 'RTX 3090', 'RX 6800 XT', 'RTX 4090', 'RTX 5080', 'RTX 5090', 'RX 9070XT', 'RTX 5080Ti', 'RX 7900XTX']),
            "vendor": random.choice(['NVIDIA', 'AMD']),
            "memory_size_mb": random.choice([8192, 10240, 16384, 24576]),
            
            # Métricas de temperatura (para tabla temperature_readings)
            "gpu_temp_celsius": random.uniform(40, 95),
            "memory_temp_celsius": random.uniform(50, 105),
            "hotspot_temp_celsius": random.uniform(45, 110),
            "load_percentage": random.uniform(70, 100),
            "power_draw_watt": random.uniform(200, 350),
            "fan_speed_percentage": random.uniform(30, 100),
            "fan_speed_rpm": random.randint(1500, 3500),
            "ambient_temp_celsius": random.uniform(20, 30),
            
            "timestamp": time.time(),
        }

    def generate_event_store(self):
        return {
            "event_id": f"event-{random.randint(10000, 99999)}",
            "event_type": "gpu_telemetry",
            "event_version": 1, 
            "aggregate_type": "gpu",
            "aggregate_id": f"gpu-{random.randint(1000, 9999)}",
            "timestamp": time.time(),
            "metadata": {"source": "gpu_data_generator", "version": "1.0"},
            # "payload": self.generate_gpu_data()
            "payload": {"opai": "a"},
            "processed": False,
            "correlation_id": "correlation_id",
            "causation_id": "causation_id",
        }

    def send_data(self):
        # Enviar datos de GPU con toda la información
        data = self.generate_gpu_data()
        try:
            response = requests.post(
                self.ingestion_url,
                json=data,
                headers={"Content-Type": "application/json"},
                timeout=5,
            )
            print(f"✅ Sent GPU data: gpu_uuid={data['gpu_uuid']}, temp={data['gpu_temp_celsius']:.2f}°C")
            print(f"   Response status: {response.status_code}")
            if response.status_code != 200:
                print(f"   Error response: {response.text}")
            return response.status_code == 200
        except Exception as e:
            print(f"❌ Error sending data: {e}")
            return False


# Uso
generator = GPUDataGenerator("http://data-ingestion:5002")
print("🚀 Starting GPU Data Generator...")
print("📊 Sending telemetry data every 30 seconds")
print("Press Ctrl+C to stop\n")

while True:
    generator.send_data()
    time.sleep(30)  # Enviar cada 30 segundos
