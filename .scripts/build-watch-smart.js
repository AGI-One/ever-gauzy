const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Try to require glob, fallback if not available
let glob;
try {
	glob = require('glob');
	console.log('✅ Using glob for file pattern matching');
} catch (e) {
	console.log('⚠️  Glob not available, using fallback recursive method');
	// Will use fs.readdirSync as fallback
}

/**
 * Smart Package build & watch script
 * Uses watchexec to detect file changes and rebuilds only the affected package
 * Much faster than rebuilding all packages on every change
 */

class SmartWatchBuilder {
	constructor() {
		this.packagesDir = path.join(__dirname, '..', 'packages');
		this.allPackages = [];
		this.packageMap = new Map(); // packageName -> packagePath
		this.dependencyMap = new Map(); // package -> dependencies
		this.activeBuildTasks = new Map(); // package -> Promise
		this.debounceTimeouts = new Map(); // package -> timeout
		this.colors = {
			cyan: '\x1b[36m',
			green: '\x1b[32m',
			yellow: '\x1b[33m',
			red: '\x1b[31m',
			blue: '\x1b[34m',
			magenta: '\x1b[35m',
			gray: '\x1b[90m',
			reset: '\x1b[0m'
		};
	}

	// Discover all packages và build dependency map
	discoverAllPackages() {
		console.log(`${this.colors.cyan}🔍 Scanning packages directory...${this.colors.reset}`);

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

		// Add packages in build order if they exist and have lib:build script
		buildOrder.forEach((packageName) => {
			const packagePath = path.join(this.packagesDir, packageName);
			if (this.hasLibBuildScript(packagePath)) {
				packages.push(packageName);
				this.packageMap.set(packageName, packagePath);
				console.log(`  ${this.colors.green}📦 Found buildable package: ${packageName}${this.colors.reset}`);
			}
		});

		// Add individual plugins from plugins directory
		const pluginPackages = this.scanPluginsDirectory();
		pluginPackages.forEach((plugin) => {
			packages.push(plugin);
			this.packageMap.set(plugin, path.join(this.packagesDir, plugin));
			console.log(`  ${this.colors.blue}🔌 Found buildable plugin: ${plugin}${this.colors.reset}`);
		});

		this.allPackages = packages;
		console.log(`${this.colors.green}✅ Total buildable packages: ${packages.length}${this.colors.reset}\n`);

		// Build dependency map (simplified - based on build order)
		this.buildDependencyMap();

		return packages;
	}

	// Build dependency map dựa trên build order
	buildDependencyMap() {
		console.log(`${this.colors.gray}🔗 Building dependency map...${this.colors.reset}`);

		// Simple dependency logic: packages depend on earlier ones in build order
		const coreDependencies = ['constants', 'contracts', 'utils', 'common'];

		this.allPackages.forEach((packageName, index) => {
			const dependencies = [];

			// Core packages are depended by most others
			if (!coreDependencies.includes(packageName)) {
				dependencies.push(...coreDependencies.filter((dep) => this.allPackages.includes(dep)));
			}

			// UI packages depend on core
			if (packageName.startsWith('ui-') && this.allPackages.includes('core')) {
				dependencies.push('core');
			}

			// Desktop packages depend on core and other desktop packages
			if (packageName.startsWith('desktop-')) {
				if (this.allPackages.includes('core')) dependencies.push('core');
				// Desktop-lib depends on desktop-core
				if (packageName === 'desktop-lib' && this.allPackages.includes('desktop-core')) {
					dependencies.push('desktop-core');
				}
			}

			this.dependencyMap.set(packageName, [...new Set(dependencies)]);

			if (dependencies.length > 0) {
				console.log(
					`  ${this.colors.gray}${packageName} depends on: ${dependencies.join(', ')}${this.colors.reset}`
				);
			}
		});

		console.log('');
	}

	// Check if package has lib:build script
	hasLibBuildScript(packagePath) {
		try {
			const packageJsonPath = path.join(packagePath, 'package.json');
			if (fs.existsSync(packageJsonPath)) {
				const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
				return packageJson.scripts && packageJson.scripts['lib:build'];
			}
		} catch (error) {
			// Silently skip invalid packages
		}
		return false;
	}

