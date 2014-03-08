/*
 * Client-side behavior for the Open Tree curation UI
 *
 * This uses the Open Tree API to fetch and store studies and trees remotely.
 */

// these variables should already be defined in the main HTML page
var studyID;
var API_load_study_GET_url;
var API_update_study_PUT_url;
var API_remove_study_DELETE_url;
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

    // Initialize the jQuery File Upload widgets
    $('#fileupload').fileupload({
        disableImageResize: true,
        // maxNumberOfFiles: 5,
        // maxFileSize: 5000000,  // TODO: allow maximum
        // acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i  // TODO: allow any
        url: '/curator/supporting_files/upload_file',
        dataType: 'json',
        autoUpload: true,
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
                fileNexson['@filename'] = file.name;
                fileNexson['@url'] = file.url;  // TODO: prepend current domain name, if missing?
                fileNexson['@type'] = "";  // TODO: glean this from file extension?
                fileNexson['@size'] = file.size;  // convert byte count for display?
                // TODO: incorporate the delete URL provided? or generate as-needed?
                // fileNexson.delete_url( file.delete_url );

                getSupportingFiles().data.files.file.push(fileNexson);
                nudgeTickler('SUPPORTING_FILES');

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
    
    $('#treeupload').fileupload({
        // NOTE that this should submit the same arguments (except for file
        // data) as submitNewtree() below
        disableImageResize: true,
        // maxNumberOfFiles: 5,
        // maxFileSize: 5000000,  // TODO: allow maximum
        // acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i  // TODO: allow any
        url: $('#tree-import-form').attr('action'),
        dataType: 'json',
        autoUpload: false,
        start: function(e, data) {
            console.log('*** treeupload - start ***');
        },
        /* use actual form widgets instead?
        formData: {
            // these are ADDED to the form's native widgets
            // https://github.com/blueimp/jQuery-File-Upload/wiki/How-to-submit-additional-Form-Data
            author_name: authorName,
            author_email: authorEmail,
            auth_token: authToken
        },
        */
        add: function(e, data) {
            console.log('*** treeupload - add ***');
            $('[name=new-tree-submit]').click(function() {
                console.log('treeupload - submitting...');
                $('[name=uploadid]').val( generateTreeUploadID() );
                $('#ajax-busy-bar').show();
                data.submit();
                return false; // suppress normal form submission!
            });
        },
        always: function(e, data) {
            // do this regardless of success or failure
            console.log('*** treeupload - (always) done ***');
            returnFromNewTreeSubmission( data.jqXHR, data.textStatus );
        }
    }).on('fileuploadprogressall', function (e, data) {
        console.log('tree - fileuploadprogressall');
        var progress = parseInt(data.loaded / data.total * 100, 10);
        $('#tree-upload-progress .bar').css(
            'width',
            progress + '%'
        );
        $('#tree-upload-progress .bar span').text(
            progress + '%'
        );
    }).on('fileuploaddone', function (e, data) {
        console.log('tree - fileuploaddone');
    }) 
    
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
            'output_nexml2json': '1.0.0',
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
            
            // add missing study metadata tags (with default values)
            if (!(['^ot:studyPublicationReference'] in data.nexml)) {
                data.nexml['^ot:studyPublicationReference'] = "";
            }
            if (!(['^ot:studyPublication'] in data.nexml)) {
                console.log(">>> adding complex metatag for 'ot:studyPublication'...");
                data.nexml['^ot:studyPublication'] = {
                    '@href': ""
                }; 
            }
            if (['^ot:curatorName'] in data.nexml) {
                // NOTE that this construction creates n metatags in NeXML,
                // instead of a single metatag with an array as its value
                data.nexml['^ot:curatorName'] = 
                    makeArray(data.nexml['^ot:curatorName']);
            } else {
                data.nexml['^ot:curatorName'] = [ ];
            }
            if (!(['^ot:studyId'] in data.nexml)) {
                data.nexml['^ot:studyId'] = "";
            }
            if (!(['^ot:studyYear'] in data.nexml)) {
                data.nexml['^ot:studyYear'] = "";
            }
            if (!(['^ot:focalClade'] in data.nexml)) {
                data.nexml['^ot:focalClade'] = null // OR ""?
            }
            if (!(['^ot:focalCladeOTTTaxonName'] in data.nexml)) {
                data.nexml['^ot:focalCladeOTTTaxonName'] = "";
            }
            if (!(['^ot:notIntendedForSynthesis'] in data.nexml)) {
                data.nexml['^ot:notIntendedForSynthesis'] = false;
            }

            // NOTE that we should "pluralize" existing arrays, in case
            // Badgerfish conversion has replaced it with a single item
            if ('^ot:candidateTreeForSynthesis' in data.nexml) {
                data.nexml['^ot:candidateTreeForSynthesis'].candidate = 
                    makeArray(data.nexml['^ot:candidateTreeForSynthesis'].candidate);
            } else {
                data.nexml['^ot:candidateTreeForSynthesis'] = {
                    'candidate': [ ]
                }
            }

            // add study-level containers for annotations
            if (['^ot:annotationEvents'] in data.nexml) {
                data.nexml['^ot:annotationEvents'].annotation = 
                    makeArray(data.nexml['^ot:annotationEvents'].annotation);
            } else {
                data.nexml['^ot:annotationEvents'] = {
                    'annotation': []
                }
            }
            if (['^ot:agents'] in data.nexml) {
                data.nexml['^ot:agents'].agent = 
                    makeArray(data.nexml['^ot:agents'].agent);
            } else {
                data.nexml['^ot:agents'] = {
                    'agent': []
                }
            }
            if (['^ot:messages'] in data.nexml) {
                data.nexml['^ot:messages'].message = 
                    makeArray(data.nexml['^ot:messages'].message);
                data.nexml['^ot:messages'] = {
                    'message': []
                }
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
                    cloneFromNexsonTemplate('curator annotation agent'), 
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
            $.each(data.nexml.trees, function(i, treesCollection) {
                $.each(treesCollection.tree, function(i, tree) {
                    normalizeTree( tree );
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
                'GENERAL_METADATA': ko.observable(1),
                'EDGE_DIRECTIONS': ko.observable(1),
                'TREES': ko.observable(1),
                'SUPPORTING_FILES': ko.observable(1),
                'OTU_MAPPING_HINTS': ko.observable(1),
                'VISIBLE_OTU_MAPPINGS': ko.observable(1),
                // TODO: add more as needed...
                'STUDY_HAS_CHANGED': ko.observable(1)
            }     

            viewModel.ticklers.STUDY_HAS_CHANGED.subscribe( updateQualityDisplay );

            // support fast lookup of elements by ID, for largest trees
            viewModel.fastLookups = {
                'NODES_BY_ID': null,
                'OTUS_BY_ID': null,
                'EDGES_BY_SOURCE_ID': null,
                'EDGES_BY_TARGET_ID': null
            };
            
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
                var ticklers = [ viewModel.ticklers.TREES() ];

                updateClearSearchWidget( '#tree-list-filter' );

                var match = viewModel.listFilters.TREES.match(),
                    matchPattern = new RegExp( $.trim(match), 'i' );

                var allTrees = [];
                $.each(viewModel.nexml.trees, function(i, treesCollection) {
                    // watch for single trees here!
                    var treeList = makeArray(treesCollection.tree);
                    $.each(treeList, function(i, tree) {
                        allTrees.push( tree );
                    });
                });

                console.log("  filtering "+ allTrees.length +" trees...");

                // map old array to new and return it
                var filteredList = ko.utils.arrayFilter( 
                    allTrees, 
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
                var ticklers = [ viewModel.ticklers.SUPPORTING_FILES() ];

                updateClearSearchWidget( '#file-list-filter' );

                var match = viewModel.listFilters.FILES.match(),
                    matchPattern = new RegExp( $.trim(match), 'i' );

                // map old array to new and return it
                var fileDetails = [];
                $.each(getSupportingFiles().data.files.file, function(i, fileInfo) {
                    fileDetails.push(fileInfo);
                });

                $.each(viewModel.nexml.trees, function(i, treesCollection) {
                    // watch for a bare singleton here!
                    var treeList = makeArray(treesCollection.tree);
                    $.each(treeList, function(i, tree) {
                        if ('^ot:messages' in tree) {
                            var msgList = makeArray(tree['^ot:messages'].message);
                            $.each(msgList, function(i, msg) {
                                if (msg['@code'] === 'SUPPORTING_FILE_INFO') {
                                    $.each(msg.data.files.file, function(i, fileInfo) {
                                        fileDetails.push(fileInfo);
                                    });
                                }
                            });
                        }
                    });
                });

                var filteredList = ko.utils.arrayFilter( 
                    fileDetails,  // retrieve contents of observableArray
                    function(file) {
                        // match entered text against old or new label
                        var fileName = file['@filename'];
                        var fileType = file['@type'];
                        var fileDesc = file.description.$;
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
                var ticklers = [ viewModel.ticklers.OTU_MAPPING_HINTS() ];
                updateClearSearchWidget( '#otu-list-filter' );

                var match = viewModel.listFilters.OTUS.match(),
                    matchPattern = new RegExp( $.trim(match), 'i' );
                var scope = viewModel.listFilters.OTUS.scope();
                var order = viewModel.listFilters.OTUS.order();

                // gather all OTUs from all 'otus' collections
                var allOTUs = [];
                $.each(viewModel.nexml.otus, function( i, otusCollection ) {
                    $.merge(allOTUs, otusCollection.otu );
                });

                console.log("  filtering "+ allOTUs.length +" otus...");

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
                    allOTUs, 
                    function(otu) {
                        // match entered text against old or new label
                        var originalLabel = otu['^ot:originalLabel'];
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
                            var aOriginal = a['^ot:originalLabel'];
                            var bOriginal = b['^ot:originalLabel'];
                            if (aOriginal === bOriginal) return 0;
                            if (aOriginal < bOriginal) return -1;
                            return 1;
                        });
                        break;

                    case 'Original label (Z-A)':
                        filteredList.sort(function(a,b) { 
                            var aOriginal = a['^ot:originalLabel'];
                            var bOriginal = b['^ot:originalLabel'];
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
                updateClearSearchWidget( '#annotation-list-filter' );

                var match = viewModel.listFilters.ANNOTATIONS.match(),
                    matchPattern = new RegExp( $.trim(match), 'i' );
                var scope = viewModel.listFilters.ANNOTATIONS.scope();
                var submitter = viewModel.listFilters.ANNOTATIONS.submitter();

                // filter study metadata, build new array to new and return it
                var annotationsCollection = viewModel.nexml['^ot:annotationEvents'];
                var filteredList = ko.utils.arrayFilter( 
                    annotationsCollection.annotation,
                    function(annotation) {
                        // match entered text against type, location, submitter name, message text
                        var itsAgent = getAgentForAnnotationEvent( annotation );
                        var itsMessages = getMessagesForAnnotationEvent( annotation );

                        var itsType = itsMessages && (itsMessages.length > 0) ? 
                                itsMessages[0]['@code'] : 
                                ""; // TODO: incorporate all messages?
                        ///var itsLocation = "Study"; // TODO
                        var itsSubmitter = itsAgent['@name'];
                        var itsMessageText = itsMessages && (itsMessages.length > 0) ? 
                                $.map(itsMessages, function(m) { 
                                    return m['humanMessage'] ? m['@humanMessage'] : ""; 
                                }).join('|') :
                                ""; 
                        var itsSortDate = annotation['@dateCreated'];
                        if (!matchPattern.test(itsType) && 
                            !matchPattern.test(itsSubmitter) && 
                            !matchPattern.test(itsMessageText)) {
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

            /* TODO: any edits in this area should nudge the OTU_MAPPING_HINTS tickler
            mappingHints.data.searchContext.$.subscribe(clearFailedOTUList);
            mappingHints.data.substitutions.substitution.subscribe(clearFailedOTUList);
            $.each(mappingHints.data.substitutions.substitution, function(i, subst) {
                subst['@active'].subscribe(clearFailedOTUList);
                subst.new.$.subscribe(clearFailedOTUList);
                subst.old.$.subscribe(clearFailedOTUList);
            });
            */
            viewModel.ticklers.OTU_MAPPING_HINTS.subscribe(clearFailedOTUList);

            // some changes to metadata will modify the page's headings
            viewModel.ticklers.GENERAL_METADATA.subscribe(updatePageHeadings);
            updatePageHeadings();

            var mainPageArea = $('#main .tab-content')[0];
            ko.applyBindings(viewModel, mainPageArea);

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

function updatePageHeadings() {
    // page headings should reflect the latest metadata for the study
    var studyFullReference = viewModel.nexml['^ot:studyPublicationReference'];
    var studyCompactReference = fullToCompactReference(studyFullReference);
    $('#main-title').html('<span style="color: #ccc;">Editing study</span> '+ studyCompactReference);

    var studyDOI = viewModel.nexml['^ot:studyPublication'];
    studyDOI = $.trim(studyDOI);
    if (studyDOI === "") {
        $('a.main-title-DOI').hide();
    } else {
        $('a.main-title-DOI').text(studyDOI).attr('href', studyDOI).show();
    }
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

var hidingBranchLengths = false;
function toggleBranchLengthsInViewer(cb) {
    // checkbox enables/disables branch-length display (and labeling?) in
    // tree-view popup
    hidingBranchLengths = $(cb).is(':checked');
    // fetch tree ID from popup's widgets
    var currentTreeID = $('#tree-tags').attr('treeid');
    if (currentTreeID) {
        drawTree(currentTreeID)
    } else {
        console.warn("No tree in vizInfo!");
    }
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
    saveURL += ('?'+ qsVars);

    // strip any extraneous JS properties from study Nexson
    var allTrees = [];
    $.each(viewModel.nexml.trees, function(i, treesCollection) {
        $.each(treesCollection.tree, function(i, tree) {
            allTrees.push( tree );
        });
    });
    $.each( allTrees, function(i, tree) {
        cleanupAdHocRoot(tree);
        clearD3PropertiesFromTree(tree);
    });
    
    // add this user to the curatorName list, if not found
    var listPos = $.inArray( curatorDisplayName, viewModel.nexml['^ot:curatorName'] );
    if (listPos === -1) {
        viewModel.nexml['^ot:curatorName'].push( curatorDisplayName );
    }
  
    $.ajax({
        type: 'PUT',
        dataType: 'json',
        // crossdomain: true,
        contentType: "application/json; charset=utf-8",
        url: saveURL,
        processData: false,
        data: ('{"nexml":'+ JSON.stringify(viewModel.nexml) +'}'),
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

function removeStudy() {
    // let's be sure, since deletion will make a mess...
    if (!confirm("Are you sure you want to delete this study?")) {
        return;
    }

    var removeURL = API_remove_study_DELETE_url.replace('{STUDY_ID}', studyID);
    // add auth-token to the query string (no body allowed!)
    var qsVars = $.param({
        author_name: authorName,
        author_email: authorEmail,
        auth_token: authToken
    });
    removeURL += ('?'+ qsVars);

    // do the actual removal (from the remote file-store) via AJAX
    $('#ajax-busy-bar').show();
    
    $.ajax({
        type: 'DELETE',
        dataType: 'json',
        // crossdomain: true,
        contentType: "application/json; charset=utf-8",
        url: removeURL, // modified API call, see above
        data: {},   // sadly not recognized for DELETE, using query-string instead 
        complete: function( jqXHR, textStatus ) {
            // report errors or malformed data, if any
            if (textStatus !== 'success') {
                showErrorMessage('Sorry, there was an error removing this study.');
                console.log("ERROR: textStatus !== 'success', but "+ textStatus);
                return;
            }
            /*
            if (data.message !== 'File deleted') {
                showErrorMessage('Sorry, there was an error removing this study.');
                console.log("ERROR: message !== 'File deleted', but "+ data.message);
                return;
            }
            */

            $('#ajax-busy-bar').hide();
            showSuccessMessage('Study removed, returning to study list...');
            setTimeout(function() {
                var studyListURL = $('#return-to-study-list').attr('href');
                if (!studyListURL) {
                    console.error("Missing studyListURL!");
                }
                window.location = studyListURL || '/curator';
            }, 3000);
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
    // return the matching otu, or null if not found
    var lookup = getFastLookup('OTUS_BY_ID');
    return lookup[ id ] || null;
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

function normalizeTree( tree ) {
    // add expected tree properties and metadata, if missing

    // editable display name for this tree
    if ((tree['@label'] === undefined) || ($.trim(tree['@label']) === '')) {
        tree['@label'] = 'Untitled ('+ tree['@id'] +')';
    }

    // metadata fields with other defaults
    if (!(['^ot:unrootedTree'] in tree)) {
        // safest value, forces the curator to assert correctness
        tree['^ot:unrootedTree'] = true;
    }

    // metadata fields (with empty default values)
    var metatags = [
        '^ot:curatedType',
        '^ot:specifiedRoot',
        '^ot:inGroupClade',
        '^ot:outGroupEdge',
        '^ot:branchLengthMode',
        '^ot:branchLengthTimeUnit',
        '^ot:branchLengthDescription'
    ];
    $.each(metatags, function(i, tagName) {
        if (!(tagName in tree)) {
            tree[tagName] = "";
        }
    });
    
}

function normalizeOTUs( tree ) {
    // modify this tree's OTUs (if needed) to support mapping OTUs to OTT taxa
    var itsOTUs = [];
    $.each( makeArray(tree.node), function(i, node) {
        // work backward from nodes to get its OTUs
        if ('@otu' in node) {
            itsOTUs.push( getOTUByID( node['@otu'] ) );
        }
    });
    console.log("found "+ itsOTUs.length +" OTUs for this tree");

    $.each( itsOTUs, function(i, otu) {
        // Our main concern is whether it's been mapped to an OTT taxon.
        var itsOTTid =  otu['^ot:ottId'];
        if (!itsOTTid || ($.trim(itsOTTid) === '')) {
            // no OTT id found; shuffle properties as needed
            var itsOriginalLabel = otu['^ot:originalLabel'];
            var itsProposedLabel = otu['@label'];
            if ($.trim(itsOriginalLabel) === '') {
                // move "final" to original label
                otu['^ot:originalLabel'] = itsProposedLabel;
                delete otu['@label'];
            } else {
                // retain "final" label as proposed, use in mapping
            }
        }
    });
}

function getPreferredTreeIDs() {
    preferredTreeIDs = [];
    var candidateTreeMarkers = ('^ot:candidateTreeForSynthesis' in viewModel.nexml) ? 
        makeArray( viewModel.nexml['^ot:candidateTreeForSynthesis'].candidate ) : [];

    $.each(candidateTreeMarkers, function(i, marker) {
        var treeID = $.trim(marker);
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
    var allTrees = [];
    $.each(viewModel.nexml.trees, function(i, treesCollection) {
        $.each(treesCollection.tree, function(i, tree) {
            allTrees.push( tree );
        });
    });
    return ko.utils.arrayFilter( 
        allTrees, 
        function(tree) {
            var isPreferred = ($.inArray(tree['@id'], preferredTreeIDs) !== -1);
            return isPreferred;
        }
    );
}
function togglePreferredTree( tree ) {
    var treeID = tree['@id'];
    var alreadyPreferred = ($.inArray( treeID, getPreferredTreeIDs()) !== -1);
    if (alreadyPreferred) {
        // remove it from the list of preferred trees
        removeFromArray( treeID, viewModel.nexml['^ot:candidateTreeForSynthesis'].candidate );
    } else {
        // add it to the list of preferred trees
        viewModel.nexml['^ot:candidateTreeForSynthesis'].candidate.push( treeID ); 
    }
    nudgeTickler('OTU_MAPPING_HINTS');
    return true;  // to allow checkbox updates
}
function getNonPreferredTrees() {
    var preferredTreeIDs = getPreferredTreeIDs();
    var allTrees = [];
    $.each(viewModel.nexml.trees, function(i, treesCollection) {
        $.each(treesCollection.tree, function(i, tree) {
            allTrees.push( tree );
        });
    });
    return ko.utils.arrayFilter( 
        allTrees, 
        function(tree) {
            var isPreferred = ($.inArray(tree['@id'], preferredTreeIDs) !== -1);
            return !isPreferred;
        }
    );
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

        // Is this a leaf node? If not, skip it
        //console.log(i +' is a leaf? '+ node['^ot:isLeaf']);
        if (node['^ot:isLeaf'] !== true) {
            // this is not a leaf node! skip to the next one
            return true;
        }
        totalLeafNodes++;

        // Simply check for the presence (or absence) of an @otu 'getter' function
        // (so far, it doesn't seem to exist unless there's a mapped OTU)
        if ('@otu' in node) {
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
    // return display-ready description of tree root (arbitrary vs. biologically correct)
    if (!tree || !tree.node || tree.node.length === 0) {
        return 'Unrooted (empty)';
    }
    
    // Apply our "business rules" for tree and/or ingroup rooting, based on
    // tree-level metadata.
    var specifiedRoot = tree['^ot:specifiedRoot'] || null;
    var unrootedTree = tree['^ot:unrootedTree'];

    if (unrootedTree) {
        return "Arbitrary (not biologically correct)";
    } else {
        return "Biologically correct";
    }
}
function getRootNodeDescriptionForTree( tree ) {
    // return display-ready description ('node123 [implicit]', 'node234 [explicit]', 'No root', ...)
    if (!tree || !tree.node || tree.node.length === 0) {
        return 'No root (empty tree)';
    }
    
    // Apply our "business rules" for tree and/or ingroup rooting, based on
    // tree-level metadata.
    var specifiedRoot = tree['^ot:specifiedRoot'] || null;
    var unrootedTree = tree['^ot:unrootedTree'];
    // if no specified root node, use the implicit root (first in nodes array)
    var rootNodeID = specifiedRoot ? specifiedRoot : tree.node[0]['@id'];

    var nodeName = ('Unnamed internal node');
    $.each(tree.node, function(i, node) {
        // Find the node with this ID and see if it has an assigned OTU
        if (node['@id'] === rootNodeID) {
            var nodeOTU = node['@otu'];
            if (nodeOTU) {
                // find the matching OTU and show its label
                $.each(viewModel.nexml.otus, function( i, otusCollection ) {
                    $.each(otusCollection.otu, function( i, otu ) {
                        // Find the node with this ID and see if it has an assigned OTU
                        if (otu['@id'] === nodeOTU) {
                            nodeName = otu['@label'] || 'Unlabeled OTU';
                        }
                    });
                });
            } 
            return false; // stop checking nodes
        }
        return true;  // skip to next node
    });
    return nodeName;
}
function getRootedStatusForTree( tree ) {
    // return display-ready description ('<span class="caution">Tree root is arbitrary</span>', ...)
    var biologicalRootMessage = 'Tree root is believed to be biologically correct.';
    var arbitraryRootMessage = '<span class="interesting-value">Tree root is arbitrary (not biologically correct)</span>';

    if (!tree || !tree.node || tree.node.length === 0) {
        return '';
    }
    
    // Apply our "business rules" for tree and/or ingroup rooting, based on
    // tree-level metadata.
    var unrootedTree = tree['^ot:unrootedTree'];
    if (unrootedTree) {
        return arbitraryRootMessage;
    }
    return biologicalRootMessage;
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
    var rawModeValue = tree['^ot:branchLengthMode'];
    if (!rawModeValue) {
        return 'Unspecified';
    }
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
    return tree['^ot:branchLengthTimeUnit'] || "Myr?";
}
function getBranchLengthDescriptionForTree( tree ) {
    // NOTE that this is an explicit description in its own field, for
    // use when 'ot:other' is specified for the branchLengthMode!
    return tree['^ot:branchLengthDescription'] || "Undefined";
}

function getInGroupCladeDescriptionForTree( tree ) {
    // Return display-ready description of a tree's ingroup clade (for tree list).
    
    var nodeID = tree['^ot:inGroupClade'];
    if (!nodeID) {
        return 'Unspecified';
    }
    var nodeName = ('Unnamed internal node');

    // try to retrieve a recognizable taxon label for the ingroup clade's root
    var node = getTreeNodeByID( tree, nodeID );
    if (node && '@otu' in node) {
        var otu = getOTUByID( node['@otu'] );
        if (otu) {
            nodeName = otu['@label'] || 'Unlabeled OTU';
        }
    }

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
 * Real-time quality assessment for Open Tree study data, based on chosen criteria,
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
                var ticklers = [viewModel.ticklers.GENERAL_METADATA()];
                var studyYear = studyData.nexml['^ot:studyYear'] || "";
                var pubRef = studyData.nexml['^ot:studyPublicationReference'] || "";
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
                var DOI = ('^ot:studyPublication' in studyData.nexml) ? studyData.nexml['^ot:studyPublication']['@href'] : "";
                var pubRef = studyData.nexml['^ot:studyPublicationReference'];
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
                var allTrees = [];
                $.each(viewModel.nexml.trees, function(i, treesCollection) {
                    $.each(treesCollection.tree, function(i, tree) {
                        allTrees.push( tree );
                    });
                });
                return (allTrees.length > 0);
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
                var optOutFlag = studyData.nexml['^ot:notIntendedForSynthesis'];
                if (optOutFlag) {
                    // submitter has explicitly said this study is not intended for synthesis
                    return true;
                }
                // check for any candidate tree in the study
                return getPreferredTrees().length > 0;
            },
            weight: 0.3, 
            successMessage: "There is at least one candidate tree, or the submitter has opted out of synthesis.",
            failureMessage: "There should be at least one candidate tree, or the submitter should opt out of synthesis.",
            suggestedAction: "Mark a tree as candidate for synthesis, or opt out of synthesis in Metadata."
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
                var optOutFlag = studyData.nexml['^ot:notIntendedForSynthesis'];
                if (optOutFlag) {
                    // submitter has explicitly said this study is not intended for synthesis
                    return true;
                }
               
                // find all the candidate trees by ID (on study metadata) and build a tally tree
                //var candidateTreeTallies = { };
                
                // check the proportion of mapped leaf nodes in all candidate ("preferred") trees
                var unmappedLeafNodesFound = false;
                $.each(getPreferredTrees(), function(i, tree) {
                    if (!tree.node || tree.node.length === 0) {
                        // skip this tree (no nodes yet, which is weird but not relevant to the test)
                        //candidateTreeTallies[ treeID ].mappedNodes = 0;
                        //candidateTreeTallies[ treeID ].totalNodes = 0;
                        return true;
                    }

                    // only check the leaf nodes on the tree
                    var totalNodes = 0;
                    var mappedNodes = 0;
                    $.each(tree.node, function(i, node) {
                        // is this a leaf? check for metatag .isLeaf
                        if (node['^ot:isLeaf'] === true) {
                            // Simply check for the presence (or absence) of an @otu 'getter' function
                            // (so far, it doesn't seem to exist unless there's a mapped OTU)
                            totalNodes++;
                            if ('@otu' in node) {
                                mappedNodes++;
                            } else {
                                unmappedLeafNodesFound = true;
                                return false;   // bail out of loop
                            }
                        }
                    });
                    // TODO: actually count these, for a proportional score?
                    //candidateTreeTallies[ treeID ].mappedNodes = mappedNodes;
                    //candidateTreeTallies[ treeID ].totalNodes = totalNodes;
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
/*
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
*/
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
        updateInferenceMethodWidgets( tree );
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
    var specifiedRoot = tree['^ot:specifiedRoot'] || null;
    var rootNodeID = specifiedRoot ? specifiedRoot : tree.node[0]['@id'];

    var inGroupClade = tree['^ot:inGroupClade'] || null;

    // we'll pass this along to helpers that choose node labels, classes, etc.
    var importantNodeIDs = {
        'treeRoot': rootNodeID,         // may be arbitrary!
        'inGroupClade': inGroupClade
    }

    var rootNode = getTreeNodeByID(tree, rootNodeID);

    var edges = tree.edge;
console.log(">> preparing "+ edges.length +" edges in this tree...");

    /* render the tree as a modified phylogram */
    
    // preload nodes with proper labels and branch lengths
    $.each(tree.node, function(index, node) {
        node.name = getTreeNodeLabel(tree, node, importantNodeIDs);
        // reset x of all nodes, to avoid gradual "creeping" to the right
        node.x = 0;
        node.length = 0;  // ie, branch length
        node.rootDist = 0;
    });
console.log(">> default node properties in place...");
    $.each(edges, function(index, edge) {
        // transfer @length property (if any) to the child node
        if ('@length' in edge) {
            var childID = edge['@target'];
            var childNode = getTreeNodeByID(tree, childID);
            childNode.length = parseFloat(edge['@length']);
            ///console.log("> reset length of node "+ childID+" to: "+ childNode.length);
        }
    });
console.log("> done sweeping edges");

    //var currentWidth = $("#tree-viewer #dialog-data").width();
    //var currentWidth = $("#tree-viewer #dialog-data").css('width').split('px')[0];
    var currentWidth = $("#tree-viewer").width() - 400;

    // let's set the viewer height based on total number of nodes
    // (in a bifurcating tree, perhaps half will be leaf nodes)
    var viewHeight = tree.node.length * 20;
    console.log("setting tree-view height to "+ viewHeight);
    
    var treeEdgesHaveLength = ('@length' in tree.edge[0]);

    vizInfo.vis = null;
    d3.selectAll('svg').remove();

    vizInfo = d3.phylogram.build(
        "#tree-viewer #dialog-data",   // selector
        rootNode,
        {           // options
            vis: vizInfo.vis,
            // TODO: can we make the size "adaptive" based on vis contents?
            width: currentWidth,  // must be simple integers
            height: viewHeight,
            // simplify display by omitting scales or variable-length branches
            skipTicks: true,
            skipBranchLengthScaling: (hidingBranchLengths || !(treeEdgesHaveLength)) ?  true : false,
            children : function(d) {
                var parentID = d['@id'];
                var itsChildren = [];
                var childEdges = getTreeEdgesByID(null, parentID, 'SOURCE');

                // If this node has one child, it's a latent root-node that
                // should be hidden in the tree view.
                if (childEdges.length === 1) {
                    // treat ITS child node as my immediate child in the displayed tree
                    var onlyChildNodeID = childEdges[0]['@target'];
                    childEdges = getTreeEdgesByID(null, onlyChildNodeID, 'SOURCE');
                }

                $.each(childEdges, function(index, edge) {
                    var childID = edge['@target'];
                    var childNode = getTreeNodeByID(null, childID);
                    if (!('@id' in childNode)) {
                        console.error(">>>>>>> childNode is a <"+ typeof(childNode) +">");
                        console.error(childNode);
                    }
                    itsChildren.push( childNode );
                });
                return itsChildren;
            }
        }
    );
    console.log("> done drawing raw phylogram");

    // (re)assert proper classes for key nodes
    vizInfo.vis.selectAll('.node')
        .attr("class", function(d) {
            var itsClass = "node";
            if (!d.children) {
                itsClass += " leaf";
            }
            if (d['@id'] === rootNodeID) {
                itsClass += " specifiedRoot";
            }
            if (d['@id'] === inGroupClade) {
                itsClass += " inGroupClade";
            }
            ///console.log("CLASS is now "+ itsClass);
            return itsClass;
        });
    console.log("> done re-asserting classes");

    // (re)assert standard click behavior for all nodes
    vizInfo.vis.selectAll('.node circle')
        .on('click', function(d) {
            d3.event.stopPropagation();
            // show a menu with appropriate options for this node
            var nodePageOffset = $(d3.event.target).offset();
            showNodeOptionsMenu( tree, d, nodePageOffset, importantNodeIDs );
        });

    // (re)assert standard hover+click behavior for edges
    vizInfo.vis.selectAll('path')
        .on('click', function(d) {
            d3.event.stopPropagation();
            // show a menu with appropriate options for this node
            var mousePageOffset = {
                left: d3.event.pageX,
                top: d3.event.pageY 
            };
            showEdgeOptionsMenu( tree, d, mousePageOffset, importantNodeIDs );
        });

    // (re)assert standard click behavior for main vis background
    d3.select('#tree-viewer')  // div.modal-body')
        .on('click', function(d) {
            d3.event.stopPropagation();
            // hide any node menu
            hideNodeOptionsMenu( );
        });
    
    console.log("> done re-asserting click behaviors");
}

function setTreeRoot( treeOrID, rootingInfo ) {
    // (Re)set the node that is the primary root for this tree, if known
    // 'rootingInfo' can be any of
    //  - a single node (make this the new root)
    //  - a single root-node ID (for the new root)
    //  - an array of nodes or IDs (add a root between these)
    //  - null (un-root this tree)
    
    var tree = null;
    if (typeof(treeOrID) === 'object') {
        tree = treeOrID;
    } else {
        tree = getTreeByID(treeOrID);
    }

    // make sure we have a proper node ID
    var newRootNodeID = null;
    if (!rootingInfo) {
        // if null, we're un-rooting this tree
    } else if (typeof rootingInfo === 'string') {
        // assume this is the ID of the root node
        newRootNodeID = rootingInfo;
    } else if ($.isArray(rootingInfo)) {
        // this is an array of sourceID, targetID
        // TODO: check for an existing "latent" node between these two
        var latentRootNode = getTreeNodeBetween( tree, rootingInfo[0], rootingInfo[1] );
        if (latentRootNode) {
            // re-root to the latent node
            newRootNodeID = latentRootNode['@id'];
        } else {
            // create a new node (and edge) to join these nodes
            var newRootNode = addTreeNodeBetween( tree, rootingInfo[0], rootingInfo[1] );
            newRootNodeID = newRootNode['@id'];
        }
    } else {
        // assume it's a node object
        newRootNodeID = rootingInfo['@id'];
    }
    if (!newRootNodeID) {
        console.error("setTreeRoot(): no new root-node ID specified: "+ rootingInfo 
                +" <"+ (typeof rootingInfo) +">");
        return;
    }
    var newRootNode = getTreeNodeByID(tree, newRootNodeID);
    if (!newRootNode) {
        console.error("setTreeRoot(): couldn't find the new root node, ID = "+ newRootNodeID 
                +" <"+ (typeof newRootNodeID) +">");
        return;
    }

    // make any changes required to the old root node
    var specifiedRoot = tree['^ot:specifiedRoot'] || null;
    var oldRootNode = specifiedRoot ? getTreeNodeByID(tree, specifiedRoot) : tree.node[0];
    delete oldRootNode['@root'];

    // update tree and node properties
    tree['^ot:specifiedRoot'] = newRootNodeID;
    newRootNode['@root'] = true;
    // selective deletion of d3 parent
    delete newRootNode['parent'];

    updateEdgesInTree( tree );
    drawTree( tree );
    nudgeTickler('TREES');
}

function toggleTreeRootStatus( tree, event ) {
    // toggle its ^ot:unrootedTree property (should always be present)
    // NOTE that radio-button values are strings, so we convert to boolean below
    var currentState = tree['^ot:unrootedTree'];
    var newState = $(event.target).val() === 'true';
    tree['^ot:unrootedTree'] = newState;
    
    // choosing non-arbitrary (biologically correct) rooting should implicitly
    // select the current root node, since this signals intent
    var isBiologicallyCorrect = !(tree['^ot:unrootedTree']);
    if (isBiologicallyCorrect) {
        // if no specified root node, use the implicit root (first in nodes array)
        var specifiedRoot = tree['^ot:specifiedRoot'] || null;
        if (!specifiedRoot) {
            // use the implicit root (first in nodes array)
            var rootNodeID = tree.node[0]['@id'];
            tree['^ot:specifiedRoot'] = rootNodeID;
        }
    }
    nudgeTickler('TREES');
    return true; // update the checkbox
}

function getTreeNodeBetween( tree, nodeID_A, nodeID_B ) {
    // mostly used to detect "latent" (unused) root nodes
    var edgesFromA = getTreeEdgesByID( tree, nodeID_A, 'ANY' );
    var edgesFromB = getTreeEdgesByID( tree, nodeID_B, 'ANY' );
    
    // gather the "other" node for each edge of A and B
    var neighborNodes_A = $.map(edgesFromA, function(e) {
        return (e['@source'] === nodeID_A) ? e['@target'] : e['@source'];
    });
    var neighborNodes_B = $.map(edgesFromB, function(e) {
        return (e['@source'] === nodeID_B) ? e['@target'] : e['@source'];
    });
    var commonNeighbors = $.map(neighborNodes_A,function(n){
        return $.inArray(n, neighborNodes_B) < 0 ? null : n;}
    );
    // we're looking for one common neighbor, possibly a latent root node
    switch( commonNeighbors.length ) {
        case 1:
            return getTreeNodeByID( tree, commonNeighbors[0] );

        case 0:
            // no such node exists
            return null;

        default:
            console.error('getTreeNodeBetween( '+ nodeID_A +', '+ nodeID_B +' ) reports multiple common neighbors!');
            console.error( commonNeighbors );
            return null;
    }
}
function addTreeNodeBetween( tree, nodeID_A, nodeID_B ) {
    // try to add such a node, using our ad-hoc node and edge, as needed
    var adHocRootID = getAdHocRootID(tree);
    if ((nodeID_A === adHocRootID) || (nodeID_B === adHocRootID)) {
        console.warn('addTreeNodeBetween(): One of these nodes is already the ad-hoc root, bailing out now.');
        return getAdHocRoot(tree);
    }
    var edgesFromA = getTreeEdgesByID( tree, nodeID_A, 'ANY' );
    var edgesFromB = getTreeEdgesByID( tree, nodeID_B, 'ANY' );
    
    // if there's a common edge, insert a node there
    var commonEdges = $.map(edgesFromA,function(n) {
        return $.inArray(n, edgesFromB) < 0 ? null : n;
    });

    switch( commonEdges.length ) {
        case 1:
            // this is the expected case; retrieve (or create) this tree's ad-hoc root node
            var adHocRootNode = getAdHocRoot(tree);
            if (!adHocRootNode) {
                // create the ad-hoc root node
                adHocRootNode = {
                    '@id': getAdHocRootID(tree)
                };
                tree.node.push(adHocRootNode);
            }

            // retrieve (or create) the ad-hoc edge we need
            var adHocRootEdge = getAdHocEdge(tree);
            if (!adHocRootEdge) {
                // create the ad-hoc root edge
                adHocRootEdge = {
                    '@id': getAdHocEdgeID(tree),
                    '@source': getAdHocRootID(tree),
                    '@target': null  // we'll set this below
                };
                tree.edge.push(adHocRootEdge);
            } else {
                detachAdHocRootElements(tree);
                // undo any reversals in the existing ad-hoc edge
                adHocRootEdge['@source'] = getAdHocRootID(tree);
            }

            // re-wire the existing edge (and the new one) with minimal changes
            var existingEdge = commonEdges[0];
            existingEdge['@source'] = getAdHocRootID(tree);
            if (existingEdge['@target'] === nodeID_A) {
                adHocRootEdge['@target'] = nodeID_B;
            } else {
                // assume its target is B
                adHocRootEdge['@target'] = nodeID_A;
            }

            // force rebuild of node+edge lookups
            clearFastLookup('NODES_BY_ID');
            clearFastLookup('EDGES_BY_SOURCE_ID');
            clearFastLookup('EDGES_BY_TARGET_ID');

            return adHocRootNode;

        case 0:
            // in principle we could add a node and two edges, but that's out of scope for now
            console.error('addTreeNodeBetween( '+ nodeID_A +', '+ nodeID_B +' ) reports no common edges!');
            return null;

        default:
            console.error('addTreeNodeBetween( '+ nodeID_A +', '+ nodeID_B +' ) reports multiple common edges!');
            console.error( commonEdges );
            return null;
    }
}

// define special, tree-specific element IDs just once
function getAdHocRootID(tree) {
    return (tree['@id'] +'_ROOT');
}
function getAdHocEdgeID(tree) {
    return (tree['@id'] +'_ROOT_EDGE');
}

// fetch the actual elements (per tree)
function getAdHocRoot(tree) {
    // return the node, or null if not found
    return getTreeNodeByID(tree, getAdHocRootID(tree));
}
function getAdHocEdge(tree) {
    // return the edge, or null if not found
    var foundEdge = null;
    $.each(getTreeEdgesByID(tree, getAdHocRootID(tree), 'ANY'), function(index, e) {
        if (e['@id'] === getAdHocEdgeID(tree)) {
            foundEdge = e;
        }
    });
    return foundEdge;
}

// test and manipulate the ad-hoc elements
function adHocRootInUse( tree ) {
    return (tree['^ot:specifiedRoot'] === getAdHocRootID(tree));
}
function cleanupAdHocRoot( tree ) {
    // call this before saving study data, to remove unused ad-hoc elements
    if (!adHocRootInUse(tree)) {
        removeAdHocRootElements(tree);
    }
}
function detachAdHocRootElements( tree ) {
    // detach the ad-hoc root node and/or its companion edge from the tree
    var adHocRootNode = getAdHocRoot(tree);
    if (adHocRootNode) {
        var adHocRootEdge = getAdHocEdge(tree);
        if (adHocRootEdge) {
            var edgesFromRoot = getTreeEdgesByID( tree, getAdHocRootID(tree), 'ANY' );
            $.each(edgesFromRoot, function(index, e) {
                if (e !== adHocRootEdge) {
                    // attach all "loose ends" to an existing node
                    if (e['@source'] === getAdHocRootID(tree)) {
                        e['@source'] = adHocRootEdge['@target'];
                    } else {
                        e['@target'] = adHocRootEdge['@target'];
                    }
                }
            });

            // detach the ad-hoc edge from all but the ad-hoc root
            adHocRootEdge['@target'] = null;
        }
    }
    
    // force rebuild of edge lookups
    clearFastLookup('EDGES_BY_SOURCE_ID');
    clearFastLookup('EDGES_BY_TARGET_ID');
      
    // N.B. don't worry about study['^ot:specifiedRoot'] here, since we're
    // actively re-rooting or doing final cleanup
}
function removeAdHocRootElements( tree ) {
    // N.B. Assumes that the ad-hoc root is not in use, or that we're in the
    // process of re-rooting
    if (adHocRootInUse(tree)) {
        console.warn('removeAdHocRootElements(): ad-hoc root is in use! detaching now...');
        detachAdHocRootElements(tree);  // just in case
    }
    
    // search and destroy the node and/or edge
    var adHocRootNode = getAdHocRoot(tree);
    if (adHocRootNode) {
        removeFromArray( adHocRootNode, tree.node );
    }
    var adHocRootEdge = getAdHocEdge(tree);
    if (adHocRootEdge) {
        removeFromArray( adHocRootEdge, tree.edge );
    }

    // force rebuild of node+edge lookups
    clearFastLookup('NODES_BY_ID');
    clearFastLookup('EDGES_BY_SOURCE_ID');
    clearFastLookup('EDGES_BY_TARGET_ID');
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
    if (ingroupNodeID) {
        tree['^ot:inGroupClade'] = ingroupNodeID;
    } else {
        // clear the current root
        tree['^ot:inGroupClade'] = '';
    }
    updateEdgesInTree( tree );
    drawTree( tree );
    nudgeTickler('TREES');
}

function updateEdgesInTree( tree ) {
    // Update the direction of all edges in this tree, based on its
    // chosen or "natural" root (redefining ingroup in some cases)
    var specifiedRoot = tree['^ot:specifiedRoot'] || null;
    // if no specified root node, use the implicit root (first in nodes array)
    var rootNodeID = specifiedRoot ? specifiedRoot : tree.node[0]['@id'];

    var inGroupClade = tree['^ot:inGroupClade'] || null;

    // root is defined, and possibly ingroup; set direction away from root for all edges
    sweepEdgePolarity( tree, rootNodeID, null, inGroupClade );
    clearFastLookup('EDGES_BY_SOURCE_ID');
    clearFastLookup('EDGES_BY_TARGET_ID');
}

function sweepEdgePolarity( tree, startNodeID, upstreamNeighborID, inGroupClade, insideInGroupClade ) {
    // Push all adjacent edges away from the starting node, except for its
    // upstream neighbor. This should recurse to sweep an entire tree (or
    // subtree) until we reach the tips.

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
    var allTrees = [];
    $.each(viewModel.nexml.trees, function(i, treesCollection) {
        $.each(treesCollection.tree, function(i, tree) {
            allTrees.push( tree );
        });
    });
    var foundTree = null;
    $.each( allTrees, function(i, tree) {
        if (tree['@id'] === id) {
            foundTree = tree;
            return false;
        }
    });
    return foundTree;
}
function getTreeNodeByID(tree, id) {
    // There should be only one matching (or none) within a tree
    // (NOTE that we now use a flat collection across all trees, so disregard 'tree' argument)
    var lookup = getFastLookup('NODES_BY_ID');
    return lookup[ id ] || null;
}
function getTreeEdgesByID(tree, id, sourceOrTarget) {
    // look for any edges associated with the specified *node* ID; return
    // an array of 0, 1, or more matching edges within a tree
    //
    // 'sourceOrTarget' lets us filter, should be 'SOURCE', 'TARGET', 'ANY'
    var foundEdges = [];
    var matchingEdges = null;

    if ((sourceOrTarget === 'SOURCE') || (sourceOrTarget === 'ANY')) {
        // fetch and add edges with this source node
        var sourceLookup = getFastLookup('EDGES_BY_SOURCE_ID');
        matchingEdges = sourceLookup[ id ];
        if (matchingEdges) {
            foundEdges = foundEdges.concat( matchingEdges );
        }
    }

    if ((sourceOrTarget === 'TARGET') || (sourceOrTarget === 'ANY')) {
        // fetch and add edges with this target node
        var targetLookup = getFastLookup('EDGES_BY_TARGET_ID');
        matchingEdges = targetLookup[ id ];
        if (matchingEdges) {
            foundEdges = foundEdges.concat( matchingEdges );
        }
    }

    return foundEdges;
}
function reverseEdgeDirection( edge ) {
    var oldSource = edge['@source'];
    edge['@source'] = edge['@target'];
    edge['@target'] = oldSource;
}
function getTreeNodeLabel(tree, node, importantNodeIDs) {
    var nodeID = node['@id'];

    if (nodeID === importantNodeIDs.inGroupClade) {
        ///return "ingroup clade";
    }

    if (nodeID === importantNodeIDs.treeRoot) {
        ///return "tree root";
    }

    var itsOTU = node['@otu'];
    if (!itsOTU) {
        return node['@id'];
    }

    var otu = getOTUByID( itsOTU );
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
function updateNewTreeUploadForm() {
    // check all fields, enable/disable button
    var readyToSubmit = true;

    var chosenFormat = $.trim( $('#tree-import-format').val() );
    if (chosenFormat === '') { 
        readyToSubmit = false;
    }

    var chosenFile = $.trim( $('#treeupload').val() );
    var pastedText = $.trim( $('#new-tree-text').val() );
    // either of these is acceptable
    if (pastedText === '' && chosenFile === '') { 
        readyToSubmit = false;
    }

    var $submitBtn = $('[name=new-tree-submit]');
    if (readyToSubmit) {
        $submitBtn.removeAttr('disabled');
    } else {
        $submitBtn.attr('disabled', 'disabled');
    }
    return true;
}
function clearNewTreeUploadWidget() {
    // un-bind fileupload submission
    $('[name=new-tree-submit]').off('click');

    var $widget = $('#treeupload');
    $widget.val(''); 
    $widget.trigger('change'); 

    // reset the progress bar
    setTimeout( function() {
        $('#tree-upload-progress .bar').css( 'width', '0%' );
        $('#tree-upload-progress .bar span').text( '' );
    }, 500);
}
function generateTreeUploadID() {
    // generate a new/unique upload ID for this attempt
    var personalTimestamp = authorSafeID + '.'+ new Date().getTime();
    return personalTimestamp;
}
function submitNewTree( form ) {
    // NOTE that this should submit the same arguments (except for file
    // data) as the fileupload behavior for #treeupload
    ///console.log("submitting tree...");
    var submitURL = $(form).attr('action');
    ///console.log(submitURL);
    
    $('#ajax-busy-bar').show();

    // @MTH:"no longer needed on upload"  $('[name=uploadid]').val( generateTreeUploadID() );
    
    $.ajax({
        type: 'POST',
        dataType: 'json',
        // crossdomain: true,
        // contentType: "application/json; charset=utf-8",
        url: $('#tree-import-form').attr('action'),
        data: $('#tree-import-form').serialize(),
        complete: returnFromNewTreeSubmission
    });
}
function returnFromNewTreeSubmission( jqXHR, textStatus ) {
    // show results of tree submission, whether from submitNewTree() 
    // or special (fileupload) behavior
    
    $('#ajax-busy-bar').hide();

    ///console.log('submitNewTree(): done! textStatus = '+ textStatus);
    // report errors or malformed data, if any
    if (textStatus !== 'success') {
        var errMsg; 
        if ((jqXHR.status === 501) && (jqXHR.responseText.indexOf("Conversion") === 0)) {
            errMsg = 'Sorry, there was an error importing this tree. Please double-check its format and data. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">Show details</a><pre class="error-details" style="display: none;">'+ jqXHR.responseText +'</pre>';
        } else {
            errMsg = 'Sorry, there was an error adding this tree. <a href="#" onclick="toggleFlashErrorDetails(this); return false;">Show details</a><pre class="error-details" style="display: none;">'+ jqXHR.responseText +'</pre>';
            console.warn("jqXHR.status: "+ jqXHR.status);
            console.warn("jqXHR.responseText: "+ jqXHR.responseText);
        }
        showErrorMessage(errMsg);
        return;
    }

    showSuccessMessage('Tree added.');
    
    // TODO: Add trees, nodes, otus and update UI

    // Add supporting-file info for this tree's source file
    //console.log("status: "+ jqXHR.status);
    //console.log("statusText: "+ jqXHR.statusText);
    // convert raw response to JSON
    var data = $.parseJSON(jqXHR.responseText)['data']; //@MTH:"returned nexson now inside a 'data' property" 
    //console.log("data: "+ data);

    // move its collections into the view model Nexson
    var itsOTUsCollection = data['nex:nexml']['otus'];
    var itsTreesCollection = data['nex:nexml']['trees'];
    // coerce the inner array of each collection into an array
    // (override Badgerfish singletons)
    itsOTUsCollection['otu'] = makeArray( itsOTUsCollection['otu'] );
    itsTreesCollection['tree'] = makeArray( itsTreesCollection['tree'] );

    $.each( itsTreesCollection.tree, function(i, tree) {
        normalizeTree( tree );
    });

    try {
        viewModel.nexml.otus.push( itsOTUsCollection );
        viewModel.nexml.trees.push( itsTreesCollection );
    } catch(e) {
        console.error('Unable to push collections (needs Nexson upgrade)');
    }

    /*
    // update the files list (and auto-save?)
    var file = cloneFromNexsonTemplate('single supporting file');
    file['@filename'] = data.filename || "";
    file['@url'] = data.url || "";
    file['@type'] = data.type || "";
    file.description.$ = data.description || "";
    file['@sourceForTree'] = data.sourceForTree || "";
    file['@size'] = data.size || "";
    getSupportingFiles().data.files.file.push(file);
    */

    if ($('[name=new-tree-preferred]').is(':checked')) {
        // mark the new tree as preferred, eg, a candidate for synthesis
        $.each( itsTreesCollection.tree, function(i, tree) {
            viewModel.nexml['^ot:candidateTreeForSynthesis'].candidate.push( tree['@id'] );
        });
    }

    // clear the import form (using Clear button to capture all behavior)
    $('#tree-import-form :reset').click();

    // force rebuild of all tree-related lookups
    buildFastLookup('NODES_BY_ID');
    buildFastLookup('OTUS_BY_ID');
    buildFastLookup('EDGES_BY_SOURCE_ID');
    buildFastLookup('EDGES_BY_TARGET_ID');

    // Now that we can lookup quickly, make sure OTUs are ready for easy
    // mapping to OTT taxa.
    $.each( itsTreesCollection.tree, function(i, tree) {
        normalizeOTUs( tree );
    });

    // force update of curation UI in all relevant areas
    nudgeTickler('TREES');
    nudgeTickler('SUPPORTING_FILES');
    nudgeTickler('GENERAL_METADATA');
    nudgeTickler('VISIBLE_OTU_MAPPINGS');
    nudgeTickler('STUDY_HAS_CHANGED');
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
        var oldText = subst.old.$;
        var newText = subst.new.$;
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
                subst['@valid'] = true;
            }
            subst['@valid'] = true;
        } catch(e) {
            // there's probably invalid regex in the field... mark it and skip
            if (!subst['@valid']) {
                subst['@valid'] = false;
            }
            subst['@valid'] = false;
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
         * Once the data has been safely migrated from the Open Tree Nexson store,
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
            "@code": "OTU_MAPPING_HINTS",  // N.B. independent of the OTU_MAPPING_HINTS tickler
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
    } // END of 'OTU entry' template

} // END of nexsonTemplates

function cloneFromNexsonTemplate( templateName ) {
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

    var filesMessages = getMessagesForAnnotationEvent( filesAnnotation, nexml );
    if (filesMessages.length > 0) {
        // return its message with the interesting parts
        return filesMessages[0];
    }
    return null;
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

            ///console.log('addSupportingFileFromURL(): done! textStatus = '+ textStatus);
            // report errors or malformed data, if any
            if (textStatus !== 'success') {
                showErrorMessage('Sorry, there was an error adding this file.');
                return;
            }

            showSuccessMessage('File added.');
            // update the files list (and auto-save?)
            var file = cloneFromNexsonTemplate('single supporting file');
            file['@filename'] = data.filename || "";
            file['@url'] = data.url || "";
            file['@type'] = data.type || "";
            file.description.$ = data.description || "";
            file['@sourceForTree'] = data.sourceForTree || "";
            file['@size'] = data.size || "";

            getSupportingFiles().data.files.file.push(file);
            nudgeTickler('SUPPORTING_FILES');
        },
        error: function( data, textStatus, jqXHR ) {
            showErrorMessage('Sorry, there was an error adding this file.');
        }
    });

}

function removeTree( tree ) {
    // let's be sure, since adding may be slow...
    if (!confirm("Are you sure you want to delete this tree?")) {
        return;
    }

    // remove this tree
    $.each(viewModel.nexml.trees, function(i, treesCollection) {
        if ($.inArray(tree, treesCollection.tree) !== -1) {
            removeFromArray( tree, treesCollection.tree );
        }
    });

    // TODO: remove any captive trees- and OTUs-collections
    // TODO: remove any otus not used elsewhere?
    // TODO: remove related annotation events and agents?
    
    if ($.inArray(tree['@id'], getPreferredTreeIDs()) !== -1) {
        // remove its ID from list of preferred (candidate) trees
        togglePreferredTree( tree );
    }

    // force rebuild of all tree-related lookups
    buildFastLookup('NODES_BY_ID');
    buildFastLookup('OTUS_BY_ID');
    buildFastLookup('EDGES_BY_SOURCE_ID');
    buildFastLookup('EDGES_BY_TARGET_ID');

    // force update of curation UI in all relevant areas
    nudgeTickler('TREES');
    nudgeTickler('SUPPORTING_FILES');
    nudgeTickler('GENERAL_METADATA');
    nudgeTickler('VISIBLE_OTU_MAPPINGS');
    nudgeTickler('STUDY_HAS_CHANGED');
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
            removeFromArray( fileInfo, fileList );
            nudgeTickler('SUPPORTING_FILES');
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
    
    var hintsMessages = getMessagesForAnnotationEvent( hintsAnnotation, nexml );
    if (hintsMessages.length > 0) {
        // return its message with the interesting parts
        return hintsMessages[0];
    }
    return null;
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
        subst.old.$ = parts[0] || '';
        subst.new.$ = parts[1] || '';
        subst['@valid'] = true;
        subst['@active'] = true;
        // reset the SELECT widget to its prompt
        $(clicked).val('');
    }
    getOTUMappingHints().data.substitutions.substitution.push(subst);
    nudgeTickler('OTU_MAPPING_HINTS');
}
function removeSubstitution( data ) {
    var subList = getOTUMappingHints().data.substitutions.substitution;
    removeFromArray( data, subList );
    if (subList.length === 0) {
        // add an inactive substitution with prompts
        addSubstitution();
    } else {
        nudgeTickler('OTU_MAPPING_HINTS');
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
    var originalLabel = otu['^ot:originalLabel'];
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
    mapOTUToTaxon( OTUid, approvedMapping() );
    delete proposedOTUMappings()[ OTUid ];
    proposedOTUMappings.valueHasMutated();
    nudgeTickler('OTU_MAPPING_HINTS');
}
function rejectProposedOTULabel(otu) {
    // undoes 'proposeOTULabel', clearing its value
    var OTUid = otu['@id'];
    delete proposedOTUMappings()[ OTUid ];
    proposedOTUMappings.valueHasMutated();
    nudgeTickler('OTU_MAPPING_HINTS');
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
        mapOTUToTaxon( OTUid, approvedMapping() );
    });
    proposedOTUMappings.valueHasMutated();
    nudgeTickler('OTU_MAPPING_HINTS');
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
        var ottMappingTag = otu['^ot:ottId'] || null;
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
    var originalLabel = otuToMap['^ot:originalLabel'] || null;
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
    var searchContextName = getOTUMappingHints().data.searchContext.$;

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
    // apply this mapping, creating Nexson elements as needed

    /* mappingInfo should be an object with these properties:
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
    var originalLabel = otu['^ot:originalLabel'] || null;
    otu['@label'] = mappingInfo.name || 'NAME MISSING!';

    // add (or update) a metatag mapping this to an OTT id
    var ottId = Number(mappingInfo.ottId);
    otu['^ot:ottId'] = ottId;
}

function unmapOTUFromTaxon( otuOrID ) {
    // remove this mapping, removing any unneeded Nexson elements
    var otu = (typeof otuOrID === 'object') ? otuOrID : getOTUByID( otuOrID );
    // restore its original label (versus mapped label)
    var originalLabel = otu['^ot:originalLabel'];
    otu['@label'] = '';
    // strip any metatag mapping this to an OTT id
    if ('^ot:ottId' in otu) {
        delete otu['^ot:ottId'];
    }
    nudgeTickler('OTU_MAPPING_HINTS');
}

function addMetaTagToParent( parent, props ) {
    // wrap submitted properties to make an observable metatag
    var newTag = cloneFromSimpleObject( props );
    if (!parent.meta) {
        // add a meta collection here
        parent['meta'] = [ ];
    } else if (!$.isArray(parent.meta)) {
        // convert a Badgerfish "singleton" to a proper array
        parent['meta'] = [ parent.meta ]; 
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
    nudgeTickler('OTU_MAPPING_HINTS');
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
    var nodeID = node['@id'];

    // general node information first, then actions
    nodeMenu.append('<li class="node-information"></li>');
    var nodeInfoBox = nodeMenu.find('.node-information');
    nodeInfoBox.append('<span class="node-name">'+ getTreeNodeLabel(tree, node, importantNodeIDs) +'</span>');

    if (nodeID == importantNodeIDs.treeRoot) {

        nodeInfoBox.append('<span class="node-type specifiedRoot">tree root</span>');

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

function showEdgeOptionsMenu( tree, edge, nodePageOffset, importantNodeIDs ) {
    // This is a Bootstrap-style menu whose pointer is centered on the
    // target edge. It borrows most style and some behavior from the
    // node-options menu.
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
    var edgeID = edge['@id'];
    // edge.source;
    // edge.target;

    // general node information first, then actions
    nodeMenu.append('<li class="node-information"></li>');
    var nodeInfoBox = nodeMenu.find('.node-information');
    nodeInfoBox.append('<span class="node-name"><span style="font-weight: normal;">Source: </span>'+ getTreeNodeLabel(tree, edge.source, importantNodeIDs) +'</span>');
    nodeInfoBox.append('<br/><span class="node-name"><span style="font-weight: normal;">Target: </span>'+ getTreeNodeLabel(tree, edge.target, importantNodeIDs) +'</span>');
    if ('length' in edge.target) {
        nodeInfoBox.append('<div>Edge length: '+ edge.target.length +'</div>');
    }

    var availableForRooting = (edge.source['@id'] !== importantNodeIDs.treeRoot) && (edge.target['@id'] !== importantNodeIDs.treeRoot);
    if (availableForRooting && (viewOrEdit === 'EDIT')) {
        nodeMenu.append('<li><a href="#" onclick="hideNodeOptionsMenu(); setTreeRoot( \''+ tree['@id'] +'\', [\''+ edge.source['@id'] +'\', \''+ edge.target['@id'] +'\'] ); return false;">Re-root from this edge</a></li>');
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
    return nexml['^ot:annotationEvents'] || null;
}
function getStudyAnnotationAgents( nexml ) {
    // returns an array (OR observableArray?), possibly empty
    if (!nexml) {
        nexml = viewModel.nexml;
    }
    return nexml['^ot:agents'] || null;
}
function getStudyAnnotationMessages( nexml ) {
    // returns an array (OR observableArray?), possibly empty
    if (!nexml) {
        nexml = viewModel.nexml;
    }
    return nexml['^ot:messages'] || null;
}

// manage "local" messages collection for any element
function getLocalMessages( element ) {
    // returns an array (OR observableArray?), possibly empty
    var messages = [];
    if (localMessagesCollectionExists( element )) {
        var collection = getLocalMessagesCollection( element );
        var msgList = makeArray(collection.message);
        $.each(msgList, function(i, msg) {
            // TODO: iterate properly (child elements)?
            messages.push(msg);
        });
    }
    return messages;
}
function getLocalMessagesCollection( element ) {
    // returns the actual collection accessor, or null
    return element['^ot:messages'] || null;
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
    element['^ot:messages'] ={
        'message': []
    };
    return element['^ot:messages'];
}
function removeLocalMessagesCollection( element ) {
    var testCollection = getLocalMessagesCollection( element );
    if (testCollection) {
        delete element['^ot:messages'];
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
    if (!nexml) {
        nexml = viewModel.nexml;
    }

    // is the specified nexson already mapped to Knockout observables?
    var nexmlIsMapped = ko.isObservable( nexml ); // TODO? WAS nexml.meta
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
        var testID = ko.unwrap( agent['@id'] );
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
    var agentsCollection = getStudyAnnotationAgents( nexml );
    var agentList = agentsCollection ? makeArray(agentsCollection.agent) : [];
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
    var nexmlIsMapped = ko.isObservable( nexml ); // TODO? WAS nexml.meta
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
        var allEvents = makeArray(nexml['^ot:annotationEvents']);
        var allEvents = ('^ot:annotationEvents' in nexml) ? makeArray(nexml['^ot:annotationEvents'].annotation) : [];
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
        var allAgents = ('^ot:agents' in nexml) ? makeArray(nexml['^ot:agents'].agent) : [];
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
    var allMessages = makeArray(getStudyAnnotationMessages(nexml).message);
    // gather "local" messages from all other elements!
    // NOTE: Add any new target elements here to avoid duplication!
    $.each(nexml.otus, function( i, otusCollection ) {
        $.each(otusCollection.otu, function( i, otu ) {
            var localMessages = getLocalMessages(otu);
            if (localMessages.length > 0) {
                $.merge(allMessages, makeArray(localMessages.message));
            }
        });
    });
    var allTrees = [];
    $.each(nexml.trees, function(i, treesCollection) {
        $.each(treesCollection.tree, function(i, tree) {
            allTrees.push( tree );
        });
    });
    $.each(allTrees, function(i, tree) {
        var localMessages = getLocalMessages(tree);
        if (localMessages.length > 0) {
            $.merge(allMessages, makeArray(localMessages.message));
        }
        // look again at all nodes in the tree
        $.each(makeArray(tree.node), function(i, node) {
            var localMessages = getLocalMessages(node);
            if (localMessages.length > 0) {
                $.merge(allMessages, makeArray(localMessages.message));
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
    var rawTagValues = parentElement['^ot:tag'] || [];
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
    if (!('^ot:tag' in parentElement)) {
        parentElement['^ot:tag'] = [];
    }
    parentElement['^ot:tag'].push( newTagText );
}
function removeAllTags( parentElement ) {
    parentElement['^ot:tag'] = [];
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

function updateInferenceMethodWidgets( tree, event ) {
    // This is a sort of indirect binding, since we want to offer both
    // preset options and free-form text for inference methods.
    var $selectWidget = $('#inference-method-select');
    var $freeTextWidget = $('#inference-method-other');
    if (event) {
        // read from widgets and apply value
        var selectValue = $selectWidget.val();
        if (selectValue === 'Other (specify)') {
            $freeTextWidget.show();
            tree['^ot:curatedType'] = $freeTextWidget.val();
        } else {
            $('#inference-method-other').hide();
            tree['^ot:curatedType'] = selectValue;
        }
    } else {
        // read from model and update widget display
        var modelValue = tree['^ot:curatedType'];
        // check this value against SELECT options
        if ($selectWidget.find("option[value='"+ modelValue +"']").length === 0) {
            // not a preset option, use free-form text
            $selectWidget.val('Other (specify)');
            $freeTextWidget.val(modelValue);
            $freeTextWidget.show();
        } else {
            // select the matching option, hide the field
            $selectWidget.val(modelValue);
            $freeTextWidget.hide();
        }
    }
    nudgeTickler('TREES');
}

/* Define a registry of nudge methods, for use in KO data bindings. Calling
 * a nudge function will update one or more observables to trigger updates
 * in the curation UI. This approach allows us to work without observables,
 * which in turn means we can edit enormous viewmodels.
 */
var nudge = {
    'GENERAL_METADATA': function( data, event ) {
        nudgeTickler( 'GENERAL_METADATA');
        return true;
    },
    'TREES': function( data, event ) {
        nudgeTickler( 'TREES');
        return true;
    },
    'OTU_MAPPING_HINTS': function( data, event ) {
        nudgeTickler( 'OTU_MAPPING_HINTS');
        return true;
    },
    'EDGE_DIRECTIONS': function( data, event ) {
        nudgeTickler( 'EDGE_DIRECTIONS');
        return true;
    }
}
function nudgeTickler( name ) {
    var tickler = viewModel.ticklers[ name ];
    if (!tickler) {
        console.error("No such tickler: '"+ name +"'!");
    }
    var oldValue = tickler.peek();
    tickler( oldValue + 1 );
    
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

function getFastLookup( lookupName ) {
    // return (or build) a flat list of Nexson elements by ID
    if (lookupName in viewModel.fastLookups) {
        if (viewModel.fastLookups[ lookupName ] === null) {
            buildFastLookup( lookupName );
        }
        return viewModel.fastLookups[ lookupName ];
    }
    console.error("No such lookup as '"+ lookupName +"'!");
    return null;
}
function buildFastLookup( lookupName ) {
    // (re)build and store a flat list of Nexson elements by ID
    if (lookupName in viewModel.fastLookups) {
        clearFastLookup( lookupName );
        var newLookup = {};
        switch( lookupName ) {

            case 'NODES_BY_ID':
                // assumes that all node ids are unique, across all trees
                var allTrees = [];
                $.each(viewModel.nexml.trees, function(i, treesCollection) {
                    $.each(treesCollection.tree, function(i, tree) {
                        allTrees.push( tree );
                    });
                });
                $.each(allTrees, function( i, tree ) {
                    $.each(tree.node, function( i, node ) {
                        var itsID = node['@id'];
                        if (itsID in newLookup) {
                            console.warn("Duplicate node ID '"+ itsID +"' found!");
                        }
                        newLookup[ itsID ] = node;
                    });
                });
                break;

            case 'OTUS_BY_ID':
                // assumes that all node ids are unique, across all trees
                // AND 'otus' collections!
                $.each(viewModel.nexml.otus, function( i, otusCollection ) {
                    $.each(otusCollection.otu, function( i, otu ) {
                        var itsID = otu['@id'];
                        if (itsID in newLookup) {
                            console.warn("Duplicate otu ID '"+ itsID +"' found!");
                        }
                        newLookup[ itsID ] = otu;
                    });
                });
                break;

            case 'EDGES_BY_SOURCE_ID':
                // allow multiple values for each source (ie, multiple children)
                var allTrees = [];
                $.each(viewModel.nexml.trees, function(i, treesCollection) {
                    $.each(treesCollection.tree, function(i, tree) {
                        allTrees.push( tree );
                    });
                });
                $.each(allTrees, function( i, tree ) {
                    $.each(tree.edge, function( i, edge ) {
                        var sourceID = edge['@source'];
                        if (sourceID in newLookup) {
                            newLookup[ sourceID ].push( edge );
                        } else {
                            // create the array, if not found
                            newLookup[ sourceID ] = [ edge ];
                        }
                    });
                });
                break;

            case 'EDGES_BY_TARGET_ID':
                // allow multiple values for each target (for conflicted trees)
                var allTrees = [];
                $.each(viewModel.nexml.trees, function(i, treesCollection) {
                    $.each(treesCollection.tree, function(i, tree) {
                        allTrees.push( tree );
                    });
                });
                $.each(allTrees, function( i, tree ) {
                    $.each(tree.edge, function( i, edge ) {
                        var targetID = edge['@target'];
                        if (targetID in newLookup) {
                            newLookup[ targetID ].push( edge );
                        } else {
                            // create the array, if not found
                            newLookup[ targetID ] = [ edge ];
                        }
                    });
                });
                break;

        }
        viewModel.fastLookups[ lookupName ] = newLookup;
    } else {
        console.error("No such lookup as '"+ lookupName +"'!");
    }
}
function clearFastLookup( lookupName ) {
    // clear chosen lookup, on demand (eg, after merging in new OTUs)
    if (lookupName in viewModel.fastLookups) {
        viewModel.fastLookups[ lookupName ] = null;
        return;
    }
    console.error("No such lookup as '"+ lookupName +"'!");
}
