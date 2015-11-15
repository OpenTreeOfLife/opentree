/*    
@licstart  The following is the entire license notice for the JavaScript code in this page. 

    Copyright (c) 2013, Cody Hinchliff
    Copyright (c) 2013, Joseph W. Brown
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

// TODO: Add other tests to see if we're on a history-aware page of the opentree site (vs. static "about" pages, etc)?
var pageUsesHistory = true;

// keep a global pointer to the argus instance
var argus;

// @TEMP - preserve incoming OTT id and source, so we can demo the Extract Subtree feature
var incomingOttolID = null;

function getSupportingSourceIDs( node ) {
    // handle different properties used here (each should hold an array of source-ids)
    if (typeof node.supportedBy !== 'undefined') {
        return (node.supportedBy.length > 0) ? node.supportedBy : null;
    }
    if (typeof node.supporting_sources !== 'undefined') {
        return (node.supporting_sources.length > 0) ? node.supporting_sources : null;
    }
    return null;
}
function updateTreeView( State ) {
    /* N.B. This should respond identically to state changes in HTML5 History,
     * or to explicit calls from older/simpler browsers.
     */
    $('#main-title .comments-indicator, #main-title .properties-indicator').hide();
    $('#node-provenance-panel h3').html('Provenance');
    $('#main-title .title').html( 'Loading tree view...' );
    // nudge static viewer to show second line, if any
    snapViewerFrameToMainTitle();

    // fetch the matching synth-tree node ID, then notify argus (trigger data load and/or view change)
    var ottolID = State.data.nodeID;
    if (argus.useSyntheticTree && State.data.domSource == 'ottol') {
        // we'll need to convert to a more volatile node ID for the current tree

        // @TEMP - save this and we'll add it dataTree when it arrives
        incomingOttolID = ottolID;

        var treeNodeID;
        $.ajax({
            type: 'POST',
            url: getNodeIDForOttolID_url,
            data: {'ottId': String(ottolID)},
            success: function(data) {
                argus.displayNode({"nodeID": data,
                                   "domSource": syntheticTreeID});  // from main HTML view
            },
            error: function(jqXHR, textStatus, errorThrown) {
                // NOTE that this won't fire in cross-domain requests! using complete (below) instead..
            },
            complete: function(jqXHR, textStatus) {
                // examine the error response and show a sensible message
                if (textStatus === 'error') {
                    var errMsg;
                    if (jqXHR.responseText.indexOf('TaxonNotFoundException') !== -1) {
                        // the requested OTT taxon is bogus, or not found in the target tree
                        errMsg = '<span style="font-weight: bold; color: #777;">This taxon is in our taxonomy but not in our tree'
                                +' synthesis database. This can happen for a variety of reasons, but the most probable is that it'
                                +' is flagged as <em>incertae sedis</em>.'
                                +'<br/><br/>If you think this is an error, please'
                                +' <a href="https://github.com/OpenTreeOfLife/feedback/issues" target="_blank">create an issue in our bug tracker</a>.';
                        // TODO: Explain in more detail: Why wasn't this used? 
                        showErrorInArgusViewer( errMsg );
                    } else {
                        errMsg = "Something went wrong on the server. Please wait a moment and reload this page.";
                        showErrorInArgusViewer( errMsg, jqXHR.responseText );
                    }
                }
            },
            dataType: 'json'  // should return just the node ID (number)
        });
    } else {
        // use ottol ID if we're browsing the taxonomy
        argus.displayNode({"nodeID": ottolID,
                           "domSource": State.data.domSource});
    }
    
    // we'll finish updating the page in a callback from argusObj.loadData()

    // update all login links to use the new URL
    fixLoginLinks();
};

if ( History && History.enabled && pageUsesHistory ) {
    // bind to statechange event
    // Note: We are using statechange instead of popstate
    History.Adapter.bind(window, 'statechange', function() {
        var State = History.getState(); // Note: We are using History.getState() instead of event.state
        //History.log(State.data, State.title, State.url);
        updateTreeView( State );
    }); 
}

function getCommentIndexURL( rawURL ) {
    var url = rawURL || window.location.href;
    // extract a root-relative URL, with no query-string
    var pathParts = url.split('/').slice(3);  // remove scheme and hostname:port
    var indexURL = '/'+ pathParts.join('/');
    return indexURL;
}

function currentScreenSize() {
    // Take advantage of the Bootstrap dimensional rules for our three
    // device types (desktop, tablet, phone). Each has possible implications to
    // layout and behavior, and this function makes it easy to stay in sync
    // with the CSS.
    //
    // ASSUMES that we have these three indicators in the current DOM! 
    if ($('#screen-size-indicator .visible-phone').is(':visible')) {
        return 'PHONE';
    } else if ($('#screen-size-indicator .visible-tablet').is(':visible')) {
        return 'TABLET';
    } else {
        return 'DESKTOP';
    }
}

function loadLocalComments( chosenFilter ) {
    // Load local comments for the new URL, including info on the current location
    var fetchArgs = {
        filter: '',
        url: '',
        synthtree_id: '',
        synthtree_node_id: '',
        sourcetree_id: '',
        ottol_id: '',
        target_node_label: ''
    };
    // add a mnemonic to the comment header (for this page? which node?)
    var commentLabel = '';

    if (argus.treeData) {
        // default filter is for the current location in the synthetic tree
        // TODO: pivot based on current page/view type..
        fetchArgs.filter = chosenFilter || 'synthtree_id,synthtree_node_id';

        var targetNode = argus.treeData;
        fetchArgs.synthtree_id = argus.domSource;
        fetchArgs.synthtree_node_id = targetNode.nodeid;
        fetchArgs.sourcetree_id = targetNode.taxSource;
        fetchArgs.ottol_id = targetNode.ottId;

        commentLabel = buildNodeNameFromTreeData( targetNode );
        /* OR should comment label reflect the current filter?
        switch(fetchArgs.filter) {
            case 'synthtree_id,synthtree_node_id':
            default:
                commentLabel = fetchArgs.synthtree_id +'@'+ fetchArgs.synthtree_node_id;
                break;

            case 'sourcetree_id':
                commentLabel = fetchArgs.sourcetree_id;
                break;

            case 'ottol_id':
                commentLabel = 'ottol@'+ fetchArgs.ottol_id;
                break;
        }
        */
        fetchArgs.target_node_label = commentLabel;
    } else {
        // use the fallback 'url' index (apparently there's no tree-view here)
        ///console.log("loadLocalComments() - Loading comments based on 'url' (no argus.treeData!)");
        fetchArgs.filter = 'url';
        fetchArgs.url = getCommentIndexURL();

        commentLabel = window.document.title;
        if (commentLabel.endsWidth(' - opentree')) {
            // trim to just the distinctive page title
            commentLabel = commentLabel.slice(0, -11);
        }
    }

    // update comment header (maybe again in the callback, when we have a name)
    $('#comments-panel .provenance-intro').html('Comments');
    // simplify this (since label is already prominent)
    $('#comments-panel .provenance-title').html(commentLabel).hide();
    $('.plugin_localcomments').parent().load(
        '/opentree/plugin_localcomments',
        fetchArgs,  // determined above
        function() {  // callback
            // update its login link (if any) to use the latest URL
            fixLoginLinks();
            // update the comment count at the top of the page
            var howManyComments = $('.plugin_localcomments .body').length;
            var howManyTopics = $('.plugin_localcomments .issue-body').length;
            $('#links-to-local-comments a:eq(0)').html(
                'Comments on this node ('+ howManyComments +')'
            );
            $('#comment-count').html( howManyComments );;
            // build a label like "12 comments in 1 topic"
            var label = howManyComments + ' comment'+ (howManyComments === 1 ? '' : 's')
                        +' in '+ howManyTopics +' topic'+ (howManyTopics === 1 ? '' : 's');
            $('#comments-panel .provenance-intro').html(label);
        }
    );
}

