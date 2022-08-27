#!/usr/bin/env zx

$.verbose = true;

const GCP_PROJECT_NAME = process.env.GCP_PROJECT_NAME;
const SRC = process.env.SRC;

await $`docker build -t gcr.io/${GCP_PROJECT_NAME}/dvc:latest ${SRC}`;

await $`docker push gcr.io/${GCP_PROJECT_NAME}/dvc:latest`;
