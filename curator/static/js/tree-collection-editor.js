/*
@licstart  The following is the entire license notice for the JavaScript code in this page.

    Copyright (c) 2020, Jim Allman
    Copyright (c) 2013, Mark Holder

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
 * Subscribe to history changes (adapted from History.js boilerplate)
 */

var History = window.History; // Note: capital H refers to History.js!
// History.js can be disabled for HTML4 browsers, but this should not be the case for opentree!


/*
 * More client-side behavior for the Open Tree curation UI
 *
 * This uses the Open Tree API to fetch and store tree collections remotely.
 */

// these variables should already be defined in the main HTML page
var collectionID;
var latestSynthesisSHA;      // the SHA for this collection (if any) that was last used in synthesis
var latestSynthesisTreeIDs;  // ids of any trees in this collection included in the latest synthesis
var API_load_collection_GET_url;
var API_update_collection_PUT_url;
var API_remove_collection_DELETE_url;
var viewOrEdit;
var getTreesQueuedForSynthesis_url;

// working space for parsed JSON objects (incl. sub-objects)
var viewModel;

/* Use history plugin to track moves from tab to tab, single-tree popup, others? */

var listFilterDefaults; // defined in main page, for a clean initial state

if ( History && History.enabled ) {

    var handleChangingState = function() {
        if (!viewModel) {
            // try again soon (waiting for a collection to load)
            setTimeout( handleChangingState, 50 );
            return;
        }
        var State = History.getState(); // Note: We are using History.getState() instead of event.state
        ///History.log(State.data, State.title, State.url);

        // TODO: hide/show elements as needed
        // Extract our state vars from State.url (not from State.data) for equal
        // treatment of initial URLs.
        var currentTab = State.data.tab;
        var currentTree = State.data.tree;
        var highlightNodeID = State.data.node;
        var conflictReferenceTree = State.data.conflict;
        var activeFilter = null;
        var filterDefaults = null;

        if (currentTab) {
            goToTab( currentTab );
            switch(slugify(currentTab)) {
                case 'home':
                    activeFilter = viewModel.listFilters.TREES;
                    filterDefaults = listFilterDefaults.TREES;
                    break;

                case 'files':
                    activeFilter = viewModel.listFilters.FILES;
                    filterDefaults = listFilterDefaults.FILES;
                    break;

                case 'otu-mapping':
                    activeFilter = viewModel.listFilters.OTUS;
                    filterDefaults = listFilterDefaults.OTUS;
                    break;
            }
            if (activeFilter) {
                // assert any saved filter values
                for (var prop in activeFilter) {
                    if (prop in State.data) {
                        activeFilter[prop]( State.data[prop] );
                    } else {
                        // (re)set to its default value
                        activeFilter[prop]( filterDefaults[prop] );
                    }
                }
            }
        }
        if (currentTree) {
            var tree = getTreeByID(currentTree);
            if (tree) {
                // show inbound node, if provided
                // N.B. this is not reflected in History state!
                if (highlightNodeID) {
                    showTreeViewer(tree, {HIGHLIGHT_NODE_ID: highlightNodeID });
                } else {
                    showTreeViewer(tree);
                }
                // omit conflict spinner when handling inbound URLs; it conflicts with others
                if (conflictReferenceTree) {
                    fetchAndShowTreeConflictDetails(currentTree, conflictReferenceTree, {SHOW_SPINNER: false});
                } else {
                    hideTreeConflictDetails(currentTree, {SHOW_SPINNER: false});
                }
            } else {
                var errMsg = 'The requested tree (\''+ currentTree +'\') was not found. It has probably been deleted from this study.';
                hideModalScreen();
                showInfoMessage(errMsg);
            }
        } else {
            // hide any active tree viewer
            if (treeViewerIsInUse) {
                $('#tree-viewer').modal('hide');
            }
        }

        // TODO: update all login links to use the new URL?
        fixLoginLinks();

        initialState = null;  // clear this to unlock history for other changes
    };

    // bind to statechange event
    History.Adapter.bind(window, 'statechange', handleChangingState);
}

function deparam( querystring ) {
    // "inverse" of jQuery's $.param(), this should convert a query-string
    // to a simple object w/ values
    var objResult = {};
    $.each( querystring.split("&"), function() {
        var prm=this.split("=");
        objResult[prm[0]] = prm[1];
    });
    return objResult;
}

function bindHistoryAwareWidgets() {
    // TODO: set first event handlers on tabs, tree popups, etc.
    var $tabBar = $('ul.nav-tabs:eq(0)');
    $tabBar.find('li > a').click(function() {
        var $tab = $(this);
        var tabName = $.trim( $tab.html().split('<')[0] );
        changeTab( {'tab': tabName } );
        // this drives history (if possible) and changes tab
        return false;  // skip tab's default click-handler!
    });
}

// call this FIRST when clicking tabs (or changing tabs via script)...
function changeTab(o) {
    // if we're using History.js, all tab changes should should be driven from history
    var newTabName = $.trim('tab' in o ? o.tab : '');
    if (newTabName === '') {
        alert('changeTab(): No tab name specified!');
        return;
    }
    var $tabBar = $('ul.nav-tabs:eq(0)');
    var oldTabName = $.trim($tabBar.find('li.active a').text());
    if (newTabName === oldTabName) {
        alert('changeTab(): Same tab specified, nothing to change...');
        return;
    }
    if (History && History.enabled) {
        /* TODO: add expected values for minimal history entry?
        var stateObj = $.extend(true, {'foo': ''}, o);
        // deep copy of o, with default values if none supplied
        //History.pushState(o, historyStateToWindowTitle(o), historyStateToURL(o));
        */
        var newState = o;   // incoming arg, just has tab defined
        // NOTE that this should obviate any other state vars, which are all tab-limited
        History.pushState(newState, '', '?tab='+ slugify(newTabName));  // TODO: change title and URL?
        // TODO: preserve general state vars in URL query string?
    } else {
        // click tab normally (ignore browser history)
        goToTab( newTabName );
    }
    fixLoginLinks();
}
function showTreeWithHistory(tree) {
    if (History && History.enabled) {
        // push tree view onto history (if available) and show it
        var oldState = History.getState().data;
        var newState = $.extend(
            cloneFromSimpleObject( oldState ),
            {
                'tab': 'Home',
                'tree': tree['@id']
            }
        );
        History.pushState( newState, (window.document.title), ('?tab=home&tree='+ newState.tree) );
    } else {
        // show tree normally (ignore browser history)
        showTreeViewer(tree);
    }
}
function hideTreeWithHistory() {
    // remove tree from history (if available) and hide it
    // N.B. This is triggered whenever the tree viewer is closed/hidden
    if (History && History.enabled) {
        // push tree view onto history (if available) and show it
        var oldState = History.getState().data;
        if (!oldState.tree) {
            // it wasn't added to history, so no change needed
            return;
        }
        var newState = $.extend(
            cloneFromSimpleObject( oldState ),
            {
                'tab': 'Home',
                'tree': null,
                'conflict': null
            }
        );
        History.pushState( newState, (window.document.title), '?tab=home' );
    }
    fixLoginLinks();
}

function updateListFiltersWithHistory() {
    /* capture changing list filters in browser history
     *
     * N.B. This is triggered when filter is updated programmatically, which
     * could be as innocuous as the TREES tickler being nudged. So we should
     * avoid modifying the browser history unless something has really changed.
     */
    if (History && History.enabled) {
        if (initialState) {
            // wait until initial state has been applied!
            return;
        }
        var oldState = History.getState().data;

        // Determine which list filter is active (currently based on tab)
        // N.B. There's currently just one filter per tab (Home, Files, OTU Mapping).
        var activeFilter;
        var filterDefaults;
        switch(slugify(oldState.tab)) {
            case 'home':
                activeFilter = viewModel.listFilters.TREES;
                filterDefaults = listFilterDefaults.TREES;
                break;
            case 'files':
                activeFilter = viewModel.listFilters.FILES;
                filterDefaults = listFilterDefaults.FILES;
                break;
            case 'otu-mapping':
                activeFilter = viewModel.listFilters.OTUS;
                filterDefaults = listFilterDefaults.OTUS;
                break;
            default:
                //console.warn('updateListFiltersWithHistory(): No filters in this tab: '+ oldState.tab);
                return;
        }
        var newState = cloneFromSimpleObject( oldState );
        // TODO: weed out old filter properties?

        // use slugified tab name for the query-string (filter values are preserved)
        var newQSValues = {
            tab: slugify(oldState.tab)
        };
        for (prop in activeFilter) {
            newState[prop] = ko.unwrap(activeFilter[prop]);
            // Hide default filter settings, for simpler URLs
            if (newState[prop] !== filterDefaults[prop]) {
                // Our list filters are smart about recognizing diacritics, so
                // we can just use their Latin-only counterparts in the URL.
                newQSValues[prop] = removeDiacritics( ko.unwrap(activeFilter[prop]) );
            }
        }

        // Compare old and new states (or query-strings?) and bail if nothing interesting has changed
        ///console.log('=== CHECKING OLD VS. NEW STATE ===');
        var interestingChangesFound = false;
        for (prop in oldState) {
            if (newState[prop] !== oldState[prop]) {
                ///console.log('oldState.'+ prop +' WAS '+ oldState[prop] +' <'+ typeof( oldState[prop] ) +'>, IS '+ newState[prop] +' <'+ typeof( newState[prop] ) +'>');
                interestingChangesFound = true;
            }
        }
        for (prop in newState) {
            if (!(prop in oldState)) {
                ///console.log('newState.'+ prop +' NOT FOUND in oldState');
                interestingChangesFound = true;
            }
        }
        if (interestingChangesFound) {
            ///console.log('=== INTERESTING! ===');
            //var newQueryString = '?'+ encodeURIComponent($.param(newQSValues));
            var newQueryString = '?'+ $.param(newQSValues);
            History.pushState( newState, (window.document.title), newQueryString );
        } else {
            ///console.log('=== BORING... ===');
        }
    }
}

function fixLoginLinks() {
    // Update all login (and logout!) links to return directly to the current
    // URL. This may also mean switching from /edit/ to /view/, or vice versa.
    var currentURL;
    try {
        var State = History.getState();
        currentURL = State.url;
    } catch(e) {
        currentURL = window.location.href;
    }

    // Nudge to edit or view URLs?
    var editURL = currentURL.replace('/view/', '/edit/');
    var viewURL = currentURL.replace('/edit/', '/view/');

    // mark and mutate links on this page
    var $loginLinks = $('a:not(.sticky-login):contains(Login)');
    var $logoutLinks = $('a:contains(Logout)');
    var $loginToEditLinks = $('a.sticky-login');
    var $switchToViewLinks = $('#cancel-collection-edits');

    var updateLoginHref = function( link, targetURL ) {
        // allow for different URL patterns
        var $link = $(link);
        var itsHref = $link.attr('href');
        if (itsHref.indexOf('_next') !== -1) {
            // modify the 'next' URL to match the latest
            itsHref = itsHref.split('?')[0];
            itsHref += ('?_next='+ targetURL);
        } else {
            // replace the entire href attribute
            itsHref = targetURL;
        }
        $link.attr('href', itsHref);
    }

    $loginLinks.each(function() {
        // simple login, stick w/ current URL
        updateLoginHref(this, currentURL);
    });

    $logoutLinks.each(function() {
        // simple logout, switch from edit to view as needed
        updateLoginHref(this, viewURL);
    });

    $loginToEditLinks.each(function() {
        // login and implicit to edit
        updateLoginHref(this, editURL);
    });

    $switchToViewLinks.each(function() {
        // login and implicit to edit
        updateLoginHref(this, viewURL);
    });
}

var collectionHasUnsavedChanges = false;
// this flag is always false in VIEW, and should be switched carefully(!) in EDIT

