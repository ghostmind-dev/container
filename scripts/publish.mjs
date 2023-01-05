#!/usr/bin/env zx

$.verbose = true;

const multiplatform = process.argv.includes("--multiplatform");
const tag = process.argv.includes("--tag");

const GCP_PROJECT_NAME = process.env.GCP_PROJECT_NAME;
const SRC = process.env.SRC;

// from all argv flags, get the tag that matches ---tag=something
// there could be multiple tags, so we need to filter them
// latest will always be the last tag

if (!multiplatform) {
  console.log("need to implement non-multiplatform build");
  // await $`docker build -t ghcr.io/ghostmind-dev/dvc:latest ${SRC}`;
  // await $`docker push ghcr.io/ghostmind-dev/dvc:latest`;
} else {
  await $`docker buildx create --use`;
  await $`docker buildx build --platform linux/amd64,linux/arm64 -t ghcr.io/ghostmind-dev/dvc:latest -t ghcr.io/ghostmind-dev/dvc:terraform0.14 --push ${SRC}`;
  // await $`docker buildx build --platform linux/amd64,linux/arm64 -t ghcr.io/ghostmind-dev/dvc:latest -t ghcr.io/ghostmind-dev/dvc:terraform0.13 --push ${SRC}`;
}
