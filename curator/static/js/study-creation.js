/*
 * Client-side behavior for the Open Tree curation UI
 *
 * This uses the Open Tree API to fetch and store studies and trees remotely.
 */

// these variables should already be defined in the main HTML page
var API_create_study_POST_url;

$(document).ready(function() {
    // disable radio buttons, pending acceptance of CC0
    $('input:radio[name=import-option]')
        .removeAttr('checked')
        //.attr('disabled','disabled')
        .click(updateImportMethods);

    // CC0 radio buttons should enable options below when selected
    $('input:radio[name=cc0-agreement]')
        .removeAttr('checked')
        .click(function() {
            updateImportMethods();
        });

    // set initial state for all details
    updateImportMethods();
});

var locationToMethodMapping = {
    'import-from-TREEBASE' : [
        'import-method-TREEBASE_ID'
    ],
    'import-from-ANOTHER_ARCHIVE' : [ 
        'import-method-PUBLICATION_DOI',
        'import-method-PUBLICATION_REFERENCE',
        'import-method-NEXML',
        'import-method-MANUAL_ENTRY'
    ],
    'import-from-UPLOAD' : [ 
        'import-method-UPLOAD_WARNING',
        'import-method-NEXML',
        'import-method-MANUAL_ENTRY',
        'import-method-UPLOAD_LICENSE'
    ]
};
function updateImportMethods() {
    // update the visibility and (in)active state of methods, based on the
    // state of their respective radio buttons
    var licenseChoiceRequired = false;

    var $chosenLocationRadio = $('input[name=import-option]:checked');
    if ($chosenLocationRadio.length === 0) {
        // hide all methods
        $('[id^=import-method-]').hide();
    } else {
        var chosenLocation = $chosenLocationRadio.eq(0).attr('id');
        if (chosenLocation === 'import-from-UPLOAD') {
            licenseChoiceRequired = true;
        }
        var itsMethods = locationToMethodMapping[ chosenLocation ];
        $('[id^=import-method-]').each(function() {
            var $methodPanel = $(this);
            var panelID = $methodPanel.attr('id');
            if ($.inArray(panelID, itsMethods) === -1) {
                // ie, not a listed  method for the current location
                $methodPanel.slideUp('fast');
            } else {
                // show this method (matches location)
                $methodPanel.slideDown('fast');
            }
        });
    }

    // Have they chosen a valid licensing option?
    var uploadMethods = locationToMethodMapping[ 'import-from-UPLOAD' ];
    var $uploadImportButtons = $( '#'+ uploadMethods.join(', #') ).find('button');
    var licenseChoiceMade = $('input:radio[name=cc0-agreement]').is(':checked');
    if (licenseChoiceRequired && !(licenseChoiceMade)) {
        // block all import options for upload
        $uploadImportButtons.css('opacity', 0.5);
        $uploadImportButtons.unbind('click').click(function(e) {
            showErrorMessage('You must choose a data licensing option to upload a study.');
            return false;
        });
    } else {
        // enable all import options for upload
        $uploadImportButtons.css('opacity', 1.0);
        $uploadImportButtons.unbind('click').click(function() {
            createStudyFromForm();
            return false;
        });
    }
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

    showModalScreen("Adding study...", {SHOW_BUSY_BAR:true});
    
    $.ajax({
        type: 'POST',
        dataType: 'json',
        // crossdomain: true,
        // contentType: "application/json; charset=utf-8",
        url: API_create_study_POST_url,
        data: {
            // gather chosen study-creation options
            'cc0_agreement': $('#agreed-to-CC0').is(':checked'),
            'import_option': $('[name=import-option]:checked').val() || '',
            'treebase_id': $('[name=treebase-id]').val() || '',
            'nexml_fetch_url': $('[name=nexml-fetch-url]').val() || '',
            'nexml_pasted_string': $('[name=nexml-pasted-string]').val() || '',
            'publication_DOI': $('[name=publication-DOI]').val() || '',
            'publication_reference': $('[name=publication-reference]').val() || '',
            // misc identifying information
            'author_name': authorName,
            'author_email': authorEmail,
            'auth_token': authToken
        },
        success: function( data, textStatus, jqXHR ) {
            // creation method should return either a redirect URL to the new study, or an error
            hideModalScreen();

            console.log('createStudyFromForm(): done! textStatus = '+ textStatus);
            // report errors or malformed data, if any
            if (textStatus !== 'success') {
                showErrorMessage('Sorry, there was an error creating this study.');
                return;
            }

            showSuccessMessage('Study created, redirecting now....');
            // bounce to the new study in the study editor
            window.location = "/curator/study/edit/"+ data['resource_id'];
        },
        error: function( data, textStatus, jqXHR ) {
            debugger;
        }
    });
}

