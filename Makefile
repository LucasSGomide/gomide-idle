.DEFAULT_GOAL := help

.PHONY: help install env dev \
        db-up db-down db-reset db-studio migrate migrate-generate \
        lint fmt fmt-check typecheck build depcruise gen-open-api generate \
        test test-unit test-integration check clean

help:  ## print this help
	@grep -hE '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

## --- setup ---------------------------------------------------------------

install:  ## install every workspace dependency (pnpm)
	pnpm install

env:  ## create .env from .env.example if it does not exist yet
	test -f .env || cp .env.example .env

## --- develop -------------------------------------------------------------

dev:  ## start Postgres, then run the API in watch mode
	docker compose up -d --wait postgres
	pnpm --filter @gomide/api dev

## --- database ------------------------------------------------------------

db-up:  ## start the local Postgres container
	docker compose up -d --wait postgres

db-down:  ## stop the local Postgres container (keeps its data volume)
	docker compose down

db-reset:  ## drop the Postgres volume, recreate it and re-apply migrations
	docker compose down -v
	docker compose up -d --wait postgres
	$(MAKE) migrate

db-studio:  ## open drizzle-kit studio against the local database
	pnpm --filter @gomide/api exec drizzle-kit studio

migrate:  ## apply committed migrations to DATABASE_URL
	pnpm --filter @gomide/api db:migrate

migrate-generate:  ## generate a new migration from schema changes
	pnpm --filter @gomide/api db:generate

## --- quality -------------------------------------------------------------

lint:  ## run oxlint over every package
	pnpm lint

fmt:  ## format the whole repo with Prettier, writing changes
	pnpm format

fmt-check:  ## fail if any file is not Prettier-formatted
	pnpm format:check

typecheck:  ## type-check every package
	pnpm -r typecheck

build:  ## build every package
	pnpm -r build

depcruise:  ## check dependency boundaries (dependency-cruiser, api + web)
	pnpm depcruise

gen-open-api:  ## regenerate apps/api/openapi.json from the running contract
	pnpm --filter @gomide/api generate:openapi

generate:  ## regenerate every generated file (OpenAPI, theme, route tree, Orval client)
	pnpm generate

## --- test ----------------------------------------------------------------

test:  ## run every package's tests (Jest unit + Postgres integration)
	pnpm -r test

test-unit:  ## run only the API unit test project
	pnpm --filter @gomide/api test:unit

test-integration:  ## run only the API Postgres integration test project
	pnpm --filter @gomide/api test:integration

## --- gates ---------------------------------------------------------------

check: lint fmt-check typecheck depcruise test  ## run the full CI gate locally
	$(MAKE) generate
	git diff --exit-code \
		apps/api/openapi.json \
		apps/web/src/theme.css \
		apps/web/src/theme.ts \
		apps/web/src/routeTree.gen.ts \
		apps/web/src/lib/api/generated

clean:  ## remove build output, coverage and tsbuildinfo (keeps node_modules)
	pnpm -r exec -- rm -rf dist coverage
	rm -rf coverage
	find . -name '*.tsbuildinfo' -not -path '*/node_modules/*' -delete

# --- msg-roadmap:start
.PHONY: roadmap-sync roadmap-check

roadmap-sync:  ## recompute every derived status and table under docs/
	node scripts/roadmap-sync.mjs

roadmap-check:  ## fail on a stale table, a bad dependency, or a missing project.yml path
	node scripts/roadmap-sync.mjs --check
# --- msg-roadmap:end