var initialState;
$(document).ready(function() {
    bindHistoryAwareWidgets();
    bindHelpPanels();

    // NOTE that our initial state is set in the main page template, so we
    // can build it from incoming URL in web2py. Try to recapture this state,
    // ideally through manipulating history.
    if (History && History.enabled) {
        // "formalize" the current state with an object
        initialState.nudge = new Date().getTime();
        History.replaceState(initialState, window.document.title, window.location.href);
    } else {
        goToTab( initialState.tab );
    }
    // N.B. We'll apply this once we've loaded the selected collection, then clear it

    collectionHasUnsavedChanges = false;
    disableSaveButton();
    loadSelectedCollection();

    // Initialize the jQuery File Upload widgets
    $('#fileupload').fileupload({
        disableImageResize: true,
        // maxNumberOfFiles: 5,
        // maxFileSize: 5000000,  // TODO: allow maximum
        // acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i  // TODO: allow any
        url: '/curator/supporting_files/upload_file',
        dataType: 'json',
        autoUpload: true,
        add: function(e, data) {
            console.log('*** fileupload - add ***');
            if (!remindAboutAddingLateData()) {
                return false;  // showing the reminder instead
            }
            data.submit();
        },
        done: function() {
            console.log('done!');
        }
    }).on('fileuploadprogressall', function (e, data) {
        console.log('fileuploadprogressall');
        var progress = parseInt(data.loaded / data.total * 100, 10);
        $('#file-upload-progress .bar').css(
            'width',
            progress + '%'
        );
        $('#file-upload-progress .bar span').text(
            progress + '%'
        );
    }).on('fileuploaddone', function (e, data) {
        console.log('fileuploaddone');
        $.each(data.result.files, function (index, file) {
            if (file.url) {
                var link = $('<a>')
                    .attr('target', '_blank')
                    .prop('href', file.url);

                /* 'file' obj has these properties
                    .delete_url: "/curator/supporting_files/delete_file/supporting_files.doc.96...3461.m4a"
                    .name: "10_6_2011 6_03 PM.m4a"
                    .size: 35036641
                    .url: "/curator/supporting_files/download/supporting_files.doc.96acd92...3461.m4a"
                */
                // update the files list (and auto-save?)
                var fileNexson = cloneFromNexsonTemplate('single supporting file');
                fileNexson['@filename'] = file.name;
                fileNexson['@url'] = file.url;  // TODO: prepend current domain name, if missing?
                fileNexson['@type'] = "";  // TODO: glean this from file extension?
                fileNexson['@size'] = file.size;  // convert byte count for display?
                // TODO: incorporate the delete URL provided? or generate as-needed?
                // fileNexson.delete_url( file.delete_url );

                getSupportingFiles().data.files.file.push(fileNexson);
                nudgeTickler('SUPPORTING_FILES');

                showSuccessMessage('File added.');
            } else if (file.error) {
                var error = $('<span class="text-danger"/>').text(file.error);
                /*
                $(data.context.children()[index])
                    .append('<br>')
                    .append(error);
                */
                console.log( "FAILURE, msg = "+ error);
            }
        });
    })

    $('#treeupload').fileupload({
        // NOTE that this should submit the same arguments (except for file
        // data) as submitNewtree() below
        disableImageResize: true,
        // maxNumberOfFiles: 5,
        // maxFileSize: 5000000,  // TODO: allow maximum
        // acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i  // TODO: allow any
        url: $('#tree-import-form').attr('action'),
        dataType: 'json',
        autoUpload: false,
        start: function(e, data) {
            console.log('*** treeupload - start ***');
        },
        /* use actual form widgets instead?
        formData: {
            // these are ADDED to the form's native widgets
            // https://github.com/blueimp/jQuery-File-Upload/wiki/How-to-submit-additional-Form-Data
            author_name: userDisplayName,
            author_email: userEmail,
            auth_token: userAuthToken
        },
        */
        add: function(e, data) {
            console.log('*** treeupload - add ***');
            // add hints for nicer element IDs to the form
            setElementIDHints();

            $('[name=new-tree-submit]').click(function() {
                if (!remindAboutAddingLateData()) {
                    return false;  // showing the reminder instead
                }
                console.log('treeupload - submitting...');
                $('[name=uploadid]').val( generateTreeUploadID() );
                showModalScreen("Adding tree...", {SHOW_BUSY_BAR:true});
                data.submit();
                return false; // suppress normal form submission!
            });
        },
        always: function(e, data) {
            // do this regardless of success or failure
            console.log('*** treeupload - (always) done ***');
            returnFromNewTreeSubmission( data.jqXHR, data.textStatus );
        }
    }).on('fileuploadprogressall', function (e, data) {
        console.log('tree - fileuploadprogressall');
        var progress = parseInt(data.loaded / data.total * 100, 10);
        $('#tree-upload-progress .bar').css(
            'width',
            progress + '%'
        );
        $('#tree-upload-progress .bar span').text(
            progress + '%'
        );
    }).on('fileuploaddone', function (e, data) {
        console.log('tree - fileuploaddone');
    })

    // enable taxon search
    $('input[name=taxon-search]').unbind('keyup change').bind('keyup change', setTaxaSearchFuse );
    $('select[name=taxon-search-context]').unbind('change').bind('change', searchForMatchingTaxa );

    // don't trigger unrelated form submission when pressing ENTER here
    $('input[name=taxon-search], select[name=taxon-search-context]')
        .unbind('keydown')
        .bind('keydown', function(e) { return e.which !== 13; });
});


function goToTab( tabName ) {
    // Click the corresponding tab, if found. If the tab name is not found, it
    // might be a "slug" version, so compare these too.
    var $matchingTab = $('.nav-tabs a').filter(function() {
        var $tab = $(this);
        var itsName = $.trim( $tab.html().split('<')[0] );
        if (itsName === tabName) {
            return true;
        }
        if (slugify(itsName) === tabName) {
            return true;
        }
        return false;
    })
    if ($matchingTab.length === 0) {
        console.warn("No such tab, going to Home...");
        goToTab('home');
        return;
    }
    $matchingTab.tab('show');
}

function loadSelectedCollection() {
    /* Use REST API to pull collection data from datastore
     * :EXAMPLE: GET http://api.opentreeoflife.org/v3/collection/{jimallman/test}
     *
     * Offer a visible progress bar (for larger collectiond)?
     *
     * Gracefully handle and report:
     *  - remote service not available
     *  - collection missing or not found
     *  - misc errors from API
     *  - any local storage (in Lawnchair) that trumps the one in remote storage
     */

    var fetchURL = API_load_collection_GET_url.replace('{COLLECTION_ID}', collectionID);

    // TEST URL with local JSON file
    ///fetchURL = '/curator/static/1003.json';

    // TODO: try an alternate URL, pulling directly from GitHub?

    showModalScreen("Loading tree collection...", {SHOW_BUSY_BAR:true});

    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: fetchURL,
        data: {
            'auth_token': userAuthToken
        },
        error: function(jqXHR, textStatus, errorThrown) {
            // report errors or malformed data, if any
            hideModalScreen();

            console.warn("textStatus: "+ textStatus);
            console.warn("jqXHR.status: "+ jqXHR.status);
            console.warn("jqXHR.responseText: "+ jqXHR.responseText);

            var errMsg;
            if (jqXHR.responseText.length === 0) {
                errMsg = 'Sorry, there was an error loading this collection. (No more information is available.)';
            } else {
                errMsg = 'Sorry, there was an error loading this collection. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">Show details</a><pre class="error-details" style="display: none;">'+ jqXHR.responseText +'</pre>';
            }
            showErrorMessage(errMsg);
        },

        success: function( response, textStatus, jqXHR ) {
            // this should be properly parsed JSON

            // report errors or malformed data, if any
            if (textStatus !== 'success') {
                showErrorMessage('Sorry, there was an error loading this collection.');
                return;
            }
            if (typeof response !== 'object') {
                showErrorMessage('Sorry, there is a problem with the collection data (no response).');
                return;
            }
            // pull data from bare NexSON repsonse or compound object (data + sha)
            var data = response['data'] || response;
            if (typeof data !== 'object' || typeof(data['decisions']) == 'undefined') {
                showErrorMessage('Sorry, there is a problem with the collection data (decision list).');
                return;
            }

            viewModel = data;

            // get initial rendered HTML for study comment (from markdown)
            viewModel.commentHTML = response['commentHTML'] || 'COMMENT_HTML_NOT_PROVIDED';

            // we should also now have the full commit history of this NexSON
            // study in the docstore repo
            viewModel.versions = ko.observableArray(
                response['versionHistory'] || [ ]
            ).asPaged(20);

            /*
             * Add observable properties to the model to support the UI
             */

            // Add a series of observable "ticklers" to signal changes in
            // the model without observable Nexson properties. Each is an
            // integer that creeps up by 1 to signal a change somewhere in
            // related Nexson elements.
            // TODO: Is this a tickler? ratchet? whisker?
            viewModel.ticklers = {
                'GENERAL_METADATA': ko.observable(1),
                'TREES': ko.observable(1),  // i.e. the 'decisions' array
                // TODO: add more as needed...
                'COLLECTION_HAS_CHANGED': ko.observable(1)
            }

            // TODO: support fast lookup of elements by ID? for largest trees
            viewModel.fastLookups = {
                TREES_BY_NAME: null
            };

            // enable sorting and filtering for lists in the editor
            viewModel.filterDelay = 250; // ms to wait for changes before updating filter
            viewModel.listFilters = {
                // UI widgets bound to these variables will trigger the
                // computed display lists below..
                'TREES': {
                    'match': ko.observable( listFilterDefaults.TREES.match )
                },
            };

            // maintain a persistent array to preserve pagination (reset when computed)
            viewModel._filteredTrees = ko.observableArray( ).asPaged(20);
            viewModel.filteredTrees = ko.computed(function() {
                // filter raw tree list, returning a
                // new paged observableArray
                var ticklers = [ viewModel.ticklers.TREES() ];

                updateClearSearchWidget( '#tree-list-filter', viewModel.listFilters.TREES.match );
                updateListFiltersWithHistory();

                var match = viewModel.listFilters.TREES.match(),
                    matchWithDiacriticals = addDiacriticalVariants(match),
                    matchPattern = new RegExp( $.trim(matchWithDiacriticals), 'i' );

                var allTrees = [];
                $.each(viewModel.nexml.trees, function(i, treesCollection) {
                    // watch for single trees here!
                    var treeList = makeArray(treesCollection.tree);
                    $.each(treeList, function(i, tree) {
                        allTrees.push( tree );
                    });
                });

                // map old array to new and return it
                var filteredList = ko.utils.arrayFilter(
                    allTrees,
                    function(tree) {
                        // match entered text against old or new label
                        var treeName = tree['@label'];
                        var inGroupName = getInGroupCladeDescriptionForTree(tree);
                        if (!matchPattern.test(treeName) && !matchPattern.test(inGroupName)) {
                            return false;
                        }
                        return true;
                    }
                );  // END of list filtering

                viewModel._filteredTrees( filteredList );
                viewModel._filteredTrees.goToPage(1);
                return viewModel._filteredTrees;
            }).extend({ throttle: viewModel.filterDelay }); // END of filteredTrees

            // some changes to metadata will modify the page's headings
            viewModel.ticklers.GENERAL_METADATA.subscribe(updatePageHeadings);
            updatePageHeadings();

            // "Normalize" trees by adding any missing tree properties and metadata.
            // (this depends on some of the "fast lookups" added above)
            $.each(data.decisions, function(i, dec) {
                normalizeDecision( dec );
            });

            var mainPageArea = $('#main .tab-content')[0];
            ko.applyBindings(viewModel, mainPageArea);
            var metadataPopup = $('#collection-metadata-popup')[0];
            ko.applyBindings(viewModel, metadataPopup);

            // Any further changes (*after* tree normalization) should prompt for a save before leaving
            viewModel.ticklers.STUDY_HAS_CHANGED.subscribe( function() {
                if (viewOrEdit == 'EDIT') {
                    collectionHasUnsavedChanges = true;
                    enableSaveButton();
                    pushPageExitWarning('UNSAVED_STUDY_CHANGES',
                                        "WARNING: This study has unsaved changes! To preserve your work, you should save this study before leaving or reloading the page.");
                }
            });

            hideModalScreen();
            showInfoMessage('Collection data loaded.');
        }
    });
}

function updatePageHeadings() {
    // page headings should reflect the latest metadata for the collection
    var studyFullReference = viewModel.nexml['^ot:studyPublicationReference'];
    var studyCompactReference = fullToCompactReference(studyFullReference);
    if (viewOrEdit == 'EDIT') {
        $('#main-title').html('<span style="color: #ccc;">Editing collection</span> '+ studyCompactReference);
    } else {
        $('#main-title').html('<span style="color: #ccc;">Viewing collection</span> '+ studyCompactReference);
    }

    var studyDOI = ('^ot:studyPublication' in viewModel.nexml) ? viewModel.nexml['^ot:studyPublication']['@href'] : "";
    studyDOI = $.trim(studyDOI);
    if (studyDOI === "") {
        $('a.main-title-DOI').hide();
    } else {
        $('a.main-title-DOI').text(studyDOI).attr('href', studyDOI).show();
    }
}

function floatToPercent( dec ) {
    // assumes a float between 0.0 and 1.0
    // EXAMPLE: 0.232 ==> 23%
    return Math.round(dec * 100);
}

