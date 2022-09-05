# Note: You can use any Debian/Ubuntu based image you want.
FROM mcr.microsoft.com/vscode/devcontainers/base:0-bullseye

ENV DOCKER_BUILDKIT=1

############################################################################
# ARG
############################################################################

ARG INSTALL_ZSH="false"
ARG UPGRADE_PACKAGES="false"
ARG USE_MOBY="true"
ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=$USER_UID

############################################################################
# COPY FILES
############################################################################

COPY .devcontainer/library-scripts/common-debian.sh /tmp/library-scripts/
COPY .devcontainer/library-scripts/docker-debian.sh /tmp/library-scripts/
COPY .devcontainer/library-scripts/kubectl-helm-debian.sh /tmp/library-scripts/


############################################################################
# DOCKER SETUP
############################################################################

RUN apt-get update && /bin/bash /tmp/library-scripts/common-debian.sh "${INSTALL_ZSH}" "${USERNAME}" "${USER_UID}" "${USER_GID}" "${UPGRADE_PACKAGES}" "true" "true" \
    && /bin/bash /tmp/library-scripts/docker-debian.sh "true" "/var/run/docker-host.sock" "/var/run/docker.sock" "${USERNAME}" "${USE_MOBY}" \ 
    && /bin/bash /tmp/library-scripts/kubectl-helm-debian.sh "latest" "latest" "none"  \
    && apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/* /tmp/library-scriptsxs

# Script copies localhost's ~/.kube/config file into the container and swaps out
# localhost for host.docker.internal on bash/zsh start to keep them in sync.
COPY .devcontainer/library-scripts/copy-kube-config.sh /usr/local/share/
RUN chown ${USERNAME}:root /usr/local/share/copy-kube-config.sh \
    && echo "source /usr/local/share/copy-kube-config.sh" | tee -a /root/.bashrc /root/.zshrc /home/${USERNAME}/.bashrc >>/home/${USERNAME}/.zshrc

# Setting the ENTRYPOINT to docker-init.sh will configure non-root access to
# the Docker socket if "overrideCommand": false is set in devcontainer.json.
# The script will also execute CMD if you need to alter startup behaviors.
ENTRYPOINT [ "/usr/local/share/docker-init.sh" ]
CMD [ "sleep", "infinity" ]

############################################################################
# ZSH
############################################################################

RUN sh -c "$(wget -O- https://github.com/deluan/zsh-in-docker/releases/download/v1.1.2/zsh-in-docker.sh)" -- \
    -t https://github.com/denysdovhan/spaceship-prompt \
    -a 'SPACESHIP_PROMPT_ADD_NEWLINE="false"' \
    -a 'SPACESHIP_PROMPT_SEPARATE_LINE="false"' \
    -p git \
    -p ssh-agent \
    -p https://github.com/zsh-users/zsh-autosuggestions \
    -p https://github.com/zsh-users/zsh-completions

RUN git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-/home/vscode/.oh-my-zsh/custom}/plugins/zsh-autosuggestions

############################################################################
# PERSISTENT CMD HISTORY
############################################################################

RUN SNIPPET="export PROMPT_COMMAND='history -a' && export HISTFILE=/commandhistory/.zsh_history" \
    && mkdir /commandhistory \
    && touch /commandhistory/.zsh_history \
    && chown -R $USERNAME /commandhistory \
    && echo $SNIPPET >>"/home/$USERNAME/.zshrc"


############################################################################
# INSTALL GCLOUD
############################################################################

RUN echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] http://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
RUN curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -
RUN apt-get update -y && apt-get install moreutils jq google-cloud-sdk -y
RUN apt-get update
RUN apt-get install google-cloud-sdk-gke-gcloud-auth-plugin


# ############################################################################
# # INSTALL GITHUB CLI 
# ############################################################################

ENV GITHUB_CLI=2.14.7

RUN cd /tmp \
    && wget https://github.com/cli/cli/releases/download/v${GITHUB_CLI}/gh_${GITHUB_CLI}_linux_arm64.tar.gz \
    && tar -xvf gh_${GITHUB_CLI}_linux_arm64.tar.gz \
    && mv gh_${GITHUB_CLI}_linux_arm64/bin/gh /usr/local/bin/

############################################################################
# INSTALL GAM
############################################################################

RUN apt-get install xz-utils -y
RUN apt-get install libc6-dev -y
USER vscode
RUN curl -s -S -L https://gam-shortn.appspot.com/gam-install >/tmp/gam-install.sh
RUN chmod +x /tmp/gam-install.sh && /tmp/gam-install.sh -l


############################################################################
# HASHICORP VAULT
############################################################################

USER root

RUN apt install -y gpg
RUN wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg >/dev/null
RUN gpg --no-default-keyring --keyring /usr/share/keyrings/hashicorp-archive-keyring.gpg --fingerprint
RUN echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
RUN apt update
RUN apt-get install --reinstall -y vault 



#############################################################################
# INSTALL NODEJS
#############################################################################

RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs
RUN npm --global config set user root 
RUN npm --global install zx

############################################################################
# INSTALL GO
############################################################################


RUN wget https://golang.org/dl/go1.17.3.linux-arm64.tar.gz
RUN tar -C /usr/local -xzf go1.17.3.linux-arm64.tar.gz
RUN export PATH=$PATH:/usr/local/go/bin



############################################################################
# INSTALL ACT
############################################################################

ENV ACT_VERSION=0.2.30

RUN cd /tmp \
    && wget https://github.com/nektos/act/releases/download/v${ACT_VERSION}/act_Linux_arm64.tar.gz \
    && tar -xvf act_Linux_arm64.tar.gz \
    && mv act /usr/local/bin/act

############################################################################
# INSTALL TERRAFORM
############################################################################

ENV TERRAFORM_VERSION=0.12.31

RUN cd /tmp \
    && wget https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_arm64.zip \
    && unzip terraform_${TERRAFORM_VERSION}_linux_arm64.zip -d /usr/bin


############################################################################
# INSTALL SKAFFOLD
############################################################################

RUN curl -Lo skaffold https://storage.googleapis.com/skaffold/releases/v1.36.0/skaffold-linux-arm64 \
    && chmod +x skaffold \ 
    &&  mv skaffold /usr/local/bin

############################################################################
# INSTALL KUSTOMIZE
############################################################################

RUN curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh"  | bash

RUN mv ./kustomize /usr/local/bin

############################################################################
# INSTALL HASURA
############################################################################

RUN curl -L https://github.com/hasura/graphql-engine/raw/stable/cli/get.sh | bash

############################################################################
# INSTALL POSTGRESQL-CLIENT
############################################################################

RUN apt-get -y install postgresql-client