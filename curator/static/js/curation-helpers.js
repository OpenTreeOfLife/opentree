/*
 * Utilities common to multiple pages in the OpenTree study-curation tool.
 */

function fullToCompactReference( fullReference ) {
    var compactReference = "(Untitled)";
    if ($.trim(fullReference) !== "") {
        // capture the first valid year in the reference
        var yearMatches = fullReference.match(/(\d{4})/);
        var compactYear = yearMatches ? yearMatches[0] : "[no year]";  
        // split on the year to get authors (before), and capture the first surname
        var compactPrimaryAuthor = fullReference.split(compactYear)[0].split(',')[0];
        var compactReference = compactPrimaryAuthor +", "+ compactYear;    // eg, "Smith, 1999";
    }
    return compactReference;
}

function showErrorMessage(msg) {
    showFooterMessage(msg, 'error');
}

function showInfoMessage(msg) {
    showFooterMessage(msg, 'info');
}

function showSuccessMessage(msg) {
    showFooterMessage(msg, 'success');
}

var footerMessageCloseID = null;
function showFooterMessage(msg, msgType) {
    var $flashArea = $('.flash');  // should be just one
    
    // hide any previous message and clear its timeout
    $flashArea.hide();
    clearTimeout(footerMessageCloseID);
    footerMessageCloseID = null;

    // replace its contents (may include markup!)
    $flashArea.find('.message').html(msg);

    // incoming msgType should be one of the preset values below
    var msgTypes = ['info', 'success', 'error'];
    $.each(msgTypes, function(i, type) {
        var className = ('alert-'+ type);
        if (type === msgType) {
            $flashArea.addClass( className );
        } else {
            $flashArea.removeClass( className );
        }
    });
    
    // enable the close widget
    $flashArea.find('#closeflash')
        .unbind('click')
        .click( hideFooterMessage );
        
    // some message types should close automatically
    switch( msgType ) {
        case 'info':
        case 'success':
            footerMessageCloseID = setTimeout( hideFooterMessage, 5000 ); 
            break;
        case 'error':
            // these should stay until user dismisses
            $flashArea.unbind('click').click(function(e) {
                // suppress normal hide-me behavior (but allow outbound links)
                console.log(e.target);
                if ($(e.target).is('a[href]')) {
                    console.log("DO-SOMETHING binding");
                    e.stopPropagation();
                    return true;
                }
                console.log("DO-NOTHING BINDING");
                return false;
            });
            break;
    }

    $flashArea.slideDown();
}

function hideFooterMessage( option ) {
    if (option === 'FAST') {
        $('.flash').hide();
    } else {
        $('.flash').fadeOut();
    }
}

function toggleFlashErrorDetails( link ) {
    var $clicked = $(link);
    var $details = $clicked.nextAll('.error-details');
    if ($details.is(':visible')) {
        $details.slideUp(function() {
            $clicked.text('Show details');
        });
    } else {
        $details.slideDown(function() {
            $clicked.text('Hide details');
        });
    }
}

function makeArray( val ) {
    // The caller expects an array, so we should coerce, wrap, or replace
    // the specified value as needed.
    if (typeof(val) === 'function') {
        // unpack an observable value (from Knockout binding) and continue
        val = val();
    }

    var arr;
    if ((typeof(val) === 'undefined') || val === null) {
        arr = [];
    } else if (typeof(val) !== 'object') {
        // other simple value types should be wrapped in an array
        arr = [val]
    } else if (typeof(val.length) === 'undefined') {
        // it's a simple object, wrap it in an array
        arr = [val];
    } else {
        // anything else is already proper array
        arr = val;
    }

    return arr;
}

function updateClearSearchWidget( searchFieldSelector, observable ) {
    // Add/remove clear widget based on field's contents (or its 
    // underlying observable, if provided).
    var $search = $(searchFieldSelector);
    if ($search.length === 0) {
        console.warn("updateClearSearchWidget: field '"+ searchFieldSelector +"' not found!");
        return;
    }
    var testText;
    if ($.isFunction(observable)) {
        // this is more accurate when the filter value is set programmatically
        testText = observable();
    } else {
        // this is good enough if value is always typed directly into the field
        testText = $search.val();
    }
    if ($.trim(testText) === '') {
        // remove clear widget, if any
        $search.next('.clear-search').remove();
    } else {
        // add and enable the clear widget
        var $clear = $search.next('.clear-search');
        if ($clear.length === 0) {
            $search.after('<i class="clear-search icon-remove"></i>');
            $clear = $search.next('.clear-search');
            $clear.click(function() {
               $(this).prev().val('').trigger('change'); 
               return false;
            });
        }
    }
}

function getPageNumbers( pagedArray ) {
    // Generates an array of display numbers (1-based) for use with Knockout's
    // foreach binding. Let's build this with one-based values for easy display.
    var pageNumbers = [ ];
    var howManyPages = Math.ceil(pagedArray().length / pagedArray.pageSize);
    for (var i = 1; i <= howManyPages; i++) {
        pageNumbers.push( i );
    }
    return pageNumbers;
}

