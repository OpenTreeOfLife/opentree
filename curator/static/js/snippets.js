
    /* walking study OTUs (pointless unless we need to compare IDs somehow) */
    var studyOTUs = viewModel.nexml.otus.otu();
    $.each(studyOTUs, function(i, node) {
        console.log("...testing node "+ i +"...");
        var ottIDAccessor = getMetaTagAccessorByAtProperty(node.meta(), 'ot:ottolid');
        if (typeof(ottIDAccessor) !== 'function') {
            // no metatag for this.. assume it's not mapped
            console.log("UN-MAPPED OTU? no accessor found");
            return;  // skip to next node
        }

        var ottID = ottIDAccessor();
        switch (ottID) {
            case 0:
            case null:
            case '':
                console.log("UN-MAPPED OTU? "+ ottID +" <"+ typeof(ottID) +">");
            default:
                console.log("MAPPED OTU, id = "+ ottID +" <"+ typeof(ottID) +">");
                mappedNodes++;
        }
    });


function getMappedTallyForTree(tree)
    /* TODO: make this safer by checking for false or empty OTU values? */
        if (typeof(nodeOTUAccessor) === 'function') {
            var itsOTU = nodeOTUAccessor();
            switch (itsOTU) {
                case 0:
                case null:
                case '':
                    console.log("MIS-MAPPED node? "+ itsOTU +" <"+ typeof(itsOTU) +">");
                    break;
                default:
                    //console.log("mapped node, otu = "+ itsOTU +" <"+ typeof(itsOTU) +">");
                    mappedNodes++;
            }
        }
        return true;

