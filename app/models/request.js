var mongoose = require('mongoose');
module.exports = mongoose.model('Request', {
    eventId: {type: String},
    ref: {type: String, required: true},
    firstName: {type: String, required: true},
    telNum: {type: String, required: true},
    email: {type: String, required: true},
    birthDate: {type: String},
    donation: {type: Number, default: 0, required: true},
    paymentAmount: {type: Number, required: true},
    numOfTickets: {type: Number, default: 1, required: true},
    stripeToken: {type: Object},
    tickets: {type: Object},
    stripeCharge: {type: Object},
    status: {type: String, enum: ['NEW', 'PAYMENT_PROCESSED'], default: 'NEW'},
});


