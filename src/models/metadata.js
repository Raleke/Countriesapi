const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Metadata = sequelize.define('Metadata', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    key: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Metadata key cannot be empty' },
        len: {
          args: [1, 128],
          msg: 'Metadata key must be between 1 and 128 characters'
        }
      }
    },
    value: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      validate: {
        notEmpty: {
          msg: 'Metadata value cannot be an empty string'
        }
      }
    }
  },
  {
    tableName: 'metadata',
    timestamps: true,
    underscored: false,
    indexes: [
      {
        unique: true,
        fields: ['key']
      }
    ]
  });

  return Metadata;
};
