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
     * :EXAMPLE: GET http://api.opentreeoflife.org/1/collection/{23}.json
     *
     * Offer a visible progress bar (studies can be very large)
     *
     * Gracefully handle and report:
     *  - remote service not available
     *  - collection missing or not found
     *  - too-large studies? will probably choke on parsing
     *  - misc errors from API
     *  - any local storage (in Lawnchair) that trumps the one in remote storage
     */

    var fetchURL = API_load_collection_GET_url.replace('{STUDY_ID}', collectionID);

    // TEST URL with local JSON file
    ///fetchURL = '/curator/static/1003.json';

    // TODO: try an alternate URL, pulling directly from GitHub?

    showModalScreen("Loading collection data...", {SHOW_BUSY_BAR:true});

    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: fetchURL,
        data: {
            'output_nexml2json': '1.0.0',  // '0.0', '1.0', '1.2', '1.2.1'
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
            if (typeof data !== 'object' || typeof(data['nexml']) == 'undefined') {
                showErrorMessage('Sorry, there is a problem with the collection data (missing NexSON).');
                return;
            }

            // a new collection might now have its ID assigned yet; if so, do it now
            if (data.nexml['^ot:collectionId'] === "") {
                console.log(">>> adding collection ID to a new NexSON document");
                data.nexml['^ot:collectionId'] = collectionID;
            }

            viewModel = data;

            /* To help in creating new elements, Keep track of the highest ID
             * currently in use for each element type, as well as its preferred
             * ID prefix and a function to gather all instances.
             *
             * Note that in each case, we expect text IDs (eg, "message987") but keep
             * simple integer tallies to show determine the next available ID in the
             * current collection.
             *
             * N.B. Unless otherwise specified with a 'prefix' property, the
             * key in each case is also the preferred prefix.
             */
            viewModel.elementTypes = {
                'edge': {
                    highestOrdinalNumber: null,
                    gatherAll: function(nexml) {
                        // return an array of all matching elements
                        var allEdges = [];
                        var allTrees = viewModel.elementTypes.tree.gatherAll(nexml);
                        $.each(allTrees, function( i, tree ) {
                            $.merge(allEdges, tree.edge );
                        });
                        return allEdges;
                    }
                },
                'node': {
                    highestOrdinalNumber: null,
                    gatherAll: function(nexml) {
                        // return an array of all matching elements
                        var allNodes = [];
                        var allTrees = viewModel.elementTypes.tree.gatherAll(nexml);
                        $.each(allTrees, function( i, tree ) {
                            $.merge(allNodes, tree.node );
                        });
                        return allNodes;
                    }
                },
                'otu': {
                    highestOrdinalNumber: null,
                    gatherAll: function(nexml) {
                        // return an array of all matching elements
                        var allOTUs = [];
                        $.each(nexml.otus, function( i, otusCollection ) {
                            $.merge(allOTUs, otusCollection.otu );
                        });
                        return allOTUs;
                    }
                },
                'otus': {   // a collection of otu elements
                    highestOrdinalNumber: null,
                    gatherAll: function(nexml) {
                        // return an array of all matching elements
                        return makeArray(nexml.otus);
                    }
                },
                'tree': {
                    highestOrdinalNumber: null,
                    gatherAll: function(nexml) {
                        // return an array of all matching elements
                        var allTrees = [];
                        var allTreesCollections = viewModel.elementTypes.trees.gatherAll(nexml);
                        $.each(allTreesCollections, function(i, treesCollection) {
                            $.each(treesCollection.tree, function(i, tree) {
                                allTrees.push( tree );
                            });
                        });
                        return allTrees;
                    }
                },
                'trees': {   // a collection of tree elements
                    highestOrdinalNumber: null,
                    gatherAll: function(nexml) {
                        // return an array of all matching elements
                        return makeArray(nexml.trees);
                    }
                },
                'annotation': {  // an annotation event
                    highestOrdinalNumber: null,
                    gatherAll: function(nexml) {
                        return makeArray(nexml['^ot:annotationEvents']);
                    }
                },
                'agent': {  // an annotation agent
                    highestOrdinalNumber: null,
                    gatherAll: function(nexml) {
                        return makeArray(nexml['^ot:agents']);
                    }
                },
                'message': {  // an annotation message
                    highestOrdinalNumber: null,
                    gatherAll: getAllAnnotationMessagesInStudy
                },

            }

            // add missing collection metadata tags (with default values)
            if (!(['^ot:studyPublicationReference'] in data.nexml)) {
                data.nexml['^ot:studyPublicationReference'] = "";
            }
            if (['^ot:studyPublication'] in data.nexml) {
                // Convert a "bare" DOI, if found (e.g. from TreeBASE import)
                var oldValue = data.nexml['^ot:studyPublication']['@href'];
                var newValue = DOItoURL( oldValue );
                if (newValue !== oldValue) {
                    data.nexml['^ot:studyPublication']['@href'] = newValue;
                }
            } else {
                data.nexml['^ot:studyPublication'] = {
                    '@href': ""
                };
            }
            if (['^ot:curatorName'] in data.nexml) {
                // NOTE that this construction creates n metatags in NeXML,
                // instead of a single metatag with an array as its value
                data.nexml['^ot:curatorName'] =
                    makeArray(data.nexml['^ot:curatorName']);
            } else {
                data.nexml['^ot:curatorName'] = [ ];
            }
            if (!(['^ot:collectionId'] in data.nexml)) {
                data.nexml['^ot:studyId'] = "";
            }
            if (!(['^ot:studyYear'] in data.nexml)) {
                data.nexml['^ot:studyYear'] = "";
            }
            if (!(['^ot:focalClade'] in data.nexml)) {
                data.nexml['^ot:focalClade'] = null // OR ""?
            }
            if (!(['^ot:focalCladeOTTTaxonName'] in data.nexml)) {
                data.nexml['^ot:focalCladeOTTTaxonName'] = "";
            }
            if (['^ot:notIntendedForSynthesis'] in data.nexml) {
                // Remove deprecated property (now reckoned indirectly, per-tree)
                delete data.nexml['^ot:notIntendedForSynthesis'];
            }
            if (!(['^ot:comment'] in data.nexml)) {
                data.nexml['^ot:comment'] = "";
            }
            if (['^ot:dataDeposit'] in data.nexml) {
                // Convert a "bare" DOI, if found (e.g. from TreeBASE import)
                var oldValue = data.nexml['^ot:dataDeposit']['@href'];
                var newValue = DOItoURL( oldValue );
                if (newValue !== oldValue) {
                    data.nexml['^ot:dataDeposit']['@href'] = newValue;
                }
            } else {
                data.nexml['^ot:dataDeposit'] = {
                    '@href': ""
                };
            }

            // NOTE that we should "pluralize" existing arrays, in case
            // Badgerfish conversion has replaced it with a single item
            if ('^ot:candidateTreeForSynthesis' in data.nexml) {
                // remove legacy (inner) 'candidate' array, if found!
                if ('candidate' in data.nexml['^ot:candidateTreeForSynthesis']) {
                    data.nexml['^ot:candidateTreeForSynthesis'] = data.nexml['^ot:candidateTreeForSynthesis'].candidate;
                }
                data.nexml['^ot:candidateTreeForSynthesis'] =
                    makeArray(data.nexml['^ot:candidateTreeForSynthesis']);
            } else {
                data.nexml['^ot:candidateTreeForSynthesis'] = [ ];
            }
            if ('^ot:tag' in data.nexml) {
                data.nexml['^ot:tag'] = makeArray(data.nexml['^ot:tag']);
            } else {
                data.nexml['^ot:tag'] = [ ];
            }

            // add study-level containers for annotations
            if (['^ot:annotationEvents'] in data.nexml) {
                data.nexml['^ot:annotationEvents'].annotation =
                    makeArray(data.nexml['^ot:annotationEvents'].annotation);

                // pluralize the messages of any annotations found
                $.each( data.nexml['^ot:annotationEvents'].annotation, function(i, annotation) {
                    annotation.message = makeArray( annotation.message );
                });
            } else {
                data.nexml['^ot:annotationEvents'] = {
                    'annotation': []
                }
            }
            if (['^ot:agents'] in data.nexml) {
                data.nexml['^ot:agents'].agent =
                    makeArray(data.nexml['^ot:agents'].agent);
            } else {
                data.nexml['^ot:agents'] = {
                    'agent': []
                }
            }
            // pluralize messages in old locations (if any)
            if (['^ot:messages'] in data.nexml) {
                data.nexml['^ot:messages'].message =
                    makeArray(data.nexml['^ot:messages'].message);
            }

            // move any old-style messages to new location
            relocateLocalAnnotationMessages( data.nexml );
            // NOW initialize the next-available message ID
            getNextAvailableElementID( 'message', data.nexml );

            // add agent singleton for this curation tool
            var curatorAgent;
            var isCurrentCurationTool = function(agent) {
                var curatorAnnotationAgentInfo = nexsonTemplates[ 'curator annotation agent' ];
                return (agent['@name'] === curatorAnnotationAgentInfo['@name'])
                    && (agent['@version'] && agent['@version'] === curatorAnnotationAgentInfo['@version']);
            }
            if (!agentExists( isCurrentCurationTool, data.nexml )) {
                addAgent(
                    cloneFromNexsonTemplate('curator annotation agent'),
                    data.nexml
                );
            }
            curatorAgent = getAgent( isCurrentCurationTool, data.nexml);

            // add baseline (empty) annotation for OTU mapping hints
            if (getOTUMappingHints(data.nexml) === null) {
                var hintsAnnotationBundle = $.extend(
                    {
                        targetElement: data.nexml,
                        agent: curatorAgent
                    },
                    nexsonTemplates['OTU mapping hints']
                );
                createAnnotation( hintsAnnotationBundle, data.nexml );
            }

            // add baseline (empty) annotation for supporting files
            if (getSupportingFiles(data.nexml) === null) {
                ///data.nexml.meta.push( cloneFromNexsonTemplate('supporting files') );
                var filesAnnotationBundle = $.extend(
                    {
                        targetElement: data.nexml,
                        agent: curatorAgent
                    },
                    nexsonTemplates['supporting files']
                );
                createAnnotation( filesAnnotationBundle, data.nexml );
            } else {
                // update old @sourceForTree properties, if found
                $.each(getSupportingFiles(data.nexml).data.files.file, function(i, fileInfo) {
                    if ('@sourceForTree' in fileInfo) {
                        fileInfo['sourceForTree'] = [ ];
                        var foundName = $.trim(fileInfo['@sourceForTree']);
                        if (foundName !== '') {
                            // move simple string to new array of BadgerFish elements
                            fileInfo['sourceForTree'].push({
                                "$": foundName
                            });
                        }
                        delete fileInfo['@sourceForTree'];
                    }
                });
            }

            // keep track of the SHA (git commit ID) that corresponds to this version of the collection
            viewModel.startingCommitSHA = response['sha'] || 'SHA_NOT_PROVIDED';

            // get initial rendered HTML for study comment (from markdown)
            viewModel.commentHTML = response['commentHTML'] || 'COMMENT_HTML_NOT_PROVIDED';

            // get (and maintain) a list of any known duplicate studies (with matching DOIs)
            viewModel.duplicateStudyIDs = ko.observableArray(
                response['duplicateStudyIDs'] || [ ]
            );

            // we should also now have the full commit history of this NexSON
            // study in the docstore repo
            viewModel.versions = ko.observableArray(
                response['versionHistory'] || [ ]
            ).asPaged(20);

            // add external URLs (on GitHub) for the differences between versions
            if (response['shardName']) {
                $.each(viewModel.versions(), function(i, version) {
                    version['publicDiffURL'] = ('//github.com/OpenTreeOfLife/'+ response.shardName +'/commit/'+ version.id);
                });
            }

            // take initial stab at setting search context (for focal clade and OTU mapping)
            inferSearchContextFromAvailableOTUs();

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
                'EDGE_DIRECTIONS': ko.observable(1),
                'TREES': ko.observable(1),
                'SUPPORTING_FILES': ko.observable(1),
                'OTU_MAPPING_HINTS': ko.observable(1),
                'VISIBLE_OTU_MAPPINGS': ko.observable(1),
                'COLLECTIONS_LIST': ko.observable(1),
                // TODO: add more as needed...
                'STUDY_HAS_CHANGED': ko.observable(1)
            }

            // support fast lookup of elements by ID, for largest trees
            viewModel.fastLookups = {
                'NODES_BY_ID': null,
                'TREES_BY_OTU_ID': null,
                'OTUS_BY_ID': null,
                'EDGES_BY_SOURCE_ID': null,
                'EDGES_BY_TARGET_ID': null
            };

            // enable sorting and filtering for lists in the editor
            viewModel.filterDelay = 250; // ms to wait for changes before updating filter
            viewModel.listFilters = {
                // UI widgets bound to these variables will trigger the
                // computed display lists below..
                'TREES': {
                    'match': ko.observable( listFilterDefaults.TREES.match )
                },
                'FILES': {
                    'match': ko.observable( listFilterDefaults.FILES.match )
                },
                'OTUS': {
                    // TODO: add 'pagesize'?
                    'match': ko.observable( listFilterDefaults.OTUS.match ),
                    'scope': ko.observable( listFilterDefaults.OTUS.scope ),
                    'order': ko.observable( listFilterDefaults.OTUS.order )
                },
                'ANNOTATIONS': {
                    'match': ko.observable( listFilterDefaults.ANNOTATIONS.match ),
                    'scope': ko.observable( listFilterDefaults.ANNOTATIONS.scope ),
                    'submitter': ko.observable( listFilterDefaults.ANNOTATIONS.submitter )
                },
                'COLLECTIONS': {
                    // NOTE 'match' and 'filter' are currently unused
                    'match': ko.observable( listFilterDefaults.COLLECTIONS.match ),
                    'order': ko.observable( listFilterDefaults.COLLECTIONS.order ),
                    'filter': ko.observable( listFilterDefaults.COLLECTIONS.filter )
                }
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

            // maintain a persistent array to preserve pagination (reset when computed)
            viewModel._filteredFiles = ko.observableArray( ).asPaged(20);
            viewModel.filteredFiles = ko.computed(function() {
                // filter raw file list, returning a
                // new paged observableArray
                var ticklers = [ viewModel.ticklers.SUPPORTING_FILES() ];

                updateClearSearchWidget( '#file-list-filter' );
                updateListFiltersWithHistory();

                var match = viewModel.listFilters.FILES.match(),
                    matchWithDiacriticals = addDiacriticalVariants(match),
                    matchPattern = new RegExp( $.trim(matchWithDiacriticals), 'i' );

                // map old array to new and return it
                var fileDetails = [];
                $.each(getSupportingFiles().data.files.file, function(i, fileInfo) {
                    fileDetails.push(fileInfo);
                });

                var filteredList = ko.utils.arrayFilter(
                    fileDetails,  // retrieve contents of observableArray
                    function(file) {
                        // match entered text against old or new label
                        var fileName = file['@filename'];
                        var fileType = file['@type'];
                        var fileDesc = file.description.$;
                        if (!matchPattern.test(fileName)
                         && !matchPattern.test(fileType)
                         && !matchPattern.test(fileDesc)) {
                            return false;
                        }
                        return true;
                    }
                );  // END of list filtering

                viewModel._filteredFiles( filteredList );
                viewModel._filteredFiles.goToPage(1);
                return viewModel._filteredFiles;
            }).extend({ throttle: viewModel.filterDelay }); // END of filteredFiles

            // maintain a persistent array to preserve pagination (reset when computed)
            viewModel._filteredOTUs = ko.observableArray( ).asPaged(500);
            viewModel.filteredOTUs = ko.computed(function() {
                // filter raw OTU list, then sort, returning a
                // new (OR MODIFIED??) paged observableArray
                var ticklers = [ viewModel.ticklers.OTU_MAPPING_HINTS() ];

                updateClearSearchWidget( '#otu-list-filter' );
                updateListFiltersWithHistory();

                var match = viewModel.listFilters.OTUS.match(),
                    matchWithDiacriticals = addDiacriticalVariants(match),
                    matchPattern = new RegExp( $.trim(matchWithDiacriticals), 'i' );
                var scope = viewModel.listFilters.OTUS.scope();
                var order = viewModel.listFilters.OTUS.order();

                // gather all OTUs from all 'otus' collections
                var allOTUs = viewModel.elementTypes.otu.gatherAll(viewModel.nexml);
                captureDefaultSortOrder(allOTUs);

                var chosenTrees;
                switch(scope) {
                    case 'In any tree':
                        chosenTrees = viewModel.elementTypes.tree.gatherAll(viewModel.nexml);
                        break;
                    case 'In trees nominated for synthesis':
                        chosenTrees = getTreesNominatedForSynthesis()
                        break;
                    case 'In trees not yet nominated':
                        chosenTrees = getTreesNotYetNominated()
                        break;
                    case 'Unused (not in any tree)':
                        chosenTrees = null;
                        break;
                    default:
                        chosenTrees = [];
                }

                // pool all node IDs in chosen trees into a common object
                var chosenOTUIDs = {};
                if ($.isArray(chosenTrees)) {
                    // it's a list of zero or more trees
                    $.each( chosenTrees, function(i, tree) {
                        // check this tree's nodes for this OTU id
                        $.each( tree.node, function( i, node ) {
                            if (node['@otu']) {
                                chosenOTUIDs[ node['@otu'] ] = true;
                            }
                        });
                    });
                } else {
                    // show the *unused* OTUs instead (inverse of 'In any tree' above)
                    $.each(getUnusedOTUs(), function(i, otu) {
                        chosenOTUIDs[ otu['@id'] ] = true;
                    });
                }
                console.warn(chosenOTUIDs);
                /*
                if (chosenOTUIDs.length > 0) {
                    console.warn("Here's the first of chosenOTUIDs:");
                    console.warn(chosenOTUIDs[0]);
                } else {
                    console.warn("chosenOTUIDs is an empty list!");
                }
                */

                // map old array to new and return it
                var filteredList = ko.utils.arrayFilter(
                    allOTUs,
                    function(otu) {
                        // match entered text against old or new label
                        var originalLabel = otu['^ot:originalLabel'];
                        var mappedLabel = otu['^ot:ottTaxonName'];
                        if (!matchPattern.test(originalLabel) && !matchPattern.test(mappedLabel)) {
                            return false;
                        }

                        // check nodes against trees, if filtered
                        switch (scope) {
                            case 'In any tree':
                                // N.B. Even here, we want to hide (but not preserve) OTUs that don't appear in any tree
                            case 'In trees nominated for synthesis':
                            case 'In trees not yet nominated':
                                // check selected trees for this node
                            case 'Unused (not in any tree)':
                                // the inverse of 'In any tree' above
                                var foundInMatchingTree = false;
                                var otuID = otu['@id'];
                                foundInMatchingTree = otuID in chosenOTUIDs;
                                if (!foundInMatchingTree) return false;
                                break;

                            default:
                                console.log("Unexpected scope for OTU list: ["+ scope +"]");
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
                    case 'Unmapped OTUs first':
                        /* Capture prior position first (for a more stable list during bulk mapping)
                        $.each(filteredList, function(i, otu) {
                            otu.priorPosition = i;
                        });
                        */
                        filteredList.sort(function(a,b) {
                            // N.B. This works even if there's no such property.
                            //if (checkForInterestingStudies(a,b)) { debugger; }
                            var aMapStatus = $.trim(a['^ot:ottTaxonName']) !== '';
                            var bMapStatus = $.trim(b['^ot:ottTaxonName']) !== '';
                            if (aMapStatus === bMapStatus) {
                                if (!aMapStatus) { // both OTUs are currently un-mapped
                                    // Force failed mappings to the bottom of the list
                                    var aFailedMapping = (failedMappingOTUs.indexOf(a['@id']) !== -1);
                                    var bFailedMapping = (failedMappingOTUs.indexOf(b['@id']) !== -1);
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
                        /* Toss the outdated prior positions
                        $.each(filteredList, function(i, otu) {
                            delete otu.priorPosition;
                        });
                        */
                        break;

                    case 'Mapped OTUs first':
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
                        console.log("Unexpected order for OTU list: ["+ order +"]");
                        return false;

                }

                // Un-select any otu that's now out of view (ie, outside of the first page of results)
                var itemsInView = filteredList.slice(0, viewModel._filteredOTUs.pageSize);
                allOTUs.map(function(otu) {
                    if (otu['selectedForAction']) {
                        var isOutOfView = ($.inArray(otu, itemsInView) === -1);
                        if (isOutOfView) {
                            otu['selectedForAction'] = false;
                        }
                    }
                });

                // clear any stale last-selected OTU (it's likely moved)
                lastClickedTogglePosition = null;

                viewModel._filteredOTUs( filteredList );
                viewModel._filteredOTUs.goToPage(1);
                return viewModel._filteredOTUs;
            }).extend({ throttle: viewModel.filterDelay }); // END of filteredOTUs

            // maintain a persistent array to preserve pagination (reset when computed)
            viewModel._filteredAnnotations = ko.observableArray( ).asPaged(20);
            viewModel.filteredAnnotations = ko.computed(function() {
                // filter raw OTU list, then sort, returning a
                // new (OR MODIFIED??) paged observableArray
                updateClearSearchWidget( '#annotation-list-filter' );
                updateListFiltersWithHistory();

                var match = viewModel.listFilters.ANNOTATIONS.match(),
                    matchWithDiacriticals = addDiacriticalVariants(match),
                    matchPattern = new RegExp( $.trim(matchWithDiacriticals), 'i' );
                var scope = viewModel.listFilters.ANNOTATIONS.scope();
                var submitter = viewModel.listFilters.ANNOTATIONS.submitter();

                // filter collection metadata, build new array to new and return it
                var annotationsCollection = viewModel.nexml['^ot:annotationEvents'];
                var filteredList = ko.utils.arrayFilter(
                    annotationsCollection.annotation,
                    function(annotation) {
                        // match entered text against type, location, submitter name, message text
                        var itsAgent = getAgentForAnnotationEvent( annotation );
                        var itsMessages = makeArray( annotation.message );

                        var itsType = itsMessages && (itsMessages.length > 0) ?
                                itsMessages[0]['@code'] :
                                ""; // TODO: incorporate all messages?
                        ///var itsLocation = "Study"; // TODO
                        var itsSubmitter = itsAgent ? itsAgent['@name'] : '??';
                        if (!itsAgent) {
                            console.error("MISSING AGENT for this annotation event:");
                            console.error(annotation);
                        }
                        var itsMessageText = itsMessages && (itsMessages.length > 0) ?
                                $.map(itsMessages, function(m) {
                                    return m['humanMessage'] ? m['@humanMessage'] : "";
                                }).join('|') :
                                "";
                        var itsSortDate = annotation['@dateCreated'];
                        if (!matchPattern.test(itsType) &&
                            !matchPattern.test(itsSubmitter) &&
                            !matchPattern.test(itsMessageText)) {
                            return false;
                        }

                        /* filter by submitter
                         * TODO: Provide some kind of support for this?
                        switch (submitter) {
                            case 'Submitted by all':
                                // nothing to do here, all nodes pass
                                break;

                            case 'Submitted by users':
                                break;

                            case 'Submitted by validation tools':
                                break;

                            default:
                                console.log("Unexpected submitter option for annotations: ["+ submitter +"]");
                                return false;
                        }
                        */

                        return true;
                    }
                );  // END of list filtering

                viewModel._filteredAnnotations( filteredList );
                viewModel._filteredAnnotations.goToPage(1);
                return viewModel._filteredAnnotations;
            }).extend({ throttle: viewModel.filterDelay }); // END of filteredAnnotations

            // store tentative decisions about internal node labels
            viewModel.chosenNodeLabelModeInfo = ko.observable(null);
            viewModel.nodeLabelModeDescription = ko.observable('');

            // keep a very tentative list of failed OTU mappings (any change in hints should clear it)
            var mappingHints = getOTUMappingHints();

            /* TODO: any edits in this area should nudge the OTU_MAPPING_HINTS tickler
            mappingHints.data.searchContext.$.subscribe(clearFailedOTUList);
            mappingHints.data.substitutions.substitution.subscribe(clearFailedOTUList);
            $.each(mappingHints.data.substitutions.substitution, function(i, subst) {
                subst['@active'].subscribe(clearFailedOTUList);
                subst.new.$.subscribe(clearFailedOTUList);
                subst.old.$.subscribe(clearFailedOTUList);
            });
            */

            //viewModel.ticklers.OTU_MAPPING_HINTS.subscribe(clearFailedOTUList);
            // NO, this forces frequent retries of doomed OTU mapping!

            // some changes to metadata will modify the page's headings
            viewModel.ticklers.GENERAL_METADATA.subscribe(updatePageHeadings);
            updatePageHeadings();

            // "Normalize" trees by adding any missing tree properties and metadata.
            // (this depends on some of the "fast lookups" added above)
            $.each(data.nexml.trees, function(i, treesCollection) {
                $.each(treesCollection.tree, function(i, tree) {
                    normalizeTree( tree );
                });
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

function showPossibleMappingsKey() {
    // explain colors and opacity in a popup (already bound)
    $('#possible-mappings-key').modal('show');
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
    var saveURL = API_update_collection_PUT_url.replace('{STUDY_ID}', collectionID);
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
    var removeURL = API_remove_collection_DELETE_url.replace('{STUDY_ID}', collectionID);
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

function normalizeTree( tree ) {
    // add expected tree properties and metadata, if missing

    // editable display name for this tree
    if ((tree['@label'] === undefined) || ($.trim(tree['@label']) === '')) {
        tree['@label'] = 'Untitled ('+ tree['@id'] +')';
    }

    // metadata fields with other defaults
    if (!(['^ot:unrootedTree'] in tree)) {
        // safest value, forces the curator to assert correctness
        tree['^ot:unrootedTree'] = true;
    }

    // metadata fields (with empty default values)
    var metatags = [
        '^ot:curatedType',
        '^ot:specifiedRoot',
        '^ot:inGroupClade',
        '^ot:outGroupEdge',
        '^ot:branchLengthMode',
        '^ot:branchLengthTimeUnit',
        '^ot:branchLengthDescription',
        '^ot:nodeLabelMode',
        '^ot:nodeLabelTimeUnit'
    ];
    $.each(metatags, function(i, tagName) {
        if (!(tagName in tree)) {
            tree[tagName] = "";
        }
    });

    // add array of tags (convert singleton tag)
    if ('^ot:tag' in tree) {
        tree['^ot:tag'] = makeArray(tree['^ot:tag']);
    } else {
        tree['^ot:tag'] = [ ];
    }

    removeDuplicateTags( tree );

    // add array of reasons-to-exclude (convert singleton, if found)
    if ('^ot:reasonsToExcludeFromSynthesis' in tree) {
        tree['^ot:reasonsToExcludeFromSynthesis'] =
            makeArray(tree['^ot:reasonsToExcludeFromSynthesis']);
    } else {
        tree['^ot:reasonsToExcludeFromSynthesis'] = [ ];
    }

    // pre-select first node among duplicate siblings
    resolveMonophyleticDuplicatesInTree(tree);
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
function treeIsValidForSynthesis( tree ) {
    // more compact simple test (some logic repeated in getTreeSynthValidationSummary)
    var rootConfirmed = !(tree['^ot:unrootedTree']); // missing, false, or empty
    var moreThanTwoMappings = getNodeCounts(tree).mappedTips > 2;
    return (rootConfirmed && moreThanTwoMappings);
}
function getTreeSynthValidationSummary( tree ) {
    var rootConfirmed = !(tree['^ot:unrootedTree']); // missing, false, or empty
    var moreThanTwoMappings = getNodeCounts(tree).mappedTips > 2;

    var firstPara = '<p style="margin-bottom: 0.0em;">';
    if (rootConfirmed && moreThanTwoMappings) {
        firstPara += 'It <strong>passes</strong> our minimal validation for synthesis:';
    } else {
        firstPara += 'It <strong>fails</strong> our minimal validation for synthesis:';
    }
    firstPara += '</p>';

    var testList = '<ul style="margin-bottom: 0.2em;">';
    if (rootConfirmed) {
         testList += '  <li>Its root has been confirmed by a curator.</li>'
    } else {
         testList += '  <li style="color: #b94a48;">Its root has <strong>not</strong> been confirmed by a curator.</li>'
    }
    if (moreThanTwoMappings) {
         testList += '  <li>It has more than two mapped OTUs.</li>';
    } else {
         testList += '  <li style="color: #b94a48;">It has <strong>fewer</strong> than two mapped OTUs.</li>';
    }
    testList += '</ul>';
    return firstPara +'\n'+ testList;
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

function tryToIncludeTreeInSynth(tree, options) {
    options = options || {};
    if (isQueuedForNewSynthesis(tree)) {
        showInfoMessage("This tree is already included (queued).");
        return;
    }
    if (!treeIsValidForSynthesis(tree)) {
        var rootConfirmed = !(tree['^ot:unrootedTree']); // missing, false, or empty
        var moreThanTwoMappings = getNodeCounts(tree).mappedTips > 2;
        if (!rootConfirmed && !moreThanTwoMappings) {
            showInfoMessage("This tree needs further curation (confirmed root, 3+ OTUs mapped).");
        } else if (!rootConfirmed) {
            showInfoMessage("This tree needs further curation (confirmed root node).");
        } else {
            showInfoMessage("This tree needs further curation (3 or more OTUs mapped).");
        }
        return;
    }
    var howManyReasonsToExclude = tree['^ot:reasonsToExcludeFromSynthesis'] ? tree['^ot:reasonsToExcludeFromSynthesis'].length : 0;
    if (!(options.FORCE_OVERRIDE)) {
        if (howManyReasonsToExclude > 0) {
            // if there are no reasons-to-exclude, prompt for one now
            showTreeSynthDetailsPopup( tree, {PROMPT_FOR_OVERRIDE: true});
            return;
        }
    }
    // call web service to append to default synth-input collection
    showModalScreen("Adding tree to default synthesis collection...", {SHOW_BUSY_BAR:true});
    $.ajax({
        global: false,  // suppress web2py's aggressive error handling
        url: includeTreeInSynthesis_url,
        type: 'POST',
        dataType: 'json',
        data: JSON.stringify({
            collection_id: collectionID,
            tree_id: tree['@id'],
            author_name: userDisplayName,
            author_email: userEmail,
            auth_token: userAuthToken
        }),
        crossDomain: true,
        contentType: "application/json; charset=utf-8",
        complete: function( jqXHR, textStatus ) {
            hideModalScreen();
            if (textStatus !== 'success') {
                var errMsg = 'Sorry, there was an error including this tree. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">Show details</a><pre class="error-details" style="display: none;">'+ jqXHR.responseText +'</pre>';
                showErrorMessage(errMsg);
                return;
            }
            // elevate response (if not error) to global input-trees variable
            treesQueuedForSynthesis = $.parseJSON(jqXHR.responseText);
            nudgeTickler('TREES'); // immediate update in popup UI
            hideModalScreen();
            $('#tree-synth-details').modal('hide');
        }
    });
}
function tryToExcludeTreeFromSynth(tree) {
    var howManyReasonsToExclude = tree['^ot:reasonsToExcludeFromSynthesis'] ? tree['^ot:reasonsToExcludeFromSynthesis'].length : 0;
    if (howManyReasonsToExclude === 0) {
        // if there are no reasons-to-exclude, prompt for one now
        showTreeSynthDetailsPopup( tree, {PROMPT_FOR_REASONS: true});
        return;
    }
    if (!isQueuedForNewSynthesis(tree)) {
        showInfoMessage("This tree is already excluded, for "+ howManyReasonsToExclude +" reason"+ (howManyReasonsToExclude === 1 ? '': 's') +".");
        return;
    }
    showModalScreen("Removing tree from all synthesis collections...", {SHOW_BUSY_BAR:true});
    // call web service to purge from all collections
    $.ajax({
        global: false,  // suppress web2py's aggressive error handling
        url: excludeTreeFromSynthesis_url,
        type: 'POST',
        dataType: 'json',
        data: JSON.stringify({
            collection_id: collectionID,
            tree_id: tree['@id'],
            author_name: userDisplayName,
            author_email: userEmail,
            auth_token: userAuthToken
        }),
        crossDomain: true,
        contentType: "application/json; charset=utf-8",
        complete: function( jqXHR, textStatus ) {
            hideModalScreen();
            if (textStatus !== 'success') {
                var errMsg = 'Sorry, there was an error excluding this tree. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">Show details</a><pre class="error-details" style="display: none;">'+ jqXHR.responseText +'</pre>';
                showErrorMessage(errMsg);
                return;
            }
            // elevate response (if not error) to global input-trees variable
            treesQueuedForSynthesis = $.parseJSON(jqXHR.responseText);
            nudgeTickler('TREES'); // immediate update in popup UI
            hideModalScreen();
            $('#tree-synth-details').modal('hide');
        }
    });
}

var $stashedSynthWarningsElement = null;
function showTreeSynthDetailsPopup( tree, options ) {
    // bind and show details for this tree vs. old and new synthesis
    options = options || {};

    /* TODO: special init behavior for EDIT vs. VIEW?
    if (viewOrEdit == 'EDIT') {
    } else {  // 'VIEW'
    }
    */

    if ($stashedSynthWarningsElement === null) {
        // save the template and use the original
        $stashedSynthWarningsElement = $('#synth-warnings-holder')
            .find('tbody tr').eq(0).clone();
    } else {
        // apply the saved template
        $('#synth-warnings-holder tbody').empty()
                                          .append( $stashedSynthWarningsElement.clone() );
    }

    // bind just the selected tree to the modal HTML
    // NOTE that we must call cleanNode first, to allow "re-binding" with KO.
    var $boundElements = $('#tree-synth-details').find('.modal-body, .modal-header h3, .modal-footer');
    // Step carefully to avoid un-binding important modal behavior (close widgets, etc)!
    $.each($boundElements, function(i, el) {
        ko.cleanNode(el);
        ko.applyBindings(tree,el);
    });

    /* TODO: use a delayed load, so we see a modal blocker *above* the tree viewer?
            setTimeout(function() {
                if (viewModel.allCollections && viewModel.allCollections.length) {
                    nudgeTickler('COLLECTIONS_LIST');
                } else {
                    loadCollectionList('INIT');
                }
            }, 10);
    */
    $('#tree-synth-details').off('hidden').on('hidden', function () {
        removeEmptyReasonsToExclude(tree);
        nudgeTickler('TREES');
    });
    $('#tree-synth-details').modal('show');

    var $addReasonPrompt = $('#tree-synth-details').find('#add-reason-to-exclude');
    if (options.PROMPT_FOR_REASONS) {
        $addReasonPrompt.show();
    } else {
        $addReasonPrompt.hide();
    }
    var $overridePrompt = $('#tree-synth-details').find('#override-reasons-to-exclude');
    if (options.PROMPT_FOR_OVERRIDE) {
        $overridePrompt.show();
    } else {
        $overridePrompt.hide();
    }
}
function hideTreeSynthDetailsPopup() {
    $('#tree-synth-details').modal('hide');
}

function addReasonToExcludeTree(tree) {
    // add a (tentative) reason
    tree['^ot:reasonsToExcludeFromSynthesis'].push({ $: "" });
    showTreeSynthDetailsPopup(tree);
    nudgeTickler('TREES');
}
function updateReasonToExcludeTree(itsPosition, tree) {
    // We do this based on position, since duplicate values are possible
    //tree['^ot:reasonsToExcludeFromSynthesis'][itsPosition] = 'TEST';
    nudgeTickler('TREES');
}
function removeReasonToExcludeTree(itsPosition, tree) {
    // We do this based on position, since duplicate values are possible
    tree['^ot:reasonsToExcludeFromSynthesis'].splice(itsPosition, 1);
    showTreeSynthDetailsPopup(tree);
    nudgeTickler('TREES');
}
function removeEmptyReasonsToExclude(tree) {
    // call this before saving Nexson
    if ('^ot:reasonsToExcludeFromSynthesis' in tree) {
        var warnings = makeArray(tree['^ot:reasonsToExcludeFromSynthesis']);
        // filter out any empty (whitespace-only) reasons
        // N.B. that we store the text in a '$' property (per Badgerfish convention)
        tree['^ot:reasonsToExcludeFromSynthesis'] = warnings.filter(function(item, index) {
            if ($.trim(item.$) === "") {
                return false;
            }
            return true;
        });
    }
}

/* support classes for objects in arrays
 * (TODO: use these instead of generic observables?)
 */
function MetaTag( name, type, value ) {
    var self = this;
    self.name = name;   // .@property
    self.type = type;   // .@xsi:type
    self.value = ko.observable(value);  // .$
}
function OTU(id, label, about, meta) {
    var self = this;
    self.id = id;   // .@id
    self.label = label;   // .@label
    self.about = about;   // .@about
    self.meta = ko.observableArray();  // .meta
    // add all meta entries as MetaTag instances
    for(var i = 0; i < meta.length; i++) {
        self.meta.push( new MetaTag( meta[i] ) );
    }
}
function Tree(id, about, meta, edge, node) {
    var self = this;
    self.id = id;         // .@id
    self.about = about;   // .@about
    self.meta = ko.observableArray();  // .meta
    // add all meta entries as MetaTag instances
    for(var i = 0; i < meta.length; i++) {
        self.meta.push( new MetaTag( meta[i] ) );
    }
    self.edge = ko.observableArray();  // .edge
    // add all edge entries as TreeEdge instances
    for(var i = 0; i < edge.length; i++) {
        self.edge.push( new TreeEdge( edge[i] ) );
    }
    self.node = ko.observableArray();  // .node
    // add all node entries as TreeNode instances
    for(var i = 0; i < node.length; i++) {
        self.node.push( new TreeNode( node[i] ) );
    }
}
function TreeEdge() {
}
function TreeNode() {
}


var roughDOIpattern = new RegExp('(doi|DOI)[\\s\\.\\:]{0,2}\\b10[.\\d]{2,}\\b');
// this checks for *attempts* to include a DOI, not necessarily valid



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

// Keep track of when the tree viewer is already showing, so we
// can hold it open and step through nodes or trees.
var treeViewerIsInUse = false;
var treeTagsInitialized = false;
var $stashedTreeCollectionElement = null;
function showTreeViewer( tree, options ) {
    // if options.HIGHLIGHT_NODE_ID exists, try to scroll to this node
    options = options || {};
    var highlightNodeID = options.HIGHLIGHT_NODE_ID || null;

    if (tree) {
        // Clean up mononphyletic conflicts before annoying the user. (We do
        // this here since OTU mapping or other changes may have introduced new
        // conflicts, and we don't want to waste the curator's time with them.)
        resolveMonophyleticDuplicatesInTree(tree);
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
        // reset observables for tentative label-mode options
        viewModel.chosenNodeLabelModeInfo = ko.observable(null);
        viewModel.nodeLabelModeDescription = ko.observable('');
    }

    if ($stashedTreeCollectionElement === null) {
        // save the template and use the original
        $stashedTreeCollectionElement = $('#collection-list-holder')
            .find('tbody tr').eq(0).clone();
    } else {
        // apply the saved template
        $('#collection-list-holder tbody').empty()
                                          .append( $stashedTreeCollectionElement.clone() );
    }

    // bind just the selected tree to the modal HTML
    // NOTE that we must call cleanNode first, to allow "re-binding" with KO.
    var $boundElements = $('#tree-viewer').find('.modal-body, .modal-header h3, .nav-tabs .badge, .modal-footer');
    // Step carefully to avoid un-binding important modal behavior (close widgets, etc)!
    $.each($boundElements, function(i, el) {
        ko.cleanNode(el);
        ko.applyBindings(tree,el);
    });

    // enable collection search (in tree-viewer popup)
    console.warn('BINDING COLLECTION SEARCH');
    $('input[name=collection-search]').unbind('keyup change')
                                      .bind('keyup change', setCollectionSearchFuse )
                                      .unbind('keydown')  // block errant form submission
                                      .bind('keydown', function(e) { return e.which !== 13; });
    $('#collection-search-form').unbind('submit').submit(function() {
        searchForMatchingCollections();
        return false;
    });
    resetExistingCollectionPrompt();

    var updateTreeDisplay = function() {
        if (viewOrEdit == 'EDIT') {
            if (treeTagsInitialized) {
                $('#tree-tags').tagsinput('destroy');
                treeTagsInitialized = false;
            }
            updateInferenceMethodWidgets( tree );
            $('#tree-tags').tagsinput( tagsOptions );
            // add all tag values directly from nemxml
            $.each( getTags( tree, {FULL_TAG_INFO: true}), function(i, tagInfo) {
                $('#tree-tags').tagsinput('add', tagInfo);
            });
            captureTagTextOnBlur( $('#tree-tags') );
            treeTagsInitialized = true;
        }

        updateTreeViewerHeight({MAINTAIN_SCROLL: true});

        updateEdgesInTree( tree );

        drawTree(tree, {
            'INITIAL_DRAWING': true,
            'HIGHLIGHT_AMBIGUOUS_LABELS': (options.HIGHLIGHT_AMBIGUOUS_LABELS || false),
            'HIGHLIGHT_ARBITRARY_ROOT': (options.HIGHLIGHT_ARBITRARY_ROOT || false)
        });

        // clear any prior stepwise UI for showing highlights
        $('#tree-viewer').find('.stepwise-highlights').remove();
        if (options.HIGHLIGHT_PLAYLIST) {
            // use this to find the highlight node and show stepwise UI
            var currentStep = options.HIGHLIGHT_PLAYLIST[ options.HIGHLIGHT_POSITION ];
            highlightNodeID = currentStep.nodeID;
            var isFirstStep = options.HIGHLIGHT_POSITION === 0;
            var isLastStep = options.HIGHLIGHT_POSITION === (options.HIGHLIGHT_PLAYLIST.length - 1);
            var displayPrompt;
            if ('otuID' in currentStep) {
                var nodeLabel = getTreeNodeLabel(tree, getTreeNodeByID(tree, highlightNodeID)).label;
                displayPrompt = options.HIGHLIGHT_PROMPT.replace('MAPPED_TAXON', nodeLabel);
            } else {
                displayPrompt = options.HIGHLIGHT_PROMPT;
            }
            $('#tree-viewer .modal-header .nav-tabs').before(
                '<div class="stepwise-highlights help-box">'
              +      displayPrompt
              + (options.HIGHLIGHT_PLAYLIST.length < 2 ? '' :
                    ' ('+ (options.HIGHLIGHT_POSITION + 1) +' of '+ options.HIGHLIGHT_PLAYLIST.length +') &nbsp; '
                  + '  <div class="btn-group">'
                  + '    <a class="btn btn-small'+ (isFirstStep ? ' disabled' : '') +'" href="#" onclick="return false;">Previous</a>'
                  + '    <a class="btn btn-small'+ (isLastStep ? ' disabled' : '') +'" href="#" onclick="return false;">Next</a>'
                  + '  </div>'
                )
              + '</div>'
            );
            if (!isFirstStep) {
                $('#tree-viewer').find('.stepwise-highlights .btn-group a.btn:first').click(function() {
                    // step to the previous highlight (close + re-open the popup as needed)
                    var newPosition = (options.HIGHLIGHT_POSITION - 1 + options.HIGHLIGHT_PLAYLIST.length) % options.HIGHLIGHT_PLAYLIST.length;
                    // "wrap around" if we're already on the first item
                    var newStep = options.HIGHLIGHT_PLAYLIST[ newPosition ];
                    if (false) { /// if (newStep.treeID === tree['@id']) ...
                        // TODO: just scroll in the current view (and update stepwise UI)?
                        return;
                    }
                    // close and re-open this window with in new tree and show new node
                    options.HIGHLIGHT_POSITION = newPosition;
                    showTreeViewer(null, options);
                });
            }
            if (!isLastStep) {
                $('#tree-viewer').find('.stepwise-highlights .btn-group a.btn:last').click(function() {
                    // step to the next highlight (close + re-open the popup as needed)
                    var newPosition = (options.HIGHLIGHT_POSITION + 1 + options.HIGHLIGHT_PLAYLIST.length) % options.HIGHLIGHT_PLAYLIST.length;
                    // "wrap around" if we're already on the last item
                    var newStep = options.HIGHLIGHT_PLAYLIST[ newPosition ];
                    if (false) { /// if (newStep.treeID === tree['@id'])...
                        // TODO: just scroll in the current view (and update stepwise UI)?
                        return;
                    }
                    // close and re-open this window with in new tree and show new node
                    options.HIGHLIGHT_POSITION = newPosition;
                    showTreeViewer(null, options);
                });
            }
        }
        if (highlightNodeID) {
            scrollToTreeNode(tree['@id'], highlightNodeID);
        }
        if (options.HIGHLIGHT_AMBIGUOUS_LABELS) {
            // TODO: visibly mark the Label Types widget, and show internal labels in red
            console.warn(">>>> Now I'd highlight the LabelTypes widget!");
        }

        ///hideModalScreen();
    }

    var $treeViewerTabs = $('#tree-viewer .modal-header a[data-toggle="tab"]');
    if (treeViewerIsInUse) {
        // trigger its 'shown' event to
        updateTreeDisplay();
    } else {
        $('#tree-viewer').off('show').on('show', function () {
            treeViewerIsInUse = true;
            // delay load, so we see its modal blocker *above* the tree viewer
            setTimeout(function() {
                if (viewModel.allCollections && viewModel.allCollections.length) {
                    nudgeTickler('COLLECTIONS_LIST');
                } else {
                    loadCollectionList('INIT');
                }
            }, 10);
        });
        $('#tree-viewer').off('shown').on('shown', function () {
            updateTreeDisplay();
        });
        $('#tree-viewer').off('hide').on('hide', function () {
            $.fullscreen.exit();
            treeViewerIsInUse = false;
            hideTreeWithHistory(tree);
        });
        $('#tree-viewer').off('hidden').on('hidden', function () {
            ///console.log('@@@@@ hidden');
        });

        /* DISABLING this until we can iron out collections UI, node/edge info, etc.
        // show or disable the full-screen widgets
        var $fullScreenToggle = $('button#enter-full-screen');
        if ($.fullscreen.isNativelySupported()) {
            // ie, the current browser supports full-screen APIs
            $fullScreenToggle.show();
            $(document).bind('fscreenchange', function(e, state, elem) {
                if ($.fullscreen.isFullScreen()) {
                    $('#enter-full-screen').hide();
                    $('#exit-full-screen').show();
                } else {
                    $('#enter-full-screen').show();
                    $('#exit-full-screen').hide();
                }
                // let screen redraw, THEN adjust height to fit
                // TODO: Do this more safely instead? measure screen vs. DIV, etc.
                setTimeout( function() {
                    updateTreeViewerHeight({MAINTAIN_SCROLL: true});
                }, 1500 );
            });
        } else {
            // dim and disable the full-screen toggle
            $fullScreenToggle.css("opacity: 0.5;")
                             .click(function() {
                                alert("This browser does not support full-screen display.");
                                return false;
                             })
                             .show();
        }
        */

        /* Show or disable the print widget (requires full-screen support).
         * This is used to briefly maximize the current tree view (SVG
         * viewport) and print it on demand.
         */
        var $printTreeViewButton = $('button#print-tree-view');
        if ($.fullscreen.isNativelySupported()) {
            // ie, the current browser supports full-screen APIs
            $printTreeViewButton.show();
            $(document).bind('fscreenchange', function(e, state, elem) {
                if ($.fullscreen.isFullScreen()) {
                    //$('#exit-full-screen').show();
                } else {
                    //$('#exit-full-screen').hide();
                }
            });
        } else {
            // dim and disable the full-screen toggle
            $printTreeViewButton.css("opacity: 0.5;")
                                .click(function() {
                                    alert("This browser does not support full-screen display, so it cannot print the tree.");
                                    return false;
                                })
                             .show();
        }

        // hide or show footer options based on tab chosen
        $treeViewerTabs.off('shown').on('shown', function (e) {
            var newTabTarget = $(e.target).attr('href').split('#')[1];
            //var oldTabTarget = $(e.relatedTarget).attr('href').split('#')[1];
            switch (newTabTarget) {
                case 'tree-properties':
                    $('#tree-phylogram-options').hide();
                    break;
                case 'tree-legend':
                    $('#tree-phylogram-options').hide();
                    break;
                case 'tree-collections':
                    $('#tree-phylogram-options').hide();
                    /* alternate loading of collections list when
                     * Tree > Collections subtab is chosen.
                     *
                    if (viewModel.allCollections && viewModel.allCollections.length) {
                        loadCollectionList('REFRESH');
                    } else {
                        loadCollectionList('INIT');
                    }
                     */
                    break;
                case 'tree-phylogram':
                    $('#tree-phylogram-options').show();
                    break;
            }
        });
        $('#tree-viewer').modal('show');
    }

    // IF we want different starting tab in different scenarios
    var $rootWidget = $('#tree-root-status-widget');
    if (options.HIGHLIGHT_ARBITRARY_ROOT) {
        // jump immediately to the Properties tab (element is already highly visible)
        $rootWidget.addClass('needs-attention').css('margin', '4px -4px 2px');
        $treeViewerTabs.filter('[href*=tree-properties]').tab('show');
    } else {
        $rootWidget.removeClass('needs-attention').css('margin', '');
        $treeViewerTabs.filter('[href*=tree-phylogram]').tab('show');
    }
}
function updateTreeViewerHeight(options) {
    /* Revisit height and placement of the single-tree popup, which should
     * take the full height of the window, with all header and footer UI
     * available and any scrollbars restricted to the SVG viewport.
     */
    options = options || {};
    var currentWindowHeight = $(window).height();
    var $popup = $('#tree-viewer');
    var $popupBody = $popup.find('.modal-body');
    var currentBodyScrollPosition = $popupBody.scrollTop();
    // NOTE that MAINTAIN_SCROLL only gives good results if this is called
    // directly, vs. as part of a full update of the tree viewer
    var newBodyScrollPosition = (options.MAINTAIN_SCROLL) ? currentBodyScrollPosition : 0;
    var currentBodyHeight = $popupBody.height();
    if ($.fullscreen.isFullScreen()) {
        // check the appointed full-screen element, nothing else
        var $fullScreenArea = $popup.find('#full-screen-area');
        var fullScreenAreaHeight = $fullScreenArea.height();
        // How much room to leave for header and footer?  N.B. that we're
        // forced to max size, so we need to measure them directly.
        var $header = $popup.find('.modal-header');
        var $footer = $popup.find('.modal-footer');
        var bodyPadding = $popupBody.outerHeight() - $popupBody.height();
        var newBodyHeight = fullScreenAreaHeight - $header.outerHeight() - $footer.outerHeight() - bodyPadding;
        // force height to the new size, to fill available area
        $popupBody.css({ 'height': newBodyHeight +'px', 'max-height': newBodyHeight +'px' });
    } else {
        // measure for a well-behaved popup (margins, etc)
        var topBackgroundHeight = 8;
        // leave room at the bottom for error messages, etc.?
        var footerMessageHeight = 36;
        var maxPopupHeight = (currentWindowHeight - topBackgroundHeight - footerMessageHeight);
        var currentPopupHeight = $popup.height();
        // how tall is the rest of the popup?
        var headerAndFooterHeight = currentPopupHeight - currentBodyHeight;
        var maxBodyHeight = maxPopupHeight - headerAndFooterHeight;
        // restore original height setting, but allow new max-height
        $popupBody.css({ 'height': '75%', 'max-height': maxBodyHeight +'px' });
        // position the popup itself
        var popupTopY = (currentWindowHeight / 2) - ($popup.height() / 2) - (footerMessageHeight/2);
        $popup.css({ 'top': popupTopY +'px' });
    }
    // restore (or set) new list scroll position
    $popupBody.scrollTop(newBodyScrollPosition);
}
$(window).resize( function () {
    if (treeViewerIsInUse) {
        updateTreeViewerHeight({MAINTAIN_SCROLL: true});
    }
});

function findOTUInTrees( otu, trees ) {
    // return an array of otu-context objects; each has a tree ID and node ID
    //
    // N.B. It's possible for a single tree to have the same OTU in multiple
    // nodes; in this case, expect to add multiple context objects with the
    // same tree ID.
    var otuID = otu['@id'];
    var otuContexts = [ ];
    $.each( trees, function(i, tree) {
        // check this tree's nodes for this OTU id
        $.each( tree.node, function( i, node ) {
            if (node['@otu'] === otuID) {
                otuContexts.push({ 'treeID': tree['@id'], 'nodeID': node['@id'] });
            }
        });
    });
    return otuContexts;
}
function showOTUInContext() {
    // use the popup tree viewer to show this node in place (to clarify OTU mapping, etc)
    var otu = this;
    // start with nominated trees (show best-quality results first)
    var otuContextsToShow = findOTUInTrees( otu, getTreesNominatedForSynthesis() );
    $.merge( otuContextsToShow, findOTUInTrees( otu, getTreesNotYetNominated() ) );
    // if this OTU is unused, something's very wrong; bail out now
    if (otuContextsToShow.length === 0) {
        alert("This OTU doesn't appear in any tree. (This is not expected.)");
        return;
    }
    // otherwise show the tree viewer with first result highlighted, UI to show more
    //var itsTree = getTreeByID('u10991628-99c2-46de-aa3f-67747c700213g0n0');
    var promptLabel = $.trim(otu['^ot:ottTaxonName']) || otu['^ot:originalLabel'];
    showTreeViewer(null, {
        HIGHLIGHT_PLAYLIST: otuContextsToShow,
        HIGHLIGHT_PROMPT: ("Showing the chosen OTU '<strong>"+ promptLabel +"</strong>' in context"),
        HIGHLIGHT_POSITION: 0
    })
}

function showDuplicateNodesInTreeViewer(tree) {
    // If there are no duplicates, fall back to simple tree view
    var duplicateData = getUnresolvedDuplicatesInTree( tree, {INCLUDE_MONOPHYLETIC: false} );
    if (!isQueuedForNewSynthesis(tree) || $.isEmptyObject(duplicateData)) {
        showTreeWithHistory(tree);
        return;
    }
    // Convert duplicate object to standard node playlist?
    var treeID = tree['@id'];
    var duplicatePlaylist = $.map(duplicateData, function(taxonInstances, taxonID) {
        // convert this taxon to a series of simple objects
        return $.map(taxonInstances, function(instance) {
            return $.extend( { treeID: treeID }, instance );
        });
    });
    showTreeViewer(null, {
        HIGHLIGHT_PLAYLIST: duplicatePlaylist,
        HIGHLIGHT_PROMPT: ("Showing all tips mapped to '<strong>MAPPED_TAXON</strong>'." + (viewOrEdit === 'EDIT' ? " Choose an exemplar." : "")),
        HIGHLIGHT_POSITION: 0
    });
    // TODO: Modify prompt text as we move through duplicate taxa?
    // TODO: Prune duplicate taxa from this playlist as curator chooses exemplar nodes?
}

function scrollToTreeNode( treeID, nodeID ) {
    // assumes that tree viewer is visibe (TODO: force this if not?)
    var node = getTreeNodeByID(treeID, nodeID);
    var $treeView = $('#tree-viewer svg:eq(0)');
    var $scrollingPane = $treeView.closest('.modal-body');
    var $nodeBox = $('#nodebox-'+ nodeID);
    if ($nodeBox.length === 0) {
        console.error("scrollToTreeNode: MISSING expected $('#nodebox-"+ nodeID +"') !");
        return;
    }
    /* NOTE that this old method of scrolling now fails, due the the mix of SVG
     * and HTML used in this page. See https://github.com/jquery/jquery/issues/2895
     * This is a problem because $.position() depends on $.offsetParent(), which has been
     * deprecated for SVG elements.  :-/
     *
    console.warn("SCROLL TARGET: $('#nodebox-"+ nodeID +"')");
    console.warn("OFFSET PARENT:");
    console.warn( $nodeBox.offsetParent()[0] );
    console.warn("NEW scroll top:  "+ $nodeBox.position().top);
    console.warn("NEW scroll left: "+ $nodeBox.position().left);
    $scrollingPane.scrollTop( $nodeBox.position().top );
    $scrollingPane.scrollLeft( $nodeBox.position().left );
    */
    // Reckon the needed scroll based on *page-relative* values
    var currentPaneOffset = $scrollingPane.offset();
    var currentPaneScrollTop = $scrollingPane.scrollTop();
    var currentPaneScrollLeft = $scrollingPane.scrollLeft();
    var currentNodeOffset = $nodeBox.offset();
    var nudgePaneScrollTop =  currentNodeOffset.top -  currentPaneOffset.top - 20;
    var nudgePaneScrollLeft = currentNodeOffset.left - currentPaneOffset.left - 20;
    $scrollingPane.scrollTop( currentPaneScrollTop + nudgePaneScrollTop );
    $scrollingPane.scrollLeft( currentPaneScrollLeft + nudgePaneScrollLeft );

    highlightTreeNode( treeID, nodeID );
}

function highlightTreeNode( treeID, nodeID ) {
    // assumes that tree viewer is visibe (TODO: force this if not?)
    var node = getTreeNodeByID(treeID, nodeID);
    var $treeView = $('#tree-viewer svg:eq(0)');
    var $itsLabelElement = $('#nodebox-'+ nodeID);
    $itsLabelElement.css('filter', 'url(#highlight)');
    // this effect was defined in an SVG 'filter' element
}

var vizInfo = { tree: null, vis: null };
function drawTree( treeOrID, options ) {
    options = options || {};
    var tree = null;
    if (typeof(treeOrID) === 'object') {
        tree = treeOrID;
    } else {
        tree = getTreeByID(treeOrID);
    }

    /* load D3 tree view */
    var specifiedRoot = tree['^ot:specifiedRoot'] || null;
    var rootNodeID = specifiedRoot ? specifiedRoot : tree.node[0]['@id'];

    var inGroupClade = tree['^ot:inGroupClade'] || null;

    // we'll pass this along to helpers that choose node labels, classes, etc.
    var importantNodeIDs = {
        'treeRoot': rootNodeID,         // may be arbitrary!
        'inGroupClade': inGroupClade
    }

    var rootNode = getTreeNodeByID(tree, rootNodeID);

    var edges = tree.edge;
    ///console.log(">> preparing "+ edges.length +" edges in this tree...");

    /* render the tree as a modified phylogram */

    // preload nodes with proper labels and branch lengths
    $.each(tree.node, function(index, node) {
        // reset x of all nodes, to avoid gradual "creeping" to the right
        node.x = 0;
        node.length = 0;  // ie, branch length
        node.rootDist = 0;
    });
    ///console.log(">> default node properties in place...");
    var shortestEdge = null;
    var longestEdge = null;
    $.each(edges, function(index, edge) {
        var childID = edge['@target'];
        var childNode = getTreeNodeByID(tree, childID);
        // transfer @length property (if any) to the child node
        if ('@length' in edge) {
            if ('@length' in edge) {
                childNode.length = parseFloat(edge['@length'] || '0');
                ///console.log("> reset length of node "+ childID+" to: "+ childNode.length);
                if (options.INITIAL_DRAWING) {
                    if (shortestEdge === null) {
                        shortestEdge = childNode.length;
                    } else {
                        shortestEdge = Math.min(shortestEdge, childNode.length);
                    }
                    if (longestEdge === null) {
                        longestEdge = childNode.length;
                    } else {
                        longestEdge = Math.max(longestEdge, childNode.length);
                    }
                }
            }
        }
        // share certain edge predicates (usu. support values) with the child node
        /* N.B. we do this before calling getTreeNodeLabel below, since we need
         * to set adjacentEdgeLabel first!
         */
        $.each(nodeLabelModes, function(i, modeInfo) {
            // check the edge property set by each option
            var edgeProp = modeInfo.edgePredicate; // eg, '^ot:bootstrapValues'
            if (edgeProp in edge) {
                childNode.adjacentEdgeLabel = edge[ edgeProp ];
                return false;  // use first one found
            }
        });
    });
    ///console.log("> done sweeping edges");
    $.each(tree.node, function(index, node) {
        var labelInfo = getTreeNodeLabel(tree, node, importantNodeIDs);
        node.name = labelInfo.label;
        node.labelType = labelInfo.labelType;

        if (labelInfo['internalNodeLabel']) {
            node.internalNodeLabel = labelInfo['internalNodeLabel'];
        } else {
            delete node.internalNodeLabel;
        }
        if (labelInfo['ambiguousLabel']) {
            node.ambiguousLabel = labelInfo['ambiguousLabel'];
        } else {
            delete node.ambiguousLabel;
        }
    });

    if (options.INITIAL_DRAWING) {
        var proportion = longestEdge / shortestEdge;
        ///console.log('branch-length proportions = 1:'+ proportion);
        if (proportion > 100.0) {
            // The shortest edges will be illegible! Let's force the Cladogram
            // option to suppress branch lengths consistently.
            $('#branch-length-toggle')[0].checked = true;
            hidingBranchLengths = true;
        }
    }

    vizInfo.vis = null;
    d3.selectAll('svg').remove();

    var viewWidth, viewHeight, layoutGenerator;

    console.log(tree.node.length +" nodes in this tree");

    if (usingRadialTreeLayout) {
        /* Set the viewer height + width based on total number of nodes:
         *   500px is OK for just a handful of nodes
         *   2000px keeps things legible with ~750 nodes
         */
        viewWidth = 600 + (tree.node.length * 2);
        viewHeight = viewWidth;
        layoutGenerator = d3.phylogram.buildRadial;
    } else {
        /* Set the viewer height based on total number of nodes;
         * in a bifurcating tree, perhaps half will be leaf nodes.
         */
        viewWidth = $("#tree-viewer").width() - 400;
        viewHeight = tree.node.length * 12;
        layoutGenerator = d3.phylogram.build;
    }
    vizInfo = layoutGenerator(
        "#tree-viewer #tree-phylogram",   // selector
        rootNode,
        {           // options
            vis: vizInfo.vis,
            // TODO: can we make the size "adaptive" based on vis contents?
            width: viewWidth,  // must be simple integers
            height: viewHeight,
            // simplify display by omitting scales or variable-length branches
            skipTicks: true,
            skipBranchLengthScaling: (hidingBranchLengths || usingRadialTreeLayout || !(allBranchLengthsFoundInTree(tree))) ?  true : false,
            children : function(d) {
                var parentID = d['@id'];
                var itsChildren = [];
                var childEdges = getTreeEdgesByID(null, parentID, 'SOURCE');

                $.each(childEdges, function(index, edge) {
                    var childID = edge['@target'];
                    var childNode = getTreeNodeByID(null, childID);
                    /* If this child is a non-interesting "knuckle" (an unlabeled internal node
                     * with just one child and no branch length), include *its* child instead.
                     *
                     * This might apply for a latent (currently unused) root node that we're preserving,
                     * or just a boring knuckle in the input tree.
                     *
                     * N.B. that we should err on the side of showing the original child, if skipping it
                     * might hide useful information!
                     */
                    if (!('@length' in edge)) {
                        // its edge is not interesting
                        var grandchildEdges = getTreeEdgesByID(null, childID, 'SOURCE');
                        if (grandchildEdges.length === 1) {
                            // it's a knuckle, with just one child that might be more interesting
                            var itsLabelInfo = getTreeNodeLabel(tree, childNode);
                            if (itsLabelInfo.labelType === 'empty') {
                                // the node has no interesting label, so use its only child instead!
                                var grandchildNode = getTreeNodeByID(null, grandchildEdges[0]['@target']);
                                if (!grandchildNode) {
                                    console.error("Expected to find a 'grandchild' node with ID '"+ grandchildEdges[0]['@target'] +"'!");
                                } else {
                                    childNode = grandchildNode;
                                }
                            }
                        }
                    }
                    itsChildren.push( childNode );
                });
                return itsChildren;
            }
        }
    );
    ///console.log("> done drawing raw phylogram");

    // (re)assert proper classes for key nodes
    vizInfo.vis.selectAll('.node')
        .attr("class", function(d) {
            var itsClass = "node";
            if (d.ingroup) {
                itsClass += " ingroup";
            } else {
                itsClass += " outgroup";
            }
            if (!d.children) {
                itsClass += " leaf";
            }
            if (d['@id'] === rootNodeID) {
                itsClass += " specifiedRoot";
            }
            if (d['@id'] === inGroupClade) {
                itsClass += " inGroupClade";
            }
            if (isDuplicateNode(tree, d)) {
                switch(d['^ot:isTaxonExemplar']) {
                    case true:
                        itsClass += ' exemplar';
                        break;

                    case false:
                        itsClass += ' non-exemplar';
                        break;

                    default:
                        itsClass += ' unresolved-exemplar';
                }
            }
            if (d.conflictDetails) {
                itsClass += " conflict-"+ d.conflictDetails.status;
            }
            return itsClass;
        });
    ///console.log("> done re-asserting classes");

    // (re)assert standard click behavior for all nodes
    vizInfo.vis.selectAll('.node circle')
        .on('click', function(d) {
            d3.event.stopPropagation();
            // show a menu with appropriate options for this node
            var nodePageOffset = $(d3.event.target).offset();
            showNodeOptionsMenu( tree, d, nodePageOffset, importantNodeIDs );
        });

    // (re)assert standard hover+click behavior for edges
    vizInfo.vis.selectAll('path')
        .on('click', function(d) {
            d3.event.stopPropagation();
            // show a menu with appropriate options for this node
            var mousePageOffset = {
                left: d3.event.pageX,
                top: d3.event.pageY
            };
            showEdgeOptionsMenu( tree, d, mousePageOffset, importantNodeIDs );
        });

    // (re)assert standard click behavior for main vis background
    d3.select('#tree-viewer')  // div.modal-body')
        .on('click', function(d) {
            // hide any node menu
            hideNodeOptionsMenu( );
        });

    ///console.log("> done re-asserting click behaviors");

    // Finalize SVG height/width/scale/left/top to match rendered labels
    // (prevents cropping when some labels exceed our estimated `labelWidth` above)
    var renderedBounds;
    try {
        renderedBounds = vizInfo.vis.node().getBBox();
    } catch(e) {
        /* FF fails with NS_ERROR_FAILURE if this SVG element is not currently rendered! See
         *  https://bugzilla.mozilla.org/show_bug.cgi?id=528969
         */
        //console.error('>>> UNABLE TO MEASURE BOUNDING BOX ('+ e +'):');
        renderedBounds = { x:0, y:0, width:0, height:0 };
    }
    var svgNode = d3.select( vizInfo.vis.node().parentNode );
    // match SVG size to the rendered bounds incl. all labels
    if (renderedBounds.height > 0) {
        svgNode.attr({
            width: renderedBounds.width,
            height: renderedBounds.height
        });
        // re-center the main group to allow for assymetric label sizes
        vizInfo.vis.attr('transform', 'translate('+ -(renderedBounds.x) +','+ -(renderedBounds.y) +')');
    }
}

function setTreeRoot( treeOrID, rootingInfo ) {
    // (Re)set the node that is the primary root for this tree, if known
    // 'rootingInfo' can be any of
    //  - a single node (make this the new root)
    //  - a single root-node ID (for the new root)
    //  - an array of nodes or IDs (add a root between these)
    //  - null (un-root this tree)  [DEPRECATED]
    // All but the last option should set the tree's rooted status to indicate
    // a confirmed root. (Un-rooting, if allowed, would do the reverse.)

    var tree = null;
    if (typeof(treeOrID) === 'object') {
        tree = treeOrID;
    } else {
        tree = getTreeByID(treeOrID);
    }

    // make sure we have a proper node ID
    var newRootNodeID = null;
    if (!rootingInfo) {
        // if null, we're un-rooting this tree
    } else if (typeof rootingInfo === 'string') {
        // assume this is the ID of the root node
        newRootNodeID = rootingInfo;
    } else if ($.isArray(rootingInfo)) {
        // this is an array of sourceID, targetID
        // check for an existing "latent" node between these two (unlikely)
        var latentRootNode = getTreeNodeBetween( tree, rootingInfo[0], rootingInfo[1] );
        if (latentRootNode) {
            // re-root to the latent node
            newRootNodeID = latentRootNode['@id'];
        } else {
            // create a new node (and edge) to join these nodes
            var newRootNode = addTreeNodeBetween( tree, rootingInfo[0], rootingInfo[1] );
            newRootNodeID = newRootNode['@id'];
        }
    } else {
        // assume it's a node object
        newRootNodeID = rootingInfo['@id'];
    }
    if (!newRootNodeID) {
        console.error("setTreeRoot(): no new root-node ID specified: "+ rootingInfo
                +" <"+ (typeof rootingInfo) +">");
        return;
    }
    var newRootNode = getTreeNodeByID(tree, newRootNodeID);
    if (!newRootNode) {
        console.error("setTreeRoot(): couldn't find the new root node, ID = "+ newRootNodeID
                +" <"+ (typeof newRootNodeID) +">");
        return;
    }

    // make any changes required to the old root node
    var specifiedRoot = tree['^ot:specifiedRoot'] || null;
    var oldRootNode = specifiedRoot ? getTreeNodeByID(tree, specifiedRoot) : tree.node[0];
    delete oldRootNode['@root'];
    // TODO: if this node has just two neighbors, remove it and one adjacent edge..?

    // update tree and node properties
    tree['^ot:specifiedRoot'] = newRootNodeID;
    tree['^ot:unrootedTree'] = false;
    newRootNode['@root'] = true;
    // selective deletion of d3 parent
    delete newRootNode['parent'];

    updateEdgesInTree( tree );
    drawTree( tree );
    nudgeTickler('TREES');
}

function toggleTreeRootStatus( tree, event ) {
    // toggle its ^ot:unrootedTree property (should always be present)
    // NOTE that radio-button values are strings, so we convert to boolean below
    var currentState = tree['^ot:unrootedTree'];
    var newState = $(event.target).val() === 'true';
    tree['^ot:unrootedTree'] = newState;

    // choosing non-arbitrary (biologically "correct") rooting should implicitly
    // select the current root node, since this signals intent
    var isBiologicallyCorrect = !(tree['^ot:unrootedTree']);
    if (isBiologicallyCorrect) {
        // if no specified root node, use the implicit root (first in nodes array)
        var specifiedRoot = tree['^ot:specifiedRoot'] || null;
        if (!specifiedRoot) {
            // use the implicit root (first in nodes array)
            var rootNodeID = tree.node[0]['@id'];
            tree['^ot:specifiedRoot'] = rootNodeID;
        }
    }
    nudgeTickler('TREES');
    return true; // update the checkbox
}

function getTreeNodeBetween( tree, nodeID_A, nodeID_B ) {
    // mostly used to detect "latent" (unused) root nodes
    var edgesFromA = getTreeEdgesByID( tree, nodeID_A, 'ANY' );
    var edgesFromB = getTreeEdgesByID( tree, nodeID_B, 'ANY' );

    // gather the "other" node for each edge of A and B
    var neighborNodes_A = $.map(edgesFromA, function(e) {
        return (e['@source'] === nodeID_A) ? e['@target'] : e['@source'];
    });
    var neighborNodes_B = $.map(edgesFromB, function(e) {
        return (e['@source'] === nodeID_B) ? e['@target'] : e['@source'];
    });
    var commonNeighbors = $.map(neighborNodes_A,function(n){
        return $.inArray(n, neighborNodes_B) < 0 ? null : n;}
    );
    // we're looking for one common neighbor, possibly a latent root node
    switch( commonNeighbors.length ) {
        case 1:
            return getTreeNodeByID( tree, commonNeighbors[0] );

        case 0:
            // no such node exists
            return null;

        default:
            console.error('getTreeNodeBetween( '+ nodeID_A +', '+ nodeID_B +' ) reports multiple common neighbors!');
            console.error( commonNeighbors );
            return null;
    }
}
function addTreeNodeBetween( tree, nodeID_A, nodeID_B ) {
    // try to add such a node, using our ad-hoc node and edge, as needed
    var adHocRootID = getAdHocRootID(tree);
    if ((nodeID_A === adHocRootID) || (nodeID_B === adHocRootID)) {
        console.warn('addTreeNodeBetween(): One of these nodes is already the ad-hoc root, bailing out now.');
        return getAdHocRoot(tree);
    }
    var edgesFromA = getTreeEdgesByID( tree, nodeID_A, 'ANY' );
    var edgesFromB = getTreeEdgesByID( tree, nodeID_B, 'ANY' );

    // if there's a common edge, insert a node there
    var commonEdges = $.map(edgesFromA,function(n) {
        return $.inArray(n, edgesFromB) < 0 ? null : n;
    });

    switch( commonEdges.length ) {
        case 1:
            // this is the expected case; retrieve (or create) this tree's ad-hoc root node
            var adHocRootNode = getAdHocRoot(tree);
            if (!adHocRootNode) {
                // create the ad-hoc root node
                adHocRootNode = {
                    '@id': getAdHocRootID(tree)
                };
                tree.node.push(adHocRootNode);
            }

            // retrieve (or create) the ad-hoc edge we need
            var adHocRootEdge = getAdHocEdge(tree);
            if (!adHocRootEdge) {
                // create the ad-hoc root edge
                adHocRootEdge = {
                    '@id': getAdHocEdgeID(tree),
                    '@source': getAdHocRootID(tree),
                    '@target': null  // we'll set this below
                };
                tree.edge.push(adHocRootEdge);
            } else {
                detachAdHocRootElements(tree);
                // N.B. this also undoes any reversal of the existing ad-hoc edge
            }

            // re-wire the existing edge (and the new one) with minimal changes
            var existingEdge = commonEdges[0];
            existingEdge['@source'] = getAdHocRootID(tree);
            if (existingEdge['@target'] === nodeID_A) {
                adHocRootEdge['@target'] = nodeID_B;
            } else {
                // assume its target is B
                adHocRootEdge['@target'] = nodeID_A;
            }

            // force rebuild of node+edge lookups
            clearFastLookup('NODES_BY_ID');
            clearFastLookup('TREES_BY_OTU_ID');
            clearFastLookup('EDGES_BY_SOURCE_ID');
            clearFastLookup('EDGES_BY_TARGET_ID');

            return adHocRootNode;

        case 0:
            // in principle we could add a node and two edges, but that's out of scope for now
            console.error('addTreeNodeBetween( '+ nodeID_A +', '+ nodeID_B +' ) reports no common edges!');
            return null;

        default:
            console.error('addTreeNodeBetween( '+ nodeID_A +', '+ nodeID_B +' ) reports multiple common edges!');
            console.error( commonEdges );
            return null;
    }
}

// define special, tree-specific element IDs just once
function getAdHocRootID(tree) {
    return (tree['@id'] +'_ROOT');
}
function getAdHocEdgeID(tree) {
    return (tree['@id'] +'_ROOT_EDGE');
}

// fetch the actual elements (per tree)
function getAdHocRoot(tree) {
    // return the node, or null if not found
    return getTreeNodeByID(tree, getAdHocRootID(tree));
}
function getAdHocEdge(tree) {
    // return the edge, or null if not found
    var foundEdge = null;
    $.each(getTreeEdgesByID(tree, getAdHocRootID(tree), 'ANY'), function(index, e) {
        if (e['@id'] === getAdHocEdgeID(tree)) {
            foundEdge = e;
        }
    });
    return foundEdge;
}

// test and manipulate the ad-hoc elements
function adHocRootInUse( tree ) {
    return (tree['^ot:specifiedRoot'] === getAdHocRootID(tree));
}
function cleanupAdHocRoot( tree ) {
    // call this before saving study data, to remove unused ad-hoc elements
    if (!adHocRootInUse(tree)) {
        removeAdHocRootElements(tree);
    }
}
function detachAdHocRootElements( tree ) {
    // detach the ad-hoc root node and/or its companion edge from the tree
    var adHocRootNode = getAdHocRoot(tree);
    if (adHocRootNode) {
        var adHocRootEdge = getAdHocEdge(tree);
        if (adHocRootEdge) {
            // N.B. watch for a reversed ad-hoc edge (flipped source and target)! 
            //var normalNeighbor = (adHocRootEdge['@source'] === getAdHocRootID(tree)) ? '@target' : '@source';
            if (adHocRootEdge['@target'] === getAdHocRootID(tree)) {
                reverseEdgeDirection(adHocRootEdge);
                // We always clear the fast lookups below, so skip this here.
                if (adHocRootEdge['@source'] !== getAdHocRootID(tree)) {
                    // this should never be the case!
                    console.error('Ad-hoc root node and edge are not attached!');
                    console.error(adHocRootEdge);
                }
            }

            var edgesFromRoot = getTreeEdgesByID( tree, getAdHocRootID(tree), 'ANY' );
            $.each(edgesFromRoot, function(index, e) {
                if (e !== adHocRootEdge) {
                    // attach all "loose ends" to an existing node
                    if (e['@source'] === getAdHocRootID(tree)) {
                        e['@source'] = adHocRootEdge['@target'];
                    } else {
                        e['@target'] = adHocRootEdge['@target'];
                    }
                }
            });

            // detach the ad-hoc edge from all but the ad-hoc root
            adHocRootEdge['@target'] = null;
        }
    }

    // force rebuild of edge lookups
    clearFastLookup('EDGES_BY_SOURCE_ID');
    clearFastLookup('EDGES_BY_TARGET_ID');

    // N.B. don't worry about study['^ot:specifiedRoot'] here, since we're
    // actively re-rooting or doing final cleanup
}
function removeAdHocRootElements( tree ) {
    // N.B. Assumes that the ad-hoc root is not in use, or that we're in the
    // process of re-rooting
    if (adHocRootInUse(tree)) {
        console.warn('removeAdHocRootElements(): ad-hoc root is in use! detaching now...');
        detachAdHocRootElements(tree);  // just in case
    }

    // search and destroy the node and/or edge
    var adHocRootNode = getAdHocRoot(tree);
    if (adHocRootNode) {
        removeFromArray( adHocRootNode, tree.node );
    }
    var adHocRootEdge = getAdHocEdge(tree);
    if (adHocRootEdge) {
        removeFromArray( adHocRootEdge, tree.edge );
    }

    // force rebuild of node+edge lookups
    clearFastLookup('NODES_BY_ID');
    clearFastLookup('TREES_BY_OTU_ID');
    clearFastLookup('EDGES_BY_SOURCE_ID');
    clearFastLookup('EDGES_BY_TARGET_ID');
}

function setTreeIngroup( treeOrID, ingroupNodeOrID ) {
    // (Re)set the node that defines the ingroup, i.e., the clade to be
    // used in synthesis
    var tree = null;
    if (typeof(treeOrID) === 'object') {
        tree = treeOrID;
    } else {
        tree = getTreeByID(treeOrID);
    }

    ingroupNodeID = null;
    if (ingroupNodeOrID) {
        if (typeof(ingroupNodeOrID) === 'object') {
            ingroupNodeID = ingroupNodeOrID['@id'];
        } else {
            ingroupNodeID = ingroupNodeOrID;
        }
    }
    if (ingroupNodeID) {
        tree['^ot:inGroupClade'] = ingroupNodeID;
    } else {
        // clear the current root
        tree['^ot:inGroupClade'] = '';
    }
    updateEdgesInTree( tree );
    drawTree( tree );
    nudgeTickler('TREES');
}

function updateEdgesInTree( tree ) {
    // Update the direction of all edges in this tree, based on its
    // chosen or "natural" root (redefining ingroup in some cases)
    var specifiedRoot = tree['^ot:specifiedRoot'] || null;
    // if no specified root node, use the implicit root (first in nodes array)
    var rootNodeID = specifiedRoot ? specifiedRoot : tree.node[0]['@id'];

    var inGroupClade = tree['^ot:inGroupClade'] || null;

    // root is defined, and possibly ingroup; set direction away from root for all edges
    sweepEdgePolarity( tree, rootNodeID, null, inGroupClade );
    clearFastLookup('EDGES_BY_SOURCE_ID');
    clearFastLookup('EDGES_BY_TARGET_ID');
    // set (or remove) ot:isLeaf flags on all nodes
    updateLeafNodeFlags(tree);
    removeTaxonMappingInfoFromTree( tree );  // clear cached info
}

function sweepEdgePolarity( tree, startNodeID, upstreamNeighborID, inGroupClade, insideInGroupClade ) {
    // Push all adjacent edges away from the starting node, except for its
    // upstream neighbor. This should recurse to sweep an entire tree (or
    // subtree) until we reach the tips.

    // gather all adjacent edges, regardless of current direction
    var edges = getTreeEdgesByID(tree, startNodeID, 'ANY');

    $.each(edges, function(i, edge) {
        // test the "other" ID to see if it should be up- or downstream
        var sourceID = edge['@source'];
        var targetID = edge['@target'];
        var otherID = sourceID === startNodeID ? targetID : sourceID;

        if (upstreamNeighborID && otherID === upstreamNeighborID) {
            if (targetID === upstreamNeighborID) {
                reverseEdgeDirection( edge );
            }
            return;
        }

        // we should recurse through all downstream nodes
        if (targetID === startNodeID) {
            reverseEdgeDirection( edge );
        }

        if (!insideInGroupClade) {
            // check to see if we just hit the ingroup clade MRCA
            if (startNodeID === inGroupClade) {
                insideInGroupClade = true;
            }
        }
        // mark the start-node accordingly (so we can distinguish ingroup vs.
        // outgroup paths in the tree view)
        var startNode = getTreeNodeByID(tree, startNodeID);
        startNode.ingroup = insideInGroupClade;

        // note that we're sweeping *away* from the current startNode
        sweepEdgePolarity( tree, otherID, startNodeID, inGroupClade, insideInGroupClade );
    });
}


function getTreeByID(id) {
    var allTrees = [];
    if (!viewModel) {
        return null;
    }
    $.each(viewModel.nexml.trees, function(i, treesCollection) {
        $.each(treesCollection.tree, function(i, tree) {
            allTrees.push( tree );
        });
    });
    var foundTree = null;
    $.each( allTrees, function(i, tree) {
        if (tree['@id'] === id) {
            foundTree = tree;
            return false;
        }
    });
    return foundTree;
}
function getTreeNodeByID(tree, id) {
    // There should be only one matching (or none) within a tree
    // (NOTE that we now use a flat collection across all trees, so disregard 'tree' argument)
    var lookup = getFastLookup('NODES_BY_ID');
    return lookup[ id ] || null;
}
function getTreeContainingOTUID(tree, id) {
    // There should be only one matching (or none) within a tree
    // (NOTE that we now use a flat collection across all trees, so disregard 'tree' argument)
    var lookup = getFastLookup('TREES_BY_OTU_ID');
    return lookup[ id ] || null;
}

function getTreeEdgesByID(tree, id, sourceOrTarget) {
    // look for any edges associated with the specified *node* ID; return
    // an array of 0, 1, or more matching edges within a tree
    //
    // 'sourceOrTarget' lets us filter, should be 'SOURCE', 'TARGET', 'ANY'
    var foundEdges = [];
    var matchingEdges = null;

    if ((sourceOrTarget === 'SOURCE') || (sourceOrTarget === 'ANY')) {
        // fetch and add edges with this source node
        var sourceLookup = getFastLookup('EDGES_BY_SOURCE_ID');
        matchingEdges = sourceLookup[ id ];
        if (matchingEdges) {
            foundEdges = foundEdges.concat( matchingEdges );
        }
    }

    if ((sourceOrTarget === 'TARGET') || (sourceOrTarget === 'ANY')) {
        // fetch and add edges with this target node
        var targetLookup = getFastLookup('EDGES_BY_TARGET_ID');
        matchingEdges = targetLookup[ id ];
        if (matchingEdges) {
            foundEdges = foundEdges.concat( matchingEdges );
        }
    }

    return foundEdges;
}
function reverseEdgeDirection( edge ) {
    var oldSource = edge['@source'];
    edge['@source'] = edge['@target'];
    edge['@target'] = oldSource;
}
function updateLeafNodeFlags(tree) {
    // ASSUMES that this parent-node lookup is up to date
    var sourceLookup = getFastLookup('EDGES_BY_SOURCE_ID');
    $.each( tree.node, function( i, node ) {
        var nodeID = node['@id'];
        parentEdges = sourceLookup[ nodeID ];
        if (parentEdges) {
            // it's a parent, so not a leaf
            if ('^ot:isLeaf' in node) {
                delete node['^ot:isLeaf'];
                //console.log(">> REMOVING isLeaf from node "+ nodeID);
            }
        } else {
            // a leaf node is nobody's parent, (re)set its flag
            if (!('^ot:isLeaf' in node) || node['^ot:isLeaf'] !== true) {
                node['^ot:isLeaf'] = true;
                //console.log(">> SETTING isLeaf for node "+ nodeID);
            }
        }
    });
    /* NOTE: Other related properties are for d3 (display) only, so no action
     * required; see clearD3PropertiesFromTree()
     *  .parent
     *  .children
     *  .rootDistsance
     *  .ingroup
     *  .depth
     *  .length
     *  .rootDist
     */
}

function getTreeNodeLabel(tree, node, importantNodeIDs) {
    /* Return the best available label for this node, and its type:
         'tip (mapped OTU)'         mapped to OT taxonomy, preferred
         'tip (original)'           OTU is not yet mapped
         'internal node (support)'
         'internal node (other)'
         'internal node (aligned)'  from conflict service
         'internal node (ambiguous)'
         'empty'                    no visible label
         'node id'                  a last resort, rarely useful  [DEPRECATED]
         'positional label'         eg, "tree root"  [DEPRECATED]
    */
    var labelInfo = {};
    var nodeID = node['@id'];
    /* apply simple positional labels?
    if (nodeID === importantNodeIDs.inGroupClade) {
        labelInfo.label = "ingroup clade";
        labelInfo.labelType = 'positional label';
        return labelInfo;
    }
    if (nodeID === importantNodeIDs.treeRoot) {
        labelInfo.label = "tree root";
        labelInfo.labelType = 'positional label';
        return labelInfo;
    }
    */
    var itsOTU = node['@otu'];
    if (itsOTU) {
        // use a mapped taxon name (or original for this OTU)
        var otu = getOTUByID( itsOTU );
        var itsMappedLabel = $.trim(otu['^ot:ottTaxonName']);
        if (itsMappedLabel) {
            labelInfo.label = itsMappedLabel;
            labelInfo.labelType = 'tip (mapped OTU)';
            labelInfo.originalLabel = otu['^ot:originalLabel'];
        } else {
            labelInfo.label = otu['^ot:originalLabel'];
            labelInfo.labelType = 'tip (original)';
        }
    } else if (('@label' in node) && (tree['^ot:nodeLabelMode'] === 'ot:other')) {
        // this is probably a previously assigned taxon name
        labelInfo.label = node['@label'];
        labelInfo.labelType = 'internal node (other)';
        // include tree['^ot:nodeLabelDescription'] ?
    } else if (('conflictDetails' in node) && 
               ($.inArray(node.conflictDetails.status, ['supported_by', 'terminal', 'partial_path_of', 'mapped_to_taxon']) !== -1) &&
               node.conflictDetails.witness_name) {
        // use any 'aligned' taxon name provided by conflict service
        labelInfo.label = node.conflictDetails.witness_name;
        labelInfo.labelType = 'internal node (aligned)';
    } else if ('@label' in node) {
        if (tree['^ot:nodeLabelMode']) {
            // use any support values (1 of 2, see below)
            labelInfo.label = node['@label'];
            labelInfo.labelType = 'internal node (support)';
        } else {
            // use any ambiguous label (unresolved type) for display
            labelInfo.label = node['@label'];
            labelInfo.labelType = 'internal node (ambiguous)';
        }
    } else if (node.adjacentEdgeLabel) {
        // any label from the adjacent (root-ward) edge is support (2 of 2, see above)
        labelInfo.label = node.adjacentEdgeLabel;
        labelInfo.labelType = 'internal node (support)';
    } else {
        // show the bare node ID as our last resort
        labelInfo.label = nodeID;
        labelInfo.labelType = 'empty';
    }
    return labelInfo;
}

function filenameFromFakePath( path ) {
    // trim any path (possibly fake) from an input[type='file'] widget
    var delim = (path.indexOf('\\') !== -1) ? '\\' : '/';
    var parts = path.split(delim);
    var howManyParts = parts.length;
    if (howManyParts === 1) {
        return path;
    }
    return parts[howManyParts-1];
}
function updateNewTreeUploadForm() {
    // check all fields, enable/disable button
    var readyToSubmit = true;

    var chosenFormat = $.trim( $('#tree-import-format').val() );
    if (chosenFormat === '') {
        readyToSubmit = false;
    }

    //var chosenFile = $.trim( $('#treeupload').val() );
    // NO, this is routinely cleared by the upload widget; the file-name
    // display (white on blue) alongside, is actually a safer test.
    var chosenFile = $.trim( $('#upload-tree-info').text() );
    var pastedText = $.trim( $('#new-tree-text').val() );
    // either of these is acceptable
    if (pastedText === '' && chosenFile === '') {
        readyToSubmit = false;
    }

    var $submitBtn = $('[name=new-tree-submit]');
    if (readyToSubmit) {
        $submitBtn.removeAttr('disabled');
    } else {
        $submitBtn.attr('disabled', 'disabled');
    }
    return true;
}
function clearNewTreeUploadWidget() {
    // un-bind fileupload submission
    $('[name=new-tree-submit]').off('click');

    var $widget = $('#treeupload');
    $widget.val('');
    $widget.trigger('change');

    // reset the progress bar
    setTimeout( function() {
        $('#tree-upload-progress .bar').css( 'width', '0%' );
        $('#tree-upload-progress .bar span').text( '' );
    }, 500);
}
function generateTreeUploadID() {
    // generate a new/unique upload ID for this attempt
    var personalTimestamp = userLoginASCII + '.'+ new Date().getTime();
    return personalTimestamp;
}
function submitNewTree( form ) {
    // NOTE that this should submit the same arguments (except for file
    // data) as the fileupload behavior for #treeupload
    if (!remindAboutAddingLateData()) {
        return false;;  // showing the reminder instead
    }
    ///console.log("submitting tree...");

    showModalScreen("Adding tree...", {SHOW_BUSY_BAR:true});

    // @MTH:"no longer needed on upload"  $('[name=uploadid]').val( generateTreeUploadID() );

    // add hints for nicer element IDs to the form
    setElementIDHints();

    $.ajax({
        type: 'POST',
        dataType: 'json',
        // crossdomain: true,
        // contentType: "application/json; charset=utf-8",
        url: $('#tree-import-form').attr('action'),
        data: $('#tree-import-form').serialize(),
        complete: returnFromNewTreeSubmission
    });
}

function setElementIDHints() {
    // Populate these form values befor importing new elements, to guide the
    // creation of new NexSON elements on the server.
    var $form = $('#tree-import-form');
    $form.find('[name=idPrefix]').val('');  // clear this field
    $form.find('[name=firstAvailableEdgeID]').val( getNextElementOrdinalNumber('edge') );
    $form.find('[name=firstAvailableNodeID]').val( getNextElementOrdinalNumber('node') );
    $form.find('[name=firstAvailableOTUID]').val( getNextElementOrdinalNumber('otu') );
    $form.find('[name=firstAvailableOTUsID]').val( getNextElementOrdinalNumber('otus') );
    $form.find('[name=firstAvailableTreeID]').val( getNextElementOrdinalNumber('tree') );
    $form.find('[name=firstAvailableTreesID]').val( getNextElementOrdinalNumber('trees') );
    $form.find('[name=firstAvailableAnnotationID]').val( getNextElementOrdinalNumber('annotation') );
    $form.find('[name=firstAvailableAgentID]').val( getNextElementOrdinalNumber('agent') );
    $form.find('[name=firstAvailableMessageID]').val( getNextElementOrdinalNumber('message') );
}

function returnFromNewTreeSubmission( jqXHR, textStatus ) {
    // show results of tree submission, whether from submitNewTree()
    // or special (fileupload) behavior

    ///console.log('submitNewTree(): done! textStatus = '+ textStatus);
    // report errors or malformed data, if any
    if (textStatus !== 'success') {
        var errMsg;
        if ((jqXHR.status === 501) && (jqXHR.responseText.indexOf("Conversion") === 0)) {
            errMsg = 'Sorry, there was an error importing this tree. Please double-check its format and data. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">Show details</a><pre class="error-details" style="display: none;">'+ jqXHR.responseText +'</pre>';
        } else {
            errMsg = 'Sorry, there was an error adding this tree. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">Show details</a><pre class="error-details" style="display: none;">'+ jqXHR.responseText +'</pre>';
            console.warn("jqXHR.status: "+ jqXHR.status);
            console.warn("jqXHR.responseText: "+ jqXHR.responseText);
        }
        hideModalScreen();
        showErrorMessage(errMsg);
        return;
    }

    // Add supporting-file info for this tree's source file
    //console.log("status: "+ jqXHR.status);
    //console.log("statusText: "+ jqXHR.statusText);
    // convert raw response to JSON
    var responseJSON = $.parseJSON(jqXHR.responseText);
    var data = responseJSON['data']; //@MTH:"returned nexson now inside a 'data' property"
    //console.log("data: "+ data);

    // move its collections into the view model Nexson
    var nexmlName = ('nex:nexml' in data) ? 'nex:nexml' : 'nexml';

    // check for needed collections
    var itsOTUsCollection =  data[nexmlName]['otus'];
    var itsTreesCollection = data[nexmlName]['trees'];
    if (!itsOTUsCollection || !itsTreesCollection) {
        hideModalScreen();
        showErrorMessage('Sorry, no trees were found in this file.');
        return;
    }

    // coerce the inner array of each collection into an array
    // (override Badgerfish singletons)
    // NOTE that there may be multiple trees elements, otus elements
    $.each(itsOTUsCollection, function(i, otusElement) {
        otusElement['otu'] = makeArray( otusElement['otu'] );
    });

    $.each(itsTreesCollection, function(i, treesElement) {
        treesElement['tree'] = makeArray( treesElement['tree'] );
        $.each( treesElement.tree, function(i, tree) {
            normalizeTree( tree );
        });
    });

    try {
        $.merge(viewModel.nexml.otus, itsOTUsCollection);
        $.merge(viewModel.nexml.trees, itsTreesCollection);
    } catch(e) {
        console.error('Unable to push collections (needs Nexson upgrade)');
    }

    // update the files list (and auto-save?)
    var file = responseJSON.annotationFileInfo;
    getSupportingFiles().data.files.file.push(file);

    // clear the import form (using Clear button to capture all behavior)
    $('#tree-import-form :reset').click();

    showModalScreen("Merging trees and OTUs...", {SHOW_BUSY_BAR:true});

    // clean any client-side junk from the study
    scrubNexsonForTransport();

    $.ajax({
        type: 'POST',
        dataType: 'json',
        // crossdomain: true,
        contentType: "application/json; charset=utf-8",
        url: '/curator/default/merge_otus',
        processData: false,
        data: ('{"nexml":'+ JSON.stringify(viewModel.nexml) +'}'),
        error: returnFromOTUMerge,  // to suppress web2py's unhelpful error msg
        complete: returnFromOTUMerge
    });
}
function returnFromOTUMerge( jqXHR, textStatus ) {
    console.log('returnFromOTUMerge(), textStatus = '+ textStatus);
    // report errors or malformed data, if any
    var badResponse = false;
    var responseJSON = null;
    if (textStatus !== 'success') {
        badResponse = true;
    } else {
        // convert raw response to JSON
        responseJSON = $.parseJSON(jqXHR.responseText);
        if (responseJSON['error'] === 1) {
            badResponse = true;
        }
    }

    if (badResponse) {
        console.warn("jqXHR.status: "+ jqXHR.status);
        console.warn("jqXHR.responseText: "+ jqXHR.responseText);
        hideModalScreen();
        // TODO: This is going to leave a mess! Should we force a reload of the page at this point?
        showErrorMessage(
            'Sorry, there was an error merging trees and OTUs. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">' +
            'Show details</a><pre class="error-details" style="display: none;">'+ jqXHR.responseText +'</pre>'
        );
        return;
    }

    // replace the nexson in the viewmodel, but keep the rest
    replaceViewModelNexson( responseJSON.data.nexml );

    hideModalScreen();
    showSuccessMessage('Tree(s) added and merged.');
}

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

function adjustedLabelOrEmpty(label) {
    // We should only display an adjusted label if it's changed from the
    // original; otherwise return an empty string.
    if (typeof(label) === 'function') {
        label = label();
    }
    if (typeof(label) !== 'string') {
        // probably null, nothing to see here
        return "";
    }
    var adjusted = adjustedLabel(label);
    if (adjusted == label) {
        return "";
    }
    return adjusted;
}

function adjustedLabel(label) {
    // apply any active OTU mapping adjustments to this string
    if (typeof(label) === 'function') {
        label = label();
    }
    if (typeof(label) !== 'string') {
        // probably null
        return label;
    }
    var adjusted = label;
    // apply any active subsitutions in the viewMdel
    var subList = getOTUMappingHints().data.substitutions.substitution;
    $.each(subList, function(i, subst) {
        if (!subst['@active']) {
            return true; // skip to next adjustment
        }
        var oldText = subst.old.$;
        var newText = subst.new.$;
        if ($.trim(oldText) === $.trim(newText) === "") {
            return true; // skip to next adjustment
        }
        try {
            //var pattern = new RegExp(oldText, 'g');  // g = replace ALL instances
            // NO, this causes weird repetition in common cases
            var pattern = new RegExp(oldText);
            adjusted = adjusted.replace(pattern, newText);
            // clear any stale invalid-regex marking on this field
            if (!subst['@valid']) {
                subst['@valid'] = true;
            }
            subst['@valid'] = true;
        } catch(e) {
            // there's probably invalid regex in the field... mark it and skip
            if (!subst['@valid']) {
                subst['@valid'] = false;
            }
            subst['@valid'] = false;
        }
    });
    return adjusted;
}

/*
 * Templates for curator annotations
 */

var nexsonTemplates = {

    // all annotations created here should share some identifying information
    'curator annotation agent': {
        "@id": "opentree-curation-webapp",//  OR use a generated (unique) ID
        "@name": "OpenTree curation webapp",
        "@description": "Web-based interface for submitting, editing, and reviewing studies in the Open Tree of Life project.",
        "@url": "https://github.com/OpenTreeOfLife/opentree",
        "@version": "0.0.0"   // TODO
    },

    'supporting files': {
        /* App-specific metadata about associated support files for this study.
         * This is intended to be temporary storage, until we can move all
         * files and trees into a data repository. In the meantime, the
         * curation webapp should offer the ability to upload and manage these files.
         *
         * Once the data has been safely migrated from the Open Tree Nexson store,
         * we should drop all of this and populate the study's main
         * 'ot:dataDeposit' with the archival DOI or URL.
         *
         * NOTE that this object describes an annotation bundle with
         * several main parts, each of which will be applied separately to
         * the target Nexml:
         *  targetElement  // supplied by template consumer
         *  annotationEvent
         *  agent(s)
         *  message(s)
         */
        // 'targetElement': ,
        'annotationEvent': {
            "@id": "supporting-files-metadata",
            "@description": "Describes supporting data files for this study",
            "@wasAssociatedWithAgentId": "opentree-curation-webapp",
            // dates are UTC strings, eg, "2013-10-27T02:47:35.029323"
            "@dateCreated": new Date().toISOString(),
            "@passedChecks": true,  // this is moot
            "@preserve": true,
            "message": [{
                //"@id": "",      // will be assigned via $.extend
                "@severity": "INFO",
                "@code": "SUPPORTING_FILE_INFO",
                "@humanMessageType": "NONE",
                "data": {
                    "@movedToPermanentArchive": false,
                        // OR check for ot:dataDeposit?
                    "files": { "file": [
                        /* an array of objects based on 'single supporting file' below */
                    ]}
                },
                "refersTo": {
                    "@top": {"$": "meta"}
                }
            }]
            // "otherProperty": [ ]  // SKIP THIS, use messages for details
        }
        // 'agent': null,      // will be provided by template consumer
    }, // END of 'supporting files' template

    'single supporting file': {
        /* A single file added in the Files section
         */
        "@filename": "",
        "@url": "",
        "@type": "",  // eg, 'Microsoft Excel spreadsheet'
        "description": {"$": ""},  // eg, "Alignment data for tree #3"
        "sourceForTree": [ ],  // used IF this file was the original data for one or more trees
        "@size": ""   // eg, '241 KB'
    }, // END of 'single supporting file' template

    'single annotation event': {
        // "@id": "",
        "@description": "",
        "@wasAssociatedWithAgentId": "",
        "@dateCreated": "",
        //"@passedChecks": true,
        //"@preserve": true,
        //"@otherProperty": []
        "message": []
    },
    'single annotation agent': {
        // "@id": "",
        "@name": "",
        "@description": "",
        "@url": "",
        "@version": ""
        //"otherProperty": []
    },
    'single annotation message': {
        // "@id": "",
        //"@wasAttributedToId": "",
        "@severity": "",
        "@code": "",
        "@humanMessageType": "",
        "humanMessage": {"$": ""},
        "dataAnnotation": {"$": ""},
        "data": {},
        "refersTo": {},
        "other": {}
    },

    'OTU mapping hints': {
        /* A series of regular expressions ('substitutions') to facilitate
         * mapping of leaf nodes in study trees to known taxa. Also hints to
         * the most likely search context for these names.
         *
         * TODO: Should we specify hints per-tree, instead of per-study?
         *
         * NOTE that this object describes an annotation bundle with
         * several main parts, each of which will be applied separately to
         * the target Nexml:
         *  targetElement  // supplied by template consumer
         *  annotationEvent
         *  agent(s)
         *  message(s)
         */
        // 'targetElement': ,
        'annotationEvent': {
            "@id": "otu-mapping-hints",
            "@description": "Aids for mapping study OTUs to OTT taxa",
            "@wasAssociatedWithAgentId": "opentree-curation-webapp",
            // dates are UTC strings, eg, "2013-10-27T02:47:35.029323"
            "@dateCreated": new Date().toISOString(),
            "@passedChecks": true,  // this is moot
            "@preserve": true,
            "message": [{
                //"@id": "",      // will be assigned via $.extend
                "@severity": "INFO",
                "@code": "OTU_MAPPING_HINTS",  // N.B. independent of the OTU_MAPPING_HINTS tickler
                "@humanMessageType": "NONE",
                "data": {
                    "searchContext": {"$": "All life"},
                    "useFuzzyMatching": false,
                    "substitutions": {"substitution": [
                        // always one default (empty) substitution
                        {
                            "old": {"$": ""},
                            "new": {"$": ""},
                            "@valid": true,
                            "@active": false
                        }
                    ]}
                },
                "refersTo": {
                    "@top": {"$": "meta"}
                }
            }]
            // "otherProperty": [ ]  // SKIP THIS, use messages for details
        }
        // 'agent': null,      // will be provided by template consumer
    }, // END of 'OTU mapping hints' template

    'mapping substitution': {
        /* A single substitution added in the OTU Mapping section
         */
        "old": {"$": ""},
        "new": {"$": ""},
        "@valid": true,
        "@active": false
    } // END of 'mapping substitution' template

} // END of nexsonTemplates

function cloneFromNexsonTemplate( templateName ) {
    return $.extend( true, {}, nexsonTemplates[ templateName ]);
}

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

function getSupportingFiles(nexml) {
    // retrieve this annotation message from the model (or other specified
    // object); return null if not found
    if (!nexml) {
        nexml = viewModel.nexml;
    }
    var annotations = getStudyAnnotationEvents( nexml );
    var filesAnnotation = null;
    $.each(makeArray(annotations.annotation), function(i, annotation) {
        var itsID = ko.unwrap(annotation['@id']);

        if (itsID === 'supporting-files-metadata') {
            filesAnnotation = annotation;
            return false;
        }
    });

    //return filesAnnotation;
    if (!filesAnnotation) {
        return null;
    }

    var filesMessages = makeArray( filesAnnotation.message );
    if (filesMessages.length > 0) {
        // return its message with the interesting parts
        return filesMessages[0];
    }
    return null;
}
function addSupportingFileFromURL() {
    // TODO: support file upload from desktop
    // TODO: upload data in a preparatory step?

    // initial version supports URL entry only...
    var chosenURL = $.trim( $('[name=new-file-url]').val() || '');
    if (chosenURL === '') {
        showErrorMessage('Please enter a valid URL.');
        return;
    }

    // TODO: support import-from-URL via AJAX
    showModalScreen("Adding supporting file...", {SHOW_BUSY_BAR:true});

    $.ajax({
        type: 'POST',
        dataType: 'json',
        // crossdomain: true,
        // contentType: "application/json; charset=utf-8",
        url: API_create_file_POST_url,
        data: {
            // TODO: gather chosen file-creation options
            'file_url': chosenURL
        },
        success: function( data, textStatus, jqXHR ) {
            // creation method should return either our JSON structure describing the new file, or an error
            hideModalScreen();

            ///console.log('addSupportingFileFromURL(): done! textStatus = '+ textStatus);
            // report errors or malformed data, if any
            if (textStatus !== 'success') {
                showErrorMessage('Sorry, there was an error adding this file.');
                return;
            }

            showSuccessMessage('File added.');
            // update the files list (and auto-save?)
            var file = cloneFromNexsonTemplate('single supporting file');
            file['@filename'] = data.filename || "";
            file['@url'] = data.url || "";
            file['@type'] = data.type || "";
            file.description.$ = data.description || "";
            file['sourceForTree'] = data.sourceForTree || [ ];
            file['@size'] = data.size || "";

            getSupportingFiles().data.files.file.push(file);
            nudgeTickler('SUPPORTING_FILES');
        },
        error: function( data, textStatus, jqXHR ) {
            hideModalScreen();
            showErrorMessage('Sorry, there was an error adding this file.');
        }
    });

}

function removeTree( tree ) {
    // let's be sure, since adding may be slow...
    if (!confirm("Are you sure you want to delete this tree from the collection?")) {
        return;
    }

    // remove this tree
    $.each(viewModel.nexml.trees, function(i, treesCollection) {
        if ($.inArray(tree, treesCollection.tree) !== -1) {
            removeFromArray( tree, treesCollection.tree );
        }
    });

    // TODO: remove any captive trees- and OTUs-collections
    // TODO: remove any otus not used elsewhere?
    // TODO: remove related annotation events and agents?

    // force rebuild of all tree-related lookups
    buildFastLookup('NODES_BY_ID');
    buildFastLookup('TREES_BY_OTU_ID');
    buildFastLookup('OTUS_BY_ID');
    buildFastLookup('EDGES_BY_SOURCE_ID');
    buildFastLookup('EDGES_BY_TARGET_ID');

    // force update of curation UI in all relevant areas
    nudgeTickler('TREES');
    nudgeTickler('SUPPORTING_FILES');
    nudgeTickler('GENERAL_METADATA');
    nudgeTickler('VISIBLE_OTU_MAPPINGS');
    nudgeTickler('STUDY_HAS_CHANGED');
}

function removeSupportingFile( fileInfo ) {
    // let's be sure, since adding may be slow...
    if (!confirm("Are you sure you want to delete this file?")) {
        return;
    }

    ///var removeURL = API_remove_file_DELETE_url.replace('STUDY_ID', 'TODO').replace('FILE_ID', 'TODO');

    // TODO: do the actual removal (from the remote file-store) via AJAX
    showModalScreen("Removing supporting file...", {SHOW_BUSY_BAR:true});

    $.ajax({
        // type: 'DELETE',
        dataType: 'json',
        // crossdomain: true,
        // contentType: "application/json; charset=utf-8",
        //url: removeURL // modified API call, see above
        url: '/curator/supporting_files/delete_file/'+ fileInfo['@filename'],
        data: { },
        success: function( data, textStatus, jqXHR ) {
            // report errors or malformed data, if any
            if (textStatus !== 'success') {
                showErrorMessage('Sorry, there was an error removing this file.');
                console.log("ERROR: textStatus !== 'success', but "+ textStatus);
                return;
            }
            if (data.message !== 'File deleted') {
                showErrorMessage('Sorry, there was an error removing this file.');
                console.log("ERROR: message !== 'File deleted', but "+ data.message);
                return;
            }

            hideModalScreen();
            showSuccessMessage('File removed.');
            // update the files list
            var fileList = getSupportingFiles().data.files.file;
            removeFromArray( fileInfo, fileList );
            nudgeTickler('SUPPORTING_FILES');
        },
        error: function( data, textStatus, jqXHR ) {
            hideModalScreen();
            showErrorMessage('Sorry, there was an error removing this file.');
            console.log("ERROR: textStatus: "+ textStatus);
            return;
        }
    });
}

function getOTUMappingHints(nexml) {
    // retrieve this annotation message from the model (or other specified
    // object); return null if not found
    if (!nexml) {
        nexml = viewModel.nexml;
    }
    var annotations = getStudyAnnotationEvents( nexml );
    var hintsAnnotation = null;
    $.each(makeArray(annotations.annotation), function(i, annotation) {
        var itsID = ko.unwrap( annotation['@id'] );

        if (itsID === 'otu-mapping-hints') {
            hintsAnnotation = annotation;
            return false;
        }
    });

    //return hintsAnnotation;
    if (!hintsAnnotation) {
        return null;
    }

    var hintsMessages = makeArray( hintsAnnotation.message );
    if (hintsMessages.length > 0) {
        // return its message with the interesting parts
        return hintsMessages[0];
    }
    return null;
}
function addSubstitution( clicked ) {
    var subst = cloneFromNexsonTemplate('mapping substitution');

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
    getOTUMappingHints().data.substitutions.substitution.push(subst);
    clearFailedOTUList();
    nudgeTickler('OTU_MAPPING_HINTS');
}
function removeSubstitution( data ) {
    var subList = getOTUMappingHints().data.substitutions.substitution;
    removeFromArray( data, subList );
    if (subList.length === 0) {
        // add an inactive substitution with prompts
        addSubstitution();
    } else {
        clearFailedOTUList();
        nudgeTickler('OTU_MAPPING_HINTS');
    }
}
function updateMappingHints( data ) {
    // after-effects of changes to search context or any substitution
    clearFailedOTUList();
    nudgeTickler('OTU_MAPPING_HINTS');
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

var autoMappingInProgress = ko.observable(false);
var currentlyMappingOTUs = ko.observableArray([]); // drives spinners, etc.
var failedMappingOTUs = ko.observableArray([]); // ignore these until we have new mapping hints
var proposedOTUMappings = ko.observable({}); // stored any labels proposed by server, keyed by OTU id
var bogusEditedLabelCounter = ko.observable(1);  // this just nudges the label-editing UI to refresh!

// keep track of the last (de)selected list item (its position)
var lastClickedTogglePosition = null;
function toggleMappingForOTU(otu, evt) {
    var $toggle, newState;
    // allow triggering this from anywhere in the row
    if ($(evt.target).is(':checkbox')) {
        $toggle = $(evt.target);
        // N.B. user's click (or the caller) has already set its state!
        newState = $toggle.is(':checked');
    } else {
        $toggle = $(evt.target).closest('tr').find('input.map-toggle');
        // clicking elsewhere should toggle checkbox state!
        newState = !($toggle.is(':checked'));
        forceToggleCheckbox($toggle, newState);
    }
    // add (or remove) highlight color that works with hover-color
    /* N.B. that this duplicates the effect of Knockout bindings on these table
     * rows! This is deliberate, since we're often toggling *many* rows at
     * once, so we need to update visual style while postponing any tickler
     * nudge 'til we're done.
     */
    if (newState) {
        $toggle.closest('tr').addClass('warning');
    } else {
        $toggle.closest('tr').removeClass('warning');
    }
    // if this is the original click event; check for a range!
    if (typeof(evt.shiftKey) !== 'undefined') {
        // determine the position (nth checkbox) of this OTU in the visible list
        var $visibleToggles = $toggle.closest('table').find('input.map-toggle');
        var newListPosition = $.inArray( $toggle[0], $visibleToggles);
        if (evt.shiftKey && typeof(lastClickedTogglePosition) === 'number') {
            forceMappingForRangeOfOTUs( otu['selectedForAction'], lastClickedTogglePosition, newListPosition );
        }
        // in any case, make this the new range-starter
        lastClickedTogglePosition = newListPosition;
    }
    evt.stopPropagation();
    return true;  // update the checkbox
}
function forceMappingForRangeOfOTUs( newState, posA, posB ) {
    // update selected state for all checkboxes in this range
    var $allMappingToggles = $('input.map-toggle');
    var $togglesInRange;
    if (posB > posA) {
        $togglesInRange = $allMappingToggles.slice(posA, posB+1);
    } else {
        $togglesInRange = $allMappingToggles.slice(posB, posA+1);
    }
    $togglesInRange.each(function() {
        forceToggleCheckbox(this, newState);
    });
}

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
function toggleAllMappingCheckboxes(cb) {
    var $bigToggle = $(cb);
    var $allMappingToggles = $('input.map-toggle');
    var newState = $bigToggle.is(':checked');
    $allMappingToggles.each(function() {
        forceToggleCheckbox(this, newState);
    });
    return true;
}

function editOTULabel(otu, evt) {
    var OTUid = otu['@id'];
    var originalLabel = otu['^ot:originalLabel'];
    otu['^ot:altLabel'] = adjustedLabel(originalLabel);

    // Mark this OTU as selected for mapping.
    otu['selectedForAction'] = true;

    // If we have a proper mouse event, try to move input focus to this field
    // and pre-select its full text.
    //
    // N.B. There's a 'hasFocus' binding with similar behavior, but it's tricky
    // to mark the new field vs. existing ones:
    //   http://knockoutjs.com/documentation/hasfocus-binding.html
    if ('currentTarget' in evt) {
        // capture the current table row before DOM updates
        var $currentRow = $(evt.currentTarget).closest('tr');
        setTimeout(function() {
            var $editField = $currentRow.find('input:text');
            $editField.focus().select();
        }, 50);
    }

    // this should make the editor appear (altering the DOM)
    bogusEditedLabelCounter( bogusEditedLabelCounter() + 1);
    nudgeTickler( 'OTU_MAPPING_HINTS'); // to refresh 'selected' checkbox
}
function modifyEditedLabel(otu) {
    // remove its otu-id from failed-OTU list when user makes changes
    var OTUid = otu['@id'];
    failedMappingOTUs.remove(OTUid);
    // nudge to update OTU list immediately
    bogusEditedLabelCounter( bogusEditedLabelCounter() + 1);
    nudgeAutoMapping();

    nudgeTickler( 'OTU_MAPPING_HINTS');
}
function revertOTULabel(otu) {
    // undoes 'editOTULabel', releasing a label to use shared hints
    var OTUid = otu['@id'];
    delete otu['^ot:altLabel'];
    failedMappingOTUs.remove(OTUid );
    // this should make the editor disappear and revert its adjusted label
    bogusEditedLabelCounter( bogusEditedLabelCounter() + 1);
    nudgeAutoMapping();
}

function proposeOTULabel(OTUid, mappingInfo) {
    // stash one (or more) mappings as options for this OTU
    if ($.isArray( mappingInfo)) {
        proposedOTUMappings()[ OTUid ] = ko.observableArray( mappingInfo ).extend({ notify: 'always' });
    } else {
        proposedOTUMappings()[ OTUid ] = ko.observable( mappingInfo ).extend({ notify: 'always' });
    }
    proposedOTUMappings.valueHasMutated();
    // this should make the editor appear
}
function proposedMapping( otu ) {
    if (!otu || typeof otu['@id'] === 'undefined') {
        console.log("proposedMapping() failed");
        return null;
    }
    var OTUid = otu['@id'];
    var acc = proposedOTUMappings()[ OTUid ];
    return acc ? acc() : null;
}
function approveProposedOTULabel(otu) {
    // undoes 'editOTULabel', releasing a label to use shared hints
    var OTUid = otu['@id'];
    var itsMappingInfo = proposedOTUMappings()[ OTUid ];
    var approvedMapping = $.isFunction(itsMappingInfo) ?
        itsMappingInfo() :
        itsMappingInfo;
    if ($.isArray(approvedMapping)) {
        // apply the first (only) value
        mapOTUToTaxon( OTUid, approvedMapping[0] );
    } else {
        // apply the inner value of an observable (accessor) function
        mapOTUToTaxon( OTUid, ko.unwrap(approvedMapping) );
    }
    delete proposedOTUMappings()[ OTUid ];
    proposedOTUMappings.valueHasMutated();
    nudgeTickler('OTU_MAPPING_HINTS');
}
function approveProposedOTUMappingOption(approvedMapping, selectedIndex) {
    // similar to approveProposedOTULabel, but for a listed option
    var OTUid = approvedMapping.otuID;
    mapOTUToTaxon( OTUid, approvedMapping );
    delete proposedOTUMappings()[ OTUid ];
    proposedOTUMappings.valueHasMutated();
    nudgeTickler('OTU_MAPPING_HINTS');
}
function rejectProposedOTULabel(otu) {
    // undoes 'proposeOTULabel', clearing its value
    var OTUid = otu['@id'];
    delete proposedOTUMappings()[ OTUid ];
    proposedOTUMappings.valueHasMutated();
    nudgeTickler('OTU_MAPPING_HINTS');
}

function getAllVisibleProposedMappings() {
    // gather any proposed mappings (IDs) that are visible on this page
    var visibleProposedMappings = [];
    var visibleOTUs = viewModel.filteredOTUs().pagedItems();
    $.each( visibleOTUs, function (i, otu) {
        if (proposedMapping(otu)) {
            // we have a proposed mapping for this OTU!
            visibleProposedMappings.push( otu['@id'] );
        }
    });
    return visibleProposedMappings; // return a series of IDs
}
function approveAllVisibleMappings() {
    $.each(getAllVisibleProposedMappings(), function(i, OTUid) {
        var itsMappingInfo = proposedOTUMappings()[ OTUid ];
        var approvedMapping = $.isFunction(itsMappingInfo) ?
            itsMappingInfo() :
            itsMappingInfo;
        if ($.isArray(approvedMapping)) {
            if (approvedMapping.length === 1) {
                // test the first (only) value for possible approval
                var onlyMapping = approvedMapping[0];
                if (onlyMapping.originalMatch.is_synonym) {
                    return;  // synonyms require manual review
                }
                /* N.B. We never present the sole mapping suggestion as a
                 * taxon-name homonym, so just consider the match score to
                 * determine whether it's an "exact match".
                 */
                if (onlyMapping.originalMatch.score < 1.0) {
                    return;  // non-exact matches require manual review
                }
                // still here? then this mapping looks good enough for auto-approval
                delete proposedOTUMappings()[ OTUid ];
                mapOTUToTaxon( OTUid, approvedMapping[0], {POSTPONE_UI_CHANGES: true} );
            } else {
                return; // multiple possibilities require manual review
            }
        } else {
            // apply the inner value of an observable (accessor) function
            delete proposedOTUMappings()[ OTUid ];
            mapOTUToTaxon( OTUid, ko.unwrap(approvedMapping), {POSTPONE_UI_CHANGES: true} );
        }
    });
    proposedOTUMappings.valueHasMutated();
    nudgeTickler('OTU_MAPPING_HINTS');
    nudgeTickler('TREES');  // to hide/show duplicate-taxon prompts in tree list
    startAutoMapping();
}
function rejectAllVisibleMappings() {
    $.each(getAllVisibleProposedMappings(), function(i, OTUid) {
        delete proposedOTUMappings()[ OTUid ];
    });
    proposedOTUMappings.valueHasMutated();
    stopAutoMapping();
}

// this should be cleared whenever something changes in mapping hints
function clearFailedOTUList() {
    failedMappingOTUs.removeAll();
    // nudge to update OTU list immediately
    bogusEditedLabelCounter( bogusEditedLabelCounter() + 1);
    nudgeAutoMapping();
}
function nudgeAutoMapping() {
    // restart auto-mapping, if enabled
    if (autoMappingInProgress()) {
        if (currentlyMappingOTUs.length === 0) {
            // looks like we ran out of steam.. try again!
            requestTaxonMapping();
        }
    }
}

var recentMappingTimes = [ ];
var recentMappingSpeedLabel = ko.observable(""); // seconds per name, based on rolling average
var recentMappingSpeedPercent = ko.observable(0); // affects color of bar, etc
var recentMappingSpeedBarClass = ko.observable('progress progress-info');


function startAutoMapping() {
    // begin a daisy-chain of AJAX operations, mapping 1 label (or more?) to known taxa
    // TODO: what if there was a pending operation when we stopped?
    autoMappingInProgress( true );
    requestTaxonMapping();  // try to grab the first unmapped label in view
    updateMappingStatus();
}
function stopAutoMapping() {
    // TODO: what if there's an operation in progress? get its result, or drop it?
    autoMappingInProgress( false );
    currentlyMappingOTUs.removeAll();
    recentMappingSpeedBarClass( 'progress progress-info' );   // inactive blue bar
    updateMappingStatus();
}

function updateMappingSpeed( newElapsedTime ) {
    recentMappingTimes.push(newElapsedTime);
    if (recentMappingTimes.length > 5) {
        // keep just the last 5 times
        recentMappingTimes = recentMappingTimes.slice(-5);
    }

    var total = 0;
    $.each(recentMappingTimes, function(i, time) {
        total += time;
    });
    var rollingAverage = total / recentMappingTimes.length;
    var secPerName = rollingAverage / 1000;
    // show a legible number (first significant digit)
    var displaySec;
    if (secPerName >= 0.1) {
        displaySec = secPerName.toFixed(1);
    } else if (secPerName >= 0.01) {
        displaySec = secPerName.toFixed(2);
    } else {
        displaySec = secPerName.toFixed(3);
    }

    recentMappingSpeedLabel( displaySec +" sec / name");

    // use arbitrary speeds here, for bad/fair/good
    if (secPerName < 0.2) {
        recentMappingSpeedBarClass( 'progress progress-success' );  // green bar
    } else if (secPerName < 2.0) {
        recentMappingSpeedBarClass( 'progress progress-warning' );  // orange bar
    } else {
        recentMappingSpeedBarClass( 'progress progress-danger' );   // red bar
    }

    // bar width is approximate, needs ~40% to show its text
    recentMappingSpeedPercent( (40 + Math.min( (0.1 / secPerName) * 60, 60)).toFixed() +"%" );
}


function getNextUnmappedOTU() {
    var unmappedOTU = null;
    var visibleOTUs = viewModel.filteredOTUs().pagedItems();
    $.each( visibleOTUs, function (i, otu) {
        var isAvailable = otu['selectedForAction'] || false;
        // if no such attribute, consider it unavailable
        if (isAvailable) {
            var ottMappingTag = otu['^ot:ottId'] || null;
            var proposedMappingInfo = proposedMapping(otu);
            if (!ottMappingTag && !proposedMappingInfo) {
                // this is an unmapped OTU!
                if (failedMappingOTUs.indexOf(otu['@id']) === -1) {
                    // it hasn't failed mapping (at least not yet)
                    unmappedOTU = otu;
                    return false;
                }
            }
        }
    });
    return unmappedOTU;
}

/* TNRS requests are sent via POST and cannot be cached by the browser. Keep
 * track of responses in a simple local cache, to avoid extra requests for
 * identical taxon names. (This is common when many similar labels have been
 * "modified for mapping").
 *
 * We'll use a FIFO strategy to keep this to a reasonable size. I believe this
 * will handle the expected case of many labels being modified to the same
 * string.
 */
var TNRSCacheSize = 200;
var TNRSCache = {};
var TNRSCacheKeys = [];
function addToTNRSCache( key, value ) {
    // add (or update) the cache for this key
    if (!(key in TNRSCache)) {
        TNRSCacheKeys.push( key );
    }
    TNRSCache[ key ] = value;
    if (TNRSCacheKeys.length > TNRSCacheSize) {
        // clear the oldest cached item
        var doomedKey = TNRSCacheKeys.shift();
        delete TNRSCache[ doomedKey ];
    }
    console.log(TNRSCache);
}
function clearTNRSCache() {
    TNRSCache = {};
};

function requestTaxonMapping( otuToMap ) {
    // set spinner, make request, handle response, and daisy-chain the next request
    // TODO: send one at a time? or in a batch (5 items)?

    // NOTE that we might be requesting a single OTU, else find the next unmapped one
    var singleTaxonMapping;
    if (otuToMap) {
        singleTaxonMapping = true;
        failedMappingOTUs.remove(otuToMap['@id'] );
        autoMappingInProgress( true );
    } else {
        singleTaxonMapping = false;
        otuToMap = getNextUnmappedOTU();
    }
    if (!otuToMap) {
        stopAutoMapping();
        return false;
    }

    updateMappingStatus();
    var otuID = otuToMap['@id'];
    var originalLabel = $.trim(otuToMap['^ot:originalLabel']) || null;
    // use the manually edited label (if any), or the hint-adjusted version
    var editedLabel = $.trim(otuToMap['^ot:altLabel']);
    var searchText = (editedLabel !== '') ? editedLabel : $.trim(adjustedLabel(originalLabel));

    if (searchText.length === 0) {
        console.log("No name to match!"); // TODO
        return false;
    } else if (searchText.length < 2) {
        console.log("Need at least two letters!"); // TODO
        return false;
    }

    // groom trimmed text based on our search rules
    var searchContextName = getOTUMappingHints().data.searchContext.$;
    var usingFuzzyMatching = getOTUMappingHints().data['useFuzzyMatching'] || false;
    // show spinner alongside this item...
    currentlyMappingOTUs.push( otuID );

    var mappingStartTime = new Date();

    function tnrsSuccess(data) {
        // IF there's a proper response, assert this as the OTU and label for this node
        // TODO: Give the curator a chance to push back? and cleanly roll back changes if they disagree?

        /* Let any pending mapping finish up, even if curator has
         * paused auto-mapping!
        if (!autoMappingInProgress()) {
            // curator has paused all mapping
            return false;
        }
        */

        // update the rolling average for the mapping-speed bar
        var mappingStopTime = new Date();
        updateMappingSpeed( mappingStopTime.getTime() - mappingStartTime.getTime() );

        var maxResults = 100;
        var visibleResults = 0;
        var resultSetsFound = (data && ('results' in data) && (data.results.length > 0));
        var candidateMatches = [ ];
        // For now, we want to auto-apply if there's exactly one match
        if (resultSetsFound) {
            switch (data.results.length) {
                case 0:
                    console.warn('NO SEARCH RESULT SETS FOUND!');
                    candidateMatches = [ ];
                    break;

                case 1:
                    // the expected case
                    candidateMatches = data.results[0].matches;
                    break;

                default:
                    console.warn('MULTIPLE SEARCH RESULT SETS (USING FIRST)');
                    console.warn(data['results']);
                    candidateMatches = data.results[0].matches;
            }
        }
        // TODO: Filter candidate matches based on their properties, scores, etc.?

        switch (candidateMatches.length) {
            case 0:
                failedMappingOTUs.push( otuID );
                break;

            /* SKIPPING THIS to provide uniform treatment of all matches
            case 1:
                // choose the first+only match automatically!
                var resultToMap = candidateMatches[0];
                // convert to expected structure for proposed mappings
                var otuMapping = {
                    name: resultToMap['ot:ottTaxonName'],       // matched name
                    ottId: String(resultToMap['ot:ottId']),     // matched OTT id (as string)
                    //nodeId: resultToMap.matched_node_id,        // number
                    exact: false,                               // boolean (ignoring this for now)
                    higher: false                               // boolean
                    // TODO: Use flags for this ? higher: ($.inArray('SIBLING_HIGHER', resultToMap.flags) === -1) ? false : true
                };
                proposeOTULabel(otuID, otuMapping);
                // postpone actual mapping until user approves
                break;
             */

            default:
                // multiple matches found, offer a choice
                // ASSUMES we only get one result set, with n matches

                // TODO: Sort matches based on exact text matches? fractional (matching) scores? synonyms or homonyms?
                /* initial sort on lower taxa (will be overridden by exact matches)
                candidateMatches.sort(function(a,b) {
                    if (a.is_approximate_match === b.is_approximate_match) return 0;
                    if (a.is_approximate_match) return 1;
                    if (b.is_approximate_match) return -1;
                });
                */

                /* TODO: If multiple matches point to a single taxon, show just the "best" match
                 *   - Spelling counts! Show an exact match (e.g. synonym) vs. inexact spelling.
                 *   - TODO: add more rules? or just comment the code below
                 */
                var getPreferredTaxonCandidate = function( candidateA, candidateB ) {
                    // Return whichever is preferred, based on a few criteria:
                    var matchA = candidateA.originalMatch;
                    var matchB = candidateB.originalMatch;
                    // If one is the exact match, that's ideal (but unlikely since 
                    // the TNRS apparently returned multiple candidates).
                    if (!matchA.is_approximate_match) {
                        return candidateA;
                    } else if (!matchB.is_approximate_match) {
                        return candidateB;
                    }
                    // Show the most similar name (or synonym) for this taxon.
                    if (matchA.score > matchB.score) {
                        return candidateA;
                    }
                    return candidateB;
                };
                var getPriorMatchingCandidate = function( ottId, priorCandidates ) {
                    // return any match we've already examined for this taxon
                    var priorMatch = null;
                    $.each(priorCandidates, function(i, c) {
                        if (c.ottId === ottId) {
                            priorMatch = c;
                            return false;  // there should be just one
                        }
                    });
                    return priorMatch;
                };
                var rawMatchToCandidate = function( raw, otuID ) {
                    // simplify the "raw" matches returned by TNRS
                    return {
                        name: raw.taxon['unique_name'] || raw.taxon['name'],       // matched name
                        ottId: raw.taxon['ott_id'],     // matched OTT id (as number!)
                        //exact: false,                               // boolean (ignoring this for now)
                        //higher: false,                               // boolean
                        // TODO: Use flags for this ? higher: ($.inArray('SIBLING_HIGHER', resultToMap.flags) === -1) ? false : true
                        originalMatch: raw,
                        otuID: otuID
                    };
                }
                var candidateMappingList = [ ];
                $.each(candidateMatches, function(i, match) {
                    // convert to expected structure for proposed mappings
                    var candidate = rawMatchToCandidate( match, otuID );
                    var priorTaxonCandidate = getPriorMatchingCandidate( candidate.ottId, candidateMappingList );
                    if (priorTaxonCandidate) {
                        var priorPosition = $.inArray(priorTaxonCandidate, candidateMappingList);
                        var preferredCandidate = getPreferredTaxonCandidate( candidate, priorTaxonCandidate );
                        var alternateCandidate = (preferredCandidate === candidate) ? priorTaxonCandidate : candidate;
                        // whichever one was chosen will (re)take this place in our array
                        candidateMappingList.splice(priorPosition, 1, preferredCandidate);
                        // the other candidate will be stashed as a child, in case we need it later
                        if ('alternateTaxonCandidates' in preferredCandidate) {
                            preferredCandidate.alternateTaxonCandidates.push( alternateCandidate );
                        } else {
                            preferredCandidate.alternateTaxonCandidates = [ alternateCandidate ];
                        }
                    } else {
                        candidateMappingList.push(candidate);
                    }
                });

                proposeOTULabel(otuID, candidateMappingList);
                // postpone actual mapping until user chooses, then approves
        }

        currentlyMappingOTUs.remove( otuID );

        if (singleTaxonMapping) {
            stopAutoMapping();
        } else if (autoMappingInProgress()) {
            // after a brief pause, try for the next available OTU...
            setTimeout(requestTaxonMapping, 10);
        }

        return false;
    }

    var TNRSQueryAndCacheKey = JSON.stringify({
        "names": [searchText],
        "include_suppressed": false,
        "do_approximate_matching": (singleTaxonMapping || usingFuzzyMatching) ? true : false,
        "context_name": searchContextName
    });

    $.ajax({
        url: doTNRSForMappingOTUs_url,  // NOTE that actual server-side method name might be quite different!
        type: 'POST',
        dataType: 'json',
        data: TNRSQueryAndCacheKey,  // data (asterisk required for completion suggestions)
        crossDomain: true,
        contentType: "application/json; charset=utf-8",
        beforeSend: function () {
            // check our local cache to see if this is a repeat
            var cachedResponse = TNRSCache[ TNRSQueryAndCacheKey ];
            if (cachedResponse) {
                tnrsSuccess( cachedResponse );
                return false;
            }
            return true;
        },
        error: function(jqXHR, textStatus, errorThrown) {

            console.log("!!! something went terribly wrong");
            console.log(jqXHR.responseText);

            showErrorMessage("Something went wrong in taxomachine:\n"+ jqXHR.responseText);

            if (!autoMappingInProgress()) {
                // curator has paused all mapping
                return false;
            }

            currentlyMappingOTUs.remove( otuID );

            // let's hope it's something about this label and try the next one...
            failedMappingOTUs.push( otuID );
            if (singleTaxonMapping) {
                stopAutoMapping();
            } else if (autoMappingInProgress()) {
                setTimeout(requestTaxonMapping, 100);
            }

        },
        success: function(data) {
            // add this response to the local cache
            addToTNRSCache( TNRSQueryAndCacheKey, data );
            tnrsSuccess(data);
        }
    });

    return false;
}

function mapOTUToTaxon( otuID, mappingInfo, options ) {
    /* Apply this mapping, creating Nexson elements as needed
     *
     * mappingInfo should be an object with these properties:
     * {
     *   "name" : "Centranthus",
     *   "ottId" : "759046",
     *
     *   // these may also be present, but aren't important here
     *     "exact" : false,
     *     "higher" : true
     * }
     *
     * N.B. We *always* add/change/remove these properties in tandem!
     *    ot:ottId
     *    ot:ottTaxonName
     */

    // If options.POSTPONE_UI_CHANGES, please do so (else we crawl when
    // approving hundreds of mappings)
    options = options || {};

    // FOR NOW, assume that any leaf node will have a corresponding otu entry;
    // otherwise, we can't have name for the node!
    var otu = getOTUByID( otuID );

    // De-select this OTU in the mapping UI
    otu['selectedForAction'] = false;

    // add (or update) a metatag mapping this to an OTT id
    otu['^ot:ottId'] = Number(mappingInfo.ottId);

    // Add/update the OTT name (cached here for performance)
    otu['^ot:ottTaxonName'] = mappingInfo.name || 'OTT NAME MISSING!';
    // N.B. We always preserve ^ot:originalLabel for reference

    // Clear any proposed/adjusted label (this is trumped by mapping to OTT)
    delete otu['^ot:altLabel'];

    var tree = getTreeContainingOTUID(otuID);
    if (tree) {
        removeTaxonMappingInfoFromTree( tree );  // clear cached info
    }

    if (!options.POSTPONE_UI_CHANGES) {
        nudgeTickler('OTU_MAPPING_HINTS');
        nudgeTickler('TREES');  // to hide/show duplicate-taxon prompts in tree list
    }
}

function unmapOTUFromTaxon( otuOrID, options ) {
    // remove this mapping, removing any unneeded Nexson elements

    // If options.POSTPONE_UI_CHANGES, please do so (else we crawl when
    // clearing hundreds of mappings)
    options = options || {};

    var otu = (typeof otuOrID === 'object') ? otuOrID : getOTUByID( otuOrID );
    // restore its original label (versus mapped label)
    var originalLabel = otu['^ot:originalLabel'];

    // strip any metatag mapping this to an OTT id
    if ('^ot:ottId' in otu) {
        delete otu['^ot:ottId'];
    }
    if ('^ot:ottTaxonName' in otu) {
        delete otu['^ot:ottTaxonName'];
    }

    var tree = getTreeContainingOTUID( otu['@id'] );
    if (tree) {
        removeTaxonMappingInfoFromTree( tree );  // clear cached info
    }

    if (!options.POSTPONE_UI_CHANGES) {
        nudgeTickler('OTU_MAPPING_HINTS');
        nudgeTickler('TREES');  // to hide/show duplicate-taxon prompts in tree list
    }
}

function addMetaTagToParent( parent, props ) {
    // wrap submitted properties to make an observable metatag
    var newTag = cloneFromSimpleObject( props );
    if (!parent.meta) {
        // add a meta collection here
        parent['meta'] = [ ];
    } else if (!$.isArray(parent.meta)) {
        // convert a Badgerfish "singleton" to a proper array
        parent['meta'] = [ parent.meta ];
    }
    parent.meta.push( newTag );
}

function clearSelectedMappings() {
    // TEMPORARY helper to demo mapping tools, clears mapping for the visible (paged) OTUs.
    var visibleOTUs = viewModel.filteredOTUs().pagedItems();
    $.each( visibleOTUs, function (i, otu) {
        if (otu['selectedForAction']) {
            // clear any "established" mapping (already approved)
            unmapOTUFromTaxon( otu, {POSTPONE_UI_CHANGES: true} );
            // clear any proposed mapping
            delete proposedOTUMappings()[ otu['@id'] ];
        }
    });
    clearFailedOTUList();
    proposedOTUMappings.valueHasMutated();
    nudgeTickler('OTU_MAPPING_HINTS');
    nudgeTickler('TREES');  // to hide/show duplicate-taxon prompts in tree list
}

function clearAllMappings() {
    var allOTUs = viewModel.elementTypes.otu.gatherAll(viewModel.nexml);
    if (confirm("WARNING: This will un-map all "+ allOTUs.length +" OTUs in the current study! Are you sure you want to do this?")) {
        // TEMPORARY helper to demo mapping tools, clears mapping for the visible (paged) OTUs.
        $.each( allOTUs, function (i, otu) {
            // clear any "established" mapping (already approved)
            unmapOTUFromTaxon( otu, {POSTPONE_UI_CHANGES: true} );
            // clear any proposed mapping
            delete proposedOTUMappings()[ otu['@id'] ];
        });
        clearFailedOTUList();
        proposedOTUMappings.valueHasMutated();
        nudgeTickler('OTU_MAPPING_HINTS');
        nudgeTickler('TREES');  // to hide/show duplicate-taxon prompts in tree list
    }
}

function showNodeOptionsMenu( tree, node, nodePageOffset, importantNodeIDs ) {
    // this is a Bootstrap-style menu whose pointer is centered on the
    // target node
    var nodeMenu = $('#node-menu');
    if (nodeMenu.length === 0) {
        // provide the needed ancestor classes, but minimize the surrounding "navbar"
        $('body').append('<div id="node-menu-holder" class="navbar" style="height: 0; position: static;"><ul class="nav" style="height: 0; position: static;"><li class="dropdown-open"><ul id="node-menu" class="dropdown-menu"></ul></li></div>');
        nodeMenu = $('#node-menu');
    } else {
        nodeMenu.empty(); // clear any prior menu items
    }
    nodeMenu.hide();
    // show appropriate choices for this node
    var nodeID = node['@id'];

    // general node information first, then actions
    nodeMenu.append('<li class="node-information"></li>');
    var nodeInfoBox = nodeMenu.find('.node-information');
    var labelInfo = getTreeNodeLabel(tree, node, importantNodeIDs);
    /* Decide what label to show in the 'options' menu, and how to describe it
     * N.B. that we might want to show something different from the label
     * showing in the phylogram.
     */
    var nodeOptionsLabel;
    var labelTypeDescription;
    var origDisambigStr;  // used in some special cases
    switch(labelInfo.labelType) {
        case('tip (mapped OTU)'):
            nodeOptionsLabel = labelInfo.label;
            labelTypeDescription = "Mapped to Open Tree taxonomy, ";
            origDisambigStr = labelInfo.originalLabel;
            break;
        case('tip (original)'):
            nodeOptionsLabel = labelInfo.label;
            labelTypeDescription = "Original OTU label";
            break;
        case ('internal node (aligned)'):
            nodeOptionsLabel = labelInfo.label;
            labelTypeDescription = "Label provided by conflict service";
            break;
        case ('internal node (support)'):
        case ('internal node (other)'):
            nodeOptionsLabel = labelInfo.label;
            labelTypeDescription = getNodeLabelModeDescription(tree);
            break;
        case ('internal node (ambiguous)'):
            nodeOptionsLabel = labelInfo.label;
            labelTypeDescription = "Internal node label (ambiguous)";
            break;
        case ('empty'):
            nodeOptionsLabel = node['@id'];
            labelTypeDescription = "Unlabeled node";
            //labelTypeDescription = labelInfo.originalLabel ; //'original OTU label';
            break;
        default:
            nodeOptionsLabel = "???";
            labelTypeDescription = ('Unknown label type! ['+ labelInfo.labelType +']');
            console.error('Unknown label type! ['+ labelInfo.labelType +']');;
    }
    nodeInfoBox.append('<span class="node-name">'+ nodeOptionsLabel +'</span>');

    var nodeURL = getViewURLFromStudyID(studyID) +"?tab=home&tree="+ tree['@id'] +"&node="+ node['@id'];
    nodeInfoBox.append('<a class="node-direct-link" title="Link directly to this node (opens in new window)" target="_blank" href="'+ 
                       nodeURL +'"><i class="icon-share-alt"></i></a>');

    if ((viewOrEdit === 'EDIT') && isDuplicateNode( tree, node )) {
        if (node['^ot:isTaxonExemplar'] === true) {
            nodeMenu.append('<li><a href="#" onclick="hideNodeOptionsMenu(); clearTaxonExemplar( \''+ tree['@id'] +'\', \''+ nodeID +'\' ); return false;">Clear exemplar for mapped taxon</a></li>');
        } else {
            nodeMenu.append('<li><a href="#" onclick="hideNodeOptionsMenu(); markTaxonExemplar( \''+ tree['@id'] +'\', \''+ nodeID +'\' ); return false;">Mark as exemplar for mapped taxon</a></li>');
        }
    }

    if (nodeID == importantNodeIDs.treeRoot) {
        nodeInfoBox.append('<span class="node-type specifiedRoot">tree root</span>');
        if ((viewOrEdit === 'EDIT') && (tree['^ot:unrootedTree'])) {
            nodeMenu.append('<li><a href="#" onclick="hideNodeOptionsMenu(); setTreeRoot( \''+ tree['@id'] +'\', \''+ nodeID +'\' ); return false;">Confirm as root of this tree</a></li>');
        }
    } else {
        if ((viewOrEdit === 'EDIT') && !(node['^ot:isLeaf'])) {
            nodeMenu.append('<li><a href="#" onclick="hideNodeOptionsMenu(); setTreeRoot( \''+ tree['@id'] +'\', \''+ nodeID +'\' ); return false;">Mark as root of this tree</a></li>');
        }
    }
    if (nodeID == importantNodeIDs.inGroupClade) {

        nodeInfoBox.append('<span class="node-type inGroupClade">ingroup clade</span>');

        if (viewOrEdit === 'EDIT') {
            nodeMenu.append('<li><a href="#" onclick="hideNodeOptionsMenu(); setTreeIngroup( \''+ tree['@id'] +'\', null ); return false;">Un-mark as the ingroup clade</a></li>');
        }
    } else {
        if (viewOrEdit === 'EDIT') {
            nodeMenu.append('<li><a href="#" onclick="hideNodeOptionsMenu(); setTreeIngroup( \''+ tree['@id'] +'\', \''+ nodeID +'\' ); return false;">Mark as the ingroup clade</a></li>');
        }
    }

    nodeInfoBox.append('<div class="node-label-type">'+ labelTypeDescription +'</div>');
    if (origDisambigStr && (origDisambigStr !== nodeOptionsLabel)) {
        nodeInfoBox.append('<div class="node-label-type">originally labelled "'+ origDisambigStr +'"</div>');
    }
    if (node.conflictDetails) {
        // desribe its status in the current conflict analysis
        var conflictDescriptionHTML = getNodeConflictDescription(tree, node);
        nodeInfoBox.append(conflictDescriptionHTML);
    }

    if (viewOrEdit === 'EDIT') {
        nodeInfoBox.after('<li class="divider"></li>');
    }

    // show the menu
    var pointerNudge = {x: -13, y: 8};
    nodeMenu.css({
        "left": (Math.round(nodePageOffset.left + pointerNudge.x) +"px"),
        "top": (Math.round(nodePageOffset.top + pointerNudge.y) +"px"),
        "z-index": 10000  // required to get above modal window
    });
    nodeMenu.show();
    // hide this menu if we hide the modal tree viewer OR scroll the view
    $('#tree-viewer *[data-dismiss=modal], .modal-backdrop').click( hideNodeOptionsMenu );
    $('#tree-viewer .modal-body').scroll( hideNodeOptionsMenu );
}

function getNodeConflictDescription(tree, node) {
    var statusHTML = "",
        witnessHTML = "";

    switch(node.conflictDetails.status) {
      case 'terminal':
      case 'supported_by':
      case 'partial_path_of':
      case 'mapped_to_taxon':
          statusHTML = "Aligned with ";
          break;
      case 'conflicts_with':
          statusHTML = "Conflicts with ";
          break;
      case 'resolved_by':
      case 'resolves':
          statusHTML = "Resolves ";
          break;
      default:
          console.error("ERROR: unknown conflict status '"+ node.conflictDetails.status +"'!");
    }

    // Build "witness" node URLs based on the chosen reference tree.
    if (node.conflictDetails.witness) {
        // NB that there can be zero, one, or more witness nodes. These should be listed in two matching arrays in an array
        // wrap any single value found into an array for uniform treatment
        var idArray = $.isArray(node.conflictDetails.witness) ? node.conflictDetails.witness : [node.conflictDetails.witness] ;
        var nameArray = $.isArray(node.conflictDetails.witness_name) ? node.conflictDetails.witness_name : [node.conflictDetails.witness_name] ;
        $.each(idArray, function(i, witnessID) {
            var witnessName = nameArray[i],
                witnessURL = "";

            switch (tree.conflictDetails.referenceTreeID) {
                case 'ott':
                    witnessURL = getTaxobrowserURL(witnessID);
                    break;

                case 'synth':
                    if (isNaN(witnessID)) {
                        // it's a synthetic-tree node ID (e.g. 'ott1234' or 'mrcaott123ott456')
                        /* N.B. Ideally we'd include the current synth-version (e.g. '/opentree7.0@ott123'),
                         * like so:

                        witnessURL = "/opentree/argus/{SYNTH_VERSION}@{NODE_ID}"
                            .replace('{SYNTH_VERSION}', referenceTreeVersion)
                            .replace('{NODE_ID}', node.conflictDetails.witness);

                        * But this is not yet provided by the conflict service. Perhaps we could capture
                        * this as <tree>.conflictDetails['referenceTreeVersion']
                        *
                        * For now, omitting the version entirely (e.g. '/@ott123') will redirect to
                        * the latest-version URL.
                        */
                        witnessURL = "/opentree/argus/@{NODE_ID}".replace('{NODE_ID}', witnessID);
                    } else {
                        // it's a numeric OTT taxon ID (e.g. '1234')
                        witnessURL = "/opentree/argus/ottol@{NODE_ID}".replace('{NODE_ID}', witnessID);
                    }
                    break;

                default:
                    console.error('showNodeOptionsMenu(): ERROR, expecting either "ott" or "synth" as referenceTreeID!');
                    return;
            }

            witnessHTML += '<a href="'+ witnessURL +'" target="_blank">'+ (witnessName || witnessID) +'</a>';
            if (idArray.length > (i+1)) {
                witnessHTML += ", ";
                if (i % 2) {  
                    // after every 2 witness links, add a new line and indent
                    witnessHTML += '<br> &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; '
                }
            }
        });
    } else {
        // if empty or not found, assume there is no witness
        switch (tree.conflictDetails.referenceTreeID) {
            case 'ott':
                witnessHTML = "anonymous taxonomy node"; // unlikely!
                break;
            case 'synth':
                witnessHTML = "anonymous synth node";
                break;
            default:
                console.error('showNodeOptionsMenu(): ERROR, expecting either "ott" or "synth" as referenceTreeID!');
                return;
        }
    }
    return '<div class="node-conflict-status-'+ node.conflictDetails.status +'">'+ statusHTML + witnessHTML +'</div>';
}


function hideNodeOptionsMenu( ) {
    var nodeMenuHolder = $('#node-menu-holder');
    if (nodeMenuHolder.length > 0) {
        nodeMenuHolder.remove();
    }
}

function showEdgeOptionsMenu( tree, edge, nodePageOffset, importantNodeIDs ) {
    // This is a Bootstrap-style menu whose pointer is centered on the
    // target edge. It borrows most style and some behavior from the
    // node-options menu.
    var nodeMenu = $('#node-menu');
    if (nodeMenu.length === 0) {
        // provide the needed ancestor classes, but minimize the surrounding "navbar"
        $('body').append('<div id="node-menu-holder" class="navbar" style="height: 0; position: static;"><ul class="nav" style="height: 0; position: static;"><li class="dropdown-open"><ul id="node-menu" class="dropdown-menu"></ul></li></div>');
        nodeMenu = $('#node-menu');
    } else {
        nodeMenu.empty(); // clear any prior menu items
    }
    nodeMenu.hide();
    // show appropriate choices for this node
    // if (node['@root'] === 'true') ?
    var edgeID = edge['@id'];
    // edge.source;
    // edge.target;

    // general node information first, then actions
    nodeMenu.append('<li class="node-information"></li>');
    var nodeInfoBox = nodeMenu.find('.node-information');
    nodeInfoBox.append('<span class="node-name"><span style="font-weight: normal;">Source: </span>'+ getTreeNodeLabel(tree, edge.source, importantNodeIDs).label +'</span>');
    nodeInfoBox.append('<br/><span class="node-name"><span style="font-weight: normal;">Target: </span>'+ getTreeNodeLabel(tree, edge.target, importantNodeIDs).label +'</span>');
    if (edge.target.conflictDetails) {
        // desribe its status in the current conflict analysis
        var conflictDescriptionHTML = getNodeConflictDescription(tree, edge.target);
        nodeInfoBox.append(conflictDescriptionHTML);
    }
    if ('length' in edge.target) {
        nodeInfoBox.append('<div>Edge length: '+ edge.target.length +'</div>');
    }

    var availableForRooting = (edge.source['@id'] !== getAdHocRootID(tree)) && (edge.target['@id'] !== getAdHocRootID(tree));
    if (availableForRooting && (viewOrEdit === 'EDIT')) {
        nodeMenu.append('<li><a href="#" onclick="hideNodeOptionsMenu(); setTreeRoot( \''+ tree['@id'] +'\', [\''+ edge.source['@id'] +'\', \''+ edge.target['@id'] +'\'] ); return false;">Re-root from this edge</a></li>');
    }

    if (viewOrEdit === 'EDIT') {
        nodeInfoBox.after('<li class="divider"></li>');
    }

    // show the menu
    var pointerNudge = {x: -13, y: 8};
    nodeMenu.css({
        "left": (Math.round(nodePageOffset.left + pointerNudge.x) +"px"),
        "top": (Math.round(nodePageOffset.top + pointerNudge.y) +"px"),
        "z-index": 10000  // required to get above modal window
    });
    nodeMenu.show();
    // hide this menu if we hide the modal tree viewer OR scroll the view
    $('#tree-viewer *[data-dismiss=modal], .modal-backdrop').click( hideNodeOptionsMenu );
    $('#tree-viewer .modal-body').scroll( hideNodeOptionsMenu );
}

function clearD3PropertiesFromTree(tree) {
    // these are display-only properties that shouldn't save to the docstore
    $.each( tree.node, function( i, node ) {
        delete node.x;
        delete node.y;
        delete node.depth;
        delete node.parent;
        delete node.children;
        delete node.name;
        delete node.length;
        delete node.ingroup;
        delete node.rootDist;
        delete node.labelType;
        delete node.ambiguousLabel;
        delete node.adjacentEdgeLabel;
    });
}

function clearMRCATestResults(tree) {
    // These are temporary client-side tests that can go stale and mislead
    // other Nexson users. Best to remove them before saving.
    delete tree['^ot:MRCAName'];
    delete tree['^ot:MRCAOttId'];
    delete tree['^ot:nearestTaxonMRCAName'];
    delete tree['^ot:nearestTaxonMRCAOttId'];
}

function coerceEdgeLengthsToNumbers(tree) {
    // Convert any string values to JS numbers, which look like integers if
    // there's no fractional part. (For example, we might see 3.05 or 3, which
    // should be recognized by the validator as equal to 3.0).
    //
    // N.B. True floating-point precision is not reliable in Javascript, which
    // uses binary floating point numbers. Still, since we're not operating on
    // length values, any incoming numbers should be preserved with full
    // precision.
    $.each( tree.edge, function( i, edge ) {
        if ('@length' in edge) {
            // keep precise floats where found; convert integers to minimal floats (4 => '4.0')
            var floatEdgeLength = parseFloat( edge['@length'] );
            edge['@length'] = isNaN(floatEdgeLength) ? 0 : floatEdgeLength;
        }
    });
}

// adapted from http://stackoverflow.com/a/4506030
var fileSizePrefixes = ' KMGTPEZYXWVU';
function getHumanReadableFileSize(size) {
  if(size <= 0) return '0';
  var t2 = Math.min(Math.round(Math.log(size)/Math.log(1024)), 12);
  return (Math.round(size * 100 / Math.pow(1024, t2)) / 100) +
    fileSizePrefixes.charAt(t2).replace(' ', '') + 'B';
}

/*
 * Annotation helpers
 */

// manage central collections
function getStudyAnnotationEvents( nexml ) {
    // returns an array (OR observableArray?), possibly empty
    if (!nexml) {
        nexml = viewModel.nexml;
    }
    return nexml['^ot:annotationEvents'] || null;
}
function getStudyAnnotationAgents( nexml ) {
    // returns an array (OR observableArray?), possibly empty
    if (!nexml) {
        nexml = viewModel.nexml;
    }
    return nexml['^ot:agents'] || null;
}

// manage "local" messages collection for any element
/* NOTE that all these functions are deprecated in favor of storing
 * messages inside their respective annotation events! Now we just use them
 * to clean up and relocate old messages in existing studies.
 */
function getLocalMessages( element ) {
    // returns an array (OR observableArray?), possibly empty
    var messages = [];
    if (localMessagesCollectionExists( element )) {
        var collection = getLocalMessagesCollection( element );
        var msgList = makeArray(collection.message);
        $.each(msgList, function(i, msg) {
            // TODO: iterate properly (child elements)?
            messages.push(msg);
        });
    }
    return messages;
}
function getLocalMessagesCollection( element ) {
    // returns the actual collection accessor, or null
    return element['^ot:messages'] || null;
;
}
function localMessagesCollectionExists( element ) {
    // return T|F
    return getLocalMessagesCollection( element ) ? true : false;
}
function localMessagesCollectionIsBeingUsed( element ) {
    // return T|F
    var localMessages = getLocalMessages( element );
    return localMessages.length > 0;
}
function addLocalMessagesCollection( element ) {
    // TODO: RESTRICT to these elements: nexml, tree, node, edge, otu
    // return the new collection
    element['^ot:messages'] ={
        'message': []
    };
    return element['^ot:messages'];
}
function removeLocalMessagesCollection( element ) {
    var testCollection = getLocalMessagesCollection( element );
    if (testCollection) {
        delete element['^ot:messages'];
    }
}

// TODO: manage individual annotation messages, anywhere in the study
/*
function addAnnotationMessage() {
}
function removeAnnotationMessage( msg ) {
}
*/

// chase relationships from elements, agents, etc
function getAnnotationsRelatedToElement( element ) {
    // TODO: returns an array, possibly empty
}
function getAgentForAnnotationEvent( annotationEvent ) {
    // returns an agent object, or null if not found
    var agentID = annotationEvent['@wasAssociatedWithAgentId'];
    var matchingAgent = null;
    if (agentID) {
        matchingAgent = getAgent( function(a) { return a['@id'] === agentID; }, viewModel.nexml );
    }
    return matchingAgent;
}
function getAnnotationEventsForAgent( agent ) {
    // TODO: returns an array, possibly empty
}
function getAnnotationEventForMessage( message ) {
    // TODO: returns a single event, or null
}

// fetch bundled annotationEvent, agent(s), and message(s)?
function getAnnotationBundle( annotationEvent ) {
    // returns an object with event and agent
    var bundle = {
        'event' : annotationEvent,
        'agent' : 'TODO'
    };
    return bundle;
}

// create/update/delete annotations, managing collections as needed
function createAnnotation( annotationBundle, nexml ) {
    // RENAME to updateAnnotation, setAnnotation?
    // TODO: make sure we can handle "split" events that specify multiple elements
    if (!nexml) {
        nexml = viewModel.nexml;
    }

    // is the specified nexson already mapped to Knockout observables?
    var nexmlIsMapped = ko.isObservable( nexml ); // TODO? WAS nexml.meta
    var target = annotationBundle.targetElement;
    var annEvent = annotationBundle.annotationEvent;
    var agent = annotationBundle.agent;

    // add message(s) to its target element, building a local message
    // collection if not found
    if (!target) {
        alert("ERROR: target element not found: "+ target +" <"+ typeof(target) +">");
        return;
    }
    $.each( annEvent.message, function( i, msg ) {
        var messageInfo = $.extend(
            { '@id': getNextAvailableElementID( 'message', nexml ) },
            msg
        );
        var properMsg = cloneFromSimpleObject( messageInfo, {applyKnockoutMapping: nexmlIsMapped} );
        msg = properMsg;
    });

    // add (or confirm) the specified agent and assign to event
    var hasMatchingID = function(a) {
        var testID = ko.unwrap( agent['@id'] );
        return ko.unwrap( a['@id'] ) === testID;
    }
    if (!agentExists( hasMatchingID, nexml)) {
        // at this point, viewModel should already be mapped by KO
        var properAgent = cloneFromSimpleObject( agent, {applyKnockoutMapping: false} );
        addAgent( properAgent, nexml );
    }

    // add the main event to this study
    var eventCollection = getStudyAnnotationEvents( nexml );
    // apply a unique annotation event ID, if there's not one baked in
    // already
    eventInfo = $.extend(
        { '@id': getNextAvailableElementID( 'annotation', nexml ) },
        annEvent
    );
    var properEvent = cloneFromSimpleObject( eventInfo, {applyKnockoutMapping: nexmlIsMapped} );
    eventCollection.annotation.push( properEvent );

    // return something interesting here?
}
function deleteAnnotationEvent( annotationEvent ) {
    // TODO: clear related agent (if no longer used)
}

// manage agents (each is a singleton that disappears if unused)
function agentExists( testFunc, nexml ) {
    // return T|F, based on whether any agent meets the test
    return (getAgent( testFunc, nexml ) !== null);
}
function getAgent( testFunc, nexml ) {
    if (!nexml) {
        nexml = viewModel.nexml;
    }
    var agentsCollection = getStudyAnnotationAgents( nexml );
    var agentList = agentsCollection ? makeArray(agentsCollection.agent) : [];
    var foundAgent = null;
    $.each(agentList, function(i, agent) {
        if (testFunc(agent)) {
            foundAgent = agent;
            return false;
        }
    })
    return foundAgent;
}

function agentIsBeingUsed( testFunc ) {
    // return T|F
    var relatedEvents = getAnnotationEventsForAgent( agent );
    return relatedEvents.length > 0;
}
function addAgent( props, nexml ) {
    // nexml is optional (default is viewModel.nexml)
    if (!nexml) {
        nexml = viewModel.nexml;
    }

    // is the specified nexson already mapped to Knockout observables?
    var nexmlIsMapped = ko.isObservable( nexml ); // TODO? WAS nexml.meta
    var agentInfo = $.extend(
        { '@id': getNextAvailableElementID( 'agent', nexml ) },
        props
    );
    var properAgent = cloneFromSimpleObject(agentInfo, {applyKnockoutMapping: nexmlIsMapped});
    var agentList = getStudyAnnotationAgents( nexml ).agent;
    agentList.push( properAgent );
}
function removeAgent( testFunc, nexml ) {
    if (!nexml) {
        nexml = viewModel.nexml;
    }
    var agentList = getStudyAnnotationAgents( nexml ).agent();
    var doomedAgent = null;
    $.each(agentList, function(i, agent) {
        if (testFunc(agent)) {
            doomedAgent = agent;
            return false;
        }
    });
    if (doomedAgent) {
        agentList.remove(doomedAgent);
    }
}

/*
var highestAnnotationEventID = null;
var annotationEventIDPrefix = 'annotation';

var highestAnnotationAgentID = null;
var annotationAgentIDPrefix = 'agent';

var highestAnnotationMessageID = null;
var annotationMessageIDPrefix = 'message';
*/

function getNextAvailableElementID( elementType, nexml ) {
    if (!(elementType in viewModel.elementTypes)) {
        console.error('getNextAvailableElementID(): type "'+ elementType +'" not found!');
        return;
    }
    var typeInfo = viewModel.elementTypes[elementType];
    var typePrefix = typeInfo.prefix || elementType;
    var nextAvailableNumber = getNextElementOrdinalNumber( elementType, nexml );
    return (typePrefix + nextAvailableNumber);
}
function getNextElementOrdinalNumber( elementType, nexml ) {
    // increment and returns the next available ordinal number for this type
    if (!(elementType in viewModel.elementTypes)) {
        console.error('getNextElementOrdinalNumber(): type "'+ elementType +'" not found!');
        return;
    }
    var typeInfo = viewModel.elementTypes[elementType];
    var typePrefix = typeInfo.prefix || elementType;
    if (typeInfo.highestOrdinalNumber === null) {
        typeInfo.highestOrdinalNumber = findHighestElementOrdinalNumber(
            nexml,
            typePrefix,
            typeInfo.gatherAll
        );
    }
    // increment the highest ID for faster assignment next time
    typeInfo.highestOrdinalNumber++;
    return typeInfo.highestOrdinalNumber;
}
function findHighestElementOrdinalNumber( nexml, prefix, gatherAllFunc ) {
    // Return the numeric component of the highest element ID matching
    // these specs, eg, 'node2336' => 2336
    if (!nexml) {
        nexml = viewModel.nexml;
    }
    // do a one-time(?) scan for the highest ID currently in use
    var allElements = gatherAllFunc( nexml );
    var highestOrdinalNumber = 0;
    for (var i = 0; i < allElements.length; i++) {
        // ignore agents with non-standard IDs, eg, 'opentree-curation-webapp'
        var testElement = allElements[i];
        var testID = ko.unwrap(testElement['@id']) || '';
        if (testID === '') {
            /* Suppress these warnings for 'message' prefix; it's just noise
             * until we have established a need and a batch solution for minting
             * unique message IDs.
             */
            if (prefix !== 'message') {
                console.error("MISSING ID for this "+ prefix +":");
                console.error(testElement);
            }
            continue;  // skip to next element
        }
        if (testID.indexOf(prefix) === 0) {
            // compare this to the highest ID found so far
            var itsNumber = testID.split( prefix )[1];
            if ($.isNumeric( itsNumber )) {
                highestOrdinalNumber = Math.max( highestOrdinalNumber, itsNumber );
            }
        }
    }
    return highestOrdinalNumber;
}
function clearAllHighestIDs() {
    // reset these counters, as after an import+merge
    for (var aType in viewModel.elementTypes) {
        viewModel.elementTypes[ aType ].highestOrdinalNumber = null;
    }
}

function getAllAnnotationMessagesInStudy(nexml) {
    if (!nexml) {
        nexml = viewModel.nexml;
    }
    var allMessages = [];
    var annotations = getStudyAnnotationEvents( nexml );
    $.each(makeArray(annotations.annotation), function(i, annotation) {
        allMessages = allMessages.concat( makeArray(annotation.message) );
    });
    return allMessages;
}

function relocateLocalAnnotationMessages( nexml ) {
    /* Update deprecated storage for annotation messages from "in situ" and
     * separate messages container to storage within each parent annotation event.
     */
    if (!nexml) {
        nexml = viewModel.nexml;
    }
    // Trigger this behavior ONLY if we find an old-style "local" message store
    // in the main nexml element.
    if ('^ot:messages' in nexml) {
        console.warn("Now I'd relocate old annotation messages...");
    } else {
        // no messages stored in the old system
        return;
    }

    /* In short, this is how we'll update old (local) messages to new:
     * - Walk the entire nexml structure, looking for "local" messages
     * - Relocate each local message to its new home (its parent annotationEvent)
     * - Remove deprecated '@wasGeneratedBy' property and others
     * - Delete old local collections as we go, IF all of an element's messages have been migrated
     * - Delete nexml['^ot:messages'] when we're done, IF all messages migrated successfully
     */
    var allLocalMessages = [ ];
    // gather "local" messages from all other elements!
    // NOTE: Add any new target elements here to avoid duplication!

    // gather all elements that *might* hold local messages, including the main 'nexml'
    var potentialMessageHolders = [ nexml ];
    $.merge(potentialMessageHolders, viewModel.elementTypes.otu.gatherAll(viewModel.nexml));
    $.merge(potentialMessageHolders, viewModel.elementTypes.tree.gatherAll(viewModel.nexml));
    $.merge(potentialMessageHolders, viewModel.elementTypes.node.gatherAll(viewModel.nexml));
    $.merge(potentialMessageHolders, viewModel.elementTypes.edge.gatherAll(viewModel.nexml));
    console.warn(">> scanning "+ potentialMessageHolders.length +" potential message holders...");

    var unableToMergeAll = false;
    $.each(potentialMessageHolders, function( i, ele ) {
        // harvest any messages found here, and attempt to merge them
        var localMessages = getLocalMessages(ele);
        var unableToMergeFromElement = false;
        if (localMessages.length > 0) {
            $.merge(allLocalMessages, makeArray(localMessages));
            $.each(localMessages, function(i, msg) {
                // attempt to add (or merge) this with central messages
                try {
                    moveOrMergeLocalMessage(msg, ele, nexml );
                        // N.B. this will remove the local message, if successful!
                    //console.log('>>> MERGED this message successfully!');
                    //console.log(msg);
                } catch(e) {
                    unableToMergeAll = true;
                    unableToMergeFromElement = true;
                    console.error('>>> UNABLE TO MERGE this messsage ('+ e +'):');
                    console.error(msg);
                }
            });
        }
        if (unableToMergeFromElement) {
            // preserve the remaining local messages for another time
            console.warn('>> UNABLE TO MERGE some messsages in this element:');
            console.warn(ele);
            return true;
        }
        // ... and remove the local collection, if found
        removeLocalMessagesCollection(ele);
        //console.log('>>>> all messages merged, local collection removed');
    });
    console.warn(">> found "+ allLocalMessages.length +" local messages in this study");

    if (unableToMergeAll) {
        /* Restore the main messages collection on nexml. (This is our cue above
         * to prompt future cleanup attempts.)
         */
        console.error("> UNABLE TO MERGE some messsages in this study! We'll try again later...");
        addLocalMessagesCollection( nexml );
    } else {
        console.warn(">> all local messages successfully merged!");
    }
}

function moveOrMergeLocalMessage(msg, parentElement, nexml) {
    /* Examine a local message (stored within a tree, node, etc) and attempt to
     * move it to new-style storage within its central parent annotation. Any
     * failure (esp. due to unknown type or context) should throw an error
     * message, so that we can preserve the local message collection for later
     * cleanup attempts.
     */
    switch (msg['@code']) {
        case 'SUPPORTING_FILE_INFO':
            /* This is the most common case. Presumably its parent element is
             * the related tree. We should merge this message into the main
             * SUPPORTING_FILE_INFO annotation on the nexml object, watching
             * carefully to see if it's already listed there. IF SO, just copy
             * non-empty '@url' and '@size' values and others as needed.
             */
            if (msg.data.files.file.length !== 1) {
                throw "expected just one file in msg.data.files.file!";
            }
            var localFileInfo = msg.data.files.file[0];
            var localFileRelatedTreeID = $.trim(localFileInfo['@sourceForTree']);
            if (!localFileRelatedTreeID) {
                throw "expected (old) '@sourceForTree' not found!";
            }

            // look for matching file information in the main nexml
            var nexmlFilesMessage = getSupportingFiles(nexml);
            if (!nexmlFilesMessage) {
                throw 'nexml supporting-files info not found!';
            }
            // find the central file description with a matching treeID
            var matchingFileInfo = null;
            $.each(nexmlFilesMessage.data.files.file, function(i, fileInfo) {
                if (!fileInfo['sourceForTree']) {
                    throw "expected fileInfo['sourceForTree'] not found!";
                }
                $.each(fileInfo['sourceForTree'], function(i, relatedTreeInfo) {
                    if (relatedTreeInfo.$ === localFileRelatedTreeID) {
                        matchingFileInfo = fileInfo;
                        // Compare and copy fields from old (local) to new (central) file info.
                        // N.B. that we can drop the deprecated @id and @wasGeneratedBy fields!
                        if (!matchingFileInfo['@size']) {
                            matchingFileInfo['@size'] = localFileInfo['@size'];
                        }
                        if (!matchingFileInfo['@url']) {
                            matchingFileInfo['@url'] = localFileInfo['@url'];
                        }
                        if (!matchingFileInfo.description.$) {
                            matchingFileInfo.description.$ = localFileInfo.description.$;
                        }
                        return false;
                    }
                });
            });
            if (!matchingFileInfo) {
                // no matching central file found! move (and modify) the local file info
                delete localFileInfo['@id'];
                delete localFileInfo['@wasGeneratedBy'];
                // move simple string to new array of BadgerFish elements and clobber old property
                localFileInfo['sourceForTree'] = [ {'$':localFileRelatedTreeID} ];
                delete localFileInfo['@sourceForTree'];
                nexmlFilesMessage.data.files.file.push(localFileInfo);
            }
            break;

        default:
            throw "unknown message code '"+ msg['@code'] +"'!";
    }
    // still here? then we can safely remove this local message
    var msgCollection = getLocalMessagesCollection( parentElement );
    removeFromArray(msg, msgCollection.message);
}

function updateInferenceMethodWidgets( tree, event ) {
    // This is a sort of indirect binding, since we want to offer both
    // preset options and free-form text for inference methods.
    var $selectWidget = $('#inference-method-select');
    var $freeTextWidget = $('#inference-method-other');
    if (event) {
        // read from widgets and apply value
        var selectValue = $selectWidget.val();
        if (selectValue === 'Other (specify)') {
            $freeTextWidget.show();
            tree['^ot:curatedType'] = $freeTextWidget.val();
        } else {
            $('#inference-method-other').hide();
            tree['^ot:curatedType'] = selectValue;
        }
    } else {
        // read from model and update widget display
        var modelValue = tree['^ot:curatedType'];
        // check this value against SELECT options
        if ($selectWidget.find("option[value='"+ modelValue +"']").length === 0) {
            // not a preset option, use free-form text
            $selectWidget.val('Other (specify)');
            $freeTextWidget.val(modelValue);
            $freeTextWidget.show();
        } else {
            // select the matching option, hide the field
            $selectWidget.val(modelValue);
            $freeTextWidget.hide();
        }
    }
    nudgeTickler('TREES');
}

function getTreeChildNodes(parentNode, options) {
    // Gather all immediate child nodes (in a tree) for a given parent node.
    var parentID = parentNode['@id'];
    var itsChildren = [];
    var childEdges = getTreeEdgesByID(null, parentID, 'SOURCE');

    $.each(childEdges, function(index, edge) {
        var childID = edge['@target'];
        var childNode = getTreeNodeByID(null, childID);
        if (!('@id' in childNode)) {
            console.error(">>>>>>> childNode is a <"+ typeof(childNode) +">");
            console.error(childNode);
        }
        itsChildren.push( childNode );
        if (options && options.RECURSIVE) {
            // recurse into each child's children, and so on
            var ancestors = getTreeChildNodes(childNode, options);
            // add all ancestors to the main group
            $.merge(itsChildren, ancestors);
        }
    });
    return itsChildren;
}
function getSubtreeNodes(subtreeRootNode) {
    // Gather all descendant nodes in a tree.
    var itsDescendants = getTreeChildNodes(subtreeRootNode, {RECURSIVE: true});
    return itsDescendants;
}
function getIngroupNodes(tree) {
    // Gather all nodes in the designated ingroup, if any. If there's no
    // ingroup, return an empty array. TODO: or should we return null?
    var nodeID = tree['^ot:inGroupClade'];
    if (!nodeID) {
        return [ ];
    }
    var ingroupRootNode = getTreeNodeByID( tree, nodeID );
    return getSubtreeNodes(ingroupRootNode);
}
function updateTaxonomicMRCAForTree(tree) {
    updateMRCAForTree(tree, {'TREE_SOURCE':'taxonomy'});
}
function updateSyntheticMRCAForTree(tree) {
    updateMRCAForTree(tree, {'TREE_SOURCE':'synth'});
}

function updateMRCAForTree(tree, options) {  // TODO? (tree, options) {
    // Presumably this only works for tips already mapped to the OT taxonomy
    // TODO: should this apply only to mapped tips in the chosen ingroup?
    options = options || {'TREE_SOURCE':'taxonomy'}; // default

    var mappedIngroupOttIds = [ ];
    var ingroupNodes = getIngroupNodes(tree);
    ///console.log("How many ingroup nodes? "+ ingroupNodes.length);
    $.each(ingroupNodes, function(i, node) {
        if (node['^ot:isLeaf'] === true) {
            if ('@otu' in node) {
                var otu = getOTUByID( node['@otu'] );
                // var itsMappedLabel = $.trim(otu['^ot:ottTaxonName']);
                if ('^ot:ottId' in otu) {
                    mappedIngroupOttIds.push(otu['^ot:ottId']);
                }
            }
        }
    });
    ///console.log("How many MAPPED INGROUP TIP-IDs? "+ mappedIngroupOttIds.length);

    if (mappedIngroupOttIds.length < 2) {
        // Prompt the curator for required prerequisites.
        showErrorMessage('You must click a node to choose the ingroup clade, '
           + 'and map some of its OTUs using the tools in the OTU Mapping tab.');
        return false;
    }

    var fetchURL, POSTdata;
    switch (options.TREE_SOURCE) {
        case 'synth':
            fetchURL = getDraftTreeMRCAForNodes_url;
            POSTdata = {
                "ott_ids": mappedIngroupOttIds
            };
            break;
        case 'taxonomy':
        default:
            fetchURL = getTaxonomicMRCAForNodes_url;
            POSTdata = {
                "ott_ids": mappedIngroupOttIds,
                "include_lineage": false
            };
            break;
    }
    $.ajax({
        global: false,  // suppress web2py's aggressive error handling
        url: fetchURL,
        type: 'POST',
        dataType: 'json',
        data: JSON.stringify(POSTdata),
        crossDomain: true,
        contentType: "application/json; charset=utf-8",
        complete: function( jqXHR, textStatus ) {
            hideModalScreen();
            if (textStatus !== 'success') {
                var errMsg = 'Sorry, there was an error updating this tree\'s MRCA. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">Show details</a><pre class="error-details" style="display: none;">'+ jqXHR.responseText +'</pre>';
                showErrorMessage(errMsg);
                return;
            }
            // Analyse the response and try to show a sensible taxon name, then
            // Store the result in one or more NexSON properties?
            var responseJSON = $.parseJSON(jqXHR.responseText);
            /* N.B. The response object has different properties, depending on
             * which treeSource was specified (from the OT taxonomy or the
             * latest synthetic tree)
             */
            if (options.TREE_SOURCE === 'taxonomy') {
                // TODO: REMOVE this test and assume 'mrca' as in the v3 API documentation
                var mrcaInfo;
                if ('mrca' in responseJSON) {
                    mrcaInfo = responseJSON['mrca'];
                } else if ('taxon' in responseJSON) {
                    mrcaInfo = responseJSON['taxon'];
                }
                tree['^ot:MRCAName']  = mrcaInfo['unique_name'] || mrcaInfo['name'] || '???';
                tree['^ot:MRCAOttId'] = mrcaInfo['ott_id'] || '???';
            } else {  // ASSUME 'synth'
                var nearestTaxonInfo;
                if ('nearest_taxon' in responseJSON) {
                    // MRCA was an unlabeled internal node; show the nearest taxon instead
                    nearestTaxonInfo = responseJSON['nearest_taxon'];
                } else {
                    // MRCA is also a proper taxon, read directly from its node-info
                    nearestTaxonInfo = responseJSON['mrca']['taxon'];
                }
                tree['^ot:nearestTaxonMRCAName'] = nearestTaxonInfo['unique_name'] || '???';
                tree['^ot:nearestTaxonMRCAOttId'] = nearestTaxonInfo['ott_id'] || null;
            }
            nudgeTickler('TREES');
        }
    });
    return false;
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
    },
    'SUPPORTING_FILES': function( data, event ) {
        nudgeTickler( 'SUPPORTING_FILES');
        return true;
    },
    'OTU_MAPPING_HINTS': function( data, event ) {
        nudgeTickler( 'OTU_MAPPING_HINTS');
        return true;
    },
    'EDGE_DIRECTIONS': function( data, event ) {
        nudgeTickler( 'EDGE_DIRECTIONS');
        return true;
    },
    'COLLECTIONS_LIST': function( data, event ) {
        nudgeTickler( 'COLLECTIONS_LIST');
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

    // if this reflects changes to the collection, nudge the main 'dirty flag' tickler
    if (name !== 'COLLECTIONS_LIST') {
        viewModel.ticklers.STUDY_HAS_CHANGED( viewModel.ticklers.STUDY_HAS_CHANGED.peek() + 1 );
        ///console.warn('STUDY_HAS_CHANGED');
    }
}

function getFastLookup( lookupName ) {
    // return (or build) a flat list of Nexson elements by ID
    if (lookupName in viewModel.fastLookups) {
        if (viewModel.fastLookups[ lookupName ] === null) {
            buildFastLookup( lookupName );
        }
        return viewModel.fastLookups[ lookupName ];
    }
    console.error("No such lookup as '"+ lookupName +"'!");
    return null;
}
function buildFastLookup( lookupName ) {
    // (re)build and store a flat list of Nexson elements by ID
    if (lookupName in viewModel.fastLookups) {
        clearFastLookup( lookupName );
        var newLookup = {};
        switch( lookupName ) {

            case 'NODES_BY_ID':
                // assumes that all node ids are unique, across all trees
                var allTrees = viewModel.elementTypes.tree.gatherAll(viewModel.nexml);
                $.each(allTrees, function( i, tree ) {
                    $.each(tree.node, function( i, node ) {
                        var itsID = node['@id'];
                        if (itsID in newLookup) {
                            console.warn("Duplicate node ID '"+ itsID +"' found ["+ lookupName +"]");
                        }
                        newLookup[ itsID ] = node;
                    });
                });
                break;

            case 'TREES_BY_OTU_ID':
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

            case 'OTUS_BY_ID':
                // assumes that all node ids are unique, across all trees
                // AND 'otus' collections!
                $.each(viewModel.nexml.otus, function( i, otusCollection ) {
                    $.each(otusCollection.otu, function( i, otu ) {
                        var itsID = otu['@id'];
                        if (itsID in newLookup) {
                            console.warn("Duplicate otu ID '"+ itsID +"' found ["+ lookupName +"]");
                        }
                        newLookup[ itsID ] = otu;
                    });
                });
                break;

            case 'EDGES_BY_SOURCE_ID':
                // allow multiple values for each source (ie, multiple children)
                var allTrees = [];
                $.each(viewModel.nexml.trees, function(i, treesCollection) {
                    $.each(treesCollection.tree, function(i, tree) {
                        allTrees.push( tree );
                    });
                });
                $.each(allTrees, function( i, tree ) {
                    $.each(tree.edge, function( i, edge ) {
                        var sourceID = edge['@source'];
                        if (sourceID in newLookup) {
                            newLookup[ sourceID ].push( edge );
                        } else {
                            // create the array, if not found
                            newLookup[ sourceID ] = [ edge ];
                        }
                    });
                });
                break;

            case 'EDGES_BY_TARGET_ID':
                // allow multiple values for each target (for conflicted trees)
                var allTrees = [];
                $.each(viewModel.nexml.trees, function(i, treesCollection) {
                    $.each(treesCollection.tree, function(i, tree) {
                        allTrees.push( tree );
                    });
                });
                $.each(allTrees, function( i, tree ) {
                    $.each(tree.edge, function( i, edge ) {
                        var targetID = edge['@target'];
                        if (targetID in newLookup) {
                            newLookup[ targetID ].push( edge );
                        } else {
                            // create the array, if not found
                            newLookup[ targetID ] = [ edge ];
                        }
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

function getAssociatedTrees( fileInfo ) {
    var trees = [ ];
    if ('sourceForTree' in fileInfo) {
        // check to make sure each tree still around
        $.each(fileInfo['sourceForTree'], function(i, idHolder) {
            var id = idHolder.$;
            var foundTree = getTreeByID(id);
            if (foundTree) {
                trees.push(foundTree);
            }
        });
    }
    return trees;
}
function getAssociatedTreeLabels( fileInfo ) {
    var trees = getAssociatedTrees( fileInfo );
    var treeLabels = $.map(trees, function(tree) {
        return tree['@label'] || '';
    });
    return treeLabels;
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

function autoApplyExactMatch() {
    // if the user hit the ENTER key, and there's an exact match, apply it automatically
    if (hopefulSearchName) {
        $('#search-results a').each(function() {
            var $link = $(this);
            if ($link.text().toLowerCase() === hopefulSearchName.toLowerCase()) {
                $link.trigger('click');
                return false;
            }
        });
    }
}

function lookUpDOI() {
    // try to find a match, based on existing metadata
    var referenceText = $.trim( $('#ot_studyPublicationReference').val() );
    var lookupURL;
    if (referenceText === '') {
        // try a generic search in a new window
        lookupURL = 'http://search.crossref.org/';
        window.open(lookupURL,'lookup');
    } else {
        // see if we get lucky..
        lookupURL = '/curator/search_crossref_proxy?' + encodeURIComponent(referenceText).replace(/\(/g,'%28').replace(/\)/g,'%29');

        // show potential matches in popup? or new frame?
        showModalScreen("Looking up DOI...", {SHOW_BUSY_BAR:true});
        $.ajax({
            global: false,  // suppress web2py's aggressive error handling
            type: 'GET',
            dataType: 'json',
            // crossdomain: true,
            // contentType: "application/json; charset=utf-8",
            url: lookupURL,
            //data: {'q': referenceText},
            complete: function( jqXHR, textStatus ) {
                hideModalScreen();
                if (textStatus !== 'success') {
                    var errMsg = 'Sorry, there was an error looking up this study\'s DOI. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">Show details</a><pre class="error-details" style="display: none;">'+ jqXHR.responseText +'</pre>';
                    showErrorMessage(errMsg);
                    return;
                }
                // Show best guesses for this DOI
                // convert raw response to JSON
                var resultsJSON = $.parseJSON(jqXHR.responseText);
                if (resultsJSON.status !== 'ok') {
                    var errMsg = 'Sorry, there was an error looking up this study\'s DOI. Please try again in a moment.';
                    showErrorMessage(errMsg);
                    return;
                }
                var foundItems = resultsJSON.message.items;
                console.log("FOUND "+ foundItems.length +" matching items");
                if (foundItems.length === 0) {
                    alert('No matches found, please check your publication reference text.')
                } else {
                    var $lookup = $('#DOI-lookup');
                    $lookup.find('.found-matches-count').text(foundItems.length);
                    $lookup.find('.found-matches').empty();
                    $lookup.find('#current-ref-text').html( viewModel.nexml['^ot:studyPublicationReference'] || '<em>No reference text</em>');
                    var currentDOI = viewModel.nexml['^ot:studyPublication']['@href'];
                    updateDOIPreviewLink(currentDOI);
                    $.each(foundItems, function(i, match) {
                        var $matchInfo = $('<div class="match"><div class="full-citation"><em>Loading citation text...</em></div><div class="doi"></div></div>');
                        // CrossRef APIs (as of 2019) require a second call to retrieve reference text
                        var refTextFetchURL = 'https://api.crossref.org/works/DOI/transform/text/x-bibliography'.replace('DOI', encodeURIComponent(match.DOI));
                        $matchInfo.find('.full-citation').load(refTextFetchURL, function(responseText, textStatus, jqXHR) {
                                                                 $(this).html(decodeURIComponent(responseText));
                                                                 var $btn = $('<button class="btn btn-info">Update reference text</button>');
                                                                 $btn.click( updateRefTextFromLookup );
                                                                 $matchInfo.append($btn);
                                                             });  // these will load ASAP
                        // REMINDER: CrossRef returns DOI-as-URL in its URL field!
                        $matchInfo.find('.doi').html( match.URL
                            ? '<a href="'+ match.URL +'" target="_blank">'+ match.URL +'</a>'
                            : '<em>No DOI found.</em>'
                        );
                        if (match.URL) {
                            var $btn = $('<button class="btn btn-info pull-right">Update DOI</button>');
                            $btn.click( updateDOIFromLookup );
                            $matchInfo.append($btn);
                        }
                        $lookup.find('.found-matches').append($matchInfo);
                    });
                    $lookup.off('shown').on('shown', function() {
                        // size scrolling list to fit in the current DOI-lookup popup window
                        var $lookup = $('#DOI-lookup');
                        var resultsListHeight = $lookup.find('.modal-body').height() - $lookup.find('.before-matches').height();
                        $lookup.find('.found-matches').outerHeight(resultsListHeight);
                    });
                    $lookup.modal('show');
                }
            }
        });
    }
}

function updateDOIPreviewLink(doi) {
    var $previewLink = $('#DOI-lookup').find('#current-ref-URL');
    if (doi) {
        $previewLink.html(doi);
        $previewLink.attr('href', doi);
        $previewLink.removeAttr('onclick');
    } else {
        $previewLink.html('<em>No DOI or URL</em>');
        $previewLink.attr('href', '#');
        $previewLink.attr('onclick','return false;');
    }
}


function updateRefTextFromLookup(evt) {
    var $clicked = $(evt.target);
    var chosenRefText = $clicked.closest('.match').find('.full-citation').text();

    // update popup window and adjust list height
    var $lookup = $('#DOI-lookup');
    var oldBeforeListHeight = $lookup.find('.before-matches').outerHeight();
    var oldListHeight = $lookup.find('.found-matches').outerHeight();
    $lookup.find('#current-ref-text').html(chosenRefText);
    var heightAdjust = $lookup.find('.before-matches').outerHeight() - oldBeforeListHeight;
    $lookup.find('.found-matches').outerHeight(oldListHeight - heightAdjust);

    viewModel.nexml['^ot:studyPublicationReference'] = chosenRefText;
    nudgeTickler('GENERAL_METADATA');
}
function updateDOIFromLookup(evt) {
    var $clicked = $(evt.target);
    var chosenDOI = $clicked.closest('.match').find('.doi').text();

    // update popup window and adjust list height
    var $lookup = $('#DOI-lookup');
    var oldBeforeListHeight = $lookup.find('.before-matches').outerHeight();
    var oldListHeight = $lookup.find('.found-matches').outerHeight();
    updateDOIPreviewLink(chosenDOI);
    var heightAdjust = $lookup.find('.before-matches').outerHeight() - oldBeforeListHeight;
    $lookup.find('.found-matches').outerHeight(oldListHeight - heightAdjust);

    viewModel.nexml['^ot:studyPublication']['@href'] = chosenDOI;
    // (re)format DOI if needed, and test for duplicate studies
    validateAndTestDOI();
    nudgeTickler('GENERAL_METADATA');
}

var minimalDOIPattern = new RegExp('10\\..+')
//var urlDOIPattern = new RegExp('http://dx.doi.org/10[.\\d]{2,}\\b')
var urlPattern = new RegExp('http(s?)://\\S+');
function formatDOIAsURL() {
    var oldValue = viewModel.nexml['^ot:studyPublication']['@href'];
    var newValue = DOItoURL( oldValue );
    if (newValue === oldValue) {
        // no change, so no further action needed
        return;
    }
    viewModel.nexml['^ot:studyPublication']['@href'] = newValue;
    nudgeTickler('GENERAL_METADATA');
}
function formatDataDepositDOIAsURL() {
    var oldValue = viewModel.nexml['^ot:dataDeposit']['@href'];
    var newValue = DOItoURL( oldValue );
    if (newValue === oldValue) {
        // no change, so no further action needed
        return;
    }
    viewModel.nexml['^ot:dataDeposit']['@href'] = newValue;
    nudgeTickler('GENERAL_METADATA');
}

/*
* N.B. this duplicates the function with same name in
* webapp/static/js/webapp-helpers.js, so any changes should be made in both
* places.
*/
function DOItoURL( doi ) {
    /* Return the DOI provided (if any) in URL form */
    if (!doi) {  // null, undefined, or empty string
        return "";
    }
    if (urlPattern.test(doi) === true) {
        // It's already in the form of a URL, return unchanged
        return doi;
    }
    // IF it's not a reasonable "naked" DOI, do nothing
    var possibleDOIs = doi.match(minimalDOIPattern);
    if( possibleDOIs === null ) {
        // No possible DOI found, return unchanged
        return doi;
    }
    // This is a candidate; try to convert it to URL form
    var bareDOI = $.trim( possibleDOIs[0] );
    return ('http://dx.doi.org/'+ bareDOI);
}
function testDOIForDuplicates( doi ) {
    // REMINDER: This is usually a full DOI, but not always. Test any valid URL!
    if (!doi) {
        // by default, this should check the current study DOI
        var studyDOI = ('^ot:studyPublication' in viewModel.nexml) ? viewModel.nexml['^ot:studyPublication']['@href'] : "";
        doi = studyDOI;
    }
    // Don't bother showing matches for empty or invalid DOI/URL; in fact, clear the list!
    doi = $.trim(doi);  // remove leading/trailing whitespace!
    var isTestableURL = urlPattern.test(doi);
    if (isTestableURL) {
        checkForDuplicateStudies(
            'DOI',
            doi,
            function( matchingStudyIDs ) {  // success callback
                // remove this study's ID, if found
                matchingStudyIDs = $.grep(matchingStudyIDs, function (testID) { return testID !==  studyID });
                // update the viewModel and trigger fresh tests+prompts
                viewModel.duplicateStudyIDs( matchingStudyIDs );
                nudgeTickler('GENERAL_METADATA');
            },
            function( ) {  // error callback
                /* Something went wrong! The called function will show the
                 * error footer, but we should also clear the matching-IDs list
                 * so that we don't show stale matches.
                 */
                viewModel.duplicateStudyIDs( [ ] );
                nudgeTickler('GENERAL_METADATA');
            }
        );
    } else {
        // Clear any old list of duplicates
        viewModel.duplicateStudyIDs( [ ] );
        nudgeTickler('GENERAL_METADATA');
    }
}
function validateAndTestDOI() {
    formatDOIAsURL();
    testDOIForDuplicates();
}

function unresolvedDuplicatesFoundInTree( tree ) {
    // N.B. This checks for UNRESOLVED and INTERESTING (non-sibling) duplicates
    var duplicateData = getUnresolvedDuplicatesInTree( tree, {INCLUDE_MONOPHYLETIC: false} );
    return $.isEmptyObject(duplicateData) ? false : true;
}

function isDuplicateNode( tree, node ) {
    ///console.log("isDuplicateNode( "+ tree['@id'] +", "+ node['@id'] +")...");
    // N.B. This checks for ALL duplicates (incl. resolved and sibling-only)
    var duplicateInfo = getDuplicateNodesInTree( tree );
    var foundNodeInduplicateData = false;
    for (var taxonID in duplicateInfo) {
        $.each(duplicateInfo[taxonID], function(i, mapping) {
            if (mapping.nodeID === node['@id']) {
                foundNodeInduplicateData = true;
                return false;
            }
        });
    }
    return foundNodeInduplicateData;
}
function getUnresolvedDuplicatesInTree( tree, options ) {
    // Filter from full duplicate data to include just those node-sets that
    // have't been resolved, ie, curator has not chosen an exemplar.
    var includeMonophyleticDuplicates = options && ('INCLUDE_MONOPHYLETIC' in options) ? options.INCLUDE_MONOPHYLETIC : false;
    var unresolvedDuplicates = {};
    var allDuplicates = getDuplicateNodesInTree( tree );
    for (var taxonID in allDuplicates) {
        var allNodesAlreadyMarked = true; // we can disprove this from any node
        var itsMappings = allDuplicates[taxonID];
        $.each(itsMappings, function(i, mapping) {
            if (!(mapping.curatorHasMarkedNode)) {
                allNodesAlreadyMarked = false;
                return false;
            }
        });
        if (!(allNodesAlreadyMarked)) {
            if (includeMonophyleticDuplicates) {
                unresolvedDuplicates[ taxonID ] = itsMappings;
            } else if (!(itsMappings.monophyletic)) {
                // ignore sets that constitute a clade
                unresolvedDuplicates[ taxonID ] = itsMappings;
            }
        }
    }
    return unresolvedDuplicates;
}

function getDuplicateNodesInTree( tree ) {
    // Return sets of nodes that ultimately map to a single OT taxon (via
    // multiple OTUs) and are not monophyletic. A curator should choose the
    // 'exemplar' node to avoid problems in synthesis.
    var duplicateNodes = { };

    if (!isQueuedForNewSynthesis(tree)) {
        // ignoring these for now...
        return duplicateNodes;
    }

    // Pull from cached information, if any (else populate the cache)
    if (tree.taxonMappingInfo) {
        ///console.log('!!!!! getConflictingNodesInTree (treeid='+ tree['@id'] +'...) using cached taxon-mapping info');
        return tree.taxonMappingInfo;
    }
    ///console.log('..... getConflictingNodesInTree (treeid='+ tree['@id'] +'...) building fresh taxon-mapping info');

    var taxonMappings = { };
    $.each(tree.node, function( i, node ) {
        if ('@otu' in node) {
            var otuID = node['@otu'];
            var otu = getOTUByID(otuID);
            if (otu && '^ot:ottId' in otu) {
                var taxonID = otu['^ot:ottId'];
                if (taxonID) {
                    // add or extend the entry for this OTT taxon
                    if (!(taxonID in taxonMappings)) {
                        taxonMappings[taxonID] = [ ];
                    }
                    taxonMappings[taxonID].push({
                        nodeID: node['@id'],
                        otuID: otuID,
                        curatorHasMarkedNode: ('^ot:isTaxonExemplar' in node)
                    });
                }
            }
        }
    });

    // Gather all duplicate mappings, but mark them to distinguish trivial cases
    // (the duplicates are siblings) from more interesting cases (there is
    // ambiguity about placement of the OT taxon because duplicates in multiple
    // places in the tree)
    // N.B. Trivial duplicates will be reconciled on the server in any case, but this
    // will help us to show consistent UI when monophyletic duplicates.
    for (taxonID in taxonMappings) {
        ///console.log('>>>> taxonID '+ taxonID +'...');
        // is there more than one node for this taxon?
        var itsMappings = taxonMappings[taxonID];
        itsMappings.monophyletic = false;
        if (itsMappings.length > 1) {
            var duplicateNodeIDs = $.map(itsMappings, function(m) {
                return m.nodeID;
            });
            if (tipsAreMonophyletic(duplicateNodeIDs, tree)) {
                itsMappings.monophyletic = true;
                ///console.log('>>>> checking for monophyly... YES');
            } else {
                ///console.log('>>>> checking for monophyly... NO');
            }
            duplicateNodes[ taxonID ] = itsMappings;
        }
    }
    ///console.log('..... found '+ Object.keys(duplicateNodes).length  +' conflicting nodes');

    // cache the result for next time
    tree.taxonMappingInfo = duplicateNodes;
    return duplicateNodes;
}
function tipsAreMonophyletic(tipIDs, tree) {
    ///return false;
    // general fast check for monophyly in a specified tree
    if (tipIDs.length < 2) {
        return true;
    }
    /* Find the least-inclusive common ancestor for all the specified tips,
     * then recurse to see if all these tips (and only these tips) are found in
     * its clade.
     */
    var licaID = getCommonAncestorNodeID(tipIDs, tree);
    var licaTipIDs = getAllMemberTipIDs(licaID, tree);
    // For monophyly, this list of IDs must *exactly* match our initial tip-ID list.
    if (licaTipIDs.length !== tipIDs.length) return false;
    var differenceFound = false;
    $.grep(licaTipIDs, function(el) {
        if ($.inArray(el, tipIDs) == -1) {
            differenceFound = true;
            return false;  // stops checking ids
        }
    });
    return (!differenceFound);
}
function getAllMemberTipIDs(cladeTopNodeID, tree, memberTipIDsSoFar) {
    // recurse through subclades to gather all tip IDs under the given node
    if (!memberTipIDsSoFar) { memberTipIDsSoFar = [ ] };  // used for recursion
    var sourceLookup = getFastLookup('EDGES_BY_SOURCE_ID');
    var childEdges = sourceLookup[ cladeTopNodeID ];
    if (childEdges) {
        $.each(childEdges, function(i, edge) {
            var testChildID = edge['@target'];
            getAllMemberTipIDs(testChildID, tree, memberTipIDsSoFar);
        });
    } else {
        // this is a tip!
        memberTipIDsSoFar.push( cladeTopNodeID );
    }
    return memberTipIDsSoFar;
}
function getCommonAncestorNodeID(tipIDs, tree) {
    // Find and return the least-inclusive common ancestor (its ID) for the tip/leaf IDs provided
    var foundLICA = null;
    var ancestorsByTipID = {};
    $.each(tipIDs, function(i, tipID) {
        ancestorsByTipID[ tipID ] = getAncestorNodeIDs(tipID, tree);
    });
    ///console.log('>>> ancestorsByTipID:');
    ///console.log(ancestorsByTipID);
    var firstTipID = tipIDs[0];
    var firstTipAncestorIDs = ancestorsByTipID[ firstTipID ];
    // One of these is our LICA... but which? Test against the other tips!
    delete ancestorsByTipID[ firstTipID ];
    $.each(firstTipAncestorIDs, function(i, testAncestorID) {
        // the first one that exists in every list is the LICA
        var notFound = false;
        for (var testTipID in ancestorsByTipID) {
            var itsAncestorIDs = ancestorsByTipID[ testTipID ];
            if ($.inArray(testAncestorID, itsAncestorIDs) === -1) {
                // this was not found in another tip's ancestors! try the next
                return true;
            }
        }
        foundLICA = testAncestorID;
        return false; // stop searching!
    });
    ///console.log('>>> foundLICA:');
    ///console.log(foundLICA);
    return foundLICA;
}
function getAncestorNodeIDs(nodeID, tree) {
    var ancestorIDs = [ ];
    var testNodeID = nodeID;
    while (testNodeID) {
        var parentID = getParentNodeID(testNodeID, tree)
        if (parentID) {
            ancestorIDs.push( parentID );
        }
        testNodeID = parentID;
    }
    ///console.log('>>>> ancestor nodes for '+ nodeID +': '+ ancestorIDs);
    return ancestorIDs;
}
function getParentNodeID(nodeID, tree) {
    var upwardEdge = getTreeEdgesByID(tree, nodeID, 'TARGET')[0];
    // N.B. Due to NexSON constraints, assume exactly one upward edge!
    return upwardEdge ? upwardEdge['@source'] : null;
}
function markTaxonExemplar( treeID, chosenNodeID, options ) {
    // find all duplicate nodes and set flag for each
    options = options || {REDRAW_TREE: true};
    var chosenNode = getTreeNodeByID(treeID, chosenNodeID);
    if (!chosenNode) {
        console.error("markTaxonExemplar("+ treeID +","+ chosenNodeID +"): Chosen node not found!");
        return;  // do nothing (this is not good)
    }
    var otuID = chosenNode['@otu'];
    var otu = getOTUByID(otuID);
    if (otu && '^ot:ottId' in otu) {
        var taxonID = otu['^ot:ottId'];
    } else {
        console.error("markTaxonExemplar("+ treeID +","+ chosenNodeID +"): No mapped taxon found!");
        return;  // do nothing (this is not good)
    }
    var tree = getTreeByID(treeID);
    var duplicateData = getDuplicateNodesInTree(tree);
    var itsMappings = duplicateData[taxonID];
    if (!itsMappings) {
        console.error("markTaxonExemplar("+ treeID +","+ chosenNodeID +"): No mappings list found!");
        return;  // do nothing (this is not good)
    }
    $.each(itsMappings, function(i, mapping) {
        var mappedNode = getTreeNodeByID(treeID, mapping.nodeID);
        mappedNode['^ot:isTaxonExemplar'] = (mapping.nodeID === chosenNodeID) ? true : false;
    });
    removeTaxonMappingInfoFromTree( tree );  // clear cached info
    nudgeTickler('TREES');
    if (options.REDRAW_TREE) {
        // update color of duplicate nodes (exemplars vs. others)
        drawTree(treeID);
    }
    // TODO: what happens now?
    //      - move to next duplicate taxon, if any?
    //      - remove this set of mappings, or regenerate duplicateData?
    //      - update the prompt in tree popup to say DONE, or MOVING ON...?
}
function clearTaxonExemplar( treeID, chosenNodeID, options ) {
    // remove choice of exemplar (will trigger UI and prompts to choose again)
    options = options || {REDRAW_TREE: true};
    var chosenNode = getTreeNodeByID(treeID, chosenNodeID);
    if (!chosenNode) {
        console.error("clearTaxonExemplar("+ treeID +","+ chosenNodeID +"): Chosen node not found!");
        return;  // do nothing (this is not good)
    }
    var otuID = chosenNode['@otu'];
    var otu = getOTUByID(otuID);
    if (otu && '^ot:ottId' in otu) {
        var taxonID = otu['^ot:ottId'];
    } else {
        console.error("clearTaxonExemplar("+ treeID +","+ chosenNodeID +"): No mapped taxon found!");
        return;  // do nothing (this is not good)
    }
    var tree = getTreeByID(treeID);
    var duplicateData = getDuplicateNodesInTree(tree);
    var itsMappings = duplicateData[taxonID];
    if (!itsMappings) {
        console.error("clearTaxonExemplar("+ treeID +","+ chosenNodeID +"): No mappings list found!");
        return;  // do nothing (this is not good)
    }
    $.each(itsMappings, function(i, mapping) {
        var mappedNode = getTreeNodeByID(treeID, mapping.nodeID);
        delete mappedNode['^ot:isTaxonExemplar'];
    });
    removeTaxonMappingInfoFromTree( tree );  // clear cached info
    nudgeTickler('TREES');
    if (options.REDRAW_TREE) {
        // update color of duplicate nodes (exemplars vs. others)
        drawTree(treeID);
    }
}
function resolveMonophyleticDuplicatesInTree(tree) {
    // Find and resolve all simple conflicts between sibling nodes, and any
    // others where the conflicting nodes constitute a clade. In all cases, our
    // choice is arbitrary; we simply select the first node found as the exemplar.
    var duplicateData = getUnresolvedDuplicatesInTree( tree, {INCLUDE_MONOPHYLETIC: true} );
    for (var taxonID in duplicateData) {
        var duplicateInfo = duplicateData[taxonID];
        if (duplicateInfo.monophyletic) {
            var firstDuplicateNodeID = duplicateInfo[0].nodeID;
            markTaxonExemplar( tree['@id'], firstDuplicateNodeID, {REDRAW_TREE: false});
        }
    }
    removeTaxonMappingInfoFromTree( tree );  // clear cached info
}

var nodeLabelModes = [
    {
        text: 'Choose one...',
        treeNodeLabelMode: 'ot:undefined',
        edgePredicate: null,
        captureValue: function(val) {
            return null;  // do nothing
        }
    },
    {
        text: 'Bootstrap proportion (0-1)',
        treeNodeLabelMode: 'ot:bootstrapValues',
        edgePredicate: '^ot:bootstrapValues',
        captureValue: function(val) {
            var numericVal = Number(val);
            return isNaN(numericVal) ? null : numericVal * 100.0;
        }
    },
    {
        text: 'Bootstrap percentage (0-100)',
        treeNodeLabelMode: 'ot:bootstrapValues',
        edgePredicate: '^ot:bootstrapValues',
        captureValue: function(val) {
            var numericVal = Number(val);
            return isNaN(numericVal) ? null : numericVal;
        }
    },
    {
        text: 'Posterior prob (0-1)',
        treeNodeLabelMode: 'ot:posteriorSupport',
        edgePredicate: '^ot:posteriorSupport',
        captureValue: function(val) {
            var numericVal = Number(val);
            return isNaN(numericVal) ? null : numericVal;
        }
    },
    {
        text: 'Posterior percentage (0-100)',
        treeNodeLabelMode: 'ot:posteriorSupport',
        edgePredicate: '^ot:posteriorSupport',
        captureValue: function(val) {
            var numericVal = Number(val);
            return isNaN(numericVal) ? null : numericVal / 100.0;
        }
    },
    {
        text: 'Other support (describe below)',
        treeNodeLabelMode: 'ot:otherSupport',
        edgePredicate: '^ot:otherSupport',
        captureValue: function(val) {
            return val;  // move value as-is
        }
    },
 /* {
        text: 'Taxon names',
        treeNodeLabelMode: 'ot:taxonNames',
        edgePredicate: null,
        captureValue: function(val) {
            return null;  // do nothing
        }
    }, */
    {
        text: 'Not a support statement (e.g., taxon names)',  // eg, ot:taxonNames
        treeNodeLabelMode: 'ot:other',
        edgePredicate: null,
        captureValue: function(val) {
            return null;  // do nothing
        }
    }
];
function updateNodeLabelMode(tree) {
    /* Translate the choices in nodeLabelModes into action:
         - update the tree's nodeLabelMode
         - transform the node @label properties and shift them to their new
           locations (or not)
   */
    tree['^ot:nodeLabelMode'] = viewModel.chosenNodeLabelModeInfo().treeNodeLabelMode;
    switch(viewModel.chosenNodeLabelModeInfo().treeNodeLabelMode) {
        case 'ot:otherSupport':
        case 'ot:other':
            tree['^ot:nodeLabelDescription'] = viewModel.nodeLabelModeDescription();
            break;
        default:
            tree['^ot:nodeLabelDescription'] = '';
    }

    $.each( tree.node, function(i, node) {
        var targetLookup = getFastLookup('EDGES_BY_TARGET_ID');
        if ($.trim(node['@label']) !== '') {
            var modifiedValue = viewModel.chosenNodeLabelModeInfo().captureValue(node['@label']);
            if (modifiedValue === null) {
                // do nothing; value wasn't accepted
            } else {
                // shift the modified value to its final home
                var nodeID = node['@id'];
                var matchingEdges = targetLookup[ nodeID ];
                if (matchingEdges && matchingEdges.length > 0) {
                    var rootwardEdge = matchingEdges[0];
                    rootwardEdge[ '^'+ viewModel.chosenNodeLabelModeInfo().treeNodeLabelMode ] = modifiedValue;
                    delete node['@label'];
                    if (viewModel.chosenNodeLabelModeInfo().treeNodeLabelMode === 'ot:otherSupport') {
                        rootwardEdge['^ot:otherSupportType'] = tree['^ot:nodeLabelDescription'];
                    }
                } else {
                    console.warn("shiftAmbiguousLabels(): node has no adjacent edge! possibly a new root?");
                }
            }
        }
    });
    drawTree( tree );
    nudgeTickler('TREES');
}
function ambiguousLabelsFoundInTree( tree ) {
    // N.B. This checks for cases where there are node labels but the node
    // label type has not been defined by a curator
    var labelData = getAmbiguousLabelsInTree( tree );
    return $.isEmptyObject(labelData) ? false : true;
}
function getAmbiguousLabelsInTree(tree) {
    // gather all labels, keyed by node ID
    // TODO: Should this be just for internal nodes?
    var labelData = {};

    var rawModeValue = tree['^ot:nodeLabelMode'];
    var treeHasLabelInterpretation = rawModeValue && (rawModeValue !== 'ot:undefined') ;
    if (treeHasLabelInterpretation) {
        return labelData;
    }

    $.each( tree.node, function(i, node) {
        if (node['^ot:isLeaf'] === true) {
            /* We sometimes save a misspelled taxon name as `node[@label]` so
             * we can show it later, but tip labels aren't really ambiguous here.
             */
            return true;  // skip to next node
        }
        if ('@label' in node) {
            var nodeID = node['@id'];
            labelData[ nodeID ] = node['@label'];
        }
    });
    return labelData;
}
function showAmbiguousLabelsInTreeViewer(tree) {
    // If there are no ambiguous labels, fall back to simple tree view
    var ambiguousLabelData = getAmbiguousLabelsInTree(tree);
    if ($.isEmptyObject(ambiguousLabelData)) {
        showTreeWithHistory(tree);
        return;
    }
    // hint to tree viewer that we're focused on these labels
    showTreeViewer(tree, {
        HIGHLIGHT_AMBIGUOUS_LABELS: true  // TODO
    });
}
function chosenLabelModeRequiresDescription() {
    if (viewModel.chosenNodeLabelModeInfo() === null)
        return false;
    switch(viewModel.chosenNodeLabelModeInfo()['treeNodeLabelMode']) {
        case 'ot:otherSupport':
        case 'ot:other':
            return true;
        default:
            return false;
    }
}
function readyToCaptureInternalNodeLabels() {
    var isReady = false;
    if (viewModel.chosenNodeLabelModeInfo() && viewModel.chosenNodeLabelModeInfo().treeNodeLabelMode !== 'ot:undefined') {
        if (chosenLabelModeRequiresDescription()) {
            // test for 2+ non-whitespace characters
            var description = $.trim(viewModel.nodeLabelModeDescription());
            isReady = (description.length >= 2);
        } else {
            // any other value is ready to go
            isReady = true;
        }
    }
    return isReady;
}
function getNodeLabelModeDescription(tree) {
    // return a friendly string description, incl. possible description
    var treeMode = tree['^ot:nodeLabelMode'] || 'ot:undefined';
    switch(treeMode) {
        case 'ot:undefined':
            if (ambiguousLabelsFoundInTree(tree)) {
                return 'Undefined (needs review)';
            } else {
                return 'No internal labels found';
            }
        case 'ot:bootstrapValues':
            return 'Bootstrap support values';
        case 'ot:posteriorSupport':
            return 'Posterior support values';
        case 'ot:otherSupport':
            var moreInfo = tree['^ot:nodeLabelDescription'];
            return 'Support values ('+ moreInfo +')';
        case 'ot:other':
            var moreInfo = tree['^ot:nodeLabelDescription'];
            return moreInfo;
    }
}

function getStudyLicenseInfo( nexml ) {
    if (!nexml) {
        nexml = viewModel.nexml;
    }
    //  nexml['^xhtml:license'] = {'@href': 'http://creativecommons.org/publicdomain/zero/1.0/'}
    if ('^xhtml:license' in nexml) {
        return nexml['^xhtml:license'];
    }
    return null;
}

function studyHasCC0Waiver( nexml ) {
    var licenseInfo = getStudyLicenseInfo( nexml );
    if (licenseInfo && '@href' in licenseInfo) {
        var licenseURL = licenseInfo['@href'];
        return licenseURL === 'http://creativecommons.org/publicdomain/zero/1.0/';
    }
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
            viewModel['commentHTML'] = viewModel.nexml['^ot:comment'];
            nudgeTickler('GENERAL_METADATA');
        }
    );
}
function showStudyCommentPreview() {
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

function collectionContributedToLatestSynthesis() {
    // check for a valid SHA from last synthesis
    return ($.trim(latestSynthesisSHA) !== '');
}
function currentCollectionVersionContributedToLatestSynthesis() {
    // compare SHA values and return true if they match
    return (viewModel.startingCommitSHA === latestSynthesisSHA);
}

function getNormalizedStudyPublicationURL() {
    // just the bare URL, or '' if not found
    var url = $.trim(viewModel.nexml['^ot:studyPublication']['@href']);
    // If there's no URL, we have nothing to say
    if (url === '') {
        return '';
    }
    if (urlPattern.test(url) === true) {
        // It's a proper URL, update it to match latest CrossRef guidelines
        url = latestCrossRefURL(url);
        return url;
    }
    // It's not a proper URL! Return the bare value.
    return url;
}

function getStudyPublicationLink() {
    // this is displayed HTML (typically a hyperlink, occasionally a bare string)
    var url = getNormalizedStudyPublicationURL();
    // If there's no URL, we have nothing to say
    if (url === '') {
        return '';
    }
    if (urlPattern.test(url) === true) {
        // It's a proper URL, wrap it in a hyperlink
        return '<a target="_blank" href="'+ url +'">'+ url +'</a>';
    }
    // It's not a proper URL! Return the bare value.
    return url;
}

function getNormalizedDataDepositURL() {
    var url = $.trim(viewModel.nexml['^ot:dataDeposit']['@href']);
    // TreeBASE URLs should point to a web page (vs RDF)
    // EXAMPLE: http://purl.org/phylo/treebase/phylows/study/TB2:S13451
    //    => http://treebase.org/treebase-web/search/study/summary.html?id=13451
    var regex = new RegExp('//purl.org/phylo/treebase/phylows/study/TB2:S(\\d+)');
    var matches = regex.exec(url);
    if (matches && matches.length === 2) {
        var treebaseStudyID = matches[1];
        url = url.replace(
            regex,
            '//treebase.org/treebase-web/search/study/summary.html?id=$1'
        );
        return url;
    }
    if (urlPattern.test(url) === true) {
        // It's a proper URL, update it to match latest CrossRef guidelines
        // (this is harmless for other URLs)
        url = latestCrossRefURL(url);
        return url;
    }
    // It's not a proper URL! Return the bare value.
    return url;
}
function getDataDepositMessage() {
    // Returns HTML explaining where to find this study's data, or an empty
    // string if no URL is found. Some cryptic dataDeposit URLs may require
    // more explanation or a modified URL to be more web-friendly.
    //
    // NOTE that we maintain a server-side counterpart in
    // webapp/modules/opentreewebapputil.py > get_data_deposit_message
    var url = getNormalizedDataDepositURL();
    // If there's no URL, we have nothing to say
    if (url === '') {
        return '';
    }

    // TreeBASE URLs get a special description here
    // EXAMPLE: http://purl.org/phylo/treebase/phylows/study/TB2:S13451
    //    => http://treebase.org/treebase-web/search/study/summary.html?id=13451
    var treebasePattern = new RegExp('//treebase.org/treebase-web/.*?id=(\\d+)');
    var matches = treebasePattern.exec(url);
    if (matches && matches.length === 2) {
        var treebaseStudyID = matches[1];
        return 'Data for this study is archived as <a href="'+ url +'" target="_blank">Treebase study '+ treebaseStudyID +'</a>';
    }
    // TODO: Add other special messages?

    if (urlPattern.test(url) === true) {
        // Default message simply repeats the dataDeposit URL
        return 'Data for this study is permanently archived here:<br/><a href="'+ url +'" target="_blank">'+ url +'</a>';
    }
    // It's not a proper URL! Return the bare value.
    return url;
}

function showCollectionMetadata() {
    // show details in a popup (already bound)
    $('#study-metadata-popup').off('hidden').on('hidden', function () {
        updateStudyRenderedComment();
        nudgeTickler('GENERAL_METADATA');
    });
    $('#study-metadata-popup').modal('show');
}

function showDownloadFormatDetails() {
    // show details in a popup (already bound)
    $('#download-formats-popup').modal('show');
}

function applyCC0Waiver() {
    viewModel.nexml['^xhtml:license'] = {
        '@name': 'CC0',
        '@href': 'http://creativecommons.org/publicdomain/zero/1.0/'
    }
    nudgeTickler('GENERAL_METADATA');
}

function inferSearchContextFromAvailableOTUs() {
    // Fetch the least inclusive context via AJAX, and update the drop-down menu
    var allOTUs = viewModel.elementTypes.otu.gatherAll(viewModel.nexml);
    var namesToSubmit = [ ];
    var maxNamesToSubmit = 5000;  // if more than this, drop extra OTUs evenly
    ///console.log(">> found "+ allOTUs.length +" OTUs in the study");
    var namesToSubmit = $.map(allOTUs, function(otu, index) {
        return ('^ot:ottTaxonName' in otu) ? otu['^ot:ottTaxonName'] : otu['^ot:originalLabel'];
    });
    if (namesToSubmit.length > maxNamesToSubmit) {
        // reduce the list in a distributed fashion (eg, every fourth item)
        var stepSize = maxNamesToSubmit / namesToSubmit.length;
        ///console.log("TOO MANY NAMES, reducing with step-size "+ stepSize);
        // creep to whole numbers, keeping an item every time we increment by one
        var currentStepTotal = 0.0;
        var nextWholeNumber = 1;
        namesToSubmit = namesToSubmit.filter(function(item, index) {
            if ((currentStepTotal += stepSize) >= nextWholeNumber) {
                nextWholeNumber += 1; // bump to next number
                return true;
            }
            return false;
        });
    }
    ///console.log(">> submitting "+ namesToSubmit.length +" OTUs in the study");

    ///showModalScreen("Inferring search context...", {SHOW_BUSY_BAR:true});

    $.ajax({
        type: 'POST',
        dataType: 'json',
        // crossdomain: true,
        contentType: "application/json; charset=utf-8",
        url: getContextForNames_url,
        processData: false,
        data: ('{"names": '+ JSON.stringify(namesToSubmit) +'}'),
        complete: function( jqXHR, textStatus ) {
            // report errors or malformed data, if any
            if (textStatus !== 'success') {
                showErrorMessage('Sorry, there was an error inferring the search context.');
                console.log("ERROR: textStatus !== 'success', but "+ textStatus);
                return;
            }
            ///hideModalScreen();
            ///showSuccessMessage('Collection removed, returning to study list...');
            var result = JSON.parse( jqXHR.responseText );
            var inferredContext = null;
            if (result && 'context_name' in result) {
                inferredContext = result['context_name'];
            }
            ///console.log(">> inferredContext: "+ inferredContext);
            if (inferredContext) {
                // update BOTH search-context drop-down menus to show this result
                $('select[name=taxon-search-context]').val(inferredContext);
                // Tweak the model's OTU mapping, then refresh the UI
                // N.B. We check first to avoid adding an unnecessary unsaved-data warning!
                if (getOTUMappingHints().data.searchContext.$ !== inferredContext) {
                    getOTUMappingHints().data.searchContext.$ = inferredContext;
                    updateMappingHints();
                }
            } else {
                showErrorMessage('Sorry, no search context was inferred.');
            }
        }
    });
}

/* If there's a data-deposit for this study, remind the curator of
 * the importance of adding *only* data that's already in the deposit.
 * (This message should appear just once per session.)
 *
 * NOTE: We're trying a more unobtrusive (static text) reminder for this feature.
 * For now, initialize this flag as true to prevent all popups!
 */
var remindedAboutAddingLateData = true;
function remindAboutAddingLateData(evt) {
    // return true if they don't need this message, false if it should block the caller
    if (remindedAboutAddingLateData) {
        return true;
    }
    var dataDepositURL = $.trim(viewModel.nexml['^ot:dataDeposit']['@href']);
    if (dataDepositURL === '') {
        // the point is moot, there's no clear deposit yet
        return true;
    }
    $('#data-deposit-reminder').html(getDataDepositMessage());
    $('#late-data-reminder').modal('show');
    remindedAboutAddingLateData = true;

    return false;
}

function loadCollectionList(option) {
    // Used for both initial list and refresh (to reflect adding/deleting collections).
    option = option ? option: 'INIT'; // or 'REFRESH'

    var effectiveFilters = {};
    if (option === 'REFRESH') {
        // preserve current filter values
        for (var fName in viewModel.listFilters.COLLECTIONS) {
            effectiveFilters[fName] = ko.unwrap(viewModel.listFilters.COLLECTIONS[fName]);
        }
    } else {
        // use default filter values (defined in main page)
        for (var fName in viewModel.listFilters.COLLECTIONS) {
            effectiveFilters[fName] = listFilterDefaults.COLLECTIONS[fName];
        }
    }

    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: findAllTreeCollections_url,
        data: null,
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

            viewModel.allCollections = data;
            captureDefaultSortOrder(viewModel.allCollections);

            // enable sorting and filtering for lists in the editor
            // UI widgets bound to these variables will trigger the
            // computed display lists below..
            //
            // use default (or preserved) filters, as determined above
            viewModel.listFilters.COLLECTIONS.match( effectiveFilters['match'] );
            viewModel.listFilters.COLLECTIONS.order( effectiveFilters['order'] );
            viewModel.listFilters.COLLECTIONS.filter( effectiveFilters['filter'] );

            // maintain a persistent array to preserve pagination (reset when computed)
            viewModel._filteredCollections = ko.observableArray( ); //.asPaged(20);
            viewModel.filteredCollections = ko.computed(function() {
                // filter raw tree list, returning a
                // new paged observableArray
                //updateClearSearchWidget( '#collection-list-filter', viewModel.listFilters.COLLECTIONS.match );
                //updateListFiltersWithHistory();
                var ticklers = [ viewModel.ticklers.COLLECTIONS_LIST() ];

                /* NOTE that we're not currently using most of the
                 * collection filters below. These were copied from the main
                 * collections page (/curator/collections), but the filter UI
                 * has not been added as this seems like overkill
                 * (and clutter) for what will typically be a short list.
                 */
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
                var currentCollectionID = $('#current-collection-id').val();
                var currentTreeID = $('#current-tree-id').val();

                var filteredList = ko.utils.arrayFilter(
                    viewModel.allCollections,
                    function(collection) {
                        // this basic filter just checks for matching tree+study ids
                        var foundCurrentTree = false;
                        $.each(collection.decisions, function(i, d) {
                            if (d.decision !== 'INCLUDED') {
                                return;
                            }
                            if (d.collectionID === currentStudyID) {
                                if (d.treeID === currentTreeID) {
                                    foundCurrentTree = true;
                                    return false; // stop checking trees
                                }
                            }
                        });
                        return foundCurrentTree;
                    }
/* multi-filter function, based on main collections page (assumes UI for these filters)
                    function(collection) {
                        // match entered text against collections (id, owner, description...)
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
*/
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
                //viewModel._filteredCollections.goToPage(1);
                return viewModel._filteredCollections;
            }); // END of filteredCollections
            nudgeTickler('COLLECTIONS_LIST');
        }
    });
}

function getAssociatedCollectionsCount() {
    // used mainly to supply a display string in the Tree > Collections indicator
    if (viewModel.filteredCollections) {
        return ( viewModel.filteredCollections()().length ).toString();
    }
    // an empty space will collapse (hide) the indicator if we're not ready
    return '';
}

function addTreeToExistingCollection(clicked) {
    if (userIsLoggedIn()) {
        // show the autocomplete widget and mute this button
        var $btn = $(clicked);
        $btn.addClass('disabled');
        var $collectionPrompt = $('#collection-search-form');
        $collectionPrompt.show()
        $collectionPrompt.find('input').eq(0).focus();
    } else {
        if (confirm('This requires login via Github. OK to proceed?')) {
            loginAndReturn();
        }
    }
}
function resetExistingCollectionPrompt() {
    var $collectionPrompt = $('#collection-search-form');
    var $btn = $collectionPrompt.prev('.btn');
    $btn.removeClass('disabled');
    $collectionPrompt.hide();
    $collectionPrompt.find('input').val('');
    $('#collection-search-results').html('');
    $('#collection-search-results').hide();
}

/* More autocomplete behavior for tree-collection search.
 */
clearTimeout(collectionSearchTimeoutID);  // in case there's a lingering search from last page!
var collectionSearchTimeoutID = null;
var collectionSearchDelay = 250; // milliseconds
var hopefulCollectionSearchString = null;
function setCollectionSearchFuse(e) {
    if (collectionSearchTimeoutID) {
        // kill any pending search, apparently we're still typing
        clearTimeout(collectionSearchTimeoutID);
    }
    // reset the timeout for another n milliseconds
    collectionSearchTimeoutID = setTimeout(searchForMatchingCollections, collectionSearchDelay);

    /* If the last key pressed was the ENTER key, stash the current (trimmed)
     * string and auto-jump if it's a valid taxon name.
     */
    if (e.type === 'keyup') {
        switch (e.which) {
            case 13:
                hopefulCollectionSearchString = $('input[name=collection-search]').val().trim();
                // TODO? jumpToExactMatch();  // use existing menu, if found
                break;
            case 17:
                // do nothing (probably a second ENTER key)
                break;
            case 39:
            case 40:
                // down or right arrow should try to tab to first result
                $('#collection-search-results a:eq(0)').focus();
                break;
            default:
                hopefulCollectionSearchString = null;
        }
    } else {
        hopefulCollectionSearchString = null;
    }
}

var showingResultsForCollectionSearchText = '';
function searchForMatchingCollections() {
    // clear any pending search timeout and ID
    clearTimeout(collectionSearchTimeoutID);
    collectionSearchTimeoutID = null;

    var $input = $('input[name=collection-search]');
    var searchText = $input.val().trimLeft();

    if (searchText.length === 0) {
        $('#collection-search-results').html('');
        return false;
    } else if (searchText.length < 2) {
        $('#collection-search-results').html('<li class="disabled"><a><span class="text-error">Enter two or more characters to search</span></a></li>');
        $('#search-results').dropdown('toggle');
        return false;
    }

    // is this unchanged from last time? no need to search again..
    if (searchText == showingResultsForCollectionSearchText) {
        ///console.log("Search text and context UNCHANGED!");
        return false;
    }

    // search local viewModel.allCollections for any matches
    var searchNotAvailable = (!viewModel.allCollections || viewModel.allCollections.length === 0);
    var statusMsg;
    if (searchNotAvailable) {
        // block search (no collection data in the view model)
        statusMsg = 'Unable to search (no collections found)';
    } else {
        // stash our search text to use for later comparison (to avoid redundant searches)
        showingResultsForCollectionSearchText = searchText; // trimmed above
        statusMsg = 'Search in progress...';
    }

    $('#collection-search-results').html('<li class="disabled"><a><span class="text-warning">'
        + statusMsg +'</span></a></li>');
    $('#collection-search-results').show();
    $('#collection-search-results').dropdown('toggle');

    if (searchNotAvailable) {
        return false;
    }

    var matchWithDiacriticals = addDiacriticalVariants(searchText),
        matchPattern = new RegExp( $.trim(matchWithDiacriticals), 'i' ),
        wholeSlugMatchPattern = new RegExp( '^'+ $.trim(matchWithDiacriticals) +'$' );

    var matchingCollections = ko.utils.arrayFilter(
        viewModel.allCollections,
        function(collection) {
            // skip collections that already include this tree
            if ($.inArray(collection, viewModel.filteredCollections()()) !== -1) {
                console.warn("SKIPPING collection that's already listed!");
                return false;
            }
            // match entered text against collections (id, owner, description...)
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
            // skip collections that don't match on any field
            if (!wholeSlugMatchPattern.test(id) && !wholeSlugMatchPattern.test(ownerSlug) && !wholeSlugMatchPattern.test(titleSlug) && !matchPattern.test(name) && !matchPattern.test(description) && !matchPattern.test(creator) && !matchPattern.test(contributors)) {
                return false;
            }
            return true;
        }
    );

    $('#collection-search-results').html('');
    var maxResults = 10;
    var visibleResults = 0;
    if (matchingCollections.length > 0) {
        // show all sorted results, up to our preset maximum
        $.each(matchingCollections, function(i, collection) {
            if (visibleResults >= maxResults) {
                $('#collection-search-results').append(
                    '<li class="disabled"><a><span class="text-warning">'
                      +'Refine your search text to see other results'
                   +'</span></a></li>'
                );
                return false;
            }
            $('#collection-search-results').append(
                '<li>'+ getCollectionViewLink(collection) +'</li>'
            );
            visibleResults++;
        });

        $('#collection-search-results li:not(.disabled) a')
            .click(function(e) {
                var $link = $(this);
                // Override its default onclick behavior to add the tree, then
                // refresh the associated-collections list.
                //
                // hide menu and reset search field
                $('#collection-search-results').html('');
                $('#collection-search-results').hide();
                $('input[name=collection-search]').val('');
                nudgeTickler('COLLECTIONS_LIST');
                // retrieve the collection ID from the link's text
                var itsCollectionID = $link.find('.collection-id').text();
                // insert this tree before opening the editor
                fetchAndShowCollection( itsCollectionID, addCurrentTreeToCollection );
                return false;
            });
        $('#collection-search-results').dropdown('toggle');
    } else {
        $('#collection-search-results').html('<li class="disabled"><a><span class="muted">No results for this search</span></a></li>');
        $('#collection-search-results').dropdown('toggle');
    }

    return false;
}

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

function showMappingOptions() {
    $('#mapping-options-prompt').hide();
    $('#mapping-options-panel').show();
}
function hideMappingOptions() {
    $('#mapping-options-panel').hide();
    $('#mapping-options-prompt').show();
}

/* A few global vars for the add-new-taxa popup */
var candidateOTUsForNewTaxa = [ ];
var currentTaxonCandidate = ko.observable(null);
var sharedParentTaxonID = ko.observable(null);
var sharedParentTaxonName = ko.observable(null);
var sharedTaxonSources = ko.observableArray(); // sets it to an empty array
sharedTaxonSources(null); // force to null (no shared source)

function getSelectedOTUs() {
    /* This includes only visible OTUs, i.e. those in the current filtered and
       paginated set.
     */
    var visibleOTUs = viewModel.filteredOTUs().pagedItems();
    var selectedOTUs = visibleOTUs.filter(function(otu, i) {
        return (otu['selectedForAction']) ? true : false;
    });
    return selectedOTUs;
}
function moveToNthTaxonCandidate( pos ) {
    // look before we leap!
    var testCandidate = candidateOTUsForNewTaxa[ pos ];
    if (!testCandidate) {
        console.error("moveToNthTaxonCandidate("+ pos +") - no such candidate OTU!");
        return;
    }

    if (currentTaxonCandidate()) {
        // report any validation errors in the current candidate (and don't move)
        if (!taxonCondidateIsValid(currentTaxonCandidate(), {REPORT_ERRORS: true})) {
            return;
        }
    }

    // move to the n-th otu
    currentTaxonCandidate(testCandidate);
    // add new-taxon metadata, if not found (stored only during this curation session!)

    if ($stashedTaxonSourceElement === null) {
        // save the template and use the original
        $stashedTaxonSourceElement = $('#active-taxon-sources .taxon-sources')
            .find('.taxon-source').eq(0).clone();
    } else {
        // apply the saved template
        $('#active-taxon-sources .taxon-sources').empty()
                  .append( $stashedTaxonSourceElement.clone() );
    }

    // Bind just the selected candidate to the editing UI
    // NOTE that we must call cleanNode first, to allow "re-binding" with KO.
    var $boundElements = $('#new-taxa-popup').find('.modal-body');
    // Step carefully to avoid un-binding important modal behavior (close widgets, etc)!
    $.each($boundElements, function(i, el) {
        ko.cleanNode(el);
        ko.applyBindings(currentTaxonCandidate, el);
    });
    updateTaxonSourceDetails( );
    bindHelpPanels();
    //updateNewTaxaPopupHeight({MAINTAIN_SCROLL: true});
    // N.B. This is already handled, probably during `updateTaxonSourceDetails()`

    // enable parent-taxon search
    $('input[name=parent-taxon-search]').unbind('keyup change').bind('keyup change', setParentTaxaSearchFuse );
    $('select[name=parent-taxon-search-context]').unbind('change').bind('change', searchForMatchingParentTaxa );

    // don't trigger unrelated form submission when pressing ENTER here
    $('input[name=parent-taxon-search], select[name=parent-taxon-search-context]')
        .unbind('keydown')
        .bind('keydown', function(e) { return e.which !== 13; });
}
function moveToNextTaxonCandidate() {
    var chosenPosition = getCurrentTaxonCandidatePosition();
    if (chosenPosition >= (candidateOTUsForNewTaxa.length - 1)) {
        return; // this will only cause trouble
    }
    moveToNthTaxonCandidate(chosenPosition + 1);
}
function moveToPreviousTaxonCandidate() {
    var chosenPosition = getCurrentTaxonCandidatePosition();
    if (chosenPosition < 1) {
        return; // this will only cause trouble
    }
    moveToNthTaxonCandidate(chosenPosition - 1);
}
/* UNUSED (nudge Knockout bindings instead, if possible)
function refreshCurrentTaxonCandidate() {
    var currentPosition = getCurrentTaxonCandidatePosition();
    moveToNthTaxonCandidate(currentPosition);
}
*/
function getCurrentTaxonCandidatePosition() {
    var chosenPosition = $.inArray(currentTaxonCandidate(), candidateOTUsForNewTaxa);
    return chosenPosition;
}
function clearAllTaxonCandidates() {
    // Clear all vars related to the new-taxa popup
    candidateOTUsForNewTaxa = [ ];
    currentTaxonCandidate(null);
    sharedParentTaxonID(null);
    sharedParentTaxonName(null);
    sharedTaxonSources(null);
}

var $stashedTaxonSourceElement = null;
function showNewTaxaPopup() {
    // Try to incorporate any selected labels.
    //$stashedCollectionViewerTemplate
    var selectedOTUs = getSelectedOTUs();
    // Bail if nothing is selected (must also be visible!)
    if (selectedOTUs.length === 0) {
        showErrorMessage('No labels chosen! Use checkboxes to choose which labels to add as new taxa.');
        return;
    }
    // (Re)build the persistant list of candidates
    candidateOTUsForNewTaxa = selectedOTUs.filter(function(otu, i) {
        return (otu['^ot:ottId']) ? false : true;
    });
    // Warn if some (or all) chosen labels are already mapped!
    hideFooterMessage();
    if (candidateOTUsForNewTaxa.length === 0) {
        showErrorMessage('All chosen labels have already been mapped! Use checkboxes to add more.');
        return;
    }
    var alreadyMapped = selectedOTUs.length - candidateOTUsForNewTaxa.length;
    if (alreadyMapped > 0) {
        showInfoMessage('Only un-mapped labels will be considered (ignoring '+ alreadyMapped +' already mapped)');
    }

    // prepare storage for each selected OTU
    $.each(candidateOTUsForNewTaxa, function(i, candidate) {
        if (!('newTaxonMetadata' in candidate)) {
            var adjustedOTULabel = $.trim(candidate['^ot:altLabel']) ||
                                   $.trim(adjustedLabel(candidate['^ot:originalLabel']));
            candidate.newTaxonMetadata = {
                'rank': 'species',
                'adjustedLabel': adjustedOTULabel,  // as modified by regex or manual edit
                'modifiedName': ko.observable( adjustedOTULabel ),
                'modifiedNameStatus': ko.observable('PENDING'),  // will be tested immediately below
                'modifiedNameReason': ko.observable(''),
                'parentTaxonName': ko.observable(''),  // not sent to server
                'parentTaxonID': ko.observable(0),
                'parentTaxonSearchContext': '',
                'sources': ko.observableArray(),
                'comments': ''
            };
            // add a single source (required)
            addEmptyTaxonSource(candidate.newTaxonMetadata.sources);
        }
    });
    // Now that all candidates have metadata, test all names for dupes
    // N.B. Since names are compared against the other candidates as well as taxonomy,
    // we should ALL of them now, even if they've passed before.
    $.each(candidateOTUsForNewTaxa, function(i, candidate) {
        updateTaxonNameCheck( candidate );
    });

    moveToNthTaxonCandidate( 0 );

    // Trigger smart resize each time the window opens
    $('#new-taxa-popup').off('shown').on('shown', function () {
        updateNewTaxaPopupHeight();
    });
    // Block any method of closing this window if there is unsaved work
    $('#new-taxa-popup').off('hide').on('hide', function () {
        if (currentTaxonCandidate() || candidateOTUsForNewTaxa.length > 0) {
            alert("Please submit (or cancel) your proposed taxa!");
            return false;
        }
    });
    // Show and initialize the popup
    $('#new-taxa-popup').modal('show');
}
function hideNewTaxaPopup() {
    clearAllTaxonCandidates();
    $('#new-taxa-popup').modal('hide');
}

function getActiveParentTaxonID(candidate) {
    // return the *observable* property (shared or local)
    var activeID = sharedParentTaxonID() ?
            sharedParentTaxonID :
            candidate.newTaxonMetadata.parentTaxonID;
    return activeID;
}
function getActiveParentTaxonName(candidate) {
    // return the *observable* property (shared or local)
    var activeName = sharedParentTaxonName() ?
            sharedParentTaxonName :
            candidate.newTaxonMetadata.parentTaxonName;
    return activeName;
}

function getActiveTaxonSources(candidate) {
    // return the *observable* property (shared or local)
    var activeSources = sharedTaxonSources() ?
            sharedTaxonSources :
            candidate.newTaxonMetadata.sources;
    return activeSources;
}

function submitNewTaxa() {
    // Bundle all new (proposed) taxon info, submit to OTT, report on results
    // clone the taxa information (recursive or "deep" clone)
    //var bundle = $.extend(tree, [ ], candidateOTUsForNewTaxa);
    //var bundle = candidateOTUsForNewTaxa.concat(); 
    // unwrap any KO observables within
    var bundle = {
        "user_agent": "opentree-curation-webapp",
        "date_created": new Date().toISOString(),
        "taxa": [ ],
        "study_id": studyID,
        "curator": {
            'name': userDisplayName, 
            'login': userLogin, 
            'email': userEmail
        },
        "new_ottids_required": candidateOTUsForNewTaxa.length
    };

    $.each(candidateOTUsForNewTaxa, function(i, candidate) {
        // repackage its metadata to match the web service
        var newTaxon = {};
        newTaxon['tag'] = candidate['@id'];  // used to match results with candidate OTUs
        newTaxon['original_label'] = $.trim(candidate['^ot:originalLabel']);
        newTaxon['adjusted_label'] = candidate.newTaxonMetadata.adjustedLabel;
        newTaxon['name'] = candidate.newTaxonMetadata.modifiedName();
        newTaxon['name_derivation'] = candidate.newTaxonMetadata.modifiedNameReason() || "No change to original label";
        newTaxon['rank'] = candidate.newTaxonMetadata.rank.toLowerCase();
        /* Use shared parent taxon, if any. */
        newTaxon['parent'] = getActiveParentTaxonID(candidate)();
        /* Include all valid sources for this candidate. If curator is sharing
         * one taxon's sources, ignore any saved as a convenience for the curator.
         */
        var activeSources = getActiveTaxonSources(candidate);
        newTaxon['sources'] = [ ];
        $.each( activeSources(), function(i, source) {
            if (!source.type) {
                // Ignore sources with no selected type (null, undefined, '')
                return;
            }
            var srcInfo = {
                'source_type': source.type,
                'source': null
            };
            /* Some source types should supress any value that was kept as a
             * convenience for the curator.
             */
            switch( source.type ) {
                case 'The taxon is described in this study':
                    srcInfo['source'] = null;
                default:
                    srcInfo['source'] = source.value;
            }
            newTaxon['sources'].push(srcInfo);
        });
        newTaxon['comment'] = candidate.newTaxonMetadata.comments;
        bundle.taxa.push(newTaxon);
    });

    // add non-JSON values to the query string
    var qsVars = $.param({
        author_name: userDisplayName,
        author_email: userEmail,
        //starting_commit_SHA: collection.sha,
        //commit_msg: commitMessage,
        auth_token: userAuthToken
    });
    $.ajax({
        url: API_create_amendment_POST_url +'?'+ qsVars,
        type: 'POST',
        dataType: 'json',
        processData: false,
        data: JSON.stringify(bundle),
        // crossdomain: true,
        contentType: "application/json; charset=utf-8",
        complete: returnFromNewTaxaSubmission
    });
}
function returnFromNewTaxaSubmission( jqXHR, textStatus ) {
    console.log('returnFromNewTaxaSubmission(), textStatus = '+ textStatus);
    // report errors or malformed data, if any
    var badResponse = false;
    var responseJSON = null;
    if (textStatus !== 'success') {
        badResponse = true;
    } else {
        // convert raw response to JSON
        responseJSON = $.parseJSON(jqXHR.responseText);
        if (responseJSON['error'] === 1) {
            badResponse = true;
        }
    }

    if (badResponse) {
        console.warn("jqXHR.status: "+ jqXHR.status);
        console.warn("jqXHR.responseText: "+ jqXHR.responseText);
        hideModalScreen();
        // TODO: handle any resulting mess
        showErrorMessage(
            'Sorry, there was an error adding the requested taxa. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">' +
            'Show details</a><pre class="error-details" style="display: none;">'+ jqXHR.responseText +'</pre>'
        );
        return;
    }

    // Apply the newly minted OTT ids to the original OTUs
    var tagsToOTTids = responseJSON['tag_to_ottid'];
    if (!$.isPlainObject(tagsToOTTids)) {
        hideModalScreen();
        showErrorMessage(
            'Sorry, no data was returned mapping OTT ids to OTUs! <a href="#" onclick="toggleFlashErrorDetails(this); return false;">' +
            'Show details</a><pre class="error-details" style="display: none;">'+ jqXHR.responseText +'</pre>'
        );
        return;
    }

    $.each(candidateOTUsForNewTaxa, function(i, candidate) {
        // REMINDER: we used the ID of each OTU as its tag!
        var OTUid = candidate['@id'];
        var mintedOTTid = Number(tagsToOTTids[ OTUid ]);
        // N.B. we convert back from the server's preferred String tags
        var mappingInfo = {
             "name" : candidate.newTaxonMetadata.modifiedName(),
             "ottId" : mintedOTTid
        };
        mapOTUToTaxon( OTUid, mappingInfo );
        delete proposedOTUMappings()[ OTUid ];
    });
    proposedOTUMappings.valueHasMutated();
    nudgeTickler('OTU_MAPPING_HINTS');

    // invalidate any prior cached TNRS responses, since results might now change
    clearTNRSCache();

    hideModalScreen(); // TODO?
    hideNewTaxaPopup();
    showSuccessMessage('Selected OTUs mapped to new taxa.');
}

function toggleSharedParentID( otu, event ) {
    // Set a global for this (an observable, to update display).
    // NOTE that radio-button values are strings, so we convert to boolean below!
    var sharingThisParentID = $(event.target).is(':checked');
    if (sharingThisParentID) {
        sharedParentTaxonID(currentTaxonCandidate().newTaxonMetadata.parentTaxonID());
        sharedParentTaxonName(currentTaxonCandidate().newTaxonMetadata.parentTaxonName());
        // clobber any pending search text in the field (to avoid confusion)
        $('input[name=parent-taxon-search]').val("");
    } else {
        sharedParentTaxonID(null);
        sharedParentTaxonName(null);
    }
    return true;
}
function toggleSharedSources( otu, event ) {
    // Set a global for this (an observable, to update display).
    // NOTE that radio-button values are strings, so we convert to boolean below!
    var sharingTheseSources = $(event.target).is(':checked');
    if (sharingTheseSources) {
        sharedTaxonSources(currentTaxonCandidate().newTaxonMetadata.sources());
    } else {
        sharedTaxonSources(null);
    }
    updateTaxonSourceDetails();
    return true;
}

/* Modified autocomplete behavior for parent-taxon search (used when proposing
 * new taxa for the OT taxonomy). See 'searchTimeoutID' etc. above for the
 * general taxon search.
 */
clearTimeout(parentSearchTimeoutID);  // in case there's a lingering search from last page!
var parentSearchTimeoutID = null;
// var searchDelay = 1000; // shared with general behavior above
var hopefulParentSearchName = null;
function setParentTaxaSearchFuse(e) {
    if (parentSearchTimeoutID) {
        // kill any pending search, apparently we're still typing
        clearTimeout(parentSearchTimeoutID);
    }
    // reset the timeout for another n milliseconds
    parentSearchTimeoutID = setTimeout(searchForMatchingParentTaxa, searchDelay);

    /* If the last key pressed was the ENTER key, stash the current (trimmed)
     * string and auto-jump if it's a valid taxon name.
     */
    if (e.type === 'keyup') {
        switch (e.which) {
            case 13:
                hopefulParentSearchName = $('input[name=parent-taxon-search]').val().trim();
                autoApplyExactParentMatch();  // use existing menu, if found
                break;
            case 17:
                // do nothing (probably a second ENTER key)
                break;
            case 39:
            case 40:
                // down or right arrows should try to select first result
                $('#parent-taxon-search-results a:eq(0)').focus();
                break;
            default:
                hopefulParentSearchName = null;
        }
    } else {
        hopefulParentSearchName = null;
    }
}

var showingResultsForParentSearchText = '';
var showingResultsForParentSearchContextName = '';
function searchForMatchingParentTaxa() {
    // clear any pending search timeout and ID
    clearTimeout(parentSearchTimeoutID);
    parentSearchTimeoutID = null;

    var $input = $('input[name=parent-taxon-search]');
    var searchText = $input.val().trimLeft();

    if (searchText.length === 0) {
        $('#parent-taxon-search-results').html('');
        return false;
    } else if (searchText.length < 2) {
        $('#parent-taxon-search-results').html('<li class="disabled"><a><span class="text-error">Enter two or more characters to search</span></a></li>');
        $('#parent-taxon-search-results').dropdown('toggle');
        return false;
    }

    // groom trimmed text based on our search rules
    var searchContextName = $('select[name=parent-taxon-search-context]').val();

    // is this unchanged from last time? no need to search again..
    if ((searchText == showingResultsForParentSearchText) && (searchContextName == showingResultsForParentSearchContextName)) {
        ///console.log("Search text and context UNCHANGED!");
        return false;
    }

    // stash these to use for later comparison (to avoid redundant searches)
    var queryText = searchText; // trimmed above
    var queryContextName = searchContextName;
    $('#parent-taxon-search-results').html('<li class="disabled"><a><span class="text-warning">Search in progress...</span></a></li>');
    $('#parent-taxon-search-results').show();
    $('#parent-taxon-search-results').dropdown('toggle');

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
            showingResultsForParentSearchText = queryText;
            showingResultsForParentSearchContextName = queryContextName;

            $('#parent-taxon-search-results').html('');
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
                        $('#parent-taxon-search-results').append(
                            '<li><a href="'+ matchingID +'">'+ matchingName +'</a></li>'
                        );
                        matchingNodeIDs.push(matchingID);
                        visibleResults++;
                    }
                }

                $('#parent-taxon-search-results a')
                    .click(function(e) {
                        var $link = $(this);

                        // Modify this candidate taxon (and indicator)
                        currentTaxonCandidate().newTaxonMetadata.parentTaxonName($link.text());
                        var numericID = Number($link.attr('href'));
                        currentTaxonCandidate().newTaxonMetadata.parentTaxonID( numericID );

                        // hide menu and reset search field
                        $('#parent-taxon-search-results').html('');
                        $('#parent-taxon-search-results').hide();
                        $('input[name=parent-taxon-search]').val('');
                        //nudgeTickler('GENERAL_METADATA');
                    });
                $('#parent-taxon-search-results').dropdown('toggle');

                autoApplyExactParentMatch();
            } else {
                $('#parent-taxon-search-results').html('<li class="disabled"><a><span class="muted">No results for this search</span></a></li>');
                $('#parent-taxon-search-results').dropdown('toggle');
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
                    $('#parent-taxon-search-results').html('<li class="disabled"><a><span style="color: #933;">'+ errMsg +'</span></a></li>');
                    var errDetails = 'TNRS error details:<pre class="error-details">'+ jqXHR.responseText +'</pre>';
                    $('#parent-taxon-search-results').find('span.detail-toggle').click(function(e) {
                        e.preventDefault();
                        showErrorMessage(errDetails);
                        return false;
                    });
                    $('#parent-taxon-search-results').dropdown('toggle');
                }
            }
            return;
        }
    });

    return false;
}

function autoApplyExactParentMatch() {
    // if the user hit the ENTER key, and there's an exact match, apply it automatically
    if (hopefulParentSearchName) {
        $('#parent-taxon-search-results a').each(function() {
            var $link = $(this);
            if ($link.text().toLowerCase() === hopefulParentSearchName.toLowerCase()) {
                $link.trigger('click');
                return false;
            }
        });
    }
}

function disableRankDivider(option, item) {
    // disable the divider option in this menu
    if (item.indexOf('─') === 0) {  // Unicode box character!
        ko.applyBindingsToNode(option, {disable: true}, 'FOO');
    }
}

function updateActiveTaxonSources() {
    // trigger validation, updates to next/previous buttons
    coerceTaxonSourceDOIsToURLs();
    currentTaxonCandidate.valueHasMutated();
    updateTaxonSourceDetails();
    updateTaxonSourceTypeOptions();
    taxonCondidateIsValid(currentTaxonCandidate());
}

function coerceTaxonSourceDOIsToURLs() {
    var activeSources = getActiveTaxonSources(currentTaxonCandidate());
    $.each(activeSources(), function(i, source) {
        switch( source.type ) {
            case undefined:
            case '':
            case 'The taxon is described in this study':
            case 'Other':
                break;
            default:
                // its value should be a valid URL (convert simple DOIs)
                source.value = DOItoURL( source.value );
                activeSources.replace(source, source);
                break;
        }
    });
}

function updateTaxonSourceDetails( ) {
    var activeSources = getActiveTaxonSources(currentTaxonCandidate());
    $.each(activeSources(), function(i, source) {
        var $details = $('#new-taxa-popup .taxon-source:eq('+i+') .source-details')
        switch( source.type ) {
            case undefined:
            case '':
            case 'The taxon is described in this study':
                $details.hide();
                break;
            default:
                // show free-form text field with appropriate placeholder text
                if (source.type === 'Other') {
                    $details.attr('placeholder', "Describe or link to this source");
                } else {
                    $details.attr('placeholder', "Enter DOI or URL");
                }
                $details.show();
                break;
        }
    });
    updateNewTaxaPopupHeight({MAINTAIN_SCROLL: true});
}

function updateTaxonSourceTypeOptions() {
    // Disable 'this study' option for active sources, if it's already selected
    // (but don't disable the currently selected option).
    var activeSources = getActiveTaxonSources(currentTaxonCandidate());
    var currentStudyFound = false;
    $.each(activeSources(), function(i, source) {
        if (source.type === 'The taxon is described in this study') {
            currentStudyFound = true;
        }
    });
    var $sourceTypeOptions = $('#new-taxa-popup .source-type option');
    $sourceTypeOptions.each(function(i, option) {
        var $option = $(option);
        if ($option.val() === 'The taxon is described in this study') {
            // This study has already been listed as a source!
            if (currentStudyFound && (!$option.is(':selected'))) {
                $option.attr('disabled', 'disabled');
            } else {
                $option.removeAttr('disabled');
            }
        }
    });
}
function addEmptyTaxonSource( sourceList ) {
    // N.B. We should always apply this to an observableArray, so that the
    // UI will update automatically.
    if (!ko.isObservable(sourceList)) {
        sourceList = getActiveTaxonSources(currentTaxonCandidate());
    }
    sourceList.push({
        'type': null,
        'value': null
    });
    updateNewTaxaPopupHeight({MAINTAIN_SCROLL: true});
}
function removeTaxonSource( sourceList, item ) {
    // N.B. We should always apply this to an observableArray, so that the
    // UI will update automatically.
    if (!ko.isObservable(sourceList)) {
        sourceList = getActiveTaxonSources(currentTaxonCandidate());
    }
    sourceList.remove(item);
    updateNewTaxaPopupHeight({MAINTAIN_SCROLL: true});
}

function updateNewTaxaPopupHeight(options) {
    /* Revisit height and placement of the new-taxon submission tool. If the
     * list of sources is long enough, we should take the full height of the
     * window, with all non-list UI available and any scrollbars restricted to
     * the list area.
     */
    options = options || {};
    var $popup = $('#new-taxa-popup');
    // let the rounded top and bottom edges of the popup leave the page
    var outOfBoundsHeight = 8;  // px each on top and bottom
    // leave room at the bottom for error messages, etc.
    var footerMessageHeight = 40;
    var currentWindowHeight = $(window).height();
    var maxPopupHeight = (currentWindowHeight + (outOfBoundsHeight*2) - footerMessageHeight);
    var $listHolder = $popup.find('.modal-body');
    var currentListScrollPosition = $listHolder.scrollTop();
    // NOTE that MAINTAIN_SCROLL may only gives good results if this is called
    // directly, vs. as part of a full update...
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
    if ($('#new-taxa-popup').is(':visible')) {
        updateNewTaxaPopupHeight({MAINTAIN_SCROLL: true});
    }
});

function taxonCondidateIsValid( candidate, options ) {
    // Check for essential fields, taking shared info into account
    if (!options) options = {REPORT_ERRORS: false};
    var metadata = candidate.newTaxonMetadata;
    var requiredProperties = {  // non-empty
        'modifiedName': "Modified name must be a non-empty string",
        'parentTaxonID': "Please specify the parent taxon for this label",
        'rank': "Please specify a taxonomic rank (or 'no rank')"
    };
    if (!newTaxonNameMatchesOriginalLabel(candidate)) {
        requiredProperties['modifiedNameReason'] = "Please explain why you modified the taxon's original label.";
    }
    var missingProperty = null;
    for (var propName in requiredProperties) {
        var itsValue;
        switch(propName) {
            // in some cases, check the shared property instead
            case 'parentTaxonID':
                itsValue = sharedParentTaxonID() || ko.unwrap(metadata.parentTaxonID);
                break;
            default:
                itsValue = ko.unwrap(metadata[ propName ]);
        }
        if (!itsValue) {
            missingProperty = propName;
            break;  // report the first missing property
        }
    }
    if (missingProperty) {
        // return a hint of what's missing? show an error here?
        // use the error messages defined above for each field
        if (options.REPORT_ERRORS) {
            showErrorMessage( requiredProperties[missingProperty] );
        }
        return false;
    }
    // have we confirmed that the proposed taxon name is not already found?
    switch( metadata.modifiedNameStatus() ) {
        case 'PENDING':
            // quietly block validation; tests results should refresh this
            ///console.warn("Blocking validation based on PENDING name test...");
            return false;
        case 'FOUND IN CANDIDATES':
            if (options.REPORT_ERRORS) {
                showErrorMessage('There is another candidate taxon with this name! Proposed taxon names must be unique.');
            }
            return false;
        case 'FOUND IN TAXONOMY':
            if (options.REPORT_ERRORS) {
                showErrorMessage('There is already a taxon with this name! Homonyms are not currently allowed.');
            }
            return false;
        case 'NOT FOUND':
            // it's a unique name! no problem here
            break;
        default:
            console.error('Unexpected value found for modifiedNameStatus! ['+ ko.unwrap(metadata.modifiedNameStatus) +']');
    }

    // Check for at least one valid source (possibly shared)
    var validSourceFound = false;
    var activeSources = ko.unwrap(getActiveTaxonSources(candidate));
    $.each(activeSources, function(i, source) {
        // validation details depend on source type
        switch(source.type) {
            case '':
            case null:
            case undefined:
                // No source type specified; step to the next one
                return;
            case 'The taxon is described in this study':
                // No further description needed in value field
                validSourceFound = true;
                return;
            default:
                // look for a non-empty value (at least 4 characters)
                if (source.value && (source.value.length > 3)) {
                    validSourceFound = true;
                }
                return;
        }
    });
    if (!validSourceFound) {
        if (options.REPORT_ERRORS) {
            showErrorMessage( "Candidate has no valid sources!" );
        }
        return false;
    }
    hideFooterMessage();
    return true;
}

function allTaxonCandidatesAreValid(options) {
    if (!options) options = {REPORT_ERRORS: false};
    var invalidCandidateFound = false;
    $.each(candidateOTUsForNewTaxa, function(i, candidate) {
        if (!taxonCondidateIsValid( candidate )) {
            invalidCandidateFound = true;
            return false;
        }
    });
    if (invalidCandidateFound && options.REPORT_ERRORS) {
        showErrorMessage("Please review all labels for required data!");
    }
    return !(invalidCandidateFound);
}

var prevTaxonCandidateAllowed = ko.computed(function() {
    if (!currentTaxonCandidate()) return false;
    return taxonCondidateIsValid(currentTaxonCandidate()) && (getCurrentTaxonCandidatePosition() > 0);
});
var nextTaxonCandidateAllowed = ko.computed(function() {
    if (!currentTaxonCandidate()) return false;
    return taxonCondidateIsValid(currentTaxonCandidate()) && (getCurrentTaxonCandidatePosition() < (candidateOTUsForNewTaxa.length - 1));
});

function newTaxonNameMatchesOriginalLabel(candidate) {
    var c = candidate || currentTaxonCandidate();
    if (!c) return false;
    return $.trim(c.newTaxonMetadata.modifiedName()) === $.trim(c['^ot:originalLabel']);
}
var currentTaxonUsesOriginalLabel = ko.computed(function() {
    // computed wrapper for fast binding
    return newTaxonNameMatchesOriginalLabel( currentTaxonCandidate() );
});

function useOriginalLabelForNewTaxon(candidate) {
    // overwrite the new-taxon name with the original, and clear any reason for renaming
    candidate.newTaxonMetadata.modifiedName( candidate['^ot:originalLabel'] );
    candidate.newTaxonMetadata.modifiedNameReason(null);
}

function updateTaxonNameCheck(candidate) {
    // report status of last check, or initiate a new check
    if (!candidate) return false;
    ///console.log('updateTaxonNameCheck() STARTING...');
    var testName = candidate.newTaxonMetadata.modifiedName();
    ///console.log('>> test name is '+ testName);
    ///console.log('>> previous status is '+ candidate.newTaxonMetadata.modifiedNameStatus());
    // check first against other proposed names
    var duplicateNameFound = false;
    $.each(candidateOTUsForNewTaxa, function(i, compareCandidate) {
        if (compareCandidate === candidate) {
            return true; // don't compare to itself! skips to next
        }
        var compareName = compareCandidate.newTaxonMetadata.modifiedName();
        if ($.trim(testName) === $.trim(compareName)) {
            duplicateNameFound = true;
            candidate.newTaxonMetadata.modifiedNameStatus('FOUND IN CANDIDATES');
            return false;
        }
    });
    if (!duplicateNameFound) {
        // keep checking, this time against the OT taxonomy
        candidate.newTaxonMetadata.modifiedNameStatus('PENDING');
        $.ajax({
            url: doTNRSForMappingOTUs_url,  // NOTE that actual server-side method name might be quite different!
            type: 'POST',
            dataType: 'json',
            data: JSON.stringify({
                "names": [testName],
                "include_suppressed": true,
                "do_approximate_matching": false,
                "context_name": 'All life',
            }),
            crossDomain: true,
            contentType: "application/json; charset=utf-8",
            error: function(jqXHR, textStatus, errorThrown) {
                console.log("!!! something went terribly wrong");
                console.log(jqXHR.responseText);
                showErrorMessage("Something went wrong in taxomachine:\n"+ jqXHR.responseText);
            },
            success: function(data) {    // JSONP callback
                // Check for duplicates
                var resultSetsFound = (data && ('results' in data) && (data.results.length > 0));
                var candidateMatches = [ ];
                // Check for expected result sets (preliminary to individual matches below)
                if (resultSetsFound) {
                    switch (data.results.length) {
                        case 0:
                            ///console.warn('NO SEARCH RESULT SETS FOUND! UNABLE TO CONFIRM DUPLICATE NAMES.');
                            return;
                        case 1:
                            // the expected case
                            candidateMatches = data.results[0].matches;
                            break;

                        default:
                            // ASSUME the first result set has what we need
                            ///console.warn('MULTIPLE SEARCH RESULT SETS (USING FIRST)');
                            ///console.warn(data['results']);
                            candidateMatches = data.results[0].matches;
                    }
                }
                // Check for one or more identical names
                var duplicateNameFound = false;
                $.each(candidateMatches, function(i, match) {
                    // convert to expected structure for proposed mappings
                    var foundName = (match.taxon['unique_name'] || match.taxon['name'])
                    ///console.log('>>> found ['+ foundName +']...');
                    if (!match.is_approximate_match) {
                        duplicateNameFound = true;
                        return false;  // stop checking names
                    }
                });
                if (duplicateNameFound) {
                    ///console.log('>> EXACT MATCH FOUND!');
                    candidate.newTaxonMetadata.modifiedNameStatus('FOUND IN TAXONOMY');
                } else {
                    ///console.log('>> NO EXACT MATCH');
                    candidate.newTaxonMetadata.modifiedNameStatus('NOT FOUND');
                }
            }
        });
    }
    // N.B. We should always return true, for moving directly from this field to Next/Prev/Submit
    return true;
}

function proposedTaxonNameStatusMessage(candidate) {
    if (!candidate) return "?";
    switch(candidate.newTaxonMetadata.modifiedNameStatus()) {
        case 'PENDING':
            return "...";
        case 'NOT FOUND':
            return "No duplicates found.";
        case 'FOUND IN TAXONOMY':
            return "Already in OT taxonomy!";
        case 'FOUND IN CANDIDATES':
            return "Already in proposed taxa!";
        default:
            return candidate.newTaxonMetadata.modifiedNameStatus();
    }
}
function proposedTaxonNameStatusColor(candidate) {
    if (!candidate) return "?";
    switch(candidate.newTaxonMetadata.modifiedNameStatus()) {
        case 'PENDING':
            return 'silver';
        case 'NOT FOUND':
            return 'green';
        case 'FOUND IN TAXONOMY':
            return 'orange';
        case 'FOUND IN CANDIDATES':
            return 'orange';
        default:
            return 'purple';
    }
}

function updateSaveTreeViewLink() {
    /* This is done on mouseover, so that clicking the link will save
     * the current tree view as an SVG file. Very loosely adapted from
     * <http://stackoverflow.com/a/4228053>
     */
    // Update the link to use current SVG
    var $treeViewer = $('#tree-viewer');
    var $treeStylesheet = $('#tree-view-style');
    var $treeSVG = $treeViewer.find('#tree-phylogram svg');
    var $treeTitle = $treeViewer.find('#tree-title');
    var treeName = $treeTitle.find('span').text();
    var fileName = slugify( treeName ) +'.svg';

    // confirm SVG has needed attributes (missing in Firefox)
    var svgUrl = "http://www.w3.org/2000/svg";
    $treeSVG.attr({ version: '1.1' , xmlns: svgUrl});

    // confirm SVG has our CSS styles for the tree view (or add them now)
    if ($treeSVG.find('style').length === 0) {
        // copy the main page's tree-view stylesheet exactly
        // N.B. putting it where even Inkscape can find it :-/
        var stylesheetHTML = $treeStylesheet[0].outerHTML;
        /* Inkscape is picky about `svg:style` vs. `xhtml:style`!
         * jQuery's $.prepend() implicitly creates a DOM element from our HTML, and
         * that element is always from the xhtml namespace. We need to use an
         * alternative, explicit method to create an `svg:style` element.
        */
        var svgHolder = document.createElementNS(svgUrl, "svg");
        svgHolder.innerHTML = stylesheetHTML;  // N.B. this inherits the parent's namespace!
        $treeSVG.prepend( svgHolder.firstChild );
    }

    // Serialize the main SVG node (converting HTML entities to Unicode); first, we
    // create a temporary XML document
    var serializer = new XMLSerializer();
    var tempXMLDoc = document.implementation.createDocument(
        "http://www.w3.org/2000/svg",   // desired namespace, or null
        "svg",  // name of top-level element
        null    // desired doctype, or null
    )
    // replace its boring top-level element with our SVG
    // (cloned from the original, else it disappears!)
    var htmlNode = $treeSVG.clone()[0];
    tempXMLDoc.documentElement.replaceWith(htmlNode);
    var xmlNode = tempXMLDoc.documentElement;
    var svgString = serializer.serializeToString(xmlNode);

    /* Alternate implmentation (fails in Safari)
    var serializer = new XMLSerializer();
    var node = $treeSVG[0];
    var svgString = serializer.serializeToString(node);
    // Safari may still fail to convert HTML entities :-/
    svgString = svgString.replace(/&nbsp;/gi,'&#160;');
    */

    // encode it for safe use in a data URI
    var base64src = b64EncodeUnicode(svgString);

    var $saveLink = $('#save-tree-view');
    $saveLink.attr('href', 'data:image/svg+xml;base64,\n'+ base64src);
    $saveLink.attr('download', fileName);
}

function b64EncodeUnicode(str) {
    /* Safe encoding for Unicode text, from
     *  <https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#The_.22Unicode_Problem.22>
     */
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
    }));
}

function printCurrentTreeView() {
    /* Print the current tree, sized to fit within a single vertical page
     * (since Firefox has limited print support for SVG).
     */
    var $treeViewer = $('#tree-viewer');
    var $treeSVG = $treeViewer.find('#tree-phylogram svg');
    var $treeTitle = $treeViewer.find('#tree-title');

    // set a temporary title (becomes the default filename for a saved PDF)
    var oldTitle = window.document.title;
    var treeName = $treeTitle.find('span').text();
    window.document.title = slugify( treeName );

    // move printing elements to the foreground
    var $svgHolder = $treeSVG.parent();
    var $titleHolder = $treeTitle.parent();
    var $pageBody = $('body');
    $pageBody.append( $treeSVG );
    $pageBody.append( $treeTitle );

    // adjust SVG viewport (esp. for Firefox, Chrome doesn't need this)
    // NOTE that we need to use el.setAttribute to keep mixed-case attribute names!
    var treeSVG = $treeSVG[0];
    var oldSVGWidth = treeSVG.getAttribute('width');
    var oldSVGHeight = treeSVG.getAttribute('height');
    var oldSVGViewBox = treeSVG.getAttribute('viewBox');
    treeSVG.setAttribute('width', "8in");
    treeSVG.setAttribute('height', "10in");
    treeSVG.setAttribute('viewBox', "0 0 "+ oldSVGWidth +" "+ oldSVGHeight);

    // adjust bg and positioning just for print, then undo
    $pageBody.addClass('printing-tree-view');
    window.print();
    $pageBody.removeClass('printing-tree-view');

    // restore SVG viewport for normal use
    treeSVG.setAttribute('width', oldSVGWidth);
    treeSVG.setAttribute('height', oldSVGHeight);
    if (oldSVGViewBox) {  // skip if null
        treeSVG.setAttribute('viewBox', oldSVGViewBox);
    }

    // put the printed elements back in place
    $svgHolder.append( $treeSVG );
    $treeTitle.insertBefore( $titleHolder.find('ul.nav-tabs') );

    // restore the normal doc title
    window.document.title = oldTitle;
}

function getUnusedOTUs() {
    // return a list of OTUs that are not used in any tree
    var allTrees = viewModel.elementTypes.tree.gatherAll(viewModel.nexml);
    // start with all OTUs in the study, then whittle them down
    var unusedOTUs = viewModel.elementTypes.otu.gatherAll(viewModel.nexml);
    // var otu = getOTUByID( otu );
    console.log("BEFORE - ALL OTUs: "+ unusedOTUs.length);
    $.each( allTrees, function(i, tree) {
        // check this tree's nodes for this OTU id
        $.each( tree.node, function( i, node ) {
            if (node['@otu']) {
                var otu = getOTUByID( node['@otu'] );
                if ($.inArray(otu, unusedOTUs) !== -1) {
                    removeFromArray( otu, unusedOTUs );
                }
            }
        });
    });
    console.log("AFTER - UNUSED OTUs: "+ unusedOTUs.length);
    return unusedOTUs;
}

function purgeUnusedOTUs() {
    // remove each unused OTU from its parent OTUs collection
    $.each( getUnusedOTUs(), function(i, otu) {
        console.log("REMOVING AN UNUSED OTU!");
        console.log(otu);
        $.each(viewModel.nexml.otus, function(i, otusCollection) {
            if ($.inArray(otu, otusCollection.otu) !== -1) {
                removeFromArray( otu, otusCollection.otu );
            }
        });
    });

    // TODO: remove any empty OTUs-collections?
    // TODO: remove related annotation events and agents?

    // force rebuild of all tree-related lookups
    buildFastLookup('OTUS_BY_ID');

    console.log("AFTER - ALL OTUs: "+ viewModel.elementTypes.otu.gatherAll(viewModel.nexml).length);

    // force update of curation UI in all relevant areas
    nudgeTickler('OTU_MAPPING_HINTS');
    nudgeTickler('STUDY_HAS_CHANGED');
}
