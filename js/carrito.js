import { supabase } from './api.js';

// Elementos del DOM
const cartItemsContainer = document.getElementById('cart-items-container');
const cartSubtotalElement = document.getElementById('cart-subtotal');
const cartTotalElement = document.getElementById('cart-total');
const checkoutForm = document.getElementById('checkout-form');

// Estado del Carrito
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    renderCart();
    checkAuth();
    loadClientData();
});

// Cargar datos si está logueado (Local)
async function loadClientData() {
    const user = JSON.parse(localStorage.getItem('aura_user'));
    if (user) {
        // Los datos ya están en el user guardado localmente
        document.getElementById('nombres').value = user.nombres || '';
        document.getElementById('apellidos').value = user.apellidos || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('telefono').value = user.telefono || '';
        document.getElementById('direccion').value = user.direccion || '';
        document.getElementById('documento').value = user.documento || '';
    }
}

// Verificar Autenticación (Local)
async function checkAuth() {
    const navLogin = document.getElementById('nav-login');
    const navSignup = document.getElementById('nav-signup');
    const navProfile = document.getElementById('nav-profile');
    const userNameDisplay = document.getElementById('user-name-display');

    const user = JSON.parse(localStorage.getItem('aura_user'));

    if (user) {
        if (navLogin) navLogin.style.display = 'none';
        if (navSignup) navSignup.style.display = 'none';

        if (navProfile) {
            navProfile.style.display = 'inline-flex';
            userNameDisplay.textContent = user.nombres || 'Mi Perfil';
            navProfile.onclick = async (e) => {
                e.preventDefault();
                localStorage.removeItem('aura_user');
                localStorage.removeItem('cart'); // Reset cart on logout
                navProfile.innerHTML = '<span class="material-symbols-outlined" style="animation: spin 1s linear infinite;">sync</span> Saler...';
                setTimeout(() => window.location.reload(), 300);
            };
        }
    } else {
        if (navLogin) navLogin.style.display = 'inline-block';
        if (navSignup) navSignup.style.display = 'inline-flex';
        if (navProfile) navProfile.style.display = 'none';
    }
}

