import { DataTypes } from 'sequelize'
import { sequelize } from '../db/index.js'

const Task = sequelize.define('Task', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  person_id: { type: DataTypes.UUID },
  title: { type: DataTypes.TEXT, allowNull: false },
  description: { type: DataTypes.TEXT },
  due_at: { type: DataTypes.DATE },
  completed: { type: DataTypes.BOOLEAN, defaultValue: false },
  status: { type: DataTypes.TEXT, defaultValue: 'Pending', validate: { isIn: [['Pending', 'Completed']] } },
}, { tableName: 'tasks', timestamps: true, createdAt: 'created_at', updatedAt: false })

Task.addHook('beforeSave', (task) => {
  if (task.changed('status')) {
    task.completed = task.status === 'Completed'
  } else if (task.changed('completed')) {
    task.status = task.completed ? 'Completed' : 'Pending'
  }
})

export default Task
