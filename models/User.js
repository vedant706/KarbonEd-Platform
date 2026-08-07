const mongoose = require('mongoose');

// This is the blueprint for every user account in your database
const userSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true // No two users can have the same email
    },
    password: { 
        type: String, 
        required: true // This will be stored as a scrambled hash, not plain text!
    },
    role: { 
        type: String, 
        enum: ['buyer', 'seller', 'admin'], // These are the only allowed roles
        default: 'buyer' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('User', userSchema);