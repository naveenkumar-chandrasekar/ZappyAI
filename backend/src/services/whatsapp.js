import axios from 'axios';

const BASE_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v19.0';
const IS_DEV = process.env.APP_MODE === 'development';

export async function sendMessage(to, text) {
  if (IS_DEV) {
    console.log(`[WhatsApp:mock] → ${to}\n${text}\n`);
    return { mock: true };
  }

  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const token = process.env.WHATSAPP_TOKEN;

  if (!phoneId || !token) {
    console.warn('[WhatsApp] WHATSAPP_PHONE_ID or WHATSAPP_TOKEN not set. Skipping send.');
    return null;
  }

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { body: text },
  };

  try {
    const response = await axios.post(
      `${BASE_URL}/${phoneId}/messages`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      }
    );
    return response.data;
  } catch (err) {
    console.error('[WhatsApp] Failed to send message:', err.response?.data || err.message);
    throw err;
  }
}

export async function sendOTP(mobile, code) {
  const text = `Your Zappy verification code is: *${code}*\n\nThis code expires in 10 minutes. Do not share it with anyone.`;
  return sendMessage(mobile, text);
}
