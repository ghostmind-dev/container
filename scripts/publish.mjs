#!/usr/bin/env zx

$.verbose = true;

const GCP_PROJECT_NAME = process.env.GCP_PROJECT_NAME;
const SRC = process.env.SRC;

await $`docker build -t ghcr.io/ghostmind-dev/dvc:latest ${SRC}`;

await $`docker push ghcr.io/ghostmind-dev/dvc:latest`;
