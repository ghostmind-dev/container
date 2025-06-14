FROM mcr.microsoft.com/vscode/devcontainers/base:debian-11

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
ARG TARGETARCH
ARG TARGETPLATFORM

############################################################################
# COPY FILES
############################################################################

COPY lib/common-debian.sh /tmp/library-scripts/
COPY lib/docker-debian.sh /tmp/library-scripts/
COPY lib/kubectl-helm-debian.sh /tmp/library-scripts/

############################################################################
# DOCKER SETUP
############################################################################

RUN apt-get clean && apt-get update && /bin/bash /tmp/library-scripts/common-debian.sh "${INSTALL_ZSH}" "${USERNAME}" "${USER_UID}" "${USER_GID}" "${UPGRADE_PACKAGES}" "true" "true" \
    && /bin/bash /tmp/library-scripts/docker-debian.sh "true" "/var/run/docker-host.sock" "/var/run/docker.sock" "${USERNAME}" "${USE_MOBY}" \ 
    && /bin/bash /tmp/library-scripts/kubectl-helm-debian.sh "latest" "latest" "none"  \
    && apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/* /tmp/library-scripts/

# Script copies localhost's ~/.kube/config file into the container and swaps out
# localhost for host.docker.internal on bash/zsh start to keep them in sync.
COPY lib/copy-kube-config.sh /usr/local/share/
RUN chown ${USERNAME}:root /usr/local/share/copy-kube-config.sh \
    && echo "source /usr/local/share/copy-kube-config.sh" | tee -a /root/.bashrc /root/.zshrc /home/${USERNAME}/.bashrc >>/home/${USERNAME}/.zshrc

# Setting the ENTRYPOINT to docker-init.sh will configure non-root access to
# the Docker socket if "overrideCommand": false is set in devcontainer.json.
# The script will also execute CMD if you need to alter startup behaviors.
ENTRYPOINT [ "/usr/local/share/docker-init.sh" ]
CMD [ "sleep", "infinity" ]

############################################################################
# DOCKER BUILDX FLAG
############################################################################
    
ENV BUILDX_NO_DEFAULT_ATTESTATIONS="1"


###########################################################################
# MISC (MIGHT BE IMPORTANT)
###########################################################################

RUN apt-get install xz-utils -y
RUN apt-get install libc6-dev -y

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

ENV GCLOUD_VERSION=405.0.0


RUN if [ "$TARGETPLATFORM" = "linux/amd64" ]; then ARCHITECTURE=x86_64; else ARCHITECTURE=arm; fi  \
    && cd /tmp  \
    && curl -O https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-${GCLOUD_VERSION}-linux-${ARCHITECTURE}.tar.gz   \
    && tar -xf google-cloud-cli-${GCLOUD_VERSION}-linux-${ARCHITECTURE}.tar.gz    \
    && /tmp/google-cloud-sdk/install.sh  \
    && mv /tmp/google-cloud-sdk/ /usr/local/lib 

ENV PATH="$PATH:/usr/local/lib/google-cloud-sdk/bin"

RUN gcloud components install gke-gcloud-auth-plugin
RUN gcloud components install beta

ENV GOOGLE_APPLICATION_CREDENTIALS="/tmp/gsa_key.json"

############################################################################
# KUBE CONFIG
############################################################################

ENV SYNC_LOCALHOST_KUBECONFIG="true"

############################################################################
# AWS CLI
############################################################################   

RUN if [ "$TARGETPLATFORM" = "linux/amd64" ]; then ARCHITECTURE=x86_64; else ARCHITECTURE=aarch64; fi \
    && cd /tmp \
    && curl "https://awscli.amazonaws.com/awscli-exe-linux-${ARCHITECTURE}.zip" -o "awscliv2.zip" \
    && unzip awscliv2.zip \
    && ./aws/install -i /usr/local/aws-cli -b /usr/local/bin


############################################################################
# INSTALL GITHUB CLI 
############################################################################

ENV GITHUB_CLI=2.52.0


RUN cd /tmp \
    && wget https://github.com/cli/cli/releases/download/v${GITHUB_CLI}/gh_${GITHUB_CLI}_linux_${TARGETARCH}.tar.gz \
    && tar -xvf gh_${GITHUB_CLI}_linux_${TARGETARCH}.tar.gz \
    && mv gh_${GITHUB_CLI}_linux_${TARGETARCH}/bin/gh /usr/local/bin/


############################################################################
# HASHICORP VAULT
############################################################################

USER root

RUN apt update
RUN apt install -y gpg
RUN wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
RUN echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/hashicorp.list
RUN apt update
RUN apt install vault -y


#############################################################################
# INSTALL NODEJS
#############################################################################

ENV NODE_MAJOR=20

RUN apt-get install -y ca-certificates curl gnupg
RUN mkdir -p /etc/apt/keyrings
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
RUN apt-get update
RUN apt-get install nodejs -y
ENV NODE_OPTION="--openssl-legacy-provider"



############################################################################
# NPM SETUP
############################################################################

USER vscode
RUN mkdir -p /home/vscode/.npm-global/lib
ENV NPM_CONFIG_PREFIX=/home/vscode/.npm-global
ENV PATH=$NPM_CONFIG_PREFIX/bin:$PATH
ENV PATH="/home/vscode/.npm-global/bin:${PATH}"

############################################################################
# INSTALL GLOBAL NPM PACKAGES
############################################################################

RUN npm --global install zx@8.1.1
RUN npm --global install npm-run-all@4.1.5
RUN npm --global install nodemon@3.1.1


############################################################################
# INSTALL GO
############################################################################

USER root
ENV GO_VERSION=1.21.2

RUN wget https://golang.org/dl/go${GO_VERSION}.linux-${TARGETARCH}.tar.gz
RUN tar -C /usr/local -xzf go${GO_VERSION}.linux-${TARGETARCH}.tar.gz
ENV PATH="$PATH:/usr/local/go/bin"


############################################################################
# INSTALL ACT
############################################################################

ENV ACT_VERSION=0.2.61

RUN if [ "$TARGETPLATFORM" = "linux/amd64" ]; then ARCHITECTURE=x86_64; else ARCHITECTURE=arm64; fi \
    && cd /tmp \
    && wget https://github.com/nektos/act/releases/download/v${ACT_VERSION}/act_Linux_${ARCHITECTURE}.tar.gz \
    && tar -xvf act_Linux_${ARCHITECTURE}.tar.gz \
    && mv act /usr/local/bin/act

############################################################################
# INSTALL TERRAFORM
############################################################################

ENV TERRAFORM_VERSION=1.6.0

RUN cd /tmp \
    && wget https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_${TARGETARCH}.zip \
    && unzip terraform_${TERRAFORM_VERSION}_linux_${TARGETARCH}.zip -d /usr/bin
   

############################################################################
# INSTALL SKAFFOLD
############################################################################

ENV SKAFFOLD_VERSION=2.8.0

RUN curl -Lo skaffold https://storage.googleapis.com/skaffold/releases/v${SKAFFOLD_VERSION}/skaffold-linux-${TARGETARCH} \
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
# CLOUDFLARED
############################################################################

RUN sudo mkdir -p --mode=0755 /usr/share/keyrings
RUN curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
RUN echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/cloudflared.list
RUN apt-get update && sudo apt-get install cloudflared

############################################################################
# PYTHON CONFIG
############################################################################


RUN sudo apt-get update && sudo apt-get install -y \
    make \
    build-essential \
    libssl-dev \
    zlib1g-dev \
    libbz2-dev \
    libreadline-dev \
    libsqlite3-dev \
    wget \
    curl \
    llvm \
    libncurses5-dev \
    libncursesw5-dev \
    xz-utils \
    tk-dev \
    libffi-dev \
    liblzma-dev \
    python3-pip \
    python3-openssl \
    git

USER vscode

RUN curl https://pyenv.run | bash

# Set environment variables for pyenv
ENV PATH="/home/vscode/.pyenv/bin:/home/vscode/.pyenv/shims:${PATH}"

# RUN pyenv install 3.12.5
RUN pyenv install 3.9.7
RUN pyenv global 3.9.7



############################################################################
# JUPYTER DEPENDENCIES
############################################################################

USER root

RUN apt-get -y install pandoc texlive-xetex texlive-fonts-recommended texlive-plain-generic


############################################################################
# INSTALL JUPYTER LAB
############################################################################

USER vscode

ENV PATH="/home/vscode/.local/bin:${PATH}"
RUN pip install jupyterlab


############################################################################
# INSTALL POETRY
############################################################################



RUN curl -sSL https://install.python-poetry.org | python -



############################################################################
# INSTALL DENO
############################################################################

USER root

ENV DENO_VERSION=v2.0.3

ENV DENO_INSTALL=/deno
RUN mkdir -p /deno && curl -fsSL https://deno.land/x/install/install.sh | sh -s ${DENO_VERSION} && chown -R vscode /deno
ENV PATH=${DENO_INSTALL}/bin:${PATH}
ENV DENO_DIR=${DENO_INSTALL}/.cache/deno

USER vscode


############################################################################
# INSTALL BUN
############################################################################


RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/home/vscode/.bun/bin:${PATH}"


############################################################################
# CHROMIUM
############################################################################

USER root

RUN apt install -y chromium
RUN apt install -y libnss3-tools




############################################################################
# SET USER
############################################################################

USER vscode


############################################################################
# INSTALL CURL
############################################################################

RUN curl -LsSf https://astral.sh/uv/install.sh | sh

############################################################################
# INSTALL CURL
############################################################################

RUN go install sigs.k8s.io/kind@v0.26.0

############################################################################
# INSTALL KUBECTX
############################################################################

RUN go install github.com/derailed/k9s@latest

############################################################################
# INSTALL POSTGRESQL CLIENT
############################################################################

USER root

RUN apt-get install -y postgresql-client

############################################################################
# SET USER
############################################################################

USER vscode




############################################################################
# THE END
############################################################################