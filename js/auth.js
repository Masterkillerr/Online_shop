import { supabase } from './api.js';

// Elementos del DOM
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const toggleAuthBtn = document.getElementById('toggle-auth');
const toggleText = document.getElementById('toggle-text');
const nameGroup = document.getElementById('name-group');

const nombresInput = document.getElementById('nombres');
const apellidosInput = document.getElementById('apellidos');
const documentoInput = document.getElementById('documento');
const telefonoInput = document.getElementById('password'); // Mantengo el ID por ahora para no romper CSS pero lo trato como teléfono
const emailInput = document.getElementById('email');

let isLogin = true;

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar si ya hay una sesión activa localmente
    const user = JSON.parse(localStorage.getItem('aura_user'));
    if (user) {
        window.location.href = 'index.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'signup') {
        setAuthMode(false);
    }
});

function setAuthMode(login) {
    isLogin = login;
    if (isLogin) {
        authTitle.textContent = 'Bienvenido';
        authSubtitle.textContent = 'Ingresa tus datos para continuar.';
        authSubmitBtn.textContent = 'Iniciar Sesión';
        toggleText.textContent = '¿No tienes una cuenta?';
        toggleAuthBtn.textContent = 'Regístrate';
        nameGroup.style.display = 'none';
        nombresInput.required = false;
        apellidosInput.required = false;
        documentoInput.required = false;
        telefonoInput.required = true; // Teléfono es requerido para login
    } else {
        authTitle.textContent = 'Crea tu Cuenta';
        authSubtitle.textContent = 'Únete a nuestra comunidad exclusiva.';
        authSubmitBtn.textContent = 'Registrarse';
        toggleText.textContent = '¿Ya tienes una cuenta?';
        toggleAuthBtn.textContent = 'Inicia Sesión';
        nameGroup.style.display = 'block';
        nombresInput.required = true;
        apellidosInput.required = true;
        documentoInput.required = true;
        telefonoInput.required = true; // Teléfono es requerido para registro
    }
}

// Toggle entre Login y Registro
toggleAuthBtn.addEventListener('click', () => setAuthMode(!isLogin));

// Manejo del Formulario
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value;
    const telefono = telefonoInput.value;
    const nombres = nombresInput.value;
    const apellidos = apellidosInput.value;
    const documento = documentoInput.value;

    try {
        authSubmitBtn.disabled = true;
        authSubmitBtn.textContent = isLogin ? 'Verificando...' : 'Creando...';

        if (isLogin) {
            // LOGIN DB-ONLY
            const { data: cliente, error } = await supabase
                .from('cliente')
                .select('*')
                .eq('email', email)
                .eq('telefono', telefono)
                .single();

            if (error || !cliente) {
                throw new Error('Credenciales incorrectas o cliente no encontrado.');
            }

            console.log('Login exitoso:', cliente);
            localStorage.setItem('aura_user', JSON.stringify(cliente));
            window.location.href = 'index.html';
        } else {
            // REGISTRO DB-ONLY
            const { data: dbData, error: dbError } = await supabase
                .from('cliente')
                .upsert([{
                    nombres: nombres,
                    apellidos: apellidos,
                    email: email,
                    documento: documento || null,
                    telefono: telefono || null,
                    estado: true,
                    fecha_registro: new Date().toISOString()
                }], { onConflict: 'email' })
                .select();

            if (dbError) {
                console.error('Error detallado al insertar en tabla cliente:', dbError);
                let msg = `Hubo un problema al guardar tus datos: ${dbError.message}`;
                if (dbError.message.includes('row-level security')) {
                    msg += '\n\nTIP: Asegúrate de configurar las políticas RLS en tu panel de Supabase para la tabla "cliente".';
                }
                throw new Error(msg);
            }

            console.log('Registro exitoso:', dbData);
            alert('¡Cuenta creada exitosamente! Ahora puedes iniciar sesión con tu teléfono.');
            setAuthMode(true);
        }
    } catch (error) {
        console.error('Error:', error.message);
        alert(`Error: ${error.message}`);
    } finally {
        authSubmitBtn.disabled = false;
        authSubmitBtn.textContent = isLogin ? 'Iniciar Sesión' : 'Registrarse';
    }
});
