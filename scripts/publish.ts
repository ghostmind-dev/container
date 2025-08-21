import type { CustomArgs, CustomOptions } from 'jsr:@ghostmind/run';
import { $ } from 'npm:zx@8.1.2';

export default async function (args: CustomArgs, opts: CustomOptions) {
  $.verbose = true;

  const SRC = Deno.env.get('SRC');
  const { version } = opts.metaConfig;
  const CONTAINER = `${SRC}/container`;

  // Parse arguments - first is dockerfile name, rest are keywords in any order
  const dockerfileName = args[0]; // First argument: dockerfile name
  const keywords = args.slice(1); // All remaining arguments as keywords

  if (!dockerfileName) {
    console.error('Error: Please specify a dockerfile name');
    console.log('Usage: run custom publish <dockerfile-name> [keywords...]');
    console.log('Keywords can be in any order:');
    console.log('  main    - Force main branch behavior');
    console.log('  latest  - Add latest tag');
    console.log('  amd64   - Include AMD64 platform (ARM64 always included)');
    console.log('');
    console.log('Examples:');
    console.log('  run custom publish base');
    console.log('  run custom publish base main');
    console.log('  run custom publish base latest main');
    console.log('  run custom publish base amd64 main latest');
    console.log('  run custom publish mycustom latest amd64');
    Deno.exit(1);
  }

  // Detect keywords in any order
  const hasMainKeyword = keywords.includes('main');
  const hasLatestKeyword = keywords.includes('latest');
  const hasAmd64Keyword = keywords.includes('amd64');

  // Get current git branch
  const currentBranch = await $`git branch --show-current`.then((result: any) =>
    result.stdout.trim()
  );

  // Determine effective branch
  const effectiveBranch = hasMainKeyword ? 'main' : currentBranch;
  const addLatestTag = hasLatestKeyword;

  // Determine platform configuration - ARM64 is always included
  let platformString = 'linux/arm64';
  if (hasAmd64Keyword) {
    platformString = 'linux/amd64,linux/arm64';
  }

  let tagInstructions: string[] = [];

  if (effectiveBranch === 'main') {
    // Main branch: dockerfile name, dockerfile name + version, and optionally latest
    tagInstructions = [
      `-t ghcr.io/ghostmind-dev/dvc:${dockerfileName}`,
      `-t ghcr.io/ghostmind-dev/dvc:${dockerfileName}-${version}`,
    ];

    // Add latest tag only if "latest" keyword is provided
    if (addLatestTag) {
      tagInstructions.push('-t ghcr.io/ghostmind-dev/dvc:latest');
    }
  } else {
    // Other branches: branch name + dockerfile name (simple and clear)
    tagInstructions = [
      `-t ghcr.io/ghostmind-dev/dvc:${effectiveBranch}-${dockerfileName}`,
    ];
  }

  const tagInstructionsString = tagInstructions.join(' ');
  const dockerfilePath = `${CONTAINER}/Dockerfile.${dockerfileName}`;
  const instructions = `docker buildx build --platform ${platformString} ${tagInstructionsString} --push -f ${dockerfilePath} ${CONTAINER}`;

  // Print branch and tagging information
  console.log(`Actual branch: ${currentBranch}`);
  console.log(
    `Effective branch: ${effectiveBranch}${
      hasMainKeyword ? ' (forced by "main" keyword)' : ''
    }`
  );
  console.log(`Dockerfile: Dockerfile.${dockerfileName}`);
  console.log(`Platform(s): ${platformString}`);
  console.log(`Latest tag: ${addLatestTag ? 'enabled' : 'disabled'}`);
  console.log(
    `Keywords detected: ${keywords.length > 0 ? keywords.join(', ') : 'none'}`
  );
  console.log('Tags that will be created:');
  tagInstructions.forEach((tag) => {
    const tagName = tag.replace('-t ghcr.io/ghostmind-dev/dvc:', '');
    console.log(`  - ${tagName}`);
  });

  console.log('\nFull command that would be executed:');
  console.log(instructions);

  // Check if dockerfile exists before proceeding
  try {
    await Deno.stat(dockerfilePath);
  } catch {
    console.error(`Error: Dockerfile not found at ${dockerfilePath}`);
    Deno.exit(1);
  }

  // Comment out the actual execution for testing
  const instructionsArray = instructions.split(' ');
  await $`docker buildx create --use`;
  await $`${instructionsArray}`;
}
