#!/usr/bin/env zx

$.verbose = true;

const multiplatform = process.argv.includes("--multiplatform");
const tag = process.argv.includes("--tag");

const GCP_PROJECT_NAME = process.env.GCP_PROJECT_NAME;
const SRC = process.env.SRC;

// from all argv flags, get the tag that matches ---tag=something
// there could be multiple tags, so we need to filter them
// latest will always be the last tag

const tags = process.argv.filter((arg) => arg.startsWith("--tag="));

// remove --tag= from the tag

const tagNames = tags.map((tag) => tag.replace("--tag=", ""));

// tag image name with the tag

const tagInstructions = tagNames.map(
  (tag) => `-t ghcr.io/ghostmind-dev/dvc:${tag}`
);

tagInstructions.push("-t ghcr.io/ghostmind-dev/dvc:latest");

// join the tag instructions with a space

const tagInstructionsString = tagInstructions.join(" ");

// let instructions = `docker buildx build --platform linux/amd64,linux/arm64 --push ${SRC}`;
// merge with tag instructions

const instructions = `docker buildx build --platform linux/amd64,linux/arm64 ${tagInstructionsString} --push ${SRC}`;

// transfor the instructions into an array

const instructionsArray = instructions.split(" ");

if (!multiplatform) {
  console.log("need to implement non-multiplatform build");
  // await $`docker build -t ghcr.io/ghostmind-dev/dvc:latest ${SRC}`;
  // await $`docker push ghcr.io/ghostmind-dev/dvc:latest`;
} else {
  await $`docker buildx create --use`;
  await $`${instructionsArray}`;

  // await $`docker buildx build --platform linux/amd64,linux/arm64 -t ghcr.io/ghostmind-dev/dvc:latest -t ghcr.io/ghostmind-dev/dvc:terraform0.13 --push ${SRC}`;
}
