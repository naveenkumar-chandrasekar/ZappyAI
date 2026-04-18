import { parsePhoneNumber } from 'libphonenumber-js'
import { sendMessage } from '../services/whatsapp.js'
import { processMessage } from '../services/registry.js'
import { User, Person, Conversation } from '../models/index.js'

function extractNationalNumber(waNumber) {
  try {
    const phone = parsePhoneNumber(`+${waNumber}`)
    return phone.nationalNumber
  } catch {
    return waNumber
  }
}

export async function verifyWebhook(request, reply) {
  const mode = request.query['hub.mode']
  const token = request.query['hub.verify_token']
  const challenge = request.query['hub.challenge']

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('[Webhook] WhatsApp webhook verified.')
    return reply.code(200).send(parseInt(challenge, 10))
  }

  return reply.code(403).send({ error: 'Forbidden' })
}

export async function handleWebhook(request, reply) {
  reply.code(200).send({ status: 'ok' })

  try {
    const messages = request.body?.entry?.[0]?.changes?.[0]?.value?.messages
    if (!messages?.length) return

    for (const msg of messages) {
      if (msg.type !== 'text') continue
      const waNumber = msg.from
      const senderMobile = extractNationalNumber(waNumber)
      const messageText = msg.text?.body?.trim()
      if (!senderMobile || !messageText) continue

      let user = await User.findOne({ where: { mobile_number: senderMobile } })

      if (!user) {
        user = await User.create({ mobile_number: senderMobile })
        await sendMessage(waNumber, "Hi! I'm Zappy, your personal AI assistant.\n\nWhat's your name?")
        continue
      }

      if (!user.name) {
        const GREETING_RE = /^(hi|hello|hey|hii|helo|howdy|greetings|sup|yo|good\s*(morning|afternoon|evening|day))[\s!?.]*$/i
        if (GREETING_RE.test(messageText.trim())) {
          await sendMessage(waNumber, "Hi there! 👋 I'm Zappy, your personal AI assistant.\n\nWhat's your name?")
          continue
        }
        const name = messageText.trim()
        await user.update({ name })
        await Person.findOrCreate({
          where: { user_id: user.id, is_owner: true },
          defaults: { name, birthday: null, priority: 'High', is_owner: true },
        })
        await sendMessage(waNumber, `Nice to meet you, ${name}! 🎉\n\nWhat's your birthday? (e.g. April 8, 2000)`)
        continue
      }

      const ownerPerson = await Person.findOne({ where: { user_id: user.id, is_owner: true } })
      if (ownerPerson && !ownerPerson.birthday) {
        const parsed = new Date(messageText.trim())
        if (isNaN(parsed.getTime())) {
          await sendMessage(waNumber, "I didn't catch that. Please enter your birthday like: April 8, 2000")
          continue
        }
        await ownerPerson.update({ birthday: parsed })
        await sendMessage(waNumber, `Got it! I'll remember that.\n\nI can help you manage tasks, contacts, notes, and reminders. Just tell me what you need!`)
        continue
      }

      const replyText = await processMessage(user.id, messageText)
      await Conversation.create({ user_id: user.id, role: 'user', message: messageText })
      await Conversation.create({ user_id: user.id, role: 'assistant', message: replyText })
      await sendMessage(waNumber, replyText)
    }
  } catch (err) {
    console.error('[Webhook] Error:', err.message)
  }
}
