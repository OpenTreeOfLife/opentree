/*    
@licstart  The following is the entire license notice for the JavaScript code in this page. 

    Copyright (c) 2013, Jim Allman

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
 * Client-side behavior for the Open Tree curation home page and personalized dashboard
 *
 * This uses the Open Tree API to fetch and store studies and trees remotely. In
 * this initial version, we'll load metadata for all studies in the system,
 * then use client-side code to filter and sort them.
 */

/*
 * Subscribe to history changes (adapted from History.js boilerplate) 
 */

var History = window.History; // Note: capital H refers to History.js!
// History.js can be disabled for HTML4 browsers, but this should not be the case for opentree!


// these variables should already be defined in the main HTML page
var findAllStudies_url;
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
        var activeFilter = viewModel.listFilters.STUDIES;
        var filterDefaults = listFilterDefaults.STUDIES;
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
        var activeFilter = viewModel.listFilters.STUDIES;
        var filterDefaults = listFilterDefaults.STUDIES;
        var newState = { };
        var newQSValues = { };
        for (prop in activeFilter) {
            newState[prop] = ko.unwrap(activeFilter[prop]);
            // Hide default filter settings, for simpler URLs
            if (newState[prop] !== filterDefaults[prop]) {
                // make any odd characters safe for the query string!
                // (surprisingly, History doesn't handle Unicode well here)
                /* N.B. this gets double-encoded; hilarity ensues!
                newQSValues[prop] = encodeURIComponent( ko.unwrap(activeFilter[prop]) );
                */
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
    loadStudyList();
    
    // NOTE that our initial state is set in the main page template, so we 
    // can build it from incoming URL in web2py. Try to recapture this state,
    // ideally through manipulating history.
    if (History && History.enabled) {
        // "formalize" the current state with an object
        initialState.nudge = new Date().getTime();
        History.replaceState(initialState, window.document.title, window.location.href);
    }
});

