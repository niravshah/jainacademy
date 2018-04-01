var express = require('express');
var router = express.Router();
var stripe = require("stripe")(process.env.STRIPE_KEY);
var shortid = require('shortid');
var Request = require('../models/request');

router.get('/', function (req, res, next) {
    res.render('index', {title: 'Jain Academy Payments', payment_title: "Fundamentals of Jainism : August 2018"});
});

router.post('/issueTicket', function (req, res, next) {

    var ref = shortid.generate();
    var data = req.body.data;
    //console.log(data);


    var req = new Request(data);
    req['ref'] = ref;

    req.save(function (err, newreq) {

        if (err) {
            res.status(500).json({error: err})
        } else {
            stripe.charges.create({
                amount: data.paymentAmount,
                currency: "gbp",
                description: ref,
                source: data.stripeToken.id,
            }, function (err, charge) {
                if (err) {
                    console.log(err);
                    res.status(500).json({error: err})
                } else {
                    //console.log(charge);

                    newreq.status = "PAYMENT_PROCESSED";
                    newreq.stripeCharge = charge;
                    newreq.save(function (err, saved) {
                        if (err) {
                            res.status(500).json({error: err})
                        } else {
                            res.json({status: "ok"});
                        }
                    });
                }
            });

        }

    });

});

module.exports = router;
