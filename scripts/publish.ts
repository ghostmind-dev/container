import type { CustomArgs, CustomOptions } from 'jsr:@ghostmind/run';
import { $ } from 'npm:zx@8.1.2';

export default async function (args: CustomArgs, opts: CustomOptions) {
  $.verbose = true;

  const SRC = Deno.env.get('SRC');
  const { version } = opts.metaConfig;
  const CONTAINER = `${SRC}/container`;

  // Parse arguments - using positional arguments instead of flags
  const dockerfileName = args[0]; // First argument: dockerfile name
  const branchOverride = args[1]; // Second argument: "main" to force main branch behavior
  const latestFlag = args[2]; // Third argument: "latest" to add latest tag

  if (!dockerfileName) {
    console.error('Error: Please specify a dockerfile name');
    console.log('Usage: run custom publish <dockerfile-name> [main] [latest]');
    console.log('Examples:');
    console.log('  run custom publish base');
    console.log('  run custom publish base main');
    console.log('  run custom publish base main latest');
    console.log('  run custom publish mycustom main');
    Deno.exit(1);
  }

  // Get current git branch
  const currentBranch = await $`git branch --show-current`.then((result: any) =>
    result.stdout.trim()
  );

  // Determine effective branch (for testing purposes)
  const effectiveBranch = branchOverride === 'main' ? 'main' : currentBranch;
  const addLatestTag = latestFlag === 'latest';

  let tagInstructions: string[] = [];

  if (effectiveBranch === 'main') {
    // Main branch: dockerfile name, dockerfile name + version, and optionally latest
    tagInstructions = [
      `-t ghcr.io/ghostmind-dev/dvc:${dockerfileName}`,
      `-t ghcr.io/ghostmind-dev/dvc:${dockerfileName}-${version}`,
    ];

    // Add latest tag only if "latest" argument is provided
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
  const instructions = `docker buildx build --platform linux/amd64,linux/arm64 ${tagInstructionsString} --push -f ${dockerfilePath} ${CONTAINER}`;

  // Print branch and tagging information
  console.log(`Actual branch: ${currentBranch}`);
  console.log(
    `Effective branch: ${effectiveBranch}${
      branchOverride === 'main' ? ' (forced)' : ''
    }`
  );
  console.log(`Dockerfile: Dockerfile.${dockerfileName}`);
  console.log(`Latest tag: ${addLatestTag ? 'enabled' : 'disabled'}`);
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

  console.log('\n[TESTING MODE] Command execution is commented out.');
}
