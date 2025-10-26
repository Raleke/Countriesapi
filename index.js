require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const { sequelize, Country, Metadata } = require('./src/models'); // adjust path
const countriesRouter = require('./src/routes/countries');

const app = express();
app.use(express.json());
app.use('/countries', countriesRouter);
app.get('/status', async (req, res) => {
  try {
    const totalCountries = await Country.count();
    const metadata = await Metadata.findOne({ where: { key: 'last_refreshed_at' } });

    res.json({
      total_countries: totalCountries,
      last_refreshed_at: metadata ? metadata.value : null
    });
  } catch (error) {
    console.error('Error fetching status:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
const cacheDir = path.join(__dirname, 'cache');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
  console.log('Created cache directory');
}

(async () => {
  try {
    console.log('Attempting to connect to database...');
    await sequelize.authenticate();
    console.log(' Database connection established successfully.');
    await sequelize.sync({ alter: true });
    console.log(' Tables synced successfully.');

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
} catch (error) {
    console.error(' Unable to start server:', error.message);
    process.exit(1);
  }
})();