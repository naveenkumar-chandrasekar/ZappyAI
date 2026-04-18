import { DataTypes } from 'sequelize'
import { sequelize } from '../db/index.js'

const OtpCode = sequelize.define('OtpCode', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  mobile_number: { type: DataTypes.TEXT, allowNull: false },
  code: { type: DataTypes.TEXT, allowNull: false },
  expires_at: { type: DataTypes.DATE, allowNull: false },
  used: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'otp_codes', timestamps: true, createdAt: 'created_at', updatedAt: false })

export default OtpCode