	// Scan plugins directory
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
			if (this.hasLibBuildScript(pluginPath)) {
				pluginPackages.push(`plugins/${pluginName}`);
			}
		});

		return pluginPackages;
	}

	// Determine which package a file belongs to
	getPackageFromFilePath(filePath) {
		const relativePath = path.relative(this.packagesDir, filePath);
		const pathParts = relativePath.split(path.sep);

		if (pathParts[0] === 'plugins' && pathParts.length > 1) {
			return `plugins/${pathParts[1]}`;
		} else if (pathParts.length > 0) {
			return pathParts[0];
		}

		return null;
	}

	// Copy assets for core package
	copyAssetsForCore() {
		const sourceDir = path.join(this.packagesDir, 'core/src');
		const targetDir = path.join(__dirname, '../dist/packages/core/src');

		console.log(`  ${this.colors.gray}📂 Checking asset copy: ${sourceDir} -> ${targetDir}${this.colors.reset}`);

		if (!fs.existsSync(sourceDir)) {
			console.log(`  ${this.colors.yellow}⚠️  Source directory not found: ${sourceDir}${this.colors.reset}`);
			return;
		}

		// Create target directory if not exists
		if (!fs.existsSync(targetDir)) {
			console.log(`  ${this.colors.gray}📁 Creating target directory: ${targetDir}${this.colors.reset}`);
			fs.mkdirSync(targetDir, { recursive: true });
		}

		let copiedCount = 0;

		if (glob) {
			// Use glob if available
			console.log(`  ${this.colors.gray}🔍 Using glob to find assets...${this.colors.reset}`);
			const assetPatterns = ['**/*.gql', '**/*.hbs', '**/*.mjml', '**/*.csv', '**/*.json'];

			assetPatterns.forEach((pattern) => {
				const fullPattern = path.join(sourceDir, pattern);
				const files = glob.sync(fullPattern, {
					nodir: true,
					ignore: ['**/node_modules/**', '**/*.spec.*', '**/*.test.*']
				});

				console.log(
					`  ${this.colors.gray}    Pattern ${pattern}: found ${files.length} files${this.colors.reset}`
				);

				files.forEach((sourceFile) => {
					const relativePath = path.relative(sourceDir, sourceFile);
					const targetFile = path.join(targetDir, relativePath);
					const targetFileDir = path.dirname(targetFile);

					// Ensure target directory exists
					if (!fs.existsSync(targetFileDir)) {
						fs.mkdirSync(targetFileDir, { recursive: true });
					}

					// Copy file
					fs.copyFileSync(sourceFile, targetFile);
					copiedCount++;
					console.log(`  ${this.colors.gray}    📄 Copied: ${relativePath}${this.colors.reset}`);
				});
			});
		} else {
			// Fallback: simple recursive copy of asset files
			console.log(`  ${this.colors.gray}🔍 Using fallback recursive copy...${this.colors.reset}`);
			copiedCount = this.copyAssetsRecursive(sourceDir, targetDir);
		}

		if (copiedCount > 0) {
			console.log(
				`  ${this.colors.cyan}📄 Copied ${copiedCount} asset files to dist/packages/core/src${this.colors.reset}`
			);
		} else {
			console.log(
				`  ${this.colors.yellow}📄 No asset files found to copy (or all files are up to date)${this.colors.reset}`
			);
		}
	}

	// Fallback recursive copy method
	copyAssetsRecursive(sourceDir, targetDir, copiedCount = 0) {
		const assetExtensions = ['.gql', '.hbs', '.mjml', '.csv', '.json'];

		try {
			const items = fs.readdirSync(sourceDir, { withFileTypes: true });

			items.forEach((item) => {
				const sourcePath = path.join(sourceDir, item.name);
				const targetPath = path.join(targetDir, item.name);

				if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
					// Recurse into directory
					if (!fs.existsSync(targetPath)) {
						fs.mkdirSync(targetPath, { recursive: true });
					}
					copiedCount = this.copyAssetsRecursive(sourcePath, targetPath, copiedCount);
				} else if (item.isFile()) {
					const ext = path.extname(item.name);
					if (
						assetExtensions.includes(ext) &&
						!item.name.includes('.spec.') &&
						!item.name.includes('.test.')
					) {
						try {
							fs.copyFileSync(sourcePath, targetPath);
							copiedCount++;
							const relativePath = path.relative(this.packagesDir, sourcePath);
							console.log(`  ${this.colors.gray}    📄 Copied: ${relativePath}${this.colors.reset}`);
						} catch (copyError) {
							console.log(
								`  ${this.colors.red}❌ Failed to copy ${item.name}: ${copyError.message}${this.colors.reset}`
							);
						}
					}
				}
			});
		} catch (readError) {
			console.log(
				`  ${this.colors.red}❌ Failed to read directory ${sourceDir}: ${readError.message}${this.colors.reset}`
			);
		}

		return copiedCount;
	}

	// Build single package
	async buildPackage(packageName) {
		const packagePath = this.packageMap.get(packageName);
		if (!packagePath) {
			throw new Error(`Package path not found for ${packageName}`);
		}

		const startTime = Date.now();
		console.log(`${this.colors.yellow}🔨 Building ${packageName}...${this.colors.reset}`);

		return new Promise((resolve, reject) => {
			const buildProcess = spawn('yarn', ['lib:build'], {
				cwd: packagePath,
				env: {
					...process.env,
					NODE_ENV: 'development',
					NODE_OPTIONS: '--max-old-space-size=2048' // Lower memory per package
				},
				stdio: ['ignore', 'pipe', 'pipe'],
				shell: true
			});

			buildProcess.stdout.on('data', (data) => {
				const output = data.toString();
				// Only show warnings/errors to reduce noise
				if (
					output.includes('error') ||
					output.includes('Error') ||
					output.includes('warning') ||
					output.includes('Warning')
				) {
					process.stdout.write(`  ${this.colors.yellow}[${packageName}]${this.colors.reset} ${output}`);
				}
			});

			buildProcess.stderr.on('data', (data) => {
				process.stderr.write(`  ${this.colors.green}[${packageName}]:${this.colors.reset} ${data}`);
			});

			buildProcess.on('close', (code) => {
				const duration = ((Date.now() - startTime) / 1000).toFixed(1);
				if (code === 0) {
					console.log(
						`  ${this.colors.green}✅ ${packageName} built successfully (${duration}s)${this.colors.reset}`
					);

					// Copy assets for core package
					if (packageName === 'core') {
						try {
							this.copyAssetsForCore();
						} catch (error) {
							console.log(
								`  ${this.colors.yellow}⚠️  Asset copy failed: ${error.message}${this.colors.reset}`
							);
							// Log the error details for debugging
							console.log(`  ${this.colors.gray}Error details: ${error.stack}${this.colors.reset}`);
						}
					}

					resolve();
				} else {
					console.error(
						`  ${this.colors.red}❌ ${packageName} build failed (code: ${code}, ${duration}s)${this.colors.reset}`
					);
					reject(new Error(`Build failed for ${packageName}`));
				}
			});
		});
	}

	// Build initial packages sequentially
	async buildAllPackages() {
		console.log(
			`${this.colors.cyan}📦 Initial build of all ${this.allPackages.length} packages...${this.colors.reset}`
		);
		const totalStartTime = Date.now();

		try {
			for (let i = 0; i < this.allPackages.length; i++) {
				const packageName = this.allPackages[i];
				console.log(
					`${this.colors.magenta}📋 Progress: ${i + 1}/${this.allPackages.length}${this.colors.reset}`
				);
				await this.buildPackage(packageName);
			}

			// Force copy core assets after initial build is complete
			if (this.allPackages.includes('core')) {
				console.log(
					`${this.colors.cyan}🔄 Force copying core assets after initial build...${this.colors.reset}`
				);
				try {
					this.copyAssetsForCore();
				} catch (error) {
					console.log(
						`  ${this.colors.yellow}⚠️  Post-build asset copy failed: ${error.message}${this.colors.reset}`
					);
				}
			}

			const totalDuration = ((Date.now() - totalStartTime) / 1000).toFixed(1);
			console.log(
				`${this.colors.green}✅ All packages built successfully in ${totalDuration}s${this.colors.reset}\n`
			);
		} catch (error) {
			console.error(`${this.colors.red}💥 Initial build failed: ${error.message}${this.colors.reset}`);
			throw error;
		}
	}

	// Handle file change event
	handleFileChange(filePath) {
		// Clean up the file path
		const cleanPath = filePath.replace(/[[\]]/g, '').trim();

		// Only process if it's in our packages directory
		if (!cleanPath.includes(this.packagesDir)) {
			return;
		}

		const changedPackage = this.getPackageFromFilePath(cleanPath);

		if (changedPackage) {
			console.log(`${this.colors.magenta}📝 File changed in package: ${changedPackage}${this.colors.reset}`);
			console.log(
				`${this.colors.gray}   File: ${path.relative(this.packagesDir, cleanPath)}${this.colors.reset}`
			);
			this.smartRebuild(changedPackage);
		}
	}

	// Get packages that depend on the changed package
	getDependentPackages(changedPackage) {
		const dependents = [];

		this.dependencyMap.forEach((dependencies, packageName) => {
			if (dependencies.includes(changedPackage)) {
				dependents.push(packageName);
			}
		});

		return dependents;
	}

	// Smart rebuild: rebuild changed package and its dependents
	async smartRebuild(changedPackage) {
		if (!this.packageMap.has(changedPackage)) {
			console.log(`${this.colors.gray}📦 Unknown package: ${changedPackage}, skipping...${this.colors.reset}`);
			return;
		}

		// Cancel existing debounce for this package
		if (this.debounceTimeouts.has(changedPackage)) {
			clearTimeout(this.debounceTimeouts.get(changedPackage));
		}

		// Debounce rebuild
		const timeout = setTimeout(async () => {
			console.log(
				`${this.colors.blue}🔄 Smart rebuilding ${changedPackage} and dependents...${this.colors.reset}`
			);

			try {
				// Build the changed package first
				if (!this.activeBuildTasks.has(changedPackage)) {
					const buildPromise = this.buildPackage(changedPackage);
					this.activeBuildTasks.set(changedPackage, buildPromise);

					await buildPromise;
					this.activeBuildTasks.delete(changedPackage);
				}

				// Then build dependent packages
				const dependents = this.getDependentPackages(changedPackage);
				if (dependents.length > 0) {
					console.log(
						`${this.colors.cyan}🔗 Rebuilding ${dependents.length} dependent packages: ${dependents.join(
							', '
						)}${this.colors.reset}`
					);

					for (const dependent of dependents) {
						if (!this.activeBuildTasks.has(dependent)) {
							const buildPromise = this.buildPackage(dependent);
							this.activeBuildTasks.set(dependent, buildPromise);

							await buildPromise;
							this.activeBuildTasks.delete(dependent);
						}
					}
				}

				console.log(
					`${this.colors.green}🎉 Smart rebuild of ${changedPackage} completed!${this.colors.reset}\n`
				);
			} catch (error) {
				console.error(`${this.colors.red}💥 Smart rebuild failed: ${error.message}${this.colors.reset}\n`);
			} finally {
				this.debounceTimeouts.delete(changedPackage);
			}
		}, 300); // 300ms debounce

		this.debounceTimeouts.set(changedPackage, timeout);
	}

	// Start watchexec để watch thay đổi files
	startWatchexec() {
		console.log(`${this.colors.cyan}👀 Starting smart file watcher...${this.colors.reset}`);
		console.log(`${this.colors.yellow}📁 Watching: ${this.packagesDir}${this.colors.reset}`);
		console.log(
			`${this.colors.yellow}🧠 Smart mode: Only rebuild changed packages + dependents${this.colors.reset}\n`
		);

		// Detect platform and use appropriate no-op command
		const isWindows = process.platform === 'win32';
		const noOpCommand = isWindows ? 'echo' : 'true';
		const noOpArgs = isWindows ? ['file-changed'] : [];

		// Use a simpler approach: just run a dummy command and parse events
		const watchexecArgs = [
			'--watch',
			this.packagesDir,
			'--exts',
			'ts,js,json',
			// Basic ignores
			'--ignore',
			'**/node_modules/**',
			'--ignore',
			'**/lib/**',
			'--ignore',
			'**/dist/**',
			'--ignore',
			'**/*.d.ts',
			'--ignore',
			'**/*.spec.ts',
			'--ignore',
			'**/*.test.ts',
			'--ignore',
			'**/__tests__/**',
			'--debounce',
			'200ms',
			'--print-events',
			'--',
			noOpCommand,
			...noOpArgs
		];

		const watchProcess = spawn('watchexec', watchexecArgs, {
			stdio: ['ignore', 'pipe', 'pipe'],
			shell: true // Enable shell mode for better cross-platform compatibility
		});

		watchProcess.on('error', (error) => {
			console.error(`${this.colors.red}💥 Failed to start watchexec: ${error.message}${this.colors.reset}`);
			console.error(
				`${this.colors.yellow}💡 Make sure watchexec is installed: cargo install watchexec-cli${this.colors.reset}`
			);
			console.error(
				`${this.colors.yellow}💡 Or install via package manager (brew install watchexec, etc.)${this.colors.reset}`
			);
			process.exit(1);
		});

		watchProcess.stdout.on('data', (data) => {
			const output = data.toString().trim();

			// Parse watchexec event output
			const lines = output.split('\n');
			lines.forEach((line) => {
				// Look for EVENT lines with file paths in new format
				if (line.includes('[EVENT') && line.includes('path=')) {
					const pathMatch = line.match(/path=([^\s]+)/);
					if (pathMatch && pathMatch[1]) {
						const filePath = pathMatch[1];
						this.handleFileChange(filePath);
					}
				}
				// Legacy format support
				else if (line.includes('Modified:') || line.includes('Created:') || line.includes('Renamed:')) {
					// Extract file path from watchexec event
					const match = line.match(/(?:Modified|Created|Renamed):\s*(.+)/);
					if (match) {
						const filePath = match[1].trim();
						this.handleFileChange(filePath);
					}
				} else if (
					line.startsWith('[') &&
					line.includes(']') &&
					!line.includes('Running:') &&
					!line.includes('Finished:') &&
					!line.includes('[EVENT') &&
					!line.includes('[Command was successful]')
				) {
					// Alternative format: [path/to/file]
					const match = line.match(/\[(.+)\]/);
					if (match) {
						const filePath = match[1].trim();
						this.handleFileChange(filePath);
					}
				}
			});
		});

		// Parse stderr which contains event information
		watchProcess.stderr.on('data', (data) => {
			const output = data.toString().trim();

			// Parse watchexec event output from stderr
			const lines = output.split('\n');
			lines.forEach((line) => {
				// Look for EVENT lines with file paths in stderr format
				if (line.includes('[EVENT') && line.includes('path=')) {
					const pathMatch = line.match(/path=([^\s]+)/);
					if (pathMatch && pathMatch[1]) {
						const filePath = pathMatch[1];
						this.handleFileChange(filePath);
					}
				}
				// Don't show routine watchexec messages
				else if (
					output &&
					!line.includes('[EVENT') &&
					!line.includes('[Command was successful]') &&
					!line.includes('[Running:') &&
					!line.includes('echo file-changed') &&
					!line.includes('[Command exited with 0]') &&
					!line.trim() !== 'file-changed'
				) {
					console.error(`${this.colors.red}[watchexec ERROR]${this.colors.reset} ${line}`);
				}
			});
		});

		watchProcess.stderr.on('data', (data) => {
			const error = data.toString().trim();
			if (error) {
				console.error(`${this.colors.red}[watchexec ERROR]${this.colors.reset} ${error}`);
			}
		});

		watchProcess.on('close', (code) => {
			if (code !== 0) {
				console.error(`${this.colors.red}💥 Watchexec exited with code ${code}${this.colors.reset}`);
			}
		});

		this.watchProcess = watchProcess;
		return watchProcess;
	}

	// Cleanup khi thoát
	cleanup() {
		console.log(`${this.colors.yellow}\n🛑 Shutting down smart builder...${this.colors.reset}`);

		// Clear all debounce timeouts
		this.debounceTimeouts.forEach((timeout) => clearTimeout(timeout));
		this.debounceTimeouts.clear();

		if (this.watchProcess && !this.watchProcess.killed) {
			console.log(`${this.colors.yellow}🔪 Stopping watchexec...${this.colors.reset}`);
			this.watchProcess.kill('SIGTERM');

			setTimeout(() => {
				if (!this.watchProcess.killed) {
					this.watchProcess.kill('SIGKILL');
				}
			}, 2000);
		}

		console.log(`${this.colors.green}✅ Cleanup completed${this.colors.reset}`);
		process.exit(0);
	}
}

