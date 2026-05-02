require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const Url = require('./UrlModel');

const app = express();
app.use(express.json());
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/url-shortener')
    .then(() => console.log('MongoDB Connected. Servers are online.'))
    .catch(err => console.error('DB Connection Failed:', err));


const generateShortId = () => crypto.randomBytes(4).toString('base64url').slice(0, 6);


app.post('/api/shorten', async (req, res) => {
    const { originalUrl } = req.body;

    
    if (!originalUrl || !originalUrl.startsWith('http')) {
        return res.status(400).json({ error: 'Invalid spawn point. Provide a valid HTTP URL.' });
    }

    try {
        
        let existingUrl = await Url.findOne({ originalUrl });
        if (existingUrl) {
            return res.json({ shortUrl: `${req.headers.host}/${existingUrl.shortId}` });
        }

        const shortId = generateShortId();
        const newUrl = new Url({ originalUrl, shortId });
        await newUrl.save();

        res.json({ shortUrl: `${req.headers.host}/${shortId}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server lagging. Try again.' });
    }
});

app.get('/:shortId', async (req, res) => {
    try {
        const urlParams = await Url.findOne({ shortId: req.params.shortId });

        if (urlParams) {
            
            urlParams.clicks++;
            urlParams.save();

            
            return res.redirect(urlParams.originalUrl);
        } else {
            return res.status(404).json({ error: '404: Fast-travel point not found.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during teleportation.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Matchmaking server running on port ${PORT}`);
});