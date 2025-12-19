// scripts/release-core-packages.js
const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")
const { promisify } = require("util")
const sleep = promisify(setTimeout)

// Configuration
const DELAY_BETWEEN_PUBLISHES = 10000 // 10 seconds delay between publishes
const MAX_RETRIES = 3
const RETRY_DELAY = 30000 // 30 seconds delay before retry

// Core packages to update in specific order with their dependencies
const CORE_PACKAGES = [
  {
    name: "@8medusa/utils",
    publishName: "@8medusa/utils",
    path: "packages/core/utils",
    updateDependenciesIn: [
      "packages/cli/medusa-cli",
      "packages/core/framework",
      "packages/core/workflows-sdk",
      "packages/core/modules-sdk",
      "packages/core/orchestration",
    ],
  },
  {
    name: "@8medusa/orchestration",
    publishName: "@8medusa/orchestration",
    path: "packages/core/orchestration",
    updateDependenciesIn: [
      "packages/core/framework",
      "packages/core/workflows-sdk",
      "packages/core/modules-sdk",
    ],
  },
  {
    name: "@8medusa/modules-sdk",
    publishName: "@8medusa/modules-sdk",
    path: "packages/core/modules-sdk",
    updateDependenciesIn: [
      "packages/core/framework",
      "packages/core/workflows-sdk",
    ],
  },
  {
    name: "@8medusa/workflows-sdk",
    publishName: "@8medusa/workflows-sdk",
    path: "packages/core/workflows-sdk",
    updateDependenciesIn: ["packages/core/framework"],
  },
  {
    name: "@8medusa/framework",
    publishName: "@8medusa/framework",
    path: "packages/core/framework",
    updateDependenciesIn: ["packages/core/core-flows", "packages/medusa"],
  },
  {
    name: "@8medusa/cli",
    publishName: "@8medusa/cli",
    path: "packages/cli/medusa-cli",
    updateDependenciesIn: [],
  },
  // {
  //   name: "@8medusa/dashboard",
  //   publishName: "@8medusa/dashboard",
  //   path: "packages/admin/dashboard",
  //   updateDependenciesIn: ["packages/admin/admin-bundler", "packages/medusa"],
  // },
  // {
  //   name: "@8medusa/admin-bundler",
  //   publishName: "@8medusa/admin-bundler",
  //   path: "packages/admin/admin-bundler",
  //   updateDependenciesIn: ["packages/medusa"],
  // },
  {
    name: "@8medusa/medusa",
    publishName: "@8medusa/medusa",
    path: "packages/medusa",
    updateDependenciesIn: [],
  },
]

async function verifyPackageVersion(pkg, expectedVersion, maxAttempts = 10) {
  console.log(
    `\n🔍 Verifying ${pkg.publishName}@${expectedVersion} on npm registry...`
  )

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Clear yarn cache
      execSync(`yarn cache clean`, { stdio: "inherit" })

      const output = execSync(`npm view ${pkg.publishName} dist-tags.latest`, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      })

      const publishedVersion = output.trim()
      if (publishedVersion === expectedVersion) {
        console.log(
          `✅ Verified ${pkg.publishName}@${expectedVersion} is available`
        )
        return true
      }

      console.log(
        `⏳ Attempt ${attempt}/${maxAttempts} - Found version ${publishedVersion}, waiting for ${expectedVersion}...`
      )
      await sleep(30000)
    } catch (error) {
      console.log(
        `⏳ Attempt ${attempt}/${maxAttempts} - Package not found, retrying...`
      )
      await sleep(30000)
    }
  }

  throw new Error(
    `Failed to verify ${pkg.publishName}@${expectedVersion} after ${maxAttempts} attempts`
  )
}

function updatePackageVersion(packagePath, newVersion) {
  const packageJsonPath = path.join(process.cwd(), packagePath, "package.json")

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`Package.json not found at ${packageJsonPath}`)
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))
  const oldVersion = packageJson.version
  packageJson.version = newVersion

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n")
  return oldVersion
}

function updateDependencyVersions(packagePath, dependencyName, newVersion) {
  const packageJsonPath = path.join(process.cwd(), packagePath, "package.json")

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`Package.json not found at ${packageJsonPath}`)
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))
  let updated = false

  // Check all dependency types
  const dependencyTypes = [
    "dependencies",
    "peerDependencies",
    "devDependencies",
  ]

  dependencyTypes.forEach((depType) => {
    if (packageJson[depType] && packageJson[depType][dependencyName]) {
      packageJson[depType][dependencyName] = newVersion
      console.log(`  Updated ${dependencyName} in ${depType} to ${newVersion}`)
      updated = true
    }
  })

  if (updated) {
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2) + "\n"
    )
    console.log(
      `✅ Updated ${dependencyName} to ${newVersion} in ${packagePath}`
    )
  }
}

