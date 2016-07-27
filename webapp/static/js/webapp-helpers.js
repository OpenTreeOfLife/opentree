/*
 * Utilities common to multiple pages in the OpenTree webapp.
 * There are also helper functions in webapp/views/layout.html, which
 * should eventually be moved over here.
 */

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
     var url = '/taxonomy/browse?id={OTT_ID}';
     return url.replace('{OTT_ID}', ottID);
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
    if (!synthID || !nodeID) {
        return null;
    }
    var url = '/opentree/argus/{SYNTH_ID}@{NODE_ID}';
    return url.replace('{SYNTH_ID}', synthID)
              .replace('{NODE_ID}', nodeID);
}