function isVisiblePage( pageNum, pagedArray ) {
    var howManyPages = Math.ceil(pagedArray().length / pagedArray.pageSize);
    if (howManyPages <= 12) { 
        return true; 
    }
    // show first, last, and nearby pages
    if (pageNum < 3) {
        return true;
    }
    if (pageNum > (howManyPages - 2)) {
        return true;
    }
    var currentPage = pagedArray.current();
    if (Math.abs(currentPage - pageNum) < 3) {
        return true; 
    }
    return false;
}
/*
var cladeNameTimeoutID = null;
function loadMissingFocalCladeNames() {
    // temporary behavior to AJAX-load missing taxon names wherever we
    // display 'ot:focalClade' values (bare OTT ids, which nobody knows)
    if (cladeNameTimeoutID) {
        clearTimeout( cladeNameTimeoutID );
    }
    cladeNameTimeoutID = setTimeout(function() {
        var $missingNames = $('.focal-clade-name:empty');
        if ($missingNames.length > 0) {
            var $nameWidget = $missingNames[0];
            var $ottID = $nameWidget.parent().find('.focal-clade-id').val();
            if (!$ottID || ($ottID === '')) {
                $nameWidget.val('');
            } else {
                $.ajax(
                    type: 'POST',
                    dataType: 'json',
                    url: findAllStudies_url,
                    data: {"ottId": $oddID.toString()},
                    success: function( data, textStatus, jqXHR ) {
                        console.log("got the taxon name: ");
                        var matchingOttID = data['name'] || '???';
                        console.log( matchingOttID );
                    }
                    
                    // replace another missing name (if any)...
                    loadMissingFocalCladeNames();
                );
            }
        }
    }, 100);
}
*/

/*
 * Cross-browser (as of 2013) support for a "safety net" when trying to leave a
 * page with unsaved changes. This should also protect against the Back button,
 * swipe gestures in Chrome, etc.
 *  
 * Call pushPageExitWarning(), popPageExitWarning() to add/remove this
 * protection as needed.
 *
 * Adapted from  
 * http://stackoverflow.com/questions/1119289/how-to-show-the-are-you-sure-you-want-to-navigate-away-from-this-page-when-ch/1119324#1119324
 *
 * UPDATE (August 2015): Now we have use cases with unsaved changes in both
 * studies and tree collections, so we need a push/pop stack of page-exit
 * warnings.  NOTE that we assume the UI will enforce modality of editing
 * tasks, so that any push+pop sequence will refer to a single task (editing a
 * study, or editing a collection).
 */

var pageExitWarnings = [ ];
var defaultPageExitWarning = "WARNING: This page contains unsaved changes.";

var confirmOnPageExit = function (e) 
{
    // If we haven't been passed the event get the window.event
    e = e || window.event;

    // use the topmost (most recently added) message on the stack
    var message = pageExitWarnings[pageExitWarnings.length - 1];

    // For IE6-8 and Firefox prior to version 4
    if (e) 
    {
        e.returnValue = message;
    }

    // For Chrome, Safari, IE8+ and Opera 12+
    return message;
};

function pushPageExitWarning( warningText ) {
    // add the desired text to our stack of warnings
    pageExitWarnings.push( warningText || defaultPageExitWarning );
    // assign the function that returns the string
    window.onbeforeunload = confirmOnPageExit;
}
function popPageExitWarning() {
    // remove the topmost message from our stack of warnings
    pageExitWarnings.pop();
    if (pageExitWarnings.length === 0) {
        // turn it off - remove the function entirely
        window.onbeforeunload = null;
    } else {
        // prepare to show the previous (underlying) message
        window.onbeforeunload = confirmOnPageExit;
    }
}

function bindHelpPanels() {
    // Enable toggling of help panels anywhere in the page.
    var $helpToggles = $('.help-toggle');
    
    $.each($helpToggles, function(index, toggle) {
        var $toggle = $(toggle);
        var toggleType = $toggle.parent().is('.help-box') ? 'HIDE' : 'SHOW';
        var $mainHelpBox, $outerToggle;
        if (toggleType === 'HIDE') {
            $toggle.unbind('click').click(function() {
                $mainHelpBox = $toggle.parent('.help-box');
                $outerToggle = $mainHelpBox.prevAll('.help-toggle');
                $mainHelpBox.hide();
                $outerToggle.show();
            });
        } else { // assumes 'SHOW'
            $toggle.unbind('click').click(function() {
                $outerToggle = $toggle;
                $mainHelpBox = $outerToggle.nextAll('.help-box');
                $outerToggle.hide();
                $mainHelpBox.show();
            });
        }
    });
}

function showModalScreen( messageHTMLorElement, options ) {
    // NOTE that this can be called repeatedly to update its message
    suspendModalEnforcedFocus();
    $('#modal-screen').modal('show');
    if ( messageHTMLorElement ) {
        $('#modal-screen-message').empty().append(messageHTMLorElement).show();
    } else {
        $('#modal-screen-message').hide();
    }
    // show the barber-pole spinner if there's no message, or if specified
    var showBusyBar = options ? options.SHOW_BUSY_BAR : messageHTMLorElement ? false : true;
    if (showBusyBar) {
        $('#modal-screen-busy-bar').show();
    } else {
        $('#modal-screen-busy-bar').hide();
    }
}
function hideModalScreen() {
    $('#modal-screen').modal('hide');
    restoreModalEnforcedFocus();
}

