process.env.TZ = 'America/Lima'; // Fuerza la zona horaria de Perú en el servidor
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const ejs = require('ejs');
const pdf = require('html-pdf-node');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/guardar', (req, res) => {
    const datos = req.body;
    const contadorPath = path.join(__dirname, 'contador.json');

    // ACTUALIZADO: El contador ahora inicia en 425 por defecto
    let contadorData = { ultimoNumero: 425 }; 
    if (fs.existsSync(contadorPath)) {
        contadorData = JSON.parse(fs.readFileSync(contadorPath, 'utf-8'));
    }

    contadorData.ultimoNumero += 1;
    const numeroReal = contadorData.ultimoNumero; 
    const numeroFormateado = String(numeroReal).padStart(8, '0');
    datos.numeroCorrelativo = `0001- ${numeroFormateado}`;
    
    // Guardamos el progreso en el archivo JSON
    fs.writeFileSync(contadorPath, JSON.stringify(contadorData));

    // Lógica de Impuestos
    const valorVenta = parseFloat(datos.total) || 0;
    const igv = valorVenta * 0.18;
    const totalFinal = valorVenta + igv;

    datos.valorVentaCalculado = valorVenta.toFixed(2);
    datos.igvCalculado = igv.toFixed(2);
    datos.totalCalculado = totalFinal.toFixed(2);

    // Ajuste de fecha para el PDF (Hora Perú)
    datos.fechaPeru = new Date().toLocaleDateString('es-PE', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        timeZone: 'America/Lima' 
    });

    ejs.renderFile(path.join(__dirname, 'views', 'plantilla-pdf.ejs'), { datos }, (err, html) => {
        if (err) return res.status(500).send("Error en el diseño");

        let options = { 
            format: 'A4',
            args: ['--no-sandbox', '--disable-setuid-sandbox'] 
        };

        pdf.generatePdf({ content: html }, options).then(pdfBuffer => {
            // Enviamos el número real en el header para que el archivo se llame Cotizacion_426.pdf
            res.setHeader('X-Numero-Cotizacion', numeroReal);
            res.contentType("application/pdf");
            res.send(pdfBuffer); 
        }).catch(err => res.status(500).send("Error al generar PDF"));
    });
});

app.listen(PORT, () => {
    console.log(`Servidor en puerto ${PORT}`);
});