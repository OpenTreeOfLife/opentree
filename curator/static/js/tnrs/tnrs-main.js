/*
@licstart  The following is the entire license notice for the JavaScript code in this page.

    Copyright (c) 2019, Jim Allman

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
 * Client-side behavior for the Open Tree name-resolution UI
 *
 * This uses the Open Tree API to resolve large sets of labels to taxonomic names.
 */
var jszip = require('jszip'),
    FileSaver = require('file-saver'),
    Blob = require('blob-polyfill'),
    assert = require('assert');

// these variables should already be defined in the main HTML page
var initialState;
var doTNRSForAutocomplete_url;
var doTNRSForMappingOTUs_url;
var getContextForNames_url;
var render_markdown_url;

/* Return the data model for a new illustration (our JSON representation) */
var getNewNamesetModel = function(options) {
    if (!options) options = {};
    var obj = {
        'metadata': {
            'name': "Untitled nameset",
            'description': "",
            'authors': [ ],   // assign immediately to this user?
            'date_created': new Date().toISOString()
        },
        'mappingHints': {
            'searchContext': "All Life",
            'useFuzzyMatching': false,
            // Replacment regexps
        },
        'names': [
            // original name, manually edited, current mapped name
        ]
    };
    /* TODO: Apply optional modifications?
    if (options.BLAH) {
        obj.metadata.FOO = 'BAR';
    }
    */
    return obj;
};

// create some isolated observables (as global JS vars!) used to support our mapping UI
var autoMappingInProgress = ko.observable(false);
var currentlyMappingNames = ko.observableArray([]); // drives spinners, etc.
var failedMappingNames = ko.observableArray([]); 
    // ignore these until we have new mapping hints
var proposedNameMappings = ko.observable({}); 
    // stored any labels proposed by server, keyed by name id [TODO?]
var bogusEditedLabelCounter = ko.observable(1);  
    // this just nudges the label-editing UI to refresh!

function addSubstitution( clicked ) {
    var subst = {};

    if ($(clicked).is('select')) {
        var chosenSub = $(clicked).val();
        if (chosenSub === '') {
            // do nothing, we're still at the prompt
            return false;
        }
        // add the chosen subsitution
        var parts = chosenSub.split(' =:= ');
        subst.old.$ = parts[0] || '';
        subst.new.$ = parts[1] || '';
        subst['@valid'] = true;
        subst['@active'] = true;
        // reset the SELECT widget to its prompt
        $(clicked).val('');
    }
    viewModel.mappingHints.substitutions.push(subst);
    clearFailedNameList();
    nudgeTickler('NAME_MAPPING_HINTS');
}
function removeSubstitution( data ) {
    var subList = viewModel.mappingHints.substitutions();
    removeFromArray( data, subList );
    if (subList.length === 0) {
        // add an inactive substitution with prompts
        addSubstitution();
    } else {
        clearFailedNameList();
        nudgeTickler('NAME_MAPPING_HINTS');
    }
}
function updateMappingHints( data ) {
    // after-effects of changes to search context or any substitution
    clearFailedNameList();
    nudgeTickler('NAME_MAPPING_HINTS');
    return true;
}