var hidingBranchLengths = false;
function toggleBranchLengthsInViewer(cb) {
    // checkbox enables/disables branch-length display (and labeling?) in
    // tree-view popup
    hidingBranchLengths = $(cb).is(':checked');
    // fetch tree ID from popup's widgets
    var currentTreeID = $('#tree-tags').attr('treeid');
    if (currentTreeID) {
        drawTree(currentTreeID)
    } else {
        console.warn("No tree in vizInfo!");
    }
}

var usingRadialTreeLayout = false;
function toggleRadialTreeLayoutInViewer(cb) {
    // checkbox enables/disables radial tree layout in tree-view popup
    // fetch tree ID from popup's widgets
    var currentTreeID = $('#tree-tags').attr('treeid');
    var currentTree = getTreeByID(currentTreeID);
    usingRadialTreeLayout = $(cb).is(':checked');
    // disable/enable the branch-lengths checkbox
    // NOTE: We only enable this feature if ALL branches have length!
    var $branchLengthCheckbox = $('#branch-length-toggle');
    var $branchLengthLabel = $branchLengthCheckbox.parent();
    /* N.B. This logic is shared with Knockout bindings, to handle the
     * initial display for each tree.
     */
    if (isBranchLengthToggleEnabled(currentTree)) {
        $branchLengthCheckbox.removeAttr('disabled');
    } else {
        $branchLengthCheckbox.attr('disabled', 'disabled');
    }
    $branchLengthLabel.css( getBranchLengthToggleStyle(currentTree) );
    $branchLengthLabel.attr( getBranchLengthToggleAttributes(currentTree) );

    if (currentTreeID) {
        drawTree(currentTreeID);
    } else {
        console.warn("No tree in vizInfo!");
    }
}
/* These awkward support functions isolate the logic used to assign inline CSS
 * and attributes for the toggling checkbox and its surrounding label. This
 * makes it possible to build Knockout bindings and JS functions that draw
 * from common logic and values. The previous duplication was error-prone and
 * unwieldy, esp. for KO bindings.
 */
function isBranchLengthToggleEnabled(tree) {
    viewModel.ticklers.TREES();
    if (usingRadialTreeLayout) return false;
    if (allBranchLengthsFoundInTree(tree)) return true;
    return false;  // i.e., some branches have no length
}
function getBranchLengthToggleAttributes(tree) {
    viewModel.ticklers.TREES();
    // return a set of properties/values suitable for HTML attributes
    var title;
    if (isBranchLengthToggleEnabled(tree)) {
        title = '';
    } else {
        if (noBranchLengthsFoundInTree(tree)) {
            title = 'No branch lengths found in this tree';
        } else if (!allBranchLengthsFoundInTree(tree)) {
            title = 'Not all edges of this tree have branch lengths';
        } else {
            title = 'Branch lengths cannot be shown in the radial layout';
        }
    }
    return {'title': title};
}
function getBranchLengthToggleStyle(tree) {
    viewModel.ticklers.TREES();
    // return a set of properties/values suitable for inline CSS
    if (isBranchLengthToggleEnabled(tree)) {
        return {'color': ''};
    }
    return {'color': '#999999'};
}

/* Support conflict display in the tree viewer */
function getTreeConflictSummary(conflictInfo) {
    // Expects a JS object from conflict service; returns an object with
    // summary tallies of each node status.
    // treat supported_by and partial_path_of the same
    var summary = {
        'terminal': {
            total: 0,
            nodes: {}
        },
        'aligned': {
            total: 0,
            nodes: {}
        },
        'conflicting': {
            total: 0,
            nodes: {}
        },
        'resolving': {
            total: 0,
            nodes: {}
        },
        'undetermined': {
            total: 0
            // do we need to build a node list here?
        }
    }
    //var totalNodesPartialPathOf = 0;
    for (var nodeid in conflictInfo.detailsByNodeID) {
        switch(conflictInfo.detailsByNodeID[nodeid].status) {
	    case 'terminal':
                summary.terminal.total++;
                summary.terminal.nodes[nodeid] = conflictInfo.detailsByNodeID[nodeid];
                break;
            case 'supported_by':
            case 'partial_path_of':
                summary.aligned.total++;
                summary.aligned.nodes[nodeid] = conflictInfo.detailsByNodeID[nodeid];
                break;
            case 'conflicts_with':
                summary.conflicting.total++;
                summary.conflicting.nodes[nodeid] = conflictInfo.detailsByNodeID[nodeid];
                break;
            case 'resolved_by':
            case 'resolves':
                summary.resolving.total++;
                summary.resolving.nodes[nodeid] = conflictInfo.detailsByNodeID[nodeid];
                break;
            default:
                console.error("ERROR: unknown conflict status '"+ (conflictInfo.detailsByNodeID[nodeid].status) +"'!");
        }
    }
    // subtract from all internal nodes to count undetermined nodes
    var inputTreeID = $('#tree-select').val();
    var tree = getTreeByID( inputTreeID );
    var nodeCounts = getNodeCounts(tree);
    var internalNodeCount = nodeCounts.totalNodes - nodeCounts.totalTips;
    summary.undetermined.total = nodeCounts.totalNodes
        - summary.terminal.total
        - summary.aligned.total
        - summary.conflicting.total
        - summary.resolving.total;
    return summary;
}
function testConflictSummary(conflictInfo) {
    // show results in the JS console
    var summaryInfo = getTreeConflictSummary(conflictInfo);
    /*
    console.warn("Node status summary");
    console.warn("  "+ summaryInfo.aligned +" aligned nodes");
    console.warn("  "+ summaryInfo.conflicting +" conflicting nodes");
    console.warn("  "+ summaryInfo.resolving +" resolving nodes");
    */
}

function getTargetTreeNodeLink(nodeID, referenceTreeID) {
    // return a link to the local (reference) tree node; used in conflict summary
    var displayName = nodeID;
    var link = '<a href="#" onclick="showTreeViewer(getTreeByID(\'{TREE_ID}\'), {HIGHLIGHT_NODE_ID:\'{NODE_ID}\'}); return false;" \
               title="See this node in the selected tree">{DISPLAY_NAME}</a>';
    return link.replace('{TREE_ID}', referenceTreeID)
               .replace('{NODE_ID}', nodeID)
               .replace('{DISPLAY_NAME}', displayName);
}

// returns a link to the witness node (in synth tree browser or OTT browser)
function getWitnessLink(nodeInfo, targetType) {
  var link;
  if (targetType == "synth") {
    link = getSynthTreeViewerLinkForTaxon(nodeInfo.witness_name,nodeInfo.witness)
  }
  else if (targetType == "ott") {
    link = getTaxobrowserLink(nodeInfo.witness_name,nodeInfo.witness)
  }
  else {
    link = nodeInfo.witness_name
  }
  return link
}

function displayConflictSummary(conflictInfo) {
    // show results in the Analyses tab
    var summaryInfo = getTreeConflictSummary(conflictInfo);
    var $reportArea = $('#analysis-results');
    var targetTree = $('#reference-select').val();
    var referenceTreeID = $('#tree-select').val();
    var treeURL = getViewURLFromStudyID(studyID) +"?tab=home&tree="+ referenceTreeID +"&conflict="+ targetTree;
    $reportArea.empty()
           .append('<h4>Conflict summary</h4>')
           .append('<p><a href="'+ treeURL +'" target="conflicttree">Open labelled tree in new window</a></p>')
           .append('<p>Of the <span class="node-count-display">n</span> nodes in this tree, here is how they compare to the <span class="reference-tree-display">taxonomy / synthetic tree</span> (=target). Nodes in the input tree or the synthetic tree may be unnamed / undefined if they are not associated with taxonomic names.</p>');
    var nodeCount = summaryInfo.aligned.total
        + summaryInfo.conflicting.total
        + summaryInfo.resolving.total
        + summaryInfo.undetermined.total;
    $reportArea.find('.node-count-display').html(nodeCount);
    var chosenTargetName = $('#reference-select option:selected').html();
    $reportArea.find('.reference-tree-display').html(chosenTargetName);

    // show aligned nodes
    $reportArea.append('<p style="padding-left: 2em;">'+ summaryInfo.aligned.total
        +' <strong>aligned</strong> nodes that can be mapped to nodes in the target'
        + (summaryInfo.aligned.total > 0 ? ' <a href="#" onclick="$(\'#report-aligned-nodes\').toggle(); return false;">(hide/show node list)</a>' : '')
        +'</p>');
    $reportArea.append('<ul id="report-aligned-nodes" class="conflict-report-node-list"></ul>');
    var $nodeList = $reportArea.find('#report-aligned-nodes');
    var namedNodes = 0
    for (var nodeid in summaryInfo.aligned.nodes) {
        var nodeInfo = summaryInfo.aligned.nodes[nodeid];
        if ('witness' in nodeInfo) {
          var nodeLink = getTargetTreeNodeLink(nodeid, referenceTreeID);
          var witnessLink = getWitnessLink(nodeInfo, targetTree);
          var nodeName = 'tree '+ nodeLink +' aligned to '+ witnessLink;
          $nodeList.append('<li>'+ nodeName +'</li>');
          ++namedNodes
        }
        //var nodeName = 'witness_name' in nodeInfo ? nodeInfo.witness_name +' ['+ nodeid +']' : 'Unnamed node ('+ nodeInfo.witness +')'
    }
    if (namedNodes == 0) {
      $nodeList.append('<li>all target nodes unnamed (so there is not anything interesting to show here)</li>')
    }
    else {
      var unnamedNodes = summaryInfo.aligned.total - namedNodes
      if (unnamedNodes > 0) {
        $nodeList.append('<li>plus ' + unnamedNodes + ' more unnamed target nodes aligned to nodes in this tree</li>')
      }
    }

    // resolving nodes
    $reportArea.append('<p style="padding-left: 2em;">'+ summaryInfo.resolving.total
        +' <strong>resolving</strong> nodes that resolve polytomies within these clades in the target'
        + (summaryInfo.resolving.total > 0 ? ' <a href="#" onclick="$(\'#report-resolving-nodes\').toggle(); return false;">(hide/show target node list)</a>' : '')
        +'</p>');
    $reportArea.append('<ul id="report-resolving-nodes" class="conflict-report-node-list"></ul>');
    var $nodeList = $reportArea.find('#report-resolving-nodes');
    var namedNodes = 0
    for (var nodeid in summaryInfo.resolving.nodes) {
        var nodeInfo = summaryInfo.resolving.nodes[nodeid];
        var nodeLink = getTargetTreeNodeLink(nodeid, referenceTreeID);
        var witnessLink = getWitnessLink(nodeInfo,targetTree)
        if ('witness' in nodeInfo) {
          var nodeName = 'tree '+ nodeLink +' provides resolution in '+ witnessLink;
          $nodeList.append('<li>'+ nodeName +'</li>');
          ++namedNodes
        }
    }
    if (namedNodes == 0) {
      $nodeList.append('<li>all target nodes unnamed (so there is not anything interesting to show here)</li>')
    }
    else {
      var unnamedNodes = summaryInfo.resolving.total - namedNodes
      if (unnamedNodes > 0) {
        $nodeList.append('<li>plus ' + unnamedNodes + ' more unnamed target nodes resolved by nodes in this tree</li>')
      }
    }

    // conflicting nodes
    $reportArea.append('<p style="padding-left: 2em;">'+ summaryInfo.conflicting.total
        +' <strong>conflicting</strong> nodes that conflict with nodes in the target'
        + (summaryInfo.conflicting.total > 0 ? ' <a href="#" onclick="$(\'#report-conflicting-nodes\').toggle(); return false;">(hide/show target node list)</a>' : '')
        +'</p>');
    $reportArea.append('<ul id="report-conflicting-nodes" class="conflict-report-node-list"></ul>');
    var $nodeList = $reportArea.find('#report-conflicting-nodes');
    var namedNodes = 0
    for (var nodeid in summaryInfo.conflicting.nodes) {
        var nodeInfo = summaryInfo.conflicting.nodes[nodeid];
        var nodeLink = getTargetTreeNodeLink(nodeid, referenceTreeID);
        var witnessLink = getWitnessLink(nodeInfo,targetTree)
        var nodeName = 'tree '+ nodeLink +' conflicts with '+ witnessLink;
        $nodeList.append('<li>'+ nodeName +'</li>');
        ++namedNodes
    }
    if (namedNodes == 0) {
      $nodeList.append('<li>all target nodes unnamed (so there is not anything interesting to show here)</li>')
    }
    else {
      var unnamedNodes = summaryInfo.conflicting.total - namedNodes
      if (unnamedNodes > 0) {
        $nodeList.append('<li>plus ' + unnamedNodes + ' more nodes that resolve unnamed nodes in the target</li>')
      }
    }

    // show terminal nodes
    $reportArea.append('<p style="padding-left: 2em;">'+ summaryInfo.terminal.total
        +' <strong>tip</strong> nodes that can be mapped to nodes in the target'
        + (summaryInfo.terminal.total > 0 ? ' <a href="#" onclick="$(\'#report-terminal-nodes\').toggle(); return false;">(hide/show node list)</a>' : '')
        +'</p>');
    $reportArea.append('<ul id="report-terminal-nodes" class="conflict-report-node-list"></ul>');
    var $nodeList = $reportArea.find('#report-terminal-nodes');
    var namedNodes = 0
    for (var nodeid in summaryInfo.terminal.nodes) {
        var nodeInfo = summaryInfo.terminal.nodes[nodeid];
        if ('witness' in nodeInfo) {
          var nodeLink = getTargetTreeNodeLink(nodeid, referenceTreeID);
          var witnessLink = getWitnessLink(nodeInfo, targetTree);
          var nodeName = 'tree '+ nodeLink +' terminal to '+ witnessLink;
          $nodeList.append('<li>'+ nodeName +'</li>');
          ++namedNodes
        }
        //var nodeName = 'witness_name' in nodeInfo ? nodeInfo.witness_name +' ['+ nodeid +']' : 'Unnamed node ('+ nodeInfo.witness +')'
    }
    if (namedNodes == 0) {
      $nodeList.append('<li>all target nodes unnamed (so there is not anything interesting to show here)</li>')
    }
    else {
      var unnamedNodes = summaryInfo.terminal.total - namedNodes
      if (unnamedNodes > 0) {
        $nodeList.append('<li>plus ' + unnamedNodes + ' more unnamed target nodes terminal to nodes in this tree</li>')
      }
    }


    $reportArea.append('<p style="padding-left: 2em;">'+ summaryInfo.undetermined.total
        +' <strong>undetermined</strong> nodes that cannot be aligned to the target at all (these are often unmapped OTUs)</p>');

    if (collectionHasUnsavedChanges) {
        showInfoMessage('REMINDER: Conflict analysis uses the last-saved version of this study!');
    }
}

