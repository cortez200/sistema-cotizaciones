let itemContador = 0;

document.addEventListener('DOMContentLoaded', () => {
    const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    document.getElementById('fecha-actual').innerText = new Date().toLocaleDateString('es-PE', opciones);
    agregarFila();
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
        <td><textarea class="table-input desc" rows="1" placeholder="Descripción..."></textarea></td>
        <td><input type="number" class="table-input text-center precio" oninput="calcularTotal()" value="0" step="0.01"></td>
        <td class="text-center"><button type="button" class="btn btn-danger btn-sm" onclick="eliminarFila(${itemContador})">x</button></td>
    `;
    tbody.appendChild(fila);
    calcularTotal();
}

function eliminarFila(id) {
    const filas = document.querySelectorAll('#cuerpo-tabla tr');
    if (filas.length > 1) {
        document.getElementById(`fila-${id}`).remove();
        reenumerarItems();
        calcularTotal();
    }
}

function reenumerarItems() {
    const filas = document.querySelectorAll('#cuerpo-tabla tr');
    filas.forEach((fila, index) => {
        fila.querySelector('.nro-item').innerText = index + 1;
    });
}

function calcularTotal() {
    let totalAcumulado = 0;
    const filas = document.querySelectorAll('#cuerpo-tabla tr');
    filas.forEach((fila) => {
        const cantidad = parseFloat(fila.querySelector('.cant').value) || 0;
        const precio = parseFloat(fila.querySelector('.precio').value) || 0;
        totalAcumulado += (cantidad * precio);
    });
    document.getElementById('total-final').innerText = totalAcumulado.toFixed(2);
}

function guardarCotizacion() {
    const items = [];
    document.querySelectorAll('#cuerpo-tabla tr').forEach(fila => {
        items.push({
            um: fila.querySelector('.um').value,
            cantidad: fila.querySelector('.cant').value,
            descripcion: fila.querySelector('.desc').value,
            precio: fila.querySelector('.precio').value
        });
    });

    const data = {
        cliente: document.getElementById('cliente').value || "",
        telefono: document.getElementById('telefono').value || "",
        atencion: document.getElementById('atencion').value || "",
        items: items,
        total: document.getElementById('total-final').innerText
    };

    fetch('/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => {
        if (!res.ok) throw new Error("Error al generar PDF");
        return res.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        
        // Lógica para forzar la descarga con el nombre "COTIZACION.pdf"
        const link = document.createElement('a');
        link.href = url;
        link.download = 'COTIZACION.pdf'; // Aquí defines el nombre del archivo
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        // Opcional: Abrir en pestaña nueva también
        window.open(url); 
    })
    .catch(err => console.error("Error:", err));
}