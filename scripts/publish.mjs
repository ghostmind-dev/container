#!/usr/bin/env zx

$.verbose = true;

const multiplatform = process.argv.includes("--multiplatform");

const GCP_PROJECT_NAME = process.env.GCP_PROJECT_NAME;
const SRC = process.env.SRC;

if (!multiplatform) {
  await $`docker build -t ghcr.io/ghostmind-dev/dvc:latest ${SRC}`;
  await $`docker push ghcr.io/ghostmind-dev/dvc:latest`;
} else {
  await $`docker buildx create --use`;
  await $`docker buildx build --platform=linux/amd64,linux/arm64 -t ghcr.io/ghostmind-dev/dvc:latest --push ${SRC}`;
}
