import User from './User.js'
import Person from './Person.js'
import Task from './Task.js'
import Note from './Note.js'
import Conversation from './Conversation.js'
import OtpCode from './OtpCode.js'
import Reminder from './Reminder.js'

User.hasMany(Person, { foreignKey: 'user_id', onDelete: 'CASCADE' })
Person.belongsTo(User, { foreignKey: 'user_id' })

User.hasMany(Task, { foreignKey: 'user_id', onDelete: 'CASCADE' })
Task.belongsTo(User, { foreignKey: 'user_id' })

Person.hasMany(Task, { foreignKey: 'person_id', onDelete: 'SET NULL' })
Task.belongsTo(Person, { foreignKey: 'person_id' })

User.hasMany(Note, { foreignKey: 'user_id', onDelete: 'CASCADE' })
Note.belongsTo(User, { foreignKey: 'user_id' })

User.hasMany(Conversation, { foreignKey: 'user_id', onDelete: 'CASCADE' })
Conversation.belongsTo(User, { foreignKey: 'user_id' })

User.hasMany(Reminder, { foreignKey: 'user_id', onDelete: 'CASCADE' })
Reminder.belongsTo(User, { foreignKey: 'user_id' })

Task.hasMany(Reminder, { foreignKey: 'task_id', onDelete: 'SET NULL' })
Reminder.belongsTo(Task, { foreignKey: 'task_id' })

export { User, Person, Task, Note, Conversation, OtpCode, Reminder }
