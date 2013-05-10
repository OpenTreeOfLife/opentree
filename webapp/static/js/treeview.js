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

if ( History.enabled && pageUsesHistory ) {
    // bind to statechange event
    History.Adapter.bind(window,'statechange',function(){ // Note: We are using statechange instead of popstate
        var State = History.getState(); // Note: We are using History.getState() instead of event.state
        History.log(State.data, State.title, State.url);

        $('#main-title').html( 'Loading new view...' );
        $('#node-provenance-panel h3').html('Provenance');

        // fetch the matching synth-tree node ID, then notify argus (trigger data load and/or view change)
        var ottolID = State.data.nodeID;
        if (argus.useSyntheticTree && State.data.domSource == 'ottol') {
            // we'll need to convert to a more volatile node ID for the current tree

            // @TEMP - save this and we'll add it dataTree when it arrives
            incomingOttolID = ottolID;

            var treeNodeID;
            $.ajax({
                type: 'POST',
                url: 'http://opentree-dev.bio.ku.edu:7474/db/data/ext/GoLS/graphdb/getNodeIDForOttolID',
                data: {'ottolID': String(ottolID)},
                success: function(data) {
                    argus.displayNode({"nodeID": data,
                                       "domSource": 'otol.draft.22'});  // WAS State.data.domSource});
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

        // load local comments for the new URL
        // eg, http://localhost:8000/opentree/plugin_localcomments?url=ottol@805080
        var pathParts = State.url.split('/');
        var nodeIdentifier = null;
        $.each(pathParts, function() {
            if (this.indexOf('@') !== -1) {
                nodeIdentifier = this;
            }
        });
        if (!nodeIdentifier) {
            nodeIdentifier = State.url;
        }
        // update comment header (maybe again in the callback, when we have a name)
        $('#comment-header').html('Comments <i>- '+ nodeIdentifier +'</i>');
        $('.plugin_localcomments').parent().load(
            '/opentree/plugin_localcomments',
            {url: nodeIdentifier},
            function() {  // callback
                // update its login link (if any) to use the latest URL
                fixLoginLinks();
                // update the comment count at the top of the page
                var howManyComments = $('.plugin_localcomments .body').length;
                $('#links-to-local-comments a:eq(0)').html(
                    'Comments on this node ('+ howManyComments +')'
                );
            }
        );

    });
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

    // TODO: how should these defaults (borrowed from synthview/index.html) be set?
    argus = createArgus({
      "domSource": "ottol",
      "container": $('#argusCanvasContainer')[0], // get the "raw" element, not a jQuery set
      //"treemachineDomain": "{{=treemachine_domain}}",
      //"taxomachineDomain": "{{=taxomachine_domain}}",
      "useTreemachine": true, // TODO: pivot based on domSource? treeID?
      "useSyntheticTree": true, // TODO: pivot based on domSource? treeID?
      "maxDepth": 3
    });

    if ( History.enabled && pageUsesHistory ) {
        // if there's no prior state, go to the initial target node in the synthetic tree
        var priorState = History.getState();
       
        // Check first for incoming URL that might override prior history
        if (initialState.forcedByURL || !(priorState.data.nodeID)) {
            // apply the state as specified in the URL (or defaults, if prior history is incomplete)
            console.log("Applying state from incoming URL...");
            initialState.nudge = new Date().getTime();
            History.pushState( initialState, historyStateToWindowTitle(initialState), historyStateToURL(initialState));
        } else {
            // nudge the (existing) browser state to view it again
            console.log("Nudging state (and hopefully initial view)...");
            priorState.data.nudge = new Date().getTime();
            History.replaceState( priorState.data, priorState.title, priorState.url );
        }
    } else {
        // force initial argus view using defaults above
        // NOTE: forcing even this through history, to get possible remapping of node IDs
        argus.moveToNode({"nodeID": initialState.nodeID,
                           "domSource": initialState.domSource});
    }

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

    // taxon search on remote site (using JSONP to overcome the same-origin policy)
    $('input[name=taxon-search]').unbind('keyup').keyup(function() {
        var $input = $(this);
        var searchText = $input.val().trim();
        if (searchText.length === 0) {
            $('#search-results').html('');
            return false;
        } else if (searchText.length < 3) {
            $('#search-results').html('<i>Enter three or more letters</i>');
            return false;
        }
        $.getJSON(
            'http://www.reelab.net/phylografter/ottol/autocomplete?callback=?',  // JSONP fetch URL
            { search: searchText },  // data
            function(data) {    // JSONP callback
                $('#search-results').html(data);
                $('#search-results a')
                    .wrap('<div class="search-result"><strong></strong></div>')
                    .each(function() {
                        var $link = $(this);
                        //// WAS constructed literal ('/opentree/'+ "ottol" +'@'+ itsNodeID +'/'+ itsName)
                        var safeURL = historyStateToURL({
                            nodeID: $link.attr('href'), 
                            domSource: 'ottol',
                            nodeName: $link.html(),
                            viewer: 'argus'
                        });
                        $link.attr('href', safeURL);
                    });
            }
        );

    });

});

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
    if (stateObj.nodeName.trim() === '') {
        return (stateObj.domSource +':'+ stateObj.nodeID +' - opentree');
    }
    return (stateObj.nodeName +' - opentree');
}
function historyStateToPageHeading( stateObj ) {
    // show name if possible, else just source+ID
    if (stateObj.nodeName.trim() === '') {
        return ('Unnamed node '+ stateObj.domSource +'@'+ stateObj.nodeID);
    }
    return ('Node \''+ stateObj.nodeName +'\' ('+ stateObj.domSource +'@'+ stateObj.nodeID +')');
}
function historyStateToURL( stateObj ) {
    var safeNodeName = null;
    if (stateObj.nodeName) {
        // replace characters considered unsafe (blocked) by web2py
        safeNodeName = stateObj.nodeName.replace(/[:()]/g, '-');
    }
    return '/opentree'+ (stateObj.viewer ? '/'+stateObj.viewer : '') +'/'+ stateObj.domSource +'@'+ stateObj.nodeID + (safeNodeName ? '/'+ safeNodeName : '');
}

function buildNodeNameFromTreeData( node ) {
    var compoundNodeNameDelimiter = ', ';
    if (node.name) {
        // easy, name was provided
        return node.name;
    }
    // unnamed nodes should show two descendant names as tip taxa (eg, 'dog, cat')
    if (node.descendantNameList) {
        // children aren't in view, but their names are here
        return node.descendantNameList.slice(0,2).join(compoundNodeNameDelimiter);
    }
    // we'll need to build a name from visible children and/or their descendantNamesList
    if (node.children.length < 2) {
        // we need at least two names to do this TODO: CONFIRM
        return null;
    }
    // recurse as needed to build child names, then prune as needed
    var firstChildName = buildNodeNameFromTreeData(node.children[0]);
    var nameParts = firstChildName.split(compoundNodeNameDelimiter);
    firstChildName = nameParts[0];
    var lastChildName = buildNodeNameFromTreeData(node.children[ node.children.length-1 ]);
    nameParts = lastChildName.split(compoundNodeNameDelimiter);
    lastChildName = nameParts[nameParts.length - 1];
    return firstChildName + compoundNodeNameDelimiter + lastChildName;
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

function showObjectProperties( objInfo ) {
    if ($('#provenance-show').is(':visible')) {
        // show property inspector if it's hidden
        $('#provenance-show').click();
    }
    // OR pass a reliable identifier?
    var objType = 'node';  // 'node' | 'edge' | ?
    var objName = '';      // eg, 'Chordata'
    var objID = null; 
    var objSource = null;  // eg, 'ottol' (a domSource)
    var displayID = null;  // eg, 'ottol@2345' or 'otol.draft.22@4'

    var displayName = 'Unnamed object';
    // build a series of label / value pairs to display in standard format
    var displayedProperties = {};
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
        objID = objInfo.nodeiD;
        objSource = '?';
    } else {
        // what's this?
        debugger;
    }
   
    console.log('> showObjectProperties for '+ objType +' "'+ objName +'", ID='+ objID);

    // read more data from the existing tree-view JSON?
    if (argus.treeData) {

        // fetch additional information used to detail provenance for nodes and edges
        metaMap = argus.treeData[0].sourceToMetaMap;
        /* TEST FOR and REPORT metaMap
        if (metaMap) {
            // for now, just report these values if found
            for (var p in metaMap) {
                var v = metaMap[p];
                console.log("> metaMap['"+ p +"'] = "+ v);
                if (typeof v === 'object') {
                    for (var p2 in v) {
                        var v2 = v[p2];
                        console.log(">> metaMap."+ p +"['"+ p2 +"'] = "+ v2);
                        if (typeof v2 === 'object') {
                            for (var p3 in v2) {
                                var v3 = v2[p3];
                                console.log(">>> metaMap."+ p +"."+ p2 +"['"+ p3 +"'] = "+ v3);
                                if (typeof v3 === 'object') {
                                    for (var p4 in v3) {
                                        console.log(">>>> metaMap."+ p +"."+ p2 +"."+ p3 +"['"+ p4 +"'] = "+ v3[p4]);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else {
            console.log(">> WARNING - no metaMap to examine?");
        }
        */

        // try to spell out any available properties / provenance, based on type
        var fullNode = null;
        switch(objType) {
            case 'node':
                // try to fetch the node from treeData, using ID (preferred) or name
                var fullNode = getTreeDataNode( function(node) {
                    return (node.nodeid === objID); 
                });
                if (!fullNode) {
                    fullNode = getTreeDataNode( function(node) {
                        return (node.name === objName); 
                    });
                }

                if (objSource === '?') {
                    // worst case, assume the node is native to the tree we're currently viewing
                    objSource = argus.domSource;
                }

                if (fullNode) {
                    console.log("YES, found the full node... ");

                    for (var pp in fullNode) {
                        console.log(" fullNode."+ pp +" = "+ fullNode[pp]);
                    }

                    // override incoming name and ID, but only if they're missing
                    if (!objName) {
                        objName = buildNodeNameFromTreeData( fullNode );
                    }

                    if (fullNode.ottolId) {
                        displayedProperties['OTT ID'] = fullNode.ottolId;
                    }

                    // show ALL sources (trees + IDs) for this node
                    // TODO: handle whatever scheme we use for multiple sources; for now,
                    // there's just one, or none.
                    if (fullNode.taxSource) {
                        displayedProperties['Source tree'] = [
                            {
                                taxSource: fullNode.taxSource,
                                taxSourceId: fullNode.taxSourceId || '?',
                                taxRank: fullNode.taxRank
                            }
                            // TODO: add more here
                        ];
                    }

                    objID = fullNode.sourceID ? fullNode.sourceID : fullNode.nodeid;
                } else {
                    console.log("NO full node found for this node!");
                }

                break;
            case 'edge':
                // look for 'supportedBy' on the associated (child) node
                var associatedChild = getTreeDataNode( function(node) {
                    return (node.nodeid === objID); 
                });
                if (associatedChild) {
                    console.log("YES, found an associatedChild... ");

                    for (var pp in associatedChild) {
                        console.log(" child."+ pp +" = "+ associatedChild[pp]);
                    }

                    if (typeof associatedChild.supportedBy !== 'undefined') {
                        displayedProperties['Supported by'] = associatedChild.supportedBy;
                    }
                } else {
                    console.log("NO full node found for this edge!");
                }
                break;
        }
    } else {
        console.log(">> WARNING - no treeData to examine?");
    }

    // start filling in the panel from the top
    jQuery('#provenance-panel .provenance-intro').html( 'Properties for '+ objType );

    displayName = (objName) ? objName : ("Unnamed "+ objType);
    jQuery('#provenance-panel .provenance-title').html( displayName );

    /* Clear and rebuild collection of detailed properties, adapting to special
     * requirements as needed:
     *  - multiple values (add multiple DD elements)
     *  - things requiring special lookup in metaMap
     */
    var $details = $('#provenance-panel dl');
    $details.html('');
    var dLabel, dValues, i, rawVal, displayVal = '', moreInfo;
    for(dLabel in displayedProperties) {
        switch(dLabel) {
            case 'Source tree':
                var sourceList = displayedProperties[dLabel];
                for (i = 0; i < sourceList.length; i++) {
                    var sourceInfo = sourceList[i];
                    displayVal = 'tree ID: '+ sourceInfo.taxSource;
                    displayVal += '<br/>node ID: '+ sourceInfo.taxSourceId;
                    if (sourceInfo.taxRank) {
                        displayVal += '<br/>rank: '+ sourceInfo.taxRank;
                    }
                }
                if (sourceList.length > 0) {
                    $details.append('<dt>'+ dLabel +'</dt>');
                    $details.append('<dd>'+ displayVal +'</dd>');
                }

                break;

            default:
                // general approach
                dValues = String(displayedProperties[dLabel]).split(',');
                for (i = 0; i < dValues.length; i++) {
                    $details.append('<dt>'+ dLabel +'</dt>');
                    rawVal = dValues[i];
                    switch(rawVal) {
                        // some values are simply displayed as-is, or slightly groomed
                        case ('taxonomy'):
                            displayVal = 'Taxonomy';
                            break;

                        default:
                            // other values might have more information in the metaMap
                            // EXAMPLE rawVal = 'WangEtAl2009-studyid-15' (a study)
                            moreInfo = metaMap[ rawVal ];
                            if (typeof moreInfo === 'object') {
                                if (moreInfo['study']) {
                                    var pRef, pCompactRef, pRefParts, pDOI, pURL, pID, pCurator;
                                    // assemble and display study info
                                    pRef = moreInfo.study['ot:studyPublicationReference'];
                                    pID = moreInfo.study['ot:studyId'];
                                    if (pID) {
                                        displayVal = ('<a href="http://www.reelab.net/phylografter/study/view/'+ pID +'" target="_blank" title="Link to this study in Phylografter">'+ pID +'</a>. ');
                                    }

                                    pCurator = moreInfo.study['ot:curatorName'];
                                    
                                    // be careful, in case we have an incomplete or badly-formatted reference
                                    if (pRef) {
                                        // we'll show compact reference instead, with full ref a click away
                                        pRefCompact = "Smith, 1999";
                                        pRefParts = pRef.split('doi:');
                                        if (pRefParts.length === 2) {
                                            pDOI = pRefParts[1].trim();
                                            // trim any final period
                                            if (pDOI.slice(-1) === '.') {
                                                pDOI = pDOI.slice(0, -1);
                                            }
                                            // convert any DOI into lookup URL
                                            //  EXAMPLE: doi:10.1073/pnas.0813376106  =>  http://dx.doi.org/10.1073/pnas.0813376106
                                            pURL = 'http://dx.doi.org/'+ pDOI;
                                            displayVal += '<a href="'+ pURL +'" target="_blank" title="Permanent link to the full study">'+ pRefCompact +'</a> <a href="#" class="full-ref-toggle">(full reference)</a><br/>';
                                            displayVal += '<div class="full-ref">'+ pRef +'</div>';
                                        }
                                    }
                                    if (pCurator) {
                                        displayVal += ('<div class="full-ref-curator">Curator: '+ pCurator +'</div>');
                                    }

                                } else {
                                    console.log("! expected a study, but found mysterious stuff in metaMap:");
                                    for (p2 in moreInfo) {
                                        console.log("  "+ p2 +" = "+ moreInfo[p2]);
                                    }
                                }
                            } else {
                                // when in doubt, just show the raw value
                                displayVal = rawVal;
                            }
                    }
                    $details.append('<dd>'+ displayVal +'</dd>');
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
        
        }
    }

    // offer subtree extraction, if available for this target
    // we can restrict the depth, if needed to avoid monster trees
    var subtreeDepthLimit = 4;
    if (objType === 'node') {
        $details.append('<dt style="margin-top: 1em;"><a href="#" id="extract-subtree">Extract subtree</a></dt>');
        $details.append('<dd id="extract-subtree-caveats">&nbsp;</dd>');
      
        // we can fetch a subtree using an ottol id (if available) or Neo4j node ID
        var idType = (objSource == 'ottol') ? 'ottol-id' : 'node-id';
        // Choose from among the collection of objSources
        $('#extract-subtree')
            .css('color','')  // restore normal link color
            .unbind('click').click(function() {
                window.location = '/opentree/default/download_subtree/'+ idType +'/'+ objID +'/'+ subtreeDepthLimit +'/'+ displayName;

                /* OR this will load the Newick-tree text to show it in-browser
                $.ajax({
                    type: 'POST',
                    url: 'http://opentree-dev.bio.ku.edu:7474/db/data/ext/GoLS/graphdb/getDraftTreeForOttolID',
                    data: {
                        'ottolID': String(ottolID),
                        'maxDepth': String(subtreeDepthLimit),
                    },
                    success: function(data) {
                        alert(data.tree);
                    },
                    dataType: 'json'  // should return a complete Newick tree
                });
                */

                return false;
            });
        $('#extract-subtree-caveats').html('(depth limited to '+ subtreeDepthLimit +' levels)');

    }

}

function getTreeDataNode( filterFunc, testNode ) {
    // helper method to retrieve a matching node from n-level treeData (tree-view JSON)
    if (!testNode) { 
        // start at top-most node in tree, if not specified
        testNode = argus.treeData[0]; 
    }
    // test against our requirements (eg, a particular node ID)
    if (filterFunc(testNode)) {
        return testNode;
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

    var improvedState = $.extend( History.getState().data, {nodeName: targetNode.name});
    // add missing information to the current history state
    ///History.replaceState( improvedState.data, improvedState.title, improvedState.url );
    // NO, this causes a loop of updates/history-changes, maybe later..

    // update page title and page contents
    jQuery('#main-title').html( historyStateToPageHeading( improvedState ) );
    
    // TODO: load provenance data for this view (all visible nodes and edges)?
    
    // update properties (provenance) panel to show the target node
    console.log(">>> showing targetNode properties in nodeDataLoaded()...");
    showObjectProperties( targetNode );
}

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

