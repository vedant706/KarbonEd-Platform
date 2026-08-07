const mongoose = require('mongoose');

// This is the blueprint for every carbon credit in your database
const carbonCreditSchema = new mongoose.Schema({
    // NEW: We added this so we know exactly which seller owns this project!
    sellerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    projectName: { 
        type: String, 
        required: true // This means a project MUST have a name
    },
    companyName: { 
        type: String, 
        required: true 
    },
    offsetAmount: { 
        type: Number, 
        required: true // Amount of CO2 offset in tons
    },
    pricePerTon: { 
        type: Number, 
        required: true // Price in rupees
    },
    thirdPartyVerificationCode: {
        type: String,
        required: true // The code provided by the 3rd party registry (Verra, Gold Standard, etc.)
    },
    isVerified: { 
        type: Boolean, 
        default: false // The admin will change this to true after checking the code above
    },
    createdAt: { 
        type: Date, 
        default: Date.now // Automatically stamps when it was created
    }
});

// This packages the blueprint so other files (like server.js) can use it
module.exports = mongoose.model('CarbonCredit', carbonCreditSchema);