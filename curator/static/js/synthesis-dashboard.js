/*    
@licstart  The following is the entire license notice for the JavaScript code in this page. 

    Copyright (c) 2021, Jim Allman

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
 * Client-side behavior for the Open Tree synthesis dashboard
 *
 * This uses the Open Tree API to show a queue of recent custom synthesis runs,
 * filtered and sorted (as usual) using client-side code.
 */

/*
 * Subscribe to history changes (adapted from History.js boilerplate) 
 */

var History = window.History; // Note: capital H refers to History.js!
// History.js can be disabled for HTML4 browsers, but this should not be the case for opentree!


// these variables should already be defined in the main HTML page
var findAllSynthesisRuns_url;

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
        var activeFilter = viewModel.listFilters.COLLECTIONS;
        var filterDefaults = listFilterDefaults.COLLECTIONS;
        var newState = { };
        var newQSValues = { };
        for (prop in activeFilter) {
            newState[prop] = ko.unwrap(activeFilter[prop]);
            // Hide default filter settings, for simpler URLs
            if (newState[prop] !== filterDefaults[prop]) {
                // Our list filters are smart about recognizing diacritics, so
                // we can just use their Latin-only counterparts in the URL.
                newQSValues[prop] = removeDiacritics( ko.unwrap(activeFilter[prop]) );
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

    /* Extract collection ID (if any) from URL, which could look like any of these patterns:
     *   /curator/collection/
     *   /curator/collection
     *   /curator/collection/jimallman/newtest-3   # in popup?
     *   /curator/collection/view/jimallman/newtest-3
     *   /curator/collection/edit/jimallman/newtest-3
     *   /curator/collection/edit/jimallman/newtest-3#foo
     *   /curator/collection/edit/jimallman/newtest-3/
     *   /curator/collection/edit/jimallman/newtest-3/#foo
     *   /curator/collection/edit/jimallman/newtest-3?match=micro
     *   /curator/collection/edit/jimallman/newtest-3?match=micro#foo
     *   /curator/collection/edit/jimallman/newtest-3/?match=micro
     *   /curator/collection/edit/jimallman/newtest-3/?match=micro#foo
     * N.B. So far, hashes don't seem to matter much here.
     */
    var trailingPath = window.location.pathname.split( RegExp('/collections?\\b/?') )[1];
    // remove typical leading path parts, if found
    var splitPath = trailingPath.split( RegExp('^view/|^edit/|^create/?') );
    if (splitPath.length > 1) {
        trailingPath = splitPath[1];
    }
    // strip final slash, if any
    trailingPath = trailingPath.split(/\/$/)[0];
    console.warn("trailing path (possible collection ID) is ["+ trailingPath +"]");

    // check for a valid collection ID, in the form '{user-id}/{collection-id}'
    var collectionID = null;
    if (trailingPath) {
        var trailingPathParts = trailingPath.split('/');
        if ((trailingPathParts.length === 2) && trailingPathParts[0] && trailingPathParts[1]) {
            // it looks like this is a proper collection ID
            collectionID = trailingPath;
            console.warn("Found this collection ID ["+ collectionID +"]");
        } else {
            console.warn("Trailing path, but it's not a proper collection ID! ["+ trailingPath +"]");
        }
    } else {
        ;
        console.warn("NO trailing path, therefore no inbound collection ID!");
    }
    if (collectionID) {
        // TODO: Open this collection (and hide any other, IF changes are saved)
        fetchAndShowCollection(collectionID);
    }

});

