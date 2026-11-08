---
id: ARC-001
type: arch
title: Arquitectura del catálogo
derives_from: [REQ-001, REQ-002, REQ-003]
stack_pack: nestjs-react@1
---
## Componentes
- api (NestJS): CRUD generado desde el IR; reglas de negocio sólo en `*.service.owned.ts`.
- web (React): pantalla SCR-001 sobre el cliente generado.
- db (Postgres): esquema Prisma generado desde el IR.

## Amenazas
- Exposición de PII: `supplierEmail` se excluye de respuestas y logs (modificador `pii`) y se borra al descontinuar (REQ-003).
- Entrada inválida: los DTOs Zod generados validan cada request.
- Secretos: sólo en `.env`, nunca en git ni en el sandbox.
- Sin autenticación: aceptado porque está fuera de alcance en BRF-001.

## Operación
- Servicios compose: api (healthcheck `/health`), web (`/`), db (`pg_isready`).
- Deploy: `make build && make up`.
- Rollback: `TAG=<sha anterior> make up`.
