var express = require('express');
var router = express.Router();
var stripe = require("stripe")(process.env.STRIPE_KEY);
var shortid = require('shortid');
var Request = require('../models/request');

var bunyan = require('bunyan');
var logger = bunyan.createLogger({
    name: 'jainacademy-payments',
    streams: [{
        type: 'rotating-file',
        path: 'logs/jaPayments.log',
        period: '2d',
        count: 30
    }]
});


router.get('/:eventId/tickets', function (req, res, next) {

    var form_url = "/tickets/jainism-course-aug2018/tickets/issue";
    if (process.env.NODE_ENV == "dev") {
        form_url = "/jainism-course-aug2018/tickets/issue";
    }

    res.render('index', {
        title: 'Jain Academy Payments',
        payment_title: "Fundamentals of Jainism : August 2018",
        form_url: form_url
    });
});

router.post('/:eventId/tickets/issue', function (req, res, next) {

    var ref = shortid.generate();
    var eventId = req.params.eventId;
    var data = req.body.data;

    logger.info({ref: ref, eventId: eventId, status: 'NEW_REQUEST', data: data});

    var tickets = data.tickets;

    var paymentAmount = 0;
    Object.keys(tickets).forEach(function (key) {
        paymentAmount += parseInt(key);
    });

    paymentAmount = parseInt(paymentAmount) * parseInt(data.numOfTickets) + parseInt(data.donation);

    var req = new Request(data);
    req['ref'] = ref;
    req['eventId'] = eventId;

    req.save(function (err, newreq) {
        if (err) {
            logger.info({ref: ref, eventId: eventId, status: 'ERROR_SAVED_NEW', err: err, data: null});
            res.status(500).json({error: err, ref: ref})
        } else {
            logger.info({ref: ref, eventId: eventId, status: 'SAVED_NEW'});
            stripe.charges.create({
                amount: paymentAmount,
                currency: "gbp",
                description: ref,
                source: data.stripeToken.id,
            }, function (err, charge) {
                if (err) {
                    logger.info({ref: ref, eventId: eventId, status: 'ERROR_STRIPE_CHARGE', err: err, data: null});
                    res.status(500).json({error: err, ref: ref})
                } else {
                    logger.info({ref: ref, eventId: eventId, status: 'PAYMENT_PROCESSED', data: charge, err: null});
                    newreq.status = "PAYMENT_PROCESSED";
                    newreq.stripeCharge = charge;
                    newreq.save(function (err, saved) {
                        if (err) {
                            logger.info({
                                ref: ref,
                                eventId: eventId,
                                status: 'ERROR_CHARGE_UPDATE',
                                data: null,
                                err: err
                            });
                            res.status(500).json({error: err, ref: ref})
                        } else {
                            logger.info({ref: ref, eventId: eventId, status: 'CHARGE_UPDATED', data: null, err: null});
                            res.json({status: "ok", ref: ref});
                        }
                    });
                }
            });
        }
    });
});

module.exports = router;
