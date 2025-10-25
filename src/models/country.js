const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Country = sequelize.define('Country', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Country name cannot be empty' },
        len: {
          args: [2, 255],
          msg: 'Country name must be between 2 and 255 characters'
        }
      }
    },
    capital: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    region: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    population: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      validate: {
        isInt: { msg: 'Population must be an integer value' },
        min: { args: [0], msg: 'Population cannot be negative' }
      }
    },
    currency_code: {
      type: DataTypes.STRING(16),
      allowNull: true,
      validate: {
        len: {
          args: [2, 16],
          msg: 'Currency code must be between 2 and 16 characters'
        }
      }
    },
    exchange_rate: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'Exchange rate must be a positive number'
        }
      }
    },
    estimated_gdp: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'Estimated GDP cannot be negative' }
      }
    },
    flag_url: {
      type: DataTypes.STRING(1024),
      allowNull: true,
      validate: {
        isUrl: { msg: 'Flag URL must be a valid URL' }
      }
    },
    last_refreshed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: 'countries',
    timestamps: true,           
    underscored: true,           
    indexes: [
      { fields: ['region'] },
      { unique: true, fields: ['name'] }
    ],
    hooks: {
      beforeUpdate: (country) => {
        country.last_refreshed_at = new Date();
      }
    }
  });

  return Country;
};