$(document).ready(function() {
    // set default starting node and view, if the URL doesn't specify
    // NOTE that we override this (using $.extend) with values set in the 
    // main page template, so we can build it from incoming URL in web2py.
    var initialState = $.extend({
        viewer: 'argus', 
        domSource: syntheticTreeID,                  // from main HTML view
        nodeID: syntheticTreeDefaultStartingNodeID,  // from main HTML view
        nodeName: '',  // names will be updated/corrected by argus callback
        viewport: '24,201,0,800',
        forcedByURL: false
    }, urlState); // urlState should been defined in the main HTML view

    // check for server-supplied input[type=hidden] widget with depth value
    var currentMaxDepth = $('#currentMaxDepth').length === 1 ? $('#currentMaxDepth').val() : 3;     // TODO: reset to 2?

    // TODO: how should these defaults (borrowed from synthview/index.html) be set?
    argus = createArgus({
      "domSource": "ottol",
      "container": $('#argusCanvasContainer')[0], // get the "raw" element, not a jQuery set
      "treemachineDomain": treemachine_domain,    // "global" vars from main page template
      "taxomachineDomain": taxomachine_domain,
      "useTreemachine": true, // TODO: pivot based on domSource? treeID?
      "useSyntheticTree": true, // TODO: pivot based on domSource? treeID?
      "maxDepth": currentMaxDepth
    });

    if ( History && History.enabled && pageUsesHistory ) {
        // if there's no prior state, go to the initial target node in the synthetic tree
        var priorState = History.getState();
       
        // Check first for incoming URL that might override prior history
        if (initialState.forcedByURL || !(priorState.data.nodeID)) {
            // apply the state as specified in the URL (or defaults, if prior history is incomplete)
            ///console.log("Applying state from incoming URL...");
            initialState.nudge = new Date().getTime();
            History.pushState( initialState, historyStateToWindowTitle(initialState), historyStateToURL(initialState));
        } else {
            // nudge the (existing) browser state to view it again
            ///console.log("Nudging state (and hopefully initial view)...");
            priorState.data.nudge = new Date().getTime();
            History.replaceState( priorState.data, priorState.title, priorState.url );
        }
    } else {
        // force initial argus view using defaults above (mimic History state object)
        // NOTE: we force this through common code to remap ottids to node ids
        updateTreeView({'data': initialState});
    }

    /*
    // add splitter between argus + provenance panel (using jquery.splitter plugin)
    var viewSplitter = $('#viewer-collection').split({
        orientation:'vertical',
        limit: 280,             // don't come closer than this to edge 
        position:'70%'          // initial position
    });

    // bind toggle for provenance panel
    var lastViewSplitterPosition = viewSplitter.position();
    $('#provenance-show').unbind('click').click(function() {
        viewSplitter.position(lastViewSplitterPosition);
        $(this).hide();
        return false;
    });
    $('#provenance-hide').unbind('click').click(function() {
        lastViewSplitterPosition = viewSplitter.position();
        viewSplitter.position( viewSplitter.width() - 2 );
        $('#provenance-show').show();
        return false;
    });
    */
    $('#comments-hide').unbind('click').click(function() {
        toggleCommentsPanel('HIDE');
        return false;
    });
    $('#provenance-hide').unbind('click').click(function() {
        togglePropertiesPanel('HIDE');
        return false;
    });
});

var activeToggleFade = 0.5;
var readyToggleFade = 1.0;
var toggleFadeSpeed = 'fast';
function toggleCommentsPanel( hideOrShow ) { 
    // can be forced by passing hideOrShow ('HIDE'|'SHOW')
    if ($('#viewer-collection').hasClass('active-comments') && (hideOrShow !== 'SHOW')) {
        ///console.log('HIDING comments');
        $('#viewer-collection').removeClass('active-comments');
        $('.comments-indicator .badge').fadeTo('fast', readyToggleFade);
        $('.comments-indicator').attr('title', 'Show comments for this node');
        $('.comments-indicator .widget-prompt').text(' Show comments');
        // remove any toggling behavior bound to the argus view
        $('#argusCanvasContainer').unbind('click.hideComments');
    } else {
        ///console.log('SHOWING comments');
        $('#viewer-collection').removeClass('active-properties');
        $('.properties-indicator .badge').fadeTo('fast', readyToggleFade);
        $('.properties-indicator').attr('title', 'Show properties for the current selection');
        $('.properties-indicator .widget-prompt').text('Show properties ');
        // remove any toggling behavior bound to the argus view
        $('#argusCanvasContainer').unbind('click.hideProperties');

        $('#viewer-collection').addClass('active-comments');
        $('.comments-indicator .badge').fadeTo('fast', activeToggleFade);
        $('.comments-indicator').attr('title', 'Hide comments for this node');
        $('.comments-indicator .widget-prompt').text(' Hide comments');

        // wait to set click behavior on argus, or it'll hide again immediately
        setTimeout(
            function() {
                if (currentScreenSize() === 'PHONE') {
                    // clicking on (marginalized) argus view hides the side panel
                    $('#argusCanvasContainer').unbind('click.hideComments')
                         .bind('click.hideComments', function() {
                             toggleCommentsPanel('HIDE');
                         });
                }
            }, 
            10
        );
    }
}
function togglePropertiesPanel( hideOrShow ) {
    // can be forced by passing hideOrShow ('HIDE'|'SHOW')
    if ($('#viewer-collection').hasClass('active-properties') && (hideOrShow !== 'SHOW')) {
        ///console.log('HIDING properties');
        $('#viewer-collection').removeClass('active-properties');
        $('.properties-indicator .badge').fadeTo('fast', readyToggleFade);
        $('.properties-indicator').attr('title', 'Show properties for the current selection');
        $('.properties-indicator .widget-prompt').text('Show properties ');
        // remove any toggling behavior bound to the argus view
        $('#argusCanvasContainer').unbind('click.hideProperties');
    } else {
        ///console.log('SHOWING properties');
        $('#viewer-collection').removeClass('active-comments');
        $('.comments-indicator .badge').fadeTo('fast', readyToggleFade);
        $('.comments-indicator').attr('title', 'Show comments for this node');
        $('.comments-indicator .widget-prompt').text(' Show comments');
        // remove any toggling behavior bound to the argus view
        $('#argusCanvasContainer').unbind('click.hideComments');

        $('#viewer-collection').addClass('active-properties');
        $('.properties-indicator .badge').fadeTo('fast', activeToggleFade);
        $('.properties-indicator').attr('title', 'Hide properties for the current selection');
        $('.properties-indicator .widget-prompt').text('Hide properties ');

        // wait to set click behavior on argus, or it'll hide again immediately
        setTimeout(
            function() {
                if (currentScreenSize() === 'PHONE') {
                    // clicking on (marginalized) argus view hides the side panel
                    $('#argusCanvasContainer').unbind('click.hideProperties')
                         .bind('click.hideProperties', function() {
                             console.log('PHONE CLICK HIDING!');
                             togglePropertiesPanel('HIDE');
                         });
                }
            }, 
            10
        );
    }
}