/* NOTE that Bootstrap modals are somewhat limited; in particular, the
 * expectation is that only one will appear at a time, vs. chained or nested
 * modals. Since our event-blocking screen sometimes overlaps with other
 * modals, we should suspend some behavior to avoid runaway JS as they fight
 * for input focus. See discussion at:
 *   https://github.com/twbs/bootstrap/issues/4781 
 *   http://stackoverflow.com/questions/13649459/twitter-bootstrap-multiple-modal-error
 */
var activeEnforceFocus = $.fn.modal.Constructor.prototype.enforceFocus;
var noopEnforceFocus = function() { };
function suspendModalEnforcedFocus() {
    $.fn.modal.Constructor.prototype.enforceFocus = noopEnforceFocus;
}
function restoreModalEnforcedFocus() {
    $.fn.modal.Constructor.prototype.enforceFocus = activeEnforceFocus;
}

function checkForDuplicateStudies( testDOI, successCallback ) {
    $.ajax({
        global: false,  // suppress web2py's aggressive error handling
        type: 'POST',
        dataType: 'json',
        // crossdomain: true,
        contentType: "application/json; charset=utf-8",
        url: singlePropertySearchForStudies_url,
        data: ('{"property": "ot:studyPublication", "value": '+ 
            JSON.stringify(testDOI) +', "exact": true }'),
        processData: false,
        complete: function( jqXHR, textStatus ) {
            // report errors or malformed data, if any
            if (textStatus !== 'success') {
                if (jqXHR.status >= 500) {
                    // major server-side error, just show raw response for tech support
                    var errMsg = 'Sorry, there was an error checking for duplicate studies. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">Show details</a><pre class="error-details" style="display: none;">'+ jqXHR.responseText +' [auto-parsed]</pre>';
                    hideModalScreen();
                    showErrorMessage(errMsg);
                    return;
                }
                // Server blocked the save due to major validation errors!
                var data = $.parseJSON(jqXHR.responseText);
                // TODO: this should be properly parsed JSON, show it more sensibly
                // (but for now, repeat the crude feedback used above)
                var errMsg = 'Sorry, there was an error checking for duplicate studies. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">Show details</a><pre class="error-details" style="display: none;">'+ jqXHR.responseText +' [parsed in JS]</pre>';
                hideModalScreen();
                showErrorMessage(errMsg);
                return;
            }
            // if we're still here, use the success callback provided
            var responseObj = $.parseJSON(jqXHR.responseText);
            if ($.isArray(responseObj['matched_studies'])) {
                var matchingStudyIDs = [];
                $.each(responseObj['matched_studies'], function(i,obj) {
                    matchingStudyIDs.push( obj['ot:studyId'] );
                });
            } else {
                var errMsg = 'Sorry, there was an error checking for duplicate studies. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">Show details</a><pre class="error-details" style="display: none;">Missing or malformed "matching_studies" in JSON response:\n\n'+ 
                    jqXHR.responseText+'</pre>';
                hideModalScreen();
                showErrorMessage(errMsg);
                return;
            }
            successCallback( matchingStudyIDs );
        }
    });
}
function getViewURLFromStudyID( studyID ) {
    return  '{PROTOCOL}//{HOST}/curator/study/view/{STUDY_ID}'
        .replace('{PROTOCOL}', window.location.protocol)
        .replace('{HOST}', window.location.host)
        .replace('{STUDY_ID}', studyID);
}

function slugify(str) {
    // Convert any string into a simplified "slug" suitable for use in URL or query-string
    return str.toLowerCase()
              .replace(/[^a-z0-9 -]/g, '')  // remove invalid chars
              .replace(/\s+/g, '-')         // collapse whitespace and replace by -
              .replace(/-+/g, '-');         // collapse dashes
}

/* 
 *
 */

// these variables should already be defined in the main HTML page
var userLogin;
var userDisplayName;
var singlePropertySearchForTrees_url;

function fetchAndShowCollection( collectionID ) {
    /* Fetch a known-good collection from the tree-collections API, and open it
     * in a popup.  This should always get the lastest version from the docstore, 
     * complete with its commit history and merged edits from other users.
     */
    var fetchURL = API_load_collection_GET_url.replace('{COLLECTION_ID}', collectionID);
    $.ajax({
        type: 'GET',
        //dataType: 'json',
        url: fetchURL,
        //data: {},
        success: function( data ) {  // success callback
            // N.B. this includes the core collection JSON, plus a wrapper that
            // has history and other supporting values.
            console.log(data);
            showCollectionViewer(data);
        },
        error: function( jqXHR, textStatus, errorThrown ) {
            showErrorMessage("Unable to load collection '"+ collectionID +"'");
        },
        complete: function( jqXHR, textStatus ) {
            //debugger;
        }
    });
}

