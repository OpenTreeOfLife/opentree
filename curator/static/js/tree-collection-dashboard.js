/*    
@licstart  The following is the entire license notice for the JavaScript code in this page. 

    Copyright (c) 2015, Jim Allman

    All rights reserved.

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are met:

    Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.

    Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation
    and/or other materials provided with the distribution.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
    AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
    FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
    DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
    SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
    CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
    OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
    OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

@licend  The above is the entire license notice for the JavaScript code in this page.
*/

/*
 * Client-side behavior for the Open Tree tree-collection browser
 *
 * This uses the Open Tree API to fetch and store tree collections remotely. In
 * this initial version, we'll load metadata for all collections in the system,
 * then use client-side code to filter and sort them.
 */

/*
 * Subscribe to history changes (adapted from History.js boilerplate) 
 */

var History = window.History; // Note: capital H refers to History.js!
// History.js can be disabled for HTML4 browsers, but this should not be the case for opentree!


// these variables should already be defined in the main HTML page
var findAllTreeCollections_url;
var viewOrEdit;

// working space for parsed JSON objects (incl. sub-objects)
var viewModel;

/* Use history plugin to track moves from tab to tab, single-tree popup, others? */

var listFilterDefaults; // defined in main page, for a clean initial state

if ( History && History.enabled ) {
    
    var handleChangingState = function() {
        if (!viewModel) {
            // try again soon (waiting for the study list to load)
            setTimeout( handleChangingState, 50 );
            return;
        }
        var State = History.getState(); // Note: We are using History.getState() instead of event.state
        ///History.log(State.data, State.title, State.url);

        // Extract our state vars from State.url (not from State.data) for equal
        // treatment of initial URLs.
        var activeFilter = viewModel.listFilters.COLLECTIONS;
        var filterDefaults = listFilterDefaults.COLLECTIONS;
        // assert any saved filter values
        for (var prop in activeFilter) {
            if (prop in State.data) {
                activeFilter[prop]( State.data[prop] );
            } else {
                // (re)set to its default value
                activeFilter[prop]( filterDefaults[prop] );
            }
        }

        initialState = null;  // clear this to unlock history for other changes
    };

    // bind to statechange event
    History.Adapter.bind(window, 'statechange', handleChangingState);
}

function updateListFiltersWithHistory() {
    // capture changing list filters in browser history
    // N.B. This is triggered when filter is updated programmatically
    // TODO: Try not to capture all keystrokes, or trivial changes?
    if (History && History.enabled) {
        if (initialState) {
            // wait until initial state has been applied!
            return;
        }
        var oldState = History.getState().data;

        // Determine which list filter is active (currently based on tab)
        // N.B. There's currently just one filter per tab (Trees, Files, OTU Mapping).
        var activeFilter = viewModel.listFilters.COLLECTIONS;
        var filterDefaults = listFilterDefaults.COLLECTIONS;
        var newState = { };
        var newQSValues = { };
        for (prop in activeFilter) {
            newState[prop] = ko.unwrap(activeFilter[prop]);
            // Hide default filter settings, for simpler URLs
            if (newState[prop] !== filterDefaults[prop]) {
                newQSValues[prop] = ko.unwrap(activeFilter[prop]);
            }
        }
        //var newQueryString = '?'+ encodeURIComponent($.param(newQSValues));
        var newQueryString = '?'+ $.param(newQSValues);
        History.pushState( newState, (window.document.title), newQueryString );
    }
}

$(document).ready(function() {
    bindHelpPanels();
    loadCollectionList();
    
    // NOTE that our initial state is set in the main page template, so we 
    // can build it from incoming URL in web2py. Try to recapture this state,
    // ideally through manipulating history.
    if (History && History.enabled) {
        // "formalize" the current state with an object
        initialState.nudge = new Date().getTime();
        History.replaceState(initialState, window.document.title, window.location.href);
    }
});

