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
 * Call addPageExitWarning(), removePageExitWarning() to add/remove this
 * protection as needed.
 *
 * Adapted from  
 * http://stackoverflow.com/questions/1119289/how-to-show-the-are-you-sure-you-want-to-navigate-away-from-this-page-when-ch/1119324#1119324
 */

var pageExitWarning = "WARNING: This page contains unsaved changes.";

var confirmOnPageExit = function (e) 
{
    // If we haven't been passed the event get the window.event
    e = e || window.event;

    var message = pageExitWarning;

    // For IE6-8 and Firefox prior to version 4
    if (e) 
    {
        e.returnValue = message;
    }

    // For Chrome, Safari, IE8+ and Opera 12+
    return message;
};

function addPageExitWarning( warningText ) {
    // Turn it on - assign the function that returns the string
    if (warningText) {
        pageExitWarning = warningText;
    }
    window.onbeforeunload = confirmOnPageExit;
}
function removePageExitWarning() {
    // Turn it off - remove the function entirely
    window.onbeforeunload = null;
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


// Keep track of when the collection viewer is already showing, so we
// can hold it open and step through nodes or trees.
var collectionViewerIsInUse = false;
function showCollectionViewer( collection, options ) {
    // TODO: allow options for initial display, etc.?
    options = options || {};

    if (collection) {
        // TODO: Cleanup or initialization?
        ; // do nothing
    } else {
        // this should *never* happen
        //TODO: alert("showCollectionViewer(): No collection specified!");
        //TODO: return;
        // use a dummy object for now?
        collection = {
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

    // TODO: adapt tags widget from tree viewer?
    /*
    if (viewOrEdit == 'EDIT') {
        // TODO: reset observables for some options?
        viewModel.chosenNodeLabelModeInfo = ko.observable(null);
        viewModel.nodeLabelModeDescription = ko.observable('');
    }
    */

    // bind just the selected collection to the modal HTML 
    // NOTE that we must call cleanNode first, to allow "re-binding" with KO.
    var $boundElements = $('#tree-collection-viewer').find('.modal-body, .modal-header h3');
    // Step carefully to avoid un-binding important modal behavior (close widgets, etc)!
    $.each($boundElements, function(i, el) {
        ko.cleanNode(el);
        // remove all but one table row (else they multiply!)
        $('tr.single-tree-row:gt(0)', el).remove();
        ko.applyBindings(collection,el);
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
        ///hideModalScreen();
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
            collectionViewerIsInUse = false;
        });
        $('#tree-collection-viewer').off('hidden').on('hidden', function () {
            ///console.log('@@@@@ hidden');
        });

        $('#tree-collection-viewer').modal('show');
    }
}