// Keep track of when the collection viewer is already showing, so we
// can hold it open and step through nodes or trees.
var collectionViewerIsInUse = false;

// Keep safe copy of its markup for re=use as a Knockout template (see below)
var $stashedCollectionViewerTemplate = null;
var $stashedCollectionContributorElement = null;
var $stashedCollectionDecisionElement = null;

function showCollectionViewer( collection, options ) {
    // TODO: allow options for initial display, etc.?
    options = options || {};

    if ($stashedCollectionViewerTemplate === null) {
        // Stash the pristine markup before binding this popup for the first time
        $stashedCollectionViewerTemplate = $('#tree-collection-viewer').clone();
        $stashedCollectionContributorElement = $('#tree-collection-viewer')
            .find('#tree-collection-contributors > li').eq(0).clone();
        $stashedCollectionDecisionElement = $('#tree-collection-viewer')
            .find('#tree-collection-decisions > tr.single-tree-row').eq(0).clone();
    } else {
        // Replace with pristine markup to avoid weird results in later popups
        $('#tree-collection-viewer').contents().replaceWith(
            $stashedCollectionViewerTemplate.clone().contents()
        );
        //$('#tree-collection-contributors').empty().append($stashedCollectionContributorElement);
        //$('#tree-collection-decisions').empty().append($stashedCollectionDecisionElement);
    }

    if (collection) {
        // needs cleanup or initialization?
        ; // do nothing
        //console.log(collection);
    } else {
        // this should *never* happen
        //TODO: alert("showCollectionViewer(): No collection specified!");
        //TODO: return;
        // a dummy object for testing, with core JSON in its inner 'data' member
        collection = { 'data': 
            {
                "url": "https://raw.githubusercontent.com/OpenTreeOfLife/collections/jimallman/trees-about-bees.json",
                "name": "Trees about bees",
                "description": "We're gathering these with an eye toward local synthesis in Anthophila (Apoidea). Contributions welcome!",
                "creator": {"login": "jimallman", "name": "Jim Allman"},
                "contributors": [
                    {"login": "pmidford2", "name": "Peter Midford"},
                    {"login": "kcranston", "name": "Karen Cranston"}
                ],
                "decisions": [
                    {
                        "name": "Andrenidae from Foster, 2002", 
                        "studyID": "ot_23532", 
                        "treeID": "tree9870",
                        "decision": "INCLUDED",
                        "comments": "Lots of good analysis here!"
                    }, 
                    {
                        "name": "Apidae from Winkle, 1998", 
                        "studyID": "ot_12345", 
                        "treeID": "tree999",
                        "decision": "EXCLUDED",
                        "comments": "Questionable methods and major gaps. Let's not use this."
                    }, 
                    {
                        "name": "Colletidae gene tree (also Winkle)", 
                        "studyID": "ot_12345", 
                        "treeID": "tree888",
                        "decision": "INCLUDED",
                        "comments": "This should tie together some loose ends."
                    }, 
                    {
                        "name": "Megachilidae supertree", 
                        "studyID": "ot_2222", 
                        "treeID": "tree7777",
                        "decision": "UNDECIDED",
                        "comments": "Intriguing! Waiting for more information from authors..."
                    }, 
                    {
                        "name": "A. mellifera supertree #2", 
                        "studyID": "ot_2222", 
                        "treeID": "tree7778",
                        "decision": "UNDECIDED",
                        "comments": "Added by automatic query 'Harvest recent Apis mellifera'"
                    }
                ]
            }
        }

    }

    // TODO: adapt tags widget from tree viewer?
    /*
    if (viewOrEdit == 'EDIT') {
        // TODO: reset observables for some options?
        viewModel.chosenNodeLabelModeInfo = ko.observable(null);
        viewModel.nodeLabelModeDescription = ko.observable('');
    }
    */

    // add any missing 'rank' properties
    ensureTreeCollectionRanking( collection );

    // bind just the selected collection to the modal HTML 
    // NOTE that we must call cleanNode first, to allow "re-binding" with KO.
    var $boundElements = $('#tree-collection-viewer').find('.modal-body, .modal-header');
    // Step carefully to avoid un-binding important modal behavior (close widgets, etc)!
    $.each($boundElements, function(i, el) {
        ko.cleanNode(el);
        ko.applyBindings(collection, el);
    });

    var updateCollectionDisplay = function() {
        /* TODO: anything to do here? maybe not.
        if (highlightNodeID) {
            // scroll this node into view (once popup is properly place in the DOM)
            ///setTimeout(function() {
            scrollToTreeNode(tree['@id'], highlightNodeID);
            ///}, 250);
        }
        if (options.HIGHLIGHT_AMBIGUOUS_LABELS) {
            // TODO: visibly mark the Label Types widget, and show internal labels in red
            console.warn(">>>> Now I'd highlight the LabelTypes widget!");
        }
        */
        // (re)bind widgets, esp. for adding trees
        var $popup = $('#tree-collection-viewer');
        var $newTreeStartButton = $popup.find('#new-collection-tree-start');
        var $newTreeCancelButton = $popup.find('#new-collection-tree-cancel');
        var $newTreeOptionsPanels = $popup.find('.new-collection-tree-options');
        var $newTreeByIDsButton = $popup.find('#new-collection-tree-by-ids');
        var $newTreeByURLButton = $popup.find('#new-collection-tree-by-url');
        $newTreeCancelButton.hide();
        $newTreeOptionsPanels.hide();
        $newTreeStartButton.click(function() {
            $newTreeStartButton.attr('disabled', 'disabled')
                               .addClass('btn-info-disabled');
            $newTreeCancelButton.show();
            $newTreeOptionsPanels.show();
            // clear all input fields and disable buttons
            $newTreeOptionsPanels.find('input').val('');
            $newTreeByIDsButton.attr('disabled', 'disabled')
                .addClass('btn-info-disabled');
            $newTreeByURLButton.attr('disabled', 'disabled')
                .addClass('btn-info-disabled');
            updateNewCollTreeUI();
            return false;
        });
        $newTreeCancelButton.click(function() {
            $newTreeStartButton.attr('disabled', null)
                               .removeClass('btn-info-disabled');
            $newTreeCancelButton.hide();
            $newTreeOptionsPanels.hide();
            return false;
        });
    }

    if (collectionViewerIsInUse) {
        // trigger its 'shown' event to 
        updateCollectionDisplay();
    } else {
        $('#tree-collection-viewer').off('show').on('show', function () {
            collectionViewerIsInUse = true;
        });
        $('#tree-collection-viewer').off('shown').on('shown', function () {
            updateCollectionDisplay();
        });
        $('#tree-collection-viewer').off('hide').on('hide', function () {
            if (currentlyEditingCollectionID !== null) {
                showInfoMessage("Please save (or cancel) your changes to this collection!");
                return false;
            }
            collectionViewerIsInUse = false;
        });
        $('#tree-collection-viewer').off('hidden').on('hidden', function () {
            ///console.log('@@@@@ hidden');
        });

        $('#tree-collection-viewer').modal('show');
    }
}

