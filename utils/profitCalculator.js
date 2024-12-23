function calculateProfit(amount) {
  if (amount <= 1000) return null;
  return {
    level1Profit: parseFloat((amount * 0.05).toFixed(2)),
    level2Profit: parseFloat((amount * 0.01).toFixed(2)),
  };
}

module.exports = { calculateProfit };
