export const TENANT_SLUG_HEADER = {
  name: 'x-tenant-slug',
  description:
    'Dev-only tenant override, used in place of a real "<slug>.<root domain>" Host - see ' +
    'the tenant-resolver spec. Ignored outside non-production environments.',
  required: false,
};
