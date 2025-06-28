import type { CustomArgs, CustomOptions } from 'jsr:@ghostmind/run';
import { $ } from 'npm:zx@8.1.3';

export default async function (args: CustomArgs, opts: CustomOptions) {
  $.verbose = true;

  const target = args[0];

  if (!target) {
    console.log('❌ Please specify a target to build');
    console.log('📋 Usage: run custom build <target>');
    console.log('📝 Examples:');
    console.log('  run custom build base    → builds Dockerfile.base');
    console.log('  run custom build dev     → builds Dockerfile.dev');
    console.log('  run custom build prod    → builds Dockerfile.prod');
    return;
  }

  console.log(`🔨 Starting local build for target: ${target}`);

  // Map target names to specific files
  const targetMappings: Record<string, string> = {
    base: 'Dockerfile.base',
    dev: 'Dockerfile.dev',
    prod: 'Dockerfile.prod',
    production: 'Dockerfile.prod',
    development: 'Dockerfile.dev',
  };

  let targetFile = targetMappings[target] || `Dockerfile.${target}`;

  console.log(`🎯 Target file: ${targetFile}`);

  // Check if target file exists, first in root, then in container/ directory
  let fileFound = false;
  try {
    await $`test -f ${targetFile}`;
    console.log(`✅ Found ${targetFile}`);
    fileFound = true;
  } catch {
    // Try in container/ directory
    const containerTargetFile = `container/${targetFile}`;
    try {
      await $`test -f ${containerTargetFile}`;
      console.log(`✅ Found ${containerTargetFile}`);
      targetFile = containerTargetFile;
      fileFound = true;
    } catch {
      console.log(
        `❌ File ${targetFile} not found in root or container/ directory`
      );
      console.log('📁 Available Dockerfile variants:');

      try {
        const dockerfiles = await $`find . -name "Dockerfile*" -type f`;
        const files = dockerfiles.stdout
          .trim()
          .split('\n')
          .filter((f) => f);
        files.forEach((file, index) => {
          console.log(`  ${index + 1}. ${file}`);
        });
      } catch {
        console.log('  No Dockerfile variants found');
      }
      return;
    }
  }

  // Show file content summary
  try {
    const fileContent = await Deno.readTextFile(targetFile);
    const lines = fileContent.split('\n');
    console.log(`📄 File summary: ${lines.length} lines`);

    // Show FROM statements
    const fromLines = lines.filter((line) => line.trim().startsWith('FROM'));
    if (fromLines.length > 0) {
      console.log('🐳 Base images:');
      fromLines.forEach((line, index) => {
        console.log(`  ${index + 1}. ${line.trim()}`);
      });
    }
  } catch {
    console.log('⚠️  Could not read file content');
  }

  // Build the Docker image
  const imageName = `local-test-${target}`;
  const tag = opts.extract('tag') || 'latest';
  const fullImageName = `${imageName}:${tag}`;

  console.log(`\n🏗️  Building Docker image: ${fullImageName}`);
  console.log(`📁 Using file: ${targetFile}`);

  try {
    await $`docker build -f ${targetFile} -t ${fullImageName} .`;
    console.log(`\n✅ Successfully built: ${fullImageName}`);

    // Show image info
    const imageInfo =
      await $`docker images ${imageName} --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"`;
    console.log('\n📊 Image details:');
    console.log(imageInfo.stdout);
  } catch (error) {
    console.log(`\n❌ Build failed for ${targetFile}`);
    console.log(
      '🔍 Error details:',
      error instanceof Error ? error.message : String(error)
    );

    // Check if it's a common Docker cache/layer issue
    const errorString = String(error);
    if (
      errorString.includes('parent snapshot') ||
      errorString.includes('extraction snapshot')
    ) {
      console.log(
        '\n🔧 This looks like a Docker layer/cache issue. Trying fixes...'
      );

      if (opts.has('no-cache') || opts.has('clean')) {
        console.log('🧹 Retrying with --no-cache...');
        try {
          await $`docker build --no-cache -f ${targetFile} -t ${fullImageName} .`;
          console.log(
            `\n✅ Successfully built with --no-cache: ${fullImageName}`
          );
        } catch (retryError) {
          console.log('❌ Retry with --no-cache also failed');
          console.log('\n💡 Troubleshooting suggestions:');
          console.log(
            `  1. run custom build ${target} --clean    → retry with --no-cache`
          );
          console.log(
            '  2. docker system prune -f               → clean Docker cache'
          );
          console.log(
            '  3. docker buildx prune -f               → clean buildx cache'
          );
          console.log('  4. Check if base images are available');
        }
      } else {
        console.log('\n💡 Troubleshooting suggestions:');
        console.log(
          `  1. run custom build ${target} --clean    → retry with --no-cache`
        );
        console.log(
          '  2. docker system prune -f               → clean Docker cache'
        );
        console.log(
          '  3. docker buildx prune -f               → clean buildx cache'
        );
        console.log('  4. Check if base images in Dockerfile are available');
      }
    }
  }

  console.log('\n🧹 This was a local-only build - no pushing to registry');

  if (opts.has('verbose')) {
    console.log('\n📋 Build summary:');
    console.log(`  - Target: ${target}`);
    console.log(`  - File: ${targetFile}`);
    console.log(`  - Image: ${fullImageName}`);
    console.log('  - Type: Local testing build');
    console.log('  - Independent: Yes (no publishing)');
  }
}