async function buildAndPublishPackage(pkg, newVersion) {
  console.log(`\n🏗️  Processing ${pkg.publishName}...`)

  // Update package version
  try {
    const oldVersion = updatePackageVersion(pkg.path, newVersion)
    console.log(
      `✅ Updated ${pkg.publishName} from ${oldVersion} to ${newVersion}`
    )
  } catch (error) {
    console.error(
      `❌ Failed to update version for ${pkg.publishName}:`,
      error.message
    )
    return false
  }

  // Build
  console.log(`\n🏗️  Building ${pkg.path}...`)
  try {
    execSync("yarn build", {
      cwd: path.join(process.cwd(), pkg.path),
      stdio: "inherit",
    })
    console.log(`✅ Build successful for ${pkg.publishName}`)
  } catch (error) {
    console.error(`❌ Build failed for ${pkg.publishName}:`, error.message)
    return false
  }

  // Publish
  let retries = 0
  while (retries < MAX_RETRIES) {
    try {
      console.log(`\n📦 Publishing ${pkg.publishName}...`)

      execSync(`yarn cache clean`, { stdio: "inherit" })

      execSync(
        `npm publish --tag ${
          newVersion.includes("-") ? "beta" : "latest"
        } --access public`,
        {
          cwd: path.join(process.cwd(), pkg.path),
          stdio: "inherit",
        }
      )

      await verifyPackageVersion(pkg, newVersion)

      console.log(`✅ Successfully published ${pkg.publishName}`)

      // Update this package's version in dependent packages
      if (pkg.updateDependenciesIn.length > 0) {
        console.log(
          `\n📝 Updating ${pkg.publishName} version in dependent packages...`
        )
        for (const dependentPath of pkg.updateDependenciesIn) {
          updateDependencyVersions(dependentPath, pkg.publishName, newVersion)
        }
      }

      return true
    } catch (error) {
      retries++
      console.error(
        `❌ Failed to publish ${pkg.publishName} (attempt ${retries}/${MAX_RETRIES})`
      )
      console.error(error.message)

      if (retries < MAX_RETRIES) {
        console.log(
          `⏳ Waiting ${RETRY_DELAY / 1000} seconds before retrying...`
        )
        await sleep(RETRY_DELAY)
      }
    }
  }

  return false
}

async function main() {
  // Get version from command line argument
  const newVersion = process.argv[2]
  if (!newVersion) {
    console.error("❌ Please provide a version number")
    console.log("Usage: node scripts/release-core-packages.js <version>")
    console.log("Example: node scripts/release-core-packages.js 2.7.2")
    process.exit(1)
  }

  if (!/^\d+\.\d+\.\d+(-\w+(\.\d+)?)?$/.test(newVersion)) {
    console.error(
      "❌ Invalid version format. Please use semantic versioning (e.g., 2.7.2 or 2.7.2-beta.1)"
    )
    process.exit(1)
  }

  // Confirm with user
  console.log(
    `\n🚀 Preparing to release version ${newVersion} for core packages in this order:`
  )
  CORE_PACKAGES.forEach((pkg) => {
    console.log(`- ${pkg.publishName} (${pkg.path})`)
    if (pkg.updateDependenciesIn.length > 0) {
      console.log(
        `  Will update version in: ${pkg.updateDependenciesIn.join(", ")}`
      )
    }
  })

  // Wait for 5 seconds to allow cancellation
  console.log("\n⚠️  Press Ctrl+C within 5 seconds to cancel...")
  await sleep(5000)

  // Process each package sequentially
  for (const pkg of CORE_PACKAGES) {
    console.log(`\n\n📦 Processing ${pkg.publishName}...`)

    const success = await buildAndPublishPackage(pkg, newVersion)

    if (!success) {
      console.error(
        `\n❌ Failed to process ${pkg.publishName}. Stopping release process.`
      )
      process.exit(1)
    }

    console.log(`\n✅ Successfully processed ${pkg.publishName}`)

    // Add delay before next package unless it's the last one
    if (CORE_PACKAGES.indexOf(pkg) < CORE_PACKAGES.length - 1) {
      console.log(
        `\n⏳ Waiting ${
          DELAY_BETWEEN_PUBLISHES / 1000
        } seconds before processing next package...`
      )
      await sleep(DELAY_BETWEEN_PUBLISHES)
    }
  }

  // Summary
  console.log("\n✨ Release completed successfully!")
  console.log("\nPackages updated and published in order:")
  CORE_PACKAGES.forEach((pkg) => {
    console.log(`- ${pkg.publishName}@${newVersion}`)
  })

  // Installation instructions
  console.log("\n📋 Installation Instructions for Users:")
  console.log("Run these commands to ensure you get the latest versions:")
  console.log("\n```bash")
  console.log("yarn cache clean")
  console.log("rm -rf node_modules yarn.lock")
  console.log("yarn install")
  console.log("```")
}

// Run the script
main().catch((error) => {
  console.error("❌ Error during release:", error)
  process.exit(1)
})