// Main execution
async function main() {
	const builder = new SmartWatchBuilder();

	// Handle termination signals
	process.on('SIGINT', () => {
		console.log('\n🔄 Received interrupt signal...');
		builder.cleanup();
	});

	process.on('SIGTERM', () => {
		console.log('\n🔄 Received termination signal...');
		builder.cleanup();
	});

	// Handle exceptions
	process.on('uncaughtException', (error) => {
		console.error(`💥 Uncaught exception: ${error.message}`);
		builder.cleanup();
	});

	process.on('unhandledRejection', (reason) => {
		console.error(`💥 Unhandled rejection: ${reason}`);
		builder.cleanup();
	});

	try {
		console.log(`${builder.colors.cyan}🚀 Starting SMART package build & watch process...${builder.colors.reset}`);
		console.log(
			`${builder.colors.magenta}🧠 Only rebuilds changed packages + their dependents!${builder.colors.reset}\n`
		);

		// Discover packages và build dependency map
		builder.discoverAllPackages();

		// Initial build all packages
		await builder.buildAllPackages();

		// Start smart file watcher
		builder.startWatchexec();

		console.log(`${builder.colors.green}🎉 Smart watcher ready!${builder.colors.reset}`);
		console.log(
			`${builder.colors.yellow}💡 Edit any file in packages/ → only affected packages rebuild${builder.colors.reset}`
		);
		console.log(`${builder.colors.cyan}🔄 Press Ctrl+C to stop${builder.colors.reset}\n`);

		// Keep process alive
		setInterval(() => {
			// Heartbeat
		}, 30000);
	} catch (error) {
		console.error(`💥 Error starting smart builder: ${error.message}`);
		builder.cleanup();
		process.exit(1);
	}
}

// Start the smart builder
main();
