/*
 * Utilities common to multiple pages in the OpenTree webapp.
 * There are also helper functions in webapp/views/layout.html, which
 * should eventually be moved over here.
 */

/*
 * Set of functions that return support & conflict information for nodes
*/

// get all three of the supporting flags
function getSupportingSourceIDs ( node ) {
  return $.extend( {},
                   getSupportedBySourceIDs( node ),
                   getPartialPathSourceIDs( node ),
                   getTerminalSourceIDs( node )
                 );
}

// gets the sources with the supported_by flag
function getSupportedBySourceIDs( node ) {
   return $.isPlainObject(node.supported_by) ? node.supported_by : null;
}

// gets the sources with the partial_path_of flag
function getPartialPathSourceIDs( node ) {
 return $.isPlainObject(node.partial_path_of) ? node.partial_path_of : null;
}

// gets the sources with the conflicts_with flag
function getConflictingSourceIDs( node ) {
   return $.isPlainObject(node.conflicts_with) ? node.conflicts_with : null;
}

// gets the sources with the terminal flag
function getTerminalSourceIDs( node ) {
 return $.isPlainObject(node.terminal) ? node.terminal : null;
}

/*
* Converts a full reference to a compact reference for display in properties panel
* duplicates function with same name in curator/static/js/curation_helpers.js,
* so changes need to be made in both places
*/
 function fullToCompactReference( fullReference ) {
     var compactReference = "(Untitled)";
     if ($.trim(fullReference) !== "") {
         // capture the first valid year in the reference
         var yearMatches = fullReference.match(/(\d{4})/);
         var compactYear = yearMatches ? yearMatches[0] : "[no year]";
         // split on the year to get authors (before), and capture the first surname
         var compactPrimaryAuthor = fullReference.split(compactYear)[0].split(',')[0];
         var compactReference = compactPrimaryAuthor +", "+ compactYear;    // eg, "Smith, 1999";
     }
     return compactReference;
 }

function latestCrossRefURL( url ) {
    /* When showing live hyperlinks to a CrossRef URL, we should update them to
     * conform to [the latest guidelines](https://www.crossref.org/blog/new-crossref-doi-display-guidelines-are-on-the-way/).
     *
     * NOTE that this is for display only! For backward compatibility in
     * phylesystem, we still store the old 'http://dx.doi.org/' form and use
     * it when testing for duplicate studies.
     *
     * Also note that this won't modify other URLs that might appear from time to time.
     *
     * N.B. This duplicates a function with same name in curator/static/js/curation-helpers.js,
     * so changes need to be made in both places
     */
    var latest = url.replace('http://dx.doi.org/', 'https://doi.org/');
    return latest;
}

 /*
 * Returns a hyperlink to the taxonomy browser for a given OTT taxon
 * Note that this function replicated curator/static/js/curation-helpers.js,
 * so changes made here should also be made in other copy
 */
 function getTaxobrowserLink(displayName, ottID) {
     // ASSUMES we will always have the ottid, else check for unique name
     if (!ottID) {
         // show just the name (static text, possibly an empty string)
         return displayName;
     }
     if (!displayName) {
         // empty or missing name? show the raw ID
         displayName = 'OTT: {OTT_ID}'.replace('OTT_ID',ottID)
     }
     var link = '<a href="{TAXO_BROWSER_URL}" \
                    title="OTT Taxonomy" \
                    target="taxobrowser">{DISPLAY_NAME}</a>';
     return link.replace('{TAXO_BROWSER_URL}', getTaxobrowserURL(ottID))
         .replace('{DISPLAY_NAME}', displayName);
 }

 /*
 * Returns a bare URL to the taxonomy browser for a given OTT taxon
 * Note that this function replicated curator/static/js/curation-helpers.js,
 * so changes made here should also be made in other copy
 */
 function getTaxobrowserURL(ottID) {
     if (!ottID) {
         return null;
     }
     if (typeof ottID == 'string' || ottID instanceof String)
     {
	 ottID=ottID.replace('ott','');
     }
     // If the taxonomy browser is on a different server, this fails.
     var url = '/taxonomy/browse?id={OTT_ID}';
     return url.replace('{OTT_ID}', ottID);
 }

/*
Returns a hyperlink to the source taxonomic amendment for a given OTT taxon
*/
function getTaxonomicAmendmentLink(displayName, amendmentID) {
    // ASSUMES we will always have both arguments
    if (!(displayName) || !(amendmentID)) {
        // show just the name (static text, possibly an empty string)
        return displayName;
    }
    var link = '<a href="{AMENDMENT_URL}" \
                   title="OTT taxonomic amendment" \
                   target="amendment">{DISPLAY_NAME}</a>';
    return link.replace('{AMENDMENT_URL}', getTaxonomicAmendmentURL(amendmentID))
        .replace('{DISPLAY_NAME}', displayName);
}
function getTaxonomicAmendmentURL(amendmentID) {
    if (!amendmentID) {
        return null;
    }
    // N.B. This repo is the same for dev domains and production!
    var url = 'https://github.com/OpenTreeOfLife/amendments-1/blob/master/amendments/{AMENDMENT_ID}.json';
    return url.replace('{AMENDMENT_ID}', amendmentID);
}

/* Return a link (or URL) to a non-taxon node in the synthetic-tree browser
 * N.B. This uses a synth-based URL that requires the id of a synthetic tree.
 */
function getSynthTreeViewerLinkForNodeID(displayName, synthID, nodeID) {
    // ASSUMES we will always have the nodeid, else check for unique name
    if (!synthID || !nodeID) {
        // show just the name (static text, possibly an empty string)
        return displayName || nodeID || '???';
    }
    if (!displayName) {
        // empty or missing name? show the raw ID
        displayName = '{SYNTH_ID}@{NODE_ID}'.replace('{SYNTH_ID}', synthID)
                                            .replace('{NODE_ID}', nodeID);
    }
    var link = '<a href="{SYNTH_VIEWER_URL}" \
                   title="See this node in the current synthetic tree" \
                   target="synthbrowser">{DISPLAY_NAME}</a>';
    return link.replace('{SYNTH_VIEWER_URL}', getSynthTreeViewerURLForNodeID(synthID, nodeID))
        .replace('{DISPLAY_NAME}', displayName);
}
function getSynthTreeViewerURLForNodeID(synthID, nodeID) {
    // if synthID is '', this will point to the latest synthetic tree
    if (!nodeID) {
        return null;
    }
    var url = '/opentree/argus/{SYNTH_ID}@{NODE_ID}';
    return url.replace('{SYNTH_ID}', synthID)
              .replace('{NODE_ID}', nodeID);
}

/*
* Convert DOI to URL and return the result. If no valid DOI is
* detected, return the incoming string unchanged.
*
* N.B. this duplicates the function with same name in
* curator/static/js/study-editor.js, so any changes should be made in
* both places
*/
var minimalDOIPattern = new RegExp('10\\..+')
var urlPattern = new RegExp('http(s?)://\\S+');
function DOItoURL( doi ) {
    /* Return the DOI provided (if any) in URL form */
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
    return ('https://doi.org/'+ bareDOI);
}
