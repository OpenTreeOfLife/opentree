/*
 * Utilities common to multiple pages in the OpenTree study-curation tool.
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

function showErrorMessage(msg) {
    $('.flash .message').html(msg);
    $('.flash').removeClass('alert-info')
               .removeClass('alert-success')
               .addClass('alert-error').slideDown();
}

function showInfoMessage(msg) {
    $('.flash .message').html(msg);
    $('.flash').removeClass('alert-error')
               .removeClass('alert-success')
               .addClass('alert-info').slideDown();
}

function showSuccessMessage(msg) {
    $('.flash .message').html(msg);
    $('.flash').removeClass('alert-info')
               .removeClass('alert-error')
               .addClass('alert-success').slideDown();
}

function makeArray( val ) {
    // The caller expects an array, so we should coerce, wrap, or replace
    // the specified value as needed.
    if (typeof(val) === 'function') {
        // unpack an observable value (from Knockout binding) and continue
        val = val();
    }

    var arr;
    if ((typeof(val) === 'undefined') || val === null) {
        arr = [];
    } else if (typeof(val) !== 'object') {
        // other simple value types should be wrapped in an array
        arr = [val]
    } else if (typeof(val.length) === 'undefined') {
        // it's a simple object, wrap it in an array
        arr = [val];
    } else {
        // anything else is already proper array
        arr = val;
    }

    return arr;
}

/*
var cladeNameTimeoutID = null;
function loadMissingFocalCladeNames() {
    // temporary behavior to AJAX-load missing taxon names wherever we
    // display 'ot:focalClade' values (bare OTT ids, which nobody knows)
    if (cladeNameTimeoutID) {
        clearTimeout( cladeNameTimeoutID );
    }
    cladeNameTimeoutID = setTimeout(function() {
        var $missingNames = $('.focal-clade-name:empty');
        if ($missingNames.length > 0) {
            var $nameWidget = $missingNames[0];
            var $ottID = $nameWidget.parent().find('.focal-clade-id').val();
            if (!$ottID || ($ottID === '')) {
                $nameWidget.val('');
            } else {
                $.ajax(
                    type: 'POST',
                    dataType: 'json',
                    url: findAllStudies_url,
                    data: {"ottId": $oddID.toString()},
                    success: function( data, textStatus, jqXHR ) {
                        console.log("got the taxon name: ");
                        var matchingOttID = data['name'] || '???';
                        console.log( matchingOttID );
                    }
                    
                    // replace another missing name (if any)...
                    loadMissingFocalCladeNames();
                );
            }
        }
    }, 100);
}
*/
