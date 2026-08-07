const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    buyerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    sellerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true // NEW: This links the receipt to the seller!
    },
    projectName: { 
        type: String, 
        required: true 
    },
    companyName: { 
        type: String, 
        required: true 
    },
    amountPurchased: { 
        type: Number, 
        required: true 
    },
    pricePaid: { 
        type: Number, 
        required: true 
    },
    purchaseDate: { 
        type: Date, 
        default: Date.now // NEW: Saves the exact time of the sale
    }
});

module.exports = mongoose.model('Transaction', transactionSchema);