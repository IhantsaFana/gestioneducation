import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Reproduire la configuration de main.ts pour être fidèle à la réalité
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api/v1');
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/auth/login (POST)', () => {
    it('doit rejeter une requête avec un email inexistant (401 Unauthorized)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'fake@example.com', password: 'wrongpassword' })
        .expect(401);
    });

    it('doit valider le format de la requête (400 Bad Request si manquant)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'not-an-email' }) // Mot de passe manquant + email invalide
        .expect(400);
    });
  });
});
