/*
@licstart  The following is the entire license notice for the JavaScript code in this page.

    Copyright (c) 2013, Jim Allman
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
 * Client-side behavior for the Open Tree curation UI
 *
 * This uses the Open Tree API to fetch and store studies and trees remotely.
 */

// these variables should already be defined in the main HTML page
var studyID;
var latestSynthesisSHA;   // the SHA for this study (if any) that was last used in synthesis
var API_load_study_GET_url;
var API_update_study_PUT_url;
var API_remove_study_DELETE_url;
var viewOrEdit;
var API_create_file_POST_url;
var API_load_file_GET_url;
var API_update_file_PUT_url;
var API_remove_file_DELETE_url;

// working space for parsed JSON objects (incl. sub-objects)
var viewModel;

var tagsOptions = {
    confirmKeys: [13, 9],  // ENTER, TAB for next tag
    allowDuplicates: false,  // default, but added here for clarity
    // using simple objects-as-tags, to avoid bugs with string + SELECT
    itemValue: 'attrValue',
    itemText: 'displayString',
    typeahead: {
        //source: ['eenie', 'meanie', 'minie', 'moe']
        /*
        source: function(query) {
            return $.get('/oti/existing_tags');  // TODO
        }
        */
    }
};
function captureTagTextOnBlur( $tagsSelect ) {
    /* Add any "loose" text in a tags widget as a new tag, e.g., if someone
     * types a word and immediately tries to save the study. Adapted from this
     * pull request by https://github.com/kubanka-peter:
     *   https://github.com/TimSchlechter/bootstrap-tagsinput/pull/99
     */
    $tagsSelect.tagsinput('input').on('blur', function(event){
        var $input = $(event.target);
        var $select = $input.closest('.bootstrap-tagsinput').prev('select');
        if ($select.length === 0) {
            console.warn("captureTagTextOnBlur(): No SELECT widget found!");
        } else {
            var inputText = $.trim( $input.val() );
            // reject whitespace-only tags!
            if (inputText !== '') {
                var tagInfo = makeTagObjFromString(inputText);
                $select.tagsinput('add', tagInfo);
            }
            $input.val('');
        }
    });
}
function makeTagObjFromString( tagString ) {
    // groom string value, and make it safe for HTML attributes
    if (typeof tagString !== 'string') {
        tagString = tagString.toString();
    }
    var displayString = $.trim(tagString);
    var attrValue = encodeURIComponent(displayString);
    var tagInfo = {
        displayString: displayString,
        attrValue: attrValue
    };
    return tagInfo;
}

/* Use history plugin to track moves from tab to tab, single-tree popup, others? */

var listFilterDefaults; // defined in main page, for a clean initial state

if ( History && History.enabled ) {

    var handleChangingState = function() {
        if (!viewModel) {
            // try again soon (waiting for a study to load)
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
        var activeFilter = null;
        var filterDefaults = null;

        if (currentTab) {
            goToTab( currentTab );
            switch(slugify(currentTab)) {
                case 'trees':
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
                showTreeViewer(tree);
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
                'tab': 'Trees',
                'tree': tree['@id']
            }
        );
        History.pushState( newState, (window.document.title), ('?tab=trees&tree='+ newState.tree) );
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
                'tab': 'Trees',
                'tree': null
            }
        );
        History.pushState( newState, (window.document.title), '?tab=trees' );
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
        // N.B. There's currently just one filter per tab (Trees, Files, OTU Mapping).
        var activeFilter;
        var filterDefaults;
        switch(slugify(oldState.tab)) {
            case 'trees':
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
                console.warn('updateListFiltersWithHistory(): No filters in this tab: '+ oldState.tab);
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
                newQSValues[prop] = ko.unwrap(activeFilter[prop]);
            }
        }

        // Compare old and new states (or query-strings?) and bail if nothing interesting has changed
        console.log('=== CHECKING OLD VS. NEW STATE ===');
        var interestingChangesFound = false;
        for (prop in oldState) {
            if (newState[prop] !== oldState[prop]) {
                console.log('oldState.'+ prop +' WAS '+ oldState[prop] +' <'+ typeof( oldState[prop] ) +'>, IS '+ newState[prop] +' <'+ typeof( newState[prop] ) +'>');
                interestingChangesFound = true;
            }
        }
        for (prop in newState) {
            if (!(prop in oldState)) {
                console.log('newState.'+ prop +' NOT FOUND in oldState');
                interestingChangesFound = true;
            }
        }
        if (interestingChangesFound) {
            console.log('=== INTERESTING! ===');
            //var newQueryString = '?'+ encodeURIComponent($.param(newQSValues));
            var newQueryString = '?'+ $.param(newQSValues);
            History.pushState( newState, (window.document.title), newQueryString );
        } else {
            console.log('=== BORING... ===');
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
    var $switchToViewLinks = $('#cancel-study-edits');

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
    // N.B. We'll apply this once we've loaded the selected study, then clear it

    disableSaveButton();
    loadSelectedStudy();

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
            author_name: authorName,
            author_email: authorEmail,
            auth_token: authToken
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
    $matchingTab.tab('show');
}

