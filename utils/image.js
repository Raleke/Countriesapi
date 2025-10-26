const { createCanvas, loadImage } = require('canvas');

const generateSummaryImage = async ({ total, top5, timestamp }) => {
  const width = 800;
  const height = 700; // Increased height to accommodate flag images
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#333';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Countries Summary', width / 2, 50);

  ctx.font = '18px sans-serif';
  ctx.fillText(`Total Countries: ${total}`, width / 2, 100);

  ctx.font = '14px sans-serif';
  ctx.fillText(`Last Refreshed: ${new Date(timestamp).toLocaleString()}`, width / 2, 130);
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('Top 5 Countries by Estimated GDP', width / 2, 180);

  ctx.font = '16px sans-serif';
  for (let index = 0; index < top5.length; index++) {
    const country = top5[index];
    const y = 220 + index * 50; // Increased spacing for images
    const textX = 120; // Shift text to the right to make space for flag

    // Draw flag image if available
    if (country.flag_url) {
      try {
        const flagImage = await loadImage(country.flag_url);
        ctx.drawImage(flagImage, 50, y - 25, 50, 30); // Draw flag at 50x30 size
      } catch (err) {
        console.warn(`Failed to load flag for ${country.name}:`, err.message);
        // Draw a placeholder box if flag fails to load
        ctx.fillStyle = '#ccc';
        ctx.fillRect(50, y - 25, 50, 30);
        ctx.strokeStyle = '#999';
        ctx.strokeRect(50, y - 25, 50, 30);
        ctx.fillStyle = '#333';
      }
    }

    // Draw country text
    ctx.fillText(`${index + 1}. ${country.name}: $${country.estimated_gdp.toFixed(2)}`, textX, y);
  }

  const buffer = canvas.toBuffer('image/png');
  return buffer;
};

module.exports = { generateSummaryImage };
