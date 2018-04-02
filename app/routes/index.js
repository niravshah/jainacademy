var express = require('express');
var router = express.Router();
var stripe = require("stripe")(process.env.STRIPE_KEY);
var shortid = require('shortid');
var Request = require('../models/request');
var Queue = require('bull');
var emailQueue = new Queue('send ticket email', process.env.REDIS_URL);

var nodemailer = require('nodemailer');
var mg = require('nodemailer-mailgun-transport');
var auth = {auth: {api_key: process.env.MAILGUN_APIKEY, domain: process.env.MAILGUN_DOMAIN}};
var nodemailerMailgun = nodemailer.createTransport(mg(auth));

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
    var tickets = data.tickets;
    var paymentAmount = 0;

    logger.info({ref: ref, eventId: eventId, status: 'NEW_REQUEST', data: data});

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

                    emailQueue.add({ref: ref, eventId: eventId, status: 'PAYMENT_PROCESSED', data: data});
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

emailQueue.process(function (job, done) {
    //console.log('New Email Job Received!', job.data);
    logger.info({ref: job.data.ref, eventId: job.data.eventId, status: 'EMAIL_REQUEST', data: job.data});

    nodemailerMailgun.sendMail({
        from: process.env.MAILGUN_FROM_EMAIL,
        to: job.data.data.email,
        subject: 'Your Tickets from Jain Academy: ' + job.data.ref,
        'h:Reply-To': process.env.MAILGUN_FROM_EMAIL,
        text: 'Your payment has been successfully received. Your ticket reference number is: ' + job.data.ref
    }, function (err, info) {
        if (err) {
            logger.info({ref: job.data.ref, eventId: job.data.eventId, status: 'ERROR_EMAIL_REQUEST', data: null, err: err});
            console.log('Error: ' + err);
            done(err);
        }
        else {
            logger.info({ref: job.data.ref, eventId: job.data.eventId, status: 'SUCCESS_EMAIL_REQUEST', data: null, err: null});
            //console.log('Response: ' + info);
            done();
        }
    });
});

module.exports = router;
