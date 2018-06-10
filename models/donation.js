'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

let donationSchema = new mongoose.Schema({
    contract_id: { type: Schema.Types.ObjectId, ref: 'contracts', required: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    createDate: { type: Date, default: Date.now() },
    amount_donated: { type: Number, required: true},
    signature: { type: String }
});

donationSchema.pre('save', function (next) {
    this.signature = 'ServerSignature000';
    return next();
});

let model = mongoose.model('donations', donationSchema);
model.modelName = 'donation';
module.exports = model;