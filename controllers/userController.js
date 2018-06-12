'use strict';

const User = require('../models/user'),
    ApiHelper = require('../helpers/api'),
    bcrypt = require('bcrypt-nodejs'),
    config = require('../config/config'),
    jwt = require('jsonwebtoken');

exports.loginUser = (req, res, next) => {
    console.log(req.body);
    let credentials = req.body.credentials;
    let conditions = { email: credentials.email };
    User.findOne(conditions, function (err, resp) {

        if (err)
            return res.status(500).send(`There was an error searching all ${T.modelName}, please try again later. Error: ${err.message}`);

        if (!resp)
            return res.status(200).send({ message: 'E-mail or password is not correct' });

        //1º validate password hash are equals or 2º validate password decoded with password encoded.
        if (credentials.password === resp.password || bcrypt.compareSync(credentials.password, resp.password)) {

            let token = jwt.sign({ username: resp.username, email: resp.email, _id: resp.id }, config.secret, {
                expiresIn: 10800 //Seconds
            });
            resp.set({ lastLogin: resp.nextLastLogin });
            resp.set({ nextLastLogin: Date.now() });
            resp.set({ publicKey: req.body.publicKey});
            resp.save()
                .then(resp => {
                    delete resp._doc.password;
                    res.status(200).send({ success: true, message: 'Authenticated', token: token, user: resp });
                }).catch(err => console.log(err));
        } else return res.status(200).send({ message: 'E-mail or password is not correct' });
    }).select('+password');
};

exports.addUser = (req, res) => {
    if (!req.body.email || req.body.email === '' || !req.body.password || req.body.password === '' || !req.body.username || req.body.username === '') {
        res.status(400).send({ message: 'Please enter all fields.' });
    } else {
        let conditions = { $or: [{ email: req.body.email }, { username: req.body.username }] };
        ApiHelper.addModel(req, res, User, conditions);
    }
};
exports.deleteUserByName = (req, res) => ApiHelper.deleteModelByName(req, res, User);

exports.deleteUserById = (req, res) => ApiHelper.deleteModelById(req, res, User);

exports.updateUserById = (req, res) => {
    if (req.body.password) {
        bcrypt.genSalt(10, function (err, salt) {
            if (err) return err;
            bcrypt.hash(req.body.password, salt, null, function (err, hash) {
                if (err) return err;
                req.body.password = hash;
            });
        });
    }
    ApiHelper.updateModelById(req, res, User);
};

exports.findAllUsers = (req, res) => ApiHelper.findAllModels(req, res, User);

exports.findUser = (req, res) => {
    let conditions = { _id: req.query.id };
    ApiHelper.findModels(req, res, User, conditions);
};

exports.setToken = (req, res) => {
    let token = jwt.sign({ username: req.user._doc.username, email: req.user._doc.email, _id: req.user._doc.id }, config.secret, {
        expiresIn: 10800 //Seconds
    });
    User.findOne({ id: req.user._doc.id }, function (err, user) {
        if (err) throw (err);
        if (!err && user != null) {
            user.set({ token: token });
            user.save()
                .then(resp => res.redirect('http://localhost:4200/auth/' + req.user._doc.username + '/' + req.user._doc.tokenFb))
                .catch(err => console.log(err));
        }
    });
};

exports.loginUserFacebook = (req, res) => {
    User.findOne({ username: req.body.username }, function (err, user) {
        if (err) throw (err);
        if (!err && user != null) {
            if (user.tokenFb && (user.tokenFb === req.body.tokenFb)) {
                user.tokenFb = undefined;
                user.save()
                    .then(resp => {
                        delete resp._doc.password;
                        res.status(200).send({ success: true, message: 'Authenticated!', token: user.token, user: resp });
                    })
                    .catch(err => console.log(err));
            } else return res.status(200).send({ message: 'Failed to login Facebook.' });
        }
    });
};