'use strict';

const Contract = require('../models/contract'),
    ApiHelper = require('../helpers/api'),
    Donation = require('../models/donation'),
    Secret = require('../helpers/secret-sharing'),
    ContractKey = require('../models/contractKey'),
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
                        array.push(donations[i].user_id.toString());
                    }
                    contractKey.p = p;
                    contractKey.contract_id = contract.id;
                    contractKey.keys = keys;
                    contractKey.user_id = array;
                    console.log(contractKey);
                    contractKey.save()
                        .then(resp => next())
                        .catch(err => res.status(500).send(`There was an error model, please try again later. Error: ${err.message}`));
                });
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
    let population = { path: 'owner_id', select: {'wallet': 0, 'signupDate': 0, 'lastLogin': 0, 'nextLastLogin': 0,} };
    ApiHelper.findOneModel(req, res, Contract, {'_id': req.query.id}, population);
};


exports.deleteOrderById = (req, res) => ApiHelper.deleteModelById(req, res, Contract);

exports.updateContractById = (req, res) => ApiHelper.updateModelById(req, res, Contract);

exports.findAllContracts = (req, res) => ApiHelper.findAllModels(req, res, Contract);

exports.findAllContractsPopulation = (req, res) => {
    let population = { path: 'owner_id', select: {'wallet': 0, 'signupDate': 0, 'lastLogin': 0, 'nextLastLogin': 0,} };
    ApiHelper.findAllModelsPopulate(res, res, Contract, population);
};