import type { CustomArgs, CustomOptions } from 'jsr:@ghostmind/run';
import { $ } from 'npm:zx@8.1.3';

export default async function (args: CustomArgs, opts: CustomOptions) {
  $.verbose = true;

  const name = args[0];
  if (!name) {
    console.error('❌ Error: Image name required');
    console.log('Usage: run custom up <name>');
    console.log('Example: run custom up base (uses local-test-base:latest)');
    Deno.exit(1);
  }

  const imageName = `local-test-${name}:latest`;
  const containerName = `dev-container-${name}`;

  console.log(`🚀 Starting Docker container: ${imageName}`);

  // Remove existing container if it exists
  try {
    await $`docker rm -f ${containerName}`;
    console.log(`♻️  Removed existing container: ${containerName}`);
  } catch (error) {
    // Container doesn't exist, that's fine
  }

  // Run the container in detached mode with interactive terminal
  await $`docker run -d -it --name ${containerName} ${imageName}`;

  console.log(`✅ Container started: ${containerName}`);
  console.log(`🔗 To attach: docker exec -it ${containerName} /bin/bash`);
}