function fixLoginLinks() {
    // update all login links to return directly to the current URL (NOTE that this 
    // doesn't seem to work for Logout)
    var currentURL;
    try {
        var State = History.getState();
        currentURL = State.url;
    } catch(e) {
        currentURL = window.location.href;
    }

    $('a.login-logout').each(function() {
        var $link = $(this);
        var itsHref = $link.attr('href');
        itsHref = itsHref.split('?')[0];
        itsHref += ('?_next='+ currentURL);
        $link.attr('href', itsHref);
    });
}

function historyStateToWindowTitle( stateObj ) {
    // show name if possible, else just source+ID
    if ((!stateObj.nodeName) || stateObj.nodeName.trim() === '') {
        return (stateObj.domSource +':'+ stateObj.nodeID +' - opentree');
    }
    return (stateObj.nodeName +' - opentree');
}
function historyStateToPageHeading( stateObj ) {
    // show name if possible, else just source+ID
    var sourceAndID = '';
    if (('domSource' in stateObj) && ('nodeID' in stateObj)) {
        sourceAndID = stateObj.domSource +'@'+ stateObj.nodeID;
    }
    if ((!stateObj.nodeName) || stateObj.nodeName.trim() === '') {
        return ('Unnamed node '+ sourceAndID);
    }
    if (sourceAndID) {
        return ('<span title="'+ stateObj.domSource +'@'+ stateObj.nodeID +'">'+ stateObj.nodeName +'</span>');
    }
    return stateObj.nodeName;
}

function buildNodeNameFromTreeData( node ) {
    var nameOfLastResort = "(untitled node)";
    var compoundNodeNameDelimiter = ' + ';
    var compoundNodeNamePrefix = '[';
    var compoundNodeNameSuffix = ']';
    if (node.name) {
        // easy, name was provided
        return node.name || nameOfLastResort;
    }
    // unnamed nodes should show two descendant names as tip taxa (eg, 'dog, cat')
    if (node.descendantNameList) {
        // children aren't in view, but their names are here
        return (compoundNodeNamePrefix + node.descendantNameList.slice(0,2).join(compoundNodeNameDelimiter)
                + (node.descendantNameList.length > 2 ? ' + ...' : '')   // hint at additional descendants
                + compoundNodeNameSuffix);
    }
    // we'll need to build a name from visible children and/or their descendantNamesList
    if (node.children === undefined || node.children.length === 0) {
        return nameOfLastResort;
    }
    // recurse as needed to build child names, then prune as needed
    var moreThanTwoDescendants = false;
    var firstChildName = buildNodeNameFromTreeData(node.children[0]);
    if (node.children.length < 2) {
        return firstChildName;
    }
    var nameParts = firstChildName.split(compoundNodeNameDelimiter);
    firstChildName = nameParts[0];
    if(firstChildName.indexOf(compoundNodeNamePrefix) !== -1) {
        moreThanTwoDescendants = true;
        firstChildName = firstChildName.split(compoundNodeNamePrefix)[1];
    }
    var lastChildName = buildNodeNameFromTreeData(node.children[ node.children.length-1 ]);
    nameParts = lastChildName.split(compoundNodeNameDelimiter);
    lastChildName = nameParts[nameParts.length - 1];
    if (lastChildName === '...]') {
        // sidestep any ellipsis found here
        lastChildName = nameParts[nameParts.length - 2];
    }
    if(lastChildName.indexOf(compoundNodeNameSuffix) !== -1) {
        lastChildName = lastChildName.split(compoundNodeNameSuffix)[0];
    }
    return (compoundNodeNamePrefix + firstChildName + compoundNodeNameDelimiter + lastChildName
            + (moreThanTwoDescendants ? ' + ...' : '')   // hint at additional descendants
            + compoundNodeNameSuffix);
};
  
// recursively populate any missing (implied) node names (called immediately after argus loads treeData)
function buildAllMissingNodeNames( node ) {
    if (!node.name) {
        node.name = buildNodeNameFromTreeData(node);
    }
    if (node.children) {
        for (var i = 0; i < node.children.length; i++) {
            buildAllMissingNodeNames( node.children[i] );
        }
    }
}

var spinnerSelector = '#spinner';
function showSpinner( $container ) {
    // put the spinner inside the specified container element (passed as jQuery selection)
    var $spinner = $(spinnerSelector);
    // toggle container element to avoid "empty" container or missing spinner
    $container.hide();
    $container.append($spinner);
    var oldOverflow = $container.css('overflow');  // seems important for visible spinner
    $spinner.show();
    $container.show();
}
function hideSpinner() {
    // restore spinner to its standby location
    var $spinner = $(spinnerSelector);
    $spinner.hide();
    $('body').append($spinner);
}

/*
function URLToHistoryState( url ) {
    // use to construct state for pasted-in URLs
    // currently based on query-string args 'viewer' and 'node' (source:ID)
    // EXAMPLE: /opentree/?viewer=argus&node=ottol:805080
    var query = window.location.search.split('?')[1];
    var statePairs = query.split('&');
    var i, keyValuePair, key, value, urlState = {};
    for(i = 0; i < statePairs.length; i++) {
        keyValuePair = statePairs[i].split('=');
        key = decodeURIComponent(keyValuePair[0]);
        value = (keyValuePair.length > 1) ? decodeURIComponent(keyValuePair[1]) : undefined;
        if (key === 'node') {
            // do one more split to capture domSource and nodeID
            keyValuePair = value.split(':');
            urlState.domSource = decodeURIComponent(keyValuePair[0]);
            urlState.nodeID = decodeURIComponent(keyValuePair[1]);
        } else {
            // all other values are directly added to state
            urlState[key] = value;
        }
    }
    
    // fail if critical information is missing
    if (typeof(urlState.nodeID) === 'undefined') {
        return null;
    } else if (typeof(urlState.domSource) === 'undefined') {
        return null;
    }

    // use default values for other missing properties
    if (typeof(urlState.nodeName) === 'undefined') {
        urlState.nodeName = '';     // TODO: recover name after data has loaded?
    }
    if (typeof(urlState.viewer) === 'undefined') {
        urlState.viewer = 'argus';
    }
    return urlState;
}
*/

