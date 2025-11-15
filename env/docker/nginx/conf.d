# Frontend: audioverse.io
server {
    listen 80;
    server_name audioverse.io www.audioverse.io;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name audioverse.io www.audioverse.io;

    ssl_certificate /certs/fullchain.pem;
    ssl_certificate_key /certs/privkey.pem;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}


# API: api.audioverse.io → kontener api:5001 (HTTPS w aplikacji)
server {
    listen 80;
    server_name api.audioverse.io;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name api.audioverse.io;

    ssl_certificate /certs/fullchain.pem;
    ssl_certificate_key /certs/privkey.pem;

    location / {
        proxy_pass https://api:5001/;

        proxy_ssl_verify off;  # wyłącz weryfikację certyfikatu self-signed w backendzie (lub ustaw CA)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}


# Library API: libraryapi.audioverse.io → kontener library:5005 (HTTPS)
server {
    listen 80;
    server_name libraryapi.audioverse.io;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name libraryapi.audioverse.io;

    ssl_certificate /certs/fullchain.pem;
    ssl_certificate_key /certs/privkey.pem;

    location / {
        proxy_pass https://library:5005/;

        proxy_ssl_verify off;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
