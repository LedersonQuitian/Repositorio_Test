const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  try {
    // Normalizar URL
    let urlPath = req.url === '/' || req.url === '' ? '/index.html' : req.url;
    
    // Remover query string
    urlPath = urlPath.split('?')[0];
    
    // Construir ruta del archivo
    let filePath = path.join(__dirname, urlPath);
    const ext = path.extname(filePath);
    
    // Determinar content type
    let contentType = 'text/html';
    if (ext === '.js') contentType = 'application/javascript; charset=utf-8';
    else if (ext === '.json') contentType = 'application/json; charset=utf-8';
    else if (ext === '.css') contentType = 'text/css; charset=utf-8';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.html') contentType = 'text/html; charset=utf-8';
    
    // Leer y servir el archivo
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error(`404 - ${urlPath} (buscó en: ${filePath})`);
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<h1>404 Not Found</h1><p>Archivo: ${urlPath}</p>`);
        return;
      }
      
      console.log(`200 - ${urlPath}`);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  } catch (error) {
    console.error('Error del servidor:', error);
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<h1>500 Internal Server Error</h1><p>${error.message}</p>`);
  }
});

server.on('error', (err) => {
  console.error('Error crítico del servidor:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Excepción no capturada:', err);
});

server.listen(5500, () => {
  console.log('✅ Servidor ejecutándose en http://localhost:5500');
  console.log('📂 Sirviendo desde:', __dirname);
  console.log('Presiona Ctrl+C para detener\n');
});