function fetchTreeConflictStatus(inputTreeID, referenceTreeID, callback, useCachedResponse) {
    // Expects inputTreeID from the current study (concatenate these!)
    // Expects referenceTreeID of 'taxonomy' or 'synth'
    if (typeof(inputTreeID) !== 'string') {
        inputTreeID = $('#tree-select').val();
    }
    if (typeof(referenceTreeID) !== 'string') {
        referenceTreeID = $('#reference-select').val();
    }
    if (typeof(useCachedResponse) !== 'boolean') {
        useCachedResponse = false;  // when in doubt, get fresh conflict information
    }
    if (!inputTreeID || !referenceTreeID) {
        hideModalScreen()
        showErrorMessage("Please choose both input and reference trees.")
        return;
    }
    var fullInputTreeID = (studyID +"%23"+ inputTreeID);
    var referenceTreeName;
    switch(referenceTreeID) {
        // these are the only ids allowed for now
        case 'ott':
            referenceTreeName = 'Open Tree Taxonomy';
            break;
        case 'synth':
            referenceTreeName = 'Synthetic Tree of Life';
            break;
        default:
            hideModalScreen()
            console.error('fetchTreeConflictStatus(): ERROR, expecting either "ott" or "synth" as referenceTreeID!');
            return;
    }
    var conflictURL = treeConflictStatus_url
        .replace(/&amp;/g, '&')  // restore all naked ampersands (for query-string args)
        .replace('{TREE1_ID}', fullInputTreeID)
        .replace('{TREE2_ID}', referenceTreeID)
        .replace('{USE_CACHE}', String(useCachedResponse))
    // call this URL and try to show a summary report
    $.ajax({
        global: false,  // suppress web2py's aggressive error handling
        type: 'GET',
        dataType: 'json',
        // crossdomain: true,
        //contentType: "application/json; charset=utf-8",
        url: conflictURL,
        //processData: false,
        //data: {"nexml":'+ JSON.stringify(viewModel.nexml) +'},
        complete: function( jqXHR, textStatus ) {
            // report errors or malformed data, if any
            if (textStatus !== 'success') {
                if (jqXHR.status >= 500) {
                    // major server-side error, just show raw response for tech support
                    var errMsg = 'Sorry, there was an error generating a conflict report. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">Show details</a><pre class="error-details" style="display: none;">'+ jqXHR.responseText +'</pre>';
                    hideModalScreen();
                    showErrorMessage(errMsg);
                    return;
                }
                // Server blocked the save due to major validation errors!
                var data;
                try {
                    // TODO: if it's properly parsed JSON, show it more sensibly
                    data = $.parseJSON(jqXHR.responseText);
                } catch(e) {
                    // probably a raw stack trace from the service, just show it literally
                }
                var errMsg;
                if (jqXHR.responseText.indexOf('No mapped OTUs') !== -1) {
                    errMsg = 'Conflict analysis requires OTUs in the current tree to be mapped to the OpenTree taxonomy. For best results, use the OTU Mapping tools for most or all of the tips of this tree.';
                } else {
                    // (but for now, repeat the crude feedback used above)
                    errMsg = 'Sorry, there was an error in the conflict data. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">Show details</a><pre class="error-details" style="display: none;">'+ jqXHR.responseText +'</pre>';
                }
                hideModalScreen();
                showErrorMessage(errMsg);
                return;
            }
            // wrap the returned info with additional conflict metadata
            var conflictInfo = {
                inputTreeID: inputTreeID,
                referenceTreeID: referenceTreeID,
                referenceTreeName: referenceTreeName,
                detailsByNodeID: $.parseJSON(jqXHR.responseText)
            }
            //testConflictSummary(conflictInfo);  // shows in JS console
            if (typeof callback !== 'function') {
                hideModalScreen();
                console.error("fetchTreeConflictStatus() expected a callback function!");
                return;
            }
            callback(conflictInfo);
            hideModalScreen();
        }
    });
}

function fetchAndShowTreeConflictSummary(inputTreeID, referenceTreeID) {
    // show summary stats in the Analyses tab
    showModalScreen( "Generating conflict summary&hellip;", {SHOW_BUSY_BAR: true} );
    fetchTreeConflictStatus(
        inputTreeID,
        referenceTreeID,
        function(conflictInfo) {
            displayConflictSummary(conflictInfo);
        },
        false  // don't reuse a cached response
    );
}
function fetchAndShowTreeConflictDetails(inputTreeID, referenceTreeID, options) {
    if (!options) options = {SHOW_SPINNER: true};
    /* TODO: Reconsider this, if we can do it quickly and maintain SELECT value
    if (treeViewerIsInUse) {
        // hide stale conflict info in tree viewer
        var tree = getTreeByID(inputTreeID);
        hideTreeConflictDetails(tree);
    }
    */
    // color nodes+edges in the tree-view popup
    if (options.SHOW_SPINNER) {
        showModalScreen( "Updating tree display&hellip;", {SHOW_BUSY_BAR: true} );
    }
    fetchTreeConflictStatus(
        inputTreeID,
        referenceTreeID,
        function(conflictInfo) {
            // Show results in the current tree-view popup
            addConflictInfoToTree( inputTreeID, conflictInfo )
            drawTree(inputTreeID);
            if (options.SHOW_SPINNER) {
                hideModalScreen();
            }
        },
        false  // don't reuse a cached response
    );
}
function showTreeConflictDetailsFromPopup(tree) {
    // call the above from the tree-view popup
    if (!tree) {
        // this should *never* happen
        alert("showTreeConflictDetailsFromPopup(): No tree specified!");
        return;
    }
    var newReferenceTreeID = $('#treeview-reference-select').val();
    if (!newReferenceTreeID) {
        hideTreeConflictDetails( tree );
    } else {
        fetchAndShowTreeConflictDetails(tree['@id'], newReferenceTreeID);
    }
}
function hideTreeConflictDetails( tree, options ) {
    // ASSUMES the tree is already in view
    if (!options) options = {SHOW_SPINNER: true};
    if (options.SHOW_SPINNER) {
        showModalScreen( "Updating tree display&hellip;", {SHOW_BUSY_BAR: true} );
    }
    removeConflictInfoFromTree(tree);
    drawTree(tree);
    if (options.SHOW_SPINNER) {
        hideModalScreen();
    }
}

function addConflictInfoToTree( treeOrID, conflictInfo ) {
    // remove any stale info first
    removeConflictInfoFromTree( treeOrID );

    var tree = null;
    if (typeof(treeOrID) === 'object') {
        tree = treeOrID;
    } else {
        tree = getTreeByID(treeOrID);
    }
    if (!tree) {
        // this should *never* happen
        alert("addConflictInfoToTree(): No tree specified!");
        return;
    }
    if (!conflictInfo) {
        // this should *never* happen
        alert("addConflictInfoToTree(): No conflict info provided!");
        return;
    }
    // Add general information on the tree itself...
    tree.conflictDetails = {
        inputTreeID: conflictInfo.inputTreeID,
        referenceTreeID: conflictInfo.referenceTreeID,
        // TODO: referenceTreeVersion: '',   // e.g. 'opentree7.1' for synth, 'ott2.9' for taxonomy
        referenceTreeName: conflictInfo.referenceTreeName
    };
    // ... and more details to any specified local node
    for (var nodeID in conflictInfo.detailsByNodeID) {
        var localNode = getTreeNodeByID( tree, nodeID );
        localNode.conflictDetails = conflictInfo.detailsByNodeID[nodeID];
    }

    if (treeViewerIsInUse) {
        // update the reference-tree selector
        $('#treeview-reference-select').val(tree.conflictDetails.referenceTreeID);
        $('#treeview-clear-conflict').show();
    }
}

function removeTaxonMappingInfoFromTree( treeOrID ) {
    // Cache of information about nodes per mapped taxon
    var tree = null;
    if (typeof(treeOrID) === 'object') {
        tree = treeOrID;
    } else {
        tree = getTreeByID(treeOrID);
    }
    if (!tree) {
        // this should *never* happen
        alert("removeTaxonMappingInfoFromTree(): No tree specified!");
        return;
    }
    // Clear conflict information from the tree itself...
    delete tree.taxonMappingInfo;
    ///console.log('CLOBBERED taxon mapping info for tree '+ tree['@id']);
}

function removeConflictInfoFromTree( treeOrID ) {
    var tree = null;
    if (typeof(treeOrID) === 'object') {
        tree = treeOrID;
    } else {
        tree = getTreeByID(treeOrID);
    }
    if (!tree) {
        // this should *never* happen
        alert("removeConflictInfoFromTree(): No tree specified!");
        return;
    }
    // Clear conflict information from the tree itself...
    delete tree.conflictDetails;
    // and from all its nodes
    $.each(tree.node, function(i, node) {
        delete node.conflictDetails;
    });
    if (treeViewerIsInUse) {
        // update the reference-tree selector
        $('#treeview-reference-select').val('');
        $('#treeview-clear-conflict').hide();
    }
}

function showConflictDetailsWithHistory(tree, referenceTreeID) {
    // triggered from tree-view popup UI, works via History
    if (typeof referenceTreeID !== 'string') {
        referenceTreeID = $('#treeview-reference-select').val();
    }
    if (!referenceTreeID) {
        showErrorMessage('Please choose a target (reference) tree for comparison');
        return;
    }
    if (collectionHasUnsavedChanges) {
        showInfoMessage('REMINDER: Conflict analysis uses the last-saved version of this collection!');
    }
    if (History && History.enabled) {
        // update tree view in history (if available) and show it
        var oldState = History.getState().data;
        var newState = $.extend(
            cloneFromSimpleObject( oldState ),
            {
                'tab': 'Home',
                'tree': tree['@id'],
                'conflict': referenceTreeID
            }
        );
        History.pushState( newState, (window.document.title), ('?tab=home&tree='+ newState.tree +'&conflict='+ newState.conflict) );
    } else {
        // show conflict normally (ignore browser history)
        showTreeConflictDetailsFromPopup(tree);
    }
}
function hideConflictDetailsWithHistory(tree) {
    // remove conflict info from history (if available) and hide it
    if (History && History.enabled) {
        // update tree view in history (if available) and show it
        var oldState = History.getState().data;
        var newState = $.extend(
            cloneFromSimpleObject( oldState ),
            {
                'tab': 'Home',
                'tree': tree['@id'],
                'conflict': null
            }
        );
        History.pushState( newState, (window.document.title), '?tab=home&tree='+ newState.tree );
    } else {
        // hide conflict normally (ignore browser history)
        hideTreeConflictDetails(tree);
    }
    fixLoginLinks();
}

