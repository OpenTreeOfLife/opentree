/*
@licstart  The following is the entire license notice for the JavaScript code in this page.

    Copyright (c) 2013, Cody Hinchliff
    Copyright (c) 2013, Joseph W. Brown
    Copyright (c) 2013, Jim Allman
    Copyright (c) 2013, Mark Holder

    All rights reserved.

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are met:

    Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.

    Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation
    and/or other materials provided with the distribution.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
    AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
    FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
    DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
    SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
    CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
    OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
    OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

@licend  The above is the entire license notice for the JavaScript code in this page.
*/

/*jslint indent: 4 */
/*globals XMLHttpRequest, Raphael, $, window, location, History, pageUsesHistory, nodeDataLoaded, historyStateToURL, historyStateToWindowTitle*/

// factor function -- gradually going to encapsulate argus functions here for better
//  information hiding and avoiding putting a lot of things into the global namespace
// Attributes of spec:
//      domSource = "ottol"  The name of the source of trees. Currently only "ottol" and the latest synthetic tree 
//          (e.g. "opentree1.2") are supported.
//      nodeID = the ID for the node (according to the system of the service indicated by domSource)
//          if nodeID or domSource are lacking, they will *both* be parsed out of the URL query string (location.search)
//              from node_id and domsource url-encoded GET parameters. If they are not found there, the defaults are
//              domSource="ottol" and nodeID = "805080"
//      container - DOM element that will contain the argus object
function createArgus(spec) {
    "use strict";
    var o;
    var argusObj;
    var paper;
    // use a series of "empty" elements to organize others by depth
    var dividerBeforeEdges, dividerBeforeLabels, dividerBeforeHighlights, dividerBeforeNodes, dividerBeforeAnchoredUI;
    var getHoverHandlerNodeAndEdge;
    var getHoverHandlerCluster;
    var getClickHandlerNode;
    var getClickHandlerCluster;
    var makeRoomForOpeningCluster;
    var getBackClickHandler;
    var getForwardClickHandler;
    var argusZoomLevel;
    var argusScrollTop;
    var argusScrollLeft;
    var zoomStep;
    var setZoomAndReframeView;
    var getClickHandlerAltRelLine;
    var getHoverHandlerProvenanceHighlight;
    var getClickHandlerProvenanceHighlight;

    var isNumeric = function (n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    };


    // get defaults for the root nodeID and domSource
    if (spec.nodeID === undefined || spec.domSource === undefined) {
        o = (function (q) {
            // simple function to get nodeID and domSource the assuming ignored?key1=val1&key2=val2 structure to q
            var toks, i, arg;
            var ret = {};
            var firstSubstr, qListStr;
            if (q) {
                firstSubstr = q.substr(1);
                if (firstSubstr) {
                    qListStr = String(firstSubstr.split("?"));
                    if (qListStr) {
                        toks = qListStr.split("&");
                        for (i = 0; i < toks.length; i++) {
                            arg = toks[i].split("=");
                            if (arg[0] === "node_id") {
                                ret.nodeID = arg[1];
                            } else if (arg[0] === "domsource") {
                                ret.domSource = arg[1];
                            }
                        }
                    }
                }
            }
            return ret;
        }(location.search));
        spec.nodeID = o.nodeID === undefined ? "805080" : o.nodeID;
        spec.domSource = o.domSource === undefined ? "ottol" : o.nodeID;
    }
    if (spec.container === undefined) {
        spec.container = $("body")[0];
    }
    if (spec.treemachineDomain === undefined) {
        spec.treemachineDomain = "http://opentree-dev.bio.ku.edu:7474";
    }
    if (spec.taxomachineDomain === undefined) {
        spec.taxomachineDomain = "http://opentree-dev.bio.ku.edu:7476";
    }
    if (spec.useTreemachine === undefined) {
        spec.useTreemachine = true; // for now, this is always true
    }
    if (spec.useSyntheticTree === undefined) {
        spec.useSyntheticTree = true;
    }
    if (spec.maxDepth === undefined) {
        spec.maxDepth = 4;
    }
    argusObj = {
        "nodeID": spec.nodeID,
        "domSource": spec.domSource,
        "container": spec.container,
        "treemachineDomain": spec.treemachineDomain,
        "taxomachineDomain": spec.taxomachineDomain,
        "useTreemachine": spec.useTreemachine,
        "useSyntheticTree": spec.useSyntheticTree,
        /* parsed JSON for the current tree view */
        "treeData": null,
        "fontScalar": 2.6, // multiplied by radius to set font size
        "minTipRadius": 5, // the minimum radius of the node/tip circles. "r" in old argus
        "nodeDiamScalar": 1.0,  // how much internal nodes are scaled by logleafcount
        "nodesWidth": 100, // the distance between parent/child nodes
            // TODO: try a wider setting (180?), or adapt to screen-width
        "nubDistScalar": 4, // the x/y distance of the nub from its child
        "tipOffset": 300,  // distance from right margin at which leaf nodes are drawn
        "xLabelMargin": 10, // the distance of the labels from the nodes
        "xOffset": 0, // rightmost edge of view-tree; this is set in loadData call before drawing nodes
        "yNodeMargin": 4, // whitespace above/below nodes
        "yOffset": 10, // distance from top margin at which topmost nodes are drawn; also set in loadData
        "yOffsetDefault": 10, // distance from top margin at which topmost nodes are drawn; also set in loadData
        /* colors for the tree view */
        "bgColor": "#fff",
        "altPColor": "#c69",
        "altPLinkColor": "#900",
        "altRelColor": "#f00",
        "nodeColor": "#999",
        "actualLeafColor": "#333",
        "visibleLeafColor": "#fff",  // ie, click to see more descendants
        "nodeHoverColor": "#ff3333",
        "pathColor": "#999",
        "strongPathColor": "#000",
        "labelColor": "#000",
        "provenanceHighlightColor": "#3333ff",
        "provenanceHighlightLabelColor": "#3333ff",
        "provenanceHighlightLabelBackgroundColor": "#ffffff",
        "tipColor": "#999",
        "tipHoverColor": "#ff3333",
        "currMaxDepth": spec.maxDepth,
        "backStack": [], // args to previous displayNode calls
        "forwardStack": [], // args to displayNode calls after the back button has been clicked
        "currDisplayContext": undefined, //arg to most recent displayNode call

        clusters: {},      // a registry of clustered child-nodes, keyed to the parent-node's ID
        maxClusterSize: 100,   // try to bundle sets of n children
        minClusterSize: 10, // add fewer to the previous cluster (or unclustered children) instead
        maxUnclusteredNodes: 30,  // show the most interesting n nodes outside of clusters

        toggleAltBoxX: 55,
        toggleAltBoxY: 6,
        sourceTextBoxX: 10,
        sourceTextBoxY: 35,
        backArrowX: 10,
        backArrowY: 10,
        anchoredControls: null,
        provenanceHighlight: null,
        highlightedNodeInfo: null,
        targetNodeY: 0,  // used to center the view (vertically) on the target node

        supportingTaxonomyVersion: null,

        // use Javascript pseudo-classes (defined below) to make tree operations more sensible
        makeNodeTree: function(key, value) {
            // expects to get root JSON object? or each object (or key/val pair) as it's parsed?
            if (value.node_id) {
                // it's a tree node!

                // assign parent ID to children, for fast tree traversal
                if (value.children) {
                    for (var i = 0; i < value.children.length; i++) {
                        value.children[i].parentNodeID = value.node_id;
                    }
                }

                if (value.lineage) {
                    // assign parent IDs up the "root-ward" chain of nodes
                    var testChild = value;
                    $.each(value.lineage, function(i, testParent) {
                        testChild.parentNodeID = testParent.node_id;
                        testChild = testParent;  // and move to *its* parent
                    });
                }

                // convert to desired JS pseudo-class
                return $.extend( new ArgusNode(), value );
            }

            // more grooming (sorting, clustering, etc) happens later, in setupArgusNode()
            return value;
        },

        // utility methods for nodeTree above
        getArgusNodeByID: function ( nodeID ) {
            // NOTE depends on treeview.js methods
            return getTreeDataNode( function(node) {
                return (node.node_id === nodeID);
            });
        },
        // TODO: add a method to get node by OTT id?

        getZoomInHandler: function () {
            return function() {
                setZoomAndReframeView('+');
                return false;
            };
        },
        getZoomOutHandler: function () {
            return function() {
                setZoomAndReframeView('-');
                return false;
            };
        },
        getToggleConflictsHandler: function() {
            return null;
        }
    };


    argusObj.nodeHeight = (2 * argusObj.minTipRadius) + argusObj.yNodeMargin;
    // helper function to create the URL and arg to be passed to URL.
    //  Argument:
    //      o.nodeID
    //      o.domSource (default "ottol")  @TEMP will need to be modified for cases when ottol is not the value
    //      o.httpMethod (defaul "POST")
    //  Return an object with
    //      url -- URL for ajax call
    //      data -- object to be sent to the server
    //      httpMethod -- (currently "POST")
    argusObj.buildAjaxCallInfo = function (o) {
        var url;
        var ds;
        var ajaxData;

        if (this.useTreemachine) {
            if (this.useSyntheticTree) {
                url = getSyntheticTree_url;
            } else {
                console.error('buildAjaxCallInfo(): we need another URL!?');
                return;
            }
            // default is the classic "tree 4 in phylografter"
            ds = o.domSource === undefined ? "4" : o.domSource;
            ajaxData = {
                "synth_id": ds,   // TODO: Omit this paramter if it causes trouble!
                "format": "arguson",
                "height_limit": this.currMaxDepth
            };
            // send *either* OTT id or node id (but not both)
            if (o.nodeID !== undefined) {
                ajaxData.node_id = String(o.nodeID);     // for later analysis
            } else {
                if (o.ott_id !== undefined) {
                    ajaxData.ott_id = Number(o.ott_id);
                }
            }
        } else {
            /* TODO: Restore the ability to fetch conflict information from taxomachine?
            url = getConflictTaxJsonAltRel_url.replace('{nodeID}', o.nodeID);
            // @TEMP assuming ottol
            ds = o.domSource === undefined ? "ottol" : o.domSource;
            ajaxData = {"domsource": ds}; // phylotastic TNRS API wants domsource, MTH believes.
            */
            alert("AJAX calls via taxomachine are no longer supported.");
            return;
        }
        return {
            "url": url,
            "data": ajaxData,
            "httpMethod": "POST", //@TEMP assuming ottol
            "domSource": ds
        };
    };

    argusObj.revealAllVisibleTreeElements = function() {
        /* Update argus viewbox to show all visible items (via scrollbars).
         * For a seamless effect, we need to simultaneously change the size,
         * position(?), and viewbox of the RaphaelJS (SVG) canvas.
         *
         * This is because the SVG element (regardless of its 'overflow' style)
         * dictates the beahavior of scrollbars in the argus view. So for a
         * seamless transition, e.g. when expanding a cluster, we need
         * to preserve the current scale and *apparent* position of tree
         * elements, but (potentially) modify the size and position of the main
         * SVG element so that we can scroll to any visible part of the tree.
         * Tricky stuff!
         *
         * After some reflection, I think the key is that the SVG's internal
         * viewBox should always match its visible contents (plus a small
         * cosmetic margin), and that the SVG element should follow these changes
         * in both its size and relative position. Let's tweak all related
         * code to do this, instead of the old system, which was:
         *     Let's reckon the default width and height based on the "maximum
         *     reasonable extent" of all visible and collapsed nodes.
         * Instead, let the (visible) content drive the viewBox, and
         * that in turn sets the size and location of the SVG element, always.
         *
         * Is it possible that default viewBox will "follow" visible contents?
         * NO, we need to maintain viewBox manually as things change.
         *
         * Let's also set its preserveAspectRatio to "none", so that we can
         * clearly see stretched graphics due to errors on our updated view.
         */
        if (!paper.canvas) {
            console.warn('revealAllVisibleTreeElements - NO paper.canvas found, skipping update');
            return;
        }

        // allow distortion to reveal serious distortion ASAP
        paper.canvas.setAttribute('preserveAspectRatio','none');
        // capture old viewbox (if any) and SVG scrollbar position
        var svgContainer = $(paper.canvas)[0].parentElement,
            oldViewBox = paper.canvas.viewBox.baseVal || null;
        // measure the extent of the newly visible tree
        var newBBox = paper.canvas.getBBox();
        // add a little padding, so we can see that labels are complete
        var margin = 6,
            newLeft = newBBox.x - margin,
            newTop = newBBox.y - margin,
            newWidth = newBBox.width + (margin*2),
            newHeight = newBBox.height + (margin*2);
        paper.setViewBox(newLeft, newTop, newWidth, newHeight);
        // set the SVG element's size to show this fully
        paper.setSize(newWidth * argusZoomLevel, newHeight * argusZoomLevel);
        // update scrollbars to match old position as best we can
        svgContainer.scrollLeft = argusScrollLeft;
        svgContainer.scrollTop = argusScrollTop;
    };

    argusObj.loadData = function (o) {
        // accepts three named arguments:
         //    o.url               the address to which the HTTP request is sent
         //    o.data              arguement (object of str) to be sent to the URL as an argument
         //    o.httpMethod        e.g. "GET" or "POST"; "POST" is the default
         //    o.domSource
         //
        var dataStr = JSON.stringify(o.data);
        var domSource = o.domSource === undefined ? "ottol" : o.domSource;
        var ottID;
        if ('ott_id' in o.data) {
            ottID = Number(o.data.ott_id);
        } else if (o.data.node_id.indexOf('ott') === 0) {
            // strip leading 'ott' from node_id to recover numeric OTT id
            ottID = Number( o.data.node_id.replace('ott','') ) || 0;
        }
        var argusLoadSuccess = function (json, textStatus, jqXHR) {
            var argusObjRef = this;
            argusObjRef.treeData = json.arguson;
            // Determine the maximum node depth (height_limit or less) found in this subtree
            var node = argusObjRef.treeData;
            var getSubtreeDepth = function(node) {
                /* Find the deepest of its childrens' subtrees. While we're
                 * traversing the tree, let's also set each node's num_tips_in_view!
                 */
                var maxChildDepth = 0,
                    descendantTipsInView = 0;
                if (node.children) {
                    for (var i = 0; i < node.children.length; i++) {
                        var childNode = node.children[i];
                        var childDepth = getSubtreeDepth( childNode );
                        maxChildDepth = Math.max(childDepth, maxChildDepth);
                        // Count any tips found, and descendant tips for internal nodes
                        descendantTipsInView += (childNode.num_tips_in_view || 1);
                    }
                    node.num_tips_in_view = descendantTipsInView;
                } else {
                    // This node is a tip in the current view!
                    node.num_tips_in_view = 0;
                }
                // add this node to depth, plus that of its deepest child
                return maxChildDepth + 1;
            }
            argusObjRef.treeData.max_node_depth = getSubtreeDepth(node) - 1;

            // get the supporting taxonomy (OTT) version for comparison below
            var ottInfo = $.map( argus.treeData.source_id_map, function( value, key ) {
                // return info only for taxonomic sources
                return ('taxonomy' in value) ? value : null;
            })[0];
            if (ottInfo && 'taxonomy' in ottInfo) {
                argus.supportingTaxonomyVersion = ottInfo['taxonomy'];
            }
            if (!argus.supportingTaxonomyVersion) {
                alert("No supporting OTT version found!");
                return;
            }

            // final setup of tree-view object hierarchy
            // recursive marking of depth in local tree
            var setupArgusNode = function (node, depth) {
                node.nodeDepth = depth; // assume this is a number (where 0 = local root)

                // slightly different, this is which column of nodes will hold this one
                // (where 0 = the right-most (leaf nodes) column, higher = further left)
                node.treeColumn = node.isLocalLeafNode() ? 0 : (argusObj.treeData.max_node_depth - node.nodeDepth);
                // TODO: pre-calculate node.x from this, if it never changes..?

                if (node.children) {
                    // sort and cluster children to build its display list

                    /* Prioritize phylogeny-based edges, use alphabetic order, and
                     * use clustering to deal with lots of uninteresting
                     * (taxonomy-based) edges.
                     */
                    var nchildren = node.children.length,
                        nodesWithHybridSupport = [ ],
                        nodesWithPhyloSupport = [ ],
                        nodesWithoutPhyloSupport = [ ],
                        clusters = argusObj.clusters;

                    // sort children alphabetically first..
                    node.children.sort(alphaSortByName);
                    // group children based on type of edge support
                    for (var i = 0; i < nchildren; i++) {
                        var testChild = node.children[i],
                            sb = getSupportingSourceIDs(testChild);
                            //sb = testChild.supported_by;
                        testChild.supportedByTaxonomy = (argus.supportingTaxonomyVersion in sb);
                        testChild.supportedByPhylogeny = Object.keys(sb).length > (testChild.supportedByTaxonomy ? 1 : 0);

                        if (testChild.supportedByPhylogeny && testChild.supportedByTaxonomy) {
                            nodesWithHybridSupport.push(testChild);
                        } else if (testChild.supportedByPhylogeny) {
                            nodesWithPhyloSupport.push(testChild);
                        } else {
                            nodesWithoutPhyloSupport.push(testChild);
                        }
                    }
                    var nWithHybrid = nodesWithHybridSupport.length,
                        nWithPhylo = nodesWithPhyloSupport.length,
                        nWithoutPhylo = nodesWithoutPhyloSupport.length;

                    // mark some less-interesting nodes for clustering
                    //
                    // sort first by number of descendants, so we always show the most
                    // populous clades
                    nodesWithoutPhyloSupport.sort(sortByDescendantCount);
                    var nUnclusteredNodes = argusObj.maxUnclusteredNodes - nWithHybrid - nWithPhylo;
                    var clusteredNodes = nodesWithoutPhyloSupport.slice( nUnclusteredNodes );
                    if (clusteredNodes.length < argusObj.minClusterSize) {
                        // never mind! there's not enough to make a decent cluster
                        clusteredNodes = [ ];
                    }
                    var firstClusteredNode = clusteredNodes[0],  // capture BEFORE re-sorting!
                        nClustered = clusteredNodes.length,
                        nClusteredRemaining,
                        currentCluster = null,
                        nInCurrentCluster = 0;

                    // re-sort the smaller ones by name, then sort into clusters
                    clusteredNodes.sort(alphaSortByName);

                    for (i = 0; i < nClustered; i++) {
                        testChild = clusteredNodes[i];
                        /// testChild.nameStartsWith = (testChild.name.length > 0 ? testChild.name[0].toLowerCase() : '');
                        if (nInCurrentCluster > argusObj.maxClusterSize) {
                            // this cluster is full, start another one?
                            if (testChild.name.indexOf(currentCluster.lastName) === 0) {  // ie, starts with...
                                // no, push this node into the last one...
                            } else {
                                // are there enough nodes left to form a good cluster?
                                nClusteredRemaining = nClustered - i;
                                if (nClusteredRemaining > argusObj.minClusterSize) {
                                    // add a new cluster and start filling it
                                    var newCluster = $.extend( new ArgusCluster(), {
                                        nodes: [ ],
                                        firstName: testChild.name,
                                        lastName: testChild.name,
                                        parentNodeID: node.node_id
                                    });
                                    clusters[node.node_id].push(newCluster);
                                    currentCluster = newCluster;
                                    nInCurrentCluster = 0;
                                }
                                // else toss the remaining few children into the last cluster
                            }
                        }
                        if (!currentCluster) {
                            // add entry for this node, and its first (empty) cluster
                            newCluster = $.extend( new ArgusCluster(), {
                                nodes: [ ],
                                firstName: '',
                                lastName: '',
                                parentNodeID: node.node_id
                            });
                            clusters[ node.node_id ] = [ newCluster ];
                            currentCluster = newCluster;
                            nInCurrentCluster = 0;
                        }
                        currentCluster.nodes.push(testChild);
                        if (currentCluster.firstName === '') {
                            currentCluster.firstName = testChild.name;
                        }
                        currentCluster.lastName = testChild.name;
                        nInCurrentCluster++;
                    }
                    // use names to label each cluster alphabetically

                    // Use these groups and clusters to draw children
                    node.displayList = nodesWithHybridSupport.concat( nodesWithPhyloSupport );

                    nWithHybrid = nodesWithHybridSupport.length;
                    nWithPhylo = nodesWithPhyloSupport.length;
                    nWithoutPhylo = nodesWithoutPhyloSupport.length;
                    // some taxonomy-supported nodes may be hidden in clusters (ignore these)
                    for (i = 0; i < nWithoutPhylo; i++) {
                        // postorder traverse the children of this node
                        if (nodesWithoutPhyloSupport[i] === firstClusteredNode) {
                            // stop when we reach clustered nodes
                            break;
                        }

                        node.displayList.push(nodesWithoutPhyloSupport[i]);
                    }
                    // add minimized clusters to the display list
                    if (clusters[node.node_id]) {
                        node.displayList = node.displayList.concat( clusters[node.node_id]);
                    }
                }

                // recurse into its child nodes
                if (node.children) {
                    for (i = 0; i < node.children.length; i++) {
                        setupArgusNode( node.children[i], depth + 1 );
                    }
                }
            };

            // clear the cluster registry first
            argusObj.clusters = {};

            // recursively populate any missing (implied) node names
            buildAllMissingNodeNames(node);

            setupArgusNode(node, 0);

            var pheight, pwidth, sourcelabel, anchoredbg;

            //spec.container.text("proxy returned data..." + treeData);
            // calculate view-specific geometry parameters
            pheight = ((2 * argusObjRef.minTipRadius) + argusObjRef.yNodeMargin) * (node.num_tips_in_view);
            pheight += argusObjRef.nubDistScalar * argusObjRef.minTipRadius;

            // for a narrow tree, push topmost nodes down away from the anchored widgets
            if (pheight > 16 * argusObjRef.nodeHeight) {
                argusObjRef.yOffsetDefault = 10;
            } else {
                var topBuffer = 8 * argusObjRef.nodeHeight;
                argusObjRef.yOffsetDefault = topBuffer;
                pheight += topBuffer;
            }
            argusObjRef.yOffset = argusObjRef.yOffsetDefault;

            // provide enough room for anchored widgets, more if needed for the tree
            pheight = Math.max(pheight, 20 * argusObjRef.nodeHeight);

            pwidth = argusObjRef.nodesWidth * (node.max_node_depth + 1);
            pwidth += 1.5 * argusObjRef.tipOffset + argusObjRef.xLabelMargin;
            // NOTE that this might still clip super-wide labels, e.g. for a cluster

            argusObjRef.xOffset = pwidth - argusObjRef.nodesWidth - argusObjRef.tipOffset;

            hideSpinner();

            if (argusObjRef.container === undefined) {
                paper = new Raphael(10, 10, 10, 10);
            } else {
                paper = new Raphael(argusObjRef.container, 10, 10);
            }

            // add dividers before anything else
            dividerBeforeEdges = paper.text(0,0,'');
            dividerBeforeLabels = paper.text(0,0,'');
            dividerBeforeHighlights = paper.text(0,0,'');
            dividerBeforeNodes = paper.text(0,0,'');
            dividerBeforeAnchoredUI = paper.text(0,0,'');

            /* Gather all controls that should anchor to the scrolling viewport
             * SUPPRESSING this for now, but kept in case we revisit this idea.
            if (!argusObj.anchoredControls) {
                argusObj.anchoredControls = paper.set();
            }

            // if we need a larger, shared background
            anchoredbg = paper.rect(0,0,120,90).attr({
                "fill": this.bgColor,
                "fill-opacity": 0.6,
                "stroke": 'none'
            });
            argusObj.anchoredControls.push(anchoredbg);

            // this should also anchor to the scrolling viewport
            sourcelabel = paper.text(argusObjRef.sourceTextBoxX,
                                     argusObjRef.sourceTextBoxY,
                                     "source: " + domSource).attr({
                "font-size": String(argusObjRef.fontScalar * argusObjRef.minTipRadius) + "px",
                "text-anchor": "start"
            });
            argusObj.anchoredControls.push(sourcelabel);
            */

            // add (and hide) moving highlights for node and edge provenance
            argusObj.provenanceHighlight = paper.set();
            // rect to allow scaling (vs path)
            argusObj.provenanceHighlight.push(
                paper.rect().attr({
                    "x": -50,
                    "y": -2,
                    "width": 100,
                    "height": 4,
                    "fill": argusObj.provenanceHighlightColor,
                    "title": "Click to see properties for this edge",
                    "stroke": "none",
                    "cursor": "pointer"
                }).insertBefore(dividerBeforeNodes)
            );

            argusObj.provenanceHighlight.push(
              // Draw a lozenge shape, centered on its right focus
              // see http://www.w3.org/TR/SVG/paths.html#PathDataEllipticalArcCommands
                paper.path('M -20,-7.5 L 0,-7.5  A 7.5,7.5 0 0,1 0,7.5  L -20,7.5  A 7.5,7.5 0 0,1 -20,-7.5  Z').attr({
                    "x": 0,
                    "y": 0,
                    "stroke": argusObj.provenanceHighlightColor,
                    "title": "Click to see properties for this node", // add name?
                    "stroke-width": 2,
                    "fill": argusObj.provenanceHighlightLabelBackgroundColor,
                    "cursor": "pointer"
                }).insertBefore(dividerBeforeNodes)
            );
            argusObj.provenanceHighlight.push(
                paper.text().attr({
                    "x": -20,
                    "y": 0,
                    "text": "i",
                    "title": "Click to see properties for this node", // add name?
                    "text-anchor": "middle",
                    "fill": argusObj.provenanceHighlightLabelColor,
                    "font-weight": "bold",
                    "font-family": "Courier, monospace",
                    "font-size": 12,
                    "cursor": "pointer"
                }).insertBefore(dividerBeforeNodes)
            );
            // hide until user rolls over a node or edge
            argusObj.provenanceHighlight.hide();

            argusObj.provenanceHighlight.hover(
                getHoverHandlerProvenanceHighlight('OVER', argusObj.provenanceHighlight, {}),
                getHoverHandlerProvenanceHighlight('OUT', argusObj.provenanceHighlight, { })
            );
            var handler = getClickHandlerProvenanceHighlight(); // just once!
            // note that the target node's info is available as argusObj.highlightedNodeInfo
            $.each(argusObj.provenanceHighlight.items, function(i, item) {
                // we need to dig into the actual nodes to use jQuery binding
                $(item.node).on('click contextmenu', handler);
            });

            // refresh tree
            argusObjRef.nodesHash = {};
            argusObjRef.nodesWithCycles = [];
            // draw the tree
            argusObjRef.drawTree();
            /* Update the viewbox to include all visible elements (esp.
             * ancestor nodes and long node+cluster labels)
             */
            setZoomAndReframeView();

            // Release the forced height of the argus viewport
            $(this.container).css('height', '');

            // if there's a page-level callback function, call it now
            if (typeof nodeDataLoaded === 'function') {
                nodeDataLoaded(node);
            }

            // draw the cycles
            argusObjRef.drawCycles();
        };
        var argusLoadFailure = function (jqXHR, textStatus, errorThrown) {
            // Was this a taxon that didn't make it into synthesis, or some other error?
            var mainFetchXHR = jqXHR;
            var mainFetchJSON;
            try {
                // IF there was a JSON payload, we want to keep it
                mainFetchJSON = $.parseJSON(mainFetchXHR.responseText);
            } catch(e) {
                // make an empty object for now
                mainFetchJSON = { };
            }
            $.ajax({
                url: getTaxonInfo_url,
                type: 'POST',
                crossDomain: true,
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify({ "ott_id": ottID }),  // set above, defaults to 0 (invalid ID) if not an OTT taxon
                complete: function( jqXHR, textStatus ) {
                    hideSpinner();
                    // report errors or malformed data, if any
                    var errMsg;
                    if (textStatus !== 'success') {
                        // major server-side error, just show raw response for tech support
                        errMsg = '<p>Sorry, there was an error checking for taxon status.</p>';
                        showErrorInArgusViewer(errMsg);
                        return;
                    }
                    // check to see if we got a taxon record, or an error in JSON
                    var json = $.parseJSON(jqXHR.responseText);
                    // if (json['ott_id'] === ottID) { TODO: use this when we switch to v3 taxonomy API!
                    if (json['ott_id'] === ottID) {
                        var taxoBrowserLink = getTaxobrowserLink('View this taxon in the taxonomy browser', ottID)
                        // the requested taxon exists in OTT, but is not found in the target tree
                        //errMsg = '<p>This taxon is in our taxonomy but not in our tree synthesis database.</p>'

                        if (mainFetchJSON.broken) {
                            // parse this to learn more...
                            errMsg = '<p>This taxon is in our taxonomy but it\'s "broken" (not monophyletic) in the latest synthetic tree.</p>';
                            if (mainFetchJSON.broken.mrca) {
                                // this is the ottid of its MRCA, a good next step for this user
                                var mrcaSynthViewURL = getSynthTreeViewerURLForNodeID(
                                    '',  // defaults to latest synthetic tree
                                    mainFetchJSON.broken.mrca
                                );
                                errMsg +='<p class="action-item"><a href="' + mrcaSynthViewURL
                                        +'">View the MRCA of the members of this taxon in the synthetic tree</a></p>';
                            }
                            if (mainFetchJSON.broken.contesting_trees) {
                                errMsg +='<p class="action-item">Input phylogenies that conflict with this taxon (click to see each conflicting tree in a new window):</p>';
                                errMsg +='<ul class="action-item">';
                                Object.keys(mainFetchJSON.broken.contesting_trees).forEach(function(treeAndStudyID) {

                                    var parts = treeAndStudyID.split('@');
                                    var studyID = parts[0];
                                    var treeID = parts[1];
                                    var conflictURL = '/curator/study/view/{STUDY_ID}/?tab=trees&tree={TREE_ID}&conflict=ott'
                                        .replace('{STUDY_ID}', studyID)
                                        .replace('{TREE_ID}', treeID);

                                    errMsg +='<li><a target="_blank" href="'+ conflictURL +'"><b>' + treeAndStudyID +'</b>';
                                  /* TODO: One or more AJAX fetches to retrieve study and tree names?
                                    var treeName = "TODO";
                                    var compactRef = "TODO";
                                    errMsg +=' &nbsp; ('+ "tree <b>'+ treeName +'</b> in study <b>'+ compactRef +'</b>" +')<//a></li>';
                                  */
                                });
                                errMsg +='</ul>';
                            }
                        } else {
                            errMsg = '<p>This taxon is in our taxonomy but does not appear in the latest synthetic tree. This can happen for a variety of reasons,'
                                +' but the most probable is that is has a taxon flag (e.g. <em>incertae sedis</em>) that'
                                +' causes it to be pruned from the synthetic tree.</p>';
                            if (json.flags && json.flags.length > 0) {
                                errMsg += '<p>The following flags were found on this taxon:</p>'
                                errMsg += '<ul>';
                                $.each(json.flags, function(i, flag) {
                                    errMsg += '<li style="font-family: monospace; color: #999;">'+ flag +'</li>';
                                });
                                errMsg += '</ul>';
                                errMsg += '<p>See our <a href="https://github.com/OpenTreeOfLife/reference-taxonomy/blob/master/doc/taxon-flags.md#taxon-flags" target="_blank">taxonomy documentation</a> for details on the meanings of each flag.</p>'
                            }
                        }

                        errMsg +='<p class="action-item">'+ taxoBrowserLink +'</p>';
                        showErrorInArgusViewer( errMsg );
                    } else {
                        // this is not a valid taxon id! Show the *original* error response from the failed argus fetch.
                        errMsg = '<p>Whoops! The call to get the tree around a node did not work out the way we were hoping it would.</p>';
                        showErrorInArgusViewer( errMsg, mainFetchXHR.responseText );
                    }
                }
            });
        };
        $.ajax({
            url: o.url,
            type: o.httpMethod === undefined ? "POST" : o.httpMethod,
            dataType: 'text nodeTree',  // 'nodeTree' triggers converter below
            data: dataStr,
            context: argusObj,
            crossDomain: true,
            contentType: 'application/json',
            converters: {
                // serialize this JSON into dedicated pseudo-classes
                'text nodeTree': function(data) {
                    ///console.log(">>> pre-processing raw JSON string..." );
                    // NOTE that jQuery's parseJSON() doesn't support the 'reviver' option
                    ///return $.parseJSON(data, argusObj.makeNodeTree);
                    return JSON.parse(data, argusObj.makeNodeTree);
                }
            },
            success: argusLoadSuccess,
            error: argusLoadFailure
        });
    };

    argusObj.moveToNode = function (o) {
        // if we're using History.js, all movement through the tree should be driven from history
        if (History && History.enabled && "pageUsesHistory" in window && pageUsesHistory) {
            // add expected values for minimal history entry
            var stateObj = $.extend(true, {'nodeName': ''}, o); // deep copy of o, with default values if none supplied
            History.pushState(stateObj, historyStateToWindowTitle(stateObj), historyStateToURL(stateObj));
        } else {
            // proceed directly to display (emulate browser history State object)
            updateTreeView({'data': o});
        }
        // if we're still showing the initial "nudge" message, hide it now
        if ($('#nudged-to-latest-synthetic-tree').is(':visible')) {
            $('#nudged-to-latest-synthetic-tree').fadeOut();
        }
    };

    argusObj.displayNode = function (o) {
        // update argus' domSource to reflect that of the new target node?
        this.domSource = (o.domSource === undefined) ? this.domSource : o.domSource;

        var ajaxInfo = this.buildAjaxCallInfo({
            "nodeID": o.nodeID,
            "ott_id": o.ott_id || "0",
            "domSource": this.domSource
        });

        // Freeze the height of the argus viewport until new results arrive
        $(this.container).css('height', $(this.container).css('height'));

        if (paper !== undefined) {
            $(this.container).unbind("scroll");
            if (argusObj.anchoredControls) {
                argusObj.anchoredControls.remove();
                argusObj.anchoredControls.clear();
            }
            paper.clear();
            paper.remove();
        }

        clearPropertyInspector();
        showSpinner($(this.container));

        /* The next 9 lines store the last call to displayNode. We'll need to move this, if we use other functions as "public" entry points of Argus calls*/
        if (o.storeThisCall === undefined || o.storeThisCall) {
            if (this.currDisplayContext !== undefined) {
                this.backStack.push(this.currDisplayContext);
            }
        }
        this.currDisplayContext = $.extend(true, {}, o); // cryptic, eh?  this is a deep copy of o
        if (o.storeThisCall === undefined || o.storeThisCall) {
            delete this.currDisplayContext.storeThisCall;
        }

        this.nodeID = o.nodeID;
        this.loadData(ajaxInfo);
        setZoomAndReframeView();
        return this;
    };

    // create closure to access node attributes when hovering in/out
    getHoverHandlerNodeAndEdge = function (hoverState, shape, shapeAttributes, nodeInfo) {
        ///console.log("CALL getHoverHandlerNodeAndEdge - "+ hoverState);
        var targetShape = shape;
        return function () {
            ///console.log("INNER getHoverHandlerNodeAndEdge - "+ hoverState);
            var srcInfo = $.extend(true, {}, targetShape.data('sourceNodeInfo'));
            var nodeCircle, edgePath;
            switch (targetShape.type) {
                case 'circle':
                    nodeCircle = targetShape;
                    edgePath = paper.getById('node-branch-trigger-'+ srcInfo.nodeID);
                    break;

                case 'path':
                    nodeCircle = paper.getById('node-circle-'+ srcInfo.nodeID);
                    edgePath = targetShape;
                    break;

                default:
                    console.warn("getHoverHandlerNodeAndEdge(): Unexpected type for targetShape: '"+ targetShape.type +"'!");
                    return;
            }

            nodeCircle.attr(shapeAttributes);
            switch (hoverState) {
                case 'OVER':
                    // copy source-node values from the target node to the highlight

                    argusObj.highlightedNodeInfo = srcInfo;

                    // move the highlight to this node
                    argusObj.provenanceHighlight.transform('t' + nodeCircle.attr('cx') + ',' + nodeCircle.attr('cy'));

                    if (edgePath) {
                        // move the highlight to this edge
                        // no easy x/y attributes for a path, need to use its bounding box
                        var bbox = edgePath.getBBox(false);

                        argusObj.provenanceHighlight.forEach(function(element) {
                            if (element.type == 'rect') {
                                var xScale = (bbox.width / 100);
                                var pathScale = 'S '+ xScale +',1  t' + ((bbox.x + (bbox.width / 2.0)) / xScale) + ',' + bbox.y;
                                    // 100 is the natural width of the hilight path
                                element.transform(pathScale);
                                element.show();
                            }
                        });
                    }

                    argusObj.provenanceHighlight.show();

                    if (!edgePath) {
                        // hide edge-highlight rect if there's no upward edge
                        argusObj.provenanceHighlight.forEach(function(element) {
                            if (element.type == 'rect') {
                                element.hide();
                            }
                        });
                    }
                    break;
                case 'OUT':
                    // do nothing for now
                    break;
                default:
                    console.log('Unexpected value for hoverState: '+ hoverState);
            }
        };
    };
    getHoverHandlerCluster = function (hoverState, shape, shapeAttributes, label, labelAttributes, clusterInfo) {
        var clusterShape = shape;
        var clusterLabel = label;
        return function () {
            clusterShape.attr(shapeAttributes);
            clusterLabel.attr(labelAttributes);
            switch (hoverState) {
                case 'OVER':
                    // copy source-node values from the target node to the highlight
                    var srcInfo = $.extend(true, {}, clusterShape.data('clusterInfo'));

                    ///argusObj.highlightedNodeInfo = srcInfo;
                    break;
                case 'OUT':
                    // do nothing for now
                    break;
                default:
                    console.log('Unexpected value for hoverState: '+ hoverState);
            }
        };
    };
    getHoverHandlerProvenanceHighlight = function (hoverState, highlight, shapeAttributes, highlightInfo) {
        var nodeHighlight = highlight;
        return function (evt) {
            switch (hoverState) {
                case 'OVER':
                    nodeHighlight.attr(shapeAttributes);
                    break;
                case 'OUT':
                    // are we REALLY outside the lozenge, or just over the text?

                    // Test using client/page coordinates, instead of canvas.
                    // (This handles scaling, scrolling, etc. more reliably.)
                    var bbox = getClientBoundingBox( argusObj.provenanceHighlight );

                    if (Raphael.isPointInsideBBox( bbox, evt.pageX, evt.pageY )) {
                        // false alarm, it's just moved over text or the node circle
                        return;
                    }

                    nodeHighlight.attr(shapeAttributes);
                    // hide the node highlight
                    argusObj.provenanceHighlight.hide();
                    break;
                default:
                    console.log('Unexpected value for hoverState (node highlight): '+ hoverState);
            }
        };
    }

    getClickHandlerNode = function (nodeID, domSource, nodeName) {
        return function (e) {
            /* Right-click ('contextmenu' event) should open a new window focused
             * on this node; otherwise re-center the argus view in this window.
             *
             * N.B. Details on how a new window or tab appears depend on each browser,
             * as well as popup blockers and user preferences!
             */
            switch (e.type) {
                case 'contextmenu':
                    var urlSafeNodeName = encodeURIComponent(nodeName);
                    var nodeURL = '/opentree/'+ domSource +'@'+ nodeID +'/'+ urlSafeNodeName;
                    var newWindow = window.open( nodeURL, '_blank' );
                    if (newWindow) {
                        // if blocked by popup blocker, this is undefined
                        newWindow.focus();
                    }
                    break;

                case 'click':
                default:
                    argusObj.moveToNode({"nodeID": nodeID,
                                         "domSource": domSource,
                                         "nodeName": nodeName});
            }
        };
    };
    getClickHandlerCluster = function (minimizedClusterParts, parentNodeID, clusterPosition, depthFromTargetNode, domSource, currentYoffset) {
        return function () {
            // clobber the minimized cluster
            for (var i = 0; i < minimizedClusterParts.length; i++) {
                minimizedClusterParts[i].remove();
            }

            var cluster = argusObj.clusters[ parentNodeID ][ clusterPosition ];
            // draw its children, starting at the X and Y coords for this cluster

            // flip its 'expanded' flag and remove it from the display list..
            cluster.expanded = true;
            var parentNode = argusObj.getArgusNodeByID(parentNodeID);
            var dlPos = $.inArray(cluster, parentNode.displayList);
            // replace the minimized cluster with its nodes
            var listBeforeCluster = parentNode.displayList.slice(0,dlPos);
            var listAfterCluster = parentNode.displayList.slice(dlPos + 1);
            parentNode.displayList = listBeforeCluster.concat( cluster.nodes, listAfterCluster );

            // hide any stale highlight
            argusObj.provenanceHighlight.hide();

            // redraw entire tree with changes
            argusObj.drawTree();
            setZoomAndReframeView();
        };
    };
    getBackClickHandler = function () {
        return function () {
            argusObj.forwardStack.push(argusObj.currDisplayContext);
            o = argusObj.backStack.pop();
            o.storeThisCall = false;
            argusObj.moveToNode(o);
        };
    };
    getForwardClickHandler = function () {
        return function () {
            o = argusObj.forwardStack.pop();
            argusObj.moveToNode(o);
        };
    };

    // reckon zoom level as a proportion of 1.0 (="natural" size)
    argusZoomLevel = null;
    zoomStep = 1.2;
    setZoomAndReframeView = function( newLevel ) {
        if (argusZoomLevel && argusZoomLevel === newLevel) {
            return;  // do nothing
        }
        if (!paper || !paper.canvas) {
            return;
        }
        if (typeof(argusZoomLevel) !== 'number') {
            // set default size
            argusZoomLevel = 1.0;
        }
        // read the current scrollbar positions of the argus view
        var svgContainer = $(paper.canvas)[0].parentElement;
        argusScrollLeft = svgContainer.scrollLeft;
        argusScrollTop = svgContainer.scrollTop;
        switch(newLevel) {
            case '+':
                argusZoomLevel *= zoomStep;
                argusScrollLeft *= zoomStep;
                argusScrollTop *= zoomStep;
                break;
            case '-':
                argusZoomLevel /= zoomStep;
                argusScrollLeft /= zoomStep;
                argusScrollTop /= zoomStep;
                break;
            default:
                if (typeof(newLevel) === 'number') {
                    // assume it's an explicit zoom level
                    var oldZoomLevel = (argusZoomLevel || 1.0);
                    argusZoomLevel = 1.0 * newLevel;
                    // reckon this change as a "custom zoomStep"
                    var zoomChange = newLevel / oldZoomLevel;
                    argusScrollLeft = 0.0 * zoomChange;
                    argusScrollTop = 0.0 * zoomChange;
                } else {
                    // assume this is simply re-asserting the current zoom level (eg, in a new node)
                }
        }
        // try to apply the new scale, while maintaining the current center point
        argusObj.revealAllVisibleTreeElements();
    };

    getClickHandlerAltRelLine = function (nodeFromAJAX) {
        /* at some point we will probably want to retain a history of preferred altrelationships, etc.
         * these should be stored/retrieved from a base-level query info object that is passed back
         * and forth from the server. for now we are just keeping things simple and not remembering
         * anything about previous relationships.
         *                  var altrelids = // get altrels ;
         *                  altrelids.push(child.altrels[j].altrelid); */
        return function () {
            argusObj.moveToNode({"nodeID": nodeFromAJAX.parentid,
                                 "domSource": nodeFromAJAX.source});
        };
    };
    getClickHandlerProvenanceHighlight = function () {
        return function (e) {
            /* Right-click ('contextmenu' event) should open a new window focused
             * on this node; otherwise show this node's properties in the inspector.
             * We'll use source-node values copied from the target node
             *
             * N.B. Details on how a new window or tab appears depend on each browser,
             * as well as popup blockers and user preferences!
             */
            switch (e.type) {
                case 'contextmenu':
                    var info = argusObj.highlightedNodeInfo;
                    var urlSafeNodeName = encodeURIComponent(info.nodeName);
                    var nodeURL = '/opentree/'+ info.domSource +'@'+ info.nodeID +'/'+ urlSafeNodeName;
                    var newWindow = window.open( nodeURL, '_blank' );
                    if (newWindow) {
                        // if blocked by popup blocker, this is undefined
                        newWindow.focus();
                    }
                    break;

                case 'click':
                default:
                    showObjectProperties( argusObj.highlightedNodeInfo );
            }
        };
    };

    // recursive function to draw nodes and branches for the "dominant" tree (the domSource)
    var tempCounter = 1;
    argusObj.drawNode = function(obj) {
        // recursive (depth first, top down) through all sub-nodes for best layout
        var node = obj.node;
        var isTargetNode = obj.isTargetNode;
        var parentNodeX = obj.parentNodeX;
        if (!parentNodeX) {
            // passed in arg is fastest, but this is now reliable
            var parentNode = argusObj.getArgusNodeByID(node.parentNodeID);
            parentNodeX = (parentNode) ?
              argusObj.xOffset - (argusObj.nodesWidth * parentNode.treeColumn) :
              // if no parent ID, assume it's the local root node
              argusObj.xOffset - (argusObj.nodesWidth * argusObj.treeData.treeColumn);
        }
        var depthFromTargetNode = obj.depthFromTargetNode || 0;
        var domSource = obj.domSource;
        var fontSize = this.minTipRadius * this.fontScalar;
        var curLeaf = obj.curLeaf;
        var currentYoffset = obj.currentYoffset || argusObj.yOffset;
        // build IDs for visible elements (to move or create)
        var nodeCircleElementID = 'node-circle-'+ node.node_id;
        var nodeLabelElementID = 'node-label-'+ node.node_id;
        var nodeSpineElementID = 'spine-'+ node.node_id;
        var nodeTriggerBranchElementID = 'node-branch-trigger-'+ node.node_id;
        var nodeVisibleBranchElementID = 'node-branch-'+ node.node_id;
        // manipulate the existing elements, if any
        var circle = paper.getById(nodeCircleElementID);
        var label = paper.getById(nodeLabelElementID);
        var spine = paper.getById(nodeSpineElementID);
        var triggerBranch = paper.getById(nodeTriggerBranchElementID);
        var visibleBranch = paper.getById(nodeVisibleBranchElementID);

        // use standard reckoning for node's X coordinate
        node.x = this.xOffset - (this.nodesWidth * node.treeColumn);

        var dlCount = node.displayList.length;
        for (var i = 0; i < dlCount; i++) {
            var dlChild = node.displayList[i];
            if (dlChild instanceof ArgusNode) {
                argusObj.drawNode({
                    "node": dlChild,
                    "domSource": domSource,
                    "curLeaf": curLeaf,
                    "isTargetNode": false,
                    "parentNodeX": node.x,
                    "currentYoffset": currentYoffset,
                    "depthFromTargetNode": depthFromTargetNode + 1
                });
                currentYoffset = dlChild.displayBounds.bottomY;
            } else if (dlChild instanceof ArgusCluster) {
                argusObj.drawCluster({
                    "cluster": dlChild,
                    "clusterPosition": $.inArray(dlChild, node.getClusters()), // returns index
                    "domSource": domSource,
                    "parentNodeX": node.x,
                    "currentYoffset": currentYoffset,
                    "depthFromTargetNode": depthFromTargetNode
                });
                currentYoffset = dlChild.displayBounds.bottomY;
            } else {
                // something else? let's check it out...
                console.log("ERROR: unexpected thing in displayList for '"+ node.name +"': "+ typeof(dlChild));
                ///debugger;
            }
        }

        var bounds;
        if (dlCount === 0) {
            node.y = currentYoffset + (this.nodeHeight / 2);
            bounds = node.updateDisplayBounds();
        } else {
            // now that we know the layout of its children, create (or update) this node
            bounds = node.updateDisplayBounds();
            node.y = bounds.middleY; // average of display children's Y coords
        }

        // temporary marking to test flow of recursion
        ///node.name += (" ["+ tempCounter++ +"]");

        // draw the main circle for this node
        if (node.isLocalLeafNode()) {
            node.r = node.isActualLeafNode() ? (this.minTipRadius * 0.7) : this.minTipRadius;
        } else {
            node.r = this.minTipRadius + this.nodeDiamScalar * Math.log(node.num_tips);
        }
        var nodeFill = this.nodeColor;
        var nodeStroke = this.pathColor;
        // override for special cases
        if (node.isActualLeafNode()) {
            nodeFill = this.actualLeafColor;
            nodeStroke = this.bgColor;
        } else if (node.isVisibleLeafNode()) {
            nodeFill = this.visibleLeafColor;
        } else if (isTargetNode) {
            // add special styles for this?
        }
        if (circle) {
            // update the existing circle
            circle.attr({
                'cx': node.x,
                'cy': node.y
            });
        } else {
            // create the new circle
            circle = paper.circle( node.x, node.y, node.r).attr({
                            "fill": nodeFill,
                            "title": "Click to move to this node",
                            "stroke": nodeStroke
                         }).insertBefore(dividerBeforeAnchoredUI);
            circle.id = (nodeCircleElementID);

            // insert hover handler (node properties and navigation triggers)
            circle.hover(getHoverHandlerNodeAndEdge('OVER', circle, {
                "fill": this.nodeHoverColor
            }), getHoverHandlerNodeAndEdge('OUT', circle, {
                "fill": nodeFill
            }));

            $(circle.node).on('click contextmenu', getClickHandlerNode(node.node_id, domSource, node.name));
            // copy source data into the circle element (for use by highlight)
            circle.data('sourceNodeInfo', {
                'nodeID': node.node_id,
                'nodeName': node.name,
                'domSource': domSource
            });

            // if this node has cycles, record it; we will draw them once the tree is done
            var nAltParents = (node.altrels === undefined ? 0 : node.altrels.length);
            if (nAltParents > 0) {
                this.nodesWithCycles.push(node.node_id);
            }
            // store the node for fast access later
            this.nodesHash[node.node_id] = node;
        }

        // label position varies based on which column we're in
        var labelX, labelY, labelAnchor;
        if (node.isLocalLeafNode()) {
            labelX = node.x + this.xLabelMargin;
            labelY = node.y;
            labelAnchor = 'start';
        } else {
            labelX = node.x - (node.r + 0.5);
            labelY = node.y + (node.r + 0.5);
            labelAnchor = 'end';
        }

        if (label) {
            // update the existing label
            label.attr({
                'x': labelX,
                'y': labelY,
                'text': node.name
            });
        } else {
            // create the new label
            var displayLabel;
            if (node.isLocalLeafNode()) {
                // always show labels for leaf nodes (in this view)
                displayLabel = node.name;
            } else {
                // hide synthetic/compound node labels for internal (in this view) nodes
                var compoundNodeNameDelimiter = ' + ';
                var compoundNodeNamePrefix = '[';
                var compoundNodeNameSuffix = ']';
                // N.B. this is determined using vars above, COPIED from treeview.js!
                var isCompoundNodeName = ((typeof node.name === 'string') &&
                                          (node.name.indexOf(compoundNodeNameDelimiter) !== -1) &&
                                          (node.name.indexOf(compoundNodeNamePrefix) === 0) &&
                                          (node.name.indexOf(compoundNodeNameSuffix) === (node.name.length -1)));
                displayLabel = (isCompoundNodeName ? '' : node.name || '');
            }
            label = paper.text(labelX, labelY, displayLabel).attr({
                'text-anchor': labelAnchor,
                "title": displayLabel,
                "fill": this.labelColor,
                "font-size": fontSize
            }).insertBefore(dividerBeforeHighlights);
            label.id = (nodeLabelElementID);
        }

        // create/update spine, if there are multiple display children
        if (node.displayList.length > 1) {
            var spineSt = "M" + node.x + " " + node.displayBounds.firstChildY
                        + "L" + node.x + " " + node.displayBounds.lastChildY;

            if (spine) {
                // update the existing label
                spine.attr({
                    'path': spineSt
                });
            } else {
                // create the new spine
                spine = paper.path(spineSt).toBack().attr({
                    "stroke": this.pathColor,
                    "stroke-linecap": 'round'
                }).insertBefore(dividerBeforeLabels)
                  .id = (nodeSpineElementID);
            }
        }

        if (!isTargetNode) {
            // draw/update its "upward" branch to the parent's spine
            // TODO: nudge (vs create) if this already exists!
            var lineDashes, lineColor,
                //sb = node.supported_by,
                sb = getSupportingSourceIDs(node),
                supportedByTaxonomy = argus.supportingTaxonomyVersion in sb,
                supportedByPhylogeny = Object.keys(sb).length > (supportedByTaxonomy ? 1 : 0);

            if (supportedByTaxonomy && supportedByPhylogeny) {
                //lineDashes = '--..';
                lineDashes = '';
                lineColor = this.strongPathColor;
            } else if (supportedByPhylogeny){
                lineDashes = '';
                lineColor = this.strongPathColor;
            } else if (supportedByTaxonomy){
                lineDashes = '- ';
                lineColor = this.pathColor;
            } else {
                lineDashes = '--..';
                lineColor = 'orange';
            }

            var branchSt = "M" + parentNodeX + " " + node.y + "L" + node.x + " " + node.y;

            if (triggerBranch && visibleBranch) {
                // update the existing elements
                triggerBranch.attr({
                    'path': branchSt
                });
                visibleBranch.attr({
                    'path': branchSt
                });
            } else {
                // draw a wide, invisible path to detect mouse-over
                triggerBranch = paper.path(branchSt).toBack().attr({
                    "stroke-width": 5,
                    "stroke-linecap": 'butt',
                    "stroke": this.bgColor
                }).insertAfter(dividerBeforeEdges);
                triggerBranch.id = (nodeTriggerBranchElementID);
                // NOTE that these are pushed behind all visible paths!

                // ... and a congruent, visible path
                visibleBranch = paper.path(branchSt).toBack().attr({
                    "stroke-width": 1,
                    "stroke-linecap": (lineDashes === '.') || (lineDashes === '--..') || (lineDashes === '--.') ? 'butt' : 'round',      // avoids Chrome bug with dotted lines + round caps
                    "stroke-dasharray": lineDashes,
                    "stroke": lineColor          // this.pathColor
                }).insertBefore(dividerBeforeLabels);
                visibleBranch.id = (nodeVisibleBranchElementID);

                // assign hover behaviors
                triggerBranch.hover(getHoverHandlerNodeAndEdge('OVER', triggerBranch, {}), getHoverHandlerNodeAndEdge('OUT', triggerBranch, {}));

                // copy node data into the path element (for use by highlight)
                triggerBranch.data('sourceNodeInfo', {
                    'nodeID': node.node_id,
                    'nodeName': node.name,
                    'domSource': domSource
                });
            }
        }
        if (isTargetNode) {
            // draw a series of ancestor nodes
            this.targetNodeY = node.y;

            if (node.lineage) {
                // try to draw upward path w/ up to 3 nodes, plus trailing edge if there's more
                var upwardNode;
                var maxUpwardNodes = 3;
                var alphaStep = 0.15;
                var xyStep = 25;
                for (i = 0; i < node.lineage.length; i++) {
                    var startX = node.x - (xyStep * i);
                    var startY = node.y - (xyStep * i);
                    var endX = startX - xyStep;
                    var endY = startY - xyStep;
                    var pathOpacity = 1.0 - (alphaStep * (i+1));
                    var ancestorNode = node.lineage[i];
                    // build IDs for visible elements (to move or create)
                    nodeCircleElementID = 'node-circle-'+ ancestorNode.node_id;
                    nodeLabelElementID = 'node-label-'+ ancestorNode.node_id;
                    var nodeBranchElementID = 'node-branch-'+ ancestorNode.node_id;
                    // manipulate the existing elements, if any
                    circle = paper.getById(nodeCircleElementID);
                    label = paper.getById(nodeLabelElementID);
                    var branch = paper.getById(nodeBranchElementID);

                    var upwardSt = "M" + startX+ "," + startY + "L" + endX + " " + endY;
                    if (branch) {
                        // update the existing branch
                        branch.attr({
                            'path': upwardSt
                        });
                    } else {
                        // create the new branch
                        branch = paper.path(upwardSt).toBack().attr({
                            "stroke": this.pathColor,
                            "stroke-linecap": 'butt', // REQUIRED if stroke-dasharray is '.'
                            "stroke-dasharray": '. ',
                            "opacity": pathOpacity
                        }).insertBefore(dividerBeforeLabels);
                        branch.id = (nodeBranchElementID);
                    }

                    if (i < maxUpwardNodes) {
                        // draw node circle and label
                        labelX = endX - (this.minTipRadius * 1.25);
                        labelY = endY + (this.minTipRadius * 1.25);
                        if (circle && label) {
                            // update the existing circle and label
                            circle.attr({
                                'cx': endX,
                                'cy': endY
                            });
                            label.attr({
                                'x': labelX,
                                'y': labelY
                            });

                        } else {
                            // create the new circle and label
                            circle = paper.circle(endX, endY, this.minTipRadius).attr({
                                "fill": this.nodeColor,
                                "title": "Click to move to this node",
                                "stroke": this.pathColor
                            }).insertBefore(dividerBeforeAnchoredUI);
                            circle.id = (nodeCircleElementID);

                            label = paper.text(labelX, labelY, ancestorNode.name || "").attr({
                                'text-anchor': 'end',
                                "title": (ancestorNode.name || ""),
                                "fill": this.labelColor,
                                "font-size": fontSize
                            }).insertBefore(dividerBeforeHighlights);
                            label.id = (nodeLabelElementID);

                            // add handlers and metadata
                            $(circle.node).bind('click contextmenu', getClickHandlerNode(ancestorNode.node_id, domSource, ancestorNode.name));
                            // copy source data into the circle element (for use by highlight)
                            circle.data('sourceNodeInfo', {
                                'nodeID': ancestorNode.node_id,
                                'nodeName': ancestorNode.name,
                                'domSource': domSource
                            });
                            circle.hover(getHoverHandlerNodeAndEdge('OVER', circle, {
                                "fill": this.nodeHoverColor
                            }), getHoverHandlerNodeAndEdge('OUT', circle, {
                                "fill": this.nodeColor
                            }));
                        }

                    }

                    if (i === maxUpwardNodes) {
                        break; // we've drawn a final path bit, now we're done
                    }
                }

            }
        }
    }

    argusObj.drawCluster = function (obj) {
        var cluster = obj.cluster;
        var parentNodeID = cluster.parentNodeID;
        var parentNodeX = obj.parentNodeX;
        var depthFromTargetNode = obj.depthFromTargetNode;
        var currentYoffset = obj.currentYoffset;
        var clusterPosition = obj.clusterPosition;
        var domSource = obj.domSource;
        // build IDs for visible elements (to move or create)
        var clusterBranchElementID = 'min-cluster-branch-'+ parentNodeID +'-'+ clusterPosition;
        var clusterBoxElementID = 'min-cluster-box-'+ parentNodeID +'-'+ clusterPosition;
        var clusterLabelElementID = 'min-cluster-label-'+ parentNodeID +'-'+ clusterPosition;
        // manipulate the existing elements, if any
        var branch = paper.getById(clusterBranchElementID);
        var box = paper.getById(clusterBoxElementID);
        var label = paper.getById(clusterLabelElementID);

        cluster.x = parentNodeX;
            // match its parent node, useful when expanding cluster
        var clusterLeftEdge = cluster.x + (this.nodesWidth / 3.0);
        cluster.y = currentYoffset + (this.nodeHeight * 1.0);
        var fontSize = this.minTipRadius * this.fontScalar;
        // draw a short branch out to this cluster
        var branchSt = "M" + parentNodeX + " " + cluster.y + "L" + clusterLeftEdge + " " + cluster.y;
        if (branch) {
            // update the existing path
            branch.attr({
                'path': branchSt
            });
        } else {
            // create the new path
            branch = paper.path(branchSt).toBack().attr({
                "stroke-width": 1,
                "stroke-linecap": 'butt', // REQUIRED if stroke-dasharray is '.'
                "stroke-dasharray": '. ',
                "stroke": this.pathColor
            }).insertBefore(dividerBeforeLabels);
            branch.id = (clusterBranchElementID);
        }

        if (box && label) {
            // update the existing box and label
            box.attr({
                'x': clusterLeftEdge,
                'y': cluster.y - (this.nodeHeight / 2.0)
            });
            label.attr({
                'x': clusterLeftEdge + 8,
                'y': cluster.y
            });
        } else {
            // Draw the cluster label, then a surrounding shape (a lozenge that can hold 'Aaa - Zzz')?
            var minimizedCluster = paper.set().insertAfter(dividerBeforeLabels);
            // NOTE that we can't set (or retrieve) an ID on a Raphael set...

            // draw the cluster label
            var clusterLabel = "more... ("+ cluster.firstName +" - "+ cluster.lastName +")";
            label = paper.text(clusterLeftEdge + 8, cluster.y - (this.nodeHeight * 0.0), clusterLabel).attr({
                'text-anchor': 'start',
                "title": clusterLabel,
                "fill": this.labelColor,
                "font-size": fontSize,
                "cursor": "pointer"
            });
            label.id = (clusterLabelElementID);
            minimizedCluster.push(label);

            // draw the surrounding shape (appears on mouseover)
            var defaultBoxWidth = this.nodesWidth * 3.5;
            var minBoxWidth = label.getBBox().width + 16;
            var boxWidth = Math.max(defaultBoxWidth, minBoxWidth);
            box = paper.rect(clusterLeftEdge, cluster.y - (this.nodeHeight * 0.55), boxWidth, this.nodeHeight * 1.2).attr({
                "stroke": this.bgColor,
                "stroke-width": 1,
                "stroke-dasharray": '.',
                "fill": this.bgColor,
                "r": 4,  // rounded corner (radius)
                "cursor": "pointer"
            });
            box.id = (clusterBoxElementID);
            minimizedCluster.push(box);
            label.toFront();    // else it's hidden behind the lozenge!

            // assign behaviors to replace the minimized cluster with its nodes
            var minimizedClusterParts = [branch, minimizedCluster];
            minimizedCluster.click(getClickHandlerCluster(
                minimizedClusterParts,
                parentNodeID,
                clusterPosition,
                depthFromTargetNode,
                domSource,
                currentYoffset
            ));
            minimizedCluster.hover(getHoverHandlerCluster('OVER',
                box, { "fill": this.nodeColor },
                label, { "fill": 'white' }
            ), getHoverHandlerCluster('OUT',
                box, { "fill": this.bgColor },
                label, { "fill": this.labelColor }
            ));
        }
        cluster.updateDisplayBounds();
    }

    argusObj.drawTree = function(obj) {
        // (re)draw the entire tree, starting from the target (local root) node

        // TODO: reset paper dimensions?

        this.yOffset = this.yOffsetDefault;
            // TODO: modify this (as above) based on changing paper dimensions?

        var targetNode = this.treeData;
        this.drawNode({
            "node": targetNode,
            "domSource": this.domSource,
            "curLeaf": 0,
            "isTargetNode": true,
            "parentNodeX": this.xOffset - (this.nodesWidth * targetNode.treeColumn),   // * node.max_node_depth),
            "currentYoffset": this.yOffset,
            "depthFromTargetNode": 0
        });
    }

    argusObj.drawCycles = function () {
        var curNub;
        var tx, ty, i, j, child, cx, cy, nub;
        var naltparents;
        var parent, px, py, offset, dst1, dst2, dln1, dln2;
        var togglelabel, togglebox, backStackPointer, forwardStackPointer, body;
        var sst, altrelline, dln;
        var bw, bh, altrellabel, altrellabelbox, altrellabeltext;
        var x1, y1, y2;
        var getClickHandlerAltRelLine;
        var getHoverHandlerAltRelLineShow;
        var getHoverHandlerAltRelLineHide;
        var toggleAltRels;
        var getNubLinkHoverHandler;
        var getInfoBoxHoverHandlerShow, getInfoBoxHoverHandlerHide;
        var infobox, nublabelbox, nublinks, linktext, thislink;
        var fontSize = this.minTipRadius * this.fontScalar;
        var curAltRel, curShowAltRelFn, curHideAltRelFn;
        var altRelLineAttr = {
            "stroke": this.altRelColor
        };
        var altrelsset = paper.set();
        altrelsset.hidden = false;

        // create closure so we can affect properties when we hover in/out
        getHoverHandlerAltRelLineShow = function (linetomodify, label, attributes) {
            return function () {
                linetomodify.attr(attributes);
                label.show().toFront();
            };
        };

        getHoverHandlerAltRelLineHide = function (linetomodify, label, attributes) {
            return function () {
                linetomodify.attr(attributes);
                label.hide();
            };
        };

        toggleAltRels = function (altrels) {
            return function () {
                if (altrels.hidden) {
                    altrels.show();
                    altrels.hidden = false;
                } else {
                    altrels.hide();
                    altrels.hidden = true;
                }
            };
        };
        getNubLinkHoverHandler = function (nublinktomodify, attributes) {
            return function () {
                nublinktomodify.attr(attributes);
            };
        };
        getInfoBoxHoverHandlerShow = function (cSet) {
            return function () {
                cSet.show();
                // bring the box to the front of the page
                cSet[1].toFront();
                // put the links in front of the box
                cSet[0].toFront();
            };
        };

        getInfoBoxHoverHandlerHide = function (cSet) {
            return function () {
                cSet.hide();
            };
        };

        // gather controls that should move together
        if (!argusObj.anchoredControls) {
            argusObj.anchoredControls = paper.set();
        }

        var conflictsInView = this.nodesWithCycles.length > 0;
        if (conflictsInView) {
            argusObj.getToggleConflictsHandler = function() {
                return function() {
                    toggleAltRels(altrelsset);
                }
            };
        } else {
            // disable (hide?) the toggle gadget
            argusObj.getToggleConflictsHandler = function() {
                return null;
            };
        }

        /*
        tx = this.toggleAltBoxX;
        ty = this.toggleAltBoxY;

        var conflictLabel = "Show or hide conflicting relationships in this view";
        var disabledConflictLabel = "No conflicting relationships in this view";
        var toggleHeight = this.nodeHeight * 1.5;
        togglebox = paper.rect(tx, ty, this.nodesWidth, toggleHeight).attr({
            "stroke": "black",
            "stroke-width": 1,
            "fill": this.bgColor,
            "fill-opacity": 0.6,
            "r": 4,  // rounded corner (radius)
            "cursor": "pointer",
            "title": (conflictsInView) ? conflictLabel : disabledConflictLabel,
            "opacity": (conflictsInView) ? 1.0 : 0.4
        }).insertAfter(dividerBeforeAnchoredUI)
          .click(toggleAltRels(altrelsset));

        argusObj.anchoredControls.push(togglebox);

        togglelabel = paper.text(tx + (this.nodesWidth/2),
                                 ty + (toggleHeight / 2),
                                 "Toggle conflicts").attr({
            "cursor": "pointer",
            "text-anchor": "middle",
            "font-size": fontSize,
            "title": (conflictsInView) ? conflictLabel : disabledConflictLabel,
            "opacity": (conflictsInView) ? 1.0 : 0.4
        }).insertAfter(dividerBeforeAnchoredUI);

        // label on top needs identical action as box
        togglelabel.click(toggleAltRels(altrelsset));
        argusObj.anchoredControls.push(togglelabel);
        */

        /* These are just under-powered history, remove them for now..
        // add clickable Back and Forward pointers (now redundant with browser Back/Fwd buttons)
        backStackPointer = forwardStackPointer = null;
        backStackPointer = paper.path("M21.871,9.814 15.684,16.001 21.871,22.188 18.335,25.725 8.612,16.001 18.335,6.276z")
            .attr({
                fill: "#000",
                stroke: "none",
                cursor: "pointer",
                title: (argusObj.backStack.length > 0) ? "Show the previous view in history" : "No previous views in history",
                opacity: (argusObj.backStack.length > 0) ? 1.0 : 0.3
            });
        if (argusObj.backStack.length > 0) {
            backStackPointer.click(getBackClickHandler());
        }
        argusObj.anchoredControls.push(backStackPointer);

        forwardStackPointer = paper.path("M30.129,22.186 36.316,15.999 30.129,9.812 33.665,6.276 43.389,15.999 33.665,25.725z")
            .attr({
                fill: "#000",
                stroke: "none",
                cursor: "pointer",
                title: (argusObj.forwardStack.length > 0) ? "Show the next view in history" : "No later views in history",
                opacity: (argusObj.forwardStack.length > 0) ? 1.0 : 0.3
            });
        if (argusObj.forwardStack.length > 0) {
            forwardStackPointer.click(getForwardClickHandler());
        }
        argusObj.anchoredControls.push(forwardStackPointer);
        */

        /* Let's try to anchor some widgets in the upper left corner of the
         * argus viewport. That means it needs to track the scroll of the
         * viewport (container) instead of the page body.
         */
        var $argusContainer = $(this.container);
        $argusContainer.bind("scroll", function () {
            // use relative transformation to match the viewport's X/Y scrolling
            argusObj.anchoredControls.transform('t' + $argusContainer.scrollLeft() + ',' + $argusContainer.scrollTop());
            argusObj.anchoredControls.toFront();
        });
        // center the view on the target node
        $argusContainer.scrollTop((this.targetNodeY) - ($argusContainer.height() / 2));

        // disable default right-click behavior in the argus view
        $argusContainer.bind("contextmenu", function (e) {
            e.preventDefault();
            return false;
        });

        // for each node found to have more than one parent
        for (i = 0; i < this.nodesWithCycles.length; i++) {

            // this node is the child
            child = this.nodesHash[this.nodesWithCycles[i]];
            cx = child.x;
            cy = child.y;

            // initialize nub object; it will contain links to topologies not present in the current tree
            nub = {};
            nub.nodes = [];

            // for each alternative parent
            naltparents = child.altrels.length;
            for (j = 0; j < naltparents; j++) {
                // try to find this parent in the current tree
                curAltRel = child.altrels[j];
                parent = this.nodesHash[curAltRel.parentid];
                if (parent === undefined) {
                     // if the parent isn't in this tree, put it in the nub
                    nub.nodes.push(curAltRel);
                } else {
                    // the parent is in the tree; get its coordinates
                    px = parent.x;
                    py = parent.y;

                    // if the parent and child are vertically aligned, draw an offset line between them
                    if (px === cx) {
                        x1 = cx - this.minTipRadius;
                        if (py > cy) {
                            offset = Math.abs(cx - x1);
                            y1 = cy + offset;
                            y2 = py - offset;
                        } else {
                            offset = Math.abs(cx - x1);
                            y1 = cy - offset;
                            y2 = py + offset;
                        }

                        // short diagonal connectors
                        dst1 = "M" + cx + " " + cy + "L" + x1 + " " + y1;
                        dst2 = "M" + x1 + " " + y2 + "L" + px + " " + py;
                        dln1 = paper.path(dst1).attr(altRelLineAttr);
                        dln2 = paper.path(dst2).attr(altRelLineAttr);
                        altrelsset.push(dln1);
                        altrelsset.push(dln2);

                        // main vertical line
                        sst = "M" + x1 + " " + y1 + "L" + x1 + " " + y2;
                        altrelline = paper.path(sst).attr(altRelLineAttr);

                        // if the parent and child are not vertically aligned, draw a straight line between them
                    } else {
                        dln = "M" + cx + " " + cy + "L" + px + " " + py;
                        altrelline = paper.path(dln).attr(altRelLineAttr);
                    }
                    altrelsset.push(altrelline);

                    bw = 60;
                    bh = this.nodeHeight;

                    altrellabel = paper.set();
                    altrellabelbox = paper.rect((cx + px) / 2 - bw / 2,
                                                (cy + py) / 2 - bh / 2,
                                                bw,
                                                bh).attr({
                        "stroke": "black",
                        "fill": "white"
                    }).hide();
                    altrellabeltext = paper.text((cx + px) / 2,
                                                 (cy + py) / 2,
                                                 curAltRel.source).attr({
                        "font-size": fontSize
                    }).hide();
                    altrellabel.push(altrellabelbox);
                    altrellabel.push(altrellabeltext);
                    curShowAltRelFn = getHoverHandlerAltRelLineShow(altrelline,
                                                                    altrellabel,
                                                                    {"stroke-width": 3
                            });
                    curHideAltRelFn = getHoverHandlerAltRelLineHide(altrelline,
                                                                    altrellabel,
                                                                    {"stroke-width": 1
                            });
                    altrelline.hover(curShowAltRelFn, curHideAltRelFn).click(
                        getClickHandlerAltRelLine(curAltRel)
                    );
                }
            }

            // if there are parents not in the current tree, create a nub to represent them
            if (nub.nodes.length > 0) {
                // draw the nub
                nub.x = cx - (this.minTipRadius * this.nubDistScalar);
                nub.y = cy + (this.minTipRadius * this.nubDistScalar);
                nub.line = "M" + cx + " " + cy + "L" + nub.x + " " + nub.y;
                nub.dbr1 = paper.path(nub.line).attr(altRelLineAttr);
                nub.circle = paper.circle(nub.x, nub.y, this.minTipRadius).attr({
                    "fill": this.altPColor,
                    "stroke": this.pathColor
                });

                // calc geometry for the nub info box, which contains links to alt topologies
                infobox = paper.set();
                infobox.w = this.nodesWidth * 2 + (this.xLabelMargin * 2);
                infobox.h = this.nodeHeight * (nub.nodes.length + 1);
                infobox.x = nub.x - infobox.w;
                infobox.y = nub.y;
                // draw the info box container
                nublabelbox = paper.rect(infobox.x, infobox.y, infobox.w, infobox.h).attr({
                    "fill": "white"
                });
                // generate links for the infobox; use a paper.set object so we can easily toggle transparency
                nublinks = paper.set();
                for (j = 0; j < nub.nodes.length; j++) {
                    curNub = nub.nodes[j];
                    // the link labels are the names of the corresponding sources
                    linktext = curNub.parentname + " > " + curNub.source;
                    // links are drawn in a vertical sequence within the infobox container
                    thislink = paper.text(infobox.x + this.xLabelMargin,
                                          (infobox.y + j) * this.nodeHeight,
                                          linktext).attr({
                        "text-anchor": "start",
                        "fill": this.labelColor,
                        "font-size": fontSize
                    }).click(getClickHandlerAltRelLine(curNub));
                    // assign hover behaviors
                    thislink.hover(getNubLinkHoverHandler(thislink, {
                        "fill": this.altPLinkColor
                    }), getNubLinkHoverHandler(thislink, {
                        "fill": "black"
                    }));

                    nublinks.push(thislink);
                }

                // add links and infobox container to the infobox object, hide it from view
                infobox.push(nublinks);
                infobox.push(nublabelbox);
                infobox.hide();
                // assign behaviors
                nub.circle.hover(getInfoBoxHoverHandlerShow(infobox),
                                 getInfoBoxHoverHandlerHide(infobox)
                    );
                infobox.hover(getInfoBoxHoverHandlerShow(infobox),
                              getInfoBoxHoverHandlerHide(infobox)
                    );
            }
        }
    };
    return argusObj;
}

