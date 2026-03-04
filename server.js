const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const axios = require('axios');
require('dotenv').config();
const app = express();
const port = 3000;
const sessionSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'dev-session-secret';
const dbName = process.env.MONGO_DB_NAME;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '')));
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// MongoDB Connection
const uri = process.env.MONGO_URI;
let db;

async function connectToMongo() {
    if (!uri) {
        console.error('MONGO_URI is missing in environment variables.');
        process.exit(1);
    }
    try {
        const client = new MongoClient(uri);
        await client.connect();
        console.log("Connected to MongoDB");
        db = dbName ? client.db(dbName) : client.db();
        console.log(`Using database: ${db.databaseName}`);
    } catch (err) {
        console.error("Failed to connect to MongoDB", err);
        process.exit(1);
    }
}
connectToMongo();

// --- Middleware for Authentication & Authorization ---
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ message: "Unauthorized: Not logged in" });
    }
};

const normalizeUserRole = (role) => {
    const normalized = String(role || '').trim().toLowerCase();
    if (normalized === 'buyers') return 'buyer';
    if (normalized === 'purchaser') return 'buyer';
    if (normalized === 'purchasers') return 'buyer';
    if (normalized === 'farmers') return 'farmer';
    if (normalized === 'seller') return 'farmer';
    if (normalized === 'sellers') return 'farmer';
    if (normalized === 'admins') return 'admin';
    return normalized;
};

// This is an example, but we will rely on internal ownership checks for more security
const isRole = (role) => (req, res, next) => {
    if (req.session.user && normalizeUserRole(req.session.user.role) === normalizeUserRole(role)) {
        next();
    } else {
        res.status(403).json({ message: `Forbidden: Requires ${role} role` });
    }
};

// --- Generic CMS Functions ---
const getCollectionItems = async (collectionName, res) => {
    try {
        const items = await db.collection(collectionName).find({}).sort({ _id: -1 }).toArray();
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: `Error fetching from ${collectionName}` });
    }
};

const addCollectionItem = async (collectionName, req, res) => {
    try {
        await db.collection(collectionName).insertOne({ ...req.body, createdAt: new Date() });
        res.status(201).json({ message: 'Item added successfully' });
    } catch (err) { res.status(500).json({ message: `Error adding to ${collectionName}` }); }
};

const deleteCollectionItem = async (collectionName, req, res) => {
    try {
        const { id } = req.params;
        const result = await db.collection(collectionName).deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) return res.status(404).json({ message: 'Item not found' });
        res.json({ message: 'Item deleted successfully' });
    } catch (err) { res.status(500).json({ message: `Error deleting from ${collectionName}` }); }
};

// --- Public CMS Routes ---
app.get('/api/crops', async (req, res) => {
        try {
                const crops = await db.collection('crops').find({}).toArray();
                res.json(crops);
        } catch (err) {
                res.status(500).json({ message: 'Error fetching crops' });
        }
});
app.get('/api/news', (req, res) => getCollectionItems('news', res));
app.get('/api/schemes', (req, res) => getCollectionItems('schemes', res));
app.get('/api/advisory', (req, res) => getCollectionItems('advisory', res));

// --- Admin-Only CMS Routes ---
const adminGuard = [isAuthenticated, isRole('admin')];
app.post('/api/news', ...adminGuard, (req, res) => addCollectionItem('news', req, res));
app.delete('/api/news/:id', ...adminGuard, (req, res) => deleteCollectionItem('news', req, res));
app.post('/api/schemes', ...adminGuard, (req, res) => addCollectionItem('schemes', req, res));
app.delete('/api/schemes/:id', ...adminGuard, (req, res) => deleteCollectionItem('schemes', req, res));
app.post('/api/advisory', ...adminGuard, (req, res) => addCollectionItem('advisory', req, res));
app.delete('/api/advisory/:id', ...adminGuard, (req, res) => deleteCollectionItem('advisory', req, res));

