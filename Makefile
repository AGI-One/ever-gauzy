.PHONY: up release terminal format install tidy run build dbup dbdown rsdb dev test migrate prisma-generate prisma-migrate gen-type win-up win-release win-terminal win-format win-install win-tidy win-run win-build win-dbup win-dbdown win-rsdb win-dev win-prod

# ============================================================================
# LINUX/MACOS COMMANDS
# ============================================================================

up:
ifeq ($(MODE),prod)
	bash bin/up.sh prod
else ifeq ($(MODE),dev-build)
	bash bin/up.sh localbuild
else
	bash bin/up.sh local
endif

release:
	bash bin/release.sh

terminal:
	@echo "🚀 Connecting to application container..."
	@container=$$(docker ps -q -f name=gauzy-app); \
	if [ -z "$$container" ]; then \
		echo "❌ Application container not found! Please run 'make up' first."; \
		exit 1; \
	fi; \
	echo "✅ Found container: $$container"; \
	docker exec -it $$container zsh

format:
	@echo "🚀 Formatting TypeScript code..."
	@yarn format
	@echo "✅ TypeScript code formatting completed!"

install:
	yarn install

tidy: install
	yarn audit

run:
	yarn start:dev

build:
	mkdir -p dist
	yarn build

dev:
	yarn start:dev

prod:
	yarn start

dbdown:
	cd . && env -i PATH="$$PATH" HOME="$$HOME" docker compose -f ./docker-compose.infra.yml down && cd ..

dbup:
	cd . && env -i PATH="$$PATH" HOME="$$HOME" docker compose -f ./docker-compose.infra.yml up -d && cd ..

rsdb:
	@echo "⚠️  Resetting databases (deleting all data)..."
	make dbdown
	@echo "🗑️  Removing Docker volumes..."
	docker volume rm -f ever-gauzy_postgres_data 2>/dev/null || true
	docker volume rm -f ever-gauzy_redis_data 2>/dev/null || true
	docker volume rm -f ever-gauzy_minio_data 2>/dev/null || true
	docker volume rm -f ever-gauzy_cube_data 2>/dev/null || true
	docker volume rm -f ever-gauzy_jitsu_workspace 2>/dev/null || true
	docker volume rm -f ever-gauzy_opensearch-data 2>/dev/null || true
	@echo "🗑️  Cleaning up local data directories (keeping .gitkeep)..."
	find ./.deploy/redis/data -mindepth 1 ! -name '.gitkeep' -delete 2>/dev/null || true
	find ./.deploy/redis/jitsu_users_recognition/data -mindepth 1 ! -name '.gitkeep' -delete 2>/dev/null || true
	find ./.deploy/jitsu/configurator/data/logs -mindepth 1 ! -name '.gitkeep' -delete 2>/dev/null || true
	find ./.deploy/jitsu/server/data/logs -mindepth 1 ! -name '.gitkeep' -delete 2>/dev/null || true
	@echo "✅ Database volumes and data cleared."
	make dbup
	@echo "✅ Databases reset and restarted!"

# ============================================================================
# WINDOWS COMMANDS
# ============================================================================

win-up:
ifeq ($(MODE),prod)
	@bin\up.bat prod
else ifeq ($(MODE),dev-build)
	@bin\up.bat localbuild
else
	@bin\up.bat local
endif

win-release:
	@bin\release.bat

win-terminal:
	@echo 🚀 Connecting to application container...
	@powershell -Command "$$container = (docker ps -q -f name=gauzy-app | Select-Object -First 1); if ($$container) { docker exec -it $$container sh } else { Write-Host '❌ Application container not found! Please run make win-up first.' }"

win-format:
	@echo 🚀 Formatting TypeScript code...
	@yarn format
	@echo ✅ TypeScript code formatting completed!

win-install:
	@yarn install

win-tidy: win-install
	@yarn audit

win-run:
	@yarn start:dev

win-rsdb:
	@echo ⚠️  Resetting databases (deleting all data) - Windows...
	@$(MAKE) win-dbdown
	@echo 🗑️  Removing Docker volumes...
	@powershell -Command "docker volume rm -f ever-gauzy_postgres_data 2>$$null"
	@powershell -Command "docker volume rm -f ever-gauzy_redis_data 2>$$null"
	@powershell -Command "docker volume rm -f ever-gauzy_minio_data 2>$$null"
	@powershell -Command "docker volume rm -f ever-gauzy_cube_data 2>$$null"
	@powershell -Command "docker volume rm -f ever-gauzy_jitsu_workspace 2>$$null"
	@powershell -Command "docker volume rm -f ever-gauzy_opensearch-data 2>$$null"
	@echo 🗑️  Cleaning up local data directories (keeping .gitkeep)...
	@powershell -Command "if (Test-Path '.\.deploy\redis\data') { Get-ChildItem -Path '.\.deploy\redis\data' -Recurse | Where-Object { $$_.Name -ne '.gitkeep' } | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue }"
	@powershell -Command "if (Test-Path '.\.deploy\redis\jitsu_users_recognition\data') { Get-ChildItem -Path '.\.deploy\redis\jitsu_users_recognition\data' -Recurse | Where-Object { $$_.Name -ne '.gitkeep' } | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue }"
	@powershell -Command "if (Test-Path '.\.deploy\jitsu\configurator\data\logs') { Get-ChildItem -Path '.\.deploy\jitsu\configurator\data\logs' -Recurse | Where-Object { $$_.Name -ne '.gitkeep' } | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue }"
	@powershell -Command "if (Test-Path '.\.deploy\jitsu\server\data\logs') { Get-ChildItem -Path '.\.deploy\jitsu\server\data\logs' -Recurse | Where-Object { $$_.Name -ne '.gitkeep' } | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue }"
	@echo ✅ Database volumes and data cleared.
	@$(MAKE) win-dbup
	@echo ✅ Databases reset and restarted!

win-dbdown:
	@powershell -Command "Set-Location .; docker compose -f .\docker-compose.infra.yml down; Set-Location .."

win-dbup:
	@powershell -Command "Set-Location .; docker compose -f .\docker-compose.infra.yml up -d; Set-Location .."

win-build:
	@if not exist dist mkdir dist
	@yarn build

win-dev:
	@yarn start:dev

win-prod:
	@yarn start
