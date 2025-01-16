import type { CustomArgs, CustomOptions } from 'jsr:@ghostmind/run';
import { $ } from 'npm:zx@8.1.2';

export default async function (_arg: CustomArgs, opts: CustomOptions) {
  $.verbose = true;

  const SRC = Deno.env.get('SRC');

  const CONTAINER = `${SRC}/container`;

  const tagInstructions = ['-t ghcr.io/ghostmind-dev/dvc:latest'];

  const tagInstructionsString = tagInstructions.join(' ');

  const instructions = `docker buildx build --platform linux/amd64,linux/arm64 ${tagInstructionsString} --push ${CONTAINER}`;

  // transfor the instructions into an array

  const instructionsArray = instructions.split(' ');
  await $`docker buildx create --use`;
  await $`${instructionsArray}`;
}
