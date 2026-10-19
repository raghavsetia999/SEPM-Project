import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'

describe('health API', () => {
  it('returns service health without requiring MongoDB', async () => {
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      success: true,
      data: { status: 'ok', service: 'cp-performance-analyzer-api' },
    })
  })

  it('returns a stable not-found error envelope', async () => {
    const response = await request(app).get('/api/does-not-exist')

    expect(response.status).toBe(404)
    expect(response.body.error.code).toBe('ROUTE_NOT_FOUND')
  })

  it('rejects invalid registration input before database access', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'R',
      email: 'not-an-email',
      password: 'short',
    })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('reports whether Google OAuth credentials are configured', async () => {
    const response = await request(app).get('/api/auth/google/status')

    expect(response.status).toBe(200)
    expect(response.body.data.configured).toBeTypeOf('boolean')
  })

  it('rejects an invalid forgot-password email before database access', async () => {
    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'not-an-email' })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('rejects an invalid reset-password payload before database access', async () => {
    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'short', password: 'short' })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })
})
