/*
 * Client-side behavior for the Open Tree curation UI
 *
 * This uses the OTOL API to fetch and store studies and trees remotely.
 */

// these variables should already be defined in the main HTML page
var studyID;
var API_load_study_GET_url;
var API_update_study_PUT_url;
var viewOrEdit;
var API_create_file_POST_url;
var API_load_file_GET_url;
var API_update_file_PUT_url;
var API_remove_file_DELETE_url;

// working space for parsed JSON objects (incl. sub-objects)
var viewModel;

var tagsOptions = {
    confirmKeys: [13, 9],  // ENTER, TAB for next tag
    typeahead: {                  
        source: ['eenie', 'meanie', 'minie', 'moe']
        /*
        source: function(query) {
            return $.get('/oti/existing_tags');  // TODO
        }
        */
    }
};

$(document).ready(function() {
    // auto-select first tab (Status)
    $('.nav-tabs a:first').tab('show');
    loadSelectedStudy(studyID);

    // Initialize the jQuery File Upload widget:
    $('#fileupload').fileupload({
        disableImageResize: true,
        // maxNumberOfFiles: 5,
        // maxFileSize: 5000000,  // TODO: allow maximum
        // acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i  // TODO: allow any
        url: '/curator/supporting_files/upload_file',
        dataType: 'json',
        autoUpload: 'True',
        done: function() {
            console.log('done!');
        }
    }).on('fileuploadprogressall', function (e, data) {
        console.log('fileuploadprogressall');
        var progress = parseInt(data.loaded / data.total * 100, 10);
        $('#file-upload-progress .bar').css(
            'width',
            progress + '%'
        );
        $('#file-upload-progress .bar span').text(
            progress + '%'
        );
    }).on('fileuploaddone', function (e, data) {
        console.log('fileuploaddone');
        $.each(data.result.files, function (index, file) {
            if (file.url) {
                var link = $('<a>')
                    .attr('target', '_blank')
                    .prop('href', file.url);

                /* 'file' obj has these properties
                    .delete_url: "/curator/supporting_files/delete_file/supporting_files.doc.96...3461.m4a"
                    .name: "10_6_2011 6_03 PM.m4a"
                    .size: 35036641
                    .url: "/curator/supporting_files/download/supporting_files.doc.96acd92...3461.m4a"
                */
                // update the files list (and auto-save?)
                var fileNexson = cloneFromNexsonTemplate('single supporting file');
                fileNexson['@filename']( file.name );
                fileNexson['@url']( file.url );  // TODO: prepend current domain name, if missing?
                fileNexson['@type']( "" );  // TODO: glean this from file extension?
                fileNexson['@size']( file.size );  // convert byte count for display?
                // TODO: incorporate the delete URL provided? or generate as-needed?
                // fileNexson.delete_url( file.delete_url );

                getSupportingFiles().data.files.file.push(fileNexson);

                showSuccessMessage('File added.');
            } else if (file.error) {
                var error = $('<span class="text-danger"/>').text(file.error);
                /*
                $(data.context.children()[index])
                    .append('<br>')
                    .append(error);
                */
                debugger;
                console.log( "FAILURE, msg = "+ error);
            }
        });
    }) 
    
    // Load existing files (?)
    $('#fileupload').addClass('fileupload-processing');
    $.ajax({
        // Uncomment the following to send cross-domain cookies:
        //xhrFields: {withCredentials: true},
        url: $('#fileupload').fileupload('option', 'url'),
        dataType: 'json',
        context: $('#fileupload')[0]
    }).always(function () {
        $(this).removeClass('fileupload-processing');
    }).done(function (result) {
        $(this).fileupload('option', 'done')
            .call(this, $.Event('done'), {result: result});
    });
});


function goToTab( tabName ) {
    // click the corresponding tab, if found
    $('.nav-tabs a:contains('+ tabName +')').tab('show');
}

var studyTagsInitialized = false;
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
    
    // TEST URL with local JSON file
    ///fetchURL = '/curator/static/1003.json';

    // TODO: try an alternate URL, pulling directly from GitHub?

    // TODO: show/hide spinner during all AJAX requests?
    $('#ajax-busy-bar').show();

    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: fetchURL,
        data: { 
            'auth_token': authToken
        },
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

            // add study-level containers for annotations
            if (getStudyAnnotationEvents(data.nexml) === null) {
                data.nexml.meta.push( 
                    cloneFromNexsonTemplate('study annotation events', {applyKnockoutMapping: false})
                );
            }
            if (getStudyAnnotationAgents(data.nexml) === null) {
                data.nexml.meta.push( 
                    cloneFromNexsonTemplate('study annotation agents', {applyKnockoutMapping: false}) 
                );
            }
            if (getStudyAnnotationMessages(data.nexml) === null) {
                data.nexml.meta.push( 
                    cloneFromNexsonTemplate('annotation message collection', {applyKnockoutMapping: false}) 
                );
            }


            // add agent singleton for this curation tool
            var curatorAgent;
            var isCurrentCurationTool = function(agent) {
                var curatorAnnotationAgentInfo = nexsonTemplates[ 'curator annotation agent' ];
                return (agent['@name'] === curatorAnnotationAgentInfo['@name']) 
                    && (agent['@version'] && agent['@version'] === curatorAnnotationAgentInfo['@version']);
            }
            if (!agentExists( isCurrentCurationTool, data.nexml )) {
                addAgent( 
                    cloneFromNexsonTemplate('curator annotation agent', {applyKnockoutMapping: false}), 
                    data.nexml 
                );
            }
            curatorAgent = getAgent( isCurrentCurationTool, data.nexml);

            // add baseline (empty) annotation for OTU mapping hints
            if (getOTUMappingHints(data.nexml) === null) {
                var hintsAnnotationBundle = $.extend(
                    { 
                        targetElement: data.nexml, 
                        agent: curatorAgent
                    }, 
                    nexsonTemplates['OTU mapping hints']
                );
                createAnnotation( hintsAnnotationBundle, data.nexml );
            }
            
            // add baseline (empty) annotation for supporting files 
            if (getSupportingFiles(data.nexml) === null) {
                ///data.nexml.meta.push( cloneFromNexsonTemplate('supporting files') );
                var filesAnnotationBundle = $.extend(
                    { 
                        targetElement: data.nexml, 
                        agent: curatorAgent
                    }, 
                    nexsonTemplates['supporting files']
                );
                createAnnotation( filesAnnotationBundle, data.nexml );
            }

            // add expected tree properties and metadata, if missing
            $.each(makeArray(data.nexml.trees.tree), function(index, tree) {
                /*
                 * NOTE that we haven't mapped this yet, so properties aren't functions!
                 */

                // editable display name for this tree
                if ((tree['@label'] === undefined) || ($.trim(tree['@label']) === '')) {
                    tree['@label'] = 'Untitled ('+ tree['@about'] +')';
                }

                // metadata fields (with empty default values)
                var metatags = [
                    'ot:curatedType',
                    'ot:specifiedRoot',
                    'ot:inGroupClade',
                    'ot:outGroupEdge',
                    'ot:tag',
                    'ot:branchLengthMode',
                    'ot:branchLengthTimeUnit',
                    'ot:branchLengthDescription'
                ];
                $.each(metatags, function(i, tagName) {
                    var foundTag = false;
                    $.each(tree.meta, function(i, existingTag) {
                        if (existingTag['@property'] == tagName) {
                            foundTag = true;
                            return false;
                        }
                    });
                    if (!foundTag) {
                        tree.meta.push({
                            '@property': tagName,
                            '@xsi:type': 'nex:LiteralMeta',
                            '$': ""
                        });
                    }
                });

            });

            viewModel = data;

            /*
             * Add observable properties to the model to support the UI
             */

            // Add a series of observable "ticklers" to signal changes in 
            // the model without observable Nexson properties. Each is an
            // integer that creeps up by 1 to signal a change somewhere in
            // related Nexson elements.
            // TODO: Is this a tickler? ratchet? whisker?
            viewModel.ticklers = {
                'GENERAL_METADATA': ko.observable(0),
                'EDGE_DIRECTIONS': ko.observable(0),
                'MAPPING_HINTS': ko.observable(0),
                // TODO: add more as needed...
                'STUDY_HAS_CHANGED': ko.observable(0)
            }     

            viewModel.ticklers.STUDY_HAS_CHANGED.subscribe( updateQualityDisplay );
            
            // enable sorting and filtering for lists in the editor
            viewModel.filterDelay = 250; // ms to wait for changes before updating filter
            viewModel.listFilters = {
                // UI widgets bound to these variables will trigger the
                // computed display lists below..
                'TREES': {
                    'match': ko.observable("")
                },
                'FILES': {
                    'match': ko.observable("")
                },
                'OTUS': {
                    // TODO: add 'pagesize'?
                    'match': ko.observable(""),
                    'scope': ko.observable("In preferred trees"),
                    'order': ko.observable("Unmapped OTUs first")
                },
                'ANNOTATIONS': {
                    'match': ko.observable(""),
                    'scope': ko.observable("Anywhere in the study"),
                    'submitter': ko.observable("Submitted by all")
                }
            };

            // maintain a persistent array to preserve pagination (reset when computed)
            viewModel._filteredTrees = ko.observableArray( ).asPaged(20);
            viewModel.filteredTrees = ko.computed(function() {
                // filter raw tree list, returning a
                // new paged observableArray
                console.log(">>> computing filteredTrees");
                var match = viewModel.listFilters.TREES.match(),
                    matchPattern = new RegExp( $.trim(match), 'i' );

                // map old array to new and return it
                var filteredList = ko.utils.arrayFilter( 
                    viewModel.nexml.trees.tree, 
                    function(tree) {
                        // match entered text against old or new label
                        var treeName = tree['@label'];
                        var inGroupName = getInGroupCladeDescriptionForTree(tree);
                        if (!matchPattern.test(treeName) && !matchPattern.test(inGroupName)) {
                            return false;
                        }
                        return true;
                    }
                );  // END of list filtering
                        
                viewModel._filteredTrees( filteredList );
                viewModel._filteredTrees.goToPage(1);
                return viewModel._filteredTrees;
            }).extend({ throttle: viewModel.filterDelay }); // END of filteredTrees
            
            // maintain a persistent array to preserve pagination (reset when computed)
            viewModel._filteredFiles = ko.observableArray( ).asPaged(20);
            viewModel.filteredFiles = ko.computed(function() {
                // filter raw file list, returning a
                // new paged observableArray
                console.log(">>> computing filteredFiles");
                var match = viewModel.listFilters.FILES.match(),
                    matchPattern = new RegExp( $.trim(match), 'i' );

                // map old array to new and return it
                var filteredList = ko.utils.arrayFilter( 
                    getSupportingFiles().data.files.file,  // retrieve contents of observableArray
                    function(file) {
                        // match entered text against old or new label
                        var fileName = file['@filename'];
                        var fileType = file['@type'];
                        var fileDesc = file.description.$();
                        if (!matchPattern.test(fileName) 
                         && !matchPattern.test(fileType) 
                         && !matchPattern.test(fileDesc)) {
                            return false;
                        }
                        return true;
                    }
                );  // END of list filtering
                        
                viewModel._filteredFiles( filteredList );
                viewModel._filteredFiles.goToPage(1);
                return viewModel._filteredFiles;
            }).extend({ throttle: viewModel.filterDelay }); // END of filteredFiles

            // maintain a persistent array to preserve pagination (reset when computed)
            viewModel._filteredOTUs = ko.observableArray( ).asPaged(20);
            viewModel.filteredOTUs = ko.computed(function() {
                // filter raw OTU list, then sort, returning a
                // new (OR MODIFIED??) paged observableArray
                console.log(">>> computing filteredOTUs");
                var match = viewModel.listFilters.OTUS.match(),
                    matchPattern = new RegExp( $.trim(match), 'i' );
                var scope = viewModel.listFilters.OTUS.scope();
                var order = viewModel.listFilters.OTUS.order();

                console.log("  filtering "+ viewModel.nexml.otus.otu.length +" otus...");

                var chosenTrees;
                switch(scope) {
                    case 'In preferred trees':
                        chosenTrees = getPreferredTrees()
                        break;
                    case 'In non-preferred trees':
                        chosenTrees = getNonPreferredTrees()
                        break;
                    default:
                        chosenTrees = [];
                }

                // pool all node IDs in chosen trees into a common object
                var chosenTreeNodeIDs = {};
                $.each( chosenTrees, function(i, tree) {
                    // check this tree's nodes for this OTU id
                    $.each( tree.node, function( i, node ) {
                        if (node['@otu']) {
                            chosenTreeNodeIDs[ node['@otu'] ] = true;
                        }
                    });
                });

                // map old array to new and return it
                var filteredList = ko.utils.arrayFilter( 
                    viewModel.nexml.otus.otu, 
                    function(otu) {
                        // match entered text against old or new label
                        var originalLabel = getMetaTagValue(otu.meta, 'ot:originalLabel');
                        var mappedLabel = otu['@label'];
                        if (!matchPattern.test(originalLabel) && !matchPattern.test(mappedLabel)) {
                            return false;
                        }

                        // check nodes against trees, if filtered
                        switch (scope) {
                            case 'In all trees':
                                // nothing to do here, all nodes pass
                                break;

                            case 'In preferred trees':
                            case 'In non-preferred trees':
                                // check selected trees for this node
                                var chosenTrees = (scope === 'In preferred trees') ?  getPreferredTrees() : getNonPreferredTrees(); 
                                var foundInMatchingTree = false;
                                var otuID = otu['@id'];

                                foundInMatchingTree = otuID in chosenTreeNodeIDs;

                                if (!foundInMatchingTree) return false;
                                break;

                            default:
                                console.log("Unexpected scope for OTU list: ["+ scope +"]");
                                return false;
                        }
                        
                        return true;
                    }
                );  // END of list filtering
                        
                // apply selected sort order
                switch(order) {
                    /* REMINDER: in sort functions, results are as follows:
                     *  -1 = a comes before b
                     *   0 = no change
                     *   1 = b comes before a
                     */
                    case 'Unmapped OTUs first':
                        filteredList.sort(function(a,b) { 
                            var aMapStatus = $.trim(a['@label']) !== '';
                            var bMapStatus = $.trim(b['@label']) !== '';
                            if (aMapStatus === bMapStatus) return 0;
                            if (aMapStatus) return 1;
                            if (bMapStatus) return -1;
                        });
                        break;

                    case 'Mapped OTUs first':
                        filteredList.sort(function(a,b) { 
                            var aMapStatus = $.trim(a['@label']) !== '';
                            var bMapStatus = $.trim(b['@label']) !== '';
                            if (aMapStatus === bMapStatus) return 0;
                            if (aMapStatus) return -1;
                            return 1;
                        });
                        break;

                    case 'Original label (A-Z)':
                        filteredList.sort(function(a,b) { 
                            var aOriginal = getMetaTagValue(a.meta, 'ot:originalLabel');
                            var bOriginal = getMetaTagValue(b.meta, 'ot:originalLabel');
                            if (aOriginal === bOriginal) return 0;
                            if (aOriginal < bOriginal) return -1;
                            return 1;
                        });
                        break;

                    case 'Original label (Z-A)':
                        filteredList.sort(function(a,b) { 
                            var aOriginal = getMetaTagValue(a.meta, 'ot:originalLabel');
                            var bOriginal = getMetaTagValue(b.meta, 'ot:originalLabel');
                            if (aOriginal === bOriginal) return 0;
                            if (aOriginal > bOriginal) return -1;
                            return 1;
                        });
                        break;

                    default:
                        console.log("Unexpected order for OTU list: ["+ order +"]");
                        return false;

                }
                viewModel._filteredOTUs( filteredList );
                viewModel._filteredOTUs.goToPage(1);
                return viewModel._filteredOTUs;
            }).extend({ throttle: viewModel.filterDelay }); // END of filteredOTUs

            // maintain a persistent array to preserve pagination (reset when computed)
            viewModel._filteredAnnotations = ko.observableArray( ).asPaged(20);
            viewModel.filteredAnnotations = ko.computed(function() {
                // filter raw OTU list, then sort, returning a
                // new (OR MODIFIED??) paged observableArray
                console.log(">>> computing filteredAnnotations");
                var match = viewModel.listFilters.ANNOTATIONS.match(),
                    matchPattern = new RegExp( $.trim(match), 'i' );
                var scope = viewModel.listFilters.ANNOTATIONS.scope();
                var submitter = viewModel.listFilters.ANNOTATIONS.submitter();

                // filter study metadata, build new array to new and return it
                var annotationsCollection = getMetaTagByProperty(viewModel.nexml.meta, 'ot:annotationEvents');
                var filteredList = ko.utils.arrayFilter( 
                    annotationsCollection.annotation,
                    function(annotation) {
                        // match entered text against type, location, submitter name, message text
                        var itsAgent = getAgentForAnnotationEvent( annotation );
                        var itsMessages = getMessagesForAnnotationEvent( annotation );

                        var itsType = itsMessages ? itsMessages[0]['@code'] : ""; // TODO: incorporate all messages?
                        ///var itsLocation = "Study"; // TODO
                        var itsSubmitter = itsAgent['@name'];
                        var itsMessageText = itsMessages ? 
                            $.map(itsMessages, function(m) { return m['humanMessage'] ? m['@humanMessage'] : ""; }).join('|') :
                            ""; 
                        var itsSortDate = annotation['@dateCreated'];
                        if (!matchPattern.test(itsType) && !matchPattern.test(itsSubmitter) && !matchPattern.test(itsMessageText)) {
                            return false;
                        }

                        /* filter by submitter
                         * TODO: Provide some kind of support for this?
                        switch (submitter) {
                            case 'Submitted by all':
                                // nothing to do here, all nodes pass
                                break;

                            case 'Submitted by users':
                                break;

                            case 'Submitted by validation tools':
                                break;

                            default:
                                console.log("Unexpected submitter option for annotations: ["+ submitter +"]");
                                return false;
                        }
                        */
                        
                        return true;
                    }
                );  // END of list filtering
                        
                viewModel._filteredAnnotations( filteredList );
                viewModel._filteredAnnotations.goToPage(1);
                return viewModel._filteredAnnotations;
            }).extend({ throttle: viewModel.filterDelay }); // END of filteredAnnotations

            viewModel.studyQualityPercent = ko.observable(0);
            viewModel.studyQualityPercentStyle = ko.computed(function() {
                // NOTE that we impose a minimum width, so the score is legible
                return Math.max(viewModel.studyQualityPercent(), 8) + "%";
            });
            viewModel.studyQualityBarClass = ko.computed(function() {
                var score = viewModel.studyQualityPercent();
                return scoreToBarClasses(score);
            });

            // keep a very tentative list of failed OTU mappings (any change in hints should clear it)
            var mappingHints = getOTUMappingHints();
            //var hintsMessage = getMessagesForAnnotationEvent( mappingHints )[0];

            /* TODO: any edits in this area should nudge the MAPPING_HINTS tickler
            mappingHints.data.searchContext.$.subscribe(clearFailedOTUList);
            mappingHints.data.substitutions.substitution.subscribe(clearFailedOTUList);
            $.each(mappingHints.data.substitutions.substitution, function(i, subst) {
                subst['@active'].subscribe(clearFailedOTUList);
                subst.new.$.subscribe(clearFailedOTUList);
                subst.old.$.subscribe(clearFailedOTUList);
            });
            */
            viewModel.ticklers.MAPPING_HINTS.subscribe(clearFailedOTUList);

            var mainPageArea = $('#main .tab-content')[0];
            ko.applyBindings(viewModel, mainPageArea);

            var studyFullReference = getMetaTagValue(viewModel.nexml.meta, 'ot:studyPublicationReference');
            var studyCompactReference = fullToCompactReference(studyFullReference);
            $('#main-title').html('<span style="color: #ccc;">Editing study</span> '+ studyCompactReference);

            var studyDOI = getMetaTagValue(viewModel.nexml.meta, 'ot:studyPublication');
            studyDOI = $.trim(studyDOI);
            if (studyDOI === "") {
                $('a.main-title-DOI').hide();
            } else {
                $('a.main-title-DOI').text(studyDOI).attr('href', studyDOI).show();
            }

            // update quality assessment whenever anything changes
            // TODO: throttle this back to handle larger studies?
            updateQualityDisplay();

            // init (or refresh) the study tags
            if (studyTagsInitialized) {
                $('#study-tags').tagsinput('destroy');
            }
            $('#study-tags').tagsinput( tagsOptions );
            studyTagsInitialized = true;

            $('#ajax-busy-bar').hide();
            showInfoMessage('Study data loaded.');
        }
    });
}

