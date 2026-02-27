const http = require('http');
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, 'Logs');
const PORT = 3000;

// Asegurar que el directorio de logs existe
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR);
}

const server = http.createServer((req, res) => {
    // Manejar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/log') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const { type, content, timestamp } = JSON.parse(body);
                const date = new Date().toISOString().split('T')[0];
                const fileName = `session-${date}.log`;
                const filePath = path.join(LOG_DIR, fileName);

                const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${JSON.stringify(content)}\n`;

                fs.appendFileSync(filePath, logEntry);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success' }));
            } catch (err) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, () => {
    console.log(`Logger Bridge corriendo en http://localhost:${PORT}`);
    console.log(`Los logs se guardarán en: ${LOG_DIR}`);
});
