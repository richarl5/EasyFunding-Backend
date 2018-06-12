'use strict';

const Donation = require('../models/donation'),
    ApiHelper = require('../helpers/api'),
    User = require('../models/user'),
    crypto = require('crypto'),
    Contract = require('../models/contract'),
    rsa = require('../helpers/rsa');

exports.checkConditions = function (req, res, next) {
    let conditions = { contract_id: req.body.contract_id,  user_id: req.body.user_id};
    Donation.findOne(conditions, function (err, donation) {
        if (err) return res.status(500).send({message: 'Error on data base: ' + err});
        if (!donation) {
            Contract.findById(req.body.contract_id, function (err, contract) {
                if (err) throw (err);
                if (!err && contract != null) {
                    if (contract.expireDate > Date.now()) {
                        User.findById(req.body.user_id, function (err, user) {
                            if (err) throw (err);
                            if (!err && user != null) {
                                const publicKey = new rsa.PublicKeyRSA(user.publicKey.e, user.publicKey.n);
                                let clientHash = publicKey.verify(req.body.signature);
                                clientHash = Buffer.from(clientHash.toString(16), 'hex').toString('hex');
                                const hash = crypto.createHash('sha256').update(Array(req.body.contract_id, req.body.user_id, req.body.amount_donated.toString()).join('.').toString()).digest('hex');
                                if (clientHash === hash) {
                                    console.log('Donation signature verified.');
                                    next();
                                } else return res.status(400).send({message: 'Donation signature verification not success.'});
                            }
                        });
                    } else return res.status(400).send({message: 'Donation already done or contract expired.'});
                }
            });
        } else return res.status(400).send({message: 'Donation already done or contract expired.'});
    });
};

exports.addDonation = (req, res) => {
    console.log(req.body);
    let newDonation = new Donation(req.body);
    newDonation.save()
        .then(donation => { console.log('DONATION');console.log(donation);
            res.status(200).send({ message: 'Donation successfully created.', donation: donation})
        })
        .catch(err => res.status(500).send({message : 'Error on save in data base: ' + err}));
};

exports.findDonation = (req, res) => {
    Donation.findById(req.query.id, function (err, order) {
        if (err) return res.status(500).send({message: 'Error on data base: ' + err});
        if (!order) return res.status(500).send({message: 'Contract not found.'});
        res.status(200).jsonp(order);
    });
};


exports.deleteOrderById = (req, res) => ApiHelper.deleteModelById(req, res, Donation);

exports.updateDonationById = (req, res) => ApiHelper.updateModelById(req, res, Donation);

exports.findAllDonations = (req, res) => ApiHelper.findAllModels(req, res, Donation);