function updateMappingStatus() {
    // update mapping status+details based on the current state of things
    var detailsHTML, showBatchApprove, showBatchReject, needsAttention;
    /* TODO: defaults assume nothing particularly interesting going on
    detailsHTML = '';
    showBatchApprove = false;
    showBatchReject = true;
    needsAttention = false;
    */
    var proposedMappingNeedsDecision = false;
    for (var p in proposedOTUMappings()) {
        // the presence of anything here means there are proposed mappings
        proposedMappingNeedsDecision = true;
    }

    if (autoMappingInProgress() === true) {
        // auto-mapping is ACTIVE (meaning we have work in hand)
        detailsHTML = ''; // '<p'+'>Mapping in progress...<'+'/p>';
        showBatchApprove = false;
        showBatchReject = false;
        needsAttention = false;
    } else {
        if (getNextUnmappedOTU()) {
            // IF auto-mapping is PAUSED, but there's more to do on this page
            detailsHTML = '<p'+'>Mapping paused. Select new OTUs or adjust mapping hints, then click the '
                         +'<strong>Map selected OTUs</strong> button above to try again.<'+'/p>';
            showBatchApprove = false;
            showBatchReject = proposedMappingNeedsDecision;
            needsAttention = proposedMappingNeedsDecision;
        } else {
            // auto-mapping is PAUSED and everything's been mapped
            if (proposedMappingNeedsDecision) {
                // there are proposed mappings awaiting a decision
                detailsHTML = '<p'+'>All selected OTUs have been mapped. Use the '
                        +'<span class="btn-group" style="margin: -2px 0;">'
                        +' <button class="btn btn-mini disabled"><i class="icon-ok"></i></button>'
                        +' <button class="btn btn-mini disabled"><i class="icon-remove"></i></button>'
                        +'</span>'
                        +' buttons to accept or reject each suggested mapping,'
                        +' or the buttons below to accept or reject the suggestions for all visible OTUs.<'+'/p>';
                showBatchApprove = true;
                showBatchReject = true;
                needsAttention = true;
            } else {
                // there are NO proposed mappings awaiting a decision
                //
                /* TODO: check for two possibilities here
                if () {
                    // we can add more by including 'All trees'
                    detailsHTML = '<p'+'><strong>Congrtulations!</strong> '
                            +'Mapping is suspended because all OTUs in this '
                            +'study\'s nominated trees have accepted labels already. To continue, '
                            +'reject some mapped labels with the '
                            +'<span class="btn-group" style="margin: -2px 0;">'
                            +' <button class="btn btn-mini disabled"><i class="icon-remove"></i></button>'
                            +'</span> '
                            +'button or change the filter to <strong>In any tree</strong>.<'+'/p>';
                    showBatchApprove = false;
                    showBatchReject = false;
                    needsAttention = true;
                } else {
                    // we're truly done with mapping (in all trees)
                    detailsHTML = '<p'+'><strong>Congrtulations!</strong> '
                            +'Mapping is suspended because all OTUs in this study have accepted '
                            +'labels already.. To continue, use the '
                            +'<span class="btn-group" style="margin: -2px 0;">'
                            +' <button class="btn btn-mini disabled"><i class="icon-remove"></i></button>'
                            +'</span>'
                            +' buttons to reject any label at left.<'+'/p>';
                    showBatchApprove = false;
                    showBatchReject = false;
                    needsAttention = true;
                }
                */

                /* TODO: replace this stuff with if/else block above
                 */
                detailsHTML = '<p'+'>Mapping is suspended because all selected OTUs have accepted '
                        +' labels already. To continue, select additional OTUs to map, or use the '
                        +'<span class="btn-group" style="margin: -2px 0;">'
                        +' <button class="btn btn-mini disabled"><i class="icon-remove"></i></button>'
                        +'</span>'
                        +' buttons to reject any label at left, or change the filter and sort options'
                        +' to bring unmapped OTUs into view.<'+'/p>';
                showBatchApprove = false;
                showBatchReject = false;
                needsAttention = true;
            }
        }
    }

    $('.mapping-details').html(detailsHTML);
    if (showBatchApprove || showBatchReject) {
        $('.mapping-batch-operations').show();
        if (showBatchApprove) {
            $('.mapping-batch-operations #batch-approve').show();
        } else {
            $('.mapping-batch-operations #batch-approve').hide();
        }
        if (showBatchReject) {
            $('.mapping-batch-operations #batch-reject').show();
        } else {
            $('.mapping-batch-operations #batch-reject').hide();
        }
    } else {
        $('.mapping-batch-operations').hide();
    }
    if (needsAttention) {
        $('#mapping-status-panel').addClass('mapping-needs-attention');
    } else {
        $('#mapping-status-panel').removeClass('mapping-needs-attention');
    }
}

function validateFormData() {
    // Return success (t/f?), and handle errors one at a time
    // or use more typical jQuery machinery, or validation plugin?
    // check for a study year (non-empty integer)
    var studyYear = Number(viewModel.nexml["^ot:studyYear"]);
    if (isNaN(studyYear) || studyYear === 0) {
        showErrorMessage("Please enter an non-zero integer for the Study Year (in Home tab's metadata editor).");
        return false;
    }
    // TODO: Add other validation logic to match changes on the server side.
    // return true IF no errors were found!
    return true;
}

function promptForSaveComments() {
  // show a modal popup to gather comments (or cancel)
  // console.log('email: '+ userEmail);

  //include a warning message if the user has no public email
  if (userEmail == 'ANONYMOUS') {
    $('#save-collection-noemail-warning').show();
  }
  else {
    $('#save-collection-noemail-warning').hide();
  }

  $('#save-comments-popup').modal('show');
  // buttons there do the remaining work
}

function promptForDeleteComments() {
    // show a modal popup to gather comments (or cancel)
    $('#delete-comments-popup').modal('show');
    // buttons there do the remaining work
}


function scrubNexsonForTransport( nexml ) {
    /* Groom client-side Nexson for storage on server (details below)
     *   - strip client-side-only d3 properties (and similar)
     *   - coerce some KO string values to numeric types
     *   - remove unused rooting elements
     *   - remove "empty" elements if server doesn't expect them
     *   - clean up empty/unused OTU alt-labels
     *   - remove client-side MRCA test results
     */
    if (!nexml) {
        nexml = viewModel.nexml;
    }

    var allTrees = [];
    $.each(nexml.trees, function(i, treesCollection) {
        $.each(treesCollection.tree, function(i, tree) {
            allTrees.push( tree );
        });
    });
    $.each( allTrees, function(i, tree) {
        cleanupAdHocRoot(tree);
        clearD3PropertiesFromTree(tree);
        clearMRCATestResults(tree);
        removeConflictInfoFromTree(tree);
        removeTaxonMappingInfoFromTree(tree);
        removeEmptyReasonsToExclude(tree);
    });

    // coerce some non-string values
    if ("string" === typeof nexml['^ot:studyYear']) {
        // this should be an integer (or null if empty/invalid)
        var intYear = parseInt(nexml['^ot:studyYear']);
        nexml['^ot:studyYear'] = isNaN(intYear) ? null : intYear;
    }
    if ("string" === typeof nexml['^ot:focalClade']) {
        // this should be an integer (or null if empty/invalid)
        var intOttID = parseInt(nexml['^ot:focalClade']);
        nexml['^ot:focalClade'] = isNaN(intOttID) ? null : intOttID;
    }
    // force edge lengths from integers to floats
    $.each( allTrees, function(i, tree) {
        coerceEdgeLengthsToNumbers(tree);
    });

    // remove some unused elements
    if (null == nexml['^ot:focalClade']) {
        delete nexml['^ot:focalClade'];
    }

    // scrub otu properties
    var allOTUs = viewModel.elementTypes.otu.gatherAll(viewModel.nexml);
    $.each( allOTUs, function(i, otu) {
        delete otu['selectedForAction'];  // only used in the curation app
        delete otu['newTaxonMetadata'];
        delete otu['defaultSortOrder'];
        if ('^ot:altLabel' in otu) {
            var ottId = $.trim(otu['^ot:ottId']);
            if (ottId !== '') {
                // this otu is already mapped to OTT (trumps alt label)
                delete otu['^ot:altLabel'];
                return true; // skip to next otu
            }
            var altLabel = $.trim(otu['^ot:altLabel']);
            if (altLabel === '') {
                // the alt-label is empty
                delete otu['^ot:altLabel'];
                return true; // skip to next otu
            }
            var originalLabel = $.trim(otu['^ot:originalLabel']);
            if (altLabel === originalLabel) {
                // no changes from original (pointless)
                delete otu['^ot:altLabel'];
                return true; // skip to next otu
            }
        }
    });
}

function saveFormDataToCollectionJSON() {
    // save all populated fields; clear others, or remove from JSON(?)
    showModalScreen("Saving collection data...", {SHOW_BUSY_BAR:true});

    // push changes back to storage
    var saveURL = API_update_collection_PUT_url.replace('{COLLECTION_ID}', collectionID);
    // gather commit message (if any) from pre-save popup
    var commitMessage;
    var firstLine = $('#save-comment-first-line').val();
    var moreLines = $('#save-comment-more-lines').val();
    if ($.trim(firstLine) === '') {
        commitMessage = $.trim(moreLines);
    } else if ($.trim(moreLines) === ''){
        commitMessage = $.trim(firstLine);
    } else {
        commitMessage = $.trim(firstLine) +"\n\n"+ $.trim(moreLines);
    }

    // add non-Nexson values to the query string
    var qsVars = $.param({
        author_name: userDisplayName,
        author_email: userEmail,
        auth_token: userAuthToken,
        starting_commit_SHA: viewModel.startingCommitSHA,
        commit_msg: commitMessage
    });
    saveURL += ('?'+ qsVars);

    // add this user to the curatorName list, if not found
    var listPos = $.inArray( userDisplayName, viewModel.nexml['^ot:curatorName'] );
    if (listPos === -1) {
        viewModel.nexml['^ot:curatorName'].push( userDisplayName );
    }

    scrubNexsonForTransport();

    $.ajax({
        global: false,  // suppress web2py's aggressive error handling
        type: 'PUT',
        dataType: 'json',
        // crossdomain: true,
        contentType: "application/json; charset=utf-8",
        url: saveURL,
        processData: false,
        data: ('{"nexml":'+ JSON.stringify(viewModel.nexml) +'}'),
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
                var errMsg = 'Sorry, there was an error in the collection data. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">Show details</a><pre class="error-details" style="display: none;">'+ jqXHR.responseText +'</pre>';
                hideModalScreen();
                showErrorMessage(errMsg);
                return;
            }
            var putResponse = $.parseJSON(jqXHR.responseText);
            viewModel.startingCommitSHA = putResponse['sha'] || viewModel.startingCommitSHA;
            // update the History tab to show the latest commit
            if ('versionHistory' in putResponse) {
                viewModel.versions(putResponse['versionHistory'] || [ ]);
            }
            if (putResponse['merge_needed']) {
                var errMsg = 'Your changes were saved, but an edit by another user prevented your edit from merging to the publicly visible location. In the near future, we hope to take care of this automatically. In the meantime, please <a href="mailto:info@opentreeoflife.org?subject=Study merge%20needed%20-%20'+ viewModel.startingCommitSHA +'">report this error</a> to the Open Tree of Life software team';
                hideModalScreen();
                showErrorMessage(errMsg);
                return;
            }
            // presume success from here on
            hideModalScreen();
            showSuccessMessage('Collection saved to remote storage.');

            popPageExitWarning('UNSAVED_STUDY_CHANGES');
            collectionHasUnsavedChanges = false;
            disableSaveButton();
            // TODO: should we expect fresh JSON to refresh the form?
        }
    });
}

function disableSaveButton() {
    var $btn = $('#save-study-button');
    $btn.addClass('disabled');
    $btn.unbind('click').click(function(evt) {
        showErrorMessage('There are no unsaved changes.');
        return false;
    });
}
function enableSaveButton() {
    var $btn = $('#save-collection-button');
    $btn.removeClass('disabled');
    $btn.unbind('click').click(function(evt) {
        if (validateFormData()) {
            promptForSaveComments();
        }
        return false;
    });
}