// --- Weather API Route ---
app.get('/api/weather', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ message: "Latitude and longitude are required." });
    try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`);
        const data = response.data;
        res.json({ location: data.name, temperature: data.main.temp, condition: data.weather[0].main, humidity: data.main.humidity, windSpeed: data.wind.speed });
    } catch (error) { res.status(500).json({ message: "Failed to fetch weather data." }); }
});

// --- Authentication Routes ---
app.post('/api/auth/register', async (req, res) => {
    const { email, password, name, role } = req.body;
    const normalizedRole = normalizeUserRole(role);
    if (!email || !password || !name || !normalizedRole || !['farmer', 'buyer', 'admin'].includes(normalizedRole)) return res.status(400).json({ message: "All fields are required and role must be valid" });
    try {
        if (await db.collection('users').findOne({ email })) return res.status(409).json({ message: "User with this email already exists" });
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.collection('users').insertOne({ email, password: hashedPassword, name, role: normalizedRole });
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) { res.status(500).json({ message: "Error registering user" }); }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
    try {
        const user = await db.collection('users').findOne({ email });
        if (!user || !await bcrypt.compare(password, user.password)) return res.status(401).json({ message: "Invalid credentials" });
        const normalizedRole = normalizeUserRole(user.role);
        if (!['farmer', 'buyer', 'admin'].includes(normalizedRole)) {
            return res.status(403).json({ message: "Your account has an invalid role. Please contact admin." });
        }
        req.session.user = { id: user._id, email: user.email, name: user.name, role: normalizedRole };
        res.json({ message: "Logged in successfully", user: req.session.user });
    } catch (err) { res.status(500).json({ message: "Error logging in" }); }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ message: "Could not log out." });
        res.clearCookie('connect.sid').json({ message: "Logged out successfully" });
    });
});

app.get('/api/auth/status', (req, res) => res.json({ loggedIn: !!req.session.user, user: req.session.user || null }));

// --- Mandi Price Routes ---
app.get('/api/mandi', async (req, res) => {
    try {
        const mandiPrices = await db.collection('mandi_prices').find({}).toArray();
        if (mandiPrices.length > 0) {
            return res.json(mandiPrices);
        }

        const derivedMandiData = await db.collection('crops').aggregate([
            {
                $group: {
                    _id: { state: '$state', crop: '$name' },
                    price: { $avg: '$price' }
                }
            },
            {
                $project: {
                    _id: 0,
                    state: '$_id.state',
                    crop: '$_id.crop',
                    price: { $round: ['$price', 2] }
                }
            },
            { $sort: { state: 1, crop: 1 } }
        ]).toArray();

        res.json(derivedMandiData);
    } catch (err) {
        res.status(500).json({ message: "Error fetching mandi prices" });
    }
});

app.put('/api/mandi/update', isAuthenticated, isRole('admin'), async (req, res) => {
    const { state, crop, price } = req.body;
    if (!state || !crop || !price) return res.status(400).json({ message: "State, crop, and price are required." });
    try {
        await db.collection('mandi_prices').updateOne({ state: state, crop: crop }, { $set: { price: parseFloat(price) } }, { upsert: true });
        res.json({ message: "Price updated successfully" });
    } catch (err) { res.status(500).json({ message: "Error updating price" }); }
});

// --- Buyer & Farmer Connect Routes ---
app.get('/api/buyers', async (req, res) => {
    try { res.json(await db.collection('buyers').find({}).sort({ createdAt: -1 }).toArray()); } catch (err) { res.status(500).json({ message: "Error fetching buyer requests" }); }
});

app.post('/api/buyers', isAuthenticated, isRole('buyer'), async (req, res) => {
    const { crop, quantity, contactNumber } = req.body;
    if (!crop || !quantity || !contactNumber) return res.status(400).json({ message: "All fields are required" });
    try {
        await db.collection('buyers').insertOne({ buyerId: new ObjectId(req.session.user.id), buyerName: req.session.user.name, contactNumber, crop, quantity: parseFloat(quantity), status: 'open', createdAt: new Date() });
        res.status(201).json({ message: "Buyer request submitted successfully" });
    } catch (err) { res.status(500).json({ message: "Error submitting buyer request" }); }
});

app.delete('/api/buyers/:id', isAuthenticated, async (req, res) => {
    try {
        const request = await db.collection('buyers').findOne({ _id: new ObjectId(req.params.id) });
        if (!request) return res.status(404).json({ message: "Request not found." });
        if (request.buyerId.toString() !== req.session.user.id) return res.status(403).json({ message: "Forbidden: You do not own this request." });
        await db.collection('buyers').deleteOne({ _id: new ObjectId(req.params.id) });
        res.json({ message: "Request deleted successfully." });
    } catch (err) { res.status(500).json({ message: "Error deleting request." }); }
});

app.get('/api/farmer-listings', async (req, res) => {
    try { res.json(await db.collection('farmer_listings').find({}).sort({ createdAt: -1 }).toArray()); } catch (err) { res.status(500).json({ message: "Error fetching farmer listings" }); }
});

app.post('/api/farmer-listings', isAuthenticated, isRole('farmer'), async (req, res) => {
    const { crop, quantity, price, contactNumber } = req.body;
    if (!crop || quantity === undefined || price === undefined || !contactNumber) {
        return res.status(400).json({ message: "All fields are required." });
    }
    const parsedQuantity = parseFloat(quantity);
    const parsedPrice = parseFloat(price);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
        return res.status(400).json({ message: "Quantity must be a valid number greater than 0." });
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({ message: "Price must be a valid number greater than 0." });
    }
    try {
        await db.collection('farmer_listings').insertOne({ farmerId: new ObjectId(req.session.user.id), farmerName: req.session.user.name, contactNumber, crop: String(crop).trim(), quantity: parsedQuantity, price: parsedPrice, status: 'available', createdAt: new Date() });
        res.status(201).json({ message: "Listing posted successfully" });
    } catch (err) {
        console.error('Error posting listing:', err);
        res.status(500).json({ message: "Error posting listing" });
    }
});

app.delete('/api/farmer-listings/:id', isAuthenticated, async (req, res) => {
    try {
        const listing = await db.collection('farmer_listings').findOne({ _id: new ObjectId(req.params.id) });
        if (!listing) return res.status(404).json({ message: "Listing not found." });
        if (listing.farmerId.toString() !== req.session.user.id) return res.status(403).json({ message: "Forbidden: You do not own this listing." });
        await db.collection('farmer_listings').deleteOne({ _id: new ObjectId(req.params.id) });
        res.json({ message: "Listing deleted successfully." });
    } catch (err) { res.status(500).json({ message: "Error deleting listing." }); }
});

app.get('/api/my-posts', isAuthenticated, async (req, res) => {
    try {
        const userId = new ObjectId(req.session.user.id);
        if (req.session.user.role === 'buyer') {
            res.json(await db.collection('buyers').find({ buyerId: userId }).sort({ createdAt: -1 }).toArray());
        } else if (req.session.user.role === 'farmer') {
            res.json(await db.collection('farmer_listings').find({ farmerId: userId }).sort({ createdAt: -1 }).toArray());
        }
    } catch (err) { res.status(500).json({ message: "Error fetching your posts" }); }
});

app.put('/api/posts/:collection/:id/complete', isAuthenticated, async (req, res) => {
    const { collection, id } = req.params;
    const validCollections = ['buyers', 'farmer-listings'];
    if (!validCollections.includes(collection)) return res.status(400).json({ message: "Invalid post type." });
    try {
        const dbCollectionName = collection === 'farmer-listings' ? 'farmer_listings' : collection;
        const post = await db.collection(dbCollectionName).findOne({ _id: new ObjectId(id) });
        if (!post) return res.status(404).json({ message: "Post not found." });
        const ownerIdField = dbCollectionName === 'buyers' ? 'buyerId' : 'farmerId';
        if (post[ownerIdField].toString() !== req.session.user.id) return res.status(403).json({ message: "Forbidden: You do not own this post." });
        const result = await db.collection(dbCollectionName).updateOne({ _id: new ObjectId(id) }, { $set: { status: 'completed', completedAt: new Date() } });
        if (result.modifiedCount === 0) return res.status(404).json({ message: "Post not found or already completed." });
        res.json({ message: "Post marked as complete." });
    } catch (err) { res.status(500).json({ message: "Error updating post" }); }
});

// --- Serve HTML ---
app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, 'index.html'))
);

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});