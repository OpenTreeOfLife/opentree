/*
 * Client-side behavior for the Open Tree curation UI
 *
 * This uses the Open Tree API to fetch and store studies and trees remotely.
 */

// these variables should already be defined in the main HTML page
var API_create_study_POST_url;
var singlePropertySearchForStudies_url;

$(document).ready(function() {
    // set initial state for all details
    updateImportOptions();

    // any change in widgets should (potentially) update all
    $('input, textarea, select').unbind('change').change(updateImportOptions);
    $('input, textarea').unbind('keyup').keyup(updateImportOptions);
});

function enableDetails($panel) {
    var $widgets = $panel.find('input, textarea');
    $panel.css('opacity','1.0');
    $widgets.removeAttr('disabled');
    $panel.unbind('click');
}
function disableDetails($panel) {
    var $widgets = $panel.find('input, textarea');
    $panel.css('opacity','0.5');
    $widgets.attr('disabled', 'disabled');
    $panel.unbind('click').click(function() {
        showErrorMessage('Please choose this study creation method (radio button above) to edit these settings.');
    });
}

function updateImportOptions() {
    // Show license detail fields IF "another license" is chosen, else hide it.
    var $cc0Details = $('#applying-cc0-details'); // set of widgets
    var $altLicenseDetails = $('#alternate-license-details'); // set of widgets
    var $altOtherLicenseInfo = $('#other-license-info');  // subset, used only if "Other license' chosen
    var $chosenLicense = $('input[name=data-license]:checked');
    var authorChoosingToApplyCC0 = ($chosenLicense.attr('id') === 'apply-new-CC0-waiver');
    var altLicenseDetailsRequired = ($chosenLicense.attr('id') === 'study-data-has-existing-license');
    var chosenAltLicense = $('select[name=alternate-license]').val();
    var altOtherLicenseInfoRequired = altLicenseDetailsRequired && (chosenAltLicense === 'OTHER');
    // adjust main cc0 widgets
    if (authorChoosingToApplyCC0) {
        $cc0Details.slideDown('fast');
    } else {
        $cc0Details.slideUp('fast');
    }
    
    // adjust the innermost license widgets first
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
    //  * user is importing from TreeBASE and has  entered a TreeBASE ID
    //    OR
    //  * user is uploading data and has  entered a DOI/URL
    //  * license option is chosen and (if "another license") complete
    var creationAllowed = true;
    var chosenImportLocation = $('[name=import-from-location]:checked').val();
    var errMsg;
    var $treebaseDetailPanel = $('#import-method-TREEBASE_ID');
    var $uploadDetailPanel = $('#import-method-PUBLICATION_DOI');
    switch(chosenImportLocation) {
        case 'IMPORT_FROM_TREEBASE':
            enableDetails( $treebaseDetailPanel );
            disableDetails( $uploadDetailPanel );

            // Are we ready to continue?
            if ($.trim($('input[name=treebase-id]').val()) === '') {
                creationAllowed = false;
                errMsg = 'You must enter a TreeBASE ID to continue.';
            } else {
                var testForInt = $.trim($('input[name=treebase-id]').val());
                if (isNaN(testForInt) || parseInt(testForInt) != testForInt) {
                    creationAllowed = false;
                    errMsg = 'TreeBASE ID should be an integer.';
                }
            }

            // Licensing is assumed to be covered by CC0 waiver
            break;

        case 'IMPORT_FROM_UPLOAD':
            disableDetails( $treebaseDetailPanel );
            enableDetails( $uploadDetailPanel );
            
            // Are we ready to continue?
            if ($.trim($('input[name=publication-DOI]').val()) === '') {
                creationAllowed = false;
                errMsg = 'You must enter a DOI (preferred) or URL to continue.';
            } else {
                // Check for a compliant license or waiver
                if ($chosenLicense.length === 0) {
                    creationAllowed = false;
                    errMsg = 'You must select an appropriate waiver or license for these data.';
                } else if (authorChoosingToApplyCC0 && !($('#agreed-to-CC0').is(':checked'))) {
                    creationAllowed = false;
                    errMsg = 'You must agree to release the data under the terms of the CC0 waiver.';
                } else if (altLicenseDetailsRequired && (chosenAltLicense === '')) {
                    creationAllowed = false;
                    errMsg = 'You must select an appropriate waiver or license for these data.';
                } else if (altOtherLicenseInfoRequired) {
                    if ($.trim($('input[name=data-license-name]').val()) === '') {
                        creationAllowed = false;
                        errMsg = 'You must specify the name and URL of the current data license for these data.';
                    }
                    if ($.trim($('input[name=data-license-url]').val()) === '') {
                        creationAllowed = false;
                        errMsg = 'You must specify the name and URL of the current data license for these data.';
                    }
                }
            }
            break;

        case undefined:
            disableDetails( $treebaseDetailPanel );
            disableDetails( $uploadDetailPanel );

            creationAllowed = false;
            errMsg = 'You must choose a study creation method (import from TreeBASE, or upload from your computer).';
            break;

        default:
            console.log('UNEXPECTED chosenImportLocation:');
            console.log(chosenImportLocation);
            console.log(typeof(chosenImportLocation));
    } 

    
    var $continueButton = $('#continue-button');
    if (creationAllowed) {
        hideFooterMessage('FAST');
        $continueButton.css('opacity', 1.0);
        $continueButton.unbind('click').click(function(evt) {
            createStudyFromForm(evt);
            return false;
        });
    } else {
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

function createStudyFromForm( evt ) {
    // Gather current create/import options and trigger study cration.
    // Server should create a new study (from JSON "template") and try to
    // import data based on user input. Major errors (eg, import failure)
    // should keep us here; otherwise, we should redirect to the new study in
    // the full edit page. (Minor problems with imported data might appear
    // there in a popup.)
      
    // Don't respond to ENTER key, just explicit button clicks (so we can
    // determine the chosen import method)
    evt.preventDefault();

    showModalScreen("Adding study...", {SHOW_BUSY_BAR:true});
    
    // Map the chosen location (data source) to an import method. (This is now
    // a simple mapping, whereas we previously had multiple methods per location.)
    var chosenImportLocation = $('[name=import-from-location]:checked').val();
    var importMethod = (chosenImportLocation === 'IMPORT_FROM_TREEBASE') ?
        'import-method-TREEBASE_ID' : 'import-method-PUBLICATION_DOI';
    console.log("importMethod: ["+ importMethod +"]");

    $.ajax({
        global: false,  // suppress web2py's aggressive error handling
        type: 'POST',
        dataType: 'json',
        // crossdomain: true,
        // contentType: "application/json; charset=utf-8",
        url: API_create_study_POST_url,
        data: {
            // Gather chosen study-creation options. NOTE that we send all variables and
            // depend on the server to discern which ones really matter.
            'import_method': importMethod,
            'import_from_location': $('[name=import-from-location]:checked').val() || '',
            'treebase_id': $('[name=treebase-id]').val() || '',
            'publication_DOI': $('[name=publication-DOI]').val() || '',
            //'publication_reference': $('[name=publication-reference]').val() || '',
            //'nexml_fetch_url': $('[name=nexml-fetch-url]').val() || '',
            //'nexml_pasted_string': $('[name=nexml-pasted-string]').val() || '',
            //
            // CC0 and alternate license info
            'chosen_license': $('input[name=data-license]:checked').val(),
            'cc0_agreement': $('#agreed-to-CC0').is(':checked'),
            'alternate_license': $('select[name=alternate-license]').val(),
            'alt_license_name': $.trim($('input[name=data-license-name]').val()),
            'alt_license_URL': $.trim($('input[name=data-license-url]').val()),
            //
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
            hideModalScreen();
            var errMsg; 
            if ((typeof(jqXHR.responseText) !== 'string') || jqXHR.responseText.length === 0) {
                errMsg = 'Sorry, there was an error creating this study. (No more information is available.)';
            } else {
                errMsg = 'Sorry, there was an error creating this study. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">Show details</a><pre class="error-details" style="display: none;">'+ jqXHR.responseText +'</pre>';
            }
            showErrorMessage(errMsg);
        }
    });
}
