require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const CountryModel = require('./country');
const MetadataModel = require('./metadata');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      connectTimeout: 60000
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 60000,
      idle: 10000
    }
  }
);

const Country = CountryModel(sequelize, DataTypes);
const Metadata = MetadataModel(sequelize, DataTypes);

module.exports = { sequelize, Country, Metadata };
