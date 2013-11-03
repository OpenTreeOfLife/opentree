/*
 * Client-side behavior for the Open Tree curation UI
 *
 * This uses the OTOL API to fetch and store studies and trees remotely.
 */

// these variables should already be defined in the main HTML page
var API_create_study_POST_url;
var API_load_study_GET_url;
var API_update_study_PUT_url;

$(document).ready(function() {
    // disable radio buttons, pending acceptance of CC0
    $('input:radio[name=import-option]')
        .removeAttr('checked')
        .attr('disabled','disabled')
        .click(updateCreationDetails);

    // CC0 checkbox should enable/disable radios on click
    $('input:checkbox[name=cc0-agreement]').click(function() {
        var $cb = $(this);
        updateCreationDetails();
    });

    // enable all submit buttons
    $('#import-options button').click(function() {
        createStudyFromForm();
        return false;
    });

    // set initial state for all details
    updateCreationDetails();
});

function updateCreationDetails() {
    // update the visibility and (in)active state of panels, based on the
    // state of their respective radio buttons

    if ($('input:checkbox[name=cc0-agreement]').is(':checked')) {
        $('input:radio[name=import-option]').removeAttr('disabled');
        $('#import-options').css('opacity', 1.0);
        $('#import-options').unbind('click');
    } else {
        $('input:radio[name=import-option]').attr('disabled','disabled');
        $('#import-options').css('opacity', 0.5);
        $('#import-options').click(function() {
            showErrorMessage('You must accept CC-0 licensing to import a study.');
        });
    }

    $.each($('[id^=import-details-]'), function(index, details) {
        var $details = $(details);
        var matchingRadioID = $details.attr('id').split('details').join('option');
        var $radio = $('#'+ matchingRadioID);


        console.log( $radio.attr('id') + "...");
        console.log( "~"+ $details.attr('id') + "...");
        // hide or show details based on checked status
        if ($radio.is(':checked')) {
            console.log( "  CHECKED" );
            $details.slideDown('fast');
        } else {
            console.log( "  NOT-CHECKED" );
            $details.slideUp('fast');
        }
    });
}

function showErrorMessage(msg) {
    $('.flash .message').html(msg);
    $('.flash').removeClass('alert-info')
               .removeClass('alert-success')
               .addClass('alert-error').slideDown();
}

function showInfoMessage(msg) {
    $('.flash .message').html(msg);
    $('.flash').removeClass('alert-error')
               .removeClass('alert-success')
               .addClass('alert-info').slideDown();
}

function showSuccessMessage(msg) {
    $('.flash .message').html(msg);
    $('.flash').removeClass('alert-info')
               .removeClass('alert-error')
               .addClass('alert-success').slideDown();
}

function validateFormData() {
    // return success (t/f?), or a structure with validation errors
    // TODO: or use more typical jQuery machinery, or validation plugin?
    return true;
}

function createStudyFromForm( clicked ) {
    // Gather current create/import options and trigger study cration.
    // Server should create a new study (from JSON "template") and try to
    // import data based on user input. Major errors (eg, import failure)
    // should keep us here; otherwise, we should redirect to the new study in
    // the full edit page. (Minor problems with imported data might appear
    // there in a popup.)
    //
    // TODO: support ENTER key vs explicit button click?

    $('#ajax-busy-bar').show();
    
    $.ajax({
        type: 'POST',
        dataType: 'json',
        // crossdomain: true,
        // contentType: "application/json; charset=utf-8",
        url: API_create_study_POST_url,
        data: {
            // gather chosen study-creation options
            'cc0_agreement': $('#cc0-agreement').is(':checked'),
            'import_option': $('[name=import-option]:checked').val() || '',
            'treebase_id': $('[name=treebase-id]').val() || '',
            'dryad_DOI': $('[name=dryad-DOI]').val() || '',
            'publication_DOI': $('[name=publication-DOI]').val() || '',
            // misc identifying information
            'author_name': authorName,
            'author_email': authorEmail,
            'auth_token': authToken
        },
        success: function( data, textStatus, jqXHR ) {
            // creation method should return either a redirect URL to the new study, or an error
            debugger;
            console.log('createStudyFromForm(): done! textStatus = '+ textStatus);
            // report errors or malformed data, if any
            if (textStatus !== 'success') {
                showErrorMessage('Sorry, there was an error creating this study.');
                return;
            }

            $('#ajax-busy-bar').hide();
            showSuccessMessage('Study created, redirecting now....');
            // TODO: bounce to the new location
        },
        error: function( data, textStatus, jqXHR ) {
            debugger;
        }
    });
}

