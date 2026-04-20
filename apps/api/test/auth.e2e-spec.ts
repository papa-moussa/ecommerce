import { type INestApplication } from '@nestjs/common';
import request from 'supertest';

import { API, createTestApp } from './test-app.helper';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let refreshCookie: string;

  beforeAll(async () => {
    app = await createTestApp();
  }, 30000);

  afterAll(async () => {
    await app.close();
  }, 10000);

  const email = `e2e_${Date.now()}@test.com`;
  const password = 'TestPass1234!';

  it('POST /auth/register — creates user and returns access token', async () => {
    const res = await request(app.getHttpServer())
      .post(`${API}/auth/register`)
      .send({ email, password, firstName: 'E2E', lastName: 'User' })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe(email);
    expect(res.body.user).not.toHaveProperty('passwordHash');

    accessToken = res.body.accessToken as string;
    const cookies = res.headers['set-cookie'] as string[] | string;
    refreshCookie = Array.isArray(cookies) ? cookies[0]! : cookies;
    expect(refreshCookie).toMatch(/refresh_token=/);
    expect(refreshCookie).toMatch(/HttpOnly/i);
  });

  it('POST /auth/login — returns tokens for valid credentials', async () => {
    const res = await request(app.getHttpServer())
      .post(`${API}/auth/login`)
      .send({ email, password })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    accessToken = res.body.accessToken as string;
    const cookies = res.headers['set-cookie'] as string[] | string;
    refreshCookie = Array.isArray(cookies) ? cookies[0]! : cookies;
  });

  it('POST /auth/login — rejects invalid password with 401', async () => {
    await request(app.getHttpServer())
      .post(`${API}/auth/login`)
      .send({ email, password: 'WrongPass99!' })
      .expect(401);
  });

  it('GET /auth/me — returns current user when authenticated', async () => {
    const res = await request(app.getHttpServer())
      .get(`${API}/auth/me`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.email).toBe(email);
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('GET /auth/me — returns 401 without token', async () => {
    await request(app.getHttpServer()).get(`${API}/auth/me`).expect(401);
  });

  it('POST /auth/refresh — rotates refresh token', async () => {
    const res = await request(app.getHttpServer())
      .post(`${API}/auth/refresh`)
      .set('Cookie', refreshCookie)
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    const cookies = res.headers['set-cookie'] as string[] | string;
    const newCookie = Array.isArray(cookies) ? cookies[0]! : cookies;
    expect(newCookie).toMatch(/refresh_token=/);
    expect(newCookie).not.toBe(refreshCookie);

    accessToken = res.body.accessToken as string;
    refreshCookie = newCookie;
  });

  it('POST /auth/logout — revokes token and clears cookie', async () => {
    await request(app.getHttpServer())
      .post(`${API}/auth/logout`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', refreshCookie)
      .expect(204);
  });

  it('POST /auth/refresh — fails after logout', async () => {
    await request(app.getHttpServer())
      .post(`${API}/auth/refresh`)
      .set('Cookie', refreshCookie)
      .expect(401);
  });
});