function clearPropertyInspector() {
    // clear all visible data (but not UI and re-usable elements) while new data is loading
    $('#provenance-panel .provenance-intro, #provenance-panel .provenance-title, #provenance-panel .ordered-sections').html('');
    $('#provenance-panel .taxon-image').remove();
}
function showObjectProperties( objInfo, options ) {
    // show property inspector if it's hidden
    if (options !== 'HIDDEN') {
        togglePropertiesPanel('SHOW');
    }

    // OR pass a reliable identifier?
    var objType = '';  // 'node' | 'edge' | ?
    var objName = '';      // eg, 'Chordata'
    var objID = null; 
    var objSource = null;  // eg, 'ottol' (a domSource)
    var displayID = null;  // eg, 'ottol@2345' or 'otol.draft.22@4'

    var displayName = 'Unnamed object';
    // build a series of named sections for complex objects, eg, a node + its edge(s)
    var orderedSections = [ ];

    // build a series of label / value pairs to display in standard format
    var metaMap = {};  // this should be replaced in synthetic-tree views

    // examine incoming data to figure out what it is, and what to show
    if (typeof(objInfo.nodeID) !== 'undefined') {
        // this is minimal node info (nodeID, domSource, nodeName) from an argus node
        // OR it's an edge with metadata for it and its adjacent (child) node
        objType = (objInfo.type) ? objInfo.type : 'node';
        objName = objInfo.nodeName;
        objID = objInfo.nodeID;
        objSource = objInfo.domSource || '?';
    } else if (typeof(objInfo.nodeid) !== 'undefined') {
        // this is minimal node info (nodeID, domSource, nodeName) from an argus node
        // OR it's an edge with metadata for it and its adjacent (child) node
        objType = (objInfo.type) ? objInfo.type : 'node';
        objName = objInfo.name;
        objID = objInfo.nodeid;
        objSource = objInfo.domSource || '?';
    } else {
        // what's this?
        debugger;
    }

    // read more data from the existing tree-view JSON?
    if (argus.treeData) {

        // fetch additional information used to detail provenance for nodes and edges
        metaMap = argus.treeData.sourceToMetaMap;

        // Gather data for all displayed properties, storing each in the most
        // appropriate section
        switch(objType) {
            case 'node':
            case 'edge':
                /* Try to spell out any available properties / provenance, based on
                 * type. Note that we're going to conflate node and edge properties, 
                 * since this is generally a 1:1 relationship, but:
                 *   - clicking an edge trigger will highlight edge properties
                 *   - if there are multiple edges, others will be dimmed
                 */
                var fullNode, parentNode, nodeSection, edgeSection;
   
                // try to fetch the node from treeData, using ID (preferred) or name
                fullNode = argus.getArgusNodeByID( objID ); 
                if (!fullNode) {
                    console.log("WARNING: can't find node by ID, trying to match its name...");
                    fullNode = getTreeDataNode( function(node) {
                        return (node.name === objName); 
                    });
                }
                if (fullNode && fullNode.parentNodeID) {
                    parentNode = argus.getArgusNodeByID( fullNode.parentNodeID );
                }

                // Show node and adjacent edge(s), highlighting whichever part
                // was chosen by the user.
                //
                // TODO: show additional edge sections if there are multiple parents,
                // and highlight (.selected) one if it was chosen
                nodeSection = {
                    name: 'Node properties',
                    displayedProperties: {},
                    selected: (objType === 'node')
                };
                orderedSections.push(nodeSection);

                if (parentNode) {
                    edgeSection = {
                        name: 'Edge to parent <em>'+ parentNode.name +'</em>',
                        displayedProperties: {},
                        selected: (objType === 'edge')
                    };
                    orderedSections.push(edgeSection);
                }

                if (objSource === '?') {
                    // worst case, assume the node is native to the tree we're currently viewing
                    objSource = argus.domSource;
                }

                if (fullNode) {
                    /* dump all node properties
                    console.log("YES, found the full node... ");
                    for (var pp in fullNode) {
                        console.log(" fullNode."+ pp +" = "+ fullNode[pp]);
                    }
                    */

                    // override incoming name and ID, but only if they're missing
                    if (!objName) {
                        objName = buildNodeNameFromTreeData( fullNode );
                    }

                    /* show ALL taxonomic sources (taxonomies + IDs) for this node
                     * TODO: Handle whatever schemes we use for multiple sources; for now,
                     * they look like one of the following (in order of preference):
                      
                       EXAMPLE w/ multiple sources (new format):  
                       fullNode.taxSourceArray: [
                           { "foreignID": "2", "taxSource": "ncbi" },
                           { "foreignID": "3", "taxSource": "gbif" }
                       ]

                       EXAMPLE w/ multiple sources (old format):
                       fullNode.taxSource: "ncbi:2157,gbif:6101330"

                       EXAMPLE w/ one source:
                       fullNode.taxSource: "gbif:6101330"

                     */
                    if (fullNode.taxSourceArray && fullNode.taxSourceArray.length > 0) {
                        nodeSection.displayedProperties['Source taxonomy'] = [];
                        for (var tsPos = 0; tsPos < fullNode.taxSourceArray.length; tsPos++) {
                            var taxSourceInfo = fullNode.taxSourceArray[tsPos];
                            nodeSection.displayedProperties['Source taxonomy'].push({
                                taxSource: taxSourceInfo.taxSource,
                                taxSourceId: taxSourceInfo.foreignID
                            });
                        }
                    } else if (fullNode.taxSource) {
                        nodeSection.displayedProperties['Source taxonomy'] = [];
                        var taxSources = fullNode.taxSource.split(',');
                        for (var tsPos = 0; tsPos < taxSources.length; tsPos++) {
                            var taxSourceInfo = taxSources[tsPos].split(':');
                            if (taxSourceInfo.length === 2) {
                                nodeSection.displayedProperties['Source taxonomy'].push({
                                    taxSource: taxSourceInfo[0],
                                    taxSourceId: taxSourceInfo[1]
                                });
                            }
                        }
                    }

                    if (fullNode.ottId) {
                        nodeSection.displayedProperties['Reference taxonomy'] = [];
                        //nodeSection.displayedProperties['OTT ID'] = fullNode.ottolId;
                        nodeSection.displayedProperties['Reference taxonomy'].push(
                            {
                                taxSource: "OTT",
                                taxSourceId: fullNode.ottId
                            }
                        );
                    }
                    
                    // show taxonomic rank separate from source taxonomies (we don't know from whence it came)
                    if (typeof fullNode.taxRank !== 'undefined') {
                        nodeSection.displayedProperties['Taxonomic rank'] = fullNode.taxRank;
                    }

                    if (typeof fullNode.nTipDescendants !== 'undefined') {
                        if (fullNode.nTipDescendants === 0) {
                            nodeSection.displayedProperties['Leaf node (no descendant tips)'] = '';
                        } else {
                            nodeSection.displayedProperties['Descendant tips'] = (fullNode.nTipDescendants || 0).toLocaleString();
                            // OR 'Clade members'? 'Leaf taxa'?
                        }
                    }

                    // Show ALL source trees (phylo-trees + IDs) for this node

                    // add basic edge properties (TODO: handle multiple edges!?)
                    var fullNodeSupporters = getSupportingSourceIDs( fullNode );
                    if (fullNodeSupporters) {
                        if (edgeSection) {
                            edgeSection.displayedProperties['Supported by'] = fullNodeSupporters;
                        } else {
                            console.log('>>> No edgeSection found for this node:');
                            console.log(fullNode);
                        }
                    }

                    // add another section to explain an "orphaned" taxon (unconnected to other nodes in the tree)
                    if (('hasChildren' in fullNode) && (fullNode.hasChildren === false)
                     && ('pathToRoot' in fullNode) && (fullNode.pathToRoot.length === 0)) {
                        orphanSection = {
                            name: 'Where is the surrounding tree?',
                            displayedProperties: {},
                            selected: true
                        };
                        // this should override the highlight of node or edge
                        if (nodeSection) {
                            nodeSection.selected = false;
                        }
                        orderedSections.push(orphanSection);
                        orphanSection.displayedProperties[
                            '<p>This taxon exists in our taxonomy but is not connected to any other taxa in the'
                           +' synthetic tree. This happens when the taxon is non-monphyletic in contributed'
                           +' phylogenies. To contribute a phylogeny that supports monophyly of this taxon, use'
                           +' our <a href="/curator" target="_blank">study curation application</a>.</p>'] = '';
                        // TODO: Explain in more detail: Why is this disconnected from other nodes?
                    }
                } else {
                    console.log("NO full node found for this node!");
                }

                break;

            default:
                // NOT CURRENTLY USED
                console.log(">> WARNING - unexpected object type '"+ objType +"'!");
        }
    } else {
        console.log(">> WARNING - no treeData to examine?");
    }

    // start filling in the panel from the top

    displayName = (objName) ? objName : ("Unnamed "+ objType);
    jQuery('#provenance-panel .provenance-title').html( displayName );

    /* Clear and rebuild collection of detailed properties, adapting to special
     * requirements as needed:
     *  - multiple values (add multiple DD elements)
     *  - things requiring special lookup in metaMap
     */
    var $sections = $('#provenance-panel .ordered-sections');
    $sections.empty();  // clear any existing displayed sections

    // remove any old thumbnail image
    $('#provenance-panel .taxon-image').remove();
    // for nodes, load supporting information and a thumbnail silhouette from PhyloPic
    switch (objType) {
        case 'node':
        case 'edge':
            var fullNode = argus.getArgusNodeByID( objID );
            var objSupporters = null;
            if (fullNode) {
                objSupporters = getSupportingSourceIDs( fullNode );
            } else {
                objSupporters = getSupportingSourceIDs( objInfo );
            }
            if (objSupporters) {
                // fetch full supporting info, then display it
                $.each(objSupporters, function(i, sourceID) {
                    if (sourceID === 'taxonomy') {
                        // this supporting data is already in arguson
                    } else {
                        // it's a study; call the index to get full details
                        sourceMetadata = argus.treeData.sourceToMetaMap[ sourceID ];
                        if ((typeof sourceMetadata['sourceDetails'] === 'undefined') && (sourceMetadata['loadStatus'] !== 'PENDING')) {
                            // don't keep sending requests for the same source! we manage this with 'loadStatus'
                            sourceMetadata['loadStatus'] = 'PENDING';
                            ///console.warn('>>>>>>>>>>>>>>> sourceDetails NOT FOUND for sourceID '+ sourceID +', FETCHING NOW...');
                            $.post(
                                singlePropertySearchForStudies_url, // JSONP fetch URL
                                {   // POSTed data
                                    "property": "ot:studyId",
                                    "value": (sourceMetadata).study_id,
                                    verbose: true
                                },
                                function(data) {    // JSONP callback
                                    // reset this locally, to MAKE SURE we've got the right box
                                    ///console.warn('<<<<<<<<<<<<<<< BACK FROM FETCH for sourceID '+ sourceID);
                                    var cbSourceMetadata = argus.treeData.sourceToMetaMap[ sourceID ];
                                    // ignore this if not requested, or already complete
                                    if (cbSourceMetadata['loadStatus'] === 'PENDING') {
                                        if (data.matched_studies && (data.matched_studies.length > 0)) {
                                            if (data.matched_studies.length > 1) {
                                                console.log(">>>> EXPECTED to find one matching study for id '"+ (cbSourceMetadata).study_id +"', not multiple:");
                                                console.log(data);
                                            }
                                            var studyInfo = data.matched_studies[0];
                                            cbSourceMetadata['sourceDetails'] = studyInfo;
                                            cbSourceMetadata['loadStatus'] = 'COMPLETE';
                                            // Nudge for a refresh of the properties display?
                                            showObjectProperties( objInfo );
                                        } else {
                                            console.log(">>>> EXPECTED to find a matching study for id '"+ (cbSourceMetadata).study_id +"', not this:");
                                            console.log(data);
                                            cbSourceMetadata['loadStatus'] = 'FAILED';
                                        }
                                    }
                                }
                            );
                        }
                    }
                });
            }
            if (objInfo['phyloPicStatus'] !== 'PENDING') {
                // fetch a PhyloPic image (just once!), then show it when it returns
                objInfo['phyloPicStatus'] = 'PENDING';
                $.getJSON(
                    '/phylopic_proxy/api/a/name/search?callback=?',  // JSONP fetch URL
                    {   // GET data
                        text: objName,
                        options: 'icon illustrated' // uid? string?
                    },
                    function(data) {    // JSONP callback
                        if (data.result && (data.result.length > 0) && data.result[0].icon && data.result[0].icon.uid) {
                            $('#provenance-panel .provenance-title').after(
                                '<img class="taxon-image" src="/phylopic_proxy/assets/images/submissions/'+ data.result[0].icon.uid 
                                +'.icon.png" title="Click for image credits"/>'       // 'thumb.png' = 64px, 'icon.png' = 32px and blue
                            );
                            $('#provenance-panel .taxon-image').unbind('click').click(function() {
                                window.open('http://phylopic.org/image/'+ data.result[0].icon.uid +'/', '_blank');
                            });
                        }
                    }
                );
            }
    }

    var sectionPos, sectionCount = orderedSections.length, 
        aSection, dLabel, dValues, i, rawVal, displayVal = '', moreInfo;
    for (sectionPos = 0; sectionPos < sectionCount; sectionPos++) {
        var aSection = orderedSections[sectionPos];
        // We now treat the node and edge as a single target, so no distinction is required
        var useHighlight = false;  // (orderedSections.length > 1) && aSection.selected;
        $newSection = $('<div class="properties-section '+ (useHighlight ? 'selected' : '') +'"><'+'/div>');
        $newSection.append( '<div class="section-title">'+ aSection.name +'<'+'/div>');
        $sections.append($newSection);
        $details = $('<dl><'+'/dl>');
        // pad the details area below a multi-line title
        var extraPadding = ($newSection.find('.section-title').height() - 20) +'px';
        $details.css('padding-top', extraPadding);
        $newSection.append($details);
        for(dLabel in aSection.displayedProperties) {
            switch(dLabel) {
                case 'Source taxonomy':
                case 'Reference taxonomy':
                    var sourceList = aSection.displayedProperties[dLabel];
                    for (i = 0; i < sourceList.length; i++) {
                        var sourceInfo = sourceList[i];
                        // build boilerplate URLs for common taxonomies
                        switch(sourceInfo.taxSource.trim().toUpperCase()) {
                            case 'NCBI':
                                displayVal = '<a href="http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id='+ sourceInfo.taxSourceId +'" '
                                              + 'title="NCBI Taxonomy" target="_blank">NCBI: '+ sourceInfo.taxSourceId +'</a>';
                                break;

                            case 'GBIF':
                                displayVal = '<a href="http://www.gbif.org/species/'+ sourceInfo.taxSourceId +'/" '
                                              + 'title="GBIF Backbone Taxonomy" target="_blank">GBIF: '+ sourceInfo.taxSourceId +'</a>';
                                break;

                            case 'H2007':
                                displayVal = '<a href="http://dx.doi.org/10.6084/m9.figshare.915439#'+ sourceInfo.taxSourceId +'" '
                                              + 'title="Hibbett 2007 updated" target="_blank">Hibbett et al. 2007 updated: '+ sourceInfo.taxSourceId +'</a>';
                                break;

                            case 'IF':
                                displayVal = '<a href="http://www.indexfungorum.org/names/NamesRecord.asp?RecordID='+ sourceInfo.taxSourceId +'" '
                                              + 'title="Index Fungorum" target="_blank">Index Fungorum: '+ sourceInfo.taxSourceId +'</a>';
                                break;

                            case 'IRMNG':
                                displayVal = '<a href="http://www.marine.csiro.au/mirrorsearch/ir_search.taxon_info?id='+ sourceInfo.taxSourceId +'" '
                                              + 'title="Interim Register of Marine and Nonmarine Genera" target="_blank">IRMNG: '+ sourceInfo.taxSourceId +'</a>';
                                break;

                            case 'WORMS':
                                displayVal = '<a href="http://www.marinespecies.org/aphia.php?p=taxdetails&id='+ sourceInfo.taxSourceId +'" '
                                              + 'title="World Registry of Marine Species" target="_blank">WoRMS: '+ sourceInfo.taxSourceId +'</a>';
                                break;

                            case 'MB':
                                displayVal = '<a href="http://www.mycobank.org/MB/'+ sourceInfo.taxSourceId +'/" '
                                              + 'title="Mycobank" target="_blank">Mycobank: '+ sourceInfo.taxSourceId +'</a>';
                                break;

                            case 'SILVA':
                                displayVal = '<a href="http://www.arb-silva.de/browser/ssu/silva/'+ sourceInfo.taxSourceId +'" '
                                              + 'title="SILVA Taxonomy" target="_blank">SILVA: '+ sourceInfo.taxSourceId +'</a>';
                                break;

                            case 'STUDY713':
                                displayVal = '<a href="http://dx.doi.org/10.1186/1471-2148-10-352#'+ sourceInfo.taxSourceId +'" '
                                              + 'title="Schäferhoff et al. 2010" target="_blank">Schäferhoff et al. 2010: '+ sourceInfo.taxSourceId +'</a>';
                                break;

                            case 'OTT': 
                                /* browse the OTT taxonomy in *local* window? or in a new one?
                                displayVal = '<a href="/opentree/argus/ottol@'+ sourceInfo.taxSourceId +'" '
                                              + 'title="OTT Taxonomy" target="_blank">OTT: '+ sourceInfo.taxSourceId +'</a>';
                                */
                                displayVal = '<span style="color: #777;" title="Open Tree of Life Reference Taxonomy (no URL provided)">'+ sourceInfo.taxSource.trim() +': '+ sourceInfo.taxSourceId +'</span>';
                                break;

                            default:
                                displayVal = '<span style="color: #777;" title="No URL for this taxonomy">'+ sourceInfo.taxSource.trim() +': '+ sourceInfo.taxSourceId +'</span>';
                                break;
                        }

                        $details.append('<dt>'+ dLabel +'</dt>');
                        $details.append('<dd>'+ displayVal +'</dd>');
                    }
                    break;

                case 'Supported by':

                    //var supportingStudyIDs = [ ];  // don't repeat studies under 'Supported by', but gather trees for each!
                    var supportedByTaxonomy = false;
                    var supportingTaxonomyVersion, supportingTaxonomyVersionURL;
                    var ottInfo = argus.treeData.sourceToMetaMap['taxonomy'];
                    if ('version' in ottInfo) {
                        supportingTaxonomyVersion = ottInfo['version'];
                        var simpleVersion = supportingTaxonomyVersion.split('draft')[0];
                        supportingTaxonomyVersionURL = '/about/taxonomy-version/ott'
                            + simpleVersion;
                    } else {
                        supportingTaxonomyVersion = 'Not found';
                        supportingTaxonomyVersionURL = '/about/taxonomy-version';
                    }
                    var supportingStudyInfo = { };  // don't repeat studies under 'Supported by', but gather trees for each *then* generate output
                    // if we're still waiting on fetched study info, add a message to the properties window
                    var waitingForStudyInfo = false;

                    dValues = String(aSection.displayedProperties[dLabel]).split(',');
                    for (i = 0; i < dValues.length; i++) {
                        rawVal = dValues[i];
                        var metaMapValues = null;
                        if (rawVal === 'taxonomy') {
                            // this will be added below any supporting studies+trees
                            supportedByTaxonomy = true;
                            metaMapValues = parseMetaMapKey( 'taxonomy' );
                            continue;
                        }

                        // look for study information in the metaMap
                        if (metaMap) {
                            moreInfo = metaMap[ rawVal ];
                        }

                        if (typeof moreInfo === 'object' && 'sourceDetails' in moreInfo) {
                            // Study details, fetched via AJAX as needed
                            
                            // adapt to various forms of meta-map key
                            metaMapValues = parseMetaMapKey( rawVal );
                            if (!(metaMapValues.studyID in supportingStudyInfo)) {
                                // add this study now, plus an empty trees collection
                                supportingStudyInfo[ metaMapValues.studyID ] = $.extend({ supportingTrees: {} }, moreInfo.sourceDetails);
                            }
                            // add the current tree 
                            supportingStudyInfo[ metaMapValues.studyID ].supportingTrees[ metaMapValues.treeID ] = {};
                            // TODO: add more info in data objects, e.g., a descriptive tree label

                        } else if (moreInfo && !('study' in moreInfo)) {
                            if (moreInfo['loadStatus'] === 'PENDING') {
                                ///console.log('>>> study data is PENDING...');
                            } else {
                                console.error("! expected a study, but found mysterious stuff in metaMap:");
                                for (p2 in moreInfo) {
                                    console.error("  "+ p2 +" = "+ moreInfo[p2]);
                                }
                            }
                            waitingForStudyInfo = true;
                        } else {
                            // when in doubt, just show the raw value
                            console.error("! Expecting to find moreInfo and a study (dLabel="+ dLabel +", rawVal="+ rawVal +")");
                            waitingForStudyInfo = true;
                        }
                    }
                    // Now that we've gathered all trees for all studies, show organized results by study, with taxonomy LAST if found

                    // clear any previously added 'Supported by' information (probably still fetching details)
                    $details.find('dt.loading-supporting-studies').remove();

                    if (waitingForStudyInfo) {
                        $details.append('<dt class="loading-supporting-studies">Loading supporting studies...</dt>');
                    } else {
                        // we have all the details, try to show supporting studies
                        for (studyID in supportingStudyInfo) { 
                            ///console.log(">>> study data for "+ studyID +" is COMPLETE, adding it now...");
                            var studyInfo = supportingStudyInfo[ studyID ]; 
                            var pRef, pCompactYear, pCompactPrimaryAuthor, pCompactRef, pDOITestParts, pURL, pID, pCurator;
                            // assemble and display study info
                            pRef = studyInfo['ot:studyPublicationReference'];
                            // be careful, in case we have an incomplete or badly-formatted reference
                            if (pRef) {
                                // we'll show full (vs. compact) reference for each study
                                displayVal = '<div class="full-ref">'+ pRef +'</div>';

                                /* compact ref logic, if needed later
                                pCompactYear = pRef.match(/(\d{4})/)[0];  
                                    // capture the first valid year
                                pCompactPrimaryAuthor = pRef.split(pCompactYear)[0].split(',')[0];
                                    // split on the year to get authors (before), and capture the first surname
                                pRefCompact = pCompactPrimaryAuthor +", "+ pCompactYear;    // eg, "Smith, 1999";
                                displayVal += pRefCompact;
                                */
                            }

                            // publication URL should always be present, non-empty, and a valid URL
                            pURL = studyInfo['ot:studyPublication'];
                            if (pURL) {
                                displayVal += 'Full publication: <a href="'+ pURL +'" target="_blank" title="Permanent link to the full study">'+ pURL +'</a><br/>';
                            }
                            
                            pID = studyInfo['ot:studyId'];
                            if (pID) {
                                /* Phylografter link
                                displayVal += ('Open Tree curation: <a href="http://www.reelab.net/phylografter/study/view/'+ pID +'" target="_blank" title="Link to this study in Phylografter">Study '+ pID +'</a>');
                                */
                                displayVal += (
                                    'Open Tree curation of this study: <a href="/curator/study/view/'+ pID +'" target="_blank" title="Link to this study in curation app">'+ pID +'</a><br/>'
                                  + 'Supporting '+ (studyInfo.supportingTrees.length > 1 ? 'trees:' : 'tree:')
                                );
                                for (var treeID in studyInfo.supportingTrees) {
                                    displayVal += (
                                        '&nbsp; <a href="/curator/study/view/'+ pID +'?tab=trees&tree=tree'+ treeID +'" '
                                      + 'target="_blank" title="Link to this supporting tree in curation app">tree'+ treeID +'</a>'
                                    );
                                }
                            }

                            pCurator = studyInfo['ot:curatorName'];
                            if (pCurator) {
                                displayVal += ('<div class="full-ref-curator">Curated by: '+ pCurator +'</div>');
                            }

                            $details.append('<dt>'+ dLabel +'</dt>');
                            $details.append('<dd>'+ displayVal +'</dd>');
                        }
                    }
                    if (supportedByTaxonomy) {
                        $details.append('<dt>Supported by taxonomy</dt>');
                        $details.append('<dd>'+ supportingTaxonomyVersion 
                                +' &nbsp;<a href="'+ supportingTaxonomyVersionURL
                                +'" target="_blank">(OTT and version information)</a></dd>');
                    }
                    $details.find('.full-ref-toggle').unbind('click').click(function() {
                        var $itsReference = $(this).nextAll('.full-ref, .full-ref-curator');
                        if ($itsReference.is(':visible')) {
                            $itsReference.hide();
                        } else {
                            $itsReference.show();
                        }
                        return false;
                    });
                    break;
            
                default:
                    // general approach, just show the raw value
                    displayVal = aSection.displayedProperties[dLabel];
                    $details.append('<dt>'+ dLabel +'</dt>');
                    $details.append('<dd>'+ displayVal +'</dd>');
            }
        }
    }
    $sections.append(
        '<a class="badge" style="position: relative; top: -1em;" '
      +  'onclick="toggleCommentsPanel(\'SHOW\'); return false;">'
      +   '<i class="icon-comment icon-white"></i> Add a comment'
      +'</a>');
    // OR ('Add a comment on this '+ objType), IF we can target that object

    // offer subtree extraction, if available for this target
    // we can restrict the depth, if needed to avoid monster trees
    var subtreeDepthLimit = 4;
    if (nodeSection) {
        $details = $sections.find('.properties-section:first dl');
        // Offer to download Newick string for this subtree, OR link to the
        // main download page if it's too large (based on the number of
        // descendant tips)
        var maxTipsForNewickSubtree = 10000;
        if ((typeof fullNode.nTipDescendants !== 'number') || (fullNode.nTipDescendants > maxTipsForNewickSubtree)) {
            // when in doubt (e.g. nodes on the rootward path), offer the full download
            $details.append('<dt>Download subtree as Newick string</dt>');
            $details.append('<dd>This tree is too large to download through webservices, but you can '
                          + '<a target="_blank" href="http://files.opentreeoflife.org/trees/">download the entire synthetic tree as Newick</a></dd>');
        } else {
            $details.append('<dt><a id="extract-subtree" href="#">Download subtree as Newick string</a></dt>');
          
            // we can fetch a subtree using an ottol id (if available) or Neo4j node ID
            var idType = (objSource == 'ottol') ? 'ottol-id' : 'node-id';
            var fetchID = (objSource == 'ottol') ? fullNode.sourceID : (fullNode.nodeid || fullNode.nodeID);
            // Choose from among the collection of objSources
            $('#extract-subtree')
                .css('color','')  // restore normal link color
                .unbind('click').click(function() {
                    // Make this name safe for use in our subtree download URL
                    var superSafeDisplayName = makeSafeForWeb2pyURL(displayName);
                    var downloadURL = '/opentree/default/download_subtree/'+ idType +'/'+ fetchID +'/'+ superSafeDisplayName;
                    ///console.log(downloadURL);
                    window.location = downloadURL;
                    return false;
                });
        }

        // for proper taxon names (not nodes like '[Canis + Felis]'), link to EOL
        if ((displayName.indexOf('Unnamed ') !== 0) && 
            (displayName.indexOf('(untitled ') !== 0) && 
            (displayName.indexOf('[') !== 0)) {
            // Attempt to find a page for this taxon in the Encyclopedia of Life website
            // N.B. This 'external-links' list can hold similar entries.
            
            // Make this name safe for use in our EOL search URL
            // (prefer '+' to '%20', but carefully encode other characters)
            var urlSafeDisplayName = encodeURIComponent(displayName).replace(/%20/g,'+');  
            $details.after('<ul class="external-links"><li><a target="_blank" href="http://eol.org/search?q='+ urlSafeDisplayName +'" id="link-to-EOL">Search EOL for \''+ displayName +'\'</a></li></ul>');
        }
    }

}

