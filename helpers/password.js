'use strict';
const config = require('../config/config'),
    User = require('../models/user'),
    nodemailer = require('nodemailer'),
    jwt = require('jsonwebtoken');

exports.forgotPassword = (req, res) => {
    req.checkBody('email').isEmail();
    const errors = req.validationErrors();
    if (errors) {
        return res.status(400).send({message: 'Missing or wrong fields.'});
    } else {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            secure: false,
            tls: {
                rejectUnauthorized: false
            },
            auth: {
                user: config.mail.user,
                pass: config.mail.password
            }
        });

        User.findOne({email: req.body.email}, function (err, user) {
            if (err) return res.status(500).send({message: 'Error on data base: ' + err});
            if (!user) {
                Restaurant.findOne({email: req.body.email}, function (err, restaurant) {
                    if (err) return res.status(500).send({message: 'Error on data base: ' + err});
                    if (!restaurant) {
                        return res.status(400).send({message: 'Your email does not exist.'});
                    } else {
                        let token = jwt.sign({
                            username: restaurant.username,
                            email: restaurant.email,
                            _id: restaurant.id
                        }, config.secret, {
                            expiresIn: 600 //Seconds
                        });
                        restaurant.resetToken = token;
                        restaurant.save()
                            .then(resp => {
                                const mailOptions = {
                                    from: config.mail.user, // sender address
                                    to: req.body.email, // list of receivers
                                    subject: 'FeelFood | Reset Password',
                                    html: 'Hello dear user! Follow this link to reset your password: http://localhost:4200/resetPassword/' + token
                                };
                                transporter.sendMail(mailOptions, function (err, info) {
                                    if(err)
                                        console.log(err);
                                    else {
                                        console.log(info);
                                        return res.status(200).send({success: true, message: 'An email has been sent to you. Follow instructions.'});
                                    }
                                });
                            })
                            .catch(err => res.status(500).send({message: 'Error on save in data base: ' + err}));

                    }
                });
            } else {
                let token = jwt.sign({username: user.username, email: user.email, _id: user.id}, config.secret, {
                    expiresIn: 300 //Seconds
                });
                user.resetToken = token;
                user.save()
                    .then(resp => {
                        const mailOptions = {
                            from: config.mail.user, // sender address
                            to: req.body.email, // list of receivers
                            subject: 'FeelFood | Reset Password',
                            html: 'Hello dear user! Follow this link to reset your password: http://localhost:4200/resetPassword/' + token
                        };
                        transporter.sendMail(mailOptions, function (err, info) {
                            if(err)
                                console.log(err);
                            else {
                                console.log(info);
                                return res.status(200).send({success: true, message: 'An email has been sent to you. Follow instructions.'});
                            }
                        });
                    })
                    .catch(err => res.status(500).send({message: 'Error on save in data base: ' + err}));
            }
        });
    }
};

exports.resetPassword = (req, res) => {
    console.log(req.body);
    req.checkBody('token').notEmpty();
    req.checkBody('password').notEmpty();
    const errors = req.validationErrors();
    if (errors) {
        return res.status(400).send({message: 'Missing or wrong fields.'});
    } else {
        const payload = jwt.decode(req.body.token, config.secret);
        User.findOne({email: payload.email}, function (err, user) {
            if (err) return res.status(500).send({message: 'Error on data base: ' + err});
            if (!user) {
                Restaurant.findOne({email: payload.email}, function (err, restaurant) {
                    if (err) return res.status(500).send({message: 'Error on data base: ' + err});
                    if (!restaurant) {
                        return res.status(400).send({message: 'Failure on reset password.'});
                    } else if (restaurant.resetToken = req.body.token) {
                        restaurant.resetToken = undefined;
                        restaurant.password = req.body.password;
                        restaurant.save()
                            .then(resp => {
                                return res.status(200).send({
                                    success: true,
                                    message: 'Your password has been changed.'
                                });
                            })
                            .catch(err => res.status(500).send({message: 'Error on save in data base: ' + err}));
                    } else return res.status(400).send({message: 'Wrong token provided.'});
                });
            } else if (user.resetToken && (user.resetToken = req.body.token)) {
                user.resetToken = undefined;
                user.password = req.body.password;
                user.save()
                    .then(resp => {
                        console.log(resp);
                        return res.status(200).send({success: true, message: 'Your password has been changed.'});
                    })
                    .catch(err => res.status(500).send({message: 'Error on save in data base: ' + err}));
            } else return res.status(400).send({message: 'Wrong token provided.'});
        });
    }
};

