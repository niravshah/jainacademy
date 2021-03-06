$(function () {

    $('.processing').hide();
    $('.processing-success').hide();
    $('.processing-error').hide();

    $('#ticketType').multiselect({
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
    });

    $('#inputDonation').on('change', function () {
        setPaymentValue();
    });

    $('#downloadImage').on('click', function (ev) {
        ev.preventDefault();
        console.log('Download Image button pressed');
        convertDomToImage()
    });

    var defaultDate = moment("20000130", "YYYYMMDD");
    $('#datetimepicker1').datetimepicker({format: 'DD/MM/YYYY', defaultDate: defaultDate});
    $('[data-toggle="tooltip"]').tooltip();

    $('#payment-form').validator().on('submit', function (e) {

        $form = $(this);
        var url = $form.attr('action');
        var errorUrl = url + '/error';

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
                        url: url,
                        data: JSON.stringify({data: getFormData(result.token)}),
                        type: 'POST',
                        contentType: 'application/json',
                        dataType: 'json',
                        success: function (result, status, xhr) {
                            $('.processing').hide();
                            $('.processing-success').show();
                            $('#refFromServer').text("Your ticket reference is: " + result.ref + ". Please save this reference.")
                        },
                        error: function (xhr, status, error) {
                            $('.processing').hide();
                            $('.processing-error').show();
                            $('#refFromServer').text("Your reference is: " + result.ref)

                            $.ajax({
                                url: errorUrl,
                                type: 'POST',
                                contentType: 'application/json',
                                dataType: 'json',
                                data: JSON.stringify({data: getFormData(error.message), ref: getFormData(result.token)})
                            })
                        }
                    })
                }
            });
        }
    });

    var stripe = Stripe('pk_live_p5ytneUFhzMSWRuCpi5siZRc');
    var elements = stripe.elements();

    var style = {
        base: {
            color: '#32325d',
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
        console.log("Get Payment Amount: ", tickets);
        var totalCost = 0;
        $(tickets).each(function (idx, ticket) {
            console.log(ticket);
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
            ticks[parseInt($(this).val())] = $(this).text();
        });
        return ticks;
    }

    function getFormData(stripeToken) {
        var data = {};
        data['stripeToken'] = stripeToken;
        data['numOfTickets'] = $('#totalTicketNums').val();
        data['firstName'] = $('#inputFirstName').val();
        data['telNum'] = $('#inputTeleNum').val();
        data['email'] = $('#inputEmail').val();
        data['birthDate'] = $("#datetimepicker1").find("input").val();
        data['donation'] = $('#inputDonation').val();
        data['tickets'] = getSelectedTickets();
        data['paymentAmount'] = getPaymentAmount();
        return data;
    }

    function convertDomToImage() {
        domtoimage.toJpeg(document.getElementById('whatsapp-share-img'), {quality: 0.95})
            .then(function (dataUrl) {
                var link = document.createElement('a');
                link.download = 'my-image-name.jpeg';
                link.href = dataUrl;
                link.click();
            });

    }

});