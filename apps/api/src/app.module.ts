import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TenantResolverMiddleware } from './common/middleware/tenant-resolver.middleware';
import { PlatformDatabaseModule } from './database/platform/platform-database.module';
import { TenantDatabaseModule } from './database/tenant/tenant-database.module';
import { HealthController } from './health.controller';
import { AuthController } from './modules/auth/auth.controller';
import { AuthModule } from './modules/auth/auth.module';
import { MeController } from './modules/me/me.controller';
import { MeModule } from './modules/me/me.module';
import { TenantModule } from './modules/tenant/tenant.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PlatformDatabaseModule,
    TenantDatabaseModule,
    TenantModule,
    AuthModule,
    MeModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  // Tenant resolution only applies to tenant-scoped routes (auth, /me) - see
  // design.md's "Tenant resolution middleware is scoped to tenant-facing
  // routes only" decision. Tenant registration/status stay platform-level.
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantResolverMiddleware).forRoutes(AuthController, MeController);
  }
}
