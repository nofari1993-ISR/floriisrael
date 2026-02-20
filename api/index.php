<?php

// PHP Bridge for Vercel - serves the React SPA (dist/index.html)
// All routes are rewritten here via vercel.json

$distDir = __DIR__ . '/../dist';
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Strip leading slash
$filePath = $distDir . $requestUri;

// Serve static files directly if they exist (assets, images, etc.)
if ($requestUri !== '/' && file_exists($filePath) && !is_dir($filePath)) {
    $ext = pathinfo($filePath, PATHINFO_EXTENSION);

    $mimeTypes = [
        'js'    => 'application/javascript',
        'css'   => 'text/css',
        'html'  => 'text/html',
        'json'  => 'application/json',
        'png'   => 'image/png',
        'jpg'   => 'image/jpeg',
        'jpeg'  => 'image/jpeg',
        'gif'   => 'image/gif',
        'svg'   => 'image/svg+xml',
        'ico'   => 'image/x-icon',
        'woff'  => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf'   => 'font/ttf',
        'webp'  => 'image/webp',
    ];

    if (isset($mimeTypes[$ext])) {
        header('Content-Type: ' . $mimeTypes[$ext]);
    }

    readfile($filePath);
    exit;
}

// Fallback: serve index.html for all SPA routes (React Router)
$indexFile = $distDir . '/index.html';

if (!file_exists($indexFile)) {
    http_response_code(503);
    echo 'Build not found. Run: npm run build';
    exit;
}

header('Content-Type: text/html; charset=UTF-8');
readfile($indexFile);
