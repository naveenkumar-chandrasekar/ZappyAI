import { DataTypes } from 'sequelize'
import { sequelize } from '../db/index.js'

const Reminder = sequelize.define('Reminder', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  task_id: { type: DataTypes.UUID },
  type: { type: DataTypes.TEXT, allowNull: false },
  scheduled_at: { type: DataTypes.DATE, allowNull: false },
  sent: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'reminders', timestamps: true, createdAt: 'created_at', updatedAt: false })

export default Reminder