function loadStudyList() {
    // use oti (study indexing service) to get the complete list
    showModalScreen("Loading study list...", {SHOW_BUSY_BAR:true});

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
            
            var matchedStudies = data['matched_studies'];
            // populate and show study total
            $('#study-count').text( matchedStudies.length );
            // TODO: $('#tree-count').text( ???? );
            $('#study-count-holder').show();

            captureDefaultSortOrder(matchedStudies);
            getDuplicateStudiesByDOI(matchedStudies);

            viewModel = matchedStudies; /// ko.mapping.fromJS( fakeStudyList );  // ..., mappingOptions);

            // enable sorting and filtering for lists in the editor
            viewModel.listFilters = {
                // UI widgets bound to these variables will trigger the
                // computed display lists below..
                'STUDIES': {
                    // TODO: add 'pagesize'?
                    'match': ko.observable(""),
                    'workflow': ko.observable("Any workflow state"),
                    'order': ko.observable("Newest publication first"),
                    'view': ko.observable("Compact view (hide details)"),
                    'page': ko.observable(1),
                }
            };
            
            // maintain a persistent array to preserve pagination (reset when computed)
            viewModel._filteredStudies = ko.observableArray( ).asPaged(20);
            viewModel.filteredStudies = ko.computed(function() {
                // filter raw tree list, returning a
                // new paged observableArray
                updateClearSearchWidget( '#study-list-filter', viewModel.listFilters.STUDIES.match );
                updateListFiltersWithHistory();

                var match = viewModel.listFilters.STUDIES.match(),
                    matchWithDiacriticals = addDiacriticalVariants(match),
                    matchPattern = new RegExp( $.trim(matchWithDiacriticals), 'i' ),
                    wholeWordMatchPattern = new RegExp( '\\b'+ $.trim(matchWithDiacriticals) +'\\b', 'i' );
                console.log('Search text with diacritical variants:\n'+ matchPattern);
                var workflow = viewModel.listFilters.STUDIES.workflow();
                var order = viewModel.listFilters.STUDIES.order();
                var view = viewModel.listFilters.STUDIES.view();
                var page = viewModel.listFilters.STUDIES.page();

                // map old array to new and return it
                var filteredList = ko.utils.arrayFilter( 
                    viewModel, 
                    function(study) {
                        // match entered text against pub reference (author, title, journal name, DOI)
                        var studyID = study['ot:studyId'];
                        var pubReference = study['ot:studyPublicationReference'];
                        var pubURL = study['ot:studyPublication'];
                        var pubYear = study['ot:studyYear'];
                        // NB playing it safe here, since JS regex isn't guaranteed to match against array values
                        var tags = $.isArray(study['ot:tag']) ? study['ot:tag'].join('|') : study['ot:tag'];
                        var curator = $.isArray(study['ot:curatorName']) ? study['ot:curatorName'].join('|') : study['ot:curatorName'];
                        var clade = ('ot:focalCladeOTTTaxonName' in study && 
                                     ($.trim(study['ot:focalCladeOTTTaxonName']) !== "")) ?
                                        study['ot:focalCladeOTTTaxonName'] :  // use mapped name if found
                                        study['ot:focalClade']; // fall back to numeric ID (should be very rare)
                        if (!wholeWordMatchPattern.test(studyID) && !matchPattern.test(pubReference) && !matchPattern.test(pubURL) && !matchPattern.test(pubYear) && !matchPattern.test(curator) && !matchPattern.test(tags) && !matchPattern.test(clade)) {
                            return false;
                        }
                        // check for filtered workflow state
                        switch (workflow) {
                            case 'Any workflow state':
                                // nothing to do here, all studies pass
                                break;

                            case 'Draft study':
                            case 'Submitted for synthesis':
                            case 'Under revision':
                            case 'Included in synthetic tree':
                                // show only matching studies
                                if (study.workflowState !== workflow) { 
                                    return false; // stop looping on trees
                                }
                                break;

                            default:
                                console.log("Unexpected workflow for study list: ["+ workflow +"]");
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
                    case 'Newest publication first':
                        filteredList.sort(function(a,b) { 
                            //if (checkForInterestingStudies(a,b)) { debugger; }
                            var aYear = isNaN(a['ot:studyYear']) ? Number.NEGATIVE_INFINITY : Number(a['ot:studyYear']);
                            var bYear = isNaN(b['ot:studyYear']) ? Number.NEGATIVE_INFINITY : Number(b['ot:studyYear']);
                            if (aYear === bYear) {
                                return maintainRelativeListPositions(a, b);
                            };
                            return (aYear > bYear)? -1 : 1;
                        });
                        break;

                    case 'Oldest publication first':
                        filteredList.sort(function(a,b) {
                            var aYear = isNaN(a['ot:studyYear']) ? Number.NEGATIVE_INFINITY : Number(a['ot:studyYear']);
                            var bYear = isNaN(b['ot:studyYear']) ? Number.NEGATIVE_INFINITY : Number(b['ot:studyYear']);
                            if (aYear === bYear) {
                                return maintainRelativeListPositions(a, b);
                            }
                            return (aYear > bYear)? 1 : -1;
                        });
                        break;

                    case 'Sort by primary author':
                        filteredList.sort(function(a,b) {
                            var aRef = $.trim(a['ot:studyPublicationReference']);
                            var bRef = $.trim(b['ot:studyPublicationReference']);
                            if (aRef.localeCompare) {
                                var r = aRef.localeCompare(bRef);
                                if (r === 0) {
                                    r = maintainRelativeListPositions(a, b);
                                } 
                                return r;
                            }
                            // fallback do dumb alpha-sort on older browsers
                            if (aRef === bRef) {
                                return maintainRelativeListPositions(a, b);
                            };
                            return (aRef > bRef) ? 1 : -1;
                        });
                        break;

                    case 'Sort by primary author (reversed)':
                        filteredList.sort(function(a,b) {
                            var bRef = $.trim(b['ot:studyPublicationReference']);
                            var aRef = $.trim(a['ot:studyPublicationReference']);
                            if (bRef.localeCompare) {
                                var r = bRef.localeCompare(aRef);
                                if (r === 0) {
                                    r = maintainRelativeListPositions(a, b);
                                } 
                                return r;
                            }
                            // fallback do dumb alpha-sort on older browsers
                            if (aRef === bRef) {
                                return maintainRelativeListPositions(a, b);
                            };
                            return (aRef < bRef) ? 1 : -1;
                        });
                        break;

                    case 'Workflow state':
                        var displayOrder = {
                            'Draft study': 1,
                            'Submitted for synthesis': 2,
                            'Under revision': 3,
                            'Included in synthetic tree': 4
                        };
                        filteredList.sort(function(a,b) { 
                            var aDisplayOrder = displayOrder[ a.workflowState ];
                            var bDisplayOrder = displayOrder[ b.workflowState ];
                            if (aDisplayOrder === bDisplayOrder) {
                                return maintainRelativeListPositions(a, b);
                            };
                            return (aDisplayOrder < bDisplayOrder) ? -1 : 1;
                        });
                        break;

                    case 'Completeness':
                        filteredList.sort(function(a,b) { 
                            if (a.completeness === b.completeness) {
                                return maintainRelativeListPositions(a, b);
                            };
                            return (a.completeness < b.completeness) ? -1 : 1;
                        });
                        break;

                    default:
                        console.log("Unexpected order for OTU list: ["+ order +"]");
                        return false;

                }
                viewModel._filteredStudies( filteredList );
                viewModel._filteredStudies.goToPage( Number(page) );
                return viewModel._filteredStudies;
            }); // END of filteredStudies
                    
            var listHolder = $('#study-list-container')[0];
            ko.applyBindings(viewModel, listHolder);

            hideModalScreen();
        }
    });
}

