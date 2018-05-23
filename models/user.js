'use strict';
const mongoose = require('mongoose'),
    bcrypt = require('bcrypt-nodejs'),
    validate = require('mongoose-validator'),
    titlize = require('mongoose-title-case'),
    Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

const usernameValidator = [
    validate({
        validator: 'isAlphanumeric',
        message: 'Username must be contain letters and numbers only.'
    }),
    validate({
        validator: 'isLength',
        arguments: [3, 15],
        message: 'Username should be between {ARGS[0]} and {ARGS[1]} characters'
    })
];

const emailValidator = [
    validate({
        validator: 'isEmail',
        message: 'Must be a valid email.'
    }),
    validate({
        validator: 'isLength',
        arguments: [5, 20],
        message: 'Email should be between {ARGS[0]} and {ARGS[1]} characters'
    })
];

const passwordValidator = [
    validate({
        validator: 'isLength',
        arguments: [8],
        message: 'Password should be between {ARGS[0]} and {ARGS[1]} characters'
    })
];

let userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        validate: usernameValidator
    },
    password: {
        type: String,
        select: false,
        validate: passwordValidator
    },
    email: {
        type: String,
        lowercase: true,
        required: true,
        unique: true,
        validate: emailValidator
    },
    wallet: { type: Number, default: 0 },
    signupDate: { type: Date, default: Date.now() },
    lastLogin: Date,
    nextLastLogin: Date,
    token: String,
    resetToken: String
});

userSchema.plugin(titlize, {
    paths: ['username']
});

userSchema.pre('save', function (next) {
    let user = this;
    if (this.isModified('password') || this.isNew) {
        bcrypt.genSalt(10, function (err, salt) {
            if (err) return next(err);
            bcrypt.hash(user.password, salt, null, function (err, hash) {
                if (err) return next(err);
                user.password = hash;
                next();
            });
        });
    } else return next();
});

let model = mongoose.model('users', userSchema);
model.modelName = "user";
module.exports = model;