// Use a known-good URL fragment to extract a collection ID from its API URL
var collectionURLSplitter = '/v2/collection/';

function getCollectionIDFromURL(url) {
    // anything after the known API endpoint is a collection ID
    return url.split( collectionURLSplitter )[1];
}

function updateNewCollTreeUI() {
    // update by-ID widgets
    var $addByIDsPanel = $('#new-collection-tree-by-ids');
    var $studyIDField = $addByIDsPanel.find('input[name=study-id]');
    var $treeIDField = $addByIDsPanel.find('input[name=tree-id]');
    var $submitByIDButton = $addByIDsPanel.find('button').eq(0);
    if (($.trim($studyIDField.val()) == '') || ($.trim($treeIDField.val()) == '')) {
        $submitByIDButton.attr('disabled', 'disabled')
                         .addClass('btn-info-disabled');
    } else {
        $submitByIDButton.attr('disabled', null)
                         .removeClass('btn-info-disabled');
    }
    // update by-URL widgets
    var $addByURLPanel = $('#new-collection-tree-by-url');
    var $urlField = $addByURLPanel.find('input[name=tree-url]');
    var $submitByURLButton = $addByURLPanel.find('button').eq(0);
    if ($.trim($urlField.val()) == '') {
        $submitByURLButton.attr('disabled', 'disabled')
                          .addClass('btn-info-disabled');
    } else {
        $submitByURLButton.attr('disabled', null)
                          .removeClass('btn-info-disabled');
    }
}

function createNewTreeCollection() {
    /* NOTE: This initial collection JSON matches the current server-side implementation
     * in peyotl (see peyotl.collections.get_empty_collection)
     */
    var newCollection = {
        "url": "",
        "name": "",
        "description": "",
        "creator": {"login": "", "name": ""},
        "contributors": [],
        "decisions": [],
        "queries": []
    };
    // populate the creator fields using client-side data
    newCollection.creator.login = userLogin;
    newCollection.creator.name = userDisplayName;
    // make an initial bogus URL, for display
    newCollection.url = ( collectionURLSplitter + userLogin +"/");

    // wrap this in a stripped-down version of the usual fetched JSON
    var wrappedNewCollection = {
        "data": newCollection
        // "external_url": etc.
    }

    editCollection( wrappedNewCollection );
}

function updateNewCollectionID( collection ) {
    if ('version_history' in collection) {
        // it's an existing collection with a frozen ID
        return false;
    }
    // it's a new collection; build an ID based on its name!
    var urlParts = collection.data.url.split();
    var nameSlug = slugify(collection.data.name);
    // build a fresh ID with current user as creator
    collection.data.url = collectionURLSplitter + userLogin +'/'+ nameSlug;
    //console.log(">>> collection.data.url = "+ collection.data.url);
    var proposedID = getCollectionIDFromURL( collection.data.url );
    //console.log(">>> proposedID = "+ proposedID);
    $('#collection-id-display').text( proposedID );
}