Array.prototype.average = function () {
    "use strict";
    var sum = 0;
    var count = 0;
    var len = this.length;
    var i;
    for (i = 0; i < len; i++) {
        sum += this[i];
        count++;
    }
    return sum / count;
};

function alphaSortByName(a,b) {
    var aName = a.name.toLowerCase(),
        bName = b.name.toLowerCase();
    if (aName > bName) return 1;
    if (aName < bName) return -1;
    return 0;
}
function sortByDescendantCount(a,b) {
    if (a.num_tips > b.num_tips) return 1;
    if (a.num_tips < b.num_tips) return -1;
    return 0;
}

/* Let's deserialize tree-view JSON elements into useful  pseudo-classes. This should
 * simplify management of dynamic layouts, clustering, etc.
 */
function ArgusNode() { // constructor
    // maintain ordered-and-clustered contents?
    this.nodeDepth = 0;  // 0 = root node, higher for descendants
    this.treeColumn = 0; // 0 = rightmost (leaf nodes), higher = further left
    this.displayList = [ ]; // refs to visible nodes and clusters (minimized cluster, or its expanded nodes)
    this.clusters = [ ];
    this.supportedByTaxonomy = false;
    this.supportedByPhylogeny = false;
    // parent IDs will be set during reviver sweep of tree-view JSON
    this.parentNodeID = null;
    // display bounds (mine and my children's) will be set during drawNode
    this.displayBounds = null;
    // X/Y coords will be set during drawNode
    this.x = 0;
    this.y = 0;
};
ArgusNode.prototype.getClusters = function() {
    return argus.clusters[this.node_id] || [ ];
};
ArgusNode.prototype.isLocalLeafNode = function() {
    return (typeof this.children === 'undefined');
};
ArgusNode.prototype.isActualLeafNode = function() {
    return this.num_tips === 0;
};
ArgusNode.prototype.isVisibleLeafNode = function() {
    return this.hasChildren === false || this.num_tips_in_view === 0;
};
ArgusNode.prototype.updateDisplayBounds = function() {
    // update my layout properties and store results (for faster access)
    var topY = this.y - (argus.nodeHeight / 2),
        firstChildY = this.y,
        lastChildY = this.y,
        bottomY = this.y + (argus.nodeHeight / 2),
        middleY = this.y;

    if (this.displayList) {
        var displayListCount = this.displayList.length;
        if (displayListCount > 0) {
            // this should override the minimal bounds above
            topY = 1000000;  // an implausibly high number
            bottomY = 0;
            for (var i = 0; i < displayListCount; i++) {
                var testChild = this.displayList[i];
                topY = Math.min(topY, testChild.displayBounds.topY);
                bottomY = Math.max(bottomY, testChild.displayBounds.bottomY);
                if (i === 0) {
                    firstChildY = testChild.y;
                }
                if (i === displayListCount - 1) {
                    lastChildY = testChild.y;
                }
            }
            middleY = (bottomY + topY) / 2;
        }
    }
    this.displayBounds = {
        topY: topY,
        firstChildY: firstChildY,
        lastChildY: lastChildY,
        bottomY: bottomY,
        middleY: middleY
    };
    return this.displayBounds;
};

