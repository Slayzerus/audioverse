#!/bin/bash

set -e

echo "?? Sprawdzanie, czy Docker jest zainstalowany..."

if ! command -v docker &> /dev/null
then
    echo "?? Docker nie jest zainstalowany. Instalowanie..."
    curl -fsSL https://get.docker.com | sh
    sudo systemctl start docker
    sudo systemctl enable docker
else
    echo "? Docker jest ju¿ zainstalowany."
fi

echo "?? Sprawdzanie, czy Docker Compose jest zainstalowany..."

if ! command -v docker-compose &> /dev/null
then
    echo "?? Docker Compose nie jest zainstalowany. Instalowanie..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    echo "? Docker Compose jest ju¿ zainstalowany."
fi

echo "?? Tworzenie aliasów dla Docker Compose..."

if ! grep -q "alias docker-up=" ~/.bashrc; then
    echo "alias docker-up='docker-compose up -d'" >> ~/.bashrc
    echo "? Alias docker-up dodany!"
fi

if ! grep -q "alias docker-down=" ~/.bashrc; then
    echo "alias docker-down='docker-compose down --volumes --remove-orphans'" >> ~/.bashrc
    echo "? Alias docker-down dodany!"
fi

if ! grep -q "alias docker-purge=" ~/.bashrc; then
    echo "alias docker-purge='docker system prune -a --volumes -f'" >> ~/.bashrc
    echo "? Alias docker-purge dodany!"
fi

source ~/.bashrc

echo "?? Uruchamianie skryptu do generowania certyfikatów..."
bash cert.sh

echo "?? Tworzenie skryptów start/stop/purge..."

cat > start.sh <<EOF
#!/bin/bash
docker-up
EOF

cat > stop.sh <<EOF
#!/bin/bash
docker-down
EOF

cat > purge.sh <<EOF
#!/bin/bash
docker-purge
EOF

chmod +x start.sh stop.sh purge.sh

echo "? Instalacja zakoñczona! Mo¿esz teraz uruchomiæ kontenery za pomoc¹ './start.sh'"
#!/bin/bash

set -e

echo "?? Sprawdzanie, czy Docker jest zainstalowany..."

if ! command -v docker &> /dev/null
then
    echo "?? Docker nie jest zainstalowany. Instalowanie..."
    curl -fsSL https://get.docker.com | sh
    sudo systemctl start docker
    sudo systemctl enable docker
else
    echo "? Docker jest ju¿ zainstalowany."
fi

echo "?? Sprawdzanie, czy Docker Compose jest zainstalowany..."

if ! command -v docker-compose &> /dev/null
then
    echo "?? Docker Compose nie jest zainstalowany. Instalowanie..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    echo "? Docker Compose jest ju¿ zainstalowany."
fi

echo "?? Tworzenie aliasów dla Docker Compose..."

if ! grep -q "alias docker-up=" ~/.bashrc; then
    echo "alias docker-up='docker-compose up -d'" >> ~/.bashrc
    echo "? Alias docker-up dodany!"
fi

if ! grep -q "alias docker-down=" ~/.bashrc; then
    echo "alias docker-down='docker-compose down --volumes --remove-orphans'" >> ~/.bashrc
    echo "? Alias docker-down dodany!"
fi

if ! grep -q "alias docker-purge=" ~/.bashrc; then
    echo "alias docker-purge='docker system prune -a --volumes -f'" >> ~/.bashrc
    echo "? Alias docker-purge dodany!"
fi

source ~/.bashrc

echo "?? Uruchamianie skryptu do generowania certyfikatów..."
bash cert.sh

echo "?? Tworzenie skryptów start/stop/purge..."

cat > start.sh <<EOF
#!/bin/bash
docker-up
EOF

cat > stop.sh <<EOF
#!/bin/bash
docker-down
EOF

cat > purge.sh <<EOF
#!/bin/bash
docker-purge
EOF

chmod +x start.sh stop.sh purge.sh

echo "? Instalacja zakoñczona! Mo¿esz teraz uruchomiæ kontenery za pomoc¹ './start.sh'"