// Renderizar el carrito
function renderCart() {
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<div style="text-align: center; padding: 3rem;"><p style="color: #64748b; margin-bottom: 2rem;">Tu carrito está vacío.</p><a href="index.html" class="add-btn" style="width: auto; display: inline-flex;">Ir a la tienda</a></div>';
        updateTotals();
        return;
    }

    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item" style="opacity: 0; transform: translateX(-20px); transition: all 0.5s ease-out;">
            <img src="${(item.imagen && item.imagen !== 'null') ? item.imagen : 'https://via.placeholder.com/100'}" alt="${item.nombre}" class="cart-item-img">
            <div class="cart-item-info">
                <div class="cart-item-header">
                    <h3 style="font-size: 1.25rem; font-weight: 700; color: white;">${item.nombre}</h3>
                    <button class="remove-btn" onclick="removeFromCart(${item.id})">
                        <span class="material-symbols-outlined" style="font-size: 1.5rem;">close</span>
                    </button>
                </div>
                <p style="color: var(--text-muted); font-size: 1rem; margin-bottom: 1.5rem;">$${item.precio.toFixed(2)}</p>
                <div class="qty-controls" style="background: rgba(255,255,255,0.03); border-color: var(--glass-border);">
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">
                        <span class="material-symbols-outlined" style="font-size: 1.25rem;">remove</span>
                    </button>
                    <span style="font-weight: 800; min-width: 30px; text-align: center; color: white;">${item.cantidad}</span>
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">
                        <span class="material-symbols-outlined" style="font-size: 1.25rem;">add</span>
                    </button>
                </div>
            </div>
            <div style="font-weight: 900; font-size: 1.5rem; color: var(--accent); min-width: 120px; text-align: right;">
                $${(item.precio * item.cantidad).toFixed(2)}
            </div>
        </div>
    `).join('');

    // Animación de entrada
    const items = cartItemsContainer.querySelectorAll('.cart-item');
    items.forEach((item, index) => {
        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateX(0)';
        }, index * 80);
    });

    updateTotals();
}

// Funciones globales para botones
window.updateQuantity = (id, delta) => {
    const item = cart.find(i => i.id === id);
    if (!item) return;

    item.cantidad += delta;
    if (item.cantidad <= 0) {
        removeFromCart(id);
    } else {
        saveCart();
        renderCart();
    }
};

window.removeFromCart = (id) => {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    renderCart();
};

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateTotals() {
    const total = cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    if (cartSubtotalElement) cartSubtotalElement.textContent = `$${total.toFixed(2)}`;
    if (cartTotalElement) cartTotalElement.textContent = `$${total.toFixed(2)}`;
}

// Proceso de Compra
checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Verificación de Autenticación
    const user = localStorage.getItem('aura_user');
    if (!user) {
        if (confirm('Debes iniciar sesión para realizar una compra. ¿Deseas ir al login?')) {
            window.location.href = 'auth.html';
        }
        return;
    }

    if (cart.length === 0) {
        alert('Tu carrito está vacío.');
        return;
    }

    const nombres = document.getElementById('nombres').value;
    const apellidos = document.getElementById('apellidos').value;
    const email = document.getElementById('email').value;
    const documento = document.getElementById('documento').value;
    const telefono = document.getElementById('telefono').value;
    const direccion = document.getElementById('direccion').value;

    try {
        // 0. Validación Final de Stock (Audit Fix)
        for (const item of cart) {
            const { data: prod, error: stockErr } = await supabase
                .from('producto')
                .select('stock, nombre')
                .eq('id_producto', item.id)
                .single();

            if (stockErr || !prod) throw new Error(`No se pudo verificar el stock para ${item.nombre}`);
            if (prod.stock < item.cantidad) {
                throw new Error(`Lo sentimos, el producto "${prod.nombre}" ya no tiene suficiente stock (Disponible: ${prod.stock}).`);
            }
        }

        // 1. Insertar o Actualizar Cliente...
        const { data: clienteData, error: clienteError } = await supabase
            .from('cliente')
            .upsert([{
                nombres: nombres,
                apellidos: apellidos,
                email: email,
                documento: documento || null,
                telefono: telefono || null,
                direccion: direccion || null,
                estado: true,
                fecha_registro: new Date().toISOString()
            }], { onConflict: 'email' })
            .select();

        if (clienteError) throw clienteError;

        if (!clienteData || clienteData.length === 0) {
            throw new Error('No se pudo verificar el registro del cliente. Por favor, intenta de nuevo.');
        }

        const id_cliente = clienteData[0].id_cliente;

        // 2. Insertar Venta
        const total = cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
        const { data: ventaData, error: ventaError } = await supabase
            .from('venta')
            .insert([{
                id_cliente: id_cliente,
                total: total,
                fecha: new Date().toISOString(),
                estado: 'Completada',
                metodo_pago: 'Efectivo' // Valor por defecto según ERD
            }])
            .select();

        if (ventaError) throw ventaError;
        const id_venta = ventaData[0].id_venta;

        // 3. Insertar Detalle de Venta
        const detalles = cart.map(item => ({
            id_venta: id_venta,
            id_producto: item.id,
            cantidad: item.cantidad,
            precio_unitario: item.precio,
            subtotal: item.precio * item.cantidad
        }));

        const { error: detallesError } = await supabase
            .from('detalle_venta')
            .insert(detalles);

        if (detallesError) throw detallesError;

        // 4. Descontar Stock (CRITICAL FIX)
        for (const item of cart) {
            const { error: stockError } = await supabase.rpc('decrement_stock', {
                row_id: item.id,
                qty: item.cantidad
            });

            // Si el RPC no existe, usamos una actualización simple (menos segura ante concurrencia pero funcional)
            if (stockError) {
                console.warn('RPC decrement_stock no encontrado, usando actualización manual.');
                const { data: currentProd } = await supabase.from('producto').select('stock').eq('id_producto', item.id).single();
                if (currentProd) {
                    await supabase.from('producto').update({ stock: Math.max(0, currentProd.stock - item.cantidad) }).eq('id_producto', item.id);
                }
            }
        }

        // Éxito
        alert('¡Compra realizada con éxito! Gracias por tu pedido.');
        cart = [];
        saveCart();
        window.location.href = 'index.html';

    } catch (error) {
        console.error('Error en el proceso de compra:', error.message);
        alert(`Hubo un error al procesar tu compra: ${error.message}. Por favor, asegúrate de que las tablas correspondientes existan en Supabase.`);
    }
});