function getTreeDataNode( filterFunc, testNode ) {
    // helper method to retrieve a matching node from n-level treeData (tree-view JSON)
    if (!testNode) { 
        // start at top-most node in tree, if not specified
        testNode = argus.treeData; 
    }
    // test the target node against our requirements (eg, a particular node ID)
    if (filterFunc(testNode)) {
        return testNode;
    }
    if (testNode === argus.treeData) {
        // check for a matching ancestor (walk the path toward the root node)
        var foundAncestor = null;
        $.each(testNode.pathToRoot, function(i, testNode) {
            if (filterFunc(testNode)) {
                foundAncestor = testNode;
                return false;
            }
        });
        if (foundAncestor) {
            return foundAncestor;
        }
    }
    // still here? then recurse to test this node's children, returning any match found
    var foundDescendant = null;
    if (typeof testNode.children !== 'undefined') {
        var numChildren = testNode.children.length;
        for (var c = 0; c < numChildren; c++) {
            foundDescendant = getTreeDataNode( filterFunc, testNode.children[c] );
            if (foundDescendant) {
                // stop as soon as we have a match
                break;
            }
        }
    }
    // return any match found (or null)
    return foundDescendant;
}

function nodeDataLoaded( nodeTree ) {
    // this callback from argObj.loadData() provides additional node data
    // nodeTree is actually a mini-tree of nodes

    //var targetNode = (nodeTree.children) ? nodeTree.children[0] : nodeTree;
    // TODO: revisit this logic, based on different tree/view types
    var targetNode = nodeTree;

    // @TEMP - decorate the incoming dataTree with saved OTTOL info
    // (Ideally, the tree-view JSON would come with these properties for all nodes)
    if (incomingOttolID) {
        targetNode.domSource = 'ottol';
        targetNode.sourceID = incomingOttolID;
        incomingOttolID = null;
    }

    var newState;
    if ( History && History.enabled && pageUsesHistory ) {
        newState = $.extend( History.getState().data, {nodeName: targetNode.name});
    } else {
        newState = {nodeName: targetNode.name};
    }

    // update page title and page contents
    jQuery('#main-title .comments-indicator, #main-title .properties-indicator').show();
    jQuery('#main-title .title').html( historyStateToPageHeading( newState ) );

    // if the current node has conflicts, offer a toggle to hide/show them
    if (argus.getToggleConflictsHandler() === null) {
        jQuery('.toggle-conflicts').hide();
    } else {
        jQuery('.toggle-conflicts').show();
    }

    // nudge static viewer to show second line, if any
    snapViewerFrameToMainTitle();
    
    // now that we have all view data, update the comments and comment editor
    loadLocalComments();
    
    // update properties (provenance) panel to show the target node
    // NOTE that we won't show it automatically if we're on a narrow screen
    showObjectProperties( targetNode, (currentScreenSize() === 'PHONE' ? 'HIDDEN' : null) );
}
function snapViewerFrameToMainTitle() {
    var mainTitleBottom = $('#main-title').offset().top + $('#main-title').outerHeight();
    jQuery('#viewer-collection').css('top', mainTitleBottom);
}
$(window).resize( function () {
    snapViewerFrameToMainTitle();
});

