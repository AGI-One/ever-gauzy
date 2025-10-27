.PHONY: up release terminal format install tidy run build dbup dbdown rsdb dev test migrate prisma-generate prisma-migrate gen-type dbup dbdown rsdb

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
	make dbdown && sudo rm -rf ./mssql && sudo rm -rf ./redis && sudo rm -rf ./azurite && make dbup
