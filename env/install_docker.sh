#!/bin/bash

set -e

echo "?? Aktualizacja pakietów..."
sudo apt-get update
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

echo "?? Dodawanie klucza GPG Dockera..."
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo "?? Dodawanie repozytorium Dockera..."
echo \
  "deb [arch=$(dpkg --print-architecture) \
  signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

echo "?? Aktualizacja listy pakietów..."
sudo apt-get update

echo "?? Instalacja Dockera..."
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "? Sprawdzanie statusu Dockera..."
sudo systemctl status docker

echo "?? Dodawanie u¿ytkownika '$USER' do grupy docker..."
sudo usermod -aG docker $USER

echo "?? Instalacja zakoñczona! Uruchom ponownie system lub wyloguj siê i zaloguj ponownie, aby zmiany zadzia³a³y."