function removeCollection() {
    // let's be sure, since deletion will make a mess...
    var removeURL = API_remove_collection_DELETE_url.replace('{COLLECTION_ID}', collectionID);
    // gather commit message (if any) from pre-save popup
    var commitMessage;
    var firstLine = $('#delete-comment-first-line').val();
    var moreLines = $('#delete-comment-more-lines').val();
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
        starting_commit_SHA: viewModel.startingCommitSHA,
        commit_msg: commitMessage
    });
    removeURL += ('?'+ qsVars);

    // do the actual removal (from the remote file-store) via AJAX
    showModalScreen("Deleting collection...", {SHOW_BUSY_BAR:true});

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
                showErrorMessage('Sorry, there was an error removing this collection.');
                console.log("ERROR: message !== 'File deleted', but "+ data.message);
                return;
            }
            */

            hideModalScreen();
            showSuccessMessage('Collection removed, returning to collection list...');
            setTimeout(function() {
                var collectionListURL = $('#return-to-collection-list').val();
                if (!collectionListURL) {
                    console.error("Missing collectionListURL!");
                }
                window.location = collectionListURL || '/curator';
            }, 3000);
        }
    });
}

/*
 * Use Knockout.js for smart, persistent binding of JS model to UI
 */

// TODO: incorporate its methods into mapped viewModel above?
function CollectionViewModel() {
    var self = this;
    self.nexml = {
        meta: ko.observableArray([ ])
    }
    self.getByAtProperty = function(array, prop) {
        // fetch from a list by @property value
        for (var i = 0; i < array.length; i++) {
            var testItem = array[i];
            if (!('@property' in testItem)) {
                continue
            };
            if (testItem['@property'] === prop) {
                return testItem.value; // assumes value is stored here
            }
            return null;
        }
    }

};

function getMetaTagByID(array, id) {
    // fetch complete metatag in the specified list by matching the specified ID
    return getNexsonChildByProperty(array, 'id', id);
}

function getMetaTagByProperty(array, prop) {
    // fetch complete metatag in the specified list by matching the specified ID
    // TODO: support all if multiple instances?
    return getNexsonChildByProperty(array, '@property', prop);
}

function getOTUByID(id) {
    // return the matching otu, or null if not found
    var lookup = getFastLookup('OTUS_BY_ID');
    return lookup[ id ] || null;
}

function getNexsonChildByProperty(children, property, value, options) {
    // fetch complete element in the specified list by matching the specified property
    var foundMatch;
    var returnAll = (typeof(options) === 'object' && options.FIND_ALL); // else return first match found
    var allMatches = [ ];

    // NOTE that according to Badgerfish rules, the hoped-for array might
    // be a simple object (singleton) or missing entirely!
    // See http://badgerfish.ning.com/
    children = makeArray( children );

    for (var i = 0; i < children.length; i++) {
        var testItem = children[i];
        switch(typeof(testItem[ property ])) {
            case 'undefined':
            case 'object':
                continue;
            case 'function':
                if (testItem[ property ] === value) {
                    foundMatch = testItem;
                    break;
                }
                continue;
            default:
                if (testItem[ property ] === value) {
                    foundMatch = testItem;
                    break;
                }
                continue;
        }

        if (returnAll) {
            allMatches.push(foundMatch);
        } else {
            return foundMatch;
        }
    }
    if (returnAll) {
        return allMatches;
    } else {
        return null;
    }
}

function getMetaTagValue(array, propertyName, options) {
    // fetch current value(s) for a metatag in the specified list, using its @property value
    var foundValue = null;
    var returnAll = (typeof(options) === 'object' && options.FIND_ALL); // else return first match found
    var allValues = [ ];

    // adjust matchingTags to ensure uniform handling below
    var matchingTags = getNexsonChildByProperty(array, '@property', propertyName, options);
    matchingTags = makeArray( matchingTags );

    $.each(matchingTags, function(i, testItem) {
        foundValue = testItem[ valueFieldForMetaTag( testItem ) ];
        if (returnAll) {
            allValues.push(foundValue);
        } else {
            return false;
        }
    });
    if (returnAll) {
        return allValues;
    } else {
        return foundValue;
    }
}

function valueFieldForMetaTag( metatag ) {
    // where does this metatag hold its main value?
    switch( metatag['@xsi:type']) {
        case 'nex:ResourceMeta':
            return '@href';  // uses special attribute
        case 'nex:LiteralMeta':
        default:
            return '$'; // assumes value is stored here
    }
}

function getMetaTagAccessorByAtProperty(array, propertyName, options) {
    // fetch accessor function(s) for a metatag in the specified list, using its @property value
    var foundAccessor = null;
    var returnAll = (typeof(options) === 'object' && options.FIND_ALL); // else return first match found
    var allAccessors = [ ];

    // adjust matchingTags to ensure uniform handling below
    var matchingTags = getNexsonChildByProperty(array, '@property', propertyName, options);
    matchingTags = makeArray( matchingTags );

    for (var i = 0; i < matchingTags.length; i++) {
        var testItem = matchingTags[i];
        switch(ko.unwrap(testItem['@xsi:type'])) {
            case 'nex:ResourceMeta':
                foundAccessor = testItem['@href'];  // uses special attribute
                break;
            default:
                foundAccessor = testItem.$; // assumes value is stored here
        }
        if (returnAll) {
            allAccessors.push(foundAccessor);
        } else {
            return foundAccessor;
        }
    }
    if (returnAll) {
        return allAccessors;
    } else {
        return null;
    }
}

function normalizeDecision( decision ) {
    // TODO: add expected tree properties and metadata, if missing
}

function getAllTreeIDs() {
    var allTrees = viewModel.elementTypes.tree.gatherAll(viewModel.nexml);
    return $.map(allTrees, function(tree, i) {
        return tree['@id'];
    });
}
function getAllTreeLabels() {
    var allTrees = viewModel.elementTypes.tree.gatherAll(viewModel.nexml);
    return $.map(allTrees, function(tree, i) {
        if (tree['@label']) {
            return tree['@label'];
        }
        return "Untitled ("+ tree['@id'] +")";
    });
}

function getTreesNominatedForSynthesis() {
    var allTrees = viewModel.elementTypes.tree.gatherAll(viewModel.nexml);
    return ko.utils.arrayFilter(
        allTrees,
        isQueuedForNewSynthesis
    );
}

function getTreesNotYetNominated() {
    var allTrees = viewModel.elementTypes.tree.gatherAll(viewModel.nexml);
    return ko.utils.arrayFilter(
        allTrees,
        function (tree) {
            return !(isQueuedForNewSynthesis(tree));
        }
    );
}

function getNodeCounts(tree) {
    // helper function that returns the total number nodes, total number
    // of tips and the number of tips mapped to OTT taxa
    var nodeCounts = {
      totalNodes: 0,
      totalTips: 0,
      mappedTips: 0
    }

    if (!tree || !tree.node || tree.node.length === 0) {
      return nodeCounts;
    }
    $.each(tree.node, function(i, node) {
        nodeCounts.totalNodes++;
        //console.log(i +' is a leaf? '+ node['^ot:isLeaf']);
        if (node['^ot:isLeaf'] !== true) {
            // this is not a leaf node! skip to the next one
            return true;
        }
        nodeCounts.totalTips++;

        if ('@otu' in node) {
            var otu = getOTUByID( node['@otu'] );
            var mappedLabel = $.trim(otu['^ot:ottTaxonName']);
            if (('^ot:ottId' in otu) && (mappedLabel !== '')) {
                nodeCounts.mappedTips++;
            }
        }
        return true;  // skip to next node
    });
    //console.log("total nodes? "+ nodeCounts.totalNodes);
    //console.log("total leaf nodes? "+ nodeCounts.totalTips);
    //console.log("mapped leaf nodes? "+ nodeCounts.mappedTips);

    return nodeCounts;
}

function getMappedTallyForTree(tree) {
    // return display-ready tally (mapped/total ratio and percentage)
    var thinSpace = '&#8201;';
    if (!tree || !tree.node || tree.node.length === 0) {
        return '<strong>0</strong><span>'+ thinSpace +'/'+ thinSpace + '0 &nbsp;</span><span style="color: #999;">(0%)</span>';
    } else {
      nodeCounts = getNodeCounts(tree);
      //console.log("total nodes? "+ nodeCounts.totalNodes);
      //console.log("total leaf nodes? "+ nodeCounts.totalTips);
      //console.log("mapped leaf nodes? "+ nodeCounts.mappedTips);

      return '<strong>'+ nodeCounts.mappedTips +'</strong><span>'+ thinSpace +'/'+ thinSpace + nodeCounts.totalTips +' &nbsp;</span><span style="color: #999;">('+ floatToPercent(nodeCounts.mappedTips/nodeCounts.totalTips) +'%)</span>';
    }
}

function getRootedDescriptionForTree( tree ) {
    // return display-ready description of tree root (arbitrary vs. biologically correct)
    if (!tree || !tree.node || tree.node.length === 0) {
        return 'Unrooted (empty)';
    }

    // Apply our "business rules" for tree and/or ingroup rooting, based on
    // tree-level metadata.
    var specifiedRoot = tree['^ot:specifiedRoot'] || null;
    var unrootedTree = tree['^ot:unrootedTree'];

    if (unrootedTree) {
        return '<span class="XXsuggestion-prompt">Unconfirmed (may be arbitrary)</span>';
    } else {
        return "Confirmed by curator";
    }
}
function showArbitraryRootExplanationInTreeViewer(tree) {
    // hint to tree viewer that we're focused on this property
    showTreeViewer(tree, {
        HIGHLIGHT_ARBITRARY_ROOT: true
    });
}
function getRootNodeDescriptionForTree( tree ) {
    // return display-ready description ('node123 [implicit]', 'node234 [explicit]', 'No root', ...)
    if (!tree || !tree.node || tree.node.length === 0) {
        return 'No root (empty tree)';
    }

    // Apply our "business rules" for tree and/or ingroup rooting, based on
    // tree-level metadata.
    var specifiedRoot = tree['^ot:specifiedRoot'] || null;
    var unrootedTree = tree['^ot:unrootedTree'];
    // if no specified root node, use the implicit root (first in nodes array)
    var rootNodeID = specifiedRoot ? specifiedRoot : tree.node[0]['@id'];

    var nodeName = ('Unnamed internal node');
    $.each(tree.node, function(i, node) {
        // Find the node with this ID and see if it has an assigned OTU
        if (node['@id'] === rootNodeID) {
            var nodeOTU = node['@otu'];
            if (nodeOTU) {
                // find the matching OTU and show its label
                $.each(viewModel.nexml.otus, function( i, otusCollection ) {
                    $.each(otusCollection.otu, function( i, otu ) {
                        // Find the node with this ID and see if it has an assigned OTU
                        if (otu['@id'] === nodeOTU) {
                            nodeName = $.trim(otu['^ot:ottTaxonName']) || 'Unlabeled OTU';
                        }
                    });
                });
            }
            return false; // stop checking nodes
        }
        return true;  // skip to next node
    });
    return nodeName;
}
function getRootedStatusForTree( tree ) {
    // return display-ready description ('<span class="caution">Biological root is ...</span>', ...)
    var biologicalRootMessage = 'Biological root is confirmed by the curator.';
    var arbitraryRootMessage = '<span class="interesting-value">Biological root is not confirmed (displayed root could be arbitrary).</span>';

    if (!tree || !tree.node || tree.node.length === 0) {
        return '';
    }

    // Apply our "business rules" for tree and/or ingroup rooting, based on
    // tree-level metadata.
    var unrootedTree = tree['^ot:unrootedTree'];
    if (unrootedTree) {
        return arbitraryRootMessage;
    }
    return biologicalRootMessage;
}

// N.B. It's possible (but rare) that some-but-not-all edges will have length!
// Let's check for some/all/none with separate functions.
function anyBranchLengthsFoundInTree( tree ) {
    var foundBranchWithLength = false;
    $.each(tree.edge, function(i, edge) {
        if ('@length' in edge) {
            foundBranchWithLength = true;
            return false; // stop looking
        }
    });
    return foundBranchWithLength;
}
function allBranchLengthsFoundInTree( tree ) {
    var foundBranchWithoutLength = false;
    $.each(tree.edge, function(i, edge) {
        if (!('@length' in edge)) {
            foundBranchWithoutLength = true;
            return false; // stop looking
        }
    });
    return !(foundBranchWithoutLength);
}
function noBranchLengthsFoundInTree( tree ) {
    return !(anyBranchLengthsFoundInTree(tree));
}
var branchLengthModeDescriptions = [
    { value: 'ot:undefined', text: "Choose one..." },
    { value: 'ot:substitutionCount', text: "Expected number of changes per site" },
    { value: 'ot:changesCount', text: "Estimated number of changes" },
    { value: 'ot:time', text: "Time" },  //  TODO: add units from ot:branchLengthTimeUnit
    { value: 'ot:bootstrapValues', text: "Bootstrap values" },
    { value: 'ot:posteriorSupport', text: "Posterior support values" },
    { value: 'ot:other', text: "Other (describe)" }  // TODO: refer ot:branchLengthDescription
]
function getBranchLengthModeDescriptionForTree( tree ) {
    var rawModeValue = tree['^ot:branchLengthMode'];
    if (!rawModeValue || (rawModeValue === 'ot:undefined')) {
        if (anyBranchLengthsFoundInTree(tree)) {
            return 'Unspecified (needs review)';
        } else {
            return 'No branch lengths found';
        }
    }
    var description = rawModeValue;
    $.each( branchLengthModeDescriptions, function( i, item ) {
        if (item.value === rawModeValue) {
            description = item.text;
            return false;
        }
        return true;
    });
    // some values require a closer look
    switch( rawModeValue ) {
        case 'ot:time':
            var displayUnit = getBranchLengthUnitForTree( tree );
            return description +" ("+ displayUnit +")";
            break;
        case 'ot:other':
            return getBranchLengthDescriptionForTree( tree );
            break;
        default:
            return description;
    }
}
function getBranchLengthUnitForTree( tree ) {
    return tree['^ot:branchLengthTimeUnit'] || "Myr?";
}
function getBranchLengthDescriptionForTree( tree ) {
    // NOTE that this is an explicit description in its own field, for
    // use when 'ot:other' is specified for the branchLengthMode!
    return tree['^ot:branchLengthDescription'] || "Undefined";
}

