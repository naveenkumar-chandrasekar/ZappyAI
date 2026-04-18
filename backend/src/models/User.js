import { DataTypes } from 'sequelize'
import { sequelize } from '../db/index.js'

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  mobile_number: { type: DataTypes.TEXT, allowNull: false, unique: true },
  name: { type: DataTypes.TEXT },
  settings: { type: DataTypes.JSONB, defaultValue: {} },
}, { tableName: 'users', timestamps: true, createdAt: 'created_at', updatedAt: false })

export default User
