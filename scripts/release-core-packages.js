// scripts/release-core-packages.js
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const sleep = promisify(setTimeout)

// Configuration
const DELAY_BETWEEN_PUBLISHES = 10000 // 10 seconds delay between publishes
const MAX_RETRIES = 3
const RETRY_DELAY = 30000 // 30 seconds delay before retry

// Core packages to update
const CORE_PACKAGES = [
    {
        name: '@8medusa/dashboard',
        path: 'packages/admin/dashboard'  // Updated path
    },
    {
        name: '@8medusa-bundler',
        path: 'packages/admin/admin-bundler'  // Updated path
    },
    {
        name: '@8medusa/medusa',
        path: 'packages/medusa'
    }
]

// Rest of the script remains the same...
function updatePackageVersion(packagePath, newVersion) {
    const packageJsonPath = path.join(process.cwd(), packagePath, 'package.json')
    
    if (!fs.existsSync(packageJsonPath)) {
        throw new Error(`Package.json not found at ${packageJsonPath}`)
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    const oldVersion = packageJson.version
    packageJson.version = newVersion

    // Update peer dependencies in other core packages
    CORE_PACKAGES.forEach(({ name }) => {
        if (packageJson.peerDependencies?.[name]) {
            packageJson.peerDependencies[name] = newVersion
        }
        if (packageJson.dependencies?.[name]) {
            packageJson.dependencies[name] = newVersion
        }
        if (packageJson.devDependencies?.[name]) {
            packageJson.devDependencies[name] = newVersion
        }
    })

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
    return oldVersion
}

async function buildPackage(packagePath) {
    console.log(`\n🏗️  Building ${packagePath}...`)
    try {
        execSync('yarn build', {
            cwd: path.join(process.cwd(), packagePath),
            stdio: 'inherit'
        })
        return true
    } catch (error) {
        console.error(`❌ Build failed for ${packagePath}:`, error.message)
        return false
    }
}

async function publishPackage(packagePath, options = {}) {
    const { tag = 'latest', access = 'public' } = options
    let retries = 0

    while (retries < MAX_RETRIES) {
        try {
            console.log(`\n📦 Publishing ${packagePath}...`)
            
            execSync(
                `npm publish --tag ${tag} --access ${access}`,
                { 
                    cwd: path.join(process.cwd(), packagePath),
                    stdio: 'inherit'
                }
            )
            
            console.log(`✅ Successfully published ${packagePath}`)
            return true
        } catch (error) {
            retries++
            console.error(`❌ Failed to publish ${packagePath} (attempt ${retries}/${MAX_RETRIES})`)
            console.error(error.message)
            
            if (retries < MAX_RETRIES) {
                console.log(`⏳ Waiting ${RETRY_DELAY/1000} seconds before retrying...`)
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
        console.error('❌ Please provide a version number')
        console.log('Usage: node scripts/release-core-packages.js <version>')
        console.log('Example: node scripts/release-core-packages.js 2.7.2')
        process.exit(1)
    }

    if (!/^\d+\.\d+\.\d+(-\w+(\.\d+)?)?$/.test(newVersion)) {
        console.error('❌ Invalid version format. Please use semantic versioning (e.g., 2.7.2 or 2.7.2-beta.1)')
        process.exit(1)
    }

    // Confirm with user
    console.log(`\n🚀 Preparing to release version ${newVersion} for core packages:`)
    CORE_PACKAGES.forEach(pkg => console.log(`- ${pkg.name} (${pkg.path})`))
    console.log('\nThis will:')
    console.log('1. Update version in package.json files')
    console.log('2. Build each package')
    console.log('3. Publish to npm')
    
    // Wait for 5 seconds to allow cancellation
    console.log('\n⚠️  Press Ctrl+C within 5 seconds to cancel...')
    await sleep(5000)

    // Update versions
    console.log('\n📝 Updating package versions...')
    const updates = []
    for (const pkg of CORE_PACKAGES) {
        try {
            const oldVersion = updatePackageVersion(pkg.path, newVersion)
            updates.push({ ...pkg, oldVersion })
            console.log(`✅ Updated ${pkg.name} from ${oldVersion} to ${newVersion}`)
        } catch (error) {
            console.error(`❌ Failed to update ${pkg.name}:`, error.message)
            process.exit(1)
        }
    }

    // Build packages
    console.log('\n🏗️  Building packages...')
    for (const pkg of CORE_PACKAGES) {
        const success = await buildPackage(pkg.path)
        if (!success) {
            console.error(`❌ Failed to build ${pkg.name}`)
            process.exit(1)
        }
    }

    // Publish packages
    console.log('\n📦 Publishing packages...')
    for (const pkg of CORE_PACKAGES) {
        const success = await publishPackage(pkg.path, {
            tag: newVersion.includes('-') ? 'beta' : 'latest',
            access: 'public'
        })

        if (!success) {
            console.error(`❌ Failed to publish ${pkg.name}`)
            process.exit(1)
        }

        if (CORE_PACKAGES.indexOf(pkg) < CORE_PACKAGES.length - 1) {
            console.log(`⏳ Waiting ${DELAY_BETWEEN_PUBLISHES/1000} seconds before publishing next package...`)
            await sleep(DELAY_BETWEEN_PUBLISHES)
        }
    }

    // Summary
    console.log('\n✨ Release completed successfully!')
    console.log('\nPackages updated and published:')
    updates.forEach(pkg => {
        console.log(`- ${pkg.name}: ${pkg.oldVersion} → ${newVersion} (${pkg.path})`)
    })
}

// Run the script
main().catch(error => {
    console.error('❌ Error during release:', error)
    process.exit(1)
})