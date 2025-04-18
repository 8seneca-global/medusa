// scripts/publish-new-packages.js
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

async function findPackages(directory) {
    const packages = []
    const entries = fs.readdirSync(directory, { withFileTypes: true })
    
    for (const entry of entries) {
        if (entry.isDirectory()) {
            const packageJsonPath = path.join(directory, entry.name, 'package.json')
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
                if (packageJson.name && packageJson.name.startsWith(SCOPE)) {
                    packages.push({
                        name: packageJson.name,
                        version: packageJson.version,
                        path: path.join(directory, entry.name),
                        packageJson
                    })
                }
            }
        }
    }
    
    return packages
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
    // Find all packages in the packages directory
    console.log('Scanning for packages...')
    const packagesDir = path.join(process.cwd(), 'packages')
    const modulesDir = path.join(packagesDir, 'modules')
    
    const packages = [
        ...(await findPackages(packagesDir)),
        ...(await findPackages(modulesDir))
    ]

    console.log(`Found ${packages.length} packages with @8medusa scope`)

    // Check which packages are already published
    const unpublishedPackages = []
    for (const pkg of packages) {
        const isPublished = await checkIfPackagePublished(pkg.name, pkg.version)
        if (!isPublished) {
            unpublishedPackages.push(pkg)
            console.log(`${pkg.name}@${pkg.version} needs to be published`)
        } else {
            console.log(`${pkg.name}@${pkg.version} is already published`)
        }
    }

    if (unpublishedPackages.length === 0) {
        console.log('All packages are already published!')
        return
    }

    console.log(`\nFound ${unpublishedPackages.length} packages to publish`)
    
    // Publish unpublished packages
    for (const pkg of unpublishedPackages) {
        const success = await publishPackage(pkg.path, {
            tag: 'latest',
            access: pkg.packageJson.publishConfig?.access || 'public'
        })
        
        if (!success) {
            console.error(`Failed to publish ${pkg.name} after ${MAX_RETRIES} attempts`)
            continue
        }
        
        if (unpublishedPackages.indexOf(pkg) < unpublishedPackages.length - 1) {
            console.log(`Waiting ${DELAY_BETWEEN_PUBLISHES/1000} seconds before publishing next package...`)
            await sleep(DELAY_BETWEEN_PUBLISHES)
        }
    }
}

// Run the script
main()
    .then(() => console.log('Finished publishing packages'))
    .catch(error => console.error('Error during publication:', error))