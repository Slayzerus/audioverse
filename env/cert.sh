#!/bin/bash

set -e

echo "?? Generowanie certyfikatów Let's Encrypt..."

if ! command -v certbot &> /dev/null
then
    echo "?? Certbot nie jest zainstalowany. Instalowanie..."
    sudo apt update && sudo apt install -y certbot
else
    echo "? Certbot jest ju¿ zainstalowany."
fi

echo "? Pomijam mail.audioverse.io, na razie nie generujemy certyfikatu dla tej domeny."
DOMAINS=("audioverse.io" "wiki.audioverse.io" "project.audioverse.io" "storage.audioverse.io" "api.audioverse.io")

echo "?? Usuwanie starych certyfikatów..."
for domain in "${DOMAINS[@]}"; do
    echo "? Usuwanie certyfikatu dla $domain..."
    
    # Usuñ TYLKO certyfikat z certbota (nie katalog archive!)
    sudo certbot delete --cert-name "$domain" --non-interactive || true

    # Usuñ katalog live, ale NIE archive
    sudo rm -rf "/etc/letsencrypt/live/$domain" "/etc/letsencrypt/renewal/$domain.conf"
done

for domain in "${DOMAINS[@]}"; do
    echo "?? Generowanie certyfikatu dla $domain..."

    # Sprawdzenie, czy port 80 jest zajêty
    if sudo netstat -tulpn | grep ":80 " &> /dev/null; then
        echo "??  Port 80 jest zajêty. Zatrzymujê inne us³ugi na czas generowania certyfikatu..."
        sudo systemctl stop nginx || true
        docker stop $(docker ps -q --filter "publish=80") || true
    fi

    # Próbujemy wygenerowaæ nowy certyfikat
    if sudo certbot certonly --standalone -d "$domain" --non-interactive --agree-tos --email admin@$domain --cert-name "$domain"; then
        echo "? Nowy certyfikat dla $domain wygenerowany."
    else
        echo "?? Nie mo¿na wygenerowaæ nowego certyfikatu dla $domain (limit certyfikatów)."
        echo "?? Kopiujê poprzedni certyfikat z archive/$domain"
    fi

    # Naprawienie certyfikatów – KOPIOWANIE zamiast symlinków!
    sudo rm -rf "/etc/letsencrypt/live/$domain"
    sudo mkdir -p "/etc/letsencrypt/live/$domain"

    if [[ -f "/etc/letsencrypt/archive/$domain/cert1.pem" ]]; then
        sudo cp "/etc/letsencrypt/archive/$domain/cert1.pem" "/etc/letsencrypt/live/$domain/cert.pem"
        sudo cp "/etc/letsencrypt/archive/$domain/chain1.pem" "/etc/letsencrypt/live/$domain/chain.pem"
        sudo cp "/etc/letsencrypt/archive/$domain/fullchain1.pem" "/etc/letsencrypt/live/$domain/fullchain.pem"
        sudo cp "/etc/letsencrypt/archive/$domain/privkey1.pem" "/etc/letsencrypt/live/$domain/privkey.pem"
        echo "? Certyfikaty dla $domain skopiowane do /live/"
    else
        echo "? ERROR: Brak wczeœniejszych certyfikatów dla $domain! SprawdŸ katalog /etc/letsencrypt/archive/$domain"
    fi
done

echo "?? Dodawanie cronjob do automatycznego odnawiania certyfikatów..."

# Usuniêcie starego cronjob, jeœli istnieje
(crontab -l 2>/dev/null | grep -v "certbot renew") | crontab -

# Dodanie nowego cronjob do odnawiania certyfikatów co tydzieñ w nocy
(crontab -l 2>/dev/null; echo "0 3 * * 0 certbot renew --quiet --post-hook 'systemctl restart nginx'") | crontab -

echo "?? Cronjob dodany do odnawiania certyfikatów co tydzieñ!"
