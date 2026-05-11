const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const ejs = require('ejs');
const pdf = require('html-pdf-node');

const app = express();
// CAMBIO 1: Render usa puertos dinámicos, esto permite que funcione en la nube o local
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/guardar', (req, res) => {
    const datos = req.body;

    ejs.renderFile(path.join(__dirname, 'views', 'plantilla-pdf.ejs'), { datos }, (err, html) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error al procesar el diseño");
        }

        // CAMBIO 2: Agregamos args para que Chromium corra sin problemas en servidores Linux como Render
        let options = { 
            format: 'A4',
            args: ['--no-sandbox', '--disable-setuid-sandbox'] 
        };
        let file = { content: html };

        pdf.generatePdf(file, options).then(pdfBuffer => {
            res.contentType("application/pdf");
            res.send(pdfBuffer); 
        }).catch(error => {
            console.error(error);
            res.status(500).send("Error al generar PDF");
        });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor en puerto ${PORT}`);
});