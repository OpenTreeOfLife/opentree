/*
 * Utilities common to multiple pages in the OpenTree study-curation tool.
 */

function fullToCompactReference( fullReference ) {
    var compactReference = "(Untitled)";
    if ($.trim(fullReference) !== "") {
        // capture the first valid year in the reference
        var compactYear = fullReference.match(/(\d{4})/)[0];  
        // split on the year to get authors (before), and capture the first surname
        var compactPrimaryAuthor = fullReference.split(compactYear)[0].split(',')[0];
        var compactReference = compactPrimaryAuthor +", "+ compactYear;    // eg, "Smith, 1999";
    }
    return compactReference;
}
