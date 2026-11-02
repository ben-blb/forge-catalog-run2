# scaffold.sh reemplaza forge-catalog-run2 (nombre de las imágenes Docker); no depende del nombre de la carpeta.
PROJECT ?= forge-catalog-run2
TAG ?= $(shell git rev-parse --short HEAD)
export PROJECT TAG
# Compose nombra el proyecto por la carpeta; el deploy corre desde un worktree, así que se fija aquí.
export COMPOSE_PROJECT_NAME := $(PROJECT)

COMMA := ,
SEMGREP = docker run --rm -v $(CURDIR):/src -w /src semgrep/semgrep:1.183.0
TRIVY = docker run --rm -v $(CURDIR):/src -w /src -v trivy-cache:/root/.cache -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:0.76.1

# Reporte SARIF con todo (incluye sin fix) y compuerta sólo con HIGH/CRITICAL que tienen fix.
define trivy_scan
$(TRIVY) $(1) --severity HIGH,CRITICAL --format sarif --output .reports/trivy-$(2).sarif $(3)
$(TRIVY) $(1) --severity HIGH,CRITICAL --ignore-unfixed --exit-code 1 --quiet $(3)
endef

.PHONY: gen build lint test scan up

# Las dependencias se instalan solas cuando falta node_modules o cambia el lockfile.
node_modules: pnpm-lock.yaml
	pnpm install --frozen-lockfile
	@touch node_modules

gen lint test: node_modules

# El cliente de Prisma está ignorado por git: en un clon limpio lo crea este target, no `make gen`.
# Regla del pack: todo target funciona en un clon limpio.
apps/api/generated/prisma: apps/api/prisma/*.prisma node_modules
	pnpm --filter api exec prisma generate
	@touch $@

lint test: apps/api/generated/prisma

gen:
	node tools/gen/index.ts
	pnpm --filter api exec prisma generate

build:
	docker build -f apps/api/Dockerfile -t $(PROJECT)-api:$(TAG) .
	docker build -f apps/web/Dockerfile -t $(PROJECT)-web:$(TAG) .

lint:
	pnpm exec biome check .
	pnpm -r typecheck
	pnpm exec tsc -p tools/gen

test:
	pnpm exec vitest run $(if $(T),-t "$(T)")

scan:
	@mkdir -p .reports
	$(SEMGREP) semgrep scan --config p/default --severity ERROR --error --sarif --output .reports/semgrep.sarif
	$(call trivy_scan,fs --scanners vuln$(COMMA)secret,fs,.)
	$(call trivy_scan,image,api,$(PROJECT)-api:$(TAG))
	$(call trivy_scan,image,web,$(PROJECT)-web:$(TAG))

up:
	docker compose up -d --wait
