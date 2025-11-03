const express = require('express');

const app = express();
app.use(express.json());

let records = [];

// Recibe datos de sensores
app.post('/collect', (req, res) => {
  records.push(req.body);
  console.log("Dato recibido:", req.body);
  res.sendStatus(200);
});

// Devuelve todos los datos
app.get('/data', (req, res) => {
  res.json(records);
});

// Tarea periódica: consultar al microservicio Python
setInterval(async () => {
  try {´
    const response = await fetch('http://sensor-service:5001/sensor/data');
    const data = await response.json();
    records.push(data);
    console.log("Dato agregado:", data);
  } catch (err) {
    console.error("Error al consultar sensor:", err.message);
  }
}, 5000); // cada 5 segundos

app.listen(5002, '0.0.0.0', () => console.log("Collector escuchando en puerto 5002"));
