const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { Op, fn, col } = require('sequelize');
const { Country, Metadata, sequelize } = require('../models');
const { generateSummaryImage } = require('../../utils/image');

const COUNTRIES_API =
  'https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies';
const RATES_API = 'https://open.er-api.com/v6/latest/USD';

const EXTERNAL_TIMEOUT = parseInt(process.env.EXTERNAL_TIMEOUT_MS || '10000', 10);
const randMultiplier = () =>
  Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000;

exports.refresh = async (req, res) => {
  try {
    const axiosConfig = { timeout: EXTERNAL_TIMEOUT };

    let [countriesResp, ratesResp] = await Promise.allSettled([
      axios.get(COUNTRIES_API, axiosConfig),
      axios.get(RATES_API, axiosConfig),
    ]);

    if (
      countriesResp.status !== 'fulfilled' ||
      ratesResp.status !== 'fulfilled'
    ) {
      return res.status(503).json({
        error: 'External data source unavailable',
        details: 'Could not fetch data from [API name]',
      });
    }

    const countriesData = countriesResp.value.data;
    const ratesData = ratesResp.value.data;

    if (!Array.isArray(countriesData) || !ratesData?.rates) {
      return res.status(503).json({
        error: 'External data source unavailable',
        details: 'External API returned invalid data',
      });
    }
    const now = new Date();
    const ratesMap = ratesData.rates;

    const upsertList = countriesData.map((country) => {
      const population = Number.isFinite(country.population)
        ? country.population
        : 0;
      let currency_code = null;
      let exchange_rate = null;
      let estimated_gdp = 0;

      if (Array.isArray(country.currencies) && country.currencies.length > 0) {
        currency_code = country.currencies[0].code || null;
        if (currency_code && ratesMap[currency_code]) {
          exchange_rate = ratesMap[currency_code];
          estimated_gdp =
            exchange_rate > 0
              ? (population * randMultiplier()) / exchange_rate
              : 0;
        } else {
          exchange_rate = null;
          estimated_gdp = 0;
        }
      }
      if (!currency_code) {
        estimated_gdp = 0;
      }

      return {
        name: country.name,
        capital: country.capital || null,
        region: country.region || null,
        population,
        currency_code,
        exchange_rate,
        estimated_gdp,
        flag_url: country.flag || null,
        last_refreshed_at: now,
      };
    });

    await sequelize.transaction(async (t) => {
      for (const c of upsertList) {

        if (!c.name || !c.population || !c.currency_code) continue;

        const existing = await Country.findOne({
          where: sequelize.where(
            fn('lower', col('name')),
            fn('lower', c.name)
          ),
          transaction: t,
        });
        if (existing) {
          await existing.update(c, { transaction: t });
        } else {
          await Country.create(c, { transaction: t });
        }
      }
      await Metadata.upsert(
        { key: 'last_refreshed_at', value: now.toISOString() },
        { transaction: t }
      );
    });

    // Image generation removed from refresh; now done on-demand in getImage

    return res.json({ success: true, refreshed_at: now.toISOString() });
  } catch (err) {
    console.error('Refresh handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { region, currency, sort } = req.query;
    const where = {};
    if (region) where.region = region;
    if (currency) where.currency_code = currency;
    const order = [];
    if (sort === 'gdp_desc') order.push(['estimated_gdp', 'DESC']);
    const countries = await Country.findAll({ where, order });
    const out = countries.map((c) => ({
      id: c.id,
      name: c.name,
      capital: c.capital,
      region: c.region,
      population: Number(c.population),
      currency_code: c.currency_code,
      exchange_rate: c.exchange_rate,
      estimated_gdp: Number(c.estimated_gdp),
      flag_url: c.flag_url,
      last_refreshed_at: c.last_refreshed_at?.toISOString() || null,
    }));
    return res.json(out);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const { name } = req.params;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const country = await Country.findOne({
      where: sequelize.where(fn('lower', col('name')), fn('lower', name)),
    });
    if (!country)
      return res.status(404).json({ error: 'Country not found' });
    return res.json({
      id: country.id,
      name: country.name,
      capital: country.capital,
      region: country.region,
      population: Number(country.population),
      currency_code: country.currency_code,
      exchange_rate: country.exchange_rate,
      estimated_gdp: Number(country.estimated_gdp),
      flag_url: country.flag_url,
      last_refreshed_at: country.last_refreshed_at?.toISOString() || null,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteOne = async (req, res) => {
  try {
    const { name } = req.params;
    const country = await Country.findOne({
      where: sequelize.where(fn('lower', col('name')), fn('lower', name)),
    });
    if (!country)
      return res.status(404).json({ error: 'Country not found' });
    await country.destroy();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getImage = async (req, res) => {
  try {
    const total = await Country.count();
    const top5 = await Country.findAll({
      order: [['estimated_gdp', 'DESC']],
      limit: 5,
    });
    const metadata = await Metadata.findOne({ where: { key: 'last_refreshed_at' } });
    const timestamp = metadata ? metadata.value : new Date().toISOString();

    const buffer = await generateSummaryImage({
      total,
      top5: top5.map((c) => ({
        name: c.name,
        estimated_gdp: Number(c.estimated_gdp || 0),
        flag_url: c.flag_url,
      })),
      timestamp,
    });

    res.set('Content-Type', 'image/png');
    return res.send(buffer);
  } catch (err) {
    console.error('Image generation error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createOne = async (req, res) => {
  try {
    const { name, capital, region, population, currency_code, exchange_rate, estimated_gdp, flag_url } = req.body;

    if (!name || !population) {
      return res.status(400).json({ error: 'Validation failed' });
    }

    const country = await Country.create({
      name,
      capital,
      region,
      population,
      currency_code,
      exchange_rate,
      estimated_gdp,
      flag_url,
    });

    return res.status(201).json({
      id: country.id,
      name: country.name,
      capital: country.capital,
      region: country.region,
      population: Number(country.population),
      currency_code: country.currency_code,
      exchange_rate: country.exchange_rate,
      estimated_gdp: Number(country.estimated_gdp),
      flag_url: country.flag_url,
      last_refreshed_at: country.last_refreshed_at?.toISOString() || null,
    });
  } catch (err) {
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Validation failed' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateOne = async (req, res) => {
  try {
    const { name } = req.params;
    const { capital, region, population, currency_code, exchange_rate, estimated_gdp, flag_url } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const country = await Country.findOne({
      where: sequelize.where(fn('lower', col('name')), fn('lower', name)),
    });

    if (!country) {
      return res.status(404).json({ error: 'Country not found' });
    }

    await country.update({
      capital,
      region,
      population,
      currency_code,
      exchange_rate,
      estimated_gdp,
      flag_url,
    });

    return res.json({
      id: country.id,
      name: country.name,
      capital: country.capital,
      region: country.region,
      population: Number(country.population),
      currency_code: country.currency_code,
      exchange_rate: country.exchange_rate,
      estimated_gdp: Number(country.estimated_gdp),
      flag_url: country.flag_url,
      last_refreshed_at: country.last_refreshed_at?.toISOString() || null,
    });
  } catch (err) {
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Validation failed' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};
