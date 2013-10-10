/*
 * Client-side behavior for the Open Tree curation UI
 *
 * This uses the OTOL API to fetch and store studies and trees remotely.
 */

// these variables should already be defined in the main HTML page
var studyID;
var API_create_study_POST_url;
var API_load_study_GET_url;
var API_update_study_PUT_url;

// working space for parsed JSON objects (incl. sub-objects)
var viewModel;
var checkForModelChanges;

$(document).ready(function() {
    loadSelectedStudy(studyID);
});


function loadSelectedStudy(id) {
    /* Use REST API to pull study data from datastore
     * :EXAMPLE: GET http://api.opentreeoflife.org/1/study/{23}.json
     * 
     * Offer a visible progress bar (studies can be very large)
     *
     * Gracefully handle and report:
     *  - remote service not available
     *  - study missing or not found
     *  - too-large studies? will probably choke on parsing
     *  - misc errors from API
     *  - any local storage (in Lawnchair) that trumps the one in remote storage
     */

    var fetchURL = API_load_study_GET_url.replace('{STUDY_ID}', studyID);

    // TODO: try an alternate URL, pulling directly from GitHub?

    // TODO: switch to JSONP, in case we're calling another domain

    // HACK to prevent additional _ arg from being passed (didn't help)
    //$.ajaxSetup({cache:true});

    // TODO: show/hide spinner during all AJAX requests?
    $('#ajax-busy-bar').show();

    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: fetchURL,
        data: { },
        success: function( data, textStatus, jqXHR ) {
            // this should be properly parsed JSON

            // report errors or malformed data, if any
            if (textStatus !== 'success') {
                showErrorMessage('Sorry, there was an error loading this study.');
                return;
            }
            if (typeof data !== 'object' || typeof(data['nexml']) == 'undefined') {
                showErrorMessage('Sorry, there is a problem with the study data.');
                return;
            }

            // declarative mapping of raw JS obj to view-model, using mapping plugin
            var mapping = {  // modify default mapping options
                // specify an (all-purpose?) function for determine a key property on some types
                key: function(item) {
                    // what happens if no @id is found on some items?
                    return ko.utils.unwrapObservable(item['@id']);
                },
                // some properties should never changes; these can be copied as-is, avoiding the overhead of making them "observable"
                copy: ['@property','@xsi:type']
            }
            viewModel = ko.mapping.fromJS(data, mapping);
/*
            viewModel.studyQualityPercent = ko.computed(function() {
                return Math.floor(Math.random() * 100) + 1;
            });
*/
            viewModel.studyQualityPercent = ko.observable(0);
            viewModel.studyQualityPercentStyle = ko.computed(function() {
                // NOTE that we impose a minimum width, so the score is legible
                return Math.max(viewModel.studyQualityPercent(), 8) + "%";
            });
            viewModel.studyQualityBarClass = ko.computed(function() {
                var score = viewModel.studyQualityPercent();
                if (score > 80) {
                    return 'progress progress-success';
                } else if (score > 40) {
                    return 'progress progress-warning';
                } else {
                    return 'progress progress-danger';
                }
            });

            ko.applyBindings(viewModel);
            updateQualityDisplay();

            // update quality assessment whenever anything changes
            // TODO: throttle this back to handle larger studies?
            checkForModelChanges = ko.dirtyFlag(viewModel);
            checkForModelChanges.isDirty.subscribe(function() {
                ///console.log("something changed!");
                updateQualityDisplay();
            });

            $('#ajax-busy-bar').hide();
            showInfoMessage('Study data loaded.');
        }
    });
}

