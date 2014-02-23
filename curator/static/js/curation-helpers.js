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
    showFooterMessage(msg, 'error');
}

function showInfoMessage(msg) {
    showFooterMessage(msg, 'info');
}

function showSuccessMessage(msg) {
    showFooterMessage(msg, 'success');
}

var footerMessageCloseID = null;
function showFooterMessage(msg, msgType) {
    var $flashArea = $('.flash');  // should be just one
    
    // hide any previous message and clear its timeout
    $flashArea.hide();
    clearTimeout(footerMessageCloseID);
    footerMessageCloseID = null;

    // replace its contents (may include markup!)
    $flashArea.find('.message').html(msg);

    // incoming msgType should be one of the preset values below
    var msgTypes = ['info', 'success', 'error'];
    $.each(msgTypes, function(i, type) {
        var className = ('alert-'+ type);
        if (type === msgType) {
            $flashArea.addClass( className );
        } else {
            $flashArea.removeClass( className );
        }
    });
    
    // enable the close widget
    $flashArea.find('#closeflash')
        .unbind('click')
        .click( hideFooterMessage );
        
    // some message types should close automatically
    switch( msgType ) {
        case 'info':
        case 'success':
            footerMessageCloseID = setTimeout( hideFooterMessage, 5000 ); 
            break;
        case 'error':
            // these should stay until user dismisses
            break;
    }

    $flashArea.slideDown();
}

function hideFooterMessage( option ) {
    if (option === 'FAST') {
        $('.flash').hide();
    } else {
        $('.flash').fadeOut();
    }
}

function toggleFlashErrorDetails( link ) {
    var $clicked = $(link);
    var $details = $clicked.nextAll('.error-details');
    if ($details.is(':visible')) {
        $details.slideUp(function() {
            $clicked.text('Show details');
        });
    } else {
        $details.slideDown(function() {
            $clicked.text('Hide details');
        });
    }
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

function updateClearSearchWidget( searchFieldSelector ) {
    // add/remove clear widget based on field's contents
    var $search = $(searchFieldSelector);
    if ($search.length === 0) {
        console.warn("updateClearSearchWidget: field '"+ searchFieldSelector +"' not found!");
        return;
    }
    if ($.trim($search.val()) === '') {
        // remove clear widget, if any
        $search.next('.clear-search').remove();
    } else {
        // add and enable the clear widget
        var $clear = $search.next('.clear-search');
        if ($clear.length === 0) {
            $search.after('<i class="clear-search icon-remove"></i>');
            $clear = $search.next('.clear-search');
            $clear.click(function() {
               $(this).prev().val('').trigger('change'); 
               return false;
            });
        }
    }


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
