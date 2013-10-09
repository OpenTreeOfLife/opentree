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
var viewModel;

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

            // declarative mapping of raw JS obj to view-model, using mapping plugin
            var mapping = {  // modify default mapping options
                // specify an (all-purpose?) function for determine a key property on some types
                key: function(item) {
                    // what happens if no @id is found on some items?
                    return ko.utils.unwrapObservable(item['@id']);
                },
                // some properties should never changes; these can be copied as-is, avoiding the overhead of making them "observable"
                copy: ['@property','@xsi:type']
            }
            viewModel = ko.mapping.fromJS(data, mapping);

            ko.applyBindings(viewModel);

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

function validateFormData() {
    // return success (t/f?), or a structure with validation errors
    // TODO: or use more typical jQuery machinery, or validation plugin?
    return true;
}

function saveFormDataToStudyJSON() {
    // save all populated fields; clear others, or remove from JSON(?)
    $('#ajax-busy-bar').show();

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
            nexson: ko.mapping.toJSON(viewModel),
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

/* 
 * Use Knockout.js for smart, persistent binding of JS model to UI
 */

// TODO: incorporate its methods into mapped viewModel above?
function StudyViewModel() {
    var self = this;
    self.nexml = {
        meta: ko.observableArray([ ])
    }
    self.getByAtProperty = function(array, prop) {
        // fetch from a list by @property value
        for (var i = 0; i < array.length; i++) {
            var testItem = array[i];
            if (testItem['@property'] === prop) {
                return testItem.value; // assumes value is stored here
            }
            return null;
        }
    }

};

function getMetaTagAccessorByAtProperty(array, prop) {
    // fetch accessor(!) function for a metatag in the specified list, using its @property value
    for (var i = 0; i < array.length; i++) {
        var testItem = array[i];
        if (testItem['@property']() === prop) {
            switch(testItem['@xsi:type']()) {
                case 'nex:ResourceMeta':
                    return testItem['@href'];  // uses special attribute
                default: 
                    return testItem.$; // assumes value is stored here
            }
        }
    }
    return null;
}

/* support classes for objects in arrays 
 * (TODO: use these instead of generlc observables?) 
 */
function MetaTag( name, type, value ) {
    var self = this;
    self.name = name;   // .@property
    self.type = type;   // .@xsi:type
    self.value = ko.observable(value);  // .$
}
function OTU(id, label, about, meta) {
    var self = this;
    self.id = id;   // .@id
    self.label = label;   // .@label
    self.about = about;   // .@about
    self.meta = ko.observableArray();  // .meta
    // add all meta entries as MetaTag instances
    for(var i = 0; i < meta.length; i++) {
        self.meta.push( new MetaTag( meta[i] ) );
    }
}
function Tree(id, about, meta, edge, node) {
    var self = this;
    self.id = id;         // .@id
    self.about = about;   // .@about
    self.meta = ko.observableArray();  // .meta
    // add all meta entries as MetaTag instances
    for(var i = 0; i < meta.length; i++) {
        self.meta.push( new MetaTag( meta[i] ) );
    }
    self.edge = ko.observableArray();  // .edge
    // add all edge entries as TreeEdge instances
    for(var i = 0; i < edge.length; i++) {
        self.edge.push( new TreeEdge( edge[i] ) );
    }
    self.node = ko.observableArray();  // .node
    // add all node entries as TreeNode instances
    for(var i = 0; i < node.length; i++) {
        self.node.push( new TreeNode( node[i] ) );
    }
}
function TreeEdge() {
}
function TreeNode() {
}



