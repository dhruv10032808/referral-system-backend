const express = require("express");
const router = express.Router();
const Earning = require("../models/earning");
const User = require("../models/user");

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate("referrals");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const earnings = await Earning.find({ userId });

    res.json({
      user,
      totalEarnings: user.earnings,
      referralCount: user.referrals.length,
      earningsBreakdown: earnings,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
