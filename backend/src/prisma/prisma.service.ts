import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TenantContext } from '../tenant/tenant.context';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super();
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Permet d'obtenir un client Prisma "étendu" (Extended Client)
  // qui filtre automatiquement toutes les requêtes par le tenant_id courant.
  get extended() {
    return this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const tenantId = TenantContext.getTenantId();
            
            // La table Tenant elle-même n'a pas de tenantId comme clé étrangère
            const ignoredModels = ['Tenant'];

            if (tenantId && !ignoredModels.includes(model)) {
              const a = (args || {}) as any;

              // 1. Injections pour les lectures, mises à jour et suppressions
              if (['findUnique', 'findFirst', 'findMany', 'count', 'update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
                a.where = { ...a.where, tenantId };
              }
              // 2. Injections pour les créations
              else if (['create'].includes(operation)) {
                a.data = { ...a.data, tenantId };
              } else if (['createMany'].includes(operation)) {
                if (Array.isArray(a.data)) {
                  a.data = a.data.map((d: any) => ({ ...d, tenantId }));
                } else {
                  a.data = { ...a.data, tenantId };
                }
              }
              // 3. Injections pour Upsert
              else if (operation === 'upsert') {
                a.where = { ...a.where, tenantId };
                a.create = { ...a.create, tenantId };
              }

              return query(a);
            }

            return query(args);
          },
        },
      },
    });
  }
}
