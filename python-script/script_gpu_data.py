# script_gpu_data.py
import requests
import json
import random
import time


class GPUDataGenerator:
    def __init__(self, ingestion_service_url):
        self.ingestion_url = f"{ingestion_service_url}/api/v1/telemetry"

    def generate_gpu_data(self):
        return {
            "gpu_uuid": f"gpu-{random.randint(1000, 9999)}",
            "rig_name": f"rig-{random.choice(['A', 'B', 'C'])}",
            "gpu_index": random.randint(0, 7),
            "gpu_temp_celsius": random.uniform(40, 95),
            "memory_temp_celsius": random.uniform(50, 105),
            "hotspot_temp_celsius": random.uniform(45, 110),
            "load_percentage": random.uniform(70, 100),
            "power_draw_watt": random.uniform(200, 350),
            "fan_speed_percentage": random.uniform(30, 100),
            "fan_speed_rpm": random.randint(1500, 3500),
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
        # data = self.generate_gpu_data()
        data = self.generate_event_store()
        try:
            response = requests.post(
                self.ingestion_url,
                json=data,
                headers={"Content-Type": "application/json"},
                timeout=5,
            )
            print(f"Sent data: {data}, Response status: {response.status_code}")
            return response.status_code == 200
        except Exception as e:
            print(f"Error sending data: {e}")
            return False


# Uso
generator = GPUDataGenerator("http://localhost:5002")
while True:
    generator.send_data()
    time.sleep(30)  # Enviar cada 30 segundos