function addTreeToCollection( collection, inputType ) {
    // Test input values against oti (study index), to see if there's a matching tree
    var studyID, treeID, treeURL;
    if (inputType === 'FROM_IDS') {
        studyID = $.trim($('#new-collection-tree-by-ids input[name=study-id]').val());
        treeID =  $.trim($('#new-collection-tree-by-ids input[name=tree-id]').val());
    } else { // presumably 'FROM_URL'
        treeURL = $.trim($('#new-collection-tree-by-url input[name=tree-url]').val());
        // split this to determine the study and tree IDs. EXAMPLES:
        //  http://devtree.opentreeoflife.org/curator/study/edit/pg_2889/?tab=trees&tree=tree6698
        //  http://devtree.opentreeoflife.org/curator/study/view/pg_2889/?tab=trees&tree=tree6698
        var idString = treeURL.split(/(\/view\/|\/edit\/)/)[2] || "";
        // EXAMPLE: pg_2889/?tab=trees&tree=tree6698
        // EXAMPLE: pg_2889?tab=trees&tree=tree6698
        var studyID = $.trim( idString.split(/\/|\?/)[0] );
        //console.log('>>> studyID = '+ studyID);
        var treeID = $.trim( idString.split('&tree=')[1] );
        //console.log('>>> treeID = '+ treeID);
        if ((studyID === '') || (treeID === '')) {
            // TODO: prompt for fresh input, perhaps with an example?
            showErrorMessage('The URL must include both '
              + '<em>study <strong>and</strong> tree IDs</em>, for example: '
              + 'http://devtree.opentreeoflife.org/curator/study/edit/<strong>pg_2889</strong>'
              + '/?tab=trees&tree=<strong>tree6698</strong>');
            return false;
        } 
    }

    // still here? let's look for a matching tree in the study index
    $.ajax({
        global: false,  // suppress web2py's aggressive error handling
        type: 'POST',
        dataType: 'json',
        // crossdomain: true,
        contentType: "application/json; charset=utf-8",
        url: singlePropertySearchForTrees_url,
        // data: ('{"property": "ot:studyId", "value": '+ 
        //    JSON.stringify(studyID) +', "exact": true, "verbose": true }'),
        data: JSON.stringify({
            property: "oti_tree_id", 
            value: (String(studyID) +'_'+ String(treeID)), 
            exact: true, 
            verbose: true }),
        processData: false,
        complete: function( jqXHR, textStatus ) {
            // report errors or malformed data, if any
            if (textStatus !== 'success') {
                if (jqXHR.status >= 500) {
                    // major server-side error, just show raw response for tech support
                    var errMsg = 'Sorry, there was an error checking for matching trees. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">Show details</a><pre class="error-details" style="display: none;">'+ jqXHR.responseText +' [auto-parsed]</pre>';
                    //hideModalScreen();
                    showErrorMessage(errMsg);
                    return;
                }
                // Server blocked the save due to major validation errors!
                var data = $.parseJSON(jqXHR.responseText);
                // TODO: this should be properly parsed JSON, show it more sensibly
                // (but for now, repeat the crude feedback used above)
                var errMsg = 'Sorry, there was an error checking for matching trees. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">Show details</a><pre class="error-details" style="display: none;">'+ jqXHR.responseText +' [parsed in JS]</pre>';
                //hideModalScreen();
                showErrorMessage(errMsg);
                return;
            }
            // if we're still here, handle the search results
            // IF NOT FOUND, complain and prompt for new input
            // IF FOUND, use its label/description/SHA(?) to populate the entry
            var responseObj = $.parseJSON(jqXHR.responseText);
            //console.log("responseObj:");
            //console.log(responseObj);
            if ($.isArray(responseObj['matched_studies'])) {
                switch(responseObj['matched_studies'].length) {
                    case 0:
                        // no such tree
                        var errMsg = 'Sorry, there are no trees matching these IDs. '
                                   + 'Please check your input values and try again';
                        //hideModalScreen();
                        showErrorMessage(errMsg);
                        return;

                    case 1:
                        // walk its properties and use them in our collection JSON
                        var foundStudy = responseObj['matched_studies'][0];
                        var foundTree = foundStudy['matched_trees'][0];
                        var foundTreeName = (foundTree['@label'] || "Untitled ("+ treeID +")" );
                        var foundTreeComments = "from "
                            + fullToCompactReference(foundStudy['ot:studyPublicationReference']);
                        var treeEntry = {
                            "decision": "INCLUDED",
                            "name": foundTreeName,
                            "studyID": studyID,
                            "treeID": treeID,
                            //"commitSHA": "",    // TODO
                            "comments": foundTreeComments
                        };
                        //console.log(treeEntry);
                        collection.data.decisions.push(treeEntry);
                        showCollectionViewer( collection );  // to refresh the list
                        showSuccessMessage('Tree found and added to this collection.');
                        break;

                    default:
                        var errMsg = 'Sorry, there are multiple trees matching these IDs. '
                                   + '<strong>This is not expected!</strong> Please '
                                   + '<a href="/contact" target="_blank">report this error</a> '
                                   + 'so we can investigate.';
                        //hideModalScreen();
                        showErrorMessage(errMsg);
                        return;
                }
            } else {
                var errMsg = 'Sorry, there was an error checking for matching trees. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">Show details</a><pre class="error-details" style="display: none;">Missing or malformed "matching_studies" in JSON response:\n\n'+ 
                    jqXHR.responseText+'</pre>';
                hideModalScreen();
                showErrorMessage(errMsg);
                return;
            }
        }
    });
}

