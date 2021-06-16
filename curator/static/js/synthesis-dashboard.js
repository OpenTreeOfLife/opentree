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
        var activeFilter = viewModel.listFilters.SYNTHESIS_RUNS;
        var filterDefaults = listFilterDefaults.SYNTHESIS_RUNS;
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
        var activeFilter = viewModel.listFilters.SYNTHESIS_RUNS;
        var filterDefaults = listFilterDefaults.SYNTHESIS_RUNS;
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
    loadSynthesisRunList();
    
    // NOTE that our initial state is set in the main page template, so we 
    // can build it from incoming URL in web2py. Try to recapture this state,
    // ideally through manipulating history.
    if (History && History.enabled) {
        // "formalize" the current state with an object
        initialState.nudge = new Date().getTime();
        History.replaceState(initialState, window.document.title, window.location.href);
    }
});

function loadSynthesisRunList(option) {
    // Used for both initial list and refresh (to reflect adding/deleting collections).
    option = option ? option: 'INIT'; // or 'REFRESH'

    if (option === 'INIT') {
        showModalScreen("Loading tree collection list...", {SHOW_BUSY_BAR:true});
    }

    var effectiveFilters = {};
    if (option === 'REFRESH') {
        // preserve current filter values
        for (var fName in viewModel.listFilters.SYNTHESIS_RUNS) {
            effectiveFilters[fName] = ko.unwrap(viewModel.listFilters.SYNTHESIS_RUNS[fName]);
        }
    } else {
        // use default filter values
        effectiveFilters['match']  = "";
        effectiveFilters['order']  = "Most recently completed";
        effectiveFilters['filter'] = "All synthesis runs";
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
        //url: '../static/synth-queue.json',
        url: findAllSynthesisRuns_url,
        data: null,  // TODO: do we need { verbose: true } or other options here?
        success: function( data, textStatus, jqXHR ) {
            // this should be properly parsed JSON

            // report errors or malformed data, if any
            if (textStatus !== 'success') {
                showErrorMessage('Sorry, there was an error loading the list of tree collections.');
                return;
            }
            if (typeof data !== 'object'){
                // TEMP parse JSON from our testing file
                try {
                    data = JSON.parse(data);
                } catch(e) {
                    showErrorMessage('Sorry, there is a problem with the tree-collection data.');
                    return;
                }
            }
            if (!($.isArray(data))) {
                // convert from associative array (IDs are also stored in each run)
                try {
                    data = Object.keys(data || {}).map( key => data[key] );
                } catch(e) {
                    showErrorMessage('Sorry, there is a problem with the tree-collection data.');
                    return;
                }
            }
            captureDefaultSortOrder(data);
            viewModel = data;

            // enable sorting and filtering for lists in the editor
            viewModel.listFilters = {
                // UI widgets bound to these variables will trigger the
                // computed display lists below..
                'SYNTHESIS_RUNS': {
                    // use default (or preserved) filters, as determined above
                    'match': ko.observable(effectiveFilters['match']),
                    'order': ko.observable(effectiveFilters['order']),
                    'filter': ko.observable(effectiveFilters['filter'])
                }
            };

            // maintain a persistent array to preserve pagination (reset when computed)
            viewModel._filteredSynthesisRuns = ko.observableArray( ).asPaged(20);
            viewModel.filteredSynthesisRuns = ko.computed(function() {
                // filter raw tree list, returning a
                // new paged observableArray
                updateClearSearchWidget( '#synthesis-run-list-filter', viewModel.listFilters.SYNTHESIS_RUNS.match );
                updateListFiltersWithHistory();

                var match = viewModel.listFilters.SYNTHESIS_RUNS.match(),
                    matchWithDiacriticals = addDiacriticalVariants(match),
                    matchPattern = new RegExp( $.trim(matchWithDiacriticals), 'i' ),
                    wholeSlugMatchPattern = new RegExp( '^'+ $.trim(matchWithDiacriticals) +'$' );
                var order = viewModel.listFilters.SYNTHESIS_RUNS.order();
                var view = viewModel.listFilters.SYNTHESIS_RUNS.view();
                var filter = viewModel.listFilters.SYNTHESIS_RUNS.filter();

                var showEmptyListWarningForAnonymousUser = false;
                // TODO: Add these values if we offer a personalized view of synth runs
                // TODO: Restore the "login" hints to this message, as on collections dashboard.
                switch (filter) {
                    case 'Synthesis runs I initiated':
                    case 'Synthesis runs using my collections':
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
                    function(synthRun) {
                        // match entered text against pub reference (author, title, journal name, DOI)
                        var id = $.trim(synthRun['synth_id']);
                        var idParts = id.split('_');
                        var ownerSlug = idParts[1];  // from e.g. 'multi_snacktavish_woodpeckers_81461_tmp80eqeb6c'
                        var collectionIDs = $.trim(synthRun['collections']);  // comma-delimited list of collection ids
                        // TODO: extract description or comment text, if used
                        // TODO: extract display names and IDs of any stakeholders, if provided
                        if (!wholeSlugMatchPattern.test(id) && !wholeSlugMatchPattern.test(ownerSlug) && !matchPattern.test(collectionIDs)) {
                            return false;
                        }
                        
                        // check for preset filters
                        switch (filter) {
                            case 'All synthesis runs':
                                // nothing to do here, all collections pass
                                break;

                            case 'Failed runs only':
                                // show only matching synth runs
                                return (synthRun['status'] === 'FAILED');

                            default:
                                console.log("Unexpected filter for synthesis runs: ["+ filter +"]");
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
                    case 'Most recently completed':
                        filteredList.sort(function(a,b) { 
                            // coerce any missing/goofy dates to strings
                            /* if bare dates are provided...
                            if (a.date_ISO_8601 == b.date_ISO_8601) return 0;
                            if (a.date_ISO_8601 > b.date_ISO_8601) return -1;
                            return 1;
                            */
                            /* if more complex dates are provided...
                            var aMod = $.trim(a.lastModified.ISO_date);
                            var bMod = $.trim(b.lastModified.ISO_date);
                            if (aMod === bMod) {
                                return maintainRelativeListPositions(a, b);
                            }
                            return (aMod < bMod)? 1 : -1;
                            */
                            return 0;
                        });
                        break;

                    case 'Most recently completed (reversed)':
                        filteredList.sort(function(a,b) { 
                            /* see sorting possibilities above
                            // coerce any missing/goofy dates to strings
                            var aMod = $.trim(a.lastModified.ISO_date);
                            var bMod = $.trim(b.lastModified.ISO_date);
                            if (aMod === bMod) {
                                return maintainRelativeListPositions(a, b);
                            }
                            return (aMod > bMod)? 1 : -1;
                            */
                            return 0;
                        });
                        break;

                    default:
                        console.warn("Unexpected order for synth-run list: ["+ order +"]");
                        return null;

                }
                viewModel._filteredSynthesisRuns( filteredList );
                viewModel._filteredSynthesisRuns.goToPage(1);
                return viewModel._filteredSynthesisRuns;
            }); // END of filteredSynthesisRuns
                    
            // bind just to the main collection list (not the single-collection editor!)
            var listArea = $('#synthesis-run-list-container')[0];
            ko.cleanNode(listArea);
            // remove all but one list entry (else they multiply!)
            // N.B. that we also skip the first (header) row!
            $('#synthesis-run-list-container tr:gt(1)').remove();
            // remove extra menu items in list filters
            $('#synthesis-run-list-container .dropdown-menu').find('li:gt(0)').remove();
            // remove extra pagination elements below
            $('#synthesis-run-list-container .pagination li.repeating-page:gt(0)').remove();
            $('#synthesis-run-list-container .pagination li.repeating-spacer:gt(0)').remove();
            ko.applyBindings(viewModel, listArea);
            bindHelpPanels();

            if (option === 'REFRESH') {
                updateClearSearchWidget( '#synthesis-run-list-filter', viewModel.listFilters.SYNTHESIS_RUNS.match );
            }
            if (option === 'INIT') {
                hideModalScreen();
            }
        }
    });
}
