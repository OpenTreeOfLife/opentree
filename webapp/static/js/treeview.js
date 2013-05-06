/*
 * Subscribe to history changes (adapted from History.js boilerplate) 
 */

var History = window.History; // Note: capital H refers to History.js!
// History.js can be disabled for HTML4 browsers, but this should not be the case for opentree!

// TODO: Add other tests to see if we're on a history-aware page of the opentree site (vs. static "about" pages, etc)?
var pageUsesHistory = true;

// keep a global pointer to the argus instance
var argus;

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
                        var itsNodeID = $link.attr('href');
                        var itsName = $link.html()
                        $link.attr('href', '/opentree/'+ "ottol" +'@'+ itsNodeID +'/'+ itsName);  // TODO: set domSource how???
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
    ///return ('?viewer='+ stateObj.viewer +'&node='+ stateObj.domSource +':'+ stateObj.nodeID +'&nodeName='+ stateObj.nodeName);
    return '/opentree'+ (stateObj.viewer ? '/'+stateObj.viewer : '') +'/'+ stateObj.domSource +'@'+ stateObj.nodeID + (stateObj.nodeName ?  '/'+stateObj.nodeName : '');
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
    console.log('> showObjectProperties for : '+ objInfo);
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
   
    // read more data from the existing tree-view JSON?
    if (argus.treeData) {
        switch(objType) {
            case 'node':
                if (objSource === '?') {
                    // assume the tree we're currently viewing (otherwise it would be 'ottol'..right?)
                    objSource = argus.domSource;
                }

                // try to fetch the node from treeData, using name or ID if we have them
                var fullNode = getTreeDataNode( function(node) {
                    return ((node.nodeid === objID) || (node.name === objName)); 
                });
                if (fullNode) {
                    // override incoming name and ID, but only if they're missing
                    if (!objName) {
                        objName = fullNode.name;
                    }

                    if (!objID) {
                        objID = fullNode.nodeid;
                    }
                }

                break;
            case 'edge':
                // TODO
                break;
        }

        // fetch additional information used to detail provenance for nodes and edges
        metaMap = argus.treeData[0].sourceToMetaMap;
        if (metaMap) {
            // for now, just report these values if found
            for (var p in metaMap) {
                var v = metaMap[p];
                console.log("> metaMap['"+ p +"'] = "+ v);
                for (var p2 in v) {
                    var v2 = v[p2];
                    console.log(">> metaMap."+ p +"['"+ p2 +"'] = "+ v2);
                    for (var p3 in v2) {
                        console.log(">> metaMap."+ p +"."+ p2 +"['"+ p3 +"'] = "+ v2[p3]);
                    }
                }
            }
        } else {
            console.log(">> WARNING - no metaMap to examine?");
        }

        // try to spell out any available properties / provenance, based on type
        switch(objType) {
            case 'node':
                // describe its source tree and node ID
                displayedProperties['Source tree'] = objSource;
                displayedProperties['Source node ID'] = objID;

                break;
            case 'edge':
                // look for 'supportedBy' on the associated (child) node
                var associatedChild = getTreeDataNode( function(node) {
                    return (node.nodeid === objID); 
                });
                console.log("associatedChild? "+ associatedChild);
                if (associatedChild) {
                    console.log("YES, found an associatedChild... supportedBy? "+ associatedChild.supportedBy);

                    for (var pp in associatedChild) {
                        console.log(" child."+ pp +" = "+ associatedChild[pp]);
                    }

                    if (typeof associatedChild.supportedBy !== 'undefined') {
                        displayedProperties['Supported by'] = associatedChild.supportedBy;
                    }
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

    // clear and rebuild collection of detailed properties
    var $details = $('#provenance-panel dl');
    $details.html('');
    for(p in displayedProperties) {
        $details.append('<dt>'+ p +'</dt>');
        $details.append('<dd>'+ displayedProperties[p] +'</dd>');
        // TODO: Adapt to different types of information here:
        //  * multiple values (add multiple DD elements)
        //  * things requiring special lookup in metaMap
    }

    // offer subtree extraction, if available for this target
    // we can restrict the depth, if needed to avoid monster trees
    var subtreeDepthLimit = 4;
    if (objType === 'node') {
        $details.append('<dt style="margin-top: 1em;"><a href="#" id="extract-subtree">Extract subtree</a></dt>');
        $details.append('<dd id="extract-subtree-caveats">&nbsp;</dd>');
      
        if ( objSource == 'ottol' ) {
            // we can fetch a subtree using this ottol id
            var ottolID = objID;
            $('#extract-subtree')
                .css('color','')  // restore normal link color
                .unbind('click').click(function() {
                    window.location = '/opentree/default/download_subtree/'+ ottolID +'/'+ subtreeDepthLimit +'/'+ displayName;

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
        } else {
            // tree extraction not currently supported
            $('#extract-subtree')
                .css('color','#999')  // "dim" this link
                .unbind('click').click(function() {
                    alert('Sorry, subtrees are not currently available for nodes without an OTT id');
                    return false;
                });
            $('#extract-subtree-caveats').html('(not available for nodes without OTT id)');
        }

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

