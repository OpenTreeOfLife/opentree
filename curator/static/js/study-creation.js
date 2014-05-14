/*
 * Client-side behavior for the Open Tree curation UI
 *
 * This uses the Open Tree API to fetch and store studies and trees remotely.
 */

// these variables should already be defined in the main HTML page
var API_create_study_POST_url;

$(document).ready(function() {
    // set initial state for all details
    updateImportOptions();

    // any change in widgets should (potentially) update all
    $('input, textarea, select').unbind('change').change(updateImportOptions);
});

function updateImportOptions() {
    // Show license detail fields IF "another license" is chosen, else hide it.
    var $altLicenseDetails = $('#alternate-license-details'); // set of widgets
    var $altOtherLicenseInfo = $('#other-license-info');  // subset, used only if "Other license' chosen
    var $chosenLicense = $('input[name=data-license]:checked');
    var altLicenseDetailsRequired = ($chosenLicense.attr('id') === 'tree-data-has-another-license');
    var chosenAltLicense = $('select[name=alternate-license]').val();
    var altOtherLicenseInfoRequired = altLicenseDetailsRequired && (chosenAltLicense === 'OTHER');
    // adjust the innermost widgets first
    if (altOtherLicenseInfoRequired) {
        $altOtherLicenseInfo.slideDown('fast');
    } else {
        $altOtherLicenseInfo.slideUp('fast');
    }
    // ... then the main alt-license selector + friends
    if (altLicenseDetailsRequired) {
        $altLicenseDetails.slideDown('fast');
    } else {
        $altLicenseDetails.slideUp('fast');
    }
    
    // Enable Continue button IF we have a working set of choices, else disable it.
    //  * user has entered a TreeBASE ID, a DOI, or a reference string
    //  * license option is chosen and (if "another license") complete
    var creationAllowed = true;
    var $oneRequiredFields = $('input[name=treebase-id], input[name=publication-DOI], textarea[name=publication-reference]');
    var populatedFieldFound = false;
    $oneRequiredFields.each(function() {
        if ($.trim($(this).val()) !== '') {
            populatedFieldFound = true;
            console.log("FOUND POP!");
            return false;
        }
    });
    if (!populatedFieldFound) {
        creationAllowed = false;
    }

    if ($chosenLicense.length === 0) {
        creationAllowed = false;
    } else if (altLicenseDetailsRequired && (chosenAltLicense === '')) {
        creationAllowed = false;
    } else if (altOtherLicenseInfoRequired) {
        if ($.trim($('input[name=data-license-name]').val()) === '') {
            creationAllowed = false;
        }
        if ($.trim($('input[name=data-license-url]').val()) === '') {
            creationAllowed = false;
        }
    }
    
    var $continueButton = $('#continue-button');
    if (creationAllowed) {
        hideFooterMessage('FAST');
        $continueButton.css('opacity', 1.0);
        $continueButton.unbind('click').click(function(evt) {
            createStudyFromForm(this, evt);
            return false;
        });
    } else {
        var errMsg;
        if (!populatedFieldFound) {
            errMsg = 'You must enter a TreeBASE ID, a DOI/URL, or a reference string to continue.';
        } else if (altOtherLicenseInfoRequired) {
            errMsg = 'You must specify the name and URL of the current data license for this study.';
        } else {
            errMsg = 'You must select the appropriate data license for this study.';
        }
        $continueButton.css('opacity', 0.5);
        $continueButton.unbind('click').click(function(e) {
            showErrorMessage(errMsg);
            return false;
        });
    }
}


function validateFormData() {
    // return success (t/f?), or a structure with validation errors
    // TODO: or use more typical jQuery machinery, or validation plugin?
    return true;
}

function createStudyFromForm( clicked, evt ) {
    // Gather current create/import options and trigger study cration.
    // Server should create a new study (from JSON "template") and try to
    // import data based on user input. Major errors (eg, import failure)
    // should keep us here; otherwise, we should redirect to the new study in
    // the full edit page. (Minor problems with imported data might appear
    // there in a popup.)
      
    // Don't respond to ENTER key, just explicit button clicks (so we can
    // determine the chosen import method)
    evt.preventDefault();

alert('TODO: Jump to study-edit page...'); return false;

    showModalScreen("Adding study...", {SHOW_BUSY_BAR:true});
    
    var importMethod = '';
    var $clicked = $(clicked);
    var $methodPanel = $clicked.closest('div[id^=import-method-]');
    if ($methodPanel.length === 1) {
        importMethod = $methodPanel.attr('id');
        console.log("importMethod: ["+ importMethod +"]");
    } else {
        // insist on a proper button click for this form
        console.warn("Expected a button or input:button, bailing out now!");
        return false;
    }

    $.ajax({
        type: 'POST',
        dataType: 'json',
        // crossdomain: true,
        // contentType: "application/json; charset=utf-8",
        url: API_create_study_POST_url,
        data: {
            // gather chosen study-creation options
            'import_method': importMethod,
            'cc0_agreement': $('#agreed-to-CC0').is(':checked'),
            'import_from_location': $('[name=import-from-location]:checked').val() || '',
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