var studyTagsInitialized = false;
function loadSelectedStudy() {
    /* Use REST API to pull study data from datastore
     * :EXAMPLE: GET http://api.opentreeoflife.org/1/study/{23}.json
     *
     * Offer a visible progress bar (studies can be very large)
     *
     * Gracefully handle and report:
     *  - remote service not available
     *  - study missing or not found
     *  - too-large studies? will probably choke on parsing
     *  - misc errors from API
     *  - any local storage (in Lawnchair) that trumps the one in remote storage
     */

    var fetchURL = API_load_study_GET_url.replace('{STUDY_ID}', studyID);

    // TEST URL with local JSON file
    ///fetchURL = '/curator/static/1003.json';

    // TODO: try an alternate URL, pulling directly from GitHub?

    showModalScreen("Loading study data...", {SHOW_BUSY_BAR:true});

    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: fetchURL,
        data: {
            'output_nexml2json': '1.0.0',  // '0.0', '1.0', '1.2', '1.2.1'
            'auth_token': authToken
        },
        error: function(jqXHR, textStatus, errorThrown) {
            // report errors or malformed data, if any
            hideModalScreen();

            console.warn("textStatus: "+ textStatus);
            console.warn("jqXHR.status: "+ jqXHR.status);
            console.warn("jqXHR.responseText: "+ jqXHR.responseText);

            var errMsg;
            if (jqXHR.responseText.length === 0) {
                errMsg = 'Sorry, there was an error loading this study. (No more information is available.)';
            } else {
                errMsg = 'Sorry, there was an error loading this study. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">Show details</a><pre class="error-details" style="display: none;">'+ jqXHR.responseText +'</pre>';
            }
            showErrorMessage(errMsg);
        },

        success: function( response, textStatus, jqXHR ) {
            // this should be properly parsed JSON

            // report errors or malformed data, if any
            if (textStatus !== 'success') {
                showErrorMessage('Sorry, there was an error loading this study.');
                return;
            }
            if (typeof response !== 'object') {
                showErrorMessage('Sorry, there is a problem with the study data (no response).');
                return;
            }
            // pull data from bare NexSON repsonse or compound object (data + sha)
            /*
            if (response['data']) {
                console.log("FOUND inner data (compound response)...");
            } else {
                console.log("inner data NOT found (bare NexSON)...");
            }
            */
            var data = response['data'] || response;
            if (typeof data !== 'object' || typeof(data['nexml']) == 'undefined') {
                showErrorMessage('Sorry, there is a problem with the study data (missing NexSON).');
                return;
            }

            // a new study might now have its ID assigned yet; if so, do it now
            if (data.nexml['^ot:studyId'] === "") {
                console.log(">>> adding study ID to a new NexSON document");
                data.nexml['^ot:studyId'] = studyID;
            }

            viewModel = data;

            /* To help in creating new elements, Keep track of the highest ID
             * currently in use for each element type, as well as its preferred
             * ID prefix and a function to gather all instances.
             *
             * Note that in each case, we expect text IDs (eg, "message987") but keep
             * simple integer tallies to show determine the next available ID in the
             * current study.
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

            // add missing study metadata tags (with default values)
            if (!(['^ot:studyPublicationReference'] in data.nexml)) {
                data.nexml['^ot:studyPublicationReference'] = "";
            }
            if (!(['^ot:studyPublication'] in data.nexml)) {
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
            if (!(['^ot:studyId'] in data.nexml)) {
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
            if (!(['^ot:notIntendedForSynthesis'] in data.nexml)) {
                data.nexml['^ot:notIntendedForSynthesis'] = false;
            }
            if (!(['^ot:comment'] in data.nexml)) {
                data.nexml['^ot:comment'] = "";
            }
            if (!(['^ot:dataDeposit'] in data.nexml)) {
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

            removeDuplicateTags( data.nexml );

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
            } else {
                data.nexml['^ot:messages'] = {
                    'message': []
                }
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

            // keep track of the SHA (git commit ID) that corresponds to this version of the study
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
                // TODO: add more as needed...
                'STUDY_HAS_CHANGED': ko.observable(1)
            }

            // support fast lookup of elements by ID, for largest trees
            viewModel.fastLookups = {
                'NODES_BY_ID': null,
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
                    matchPattern = new RegExp( $.trim(match), 'i' );

                var allTrees = [];
                $.each(viewModel.nexml.trees, function(i, treesCollection) {
                    // watch for single trees here!
                    var treeList = makeArray(treesCollection.tree);
                    $.each(treeList, function(i, tree) {
                        allTrees.push( tree );
                    });
                });

                console.log("  filtering "+ allTrees.length +" trees...");

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
                    matchPattern = new RegExp( $.trim(match), 'i' );

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
                    matchPattern = new RegExp( $.trim(match), 'i' );
                var scope = viewModel.listFilters.OTUS.scope();
                var order = viewModel.listFilters.OTUS.order();

                // gather all OTUs from all 'otus' collections
                var allOTUs = viewModel.elementTypes.otu.gatherAll(viewModel.nexml);

                var chosenTrees;
                switch(scope) {
                    case 'In preferred trees':
                        chosenTrees = getPreferredTrees()
                        break;
                    case 'In non-preferred trees':
                        chosenTrees = getNonPreferredTrees()
                        break;
                    default:
                        chosenTrees = [];
                }

                // pool all node IDs in chosen trees into a common object
                var chosenTreeNodeIDs = {};
                $.each( chosenTrees, function(i, tree) {
                    // check this tree's nodes for this OTU id
                    $.each( tree.node, function( i, node ) {
                        if (node['@otu']) {
                            chosenTreeNodeIDs[ node['@otu'] ] = true;
                        }
                    });
                });

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
                            case 'In all trees':
                                // nothing to do here, all nodes pass
                                break;

                            case 'In preferred trees':
                            case 'In non-preferred trees':
                                // check selected trees for this node
                                var chosenTrees = (scope === 'In preferred trees') ?  getPreferredTrees() : getNonPreferredTrees();
                                var foundInMatchingTree = false;
                                var otuID = otu['@id'];

                                foundInMatchingTree = otuID in chosenTreeNodeIDs;

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
                        // Capture prior position first (for a more stable list during bulk mapping)
                        $.each(filteredList, function(i, otu) {
                            otu.priorPosition = i;
                        });
                        filteredList.sort(function(a,b) {
                            // N.B. This works even if there's no such property.
                            var aMapStatus = $.trim(a['^ot:ottTaxonName']) !== '';
                            var bMapStatus = $.trim(b['^ot:ottTaxonName']) !== '';
                            if (aMapStatus === bMapStatus) {
                                if (!aMapStatus) { // not yet mapped
                                    // Try to retain their prior precedence in
                                    // the list (avoid items jumping around)
                                    return (a.priorPosition < b.priorPosition) ? -1:1;
                                } else {
                                    return 0;
                                }
                            }
                            if (aMapStatus) return 1;
                            if (bMapStatus) return -1;
                        });
                        // Toss the outdated prior positions
                        $.each(filteredList, function(i, otu) {
                            delete otu.priorPosition;
                        });
                        break;

                    case 'Mapped OTUs first':
                        filteredList.sort(function(a,b) {
                            var aMapStatus = $.trim(a['^ot:ottTaxonName']) !== '';
                            var bMapStatus = $.trim(b['^ot:ottTaxonName']) !== '';
                            if (aMapStatus === bMapStatus) return 0;
                            if (aMapStatus) return -1;
                            return 1;
                        });
                        break;

                    case 'Original label (A-Z)':
                        filteredList.sort(function(a,b) {
                            var aOriginal = a['^ot:originalLabel'];
                            var bOriginal = b['^ot:originalLabel'];
                            if (aOriginal === bOriginal) return 0;
                            if (aOriginal < bOriginal) return -1;
                            return 1;
                        });
                        break;

                    case 'Original label (Z-A)':
                        filteredList.sort(function(a,b) {
                            var aOriginal = a['^ot:originalLabel'];
                            var bOriginal = b['^ot:originalLabel'];
                            if (aOriginal === bOriginal) return 0;
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
                    matchPattern = new RegExp( $.trim(match), 'i' );
                var scope = viewModel.listFilters.ANNOTATIONS.scope();
                var submitter = viewModel.listFilters.ANNOTATIONS.submitter();

                // filter study metadata, build new array to new and return it
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

            viewModel.studyQualityPercent = ko.observable(0);
            viewModel.studyQualityPercentStyle = ko.computed(function() {
                // NOTE that we impose a minimum width, so the score is legible
                return Math.max(viewModel.studyQualityPercent(), 8) + "%";
            });
            viewModel.studyQualityBarClass = ko.computed(function() {
                var score = viewModel.studyQualityPercent();
                return scoreToBarClasses(score);
            });

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
            var headerQualityPanel = $('#main .header-quality-panel')[0];
            ko.applyBindings(viewModel, headerQualityPanel);
            var qualityDetailsViewer = $('#quality-details-viewer')[0];
            ko.applyBindings(viewModel, qualityDetailsViewer);

            // Any further changes (*after* tree normalization) should prompt for a save before leaving
            viewModel.ticklers.STUDY_HAS_CHANGED.subscribe( function() {
                enableSaveButton();
                addPageExitWarning( "WARNING: This study has unsaved changes! To preserve your work, you should save this study before leaving or reloading the page." );
                updateQualityDisplay();
            });

            // update quality assessment whenever anything changes
            // TODO: throttle this back to handle larger studies?
            updateQualityDisplay();

            if (viewOrEdit == 'EDIT') {
                // init (or refresh) the study tags
                if (studyTagsInitialized) {
                    $('#study-tags').tagsinput('destroy');
                }
                $('#study-tags').tagsinput( tagsOptions );
                // add all tag values directly from nemxml
                $.each( getTags( data.nexml, {FULL_TAG_INFO: true}), function(i, tagInfo) {
                    $('#study-tags').tagsinput('add', tagInfo);
                });
                captureTagTextOnBlur( $('#study-tags') );
                studyTagsInitialized = true;
            }

            hideModalScreen();
            showInfoMessage('Study data loaded.');
        }
    });
}

function updatePageHeadings() {
    // page headings should reflect the latest metadata for the study
    var studyFullReference = viewModel.nexml['^ot:studyPublicationReference'];
    var studyCompactReference = fullToCompactReference(studyFullReference);
    if (viewOrEdit == 'EDIT') {
        $('#main-title').html('<span style="color: #ccc;">Editing study</span> '+ studyCompactReference);
    } else {
        $('#main-title').html('<span style="color: #ccc;">Viewing study</span> '+ studyCompactReference);
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
function scoreToBarClasses( percentScore ) {
    if (percentScore > 80) {
        return 'progress progress-success';  // green bar
    } else if (percentScore > 40) {
        return 'progress progress-warning';  // orange bar
    } else {
        return 'progress progress-danger';   // red bar
    }
}

function updateQualityDisplay () {
    // generate, then apply, fresh scoring information
    var scoreInfo = scoreStudy(viewModel);

    // update "progress bar" with percentage and color
    viewModel.studyQualityPercent( floatToPercent(scoreInfo.overallScore) );
    // update list of suggested actions below
    var $detailsPanel = $('#study-quality-details');
    // update local tallies and suggestions in each matching tab and panel
    var $navTabs = $('.nav-tabs:eq(0) li');

    var addingCriteriaPanels = ($detailsPanel.find('div.criterion-details').length === 0);
    var cName, criterionScoreInfo, cPercentScore, criterionRules, rule, ruleScoreInfo;
    var nthPanel = 0, $cPanel, $cProgressBar, $cSuggestionsList, $cTabTally, $cTabSuggestionList, suggestionCount;
    for (cName in scoreInfo.scoredCriteria) {
        if (addingCriteriaPanels) {
            // generate criteria detail areas (once only!)
            $detailsPanel.append(
                '<div class="criterion-details" onclick="hideQualityDetailsPopup(); goToTab(\''+ cName +'\'); return false;">'
                  + '<strong>'+ cName +'</strong>'
                  + '<span class="criterion-score">50%</span>'
                  + '<div class="progress progress-info criterion-score-bar">'
                    + '<div class="bar" style="width: 50%;"></div>'
                  + '</div>'
                  + '<ul></ul>'
              + '</div>'
            );
        }
        criterionScoreInfo = scoreInfo.scoredCriteria[ cName ];
        $cPanel = $detailsPanel.find('div.criterion-details:eq('+ nthPanel +')');

        if (criterionScoreInfo.highestPossibleScore === 0.0) {
            //continue;
            cPercentScore = 100;  // placeholder if there are no active rules for this criterion
        } else {
            cPercentScore = floatToPercent(criterionScoreInfo.score / criterionScoreInfo.highestPossibleScore);
        }

        $cPanel.find('.criterion-score').text( cPercentScore+'%' );
        $cPanel.find('.criterion-score-bar').attr('class', 'criterion-score-bar '+ scoreToBarClasses( cPercentScore ));
        $cPanel.find('.criterion-score-bar .bar').css('width', Math.max(4, cPercentScore)+'%')
        $cSuggestionsList = $cPanel.find('ul');

        // find a tab whose name matches this criterion
        $cTabTally = $navTabs.filter(':contains('+ cName +')').find('span.badge');

        $cTabSugestionList = $('.tab-pane[id='+ cName.replace(' ','-') +'] ul.suggestion-list');

        $cSuggestionsList.empty();
        $cTabSugestionList.empty();
        var suggestionCount = 0;

        for (var i = 0; i < criterionScoreInfo.comments.length; i++) {
            var c = criterionScoreInfo.comments[i];
            // show suggestion action for editors, or failure message for other viewers
            var displayMessage;
            if (viewOrEdit == 'EDIT') {
                displayMessage = c.suggestedAction;
            } else {
                displayMessage = c.message;
            }

            if (c.suggestedAction) {
                suggestionCount++;
                $cSuggestionsList.append('<li>'+ displayMessage +'</li>');
                $cTabSugestionList.append('<li>'+ displayMessage +'</li>');  /// TODO: restore this? +' <span style="color: #aaa;">('+ c.percentScore +'%)</span></a></li>');
            }
        }

        if (suggestionCount === 0) {
            $cTabTally.hide();
        } else {
            $cTabTally.text(suggestionCount).show();
        }

        nthPanel++;
    };
}

function toggleQualityDetails( hideOrShow ) {
    // might be called directly from the toggle, or by someone else
    var $toggle = $('#quality-details-toggle');
    var $detailsPanel = $('#study-quality-details');
    if ($detailsPanel.is(':visible') || hideOrShow === 'HIDE') {
        $detailsPanel.slideUp();
        $toggle.text('(show details)');
    } else {
        $detailsPanel.slideDown();
        $toggle.text('(hide details)');
    }
}

function showQualityDetailsPopup() {
    // show details in a popup (already bound)
    $('#quality-details-viewer').modal('show');
}
function hideQualityDetailsPopup() {
    $('#quality-details-viewer').modal('hide');
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
    usingRadialTreeLayout = $(cb).is(':checked');
    // disable/enable the branch-lengths checkbox
    if (usingRadialTreeLayout) {
        $('#branch-length-toggle').attr('disabled', 'disabled');
    } else {
        $('#branch-length-toggle').removeAttr('disabled');
    }
    // fetch tree ID from popup's widgets
    var currentTreeID = $('#tree-tags').attr('treeid');
    if (currentTreeID) {
        drawTree(currentTreeID)
    } else {
        console.warn("No tree in vizInfo!");
    }
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
                        +' buttons to approve or reject each suggested mapping, or'
                        +' or the buttons below to approve or reject the suggestions for all visible OTUs.<'+'/p>';
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
                            +'study\'s preferred trees have approved labels already. To continue, '
                            +'reject some mapped labels with the '
                            +'<span class="btn-group" style="margin: -2px 0;">'
                            +' <button class="btn btn-mini disabled"><i class="icon-remove"></i></button>'
                            +'</span> '
                            +'button or change the filter to <strong>In all trees</strong>.<'+'/p>';
                    showBatchApprove = false;
                    showBatchReject = false;
                    needsAttention = true;
                } else {
                    // we're truly done with mapping (in all trees)
                    detailsHTML = '<p'+'><strong>Congrtulations!</strong> '
                            +'Mapping is suspended because all OTUs in this study have approved '
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
                detailsHTML = '<p'+'>Mapping is suspended because all selected OTUs have approved '
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
        showErrorMessage('Please enter an non-zero integer for the Study Year (in Metadata tab).');
        return false;
    }
    // TODO: Add other validation logic to match changes on the server side.
    // return true IF no errors were found!
    return true;
}

function promptForSaveComments() {
    // show a modal popup to gather comments (or cancel)
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

function saveFormDataToStudyJSON() {
    // save all populated fields; clear others, or remove from JSON(?)
    showModalScreen("Saving study data...", {SHOW_BUSY_BAR:true});

    // push changes back to storage
    var saveURL = API_update_study_PUT_url.replace('{STUDY_ID}', studyID);
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
        author_name: authorName,
        author_email: authorEmail,
        auth_token: authToken,
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
                    var errMsg = 'Sorry, there was an error saving this study. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">Show details</a><pre class="error-details" style="display: none;">'+ jqXHR.responseText +'</pre>';
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
            viewModel.startingCommitSHA = putResponse['sha'] || viewModel.startingCommitSHA;
            // update the History tab to show the latest commit
            if ('versionHistory' in putResponse) {
                viewModel.versions(putResponse['versionHistory'] || [ ]);
            }
            if (putResponse['merge_needed']) {
                var errMsg = 'Your changes were saved, but an edit by another user prevented your edit from merging to the publicly visible location. In the near future, we hope to take care of this automatically. In the meantime, please <a href="mailto:info@opentreeoflife.org?subject=Merge%20needed%20-%20'+ viewModel.startingCommitSHA +'">report this error</a> to the Open Tree of Life software team';
                hideModalScreen();
                showErrorMessage(errMsg);
                return;
            }
            // presume success from here on
            hideModalScreen();
            showSuccessMessage('Study saved to remote storage.');

            removePageExitWarning();
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
    var $btn = $('#save-study-button');
    $btn.removeClass('disabled');
    $btn.unbind('click').click(function(evt) {
        if (validateFormData()) {
            promptForSaveComments();
        }
        return false;
    });
}

function removeStudy() {
    // let's be sure, since deletion will make a mess...
    var removeURL = API_remove_study_DELETE_url.replace('{STUDY_ID}', studyID);
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
        author_name: authorName,
        author_email: authorEmail,
        auth_token: authToken,
        starting_commit_SHA: viewModel.startingCommitSHA,
        commit_msg: commitMessage
    });
    removeURL += ('?'+ qsVars);

    // do the actual removal (from the remote file-store) via AJAX
    showModalScreen("Deleting study...", {SHOW_BUSY_BAR:true});

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
                showErrorMessage('Sorry, there was an error removing this study.');
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

            hideModalScreen();
            showSuccessMessage('Study removed, returning to study list...');
            setTimeout(function() {
                var studyListURL = $('#return-to-study-list').val();
                if (!studyListURL) {
                    console.error("Missing studyListURL!");
                }
                window.location = studyListURL || '/curator';
            }, 3000);
        }
    });
}

/*
 * Use Knockout.js for smart, persistent binding of JS model to UI
 */

// TODO: incorporate its methods into mapped viewModel above?
function StudyViewModel() {
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

    // pre-select first node among conflicting siblings
    resolveSiblingOnlyConflictsInTree(tree);
}

function getPreferredTreeIDs() {
    preferredTreeIDs = [];
    var candidateTreeMarkers = ('^ot:candidateTreeForSynthesis' in viewModel.nexml) ?
        makeArray( viewModel.nexml['^ot:candidateTreeForSynthesis'] ) : [];

    $.each(candidateTreeMarkers, function(i, marker) {
        var treeID = $.trim(marker);
        switch(treeID) {  // non-empty points to a candidate tree
            case '':
            case '0':
                break;
            default:
                preferredTreeIDs.push( treeID );
        }
    });
    return preferredTreeIDs;
}
function getPreferredTrees() {
    var preferredTreeIDs = getPreferredTreeIDs();
    var allTrees = [];
    $.each(viewModel.nexml.trees, function(i, treesCollection) {
        $.each(treesCollection.tree, function(i, tree) {
            allTrees.push( tree );
        });
    });
    return ko.utils.arrayFilter(
        allTrees,
        isPreferredTree
    );
}
function isPreferredTree(treeOrID) {
    var treeID = ('@id' in treeOrID) ? treeOrID['@id'] : treeOrID;
    var preferredTreeIDs = getPreferredTreeIDs();
    var isPreferred = ($.inArray(treeID, preferredTreeIDs) !== -1);
    return isPreferred;
}
function togglePreferredTree( tree ) {
    var treeID = tree['@id'];
    var alreadyPreferred = ($.inArray( treeID, getPreferredTreeIDs()) !== -1);
    if (alreadyPreferred) {
        // remove it from the list of preferred trees
        removeFromArray( treeID, viewModel.nexml['^ot:candidateTreeForSynthesis'] );
    } else {
        // add it to the list of preferred trees
        viewModel.nexml['^ot:candidateTreeForSynthesis'].push( treeID );
    }
    nudgeTickler('TREES');
    nudgeTickler('OTU_MAPPING_HINTS');
    return true;  // to allow checkbox updates
}
function getNonPreferredTrees() {
    var preferredTreeIDs = getPreferredTreeIDs();
    var allTrees = [];
    $.each(viewModel.nexml.trees, function(i, treesCollection) {
        $.each(treesCollection.tree, function(i, tree) {
            allTrees.push( tree );
        });
    });
    return ko.utils.arrayFilter(
        allTrees,
        function(tree) {
            var isPreferred = ($.inArray(tree['@id'], preferredTreeIDs) !== -1);
            return !isPreferred;
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
    console.log("total nodes? "+ nodeCounts.totalNodes);
    console.log("total leaf nodes? "+ nodeCounts.totalTips);
    console.log("mapped leaf nodes? "+ nodeCounts.mappedTips);

    return nodeCounts;
}

function getMappedTallyForTree(tree) {
    // return display-ready tally (mapped/total ratio and percentage)
    var thinSpace = '&#8201;';
    if (!tree || !tree.node || tree.node.length === 0) {
        return '<strong>0</strong><span>'+ thinSpace +'/'+ thinSpace + '0 &nbsp;</span><span style="color: #999;">(0%)</span>';
    } else {
      nodeCounts = getNodeCounts(tree);
      console.log("total nodes? "+ nodeCounts.totalNodes);
      console.log("total leaf nodes? "+ nodeCounts.totalTips);
      console.log("mapped leaf nodes? "+ nodeCounts.mappedTips);

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
    if (!rawModeValue) {
        return 'Unspecified';
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

    return nodeName;
}


/* support classes for objects in arrays
 * (TODO: use these instead of generlc observables?)
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


/*
 * Real-time quality assessment for Open Tree study data, based on chosen criteria,
 * tests, and rules. Generate a summary result (structured object) of the most
 * salient feedback for display.
 *
 * TODO: Move these rules to a shared JSON file, so we can use them in the
 * study-status app and/or a web service? Probably can't do that with embedded
 * functions..
 *
 * == LIKELY CRITERIA ==
 *
 * completeness
 *      min threshold
 *      study data is complete
 *      nice-to-have (what are the finishing touches?)
 *      one preferred tree?
 *      preferred tree(s) is/are rooted? or "unrooted" disclaimer was chosen?
 *
 * integrity
 *      all taxon names mapped (perhaps this score is proportional)
 *      dates and DOIs match reference
 *
 * community
 *      study and its trees are available for synthesis
 *      all annotations of type 'query' are resolved..?
 *      any 'holds' applied have been cleared
 *
 * validity? or should we make it "impossible" to build invalid data here?
 *
 * Let's try again, organizing by tab (Metadata, Trees, etc)
 */

var roughDOIpattern = new RegExp('(doi|DOI)[\\s\\.\\:]{0,2}\\b10[.\\d]{2,}\\b');
// this checks for *attempts* to include a DOI, not necessarily valid

// runs various tests on a study; used for building the scoreInfo var
// tests divided into Metadata, Files, Trees and OTU mapping
var studyScoringRules = {
    'Metadata': [
        // problems with study metadata, DOIs, etc
        {
            description: "The study should have all metadata fields complete.",
            test: function(studyData) {
                // check for non-empty fields in all metadata
                var studyMetatags = makeArray(studyData.nexml.meta);
                for (var i = 0; i < studyMetatags.length; i++) {
                    var testMeta = studyMetatags[i];
                    var testProperty = testMeta['@property'];
                    switch(testProperty) {
                        case 'ot:studyPublicationReference':
                        case 'ot:studyPublication':
                        case 'ot:studyYear':
                        case 'ot:studyId':
                        case 'ot:focalClade':
                        case 'ot:curatorName':
                            var testValue;
                            switch(testMeta['@xsi:type']) {
                                case 'nex:ResourceMeta':
                                    testValue = testMeta['@href'];  // uses special attribute
                                    break;
                                default:
                                    testValue = testMeta['$']; // assumes value is stored here
                            }
                            if ($.trim(testValue) === "") {
                                console.log(">>> metatag '"+ testMeta['@property'] +"' is empty!");
                                return false;
                            }
                            break;

                        default:
                            // ignore other meta tags (annotations)
                            console.log('found some other metadata (annotation?): '+ testProperty);
                            continue;
                    }
                }
                return true;
            },
            weight: 0.35,
            successMessage: "All metadata fields have data.",
            failureMessage: "Some metadata fields are empty.",
            suggestedAction: "Check study metadata for empty fields."
                // TODO: add hint/URL/fragment for when curator clicks on suggested action?

        },
        {
            description: "The study year should match the one in its publication reference.",
            test: function(studyData) {
                // compare metatags for study year and publication reference
                var ticklers = [viewModel.ticklers.GENERAL_METADATA()];
                var studyYear = studyData.nexml['^ot:studyYear'] || "";
                var pubRef = studyData.nexml['^ot:studyPublicationReference'] || "";
                if (($.trim(studyYear) === "") || ($.trim(pubRef) === "")) {
                    // one of these fields is empty, so ignore (pass) this test
                    return true;
                }

                // compare the two, to see if the year is found (anywhere) in the reference
                var pattern = new RegExp('\\b'+ $.trim(studyYear) +'\\b');
                // use RegEx.test to return T/F result
                return pattern.test(pubRef);
            },
            weight: 0.2,
            successMessage: "The study year field matches the year in the publication reference.",
            failureMessage: "The study year field doesn't match the year in the publication reference.",
            suggestedAction: "Correct mismatch between study year field and the year in the publication reference."
                // TODO: add hint/URL/fragment for when curator clicks on suggested action?
        },
        {
            description: "The study publication URL should match the DOI (if found) in the publication reference.",
            test: function(studyData) {
                // compare metatags for DOI and publication reference
                /* NOTE that we no longer expect a DOI in the reference string, so this should only complain if
                 *   - a DOI is found there, AND
                 *   - it conflicts with the "real" DOI in ot:studyPublication.
                 */
                var DOI = ('^ot:studyPublication' in studyData.nexml) ? studyData.nexml['^ot:studyPublication']['@href'] : "";
                var pubRef = studyData.nexml['^ot:studyPublicationReference'];
                if (($.trim(DOI) === "") || ($.trim(pubRef) === "")) {
                    // one of these fields is empty, so it passes (no conflict)
                    return true;
                }
                if (roughDOIpattern.test(pubRef) === false) {
                    // there's no DOI in the reference string, so no conflict
                    return true;
                }

                // compare the two DOIs, to see if the (minimal) DOI matches
                var DOIParts = $.trim(DOI).split('http://dx.doi.org/');
                var strippedDOI;
                if (DOIParts.length === 1) {
                    strippedDOI = DOIParts[0];
                } else {
                    strippedDOI = DOIParts[1];
                }
                var pattern = new RegExp('\\b'+ strippedDOI +'\\b');
                // use RegEx.test to return T/F result
                return pattern.test(pubRef);
            },
            weight: 0.2,
            successMessage: "The study publication URL matches the DOI in its publication reference.",
            failureMessage: "The study publication URL doesn't match the DOI in the publication reference.",
            suggestedAction: "Correct mismatch between publication URL and DOI in the publication reference."
                // TODO: add hint/URL/fragment for when curator clicks on suggested action?

        },
        {
            description: "There should not be more than one study with the same DOI in the database.",
            test: function(studyData) {
                // check list of duplicateStudyIDs, which is set and maintained by calls to the oti (indexing) service
                var dupes = studyData.duplicateStudyIDs();
                if ($.isArray(dupes)) {
                    return (dupes.length === 0);
                } else {
                    ///console.warn("Duplicate study IDs array not found!");
                    return true;
                }
            },
            weight: 0.2,
            successMessage: "This study is unique (based on its DOI) in the Open Tree database.",
            failureMessage: "There is at least one other study with this DOI in the Open Tree database.",
            suggestedAction: "Compare any duplicate studies (based on DOIs) and delete all but one."
                // TODO: add hint/URL/fragment for when curator clicks on suggested action?

        },
        {
            description: "There should be a license or waiver on the data.",
            test: function(studyData) {
                // check that a license or waiver exists
                if (getStudyLicenseInfo(studyData)) {
                    console.log('study has license');
                    return true;
                } else {
                  return false;
                }
            },
            weight: 0.2,
            successMessage: "This study has a license or waiver.",
            failureMessage: "This study has no license or waiver.",
            suggestedAction: "A study author should add an appropriate license or waiver."
            // TODO: add hint/URL/fragment for when curator clicks on suggested action?
        }
    ],
    'Trees': [
        {
            description: "The study should contain at least one tree.",
            test: function(studyData) {
                // check for a tree in this study
                var allTrees = [];
                $.each(viewModel.nexml.trees, function(i, treesCollection) {
                    $.each(treesCollection.tree, function(i, tree) {
                        allTrees.push( tree );
                    });
                });
                return (allTrees.length > 0);
            },
            weight: 0.5,
            successMessage: "The study contains at least one tree.",
            failureMessage: "The study should contain at least one tree.",
            suggestedAction: "Upload or enter a tree for this study."
                // TODO: add hint/URL/fragment for when curator clicks on suggested action?
        },
        {
            description: "For studies nominated for synthesis, there should be at least one preferred tree.",
            test: function(studyData) {
                // check for opt-out flag
                var optOutFlag = studyData.nexml['^ot:notIntendedForSynthesis'];
                if (optOutFlag) {
                    // submitter has explicitly said this study is not intended for synthesis
                    return true;
                }
                // check for any candidate tree in the study
                return getPreferredTrees().length > 0;
            },
            weight: 0.3,
            successMessage: "There is at least one preferred tree, or this study is not nominated for synthesis.",
            failureMessage: "There should be at least one preferred tree, or the study should not be nominated for synthesis.",
            suggestedAction: "Mark at least one tree as preferred, or mark this study as not contributing to synthesis in Metadata."
                // TODO: add hint/URL/fragment for when curator clicks on suggested action?
        },
        {
            description: "Preferred trees should not have conflicting (non-monophyletic) tips mapped to a single taxon.",
            test: function(studyData) {
                // check for opt-out flag
                var optOutFlag = studyData.nexml['^ot:notIntendedForSynthesis'];
                if (optOutFlag) {
                    // submitter has explicitly said this study is not intended for synthesis
                    return true;
                }

                // check preferred trees (synthesis candidates) only
                //var allTrees = viewModel.elementTypes.tree.gatherAll(viewModel.nexml);
                var conflictingNodesFound = false;
                var startTime = new Date();
                $.each(getPreferredTrees(), function(i, tree) {
                    // disregard sibling-only conflicts (will be resolved on the server)
                    var conflictData = getUnresolvedConflictsInTree( tree, {INCLUDE_SIBLINGS_ONLY: false} );
                    if ( !($.isEmptyObject(conflictData)) ) {
                        conflictingNodesFound = true;
                        return false;
                    }
                });
                console.log("total elapsed: "+ (new Date() - startTime) +" ms");
                return !(conflictingNodesFound);
            },
            weight: 0.5,
            successMessage: "No conflicting nodes (non-monophyletic tips mapped to same taxon) found in preferred trees.",
            failureMessage: "Conflicting nodes found! Choose an 'exemplar' for each duplicate taxon in preferred trees.",
            suggestedAction: "Review all conflicting instances of a mapped taxon and choose an exemplar."
        },
        {
            description: "Trees should not have undefined internal node labels.",
            test: function(studyData) {
                // TODO: opt-out if study not intended for synthesis?
                // TODO: skip non-preferred trees?
                // check all trees
                var allTrees = viewModel.elementTypes.tree.gatherAll(viewModel.nexml);
                var ambiguousLabelsFound = false;
                var startTime = new Date();
                $.each(allTrees, function(i, tree) {
                    // disregard sibling-only conflicts (will be resolved on the server)
                    var ambiguousLabelData = getAmbiguousLabelsInTree( tree );
                    if ( !($.isEmptyObject(ambiguousLabelData)) ) {
                        ambiguousLabelsFound = true;
                        return false;
                    }
                });
                console.log("ambiguous label test... total elapsed: "+ (new Date() - startTime) +" ms");
                return !(ambiguousLabelsFound);
            },
            weight: 0.75,
            successMessage: "No undefined internal node labels found.",
            failureMessage: "Undefined internal node labels found! Assign a type to internal node lables.",
            suggestedAction: "Assign a type to all undefined internal node labels."
        },
        {
            description: "Tree roots should be confirmed by a curator.",
            test: function(studyData) {
                var allTrees = viewModel.elementTypes.tree.gatherAll(viewModel.nexml);
                var allRootsConfirmed = true;
                $.each(allTrees, function(i, tree) {
                    var unrootedTree = tree['^ot:unrootedTree'];
                    if (unrootedTree) {
                      allRootsConfirmed = false;
                    }
                });
                return (allRootsConfirmed);
            },
            weight: 0.75,
            successMessage: "All tree roots confirmed.",
            failureMessage: "At least one tree root not confirmed (may be arbitrary).",
            suggestedAction: "Check the current rooting of each tree; correct if necessary on tree viewer and mark root as confirmed on tree properties."
        },
        {
            description: "All trees should have the ingroup specified.",
            test: function(studyData) {
                var allTrees = viewModel.elementTypes.tree.gatherAll(viewModel.nexml);
                var allTreesHaveIngroups = true;
                $.each(allTrees, function(i, tree) {
                  ///treeID = tree['@id'];
                  if (!tree['^ot:inGroupClade']) {
                    ///console.log("ingroup not defined for tree " + treeID);
                    allTreesHaveIngroups = false;
                  }
                });
                return (allTreesHaveIngroups);
            },
            weight: 0.75,
            successMessage: "All trees have defined ingroups.",
            failureMessage: "At least one tree does not have a defined ingroup.",
            suggestedAction: "Set the ingroup for each tree in the tree viewer."
        },
        {
          description: "All trees should have an inference method specified.",
          test: function(studyData) {
              var allTrees = viewModel.elementTypes.tree.gatherAll(viewModel.nexml);
              var allTreesHaveMethod = true;
              $.each(allTrees, function(i, tree) {
                  inferenceMethod = tree['^ot:curatedType'] || 'Unspecified';
                  ///console.log("inference method: " + inferenceMethod);
                  if (inferenceMethod == 'Unspecified') {
                    allTreesHaveMethod = false;
                  }
              });
              return allTreesHaveMethod;
          },
          weight: 0.75,
          successMessage: "Inference method specified for all trees.",
          failureMessage: "At least one tree does not have inference method specified.",
          suggestedAction: "Specify the inference method for each tree."
        },
        {
            description: "All trees should have a descriptive name.",
            test: function(studyData) {
                var allTrees = viewModel.elementTypes.tree.gatherAll(viewModel.nexml);
                var allTreesHaveNames = true;
                $.each(allTrees, function(i, tree) {
                  var treeName = tree['@label'];
                  defaultName = 'Untitled'
                  ///treeID = tree['@id'];
                  // default treename is Untitled + treeid
                  if (treeName.substring(0, defaultName.length) === defaultName) {
                    ///console.log('treeName is default '+ treeName)
                    allTreesHaveNames = false;
                  }
                });
                return (allTreesHaveNames);
            },
            weight: 0.75,
            successMessage: "All trees have a descriptive name.",
            failureMessage: "At least one tree has default name starting with 'Untitled'.",
            suggestedAction: "Add a descriptive name for each tree (e.g. Fig. 1: Maximum Likelihood tree)."
        },
        {
            description: "Trees with branch lengths should have defined type and units.",
            test: function(studyData) {
                // check all trees
                var allTrees = viewModel.elementTypes.tree.gatherAll(viewModel.nexml);
                var branchLengthFieldsPresent = true;
                $.each(allTrees, function(i, tree) {
                    // check if there are branch lengths (assume if one edge has length, they all have lengths)
                    // TODO: change this next line to the new branch length test function
                    var edgesHaveLength = ('@length' in tree.edge[0]);
                    if (edgesHaveLength) {
                      // check that ot:branchLengthMode set
                      var brlenMode = tree['^ot:branchLengthMode'];
                      switch( brlenMode ) {
                          case undefined:
                              branchLengthFieldsPresent = false;
                              ///console.log("branch length mode not set")
                              break;
                          case 'ot:undefined':
                              branchLengthFieldsPresent = false;
                              ///console.log("branch length mode undefined");
                              break;
                          case 'ot:time':
                              var displayUnit = getBranchLengthUnitForTree( tree );
                              if (displayUnit == "Myr?") {
                                branchLengthFieldsPresent = false;
                                ///console.log("branch length time units undefined");
                              }
                              break;
                          case 'ot:other':
                              if (getBranchLengthDescriptionForTree( tree ) == "Undefined") {
                                branchLengthFieldsPresent = false;
                                ///console.log("branch length = other; needs detail");
                              }
                              break;
                          default:
                              break;
                      }
                    } else {
                      ///console.log("tree has no branch lenghts");
                    }
                });
                return (branchLengthFieldsPresent);
            },
            weight: 0.2,
            successMessage: "Branch length meaning well-defined (or tree does not have branch lengths).",
            failureMessage: "Tree has branch length but meaning and / or units undefined.",
            suggestedAction: "Check that branch length type and units set for all trees."
        }
    ],
    /*
    // no tests for files right now
    // could add test checking for file description
    'Files': [
        // problems with uploaded files (formats, missing, corrupt)
        {
            description: "placeholder to fake happy data",
            test: function(studyData) {
                return true;
            },
            weight: 0.4,
            successMessage: "",
            failureMessage: "",
            suggestedAction: ""
                // TODO: add hint/URL/fragment for when curator clicks on suggested action?
        }
    ],
    */
    'OTU Mapping': [
        // checks that all preferred tree tips mapped to OTT taxon names (i.e. pass / fail test)
        {
            description: "All tip labels in preferred trees should be mapped to the Open Tree Taxonomy.",
            test: function(studyData) {
                // check for opt-out flag
                var optOutFlag = studyData.nexml['^ot:notIntendedForSynthesis'];
                if (optOutFlag) {
                    // submitter has explicitly said this study is not intended for synthesis
                    return true;
                }

                // check the proportion of mapped leaf nodes in all candidate ("preferred") trees
                var unmappedLeafNodes = false;
                $.each(getPreferredTrees(), function(i, tree) {
                    nodeCounts = getNodeCounts(tree)
                    if (nodeCounts.mappedTips != nodeCounts.totalTips) {
                      return true; // no need to look at other trees for pass / fail test
                    }
                  });
                // if no unmapped leaf nodes were found, it passes the test
                return !unmappedLeafNodes;
            },
            weight: 0.5,
            successMessage: "Preferred trees (submitted for synthesis) have all tips mapped to Open Tree Taxonomy.",
            failureMessage: "There are unmapped tip labels in preferred trees (submitted for synthesis).",
            suggestedAction: "Review all unmapped tips in OTU Mapping."
                // TODO: add hint/URL/fragment for when curator clicks on suggested action?
        },
        {
            // checks fraction of OTUs mapped in preferred trees
            // does not currently add to quality score (weight = 0)
            description: "What fraction of tip labels in preferred trees are mapped to the Open Tree Taxonomy.",
            test: function(studyData) {
                // check for opt-out flag
                var optOutFlag = studyData.nexml['^ot:notIntendedForSynthesis'];
                if (optOutFlag) {
                    // submitter has explicitly said this study is not intended for synthesis
                    return true;
                }

                // check the proportion of mapped leaf nodes in all candidate ("preferred") trees
                var totalTips = 0;
                var mappedTips = 0;
                var fractionMapped = 0;
                $.each(getPreferredTrees(), function(i, tree) {
                    nodeCounts = getNodeCounts(tree)
                    totalTips += nodeCounts.totalTips
                    mappedTips += nodeCounts.mappedTips
                    ///console.log("mappedTips: " + mappedTips + "; totalTips: " + totalTips);

                });
                if (totalTips != 0) {
                  fractionMapped = mappedTips/totalTips;
                }
                console.log(mappedTips + "/" + totalTips + " = " + floatToPercent(fractionMapped) + "% of OTUs in preferred trees mapped")
                return fractionMapped;
            },
            // would like to update weight based on fractionMapped, but in different scopes
            // with this setup
            weight: 0.5,
            successMessage: "Preferred trees (submitted for synthesis) have all tips mapped to Open Tree Taxonomy.",
            failureMessage: "There are unmapped tip labels in preferred trees (submitted for synthesis).",
            suggestedAction: "Review all unmapped tips in OTU Mapping."
                // TODO: add hint/URL/fragment for when curator clicks on suggested action?
        }
    ],
/*
    'Annotations': [
        // pending or unanswered questions, etc.
                        {
                            description: "placeholder to fake happy data",
                            test: function() {
                                return true;
                            },
                            weight: 0.4,
                            successMessage: "",
                            failureMessage: "",
                            suggestedAction: ""
                                // TODO: add hint/URL/fragment for when curator clicks on suggested action?
                        }
    ],
    'Tools': [
        // maybe just happy news here.. new tools available?
                        {
                            description: "placeholder to fake happy data",
                            test: function() {
                                return true;
                            },
                            weight: 0.4,
                            successMessage: "",
                            failureMessage: "",
                            suggestedAction: ""
                                // TODO: add hint/URL/fragment for when curator clicks on suggested action?
                        }
    ],
*/
}


function scoreStudy( studyData ) {
    // TODO: specify viewModel (fastest)? or JSON version?
    // apply studyScoringRules below, recording score, comments

    var scoreInfo = {
        rawOverallScore: 0.0,
        highestPossibleOverallScore: 0.0,  // normalize the final score relative to the max possible
        overallScore: 0.0,  // build up a non-zero score, composed of all (relative) weight values
        allComments: new Array(),
        scoredCriteria: {}  // support detailed display for each criterion
    }

    var i, cName, criterionScoreInfo, criterionRules, rule, ruleScoreInfo;
    for(cName in studyScoringRules) {
        criterionScoreInfo = {
            score: 0.0,
            highestPossibleScore: 0.0,
            comments: new Array()
        };
        scoreInfo.scoredCriteria[cName] = criterionScoreInfo;

        criterionRules = studyScoringRules[cName];
        console.log("Checking study against rules for "+ cName +"...");
        for (i = 0; i < criterionRules.length; i++) {
            rule = criterionRules[i];
            console.log("  rule.weight = "+ rule.weight);

            // bump up max scores for this criterion and the overall study
            criterionScoreInfo.highestPossibleScore += rule.weight;
            scoreInfo.highestPossibleOverallScore += rule.weight;

            ruleScoreInfo = {
                'weight': rule.weight,
                'message': null,
                'success': null,
                'suggestedAction': null
            };

            if (rule.test( studyData )) {
                // passed this test
                console.log("  PASSED this rule: "+ rule.description);
                criterionScoreInfo.score += rule.weight;
                scoreInfo.rawOverallScore += rule.weight;

                ruleScoreInfo.message = rule.successMessage;
                ruleScoreInfo.success = true;
                ruleScoreInfo.suggestedAction = null;

            } else {
                // failed this test
                console.log("  FAILED this rule: "+ rule.description);
                ruleScoreInfo.message = rule.failureMessage;
                ruleScoreInfo.success = false;
                ruleScoreInfo.suggestedAction = rule.suggestedAction;
            }

            scoreInfo.allComments.push(ruleScoreInfo);
            criterionScoreInfo.comments.push(ruleScoreInfo);
        }
        // sort this criterion's comment list by weight
        criterionScoreInfo.comments.sort(function(a,b) { return parseFloat(b.weight) - parseFloat(a.weight) } )
    }
    // sort full comment list by weight
    scoreInfo.allComments.sort(function(a,b) { return parseFloat(b.weight) - parseFloat(a.weight) } )

    // normalize score vs. highest possible?
    scoreInfo.overallScore = scoreInfo.rawOverallScore / scoreInfo.highestPossibleOverallScore;

    return scoreInfo;
}

/* implement a basic "dirty" flag (to trigger quality assessment), as described here:
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
function showTreeViewer( tree, options ) {
    // if options.HIGHLIGHT_NODE_ID exists, try to scroll to this node
    options = options || {};
    var highlightNodeID = options.HIGHLIGHT_NODE_ID || null;

    if (tree) {
        // Clean up sibling-only conflicts before annoying the user. (We do
        // this here since OTU mapping or other changes may have introduced new
        // conflicts, and we don't want to waste the curator's time with them.)
        resolveSiblingOnlyConflictsInTree(tree);
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

    // bind just the selected tree to the modal HTML
    // NOTE that we must call cleanNode first, to allow "re-binding" with KO.
    var $boundElements = $('#tree-viewer').find('.modal-body, .modal-header h3');
    // Step carefully to avoid un-binding important modal behavior (close widgets, etc)!
    $.each($boundElements, function(i, el) {
        ko.cleanNode(el);
        ko.applyBindings(tree,el);
    });

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
            // scroll this node into view (once popup is properly place in the DOM)
            ///setTimeout(function() {
            scrollToTreeNode(tree['@id'], highlightNodeID);
            ///}, 250);
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
        });
        $('#tree-viewer').off('shown').on('shown', function () {
            updateTreeDisplay();
        });
        $('#tree-viewer').off('hide').on('hide', function () {
            treeViewerIsInUse = false;
            hideTreeWithHistory(tree);
        });
        $('#tree-viewer').off('hidden').on('hidden', function () {
            ///console.log('@@@@@ hidden');
        });

        // hide or show footer options based on tab chosen
        $treeViewerTabs.off('shown').on('shown', function (e) {
            var newTabTarget = $(e.target).attr('href').split('#')[1];
            //var oldTabTarget = $(e.relatedTarget).attr('href').split('#')[1];
            switch (newTabTarget) {
                case 'tree-properties':
                case 'tree-legend':
                    $('#tree-phylogram-options').hide();
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
    // start with preferred trees (show best-quality results first)
    var otuContextsToShow = findOTUInTrees( otu, getPreferredTrees() );
    $.merge( otuContextsToShow, findOTUInTrees( otu, getNonPreferredTrees() ) );
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

function showConflictingNodesInTreeViewer(tree) {
    // If there are no conflicts, fall back to simple tree view
    var conflictData = getUnresolvedConflictsInTree( tree, {INCLUDE_SIBLINGS_ONLY: false} );
    if (!isPreferredTree(tree) || $.isEmptyObject(conflictData)) {
        showTreeWithHistory(tree);
        return;
    }
    // Convert conflict object to standard node playlist?
    var treeID = tree['@id'];
    var conflictPlaylist = $.map(conflictData, function(taxonInstances, taxonID) {
        // convert this taxon to a series of simple objects
        return $.map(taxonInstances, function(instance) {
            return $.extend( { treeID: treeID }, instance );
        });
    });
    showTreeViewer(null, {
        HIGHLIGHT_PLAYLIST: conflictPlaylist,
        HIGHLIGHT_PROMPT: ("Showing all nodes mapped to '<strong>MAPPED_TAXON</strong>'. Choose the exemplar node."),
        HIGHLIGHT_POSITION: 0
    });
    // TODO: Modify prompt text as we move through conflicting taxa?
    // TODO: Prune conflicting taxa from this playlist as curator chooses exemplar nodes?
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
    $scrollingPane.scrollTop( $nodeBox.position().top );
    $scrollingPane.scrollLeft( $nodeBox.position().left );
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

        // reset x of all nodes, to avoid gradual "creeping" to the right
        node.x = 0;
        node.length = 0;  // ie, branch length
        node.rootDist = 0;
    });
    ///console.log(">> default node properties in place...");
    var shortestEdge = null;
    var longestEdge = null;
    $.each(edges, function(index, edge) {
        if (('@length' in edge) || ('@label' in edge)) {
            // transfer @length property (if any) to the child node
            var childID = edge['@target'];
            var childNode = getTreeNodeByID(tree, childID);
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
            // share certain edge predicates (usu. support values) with the child node
            $.each(nodeLabelModes, function(i, modeInfo) {
                // check the edge property set by each option
                var edgeProp = modeInfo.edgePredicate; // eg, '^ot:bootstrapValues'
                if (edgeProp in edge) {
                    childNode.adjacentEdgeLabel = edge[ edgeProp ];
                    return false;  // use first one found
                }
            });
        }
    });
    ///console.log("> done sweeping edges");

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

    var treeEdgesHaveLength = ('@length' in tree.edge[0]);

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
            skipBranchLengthScaling: (hidingBranchLengths || usingRadialTreeLayout || !(treeEdgesHaveLength)) ?  true : false,
            children : function(d) {
                var parentID = d['@id'];
                var itsChildren = [];
                var childEdges = getTreeEdgesByID(null, parentID, 'SOURCE');

                // If this node has one child, it's probably a latent root-node that
                // should be hidden in the tree view.
                if (childEdges.length === 1) {
                    // treat ITS child node as my immediate child in the displayed tree
                    var onlyChildNodeID = childEdges[0]['@target'];
                    childEdges = getTreeEdgesByID(null, onlyChildNodeID, 'SOURCE');
                }

                $.each(childEdges, function(index, edge) {
                    var childID = edge['@target'];
                    var childNode = getTreeNodeByID(null, childID);
                    if (!('@id' in childNode)) {
                        console.error(">>>>>>> childNode is a <"+ typeof(childNode) +">");
                        console.error(childNode);
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
            if (!d.children) {
                itsClass += " leaf";
            }
            if (d['@id'] === rootNodeID) {
                itsClass += " specifiedRoot";
            }
            if (d['@id'] === inGroupClade) {
                itsClass += " inGroupClade";
            }
            if (isConflictingNode(tree, d)) {
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
}

function setTreeRoot( treeOrID, rootingInfo ) {
    // (Re)set the node that is the primary root for this tree, if known
    // 'rootingInfo' can be any of
    //  - a single node (make this the new root)
    //  - a single root-node ID (for the new root)
    //  - an array of nodes or IDs (add a root between these)
    //  - null (un-root this tree)

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
                // undo any reversals in the existing ad-hoc edge
                adHocRootEdge['@source'] = getAdHocRootID(tree);
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
    // Return the best available label for this node, and its type:
    //   'mapped label'         (mapped to OT taxonomy, preferred)
    //   'original label'
    //   'positional label'     (eg, "tree root")
    //   'node id'              (a last resort, rarely useful)
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
        var otu = getOTUByID( itsOTU );
        var itsMappedLabel = $.trim(otu['^ot:ottTaxonName']);
        if (itsMappedLabel) {
            labelInfo.label = itsMappedLabel;
            labelInfo.labelType = 'mapped label';
        } else {
            var itsOriginalLabel = otu['^ot:originalLabel'];
            labelInfo.label = itsOriginalLabel;
            labelInfo.labelType = 'original label';
        }
    } else {
        if ('@label' in node) {
            if (tree['^ot:nodeLabelMode'] === 'ot:other') {
                // add any internal label (eg, taxon name) for display
                labelInfo.label = node['@label'];
                labelInfo.labelType = 'internal node label ('+ tree['^ot:nodeLabelDescription'] +')';
            } else {
                // add any ambiguous label (unresolved type) for display
                // TODO: *or* just call getAmbiguousLabelsInTree(tree) once?
                labelInfo.ambiguousLabel = node['@label'];
                labelInfo.label = nodeID;
                labelInfo.labelType = 'node id';
            }
        } else {
            labelInfo.label = nodeID;
            labelInfo.labelType = 'node id';
        }
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

    var chosenFile = $.trim( $('#treeupload').val() );
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
    var personalTimestamp = authorSafeID + '.'+ new Date().getTime();
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
            if (responseJSON.newTreesPreferred) {
                // mark all new tree(s) as preferred, eg, a candidate for synthesis
                viewModel.nexml['^ot:candidateTreeForSynthesis'].push( tree['@id'] );
            }
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
    if (!confirm("Are you sure you want to delete this tree?")) {
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

    if ($.inArray(tree['@id'], getPreferredTreeIDs()) !== -1) {
        // remove its ID from list of preferred (candidate) trees
        togglePreferredTree( tree );
    }

    // force rebuild of all tree-related lookups
    buildFastLookup('NODES_BY_ID');
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

function getAttrsForMappingOption( optionData ) {
    var attrs = {
        'title': parseInt(optionData.originalMatch.score * 100) +"% match of original label",
        'class': "badge ",
        'style': ("opacity: "+ matchScoreToOpacity(optionData.originalMatch.score) +";")
    }
    // for now, use standard colors that will still pop for color-blind users
    if (optionData.originalMatch.is_synonym) {
        attrs.title = ('Matched on synonym '+ optionData.originalMatch.matched_name);
        attrs.class += ' badge-info';
    } else if (optionData.originalMatch.matched_name !== optionData.originalMatch.unique_name) {
        attrs.title = ('Taxon-name homonym');
        attrs.class += ' badge-warning';
    } else {
        // keep default label with matching score
        attrs.class += ' badge-success';
    }
    return attrs;
}
function matchScoreToOpacity(score) {
    // remap scores (generally from 0.75 to 1.0) to be more visible
    var distanceFromPerfect = 1.0 - score;
    var visibleDistance = distanceFromPerfect * 1.5;
    return (1.0 - visibleDistance);
}

var autoMappingInProgress = ko.observable(false);
var currentlyMappingOTUs = ko.observableArray([]); // drives spinners, etc.
var failedMappingOTUs = ko.observableArray([]); // ignore these until we have new mapping hints
var proposedOTUMappings = ko.observable({}); // stored any labels proposed by server, keyed by OTU id
var bogusEditedLabelCounter = ko.observable(1);  // this just nudges the label-editing UI to refresh!

function toggleMappingForOTU(otu, evt) {
    var $toggle = $(evt.target);
    if ($toggle.is(':checked')) {
        otu['selectedForAction'] = true;
    } else {
        otu['selectedForAction'] = false;
    }
    return true;  // update the checkbox
}
function toggleAllMappingCheckboxes(cb) {
    var $bigToggle = $(cb);
    var $allMappingToggles = $('input.map-toggle');
    if ($bigToggle.is(':checked')) {
        $allMappingToggles.each(function() {
            var $cb = $(this);
            if ($cb.is(':checked') == false) {
                $cb.prop('checked', true);
                $cb.triggerHandler('click');
            }
        });
    } else {
        $allMappingToggles.each(function() {
            var $cb = $(this);
            if ($cb.is(':checked')) {
                $cb.prop('checked', false);
                $cb.triggerHandler('click');
            }
        });
    }
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
                // apply the first (only) value
                delete proposedOTUMappings()[ OTUid ];
                mapOTUToTaxon( OTUid, approvedMapping[0], {POSTPONE_UI_CHANGES: true} );
            } else {
                // do nothing if there are multiple possibilities
            }
        } else {
            // apply the inner value of an observable (accessor) function
            delete proposedOTUMappings()[ OTUid ];
            mapOTUToTaxon( OTUid, ko.unwrap(approvedMapping), {POSTPONE_UI_CHANGES: true} );
        }
    });
    proposedOTUMappings.valueHasMutated();
    nudgeTickler('OTU_MAPPING_HINTS');
    nudgeTickler('TREES');  // to hide/show conflicting-taxon prompts in tree list
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
    var searchText = (editedLabel !== '') ? editedLabel : adjustedLabel(originalLabel);

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

    $.ajax({
        url: doTNRSForMappingOTUs_url,  // NOTE that actual server-side method name might be quite different!
        type: 'POST',
        dataType: 'json',
        data: JSON.stringify({
            "queryString": searchText,
            "includeDubious": false,
            "includeDeprecated": false,
            "doApproximateMatching": (singleTaxonMapping || usingFuzzyMatching) ? true : false,
            "contextName": searchContextName
        }),  // data (asterisk required for completion suggestions)
        crossDomain: true,
        contentType: "application/json; charset=utf-8",
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
        success: function(data) {    // JSONP callback
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
                        nodeId: resultToMap.matched_node_id,        // number
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

                    var candidateMappingList = [ ];
                    $.each(candidateMatches, function(i, match) {
                        // convert to expected structure for proposed mappings
                        candidateMappingList.push({
                            name: match['ot:ottTaxonName'],       // matched name
                            ottId: String(match['ot:ottId']),     // matched OTT id (as string)
                            nodeId: match.matched_node_id,        // number
                            exact: false,                               // boolean (ignoring this for now)
                            higher: false,                               // boolean
                            // TODO: Use flags for this ? higher: ($.inArray('SIBLING_HIGHER', resultToMap.flags) === -1) ? false : true
                            originalMatch: match,
                            otuID: otuID
                        });
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
     *     "nodeId" : 3325605,
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

    // add (or update) a metatag mapping this to an OTT id
    otu['^ot:ottId'] = Number(mappingInfo.ottId);

    // Add/update the OTT name (cached here for performance)
    otu['^ot:ottTaxonName'] = mappingInfo.name || 'OTT NAME MISSING!';
    // N.B. We always preserve ^ot:originalLabel for reference

    // Clear any proposed/adjusted label (this is trumped by mapping to OTT)
    delete otu['^ot:altLabel'];

    if (!options.POSTPONE_UI_CHANGES) {
        nudgeTickler('OTU_MAPPING_HINTS');
        nudgeTickler('TREES');  // to hide/show conflicting-taxon prompts in tree list
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

    if (!options.POSTPONE_UI_CHANGES) {
        nudgeTickler('OTU_MAPPING_HINTS');
        nudgeTickler('TREES');  // to hide/show conflicting-taxon prompts in tree list
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
    nudgeTickler('TREES');  // to hide/show conflicting-taxon prompts in tree list
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
        nudgeTickler('TREES');  // to hide/show conflicting-taxon prompts in tree list
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
    nodeInfoBox.append('<span class="node-name">'+ labelInfo.label +'</span>');
    if (isConflictingNode( tree, node )) {
        if (node['^ot:isTaxonExemplar'] === true) {
            nodeMenu.append('<li><a href="#" onclick="hideNodeOptionsMenu(); clearTaxonExemplar( \''+ tree['@id'] +'\', \''+ nodeID +'\' ); return false;">Clear exemplar for mapped taxon</a></li>');
        } else {
            nodeMenu.append('<li><a href="#" onclick="hideNodeOptionsMenu(); markTaxonExemplar( \''+ tree['@id'] +'\', \''+ nodeID +'\' ); return false;">Mark as exemplar for mapped taxon</a></li>');
        }
    }

    if (nodeID == importantNodeIDs.treeRoot) {
        nodeInfoBox.append('<span class="node-type specifiedRoot">tree root</span>');
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
    // clarify which type of label
    var labelTypeDescription;
    switch(labelInfo.labelType) {
        case('mapped label'):
            labelTypeDescription = 'mapped to Open Tree taxonomy';
            break;
        case('original label'):
            labelTypeDescription = 'original OTU label';
            break;
        case('node id'):
            labelTypeDescription = 'unnamed node';
            break;
        default:
            labelTypeDescription = labelInfo.labelType;
    }
    nodeInfoBox.append('<div class="node-label-type">'+ labelTypeDescription +'</div>');

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
    if ('length' in edge.target) {
        nodeInfoBox.append('<div>Edge length: '+ edge.target.length +'</div>');
    }

    var availableForRooting = (edge.source['@id'] !== importantNodeIDs.treeRoot) && (edge.target['@id'] !== importantNodeIDs.treeRoot);
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
    var localMessages = getElementAnnotationMessages( element );
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
            console.error("MISSING ID for this "+ prefix +":");
            console.error(testElement);
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
    if ('^ot:messages' in nexml) {
        console.warn(">>> Now I'd relocate old annotation messages...");
    } else {
        // no messages stored in the old system
        return;
    }

    // TODO: walk the entire nexml structure, looking for old messages
    // TODO: relocate each to the new home (in its annotationEvent)
    //    eventID = ko.unwrap( msg['@wasGeneratedById'] )
    // TODO: remove deprecated '@wasGeneratedById' property
    // TODO: delete the old local collections as we go?
    var allMessages = makeArray(nexml['^ot:messages']);
    // gather "local" messages from all other elements!
    // NOTE: Add any new target elements here to avoid duplication!
    $.each(nexml.otus, function( i, otusCollection ) {
        $.each(otusCollection.otu, function( i, otu ) {
            var localMessages = getLocalMessages(otu);
            if (localMessages.length > 0) {
                $.merge(allMessages, makeArray(localMessages.message));
            }
        });
    });
    var allTrees = [];
    $.each(nexml.trees, function(i, treesCollection) {
        $.each(treesCollection.tree, function(i, tree) {
            allTrees.push( tree );
        });
    });
    $.each(allTrees, function(i, tree) {
        var localMessages = getLocalMessages(tree);
        if (localMessages.length > 0) {
            $.merge(allMessages, makeArray(localMessages.message));
        }
        // look again at all nodes in the tree
        $.each(makeArray(tree.node), function(i, node) {
            var localMessages = getLocalMessages(node);
            if (localMessages.length > 0) {
                $.merge(allMessages, makeArray(localMessages.message));
            }
        });
    });
    console.warn(">>> found "+ allMessages.length +" messages throughout this study");

}


/*
 * Manage free-form tags for a specified study or tree. This is somewhat
 * complicated by the fact that these are stored as a set of zero or more
 * metatags, with no duplicate values for the parent element.
 */

function getTags( parentElement, options ) {
    options = options || { FULL_TAG_INFO: false };
    var tags = [];
    var rawTagValues = parentElement['^ot:tag'] || [];
    $.each(rawTagValues, function(i, tagText) {
        var tagText = $.trim(tagText);
        switch(tagText) {
            case '':
                break;  // discard empty tags
            default:
                if (options.FULL_TAG_INFO) {
                    var tagInfo = makeTagObjFromString( tagText );
                    tags.push( tagInfo );
                } else {
                    tags.push( tagText );
                }
        }
    });
    return tags;
}
function addTag( parentElement, newTagText ) {
    // ASSUMES that tag text is storage-ready (URI-decoded and trimmed)
    if (!('^ot:tag' in parentElement)) {
        parentElement['^ot:tag'] = [];
    }
    // only add unique tags!
    if ($.inArray(newTagText, parentElement['^ot:tag']) === -1) {
        parentElement['^ot:tag'].push( newTagText );
    }
}
function removeAllTags( parentElement ) {
    parentElement['^ot:tag'] = [];
}
function removeDuplicateTags( parentElement ) {
    var uniqueTags = [ ] ;
    $.each(parentElement['^ot:tag'], function(i,tag){
        if ($.inArray(tag, uniqueTags) === -1) { uniqueTags.push(tag) };
    });
    parentElement['^ot:tag'] = uniqueTags;
}
function updateElementTags( select ) {
    var parentElement;
    if ($(select).attr('id') === 'study-tags') {
        parentElement = viewModel.nexml;
    } else {
        var treeID = $(select).attr('treeid');
        parentElement = getTreeByID(treeID);
    }
    removeAllTags( parentElement );
    // read and apply the values in this tags-input SELECT element
    // N.B. multiple-value select returns null if no values selected!
    var values = $(select).val() || [];
    $.each(values, function(i, encodedTag ) {
        // convert as needed, e.g. 'delete%20me' => 'delete me'
        var rawTagValue = decodeURIComponent( encodedTag );
        // trim final string just to be safe
        addTag( parentElement, $.trim(rawTagValue) );
    });
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

    $.ajax({
        global: false,  // suppress web2py's aggressive error handling
        url: getMRCAForNodes_url,
        // TODO: url: getDraftTreeSubtreeForNodes_url,
        type: 'POST',
        dataType: 'json',
        data: JSON.stringify({
            //"nodeIds": [ ]
            "ottIds": mappedIngroupOttIds,
            "treeSource": options.TREE_SOURCE
        }),  // data (asterisk required for completion suggestions)
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
            // TODO: CONFIRM these property names!
            var responseJSON = $.parseJSON(jqXHR.responseText);
            /* N.B. The response object has different properties, depending on
             * which treeSource was specified (from the OT taxonomy or the
             * latest synthetic tree)
             */
            if (options.TREE_SOURCE === 'taxonomy') {
                tree['^ot:MRCAName'] = responseJSON['mrca_unique_name'] || responseJSON['mrca_name'] || '???';
                tree['^ot:MRCAOttId'] = responseJSON['mrca_ott_id'] || null;
            } else {  // ASSUME 'synth'
                tree['^ot:nearestTaxonMRCAName'] = responseJSON['nearest_taxon_mrca_unique_name'] || responseJSON['nearest_taxon_mrca_name'] || '???';
                tree['^ot:nearestTaxonMRCAOttId'] = responseJSON['nearest_taxon_mrca_ott_id'] || null;
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
    'OTU_MAPPING_HINTS': function( data, event ) {
        nudgeTickler( 'OTU_MAPPING_HINTS');
        return true;
    },
    'EDGE_DIRECTIONS': function( data, event ) {
        nudgeTickler( 'EDGE_DIRECTIONS');
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

    // always nudge the main 'dirty flag' tickler
    viewModel.ticklers.STUDY_HAS_CHANGED( viewModel.ticklers.STUDY_HAS_CHANGED.peek() + 1 );
}

function removeFromArray( doomedValue, theArray ) {
    // removes just one matching value, if found
    var index = $.inArray( doomedValue, theArray );
    if (index !== -1) {
        theArray.splice( index, 1 );
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
                var allTrees = [];
                $.each(viewModel.nexml.trees, function(i, treesCollection) {
                    $.each(treesCollection.tree, function(i, tree) {
                        allTrees.push( tree );
                    });
                });
                $.each(allTrees, function( i, tree ) {
                    $.each(tree.node, function( i, node ) {
                        var itsID = node['@id'];
                        if (itsID in newLookup) {
                            console.warn("Duplicate node ID '"+ itsID +"' found!");
                        }
                        newLookup[ itsID ] = node;
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
                            console.warn("Duplicate otu ID '"+ itsID +"' found!");
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

    // proper version queries treemachine API
    // $ curl -X POST http://opentree-dev.bio.ku.edu:7476/db/data/ext/TNRS/graphdb/doTNRSForNames -H "Content-Type: Application/json" -d '{"queryString":"Drosophila","contextName":"Fungi"}'
    $('#search-results').html('<li class="disabled"><a><span class="text-warning">Search in progress...</span></a></li>');
    $('#search-results').show();
    $('#search-results').dropdown('toggle');

    $.ajax({
        url: doTNRSForAutocomplete_url,  // NOTE that actual server-side method name might be quite different!
        type: 'POST',
        dataType: 'json',
        data: JSON.stringify({
            "queryString": searchText,
            "includeDubious": false,
            "includeDeprecated": false,
            "contextName": searchContextName
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
             *      ottId   // taxon ID in OTT taxonomic tree
             *      nodeId  // ie, neo4j node ID
             *      exact   // matches the entered text exactly? T/F
             *      name    // taxon name
             *      higher  // points to a genus or higher taxon? T/F
             */
            if (data && data.length && data.length > 0) {
                // sort results to show exact match(es) first, then higher taxa, then others
                // initial sort on higher taxa (will be overridden by exact matches)
                data.sort(function(a,b) {
                    if (a.higher === b.higher) return 0;
                    if (a.higher) return -1;
                    if (b.higher) return 1;
                });
                // final sort on exact matches (overrides higher taxa)
                data.sort(function(a,b) {
                    if (a.exact === b.exact) return 0;
                    if (a.exact) return -1;
                    if (b.exact) return 1;
                });

                // show all sorted results, up to our preset maximum
                var matchingNodeIDs = [ ];  // ignore any duplicate results (point to the same taxon)
                for (var mpos = 0; mpos < data.length; mpos++) {
                    if (visibleResults >= maxResults) {
                        break;
                    }
                    var match = data[mpos];
                    var matchingName = match.name;
                    //
                    var matchingID = match.ottId;
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
        lookupURL = '/curator/search_crossref_proxy/dois?q=' + encodeURIComponent(referenceText);
        // TODO: show potential matches in popup? or new frame?
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
                if (resultsJSON.length === 0) {
                    alert('No matches found, please check your publication reference text.')
                } else {
                    var $lookup = $('#DOI-lookup');
                    $lookup.find('.found-matches-count').text(resultsJSON.length);
                    $lookup.find('.found-matches').empty();
                    $lookup.find('#current-ref-text').html( viewModel.nexml['^ot:studyPublicationReference'] || '<em>No reference text</em>');
                    var currentDOI = viewModel.nexml['^ot:studyPublication']['@href'];
                    updateDOIPreviewLink(currentDOI);
                    $.each(resultsJSON, function(i, match) {
                        var $matchInfo = $('<div class="match"><div class="full-citation"></div><div class="doi"></div></div>');
                        $matchInfo.find('.full-citation').html(
                            match.fullCitation || '<em>No citation found.</em>');
                        $matchInfo.find('.doi').html( match.doi
                            ? '<a href="'+ match.doi +'" target="_blank">'+ match.doi +'</a>'
                            : '<em>No DOI found.</em>'
                        );
                        if (match.fullCitation) {
                            var $btn = $('<button class="btn btn-info">Update reference text</button>');
                            $btn.click( updateRefTextFromLookup );
                            $matchInfo.append($btn);
                        }
                        if (match.doi) {
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
var urlPattern = new RegExp('http(s?)://\.*')
function formatDOIAsURL() {
    var oldValue = viewModel.nexml['^ot:studyPublication']['@href'];
    // IF it's already in the form of a URL, do nothing
    if (urlPattern.test(oldValue) === true) {
        return;
    }
    // IF it's a reasonable "naked" DOI, do nothing
    var possibleDOIs = oldValue.match(minimalDOIPattern);
    if( possibleDOIs === null ) {
        // no possible DOI found
        return;
    }

    // this is a candidate; try to convert it to URL form
    var bareDOI = $.trim( possibleDOIs[0] );
    var newValue = 'http://dx.doi.org/'+ bareDOI;
    viewModel.nexml['^ot:studyPublication']['@href'] = newValue;
    nudgeTickler('GENERAL_METADATA');
}
function testDOIForDuplicates( doi ) {
    if (!doi) {
        // by default, this should check the current study DOI
        var studyDOI = ('^ot:studyPublication' in viewModel.nexml) ? viewModel.nexml['^ot:studyPublication']['@href'] : "";
        doi = studyDOI;
    }
    checkForDuplicateStudies(
        doi,
        function( matchingStudyIDs ) {  // success callback
            // remove this study's ID, if found
            matchingStudyIDs = $.grep(matchingStudyIDs, function (testID) { return testID !==  studyID });
            // update the viewModel and trigger fresh tests+prompts
            viewModel.duplicateStudyIDs( matchingStudyIDs );
            console.log( viewModel.duplicateStudyIDs() );
            nudgeTickler('GENERAL_METADATA');
        }
    );
}
function validateAndTestDOI() {
    formatDOIAsURL();
    testDOIForDuplicates();
}

function unresolvedConflictsFoundInTree( tree ) {
    // N.B. This checks for UNRESOLVED and INTERESTING (non-sibling) conflicts
    var conflictData = getUnresolvedConflictsInTree( tree, {INCLUDE_SIBLINGS_ONLY: false} );
    return $.isEmptyObject(conflictData) ? false : true;
}
function isConflictingNode( tree, node ) {
    ///console.log("isConflictingNode( "+ tree['@id'] +", "+ node['@id'] +")...");
    // N.B. This checks for ALL conflicts (incl. resolved and sibling-only)
    var conflictInfo = getConflictingNodesInTree( tree );
    var foundNodeInConflictData = false;
    for (var taxonID in conflictInfo) {
        $.each(conflictInfo[taxonID], function(i, mapping) {
            if (mapping.nodeID === node['@id']) {
                foundNodeInConflictData = true;
                return false;
            }
        });
    }
    return foundNodeInConflictData;
}
function getUnresolvedConflictsInTree( tree, options ) {
    // Filter from full conflict data to include just those node-sets that
    // have't been resolved, ie, curator has not chosen an exemplar.
    var includeSiblingOnlyConflicts = options && ('INCLUDE_SIBLINGS_ONLY' in options) ? options.INCLUDE_SIBLINGS_ONLY : false;
    var unresolvedConflicts = {};
    var allConflicts = getConflictingNodesInTree( tree );
    for (var taxonID in allConflicts) {
        var allNodesAlreadyMarked = true; // we can disprove this from any node
        var itsMappings = allConflicts[taxonID];
        $.each(itsMappings, function(i, mapping) {
            if (!(mapping.curatorHasMarkedNode)) {
                allNodesAlreadyMarked = false;
                return false;
            }
        });
        if (!(allNodesAlreadyMarked)) {
            if (includeSiblingOnlyConflicts) {
                unresolvedConflicts[ taxonID ] = itsMappings;
            } else if (!(itsMappings.siblingsOnly)) {
                // ignore conflicts just between siblings
                unresolvedConflicts[ taxonID ] = itsMappings;
            }
        }
    }
    return unresolvedConflicts;
}
function getConflictingNodesInTree( tree ) {
    // Return sets of nodes that ultimately map to a single OT taxon (via
    // multiple OTUs) and are not siblings. A curator should choose the
    // 'exemplar' node to avoid problems in synthesis.
    var conflictingNodes = { };
    // N.B. OTUs should be unique within a tree. We're looking for OTUs that
    // are mapped to the same OTT taxon id.

    if (!isPreferredTree(tree)) {
        // ignoring these for now...
        return conflictingNodes;
    }

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

    // Gather all mappings that have multiple appearances, but mark them to
    // distinguish siblings-only from more interesting conflicts.
    // N.B. Siblings will be reconciled on the server in any case, but this
    // will help us to show consistent UI when siblings are obviously in conflict.
    for (taxonID in taxonMappings) {
        // is there more than one node for this taxon?
        var itsMappings = taxonMappings[taxonID];
        var foundSiblingConflicts = false;
        var foundInterestingConflicts = false;  // interesting == not just siblings
        if (itsMappings.length > 1) {
            // are all of the nodes siblings? use fast edge lookup!
            var matchParent = null;
            $.each(itsMappings, function(i, item) {
                var upwardEdge = getTreeEdgesByID(tree, item.nodeID, 'TARGET')[0];
                // N.B. Due to NexSON constraints, assume exactly one upward edge!
                var itsParentID = upwardEdge['@source'];
                if (!matchParent) {
                    matchParent = itsParentID;
                } else {
                    if (itsParentID === matchParent) {
                        foundSiblingConflicts = true;
                    } else {
                        foundInterestingConflicts = true;
                        return false;  // no need to check remaining mappings
                    }
                }
            });
        }
        if (foundInterestingConflicts) {
            itsMappings['siblingsOnly'] = false;
            conflictingNodes[ taxonID ] = itsMappings;
        } else if (foundSiblingConflicts) {
            itsMappings['siblingsOnly'] = true;
            conflictingNodes[ taxonID ] = itsMappings;
        }
    }

    return conflictingNodes;
}
function markTaxonExemplar( treeID, chosenNodeID, options ) {
    // find all conflicting nodes and set flag for each
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
    var conflictData = getConflictingNodesInTree(tree);
    var itsMappings = conflictData[taxonID];
    if (!itsMappings) {
        console.error("markTaxonExemplar("+ treeID +","+ chosenNodeID +"): No mappings list found!");
        return;  // do nothing (this is not good)
    }
    $.each(itsMappings, function(i, mapping) {
        var mappedNode = getTreeNodeByID(treeID, mapping.nodeID);
        mappedNode['^ot:isTaxonExemplar'] = (mapping.nodeID === chosenNodeID) ? true : false;
    });
    nudgeTickler('TREES');
    if (options.REDRAW_TREE) {
        // update color of conflicting nodes (exemplars vs. others)
        drawTree(treeID);
    }
    // TODO: what happens now?
    //      - move to next conflicting taxon, if any?
    //      - remove this set of mappings, or regenerate conflictData?
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
    var conflictData = getConflictingNodesInTree(tree);
    var itsMappings = conflictData[taxonID];
    if (!itsMappings) {
        console.error("clearTaxonExemplar("+ treeID +","+ chosenNodeID +"): No mappings list found!");
        return;  // do nothing (this is not good)
    }
    $.each(itsMappings, function(i, mapping) {
        var mappedNode = getTreeNodeByID(treeID, mapping.nodeID);
        delete mappedNode['^ot:isTaxonExemplar'];
    });
    nudgeTickler('TREES');
    if (options.REDRAW_TREE) {
        // update color of conflicting nodes (exemplars vs. others)
        drawTree(treeID);
    }
}
function resolveSiblingOnlyConflictsInTree(tree) {
    // Find and resolve all simple conflicts between sibling nodes (select the
    // first as exemplar).
    var conflictData = getUnresolvedConflictsInTree( tree, {INCLUDE_SIBLINGS_ONLY: true} );
    for (var taxonID in conflictData) {
        var conflictInfo = conflictData[taxonID];
        if (conflictInfo.siblingsOnly) {
            var firstConflictingNodeID = conflictInfo[0].nodeID;
            markTaxonExemplar( tree['@id'], firstConflictingNodeID, {REDRAW_TREE: false});
        }
    }
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
    // N.B. This checks for UNRESOLVED and INTERESTING (non-sibling) conflicts
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

function showStudyCommentEditor() {
    $('#edit-comment-button').addClass('active');
    $('#preview-comment-button').removeClass('active');
    $('#comment-preview').hide();
    $('#comment-editor').show();
}
function showStudyCommentPreview() {
    // show spinner? no, it's really quick
    $('#edit-comment-button').removeClass('active');
    $('#preview-comment-button').addClass('active');
    // stash and restore the current scroll position, lest it jump
    var savedPageScroll = $('body').scrollTop();
    $.ajax({
        crossdomain: true,
        type: 'POST',
        url: render_markdown_url,
        data: viewModel.nexml['^ot:comment'],
        success: function( data, textstatus, jqxhr ) {
            $('#comment-preview').show();
        },
        success: function( data, textstatus, jqxhr ) {
            $('#comment-preview').html(data);
            $('#comment-preview').show();
            //setTimeout(function() {
                $('body').scrollTop(savedPageScroll);
            //}, 10);
            $('#comment-editor').hide();
        },
        error: function(jqXHR, textStatus, errorThrown) {
            // report errors or malformed data, if any
            var errMsg;
            if (jqXHR.responseText.length === 0) {
                errMsg = 'Sorry, there was an error rendering this Markdown. (No more information is available.)';
            } else {
                errMsg = 'Sorry, there was an error rendering this Markdown. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">Show details</a><pre class="error-details" style="display: none;">'+ jqXHR.responseText +'</pre>';
            }
            showErrorMessage(errMsg);
        }
    });
}

function studyContributedToLatestSynthesis() {
    // check for a valid SHA from last synthesis
    return ($.trim(latestSynthesisSHA) !== '');
}
function currentStudyVersionContributedToLatestSynthesis() {
    // compare SHA values and return true if they match
    return (viewModel.startingCommitSHA === latestSynthesisSHA);
}

function getDataDepositMessage() {
    // Returns HTML explaining where to find this study's data, or an empty
    // string if no URL is found. Some cryptic dataDeposit URLs may require
    // more explanation or a modified URL to be more web-friendly.
    //
    // NOTE that we maintain a server-side counterpart in
    // webapp/modules/opentreewebapputil.py > get_data_deposit_message
    var url = $.trim(viewModel.nexml['^ot:dataDeposit']['@href']);
    // If there's no URL, we have nothing to say
    if (url === '') {
        return '';
    }

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
        return 'Data for this study is archived as <a href="'+ url +'" target="_blank">Treebase study '+ treebaseStudyID +'</a>';
    }

    // TODO: Add other substitutions?

    // default message simply repeats the dataDeposit URL
    return 'Data for this study is permanently archived here:<br/><a href="'+ url +'" target="_blank">'+ url +'</a>';
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
            ///showSuccessMessage('Study removed, returning to study list...');
            var result = JSON.parse( jqXHR.responseText );
            var inferredContext = null;
            if (result && 'context_name' in result) {
                inferredContext = result['context_name'];
            }
            ///console.log(">> inferredContext: "+ inferredContext);
            if (inferredContext) {
                // update BOTH search-context drop-down menus to show this result
                $('select[name=taxon-search-context], select[name=mapping-search-context]').val(inferredContext);
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
