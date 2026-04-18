import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { buildTestApp } from './helpers.js'

describe('WhatsApp Webhook', () => {
  let app, cleanup

  beforeEach(async () => {
    ;({ app, cleanup } = await buildTestApp())
    process.env.WHATSAPP_VERIFY_TOKEN = 'test-verify-token'
  })

  afterEach(() => cleanup())

  describe('GET /api/v1/webhooks/whatsapp (verification)', () => {
    test('returns challenge when verify token matches', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=test-verify-token&hub.challenge=12345',
      })
      assert.equal(res.statusCode, 200)
      assert.equal(res.body, '12345')
    })

    test('returns 403 when verify token does not match', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong-token&hub.challenge=12345',
      })
      assert.equal(res.statusCode, 403)
    })

    test('returns 403 when hub.mode is not subscribe', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/webhooks/whatsapp?hub.mode=unsubscribe&hub.verify_token=test-verify-token&hub.challenge=12345',
      })
      assert.equal(res.statusCode, 403)
    })

    test('returns 403 when all parameters are missing', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/webhooks/whatsapp' })
      assert.equal(res.statusCode, 403)
    })
  })

  describe('POST /api/v1/webhooks/whatsapp (incoming messages)', () => {
    test('returns 200 immediately for valid text message', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/webhooks/whatsapp',
        payload: {
          object: 'whatsapp_business_account',
          entry: [{ changes: [{ value: { messages: [{ from: '+19995550001', text: { body: 'Hello Zappy' }, type: 'text' }] } }] }],
        },
      })
      assert.equal(res.statusCode, 200)
    })

    test('returns 200 for empty entry array', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/webhooks/whatsapp',
        payload: { object: 'whatsapp_business_account', entry: [] },
      })
      assert.equal(res.statusCode, 200)
    })

    test('returns 200 for status update events (no messages)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/webhooks/whatsapp',
        payload: {
          object: 'whatsapp_business_account',
          entry: [{ changes: [{ value: { statuses: [{ id: 'msg-id', status: 'delivered' }] } }] }],
        },
      })
      assert.equal(res.statusCode, 200)
    })

    test('returns 200 for non-text message types', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/webhooks/whatsapp',
        payload: {
          object: 'whatsapp_business_account',
          entry: [{ changes: [{ value: { messages: [{ from: '+1999', type: 'image', image: { id: 'img-id' } }] } }] }],
        },
      })
      assert.equal(res.statusCode, 200)
    })

    test('returns 200 for malformed body', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/webhooks/whatsapp',
        payload: { unexpected: 'payload' },
      })
      assert.equal(res.statusCode, 200)
    })
  })
})
