import { supabase } from './api.js';

// Elementos del DOM
const productGrid = document.getElementById('product-grid');
const cartCountElement = document.getElementById('cart-count');
const cartTotalNavElement = document.getElementById('cart-total-nav');

// Estado del Carrito
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    fetchCategories();
    fetchProducts();
    updateCartUI();
    checkAuth();
});

// Variables de Estado
let allProducts = [];
let selectedCategory = 'all';

// Obtener categorías de Supabase
async function fetchCategories() {
    try {
        const { data, error } = await supabase
            .from('tipo_producto')
            .select('*')
            .eq('estado', true);

        if (error) throw error;
        renderCategories(data);
    } catch (error) {
        console.error('Error al cargar categorías:', error.message);
    }
}

function renderCategories(categories) {
    const filterContainer = document.getElementById('category-filter');
    if (!filterContainer) return;

    const categoriesHTML = categories.map(cat => `
        <button class="category-pill" data-category="${cat.id_tipo_producto}">${cat.nombre}</button>
    `).join('');

    filterContainer.innerHTML += categoriesHTML;

    // Event Listeners para los botones de categorías
    const pills = filterContainer.querySelectorAll('.category-pill');
    pills.forEach(pill => {
        pill.onclick = () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            selectedCategory = pill.getAttribute('data-category');
            filterAndRenderProducts();
        };
    });
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
                if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                    localStorage.removeItem('aura_user');
                    window.location.reload();
                }
            };
        }
    } else {
        if (navLogin) navLogin.style.display = 'inline-block';
        if (navSignup) navSignup.style.display = 'inline-flex';
        if (navProfile) navProfile.style.display = 'none';
    }
}

// Obtener productos de Supabase
async function fetchProducts() {
    try {
        const { data, error } = await supabase
            .from('producto')
            .select('*')
            .eq('estado', true);

        if (error) throw error;

        allProducts = data;
        filterAndRenderProducts();
    } catch (error) {
        console.error('Error al cargar productos:', error.message);
        productGrid.innerHTML = `<p>Error al cargar productos.</p>`;
    }
}

function filterAndRenderProducts() {
    const filtered = selectedCategory === 'all'
        ? allProducts
        : allProducts.filter(p => p.id_tipo_producto.toString() === selectedCategory);

    renderProducts(filtered);
}

// Renderizar productos en el grid
function renderProducts(productos) {
    if (!productos || productos.length === 0) {
        productGrid.innerHTML = '<p>No hay productos disponibles.</p>';
        return;
    }

    productGrid.innerHTML = productos.map(producto => `
        <div class="product-card" style="opacity: 0; transform: translateY(20px); transition: all 0.6s ease-out;">
            <div class="product-image-container">
                ${producto.imagen_url && producto.imagen_url !== 'null' ?
            `<img src="${producto.imagen_url}" alt="${producto.nombre}" class="product-image">` :
            `<div class="image-placeholder">
                        <span class="material-symbols-outlined">image</span>
                        <p style="font-size: 0.8rem; font-weight: 600;">Aura Market</p>
                    </div>`
        }
            </div>
            <div class="product-info">
                <div class="product-header">
                    <h4 class="product-title">${producto.nombre}</h4>
                    <span class="product-price">$${producto.precio.toFixed(2)}</span>
                </div>
                <p class="product-desc">${producto.descripcion || 'Calidad superior y diseño excepcional en cada detalle.'}</p>
                <button class="btn-primary" 
                    ${producto.stock <= 0 ? 'disabled style="background: #475569; cursor: not-allowed;"' : ''} 
                    onclick="addToCart(${producto.id_producto}, '${producto.nombre}', ${producto.precio}, '${producto.imagen_url || ''}')">
                    <span class="material-symbols-outlined" style="font-size: 1.25rem;">
                        ${producto.stock <= 0 ? 'block' : 'shopping_bag'}
                    </span>
                    ${producto.stock <= 0 ? 'Agotado' : 'Agregar al Carrito'}
                </button>
            </div>
        </div>
    `).join('');

    // Animación de entrada para los productos
    const cards = productGrid.querySelectorAll('.product-card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Funciones del Carrito (Expuestas globalmente para el onclick)
window.addToCart = async (id, nombre, precio, imagen) => {
    // Verificación de Autenticación
    const user = localStorage.getItem('aura_user');
    if (!user) {
        if (confirm('Debes iniciar sesión para agregar productos al carrito. ¿Deseas ir al login?')) {
            window.location.href = 'auth.html';
        }
        return;
    }

    try {
        // Verificar stock real en DB
        const { data: producto, error } = await supabase
            .from('producto')
            .select('stock')
            .eq('id_producto', id)
            .single();

        if (error || !producto) throw new Error('No se pudo verificar el inventario.');

        const existingItem = cart.find(item => item.id === id);
        const currentQtyInCart = existingItem ? existingItem.cantidad : 0;

        if (producto.stock <= currentQtyInCart) {
            alert(`Lo sentimos, solo quedan ${producto.stock} unidades de este producto.`);
            return;
        }

        if (existingItem) {
            existingItem.cantidad += 1;
        } else {
            cart.push({ id, nombre, precio, imagen, cantidad: 1 });
        }

        saveCart();
        updateCartUI();
        alert(`${nombre} agregado al carrito`);
    } catch (err) {
        console.error('Error al agregar al carrito:', err.message);
        alert('Hubo un problema al verificar el stock.');
    }
};

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartUI() {
    const totalItems = cart.reduce((acc, item) => acc + item.cantidad, 0);
    const totalPrice = cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

    if (cartCountElement) cartCountElement.textContent = totalItems;
    if (cartTotalNavElement) cartTotalNavElement.textContent = `$${totalPrice.toFixed(2)}`;
}