function getAttrsForMappingOption( optionData, numOptions ) {
    var attrs = {
        'title': parseInt(optionData.originalMatch.score * 100) +"% match of original label",
        'class': "badge ",
        'style': ("opacity: "+ matchScoreToOpacity(optionData.originalMatch.score) +";")
    }
    // for now, use standard colors that will still pop for color-blind users
    if (optionData.originalMatch.is_synonym) {
        attrs.title = ('Matched on synonym '+ optionData.originalMatch.matched_name);
        attrs.class += ' badge-info';
    } else if ((numOptions > 1) && (optionData.originalMatch.matched_name !== optionData.originalMatch.taxon.unique_name)) {
        // Let's assume a single result is the right answer
        attrs.title = ('Taxon-name homonym');
        attrs.class += ' badge-warning';
    } else {
        // keep default label with matching score
        attrs.class += ' badge-success';
    }
    // each should also link to the taxonomy browser
    attrs.href = getTaxobrowserURL(optionData['ottId']);
    attrs.target = '_blank';
    attrs.title += ' (click for more information)'
    return attrs;
}
function matchScoreToOpacity(score) {
    /* Remap scores (generally from 0.75 to 1.0, but 0.1 is possible!) to be more visible
     * This is best accomplished by remapping to a curve, e.g.
     *   OPACITY = SCORE^2 + 0.15
     *   OPACITY = 0.8 * SCORE^2 + 0.2
     *   OPACITY = 0.8 * SCORE + 0.2
     * The effect we want is full opacity (1.0) for a 1.0 score, fading rapidly
     * for the common (higher) scores, with a floor of ~0.2 opacity (enough to
     * show color and maintain legibility).
     */
    return (0.8 * score) + 0.2;
}

// support for a color-coded "speedometer" for server-side mapping (some as JS globals)
var recentMappingTimes = [ ];
recentMappingSpeedLabel = ko.observable(""); // seconds per name, based on rolling average
recentMappingSpeedPercent = ko.observable(0); // affects color of bar, etc
recentMappingSpeedBarClass = ko.observable('progress progress-info');

// this should be cleared whenever something changes in mapping hints
function clearFailedNameList() {
    failedMappingNames.removeAll();
    // nudge to update OTU list immediately
    bogusEditedLabelCounter( bogusEditedLabelCounter() + 1);
    nudgeAutoMapping();
}
function nudgeAutoMapping() {
    // restart auto-mapping, if enabled
    if (autoMappingInProgress()) {
        if (currentlyMappingNames.length === 0) {
            // looks like we ran out of steam.. try again!
            requestTaxonMapping();
        }
    }
}

