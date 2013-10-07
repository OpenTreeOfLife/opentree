/*
 * Client-side behavior for the Open Tree curation UI
 *
 * This uses the OTOL API to fetch and store studies and trees remotely.
 */

// these variables should already be defined in the main HTML page
var studyID;
var API_create_study_POST_url;
var API_load_study_GET_url;
var API_update_study_PUT_url;

// working space for parsed JSON objects (incl. sub-objects)
var studyJSON;
var metadataJSON; // do we want this?
var treeJSON;  // re-use for each selected tree

$(document).ready(function() {
    loadSelectedStudy(studyID);
});


function loadSelectedStudy(id) {
    /* Use REST API to pull study data from datastore
     * :EXAMPLE: GET http://api.opentreeoflife.org/1/study/{23}.json
     * 
     * Offer a visible progress bar (studies can be very large)
     *
     * Gracefully handle and report:
     *  - remote service not available
     *  - study missing or not found
     *  - too-large studies? will probably choke on parsing
     *  - misc errors from API
     *  - any local storage (in Lawnchair) that trumps the one in remote storage
     */

    var fetchURL = API_load_study_GET_url.replace('{STUDY_ID}', studyID);

    // TODO: try an alternate URL, pulling directly from GitHub?

    // TODO: switch to JSONP, in case we're calling another domain

    // HACK to prevent additional _ arg from being passed (didn't help)
    //$.ajaxSetup({cache:true});

    // TODO: show/hide spinner during all AJAX requests?
    $('#ajax-busy-bar').show();

    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: fetchURL,
        data: { },
        success: function( data, textStatus, jqXHR ) {
            // this should be properly parsed JSON
            console.log('loadSelectedStudy('+ id +'): got the data! textStatus = '+ textStatus);
            // report errors or malformed data, if any
            if (textStatus !== 'success') {
                showErrorMessage('Sorry, there was an error loading this study.');
                return;
            }
            if (typeof data !== 'object' || typeof(data['nexml']) == 'undefined') {
                showErrorMessage('Sorry, there is a problem with the study data.');
                return;
            }

            studyJSON = data;
            metadataJSON = studyJSON.nexml['meta'];
            if (typeof metadataJSON === 'undefined') {
                // add this now?
                studyJSON.nexml.meta = metadataJSON = [ ];
            }

            loadStudyJSONIntoForm();

            $('#ajax-busy-bar').hide();
            showInfoMessage('Study data loaded.');
        }
    });
    console.log('JSONP request sent!');
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

function loadStudyJSONIntoForm() {
    // load all fields found in JSON; clear or remove any others

    //// METADATA

    var metadataFieldNames = [
        'ot_studyPublicationReference',
        'ot_studyPublication',
        'ot_curatorName',
        'ot_studyId',
        'ot_studyYear',
        'ot_focalClade',
    ];
    for (var i = 0; i < metadataFieldNames.length; i++) {
        var fieldID = metadataFieldNames[i];
        $('#'+ fieldID).val('');
    }
    for (i = 0; i < metadataJSON.length; i++) {
        // place each value in its proper field
        var slot = metadataJSON[i];
        var property = slot['@property'];
        // convert namespaced property to valid element ID
        var fieldSelector = '#'+ property.replace(':','_');
        var value = slot.$;
        console.log("Setting field '"+ fieldSelector +"' to: "+ value);
        $(fieldSelector).val(value);
    }

    //// TODO: TREES

    //// TODO: FILES 

    //// TODO: etc.

}

function validateFormData() {
    // return success (t/f?), or a structure with validation errors
    // TODO: or use more typical jQuery machinery, or validation plugin?
    return true;
}

function saveFormDataToStudyJSON() {
    // save all populated fields; clear others, or remove from JSON(?)
    $('#ajax-busy-bar').show();

    //// METADATA

    var metadataFieldNames = [
        'ot_studyPublicationReference',
        'ot_studyPublication',
        'ot_curatorName',
        'ot_studyId',
        'ot_studyYear',
        'ot_focalClade',
    ];
    for (var i = 0; i < metadataFieldNames.length; i++) {
        var fieldID = metadataFieldNames[i];
        var field = $('#'+ fieldID);
        var jsonPropertyName = fieldID.replace('_', ':');
        var slot = getMatchingMetadataSlot( jsonPropertyName )
        slot.$ = field.val();
    }

    //// push changes back to storage
    var saveURL = API_update_study_PUT_url.replace('{STUDY_ID}', studyID);

    $.ajax({
        type: 'POST',  // TODO: use PUT for updates?
        dataType: 'json',
        // crossdomain: true,
        // contentType: "application/json; charset=utf-8",
        url: saveURL,
        data: {
            // use JSON stringify (if available) for faster submission of JSON
            nexson: (JSON && JSON.stringify) ? JSON.stringify(studyJSON) : studyJSON,
            author_name: authorName,
            author_email: authorEmail,
            auth_token: authToken
        },
        success: function( data, textStatus, jqXHR ) {
            // this should be properly parsed JSON
            console.log('saveFormDataToStudyJSON(): done! textStatus = '+ textStatus);
            // report errors or malformed data, if any
            if (textStatus !== 'success') {
                showErrorMessage('Sorry, there was an error saving this study.');
                return;
            }

            $('#ajax-busy-bar').hide();
            showSuccessMessage('Study saved to remote storage.');

            // TODO: should we expect fresh JSON to refresh the form?
        }
    });
}

function getMatchingMetadataSlot( propName ) {
    // TODO: replace this with something more general and powerful
    for (i = 0; i < metadataJSON.length; i++) {
        // find the one with the matching property name
        var slot = metadataJSON[i];
        var property = slot['@property'];
        if (property === propName) return slot;
    }
    // TODO: add a slot and return it?
    return null;
}

