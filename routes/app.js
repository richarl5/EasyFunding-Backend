'use strict';

let express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    passport = require('passport'),
    morgan = require('morgan'),
    jwt = require('jsonwebtoken'),
    passwordHelper = require('../helpers/password'),
    expressValidator = require('express-validator');

require('../helpers/passport')(passport);

// Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(passport.initialize());
app.use(passport.session());
app.use(expressValidator());

let router = express.Router();
app.use(router);

// Log requests to console
router.use(morgan('dev'));

//Implements CORS
router.all('/*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", '*');
    res.header('Access-Control-Allow-Methods', "GET,PUT,POST,DELETE,OPTIONS");
    res.header('Access-Control-Allow-Headers', "Content-Type, Authorization, Content-Length, X-Requested-With,X-Custom-Header,Origin");
    res.header('Access-Control-Allow-Credentials', "true");
    if ('OPTIONS' === req.method) {
        res.status(200).send();
    }
    else {
        next();
    }
});

// Import Controllers
let userCtrl = require('../controllers/userController');
let contractCtrl = require('../controllers/contractController');
let donationCtrl = require('../controllers/donationController');

// API routes

router.route('/')
    .get(function (req, res) {
        res.status(200).send('EasyFunding Api Server running!');
    });

router.route('/login')
    .post(userCtrl.loginUser);

router.route('/signup')
    .post(userCtrl.addUser);

router.route('/user')
    .get(passport.authenticate('jwt', { session: false }), userCtrl.findUser)
    .post(passport.authenticate('jwt', { session: false }), userCtrl.addUser)
    .delete(passport.authenticate('jwt', { session: false }), userCtrl.deleteUserById)
    .put(passport.authenticate('jwt', { session: false }), userCtrl.updateUserById);

router.route('/user/all')
    .get(passport.authenticate('jwt', { session: false }), userCtrl.findAllUsers);

router.route('/contract')
    .get(passport.authenticate('jwt', { session: false }), contractCtrl.checkConditions, contractCtrl.findContract)
    .post(passport.authenticate('jwt', { session: false }), contractCtrl.addContract)
    .put(passport.authenticate('jwt', { session: false }), contractCtrl.updateContractById);
router.route('/contract/all')
    .get(passport.authenticate('jwt', { session: false }), contractCtrl.findAllContracts);

router.route('/donation')
    .get(passport.authenticate('jwt', { session: false }), donationCtrl.findDonation)
    .post(passport.authenticate('jwt', { session: false }), donationCtrl.checkConditions, donationCtrl.addDonation)
    .put(passport.authenticate('jwt', { session: false }), donationCtrl.updateDonationById);
router.route('/donation/all')
    .get(passport.authenticate('jwt', { session: false }), donationCtrl.findAllDonations);

router.route('/resetPassword')
    .post(passwordHelper.forgotPassword);

router.route('/resetPassword/new')
    .post(passwordHelper.resetPassword);

module.exports = app;