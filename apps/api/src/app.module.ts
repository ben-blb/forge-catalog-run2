import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { modules } from './modules.generated';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule, ...modules],
  controllers: [HealthController],
})
export class AppModule {}
