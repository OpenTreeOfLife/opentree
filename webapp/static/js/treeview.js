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
        $('#node-provenance-panel').html('...');

        // notify argus (trigger data load and/or view change)
        argus.displayNode({"nodeID": State.data.nodeID,
                           "domSource": State.data.domSource});
        
        // we'll finish updating the page in a callback from argusObj.loadData()

        // update all login links to return directly to the new URL (NOTE that this 
        // doesn't seem to work for Logout)
        $('a.login-logout').each(function() {
            var $link = $(this);
            var itsHref = $link.attr('href');
            itsHref = itsHref.split('?')[0];
            itsHref += ('?_next='+ State.url);
            $link.attr('href', itsHref);
        });

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
        $('#comment-header').html('Comments for <i>'+ nodeIdentifier +'</i>');
        $('.plugin_localcomments').parent().load(
            '/opentree/plugin_localcomments',
            {url: nodeIdentifier},
            function() {  // callback
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
    // TODO: move this to main page template, so we can build it from incoming URL in web2py?
    var initialState = $.extend({
        viewer: 'argus', 
        domSource: 'ottol', 
        nodeID: '805080', 
        nodeName: '',  // Acanthopharynx brachycapitata
        viewport: '24,201,0,800',
        forcedByURL: false
    }, urlState); // urlState should been defined in the main HTML view

    argus = createArgus({
      "container": document.getElementById("argusCanvasContainer")
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
        argus.displayNode({"nodeID": initialState.nodeID,
                           "domSource": initialState.domSource});
    }

    // bind toggle for provenance panel
    $('#provenance-toggle').unbind('click').click(function() {
        if ($('#viewer-collection').is('.with-provenance')) {
            $('#viewer-collection').removeClass('with-provenance').addClass('without-provenance');
            $(this).html('Show provenance');
        } else {
            $('#viewer-collection').removeClass('without-provenance').addClass('with-provenance');
            $(this).html('Hide provenance');
        }
        return false;
    });
});

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

function nodeDataLoaded( nodeTree ) {
    // this callback from argObj.loadData() provides additional node data
    // nodeTree is actually a mini-tree of nodes
    var targetNode = nodeTree.children[0];
    var improvedState = $.extend( History.getState().data, {nodeName: targetNode.name});
    // add missing information to the current history state
    ///History.replaceState( improvedState.data, improvedState.title, improvedState.url );
    // NO, this causes a loop of updates/history-changes, maybe later..

    // update page title and page contents
    jQuery('#main-title').html( historyStateToPageHeading( improvedState ) );
    jQuery('#node-provenance-panel').html('...');
    // load provenance data for this view (all visible nodes and edges)

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