/* gather any duplicate studies (with same DOI) */
var studiesByDOI = {};
function getDuplicateStudiesByDOI(studyList) {
    studiesByDOI = {};
    $.each( studyList, function(i, study) {
        var studyID = study['ot:studyId'];
        var studyDOI = ('ot:studyPublication' in study) ? study['ot:studyPublication'] : "";
        if (studyDOI !== "") {
            if ('studyDOI' in studiesByDOI) {
                studiesByDOI[ studyDOI ].push( studyID );
            } else {
                studiesByDOI[ studyDOI ] = [ studyID ];
            }
        }
    });
    // remove all but the entries with actual dupes
    for (var doi in studiesByDOI) {
        if (studiesByDOI[ doi ].length < 2) {
            delete studiesByDOI[doi];
        }
    }
}
function getDuplicateStudyMarker(study) {
    var studyDOI = ('ot:studyPublication' in study) ? study['ot:studyPublication'] : "";
    if (studyDOI !== "") {
        var dupes = studiesByDOI[ studyDOI ];
        if (dupes && dupes.length > 1) {
            return '&nbsp; <a href="#" onclick="filterByDOI(\''+ studyDOI +'\'); return false;" style="font-weight: bold; color: #b94a48;" title="CLick to see all studies with this DOI">[DUPLICATE STUDY]</a'+'>';
        }
    }
    return '';
}

function getViewOrEditLinks(study) {
    var html = "";

    /* Send authorized users straight to Edit page?
    var viewOrEditURL = (viewOrEdit === 'EDIT') ?
        '/curator/study/edit/'+ study['ot:studyId'] : 
        '/curator/study/view/'+ study['ot:studyId'];
    */
    var viewOrEditURL = '/curator/study/view/'+ study['ot:studyId'];

    var fullRef = study['ot:studyPublicationReference'];
    if (fullRef) {
        // hide/show full publication reference
        html += '<a class="compact-study-ref" href="'+ viewOrEditURL +'">'+ fullToCompactReference(fullRef) +'</a>';
        html += '&nbsp; &nbsp; <a class="full-ref-toggle" href="#" onclick="toggleStudyDetails(this); return false;">[show details]</a>';
    } else {
        // nothing to toggle
        html += '<a href="'+ viewOrEditURL +'">(Untitled study)</a>';
    }
    html += getDuplicateStudyMarker(study);

    return html;
}
function getCuratorLink(study) {
    var linkList = [];
    var nameList = study['ot:curatorName'];
    if (! $.isArray(nameList)) {
        // wrap single curator name in the expected list
        nameList = [nameList];
    }
    $.each(nameList , function(i, name) {
        linkList.push('<a href="#" onclick="filterByCurator(\''+ name +'\'); return false;"'+'>'+ name +'</a'+'>');
    });
    return linkList.join(', ');
}
function getFocalCladeLink(study) {
    var ottIdNotFound = false;
    var ottID;
    if ('ot:focalClade' in study) {
        ottID = study['ot:focalClade'];
        if ($.trim(ottID) === "") {
            ottIdNotFound = true;
        }
    } else {
        ottIdNotFound = true;
    }

    var cladeNameNotFound = false;
    var cladeName;
    if ('ot:focalCladeOTTTaxonName' in study) {
        cladeName = study['ot:focalCladeOTTTaxonName'];
        if ($.trim(cladeName) === "") {
            cladeNameNotFound = true;
        }
    } else {
        cladeNameNotFound = true;
    }
    if (cladeNameNotFound) {
        // use the best available placeholder
        if (ottIdNotFound) {
            cladeName = '&mdash;';
        } else {
            cladeName = ottID;
        }
    }

    if (ottIdNotFound) {
        return '<span style="color: #ccc;">'+ cladeName +'</span>';
    }

    return '<a href="#" onclick="filterByClade(\''+ cladeName +'\'); return false;"'+'>'+ cladeName +'</a'+'>';
}

