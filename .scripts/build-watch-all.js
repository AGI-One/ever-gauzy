const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Package build & watch script - cd into each package directory and run yarn lib:build then yarn lib:watch
 * Builds packages in dependency order then starts watch mode in each package directory
 */

class BuildWatcher {
	constructor() {
		this.processes = [];
		this.packagesDir = path.join(__dirname, '..', 'packages');
		this.allPackages = []; // Will be populated by scanning filesystem
		this.colors = [
			'\x1b[36m', // Cyan
			'\x1b[35m', // Magenta
			'\x1b[33m', // Yellow
			'\x1b[32m', // Green
			'\x1b[34m', // Blue
			'\x1b[31m', // Red
			'\x1b[37m', // White
			'\x1b[96m', // Bright Cyan
			'\x1b[91m', // Bright Red
			'\x1b[92m', // Bright Green
			'\x1b[93m', // Bright Yellow
			'\x1b[94m', // Bright Blue
			'\x1b[95m', // Bright Magenta
			'\x1b[97m', // Bright White
			'\x1b[90m', // Gray
			'\x1b[41m' // Red background
		];
		this.reset = '\x1b[0m';
	}

	// Scan filesystem to discover all packages in hardcoded dependency order
	discoverAllPackages() {
		console.log('🔍 Scanning packages directory...');

		// Hardcoded build order based on dependencies
		const buildOrder = [
			'constants',
			'contracts',
			'utils',
			'common',
			'config',
			'auth',
			'plugin',
			'mcp-server',
			'core',
			'ui-config',
			'ui-core',
			'ui-auth',
			'desktop-activity',
			'desktop-core',
			'desktop-window',
			'desktop-lib',
			'desktop-ui-lib'
		];

		const packages = [];

		// Add packages in build order if they exist
		buildOrder.forEach((packageName) => {
			const packagePath = path.join(this.packagesDir, packageName);
			if (this.isValidPackage(packagePath)) {
				packages.push(packageName);
				console.log(`  📦 Found package: ${packageName}`);
			} else {
				console.log(`  ⚠️  Package not found: ${packageName}`);
			}
		});

		// Add individual plugins from plugins directory
		const pluginPackages = this.scanPluginsDirectory();
		pluginPackages.forEach((plugin) => {
			packages.push(plugin);
			console.log(`  🔌 Found plugin: ${plugin}`);
		});

		this.allPackages = packages;
		console.log(`✅ Total packages: ${packages.length}\n`);

		// Log the build order for verification
		console.log('📋 Build order:');
		packages.forEach((pkg, index) => {
			console.log(`  ${index + 1}. ${pkg}`);
		});
		console.log('');

		return packages;
	}

	// Check if a directory is a valid package (has project.json or package.json)
	isValidPackage(packagePath) {
		return (
			fs.existsSync(path.join(packagePath, 'project.json')) ||
			fs.existsSync(path.join(packagePath, 'package.json'))
		);
	}

	// Scan plugins directory for individual plugin packages
	scanPluginsDirectory() {
		const pluginsPath = path.join(this.packagesDir, 'plugins');
		const pluginPackages = [];

		if (!fs.existsSync(pluginsPath)) {
			return pluginPackages;
		}

		const pluginDirs = fs
			.readdirSync(pluginsPath, { withFileTypes: true })
			.filter((dirent) => dirent.isDirectory() && !dirent.name.startsWith('.'))
			.map((dirent) => dirent.name);

		pluginDirs.forEach((pluginName) => {
			const pluginPath = path.join(pluginsPath, pluginName);
			if (this.isValidPackage(pluginPath)) {
				pluginPackages.push(`plugins/${pluginName}`);
			}
		});

		return pluginPackages;
	}

	// Get the package directory path
	getPackageDirectory(packageName) {
		return path.join(this.packagesDir, packageName);
	}

	// Check if package has specific script
	hasScript(packagePath, scriptName) {
		try {
			const packageJsonPath = path.join(packagePath, 'package.json');
			if (fs.existsSync(packageJsonPath)) {
				const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
				return packageJson.scripts && packageJson.scripts[scriptName];
			}
		} catch (error) {
			console.warn(`⚠️  Cannot read package.json for ${packagePath}`);
		}
		return false;
	}

	// Build single package by running yarn lib:build in its directory
	async buildPackage(packageName) {
		const packagePath = this.getPackageDirectory(packageName);

		console.log(`🔨 Building ${packageName}...`);

		return new Promise((resolve, reject) => {
			const buildProcess = spawn('yarn', ['lib:build'], {
				cwd: packagePath,
				env: {
					...process.env,
					NODE_ENV: 'development',
					NODE_OPTIONS: '--max-old-space-size=4096'
				},
				stdio: 'pipe',
				shell: true
			});

			let output = '';

			buildProcess.stdout.on('data', (data) => {
				const chunk = data.toString();
				output += chunk;
			});

			buildProcess.stderr.on('data', (data) => {
				output += data.toString();
			});

			buildProcess.on('close', (code) => {
				if (code === 0) {
					console.log(`  ✅ ${packageName} built successfully`);
					resolve();
				} else {
					console.error(`  ❌ ${packageName} build failed (code: ${code})`);
					reject(new Error(`Build failed for ${packageName}`));
				}
			});
		});
	}

