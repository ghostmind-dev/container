import type { CustomArgs, CustomOptions } from 'jsr:@ghostmind/run';
import { $ } from 'npm:zx@8.1.2';

export default async function (arg: CustomArgs, opts: CustomOptions) {
  $.verbose = true;

  const SRC = Deno.env.get('SRC');
  const { version } = opts.metaConfig;
  const CONTAINER = `${SRC}/container`;

  // Get current git branch
  const currentBranch = await $`git branch --show-current`.then((result: any) =>
    result.stdout.trim()
  );

  let tagInstructions: string[] = [];

  if (currentBranch === 'main') {
    // Main: latest + version
    tagInstructions = [
      '-t ghcr.io/ghostmind-dev/dvc:latest',
      `-t ghcr.io/ghostmind-dev/dvc:${version}`,
    ];
  } else {
    // Any other branch: just "dev"
    tagInstructions = ['-t ghcr.io/ghostmind-dev/dvc:dev'];
  }

  const tagInstructionsString = tagInstructions.join(' ');
  const instructions = `docker buildx build --platform linux/amd64,linux/arm64 ${tagInstructionsString} --push ${CONTAINER}`;

  // Print branch and tagging information
  console.log(`Current branch: ${currentBranch}`);
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