function loadCollectionList() {
    // show/hide spinner during all AJAX requests?

    // use oti (study indexing service) to get the complete list
    showModalScreen("Loading tree collection list...", {SHOW_BUSY_BAR:true});

    $.ajax({
        type: 'POST',
        dataType: 'json',
        url: findAllTreeCollections_url,
        data: null,  // TODO: do we need { verbose: true } or other options here?
        success: function( data, textStatus, jqXHR ) {
            // this should be properly parsed JSON

            // report errors or malformed data, if any
            if (textStatus !== 'success') {
                showErrorMessage('Sorry, there was an error loading the list of tree collections.');
                return;
            }
            if (typeof data !== 'object' || !($.isArray(data))) {
                showErrorMessage('Sorry, there is a problem with the tree-collection data.');
                return;
            }
            
            viewModel = data; /// ko.mapping.fromJS( fakeStudyList );  // ..., mappingOptions);

            // enable sorting and filtering for lists in the editor
            viewModel.listFilters = {
                // UI widgets bound to these variables will trigger the
                // computed display lists below..
                'COLLECTIONS': {
                    // TODO: add 'pagesize'?
                    'match': ko.observable(""),
                    'order': ko.observable("Most recently modified"),
                    'filter': ko.observable("All tree collections")
                }
            };
            
            // maintain a persistent array to preserve pagination (reset when computed)
            viewModel._filteredCollections = ko.observableArray( ).asPaged(20);
            viewModel.filteredCollections = ko.computed(function() {
                // filter raw tree list, returning a
                // new paged observableArray
                updateClearSearchWidget( '#study-list-filter', viewModel.listFilters.COLLECTIONS.match );
                updateListFiltersWithHistory();

                var match = viewModel.listFilters.COLLECTIONS.match(),
                    matchPattern = new RegExp( $.trim(match), 'i' );
                var order = viewModel.listFilters.COLLECTIONS.order();

                // map old array to new and return it
                var filteredList = ko.utils.arrayFilter( 
                    viewModel, 
                    function(study) {
                        // match entered text against pub reference (author, title, journal name, DOI)
                        var pubReference = study['ot:studyPublicationReference'];
                        var pubURL = study['ot:studyPublication'];
                        var pubYear = study['ot:studyYear'];
                        var tags = $.isArray(study['ot:tag']) ? study['ot:tag'].join('|') : study['ot:tag'];
                        var curator = study['ot:curatorName'];
                        var clade = ('ot:focalCladeOTTTaxonName' in study && 
                                     ($.trim(study['ot:focalCladeOTTTaxonName']) !== "")) ?
                                        study['ot:focalCladeOTTTaxonName'] :  // use mapped name if found
                                        study['ot:focalClade']; // fall back to numeric ID (should be very rare)
                        if (!matchPattern.test(pubReference) && !matchPattern.test(pubURL) && !matchPattern.test(pubYear) && !matchPattern.test(curator) && !matchPattern.test(tags) && !matchPattern.test(clade)) {
                            return false;
                        }

                        return true;
                    }
                );  // END of list filtering
                        
                // apply selected sort order
                switch(order) {
                    /* REMINDER: in sort functions, results are as follows:
                     *  -1 = a comes before b
                     *   0 = no change
                     *   1 = b comes before a
                     */
                    case 'Most recently modified':
                        filteredList.sort(function(a,b) { 
                            var aMod = a['lastModified'] || '';
                            var bMod = b['lastModified'] || '';
                            if (aMod === bMod) return 0;
                            return (aMod < bMod)? 1 : -1;
                        });
                        break;

                    case 'Most recently modified (reversed)':
                        filteredList.sort(function(a,b) { 
                            var aMod = a['lastModified'] || '';
                            var bMod = b['lastModified'] || '';
                            if (aMod === bMod) return 0;
                            return (aMod > bMod)? 1 : -1;
                        });
                        break;

                    case 'By owner/name':
                        filteredList.sort(function(a,b) { 
                            // first element is the ID with user-name/collection-name
                            if (a.id === b.id) return 0;
                            return (a.id < b.id) ? -1 : 1;
                        });
                        break;

                    case 'By owner/name (reversed)':
                        filteredList.sort(function(a,b) { 
                            // first element is the ID with user-name/collection-name
                            if (a.id === b.id) return 0;
                            return (a.id > b.id) ? -1 : 1;
                        });
                        break;

                    // TODO: add a filter for 'Has un-merged changes'?
                    
                    default:
                        console.warn("Unexpected order for collection list: ["+ order +"]");
                        return null;

                }
                viewModel._filteredCollections( filteredList );
                viewModel._filteredCollections.goToPage(1);
                return viewModel._filteredCollections;
            }); // END of filteredCollections
                    
            // bind just to the main collection list (not the single-collection editor!)
            var listArea = $('#collection-list-container')[0];
            ko.applyBindings(viewModel, listArea);

            hideModalScreen();
        }
    });
}

function getViewLink(collection) {
    // shows this collection in a popup viewer/editor
    var html = '<a class="" href="#" onclick="fetchAndShowCollection(\''+  collection.id +'\'); return false;">'+ collection.name +'</a>';

    return html;
}
function getTreeCount(collection) {
    return collection.decisions.length || 0;
}
function getCreatorLink(collection) {
    return '<a href="#" onclick="filterByCurator(\''+ collection.creator.name +'\'); return false;"'+'>'+ collection.creator.name +'</a'+'>';
}

function toggleStudyDetails( clicked ) {
    var $toggle = $(clicked);
    //var $compactRef = $toggle.prevAll('.compact-study-ref');
    var $fullRef = $toggle.closest('tr').next().find('.full-study-ref');
    if ($fullRef.is(':visible')) {
        //$compactRef.show();
        $fullRef.hide();
        $toggle.text('[show details]');
    } else {
        //$compactRef.hide();
        $fullRef.show();
        $toggle.text('[hide details]');
    }
}

function filterByCurator( curatorID ) {
    /* add their userid to the filter field
    var oldFilterText = viewModel.listFilters.COLLECTIONS.match();
    if (oldFilterText.indexOf( curatorID ) === -1) {
        var newFilterText = oldFilterText +' '+ curatorID;
        viewModel.listFilters.COLLECTIONS.match( newFilterText );
    }
    */
    // replace the filter text with this curator's userid
    viewModel.listFilters.COLLECTIONS.match( curatorID );
}
function filterByClade( cladeName ) {
    // replace the filter text with this clade name
    viewModel.listFilters.COLLECTIONS.match( cladeName );
}
function filterByTag( tag ) {
    // replace the filter text with this clade name
    viewModel.listFilters.COLLECTIONS.match( tag );
}
function filterByDOI( doi ) {
    // replace the filter text with this clade name
    viewModel.listFilters.COLLECTIONS.match( doi );
}