$('a.btn-navbar[data-target=".nav-collapse"], a.dropdown-toggle').click(function () {
    setTimeout(
        snapViewerFrameToMainTitle,
        500
    );
});

// examples of changing state (see also https://developer.mozilla.org/en-US/docs/DOM/Manipulating_the_browser_history)
if (false) {
    // pushState adds to history
    History.pushState({state:1}, "State 1", "?state=1"); // logs {state:1}, "State 1", "?state=1"
    History.pushState({state:2}, "State 2", "?state=2"); // logs {state:2}, "State 2", "?state=2"
    // replaceState modifies the current history entry (no extra junk in Back/Fwd navigation)
    History.replaceState({state:3}, "State 3", "?state=3"); // logs {state:3}, "State 3", "?state=3"

    // NOTE that the state object can include anything, eg, 
    newState = {
        viewer:'argus', 
        domSource:'ottol', 
        nodeID:'12321', 
        viewport:'24,201,0,800'
    }
    History.pushState(newState, "Something changed!", "?state=4"); // logs {}, '', "?state=4"
    // Is a distinct URL needed to recover state from a pasted URL? How robust is this?

    History.pushState(null, null, "?state=4"); // logs {}, '', "?state=4"

    History.back(); // logs {state:3}, "State 3", "?state=3"
    History.back(); // logs {state:1}, "State 1", "?state=1"
    History.forward(); 
    History.go(2); // this is *relative* to the current index (position) in history! ie, .go(-1) is the same at back()
}

