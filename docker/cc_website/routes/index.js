var express = require('express');
var router = express.Router();


router.get('/', function (req, res, next) {
    res.render('index', {title: 'Jain Academy Payments', payment_title: "Fundamentals of Jainism : August 2018"});
});

router.post('/issueTicket', function (req, res, next) {
    console.log(req.body);
    res.json({status: "ok"})
});

module.exports = router;
