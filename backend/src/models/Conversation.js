import { DataTypes } from 'sequelize'
import { sequelize } from '../db/index.js'

const Conversation = sequelize.define('Conversation', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  role: { type: DataTypes.ENUM('user', 'assistant'), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
}, { tableName: 'conversations', timestamps: true, createdAt: 'created_at', updatedAt: false })

export default Conversation
