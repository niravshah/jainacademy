var mongoose = require('mongoose');
module.exports = mongoose.model('User', {
    ref: {type: String, required: true},
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    email: {type: String, required: true},
    birthDate: {type: String},
    donation: {type: Number, default: 0, required: true},
    paymentAmount: {type: Number, required: true},
    totalTicketNums: {type: Number, default: 1, required: true},
    stripeToken: {type: String, default: ''},
    tickets:{ type : Array , default : [] }
});


