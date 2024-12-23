const express = require("express");
const router = express.Router();
const Transaction = require("../models/transaction");
const User = require("../models/user");
const Earning = require("../models/earning");
const { calculateProfit } = require("../utils/profitCalculator");

router.post("/", async (req, res) => {
  const { userId, amount } = req.body;

  try {
    // Validate purchase amount
    if (amount <= 1000) {
      return res
        .status(400)
        .json({ message: "Purchase amount must exceed 1000 Rs." });
    }

    const buyer = await User.findById(userId);
    if (!buyer) {
      return res.status(404).json({ message: "User not found." });
    }

    // Calculate profit
    const profits = calculateProfit(amount);
    const transaction = new Transaction({
      userId,
      amount,
      profit: profits.level1Profit + profits.level2Profit,
      levelEarnings: {
        level1: profits.level1Profit,
        level2: profits.level2Profit,
      },
    });
    await transaction.save();

    // Distribute profits
    const io = req.app.get("io"); // WebSocket server

    // Level 1 earnings
    if (buyer.referrerId) {
      const level1User = await User.findById(buyer.referrerId);
      level1User.earnings += profits.level1Profit;
      await level1User.save();

      const level1Earning = new Earning({
        userId: level1User._id,
        transactionId: transaction._id,
        level: 1,
        amount: profits.level1Profit,
      });
      await level1Earning.save();

      // Notify level 1 user
      io.emit(`update-earnings-${level1User._id}`, {
        amount: profits.level1Profit,
        level: 1,
      });
    }

    // Level 2 earnings
    if (buyer.referrerId) {
      const level1User = await User.findById(buyer.referrerId);
      if (level1User.referrerId) {
        const level2User = await User.findById(level1User.referrerId);
        level2User.earnings += profits.level2Profit;
        await level2User.save();

        const level2Earning = new Earning({
          userId: level2User._id,
          transactionId: transaction._id,
          level: 2,
          amount: profits.level2Profit,
        });
        await level2Earning.save();

        // Notify level 2 user
        io.emit(`update-earnings-${level2User._id}`, {
          amount: profits.level2Profit,
          level: 2,
        });
      }
    }

    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
