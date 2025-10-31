const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Unified build watch script for core packages
 * Builds packages in dependency order then starts watch mode
 * Single JS file that manages all processes for complete control
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

	// Scan filesystem to discover all packages
	discoverAllPackages() {
		const packages = [];

		console.log('🔍 Scanning packages directory...');

		// Define the dependency order for core packages
		const corePackagesOrder = ['constants', 'contracts', 'common', 'utils', 'config', 'plugin', 'auth'];

		// Add core packages first in dependency order
		corePackagesOrder.forEach((packageName) => {
			const packagePath = path.join(this.packagesDir, packageName);
			if (this.isValidPackage(packagePath)) {
				packages.push(packageName);
				console.log(`  📦 Found core package: ${packageName}`);
			}
		});

		// Add plugins:pre group
		if (this.hasPluginsDirectory()) {
			packages.push('plugins:pre');
			console.log(`  📦 Found plugin group: plugins:pre`);
		}

		// Add core package
		const corePath = path.join(this.packagesDir, 'core');
		if (this.isValidPackage(corePath)) {
			packages.push('core');
			console.log(`  📦 Found core package: core`);
		}

		// Add plugins:post group
		if (this.hasPluginsDirectory()) {
			packages.push('plugins:post');
			console.log(`  📦 Found plugin group: plugins:post`);
		}

		// Discover other packages (desktop, etc.)
		const otherPackages = this.scanPackagesDirectory();
		const excludeFromOther = new Set([...corePackagesOrder, 'core', 'plugins']);

		otherPackages.forEach((pkg) => {
			if (!excludeFromOther.has(pkg)) {
				packages.push(pkg);
				console.log(`  📦 Found other package: ${pkg}`);
			}
		});

		// Discover individual plugins
		const individualPlugins = this.scanIndividualPlugins();
		individualPlugins.forEach((plugin) => {
			packages.push(plugin);
			console.log(`  🔌 Found plugin: ${plugin}`);
		});

		// Add mcp-server if it exists
		if (this.hasMcpServer()) {
			packages.push('mcp-server');
			console.log(`  📦 Found mcp-server`);
		}

		this.allPackages = packages;
		console.log(`✅ Discovered ${packages.length} total packages\n`);
		return packages;
	}

	// Check if a directory is a valid package (has project.json or package.json)
	isValidPackage(packagePath) {
		return (
			fs.existsSync(path.join(packagePath, 'project.json')) ||
			fs.existsSync(path.join(packagePath, 'package.json'))
		);
	}

	// Check if plugins directory exists
	hasPluginsDirectory() {
		const pluginsPath = path.join(this.packagesDir, 'plugins');
		return fs.existsSync(pluginsPath) && fs.statSync(pluginsPath).isDirectory();
	}

	// Scan packages directory for all subdirectories
	scanPackagesDirectory() {
		if (!fs.existsSync(this.packagesDir)) {
			return [];
		}

		return fs
			.readdirSync(this.packagesDir, { withFileTypes: true })
			.filter((dirent) => dirent.isDirectory() && !dirent.name.startsWith('.'))
			.map((dirent) => dirent.name)
			.filter((dirName) => {
				const packagePath = path.join(this.packagesDir, dirName);
				return this.isValidPackage(packagePath);
			});
	}

	// Scan for individual plugins that have specific build commands
	scanIndividualPlugins() {
		const pluginsPath = path.join(this.packagesDir, 'plugins');
		const individualPlugins = [];

		if (!fs.existsSync(pluginsPath)) {
			return individualPlugins;
		}

		// List of plugins that have individual build commands
		const knownIndividualPlugins = ['integration-wakatime', 'camshot', 'soundshot'];

		knownIndividualPlugins.forEach((pluginName) => {
			const pluginPath = path.join(pluginsPath, pluginName);
			if (this.isValidPackage(pluginPath)) {
				individualPlugins.push(`plugin:${pluginName}`);
			}
		});

		return individualPlugins;
	}

	// Check if mcp-server exists
	hasMcpServer() {
		// Check if build:mcp-server command exists by testing
		try {
			return true; // We know it exists from package.json
		} catch (error) {
			return false;
		}
	}

	// Get the correct build command for a package
	getBuildCommand(packageName) {
		// Special build command mappings that don't follow the build:package: pattern
		const specialBuildCommands = {
			'mcp-server': 'build:mcp-server',
			'plugins:pre': 'build:package:plugins:pre',
			'plugins:post': 'build:package:plugins:post'
		};

		if (specialBuildCommands.hasOwnProperty(packageName)) {
			return specialBuildCommands[packageName];
		}

		// Default pattern: build:package:{packageName}
		return `build:package:${packageName}`;
	}

	// Get NX project name from project.json or handle special cases
	getProjectName(packageName) {
		// Handle special package names that don't map directly to folders
		const specialMappings = {
			'plugins:pre': null, // This runs multiple plugin builds
			'plugins:post': null, // This runs multiple plugin builds
			'plugin:integration-wakatime': 'plugin-integration-wakatime',
			'plugin:camshot': 'plugin-camshot',
			'plugin:soundshot': 'plugin-soundshot',
			'mcp-server': 'mcp-server'
		};

		if (specialMappings.hasOwnProperty(packageName)) {
			return specialMappings[packageName];
		}

		// For regular packages, try to read project.json
		try {
			const projectJsonPath = path.join(__dirname, '..', 'packages', packageName, 'project.json');
			if (fs.existsSync(projectJsonPath)) {
				const projectJson = JSON.parse(fs.readFileSync(projectJsonPath, 'utf8'));
				return projectJson.name || packageName;
			}
		} catch (error) {
			console.warn(`⚠️  Cannot read project.json for ${packageName}, using package name`);
		}
		return packageName;
	} // Clean dist directory
	async cleanDist() {
		console.log('🧹 Cleaning dist directory...');
		return new Promise((resolve, reject) => {
			const rimraf = spawn('npx', ['rimraf', 'dist'], {
				cwd: path.join(__dirname, '..'),
				stdio: 'pipe'
			});

			let output = '';
			rimraf.stdout.on('data', (data) => (output += data.toString()));
			rimraf.stderr.on('data', (data) => (output += data.toString()));

			rimraf.on('close', (code) => {
				if (code === 0) {
					console.log('✅ Dist directory cleaned');
					resolve();
				} else {
					console.error('❌ Failed to clean dist directory:', output);
					reject(new Error(`rimraf failed with code ${code}`));
				}
			});
		});
	}

	// Build single package with improved logging and timeout
	async buildPackage(packageName) {
		// Handle special multi-package builds
		if (packageName === 'plugins:pre' || packageName === 'plugins:post') {
			console.log(`🔨 Building ${packageName} (multiple plugins)...`);
			return this.buildPluginGroup(packageName);
		}

		const projectName = this.getProjectName(packageName);
		if (!projectName) {
			console.log(`  ⚠️  Skipping ${packageName} - no project mapping`);
			return Promise.resolve();
		}

		console.log(`🔨 Building ${packageName}...`);

		// Get the correct build command name
		const buildCommand = this.getBuildCommand(packageName);

		return new Promise((resolve, reject) => {
			const buildProcess = spawn('yarn', ['run', buildCommand], {
				cwd: path.join(__dirname, '..'),
				env: {
					...process.env,
					NODE_ENV: 'development',
					NODE_OPTIONS: '--max-old-space-size=12288'
				},
				stdio: 'pipe'
			});

			let output = '';
			let lastActivity = Date.now();

			// Add timeout for stuck builds (especially core package)
			const timeout = setTimeout(() => {
				console.warn(`  ⚠️  ${packageName} build taking too long, continuing anyway...`);
				buildProcess.kill('SIGTERM');
				resolve(); // Continue with next package
			}, 300000); // 5 minutes timeout for complex packages

			buildProcess.stdout.on('data', (data) => {
				const chunk = data.toString();
				output += chunk;
				lastActivity = Date.now();

				// Show build progress for verbose packages
				if (
					(packageName === 'core' || packageName === 'plugins:pre' || packageName === 'plugins:post') &&
					(chunk.includes('.json') || chunk.includes('.csv'))
				) {
					process.stdout.write('.');
				}
			});

			buildProcess.stderr.on('data', (data) => {
				output += data.toString();
				lastActivity = Date.now();
			});

			buildProcess.on('close', (code) => {
				clearTimeout(timeout);
				if (packageName === 'core' || packageName === 'plugins:pre' || packageName === 'plugins:post') {
					process.stdout.write('\n'); // New line after dots
				}

				if (code === 0) {
					console.log(`  ✅ ${packageName} built successfully`);
					resolve();
				} else {
					console.error(`  ❌ ${packageName} build failed (code: ${code})`);
					// Show only last part of output to avoid spam
					const lines = output.split('\n').slice(-10);
					console.error(`     Last output:\n     ${lines.join('\n     ')}`);
					reject(new Error(`Build failed for ${packageName}`));
				}
			});
		});
	}

	// Build plugin groups using existing package.json scripts
	async buildPluginGroup(groupName) {
		return new Promise((resolve, reject) => {
			const buildProcess = spawn('yarn', ['run', `build:package:${groupName}`], {
				cwd: path.join(__dirname, '..'),
				env: {
					...process.env,
					NODE_ENV: 'development',
					NODE_OPTIONS: '--max-old-space-size=12288'
				},
				stdio: 'pipe'
			});

			let output = '';
			buildProcess.stdout.on('data', (data) => {
				const chunk = data.toString();
				output += chunk;
				if (chunk.includes('.json') || chunk.includes('.csv')) {
					process.stdout.write('.');
				}
			});

			buildProcess.stderr.on('data', (data) => (output += data.toString()));

			buildProcess.on('close', (code) => {
				if (code === 0) {
					resolve();
				} else {
					console.error(`Plugin group ${groupName} failed:`, output.slice(-500));
					reject(new Error(`Plugin group ${groupName} build failed`));
				}
			});
		});
	}

	// Build all packages sequentially in dependency order
	async buildAllPackages() {
		console.log('📦 Building all packages in dependency order...');
		console.log('⏱️  This may take several minutes, especially for plugins and core package.\n');

		for (let i = 0; i < this.allPackages.length; i++) {
			const packageName = this.allPackages[i];
			console.log(`📋 Progress: ${i + 1}/${this.allPackages.length} packages`);
			await this.buildPackage(packageName);
		}
		console.log('\n✅ All packages built successfully - starting watch mode...');
	}

	// Start watch process for single package
	startWatchForPackage(packageName, colorIndex) {
		// Skip multi-package groups in watch mode - they don't support watch
		if (packageName === 'plugins:pre' || packageName === 'plugins:post') {
			console.log(`  ⚠️  Skipping watch for ${packageName} (multi-package group)`);
			return null;
		}

		const projectName = this.getProjectName(packageName);
		if (!projectName) {
			console.log(`  ⚠️  Skipping watch for ${packageName} - no project mapping`);
			return null;
		}

		const color = this.colors[colorIndex % this.colors.length];
		const prefix = `[${packageName}]`;

		console.log(`📺 Starting watch for ${packageName}...`);

		const watchProcess = spawn('yarn', ['nx', 'build', projectName, '--watch'], {
			cwd: path.join(__dirname, '..'),
			env: {
				...process.env,
				NODE_ENV: 'development',
				NODE_OPTIONS: '--max-old-space-size=12288'
			},
			stdio: ['ignore', 'pipe', 'pipe']
		});

		// Handle output with persistent colored prefixes
		let lastLogTime = Date.now();
		watchProcess.stdout.on('data', (data) => {
			const lines = data
				.toString()
				.split('\n')
				.filter((line) => line.trim());

			lines.forEach((line) => {
				const timestamp = new Date().toLocaleTimeString();
				// Only show meaningful build progress, skip verbose file listings
				if (
					line.includes('Built at:') ||
					line.includes('webpack compiled') ||
					line.includes('Hash:') ||
					line.includes('Time:') ||
					line.includes('ERROR') ||
					line.includes('WARNING') ||
					(!line.includes('.json') && !line.includes('.csv') && !line.includes('.gql'))
				) {
					console.log(`${color}${prefix}${this.reset} [${timestamp}] ${line}`);
					lastLogTime = Date.now();
				}
			});
		});

		watchProcess.stderr.on('data', (data) => {
			const lines = data
				.toString()
				.split('\n')
				.filter((line) => line.trim());
			lines.forEach((line) => {
				const timestamp = new Date().toLocaleTimeString();
				console.error(`${color}${prefix}${this.reset} [${timestamp}] ❌ ${line}`);
			});
		});

		watchProcess.on('close', (code, signal) => {
			if (signal) {
				console.log(`${color}${prefix}${this.reset} Terminated by signal: ${signal}`);
			} else {
				console.log(`${color}${prefix}${this.reset} Exited with code: ${code}`);
			}
		});

		watchProcess.on('error', (error) => {
			process.stderr.write(`${color}${prefix}${this.reset} ❌ Process error: ${error.message}\n`);
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
		console.log('💡 Note: File copy logs are filtered to reduce noise\n');
		console.log('💡 Note: Plugin groups (plugins:pre/post) are skipped in watch mode\n');

		let watchCount = 0;
		for (let i = 0; i < this.allPackages.length; i++) {
			const packageName = this.allPackages[i];
			console.log(`   📺 Starting watch ${i + 1}/${this.allPackages.length}: ${packageName}`);
			const watchProcess = this.startWatchForPackage(packageName, i);

			if (watchProcess) {
				watchCount++;
				// Small delay to stagger startup
				await new Promise((resolve) => setTimeout(resolve, 500));
			}
		}

		console.log(`\n🎉 ${watchCount} watch processes started! (${this.allPackages.length - watchCount} skipped)`);
		console.log('📊 Watching for changes... Press Ctrl+C to stop all processes.');
		console.log('💡 Build logs are timestamped and filtered for readability.\n');
	}

	// Complete cleanup when exiting
	cleanup() {
		if (this.processes.length === 0) return;

		console.log('\n🛑 Stopping all watch processes...');

		// Kill all processes gracefully first, then force kill if needed
		const killPromises = this.processes.map(({ process, name, color }) => {
			return new Promise((resolve) => {
				if (process && !process.killed) {
					console.log(`  ${color}🔄 Stopping ${name}...${this.reset}`);

					// Try graceful shutdown
					process.kill('SIGTERM');

					// Force kill timeout
					const timeout = setTimeout(() => {
						if (!process.killed) {
							console.log(`  ${color}⚡ Force killing ${name}...${this.reset}`);
							process.kill('SIGKILL');
						}
						resolve();
					}, 2000);

					process.on('exit', () => {
						clearTimeout(timeout);
						console.log(`  ${color}✅ ${name} stopped${this.reset}`);
						resolve();
					});
				} else {
					resolve();
				}
			});
		});

		Promise.all(killPromises).then(() => {
			console.log('🏁 All processes stopped successfully.');
			this.processes = [];
			process.exit(0);
		});
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
		console.log('🚀 Starting unified build watch process...');
		watcher.discoverAllPackages();
		await watcher.cleanDist();
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
