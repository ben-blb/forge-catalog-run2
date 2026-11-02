import { ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { HealthController } from './health.controller';
import type { PrismaService } from './prisma.service';

const withDb = (query: () => Promise<unknown>) =>
  new HealthController({ $queryRaw: query } as unknown as PrismaService);

describe('GET /health', () => {
  it('responde ok con el sha cuando la db contesta', async () => {
    process.env.GIT_SHA = 'abc1234';
    await expect(
      withDb(async () => [{ '?column?': 1 }]).check(),
    ).resolves.toEqual({
      status: 'ok',
      sha: 'abc1234',
    });
  });

  it('responde 503 cuando la db falla', async () => {
    const down = withDb(async () => {
      throw new Error('db down');
    });
    await expect(down.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