function loadCollectionList(option) {
    // Used for both initial list and refresh (to reflect adding/deleting collections).
    option = option ? option: 'INIT'; // or 'REFRESH'

    if (option === 'INIT') {
        showModalScreen("Loading tree collection list...", {SHOW_BUSY_BAR:true});
    }

    var effectiveFilters = {};
    if (option === 'REFRESH') {
        // preserve current filter values
        for (var fName in viewModel.listFilters.COLLECTIONS) {
            effectiveFilters[fName] = ko.unwrap(viewModel.listFilters.COLLECTIONS[fName]);
        }
    } else {
        // use default filter values
        effectiveFilters['match']  = "";
        effectiveFilters['order']  = "Most recently modified";
        effectiveFilters['filter'] = "All tree collections";
    }
    /*
    if (!userIsLoggedIn()) {
        // override filter if user is not logged in
        console.log('ANON BOUNCE to show all collections');
        effectiveFilters['filter'] = "All tree collections";
    }
    */

    $.ajax({
        type: 'GET',
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
            
            captureDefaultSortOrder(data);
            viewModel = data;

            // enable sorting and filtering for lists in the editor
            viewModel.listFilters = {
                // UI widgets bound to these variables will trigger the
                // computed display lists below..
                'COLLECTIONS': {
                    // use default (or preserved) filters, as determined above
                    'match': ko.observable(effectiveFilters['match']),
                    'order': ko.observable(effectiveFilters['order']),
                    'filter': ko.observable(effectiveFilters['filter'])
                }
            };

            // maintain a persistent array to preserve pagination (reset when computed)
            viewModel._filteredCollections = ko.observableArray( ).asPaged(20);
            viewModel.filteredCollections = ko.computed(function() {
                // filter raw tree list, returning a
                // new paged observableArray
                updateClearSearchWidget( '#collection-list-filter', viewModel.listFilters.COLLECTIONS.match );
                updateListFiltersWithHistory();

                var match = viewModel.listFilters.COLLECTIONS.match(),
                    matchWithDiacriticals = addDiacriticalVariants(match),
                    matchPattern = new RegExp( $.trim(matchWithDiacriticals), 'i' ),
                    wholeSlugMatchPattern = new RegExp( '^'+ $.trim(matchWithDiacriticals) +'$' );
                var order = viewModel.listFilters.COLLECTIONS.order();
                var filter = viewModel.listFilters.COLLECTIONS.filter();

                var showEmptyListWarningForAnonymousUser = false;
                switch (filter) {
                    case 'Collections I own':
                    case 'Collections I participate in':
                        if (!userIsLoggedIn()) {
                            showEmptyListWarningForAnonymousUser = true;
                        }
                }
                if (showEmptyListWarningForAnonymousUser) {
                    $('#empty-collection-list-warning').show();
                } else {
                    $('#empty-collection-list-warning').hide();
                }

                // map old array to new and return it
                var filteredList = ko.utils.arrayFilter( 
                    viewModel, 
                    function(collection) {
                        // match entered text against pub reference (author, title, journal name, DOI)
                        var id = $.trim(collection['id']);
                        var idParts = id.split('/');
                        var ownerSlug = idParts[0];
                        var titleSlug = (idParts.length === 2) ? idParts[1] : '';
                        var name = $.trim(collection['name']);
                        var description = $.trim(collection['description']);
                        // extract names and IDs of all stakeholders (incl. creator!)
                        if ($.isPlainObject(collection['creator'])) {
                            creator = $.trim(collection['creator'].name)
                                +'|'+ $.trim(collection['creator'].login);
                        } else {
                            creator = "";
                        }
                        if ($.isArray(collection['contributors'])) {
                            contributors = "";
                            $.each(collection['contributors'], function(i,c) {
                                contributors += ('|'+ $.trim(c.name) +'|'+ $.trim(c.login));
                            });
                        } else {
                            contributors = "";
                        }

                        if (!wholeSlugMatchPattern.test(id) && !wholeSlugMatchPattern.test(ownerSlug) && !wholeSlugMatchPattern.test(titleSlug) && !matchPattern.test(name) && !matchPattern.test(description) && !matchPattern.test(creator) && !matchPattern.test(contributors)) {
                            return false;
                        }
                        
                        // check for preset filters
                        switch (filter) {
                            case 'All tree collections':
                                // nothing to do here, all collections pass
                                break;

                            case 'Collections I own':
                                // show only matching collections
                                var userIsTheCreator = false;
                                if (('creator' in collection) && ('login' in collection.creator)) { 
                                    // compare to logged-in userid provide in the main page
                                    if (collection.creator.login === userLogin) {
                                        userIsTheCreator = true;
                                    }
                                }
                                return userIsTheCreator;

                            case 'Collections I participate in':
                                var userIsTheCreator = false;
                                var userIsAContributor = false;
                                if (('creator' in collection) && ('login' in collection.creator)) { 
                                    // compare to logged-in userid provide in the main page
                                    if (collection.creator.login === userLogin) {
                                        userIsTheCreator = true;
                                    }
                                }
                                if (('contributors' in collection) && $.isArray(collection.contributors)) { 
                                    // compare to logged-in userid provide in the main page
                                    $.each(collection.contributors, function(i, c) {
                                        if (c.login === userLogin) {
                                            userIsAContributor = true;
                                        }
                                    });
                                }
                                return (userIsTheCreator || userIsAContributor);

                            case 'Collections I follow':
                                // TODO: implement this once we have a favorites API
                                break;

                            default:
                                console.log("Unexpected filter for tree collection: ["+ filter +"]");
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
                            // coerce any missing/goofy dates to strings
                            var aMod = $.trim(a.lastModified.ISO_date);
                            var bMod = $.trim(b.lastModified.ISO_date);
                            if (aMod === bMod) {
                                return maintainRelativeListPositions(a, b);
                            }
                            return (aMod < bMod)? 1 : -1;
                        });
                        break;

                    case 'Most recently modified (reversed)':
                        filteredList.sort(function(a,b) { 
                            // coerce any missing/goofy dates to strings
                            var aMod = $.trim(a.lastModified.ISO_date);
                            var bMod = $.trim(b.lastModified.ISO_date);
                            if (aMod === bMod) {
                                return maintainRelativeListPositions(a, b);
                            }
                            return (aMod > bMod)? 1 : -1;
                        });
                        break;

                    case 'By owner/name':
                        filteredList.sort(function(a,b) { 
                            // first element is the ID with user-name/collection-name
                            // (coerce any missing/goofy values to strings)
                            var aName = $.trim(a.id);
                            var bName = $.trim(b.id);
                            if (aName === bName) {
                                // N.B. this should not occur
                                return maintainRelativeListPositions(a, b);
                            }
                            return (aName < bName) ? -1 : 1;
                        });
                        break;

                    case 'By owner/name (reversed)':
                        filteredList.sort(function(a,b) { 
                            // first element is the ID with user-name/collection-name
                            // (coerce any missing/goofy values to strings)
                            var aName = $.trim(a.id);
                            var bName = $.trim(b.id);
                            if (aName === bName) {
                                // N.B. this should not occur
                                return maintainRelativeListPositions(a, b);
                            }
                            return (aName > bName) ? -1 : 1;
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
            ko.cleanNode(listArea);
            // remove all but one list entry (else they multiply!)
            // N.B. that we also skip the first (header) row!
            $('#collection-list-container tr:gt(1)').remove();
            // remove extra menu items in list filters
            $('#collection-list-container .dropdown-menu').find('li:gt(0)').remove();
            // remove extra pagination elements below
            $('#collection-list-container .pagination li.repeating-page:gt(0)').remove();
            $('#collection-list-container .pagination li.repeating-spacer:gt(0)').remove();
            ko.applyBindings(viewModel, listArea);
            bindHelpPanels();

            if (option === 'REFRESH') {
                updateClearSearchWidget( '#collection-list-filter', viewModel.listFilters.COLLECTIONS.match );
            }
            if (option === 'INIT') {
                hideModalScreen();
            }
        }
    });
}
