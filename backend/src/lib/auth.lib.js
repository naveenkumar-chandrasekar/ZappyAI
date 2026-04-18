import { Op } from 'sequelize'
import { OtpCode, User, Person } from '../models/index.js'

export async function createOtp(mobile_number) {
  const code = String(Math.floor(100000 + Math.random() * 900000))
  const expires_at = new Date(Date.now() + 10 * 60 * 1000)
  await OtpCode.create({ mobile_number, code, expires_at })
  return code
}

export async function verifyOtp(mobile_number, code) {
  const otp = await OtpCode.findOne({
    where: {
      mobile_number,
      code,
      used: false,
      expires_at: { [Op.gt]: new Date() },
    },
    order: [['created_at', 'DESC']],
  })
  if (!otp) return null
  await otp.update({ used: true })
  return otp
}

export async function findOrCreateUser(mobile_number, name, birthday) {
  let user = await User.findOne({ where: { mobile_number } })
  let is_new_user = false

  if (!user) {
    is_new_user = true
    user = await User.create({ mobile_number, name: name || null })
    const personName = name || mobile_number
    await Person.create({
      user_id: user.id,
      name: personName,
      birthday: birthday || null,
      priority: 'High',
      is_owner: true,
    })
  } else if (name && !user.name) {
    await user.update({ name })
    await Person.update(
      { name },
      { where: { user_id: user.id, is_owner: true } }
    )
    user.name = name
  }

  return { user, is_new_user }
}
