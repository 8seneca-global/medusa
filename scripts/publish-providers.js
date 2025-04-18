// scripts/publish-providers.js
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const sleep = promisify(setTimeout)

// Configuration
const DELAY_BETWEEN_PUBLISHES = 10000 // 10 seconds delay between publishes
const MAX_RETRIES = 3
const RETRY_DELAY = 30000 // 30 seconds delay before retry
const SCOPE = '@8medusa'
const PROVIDERS_DIR = path.join(process.cwd(), 'packages', 'modules', 'providers')

async function checkIfPackagePublished(packageName, version) {
    try {
        const output = execSync(`npm view ${packageName}@${version} version`, { 
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe']
        })
        return output.trim() === version
    } catch (error) {
        return false
    }
}

function getDependencies(packageJson) {
    const deps = new Set()
    const depFields = ['dependencies', 'peerDependencies', 'devDependencies']
    
    depFields.forEach(field => {
        if (packageJson[field]) {
            Object.keys(packageJson[field])
                .filter(dep => dep.startsWith(SCOPE))
                .forEach(dep => deps.add(dep))
        }
    })
    
    return Array.from(deps)
}

async function findProviderPackages() {
    if (!fs.existsSync(PROVIDERS_DIR)) {
        console.error(`❌ Providers directory not found: ${PROVIDERS_DIR}`)
        return []
    }

    const packages = []
    const entries = fs.readdirSync(PROVIDERS_DIR, { withFileTypes: true })
    
    for (const entry of entries) {
        if (entry.isDirectory()) {
            const packageJsonPath = path.join(PROVIDERS_DIR, entry.name, 'package.json')
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
                if (packageJson.name && packageJson.name.startsWith(SCOPE)) {
                    packages.push({
                        name: packageJson.name,
                        version: packageJson.version,
                        path: path.join(PROVIDERS_DIR, entry.name),
                        packageJson,
                        dependencies: getDependencies(packageJson)
                    })
                }
            }
        }
    }
    
    return packages
}

function sortPackagesByDependencies(packages) {
    const packageMap = new Map(packages.map(p => [p.name, p]))
    const visited = new Set()
    const sorted = []

    function visit(packageName) {
        if (visited.has(packageName)) return
        visited.add(packageName)

        const pkg = packageMap.get(packageName)
        if (!pkg) return

        // Visit all dependencies first
        for (const dep of pkg.dependencies) {
            visit(dep)
        }

        sorted.push(pkg)
    }

    // Visit all packages
    packages.forEach(pkg => visit(pkg.name))

    return sorted
}

async function publishPackage(packagePath, options = {}) {
    const { tag = 'latest', access = 'public' } = options
    let retries = 0

    while (retries < MAX_RETRIES) {
        try {
            console.log(`Publishing package at ${packagePath}...`)
            
            execSync(
                `npm publish ${packagePath} --tag ${tag} --access ${access}`,
                { stdio: 'inherit' }
            )
            
            console.log(`Successfully published ${packagePath}`)
            return true
        } catch (error) {
            retries++
            console.error(`Failed to publish ${packagePath} (attempt ${retries}/${MAX_RETRIES})`)
            console.error(error.message)
            
            if (retries < MAX_RETRIES) {
                console.log(`Waiting ${RETRY_DELAY/1000} seconds before retrying...`)
                await sleep(RETRY_DELAY)
            }
        }
    }

    return false
}

async function main() {
    console.log('🔍 Scanning for provider packages...')
    
    // Find all provider packages
    const packages = await findProviderPackages()

    if (packages.length === 0) {
        console.log('❌ No provider packages found!')
        return
    }

    console.log(`\n📦 Found ${packages.length} provider packages:`)
    packages.forEach(pkg => {
        console.log(`- ${pkg.name}@${pkg.version}`)
    })
    
    // Sort packages by dependencies
    const sortedPackages = sortPackagesByDependencies(packages)
    
    // Check which packages are already published
    console.log('\n🔍 Checking published status:')
    const unpublishedPackages = []
    for (const pkg of sortedPackages) {
        const isPublished = await checkIfPackagePublished(pkg.name, pkg.version)
        if (!isPublished) {
            unpublishedPackages.push(pkg)
            console.log(`❌ ${pkg.name}@${pkg.version} needs to be published`)
        } else {
            console.log(`✅ ${pkg.name}@${pkg.version} is already published`)
        }
    }

    if (unpublishedPackages.length === 0) {
        console.log('\n✨ All provider packages are already published!')
        return
    }

    console.log(`\n📦 Publishing ${unpublishedPackages.length} packages in order:`)
    unpublishedPackages.forEach(pkg => {
        console.log(`- ${pkg.name}@${pkg.version}`)
    })
    
    // Publish unpublished packages
    console.log('\n🚀 Starting publication process...')
    for (const pkg of unpublishedPackages) {
        console.log(`\nPublishing ${pkg.name}@${pkg.version}...`)
        
        // Check if all dependencies are published
        const missingDeps = []
        for (const dep of pkg.dependencies) {
            const depPkg = packages.find(p => p.name === dep)
            if (depPkg) {
                const isDepPublished = await checkIfPackagePublished(dep, depPkg.version)
                if (!isDepPublished) {
                    missingDeps.push(`${dep}@${depPkg.version}`)
                }
            }
        }

        if (missingDeps.length > 0) {
            console.error(`❌ Cannot publish ${pkg.name} - missing dependencies:`)
            missingDeps.forEach(dep => console.error(`  - ${dep}`))
            continue
        }

        const success = await publishPackage(pkg.path, {
            tag: 'latest',
            access: pkg.packageJson.publishConfig?.access || 'public'
        })
        
        if (!success) {
            console.error(`❌ Failed to publish ${pkg.name} after ${MAX_RETRIES} attempts`)
            break
        }
        
        if (unpublishedPackages.indexOf(pkg) < unpublishedPackages.length - 1) {
            console.log(`⏳ Waiting ${DELAY_BETWEEN_PUBLISHES/1000} seconds before publishing next package...`)
            await sleep(DELAY_BETWEEN_PUBLISHES)
        }
    }
}

// Run the script
main()
    .then(() => console.log('✨ Finished publishing provider packages'))
    .catch(error => {
        console.error('❌ Error during publication:', error)
        process.exit(1)
    })