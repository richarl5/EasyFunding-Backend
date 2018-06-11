'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

let contractKeysSchema = new mongoose.Schema({
    contract_id: { type: Schema.Types.ObjectId, ref: 'contracts', required: true },
    user_id: [{ type: Schema.Types.ObjectId, ref: 'users', required: true }],
    createDate: { type: Date, default: Date.now() },
    keys: [{
        key: { type: String },
        id: { type: String }
    }],
    p: { type: String, required: true},
    signature: { type: String }
});

contractKeysSchema.pre('save', function (next) {
    this.signature = 'ServerSignature000';
    return next();
});

let model = mongoose.model('contractKeys', contractKeysSchema);
model.modelName = 'contractKey';
module.exports = model;