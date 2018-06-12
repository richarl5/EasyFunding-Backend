'use strict';

const mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    crypto = require('crypto'),
    bigInt = require('big-integer'),
    rsa = require('../helpers/rsa');

let { publicKey, privateKey } = rsa.generateRandomKeys(256);

mongoose.Promise = global.Promise;

let contractSchema = new mongoose.Schema({
    owner_id: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    name: { type: String },
    description: { type: String },
    createDate: { type: Date, default: Date.now() },
    expireDate: { type: Date },
    threshold: { type: Number },
    robustness: { type: Number },
    signature: { type: String },
    keysGenerated: { type: Boolean, default: false },
    executed: { type: Boolean, default: false }
});

contractSchema.pre('save', function (next) {
    this.signature = proofGenerator(Array(this.owner_id, this.name, this.createDate, this.expireDate, this.threshold, this.robustness));
    return next();
});

const proofGenerator = (s) => {
    const hash = crypto.createHash('sha256').update(s.join('.')).digest('hex');
    return privateKey.sign(bigInt(hash,16));
};

let model = mongoose.model('contracts', contractSchema);
model.modelName = 'contract';
module.exports = model;