// Load a nameset from JS/JSON data (usu. called by convenience functions below)
function loadNamesetData( data ) {
    /* Parse this data as `nameset` (a simple JS object), then convert this
     * into our primary view model for KnockoutJS  (by convention, it's usually
     * named 'viewModel').
     */
    var nameset;
    switch(typeof data) { 
        case 'object':
            if (!data) {
                // it's null, or undefined? or something dumb
                nameset = getNewNamesetModel();
            } else {
                nameset = data;
            }
            break;
        case 'undefined':
            nameset = getNewNamesetModel();
            break;
        case 'string':
            nameset = JSON.parse(data);
            break;
        default: 
            console.error("Unexpected type for nameset data: "+ (typeof data));
            nameset = null;
    }
    // name and export the new viewmodel
    exports.viewModel = viewModel = ko.mapping.fromJS(nameset);

    // cleanup of incoming data
    removeDuplicateNames(viewModel);
    // TODO: take initial stab at setting search context for TNRS?
    // TODO: inferSearchContextFromAvailableOTUs();

    /* 
     * Add observable properties to the model to support the UI. 
     */

    // Add a series of observable "ticklers" to signal changes in
    // the model without observable Nexson properties. Each is an
    // integer that creeps up by 1 to signal a change somewhere in
    // related Nexson elements.
    // TODO: Is this a tickler? ratchet? whisker?
    viewModel.ticklers = {
        'GENERAL_METADATA': ko.observable(1),
        'SUPPORTING_FILES': ko.observable(1),
        'NAME_MAPPING_HINTS': ko.observable(1),
        'VISIBLE_NAME_MAPPINGS': ko.observable(1),
        // TODO: add more as needed...
        'NAMESET_HAS_CHANGED': ko.observable(1)
    }

    // support fast lookup of elements by ID, for largest trees
    viewModel.fastLookups = {
        'NAMES_BY_ID': null
    };

    // enable sorting and filtering lists in the editor
    var listFilterDefaults = {
        // track these defaults so we can reset them in history
        'NAMES': {
            // TODO: add 'pagesize'?
            'match': "",
            'order': "Unmapped names first"
        }
    };
    viewModel.filterDelay = 250; // ms to wait for changes before updating filter
    viewModel.listFilters = {
        // UI widgets bound to these variables will trigger the
        // computed display lists below..
        'NAMES': {
            // TODO: add 'pagesize'?
            'match': ko.observable( listFilterDefaults.NAMES.match ),
            'order': ko.observable( listFilterDefaults.NAMES.order )
        }
    };
 
    // maintain a persistent array to preserve pagination (reset when computed)
    viewModel._filteredNames = ko.observableArray( ).asPaged(500);
    viewModel.filteredNames = ko.computed(function() {
        // filter raw name list, then sort, returning a
        // new (OR MODIFIED??) paged observableArray
        ///var ticklers = [ viewModel.ticklers.OTU_MAPPING_HINTS() ];

        updateClearSearchWidget( '#otu-list-filter' );
        //updateListFiltersWithHistory();

        var match = viewModel.listFilters.NAMES.match(),
            matchWithDiacriticals = addDiacriticalVariants(match),
            matchPattern = new RegExp( $.trim(matchWithDiacriticals), 'i' );
        var order = viewModel.listFilters.NAMES.order();

        // capture current positions, to avoid unnecessary "jumping" in the list
        captureDefaultSortOrder(viewModel.names);

        /* TODO: pool all name IDs into a common object?
        var chosenOTUIDs = {};
        console.warn(chosenOTUIDs);
        if (chosenOTUIDs.length > 0) {
            console.warn("Here's the first of chosenOTUIDs:");
            console.warn(chosenOTUIDs[0]);
        } else {
            console.warn("chosenOTUIDs is an empty list!");
        }
        */

        // map old array to new and return it
        var filteredList = ko.utils.arrayFilter(
            viewModel.names,
            function(name) {
                // match entered text against old or new label
                var originalLabel = name['^ot:originalLabel'];
                var mappedLabel = name['^ot:ottTaxonName'];
                if (!matchPattern.test(originalLabel) && !matchPattern.test(mappedLabel)) {
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
            case 'Unmapped names first':
                filteredList.sort(function(a,b) {
                    // N.B. This works even if there's no such property.
                    //if (checkForInterestingStudies(a,b)) { debugger; }
                    var aMapStatus = $.trim(a['^ot:ottTaxonName']) !== '';
                    var bMapStatus = $.trim(b['^ot:ottTaxonName']) !== '';
                    if (aMapStatus === bMapStatus) {
                        if (!aMapStatus) { // both names are currently un-mapped
                            // Force failed mappings to the bottom of the list
                            var aFailedMapping = (failedMappingNames.indexOf(a['@id']) !== -1);
                            var bFailedMapping = (failedMappingNames.indexOf(b['@id']) !== -1);
                            if (aFailedMapping === bFailedMapping) {
                                // Try to retain their prior precedence in
                                // the list (avoid items jumping around)
                                /*return (a.priorPosition < b.priorPosition) ? -1:1;
                                 * Should this supercede our typical use of `maintainRelativeListPositions`?
                                 */
                                return maintainRelativeListPositions(a, b);
                            }
                            if (aFailedMapping) {
                                return 1;   // force a (failed) below b
                            }
                            return -1;   // force b (failed) below a
                        } else {
                            //return (a.priorPosition < b.priorPosition) ? -1:1;
                            return maintainRelativeListPositions(a, b);
                        }
                    }
                    if (aMapStatus) return 1;
                    if (bMapStatus) return -1;
                });
                break;

            case 'Mapped names first':
                filteredList.sort(function(a,b) {
                    var aMapStatus = $.trim(a['^ot:ottTaxonName']) !== '';
                    var bMapStatus = $.trim(b['^ot:ottTaxonName']) !== '';
                    if (aMapStatus === bMapStatus) {
                        return maintainRelativeListPositions(a, b);
                    }
                    if (aMapStatus) return -1;
                    return 1;
                });
                break;

            case 'Original label (A-Z)':
                filteredList.sort(function(a,b) {
                    var aOriginal = $.trim(a['^ot:originalLabel']);
                    var bOriginal = $.trim(b['^ot:originalLabel']);
                    if (aOriginal === bOriginal) {
                        return maintainRelativeListPositions(a, b);
                    }
                    if (aOriginal < bOriginal) return -1;
                    return 1;
                });
                break;

            case 'Original label (Z-A)':
                filteredList.sort(function(a,b) {
                    var aOriginal = $.trim(a['^ot:originalLabel']);
                    var bOriginal = $.trim(b['^ot:originalLabel']);
                    if (aOriginal === bOriginal) {
                        return maintainRelativeListPositions(a, b);
                    }
                    if (aOriginal > bOriginal) return -1;
                    return 1;
                });
                break;

            default:
                console.log("Unexpected order for name list: ["+ order +"]");
                return false;

        }

        // Un-select any otu that's now out of view (ie, outside of the first page of results)
        var itemsInView = filteredList.slice(0, viewModel._filteredNames.pageSize);
        var allNames = viewModel.names();
        allNames.map(function(name) {
            if (name['selectedForAction']) {
                var isOutOfView = ($.inArray(name, itemsInView) === -1);
                if (isOutOfView) {
                    name['selectedForAction'] = false;
                }
            }
        });

        // clear any stale last-selected OTU (it's likely moved)
        lastClickedTogglePosition = null;

        viewModel._filteredNames( filteredList );
        viewModel._filteredNames.goToPage(1);
        return viewModel._filteredNames;
    }).extend({ throttle: viewModel.filterDelay }); // END of filteredNames


    // Keep a safe copy of our UI markup, for re-use as a Knockout template (see below)
    var $stashedEditArea = null;

    // Stash the pristine markup before binding our UI for the first time
    if ($stashedEditArea === null) {
        $stashedEditArea = $('#Name-Mapping').clone();
    } else {
        // Replace with pristine markup to avoid weird results when loading a new nameset
        $('#Name-Mapping').contents().replaceWith(
            $stashedEditArea.clone().contents()
        );
    }

    // (re)bind to editor UI with Knockout
    var $boundElements = $('#Name-Mapping'); // add other elements?
    $.each($boundElements, function(i, el) {
        ko.cleanNode(el);
        ko.applyBindings(viewModel,el);
    });
}

function removeDuplicateNames( viewmodel ) {
    // call this when loading a nameset *or* adding names!
    console.warn("I don't know how to remove duplicate names yet!");
}

$(document).ready(function() {
    // Always start with an empty set, binding it to the UI
    loadNamesetData( null );

    /* typical setup and binding of update logic
    // set initial state for all widgets
    updateMyStuff();

    // any change in widgets should (potentially) update all
    $('input, textarea, select').unbind('change').change(updateMyStuff);
    $('input, textarea').unbind('keyup').keyup(updateMyStuff);

    // any change to the TreeBASE ID or DOI fields should also disable Continue
    $('input[name=treebase-id]').unbind('change keyup').bind('change keyup', function() {
        duplicateStudiesBasedOnTreeBASEUrl = null;
        updateMyStuff();
    });
    $('input[name=publication-DOI]').unbind('change keyup').bind('change keyup', function() {
        duplicateStudiesBasedOnDOI = null;
        updateMyStuff();
    });
    // normalize to URL and test for duplicates after significant changes in the DOI field
    $('input[name=treebase-id]').unbind('blur').blur(validateAndTestTreeBaseID);
    $('input[name=publication-DOI]').unbind('blur').blur(validateAndTestDOI);
    */
    console.log("READY!");
});

// export some members as a simple API
var api = [
    'autoMappingInProgress'
];
$.each(api, function(i, methodName) {
    // populate the default 'module.exports' object
    exports[ methodName ] = eval( methodName );
});
