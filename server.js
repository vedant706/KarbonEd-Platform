const express = require('express');
const mongoose = require('mongoose'); 
const cors = require('cors');
const dns = require('dns'); 
require('dotenv').config();

// FORCES your laptop to use Google's servers to bypass Airtel/Jio blocks!
dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();

app.use(cors());                  
app.use(express.json());          

// Import the blueprints and security tools
const CarbonCredit = require('./models/CarbonCredit');
const User = require('./models/User'); 
const Transaction = require('./models/Transaction'); 
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken'); 

// NEW: Initialize Stripe (Replace this with your actual Stripe Test Secret Key later if you want)
// For now, this is a standard test key format.
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// Connects to MongoDB Atlas using your .env vault
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB is successfully connected!'))
    .catch((err) => console.log('Database connection error:', err));

app.get('/', (req, res) => {
    res.send('Carbon Exchange Server is running smoothly!');
});

// ==========================================
// --- SECURITY MIDDLEWARE (THE GUARD) ---
// ==========================================
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
        req.user = user; 
        next(); 
    });
}

// ==========================================
// --- AUTHENTICATION ROUTES ---
// ==========================================

// 1. REGISTER a new user
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ name, email, password: hashedPassword, role });
        await newUser.save();

        const token = jwt.sign({ userId: newUser._id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: '2h' });

        // NEW: We are now returning the user ID so the frontend can track notifications!
        res.status(201).json({ user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role }, token });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed', details: error.message });
    }
});

// 2. LOGIN an existing user
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2h' });

        // NEW: We are now returning the user ID so the frontend can track notifications!
        res.status(200).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token });
    } catch (error) {
        res.status(500).json({ error: 'Login failed', details: error.message });
    }
});

// ==========================================
// --- PROTECTED API ROUTES (CREDITS) ---
// ==========================================

app.post('/api/credits', authenticateToken, async (req, res) => {
    try {
        const { thirdPartyVerificationCode } = req.body;

        // 🤖 AUTOMATED API VERIFICATION SIMULATION 🤖
        const validRegistries = ['VERRA-', 'GS-', 'CDM-'];
        
        // If the code starts with one of the valid prefixes, it is true. Otherwise, false.
        const isCodeValid = validRegistries.some(prefix => thirdPartyVerificationCode.toUpperCase().startsWith(prefix));

        const newCredit = new CarbonCredit({
            ...req.body,
            sellerId: req.user.userId,
            isVerified: isCodeValid // <-- This is the magic! True if real, False if fake.
        }); 
        
        const savedCredit = await newCredit.save();   
        res.status(201).json(savedCredit);            
    } catch (error) {
        res.status(500).json({ error: 'Failed to add credit', details: error.message });
    }
});

app.get('/api/credits', async (req, res) => {
    try {
        // ONLY fetch verified projects that have credits left!
        const credits = await CarbonCredit.find({ isVerified: true, offsetAmount: { $gt: 0 } });    
        res.status(200).json(credits);                
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch credits', details: error.message });
    }
});

app.put('/api/credits/:id', authenticateToken, async (req, res) => {
    try {
        const updatedCredit = await CarbonCredit.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { returnDocument: 'after' } 
        );
        if (!updatedCredit) return res.status(404).json({ error: 'Credit not found' });
        res.status(200).json(updatedCredit);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update credit', details: error.message });
    }
});

app.delete('/api/credits/:id', authenticateToken, async (req, res) => {
    try {
        const deletedCredit = await CarbonCredit.findByIdAndDelete(req.params.id);
        if (!deletedCredit) return res.status(404).json({ error: 'Credit not found' });
        res.status(200).json({ message: 'Credit successfully deleted!' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete credit', details: error.message });
    }
});

// ==========================================
// --- TRANSACTION & WALLET ROUTES ---
// ==========================================

// NEW: Stripe Checkout Route
app.post('/api/stripe/create-checkout-session', authenticateToken, async (req, res) => {
    try {
        const { creditId, projectName, amount, pricePerTon } = req.body;
        
        // Stripe expects amounts in the smallest currency unit (paise for INR). So ₹1 = 100 paise.
        const unitAmountInPaise = pricePerTon * 100;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'inr',
                    product_data: { 
                        name: `Carbon Offset: ${projectName}`,
                        description: `Purchasing ${amount} Metric Tons of CO2 Offset`
                    },
                    unit_amount: unitAmountInPaise, 
                },
                quantity: amount,
            }],
            mode: 'payment',
            // If payment succeeds, Stripe sends them to our new success page with the purchase details in the URL
            success_url: `http://localhost:5173/success?creditId=${creditId}&amount=${amount}`,
            // If they click back/cancel, send them back to the marketplace
            cancel_url: `http://localhost:5173/`,
        });

        res.status(200).json({ url: session.url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/transactions/buy', authenticateToken, async (req, res) => {
    try {
        const { creditId, amountToBuy } = req.body;
        const amount = Number(amountToBuy);

        const credit = await CarbonCredit.findById(creditId);
        if (!credit) return res.status(404).json({ error: 'Credit project not found' });

        if (credit.offsetAmount < amount) {
            return res.status(400).json({ error: 'Not enough credits available for this purchase.' });
        }

        credit.offsetAmount -= amount;
        await credit.save();

        const totalPrice = amount * credit.pricePerTon;
        const transaction = new Transaction({
            buyerId: req.user.userId, 
            sellerId: credit.sellerId,
            projectName: credit.projectName,
            companyName: credit.companyName,
            amountPurchased: amount,
            pricePaid: totalPrice
        });
        await transaction.save();

        res.status(200).json({ message: 'Purchase successful!', transaction, updatedCredit: credit });
    } catch (error) {
        res.status(500).json({ error: 'Purchase failed', details: error.message });
    }
});

app.get('/api/transactions/my-purchases', authenticateToken, async (req, res) => {
    try {
        const purchases = await Transaction.find({ buyerId: req.user.userId }).sort({ purchaseDate: -1 });
        res.status(200).json(purchases);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch purchase history', details: error.message });
    }
});

app.get('/api/transactions/my-sales', authenticateToken, async (req, res) => {
    try {
        const sales = await Transaction.find({ sellerId: req.user.userId })
            .populate('buyerId', 'name email') 
            .sort({ purchaseDate: -1 });
        res.status(200).json(sales);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sales history', details: error.message });
    }
});

// ==========================================
// --- ADMIN ROUTES ---
// ==========================================

app.get('/api/admin/projects', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied. Admins only.' });
        const projects = await CarbonCredit.find().sort({ createdAt: -1 });
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects', details: error.message });
    }
});

app.patch('/api/admin/projects/:id/verify', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied. Admins only.' });

        const updatedProject = await CarbonCredit.findByIdAndUpdate(
            req.params.id,
            { isVerified: true },
            { new: true }
        );
        res.status(200).json({ message: 'Project verified successfully!', project: updatedProject });
    } catch (error) {
        res.status(500).json({ error: 'Failed to verify project', details: error.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is successfully running on port ${PORT}`);
});