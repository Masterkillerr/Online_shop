/**
 * Remote Logger Interceptor
 * Reenvía los logs de la consola a un servidor local para guardarlos en archivos.
 */
(function () {
    let isActive = true;
    const LOGGER_URL = 'http://localhost:3000/log';

    // Verificar si el servidor está disponible al inicio
    fetch(LOGGER_URL, { method: 'OPTIONS' }).catch(() => {
        isActive = false;
        // No logueamos nada para no ensuciar la consola si no hay servidor
    });

    function sendLog(type, args) {
        if (!isActive) return;

        const content = Array.from(args).map(arg => {
            try {
                if (typeof arg === 'object' && arg !== null) {
                    return JSON.stringify(arg, (key, value) =>
                        typeof value === 'bigint' ? value.toString() : value, 2);
                }
                return String(arg);
            } catch (e) {
                return '[Complex Object]';
            }
        }).join(' ');

        fetch(LOGGER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: type,
                content: content,
                timestamp: new Date().toLocaleTimeString()
            })
        }).catch(() => {
            isActive = false; // Desactivar si falla una vez para no insistir
        });
    }

    // Interceptar console.log
    const originalLog = console.log;
    console.log = function () {
        originalLog.apply(console, arguments);
        sendLog('log', arguments);
    };

    // Intercept console.error
    const originalError = console.error;
    console.error = function () {
        originalError.apply(console, arguments);
        sendLog('error', arguments);
    };

    // Intercept console.warn
    const originalWarn = console.warn;
    console.warn = function () {
        originalWarn.apply(console, arguments);
        sendLog('warn', arguments);
    };

    console.log('--- Remote Logger inicializado ---');
})();
