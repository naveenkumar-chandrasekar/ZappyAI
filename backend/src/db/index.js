import { Sequelize } from 'sequelize'
import 'dotenv/config'

export const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/zappy', {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: { max: 20, idle: 30000, acquire: 2000 },
})