	// Build all packages sequentially in dependency order
	async buildAllPackages() {
		console.log('📦 Building all packages in dependency order...');
		console.log('⏱️  Running yarn lib:build in each package directory.\n');

		for (let i = 0; i < this.allPackages.length; i++) {
			const packageName = this.allPackages[i];
			console.log(`📋 Progress: ${i + 1}/${this.allPackages.length} packages`);

			// Check if package has lib:build script before trying to build
			const packagePath = this.getPackageDirectory(packageName);
			if (this.hasScript(packagePath, 'lib:build')) {
				await this.buildPackage(packageName);
			} else {
				console.log(`  ⚠️  Skipping ${packageName} - no lib:build script found`);
			}
		}
		console.log('\n✅ All packages built successfully - starting watch mode...');
	}

	// Start watch process for single package by running yarn lib:watch in its directory
	startWatchForPackage(packageName, colorIndex) {
		const packagePath = this.getPackageDirectory(packageName);

		// Check if package has lib:watch script
		if (!this.hasScript(packagePath, 'lib:watch')) {
			return null;
		}

		const color = this.colors[colorIndex % this.colors.length];
		const prefix = `[${packageName}]`;

		console.log(`${color}📺 Starting ${packageName}${this.reset}`);

		const watchProcess = spawn('yarn', ['lib:watch'], {
			cwd: packagePath,
			env: {
				...process.env,
				NODE_ENV: 'development',
				NODE_OPTIONS: '--max-old-space-size=4096',
				FORCE_COLOR: '1',
				NO_CLEAR: '1'
			},
			stdio: ['ignore', 'pipe', 'pipe'],
			shell: true,
			detached: false
		});

		// Simple output logging - filter out clear screen sequences
		watchProcess.stdout.on('data', (data) => {
			let output = data.toString();
			// Remove clear screen sequences and cursor movements
			output = output.replace(/\x1b\[[0-9;]*[Hf]/g, ''); // Clear screen
			output = output.replace(/\x1b\[[0-9;]*[J]/g, ''); // Clear line
			output = output.replace(/\x1b\[2J/g, ''); // Clear entire screen
			output = output.replace(/\x1b\[H/g, ''); // Move cursor to home
			output = output.replace(/\x1b\[1;1H/g, ''); // Move cursor to top-left

			if (output.trim()) {
				process.stdout.write(`${color}${prefix}${this.reset} ${output}`);
			}
		});

		watchProcess.stderr.on('data', (data) => {
			let output = data.toString();
			// Remove clear screen sequences from stderr too
			output = output.replace(/\x1b\[[0-9;]*[HfJ]/g, '');
			output = output.replace(/\x1b\[2J/g, '');
			output = output.replace(/\x1b\[H/g, '');
			output = output.replace(/\x1b\[1;1H/g, '');

			if (output.trim()) {
				process.stderr.write(`${color}${prefix}${this.reset} ${output}`);
			}
		});

		// Minimal event handling - no complex error detection
		watchProcess.on('close', () => {
			console.log(`${color}${prefix}${this.reset} stopped`);
		});

		this.processes.push({
			process: watchProcess,
			name: packageName,
			color: color
		});

		return watchProcess;
	}

	// Start watch mode for all packages
	async startWatchAll() {
		console.log('👀 Starting watch mode for all packages...');
		console.log('💡 Running yarn lib:watch in each package directory\n');

		let watchCount = 0;
		for (let i = 0; i < this.allPackages.length; i++) {
			const packageName = this.allPackages[i];
			const watchProcess = this.startWatchForPackage(packageName, i);

			if (watchProcess) {
				watchCount++;
				// Small delay to stagger startup
				await new Promise((resolve) => setTimeout(resolve, 200));
			}
		}

		console.log(`\n🎉 ${watchCount} watch processes started! Press Ctrl+C to stop all processes.`);
		console.log('� All packages are watching for changes in parallel...\n');
	}

	// Simple cleanup when exiting
	cleanup() {
		if (this.processes.length === 0) return;

		console.log('\n🛑 Stopping all processes...');

		// Simple force kill all processes
		this.processes.forEach(({ process, name }) => {
			if (process && !process.killed) {
				process.kill('SIGKILL');
			}
		});

		this.processes = [];
		process.exit(0);
	}
}

// Main execution - unified entry point
async function main() {
	const watcher = new BuildWatcher();

	// Handle all termination signals for complete cleanup
	process.on('SIGINT', () => {
		console.log('\n🔄 Received interrupt signal, cleaning up...');
		watcher.cleanup();
	});

	process.on('SIGTERM', () => {
		console.log('\n🔄 Received termination signal, cleaning up...');
		watcher.cleanup();
	});

	process.on('exit', () => {
		watcher.cleanup();
	});

	// Handle exceptions to ensure cleanup
	process.on('uncaughtException', (error) => {
		console.error('💥 Uncaught exception:', error);
		watcher.cleanup();
	});

	process.on('unhandledRejection', (reason, promise) => {
		console.error('💥 Unhandled rejection:', reason);
		watcher.cleanup();
	});

	try {
		console.log('🚀 Starting package build & watch process...');
		watcher.discoverAllPackages();
		await watcher.buildAllPackages();
		await watcher.startWatchAll();
	} catch (error) {
		console.error('💥 Error starting build watcher:', error);
		watcher.cleanup();
		process.exit(1);
	}
}

// Start the unified build watcher
main();
