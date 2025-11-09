# script_gpu_data.py
import requests
import json
import random
import time


class GPUDataGenerator:
    def __init__(self, ingestion_service_url):
        self.ingestion_url = f"{ingestion_service_url}/api/v1/telemetry"
        self.mining_session = f"{ingestion_service_url}/api/v1/mining-session"

        # Configuración fija de las 20 GPUs (4 rigs x 5 GPUs)
        self.gpu_fleet = self._initialize_gpu_fleet()

    def _initialize_gpu_fleet(self):
        """Inicializa la flota de 20 GPUs con configuraciones fijas"""
        fleet = []

        # Rig A - 5x RTX 3080 Ti
        for i in range(5):
            fleet.append(
                {
                    "gpu_uuid": f"gpu-A-{i+1}",
                    "rig_name": "rig-A",
                    "gpu_index": i,
                    "model": "RTX 3080 Ti",
                    "vendor": "NVIDIA",
                    "memory_size_mb": 10240,
                }
            )

        # Rig B - 5x RTX 3090
        for i in range(5):
            fleet.append(
                {
                    "gpu_uuid": f"gpu-B-{i+1}",
                    "rig_name": "rig-B",
                    "gpu_index": i,
                    "model": "RTX 3090",
                    "vendor": "NVIDIA",
                    "memory_size_mb": 24576,
                }
            )

        # Rig C - 5x RTX 5080 Ti
        for i in range(5):
            fleet.append(
                {
                    "gpu_uuid": f"gpu-C-{i+1}",
                    "rig_name": "rig-C",
                    "gpu_index": i,
                    "model": "RTX 5080 Ti",
                    "vendor": "AMD",
                    "memory_size_mb": 16384,
                }
            )

        # Rig D - 5x RTX 4090
        for i in range(5):
            fleet.append(
                {
                    "gpu_uuid": f"gpu-D-{i+1}",
                    "rig_name": "rig-D",
                    "gpu_index": i,
                    "model": "RTX 4090",
                    "vendor": "NVIDIA",
                    "memory_size_mb": 24576,
                }
            )

        return fleet

    def generate_gpu_data(self, gpu_config):
        """Genera datos de telemetría para una GPU específica manteniendo su configuración fija"""
        return {
            # Identificación de GPU (FIJO)
            "gpu_uuid": gpu_config["gpu_uuid"],
            "rig_name": gpu_config["rig_name"],
            "gpu_index": gpu_config["gpu_index"],
            # Información del hardware (FIJO)
            "model": gpu_config["model"],
            "vendor": gpu_config["vendor"],
            "memory_size_mb": gpu_config["memory_size_mb"],
            # Métricas variables (cambian en cada envío)
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

    def send_data_for_all_gpus(self):
        """Envía datos de telemetría para todas las 20 GPUs"""
        success_count = 0

        for gpu_config in self.gpu_fleet:
            data = self.generate_gpu_data(gpu_config)
            try:
                response = requests.post(
                    self.ingestion_url,
                    json=data,
                    headers={"Content-Type": "application/json"},
                    timeout=5,
                )

                if response.status_code == 200:
                    success_count += 1
                    print(
                        f"✅ {gpu_config['gpu_uuid']} ({gpu_config['model']}) | "
                        f"Temp: {data['gpu_temp_celsius']:.1f}°C | "
                        f"Load: {data['load_percentage']:.0f}% | "
                        f"Power: {data['power_draw_watt']:.0f}W"
                    )
                else:
                    print(
                        f"❌ Error sending {gpu_config['gpu_uuid']}: {response.status_code}"
                    )

            except Exception as e:
                print(f"❌ Error sending {gpu_config['gpu_uuid']}: {e}")

        print(f"\n📊 Sent telemetry for {success_count}/{len(self.gpu_fleet)} GPUs\n")
        return success_count == len(self.gpu_fleet)


# Uso
generator = GPUDataGenerator("http://data-ingestion:5002")
print("🚀 Starting GPU Data Generator...")
print(f"📊 Managing fleet of {len(generator.gpu_fleet)} GPUs:")
print(f"   - Rig A: 5x RTX 3080 (10GB)")
print(f"   - Rig B: 5x RTX 3090 (24GB)")
print(f"   - Rig C: 5x RX 6800 XT (16GB)")
print(f"   - Rig D: 5x RTX 4090 (24GB)")
print("\n📡 Sending telemetry data every 30 seconds")
print("Press Ctrl+C to stop\n")

while True:
    generator.send_data_for_all_gpus()
    time.sleep(30)  # Enviar cada 30 segundos
