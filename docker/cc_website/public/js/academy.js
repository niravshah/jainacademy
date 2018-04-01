$(function () {

    $('.processing').hide();
    $('.processing-success').hide();
    $('.processing-error').hide();

    $('#ticketType').multiselect({
        buttonWidth: '400px',
        numberDisplayed: 1,
        onInitialized: function (select, container) {
            setPaymentValue();
        },
        onChange: function (option, checked, select) {
            setPaymentValue();
        }
    });

    $('#totalTicketNums').on('change', function () {
        setPaymentValue();
    })
    ;
    $('#datetimepicker1').datetimepicker({format: 'MM/DD/YYYY'});
    $('[data-toggle="tooltip"]').tooltip();

    $('#payment-form').validator().on('submit', function (e) {
        $('.processing').show();
        $('#payment-form').hide();
        if (e.isDefaultPrevented()) {
            $('.processing').hide();
            $('#payment-form').show();
        } else {
            e.preventDefault();
            stripe.createToken(card).then(function (result) {
                if (result.error) {
                    var errorElement = document.getElementById('card-errors');
                    errorElement.textContent = result.error.message;
                    $('.processing').hide();
                    $('#payment-form').show();
                } else {
                    $.ajax({
                        url: '/issueTicket',
                        data: getFormData(result.token.id),
                        type: 'post',
                        dataType: 'json',
                        success: function (result, status, xhr) {
                            $('.processing').hide();
                            $('.processing-success').show();
                        },
                        error: function (xhr, status, error) {
                            $('.processing').hide();
                            $('.processing-error').show();
                        }
                    })
                }
            });
        }
    });

    var stripe = Stripe('pk_test_6pRNASCoBOKtIshFeQd4XMUh');
    var elements = stripe.elements();

    var style = {
        base: {
            color: '#32325d',
            lineHeight: '18px',
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            fontSmoothing: 'antialiased',
            fontSize: '16px',
            '::placeholder': {
                color: '#aab7c4'
            }
        },
        invalid: {
            color: '#ed2025',
            iconColor: '#ed2025'
        }
    };

    var card = elements.create('card', {style: style});
    card.mount('#card-element');


    card.addEventListener('change', function (event) {
        var displayError = document.getElementById('card-errors');
        if (event.error) {
            displayError.textContent = event.error.message;
        } else {
            displayError.textContent = '';
        }
    });

    function setPaymentValue() {

        $('#submitPaymentBtn').html('Submit Payment - £' + getPaymentAmount())

    }

    function getPaymentAmount() {
        var tickets = $('#ticketType option:selected');
        var totalCost = 0;
        $(tickets).each(function (idx, ticket) {
            totalCost += parseInt($(this).val());
        });

        var numOfTicks = parseInt($('#totalTicketNums').val());
        var donationAmt = parseInt($('#inputDonation').val());
        return totalCost * numOfTicks + donationAmt;
    }

    function getSelectedTickets() {
        var tickets = $('#ticketType option:selected');
        var ticks = {};
        $(tickets).each(function (idx, ticket) {
            ticks[$(this).text()] = parseInt($(this).val());
        });
        return ticks;
    }

    function getFormData(stripeToken) {
        var data = {};
        data['stripeToken'] = stripeToken;
        data['totalTicketNums'] = $('#totalTicketNums').val();
        data['firstName'] = $('#inputFirstName').val();
        data['lastName'] = $('#inputLastName').val();
        data['email'] = $('#inputEmail').val();
        data['birthDate'] = $("#datetimepicker1").find("input").val();
        data['donation'] = $('#inputDonation').val();
        data['ticket'] = getSelectedTickets();
        data['paymentAmount'] = getPaymentAmount();
        return data;
    }

});