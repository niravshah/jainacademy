$(function () {
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
    $('.processing').hide();
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

                    var form = document.getElementById('payment-form');
                    var hiddenInput = document.createElement('input');
                    hiddenInput.setAttribute('type', 'hidden');
                    hiddenInput.setAttribute('name', 'stripeToken');
                    hiddenInput.setAttribute('value', result.token.id);
                    form.appendChild(hiddenInput);

                    // Submit the form
                    form.submit();
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
        var tickets = $('#ticketType option:selected')
        var totalCost = 0;
        var selected = [];
        var ticks = [];
        $(tickets).each(function (idx, ticket) {
            totalCost += parseInt($(this).val());
            selected.push([$(this).val()]);
            ticks.push([$(this).text()]);
        });

        var numOfTicks = parseInt($('#totalTicketNums').val());
        var donationAmt = parseInt($('#inputDonation').val());
        var paymentAmount = totalCost * numOfTicks + donationAmt;

        $('#submitPaymentBtn').html('Submit Payment - £' + paymentAmount)

    }

});