function floatToPercent( dec ) {
    // assumes a float between 0.0 and 1.0
    // EXAMPLE: 0.232 ==> 23%
    return Math.round(dec * 100);
}
function scoreToBarClasses( percentScore ) {
    if (percentScore > 80) {
        return 'progress progress-success';  // green bar
    } else if (percentScore > 40) {
        return 'progress progress-warning';  // orange bar
    } else {
        return 'progress progress-danger';   // red bar
    }
}

function updateQualityDisplay () {
    // generate, then apply, fresh scoring information
    console.log(">>> updateQualityDisplay() STARTING");
    
    ///var triggers = [ viewModel.ticklers.STUDY_HAS_CHANGED() ];
    ///viewModel.ticklers.STUDY_HAS_CHANGED();

    var scoreInfo = scoreStudy(viewModel);

    // update "progress bar" with percentage and color
    viewModel.studyQualityPercent( floatToPercent(scoreInfo.overallScore) );
    // update list of suggested actions below
    var $detailsPanel = $('#study-quality-details');
    // update local tallies and suggestions in each matching tab and panel
    var $navTabs = $('.nav-tabs:eq(0) li');
    
    var addingCriteriaPanels = ($detailsPanel.find('div.criterion-details').length === 0);
    var cName, criterionScoreInfo, cPercentScore, criterionRules, rule, ruleScoreInfo;
    var nthPanel = 0, $cPanel, $cProgressBar, $cSuggestionsList, $cTabTally, $cTabSuggestionList, suggestionCount;
    for (cName in scoreInfo.scoredCriteria) {
        if (addingCriteriaPanels) {
            // generate criteria detail areas (once only!)
            $detailsPanel.append(
                '<div class="criterion-details" onclick="goToTab(\''+ cName +'\'); return false;">'
                  + '<strong>'+ cName +'</strong>'
                  + '<span class="criterion-score">50%</span>'
                  + '<div class="progress progress-info criterion-score-bar">'
                    + '<div class="bar" style="width: 50%;"></div>'
                  + '</div>'
                  + '<ul></ul>'
              + '</div>'
            );
        }
        criterionScoreInfo = scoreInfo.scoredCriteria[ cName ];
        $cPanel = $detailsPanel.find('div.criterion-details:eq('+ nthPanel +')');

        if (criterionScoreInfo.highestPossibleScore === 0.0) {
            //continue;
            cPercentScore = 100;  // placeholder if there are no active rules for this criterion
        } else {
            cPercentScore = floatToPercent(criterionScoreInfo.score / criterionScoreInfo.highestPossibleScore);
        }

        $cPanel.find('.criterion-score').text( cPercentScore+'%' );
        $cPanel.find('.criterion-score-bar').attr('class', 'criterion-score-bar '+ scoreToBarClasses( cPercentScore ));
        $cPanel.find('.criterion-score-bar .bar').css('width', Math.max(4, cPercentScore)+'%')
        $cSuggestionsList = $cPanel.find('ul');
        
        // find a tab whose name matches this criterion
        $cTabTally = $navTabs.filter(':contains('+ cName +')').find('span.badge');

        $cTabSugestionList = $('.tab-pane[id='+ cName.replace(' ','-') +'] ul.suggestion-list');

        $cSuggestionsList.empty();
        $cTabSugestionList.empty();
        var suggestionCount = 0;

        for (var i = 0; i < criterionScoreInfo.comments.length; i++) {
            var c = criterionScoreInfo.comments[i];
            // show suggestion action for editors, or failure message for other viewers
            var displayMessage;
            if (viewOrEdit == 'EDIT') {
                displayMessage = c.suggestedAction;
            } else {
                displayMessage = c.message;
            }

            if (c.suggestedAction) {
                suggestionCount++;
                $cSuggestionsList.append('<li>'+ displayMessage +'</li>');
                $cTabSugestionList.append('<li>'+ displayMessage +'</li>');  /// TODO: restore this? +' <span style="color: #aaa;">('+ c.percentScore +'%)</span></a></li>');
            }
        }
    
        if (suggestionCount === 0) {
            $cTabTally.hide();
        } else {
            $cTabTally.text(suggestionCount).show();
        }

        nthPanel++;
    };

}

