var express = require('express');
var router = express.Router();
var stripe = require("stripe")(process.env.STRIPE_KEY);
var shortid = require('shortid');
var request = require('../models/request');

router.get('/', function (req, res, next) {
    res.render('index', {title: 'Jain Academy Payments', payment_title: "Fundamentals of Jainism : August 2018"});
});

router.post('/issueTicket', function (req, res, next) {
    console.log(req.body);
    var ref = shortid.generate();
    var token = req.body.stripeToken;
    var tickets = req.body.ticket;
    console.log(tickets);
    var paymentAmount = req.body.paymentAmount;
    var email = req.body.inputEmail;
    stripe.charges.create({
        amount: paymentAmount,
        currency: "gbp",
        description: ref,
        source: token,
    }, function (err, charge) {
        if (err) {
            console.log(err);
            res.status(500).json({error: err})
        } else {
            console.log(charge);
            res.json({status: "ok"})
        }
    });

});

module.exports = router;
