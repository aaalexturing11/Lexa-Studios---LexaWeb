// carrito.js
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

function toggleCarrito() {
  document.getElementById('carrito').classList.toggle('abierto');
  renderCarrito();
}

function agregarAlCarrito(nombre, talla, precio, imagen, cantidad = 1) {
  const tallaNormalizada = document.getElementById("selector-talla").style.display === 'none' ? 'One size' : talla;

  const index = carrito.findIndex(p => p.nombre === nombre && p.talla === tallaNormalizada);
  if (index >= 0) {
    carrito[index].cantidad += cantidad;
  } else {
    carrito.push({ nombre, talla: tallaNormalizada, precio, imagen, cantidad });
  }
  localStorage.setItem("carrito", JSON.stringify(carrito));
  renderCarrito();
  document.getElementById('carrito').classList.add('abierto');
}

function renderCarrito() {
  const contenedor = document.getElementById('lista-carrito');
  contenedor.innerHTML = '';
  let total = 0;

  carrito.forEach(producto => {
    const subtotal = producto.precio * producto.cantidad;
    total += subtotal;

    const mostrarTalla = producto.talla && producto.talla !== 'One size';

    contenedor.innerHTML += `
      <div class="item-carrito">
        <img src="${producto.imagen}" alt="${producto.nombre}" style="width: 90px; height: 90px; object-fit: cover; border-radius: 6px; margin-top: 10px;">
        <div>
          <p><strong>${producto.nombre}</strong></p>
          ${mostrarTalla ? `<p>Size: ${producto.talla}</p>` : ''}
          <p>${producto.cantidad} x $${producto.precio} = $${subtotal}</p>
        </div>
      </div>
    `;
  });

  document.getElementById('total').innerText = `Total: $${total}`;
}

function pagar() {
  alert('Thank you for your purchase!');
  carrito = [];
  localStorage.removeItem("carrito");
  renderCarrito();
  document.getElementById('carrito').classList.remove('abierto');
}

if (document.readyState !== 'loading') {
  renderCarrito();
} else {
  document.addEventListener("DOMContentLoaded", renderCarrito);
}