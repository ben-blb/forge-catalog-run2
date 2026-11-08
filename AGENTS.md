# AGENTS.md

- Capas: `controller → service → repository`. La lógica de negocio va sólo en `*.service.owned.ts`.
- Nunca edites `*.generated.*`: los escribe `make gen`.
- Inyección de dependencias en Nest: usa `@Inject(Clase)` explícito en el constructor.
- Antes de terminar, corre `make lint test`.
- `make gen` regenera todo `*.generated.*` desde `brain/spec/ir.yaml`; nunca toca un `*.owned.*` existente.
- Si agregar una action al IR rompe `tsc` en un `*.service.owned.ts` (método `abstract` sin implementar), implementarla es tu trabajo.
