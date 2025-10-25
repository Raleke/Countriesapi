const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

const generateSummaryImage = async ({ total, top5, timestamp, outPath }) => {
  const width = 800;
  const height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#333';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Countries Summary', width / 2, 50);

  ctx.font = '18px Arial';
  ctx.fillText(`Total Countries: ${total}`, width / 2, 100);

  ctx.font = '14px Arial';
  ctx.fillText(`Last Refreshed: ${new Date(timestamp).toLocaleString()}`, width / 2, 130);
  ctx.font = 'bold 20px Arial';
  ctx.fillText('Top 5 Countries by Estimated GDP', width / 2, 180);

  ctx.font = '16px Arial';
  top5.forEach((country, index) => {
    const y = 220 + index * 30;
    ctx.fillText(`${index + 1}. ${country.name}: $${country.estimated_gdp.toFixed(2)}`, 50, y);
  });

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outPath, buffer);
};

module.exports = { generateSummaryImage };
