const express = require("express");
const router = express.Router();
const User = require("../models/user");

router.post("/", async (req, res) => {
  const { name, email, referrerEmail } = req.body;

  try {
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(200).json({
        message: "User already exists",
        userId: existingUser._id,
      });
    }

    let referrer = null;
    if (referrerEmail) {
      referrer = await User.findOne({ email: referrerEmail });
      if (!referrer) {
        return res.status(404).json({ message: "Referrer not found" });
      }
    }
    const user = new User({
      name,
      email,
      referrerId: referrer ? referrer._id : null,
      level: referrer ? referrer.level + 1 : 1,
    });

    if (referrer) {
      if (referrer.referrals.length >= 8) {
        return res
          .status(400)
          .json({ message: "Referrer cannot have more than 8 referrals." });
      }
      referrer.referrals.push(user._id);
      await referrer.save();
    }

    await user.save();
    res.status(201).json({ userId: user._id });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate("referrals");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({
      user,
      referralCount: user.referrals.length,
      earnings: user.earnings,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
