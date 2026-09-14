import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TenantResolverMiddleware } from './common/middleware/tenant-resolver.middleware';
import { PlatformDatabaseModule } from './database/platform/platform-database.module';
import { TenantDatabaseModule } from './database/tenant/tenant-database.module';
import { HealthController } from './health.controller';
import { AuthController } from './modules/auth/auth.controller';
import { AuthModule } from './modules/auth/auth.module';
import { CartController } from './modules/cart/cart.controller';
import { CartModule } from './modules/cart/cart.module';
import { CouponAdminController } from './modules/cart/coupon-admin.controller';
import { CatalogAdminController } from './modules/catalog/catalog-admin.controller';
import { CatalogModule } from './modules/catalog/catalog.module';
import { StorefrontCatalogController } from './modules/catalog/storefront-catalog.controller';
import { CustomerAuthController } from './modules/customers/customer-auth.controller';
import { CustomerMeController } from './modules/customers/customer-me.controller';
import { CustomersModule } from './modules/customers/customers.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { MeController } from './modules/me/me.controller';
import { MeModule } from './modules/me/me.module';
import { OrdersAdminController } from './modules/orders/orders-admin.controller';
import { OrdersController } from './modules/orders/orders.controller';
import { OrdersModule } from './modules/orders/orders.module';
import { TenantModule } from './modules/tenant/tenant.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PlatformDatabaseModule,
    TenantDatabaseModule,
    TenantModule,
    AuthModule,
    MeModule,
    CustomersModule,
    CatalogModule,
    InventoryModule,
    CartModule,
    OrdersModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  // Tenant resolution applies to every tenant-scoped route (staff and
  // storefront/customer alike) - see design.md's "Tenant-resolution
  // middleware now covers the new controllers" decision. Tenant
  // registration/status remain the only platform-level exemption.
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TenantResolverMiddleware)
      .forRoutes(
        AuthController,
        MeController,
        CustomerAuthController,
        CustomerMeController,
        CatalogAdminController,
        StorefrontCatalogController,
        CartController,
        CouponAdminController,
        OrdersController,
        OrdersAdminController,
      );
  }
}
