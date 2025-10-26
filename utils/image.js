const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

/**
 * Generates and saves a summary image containing total countries,
 * top 5 by GDP, and timestamp.
 * 
 * @param {Object} data
 * @param {number} data.total - Total number of countries
 * @param {Array} data.top5 - Array of top 5 countries [{ name, estimated_gdp, flag_url }]
 * @param {string} data.timestamp - ISO date string
 * @returns {Promise<string>} - Path to saved image
 */
const generateSummaryImage = async ({ total, top5, timestamp }) => {
  try {
    const width = 800;
    const height = 700;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#222';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🌍 Countries Summary', width / 2, 50);
    ctx.font = '18px sans-serif';
    ctx.fillText(`Total Countries: ${total}`, width / 2, 100);

    ctx.font = '14px sans-serif';
    ctx.fillText(`Last Refreshed: ${new Date(timestamp).toLocaleString()}`, width / 2, 130);
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Top 5 Countries by Estimated GDP', width / 2, 180);
    ctx.textAlign = 'left';
    ctx.font = '16px sans-serif';

    for (let i = 0; i < top5.length; i++) {
      const country = top5[i];
      const y = 230 + i * 70; // space for flag
      const textX = 120;

      if (country.flag_url) {
        try {
          const flag = await loadImage(country.flag_url);
          ctx.drawImage(flag, 50, y - 25, 50, 30);
        } catch (error) {
          console.warn(`  Failed to load flag for ${country.name}: ${error.message}`);
          ctx.fillStyle = '#ddd';
          ctx.fillRect(50, y - 25, 50, 30);
          ctx.strokeStyle = '#999';
          ctx.strokeRect(50, y - 25, 50, 30);
          ctx.fillStyle = '#222';
        }
      }
      const gdpFormatted = country.estimated_gdp
        ? `$${country.estimated_gdp.toLocaleString()}`
        : 'N/A';

      ctx.fillText(`${i + 1}. ${country.name}: ${gdpFormatted}`, textX, y);
    }
    const cacheDir = path.join(__dirname, '../../cache');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const outputPath = path.join(cacheDir, 'summary.png');
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    console.log(` Summary image generated: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error(' Error generating summary image:', error);
    throw new Error('Failed to generate summary image');
  }
};

module.exports = { generateSummaryImage };