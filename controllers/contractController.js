'use strict';

const Contract = require('../models/contract'),
    ApiHelper = require('../helpers/api'),
    Donation = require('../models/donation'),
    Secret = require('../helpers/secret-sharing'),
    ContractKey = require('../models/contractKey'),
    bigInt = require('big-integer'),
    User = require('../models/user');

exports.checkConditions = function (req, res, next) {
    Contract.findById(req.query.id, function (err, contract) {
        if (err) throw (err);
        if (!err && contract != null) {
            if ((contract.expireDate < Date.now()) && (contract.keysGenerated === false)) {
                const sharing = new Secret.SecretSharing();
                Donation.find({contract_id: contract.id}, function (err, donations) {
                    if (err) return res.status(500).send({message: 'Error on data base: ' + err});
                    if (!donations) next();
                    const k = donations.length * (contract.robustness / 100);
                    let strMsg = contract.id.toString();
                    let hexMsg = Buffer.from(strMsg, 'utf8').toString('hex');
                    const {keys,p} = sharing.getShares(k.toPrecision(1),donations.length,hexMsg);
                    let contractKey = new ContractKey();
                    let array = new Array(0);
                    for (let i = 0; i < donations.length; i++) {
                        array.push({id: donations[i].user_id.toString(), received: false});
                    }
                    contractKey.p = p;
                    contractKey.contract_id = contract.id;
                    contractKey.keys = keys;
                    contractKey.user_id = array;
                    console.log(contractKey);
                    contractKey.save()
                        .then(resp => {
                            contract.keysGenerated = true;
                            contract.save()
                                .then(resp => next())
                                .catch(err => res.status(500).send(`There was an error model, please try again later. Error: ${err.message}`));
                        })
                        .catch(err => res.status(500).send(`There was an error model, please try again later. Error: ${err.message}`));
                });
            } else next();
        }
    });
};

const unlock = (req, res, k) => {
    ContractKey.findOne({ contract_id: req.body.contract_id}, function (err, contractKey) {
        if (err) throw (err);
        if (!err && contractKey != null) {
            if (contractKey.keys_received >= k) {
                let keys = new Array(0);
                for (let i = 0; i < contractKey.user_id.length; i++) {
                    if (contractKey.user_id[i].received) {
                        keys.push({key: contractKey.keys[i].key, id: parseInt(contractKey.keys[i].id)});
                    }
                }
                const sharing = new Secret.SecretSharing();
                let secretRecovered = sharing.secretRecovery(keys,contractKey.p);
                secretRecovered = (Buffer.from(bigInt(secretRecovered).toString(16), 'hex')).toString();
                if (secretRecovered === req.body.contract_id) {
                    let conditions = { contract_id: req.body.contract_id };
                    Donation.find(conditions, function (err, donations) {
                        if (err) return res.status(500).send({message: 'Error on data base: ' + err});
                        if (!err && donations != null) {
                            let total_amount = 0;
                            for (let i = 0; i < donations.length; i++) {
                                total_amount += donations[i].amount_donated;
                            }
                            Contract.findById(req.body.contract_id, function (err, contract) {
                                if (err) return res.status(500).send({message: 'Error on data base: ' + err});
                                if (!contract) return res.status(500).send({message: 'User not found.'});
                                contract.executed = true;
                                contract.save()
                                    .then(resp => {
                                        User.findById(contract.owner_id, function (err, user) {
                                            if (err) return res.status(500).send({message: 'Error on data base: ' + err});
                                            if (!user) return res.status(500).send({message: 'User not found.'});
                                            user.wallet = total_amount;
                                            user.save()
                                                .then(resp => res.status(200).send({message: 'Contract has been executed.'}))
                                                .catch(err => res.status(500).send(`There was an error saving model, please try again later. Error: ${err.message}`));
                                        });
                                    })
                                    .catch(err => res.status(500).send(`There was an error saving model, please try again later. Error: ${err.message}`));
                            });
                        }
                    });
                }
            } else return res.status(202).send({message: 'Keys remaining for execute contract:' + (k - contractKey.keys_received)});
        }
    });
};

exports.keyReceive = (req, res) => {
    let conditions = { contract_id: req.body.contract_id };
    Donation.find(conditions, function (err, donations) {
        if (err) return res.status(500).send({message: 'Error on data base: ' + err});
        if (donations) {
            Contract.findById(req.body.contract_id, function (err, contract) {
                if (err) throw (err);
                if (!err && contract != null) {
                    if (contract.expireDate < Date.now() && contract.keysGenerated) {
                        ContractKey.findOne({ contract_id: req.body.contract_id}, function (err, contractKey) {
                            if (err) throw (err);
                            if (!err && contractKey != null) {
                                for (let i = 0; i < contractKey.user_id.length; i++) {
                                    if (contractKey.user_id[i].id.toString() === req.body.user_id) {
                                        if (!contractKey.user_id[i].received) {
                                        contractKey.user_id[i].received = true;
                                        contractKey.keys_received += 1;
                                        const k = donations.length * (contract.robustness / 100);
                                        contractKey.save()
                                            .then(resp => unlock(req,res,k.toPrecision(1)))
                                            .catch(err => res.status(500).send(`There was an error saving model, please try again later. Error: ${err.message}`));
                                        } else return res.status(200).send({message: 'Your key has already been received.'});
                                    }
                                }
                            }
                        });
                    } else return res.status(400).send({message: 'Donation already done or contract expired.'});
                }
            });
        } else return res.status(400).send({message: 'You have no donations on this contract.'});
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
    let population = { path: 'owner_id', select: {'wallet': 0, 'signupDate': 0, 'lastLogin': 0, 'nextLastLogin': 0,} };
    Contract.findOne({'_id': req.query.id})
        .populate(population)
        .exec(function(err, contract) {
            if (err)
                res.status(500).send({message: 'Contrato no encontrado'});
            Donation.find({'contract_id': req.query.id}).exec(
                function(err, donations) {
                    if (err) res.status(500).send({message: `Internal server error: ${err}`});
                    let amount_now = 0;
                    for (let i = 0; i < donations.length; i++) {
                        amount_now = amount_now + donations[i].amount_donated;
                    }
                    res.status(200).json({contract: contract, amount_now: amount_now.toString()});
                }
            );
        });
    //ApiHelper.findOneModel(req, res, Contract, {'_id': req.query.id}, population);
};


exports.deleteOrderById = (req, res) => ApiHelper.deleteModelById(req, res, Contract);

exports.updateContractById = (req, res) => ApiHelper.updateModelById(req, res, Contract);

exports.findAllContracts = (req, res) => ApiHelper.findAllModels(req, res, Contract);

exports.findAllContractsPopulation = (req, res) => {
    let population = { path: 'owner_id', select: {'wallet': 0, 'signupDate': 0, 'lastLogin': 0, 'nextLastLogin': 0,} };
    ApiHelper.findAllModelsPopulate(res, res, Contract, population);
};