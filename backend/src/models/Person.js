import { DataTypes } from 'sequelize'
import { sequelize } from '../db/index.js'

const Person = sequelize.define('Person', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.TEXT, allowNull: false },
  birthday: { type: DataTypes.DATEONLY },
  priority: { type: DataTypes.ENUM('High', 'Medium', 'Low'), defaultValue: 'Medium' },
  custom_fields: { type: DataTypes.JSONB, defaultValue: {} },
  is_owner: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'persons', timestamps: true, createdAt: 'created_at', updatedAt: false })

export default Person
