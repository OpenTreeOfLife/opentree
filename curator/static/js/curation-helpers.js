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
    $flashArea.html(msg);

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
    
    // add and enable the close widget
    $flashArea.append('<button type="button" id="closeflash" class="close" data-dismiss="alert">&times;</button>');
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
        // add and enable (or rebind) the clear widget
        var $clear = $search.next('.clear-search');
        if ($clear.length === 0) {
            $search.after('<i class="clear-search icon-remove"></i>');
            $clear = $search.next('.clear-search');
        }
        $clear.unbind('click').click(function() {
           $(this).prev().val('').trigger('change'); 
           return false;
        });
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

function fetchAndShowCollection( collectionID, specialHandling ) {
    /* Fetch a known-good collection from the tree-collections API, and open it
     * in a popup.  This should always get the lastest version from the docstore, 
     * complete with its commit history and merged edits from other users.
     */
    showModalScreen( "Loading tree collection...", {SHOW_BUSY_BAR:true});
    var fetchURL = API_load_collection_GET_url.replace('{COLLECTION_ID}', collectionID);
    $.ajax({
        type: 'GET',
        //dataType: 'json',
        url: fetchURL,
        //data: {},
        success: function( data ) {  // success callback
            // N.B. this includes the core collection JSON, plus a wrapper that
            // has history and other supporting values.
            if (specialHandling) {
                // e.g., add a tree to this collection as it loads
                specialHandling(data);
            } else {
                showCollectionViewer(data, {MAINTAIN_SCROLL: true});
            }
        },
        error: function( jqXHR, textStatus, errorThrown ) {
            showErrorMessage("Unable to load collection '"+ collectionID +"'");
        },
        complete: function( jqXHR, textStatus ) {
            //debugger;
            hideModalScreen();
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
    // allow options for initial display, etc.
    options = options || {};

    var newListScrollPosition = 0;
    if ($stashedCollectionViewerTemplate === null) {
        // Stash the pristine markup before binding this popup for the first time
        $stashedCollectionViewerTemplate = $('#tree-collection-viewer').clone();
        $stashedCollectionContributorElement = $('#tree-collection-viewer')
            .find('#tree-collection-contributors > li').eq(0).clone();
        $stashedCollectionDecisionElement = $('#tree-collection-viewer')
            .find('#tree-collection-decisions > tr.single-tree-row').eq(0).clone();
    } else {
        // Replace with pristine markup to avoid weird results in later popups
        if (options.MAINTAIN_SCROLL) {
            newListScrollPosition = $('#tree-list-holder').scrollTop();
        }
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
        alert("showCollectionViewer(): No collection specified!");
        return;
    }

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

    var updateCollectionDisplay = function(options) {
        options = options || {};
        // (re)bind widgets, esp. for adding trees
        var $popup = $('#tree-collection-viewer');
        var currentListScrollPosition = $('#tree-list-holder').scrollTop();
        var newListScrollPosition;
        if (options.MAINTAIN_SCROLL) {
            newListScrollPosition = currentListScrollPosition;
        } else if (options.SCROLL_TO_BOTTOM) {
            newListScrollPosition = 1000000;
        } else {
            newListScrollPosition = 0;
        }
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
            updateCollectionEditorHeight({MAINTAIN_SCROLL: true});
            return false;
        });
        $newTreeCancelButton.click(function() {
            $newTreeStartButton.attr('disabled', null)
                               .removeClass('btn-info-disabled');
            $newTreeCancelButton.hide();
            $newTreeOptionsPanels.hide();
            updateCollectionEditorHeight({MAINTAIN_SCROLL: true});
            return false;
        });

        updateCollectionEditorHeight();
        // now we can restore the original scroll position (or not)
        $('#tree-list-holder').scrollTop(newListScrollPosition);
    }

    if (collectionViewerIsInUse) {
        // trigger its 'shown' event to update the UI
        updateCollectionDisplay(options);
    } else {
        $('#tree-collection-viewer').off('show').on('show', function () {
            collectionViewerIsInUse = true;
        });
        $('#tree-collection-viewer').off('shown').on('shown', function () {
            updateCollectionDisplay(options);
        });
        $('#tree-collection-viewer').off('hide').on('hide', function () {
            if (currentlyEditingCollectionID !== null) {
                //showInfoMessage("Please save (or cancel) your changes to this collection!");
                alert("Please save (or cancel) your changes to this collection!");
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
function updateCollectionEditorHeight(options) {
    /* Revisit height and placement of the editor popup. If the list is
     * long enough, we should take the full height of the window, with all
     * non-list UI available and any scrollbars restricted to the list
     * area.
     */
    options = options || {};
    var $popup = $('#tree-collection-viewer');
    // let the rounded top and bottom edges of the popup leave the page
    var outOfBoundsHeight = 8;  // px each on top and bottom
    // leave room at the bottom for error messages, etc.
    var footerMessageHeight = 40;
    var currentWindowHeight = $(window).height();
    var maxPopupHeight = (currentWindowHeight + (outOfBoundsHeight*2) - footerMessageHeight);
    //var $popupBody = $popup.find('.modal-body');
    var $listHolder = $('#tree-list-holder');
    var currentListScrollPosition = $listHolder.scrollTop();
    // NOTE that MAINTAIN_SCROLL only gives good results if this is called
    // directly, vs. as part of a full updateCollectionDisplay()
    var newListScrollPosition = (options.MAINTAIN_SCROLL) ? currentListScrollPosition : 0;
    var currentListHeight = $listHolder.height();
    var currentPopupHeight = $popup.height();
    // how tall is the rest of the popup?
    var otherPopupHeight = currentPopupHeight - currentListHeight;
    var maxListHeight = maxPopupHeight - otherPopupHeight;
    //$popupBody.css({ 'max-height': 'none' });
    $listHolder.css({ 'max-height': maxListHeight +'px' });
    var popupTopY = (currentWindowHeight / 2) - ($popup.height() / 2) - (footerMessageHeight/2);
    $popup.css({ 'top': popupTopY +'px' });
    // restore (or set) new list scroll position
    $listHolder.scrollTop(newListScrollPosition);
}
$(window).resize( function () {
    if (collectionViewerIsInUse) {
        updateCollectionEditorHeight({MAINTAIN_SCROLL: true});
    }
});

// Use a known-good URL fragment to extract a collection ID from its API URL
var collectionURLSplitterAPI = '/v2/collection/';
// Fall back to raw-data URL in some cases
var collectionURLSplitterRaw = '/collections/';

function getCollectionIDFromURL(url) {
    // anything after the known API endpoint is a collection ID
    var fromAPI = url.split( collectionURLSplitterAPI )[1];
    var fromRawData = url.split( collectionURLSplitterRaw )[1];
    if (fromRawData) {
        // strip file extension
        fromRawData = fromRawData.split('.json')[0];
    }
    return fromAPI || fromRawData;
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
    newCollection.url = ( collectionURLSplitterAPI + userLogin +"/");

    // wrap this in a stripped-down version of the usual fetched JSON
    var wrappedNewCollection = {
        "data": newCollection
        // "external_url": etc.
    }

    editCollection( wrappedNewCollection );
    // the caller may want to manipulate this further
    return wrappedNewCollection;
}

function updateNewCollectionID( collection ) {
    if ('versionHistory' in collection) {
        // it's an existing collection with a frozen ID
        return false;
    }
    // it's a new collection; build an ID based on its name!
    var nameSlug = slugify(collection.data.name);
    // build a fresh ID with current user as creator
    collection.data.url = collectionURLSplitterAPI + userLogin +'/'+ nameSlug;
    var proposedID = getCollectionIDFromURL( collection.data.url );
    $('#collection-id-display').text( proposedID );
    // update in-use ID (for good refresh)
    currentlyEditingCollectionID = proposedID;
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

    // check to see if this tree is already in the collection; if so, bail w/ a message
    var alreadyInCollection = false;
    $.each(collection.data.decisions, function(i, decision) {
        if ((decision.treeID === treeID) && (decision.studyID === studyID)) {
            showErrorMessage("This tree is already in the collection as '<strong>"+ 
                decision.name +"</strong>'");
            // TODO: scroll the list to show this tree!? highlight it?
            alreadyInCollection = true;
            return false;
        }
    });
    if (alreadyInCollection) {
        return false;
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
                        var compactStudyRef = fullToCompactReference(foundStudy['ot:studyPublicationReference']);
                        // capture the current tree name and study reference
                        // TODO: update these as studies change?
                        var foundTreeName = $.trim(foundTree['@label']);
                        var treeAndStudy = (foundTreeName || treeID) +' ('+ compactStudyRef +')';
                        var foundTreeComments = ""; // TODO: can we copy the tree's description?
                        var treeEntry = {
                            "decision": "INCLUDED",
                            "name": treeAndStudy,
                            "studyID": studyID,
                            "treeID": treeID,
                            "SHA": "",    // TODO: capture this (already expected by server-side validation)
                            "comments": foundTreeComments
                        };
                        //console.log(treeEntry);
                        collection.data.decisions.push(treeEntry);
                        showCollectionViewer( collection, {SCROLL_TO_BOTTOM: true} );  // to refresh the list
                        showSuccessMessage('Tree found and added to this collection.');
                        addPendingCollectionChange( 'ADD', studyID, treeID );
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

    addPendingCollectionChange( 'REORDER' );
    resetTreeCollectionRanking( collection );
    showCollectionViewer( collection, {MAINTAIN_SCROLL: true} );  // to refresh the list
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
    $.each(decisionList, function(i, decision) {
        delete decision['rank'];
    });
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
        addPendingCollectionChange( 'REMOVE', tree.studyID, tree.treeID );
    }
}

var currentlyEditingCollectionID = null;
function userIsEditingCollection( collection ) {
    if ('data' in collection && 'url' in collection.data) {
        var collectionID = getCollectionIDFromURL( collection.data.url );
        return (currentlyEditingCollectionID === collectionID);
    }
    console.warn("returning false for malformed collection:");
    console.warn(collection);
    return false;
}

// keep track of pending tree-collection changes, for easy commit messages
var pendingCollectionChanges = [ ];
function addPendingCollectionChange( action, studyID, treeID ) {
    var msg;
    switch(action) {
        case 'ADD':
            msg = ('Tree '+ treeID +' from study '+ studyID +' added.');
            break;
        case 'REMOVE':
            msg = ('Tree '+ treeID +' from study '+ studyID +' removed.');
            break;
        case 'REORDER':
            // ignore ids for this message
            msg = ('Changed ranking of trees.');
            break;
        default:
            console.error('UNKNOWN collection change: '+ action);
            return;
    }
    pendingCollectionChanges.push({
        action: action,
        treeID: treeID,
        studyID: studyID,
        msg: msg
    });
}
function compressPendingCollectionChanges() {
    // Adjust history for brevity and clarity.
    // keep only the most recent REORDER action
    var reorders = $.grep(pendingCollectionChanges, function(change) {
        return (change.action === 'REORDER');
    });
    $.each(reorders, function(i, change) {
        if (i === (reorders.length - 1)) return;
        removeFromArray(change, pendingCollectionChanges);
    });
    // TODO: remove ADD/REMOVE pairs for a single tree?
}
function clearPendingCollectionChanges() {
    pendingCollectionChanges = [ ];
}
/*
addPendingCollectionChange( 'REORDER' );
addPendingCollectionChange( 'ADD', 'ot_123', 'tree456' );
addPendingCollectionChange( 'REORDER' );
addPendingCollectionChange( 'REMOVE', 'ot_123', 'tree456' );
addPendingCollectionChange( 'ADD', 'ot_987', 'tree654' );
addPendingCollectionChange( 'REORDER' );
compressPendingCollectionChanges();
*/

function copyCollection( collection ) {
    // create a user-owned copy (or login if user is anonymous)
    if (userIsLoggedIn()) {
        /* Step by step:
         * - change its creator/owner to the current user
         * - assert its new ID as {current_user}/{old_name} and rely on the API
         *   to modify this as needed for uniqueness
         * - submit this collection (a copy) via POST
         * - get the new result; reload the page + list, possibly filtered to show the new ID?
         *  OR
         * - editCollection(newCollection) to bring this up in the editor?
         */
        // populate the creator fields using client-side data
        collection.data.creator.login = userLogin;
        collection.data.creator.name = userDisplayName;
        // remove this user from collaborators list, if found
        collection.data.contributors = $.grep(collection.data.contributors, function(i, c) {
            return (c.login !== userLogin);
        });
        // modify its (proposed) ID to reflect the current user
        var nameStub = getCollectionIDFromURL(collection.data.url).split('/')[1];
        collection.data.url = (collectionURLSplitterAPI + userLogin +"/"+ nameStub);
        // clobber its versionHistory to trigger create (vs. update) behavior
        delete collection['versionHistory'];
        promptForSaveCollectionComments( collection );
        // from this point, it's treated like a new collection
    } else {
        if (confirm('Copying a tree collection requires login via Github. OK to proceed?')) {
            loginAndReturn(); 
        }
    }
}

function editCollection( collection, editorOptions ) {
    // toggle to full editing UI (or login if user is anonymous)
    editorOptions = editorOptions || {MAINTAIN_SCROLL: true};
    if (userIsLoggedIn()) {
        if ('data' in collection && 'url' in collection.data) {
            currentlyEditingCollectionID = getCollectionIDFromURL( collection.data.url );
            showCollectionViewer( collection, editorOptions );  // to refresh the UI
            pushPageExitWarning();
            return;
        }
        console.warn("can't edit malformed collection:");
        console.warn(collection);
    } else {
        if (confirm('Editing a tree collection requires login via Github. OK to proceed?')) {
            loginAndReturn(); 
        }
    }
}

function loginAndReturn() {
    // bounce anonymous user to login (taking advantage of _next URL set elsewhere)
    var $loginLinks = $('a:not(.sticky-login):contains(Login)');
    if ($loginLinks.length > 0) {
        // use Login link for most accurate re-entry (current tab, tree, etc)
        window.location = $loginLinks.eq(0).attr('href');
    } else {
        // no Login link found!? use default login URL (and approximate re-entry)
        window.location = '/curator/user/login?_next='+ window.location.pathname;
    }
}

function validateCollectionData( collection ) {
    // do some basic sanity checks on the current tree collection
    if ($.trim(collection.data.name) === '') {
        showErrorMessage('Tree collection requires a name');
        return false;
    }
    return true;
}


function promptForSaveCollectionComments( collection ) {
    // show a modal popup to gather comments (or cancel)
    if (validateCollectionData( collection )) {
        // stash current collection ID (so we can hide editor)
        var collectionID = currentlyEditingCollectionID;
        currentlyEditingCollectionID = null;
        $('#tree-collection-viewer').modal('hide');

        // build default commit msg based on pending edits
        var firstLine, moreLines;
        compressPendingCollectionChanges();
        switch(pendingCollectionChanges.length) {
            case 0:
                // prompt for custom message
                firstLine = "";
                moreLines = "";
                break;

            case 1:
                // build a simple one-line commit message
                firstLine = pendingCollectionChanges[0].msg;
                moreLines = "";
                break;

            default:
                // build a more comprehensive message
                firstLine = "Multiple tree operations (see below)";
                var allMessages = $.map(pendingCollectionChanges, function(change) {
                    return change.msg;
                });
                moreLines = allMessages.join('\n');
        }
        $('#save-collection-comment-first-line').val(firstLine);
        $('#save-collection-comment-more-lines').val(moreLines);

        $('#save-collection-comments-popup').modal('show');
        // buttons there do the remaining work
        $('#save-collection-comments-submit')
            .unbind('click')
            .click(function() {
                $('#save-collection-comments-popup').modal('hide'); 
                saveTreeCollection( collection ); 
                clearPendingCollectionChanges();
            });
        $('#save-collection-comments-cancel')
            .unbind('click')
            .click(function() {
                currentlyEditingCollectionID = collectionID;
                $('#tree-collection-viewer').modal('show');
                return true;
            });
    }
}
function promptForDeleteCollectionComments( collection ) {
    // this button should work from a collection list *or* collection editor
    if ($.isPlainObject(collection) && ('versionHistory' in collection || 'lastModified' in collection)) {
        // it has a history and should really be deleted; show a modal popup to gather comments (or cancel)
        if ('versionHistory' in collection) {
            // this is a collection in the editor
            // stash current collection ID (so we can hide editor)
            var collectionID = currentlyEditingCollectionID;
            currentlyEditingCollectionID = null;
            $('#tree-collection-viewer').modal('hide');

            // this collection has been saved; show a modal popup to gather comments (or cancel)
            $('#delete-collection-comments-popup').modal('show');
            // buttons there do the remaining work
            $('#delete-collection-comments-submit')
                .unbind('click')
                .click(function() {
                    $('#delete-collection-comments-popup').modal('hide'); 
                    deleteTreeCollection( collection ); 
                    clearPendingCollectionChanges();
                });
            $('#delete-collection-comments-cancel')
                .unbind('click')
                .click(function() {
                    currentlyEditingCollectionID = collectionID;
                    $('#tree-collection-viewer').modal('show');
                    return true;
                });
        } else {   // 'lastModified' was found instead
            // this is a collection in a list
            $('#delete-collection-comments-popup').modal('show');
            // buttons there do the remaining work
            $('#delete-collection-comments-submit')
                .unbind('click')
                .click(function() {
                    $('#delete-collection-comments-popup').modal('hide'); 
                    deleteTreeCollection( collection ); 
                    clearPendingCollectionChanges();
                });
        }
    } else {
        // new collection hasn't been saved; just close the editor
        currentlyEditingCollectionID = null;
        clearPendingCollectionChanges();
        $('#tree-collection-viewer').modal('hide');
    }
}
function saveTreeCollection( collection ) {
    // user has confirmed; fix up and submit data
    // N.B. that we might be CREATING or UPDATING
    var createOrUpdate;
    if ('versionHistory' in collection) {
        // we're UPDATING an existing collection
        createOrUpdate = 'UPDATE';
    } else {
        // we're CREATING a new collection
        createOrUpdate = 'CREATE';
    }

    showModalScreen( 
        (createOrUpdate === 'UPDATE') ? "Saving tree collection..." : "Adding tree collection...", 
        {SHOW_BUSY_BAR:true}
    );

    // add this user to contributors (or creator)
    var foundUser = false;
    if (collection.data.creator && collection.data.creator.login ) {
        // check to see if they're the creator (if so, we're done)
        if (collection.data.creator.login === userLogin) {
            foundUser = true;
        }
    } else {
        // add as the creator if none is defined, or if login field is empty
        collection.data.creator = {};
        collection.data.creator.login = userLogin;
        collection.data.creator.name = userDisplayName;
        foundUser = true;
    }
    if (!foundUser) {
        // check for the user among the listed contributors
        $.each(collection.data.contributors, function(i, c) {
            if (c.login === userLogin) {
                foundUser = true;
                return false;
            }
        });
        if (!foundUser) {
            // add this user to the contributors list
            collection.data.contributors.push({
                login: userLogin,
                name: userDisplayName
            });
            foundUser = true;
        }
    }

    // remove explicit ranking values (rely on array order)
    stripTreeCollectionRanking( collection );

    // push changes back to storage
    var saveURL;
    if (createOrUpdate === 'UPDATE') {
        // we're UPDATING an existing collection
        var collectionID = getCollectionIDFromURL( collection.data.url );
        saveURL = API_update_collection_PUT_url.replace('{COLLECTION_ID}', collectionID);
    } else {
        // we're CREATING a new collection
        saveURL = API_create_collection_POST_url;
    }

    // gather commit message (if any) from pre-save popup
    var commitMessage;
    var firstLine = $('#save-collection-comment-first-line').val();
    var moreLines = $('#save-collection-comment-more-lines').val();
    if ($.trim(firstLine) === '') {
        commitMessage = $.trim(moreLines);
    } else if ($.trim(moreLines) === ''){
        commitMessage = $.trim(firstLine);
    } else {
        commitMessage = $.trim(firstLine) +"\n\n"+ $.trim(moreLines);
    }
    
    // add non-JSON values to the query string
    var qsVars = $.param({
        author_name: userDisplayName,
        author_email: userEmail,
        auth_token: userAuthToken,
        starting_commit_SHA: collection.sha,
        commit_msg: commitMessage
    });
    saveURL += ('?'+ qsVars);

    $.ajax({
        global: false,  // suppress web2py's aggressive error handling
        type: (createOrUpdate === 'UPDATE') ? 'PUT' : 'POST',
        dataType: 'json',
        // crossdomain: true,
        contentType: "application/json; charset=utf-8",
        url: saveURL,
        processData: false,
        data: JSON.stringify(collection.data),
        //data: collection,  // OR collection.data?
        complete: function( jqXHR, textStatus ) {
            // report errors or malformed data, if any
            if (textStatus !== 'success') {
                if (jqXHR.status >= 500) {
                    // major server-side error, just show raw response for tech support
                    var errMsg = 'Sorry, there was an error saving this collection. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">Show details</a><pre class="error-details" style="display: none;">'+ jqXHR.responseText +'</pre>';
                    hideModalScreen();
                    showErrorMessage(errMsg);
                    return;
                }
                // Server blocked the save due to major validation errors!
                var data = $.parseJSON(jqXHR.responseText);
                // TODO: this should be properly parsed JSON, show it more sensibly
                // (but for now, repeat the crude feedback used above)
                var errMsg = 'Sorry, there was an error in the study data. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">Show details</a><pre class="error-details" style="display: none;">'+ jqXHR.responseText +'</pre>';
                hideModalScreen();
                showErrorMessage(errMsg);
                return;
            }
            var putResponse = $.parseJSON(jqXHR.responseText);

            if (putResponse['merge_needed']) {
                var errMsg = 'Your changes were saved, but an edit by another user prevented your edit from merging to the publicly visible location. In the near future, we hope to take care of this automatically. In the meantime, please <a href="mailto:info@opentreeoflife.org?subject=Collection%20merge%20needed%20-%20'+ putResponse.sha +'">report this error</a> to the Open Tree of Life software team';
                hideModalScreen();
                showErrorMessage(errMsg);
                return;
            }
            // presume success from here on
            showSuccessMessage('Collection saved to remote storage.');
            popPageExitWarning();
            // refresh any collection list on the current page
            if (typeof loadCollectionList === 'function') {
                loadCollectionList('REFRESH');
            }
            // update in-use ID in case phylesystem API has forced a new one
            currentlyEditingCollectionID = putResponse['resource_id'];
            // get fresh JSON and refresh the form (view only)
            if (createOrUpdate === 'CREATE') {
                // add empty history to hint that we should hold the editor open
                collection['versionHistory'] = [ ];
            }
            hideModalScreen();
            cancelChangesToCollection(collection);
        }
    });
}
function deleteTreeCollection( collection ) {
    // user has already confirmed and provided commit msg
    var collectionID, lastCommitSHA;
    if ('versionHistory' in collection) {
        // this is a single collection in the editor
        collectionID = getCollectionIDFromURL( collection.data.url );
        lastCommitSHA = collection.sha;
    } else if ('lastModified' in collection) {
        // this is minimal data from a collections list
        collectionID = collection.id;
        lastCommitSHA = collection.lastModified.sha;
    } else {
        alert('Missing history for this collection!');
        return false;
    }
    var removeURL = API_remove_collection_DELETE_url.replace('{COLLECTION_ID}', collectionID);
    // gather commit message (if any) from pre-save popup
    var commitMessage;
    var firstLine = $('#delete-collection-comment-first-line').val();
    var moreLines = $('#delete-collection-comment-more-lines').val();
    if ($.trim(firstLine) === '') {
        commitMessage = $.trim(moreLines);
    } else if ($.trim(moreLines) === ''){
        commitMessage = $.trim(firstLine);
    } else {
        commitMessage = $.trim(firstLine) +"\n\n"+ $.trim(moreLines);
    }

    // add auth-token to the query string (no body allowed!)
    var qsVars = $.param({
        author_name: userDisplayName,
        author_email: userEmail,
        auth_token: userAuthToken,
        starting_commit_SHA: lastCommitSHA,
        commit_msg: commitMessage
    });
    removeURL += ('?'+ qsVars);

    // do the actual removal (from the remote file-store) via AJAX
    showModalScreen("Deleting tree collection...", {SHOW_BUSY_BAR:true});

    $.ajax({
        type: 'DELETE',
        dataType: 'json',
        // crossdomain: true,
        contentType: "application/json; charset=utf-8",
        url: removeURL, // modified API call, see above
        data: {},   // sadly not recognized for DELETE, using query-string instead 
        complete: function( jqXHR, textStatus ) {
            // report errors or malformed data, if any
            if (textStatus !== 'success') {
                showErrorMessage('Sorry, there was an error removing this collection.');
                console.log("ERROR: textStatus !== 'success', but "+ textStatus);
                return;
            }
            /*
            if (data.message !== 'File deleted') {
                showErrorMessage('Sorry, there was an error removing this study.');
                console.log("ERROR: message !== 'File deleted', but "+ data.message);
                return;
            }
            */

            // OK, looks like the operation was a success
            currentlyEditingCollectionID = null; // enables closing this window
            clearPendingCollectionChanges();
            popPageExitWarning();
            // refresh any collection list on the current page
            if (typeof loadCollectionList === 'function') {
                loadCollectionList('REFRESH');
            }
            hideModalScreen();
            $('#tree-collection-viewer').modal('hide');

            // parse the payload to see if a merge is required
            var result = $.parseJSON(jqXHR.responseText);
            if (result['merge_needed']) {
                var errMsg = 'Your changes were saved, but an edit by another user prevented your edit from merging to the publicly visible location. In the near future, we hope to take care of this automatically. In the meantime, please <a href="mailto:info@opentreeoflife.org?subject=Collection%20merge%20needed%20-%20'+ result.sha +'">report this error</a> to the Open Tree of Life software team';
                showErrorMessage(errMsg);
            } else {
                showSuccessMessage('Collection removed, refreshing list...');
            }
        }
    });
}
function cancelChangesToCollection(collection) {
    if ($.isPlainObject(collection) && ('versionHistory' in collection)) {
        // refresh collection from storage, toggle to view-only UI
        fetchAndShowCollection( currentlyEditingCollectionID );
        currentlyEditingCollectionID = null;
    } else {
        // new collection hasn't been saved; just close the editor
        currentlyEditingCollectionID = null;
        $('#tree-collection-viewer').modal('hide');
    }
    clearPendingCollectionChanges();
    popPageExitWarning();
}


function getCollectionViewLink(collection) {
    // shows this collection in a popup viewer/editor
    var html = '<a class="" href="#" title="'+ collection.id +'" onclick="fetchAndShowCollection(\''+  collection.id +'\'); return false;">'
        + collection.name +' <span style="color: #aaa;">&bullet;&nbsp;'+ collection.id +'</span></a>';
    return html;
}
function getCollectionTreeCount(collection) {
    return collection.decisions.length || 0;
}
function getCollectionCreatorLink(collection) {
    //return '<a href="#" onclick="filterCollectionsByCurator(\''+ collection.creator.name +'\'); return false;"'+'>'+ collection.creator.name +'</a'+'>';
    // link to the creator's profile page
    return '<a href="/curator/profile/'+ collection.creator.login +'" target="_blank">'+ 
                collection.creator.name +'</a'+'>';
}
function getCollectionCuratorRole(collection) {
    // return 'Owner' | 'Collaborator' | 'None'
    var userIsTheCreator = false;
    var userIsAContributor = false;
    if (('creator' in collection) && ('login' in collection.creator)) { 
        // compare to logged-in userid provide in the main page
        if (collection.creator.login === curatorLogin) {
            return 'Owner';
        }
    }
    if (('contributors' in collection) && $.isArray(collection.contributors)) { 
        // compare to logged-in userid provide in the main page
        $.each(collection.contributors, function(i, c) {
            if (c.login === curatorLogin) {
                return 'Contributor';
            }
        });
    }
    return 'None'; 
}
function getCollectionLastModification(collection) {
    // nicely formatted for display, with details on mouseover 
    return '<span title="'+ collection.lastModified.display_date +'">'+ collection.lastModified.relative_date +'</a'+'>';
}

function filterCollectionsByCurator( curatorID ) {
    // replace the filter text with this curator's userid
    viewModel.listFilters.COLLECTIONS.match( curatorID );
}

function getCollectionByID( collectionsArray, targetID ) {
    var matches = $.grep( collectionsArray, function(c) {
        var itsID = ('data' in c) ? c.data.id : c.id;
        return (itsID === targetID);
    });
    return (matches.length === 0) ? null : matches[0];
}

function userIsLoggedIn() {
    return userLogin !== 'ANONYMOUS';
}

function removeFromArray( doomedValue, theArray ) {
    // removes just one matching value, if found
    var index = $.inArray( doomedValue, theArray );
    if (index !== -1) {
        theArray.splice( index, 1 );
    }
}

