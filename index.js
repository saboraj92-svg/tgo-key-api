const express = require('express');
const app = express();

app.use(express.json());

// Temporary database (Keys store karne ke liye)
let keysDatabase = {};

// 1. LUA SCRIPT VALIDATE API (Game ke liye)
app.get('/api/validate', (req, res) => {
    const key = req.query.key;
    if (!key) return res.json({ status: "ERROR", message: "Key Missing" });

    const keyData = keysDatabase[key];
    if (!keyData) return res.json({ status: "INVALID", message: "Key Not Found" });

    const now = Math.floor(Date.now() / 1000);
    if (now > keyData.expiry) {
        delete keysDatabase[key];
        return res.json({ status: "EXPIRED", message: "Key Expired" });
    }

    const daysLeft = Math.ceil((keyData.expiry - now) / 86400);
    return res.json({
        status: "OK",
        days: daysLeft,
        plan: keyData.plan
    });
});

// 2. GENERATE KEY API (Admin ke liye)
app.get('/api/gen', (req, res) => {
    const { plan, custom_key } = req.query;
    const key = custom_key || "TGO-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    let durationSec = 86400; // 1 Day default
    if (plan === "3d") durationSec = 3 * 86400;
    if (plan === "7d") durationSec = 7 * 86400;
    if (plan === "1m") durationSec = 30 * 86400;
    if (plan === "1y") durationSec = 365 * 86400;

    const expiry = Math.floor(Date.now() / 1000) + durationSec;
    
    keysDatabase[key] = { plan, expiry };
    res.json({ success: true, key, expiry });
});

// 3. DELETE KEY API (Admin ke liye)
app.get('/api/delete', (req, res) => {
    const { key } = req.query;
    if (keysDatabase[key]) {
        delete keysDatabase[key];
        return res.json({ success: true, message: "Key Deleted" });
    }
    res.json({ success: false, message: "Key not found" });
});

module.exports = app;