function updateQualityDisplay() {
    var scoreInfo = scoreStudy(viewModel);
    // update "progress bar" with percentage and color
    viewModel.studyQualityPercent( Math.round(scoreInfo.overallScore * 100) );
    // update list of suggested actions below
    $('#suggested-actions').empty();
    for (var i = 0; i < scoreInfo.comments.length; i++) {
        var c = scoreInfo.comments[i];
        if (c.suggestedAction) {
            $('#suggested-actions').append('<li><a href="#">'+ c.suggestedAction +' <span style="color: #aaa;">('+ c.percentScore +'%)</span></a></li>');
        }
    }
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

function validateFormData() {
    // return success (t/f?), or a structure with validation errors
    // TODO: or use more typical jQuery machinery, or validation plugin?
    return true;
}

function saveFormDataToStudyJSON() {
    // save all populated fields; clear others, or remove from JSON(?)
    $('#ajax-busy-bar').show();

    //// push changes back to storage
    var saveURL = API_update_study_PUT_url.replace('{STUDY_ID}', studyID);

    $.ajax({
        type: 'POST',  // TODO: use PUT for updates?
        dataType: 'json',
        // crossdomain: true,
        // contentType: "application/json; charset=utf-8",
        url: saveURL,
        data: {
            // use JSON stringify (if available) for faster submission of JSON
            nexson: ko.mapping.toJSON(viewModel),
            author_name: authorName,
            author_email: authorEmail,
            auth_token: authToken
        },
        success: function( data, textStatus, jqXHR ) {
            // this should be properly parsed JSON
            ///console.log('saveFormDataToStudyJSON(): done! textStatus = '+ textStatus);
            // report errors or malformed data, if any
            if (textStatus !== 'success') {
                showErrorMessage('Sorry, there was an error saving this study.');
                return;
            }

            $('#ajax-busy-bar').hide();
            showSuccessMessage('Study saved to remote storage.');

            // TODO: should we expect fresh JSON to refresh the form?
        }
    });
}

/* 
 * Use Knockout.js for smart, persistent binding of JS model to UI
 */

// TODO: incorporate its methods into mapped viewModel above?
function StudyViewModel() {
    var self = this;
    self.nexml = {
        meta: ko.observableArray([ ])
    }
    self.getByAtProperty = function(array, prop) {
        // fetch from a list by @property value
        for (var i = 0; i < array.length; i++) {
            var testItem = array[i];
            if (testItem['@property'] === prop) {
                return testItem.value; // assumes value is stored here
            }
            return null;
        }
    }

};

function getMetaTagAccessorByAtProperty(array, prop) {
    // fetch accessor(!) function for a metatag in the specified list, using its @property value
    for (var i = 0; i < array.length; i++) {
        var testItem = array[i];
        if (testItem['@property']() === prop) {
            switch(testItem['@xsi:type']()) {
                case 'nex:ResourceMeta':
                    return testItem['@href'];  // uses special attribute
                default: 
                    return testItem.$; // assumes value is stored here
            }
        }
    }
    return null;
}

/* support classes for objects in arrays 
 * (TODO: use these instead of generlc observables?) 
 */
function MetaTag( name, type, value ) {
    var self = this;
    self.name = name;   // .@property
    self.type = type;   // .@xsi:type
    self.value = ko.observable(value);  // .$
}
function OTU(id, label, about, meta) {
    var self = this;
    self.id = id;   // .@id
    self.label = label;   // .@label
    self.about = about;   // .@about
    self.meta = ko.observableArray();  // .meta
    // add all meta entries as MetaTag instances
    for(var i = 0; i < meta.length; i++) {
        self.meta.push( new MetaTag( meta[i] ) );
    }
}
function Tree(id, about, meta, edge, node) {
    var self = this;
    self.id = id;         // .@id
    self.about = about;   // .@about
    self.meta = ko.observableArray();  // .meta
    // add all meta entries as MetaTag instances
    for(var i = 0; i < meta.length; i++) {
        self.meta.push( new MetaTag( meta[i] ) );
    }
    self.edge = ko.observableArray();  // .edge
    // add all edge entries as TreeEdge instances
    for(var i = 0; i < edge.length; i++) {
        self.edge.push( new TreeEdge( edge[i] ) );
    }
    self.node = ko.observableArray();  // .node
    // add all node entries as TreeNode instances
    for(var i = 0; i < node.length; i++) {
        self.node.push( new TreeNode( node[i] ) );
    }
}
function TreeEdge() {
}
function TreeNode() {
}


/*
 * Real-time quality assessment for OTOL study data, based on chosen criteria,
 * tests, and rules. Generate a summary result (structured object) of the most
 * salient feedback for display.
 *
 * TODO: Move these rules to a shared JSON file, so we can use them in the
 * study-status app and/or a web service? Probably can't do that with embedded
 * functions..
 *
 * == LIKELY CRITERIA ==
 * 
 * completeness 
 *      min threshold 
 *      study data is complete
 *      nice-to-have (what are the finishing touches?)
 *      one preferred tree?
 *      preferred tree(s) is/are rooted? or "unrooted" disclaimer was chosen?
 *
 * integrity 
 *      all taxon names mapped (perhaps this score is proportional)
 *      dates and DOIs match reference
 *
 * community
 *      study and its trees are available for synthesis
 *      all annotations of type 'query' are resolved..?
 *      any 'holds' applied have been cleared
 *
 * validity? or should we make it "impossible" to build invalid data here?
 *
 */
var studyScoringRules = {
    'completeness': [
        // Is the study fully fleshed out?
        {
            description: "The study should have all metadata fields complete.",
            test: function(studyData) {
                // check for non-empty fields in all metadata
                var studyMetatags = studyData.nexml.meta();
                for (var i = 0; i < studyMetatags.length; i++) {
                    var testMeta = studyMetatags[i];
                    var testValue;
                    switch(testMeta['@xsi:type']()) {
                        case 'nex:ResourceMeta':
                            testValue = testMeta['@href']();  // uses special attribute
                            break;
                        default: 
                            testValue = testMeta['$'](); // assumes value is stored here
                    }
                    if ($.trim(testValue) === "") {
                        ///console.log(">>> metatag '"+ testMeta['@property']() +"' is empty!");
                        return false;
                    }
                }
                return true;
            },
            weight: 0.35, 
            successMessage: "All metadata fields have data.",
            failureMessage: "Some metadata fields need data.",
            suggestedAction: "Check study metadata for empty fields."
                // TODO: add hint/URL/fragment for when curator clicks on suggested action?

        }
    ],
    'integrity': [  
        // Is the study data internally consistent, with no loose ends?
        {
            description: "The study year should match the one in its publication reference.",
            test: function(studyData) {
                // compare metatags for study year and publication reference
                var studyMetatags = studyData.nexml.meta();
                var studyYear = getMetaTagAccessorByAtProperty(studyMetatags, 'ot:studyYear')();
                var pubRef = getMetaTagAccessorByAtProperty(studyMetatags, 'ot:studyPublicationReference')();
                if (($.trim(studyYear) === "") || ($.trim(pubRef) === "")) {
                    // one of these fields is empty, so it fails
                    return false;
                }

                // compare the two, to see if the year is found (anywhere) in the reference
                var pattern = new RegExp('\\b'+ $.trim(studyYear) +'\\b');
                // use RegEx.test to return T/F result
                return pattern.test(pubRef);
            },
            weight: 0.2, 
            successMessage: "The study's year matches its publication reference.",
            failureMessage: "The study's year (in metadata) doesn't match its publication reference.",
            suggestedAction: "Check study year against publication reference."
                // TODO: add hint/URL/fragment for when curator clicks on suggested action?
        },
        {
            description: "The study DOI should match the one in its publication reference.",
            test: function(studyData) {
                // compare metatags for DOI and publication reference
                var studyMetatags = studyData.nexml.meta();
                var DOI = getMetaTagAccessorByAtProperty(studyMetatags, 'ot:studyPublication')();
                var pubRef = getMetaTagAccessorByAtProperty(studyMetatags, 'ot:studyPublicationReference')();
                if (($.trim(DOI) === "") || ($.trim(pubRef) === "")) {
                    // one of these fields is empty, so it fails
                    return false;
                }

                // compare the two, to see if the (minimal) DOI matches
                var DOIParts = $.trim(DOI).split('http://dx.doi.org/');
                var strippedDOI;
                if (DOIParts.length === 1) {
                    strippedDOI = DOIParts[0];
                } else {
                    strippedDOI = DOIParts[1];
                }
                var pattern = new RegExp('\\b'+ strippedDOI +'\\b');
                // use RegEx.test to return T/F result
                return pattern.test(pubRef);
            },
            weight: 0.2, 
            successMessage: "The study's DOI matches its publication reference.",
            failureMessage: "The study's DOI (in metadata) doesn't match its publication reference.",
            suggestedAction: "Check study's DOI against its publication reference."
                // TODO: add hint/URL/fragment for when curator clicks on suggested action?

        }
    ],
    'FAKE CRITERION': [    // TODO: remove this, just for initial demo
        // this is just here to balance out the score with other, unseen stuff
        {
            description: "this represents good stuff elsewhere in the study",
            test: function() {
                return true;
            },
            weight: 0.4, 
            successMessage: "",
            failureMessage: "",
            suggestedAction: ""
                // TODO: add hint/URL/fragment for when curator clicks on suggested action?
        },
        {
            description: "this represents bad/incomplete stuff elsewhere in the study",
            test: function() {
                return false;
            },
            weight: 0.2, 
            successMessage: "",
            failureMessage: "",
            suggestedAction: "Map all taxon names in preferred trees"
                // TODO: add hint/URL/fragment for when curator clicks on suggested action?
        }
    ]
}


function scoreStudy( studyData ) {
    // TODO: specify viewModel (fastest)? or JSON version? 
    // apply studyScoringRules below, recording score, comments

    var studyScore = 0.0;  // build up a non-zero score, composed of all (relative) weight values
    var highestPossibleScore = 0.0;  // normalize the final score relative to the max possible

    var comments = new Array();

    var i, cName, criterion, rule;
    for(cName in studyScoringRules) {
        criterion = studyScoringRules[cName];
        ///console.log("Checking study against rules for "+ cName +"...");
        for (i = 0; i < criterion.length; i++) {
            rule = criterion[i];
            ///console.log("  rule.weight = "+ rule.weight);
            highestPossibleScore += rule.weight;
            if (rule.test( studyData )) {
                // passed this test
                ///console.log("  PASSED this rule: "+ rule.description);
                studyScore += rule.weight;
                comments.push({
                    'weight': rule.weight, 
                    'message': rule.successMessage, 
                    'success': true,
                    'suggestedAction': null
                });
            } else {
                // failed this test
                ///console.log("  FAILED this rule: "+ rule.description);
                //studyScore -= rule.weight;
                comments.push({
                    'weight': rule.weight, 
                    'message': rule.failureMessage, 
                    'success': false,
                    'suggestedAction': rule.suggestedAction
                });
            }
            ///console.log("  now study score is "+ studyScore);
        }
    }

    // normalize score vs. highest possible?
    ///console.log("RAW SCORE: "+ studyScore);
    ///console.log("HIGHEST POSSIBLE SCORE: "+ highestPossibleScore);
    studyScore = studyScore / highestPossibleScore;
    ///console.log("NORMALIZED SCORE: "+ studyScore);

    // generalize to assign color to bar?
    var barColor;
    if (studyScore > 0.8) {
        barColor = 'green';
    } else if (studyScore > 0.6) {
        barColor = 'yellow';
    } else {
        barColor = 'red';
    }
    // TODO: do something with this?

    // sort comments by weight
    //comments.sortOn( 'weight', Array.NUMERIC | Array.DESCENDING );
    comments.sort(function(a,b) { return parseFloat(b.weight) - parseFloat(a.weight) } )
    // TODO: (re)build list of suggested next steps

    ///console.log("Captured these comments:");

    // reckon weight of each comment as its final percentage (useful for display)
    for (i = 0; i < comments.length; i++) {
        var comment = comments[i];
        comment.percentScore = Math.round(comment.weight / highestPossibleScore * 100);

        var marker = comment.success ? '+' : '-';
        ///console.log("  "+ comment.percentScore +" ("+ marker +") "+ comment.message +" ["+ comment.suggestedAction +"]");
        ///if (comment.suggestedAction) {
        ///    console.log( 'Suggested Action: '+ comment.suggestedAction );
        ///}
    }

    return {
        overallScore: studyScore,
        comments: comments
    }
}

/* implement a basic "dirty" flag (to trigger quality assessment), as described here:
 * http://www.knockmeout.net/2011/05/creating-smart-dirty-flag-in-knockoutjs.html
 */
ko.dirtyFlag = function(root, isInitiallyDirty) {
    var result = function() {},
        _initialState = ko.observable(ko.toJSON(root)),
        _isInitiallyDirty = ko.observable(isInitiallyDirty);

    result.isDirty = ko.computed(function() {
        return _isInitiallyDirty() || _initialState() !== ko.toJSON(root);
    });

    result.reset = function() {
        _initialState(ko.toJSON(root));
        _isInitiallyDirty(false);
    };

    return result;
};

