/*
 * Utilities common to multiple pages in the OpenTree study-curation tool.
 */

// converts full reference to short reference for display purposes
// duplicates function with same name in webapp/static/js/treeview.js,
// so changes need to be made in both places
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

function latestCrossRefURL( url ) {
    /* When showing live hyperlinks to a CrossRef URL, we should update them to
     * conform to [the latest guidelines](https://www.crossref.org/blog/new-crossref-doi-display-guidelines-are-on-the-way/).
     *
     * NOTE that this is for display only! For backward compatibility in
     * phylesystem, we still store the old 'http://dx.doi.org/' form and use
     * it when testing for duplicate studies.
     *
     * Also note that this won't modify other URLs that might appear from time to time.
     *
     * N.B. This duplicates a function with same name in webapp/static/js/treeview.js,
     * so changes need to be made in both places
     */
    var latest = url.replace('http://dx.doi.org/', 'https://doi.org/');
    return latest;
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
var expectedPageExitWarningIDs = [
    // used by study curation tool
    'UNSAVED_STUDY_CHANGES',
    'UNSAVED_COLLECTION_CHANGES',
    // used by TNRS bulk-mapping tool
    'UNSAVED_NAMESET_CHANGES'
];

var confirmOnPageExit = function (e)
{
    // If we haven't been passed the event get the window.event
    e = e || window.event;

    // use the topmost (most recently added) message on the stack
    var messageInfo = pageExitWarnings[pageExitWarnings.length - 1];
    var message = messageInfo.text;

    // For IE6-8 and Firefox prior to version 4
    if (e)
    {
        e.returnValue = message;
    }

    // For Chrome, Safari, IE8+ and Opera 12+
    return message;
};

function pushPageExitWarning( warningID, warningText ) {
    // Add the desired message (just once!) to our stack of warnings.
    if ($.inArray(warningID, expectedPageExitWarningIDs) === -1) {
        console.error("pushPageExitWarning(): UNKNOWN warning ID '"+ warningID +"'!");
        return;
    }
    var matchingWarnings = $.grep(pageExitWarnings, function(msgInfo) {
        return (msgInfo.id === warningID);
    })
    var alreadyFound = matchingWarnings.length > 0;
    if (!alreadyFound) {
        pageExitWarnings.push({
            id: warningID,
            text: (warningText || defaultPageExitWarning)
        });
    }
    // in any case, assign the function that returns the string
    window.onbeforeunload = confirmOnPageExit;
}
function popPageExitWarning( warningID ) {
    // remove the matching message from our stack of warnings
    if ($.inArray(warningID, expectedPageExitWarningIDs) === -1) {
        console.error("popPageExitWarning(): UNKNOWN warning ID '"+ warningID +"'!");
        return;
    }
    pageExitWarnings = $.grep(pageExitWarnings, function(msgInfo) {
        return (msgInfo.id !== warningID);
    })
    if (pageExitWarnings.length === 0) {
        // turn it off - remove the function entirely
        window.onbeforeunload = null;
    } else {
        // prepare to show the topmost remaining message
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

function checkForDuplicateStudies( idType, testIdentifier, successCallback, errorCallback ) {
    // Our test has minor variations based on identifier type
    var queryData;
    switch( idType ) {
        case 'DOI':
           queryData = ('{"property": "ot:studyPublication", "value": '+ JSON.stringify(testIdentifier) +', "exact": true }');
           break;
        case 'TreeBASE':
           queryData = ('{"property": "ot:dataDeposit", "value": '+ JSON.stringify(testIdentifier) +', "exact": true }');
           break;
        default:
           console.error("checkForDuplicateStudies(): ERROR, unknown idType: '"+ idType +"'!");
           if (typeof(errorCallback) === 'function') errorCallback();
           return;
    }
    $.ajax({
        global: false,  // suppress web2py's aggressive error handling
        type: 'POST',
        dataType: 'json',
        // crossdomain: true,
        contentType: "application/json; charset=utf-8",
        url: singlePropertySearchForStudies_url,
        data: queryData,
        processData: false,
        complete: function( jqXHR, textStatus ) {
            // report errors or malformed data, if any
            if (textStatus !== 'success') {
                if (jqXHR.status >= 500) {
                    // major server-side error, just show raw response for tech support
                    var errMsg = 'Sorry, there was an error checking for duplicate studies. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">Show details</a><pre class="error-details" style="display: none;">'+ jqXHR.responseText +' [auto-parsed]</pre>';
                    hideModalScreen();
                    showErrorMessage(errMsg);
                    if (typeof(errorCallback) === 'function') errorCallback();
                    return;
                }
                // Server blocked the save due to major validation errors!
                var data = $.parseJSON(jqXHR.responseText);
                // TODO: this should be properly parsed JSON, show it more sensibly
                // (but for now, repeat the crude feedback used above)
                var errMsg = 'Sorry, there was an error checking for duplicate studies. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">Show details</a><pre class="error-details" style="display: none;">'+ jqXHR.responseText +' [parsed in JS]</pre>';
                hideModalScreen();
                showErrorMessage(errMsg);
                if (typeof(errorCallback) === 'function') errorCallback();
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

/*
Returns a hyperlink to the taxonomy browser for a given OTT taxon
Note that this function replicated in the webapp, so changes made here
should also be made in other copy
*/
function getTaxobrowserLink(displayName, ottID) {
    // ASSUMES we will always have the ottid, else check for unique name
    if (!ottID) {
        // show just the name (static text, possibly an empty string)
        return displayName;
    }
    if (!displayName) {
        // empty or missing name? show the raw ID
        displayName = 'OTT: {OTT_ID}'.replace('OTT_ID',ottID)
    }
    var link = '<a href="{TAXO_BROWSER_URL}" \
                   title="OTT Taxonomy" \
                   target="taxobrowser">{DISPLAY_NAME}</a>';
    return link.replace('{TAXO_BROWSER_URL}', getTaxobrowserURL(ottID))
        .replace('{DISPLAY_NAME}', displayName);
}

function getTaxobrowserURL(ottID) {
    if (!ottID) {
        return null;
    }
    if (typeof ottID == 'string' || ottID instanceof String)
    {
	ottID=ottID.replace('ott','');
    }
    // If the taxonomy browser is on a different server, this fails.
    var url = '/taxonomy/browse?id={OTT_ID}';
    return url.replace('{OTT_ID}', ottID);
}

/* Return a link (or URL) to a taxon in the synthetic-tree browser
 * N.B. This uses a taxon-based URL that assumes the latest synthesic tree.
 */
function getSynthTreeViewerLinkForTaxon(displayName, ottID) {
    // ASSUMES we will always have the ottid, else check for unique name
    if (!ottID) {
        // show just the name (static text, possibly an empty string)
        return displayName;
    }
    if (!displayName) {
        // empty or missing name? show the raw ID
        displayName = 'OTT: {OTT_ID}'.replace('OTT_ID',ottID)
    }
    var link = '<a href="{SYNTH_VIEWER_URL}" \
                   title="See this taxon in the latest synthetic tree" \
                   target="synthbrowser">{DISPLAY_NAME}</a>';
    return link.replace('{SYNTH_VIEWER_URL}', getSynthTreeViewerURLForTaxon(ottID))
        .replace('{DISPLAY_NAME}', displayName);
}
function getSynthTreeViewerURLForTaxon(ottID) {
    if (!ottID) {
        return null;
    }
    var url = '/opentree/argus/@{OTT_ID}';
    return url.replace('{OTT_ID}', ottID);
}

/* Return a link (or URL) to a non-taxon node in the synthetic-tree browser
 * N.B. This uses a synth-based URL that requires the id of a synthetic tree.
 */
function getSynthTreeViewerLinkForNodeID(displayName, synthID, nodeID) {
    // ASSUMES we will always have the nodeid, else check for unique name
    if (!synthID || !nodeID) {
        // show just the name (static text, possibly an empty string)
        return displayName || nodeID || '???';
    }
    if (!displayName) {
        // empty or missing name? show the raw ID
        displayName = '{SYNTH_ID}@{NODE_ID}'.replace('{SYNTH_ID}', synthID)
                                            .replace('{NODE_ID}', nodeID);
    }
    var link = '<a href="{SYNTH_VIEWER_URL}" \
                   title="See this node in the current synthetic tree" \
                   target="synthbrowser">{DISPLAY_NAME}</a>';
    return link.replace('{SYNTH_VIEWER_URL}', getSynthTreeViewerURLForNodeID(synthID, nodeID))
        .replace('{DISPLAY_NAME}', displayName);
}
function getSynthTreeViewerURLForNodeID(synthID, nodeID) {
    // if synthID is empty string, will default to latest synth-tree
    if (!nodeID) {
        return null;
    }
    var url = '/opentree/argus/{SYNTH_ID}@{NODE_ID}';
    return url.replace('{SYNTH_ID}', synthID)
              .replace('{NODE_ID}', nodeID);
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
            hideModalScreen();
        }
    });
}

var collectionUI; // already set to 'POPUP' or 'FULL_PAGE'

// Keep track of when the collection popup viewer is already showing, so we
// can hold it open and step through nodes or trees.
var collectionPopupIsInUse = false;

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

    if (collectionUI === 'POPUP') {
        // bind just the selected collection to the modal HTML
        // NOTE that we must call cleanNode first, to allow "re-binding" with KO.
        var $boundElements = $('#tree-collection-viewer').find('.modal-body, .modal-header');
        // Step carefully to avoid un-binding important modal behavior (close widgets, etc)!
        $.each($boundElements, function(i, el) {
            ko.cleanNode(el);
            ko.applyBindings(collection, el);
        });
    }

    var updateCollectionDisplay = function(options) {
        options = options || {};
        // (re)bind widgets, esp. for adding trees
        var currentListScrollPosition = $('#tree-list-holder').scrollTop();
        var newListScrollPosition;
        if (options.MAINTAIN_SCROLL) {
            newListScrollPosition = currentListScrollPosition;
        } else if (options.SCROLL_TO_BOTTOM) {
            newListScrollPosition = 1000000;
        } else {
            newListScrollPosition = 0;
        }
        var $newTreeStartButton = $('#new-collection-tree-start');
        var $newTreeCancelButton = $('#new-collection-tree-cancel');
        var $newTreeOptionsPanels = $('.new-collection-tree-options');
        var $newTreeByURLButton = $('#new-collection-tree-by-url');
        $newTreeStartButton.attr('disabled', null)
                           .removeClass('btn-info-disabled');
        $newTreeCancelButton.hide();
        $newTreeOptionsPanels.hide();
        $newTreeStartButton.unbind('click').click(function() {
            $newTreeCancelButton.show();
            $newTreeOptionsPanels.show();
            // clear all input fields and disable buttons
            $newTreeOptionsPanels.find('input').val('');
            $newTreeByURLButton.attr('disabled', 'disabled')
                .addClass('btn-info-disabled');
            updateNewCollTreeUI();
            // (re)bind study and tree lookups
            loadStudyListForLookup();
            // disable the Add Tree button until they finish or cancel
            $newTreeStartButton.attr('disabled', 'disabled')
                               .addClass('btn-info-disabled');
            if (collectionUI === 'POPUP') updateCollectionEditorHeight({MAINTAIN_SCROLL: true});
            return false;
        });
        $newTreeCancelButton.unbind('click').click(function() {
            $newTreeStartButton.attr('disabled', null)
                               .removeClass('btn-info-disabled');
            $newTreeCancelButton.hide();
            $newTreeOptionsPanels.hide();
            if (collectionUI === 'POPUP') updateCollectionEditorHeight({MAINTAIN_SCROLL: true});
            return false;
        });

        if (collectionUI === 'POPUP') {
            updateCollectionEditorHeight();
            // now we can restore the original scroll position (or not)
            $('#tree-list-holder').scrollTop(newListScrollPosition);
        }
    }

    if ((collectionUI === 'FULL_PAGE') || collectionPopupIsInUse) {
        // trigger its 'shown' event to update the UI
        updateCollectionDisplay(options);
    } else {
        $('#tree-collection-viewer').off('show').on('show', function () {
            collectionPopupIsInUse = true;
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
            collectionPopupIsInUse = false;
        });
        $('#tree-collection-viewer').off('hidden').on('hidden', function () {
            ///console.log('@@@@@ hidden');
        });
        if (collectionUI === 'POPUP') {
            $('#tree-collection-viewer').modal('show');
        }
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
    if (collectionUI === 'POPUP' && collectionPopupIsInUse) {
        updateCollectionEditorHeight({MAINTAIN_SCROLL: true});
    }
});

// Use a known-good URL fragment to extract a collection ID from its API URL
var collectionURLSplitterAPI = '/collection/';
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

function getFullGitHubURLForCollection(collection) {
    /* Munge the downloadable `external_url` to get a link to full blob+history on GitHub, for example
     *   https://raw.githubusercontent.com/OpenTreeOfLife/collections-0/master/collections-by-owner/jimallman/newtest-2.json
     * ...becomes this:
     *   https://github.com/OpenTreeOfLife/collections-0/blob/master/collections-by-owner/jimallman/newtest-2.json
     * More specifically, we just need to change this early path:
     *   https://raw.githubusercontent.com/OpenTreeOfLife/collections-#/
     * ... to this:
     *   https://github.com/OpenTreeOfLife/collections-#/blob/
     */
    if (collection.external_url) {
        return collection.external_url.replace( /.*collections-(\d*)\// , "https://github.com/OpenTreeOfLife/collections-$1/blob/");
    }
    return '';
}

function updateNewCollTreeUI() {
    // update by-lookup widgets
    var $addByLookupPanel = $('#new-collection-tree-by-lookup');
    var $submitByLookupButton = $addByLookupPanel.find('button').eq(0);
    var $studyIDField = $addByLookupPanel.find('input[name=study-lookup-id]');
    var $treeSelector = $addByLookupPanel.find('select[name=tree-lookup]');
    var $submitByAnyInputButton = $('#add-tree-by-any-input');
    if (collectionUI === 'FULL_PAGE') {
        // disable our all-purpose add-tree button, then check below
        $submitByAnyInputButton.attr('disabled', 'disabled')
                               .addClass('btn-info-disabled');
    }

    if (($.trim($studyIDField.val()) == '') || ($.trim($treeSelector.val()) == '')) {
        // no ids found!
        if (collectionUI === 'POPUP') {
            $submitByLookupButton.attr('disabled', 'disabled')
                                 .addClass('btn-info-disabled');
        }
    } else {
        // both ids found!
        if (collectionUI === 'POPUP') {
            $submitByLookupButton.attr('disabled', null)
                                 .removeClass('btn-info-disabled');
        } else {
            $submitByAnyInputButton.attr('disabled', null)
                                   .removeClass('btn-info-disabled');
        }
    }

    // update by-URL widgets
    var $addByURLPanel = $('#new-collection-tree-by-url');
    var $urlField = $addByURLPanel.find('input[name=tree-url]');
    var $submitByURLButton = $addByURLPanel.find('button').eq(0);
    if ($.trim($urlField.val()) == '') {
        if (collectionUI === 'POPUP') {
            $submitByURLButton.attr('disabled', 'disabled')
                              .addClass('btn-info-disabled');
        }
    } else {
        if (collectionUI === 'POPUP') {
            $submitByURLButton.attr('disabled', null)
                              .removeClass('btn-info-disabled');
        } else {
            $submitByAnyInputButton.attr('disabled', null)
                                   .removeClass('btn-info-disabled');
        }
    }
}

/* Sensible autocomplete behavior requires the use of timeouts
 * and sanity checks for unchanged content, etc.
 */
clearTimeout(studyLookupTimeoutID);  // in case there's a lingering search from last page!
var studyLookupTimeoutID = null;
var lookupDelay = 1000; // milliseconds
var hopefulStudyLookupName = null;
function setStudyLookupFuse(e) {
    if (studyLookupTimeoutID) {
        // kill any pending search, apparently we're still typing
        clearTimeout(studyLookupTimeoutID);
    }
    // reset the timeout for another n milliseconds
    studyLookupTimeoutID = setTimeout(searchForMatchingStudy, lookupDelay);

    /* If the last key pressed was the ENTER key, stash the current (trimmed)
     * string and auto-jump if it's a valid taxon name.
     */
    if (e.type === 'keyup') {
        switch (e.which) {
            case 13:
                hopefulStudyLookupName = $('input[name=study-lookup]').val().trim();
                //TODO? autoApplyExactMatch();
                break;
            case 17:
                // do nothing (probably a second ENTER key)
                break;
            case 39:
            case 40:
                // down or right arrows should try to select first result
                $('#study-lookup-results a:eq(0)').focus();
                break;
            default:
                hopefulStudyLookupName = null;
        }
    } else {
        hopefulStudyLookupName = null;
    }
}

var showingResultsForStudyLookupText = '';
function searchForMatchingStudy() {
    // clear any pending lookup timeout and ID
    clearTimeout(studyLookupTimeoutID);
    studyLookupTimeoutID = null;

    var $input = $('input[name=study-lookup]');
    if ($input.length === 0) {
        $('#study-lookup-results').html('');
        console.log("Input field not found!");
        return false;
    }
    var searchText = $.trim( $input.val() );
    var searchTokens = tokenizeSearchTextKeepingQuotes(searchText);

    if ((searchTokens.length === 0) ||
        (searchTokens.length === 1 && searchTokens[0].length < 2)) {
        $('#study-lookup-results').html('<li class="disabled"><a><span class="text-error">Enter two or more characters to search</span></a></li>');
        return false;
    }

    // stash the search-text used to generate these results
    showingResultsForStudyLookupText = searchText;
    $('#study-lookup-results').html('<li class="disabled"><a><span class="text-warning">Search in progress...</span></a></li>');
    $('#study-lookup-results').show();
    $('#study-lookup-results').dropdown('toggle');
    $('#study-lookup-results').html('');

    var maxResults = 5;
    var visibleResults = 0;
    var matchingStudies = [ ];

    if (studyListForLookup && studyListForLookup.length && studyListForLookup.length > 0) {
        // Check all preloaded studies for matching text in relevant fields.
        $.each(studyListForLookup, function(i, studyInfo) {
            studyInfo.matchScore = 0;  // init OR reset on later searches
            if (!('compactReference' in studyInfo)) {
                studyInfo.compactReference = fullToCompactReference(studyInfo['ot:studyPublicationReference']);
            }
            $.each(searchTokens, function(i, token) {
                // Test against all revelant fields (with weighted scores)
                if (studyInfo['ot:studyId'] === token) {
                    studyInfo.matchScore += 10;
                };
                if (studyInfo['ot:studyYear'] === token) {
                    studyInfo.matchScore += 5;
                };
                var tokenRegex = new RegExp(token, "i");  // case-INSENSITIVE
                var testForPartialMatch = [
                    'ot:curatorName',
                    'ot:tag',
                    'ot:focalCladeOTTTaxonName',
                    'ot:studyPublication',
                    'ot:studyPublicationReference',
                    'compactReference'
                ];
                $.each(testForPartialMatch, function(i, testField) {
                    if (testField in studyInfo) {
                        // coerce any found value to a string
                        var testValue = studyInfo[testField];
                        if ($.isArray(testValue)) {
                            testValue = testValue.join('|');
                        } else {
                            testValue = String(testValue);
                        }
                        if (testValue.search(tokenRegex) !== -1) {
                            studyInfo.matchScore += 2;
                        }
                    }
                });
            });  // end of token loop
            if (studyInfo.matchScore > 0) {
                matchingStudies.push( studyInfo );
            }
        });  // end of study loop

        // Sort matching studies by score
        matchingStudies.sort(function(a,b) {
            // move high scores to the top of the list
            if (a.matchScore === b.matchScore) return 0;
            if (a.matchScore > b.matchScore) return -1;
            return 1;
        });
        // Show the topmost sorted results (and a prompt if there are more hidden matches)
        $.each(matchingStudies, function(i, studyInfo) {
            if (visibleResults > maxResults) {
                // Add one final prompt
                $('#study-lookup-results').append(
                    '<li class="disabled"><a href=""><span class="muted">Add more search text to see hidden matches.</span></a></li>'
                );
                return false;
            }
            var matchURL = getViewURLFromStudyID(studyInfo['ot:studyId']);
            var matchText = fullToCompactReference(studyInfo['ot:studyPublicationReference']);
            var mouseOver = studyInfo['ot:studyPublicationReference'];
            $('#study-lookup-results').append(
                '<li><a href="'+ matchURL +'" title="'+ mouseOver +'">'+ matchText +'</a></li>'
            );
            visibleResults++;
        });

        $('#study-lookup-results a')
            .click(function(e) {
                var $link = $(this);
                if ($link.attr('href') === '') return false;
                var pathParts = $link.attr('href').split('/');
                var studyID = pathParts[ pathParts.length - 1 ];
                // update hidden field
                $('input[name=study-lookup-id]').val( studyID );
                // hide menu and reset search field
                $('#study-lookup-results').html('');
                $('#study-lookup-results').hide();
                // replace input field with static indicator (and trigger to search again?)
                $('.study-lookup-active').hide();
                $('#study-lookup-indicator')
                    .attr({'href': $link.attr('href'), 'title': $link.attr('title')})
                    .html( $link.html() );
                $('.study-lookup-passive').show();
                // Load + enable tree lookup
                $('select[name=tree-lookup]').val('');
                $('select[name=tree-lookup]').attr('disabled','disabled');
                updateNewCollTreeUI();
                $.ajax({
                    global: false,  // suppress web2py's aggressive error handling
                    type: 'POST',
                    dataType: 'json',
                    // crossdomain: true,
                    contentType: "application/json; charset=utf-8",
                    url: singlePropertySearchForTrees_url,
                    data: ('{"property": "ot:studyId", "value": '+
                           JSON.stringify(studyID) +', "exact": true, "verbose": true }'),
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
                        // IF NOT FOUND, complain and ask for another study
                        // IF FOUND, use its label/description/SHA(?) to populate the entry
                        var responseObj = $.parseJSON(jqXHR.responseText);
                        if ($.isArray(responseObj['matched_studies'])) {
                            switch(responseObj['matched_studies'].length) {
                                case 0:
                                    // no such study
                                    var errMsg = 'Sorry, there are no trees in the selected study. '
                                               + 'Please choose another study and try again.';
                                    //hideModalScreen();
                                    showErrorMessage(errMsg);
                                    return;

                                case 1:
                                    // walk its properties and use them in our collection JSON
                                    var foundStudy = responseObj['matched_studies'][0];
                                    var foundTrees = foundStudy['matched_trees'];
                                    // TODO: Remove all but the prompting OPTION element
                                    var $treeSelector = $('select[name=tree-lookup]');
                                    $treeSelector.find('option').remove();
                                    if (foundTrees.length === 0) {
                                        // no such study
                                        var errMsg = 'Sorry, there are no trees in the selected study. '
                                                   + 'Please choose another study and try again.';
                                        //hideModalScreen();
                                        showErrorMessage(errMsg);
                                        return;
                                    }
                                    $.each(foundTrees, function(i, foundTree) {
                                        var compactStudyRef = fullToCompactReference(foundStudy['ot:studyPublicationReference']);
                                        // capture the current tree ID, name and study reference
                                        var foundTreeName = $.trim(foundTree['@label']);
                                        // recover the simple tree ID from {STUDY_ID}_{TREE_ID}
                                        var treeID = $.trim(foundTree['ot:treeId']);
                                        //var visibleLabel = (foundTreeName || treeID) +' ('+ foundTree['ot:ottTaxonName'] +')';
                                        var visibleLabel = (foundTreeName || ("Untitled ["+ treeID +"]"));
                                        var rollOverText = "";  // none for now
                                        // TODO: can we copy the tree's description?
                                        // TODO: pick a SHA from history? or use the latest?
                                        // Build a new OPTION element for this tree
                                        var $newOption = $('<option value="'+ treeID
                                                            +'" title="'+ rollOverText
                                                            +'">'+ visibleLabel
                                                            +'</option>');
                                        $treeSelector.append( $newOption );
                                    });
                                    $treeSelector.attr('disabled', null);
                                    updateNewCollTreeUI();
                                    return;

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

            });
        $('#study-lookup-results').dropdown('toggle');
    }
    if (visibleResults === 0) {
        $('#study-lookup-results').html('<li class="disabled"><a><span class="muted">No results for this search</span></a></li>');
        $('#study-lookup-results').dropdown('toggle');
    };

    return false;
}
function resetStudyLookup() {
    // Clear/disable tree lookup
    var $treeSelector = $('select[name=tree-lookup]');
    $treeSelector.find('option').remove();
    var $promptOption = $('<option disabled="disabled" value="">Find the study above first</option>');
    $treeSelector.append( $promptOption );
    $('select[name=tree-lookup]').val('');
    $('select[name=tree-lookup]').attr('disabled','disabled');

    // Toggle the study-lookup widget (vs. indicator)
    $('.study-lookup-passive').hide();
    $('.study-lookup-active').show();
    // N.B. The icon element will shift if its display is set to block
    $('i.study-lookup-active').css('display', 'inline-block');

    updateNewCollTreeUI();
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

function updateCollectionTrees ( collection ) {
    // Update all trees in collection to recognize the latest tree labels, etc.
    // in oti (study index). Also note if a tree has been removed, in case the
    // curator want to clean up the collection.
    //
    // Show a modal blocker and summary results
    showModalScreen("Checking trees in phylesystem...", {SHOW_BUSY_BAR:true});
    var totalTrees = collection.data.decisions.length;
    var treesUnchanged = 0;
    var treesChanged = 0;
    var treesRemoved = 0;
    var treeSearchFailing = false;
    $.each(collection.data.decisions, function(i, decision) {
        if (treeSearchFailing) return;
        /* Not found? Mark it as removed! else...
         * Update its tree name/label, if changed
         * Update its compact study reference, if changed
         * Update UI along the way...
         *    grey block = UNCHANGED
         *    yellow block = RENAMED (either label or compact reference)
         *    red block = REMOVED
         */
        // look for a matching tree in the study index
        $.ajax({
            global: false,  // suppress web2py's aggressive error handling
            type: 'POST',
            dataType: 'json',
            // crossdomain: true,
            contentType: "application/json; charset=utf-8",
            url: singlePropertySearchForTrees_url,
            data: JSON.stringify({
                property: "ot:studyId",  // replaces DEPRECATED oti_tree_id
                value: String(decision.studyID),
                exact: true,
                verbose: true }),
            processData: false,
            complete: function( jqXHR, textStatus ) {
                // report errors or malformed data, if any
                if (textStatus !== 'success') {
                    if (jqXHR.status >= 500) {
                        // major server-side error, just show raw response for tech support
                        var errMsg = 'Sorry, there was an error checking for matching trees. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">Show details</a><pre class="error-details" style="display: none;">'+ jqXHR.responseText +' [auto-parsed]</pre>';
                        hideModalScreen();
                        showErrorMessage(errMsg);
                        treeSearchFailing = true;
                        return;
                    }
                    // Server blocked the save due to major validation errors!
                    var errMsg = 'Sorry, there was an error checking for matching trees. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">Show details</a><pre class="error-details" style="display: none;">'+ jqXHR.responseText +' [parsed in JS]</pre>';
                    hideModalScreen();
                    showErrorMessage(errMsg);
                    treeSearchFailing = true;
                    return;
                }
                // if we're still here, handle the search results
                // IF NOT FOUND, complain and prompt for new input
                // IF FOUND, use its label/description/SHA(?) to populate the entry
                var responseObj = $.parseJSON(jqXHR.responseText);
                if ($.isArray(responseObj['matched_studies'])) {
                    switch(responseObj['matched_studies'].length) {
                        case 0:
                            // study has been removed!
                            treesRemoved += 1;
                            // Highlight this in the list, mark as REMOVED
                            decision.status = 'REMOVED';
                            break;

                        case 1:
                            // walk its properties and use them in our collection JSON
                            var foundStudy = responseObj['matched_studies'][0];
                            var compactStudyRef = fullToCompactReference(foundStudy['ot:studyPublicationReference']);
                            // find the desired tree (or complain if not found)
                            var foundTree = null;
                            var matchingTrees = $.grep(
                                foundStudy['matched_trees'],
                                function(tree, index) {
                                    return (tree['ot:treeId'] == decision.treeID);
                                }
                            );
                            switch(matchingTrees.length) {
                                case 0:
                                    // no such tree (removed!)
                                    treesRemoved += 1;
                                    // Highlight this in the list, mark as REMOVED
                                    decision.status = 'REMOVED';
                                    break;

                                case 1:
                                    // expected result, get details below
                                    foundTree = matchingTrees[0];
                                    break;

                                default:
                                    // multiple matches is an error
                                    var errMsg = 'Sorry, there are multiple trees matching these IDs. '
                                               + '<strong>This is not expected!</strong> Please '
                                               + '<a href="/contact" target="_blank">report this error</a> '
                                               + 'so we can investigate.';
                                    hideModalScreen();
                                    showErrorMessage(errMsg);
                                    return;
                            }
                            if (foundTree) {
                                /* Still here? Compare the tree's current name and study
                                 * reference to the version stored in this collection
                                 */
                                var foundTreeName = $.trim(foundTree['@label']);
                                var proposedName = $.trim(foundTreeName || decision.treeID) +' ('+ compactStudyRef +')';
                                var treeLabelHasChanged = false;
                                if (proposedName == decision.name) {
                                    treesUnchanged += 1;
                                    // UN-highlight this in the list, mark as UNCHANGED
                                    decision.status = 'UNCHANGED';
                                } else {
                                    // Update the existing collection record for this tree; mark it for review
                                    treesChanged += 1;
                                    decision.name = proposedName;
                                    // Highlight this in the list, mark as RENAMED
                                    decision.status = 'RENAMED';
                                }
                                /* TODO: Should we update the tree's SHA? Not currently available! */
                            }
                            break;

                        default:
                            var errMsg = 'Sorry, there are multiple studies matching these IDs. '
                                       + '<strong>This is not expected!</strong> Please '
                                       + '<a href="/contact" target="_blank">report this error</a> '
                                       + 'so we can investigate.';
                            hideModalScreen();
                            showErrorMessage(errMsg);
                            return;
                    }
                } else {
                    var errMsg = 'Sorry, there was an error checking for matching trees. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">Show details</a><pre class="error-details" style="display: none;">Missing or malformed "matching_studies" in JSON response:\n\n'+
                        jqXHR.responseText+'</pre>';
                    hideModalScreen();
                    showErrorMessage(errMsg);
                    treeSearchFailing = true;
                    return;
                }
                // Have we successfully checked all trees? If so, summarize changes found and prompt to re-save.
                if (treesUnchanged + treesChanged + treesRemoved === totalTrees) {
                    showCollectionViewer( collection, {MAINTAIN_SCROLL: true});

                    // clear list filters to show all changes!
                    $('#tree-list-filter').val('').trigger('change');
                    nudgeTickler('TREES', {modelHasChanged: false});  // just in case filter was already empty

                    hideModalScreen();
                    if (treesUnchanged === totalTrees) {
                        showSuccessMessage('There were no recent changes to the trees in this list. '
                            +'You can improve the name of any tree by editing its study in the curation tool.');
                    } else {
                        var summaryMsg = 'Please review '+ (treesChanged + treesRemoved) +' recent changes to the trees in this list. ';
                        if (treesRemoved > 0) {
                            summaryMsg += (String(treesRemoved) +' tree'+ (treesRemoved == 1 ? '' : 's')
                                +' (marked in red) ' + (treesRemoved == 1 ? 'has' : 'have')
                                +' been removed from OpenTree. You should consider removing these items from'
                                +' this collection before saving, and possibly adding a replacement. ');
                        }
                        if (treesChanged > 0) {
                            summaryMsg += (String(treesChanged) +' tree'+ (treesChanged == 1 ? '' : 's')
                                +' (marked in yellow) ' + (treesChanged == 1 ? 'has' : 'have')
                                +' been renamed. New names are usually an improvement and worth saving. ');
                        }
                        summaryMsg += 'Remember to save this collection after your review, or cancel to ignore these changes.';
                        showErrorMessage(summaryMsg);
                        addPendingCollectionChange( 'UPDATE' );
                    }
                }
            }
        });
    });
}

function addTreeToCollection( collection, inputType ) {
    // Test input values against oti (study index), to see if there's a matching tree
    // inputType can be FROM_URL, FROM_LOOKUPS, FROM_ANY
    var studyID = '',
        treeID = '',
        treeURL;

    if (inputType !== 'FROM_URL') {
        // try explicit ids first, esp. if checking for any valid input
        studyID = $.trim($('#new-collection-tree-by-lookup input[name=study-lookup-id]').val());
        treeID =  $.trim($('#new-collection-tree-by-lookup select[name=tree-lookup]').val());
    }

    if (inputType !== 'FROM_LOOKUPS') {
        // when in doubt, fall back to the URL field
        if ((studyID === '') || (treeID === '')) {
            treeURL = $.trim($('#new-collection-tree-by-url input[name=tree-url]').val());
            // split this to determine the study and tree IDs. EXAMPLES:
            //  http://devtree.opentreeoflife.org/curator/study/edit/pg_2889/?tab=trees&tree=tree6698
            //  http://devtree.opentreeoflife.org/curator/study/view/pg_2889/?tab=trees&tree=tree6698
            var idString = treeURL.split(/(\/view\/|\/edit\/)/)[2] || "";
            // EXAMPLE: pg_2889/?tab=trees&tree=tree6698
            // EXAMPLE: pg_2889?tab=trees&tree=tree6698
            studyID = $.trim( idString.split(/\/|\?/)[0] );
            //console.log('>>> studyID = '+ studyID);
            treeID = $.trim( idString.split('&tree=')[1] );
            //console.log('>>> treeID = '+ treeID);
        }
    }

    // at this point, we should have something useful
    if ((studyID === '') || (treeID === '')) {
        // prompt for fresh input, perhaps with an example?
        var errMsg;
        switch (inputType) {
            case 'FROM_LOOKUPS':
                errMsg = 'Please match a study <strong>and</strong> a tree from the fields above.';
                break;
            case 'FROM_URL':
                errMsg = 'The URL must include both '
                       + '<em>study <strong>and</strong> tree IDs</em>, for example: '
                       + 'http://devtree.opentreeoflife.org/curator/study/edit/<strong>pg_2889</strong>'
                       + '/?tab=trees&tree=<strong>tree6698</strong>';
                break;
            case 'FROM_ANY':
                errMsg = 'Please match a study <strong>and</strong> a tree from the fields above, or enter '
                       + 'a URL including both <em>study <strong>and</strong> tree IDs</em>, for example: '
                       + 'http://devtree.opentreeoflife.org/curator/study/edit/<strong>pg_2889</strong>'
                       + '/?tab=trees&tree=<strong>tree6698</strong>';
                break;
            default:
                errMsg = 'ERROR: Unexpected input type <em>'+ inputType +'</em> requested!';
                break;
        }
        showErrorMessage(errMsg);
        return false;
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
            property: "ot:studyId",  // replaces DEPRECATED oti_tree_id
            value: String(studyID),
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
                // Server blocked the save due to major validation or API errors!
                var errMsg = 'Sorry, there was an error checking for matching trees. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">Show details</a><pre class="error-details" style="display: none;">'+ jqXHR.responseText +'</pre>';
                //hideModalScreen();
                showErrorMessage(errMsg);
                return;
            }
            // if we're still here, handle the search results
            // IF NOT FOUND, complain and prompt for new input
            // IF FOUND, use its label/description/SHA(?) to populate the entry
            var responseObj = $.parseJSON(jqXHR.responseText);
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
                        // NB - There can be multiple trees returned! Find the right one by its ID!
                        var foundTree = $.grep(foundStudy['matched_trees'], function(tree) {
                            return (tree['ot:treeId'] === treeID);
                        })[0];
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
                        if (collectionUI === 'FULL_PAGE') {
                            nudgeTickler('TREES');  // force display refresh
                            showCollectionViewer( collection );  // to refresh the list
                        } else {
                            nudgeTickler('COLLECTION_HAS_CHANGED');
                            showCollectionViewer( collection, {SCROLL_TO_BOTTOM: true} );  // to refresh the list
                        }
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
    if (collectionUI === 'FULL_PAGE') nudgeTickler('TREES');
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
                        if (collectionUI === 'FULL_PAGE') nudgeTickler('TREES');  // force refresh
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
function stripTreeCollectionStatusMarkers( collection ) {
    // remove temporary 'status' properties before saving a collection, since these
    // are only used to review after updating trees from phylesystem
    var decisionList = ('data' in collection) ? collection.data.decisions : collection.decisions;
    $.each(decisionList, function(i, decision) {
        delete decision['status'];
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
        if (collectionUI === 'FULL_PAGE') nudgeTickler('TREES');  // force update to paged list
        showCollectionViewer( collection );  // to refresh the list
        addPendingCollectionChange( 'REMOVE', tree.studyID, tree.treeID );
    }
}

var currentlyEditingCollectionID;  // possibly already set in full-page collection editor
function userIsEditingCollection( collection ) {
    if ('data' in collection && 'url' in collection.data) {
        var collectionID = getCollectionIDFromURL( collection.data.url );
        return (currentlyEditingCollectionID === collectionID);
    }
    console.warn("returning false for malformed collection:");
    console.warn(collection);
    return false;
}

function userCanReorderTrees( collection ) {
    // user must be editing
    if (!userIsEditingCollection(collection)) return false;
    // we must not be filtering out trees
    if (viewModel._filteredTrees().length !== viewModel.data.decisions.length) return false;
    // we must be sorting the list by Rank (ascending)
    if (viewModel.listFilters.TREES.order() !== 'RANK-ASC') return false;
    return true;
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
            msg = ('Tree '+ treeID +' from study '+ studyID +' removed in phylesystem.');
            break;
        case 'REORDER':
            // ignore ids for this message
            msg = ('Changed ranking of trees.');
            break;
        case 'UPDATE':
            //msg = ('Tree names and status renamed in phylesystem.');
            msg = ('Tree '+ treeID +' from study '+ studyID +' renamed in phylesystem.');
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
    var updates = $.grep(pendingCollectionChanges, function(change) {
        return (change.action === 'UPDATE');
    });
    $.each(updates, function(i, change) {
        if (i === (updates.length - 1)) {
            change.msg = ('Tree names and status updated from latest phylesystem.');
            return;
        }
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

function getCollectionDirectURL( collection ) {
    // provide a direct URL to the collection (to copy/paste or email)
    var collectionID = getCollectionIDFromURL( collection.data.url );
    var directURL = window.location.protocol +'//'+ window.location.hostname +'/curator/collections/'+ collectionID;
    return directURL;
}
function shareCollection( collection ) {
    var directURL = getCollectionDirectURL(collection);
    window.prompt("This URL will open the current collection automatically (no login required).", directURL);
}

function getCollectionHistoryURL( collection ) {
    // provide a URL to the collection on GitHub (for full history)
    // ASSUMES that its 'external_url' property points to the JSON file on 'raw.githubusercontent.com'
    // ASSUMES that collection is currently on branch 'master'
    var historyURL = collection.external_url
                        .replace('raw.githubusercontent.com', 'github.com')
                        .replace('master','commits/master');
    return historyURL;
}

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

function freezeDisplayedListOrder() {
    /* Update this collection's tree list to capture the filtered/sorted list
     * currently shown. If only a partial tree list is showing (due to
     * pagination or filtering), bump the "hidden" trees to the end, preserving
     * their relative order.
     */
    var collection = viewModel;
    var decisionList = collection.data.decisions;
    var displayedList = viewModel.filteredTrees().pagedItems(); // in case we're paging results

    // explain the consequences beforehand
    var warning = "WARNING: This will over-write all ranks/positions previously set in this collection! ";
    if (displayedList.length < decisionList.length) {
        warning += "Hidden trees will be moved to the end of the list, but retain their relative positions. ";
    }
    warning += "Are you sure you want to do this?";
    if (!confirm(warning)) {
        return false;
    }

    // sort trees (decisions) based on current position in DISPLAYED list
    decisionList.sort(function(a,b) {
        // N.B. This works even if there's no such property.
        var aDisplayedPosition = displayedList.indexOf(a);
        var bDisplayedPosition = displayedList.indexOf(b);
        // if both are hidden (filtered out of displayed list), stand pat
        if ((aDisplayedPosition === -1) && (bDisplayedPosition === -1)) {
            return 0;
        }
        if (aDisplayedPosition === -1) {
            return 1;
        }
        if (bDisplayedPosition === -1) {
            return -1;
        }
        // in normal cases, sort from low to high
        return (aDisplayedPosition > bDisplayedPosition) ? 1 : -1;
    });
    // update 'rank' values to match
    resetTreeCollectionRanking( collection );
    // refresh displayed list
    nudgeTickler('TREES');
    return false;
}

/* If user chooses to edit a collection, load the study list (just once!) and
 * bind the UI for fast lookups of a study and tree.
 */
var studyListForLookup = null;
function bindStudyAndTreeLookups() {
    ///console.warn('STARTING bindStudyAndTreeLookups');
    // ASSUMES the study list is available
    if (!studyListForLookup || studyListForLookup.length === 0) {
        console.warn("Study list not found (or empty):");
        console.warn(studyListForLookup);
        return false;
    }

    var $freezeTreeListOrderButton = $('#freeze-tree-list-order');
    $freezeTreeListOrderButton.unbind('click').click(freezeDisplayedListOrder);

    var $newTreeStartButton = $('#new-collection-tree-start');
    $newTreeStartButton.attr('disabled', null)
                       .removeClass('btn-info-disabled');

    // Enable taxon search
    // N.B. don't trigger unrelated form submission when pressing ENTER here
    $('input[name=study-lookup]')
        .unbind('keyup change')
        .bind('keyup change', setStudyLookupFuse )
        .unbind('keydown')
        .bind('keydown', function(e) { return e.which !== 13; });

    // enable "Add tree" button once list has loaded
    $newTreeStartButton.attr('disabled', null)
                       .removeClass('btn-info-disabled');
}
function loadStudyListForLookup() {
    ///console.warn('STARTING loadStudyListForLookup');
    // if list is available, bind UI and return
    if (studyListForLookup) {
        bindStudyAndTreeLookups();
        return true;
    }

    // disable "Add tree" button until the list is loaded
    var $newTreeStartButton = $('#new-collection-tree-start');
    $newTreeStartButton.attr('disabled', 'disabled')
                       .addClass('btn-info-disabled');

    $.ajax({
        type: 'POST',
        dataType: 'json',
        url: findAllStudies_url,
        data: { verbose: true },
        success: function( data, textStatus, jqXHR ) {
            // this should be properly parsed JSON

            // report errors or malformed data, if any
            if (textStatus !== 'success') {
                showErrorMessage('Sorry, there was an error loading the list of studies.');
                return;
            }
            if (typeof data !== 'object' || !($.isArray(data['matched_studies']))) {
                showErrorMessage('Sorry, there is a problem with the study-list data.');
                return;
            }

            studyListForLookup = data['matched_studies'];
            bindStudyAndTreeLookups();
            if ('TREES' in viewModel.ticklers) {
                // refresh tree list in collections editor
                nudgeTickler('TREES', {modelHasChanged: false});
            }
        }
    });

    return false;
}

function editCollection( collection, editorOptions ) {
    // toggle to full editing UI (or login if user is anonymous)
    editorOptions = editorOptions || {MAINTAIN_SCROLL: true};
    if (userIsLoggedIn()) {
        if ('data' in collection && 'url' in collection.data) {
            currentlyEditingCollectionID = getCollectionIDFromURL( collection.data.url );
            showCollectionViewer( collection, editorOptions );  // to refresh the UI
            loadStudyListForLookup();
            pushPageExitWarning('UNSAVED_COLLECTION_CHANGES',
                                "WARNING: This page contains unsaved changes.");
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

        //include a warning message if the user has no public email
        if (userEmail == 'ANONYMOUS') {
          $('#save-collection-noemail-warning').show();
          // console.log('email: '+ userEmail);
        }
        else {
          $('#save-collection-noemail-warning').hide();
        }

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

    // remove any 'status' property markers (RENAMED, REMOVED, etc.)
    stripTreeCollectionStatusMarkers( collection );

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
            popPageExitWarning('UNSAVED_COLLECTION_CHANGES');
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
            popPageExitWarning('UNSAVED_COLLECTION_CHANGES');
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
    popPageExitWarning('UNSAVED_COLLECTION_CHANGES');
}


function getCollectionViewLink(collection, options) {
    options = options || {VIEW: 'POPUP'};
    var html;
    switch(options.VIEW) {
        case 'FULL_PAGE':
        case 'POPUP':
            break;
        default:
            console.error('ERROR: getCollectionViewLink: unknown value for VIEW! ['+ options.VIEW +']');
            options.VIEW = 'POPUP';
    }
    if (!options.CLASS) {
        // optional CSS class for this link
        options.CLASS = "";
    }
    switch (options.VIEW) {
        case 'FULL_PAGE':
            // jump to the full-page viewer/editor
            html = '<a class="'+ options.CLASS +'" href="/curator/collection/view/'+ collection.id
                  +'" title="'+ (collection.description || "(no description provided)") +'">' + collection.name
                  +' <span style="color: #aaa;">&bullet;&nbsp;<span class="collection-id">'+ collection.id +'</span></span></a>';
            break;
        case 'POPUP':
            // show this collection in a popup viewer/editor (but keep the full-page URL in case they want to capture it)
            if (options.LABEL) {
                html = '<a class="'+ options.CLASS +'" href="/curator/collection/view/'+ collection.id +'" title="'
                      + (collection.description || "(no description provided)")
                      +'" onclick="fetchAndShowCollection(\''+  collection.id +'\'); return false;">'
                      + options.LABEL +'</a>';
            } else {
                html = '<a class="'+ options.CLASS +'" href="/curator/collection/view/'+ collection.id +'" title="'
                      + (collection.description || "(no description provided)")
                      +'" onclick="fetchAndShowCollection(\''+  collection.id +'\'); return false;">'
                      + collection.name
                      +' <span style="color: #aaa;">&bullet;&nbsp;<span class="collection-id">'+ collection.id +'</span></span></a>';
            }
            break;
    }
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
    var roleFound = 'None';
    if (('contributors' in collection) && $.isArray(collection.contributors)) {
        // compare to logged-in userid provide in the main page
        $.each(collection.contributors, function(i, c) {
            if (c.login === curatorLogin) {
                roleFound = 'Contributor';
                return false;
            }
        });
    }
    return roleFound;
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

function tokenizeSearchTextKeepingQuotes( text ) {
    // adapted from http://stackoverflow.com/a/18703767
    // EXAMPLE: 'get "something" from "any site"'  ==> ['get', 'someting', 'from', 'any site']
    var tokens = [ ].concat.apply([ ], text.split('"').map(function(v,i){
        // toggle behavior based on whether we're inside or outside quotes
        return i % 2 ? v : v.split(/[\s,]+/);
    })).filter(Boolean);
    return tokens;
}

/* Use ad-hoc `defaultSortOrder` property to maintain the relative positions of
 * list items which have been sorted "equally". This ensures identical sorting
 * results across browsers despite their different ways of handling sorting pairs.
 */
function captureDefaultSortOrder(targetList) {
    // Set a list-position property for each item, to enable "stable" sorting on all browsers.
    $.each(targetList, function(i, item) {
        item.defaultSortOrder = i;
    });
}
function maintainRelativeListPositions(a, b) {
    // Resolve "tied" items in a sort by respecting their original list positions
    if (typeof a.defaultSortOrder !== 'undefined' && typeof b.defaultSortOrder !== 'undefined') {
        // the result will maintain their prior relative positions
        return (a.defaultSortOrder > b.defaultSortOrder) ? 1 : -1;
    }

    console.error('defaultSortOrder not found on these items!');
    console.error(a);
    console.error(b);

    return 0;
}
function checkForInterestingStudies(a,b) {
    return false;
    /*
    // match both studies
    var interestingIDs = ['tt_10', 'tt_25']; // ['pg_2886', 'tt_93'];
    if ($.inArray( a['ot:studyId'], interestingIDs ) === -1) return false;
    if ($.inArray( b['ot:studyId'], interestingIDs ) === -1) return false;
    return true;
    */
    /*
    // match just one study
    var interestingIDs = ['tt_95'];
    if ($.inArray( a['ot:studyId'], interestingIDs ) !== -1) return true;
    if ($.inArray( b['ot:studyId'], interestingIDs ) !== -1) return true;
    return false;
    */
}

// A pretty comprehensive list of diacritical variants for Latin characters/combinations, adapted from
// <http://stackoverflow.com/a/18391901>
/* N.B. The use of Unicode points in this version is cryptic, but might be more robust in older browsers.
var diacriticalVariants = [
    '(AA|\uA732)',
    '(AE|\u00C6|\u01FC|\u01E2)',
    '(AO|\uA734)',
    '(AU|\uA736)',
    '(AV|\uA738|\uA73A)',
    '(AY|\uA73C)',
    '(A|\u0041|\u24B6|\uFF21|\u00C0|\u00C1|\u00C2|\u1EA6|\u1EA4|\u1EAA|\u1EA8|\u00C3|\u0100|\u0102|\u1EB0|\u1EAE|\u1EB4|\u1EB2|\u0226|\u01E0|\u00C4|\u01DE|\u1EA2|\u00C5|\u01FA|\u01CD|\u0200|\u0202|\u1EA0|\u1EAC|\u1EB6|\u1E00|\u0104|\u023A|\u2C6F)',
    '(B|\u0042|\u24B7|\uFF22|\u1E02|\u1E04|\u1E06|\u0243|\u0182|\u0181)',
    '(C|\u0043|\u24B8|\uFF23|\u0106|\u0108|\u010A|\u010C|\u00C7|\u1E08|\u0187|\u023B|\uA73E)',
    '(DZ|\u01F1|\u01C4)',
    '(Dz|\u01F2|\u01C5)',
    '(D|\u0044|\u24B9|\uFF24|\u1E0A|\u010E|\u1E0C|\u1E10|\u1E12|\u1E0E|\u0110|\u018B|\u018A|\u0189|\uA779)',
    '(E|\u0045|\u24BA|\uFF25|\u00C8|\u00C9|\u00CA|\u1EC0|\u1EBE|\u1EC4|\u1EC2|\u1EBC|\u0112|\u1E14|\u1E16|\u0114|\u0116|\u00CB|\u1EBA|\u011A|\u0204|\u0206|\u1EB8|\u1EC6|\u0228|\u1E1C|\u0118|\u1E18|\u1E1A|\u0190|\u018E)',
    '(F|\u0046|\u24BB|\uFF26|\u1E1E|\u0191|\uA77B)',
    '(G|\u0047|\u24BC|\uFF27|\u01F4|\u011C|\u1E20|\u011E|\u0120|\u01E6|\u0122|\u01E4|\u0193|\uA7A0|\uA77D|\uA77E)',
    '(H|\u0048|\u24BD|\uFF28|\u0124|\u1E22|\u1E26|\u021E|\u1E24|\u1E28|\u1E2A|\u0126|\u2C67|\u2C75|\uA78D)',
    '(I|\u0049|\u24BE|\uFF29|\u00CC|\u00CD|\u00CE|\u0128|\u012A|\u012C|\u0130|\u00CF|\u1E2E|\u1EC8|\u01CF|\u0208|\u020A|\u1ECA|\u012E|\u1E2C|\u0197)',
    '(J|\u004A|\u24BF|\uFF2A|\u0134|\u0248)',
    '(K|\u004B|\u24C0|\uFF2B|\u1E30|\u01E8|\u1E32|\u0136|\u1E34|\u0198|\u2C69|\uA740|\uA742|\uA744|\uA7A2)',
    '(LJ|\u01C7)',
    '(Lj|\u01C8)',
    '(L|\u004C|\u24C1|\uFF2C|\u013F|\u0139|\u013D|\u1E36|\u1E38|\u013B|\u1E3C|\u1E3A|\u0141|\u023D|\u2C62|\u2C60|\uA748|\uA746|\uA780)',
    '(M|\u004D|\u24C2|\uFF2D|\u1E3E|\u1E40|\u1E42|\u2C6E|\u019C)',
    '(NJ|\u01CA)',
    '(Nj|\u01CB)',
    '(N|\u004E|\u24C3|\uFF2E|\u01F8|\u0143|\u00D1|\u1E44|\u0147|\u1E46|\u0145|\u1E4A|\u1E48|\u0220|\u019D|\uA790|\uA7A4)',
    '(OI|\u01A2)',
    '(OO|\uA74E)',
    '(OU|\u0222)',
    '(OE|\u008C|\u0152)',
    '(oe|\u009C|\u0153)',
    '(O|\u004F|\u24C4|\uFF2F|\u00D2|\u00D3|\u00D4|\u1ED2|\u1ED0|\u1ED6|\u1ED4|\u00D5|\u1E4C|\u022C|\u1E4E|\u014C|\u1E50|\u1E52|\u014E|\u022E|\u0230|\u00D6|\u022A|\u1ECE|\u0150|\u01D1|\u020C|\u020E|\u01A0|\u1EDC|\u1EDA|\u1EE0|\u1EDE|\u1EE2|\u1ECC|\u1ED8|\u01EA|\u01EC|\u00D8|\u01FE|\u0186|\u019F|\uA74A|\uA74C)',
    '(P|\u0050|\u24C5|\uFF30|\u1E54|\u1E56|\u01A4|\u2C63|\uA750|\uA752|\uA754)',
    '(Q|\u0051|\u24C6|\uFF31|\uA756|\uA758|\u024A)',
    '(R|\u0052|\u24C7|\uFF32|\u0154|\u1E58|\u0158|\u0210|\u0212|\u1E5A|\u1E5C|\u0156|\u1E5E|\u024C|\u2C64|\uA75A|\uA7A6|\uA782)',
    '(S|\u0053|\u24C8|\uFF33|\u1E9E|\u015A|\u1E64|\u015C|\u1E60|\u0160|\u1E66|\u1E62|\u1E68|\u0218|\u015E|\u2C7E|\uA7A8|\uA784)',
    '(TZ|\uA728)',
    '(T|\u0054|\u24C9|\uFF34|\u1E6A|\u0164|\u1E6C|\u021A|\u0162|\u1E70|\u1E6E|\u0166|\u01AC|\u01AE|\u023E|\uA786)',
    '(U|\u0055|\u24CA|\uFF35|\u00D9|\u00DA|\u00DB|\u0168|\u1E78|\u016A|\u1E7A|\u016C|\u00DC|\u01DB|\u01D7|\u01D5|\u01D9|\u1EE6|\u016E|\u0170|\u01D3|\u0214|\u0216|\u01AF|\u1EEA|\u1EE8|\u1EEE|\u1EEC|\u1EF0|\u1EE4|\u1E72|\u0172|\u1E76|\u1E74|\u0244)',
    '(VY|\uA760)',
    '(V|\u0056|\u24CB|\uFF36|\u1E7C|\u1E7E|\u01B2|\uA75E|\u0245)',
    '(W|\u0057|\u24CC|\uFF37|\u1E80|\u1E82|\u0174|\u1E86|\u1E84|\u1E88|\u2C72)',
    '(X|\u0058|\u24CD|\uFF38|\u1E8A|\u1E8C)',
    '(Y|\u0059|\u24CE|\uFF39|\u1EF2|\u00DD|\u0176|\u1EF8|\u0232|\u1E8E|\u0178|\u1EF6|\u1EF4|\u01B3|\u024E|\u1EFE)',
    '(Z|\u005A|\u24CF|\uFF3A|\u0179|\u1E90|\u017B|\u017D|\u1E92|\u1E94|\u01B5|\u0224|\u2C7F|\u2C6B|\uA762)',
    '(aa|\uA733)',
    '(ae|\u00E6|\u01FD|\u01E3)',
    '(ao|\uA735)',
    '(au|\uA737)',
    '(av|\uA739|\uA73B)',
    '(ay|\uA73D)',
    '(a|\u0061|\u24D0|\uFF41|\u1E9A|\u00E0|\u00E1|\u00E2|\u1EA7|\u1EA5|\u1EAB|\u1EA9|\u00E3|\u0101|\u0103|\u1EB1|\u1EAF|\u1EB5|\u1EB3|\u0227|\u01E1|\u00E4|\u01DF|\u1EA3|\u00E5|\u01FB|\u01CE|\u0201|\u0203|\u1EA1|\u1EAD|\u1EB7|\u1E01|\u0105|\u2C65|\u0250)',
    '(b|\u0062|\u24D1|\uFF42|\u1E03|\u1E05|\u1E07|\u0180|\u0183|\u0253)',
    '(c|\u0063|\u24D2|\uFF43|\u0107|\u0109|\u010B|\u010D|\u00E7|\u1E09|\u0188|\u023C|\uA73F|\u2184)',
    '(dz|\u01F3|\u01C6)',
    '(d|\u0064|\u24D3|\uFF44|\u1E0B|\u010F|\u1E0D|\u1E11|\u1E13|\u1E0F|\u0111|\u018C|\u0256|\u0257|\uA77A)',
    '(e|\u0065|\u24D4|\uFF45|\u00E8|\u00E9|\u00EA|\u1EC1|\u1EBF|\u1EC5|\u1EC3|\u1EBD|\u0113|\u1E15|\u1E17|\u0115|\u0117|\u00EB|\u1EBB|\u011B|\u0205|\u0207|\u1EB9|\u1EC7|\u0229|\u1E1D|\u0119|\u1E19|\u1E1B|\u0247|\u025B|\u01DD)',
    '(f|\u0066|\u24D5|\uFF46|\u1E1F|\u0192|\uA77C)',
    '(g|\u0067|\u24D6|\uFF47|\u01F5|\u011D|\u1E21|\u011F|\u0121|\u01E7|\u0123|\u01E5|\u0260|\uA7A1|\u1D79|\uA77F)',
    '(hv|\u0195)',
    '(h|\u0068|\u24D7|\uFF48|\u0125|\u1E23|\u1E27|\u021F|\u1E25|\u1E29|\u1E2B|\u1E96|\u0127|\u2C68|\u2C76|\u0265)',
    '(i|\u0069|\u24D8|\uFF49|\u00EC|\u00ED|\u00EE|\u0129|\u012B|\u012D|\u00EF|\u1E2F|\u1EC9|\u01D0|\u0209|\u020B|\u1ECB|\u012F|\u1E2D|\u0268|\u0131)',
    '(j|\u006A|\u24D9|\uFF4A|\u0135|\u01F0|\u0249)',
    '(k|\u006B|\u24DA|\uFF4B|\u1E31|\u01E9|\u1E33|\u0137|\u1E35|\u0199|\u2C6A|\uA741|\uA743|\uA745|\uA7A3)',
    '(lj|\u01C9)',
    '(l|\u006C|\u24DB|\uFF4C|\u0140|\u013A|\u013E|\u1E37|\u1E39|\u013C|\u1E3D|\u1E3B|\u017F|\u0142|\u019A|\u026B|\u2C61|\uA749|\uA781|\uA747)',
    '(m|\u006D|\u24DC|\uFF4D|\u1E3F|\u1E41|\u1E43|\u0271|\u026F)',
    '(nj|\u01CC)',
    '(n|\u006E|\u24DD|\uFF4E|\u01F9|\u0144|\u00F1|\u1E45|\u0148|\u1E47|\u0146|\u1E4B|\u1E49|\u019E|\u0272|\u0149|\uA791|\uA7A5)',
    '(oi|\u01A3)',
    '(ou|\u0223)',
    '(oo|\uA74F)',
    '(o|\u006F|\u24DE|\uFF4F|\u00F2|\u00F3|\u00F4|\u1ED3|\u1ED1|\u1ED7|\u1ED5|\u00F5|\u1E4D|\u022D|\u1E4F|\u014D|\u1E51|\u1E53|\u014F|\u022F|\u0231|\u00F6|\u022B|\u1ECF|\u0151|\u01D2|\u020D|\u020F|\u01A1|\u1EDD|\u1EDB|\u1EE1|\u1EDF|\u1EE3|\u1ECD|\u1ED9|\u01EB|\u01ED|\u00F8|\u01FF|\u0254|\uA74B|\uA74D|\u0275)',
    '(p|\u0070|\u24DF|\uFF50|\u1E55|\u1E57|\u01A5|\u1D7D|\uA751|\uA753|\uA755)',
    '(q|\u0071|\u24E0|\uFF51|\u024B|\uA757|\uA759)',
    '(r|\u0072|\u24E1|\uFF52|\u0155|\u1E59|\u0159|\u0211|\u0213|\u1E5B|\u1E5D|\u0157|\u1E5F|\u024D|\u027D|\uA75B|\uA7A7|\uA783)',
    '(s|\u0073|\u24E2|\uFF53|\u00DF|\u015B|\u1E65|\u015D|\u1E61|\u0161|\u1E67|\u1E63|\u1E69|\u0219|\u015F|\u023F|\uA7A9|\uA785|\u1E9B)',
    '(tz|\uA729)',
    '(t|\u0074|\u24E3|\uFF54|\u1E6B|\u1E97|\u0165|\u1E6D|\u021B|\u0163|\u1E71|\u1E6F|\u0167|\u01AD|\u0288|\u2C66|\uA787)',
    '(u|\u0075|\u24E4|\uFF55|\u00F9|\u00FA|\u00FB|\u0169|\u1E79|\u016B|\u1E7B|\u016D|\u00FC|\u01DC|\u01D8|\u01D6|\u01DA|\u1EE7|\u016F|\u0171|\u01D4|\u0215|\u0217|\u01B0|\u1EEB|\u1EE9|\u1EEF|\u1EED|\u1EF1|\u1EE5|\u1E73|\u0173|\u1E77|\u1E75|\u0289)',
    '(vy|\uA761)',
    '(v|\u0076|\u24E5|\uFF56|\u1E7D|\u1E7F|\u028B|\uA75F|\u028C)',
    '(w|\u0077|\u24E6|\uFF57|\u1E81|\u1E83|\u0175|\u1E87|\u1E85|\u1E98|\u1E89|\u2C73)',
    '(x|\u0078|\u24E7|\uFF58|\u1E8B|\u1E8D)',
    '(y|\u0079|\u24E8|\uFF59|\u1EF3|\u00FD|\u0177|\u1EF9|\u0233|\u1E8F|\u00FF|\u1EF7|\u1E99|\u1EF5|\u01B4|\u024F|\u1EFF)',
    '(z|\u007A|\u24E9|\uFF5A|\u017A|\u1E91|\u017C|\u017E|\u1E93|\u1E95|\u01B6|\u0225|\u0240|\u2C6C|\uA763)',
];
*/
// Here's a friendlier rendering of the array above (captured from JS console); will it work in our target browsers?
var diacriticalVariants = [
    "(AA|Ꜳ)",
    "(AE|Æ|Ǽ|Ǣ)",
    "(AO|Ꜵ)",
    "(AU|Ꜷ)",
    "(AV|Ꜹ|Ꜻ)",
    "(AY|Ꜽ)",
    "(A|A|Ⓐ|Ａ|À|Á|Â|Ầ|Ấ|Ẫ|Ẩ|Ã|Ā|Ă|Ằ|Ắ|Ẵ|Ẳ|Ȧ|Ǡ|Ä|Ǟ|Ả|Å|Ǻ|Ǎ|Ȁ|Ȃ|Ạ|Ậ|Ặ|Ḁ|Ą|Ⱥ|Ɐ)",
    "(B|B|Ⓑ|Ｂ|Ḃ|Ḅ|Ḇ|Ƀ|Ƃ|Ɓ)",
    "(C|C|Ⓒ|Ｃ|Ć|Ĉ|Ċ|Č|Ç|Ḉ|Ƈ|Ȼ|Ꜿ)",
    "(DZ|Ǳ|Ǆ)",
    "(Dz|ǲ|ǅ)",
    "(D|D|Ⓓ|Ｄ|Ḋ|Ď|Ḍ|Ḑ|Ḓ|Ḏ|Đ|Ƌ|Ɗ|Ɖ|Ꝺ)",
    "(E|E|Ⓔ|Ｅ|È|É|Ê|Ề|Ế|Ễ|Ể|Ẽ|Ē|Ḕ|Ḗ|Ĕ|Ė|Ë|Ẻ|Ě|Ȅ|Ȇ|Ẹ|Ệ|Ȩ|Ḝ|Ę|Ḙ|Ḛ|Ɛ|Ǝ)",
    "(F|F|Ⓕ|Ｆ|Ḟ|Ƒ|Ꝼ)",
    "(G|G|Ⓖ|Ｇ|Ǵ|Ĝ|Ḡ|Ğ|Ġ|Ǧ|Ģ|Ǥ|Ɠ|Ꞡ|Ᵹ|Ꝿ)",
    "(H|H|Ⓗ|Ｈ|Ĥ|Ḣ|Ḧ|Ȟ|Ḥ|Ḩ|Ḫ|Ħ|Ⱨ|Ⱶ|Ɥ)",
    "(I|I|Ⓘ|Ｉ|Ì|Í|Î|Ĩ|Ī|Ĭ|İ|Ï|Ḯ|Ỉ|Ǐ|Ȉ|Ȋ|Ị|Į|Ḭ|Ɨ)",
    "(J|J|Ⓙ|Ｊ|Ĵ|Ɉ)",
    "(K|K|Ⓚ|Ｋ|Ḱ|Ǩ|Ḳ|Ķ|Ḵ|Ƙ|Ⱪ|Ꝁ|Ꝃ|Ꝅ|Ꞣ)",
    "(LJ|Ǉ)",
    "(Lj|ǈ)",
    "(L|L|Ⓛ|Ｌ|Ŀ|Ĺ|Ľ|Ḷ|Ḹ|Ļ|Ḽ|Ḻ|Ł|Ƚ|Ɫ|Ⱡ|Ꝉ|Ꝇ|Ꞁ)",
    "(M|M|Ⓜ|Ｍ|Ḿ|Ṁ|Ṃ|Ɱ|Ɯ)",
    "(NJ|Ǌ)",
    "(Nj|ǋ)",
    "(N|N|Ⓝ|Ｎ|Ǹ|Ń|Ñ|Ṅ|Ň|Ṇ|Ņ|Ṋ|Ṉ|Ƞ|Ɲ|Ꞑ|Ꞥ)",
    "(OI|Ƣ)",
    "(OO|Ꝏ)",
    "(OU|Ȣ)",
    "(OE||Œ)",
    "(oe||œ)",
    "(O|O|Ⓞ|Ｏ|Ò|Ó|Ô|Ồ|Ố|Ỗ|Ổ|Õ|Ṍ|Ȭ|Ṏ|Ō|Ṑ|Ṓ|Ŏ|Ȯ|Ȱ|Ö|Ȫ|Ỏ|Ő|Ǒ|Ȍ|Ȏ|Ơ|Ờ|Ớ|Ỡ|Ở|Ợ|Ọ|Ộ|Ǫ|Ǭ|Ø|Ǿ|Ɔ|Ɵ|Ꝋ|Ꝍ)",
    "(P|P|Ⓟ|Ｐ|Ṕ|Ṗ|Ƥ|Ᵽ|Ꝑ|Ꝓ|Ꝕ)",
    "(Q|Q|Ⓠ|Ｑ|Ꝗ|Ꝙ|Ɋ)",
    "(R|R|Ⓡ|Ｒ|Ŕ|Ṙ|Ř|Ȑ|Ȓ|Ṛ|Ṝ|Ŗ|Ṟ|Ɍ|Ɽ|Ꝛ|Ꞧ|Ꞃ)",
    "(S|S|Ⓢ|Ｓ|ẞ|Ś|Ṥ|Ŝ|Ṡ|Š|Ṧ|Ṣ|Ṩ|Ș|Ş|Ȿ|Ꞩ|Ꞅ)",
    "(TZ|Ꜩ)",
    "(T|T|Ⓣ|Ｔ|Ṫ|Ť|Ṭ|Ț|Ţ|Ṱ|Ṯ|Ŧ|Ƭ|Ʈ|Ⱦ|Ꞇ)",
    "(U|U|Ⓤ|Ｕ|Ù|Ú|Û|Ũ|Ṹ|Ū|Ṻ|Ŭ|Ü|Ǜ|Ǘ|Ǖ|Ǚ|Ủ|Ů|Ű|Ǔ|Ȕ|Ȗ|Ư|Ừ|Ứ|Ữ|Ử|Ự|Ụ|Ṳ|Ų|Ṷ|Ṵ|Ʉ)",
    "(VY|Ꝡ)",
    "(V|V|Ⓥ|Ｖ|Ṽ|Ṿ|Ʋ|Ꝟ|Ʌ)",
    "(W|W|Ⓦ|Ｗ|Ẁ|Ẃ|Ŵ|Ẇ|Ẅ|Ẉ|Ⱳ)",
    "(X|X|Ⓧ|Ｘ|Ẋ|Ẍ)",
    "(Y|Y|Ⓨ|Ｙ|Ỳ|Ý|Ŷ|Ỹ|Ȳ|Ẏ|Ÿ|Ỷ|Ỵ|Ƴ|Ɏ|Ỿ)",
    "(Z|Z|Ⓩ|Ｚ|Ź|Ẑ|Ż|Ž|Ẓ|Ẕ|Ƶ|Ȥ|Ɀ|Ⱬ|Ꝣ)",
    "(aa|ꜳ)",
    "(ae|æ|ǽ|ǣ)",
    "(ao|ꜵ)",
    "(au|ꜷ)",
    "(av|ꜹ|ꜻ)",
    "(ay|ꜽ)",
    "(a|a|ⓐ|ａ|ẚ|à|á|â|ầ|ấ|ẫ|ẩ|ã|ā|ă|ằ|ắ|ẵ|ẳ|ȧ|ǡ|ä|ǟ|ả|å|ǻ|ǎ|ȁ|ȃ|ạ|ậ|ặ|ḁ|ą|ⱥ|ɐ)",
    "(b|b|ⓑ|ｂ|ḃ|ḅ|ḇ|ƀ|ƃ|ɓ)",
    "(c|c|ⓒ|ｃ|ć|ĉ|ċ|č|ç|ḉ|ƈ|ȼ|ꜿ|ↄ)",
    "(dz|ǳ|ǆ)",
    "(d|d|ⓓ|ｄ|ḋ|ď|ḍ|ḑ|ḓ|ḏ|đ|ƌ|ɖ|ɗ|ꝺ)",
    "(e|e|ⓔ|ｅ|è|é|ê|ề|ế|ễ|ể|ẽ|ē|ḕ|ḗ|ĕ|ė|ë|ẻ|ě|ȅ|ȇ|ẹ|ệ|ȩ|ḝ|ę|ḙ|ḛ|ɇ|ɛ|ǝ)",
    "(f|f|ⓕ|ｆ|ḟ|ƒ|ꝼ)",
    "(g|g|ⓖ|ｇ|ǵ|ĝ|ḡ|ğ|ġ|ǧ|ģ|ǥ|ɠ|ꞡ|ᵹ|ꝿ)",
    "(hv|ƕ)",
    "(h|h|ⓗ|ｈ|ĥ|ḣ|ḧ|ȟ|ḥ|ḩ|ḫ|ẖ|ħ|ⱨ|ⱶ|ɥ)",
    "(i|i|ⓘ|ｉ|ì|í|î|ĩ|ī|ĭ|ï|ḯ|ỉ|ǐ|ȉ|ȋ|ị|į|ḭ|ɨ|ı)",
    "(j|j|ⓙ|ｊ|ĵ|ǰ|ɉ)",
    "(k|k|ⓚ|ｋ|ḱ|ǩ|ḳ|ķ|ḵ|ƙ|ⱪ|ꝁ|ꝃ|ꝅ|ꞣ)",
    "(lj|ǉ)",
    "(l|l|ⓛ|ｌ|ŀ|ĺ|ľ|ḷ|ḹ|ļ|ḽ|ḻ|ſ|ł|ƚ|ɫ|ⱡ|ꝉ|ꞁ|ꝇ)",
    "(m|m|ⓜ|ｍ|ḿ|ṁ|ṃ|ɱ|ɯ)",
    "(nj|ǌ)",
    "(n|n|ⓝ|ｎ|ǹ|ń|ñ|ṅ|ň|ṇ|ņ|ṋ|ṉ|ƞ|ɲ|ŉ|ꞑ|ꞥ)",
    "(oi|ƣ)",
    "(ou|ȣ)",
    "(oo|ꝏ)",
    "(o|o|ⓞ|ｏ|ò|ó|ô|ồ|ố|ỗ|ổ|õ|ṍ|ȭ|ṏ|ō|ṑ|ṓ|ŏ|ȯ|ȱ|ö|ȫ|ỏ|ő|ǒ|ȍ|ȏ|ơ|ờ|ớ|ỡ|ở|ợ|ọ|ộ|ǫ|ǭ|ø|ǿ|ɔ|ꝋ|ꝍ|ɵ)",
    "(p|p|ⓟ|ｐ|ṕ|ṗ|ƥ|ᵽ|ꝑ|ꝓ|ꝕ)",
    "(q|q|ⓠ|ｑ|ɋ|ꝗ|ꝙ)",
    "(r|r|ⓡ|ｒ|ŕ|ṙ|ř|ȑ|ȓ|ṛ|ṝ|ŗ|ṟ|ɍ|ɽ|ꝛ|ꞧ|ꞃ)",
    "(s|s|ⓢ|ｓ|ß|ś|ṥ|ŝ|ṡ|š|ṧ|ṣ|ṩ|ș|ş|ȿ|ꞩ|ꞅ|ẛ)",
    "(tz|ꜩ)",
    "(t|t|ⓣ|ｔ|ṫ|ẗ|ť|ṭ|ț|ţ|ṱ|ṯ|ŧ|ƭ|ʈ|ⱦ|ꞇ)",
    "(u|u|ⓤ|ｕ|ù|ú|û|ũ|ṹ|ū|ṻ|ŭ|ü|ǜ|ǘ|ǖ|ǚ|ủ|ů|ű|ǔ|ȕ|ȗ|ư|ừ|ứ|ữ|ử|ự|ụ|ṳ|ų|ṷ|ṵ|ʉ)",
    "(vy|ꝡ)",
    "(v|v|ⓥ|ｖ|ṽ|ṿ|ʋ|ꝟ|ʌ)",
    "(w|w|ⓦ|ｗ|ẁ|ẃ|ŵ|ẇ|ẅ|ẘ|ẉ|ⱳ)",
    "(x|x|ⓧ|ｘ|ẋ|ẍ)",
    "(y|y|ⓨ|ｙ|ỳ|ý|ŷ|ỹ|ȳ|ẏ|ÿ|ỷ|ẙ|ỵ|ƴ|ɏ|ỿ)",
    "(z|z|ⓩ|ｚ|ź|ẑ|ż|ž|ẓ|ẕ|ƶ|ȥ|ɀ|ⱬ|ꝣ)"
]

function addDiacriticalVariants( searchText ) {
    /* Add common diacritical variants to the search string provided. For
     * example, a search for "Lutzen" should find "Lützen" AND vice versa.
     *
     * We start with the most complex letter combinations (e.g. match "ae"
     * before "a") and replace each with a bracketed set of possible
     * diacritical variants. Each substitution should carefully avoid adding
     * nested submatches! This is actually handled by using a single regex with
     * OR operators, which will always capture the first case found:
     *   /(ae|åe)|(a|å)|(e|é)/g
     *
     * Calling String.replace() in this way takes a little setup, but it should
     * be *much* quicker than piecemeal substitution or string building.
     */
    var dvCount = diacriticalVariants.length;
    var combinedVariants = diacriticalVariants.join('|');
    var finder = new RegExp(combinedVariants, 'g');
    var replacer = function(/* lots of them, sniffed as 'arguments' below */) {
        // We'll sniff the incoming args, see <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#Specifying_a_function_as_a_parameter>
        var foundMatch = arguments[0];
        // ... and then args for each parenthesized submatch ...
        var foundOffset = arguments[arguments.length - 2];
        var haystack = arguments[arguments.length - 1];

        // For each interesting sequence found, substitute the variant's submatch pattern
        for (var i = 0; i < dvCount; i++) {
            var pattern = diacriticalVariants[i];
            var foundMatch = arguments[i+1];
            // N.B. we skip the first arg!
            if (foundMatch) {  // a string, or nothing
                return pattern;
            }
        }
    };
    searchText = searchText.replace(finder, replacer);
    return searchText;
}

function removeDiacritics( str ) {
    /* Replace common diacritical variants with a safe (Latin) alternative.
     * This is the safest way to treat values that will be used on the query
     * string (via History.js).
     *
     * N.B. this takes advantage of our collection of variants above, where the
     * first option is always a "safe" string comprised only of Latin characters.
     */
    if (typeof str !== 'string') {
        return str;  // return any number, etc. unchanged
    }
    var dvCount = diacriticalVariants.length;
    var combinedVariants = diacriticalVariants.join('|');
    var finder = new RegExp(combinedVariants, 'g');
    var replacer = function(/* lots of them, sniffed as 'arguments' below */) {
        // We'll sniff the incoming args, see <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#Specifying_a_function_as_a_parameter>
        var foundMatch = arguments[0];
        // ... and then args for each parenthesized submatch ...
        var foundOffset = arguments[arguments.length - 2];
        var haystack = arguments[arguments.length - 1];

        // For each interesting sequence found, substitute the variant's submatch pattern
        for (var i = 0; i < dvCount; i++) {
            var pattern = diacriticalVariants[i];
            var foundMatch = arguments[i+1];
            // N.B. we skip the first arg!
            if (foundMatch) {  // a string, or nothing
                // extract the first (Latin-only) option from this pattern, for example
                //  "(ae|æ|ǽ|ǣ)"  =>  "ae"
                var latinOption = pattern.split('|')[0];
                latinOption = latinOption.slice(1);    // strip initial '('
                return latinOption;
            }
        }
    };
    str = str.replace(finder, replacer);
    return str;
}
