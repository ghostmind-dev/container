#!/usr/bin/env bash

# ############################################################################
# # GOOGLE CLOUD PLATFORM SETUP
# ############################################################################

echo "Setting up GCP core"

echo ${GCP_SERVICE_ACCOUNT_ADMIN} | base64 -di -w 0 >/tmp/gsa_key.json

gcloud auth activate-service-account --key-file="/tmp/gsa_key.json"

PROJECT_EXIST=$(gcloud projects list --filter="${GCP_PROJECT_NAME}")

if [ "$PROJECT_EXIST" ]; then
    gcloud config set project ${GCP_PROJECT_NAME}
    gcloud config set compute/zone us-central1-b
    gcloud auth configure-docker gcr.io --quiet
fi
# ############################################################################
# # ZSH SETUP
# ############################################################################

sed -i '/plugins=(git)/c\plugins=(git kubectl zsh-autosuggestions gcloud docker)' ~/.zshrc

############################################################################
# ALIASES
############################################################################

cat <<EOT >>~/.zshrc
alias home="cd ${SRC}"
EOT

############################################################################
# BIN
############################################################################

cat <<EOT >>~/.zshrc
export PATH=\$PATH:/usr/local/go/bin 
EOT

############################################################################
# ADMIN:GAM SETUP
############################################################################

# echo ${GAM_OAUTH2CLIENT} | base64 -di -w 0 >/home/vscode/bin/gam/oauth2service.json
# echo ${GAM_CLIENTSECRETS} | base64 -di -w 0 >/home/vscode/bin/gam/client_secrets.json
# echo ${GAM_OAUTH2TXT} | base64 -di -w 0 >/home/vscode/bin/gam/oauth2.txt

# cat <<EOT >>~/.zshrc
# alias gam="/home/vscode/bin/gam/gam"
# EOT
