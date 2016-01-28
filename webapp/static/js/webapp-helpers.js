/*
 * Utilities common to multiple pages in the OpenTree webapp.
 * There are also helper functions in webapp/views/layout.html, which
 * should eventually be moved over here.
 */

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