function getTreeViewURL( decisionData ) {
    // use its study ID and tree ID to build a proper tree-display URL
    var urlTemplate = '/curator/study/view/STUDY_ID/?tab=trees&tree=TREE_ID';
    var safeStudyID = $.trim(decisionData['studyID']);
    var safeTreeID = $.trim(decisionData['treeID']);
    return urlTemplate.replace('STUDY_ID', safeStudyID)
                      .replace('TREE_ID', safeTreeID);
}

function moveInTreeCollection( tree, collection, newPosition ) {
    // Move this tree (decision) to an explicit position in the list
    // N.B. We use zero-based counting here!
    var decisionList = collection.data.decisions;
    var oldPosition = decisionList.indexOf( tree );
    if (oldPosition === -1) {
        alert('No such tree in this collection!');
        return false;
    }

    // Find the new position using simple "stepper" widgets or an
    // explicit/stated rank.
    switch(newPosition) {
        case 'UP':
            newPosition = Math.max(0, oldPosition - 1);
            break;

        case 'DOWN':
            newPosition = Math.min(decisionList.length, oldPosition + 1);
            break;

        default:  
            // stated rank should be an integer or int-as-string
            if (isNaN(Number(tree['rank'])) || ($.trim(tree['rank']) == '')) {
                // don't move if it's not a valid rank!
                console.log(">> INVALID rank: "+ tree['rank'] +" <"+ typeof(tree['rank']) +">");
                return false;
            }
            var movingRank = Number(tree['rank']);
            // displace the first tree that has the same or higher stated rank
            var movingTree = tree;
            var sameRankOrHigher = $.grep(decisionList, function(testTree, i) {
                if (testTree === movingTree) {
                    return false;  // skip the moving tree!
                }
                // Does its stated 'rank' match its list position? N.B. that we're not
                // looking for an exact match, just relative value vs. its neighbors
                // in the decision list.
                var statedRank = Number(testTree['rank']);
                if (isNaN(statedRank) || ($.trim(testTree['rank']) == '')) {
                    // treat invalid/missing values as zero, I guess
                    statedRank = 0;
                }
                if (statedRank >= movingRank) {
                    return true;
                }
                return false;
            });
            var nextTree;
            if (sameRankOrHigher.length === 0) {
                // looks like we're moving to the end of the list
                newPosition = decisionList.length - 1;
            } else {
                // displace the first matching tree
                nextTree = sameRankOrHigher[0]; 
                newPosition = decisionList.indexOf( nextTree );
            }
            break;
    }

    // just grab the moving item and move (or append) it 
    var grabbedItem = decisionList.splice( oldPosition, 1 )[0];
    decisionList.splice(newPosition, 0, grabbedItem);

    resetTreeCollectionRanking( collection );
    showCollectionViewer( collection );  // to refresh the list
}

