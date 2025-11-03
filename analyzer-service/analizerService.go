package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type SensorData struct {
	Temperature float64 `json:"temperature"`
}

func main() {
	fmt.Println("Iniciando analizador...")

	for {
		func() {
			defer func() {
				if r := recover(); r != nil {
					fmt.Printf("Error: %v\n", r)
				}
			}()

			// Crear cliente HTTP
			client := &http.Client{
				Timeout: 10 * time.Second,
			}

			// Hacer request al collector service
			resp, err := client.Get("http://collector-service:5002/data")
			if err != nil {
				fmt.Printf("Error: %v\n", err)
				return
			}
			defer resp.Body.Close()

			// Leer el body de la respuesta
			body, err := io.ReadAll(resp.Body)
			if err != nil {
				fmt.Printf("Error: %v\n", err)
				return
			}

			// Parsear JSON array
			var sensorDataArray []SensorData
			err = json.Unmarshal(body, &sensorDataArray)
			if err != nil {
				fmt.Printf("Error: %v\n", err)
				return
			}

			// Procesar datos
			if len(sensorDataArray) > 0 {
				var avgTemp float64
				for _, data := range sensorDataArray {
					avgTemp += data.Temperature
				}
				avgTemp /= float64(len(sensorDataArray))
				fmt.Printf("Promedio de temperatura: %.2f°C\n", avgTemp)
			} else {
				fmt.Println("Sin datos todavía...")
			}
		}()

		// Esperar 8 segundos antes del siguiente ciclo
		time.Sleep(8 * time.Second)
	}
}
