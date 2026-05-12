let itemContador = 0;

document.addEventListener('DOMContentLoaded', () => {
    const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    document.getElementById('fecha-actual').innerText = new Date().toLocaleDateString('es-PE', opciones);
    agregarFila();
    cargarHistorial();
});

function agregarFila() {
    itemContador++;
    const tbody = document.getElementById('cuerpo-tabla');
    const fila = document.createElement('tr');
    fila.id = `fila-${itemContador}`;
    fila.innerHTML = `
        <td class="text-center fw-bold nro-item">${itemContador}</td>
        <td><input type="text" class="table-input text-center um" value="m2"></td>
        <td><input type="number" class="table-input text-center cant" oninput="calcularTotal()" value="1"></td>
        <td><textarea class="table-input desc" rows="1"></textarea></td>
        <td><input type="number" class="table-input text-center precio" oninput="calcularTotal()" value="0" step="0.01"></td>
        <td class="text-center"><button type="button" class="btn btn-danger btn-sm" onclick="eliminarFila(${itemContador})">x</button></td>
    `;
    tbody.appendChild(fila);
    calcularTotal();
}

function eliminarFila(id) {
    if (document.querySelectorAll('#cuerpo-tabla tr').length > 1) {
        document.getElementById(`fila-${id}`).remove();
        reenumerarItems();
        calcularTotal();
    }
}

function reenumerarItems() {
    document.querySelectorAll('#cuerpo-tabla tr').forEach((fila, index) => {
        fila.querySelector('.nro-item').innerText = index + 1;
    });
}

function calcularTotal() {
    let base = 0;
    document.querySelectorAll('#cuerpo-tabla tr').forEach((fila) => {
        const c = parseFloat(fila.querySelector('.cant').value) || 0;
        const p = parseFloat(fila.querySelector('.precio').value) || 0;
        base += (c * p);
    });
    const igv = base * 0.18;
    document.getElementById('valor-venta').innerText = base.toFixed(2);
    document.getElementById('igv-total').innerText = igv.toFixed(2);
    document.getElementById('total-final').innerText = (base + igv).toFixed(2);
}

function guardarCotizacion() {
    const items = [];
    document.querySelectorAll('#cuerpo-tabla tr').forEach(fila => {
        items.push({
            um: fila.querySelector('.um').value,
            cantidad: fila.querySelector('.cantidad') ? fila.querySelector('.cantidad').value : fila.querySelector('.cant').value,
            descripcion: fila.querySelector('.desc').value,
            precio: fila.querySelector('.precio').value
        });
    });

    const cliente = document.getElementById('cliente').value || "";
    const data = {
        cliente: cliente,
        telefono: document.getElementById('telefono').value || "",
        atencion: document.getElementById('atencion').value || "",
        items: items,
        total: document.getElementById('valor-venta').innerText 
    };

    fetch('/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(async res => {
        // ACTUALIZADO: Leer el número real que viene del servidor
        const numeroCot = res.headers.get('X-Numero-Cotizacion') || "000";
        const blob = await res.blob();
        return { blob, numeroCot };
    })
    .then(({ blob, numeroCot }) => {
        const url = window.URL.createObjectURL(blob);
        const reader = new FileReader();
        reader.readAsDataURL(blob); 
        reader.onloadend = function() {
            const base64 = reader.result;                
            let historial = JSON.parse(localStorage.getItem('historial_doña_alcira')) || [];
            
            historial.push({ 
                id_unico: Date.now(),
                cliente: cliente || "Sin Nombre", 
                fecha: new Date().toLocaleDateString(), 
                total: document.getElementById('total-final').innerText, 
                pdf: base64,
                numeroLabel: numeroCot // Ahora coincide con el PDF
            });
            localStorage.setItem('historial_doña_alcira', JSON.stringify(historial));
            
            // Descarga con nombre sincronizado: Cotizacion_248.pdf
            const a = document.createElement('a');
            a.href = url; 
            a.download = `Cotizacion_${numeroCot}.pdf`; 
            a.click();
            window.open(url);

            cargarHistorial();
            limpiarFormulario(); // Limpia todo después de procesar
        }
    });
}

function limpiarFormulario() {
    document.getElementById('cliente').value = '';
    document.getElementById('telefono').value = '';
    document.getElementById('atencion').value = '';
    const tbody = document.getElementById('cuerpo-tabla');
    tbody.innerHTML = '';
    itemContador = 0;
    agregarFila();
    document.getElementById('valor-venta').innerText = '0.00';
    document.getElementById('igv-total').innerText = '0.00';
    document.getElementById('total-final').innerText = '0.00';
}

function cargarHistorial() {
    const historial = JSON.parse(localStorage.getItem('historial_doña_alcira')) || [];
    const tbody = document.getElementById('tabla-historial');
    tbody.innerHTML = '';
    
    historial.forEach((c, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${c.cliente}</td>
            <td>${c.fecha}</td>
            <td class="fw-bold">S/ ${c.total}</td>
            <td class="text-center">
                <button onclick="verPDF('${c.pdf}')" class="btn btn-sm btn-primary"><i class="bi bi-eye"></i></button>
                <button onclick="descargarPDF('${c.pdf}', '${c.numeroLabel}')" class="btn btn-sm btn-success"><i class="bi bi-download"></i></button>
                <button onclick="eliminarH(${c.id_unico})" class="btn btn-sm btn-danger"><i class="bi bi-trash"></i></button>
            </td>`;
        tbody.prepend(tr);
    });
}

function verPDF(b64) { const win = window.open(); win.document.write(`<iframe src="${b64}" frameborder="0" style="width:100%; height:100%;"></iframe>`); }

function descargarPDF(b64, num) { 
    const a = document.createElement('a'); 
    a.href = b64; 
    a.download = `Cotizacion_${num}.pdf`; 
    a.click(); 
}

function eliminarH(id_interno) {
    if(confirm('¿Eliminar del historial?')) {
        let h = JSON.parse(localStorage.getItem('historial_doña_alcira')).filter(c => c.id_unico !== id_interno);
        localStorage.setItem('historial_doña_alcira', JSON.stringify(h));
        cargarHistorial();
    }
}