function showCollectionMoveUI( decision, itsElement, collection ) {
    // show/add? a simple panel with Move, Move All, and Cancel buttons

    // build the panel if it's not already hidden in the DOM
    var $collectionMoveUI = $('#collection-move-ui');
    if ($collectionMoveUI.length === 0) {
        $collectionMoveUI = $(
          '<div id="collection-move-ui" class="collection-move-panel btn-group">'
             +'<button class="btn">Move</button>'
             +'<button class="btn" disabled="disabled">Move All</button>'
             +'<button class="btn btn-danger">Cancel</button>'
         +'</div>'
        );
    }

    // check for integer value, and alert if not valid!
    if (isNaN(Number(decision['rank'])) || ($.trim(decision['rank']) == '')) {
        $(itsElement).css('color','#f33');
        $collectionMoveUI.hide();
        return false;
    } else {
        $(itsElement).css('color', '');
    }

    // (re)bind buttons to this decision
    $collectionMoveUI.find('button:contains(Move)')
                     .unbind('click').click(function() {
                        var newPosition = (Number(decision.rank) - 1) || 0;
                        moveInTreeCollection( decision, collection, newPosition );
                        resetTreeCollectionRanking( collection );
                        $('#collection-move-ui').hide();
                        return false;
                      });
    $collectionMoveUI.find('button:contains(Move All)')
                     .unbind('click').click(function() {
                        // sort all trees by rank-as-number, in ascending order
                        var decisionList = collection.data.decisions;
                        decisionList.sort(function(a,b) { 
                            // N.B. This works even if there's no such property.
                            var aStatedRank = Number(a['rank']);
                            var bStatedRank = Number(b['rank']);
                            // if either field has an invalid rank value, freeze this pair
                            if (isNaN(aStatedRank) || ($.trim(a['rank']) == '')
                             || isNaN(bStatedRank) || ($.trim(b['rank']) == '')) {
                                return 0;
                            }
                            if (aStatedRank === bStatedRank) {
                                return 0;
                            }
                            // sort these from low to high
                            return (aStatedRank > bStatedRank) ? 1 : -1;
                        });
                        resetTreeCollectionRanking( collection );
                        showCollectionViewer( collection );  // to refresh the list
                        $('#collection-move-ui').hide();
                        return false;
                      });
    $collectionMoveUI.find('button:contains(Cancel)')
                     .unbind('click').click(function() {
                        resetTreeCollectionRanking( collection );
                        $('#collection-move-ui').hide();
                        return false;
                      });

    // en/disable widgets in the move UI, based on how many pending moves
    var highestRankSoFar = -1;
    var treesOutOfPlace = $.grep(collection.data.decisions, function(tree, i) {
        // Does its stated 'rank' match its list position? N.B. that we're not
        // looking for an exact match, just relative value vs. its neighbors
        // in the decision list.
        if (isNaN(Number(tree['rank'])) || ($.trim(tree['rank']) == '')) {
            // weird values should prompt us to move+refresh
            return true;
        }
        var statedRank = Number(tree['rank']);
        if (statedRank < highestRankSoFar) {
            return true;
        }
        highestRankSoFar = statedRank;
        return false;
    });
    switch(treesOutOfPlace.length) {
        case 0:
            // don't show the UI, nothing to move!
            $('#collection-move-ui').hide();
            return false;
        case 1:
            $collectionMoveUI.find('button:contains(Move)')
                             .attr('disabled', null);
            $collectionMoveUI.find('button:contains(Move All)')
                             .attr('disabled', 'disabled');
            break;
        default:
            $collectionMoveUI.find('button:contains(Move)')
                             .attr('disabled', null);
            $collectionMoveUI.find('button:contains(Move All)')
                             .attr('disabled', null);
    }

    // float this panel alongside the specified decision (tree), IF it's not already there
    if ($(itsElement).nextAll('#collection-move-ui:visible').length === 0) {
        $collectionMoveUI.insertAfter(itsElement);
    }
    $collectionMoveUI.css('display','inline-block');
}

function ensureTreeCollectionRanking( collection ) {
    // add a 'rank' property to any decision that doesn't have one; if any are
    // missing, reset ALL values based on their "natural" order in the array
    var missingRankProperties = false;
    // check for any missing properties (if so, reset all)
    $.each(collection.data.decisions, function(i, decision) {
        if (!('rank' in decision)) {
            decision['rank'] = null;
            missingRankProperties = true;
        }
    });
    if (missingRankProperties) {
        resetTreeCollectionRanking( collection );
    }
}
function resetTreeCollectionRanking( collection ) {
    // update existing 'rank' property to each of its decisions, using
    // their "natural" order in the array
    $.each(collection.data.decisions, function(i, decision) {
        decision.rank = (i+1);
    });
}
function stripTreeCollectionRanking( collection ) {
    // remove explicit 'rank' properties before saving a collection, since the
    // JSON array already has the current order
    var decisionList = ('data' in collection) ? collection.data.decisions : collection.decisions;
    $.each(collection.data.decisions, function(i, decision) {
        delete decision['rank'];
    });
}

function deleteTreeCollection() {
    // TODO: prompt for commit msg along with confirmation?
    if (confirm('Are you sure you want to delete this tree collection?')) {
        alert('TODO');
    }
}
function removeTreeFromCollection(tree, collection) {
    // TODO: prompt for commit msg along with confirmation?
    if (confirm('Are you sure you want to remove this tree from the collection?')) {
        var decisionList = collection.data.decisions;
        var oldPosition = decisionList.indexOf( tree );
        if (oldPosition === -1) {
            alert('No such tree in this collection!');
            return false;
        }
        decisionList.splice(oldPosition, 1);
        resetTreeCollectionRanking( collection );
        showCollectionViewer( collection );  // to refresh the list
    }
}

var currentlyEditingCollectionID = null;
function userIsEditingCollection( collection ) {
    if ('data' in collection && 'url' in collection.data) {
        return (currentlyEditingCollectionID === collection.data['url']);
    }
    console.warn("returning false for malformed collection:");
    console.warn(collection);
    return false;
}

function editCollection( collection ) {
    // toggle to full editing UI
    currentlyEditingCollectionID = collection.data['url'];
    showCollectionViewer( collection );  // to refresh the UI
    pushPageExitWarning();
}
function saveChangesToCollection( collection ) {
    // TODO: prompt for commit msg and confirmation?
    if (confirm('Are you sure you want to save your changes to this collection?')) {
        alert('TODO');
        popPageExitWarning();
    }
}
function cancelChangesToCollection( collection ) {
    // refresh collection from storage, toggle to view-only UI
    currentlyEditingCollectionID = null;
    // TODO: replace with unchanged collection from storage!
    showCollectionViewer( collection );  // to refresh the UI
    popPageExitWarning();
}
function userIsLoggedIn() {
    return userLogin !== 'ANONYMOUS';
}