function ArgusCluster() { // constructor
    this.nodes = [ ];
    // each cluster is either minimized (default) or expanded
    this.expanded = false;
    // parent ID will be set on creation
    this.parentNodeID = null;
    // display bounds (minimized cluster) will be set during drawNode
    this.displayBounds = null;
    // X/Y coords (minimized cluster) will be set during drawNode
    this.x = 0;
    this.y = 0;
};
ArgusCluster.prototype.updateDisplayBounds = function() {
    // update my layout properties and store results (for faster access)
    this.displayBounds = {
        topY: this.y - (argus.nodeHeight * 0.7),
        bottomY: this.y + (argus.nodeHeight * 1.0)
    };
    return this.displayBounds;
};

function getClientBoundingBox( elementSet ) {
    // Takes a RaphaelJS element set, reckons its full bounding box in
    // page/client coordinates.
    var bbox = {
        x: Number.MAX_VALUE,
        y: Number.MAX_VALUE,
        x2: Number.MIN_VALUE,
        y2: Number.MIN_VALUE
    };
    elementSet.forEach(function(e) {
        var el = e[0];
        var rect = el.getBoundingClientRect();
        bbox.x =  Math.min(bbox.x,  rect.left);
        bbox.x2 = Math.max(bbox.x2, rect.right);
        bbox.y =  Math.min(bbox.y,  rect.top);
        bbox.y2 = Math.max(bbox.y2, rect.bottom);
    });
    bbox.width =  bbox.x2 - bbox.x;
    bbox.height = bbox.y2 - bbox.y;
    return bbox;
}