function getInGroupCladeDescriptionForTree( tree ) {
    // Return display-ready description of a tree's ingroup clade (for tree list).

    var nodeID = tree['^ot:inGroupClade'];
    if (!nodeID) {
        return 'Unspecified';
    }
    var nodeName = ('Unnamed internal node');

    // try to retrieve a recognizable taxon label for the ingroup clade's root
    var node = getTreeNodeByID( tree, nodeID );
    if (node && '@otu' in node) {
        var otu = getOTUByID( node['@otu'] );
        if (otu) {
            nodeName = $.trim(otu['^ot:ottTaxonName']) || 'Unlabeled OTU';
        }
    }
    // TODO: return link to taxo-browser?
    return nodeName;
}

function getSynthStatusDescriptionForTree( tree ) {
    // Did this tree contribute to the latest synthesis?
    var contributedToLastSynth = contributedToLastSynthesis(tree);
    // Is this tree in a collection that will contribute to the next synthesis?
    var queuedForNextSynth = isQueuedForNewSynthesis(tree);
    // Are there any listed reasons to exclude this tree?
    var thereAreReasonsToExclude = tree['^ot:reasonsToExcludeFromSynthesis'] && (tree['^ot:reasonsToExcludeFromSynthesis'].length > 0);
    // Does this tree meet minimum standards for synthesis?
    var validForSynthesis = treeIsValidForSynthesis(tree);

    if (contributedToLastSynth) {
        if (queuedForNextSynth) {
            if (thereAreReasonsToExclude) {
                return "Included despite warnings";
            } else {
                return "Included";
            }
        } else {
            return "To be removed";
        }
    } else {
        if (queuedForNextSynth) {
            if (thereAreReasonsToExclude) {
                return "Queued despite warnings";
            } else {
                return "Queued";
            }
        } else {
            if (!validForSynthesis) {
                return "Needs curation";
            } else if (thereAreReasonsToExclude) {
                return "Excluded";
            } else {
                // This indicates a new, unreviewed tree (or out-of-band collection editing)
                return "Needs review";
            }
        }
    }
}

function getTreeSynthStatusSummary( tree ) {
    // This appears in the tree-synth details popup
    // Did this tree contribute to the latest synthesis?
    var contributedToLastSynth = contributedToLastSynthesis(tree);
    // Is this tree in a collection that will contribute to the next synthesis?
    var queuedForNextSynth = isQueuedForNewSynthesis(tree);
    // Are there any listed reasons to exclude this tree?
    var thereAreReasonsToExclude = tree['^ot:reasonsToExcludeFromSynthesis'] && (tree['^ot:reasonsToExcludeFromSynthesis'].length > 0);
    // TODO: fetch and include the latest synth version)?
    if (contributedToLastSynth) {
        if (queuedForNextSynth) {
            if (thereAreReasonsToExclude) {
                return 'This tree <strong>was included</strong> in the '
                      +'<a href="/about/synthesis-release" target="_blank">latest synthetic tree</a>, '
                      +'and it is <strong>queued</strong> '
                      +'for future synthesis, despite the warnings listed below.';
            } else {
                return 'This tree <strong>was included</strong> in the '
                      +'<a href="/about/synthesis-release" target="_blank">latest synthetic tree</a>, '
                      +'and it is <strong>queued</strong> '
                      +'for future synthesis.';
            }
        } else {
                return 'This tree <strong>was included</strong> in the '
                      +'<a href="/about/synthesis-release" target="_blank">latest synthetic tree</a>, '
                      +'but it is <strong>not queued</strong> '
                      +'for future synthesis.';
        }
    } else {
        if (queuedForNextSynth) {
            if (thereAreReasonsToExclude) {
                return 'This tree was <strong>not included</strong> in the '
                      +'<a href="/about/synthesis-release" target="_blank">latest synthetic tree</a>, '
                      +'but it is <strong>queued</strong> '
                      +'for future synthesis, despite the warnings listed below.';
            } else {
                return 'This tree was <strong>not included</strong> in the '
                      +'<a href="/about/synthesis-release" target="_blank">latest synthetic tree</a>, '
                      +'but it is <strong>queued</strong> '
                      +'for future synthesis.';
            }
        } else {
            if (thereAreReasonsToExclude) {
                return 'This tree was <strong>not included</strong> in the '
                      +'<a href="/about/synthesis-release" target="_blank">latest synthetic tree</a>, '
                      +'and it is <strong>not queued</strong> '
                      +'for future synthesis.';
            } else {
                // This indicates a new, unreviewed tree (or out-of-band collection editing)
                return 'This tree was <strong>not included</strong> in the '
                      +'<a href="/about/synthesis-release" target="_blank">latest synthetic tree</a>, '
                      +'and it is <strong>not currently queued</strong> '
                      +'for future synthesis.';
            }
        }
    }
}

function contributedToLastSynthesis(tree) {
    // Check this tree against latest-synth details
    return ($.inArray(tree['@id'], latestSynthesisTreeIDs) !== -1);
}
function isQueuedForNewSynthesis(tree) {
    // Check to see if this tree is listed in last-known input collections
    /* N.B. that this service "concatenates" all synth-input collections into a
     * single, artificial "collection" with contributors and decisions/trees,
     * but no name or description, see
     * <https://github.com/OpenTreeOfLife/peyotl/blob/33b493e84558ffef381d841986281be352f3da53/peyotl/collections_store/__init__.py#L46>
     */
    if (!(treesQueuedForSynthesis) || !('decisions' in treesQueuedForSynthesis)) {
        console.error("No queued-trees data found!");
        return false;
    }
    var foundTree = false;
    $.each(treesQueuedForSynthesis.decisions, function(i, treeDecision) {
        if ((treeDecision.collectionID === collectionID) &&
            (treeDecision.treeID === tree['@id'])) {
            foundTree = true;
            return false;
        }
    });
    return foundTree;
}

function testForPossibleTreeInclusion(tree) {
    // return true if it can be included, else false
    if (isQueuedForNewSynthesis(tree)) {
        return false;
    }
    if (!treeIsValidForSynthesis(tree)) {
        return false;
    }
    return true;
}
function testForPossibleTreeExclusion(tree) {
    // return true if it can be excluded, else false
    return (isQueuedForNewSynthesis(tree));
}


/* implement a basic "dirty" flag (to manage Save buttons, etc.), as described here:
 * http://www.knockmeout.net/2011/05/creating-smart-dirty-flag-in-knockoutjs.html
 */
ko.dirtyFlag = function(root, isInitiallyDirty) {
    var result = function() {},
        _initialState = ko.observable(ko.toJSON(root)),
        _isInitiallyDirty = ko.observable(isInitiallyDirty);

    result.isDirty = ko.computed(function() {
        try {
            return _isInitiallyDirty() || _initialState() !== ko.toJSON(root);
        } catch(e) {
            //console.log('toJSON fails with circular reference');
            return true;
        }
    });

    result.reset = function() {
        _initialState(ko.toJSON(root));
        _isInitiallyDirty(false);
    };

    return result;
};

function getTreeByID(id) {
    var allTrees = [];
    if (!viewModel) {
        return null;
    }

    if (!tree) {
        // if tree is not specified, check for options.HIGHLIGHT_PLAYLIST
        // and show the specified node (in its proper tree)
        if (options.HIGHLIGHT_PLAYLIST) {
            var currentPos = options.HIGHLIGHT_POSITION || 0;
            var currentHighlight = options.HIGHLIGHT_PLAYLIST[ currentPos ];
            tree = getTreeByID(currentHighlight.treeID);
            highlightNodeID = currentHighlight.nodeID;
        }
        if (!tree) {
            // this should *never* happen
            alert("showTreeViewer(): No tree specified!");
            return;
        }
    }

    if (viewOrEdit == 'EDIT') {
        if (treeTagsInitialized) {
            $('#tree-tags').tagsinput('destroy');
            treeTagsInitialized = false;
        }
    }
}

/* TODO: use this after Save, etc?
function replaceViewModelNexson( nexml ) {
    // gently replace our live study NexSON and refresh the UI
    viewModel.nexml = nexml;

    // "lookups" should be purged of all stale ids
    clearFastLookup('ALL');

    // reset highest-ID markers (these might have changed)
    clearAllHighestIDs();

    // refresh the complete curation UI, via ticklers
    nudgeTickler('ALL');
}
*/

function cloneFromSimpleObject( obj, options ) {
    // use this to create simple, observable objects (eg, metatags)
    return $.extend( true, {}, obj);
}

// For older browsers (IE <=8), provide Date.toISOString if not defined
// http://stackoverflow.com/a/11440625
if (!Date.prototype.toISOString) {
    // Here we rely on JSON serialization for dates because it matches
    // the ISO standard. However, we check if JSON serializer is present
    // on a page and define our own .toJSON method only if necessary
    if (!Date.prototype.toJSON) {
        Date.prototype.toJSON = function (key) {
            function f(n) {
                // Format integers to have at least two digits.
                return n < 10 ? '0' + n : n;
            }
            return this.getUTCFullYear()   + '-' +
                f(this.getUTCMonth() + 1) + '-' +
                f(this.getUTCDate())      + 'T' +
                f(this.getUTCHours())     + ':' +
                f(this.getUTCMinutes())   + ':' +
                f(this.getUTCSeconds())   + 'Z';
        };
    }
    Date.prototype.toISOString = Date.prototype.toJSON;
}

/* TODO: Still useful?
function removeTree( tree ) {
    // let's be sure, since adding may be slow...
    if (!confirm("Are you sure you want to delete this tree from the study?")) {
        return;
    }

    // remove this tree
    $.each(viewModel.nexml.trees, function(i, treesCollection) {
        if ($.inArray(tree, treesCollection.tree) !== -1) {
            removeFromArray( tree, treesCollection.tree );
        }
    });

    // force update of curation UI in all relevant areas
    nudgeTickler('GENERAL_METADATA');
    nudgeTickler('TREES');
    nudgeTickler('COLLECTION_HAS_CHANGED');
}
*/

function forceToggleCheckbox(cb, newState) {
    var $cb = $(cb);
    switch(newState) {
        case (true):
            if ($cb.is(':checked') == false) {
                $cb.prop('checked', true);
                $cb.triggerHandler('click');
            }
            break;
        case (false):
            if ($cb.is(':checked')) {
                $cb.prop('checked', false);
                $cb.triggerHandler('click');
            }
            break;
        default:
            console.error("forceToggleCheckbox() invalid newState <"+ typeof(newState) +">:");
            console.error(newState);
            return;
    }
}

/* Define a registry of nudge methods, for use in KO data bindings. Calling
 * a nudge function will update one or more observables to trigger updates
 * in the curation UI. This approach allows us to work without observables,
 * which in turn means we can edit enormous viewmodels.
 */
var nudge = {
    'GENERAL_METADATA': function( data, event ) {
        nudgeTickler( 'GENERAL_METADATA');
        return true;
    },
    'TREES': function( data, event ) {
        nudgeTickler( 'TREES');
        return true;
    }
}
function nudgeTickler( name ) {
    if (name === 'ALL') {
        for (var aName in viewModel.ticklers) {
            nudgeTickler( aName );
        }
        return;
    }

    var tickler = viewModel.ticklers[ name ];
    if (!tickler) {
        console.error("No such tickler: '"+ name +"'!");
        return;
    }
    var oldValue = tickler.peek();
    tickler( oldValue + 1 );

    // nudge the main 'dirty flag' tickler
    viewModel.ticklers.COLLECTION_HAS_CHANGED( viewModel.ticklers.COLLECTION_HAS_CHANGED.peek() + 1 );
}

