const { spawn } = require('child_process');
const path = require('path');

/**
 * Script để start development mode với watch build
 * Chạy build:package:all:watch trong background, sau đó chạy các apps
 */

class DevStarter {
	constructor() {
		this.watchProcess = null;
		this.appProcesses = [];
		this.isWatchReady = false;
	}

	// Run build watch in background
	startBuildWatch() {
		process.stdout.write('🔄 Starting build watch for all packages...\n');

		const watchProcess = spawn('yarn', ['build:package:all:watch'], {
			cwd: path.join(__dirname, '..'),
			stdio: ['ignore', 'pipe', 'pipe'],
			detached: true, // Create new process group
			shell: true
		});

		this.watchProcess = watchProcess;

		let hasStartedBuilding = false;

		watchProcess.stdout.on('data', (data) => {
			const output = data.toString();

			// Forward all build watch output to main console
			process.stdout.write(output);

			// Check if build has started
			if (!hasStartedBuilding && (output.includes('Building') || output.includes('Starting'))) {
				hasStartedBuilding = true;
				process.stdout.write('📦 Build watch has started...\n');
			}

			// Check if any packages have finished building
			if (
				output.includes('Built') ||
				output.includes('Compilation complete') ||
				output.includes('Successfully compiled')
			) {
				if (!this.isWatchReady) {
					this.isWatchReady = true;
					process.stdout.write('✅ Build watch is ready, starting apps...\n\n');
					this.startApps();
				}
			}
		});

		watchProcess.stderr.on('data', (data) => {
			const error = data.toString();
			process.stderr.write(error);
		});

		watchProcess.on('close', (code) => {
			process.stdout.write(`[BUILD-WATCH] Process exited with code ${code}\n`);
		});

		// Fallback: if no ready signal after 15 seconds, start apps anyway
		setTimeout(() => {
			if (!this.isWatchReady) {
				process.stdout.write('⏰ Timeout: Starting apps after 15 seconds...\n\n');
				this.isWatchReady = true;
				this.startApps();
			}
		}, 15000);

		return watchProcess;
	}

	// Run apps after build watch is ready
	startApps() {
		const apps = process.argv.slice(2);

		if (apps.length === 0) {
			process.stdout.write('❌ No apps specified to run!\n');
			process.stdout.write('Usage: node start-dev.js "yarn start:api:dev" "yarn start:gauzy:dev"\n');
			process.exit(1);
		}

		process.stdout.write(`🚀 Starting ${apps.length} apps...\n\n`);

		apps.forEach((appCommand, index) => {
			const [command, ...args] = appCommand.split(' ');

			process.stdout.write(`📱 Starting app ${index + 1}: ${appCommand}\n`);

			const appProcess = spawn(command, args, {
				cwd: path.join(__dirname, '..'),
				stdio: 'inherit',
				detached: true, // Create new process group
				shell: true
			});

			appProcess.on('close', (code) => {
				process.stdout.write(`[APP ${index + 1}] Process exited with code ${code}\n`);
			});

			appProcess.on('error', (error) => {
				process.stderr.write(`[APP ${index + 1}] Error: ${error.message}\n`);
			});

			this.appProcesses.push(appProcess);
		});
	}

	// Cleanup when exiting
	cleanup() {
		process.stdout.write('\n🛑 Stopping all processes...\n');

		// Stop build watch process group
		if (this.watchProcess && !this.watchProcess.killed) {
			process.stdout.write('🔄 Stopping build watch...\n');
			try {
				// Kill the entire process group
				this.watchProcess.kill(-this.watchProcess.pid, 'SIGTERM');
			} catch (error) {
				// Fallback to regular kill
				this.watchProcess.kill('SIGTERM');
			}
		}

		// Stop all app process groups
		this.appProcesses.forEach((appProcess, index) => {
			if (!appProcess.killed) {
				process.stdout.write(`📱 Stopping app ${index + 1}...\n`);
				try {
					// Kill the entire process group
					appProcess.kill(-appProcess.pid, 'SIGTERM');
				} catch (error) {
					// Fallback to regular kill
					appProcess.kill('SIGTERM');
				}
			}
		});

		// Force kill after 2 seconds
		setTimeout(() => {
			if (this.watchProcess && !this.watchProcess.killed) {
				try {
					this.watchProcess.kill(-this.watchProcess.pid, 'SIGKILL');
				} catch (error) {
					this.watchProcess.kill('SIGKILL');
				}
			}

			this.appProcesses.forEach((process) => {
				if (!process.killed) {
					try {
						process.kill(-process.pid, 'SIGKILL');
					} catch (error) {
						process.kill('SIGKILL');
					}
				}
			});

			// Exit immediately after cleanup
			process.exit(0);
		}, 2000);
	}
}

// Main execution
async function main() {
	const starter = new DevStarter();

	// Handle stop signals more aggressively
	process.on('SIGINT', () => {
		process.stdout.write('\nReceived SIGINT, cleaning up...\n');
		starter.cleanup();
	});

	process.on('SIGTERM', () => {
		process.stdout.write('\nReceived SIGTERM, cleaning up...\n');
		starter.cleanup();
	});

	// Handle uncaught exceptions to ensure cleanup
	process.on('uncaughtException', (error) => {
		process.stderr.write('Uncaught exception: ' + error + '\n');
		starter.cleanup();
	});

	process.on('unhandledRejection', (reason, promise) => {
		process.stderr.write('Unhandled rejection: ' + reason + '\n');
		starter.cleanup();
	});

	try {
		starter.startBuildWatch();
	} catch (error) {
		process.stderr.write('❌ Error starting dev mode: ' + error + '\n');
		process.exit(1);
	}
}

main();
