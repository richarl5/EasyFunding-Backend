'use strict';

const Contract = require('../models/contract'),
    ApiHelper = require('../helpers/api'),
    User = require('../models/user');

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
    //Example to try create a population
    let population = {
        path: User.modelName, match: { username: req.query.username },
        //path: Restaurant.modelName, match: { restaurant: req.query.restaurant }
    };

    ApiHelper.findAllModelsPopulate(res, res, Contract, population);
};