function toggleQualityDetails( hideOrShow ) {
    // might be called directly from the toggle, or by someone else
    var $toggle = $('#quality-details-toggle');
    var $detailsPanel = $('#study-quality-details');
    if ($detailsPanel.is(':visible') || hideOrShow === 'HIDE') {
        $detailsPanel.slideUp();
        $toggle.text('(show details)');
    } else {
        $detailsPanel.slideDown();
        $toggle.text('(hide details)');
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

function updateMappingStatus() {
    // update mapping status+details based on the current state of things
    var detailsHTML, showBatchApprove, showBatchReject, needsAttention;
    
    /* TODO: defaults assume nothing particularly interesting going on
    detailsHTML = '';
    showBatchApprove = false;
    showBatchReject = true;
    needsAttention = false;
    */
    var proposedMappingNeedsDecision = false;
    for (var p in proposedOTUMappings()) {
        // the presence of anything here means there are proposed mappings
        proposedMappingNeedsDecision = true;
    }

    if (autoMappingInProgress() === true) {
        // auto-mapping is ACTIVE (meaning we have work in hand)
        detailsHTML = '<p'+'>Mapping in progress...<'+'/p>';
        showBatchApprove = false;
        showBatchReject = false;
        needsAttention = false;
    } else {
        if (getNextUnmappedOTU()) {
            // IF auto-mapping is PAUSED, but there's more to do on this page
            detailsHTML = '<p'+'>Mapping paused. Please adjust mapping hints and click the '
                         +'<strong>Start mapping</strong> button above to try again.<'+'/p>';
            showBatchApprove = false;
            showBatchReject = proposedMappingNeedsDecision;
            needsAttention = proposedMappingNeedsDecision;
        } else {
            // auto-mapping is PAUSED and everything's been mapped
            if (proposedMappingNeedsDecision) {
                // there are proposed mappings awaiting a decision
                detailsHTML = '<p'+'>All visible OTUs have been mapped. Use the '
                        +'<span class="btn-group" style="margin: -2px 0;">'
                        +' <button class="btn btn-mini disabled"><i class="icon-ok"></i></button>'
                        +' <button class="btn btn-mini disabled"><i class="icon-remove"></i></button>'
                        +'</span>'
                        +' buttons to approve or reject each suggested mapping, or'
                        +' or the buttons below to approve or reject the suggestions for all visible OTUs.<'+'/p>'; 
                showBatchApprove = true;
                showBatchReject = true;
                needsAttention = true;
            } else {
                // there are NO proposed mappings awaiting a decision
                //
                /* TODO: check for two possibilities here
                if () {
                    // we can add more by including 'All trees'
                    detailsHTML = '<p'+'><strong>Congrtulations!</strong> '
                            +'Mapping is suspended because all OTUs in this '
                            +'study\'s preferred trees have approved labels already. To continue, '
                            +'reject some mapped labels with the '
                            +'<span class="btn-group" style="margin: -2px 0;">'
                            +' <button class="btn btn-mini disabled"><i class="icon-remove"></i></button>'
                            +'</span> '
                            +'button or change the filter to <strong>In all trees</strong>.<'+'/p>'; 
                    showBatchApprove = false;
                    showBatchReject = false;
                    needsAttention = true;
                } else {
                    // we're truly done with mapping (in all trees)
                    detailsHTML = '<p'+'><strong>Congrtulations!</strong> '
                            +'Mapping is suspended because all OTUs in this study have approved '
                            +'labels already.. To continue, use the '
                            +'<span class="btn-group" style="margin: -2px 0;">'
                            +' <button class="btn btn-mini disabled"><i class="icon-remove"></i></button>'
                            +'</span>'
                            +' buttons to reject any label at left.<'+'/p>'; 
                    showBatchApprove = false;
                    showBatchReject = false;
                    needsAttention = true;
                }
                */

                /* TODO: replace this stuff with if/else block above 
                 */
                detailsHTML = '<p'+'>Mapping is suspended because all visible OTUs have approved '
                        +' labels already. To continue, use the '
                        +'<span class="btn-group" style="margin: -2px 0;">'
                        +' <button class="btn btn-mini disabled"><i class="icon-remove"></i></button>'
                        +'</span>'
                        +' buttons to reject any label at left, or change the filter and sort options'
                        +' to bring unmapped OTUs into view.<'+'/p>'; 
                showBatchApprove = false;
                showBatchReject = false;
                needsAttention = true;
            }
        }
    }

    $('.mapping-details').html(detailsHTML);
    if (showBatchApprove || showBatchReject) {
        $('.mapping-batch-operations').show();
        if (showBatchApprove) {
            $('.mapping-batch-operations #batch-approve').show();
        } else {
            $('.mapping-batch-operations #batch-approve').hide();
        }
        if (showBatchReject) {
            $('.mapping-batch-operations #batch-reject').show();
        } else {
            $('.mapping-batch-operations #batch-reject').hide();
        }
    } else {
        $('.mapping-batch-operations').hide();
    }
    if (needsAttention) {
        $('#mapping-status-panel').addClass('mapping-needs-attention');
    } else {
        $('#mapping-status-panel').removeClass('mapping-needs-attention');
    }
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
    // add non-Nexson values to the query string
    var qsVars = $.param({
        author_name: authorName,
        author_email: authorEmail,
        auth_token: authToken
    });
    console.log("BEFORE: "+ saveURL);
    saveURL += ('?'+ qsVars);
    console.log("AFTER: "+ saveURL);

    // strip any extraneous JS properties from study Nexson
    $.each( viewModel.nexml.trees.tree, function(i, tree) {
        clearD3PropertiesFromTree(tree);
    });
    
    $.ajax({
        type: 'PUT',
        dataType: 'json',
        // crossdomain: true,
        contentType: "application/json; charset=utf-8",
        url: saveURL,
        processData: false,
        data: JSON.stringify(viewModel.nexml),
        /* TODO: add non-nexson to query string!
        OLDdata: {
            // use JSON stringify (if available) for faster submission of JSON
            nexson: ko.mapping.toJSON(viewModel),
            author_name: authorName,
            author_email: authorEmail,
            auth_token: authToken
        },
        */
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

function getMetaTagByID(array, id) {
    // fetch complete metatag in the specified list by matching the specified ID
    return getNexsonChildByProperty(array, 'id', id);
}

function getMetaTagByProperty(array, prop) {
    // fetch complete metatag in the specified list by matching the specified ID
    // TODO: support all if multiple instances?
    return getNexsonChildByProperty(array, '@property', prop);
}

function getOTUByID(id) {
    // fetch complete metatag in the specified list by matching the specified ID
    return getNexsonChildByProperty(viewModel.nexml.otus.otu, '@id', id);
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

function getNexsonChildByProperty(children, property, value, options) {
    // fetch complete element in the specified list by matching the specified property
    var foundMatch;
    var returnAll = (typeof(options) === 'object' && options.FIND_ALL); // else return first match found
    var allMatches = [ ];

    // NOTE that according to Badgerfish rules, the hoped-for array might
    // be a simple object (singleton) or missing entirely!
    // See http://badgerfish.ning.com/
    children = makeArray( children );

    for (var i = 0; i < children.length; i++) {
        var testItem = children[i];
        switch(typeof(testItem[ property ])) {
            case 'undefined':
            case 'object':
                continue;
            case 'function':
                if (testItem[ property ] === value) {
                    foundMatch = testItem;
                    break;
                }
                continue;
            default:
                if (testItem[ property ] === value) {
                    foundMatch = testItem;
                    break;
                }
                continue;
        }

        if (returnAll) {
            allMatches.push(foundMatch);
        } else {
            return foundMatch;
        }
    }
    if (returnAll) {
        return allMatches;
    } else {
        return null;
    }
}

function getMetaTagValue(array, propertyName, options) {
    // fetch current value(s) for a metatag in the specified list, using its @property value
    var foundValue = null;
    var returnAll = (typeof(options) === 'object' && options.FIND_ALL); // else return first match found
    var allValues = [ ];

    // adjust matchingTags to ensure uniform handling below
    var matchingTags = getNexsonChildByProperty(array, '@property', propertyName, options);
    matchingTags = makeArray( matchingTags );

    $.each(matchingTags, function(i, testItem) {
        foundValue = testItem[ valueFieldForMetaTag( testItem ) ];
        if (returnAll) {
            allValues.push(foundValue);
        } else {
            return false;
        }
    });
    if (returnAll) {
        return allValues;
    } else {
        return foundValue;
    }
}

function valueFieldForMetaTag( metatag ) {
    // where does this metatag hold its main value?
    switch( metatag['@xsi:type']) {
        case 'nex:ResourceMeta':
            return '@href';  // uses special attribute
        case 'nex:LiteralMeta':
        default: 
            return '$'; // assumes value is stored here
    }
}

function getMetaTagAccessorByAtProperty(array, propertyName, options) {
    // fetch accessor function(s) for a metatag in the specified list, using its @property value
    var foundAccessor = null;
    var returnAll = (typeof(options) === 'object' && options.FIND_ALL); // else return first match found
    var allAccessors = [ ];

    // adjust matchingTags to ensure uniform handling below
    var matchingTags = getNexsonChildByProperty(array, '@property', propertyName, options);
    matchingTags = makeArray( matchingTags );

    for (var i = 0; i < matchingTags.length; i++) {
        var testItem = matchingTags[i];
        switch(ko.unwrap(testItem['@xsi:type'])) {
            case 'nex:ResourceMeta':
                foundAccessor = testItem['@href'];  // uses special attribute
                break;
            default: 
                foundAccessor = testItem.$; // assumes value is stored here
        }
        if (returnAll) {
            allAccessors.push(foundAccessor);
        } else {
            return foundAccessor;
        }
    }
    if (returnAll) {
        return allAccessors;
    } else {
        return null;
    }
}

function getPreferredTreeIDs() {
    preferredTreeIDs = [];
    var candidateTreeMarkers = getMetaTagAccessorByAtProperty(viewModel.nexml.meta, 'ot:candidateTreeForSynthesis', { 'FIND_ALL': true });
    $.each(candidateTreeMarkers, function(i, marker) {
        var treeID = $.trim(marker());
        switch(treeID) {  // non-empty points to a candidate tree
            case '':
            case '0':
                break;
            default:
                preferredTreeIDs.push( treeID );
        }
    });
    return preferredTreeIDs;
}
function getPreferredTrees() {
    var preferredTreeIDs = getPreferredTreeIDs();
    return ko.utils.arrayFilter( 
        viewModel.nexml.trees.tree, 
        function(tree) {
            return $.inArray( tree['@id'], preferredTreeIDs );
        }
    );
}
function getNonPreferredTrees() {
    var preferredTreeIDs = getPreferredTreeIDs();
    return ko.utils.arrayFilter( 
        viewModel.nexml.trees.tree, 
        function(tree) {
            return ! $.inArray( tree['@id'], preferredTreeIDs );
        }
    );
}

function getPageNumbers( pagedArray ) {
    // Generates an array of display numbers (1-based) for use with Knockout's
    // foreach binding. Let's build this with one-based values for easy display.
    var pageNumbers = [ ];
    var howManyPages = Math.ceil(pagedArray().length / pagedArray.pageSize);
    for (var i = 1; i <= howManyPages; i++) {
        pageNumbers.push( i );
    }
    return pageNumbers;
}

function getMappedTallyForTree(tree) {
    // return display-ready tally (mapped/total ratio and percentage)
    if (!tree || !tree.node || tree.node.length === 0) {
        return '<strong>0</strong><span>'+ thinSpace +'/'+ thinSpace + '0 &nbsp;</span><span style="color: #999;">(0%)</span>';
    }

    var totalNodes = 0;
    var totalLeafNodes = 0;
    var mappedLeafNodes = 0;
    ///console.log("Testing "+ totalLeafNodes +" nodes in this tree"); // against "+ sstudyOTUs.length +" study OTUs");
    $.each(tree.node, function(i, node) {
        totalNodes++;

        if (!node.meta) {
            // console.log("node has no meta, skipping it...");
            return true;
        }
        // Is this a leaf node? If not, skip it
        var isLeafAccessor = getMetaTagAccessorByAtProperty(node.meta, 'ot:isLeaf');
        if ((typeof(isLeafAccessor) !== 'function') || (isLeafAccessor() !== 'true')) {
            // this is not a leaf node! skip to the next one
            return true;
        }
        totalLeafNodes++;

        // Simply check for the presence (or absence) of an @otu 'getter' function
        // (so far, it doesn't seem to exist unless there's a mapped OTU)
        var nodeOTUAccessor = node['@otu'];
        if (typeof(nodeOTUAccessor) === 'function') {
            mappedLeafNodes++;
        } 
        return true;  // skip to next node

    });
    // console.log("total nodes? "+ totalNodes);
    // console.log("total leaf nodes? "+ totalLeafNodes);
    // console.log("mapped leaf nodes? "+ mappedLeafNodes);

    var thinSpace = '&#8201;';
    return '<strong>'+ mappedLeafNodes +'</strong><span>'+ thinSpace +'/'+ thinSpace + totalLeafNodes +' &nbsp;</span><span style="color: #999;">('+ floatToPercent(mappedLeafNodes/totalLeafNodes) +'%)</span>';
}

function getRootedDescriptionForTree( tree ) {
    // return display-ready description ('Rooted', 'Unrooted', 'Multiply rooted') based on count
    if (!tree || !tree.node || tree.node.length === 0) {
        return 'Unrooted (empty)';
    }

    /* Old method, based on nodes marked with @root flag
    var rootedNodes = 0;
    $.each(tree.node, function(i, node) {
        // Simply check for the presence (or absence) of a @root 'getter' function
        // (so far, it doesn't seem to exist unless there's a mapped OTU)
        
        var rootAccessor = node['@root'];
        if (typeof(rootAccessor) === 'function') {
            //console.log('@root found, value = '+ rootAccessor() +' <'+ typeof(rootAccessor()) +'>');
            rootedNodes++;
        } 
        return true;  // skip to next node
    });

    switch (rootedNodes)  {
        case 0:
            return 'Unrooted';
        case 1:
            return 'Singly'; // OR 'Rooted';
        default:
            return 'Multiply rooted';
    }
    */
    
    // Apply our "business rules" for tree and/or ingroup rooting, based on
    // tree-level metadata.
    var specifiedRootTag = getMetaTagByProperty(tree.meta, 'ot:specifiedRoot');
    var specifiedRoot = specifiedRootTag ? specifiedRootTag.$ : null;

    var unrootedTreeFlag = getMetaTagByProperty(tree.meta, 'ot:unrootedTree');
    var unrootedTree = unrootedTreeFlag ? unrootedTreeFlag.$ === 'true' : false;

    var inGroupCladeTag = getMetaTagByProperty(tree.meta, 'ot:inGroupClade');
    var inGroupClade = inGroupCladeTag ? inGroupCladeTag.$ : null;

    var nearestOutGroupNeighborTag = getMetaTagByProperty(tree.meta, 'ot:nearestOutGroupNeighbor');
    var nearestOutGroupNeighbor = nearestOutGroupNeighborTag ? nearestOutGroupNeighborTag.$ : null;

    if (specifiedRoot && inGroupClade) {
        return "Explicitly rooted tree, ingroup specified";
    } 
    if (specifiedRoot) {
        return "Explicitly rooted tree, no ingroup";
    } 
    if (unrootedTree) {
        if (inGroupClade) {
            return "Unrooted tree, ingroup specified";
        }
        return "Unrooted  tree, no ingroup";
    } else {
        if (inGroupClade) {
            return "Implicitly rooted tree, ingroup specified";
        }
        return "Implicitly rooted tree, no ingroup";
    }
}
function getRootNodeDescriptionForTree( tree ) {
    // return display-ready description ('node123 [implicit]', 'node234 [explicit]', 'No root', ...)
    if (!tree || !tree.node || tree.node.length === 0) {
        return 'No root (empty tree)';
    }
    
    // Apply our "business rules" for tree and/or ingroup rooting, based on
    // tree-level metadata.
    var specifiedRootTag = getMetaTagByProperty(tree.meta, 'ot:specifiedRoot');
    var specifiedRoot = specifiedRootTag ? specifiedRootTag.$() : null;

    var unrootedTreeFlag = getMetaTagByProperty(tree.meta, 'ot:unrootedTree');
    var unrootedTree = unrootedTreeFlag ? unrootedTreeFlag.$() === 'true' : false;

    // if no specified root node, use the implicit root (first in nodes array)
    var rootNodeID = specifiedRoot ? specifiedRoot : tree.node[0]['@id'];

    var nodeName = ('Unmapped ('+ rootNodeID +')');
    $.each(tree.node, function(i, node) {
        // Find the node with this ID and see if it has an assigned OTU
        if (node['@id'] === rootNodeID) {
            var nodeOTUAccessor = node['@otu'];
            if (typeof(nodeOTUAccessor) === 'function') {
                var nodeOTU = nodeOTUAccessor();
                // find the matching OTU and show its label
                $.each(viewModel.nexml.otus.otu, function(i, otu) {
                    // Find the node with this ID and see if it has an assigned OTU
                    if (otu['@id'] === nodeOTU) {
                        nodeName = otu['@label'] || 'Unlabeled OTU';
                    }
                });
            } 
            return false; // stop checking nodes
        }
        return true;  // skip to next node
    });

    if (specifiedRoot) {
        return nodeName +" [explicit]";
    } 
    if (unrootedTree) {
        return "No root [explicit]";
    } else {
        return nodeName +" [implicit]";
    }
}

var branchLengthModeDescriptions = [
    { value: 'ot:substitutionCount', text: "Number of substitutions" }, 
    { value: 'ot:changesCount', text: "Number of changes" },
    { value: 'ot:time', text: "Time" },  //  TODO: add units from ot:branchLengthTimeUnit
    { value: 'ot:bootstrapValues', text: "Bootstrap values" },
    { value: 'ot:posteriorSupport', text: "Posterior support values" },
    { value: 'ot:other', text: "Other" },  // TODO: refer ot:branchLengthDescription
    { value: 'ot:undefined', text: "Undefined values" }
]
function getBranchLengthModeDescriptionForTree( tree ) {
    var modeAccessor = getMetaTagAccessorByAtProperty(tree.meta, 'ot:branchLengthMode');
    if (typeof(modeAccessor) !== 'function') {
        return 'Unspecified';
    }
    var rawModeValue = modeAccessor();
    var description = rawModeValue;
    $.each( branchLengthModeDescriptions, function( i, item ) {
        if (item.value === rawModeValue) {
            description = item.text;
            return false;
        } 
        return true;
    });
    // some values require a closer look
    switch( rawModeValue ) {
        case 'ot:time':
            var displayUnit = getBranchLengthUnitForTree( tree );
            return description +" ("+ displayUnit +")";
            break;
        case 'ot:other':
            return getBranchLengthDescriptionForTree( tree );
            break;
        default:
            return description;
    }
}
function getBranchLengthUnitForTree( tree ) {
    var unitAccessor = getMetaTagAccessorByAtProperty(tree.meta, 'ot:branchLengthTimeUnit');
    if (typeof(unitAccessor) !== 'function') {
        return 'Myr?';
    }
    return unitAccessor();
}
function getBranchLengthDescriptionForTree( tree ) {
    // NOTE that this is an explicit description in its own field, for
    // use when 'ot:other' is specified for the branchLengthMode!
    var descAccessor = getMetaTagAccessorByAtProperty(tree.meta, 'ot:branchLengthDescription');
    if (typeof(descAccessor) !== 'function') {
        return 'Undefined';
    }
    return descAccessor();
}

function getInGroupCladeDescriptionForTree( tree ) {
    // return display-ready description ('Rooted', 'Unrooted', 'Multiply rooted') based on count
    if (!tree || !tree.meta || makeArray(tree.meta).length === 0) {
        return 'Unspecified';
    }

    // try to retrieve a recognizable taxon label for the ingroup clade's root
    var nodeIDAccessor = getMetaTagAccessorByAtProperty(tree.meta, 'ot:inGroupClade');
    if (typeof(nodeIDAccessor) !== 'function') {
        return 'Unspecified';
    }
    var nodeID = nodeIDAccessor();
    var nodeName = ('Unmapped ('+ nodeID +')');

    $.each(tree.node, function(i, node) {
        // Find the node with this ID and see if it has an assigned OTU
        if (node['@id'] === nodeID) {
            var nodeOTUAccessor = node['@otu'];
            if (typeof(nodeOTUAccessor) === 'function') {
                var nodeOTU = nodeOTUAccessor();
                // find the matching OTU and show its label
                $.each(viewModel.nexml.otus.otu, function(i, otu) {
                    // Find the node with this ID and see if it has an assigned OTU
                    if (otu['@id'] === nodeOTU) {
                        nodeName = otu['@label'] || 'Unlabeled OTU';
                    }
                });
            } 
            return false; // stop checking nodes
        }
        return true;  // skip to next node
    });

    return nodeName;
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
 * Let's try again, organizing by tab (Status, Metadata, etc)
 */
var studyScoringRules = {
    'Metadata': [
        // problems with study metadata, DOIs, etc
        {
            description: "The study should have all metadata fields complete.",
            test: function(studyData) {
                // check for non-empty fields in all metadata
                var studyMetatags = makeArray(studyData.nexml.meta);
                for (var i = 0; i < studyMetatags.length; i++) {
                    var testMeta = studyMetatags[i];
                    var testProperty = testMeta['@property'];
                    switch(testProperty) {
                        case 'ot:studyPublicationReference':
                        case 'ot:studyPublication':
                        case 'ot:studyYear':
                        case 'ot:studyId':
                        case 'ot:focalClade':
                        case 'ot:curatorName':
                            var testValue;
                            switch(testMeta['@xsi:type']) {
                                case 'nex:ResourceMeta':
                                    testValue = testMeta['@href'];  // uses special attribute
                                    break;
                                default: 
                                    testValue = testMeta['$']; // assumes value is stored here
                            }
                            if ($.trim(testValue) === "") {
                                ///console.log(">>> metatag '"+ testMeta['@property'] +"' is empty!");
                                return false;
                            }
                            break;

                        default:
                            // ignore other meta tags (annotations)
                            ///console.log('found some other metadata (annotation?): '+ testProperty);
                            continue;
                    }
                }
                return true;
            },
            weight: 0.35, 
            successMessage: "All metadata fields have data.",
            failureMessage: "Some metadata fields need data.",
            suggestedAction: "Check study metadata for empty fields."
                // TODO: add hint/URL/fragment for when curator clicks on suggested action?

        },
        {
            description: "The study year should match the one in its publication reference.",
            test: function(studyData) {
                // compare metatags for study year and publication reference
                debugger;
                var ticklers = [viewModel.ticklers.GENERAL_METADATA()];
                var studyMetatags = studyData.nexml.meta;
                var studyYear = getMetaTagValue(studyMetatags, 'ot:studyYear');
                var pubRef = getMetaTagValue(studyMetatags, 'ot:studyPublicationReference');
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
                var studyMetatags = studyData.nexml.meta;
                var DOI = getMetaTagValue(studyMetatags, 'ot:studyPublication');
                var pubRef = getMetaTagValue(studyMetatags, 'ot:studyPublicationReference');
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
    'Trees': [
        // no trees, unrooted or badly rooted trees
        {
            description: "The study should contain at least one tree.",
            test: function(studyData) {
                // check for a tree in this study
                return (viewModel.nexml.trees.tree.length > 0);
            },
            weight: 0.5, 
            successMessage: "The study contains at least one tree.",
            failureMessage: "The study should contain at least one tree.",
            suggestedAction: "Upload or enter a tree for this study."
                // TODO: add hint/URL/fragment for when curator clicks on suggested action?
        },
        {
            description: "There should be at least one candidate tree (unless submitter has opted out).",
            test: function(studyData) {
                // check for opt-out flag
                var optOutFlag = getMetaTagAccessorByAtProperty(studyData.nexml.meta, 'ot:notIntendedForSynthesis');
                if (optOutFlag && (optOutFlag() == true)) {
                    // submitter has explicitly said this study is not intended for synthesis
                    return true;
                }
                // check for any candidate tree in the study
                var candidateTreeFound = false;
                var candidateTreeMarkers = getMetaTagAccessorByAtProperty(studyData.nexml.meta, 'ot:candidateTreeForSynthesis', { 'FIND_ALL': true });
                $.each(candidateTreeMarkers, function(i, marker) {
                    switch(marker()) {  // non-empty points to a candidate tree
                        case '':
                        case null:
                        case undefined:
                        case 0:
                            break;
                        default:
                            candidateTreeFound = true;
                    }
                });
                return candidateTreeFound;
            },
            weight: 0.3, 
            successMessage: "There is at least one candidate tree, or the submitter has opted out of synthesis.",
            failureMessage: "There should be at least one candidate tree, or the submitter should opt out of synthesis.",
            suggestedAction: "Mark a tree as candidate for synthesis, or opt out of synthesis in Metadata."
                // TODO: add hint/URL/fragment for when curator clicks on suggested action?
        },
        {
            description: "Each tree should be rooted (unless submitter has opted out).",
            test: function(studyData) {
                // check for opt-out flag
                var optOutFlag = getMetaTagAccessorByAtProperty(studyData.nexml.meta, 'ot:notUsingRootedTrees');
                if (optOutFlag && (optOutFlag() == true)) {
                    // submitter has explicitly said this study does not have rooted trees
                    return true;
                }
                // check for a proper root node in each tree found (TODO: check 'candidates' only?)
                var unrootedTreeFound = false;
                $.each(studyData.nexml.trees.tree, function(i, tree) {
                    // check for explicit tree-level marker (ot:inGroupClade) versus arbitrary root
                    var rootNodeIDGetter = getMetaTagAccessorByAtProperty(tree.meta, 'ot:inGroupClade');
                    if (typeof(rootNodeIDGetter) === 'function') {
                        var rootNodeID = rootNodeIDGetter();
                        ///console.log('>>> found this rootNodeID: '+ rootNodeID + '<'+ typeof(rootNodeID) +'>');
                        switch(rootNodeID) {
                            // TODO: Test live data to see what "none" or "empty" looks like in this field
                            case '':
                            case null:
                            case undefined:
                            case 0:
                            case 'none':
                                unrootedTreeFound = true;
                                return false;  // done looping through trees
                            default:
                                return true; // try the next tree
                        }
                    } else {
                        // no metadata on this tree, or no tag for inGroupClade
                        unrootedTreeFound = true;
                        return false;  // done looping through trees
                    }
                });
                // if no rootless trees were found, it passes the test
                return !unrootedTreeFound;
            },
            weight: 0.3, 
            successMessage: "All trees are properly rooted, or the submitter has specified unrooted trees.",
            failureMessage: "Every tree should be properly rooted, or the submitter should opt out of rooted trees.",
            suggestedAction: "Designate a root node for each tree, or specified only unrooted trees in Metadata."
                // TODO: add hint/URL/fragment for when curator clicks on suggested action?
        }
    ],
    'Files': [
        // problems with uploaded files (formats, missing, corrupt)
                        {
                            description: "placeholder to fake happy data",
                            test: function() {
                                return true;
                            },
                            weight: 0.4, 
                            successMessage: "",
                            failureMessage: "",
                            suggestedAction: ""
                                // TODO: add hint/URL/fragment for when curator clicks on suggested action?
                        }
    ],
    'OTU Mapping': [
        // un-mapped taxon names, conflicting or dubious mapping
        {
            description: "All leaf nodes in candidate trees should be mapped to OTUs.",
            test: function(studyData) {
                // check for opt-out flag
                var optOutFlag = getMetaTagAccessorByAtProperty(studyData.nexml.meta, 'ot:notIntendedForSynthesis');
                if (optOutFlag && (optOutFlag() == true)) {
                    // submitter has explicitly said this study is not intended for synthesis
                    return true;
                }
               
                // find all the candidate trees by ID (on study metadata) and build a tally tree
                var candidateTreeTallies = { };
                var candidateTreeMarkers = getMetaTagAccessorByAtProperty(studyData.nexml.meta, 'ot:candidateTreeForSynthesis', { 'FIND_ALL': true });
                $.each(candidateTreeMarkers, function(i, marker) {
                    var treeID = marker();
                    switch(treeID) {  // non-empty points to a candidate tree
                        case '':
                        case null:
                        case undefined:
                        case 0:
                            break;
                        default:
                            candidateTreeTallies[ treeID ] = {};
                    }
                });
                
                // check the proportion of mapped leaf nodes in all candidate trees
                var unmappedLeafNodesFound = false;
                $.each(studyData.nexml.trees.tree, function(i, tree) {
                    // skip any non-candidate trees
                    treeID = tree['@id'];
                    if (!candidateTreeTallies[ treeID ]) {
                        // skip this tree (not a candidate)
                        return true;
                    }

                    if (!tree.node || tree.node.length === 0) {
                        // skip this tree (no nodes yet, which is weird but not relevant to the test)
                        //candidateTreeTalies[ treeID ].mappedNodes = 0;
                        //candidateTreeTalies[ treeID ].totalNodes = 0;
                        return true;
                    }

                    // only check the leaf nodes on the tree
                    var totalNodes = 0;
                    var mappedNodes = 0;
                    $.each(tree.node, function(i, node) {
                        // is this a leaf? check for metatag .isLeaf
                        var leafMarker = getMetaTagAccessorByAtProperty(node.meta, 'ot:isLeaf');
                        if (leafMarker() == true) {
                            // Simply check for the presence (or absence) of an @otu 'getter' function
                            // (so far, it doesn't seem to exist unless there's a mapped OTU)
                            totalNodes++;
                            var nodeOTUAccessor = node['@otu'];
                            if (typeof(nodeOTUAccessor) === 'function') {
                                mappedNodes++;
                            } else {
                                unmappedLeafNodesFound = true;
                                return false;   // bail out of loop
                            }
                        }
                    });
                    // TODO: actually count these, for a proportional score?
                    //candidateTreeTalies[ treeID ].mappedNodes = mappedNodes;
                    //candidateTreeTalies[ treeID ].totalNodes = totalNodes;
                });
                // if no unmapped leaf nodes were found, it passes the test
                return !unmappedLeafNodesFound;
            },
            weight: 0.5, 
            successMessage: "Candidate trees (submitted for synthesis) have all their leaves mapped to OTUs.",
            failureMessage: "There are unmapped leaf nodes in your candidate trees (submitted for synthesis).",
            suggestedAction: "Review all unmapped nodes in OTU Mapping."
                // TODO: add hint/URL/fragment for when curator clicks on suggested action?
        }
    ],
    'Annotations': [
        // pending or unanswered questions, etc.
                        {
                            description: "placeholder to fake happy data",
                            test: function() {
                                return true;
                            },
                            weight: 0.4, 
                            successMessage: "",
                            failureMessage: "",
                            suggestedAction: ""
                                // TODO: add hint/URL/fragment for when curator clicks on suggested action?
                        }
    ],
    'Tools': [
        // maybe just happy news here.. new tools available?
                        {
                            description: "placeholder to fake happy data",
                            test: function() {
                                return true;
                            },
                            weight: 0.4, 
                            successMessage: "",
                            failureMessage: "",
                            suggestedAction: ""
                                // TODO: add hint/URL/fragment for when curator clicks on suggested action?
                        }
    ],
    'Status': [
        // general validation problems... something that spans multiple tabs
                        {
                            description: "placeholder to fake happy data",
                            test: function() {
                                return true;
                            },
                            weight: 0.4, 
                            successMessage: "",
                            failureMessage: "",
                            suggestedAction: ""
                                // TODO: add hint/URL/fragment for when curator clicks on suggested action?
                        }
    ]
}


function scoreStudy( studyData ) {
    // TODO: specify viewModel (fastest)? or JSON version? 
    // apply studyScoringRules below, recording score, comments

    var scoreInfo = {
        rawOverallScore: 0.0,
        highestPossibleOverallScore: 0.0,  // normalize the final score relative to the max possible
        overallScore: 0.0,  // build up a non-zero score, composed of all (relative) weight values
        allComments: new Array(),
        scoredCriteria: {}  // support detailed display for each criterion
    }

    var i, cName, criterionScoreInfo, criterionRules, rule, ruleScoreInfo;
    for(cName in studyScoringRules) {
        criterionScoreInfo = {
            score: 0.0,
            highestPossibleScore: 0.0,
            comments: new Array()
        };
        scoreInfo.scoredCriteria[cName] = criterionScoreInfo;

        criterionRules = studyScoringRules[cName];
        ///console.log("Checking study against rules for "+ cName +"...");
        for (i = 0; i < criterionRules.length; i++) {
            rule = criterionRules[i];
            ///console.log("  rule.weight = "+ rule.weight);
            
            // bump up max scores for this criterion and the overall study
            criterionScoreInfo.highestPossibleScore += rule.weight;
            scoreInfo.highestPossibleOverallScore += rule.weight;

            ruleScoreInfo = {
                'weight': rule.weight, 
                'message': null, 
                'success': null,
                'suggestedAction': null
            };

            if (rule.test( studyData )) {
                // passed this test
                ///console.log("  PASSED this rule: "+ rule.description);
                criterionScoreInfo.score += rule.weight;
                scoreInfo.rawOverallScore += rule.weight;

                ruleScoreInfo.message = rule.successMessage;
                ruleScoreInfo.success = true;
                ruleScoreInfo.suggestedAction = null;

            } else {
                // failed this test
                ///console.log("  FAILED this rule: "+ rule.description);
                ruleScoreInfo.message = rule.failureMessage;
                ruleScoreInfo.success = false;
                ruleScoreInfo.suggestedAction = rule.suggestedAction;
            }

            scoreInfo.allComments.push(ruleScoreInfo);
            criterionScoreInfo.comments.push(ruleScoreInfo);
            ///console.log("  now study score is "+ studyScore);
        }
        // sort this criterion's comment list by weight
        criterionScoreInfo.comments.sort(function(a,b) { return parseFloat(b.weight) - parseFloat(a.weight) } )
    }
    // sort full comment list by weight
    scoreInfo.allComments.sort(function(a,b) { return parseFloat(b.weight) - parseFloat(a.weight) } )

    // normalize score vs. highest possible?
    scoreInfo.overallScore = scoreInfo.rawOverallScore / scoreInfo.highestPossibleOverallScore;

    return scoreInfo;
}

/* implement a basic "dirty" flag (to trigger quality assessment), as described here:
 * http://www.knockmeout.net/2011/05/creating-smart-dirty-flag-in-knockoutjs.html
 */
ko.dirtyFlag = function(root, isInitiallyDirty) {
    var result = function() {},
        _initialState = ko.observable(ko.toJSON(root)),
        _isInitiallyDirty = ko.observable(isInitiallyDirty);

    result.isDirty = ko.computed(function() {
        try {
            return _isInitiallyDirty() || _initialState() !== ko.toJSON(root);
        } catch(e) {
            //console.log('toJSON fails with circular reference');
            return true;
        }
    });

    result.reset = function() {
        _initialState(ko.toJSON(root));
        _isInitiallyDirty(false);
    };

    return result;
};

var treeTagsInitialized = false;
function showTreeViewer( tree ) {
    if (viewOrEdit == 'EDIT') {
        if (treeTagsInitialized) {
            $('#tree-tags').tagsinput('destroy');
        }
    }
    // quick test of modal
    $('#tree-viewer .modal-body').css({
        'height': '75%',
        //'border': '1px dashed red',
        'margin-left': '8px'
    });
    $('#tree-viewer').css({
        'width': '90%',
        'margin': 'auto -45%'
    });

    // bind just the selected tree to the modal HTML 
    var boundElement = $('#tree-viewer')[0];
    // NOTE that we must call cleanNode first, to allow "re-binding" with KO
    ko.cleanNode(boundElement);
    ko.applyBindings(tree, boundElement);
    $('#tree-viewer').modal('show');

    if (viewOrEdit == 'EDIT') {
        /*
        if (treeTagsInitialized) {
            $('#tree-tags').tagsinput('destroy');
        }
        */
        $('#tree-tags').tagsinput( tagsOptions );
        treeTagsInitialized = true;
    }

    updateEdgesInTree( tree );
    drawTree( tree );
}

var vizInfo = { tree: null, vis: null };
function drawTree( treeOrID ) {
    var tree = null;
    if (typeof(treeOrID) === 'object') {
        tree = treeOrID;
    } else {
        tree = getTreeByID(treeOrID);
    }

    /* load D3 tree view */
    var specifiedRootTag = getMetaTagByProperty(tree.meta, 'ot:specifiedRoot');
    var specifiedRoot = specifiedRootTag ? specifiedRootTag.$() : null;

    var inGroupCladeTag = getMetaTagByProperty(tree.meta, 'ot:inGroupClade');
    var inGroupClade = inGroupCladeTag ? inGroupCladeTag.$() : null;

    var nearestOutGroupNeighborTag = getMetaTagByProperty(tree.meta, 'ot:nearestOutGroupNeighbor');
    var nearestOutGroupNeighbor = nearestOutGroupNeighborTag ? nearestOutGroupNeighborTag.$() : null;

    // we'll pass this along to helpers that choose node labels, classes, etc.
    var importantNodeIDs = {
        'specifiedRoot': specifiedRoot,
        'inGroupClade': inGroupClade,
        'nearestOutGroupNeighbor': nearestOutGroupNeighbor,
    }

    var root;  // find the root (if any) node for the visible tree
    /* original method was based on "naive" roots, checking node['@root'] === 'true'
    var allRootNodes = getRootTreeNodes(tree);
    switch(allRootNodes.length) {
        case 0:
            console.log("this tree is UNrooted");
            root = tree.node[0];
            break;
        case 1:
            console.log("this tree is SINGLY rooted");
            root = allRootNodes[0];
            break;
        default:
            console.log("this tree is MULTIPLY rooted ("+ allRootNodes.length +" root nodes found)");
            root = allRootNodes[0];
            break;
    }
    */
    if (specifiedRoot && inGroupClade) {
        // both are defined, show a grayed-out dendrogram with a
        // full-strength ingroup clade
        ///console.log(">>> root AND ingroup specified");
        root = getTreeNodeByID(tree, specifiedRoot);
    } else if (specifiedRoot) {
        // only root node is defined, show a grayed-out dendrogram
        ///console.log(">>> root ONLY specified");
        root = getTreeNodeByID(tree, specifiedRoot);
    } else if (inGroupClade) {
        // only ingroup clade is defined, show a partially-rooted tree
        // (a dendrogram for the ingroup clade, force-directed graph for
        // the outgroup)
        ///console.log(">>> ingroup ONLY specified");
        root = getTreeNodeByID(tree, inGroupClade);
    } else {
        // neither root node nor ingroup is defined, this is really an
        // unrooted tree; show it with force-directed graph
        ///console.log(">>> NOTHING specified, TODO: use force-directed graph!?");
        root = tree.node[0];
    }
    /*
    console.log(">>> building dendrogram from root node '"+ root['@id'] +"'...");
    for (var prop in importantNodeIDs) {
        console.log( "   "+ prop +" = "+ importantNodeIDs[prop] );
    }
    */

    var edges = tree.edge();

    /* render the tree as a modified phylogram */
    
    // preload nodes with proper labels and branch lengths
    $.each(tree.node, function(index, node) {
        node.name = getTreeNodeLabel(tree, node, importantNodeIDs);
        // reset x of all nodes, to avoid gradual "creeping" to the right
        node.x = 0;
        node.length = 0;  // ie, branch length
        node.rootDist = 0;
    });
    $.each(edges, function(index, edge) {
        // transfer @length property (if any) to the child node
        if (typeof( edge['@length'] ) === 'function') {
            var childID = edge['@target'];
            var childNode = getTreeNodeByID(tree, childID);
            childNode.length = edge['@length'];
            ///console.log("> reset length of node "+ childID+" to: "+ childNode.length);
        }
    });
    ///console.log("> done sweeping edges");
    
    //var currentWidth = $("#tree-viewer #dialog-data").width();
    //var currentWidth = $("#tree-viewer #dialog-data").css('width').split('px')[0];
    var currentWidth = $("#tree-viewer").width() - 400;
    vizInfo = d3.phylogram.build(
        "#tree-viewer #dialog-data",   // selector
        root, // tree.node,      // nodes 
        {           // options
            vis: vizInfo.vis,
            // TODO: can we make the size "adaptive" based on vis contents?
            width: currentWidth,  // must be simple integers
            height: '3000',
            // simplify display by omitting scales or variable-length branches
            skipTicks: true,
            skipBranchLengthScaling: false,
            children : function(d) {
                var parentID = d['@id'];
                var itsChildren = [];
                $.each(edges, function(index, edge) {
                    if (edge['@source'] === parentID) {
                        var childID = edge['@target'];
                        var childNode = getTreeNodeByID(tree, childID);
                        itsChildren.push( childNode );
                    }
                });
                /*
                console.log("> updated children for node "+ parentID +":");
                $.each(itsChildren, function(i,n) {
                    console.log("   > "+ n['@id']);
                });
                */
                return itsChildren;
            }
        }
    );

    // (re)assert proper classes for key nodes
    vizInfo.vis.selectAll('.node')
        .attr("class", function(d) {
            var itsClass = "node";
            if (!d.children) {
                itsClass += " leaf";
            }
            if (d['@root'] && d['@root'] === 'true') {
                itsClass += " atRoot";
            }
            if (d['@id'] === specifiedRoot) {
                itsClass += " specifiedRoot";
            }
            if (d['@id'] === inGroupClade) {
                itsClass += " inGroupClade";
            }
            if (d['@id'] === nearestOutGroupNeighbor) {
                itsClass += " nearestOutGroupNeighbor";
            }
            ///console.log("CLASS is now "+ itsClass);
            return itsClass;
        });

    // (re)assert standard click behavior for all nodes
    vizInfo.vis.selectAll('.node circle')
        .on('click', function(d) {
            d3.event.stopPropagation();
            // show a menu with appropriate options for this node
            var nodePageOffset = $(d3.event.target).offset();
            showNodeOptionsMenu( tree, d, nodePageOffset, importantNodeIDs );
        });

    // (re)assert standard click behavior for main vis background
    d3.select('#tree-viewer')  // div.modal-body')
        .on('click', function(d) {
            d3.event.stopPropagation();
            // hide any node menu
            hideNodeOptionsMenu( );
        });


    /*
    return;


    var width = 960,
        height = 2200;

    var cluster = d3.layout.cluster()
        .size([height, width - 160])
        .children(function(d) {
            var parentID = d['@id'];
            var itsChildren = [];
            $.each(edges, function(index, edge) {
                if (edge['@source'] === parentID) {
                    var childID = edge['@target'];
                    var childNode = getTreeNodeByID(tree, childID);
                    itsChildren.push( childNode );
                }
            });
            **
            console.log("> resetting children for node "+ parentID +":");
            $.each(itsChildren, function(i,n) {
                console.log("   > "+ n['@id']);
            });
            **
            return itsChildren;
        });

    var diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.y, d.x]; });

    // some things should only happen once
    var svg = d3.select("#tree-viewer svg > g");
    if (svg[0][0] === null) {
        svg = d3.select("#tree-viewer #dialog-data").append("svg")
            .attr("width", width)
            .attr("height", height)
          .append("g")
            .attr("transform", "translate(80,0)"); // make room for 'root' label
    } else {
        // clear special properties and visible tree elements, for a clean
        // sweep. TODO: do something more graceful, perhaps a transition?
        ///clearD3PropertiesFromTree(tree);
        $('#tree-viewer #dialog-data svg > g > *').remove();
    }

    var startTime = new Date();
    var nodes = cluster.nodes(root),
        links = cluster.links(nodes);

    ///var timestamp = new Date().getTime();
    ///console.log("NEW timestamp: "+ timestamp);

    // DATA JOIN
    var link = svg.selectAll(".link")
        .data(links);
        ///.data(links, function(d) { return (timestamp + d.source['@id'] + d.target['@id']); });

    // UPDATE (only affects existing links)
    link
        .attr('class','link update');


    // ENTER (only affects new links; do one-time initialization here)
    link.enter()
        .insert("path")  // should add this alongside other paths (behind nodes)
        .attr("class", "link enter");

    // ENTER + UPDATE (affects all new AND existing links)
    link
        ///.transition().duration(750)
        .attr("d", diagonal);  // smooth bezier curves between nodes/

    ** ...or try simple lines between nodes
    link.enter().append("line")
        .attr("class", "link")
        .attr("x1", function(d) { return d.source.y; })
        .attr("y1", function(d) { return d.source.x; })
        .attr("x2", function(d) { return d.target.y; })
        .attr("y2", function(d) { return d.target.x; });
    **

    // EXIT
    link.exit().remove();

    var specifiedRootTag = getMetaTagByProperty(tree.meta, 'ot:specifiedRoot');
    var specifiedRoot = specifiedRootTag ? specifiedRootTag.$() : null;

    var inGroupCladeTag = getMetaTagByProperty(tree.meta, 'ot:inGroupClade');
    var inGroupClade = inGroupCladeTag ? inGroupCladeTag.$() : null;

    var nearestOutGroupNeighborTag = getMetaTagByProperty(tree.meta, 'ot:nearestOutGroupNeighbor');
    var nearestOutGroupNeighbor = nearestOutGroupNeighborTag ? nearestOutGroupNeighborTag.$() : null;

    // DATA JOIN
    var node = svg.selectAll(".node")
        .data(nodes);
        ///.data(nodes, function(d) { return (timestamp + d['@id']); }); // key function to bind elements

    // UPDATE (only affects existing links)
    


    // ENTER (only affects new nodes; do one-time initialization here)
    var newNodeG = node.enter()
        .append("g");

    // append more stuff to the 'g' element
    newNodeG.append("circle")
            .attr("r", 4.5)
            .on('click', function(d) {
                // show a menu with appropriate options for this node
                var nodePageOffset = $(d3.event.target).offset();
                showNodeOptionsMenu( tree, d, nodePageOffset );
            })
    newNodeG.append("text")
            .attr("dx", function(d) { return d.children ? -8 : 8; })
            .attr("dy", 3)
            .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
            //.style("stroke", function(d) { return (d['@root'] && d['@root'] === 'true') ? "#f55" : "black"; })
            .text(function(d) { return getTreeNodeLabel(tree, d, importantNodeIDs); });


    // ENTER + UPDATE (affects all new AND existing nodes)
    node   
        ///.transition().duration(750)
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
        .attr("class", function(d) {
            var itsClass = "node";
            if (!d.children) {
                itsClass += " leaf";
            }
            if (d['@root'] && d['@root'] === 'true') {
                itsClass += " atRoot";
            }
            if (d['@id'] === specifiedRoot) {
                itsClass += " specifiedRoot";
            }
            if (d['@id'] === inGroupClade) {
                itsClass += " inGroupClade";
            }
            if (d['@id'] === nearestOutGroupNeighbor) {
                itsClass += " nearestOutGroupNeighbor";
            }
            ///console.log("CLASS is now "+ itsClass);
            return itsClass;
        });


    // EXIT
    node.exit().remove();


    var rightNow = new Date() - startTime;
    console.log(">> Drawing tree took "+ (rightNow / 1000.0).toFixed(2) +" seconds");
    */

}

function setTreeRoot( treeOrID, rootNodeOrID ) {
    // (Re)set the node that is the primary root for this tree, if known
    var tree = null;
    if (typeof(treeOrID) === 'object') {
        tree = treeOrID;
    } else {
        tree = getTreeByID(treeOrID);
    }

    rootNodeID = null;
    if (rootNodeOrID) {
        if (typeof(rootNodeOrID) === 'object') {
            rootNodeID = rootNodeOrID['@id'];
        } else {
            rootNodeID = rootNodeOrID;
        }
    }

    var specifiedRootTag = getMetaTagByProperty(tree.meta, 'ot:specifiedRoot');
    if (!specifiedRootTag) {
        addMetaTagToParent(tree, {
            "$": '',
            "@property": "ot:specifiedRoot",
            "@xsi:type": "nex:LiteralMeta"
        });
        specifiedRootTag = getMetaTagByProperty(tree.meta, 'ot:specifiedRoot');
    }
    if (rootNodeID) {
        specifiedRootTag.$( rootNodeID );
    } else {
        // clear the current root
        specifiedRootTag.$( '' );
    }
    updateEdgesInTree( tree );
    drawTree( tree );
}

function setTreeIngroup( treeOrID, ingroupNodeOrID ) {
    // (Re)set the node that defines the ingroup, i.e., the clade to be
    // used in synthesis
    var tree = null;
    if (typeof(treeOrID) === 'object') {
        tree = treeOrID;
    } else {
        tree = getTreeByID(treeOrID);
    }

    ingroupNodeID = null;
    if (ingroupNodeOrID) {
        if (typeof(ingroupNodeOrID) === 'object') {
            ingroupNodeID = ingroupNodeOrID['@id'];
        } else {
            ingroupNodeID = ingroupNodeOrID;
        }
    }
    var inGroupCladeTag = getMetaTagByProperty(tree.meta, 'ot:inGroupClade');
    if (!inGroupCladeTag) {
        addMetaTagToParent(tree, {
            "$": '',
            "@property": "ot:inGroupClade",
            "@xsi:type": "nex:LiteralMeta"
        });
        inGroupCladeTag = getMetaTagByProperty(tree.meta, 'ot:inGroupClade');
    }
    if (ingroupNodeID) {
        inGroupCladeTag.$( ingroupNodeID );
    } else {
        // clear the current root
        inGroupCladeTag.$( '' );
    }
    updateEdgesInTree( tree );
    drawTree( tree );
}

function setTreeOutgroup( treeOrID, outgroupNodeOrID ) {
    // (Re)set the node that defines the outgroup, i.e., which sets the
    // polarity (edge direction) used to delineate the ingroup clade
    var tree = null;
    if (typeof(treeOrID) === 'object') {
        tree = treeOrID;
    } else {
        tree = getTreeByID(treeOrID);
    }

    outgroupNodeID = null;
    if (outgroupNodeOrID) {
        if (typeof(outgroupNodeOrID) === 'object') {
            outgroupNodeID = outgroupNodeOrID['@id'];
        } else {
            outgroupNodeID = outgroupNodeOrID;
        }
    }
    var nearestOutGroupNeighborTag = getMetaTagByProperty(tree.meta, 'ot:nearestOutGroupNeighbor');
    if (!nearestOutGroupNeighborTag) {
        addMetaTagToParent(tree, {
            "$": '',
            "@property": "ot:nearestOutGroupNeighbor",
            "@xsi:type": "nex:LiteralMeta"
        });
        nearestOutGroupNeighborTag = getMetaTagByProperty(tree.meta, 'ot:nearestOutGroupNeighbor');
    }
    if (outgroupNodeID) {
        nearestOutGroupNeighborTag.$( outgroupNodeID );
    } else {
        // clear the current root
        nearestOutGroupNeighborTag.$( '' );
    }
    updateEdgesInTree( tree );
    drawTree( tree );
}

function updateEdgesInTree( tree ) {
    // Update the direction of all edges in this tree, based on its
    // designated root and/or ingroup nodes
    var specifiedRootTag = getMetaTagByProperty(tree.meta, 'ot:specifiedRoot');
    var specifiedRoot = specifiedRootTag ? specifiedRootTag.$() : null;

    var inGroupCladeTag = getMetaTagByProperty(tree.meta, 'ot:inGroupClade');
    var inGroupClade = inGroupCladeTag ? inGroupCladeTag.$() : null;

    var nearestOutGroupNeighborTag = getMetaTagByProperty(tree.meta, 'ot:nearestOutGroupNeighbor');
    var nearestOutGroupNeighbor = nearestOutGroupNeighborTag ? nearestOutGroupNeighborTag.$() : null;

    if (specifiedRoot) {
        // root is defined, and possibly ingroup; set direction away from root for all edges
        // NOTE that this polarity trumps any nearestOutGroupNeighbor
        ///console.log("sweeping all edges");
        sweepEdgePolarity( tree, specifiedRoot, null, inGroupClade );
    } else if (inGroupClade) {
        // only ingroup clade is defined, set direction away from ingroup
        // ancestor within the ingroup clade; disregard other edges
        ///console.log("sweeping ingroup edges only");
        var naturalParent;
        if (!nearestOutGroupNeighbor) {
            // choose its parent based on current "upward" edge in tree
            var edgeArray = getTreeEdgesByID(tree, inGroupClade, 'TARGET');
            if (edgeArray.length === 0) {
                // ingroup claded MRCA must also be the tree root
                naturalParent = null;
            } else {
                edgeToParent = edgeArray[0];
                naturalParent = edgeToParent['@source'];
            }
            ///console.log("...sweeping away from natural parent '"+ naturalParent +"'...");
        }
        sweepEdgePolarity( tree, inGroupClade, nearestOutGroupNeighbor || naturalParent, inGroupClade );
    } else {
        // neither root node nor ingroup is defined; ignore all edges
        ///console.log("we'll ignore all polarity, so nothing to sweep");
    }
}

function sweepEdgePolarity( tree, startNodeID, upstreamNeighborID, inGroupClade, insideInGroupClade ) {
    // push all adjacent edges away from starting node, except for
    // its upstream neighbor; this should recurse to sweep an entire tree (or
    // subtree) until we reach the tips

    // gather all adjacent edges, regardless of current direction
    var edges = getTreeEdgesByID(tree, startNodeID, 'ANY');
    $.each(edges, function(i, edge) {
        // test the "other" ID to see if it should be up- or downstream
        var sourceID = edge['@source'];
        var targetID = edge['@target'];
        var otherID = sourceID === startNodeID ? targetID : sourceID;

        if (upstreamNeighborID && otherID === upstreamNeighborID) {
            if (targetID === upstreamNeighborID) {
                reverseEdgeDirection( edge );
            }
            return;
        } 

        // we should recurse through all downstream nodes
        if (targetID === startNodeID) {
            reverseEdgeDirection( edge );
        }

        if (!insideInGroupClade) {
            // check to see if we just hit the ingroup clade MRCA
            if (startNodeID === inGroupClade) {
                insideInGroupClade = true;
            }
        }
        // mark the start-node accordingly (so we can distinguish ingroup vs.
        // outgroup paths in the tree view)
        var startNode = getTreeNodeByID(tree, startNodeID);
        startNode.ingroup = insideInGroupClade;

        // note that we're sweeping *away* from the current startNode
        sweepEdgePolarity( tree, otherID, startNodeID, inGroupClade, insideInGroupClade );
    });
}


function getTreeByID(id) {
    var foundTree = null;
    $.each( viewModel.nexml.trees.tree, function(i, tree) {
        if (tree['@id'] === id) {
            foundTree = tree;
            return false;
        }
    });
    return foundTree;
}
function getTreeNodeByID(tree, id) {
    // there should be only one matching (or none) within a tree
    var foundNode = null;
    $.each( tree.node, function( index, node ) {
        if (node['@id'] === id) {
            foundNode = node;
            return false;
        }
    });
    return foundNode;
}
function getTreeEdgesByID(tree, id, sourceOrTarget) {
    // look for any edges associated with the specified *node* ID; return
    // an array of 0, 1, or more matching edges within a tree
    //
    // 'sourceOrTarget' lets us filter, should be 'SOURCE', 'TARGET', 'ANY'
    var foundEdges = [];
    $.each( tree.edge(), function( index, edge ) {
        switch (sourceOrTarget) {
            case 'SOURCE':
                if (edge['@source'] === id) {
                    foundEdges.push( edge );
                }
                return;
            case 'TARGET':
                if (edge['@target'] === id) {
                    foundEdges.push( edge );
                }
                return;
            default:  // match on either node ID
                if ((edge['@source'] === id) || (edge['@target'] === id)) {
                    foundEdges.push( edge );
                }
                return;
        }
    });
    return foundEdges;
}
function reverseEdgeDirection( edge ) {
    var oldSource = edge['@source'];
    edge['@source']( edge['@target'] );
    edge['@target']( oldSource );
}
function getRootTreeNodes(tree) {
    // REMEMBER: trees can be unrooted, singly rooted, or multiply rooted
    var rootNodes = [];
    $.each( tree.node, function( index, node ) {
        if (node['@root'] && node['@root'] === 'true') {
            rootNodes.push( node );
        }
    });
    return rootNodes;
}
function getTreeNodeLabel(tree, node, importantNodeIDs) {
    // TODO: centralize these IDs, no need to keep fetching for each node
    var nodeID = node['@id'];

    if (nodeID === importantNodeIDs.inGroupClade) {
        ///return "ingroup clade";
    }

    if (nodeID === importantNodeIDs.specifiedRoot) {
        ///return "specified root";
    }

    if (nodeID === importantNodeIDs.nearestOutGroupNeighbor) {
        ///return "nearest outgroup neighbor";
    }

    var itsOTUAccessor = node['@otu'];
    if (!itsOTUAccessor) {
        if (node['@root'] && node['@root'] === 'true') {
            ///return "@root";
        }
        return node['@id'];
    }

    var otu = getOTUByID( itsOTUAccessor() );
    return otu['@label'];
}

function filenameFromFakePath( path ) {
    // trim any path (possibly fake) from an input[type='file'] widget
    var delim = (path.indexOf('\\') !== -1) ? '\\' : '/';
    var parts = path.split(delim);
    var howManyParts = parts.length;
    if (howManyParts === 1) {
        return path;
    }
    return parts[howManyParts-1];
}

function adjustedLabel(label) {
    // apply any active OTU mapping adjustments to this string
    if (typeof(label) === 'function') {
        label = label();
    }
    if (typeof(label) !== 'string') {
        // probably null
        return label;
    }
    var adjusted = label;
    // apply any active subsitutions in the viewMdel
    var subList = getOTUMappingHints().data.substitutions.substitution;
    $.each(subList, function(i, subst) {
        if (!subst['@active']) {
            return true; // skip to next adjustment
        }
        var oldText = subst.old.$();
        var newText = subst.new.$();
        if ($.trim(oldText) === $.trim(newText) === "") {
            return true; // skip to next adjustment
        }
        try {
            //var pattern = new RegExp(oldText, 'g');  // g = replace ALL instances
            // NO, this causes weird repetition in common cases
            var pattern = new RegExp(oldText);  
            adjusted = adjusted.replace(pattern, newText);
            // clear any stale invalid-regex marking on this field
            if (!subst['@valid']) {
                subst['@valid'] = ko.observable(true);
            }
            subst['@valid'](true);
        } catch(e) {
            // there's probably invalid regex in the field... mark it and skip
            if (!subst['@valid']) {
                subst['@valid'] = ko.observable(false);
            }
            subst['@valid'](false);
        }
    });
    return adjusted;
}

/* 
 * Templates for curator annotations
 */

var nexsonTemplates = {

    // all annotations created here should share some identifying information
    'curator annotation agent': {
        "@id": "opentree-curation-webapp",//  OR use a generated (unique) ID
        "@name": "OpenTree curation webapp",
        "@description": "Web-based interface for submitting, editing, and reviewing studies in the Open Tree of Life project.",
        "@url": "https://github.com/OpenTreeOfLife/opentree", 
        "@version": "0.0.0"   // TODO
    },

    'supporting files': {
        /* App-specific metadata about associated support files for this study.
         * This is intended to be temporary storage, until we can move all
         * files and trees into a data repository. In the meantime, the
         * curation webapp should offer the ability to upload and manage these files.
         *
         * Once the data has been safely migrated from the OTOL Nexson store,
         * we should drop all of this and populate the study's main
         * 'ot:dataDeposit' with the archival DOI or URL.
         *
         * NOTE that this object describes an annotation bundle with
         * several main parts, each of which will be applied separately to
         * the target Nexml:
         *  targetElement  // supplied by template consumer
         *  annotationEvent
         *  agent(s)
         *  message(s)
         */
        // 'targetElement': ,
        'annotationEvent': {
            "@id": "supporting-files-metadata",
            "@description": "Describes supporting data files for this study",
            "@wasAssociatedWithAgentId": "opentree-curation-webapp",
            // dates are UTC strings, eg, "2013-10-27T02:47:35.029323"
            "@dateCreated": new Date().toISOString(), 
            "@passedChecks": true,  // this is moot
            "@preserve": true
            // "otherProperty": [ ]  // SKIP THIS, use messages for details
        },
        // 'agent': null,      // will be provided by template consumer
        'messages': [{
            //"@id": "",      // will be assigned via $.extend
            "@wasGeneratedById": "supporting-files-metadata",
            "@severity": "INFO",
            "@code": "SUPPORTING_FILE_INFO",
            "@humanMessageType": "NONE",
            "data": {
                "@movedToPermanentArchive": false,   
                    // OR check for ot:dataDeposit?
                "files": { "file": [
                    /* an array of objects based on 'single supporting file' below */
                ]}
            },
            "refersTo": {
                "top": {"$": "meta"}
            }
        }]
    }, // END of 'supporting files' template

    'single supporting file': {
        /* A single file added in the Files section
         */
        "@filename": "",
        "@url": "",
        "@type": "",  // eg, 'Microsoft Excel spreadsheet'
        "description": {"$": ""},  // eg, "Alignment data for tree #3"
        "@sourceForTree": "",  // used IF this file was the original data for a tree
        "@size": ""   // eg, '241 KB'
    }, // END of 'single supporting file' template

    'study annotation events': {
        // a singleton, on the study only
        "@property": "ot:annotationEvents", 
        "@xsi:type": "nex:ResourceMeta", 
        "annotation": []
    },
    'study annotation agents': {
        // a singleton, on the study only
        "@property": "ot:agents", 
        "@xsi:type": "nex:ResourceMeta", 
        "agent": []
    },
    'annotation message collection': {
        // can be on the study, or some other element
        "@property": "ot:messages", 
        "@xsi:type": "nex:ResourceMeta", 
        "message": []
    },

    'single annotation event': {
        // "@id": "",
        "@description": "",
        "@wasAssociatedWithAgentId": "",
        "@dateCreated": ""
        //"@passedChecks": true,
        //"@preserve": true,
        //"@otherProperty": []
    },
    'single annotation agent': {
        // "@id": "",
        "@name": "",
        "@description": "",
        "@url": "",
        "@version": ""
        //"otherProperty": []
    },
    'single annotation message': {
        // "@id": "",
        "@wasGeneratedById": "",
        //"@wasAttributedToId": "",
        "@severity": "",
        "@code": "",
        "@humanMessageType": "",
        "humanMessage": {"$": ""},
        "dataAnnotation": {"$": ""},
        "data": {},
        "refersTo": {},
        "other": {}
    },

    'OTU mapping hints': {
        /* A series of regular expressions ('substitutions') to facilitate
         * mapping of leaf nodes in study trees to known taxa. Also hints to
         * the most likely search context for these names.
         *
         * TODO: Should we specify hints per-tree, instead of per-study?
         *
         * NOTE that this object describes an annotation bundle with
         * several main parts, each of which will be applied separately to
         * the target Nexml:
         *  targetElement  // supplied by template consumer
         *  annotationEvent
         *  agent(s)
         *  message(s)
         */
        // 'targetElement': ,
        'annotationEvent': {
            "@id": "otu-mapping-hints",
            "@description": "Aids for mapping study OTUs to OTT taxa",
            "@wasAssociatedWithAgentId": "opentree-curation-webapp",
            // dates are UTC strings, eg, "2013-10-27T02:47:35.029323"
            "@dateCreated": new Date().toISOString(), 
            "@passedChecks": true,  // this is moot
            "@preserve": true
            // "otherProperty": [ ]  // SKIP THIS, use messages for details
        },
        // 'agent': null,      // will be provided by template consumer
        'messages': [{
            //"@id": "",      // will be assigned via $.extend
            "@wasGeneratedById": "otu-mapping-hints",
            "@severity": "INFO",
            "@code": "OTU_MAPPING_HINTS",
            "@humanMessageType": "NONE",
            "data": {
                "searchContext": {"$": "All life"},
                "substitutions": {"substitution": [
                    // always one default (empty) substitution
                    { 
                        "old": {"$": ""},
                        "new": {"$": ""},
                        "@valid": true,
                        "@active": false
                    }
                ]}
            },
            "refersTo": {
                "top": {"$": "meta"}
            }
        }],
    }, // END of 'OTU mapping hints' template

    'mapping substitution': {
        /* A single substitution added in the OTU Mapping section
         */
        "old": {"$": ""},
        "new": {"$": ""},
        "@valid": true,
        "@active": false
    }, // END of 'mapping substitution' template


    'OTU entry': {
        /* An OTU entry for newly-mapped nodes (do we need this?)
         */
        "@about": "#otu{otuID}",
        "@id": "otu{otuID}", 
        "@label": "{otuMappedName}",    // as mapped
        "meta": [
            {
                "$": null,  // integer
                "@property": "ot:ottId", 
                "@xsi:type": "nex:LiteralMeta"
            }, 
            {
                "$": "{otuOriginalName}",   // as submitted
                "@property": "ot:originalLabel", 
                "@xsi:type": "nex:LiteralMeta"
            }
        ]
    }, // END of 'OTU entry' template

} // END of nexsonTemplates

function cloneFromNexsonTemplate( templateName, options ) {
    return $.extend( true, {}, nexsonTemplates[ templateName ]);
}

function cloneFromSimpleObject( obj, options ) {
    // use this to create simple, observable objects (eg, metatags)
    return $.extend( true, {}, obj);
}

// For older browsers (IE <=8), provide Date.toISOString if not defined
// http://stackoverflow.com/a/11440625
if (!Date.prototype.toISOString) {
    // Here we rely on JSON serialization for dates because it matches 
    // the ISO standard. However, we check if JSON serializer is present 
    // on a page and define our own .toJSON method only if necessary
    if (!Date.prototype.toJSON) {
        Date.prototype.toJSON = function (key) {
            function f(n) {
                // Format integers to have at least two digits.
                return n < 10 ? '0' + n : n;
            }
            return this.getUTCFullYear()   + '-' +
                f(this.getUTCMonth() + 1) + '-' +
                f(this.getUTCDate())      + 'T' +
                f(this.getUTCHours())     + ':' +
                f(this.getUTCMinutes())   + ':' +
                f(this.getUTCSeconds())   + 'Z';
        };
    }
    Date.prototype.toISOString = Date.prototype.toJSON;
}

function getSupportingFiles(nexml) {
    // retrieve this annotation message from the model (or other specified
    // object); return null if not found
    if (!nexml) {
        nexml = viewModel.nexml;
    }
    var annotations = getStudyAnnotationEvents( nexml );
    var filesAnnotation = null;
    $.each(makeArray(annotations.annotation), function(i, annotation) {
        var itsID = ko.unwrap(annotation['@id']);

        if (itsID === 'supporting-files-metadata') {
            filesAnnotation = annotation;
            return false;
        }
    });
    
    //return filesAnnotation;
    if (!filesAnnotation) {
        return null;
    }
    // return its message with the interesting parts
    return getMessagesForAnnotationEvent( filesAnnotation, nexml )[0]
}
function addSupportingFileFromURL() {
    // TODO: support file upload from desktop
    // TODO: upload data in a preparatory step?
    
    // initial version supports URL entry only...
    var chosenURL = $.trim( $('[name=new-file-url]').val() || '');
    if (chosenURL === '') {
        showErrorMessage('Please enter a valid URL.');
        return;
    }

    // TODO: support import-from-URL via AJAX
    $('#ajax-busy-bar').show();
    
    $.ajax({
        type: 'POST',
        dataType: 'json',
        // crossdomain: true,
        // contentType: "application/json; charset=utf-8",
        url: API_create_file_POST_url,
        data: {
            // TODO: gather chosen file-creation options
            'file_url': chosenURL
        },
        success: function( data, textStatus, jqXHR ) {
            // creation method should return either our JSON structure describing the new file, or an error
            $('#ajax-busy-bar').hide();

            console.log('addSupportingFileFromURL(): done! textStatus = '+ textStatus);
            // report errors or malformed data, if any
            if (textStatus !== 'success') {
                showErrorMessage('Sorry, there was an error adding this file.');
                return;
            }

            showSuccessMessage('File added.');
            // update the files list (and auto-save?)
            var file = cloneFromNexsonTemplate('single supporting file');
            file['@filename']( data.filename || "" );
            file['@url']( data.url || "" );
            file['@type']( data.type || "" );
            file.description.$( data.description || "" );
            file['@sourceForTree']( data.sourceForTree || "" );
            file['@size']( data.size || "" );

            getSupportingFiles().data.files.file.push(file);
        },
        error: function( data, textStatus, jqXHR ) {
            showErrorMessage('Sorry, there was an error adding this file.');
        }
    });

}

function removeSupportingFile( fileInfo ) {
    // let's be sure, since adding may be slow...
    if (!confirm("Are you sure you want to delete this file?")) {
        return;
    }

    ///var removeURL = API_remove_file_DELETE_url.replace('STUDY_ID', 'TODO').replace('FILE_ID', 'TODO');

    // TODO: do the actual removal (from the remote file-store) via AJAX
    $('#ajax-busy-bar').show();
    
    $.ajax({
        // type: 'DELETE',
        dataType: 'json',
        // crossdomain: true,
        // contentType: "application/json; charset=utf-8",
        //url: removeURL // modified API call, see above
        url: '/curator/supporting_files/delete_file/'+ fileInfo['@filename'],
        data: { },
        success: function( data, textStatus, jqXHR ) {
            // report errors or malformed data, if any
            if (textStatus !== 'success') {
                showErrorMessage('Sorry, there was an error removing this file.');
                console.log("ERROR: textStatus !== 'success', but "+ textStatus);
                return;
            }
            if (data.message !== 'File deleted') {
                showErrorMessage('Sorry, there was an error removing this file.');
                console.log("ERROR: message !== 'File deleted', but "+ data.message);
                return;
            }

            $('#ajax-busy-bar').hide();
            showSuccessMessage('File removed.');
            // update the files list
            var fileList = getSupportingFiles().data.files.file;
            fileList.remove(fileInfo);
        },
        error: function( data, textStatus, jqXHR ) {
            showErrorMessage('Sorry, there was an error removing this file.');
            console.log("ERROR: textStatus: "+ textStatus);
            return;
        }
    });
}

function getOTUMappingHints(nexml) {
    // retrieve this annotation message from the model (or other specified
    // object); return null if not found
    if (!nexml) {
        nexml = viewModel.nexml;
    }
    var annotations = getStudyAnnotationEvents( nexml );
    var hintsAnnotation = null;
    $.each(makeArray(annotations.annotation), function(i, annotation) {
        var itsID = ko.unwrap( annotation['@id'] );

        if (itsID === 'otu-mapping-hints') {
            hintsAnnotation = annotation;
            return false;
        }
    });
    
    //return hintsAnnotation;
    if (!hintsAnnotation) {
        return null;
    }
    // return its message with the interesting parts
    return getMessagesForAnnotationEvent( hintsAnnotation, nexml )[0]
}
function addSubstitution( clicked ) {
    var subst = cloneFromNexsonTemplate('mapping substitution');

    if ($(clicked).is('select')) {
        var chosenSub = $(clicked).val();
        if (chosenSub === '') {
            // do nothing, we're still at the prompt
            return false;
        }
        // add the chosen subsitution
        var parts = chosenSub.split(' =:= ');
        subst.old.$( parts[0] || '');
        subst.new.$( parts[1] || '');
        subst['@valid'](true);
        subst['@active'](true);
        // reset the SELECT widget to its prompt
        $(clicked).val('');
    }
    getOTUMappingHints().data.substitutions.substitution.push(subst);
}
function removeSubstitution( data ) {
    var subList = getOTUMappingHints().data.substitutions.substitution;
    subList.remove(data);
    if (subList().length === 0) {
        // add an inactive substitution with prompts
        addSubstitution();
    }
}

var autoMappingInProgress = ko.observable(false);
var currentlyMappingOTUs = ko.observableArray([]); // drives spinners, etc.
var failedMappingOTUs = ko.observableArray([]); // ignore these until we have new mapping hints
var editedOTULabels = ko.observable({}); // stored any labels edited by hand, keyed by OTU id
var editedOTULabelSubscriptions = {}; // KO subscriptions for each, to enable mapping when a label is edited
var proposedOTUMappings = ko.observable({}); // stored any labels proposed by server, keyed by OTU id
var bogusEditedLabelCounter = ko.observable(1);  // this just nudges the label-editing UI to refresh!

function editOTULabel(otu) {
    var OTUid = otu['@id'];
    var originalLabel = getMetaTagValue(otu.meta, 'ot:originalLabel');
    editedOTULabels()[ OTUid ] = ko.observable( adjustedLabel(originalLabel) );
    // add a subscriber to remove this from failed-OTU list when user makes
    // changes
    var sub = editedOTULabels()[ OTUid ].subscribe(function() {
        failedMappingOTUs.remove(OTUid);
        // nudge to update OTU list immediately
        bogusEditedLabelCounter( bogusEditedLabelCounter() + 1);
        nudgeAutoMapping();
    });
    if (editedOTULabelSubscriptions[ OTUid ]) {
        // clear any errant (old) subscriber for this OTU
        editedOTULabelSubscriptions[ OTUid ].dispose();
        delete editedOTULabelSubscriptions[ OTUid ];
    }
    editedOTULabelSubscriptions[ OTUid ] = sub;
    // this should make the editor appear
    bogusEditedLabelCounter( bogusEditedLabelCounter() + 1);
}
function editedLabelAccessor(otu) {
    var OTUid = otu['@id'];
    var acc = editedOTULabels()[ OTUid ] || null;
    return acc;
}
function revertOTULabel(otu) {
    // undoes 'editOTULabel', releasing a label to use shared hints
    var OTUid = otu['@id'];
    delete editedOTULabels()[ OTUid ];
    failedMappingOTUs.remove(OTUid );
    if (editedOTULabelSubscriptions[ OTUid ]) {
        // dispose, then remove, the subscriber for this OTU
        editedOTULabelSubscriptions[ OTUid ].dispose();
        delete editedOTULabelSubscriptions[ OTUid ];
    }
    // this should make the editor disappear and revert its adjusted label
    bogusEditedLabelCounter( bogusEditedLabelCounter() + 1);
    nudgeAutoMapping();
}

function proposeOTULabel(OTUid, mappingInfo) {
    proposedOTUMappings()[ OTUid ] = ko.observable( mappingInfo ).extend({ notify: 'always' });
    proposedOTUMappings.valueHasMutated();
    // this should make the editor appear
}
function proposedMapping( otu ) {
    if (!otu || typeof otu['@id'] === 'undefined') {
        console.log("proposedMapping() failed");
        return null;
    }
    var OTUid = otu['@id'];
    var acc = proposedOTUMappings()[ OTUid ];
    return acc ? acc() : null;
}
function approveProposedOTULabel(otu) {
    // undoes 'editOTULabel', releasing a label to use shared hints
    var OTUid = otu['@id'];
    var approvedMapping = proposedOTUMappings()[ OTUid ];
    mapOTUToTaxon( OTUid, approvedMapping );
    delete proposedOTUMappings()[ OTUid ];
    proposedOTUMappings.valueHasMutated();
}
function rejectProposedOTULabel(otu) {
    // undoes 'proposeOTULabel', clearing its value
    var OTUid = otu['@id'];
    delete proposedOTUMappings()[ OTUid ];
    proposedOTUMappings.valueHasMutated();
}

function getAllVisibleProposedMappings() {
    // gather any proposed mappings (IDs) that are visible on this page
    var visibleProposedMappings = [];
    var visibleOTUs = viewModel.filteredOTUs().pagedItems();
    $.each( visibleOTUs, function (i, otu) {
        if (proposedMapping(otu)) {
            // we have a proposed mapping for this OTU!
            visibleProposedMappings.push( otu['@id'] );
        }
    });
    return visibleProposedMappings; // return a series of IDs
}
function approveAllVisibleMappings() {
    $.each(getAllVisibleProposedMappings(), function(i, OTUid) {
        var approvedMapping = proposedOTUMappings()[ OTUid ];
        delete proposedOTUMappings()[ OTUid ];
        mapOTUToTaxon( OTUid, approvedMapping );
    });
    proposedOTUMappings.valueHasMutated();
    startAutoMapping();
}
function rejectAllVisibleMappings() {
    $.each(getAllVisibleProposedMappings(), function(i, OTUid) {
        delete proposedOTUMappings()[ OTUid ];
    });
    proposedOTUMappings.valueHasMutated();
    stopAutoMapping();
}

// this should be cleared whenever something changes in mapping hints
function clearFailedOTUList() {
    failedMappingOTUs.removeAll();
    // nudge to update OTU list immediately
    bogusEditedLabelCounter( bogusEditedLabelCounter() + 1);
    nudgeAutoMapping();
}
function nudgeAutoMapping() {
    // restart auto-mapping, if enabled
    if (autoMappingInProgress()) {
        if (currentlyMappingOTUs.length === 0) {
            // looks like we ran out of steam.. try again!
            requestTaxonMapping();
        }
    }
}

var recentMappingTimes = [ ];
var recentMappingSpeedLabel = ko.observable(""); // seconds per name, based on rolling average
var recentMappingSpeedPercent = ko.observable(0); // affects color of bar, etc
var recentMappingSpeedBarClass = ko.observable('progress progress-info');


function startAutoMapping() {
    // begin a daisy-chain of AJAX operations, mapping 1 label (or more?) to known taxa
    // TODO: what if there was a pending operation when we stopped?
    autoMappingInProgress( true );
    requestTaxonMapping();  // try to grab the first unmapped label in view
    updateMappingStatus();
}
function stopAutoMapping() {
    // TODO: what if there's an operation in progress? get its result, or drop it?
    autoMappingInProgress( false );
    currentlyMappingOTUs.removeAll();
    recentMappingSpeedBarClass( 'progress progress-info' );   // inactive blue bar
    updateMappingStatus();
}

function updateMappingSpeed( newElapsedTime ) {
    recentMappingTimes.push(newElapsedTime);
    if (recentMappingTimes.length > 5) {
        // keep just the last 5 times
        recentMappingTimes = recentMappingTimes.slice(-5);
    }

    var total = 0;
    $.each(recentMappingTimes, function(i, time) {
        total += time;
    });
    var rollingAverage = total / recentMappingTimes.length;
    var secPerName = rollingAverage / 1000;
    // show a legible number (first significant digit)
    var displaySec;
    if (secPerName >= 0.1) {
        displaySec = secPerName.toFixed(1);
    } else if (secPerName >= 0.01) {
        displaySec = secPerName.toFixed(2);
    } else {
        displaySec = secPerName.toFixed(3);
    }

    recentMappingSpeedLabel( displaySec +" sec / name");

    // use arbitrary speeds here, for bad/fair/good
    if (secPerName < 0.2) {
        recentMappingSpeedBarClass( 'progress progress-success' );  // green bar
    } else if (secPerName < 2.0) {
        recentMappingSpeedBarClass( 'progress progress-warning' );  // orange bar
    } else {
        recentMappingSpeedBarClass( 'progress progress-danger' );   // red bar
    }

    // bar width is approximate, needs ~40% to show its text
    recentMappingSpeedPercent( (40 + Math.min( (0.1 / secPerName) * 60, 60)).toFixed() +"%" );
}


function getNextUnmappedOTU() {
    var unmappedOTU = null;
    var visibleOTUs = viewModel.filteredOTUs().pagedItems();
    $.each( visibleOTUs, function (i, otu) {
        var ottMappingTag = getMetaTagByProperty(otu.meta, 'ot:ottId');
        var proposedMappingInfo = proposedMapping(otu);
        if (!ottMappingTag && !proposedMappingInfo) {
            // this is an unmapped OTU!
            if (failedMappingOTUs.indexOf(otu['@id']) === -1) {
                // it hasn't failed mapping (at least not yet)
                unmappedOTU = otu;
                return false;
            }
        }
    });
    return unmappedOTU;
}


function requestTaxonMapping() {
    // set spinner, make request, handle response, and daisy-chain the next request
    // TODO: send one at a time? or in a batch (5 items)?
    
    var otuToMap = getNextUnmappedOTU();
    if (!otuToMap) {
        stopAutoMapping();
        return false;
    }

    updateMappingStatus();
    var otuID = otuToMap['@id'];
    var originalLabel = getMetaTagValue(otuToMap.meta, 'ot:originalLabel');
    // use the manually edited label (if any), or the hint-adjusted version
    var editedAcc = editedLabelAccessor(otuToMap);
    var searchText = editedAcc ? editedAcc() : adjustedLabel(originalLabel);

    if (searchText.length === 0) {
        console.log("No name to match!"); // TODO
        return false;
    } else if (searchText.length < 2) {
        console.log("Need at least two letters!"); // TODO
        return false;
    }

    // groom trimmed text based on our search rules
    var searchContextName = getOTUMappingHints().data.searchContext.$();

    // show spinner alongside this item...
    currentlyMappingOTUs.push( otuID );
    
    var mappingStartTime = new Date();

    $.ajax({
        url: doTNRSForNames_url,  // NOTE that actual server-side method name might be quite different!
        type: 'POST',
        dataType: 'json',
        data: JSON.stringify({ 
            "queryString": searchText,
            "contextName": searchContextName
        }),  // data (asterisk required for completion suggestions)
        crossDomain: true,
        contentType: 'application/json',
        error: function(jqXHR, textStatus, errorThrown) {

            console.log("!!! something went terribly wrong");
            console.log(jqXHR.responseText);

            showErrorMessage("Something went wrong in taxomachine:\n"+ jqXHR.responseText);

            if (!autoMappingInProgress()) {
                // curator has paused all mapping
                return false;
            }

            currentlyMappingOTUs.remove( otuID );

            // let's hope it's something about this label and try the next one...
            failedMappingOTUs.push( otuID );
            if (autoMappingInProgress()) {
                setTimeout(requestTaxonMapping, 100);
            }

        },
        success: function(data) {    // JSONP callback
            // IF there's a proper response, assert this as the OTU and label for this node
            // TODO: Give the curator a chance to push back? and cleanly roll back changes if they disagree?

            /* Let any pending mapping finish up, even if curator has
             * paused auto-mapping!
            if (!autoMappingInProgress()) {
                // curator has paused all mapping
                return false;
            }
            */

            // update the rolling average for the mapping-speed bar
            var mappingStopTime = new Date();
            updateMappingSpeed( mappingStopTime.getTime() - mappingStartTime.getTime() );

            var maxResults = 100;
            var visibleResults = 0;
            /*
             * The returned JSON 'data' is a simple list of objects. Each object is a matching taxon (or name?)
             * with these properties:
             *      ottId   // taxon ID in OTT taxonomic tree
             *      nodeId  // ie, neo4j node ID
             *      exact   // matches the entered text exactly? T/F
             *      name    // taxon name
             *      higher  // points to a genus or higher taxon? T/F
             */
            if (data && data.length && data.length > 0) {
                // sort results to show exact match(es) first, then more precise (lower) taxa, then others
                // initial sort on lower taxa (will be overridden by exact matches)
                data.sort(function(a,b) {
                    if (a.higher === b.higher) return 0;
                    if (a.higher) return 1;
                    if (b.higher) return -1;
                });
                // final sort on exact matches (overrides lower taxa)
                data.sort(function(a,b) {
                    if (a.exact === b.exact) return 0;
                    if (a.exact) return -1;
                    if (b.exact) return 1;
                });

                // for now, let's immediately apply the top name
                var otuMapping = data[0];
                // NOTE that this is an object with several properties:
                // .name   
                // .ottId   // number-as-string
                // .nodeId  // number
                // .exact   // boolean
                // .higher  // boolean

                proposeOTULabel(otuID, otuMapping);
                // postpone actual mapping until user approves
                
                if (false) {
                    // TODO: offer choices if multiple possibilities are found? 
                    // show all sorted results, up to our preset maximum
                    var matchingNodeIDs = [ ];  // ignore any duplicate results (point to the same taxon)
                    for (var mpos = 0; mpos < data.length; mpos++) {
                        if (visibleResults >= maxResults) {
                            break;
                        }
                        var match = data[mpos];
                        var matchingName = match.name;
                        // 
                        var matchingID = match.ottId;
                        if ($.inArray(matchingID, matchingNodeIDs) === -1) {
                            // TODO: we're not showing this yet; add it to a list of options?
                            /*
                            $('#search-results').append(
                                '<li><a href="'+ matchingID +'">'+ matchingName +'</a></li>'
                            );
                            */
                            console.log("Now I would offer choice '"+ matchingName +"' (id="+ matchingID +")...");
                            matchingNodeIDs.push(matchingID);
                            visibleResults++;
                        }
                    }
                }

            } else {
                failedMappingOTUs.push( otuID );
            }

            currentlyMappingOTUs.remove( otuID );

            // after a brief pause, try for the next available OTU...
            if (autoMappingInProgress()) {
                setTimeout(requestTaxonMapping, 100);
            }

            return false;
        }
    });

    return false;
}

function mapOTUToTaxon( otuID, mappingInfo ) {
    // TODO: apply this mapping, creating Nexson elements as needed

    /* mappingInfo should contain these attributes:
     * {
     *   "name" : "Centranthus",
     *   "ottId" : "759046",
     *
     *   // these may also be present, but aren't important here
     *     "nodeId" : 3325605,
     *     "exact" : false,
     *     "higher" : true
     * }
     */

    // FOR NOW, assume that any leaf node will have a corresponding otu entry;
    // otherwise, we can't have name for the node!
    var otu = getOTUByID( otuID );

    // TODO: add/update its original label?
    var originalLabel = getMetaTagValue(otu.meta, 'ot:originalLabel');
    otu['@label']( mappingInfo.name || 'NAME MISSING!' );

    // add (or update) a metatag mapping this to an OTT id
    var ottId = Number(mappingInfo.ottId);
    var ottMappingTag = getMetaTagByProperty(otu.meta, 'ot:ottId');
    if (!ottMappingTag) {
        addMetaTagToParent(otu, {
            "$": '',
            "@property": "ot:ottId",
            "@xsi:type": "nex:LiteralMeta"
        });
        ottMappingTag = getMetaTagByProperty(otu.meta, 'ot:ottId');
    }
    ottMappingTag.$( ottId );
}

function unmapOTUFromTaxon( otuOrID ) {
    // remove this mapping, removing any unneeded Nexson elements
    var otu = (typeof otuOrID === 'object') ? otuOrID : getOTUByID( otuOrID );
    // restore its original label (versus mapped label)
    var originalLabel = getMetaTagValue(otu.meta, 'ot:originalLabel');
    otu['@label']( '' );    // TODO: THIS IS TOO SLOW, what's up?
    // strip any metatag mapping this to an OTT id
    var ottMappingTag = getMetaTagByProperty(otu.meta, 'ot:ottId');
    if (ottMappingTag) {
        otu.meta.remove(ottMappingTag);    // TODO: THIS IS TOO SLOW, what's up?
    }
}

function addMetaTagToParent( parent, props ) {
    // wrap submitted properties to make an observable metatag
    var newTag = cloneFromSimpleObject( props );
    if (!parent.meta) {
        // add a meta collection here
        parent['meta'] = ko.observableArray();
    }
    parent.meta.push( newTag );
}

function clearVisibleMappings() {
    // TEMPORARY helper to demo mapping tools, clears mapping for the visible (paged) OTUs.
    var visibleOTUs = viewModel.filteredOTUs().pagedItems();
    $.each( visibleOTUs, function (i, otu) {
        unmapOTUFromTaxon( otu );
    });
    clearFailedOTUList();
}

function showNodeOptionsMenu( tree, node, nodePageOffset, importantNodeIDs ) {
    // this is a Bootstrap-style menu whose pointer is centered on the
    // target node
    var nodeMenu = $('#node-menu');
    if (nodeMenu.length === 0) {
        // provide the needed ancestor classes, but minimize the surrounding "navbar"
        $('body').append('<div id="node-menu-holder" class="navbar" style="height: 0; position: static;"><ul class="nav" style="height: 0; position: static;"><li class="dropdown-open"><ul id="node-menu" class="dropdown-menu"></ul></li></div>');
        nodeMenu = $('#node-menu');
    } else {
        nodeMenu.empty(); // clear any prior menu items
    }
    nodeMenu.hide();
    // show appropriate choices for this node
    // if (node['@root'] === 'true') ?
    var nodeID = node['@id'];

    // general node information first, then actions
    nodeMenu.append('<li class="node-information"></li>');
    var nodeInfoBox = nodeMenu.find('.node-information');
    nodeInfoBox.append('<span class="node-name">'+ getTreeNodeLabel(tree, node, importantNodeIDs) +'</span>');

    if (nodeID == importantNodeIDs.specifiedRoot) {

        nodeInfoBox.append('<span class="node-type specifiedRoot">tree root</span>');

        if (viewOrEdit === 'EDIT') {
            nodeMenu.append('<li><a href="#" onclick="hideNodeOptionsMenu(); setTreeRoot( \''+ tree['@id'] +'\', null ); return false;">Un-mark as root of this tree</a></li>');
        }
    } else {
        if (viewOrEdit === 'EDIT') {
            nodeMenu.append('<li><a href="#" onclick="hideNodeOptionsMenu(); setTreeRoot( \''+ tree['@id'] +'\', \''+ nodeID +'\' ); return false;">Mark as root of this tree</a></li>');
        }
    }
    if (nodeID == importantNodeIDs.inGroupClade) {

        nodeInfoBox.append('<span class="node-type inGroupClade">ingroup clade</span>');

        if (viewOrEdit === 'EDIT') {
            nodeMenu.append('<li><a href="#" onclick="hideNodeOptionsMenu(); setTreeIngroup( \''+ tree['@id'] +'\', null ); return false;">Un-mark as the ingroup clade</a></li>');
        }
    } else {
        if (viewOrEdit === 'EDIT') {
            nodeMenu.append('<li><a href="#" onclick="hideNodeOptionsMenu(); setTreeIngroup( \''+ tree['@id'] +'\', \''+ nodeID +'\' ); return false;">Mark as the ingroup clade</a></li>');
        }
        
        // this shouldn't be possible if it's already the ingroup clade
        if (nodeID == importantNodeIDs.nearestOutGroupNeighbor) {

            nodeInfoBox.append('<span class="node-type nearestOutGroupNeighbor">ingroup parent</span>');

            if (viewOrEdit === 'EDIT') {
                nodeMenu.append('<li><a href="#" onclick="hideNodeOptionsMenu(); setTreeOutgroup( \''+ tree['@id'] +'\', null ); return false;">Un-mark as the ingroup clade\'s parent</a></li>');
            }
        } else {
            if (viewOrEdit === 'EDIT') {
                nodeMenu.append('<li><a href="#" onclick="hideNodeOptionsMenu(); setTreeOutgroup( \''+ tree['@id'] +'\', \''+ nodeID +'\' ); return false;">Mark as the ingroup clade\'s parent</a></li>');
            }
        }
    }

    if (nodeInfoBox.find('.node-type').length === 0) {
        if (node['@root'] && node['@root'] === 'true') {
            nodeInfoBox.append('<span class="node-type atRoot">marked as @root</span>');
        }
    }
    if (viewOrEdit === 'EDIT') {
        nodeInfoBox.after('<li class="divider"></li>');
    }

    // show the menu 
    var pointerNudge = {x: -13, y: 8};
    nodeMenu.css({
        "left": (Math.round(nodePageOffset.left + pointerNudge.x) +"px"),
        "top": (Math.round(nodePageOffset.top + pointerNudge.y) +"px"),
        "z-index": 10000  // required to get above modal window
    });
    nodeMenu.show();
    // hide this menu if we hide the modal tree viewer OR scroll the view
    $('#tree-viewer *[data-dismiss=modal], .modal-backdrop').click( hideNodeOptionsMenu );
    $('#tree-viewer .modal-body').scroll( hideNodeOptionsMenu );
}

function hideNodeOptionsMenu( ) {
    var nodeMenuHolder = $('#node-menu-holder');
    if (nodeMenuHolder.length > 0) {
        nodeMenuHolder.remove();
    }
}

function clearD3PropertiesFromTree(tree) {
    $.each( tree.node, function( i, node ) {
        delete node.x;
        delete node.y;
        delete node.depth;
        delete node.parent;
        delete node.children;
        delete node.name;
        delete node.length;
        delete node.ingroup;
        delete node.rootDist;
    });
}

// adapted from http://stackoverflow.com/a/4506030
var fileSizePrefixes = ' KMGTPEZYXWVU';
function getHumanReadableFileSize(size) {
  if(size <= 0) return '0';
  var t2 = Math.min(Math.round(Math.log(size)/Math.log(1024)), 12);
  return (Math.round(size * 100 / Math.pow(1024, t2)) / 100) +
    fileSizePrefixes.charAt(t2).replace(' ', '') + 'B';
}

/*
 * Annotation helpers
 */

// manage central collections
function getStudyAnnotationEvents( nexml ) {
    // returns an array (OR observableArray?), possibly empty
    if (!nexml) {
        nexml = viewModel.nexml;
    }
    return getMetaTagByProperty(nexml.meta, 'ot:annotationEvents');
}
function getStudyAnnotationAgents( nexml ) {
    // returns an array (OR observableArray?), possibly empty
    if (!nexml) {
        nexml = viewModel.nexml;
    }
    return getMetaTagByProperty(nexml.meta, 'ot:agents');
}
function getStudyAnnotationMessages( nexml ) {
    // returns an array (OR observableArray?), possibly empty
    if (!nexml) {
        nexml = viewModel.nexml;
    }
    return getMetaTagByProperty(nexml.meta, 'ot:messages');
}

// manage "local" messages collection for any element
function getLocalMessages( element ) {
    // returns an array (OR observableArray?), possibly empty
    var messages = [];
    if (localMessagesCollectionExists( element )) {
        var collection = getLocalMessagesCollection( element );
        $.each(collection.message(), function(i, msg ) {
            // TODO: iterate properly (child elements)?
            messages.push(msg);
        });
    }
    return messages;
}
function getLocalMessagesCollection( element ) {
    // returns the actual collection accessor, or null
    return getMetaTagByProperty(element.meta, 'ot:messages');
;
}
function localMessagesCollectionExists( element ) {
    // return T|F
    return getLocalMessagesCollection( element ) ? true : false;
}
function localMessagesCollectionIsBeingUsed( element ) {
    // return T|F
    var localMessages = getElementAnnotationMessages( element );
    return localMessages.length > 0;
}
function addLocalMessagesCollection( element ) {
    // TODO: RESTRICT to these elements: nexml, tree, node, edge, otu
    // return the new collection
    var newCollection = cloneFromNexsonTemplate('annotation message collection');
    element.meta.push( newCollection );
    return newCollection;
}
function removeLocalMessagesCollection( element ) {
    var testCollection = getLocalMessagesCollection( element );
    if (testCollection) {
        element.meta.remove(testCollection);
    }
}

// TODO: manage individual annotation messages, anywhere in the study
/*
function addAnnotationMessage() {
}
function removeAnnotationMessage( msg ) {
}
*/

// chase relationships from elements, agents, etc
function getAnnotationsRelatedToElement( element ) {
    // TODO: returns an array, possibly empty
}
function getAgentForAnnotationEvent( annotationEvent ) {
    // returns an agent object, or null if not found
    var agentID = annotationEvent['@wasAssociatedWithAgentId'];
    var matchingAgent = null;
    if (agentID) {
        matchingAgent = getAgent( function(a) { return a['@id'] === agentID; }, viewModel.nexml );
    }
    return matchingAgent;
}
function getMessagesForAnnotationEvent( annotationEvent, nexml ) {
    // returns an array, possibly empty
    if (!nexml) {
        nexml = viewModel.nexml;
    }
    var allMessages = getAllAnnotationMessagesInStudy(nexml);
    var eventID = ko.unwrap( annotationEvent['@id'] );
    var matchingMessages = ko.utils.arrayFilter( 
        allMessages, 
        function(msg) {
            ///console.dir(msg);
            return ko.unwrap( msg['@wasGeneratedById'] ) === eventID;
        }
    );
    return matchingMessages;
}
function getAnnotationEventsForAgent( agent ) {
    // TODO: returns an array, possibly empty
}
function getAnnotationEventForMessage( message ) {
    // TODO: returns a single event, or null
}

// fetch bundled annotationEvent, agent(s), and message(s)?
function getAnnotationBundle( annotationEvent ) {
    // returns an object with event, agents, messages
    var bundle = {
        'event' : annotationEvent,
        'agent' : 'TODO',
        'messages' : []
    };
    return bundle;
}

// create/update/delete annotations, managing collections as needed
function createAnnotation( annotationBundle, nexml ) {
    // targetElement, annotationEvent, agent, messages ) {
    // RENAME to updateAnnotation, setAnnotation?
    // TODO: make sure we can handle "split" events that specify multiple elements
    console.dir(annotationBundle, "bundle");

    if (!nexml) {
        nexml = viewModel.nexml;
    }

    // is the specified nexson already mapped to Knockout observables?
    var nexmlIsMapped = ko.isObservable( nexml.meta );
    console.log("createAnnotation(): nexmlIsMapped = "+ nexmlIsMapped);

    var target = annotationBundle.targetElement;
    var annEvent = annotationBundle.annotationEvent;
    var agent = annotationBundle.agent;
    var messages = annotationBundle.messages;

    // add message(s) to its target element, building a local message 
    // collection if not found
    if (!target) {
        alert("ERROR: target element not found: "+ target +" <"+ typeof(target) +">");
        return;
    }
    var collection = null;
    if (localMessagesCollectionExists( target )) {
        collection = getLocalMessagesCollection( target );
    } else {
        collection = addLocalMessagesCollection( target );
    }
    $.each( messages, function( i, msg ) {
        var messageInfo = $.extend(
            { '@id': getNextAvailableAnnotationMessageID( nexml ) }, 
            msg
        );
        var properMsg = cloneFromSimpleObject( messageInfo, {applyKnockoutMapping: nexmlIsMapped} );
        collection.message.push( properMsg );
    });
    
    // add (or confirm) the specified agent and assign to event
    var hasMatchingID = function(a) { 
        var testID = ko.unwrap( a['@id'] );
        return ko.unwrap( a['@id'] ) === testID; 
    }
    if (!agentExists( hasMatchingID, nexml)) {
        // at this point, viewModel should already be mapped by KO
        var properAgent = cloneFromSimpleObject( agent, {applyKnockoutMapping: false} );
        addAgent( properAgent, nexml );
    }

    // add the main event to this study
    var eventCollection = getStudyAnnotationEvents( nexml );
    // apply a unique annotation event ID, if there's not one baked in
    // already
    eventInfo = $.extend(
        { '@id': getNextAvailableAnnotationEventID( nexml ) }, 
        annEvent
    );
    var properEvent = cloneFromSimpleObject( eventInfo, {applyKnockoutMapping: nexmlIsMapped} );
    eventCollection.annotation.push( properEvent );

    // return something interesting here?
}
function deleteAnnotationEvent( annotationEvent ) {
    // TODO: clear related messages and agents (if no longer used)

    cleanupMessagesCollection( element );
    var localMessages = getElementAnnotationMessages( element );
}

// manage agents (each is a singleton that disappears if unused)
function agentExists( testFunc, nexml ) {
    // return T|F, based on whether any agent meets the test
    return (getAgent( testFunc, nexml ) !== null);
}
function getAgent( testFunc, nexml ) {
    if (!nexml) {
        nexml = viewModel.nexml;
    }
    var agentList = makeArray(getStudyAnnotationAgents( nexml ).agent);
    var foundAgent = null;
    $.each(agentList, function(i, agent) {
        if (testFunc(agent)) {
            foundAgent = agent;
            return false;
        }
    })
    return foundAgent;
}

function agentIsBeingUsed( testFunc ) {
    // return T|F
    var relatedEvents = getAnnotationEventsForAgent( agent );
    return relatedEvents.length > 0;
}
function addAgent( props, nexml ) {
    // nexml is optional (default is viewModel.nexml)
    if (!nexml) {
        nexml = viewModel.nexml;
    }

    // is the specified nexson already mapped to Knockout observables?
    var nexmlIsMapped = ko.isObservable( nexml.meta );
    var agentInfo = $.extend(
        { '@id': getNextAvailableAnnotationAgentID( nexml ) }, 
        props
    );
    var properAgent = cloneFromSimpleObject(agentInfo, {applyKnockoutMapping: nexmlIsMapped});
    var agentList = getStudyAnnotationAgents( nexml ).agent;
    agentList.push( properAgent );
}
function removeAgent( testFunc, nexml ) {
    if (!nexml) {
        nexml = viewModel.nexml;
    }
    var agentList = getStudyAnnotationAgents( nexml ).agent();
    var doomedAgent = null;
    $.each(agentList, function(i, agent) {
        if (testFunc(agent)) {
            doomedAgent = agent;
            return false;
        }
    });
    if (doomedAgent) {
        agentList.remove(doomedAgent);
    }
}

/*
 * Manage unique (study-wide) IDs for annotation types. Note that in
 * each case, we're using text IDs (eg, "message987") but keeping simple
 * integer tallies to show determine the next available ID in the current
 * study.
 */
var highestAnnotationEventID = null;
var annotationEventIDPrefix = 'annotation';

var highestAnnotationAgentID = null;
var annotationAgentIDPrefix = 'agent';

var highestAnnotationMessageID = null;
var annotationMessageIDPrefix = 'message';

function getNextAvailableAnnotationEventID(nexml) {
    if (highestAnnotationEventID === null) {
        if (!nexml) {
            nexml = viewModel.nexml;
        }
        // do a one-time(?) scan for the highest ID currently in use
        var allEvents = makeArray(getMetaTagAccessorByAtProperty(nexml.meta, 'ot:annotationEvents'));
        if (allEvents.length === 0) {
            highestAnnotationEventID = 0;
        } else {
            var sortedEvents = allEvents.sort(function(a,b) {
                if (ko.unwrap( a['@id'] ) > ko.unwrap( b['@id'] )) {
                    return -1;
                }
                return 1;
            });
            highestAnnotationEventID = 0;
            for (var i = 0; i < sortedEvents.length; i++) {
                // ignore agents with special IDs, eg, 'opentree-curation-webapp'
                var testEvent = sortedEvents[i];
                var testID = ko.unwrap(testEvent['@id']);
                if (testID.indexOf(annotationEventIDPrefix) === 0) {
                    highestAnnotationEventID = testID.split( annotationEventIDPrefix )[1];
                    break;
                }
            }
        }
    }
    highestAnnotationEventID++;
    return annotationEventIDPrefix + highestAnnotationEventID;
}
function getNextAvailableAnnotationAgentID(nexml) {
    if (highestAnnotationAgentID === null) {
        if (!nexml) {
            nexml = viewModel.nexml;
        }
        // do a one-time(?) scan for the highest ID currently in use
        var allAgents = makeArray(getMetaTagAccessorByAtProperty(nexml.meta, 'ot:agents'));
        if (allAgents.length === 0) {
            highestAnnotationAgentID = 0;
        } else {
            var sortedAgents = allAgents.sort(function(a,b) {
                if (ko.unwrap( a['@id'] ) > ko.unwrap( b['@id'] )) return -1;
                return 1;
            });
            highestAnnotationAgentID = 0;
            for (var i = 0; i < sortedAgents.length; i++) {
                // ignore agents with special IDs, eg, 'opentree-curation-webapp'
                var testAgent = sortedAgents[i];
                var testID = ko.unwrap(testAgent['@id']);
                if (testID.indexOf(annotationAgentIDPrefix) === 0) {
                    highestAnnotationAgentID = testID.split( annotationAgentIDPrefix )[1];
                    break;
                }
            }
        }
    }
    highestAnnotationAgentID++;
    return annotationAgentIDPrefix + highestAnnotationAgentID;
}
function getNextAvailableAnnotationMessageID(nexml) {
    if (highestAnnotationMessageID === null) {
        // do a one-time(?) scan for the highest ID currently in use
        if (!nexml) {
            nexml = viewModel.nexml;
        }
        var allMessages = getAllAnnotationMessagesInStudy(nexml);
        if (allMessages.length === 0) {
            highestAnnotationMessageID = 0;
        } else {
            var sortedMessages = allMessages.sort(function(a,b) {
                if (ko.unwrap(a['@id']) > ko.unwrap(b['@id'])) {
                    return -1;
                }
                return 1;
            });
            highestAnnotationMessageID = 0;
            for (var i = 0; i < sortedMessages.length; i++) {
                // ignore agents with special IDs, eg, 'opentree-curation-webapp'
                var testMessage = sortedMessages[i];
                var testID = ko.unwrap(testMessage['@id']);
                if (testID.indexOf(annotationMessageIDPrefix) === 0) {
                    highestAnnotationMessageID = testID.split( annotationMessageIDPrefix )[1];
                    break;
                }
            }
        }
    }
    highestAnnotationMessageID++;
    return annotationMessageIDPrefix + highestAnnotationMessageID;
}
function getAllAnnotationMessagesInStudy(nexml) {
    if (!nexml) {
        nexml = viewModel.nexml;
    }
    var allMessages = makeArray(getMetaTagByProperty(nexml.meta, 'ot:messages').message);
    // gather "local" messages from all other elements!
    // NOTE: Add any new target elements here to avoid duplication!
    $.each(makeArray(nexml.otus.otu), function(i, otu) {
        var localMessages = getMetaTagByProperty(otu.meta, 'ot:messages');
        if (localMessages) {
            allMessages += makeArray(localMessages.message);
        }
    });
    $.each(makeArray(nexml.trees.tree), function(i, tree) {
        var localMessages = getMetaTagByProperty(tree.meta, 'ot:messages');
        if (localMessages) {
            allMessages += makeArray(localMessages.message);
        }
        // look again at all nodes in the tree
        $.each(makeArray(tree.node), function(i, node) {
            var localMessages = getMetaTagByProperty(node.meta, 'ot:messages');
            if (localMessages) {
                allMessages += makeArray(localMessages.message);
            }
        });
    });
    return allMessages;
}


/* 
 * Manage free-form tags for a specified study or tree. This is somewhat
 * complicated by the fact that these are stored as a set of zero or more
 * metatags, with no duplicate values for the parent element.
 */

function getTags( parentElement ) {
    var tags = [];
    var rawTagValues = getMetaTagValue(parentElement.meta, 'ot:tag', { 'FIND_ALL': true });
    $.each(rawTagValues, function(i, tagText) {
        var tagText = $.trim(tagText);
        switch(tagText) {  // non-empty points to a candidate tree
            case '':
                break;
            default:
                tags.push( tagText );
        }
    });
    return tags;
}
function addTag( parentElement, newTagText ) {
    addMetaTagToParent(parentElement, {
        "$": newTagText,
        "@property": "ot:tag",
        "@xsi:type": "nex:LiteralMeta"
    });
}
function removeAllTags( parentElement ) {
    var tagElements = getNexsonChildByProperty(parentElement.meta, '@property', 'ot:tag', { 'FIND_ALL': true });
    $.each(tagElements, function(i, tag) {
        removeFromArray( tag, parentElement.meta );
    });
}
function updateElementTags( select ) {
    var parentElement;
    if ($(select).attr('id') === 'study-tags') {
        parentElement = viewModel.nexml;
    } else {
        var treeID = $(select).attr('treeid');
        parentElement = getTreeByID(treeID);
    }
    removeAllTags( parentElement );
    // read and apply the values in this tags-input SELECT element
    // N.B. multiple-value select returns null if no values selected!
    var values = $(select).val() || [];  
    $.each(values, function(i,v) {
        addTag( parentElement, $.trim(v) );
    });
}


/* Define a registry of nudge methods, for use in KO data bindings. Calling
 * a nudge function will update one or more observables to trigger updates
 * in the curation UI. This approach allows us to work without observables,
 * which in turn means we can edit enormous viewmodels.
 */
var nudge = {
    'GENERAL_METADATA': function( data, event ) {
        nudgeTickler( 'GENERAL_METADATA');
    },
    'EDGE_DIRECTIONS': function( data, event ) {
        nudgeTickler( 'EDGE_DIRECTIONS');
    }
}
function nudgeTickler( name ) {
    var tickler = viewModel.ticklers[ name ];
    if (!tickler) {
        console.error("No such tickler: '"+ name +"'!");
    }
    var oldValue = tickler.peek();
    tickler( oldValue + 1 );
    console.log("nudged '"+ name +"', "+ oldValue +" => "+ tickler());
    
    // always nudge the main 'dirty flag' tickler
    viewModel.ticklers.STUDY_HAS_CHANGED( viewModel.ticklers.STUDY_HAS_CHANGED.peek() + 1 );
}

function removeFromArray( doomedValue, theArray ) {
    // removes just one matching value, if found
    var index = $.inArray( doomedValue, theArray );
    if (index !== -1) {
        theArray.splice( index, 1 );
    }
}
