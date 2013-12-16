/*
 * Client-side behavior for the Open Tree curation home page and personalized dashboard
 *
 * This uses the OTOL API to fetch and store studies and trees remotely.
 */

// these variables should already be defined in the main HTML page
var API_load_study_list_GET_url;
var viewOrEdit;

// working space for parsed JSON objects (incl. sub-objects)
var viewModel;

$(document).ready(function() {
    loadStudyList();
});

function loadStudyList() {
    // TODO: show/hide spinner during all AJAX requests?
    $('#ajax-busy-bar').hide();

    // TODO: use OTOL API to get the real thing
    var fakeStudyList = { 
      'studies': [
        {
            'id': 10,
            'firstAuthorName': "Jansen, Robert K.",
            'firstAuthorLink': "#",
            'title': "Analysis of 81 genes from 64 plastid genomes resolves relationships in angiosperms and identifies genome-scale evolutionary patterns",
            'pubYear': "2007",
            'pubJournalName': "Proceedings of the National Academy of Sciences",
            'pubJournalLink': "#",
            'completeness': "12%",
            'workflowState': "Draft study",
            'nextActions': ["upload data"]
        },
        {
            'id': 9,
            'firstAuthorName': "Tank, David C.",
            'firstAuthorLink': "#",
            'title': "Phylogeny and Phylogenetic Nomenclature of the Campanulidae based on an Expanded Sample of Genes and Taxa",
            'pubYear': "2010",
            'pubJournalName': "Systematic Botany",
            'pubJournalLink': "#",
            'completeness': "85%",
            'workflowState': "Draft study",
            'nextActions': ["upload data"]
        },
        {
            'id': 1001,
            'firstAuthorName': "KHAN, S. A.",
            'firstAuthorLink': "#",
            'title': "Phylogeny and biogeography of the African genus Virectaria Bremek",
            'pubYear': "2008",
            'pubJournalName': "Plant Systematics and Evolution",
            'pubJournalLink': "#",
            'completeness': "55%",
            'workflowState': "Included in synthetic tree",
            'nextActions': ["upload data"]
        }
      ]
    };
    
    viewModel = ko.mapping.fromJS( fakeStudyList );  // ..., mappingOptions);

    // enable sorting and filtering for lists in the editor
    viewModel.listFilters = {
        // UI widgets bound to these variables will trigger the
        // computed display lists below..
        'STUDIES': {
            // TODO: add 'pagesize'?
            'match': ko.observable(""),
            'workflow': ko.observable("Any workflow state"),
            'order': ko.observable("Newest first")
        }
    };
    
    // maintain a persistent array to preserve pagination (reset when computed)
    viewModel._filteredStudies = ko.observableArray( ).asPaged(20);
    viewModel.filteredStudies = ko.computed(function() {
        // filter raw tree list, returning a
        // new paged observableArray
        console.log(">>> computing filteredStudies");
        var match = viewModel.listFilters.STUDIES.match(),
            matchPattern = new RegExp( $.trim(match), 'i' );
        var workflow = viewModel.listFilters.STUDIES.workflow();
        var order = viewModel.listFilters.STUDIES.order();

        // map old array to new and return it
        var filteredList = ko.utils.arrayFilter( 
            viewModel.studies(), 
            function(study) {
                // match entered text against author, title, journal name
                var authorName = study.firstAuthorName();
                var studyTitle = study.title();
                var journalName = study.pubJournalName();
                if (!matchPattern.test(authorName) && !matchPattern.test(studyTitle) && !matchPattern.test(journalName)) {
                    return false;
                }

                // check for filtered workflow state
                switch (workflow) {
                    case 'Any workflow state':
                        // nothing to do here, all studies pass
                        break;

                    case 'Draft study':
                    case 'Submitted for synthesis':
                    case 'Under revision':
                    case 'Included in synthetic tree':
                        // show only matching studies
                        if (study.workflowState() !== workflow) { 
                            return false; // stop looping on trees
                        }
                        break;

                    default:
                        console.log("Unexpected workflow for study list: ["+ workflow +"]");
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
            case 'Newest first':
                filteredList.sort(function(a,b) { 
                    if (a.pubYear() === b.pubYear()) return 0;
                    return (a.pubYear() > b.pubYear())? -1 : 1;
                });
                break;

            case 'Oldest first':
                filteredList.sort(function(a,b) { 
                    if (a.pubYear() === b.pubYear()) return 0;
                    return (a.pubYear() > b.pubYear())? 1 : -1;
                });
                break;

            case 'Workflow state':
                var displayOrder = {
                    'Draft study': 1,
                    'Submitted for synthesis': 2,
                    'Under revision': 3,
                    'Included in synthetic tree': 4
                };
                filteredList.sort(function(a,b) { 
                    var aDisplayOrder = displayOrder[ a.workflowState() ];
                    var bDisplayOrder = displayOrder[ b.workflowState() ];
                    if (aDisplayOrder === bDisplayOrder) return 0;
                    return (aDisplayOrder < bDisplayOrder) ? -1 : 1;
                });
                break;

            case 'Completeness':
                filteredList.sort(function(a,b) { 
                    if (a.completeness() === b.completeness()) return 0;
                    return (a.completeness() < b.completeness()) ? -1 : 1;
                });
                break;

            default:
                console.log("Unexpected order for OTU list: ["+ order +"]");
                return false;

        }
        viewModel._filteredStudies( filteredList );
        viewModel._filteredStudies.goToPage(1);
        return viewModel._filteredStudies;
    }); // END of filteredStudies
            
    ko.applyBindings(viewModel);
}

function getFirstAuthorLink(study) {
    return '<a href="'+ study.firstAuthorLink() +'"'+'>'+ study.firstAuthorName() +'</a'+'>';
}
function getViewOrEditLink(study) {
    if (viewOrEdit === 'EDIT') {
        return '<a href="/curator/study/edit/'+ study.id() +'">'+ (study.title() || 'Untitled') +'</a>';
    } else {
        return '<a href="/curator/study/view/'+ study.id() +'">'+ (study.title() || 'Untitled') +'</a>';
    }
}
function getJournalLink(study) {
    return '<a href="'+ study.pubJournalLink() +'"'+'>'+ study.pubJournalName() +'</a'+'>';
}
function getSuggestedActions(study) {
    return '<a href="#"'+'>'+ study.nextActions()[0] +'</a'+'>';
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
