import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Docs are served whenever NODE_ENV !== 'production', mirroring how
 * TenantResolverMiddleware's x-tenant-slug dev-override header is already
 * gated (design.md: "Gate docs on NODE_ENV, not a separate feature flag").
 * ENABLE_API_DOCS=true forces them on even under a production config.
 */
export function setupApiDocs(app: INestApplication): void {
  const explicitlyEnabled = process.env.ENABLE_API_DOCS === 'true';
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && !explicitlyEnabled) {
    return;
  }

  const config = new DocumentBuilder()
    .setTitle('Ecommerce SaaS API')
    .setDescription(
      'Multi-tenant ecommerce SaaS backend. Tenant-scoped routes require either a real ' +
        '"<slug>.<root domain>" Host header, or - outside production - the x-tenant-slug ' +
        'override header. Authenticated routes require a Bearer access token whose tenantId ' +
        'matches the resolved tenant.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}
