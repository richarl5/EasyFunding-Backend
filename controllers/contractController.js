'use strict';

const Contract = require('../models/contract'),
    ApiHelper = require('../helpers/api'),
    Donation = require('../models/donation'),
    User = require('../models/user');

exports.checkConditions = function (req, res, next) {
    Contract.findById(req.query.id, function (err, contract) {
        if (err) throw (err);
        if (!err && contract != null) {
            if ((contract.expireDate < Date.now()) && (contract.keysGenerated === false)) {
                //Do Paillier
                console.log('Do Paillier');
                /*Donation.find({contract_id: contract.id}, function (err, donations) {
                    if (err) return res.status(500).send({message: 'Error on data base: ' + err});
                    if (!donations) next();
                    console.log('#Donations: ' + donations.length );
                    const k = donations.length * (contract.robustness / 100);
                    console.log('k = ' + k.toPrecision(1));
                    next();
                });*/
                next();
            } else next();
        }
    });
};

exports.addContract = (req, res) => {
    console.log(req.body);
    let newContract = new Contract(req.body);
    newContract.save()
        .then(contract => { console.log('CONTRACT');console.log(contract);
        res.status(200).send({ message: 'Contract successfully created.', contract: contract})
        })
        .catch(err => res.status(500).send({message : 'Error on save in data base: ' + err}));
};

exports.findContract = (req, res) => {
    Contract.findById(req.query.id, function (err, order) {
        if (err) return res.status(500).send({message: 'Error on data base: ' + err});
        if (!order) return res.status(500).send({message: 'Contract not found.'});
        res.status(200).jsonp(order);
    });
};


exports.deleteOrderById = (req, res) => ApiHelper.deleteModelById(req, res, Contract);

exports.updateContractById = (req, res) => ApiHelper.updateModelById(req, res, Contract);

exports.findAllContracts = (req, res) => ApiHelper.findAllModels(req, res, Contract);

exports.findAllContractsPopulation = (req, res) => {
    let population = { path: 'owner_id', select: {'wallet': 0, 'signupDate': 0, 'lastLogin': 0, 'nextLastLogin': 0,} };
    ApiHelper.findAllModelsPopulate(res, res, Contract, population);
};