var urlPattern = new RegExp('http(s?)://\\S+');
function getPubLink(study) {
    var urlNotFound = false;
    var pubURL;
    if ('ot:studyPublication' in study) {
        pubURL = study['ot:studyPublication'];
        if ($.trim(pubURL) === "") {
            urlNotFound = true;
        }
    } else {
        urlNotFound = true;
    }
    if (urlNotFound) {
        return "";
    }
    if (urlPattern.test(pubURL) === true) {
        // It's a proper URL, wrap it in a hyperlink; but first,
        // update to match latest CrossRef guidelines
        pubURL = latestCrossRefURL(pubURL);
        return '<a href="'+ pubURL +'" target="_blank"'+'>'+ pubURL +'</a'+'>';
    }
    // It's not a proper URL! Return the bare value.
    return pubURL;
}
/*
function getSuggestedActions(study) {
    return '<a href="#"'+'>'+ study.nextActions()[0] +'</a'+'>';
}
*/

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
function toggleAllStudyDetails( hidingOrShowing ) {
    // Show (or hide) details for all visible studies
    var $studyList = $('#study-list-container');
    var $singleStudyToggles = $studyList.find('a.full-ref-toggle');
    // IGNORE latent block with no toggle
    //var $studyDetailBlocks = $studyList.find('div.full-study-ref');
    var $studyDetailBlocks = $singleStudyToggles.closest('tr').next('tr').find('div.full-study-ref');
    if ($.inArray(hidingOrShowing, ['SHOWING', 'HIDING']) === -1) {
        // Operation not specified! Follow the current state of the detail blocks.
        var $visibleStudyDetailBlocks = $studyDetailBlocks.filter(':visible');
        if ($visibleStudyDetailBlocks.length === $singleStudyToggles.length) {
            // all blocks found and currently visible, so we should hide all
            hidingOrShowing = 'HIDING';
        } else {
            // show all blocks by default
            hidingOrShowing = 'SHOWING';
        }
    }
    $singleStudyToggles.each(function(i, toggle) {
        var $toggle = $(toggle);
        var $studyRow = $toggle.closest('tr');
        var $studyDetailsRow = $studyRow.next('tr:has(.full-study-ref)');
        if ($studyDetailsRow.length > 0) {
            // there should always be a corresponding block
            var detailsBlock = $studyDetailBlocks[i];
            if ($(detailsBlock).is(':visible')) {
                if (hidingOrShowing==='HIDING') {
                    toggleStudyDetails($toggle);
                }
            } else {  // block is hidden
                if (hidingOrShowing==='SHOWING') {
                    toggleStudyDetails($toggle);
                }
            }
        }
    });
}

function filterByCurator( curatorID ) {
    /* add their userid to the filter field
    var oldFilterText = viewModel.listFilters.STUDIES.match();
    if (oldFilterText.indexOf( curatorID ) === -1) {
        var newFilterText = oldFilterText +' '+ curatorID;
        viewModel.listFilters.STUDIES.match( newFilterText );
    }
    */
    // replace the filter text with this curator's userid
    viewModel.listFilters.STUDIES.match( curatorID );
}
function filterByClade( cladeName ) {
    // replace the filter text with this clade name
    viewModel.listFilters.STUDIES.match( cladeName );
}
function filterByTag( tag ) {
    // replace the filter text with this clade name
    viewModel.listFilters.STUDIES.match( tag );
}
function filterByDOI( doi ) {
    // replace the filter text with this clade name
    viewModel.listFilters.STUDIES.match( doi );
}
