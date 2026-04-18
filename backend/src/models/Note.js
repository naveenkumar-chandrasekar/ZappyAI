import { DataTypes } from 'sequelize'
import { sequelize } from '../db/index.js'

const Note = sequelize.define('Note', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  keywords: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] },
}, { tableName: 'notes', timestamps: true, createdAt: 'created_at', updatedAt: false })

export default Note