function getFastLookup( lookupName ) {
    // return (or build) a flat list of Nexson elements by ID
    if (lookupName in viewModel.fastLookups) {
        if (viewModel.fastLookups[ lookupName ] === null) {
            buildFastLookup( lookupName );
        }
    }

            case 'TREES_BY_NAME':
                // assumes that all OTU ids are unique, across all trees
                var allTrees = viewModel.elementTypes.tree.gatherAll(viewModel.nexml);
                $.each(allTrees, function( i, tree ) {
                    $.each(tree.node, function( i, node ) {
                        var itsID = node['@otu'];
                        if (itsID in newLookup) {
                            console.warn("Duplicate otu ID '"+ itsID +"' found ["+ lookupName +"]");
                        }
                        newLookup[ itsID ] = tree;
                    });
                });
                break;

        }
        viewModel.fastLookups[ lookupName ] = newLookup;
    } else {
        console.error("No such lookup as '"+ lookupName +"'!");
    }
}
function clearFastLookup( lookupName ) {
    // clear chosen lookup, on demand (eg, after merging in new OTUs)
    if (lookupName === 'ALL') {
        for (var aName in viewModel.fastLookups) {
            viewModel.fastLookups[ aName ] = null;
        }
        return;
    } else if (lookupName in viewModel.fastLookups) {
        viewModel.fastLookups[ lookupName ] = null;
        return;
    }
    console.error("No such lookup as '"+ lookupName +"'!");
}

/* Sensible autocomplete behavior requires the use of timeouts
 * and sanity checks for unchanged content, etc.
 */
clearTimeout(searchTimeoutID);  // in case there's a lingering search from last page!
var searchTimeoutID = null;
var searchDelay = 1000; // milliseconds
var hopefulSearchName = null;
function setTaxaSearchFuse(e) {
    if (searchTimeoutID) {
        // kill any pending search, apparently we're still typing
        clearTimeout(searchTimeoutID);
    }
    // reset the timeout for another n milliseconds
    searchTimeoutID = setTimeout(searchForMatchingTaxa, searchDelay);

    /* If the last key pressed was the ENTER key, stash the current (trimmed)
     * string and auto-jump if it's a valid taxon name.
     */
    if (e.type === 'keyup') {
        switch (e.which) {
            case 13:
                hopefulSearchName = $('input[name=taxon-search]').val().trim();
                autoApplyExactMatch();  // use existing menu, if found
                break;
            case 17:
                // do nothing (probably a second ENTER key)
                break;
            case 39:
            case 40:
                // down or right arrows should try to select first result
                $('#search-results a:eq(0)').focus();
                break;
            default:
                hopefulSearchName = null;
        }
    } else {
        hopefulSearchName = null;
    }
}

var showingResultsForSearchText = '';
var showingResultsForSearchContextName = '';
function searchForMatchingTaxa() {
    // clear any pending search timeout and ID
    clearTimeout(searchTimeoutID);
    searchTimeoutID = null;

    var $input = $('input[name=taxon-search]');
    var searchText = $input.val().trimLeft();

    if (searchText.length === 0) {
        $('#search-results').html('');
        return false;
    } else if (searchText.length < 2) {
        $('#search-results').html('<li class="disabled"><a><span class="text-error">Enter two or more characters to search</span></a></li>');
        $('#search-results').dropdown('toggle');
        return false;
    }

    // groom trimmed text based on our search rules
    var searchContextName = $('select[name=taxon-search-context]').val();

    // is this unchanged from last time? no need to search again..
    if ((searchText == showingResultsForSearchText) && (searchContextName == showingResultsForSearchContextName)) {
        ///console.log("Search text and context UNCHANGED!");
        return false;
    }

    // stash these to use for later comparison (to avoid redundant searches)
    var queryText = searchText; // trimmed above
    var queryContextName = searchContextName;
    $('#search-results').html('<li class="disabled"><a><span class="text-warning">Search in progress...</span></a></li>');
    $('#search-results').show();
    $('#search-results').dropdown('toggle');

    $.ajax({
        global: false,  // suppress web2py's aggressive error handling
        url: doTNRSForAutocomplete_url,  // NOTE that actual server-side method name might be quite different!
        type: 'POST',
        dataType: 'json',
        data: JSON.stringify({
            "name": searchText,
            "context_name": searchContextName,
            "include_suppressed": false
        }),  // data (asterisk required for completion suggestions)
        crossDomain: true,
        contentType: "application/json; charset=utf-8",
        success: function(data) {    // JSONP callback
            // stash the search-text used to generate these results
            showingResultsForSearchText = queryText;
            showingResultsForSearchContextName = queryContextName;

            $('#search-results').html('');
            var maxResults = 100;
            var visibleResults = 0;
            /*
             * The returned JSON 'data' is a simple list of objects. Each object is a matching taxon (or name?)
             * with these properties:
             *      ott_id         // taxon ID in OTT taxonomic tree
             *      unique_name    // the taxon name, or unique name if it has one
             *      is_higher      // points to a genus or higher taxon? T/F
             */
            if (data && data.length && data.length > 0) {
                // sort results to show exact match(es) first, then higher taxa, then others
                // initial sort on higher taxa (will be overridden by exact matches)
                // N.B. As of the v3 APIs, an exact match will be returned as the only result.
                data.sort(function(a,b) {
                    if (a.is_higher === b.is_higher) return 0;
                    if (a.is_higher) return -1;
                    if (b.is_higher) return 1;
                });

                // show all sorted results, up to our preset maximum
                var matchingNodeIDs = [ ];  // ignore any duplicate results (point to the same taxon)
                for (var mpos = 0; mpos < data.length; mpos++) {
                    if (visibleResults >= maxResults) {
                        break;
                    }
                    var match = data[mpos];
                    var matchingName = match.unique_name;
                    var matchingID = match.ott_id;
                    if ($.inArray(matchingID, matchingNodeIDs) === -1) {
                        // we're not showing this yet; add it now
                        $('#search-results').append(
                            '<li><a href="'+ matchingID +'">'+ matchingName +'</a></li>'
                        );
                        matchingNodeIDs.push(matchingID);
                        visibleResults++;
                    }
                }

                $('#search-results a')
                    .click(function(e) {
                        var $link = $(this);
                        // modify focal clade name and ottid
                        viewModel.nexml['^ot:focalCladeOTTTaxonName'] = $link.text();
                        viewModel.nexml['^ot:focalClade'] = $link.attr('href');
                        // hide menu and reset search field
                        $('#search-results').html('');
                        $('#search-results').hide();
                        $('input[name=taxon-search]').val('');
                        nudgeTickler('GENERAL_METADATA');
                    });
                $('#search-results').dropdown('toggle');

                autoApplyExactMatch();
            } else {
                $('#search-results').html('<li class="disabled"><a><span class="muted">No results for this search</span></a></li>');
                $('#search-results').dropdown('toggle');
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            // report errors or malformed data, if any (else ignore)
            if (textStatus !== 'success') {
                if (jqXHR.status >= 500) {
                    // major TNRS error! offer the raw response for tech support
                    var errMsg = jqXHR.statusText +' ('+ jqXHR.status +') searching for<br/>'
+'<strong style="background-color: #edd; padding: 0 3px; margin: 0 -3px;">'+ queryText +'</strong><br/>'
+'Please modify your search and try again.<br/>'
+'<span class="detail-toggle" style="text-decoration: underline !important;">Show details in footer</span>';
                    $('#search-results').html('<li class="disabled"><a><span style="color: #933;">'+ errMsg +'</span></a></li>');
                    var errDetails = 'TNRS error details:<pre class="error-details">'+ jqXHR.responseText +'</pre>';
                    $('#search-results').find('span.detail-toggle').click(function(e) {
                        e.preventDefault();
                        showErrorMessage(errDetails);
                        return false;
                    });
                    $('#search-results').dropdown('toggle');
                }
            }
            return;
        }
    });

    return false;
}

function showCollectionCommentEditor() {
    $('#edit-comment-button').addClass('active');
    $('#preview-comment-button').removeClass('active');
    $('#comment-preview').hide();
    $('#comment-editor').show();
}
function fetchRenderedMarkdown(successCallback, failureCallback) {
    $.ajax({
        crossdomain: true,
        type: 'POST',
        url: render_markdown_url,
        data: {'src': viewModel.nexml['^ot:comment']},
        success: successCallback,
        error: failureCallback
    });
}
function updateCollectionRenderedComment() {
    // just update our pre-rendered curation notes
    fetchRenderedMarkdown(
        // success callback
        function( data, textstatus, jqxhr ) {
            viewModel['commentHTML'] = data;
            nudgeTickler('GENERAL_METADATA');
        },
        // failure callback (just show raw markdown)
        function(jqXHR, textStatus, errorThrown) {
            // report errors or malformed data, if any
            viewModel['commentHTML'] = viewModel['description'];
            nudgeTickler('GENERAL_METADATA');
        }
    );
}
function showCollectionCommentPreview() {
    // show spinner? no, it's really quick
    $('#edit-comment-button').removeClass('active');
    $('#preview-comment-button').addClass('active');
    // stash and restore the current scroll position, lest it jump
    var savedPageScroll = $('body').scrollTop();
    fetchRenderedMarkdown(
        // success callback
        function( data, textstatus, jqxhr ) {
            $('#comment-preview').html(data);
            $('#comment-preview').show();
            //setTimeout(function() {
                $('body').scrollTop(savedPageScroll);
            //}, 10);
            $('#comment-editor').hide();
        },
        // failure callback
        function(jqXHR, textStatus, errorThrown) {
            // report errors or malformed data, if any
            var errMsg;
            if (jqXHR.responseText.length === 0) {
                errMsg = 'Sorry, there was an error rendering this Markdown. (No more information is available.)';
            } else {
                errMsg = 'Sorry, there was an error rendering this Markdown. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">Show details</a><pre class="error-details" style="display: none;">'+ jqXHR.responseText +'</pre>';
            }
            showErrorMessage(errMsg);
        }
    );
}

/* TODO: support these checks for collection?
function studyContributedToLatestSynthesis() {
    // check for a valid SHA from last synthesis
    return ($.trim(latestSynthesisSHA) !== '');
}
function currentStudyVersionContributedToLatestSynthesis() {
    // compare SHA values and return true if they match
    return (viewModel.startingCommitSHA === latestSynthesisSHA);
}
*/

function showCollectionMetadata() {
    // show details in a popup (already bound)
    $('#collection-metadata-popup').off('hidden').on('hidden', function () {
        updateCollectionRenderedComment();
        nudgeTickler('GENERAL_METADATA');
    });
    $('#collection-metadata-popup').modal('show');
}

/* TODO: adapt for use here?
function addCurrentTreeToCollection( collection ) {
    // gather default information about the current study and tree
    var currentStudyID = $('#current-study-id').val();
    var currentTreeID = $('#current-tree-id').val();
    var currentStudy = viewModel.nexml;
    var currentTree = getTreeByID(currentTreeID);
    var compactStudyRef = fullToCompactReference(currentStudy['^ot:studyPublicationReference']);
    if (compactStudyRef === '(Untitled)') {
        // strip the original parentheses to avoid extras
        compactStudyRef = 'study has no reference';
    }
    // capture the current tree name and study reference
    // TODO: update these as studies change?
    var currentTreeName = $.trim(currentTree['@label']);
    var treeAndStudy = (currentTreeName || currentTreeID) +' ('+ compactStudyRef +')';
    var treeEntry = {
        "decision": "INCLUDED",
        "name": treeAndStudy,
        "studyID": currentStudyID,
        "treeID": currentTreeID,
        "SHA": "",    // TODO: capture this (already expected by server-side validation)
        "comments": ""
    };
    if ('data' in collection) {
        collection.data.decisions.push(treeEntry);
    } else {
        collection.decisions.push(treeEntry);
    }
    addPendingCollectionChange( 'ADD', currentStudyID, currentTreeID );

    // to refresh the list
    //showCollectionViewer( collection, {SCROLL_TO_BOTTOM: true} );
    editCollection( collection, {SCROLL_TO_BOTTOM: true} );
}

function addTreeToNewCollection() {
    if (userIsLoggedIn()) {
        var c = createNewTreeCollection();
        addCurrentTreeToCollection(c);
        showCollectionViewer( c, {SCROLL_TO_BOTTOM: true} );
    } else {
        if (confirm('This requires login via Github. OK to proceed?')) {
            loginAndReturn();
        }
    }
}
*/

