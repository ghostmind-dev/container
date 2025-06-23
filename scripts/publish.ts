import type { CustomArgs, CustomOptions } from 'jsr:@ghostmind/run';
import { $ } from 'npm:zx@8.1.2';

export default async function (arg: CustomArgs, opts: CustomOptions) {
  $.verbose = true;

  const SRC = Deno.env.get('SRC');

  const { version } = opts.metaConfig;

  const CONTAINER = `${SRC}/container`;

  // Start with default tags: latest and version
  const tagInstructions = [
    '-t ghcr.io/ghostmind-dev/dvc:latest',
    `-t ghcr.io/ghostmind-dev/dvc:${version}`,
  ];

  // Add any additional tags provided by the user
  if (arg && Array.isArray(arg)) {
    for (const additionalTag of arg) {
      tagInstructions.push(`-t ghcr.io/ghostmind-dev/dvc:${additionalTag}`);
    }
  }

  const tagInstructionsString = tagInstructions.join(' ');

  const instructions = `docker buildx build --platform linux/amd64,linux/arm64 ${tagInstructionsString} --push ${CONTAINER}`;

  // Print the tags that will be included
  console.log('Tags that will be included:');
  tagInstructions.forEach((tag) => {
    const tagName = tag.replace('-t ghcr.io/ghostmind-dev/dvc:', '');
    console.log(`  - ${tagName}`);
  });

  console.log('\nFull command that would be executed:');
  console.log(instructions);

  const instructionsArray = instructions.split(' ');
  await $`docker buildx create --use`;
  await $`${instructionsArray}`;
}
