import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContext } from './tenant.context';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Les routes publiques (ex: login, signup du superadmin) n'ont pas besoin de tenant
    const publicRoutes = ['/api/v1/auth/login', '/api/v1/auth/forgot-password'];
    if (publicRoutes.includes(req.baseUrl) || req.baseUrl.startsWith('/api/v1/admin/tenants')) {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Pour le développement initial, si pas de token, on laisse passer sans tenant.
      // Dans un environnement strict, on pourrait rejeter ici, mais le AuthGuard le fera.
      return next();
    }

    const token = authHeader.split(' ')[1];
    try {
      // On décode simplement le token pour extraire le tenantId. 
      // La vérification de la signature (sécurité) sera faite par le JwtAuthGuard plus tard.
      const decoded = jwt.decode(token) as { tenantId?: string } | null;

      if (decoded && decoded.tenantId) {
        // Exécute la suite de la requête (next) DANS le scope du TenantContext
        TenantContext.run({ tenantId: decoded.tenantId }, () => {
          next();
        });
      } else {
        // Pas de tenantId dans le token
        next();
      }
    } catch (error) {
      next();
    }
  }
}
