#!/bin/bash

# 1. Utwórz u¿ytkownika devops
adduser --disabled-password --gecos "" devops

# 2. Utwórz katalog i wypakuj agenta
mkdir -p /home/devops/agent
cp /home/audioverse/vsts-agent-linux-x64-4.258.1.tar.gz /home/devops/agent/
cd /home/devops/agent
tar zxvf vsts-agent-linux-x64-4.258.1.tar.gz

# 3. Nadaj w³aœciciela
chown -R devops:devops /home/devops

# 4. Skonfiguruj agenta jako u¿ytkownik devops (tu wstaw w³aœciwe dane!)
sudo -u devops ./config.sh --unattended \
  --url https://dev.azure.com/audioverse \
  --auth pat \
  --token FyenL41NVwan6IlJMzJydmTMw1aj7YXBpZGzUe74q1V2bte4yRvjJQQJ99BBACAAAAAAAAAAAAASAZDO4DLZ \
  --pool Contabo \
  --agent Contabo_Agent3 \
  --acceptTeeEula

# 5. Zainstaluj i uruchom us³ugê jako root
./svc.sh install
./svc.sh start