function showErrorInArgusViewer( msg, details ) {
    var errorHTML; 
    if (!details) {
        errorHTML = '<p style="margin: 8px 12px;">'+ msg +'</p>';
    } else {
        errorHTML = '<p style="margin: 8px 12px;">'+ msg +'&nbsp; &nbsp; '
        + '<a href="#" onclick="$(\'#error-details\').show(); return false;">Show details</a></p>'
        + '<p id="error-details" style="margin: 8px 12px; font-style: italic; display: none;">'+ details +'</p>';
    }
    $('#argusCanvasContainer').css('height','500px').html( errorHTML );
}

function toggleTreeViewLegend() {
    $('#tree-view-legend').modal('show');
}

function parseMetaMapKey( key ) {
    // Adapt to various forms of meta-map key and return any components found as an object
    // EXAMPLE: '1234_987' is '{STUDY-ID}_{TREE-ID}'
    // EXAMPLE: 'pg_1144_5800_ba25a3fef742afd8cf52459e8d054737d062fe37' is '{STUDY-ID-WITH-PREFIX}_{TREE-ID}_{COMMIT-SHA}'
    var props = {
        studyID: null,
        treeID: null,
        commitSHA: null
    };
    
    var keyParts = key.split('_');
    // N.B. Study ID might have a prefix!
    if (isNaN( parseInt( keyParts[0] ) )) {
        // remove and concatenate the first TWO parts
        props.studyID = keyParts.shift() +'_'+ keyParts.shift();
    } else {
        // remove just the FIRST part
        props.studyID = keyParts.shift();
    }
    // Next value should be the supporting tree id
    props.treeID = keyParts.shift();
    // Any remaining part should be a commit SHA
    switch( keyParts.length ) {
        case 0:
            // no commit SHA was found
            break;
        case 1:
            props.commitSHA = keyParts[0];
            break;
        default:
        console.error('Expected just one more part (or none) in this key: ['+ key +']');
    }

    return props;
}

/* provide string-trimming functions in older browsers */
if (!String.prototype.trim) {
    String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g, '');};
}
if (!String.prototype.trimLeft) {
    String.prototype.trimLeft=function(){return this.replace(/^\s+/,'');};
}
if (!String.prototype.trimRight) {
    String.prototype.trimRight=function(){return this.replace(/\s+$/,'');};
}
