'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

let contractSchema = new mongoose.Schema({
    owner_id: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    description: { type: String },
    createDate: { type: Date, default: Date.now() },
    expireDate: { type: Date },
    threshold: { type: Number },
    robustness: { type: Number },
    signature: { type: String },
    keysGenerated: { type: Boolean, default: false },
});

contractSchema.pre('save', function (next) {
    this.signature = 'ServerSignature000';
    return next();
});

let model = mongoose.model('contracts', contractSchema);
model.modelName = 'contract';
module.exports = model;