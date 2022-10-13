FROM ghcr.io/ghostmind-dev/dvc:latest


COPY library-scripts/post-create.sh /tmp/library-scripts/

############################################################################
# INSTALL SHFMT
############################################################################

USER root

RUN wget https://github.com/mvdan/sh/releases/download/v3.3.1/shfmt_v3.3.1_linux_arm64 -P /usr/local/bin
RUN chmod 777 /usr/local/bin/shfmt_v3.3.1_linux_arm64
