'use strict';

const Donation = require('../models/donation'),
    ApiHelper = require('../helpers/api'),
    User = require('../models/user'),
    Contract = require('../models/contract');

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
