import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContextData {
  tenantId: string;
}

export class TenantContext {
  private static als = new AsyncLocalStorage<TenantContextData>();

  /**
   * Exécute une fonction dans le contexte d'un tenant spécifique
   */
  static run(data: TenantContextData, callback: () => void) {
    this.als.run(data, callback);
  }

  /**
   * Récupère le tenant_id courant depuis n'importe où dans le code (sans avoir besoin de Request)
   */
  static getTenantId(): string | undefined {
    const store = this.als.getStore();
    return store?.tenantId;
  }
}
