/*jslint indent: 4 */
/*globals XMLHttpRequest, Raphael, $, window, location, History, pageUsesHistory, nodeDataLoaded, historyStateToURL, historyStateToWindowTitle*/

// factor function -- gradually going to encapsulate argus functions here for better
//  information hiding and avoiding putting a lot of things into the global namespace
// Attributes of spec:
//      domSource = "ottol"  The name of the source of trees. Currently only "ottol" is supported.
//      nodeID = the ID for the node (according to the system of the service indicated by domSource)
//          if nodeID or domSource are lacking, they will *both* be parsed out of the URL query string (location.search)
//              from nodeid and domsource url-encoded GET parameters. If they are not found there, the defaults are
//              domSource="ottol" and nodeID = "805080"
//      container - DOM element that will contain the argus object
function createArgus(spec) {
    "use strict";
    var o;
    var argusObj;
    var paper;
    // use a series of "empty" elements to organize others by depth
    var dividerBeforeEdges, dividerBeforeLabels, dividerBeforeHighlights, dividerBeforeNodes, dividerBeforeAnchoredUI;

    var getHoverHandlerNode;
    var getHoverHandlerEdge; // ie, a path
    var getClickHandlerNode;
    var getBackClickHandler;
    var getForwardClickHandler;
    var getClickHandlerAltRelLine;
    var getHoverHandlerNodeHighlight;
    var getHoverHandlerEdgeHighlight;
    var getClickHandlerNodeHighlight;
    var getClickHandlerEdgeHighlight;

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
                            if (arg[0] === "nodeid") {
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
        spec.useTreemachine = false; //@TEMP should the default really be taxomachine?
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
        "nodeDiamScalar": 1.5,  // how much internal nodes are scaled by logleafcount
        "nodesWidth": 100, // the distance between parent/child nodes
        "nubDistScalar": 4, // the x/y distance of the nub from its child
        "tipOffset": 300,  // distance from right margin at which leaf nodes are drawn
        "xLabelMargin": 10, // the distance of the labels from the nodes
        "xOffset": 0, // reset in loadData call before drawing nodes
        "yNodeMargin": 4, // whitespace above/below nodes
        "yOffset": 10, // distance from top margin at which topmost nodes are drawn. reset in loadData
        /* colors for the tree view */
        "bgColor": "#f5f5ec",
        "altPColor": "#c69",
        "altPLinkColor": "#900",
        "altRelColor": "#f00",
        "nodeColor": "#8af",
        "nodeHoverColor": "#ff3333",
        "pathColor": "#bb9977",
        "labelColor": "#997766",
        "provenanceHighlightColor": "#ff3333",
        "tipColor": "#14d",
        "tipHoverColor": "#ff3333",
        "currMaxDepth": spec.maxDepth,
        "backStack": [], // args to previous displayNode calls
        "forwardStack": [], // args to displayNode calls after the back button has been clicked
        "currDisplayContext": undefined, //arg to most recent displayNode call
        toggleAltBoxX: 55,
        toggleAltBoxY: 6,
        sourceTextBoxX: 10,
        sourceTextBoxY: 35,
        backArrowX: 10,
        backArrowY: 10,
        anchoredControls: null,
        nodeProvenanceHighlight: null,
        edgeProvenanceHighlight: null,
        highlightedNodeInfo: null,
        highlightedEdgeInfo: null,
        targetNodeY: 0  // used to center the view (vertically) on the target node
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
        //var address = "http://localhost:7474"
        var address;
        var prefix;
        var suffix;
        var url;
        var ds;
        var ajaxData;

        if (this.useTreemachine) {
            address = this.treemachineDomain;
            prefix = address + "/db/data/ext/GoLS/graphdb/";
            if (this.useSyntheticTree) {
                suffix = "getSyntheticTree";
            } else {
                suffix = "getSourceTree";
            }
            url = prefix + suffix;
            // default is the classic "tree 4 in phylografter"
            ds = o.domSource === undefined ? "4" : o.domSource;
            ajaxData = {
                "treeID": ds,
                "format": "arguson",
                "maxDepth": String(this.currMaxDepth)
            };
            if (o.nodeID !== undefined) {
                ajaxData.subtreeNodeID = String(o.nodeID);
            }
        } else {
            address = this.taxomachineDomain;
            prefix = address + "/db/data/ext/GetJsons/node/";
            suffix = "/getConflictTaxJsonAltRel";
            url = prefix + o.nodeID + suffix;
            // @TEMP assuming ottol
            ds = o.domSource === undefined ? "ottol" : o.domSource;
            ajaxData = {"domsource": ds}; // phylotastic TNRS API wants domsource, MTH believes.
        }
        return {
            "url": url,
            "data": ajaxData,
            "httpMethod": "POST", //@TEMP assuming ottol
            "domSource": ds
        };
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
        var ajaxSuccess = function (dataStr, textStatus, jqXHR) {
            var argusObjRef = this;
            argusObjRef.treeData = $.parseJSON(dataStr);
            var node = argusObjRef.treeData[0];

            // recursively populate any missing (implied) node names
            buildAllMissingNodeNames(node);

            var pheight, pwidth, sourcelabel, anchoredbg;

            //spec.container.text("proxy returned data..." + treeData);
            // calculate view-specific geometry parameters
            pheight = ((2 * argusObjRef.minTipRadius) + argusObjRef.yNodeMargin) * (node.nleaves);
            pheight += argusObjRef.nubDistScalar * argusObjRef.minTipRadius;

            // for a narrow tree, push topmost nodes down away from the anchored widgets
            if (pheight > 16 * argusObjRef.nodeHeight) {
                argusObjRef.yOffset = 10;
            } else {
                var topBuffer = 8 * argusObjRef.nodeHeight;
                argusObjRef.yOffset = topBuffer;
                pheight += topBuffer;
            }
            // provide enough room for anchored widgets, more if needed for the tree
            pheight = Math.max(pheight, 20 * argusObjRef.nodeHeight);

            pwidth = argusObjRef.nodesWidth * (node.maxnodedepth + 1);
            pwidth += 1.5 * argusObjRef.tipOffset + argusObjRef.xLabelMargin;

            argusObjRef.xOffset = pwidth - argusObjRef.nodesWidth - argusObjRef.tipOffset;

            if (argusObjRef.container === undefined) {
                paper = new Raphael(10, 10, 10, 10);
            } else {
                paper = new Raphael(argusObjRef.container, 10, 10);
            }
            paper.setSize(pwidth, pheight);
            
            // add dividers before anything else
            dividerBeforeEdges = paper.text().attr({
                "x": 0,
                "y": 0,
                "text": "dividerBeforeEdges"
            })
            dividerBeforeLabels = paper.text().attr({
                "x": 0,
                "y": 0,
                "text": "dividerBeforeLabels"
            })
            dividerBeforeHighlights = paper.text().attr({
                "x": 0,
                "y": 0,
                "text": "dividerBeforeHighlights"
            })
            dividerBeforeNodes = paper.text().attr({
                "x": 0,
                "y": 0,
                "text": "dividerBeforeNodes"
            })
            dividerBeforeAnchoredUI = paper.text().attr({
                "x": 0,
                "y": 0,
                "text": "dividerBeforeAnchoredUI"
            })

            // gather all controls that should anchor to the scrolling viewport
            if (!argusObj.anchoredControls) {
                argusObj.anchoredControls = paper.set();
            }

            /* 
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
            argusObj.nodeProvenanceHighlight = paper.set();
            argusObj.nodeProvenanceHighlight.push(
              // Draw a lozenge shape, centered on its right focus
              // see http://www.w3.org/TR/SVG/paths.html#PathDataEllipticalArcCommands
                paper.path('M -20,-7.5 L 0,-7.5  A 7.5,7.5 0 0,1 0,7.5  L -20,7.5  A 7.5,7.5 0 0,1 -20,-7.5  Z').attr({
                    "x": 0,
                    "y": 0,
                    "stroke": argusObj.provenanceHighlightColor,
                    "title": "Click to see properties for this node", // add name?
                    "stroke-width": "2px",
                    "fill": "white"
                }).insertBefore(dividerBeforeNodes)
            );
            argusObj.nodeProvenanceHighlight.push(
                paper.text().attr({
                    "x": -20,
                    "y": 0,
                    "text": "?",
                    "title": "Click to see properties for this node", // add name?
                    "text-anchor": "middle",
                    "fill": argusObj.provenanceHighlightColor,
                    "font-weight": "bold",
                    "font-size": 12 
                }).insertBefore(dividerBeforeNodes)
            );
            // hide until user rolls over a node
            argusObj.nodeProvenanceHighlight.hide();

            argusObj.nodeProvenanceHighlight.hover(
                getHoverHandlerNodeHighlight('OVER', argusObj.nodeProvenanceHighlight, {}), 
                getHoverHandlerNodeHighlight('OUT', argusObj.nodeProvenanceHighlight, { })
            );
            argusObj.nodeProvenanceHighlight.click(
                // note that the target node's info is available as argusObj.highlightedNodeInfo
                getClickHandlerNodeHighlight()
            );


            argusObj.edgeProvenanceHighlight = paper.set();
            // rect to allow scaling (vs path)
            argusObj.edgeProvenanceHighlight.push(
                paper.rect().attr({
                    "x": -50,
                    "y": -2,
                    "width": 100,
                    "height": 4,
                    "fill": argusObj.provenanceHighlightColor,
                    "title": "Click to see properties for this edge",
                    "stroke": "none"
                }).insertBefore(dividerBeforeNodes)
            );
            argusObj.edgeProvenanceHighlight.push(
                // Draw a circle or smaller lozenge shape
                paper.circle(0, 0, 7.5).attr({
                    "x": 0,
                    "y": 0,
                    "title": "Click to see properties for this edge",
                    "stroke": argusObj.provenanceHighlightColor,
                    "stroke-width": "2px",
                    "fill": "white"
                }).insertBefore(dividerBeforeNodes)
            );
            argusObj.edgeProvenanceHighlight.push(
                paper.text().attr({
                    "x": 0,
                    "y": 0,
                    "text": "?",
                    "title": "Click to see properties for this edge",
                    "text-anchor": "middle",
                    "fill": argusObj.provenanceHighlightColor,
                    "font-weight": "bold",
                    "font-size": 12 
                }).insertBefore(dividerBeforeNodes)
            );
            // hide until user rolls over an edge
            argusObj.edgeProvenanceHighlight.hide();
            
            argusObj.edgeProvenanceHighlight.hover(
                getHoverHandlerEdgeHighlight('OVER', argusObj.edgeProvenanceHighlight, {}), 
                getHoverHandlerEdgeHighlight('OUT', argusObj.edgeProvenanceHighlight, { })
            );
            argusObj.edgeProvenanceHighlight.click(
                // note that the target edge's info is available as argusObj.highlightedEdgeInfo
                getClickHandlerEdgeHighlight()
            );

            // refresh tree
            argusObjRef.nodesHash = {};
            argusObjRef.nodesWithCycles = [];
            // draw the tree
            argusObjRef.drawNode({
                "node": node,
                "domSource": domSource,
                "curLeaf": 0,
                "isTargetNode": true 
            });

            // Release the forced height of the argus viewport
            $(this.container).css('height', '');

            // if there's a page-level callback function, call it now
            if (typeof nodeDataLoaded === 'function') {
                nodeDataLoaded(node);
            }

            // draw the cycles
            argusObjRef.drawCycles();
        };
        $.ajax({
            url: o.url,
            type: o.httpMethod === undefined ? "POST" : o.httpMethod,
            dataType: 'json',
            data: dataStr,
            context: argusObj,
            crossDomain: true,
            contentType: 'application/json',
            success: ajaxSuccess,
            error: function (jqXHR, textStatus, errorThrown) {
                $(".flash").html("Error: Node lookup failed").slideDown();
                $(this.container).html('<p style="margin: 8px 12px;">Whoops! The call to get the tree around a node did not work out the way we were hoping it would. That is a real shame.  I\'m not sure what to suggest...</p>');
            }
        });
    };

    argusObj.moveToNode = function (o) {
        // if we're using History.js, all movement through the tree should be driven from history
        if (History && History.enabled && "pageUsesHistory" in window && pageUsesHistory) {
            // add expected values for minimal history entry
            var stateObj = $.extend(true, {'nodeName': ''}, o); // deep copy of o, with default values if none supplied
            History.pushState(stateObj, historyStateToWindowTitle(stateObj), historyStateToURL(stateObj));
        } else {
            // proceed directly to display (ignore browser history)
            this.displayNode(o);
        }
    };

    argusObj.displayNode = function (o) {
        // update argus' domSource to reflect that of the new target node?
        //console.log("BEFORE, domSource was: "+ this.domSource);
        this.domSource = (o.domSource === undefined) ? this.domSource : o.domSource;
        //console.log("AFTER, domSource is: "+ this.domSource);

        var ajaxInfo = this.buildAjaxCallInfo({
            "nodeID": o.nodeID,
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
        return this;
    };

    // create closure to access node attributes when hovering in/out
    getHoverHandlerNode = function (hoverState, circle, shapeAttributes, nodeInfo) {
        var nodeCircle = circle;
        return function () {
            nodeCircle.attr(shapeAttributes);
            switch (hoverState) {
                case 'OVER':
                    // copy source-node values from the target node to the highlight
                    var srcInfo = $.extend(true, {}, nodeCircle.data('sourceNodeInfo'));

                    argusObj.highlightedNodeInfo = srcInfo;
                    
                    // hide any stale *edge* highlight
                    argusObj.edgeProvenanceHighlight.hide();

                    // move the highlight to this node
                    argusObj.nodeProvenanceHighlight.transform('t' + nodeCircle.attr('cx') + ',' + nodeCircle.attr('cy'));
                    argusObj.nodeProvenanceHighlight.show();
                    break;
                case 'OUT':
                    // do nothing for now
                    break;
                default:
                    console.log('Unexpected value for hoverState: '+ hoverState);
            }
        };
    };
    getHoverHandlerNodeHighlight = function (hoverState, highlight, shapeAttributes, highlightInfo) {
        var nodeHighlight = highlight;
        return function (evt) {
            switch (hoverState) {
                case 'OVER':
                    nodeHighlight.attr(shapeAttributes);
                    break;
                case 'OUT':
                    // are we REALLY out side the lozenge, or just over the text?
                      
                    // remap page-based mouse coordinates to the canvas
                    var localX = evt.pageX - $('#argusCanvasContainer').offset().left + $('#argusCanvasContainer').scrollLeft();
                    var localY = evt.pageY - $('#argusCanvasContainer').offset().top  + $('#argusCanvasContainer').scrollTop();

                    var bbox = argusObj.nodeProvenanceHighlight.getBBox(); // bounding box
                    
                    if (Raphael.isPointInsideBBox( bbox, localX, localY )) {
                        // false alarm, it's just moved over text or the node circle
                        return;
                    }

                    nodeHighlight.attr(shapeAttributes);
                    // hide the node highlight
                    argusObj.nodeProvenanceHighlight.hide();
                    break;
                default:
                    console.log('Unexpected value for hoverState (node highlight): '+ hoverState);
            }
        };
    }
    getHoverHandlerEdge = function (hoverState, path, shapeAttributes, edgeInfo) {
        var edgePath = path;
        return function () {
            edgePath.attr(shapeAttributes);
            switch (hoverState) {
                case 'OVER':
                    // copy source-node values from the target edge to the highlight
                    var srcInfo = $.extend(true, {'type':'edge'}, edgePath.data('sourceNodeInfo'));

                    argusObj.highlightedEdgeInfo = srcInfo;
                    
                    // hide any stale *node* highlight
                    argusObj.nodeProvenanceHighlight.hide();

                    // move the highlight to this edge
                    // no easy x/y attributes for a path, need to use its bounding box
                    var bbox = edgePath.getBBox(false);

                    argusObj.edgeProvenanceHighlight.forEach(function(element) {
                        if (element.type == 'rect') {
                            var xScale = (bbox.width / 100); 
                            var pathScale = 'S '+ xScale +',1  t' + ((bbox.x + (bbox.width / 2.0)) / xScale) + ',' + bbox.y;
                                // 100 is the natural width of the hilight path
                            element.transform(pathScale);
                        } else {
                            element.transform('t' + (bbox.x + (bbox.width / 2.0)) + ',' + bbox.y);
                        }
                    });
                    argusObj.edgeProvenanceHighlight.show();

                    break;
                case 'OUT':
                    // do nothing for now
                    break;
                default:
                    console.log('Unexpected value for hoverState: '+ hoverState);
            }
        };
    };
    getHoverHandlerEdgeHighlight = function (hoverState, highlight, shapeAttributes, highlightInfo) {
        var edgeHighlight = highlight;
        return function (evt) {
            edgeHighlight.attr(shapeAttributes);
            switch (hoverState) {
                case 'OVER':
                    break;
                case 'OUT':
                    // are we REALLY outside the lozenge and bar, or just over the text?
                      
                    // remap page-based mouse coordinates to the canvas
                    var localX = evt.pageX - $('#argusCanvasContainer').offset().left + $('#argusCanvasContainer').scrollLeft();
                    var localY = evt.pageY - $('#argusCanvasContainer').offset().top  + $('#argusCanvasContainer').scrollTop();

                    var bbox = argusObj.edgeProvenanceHighlight.getBBox(); // bounding box
                    
                    if (Raphael.isPointInsideBBox( bbox, localX, localY )) {
                        // false alarm, it's just moved over text or the node circle
                        return;
                    }

                    // hide the edge highlight
                    argusObj.edgeProvenanceHighlight.hide();
                    break;
                default:
                    console.log('Unexpected value for hoverState (edge highlight): '+ hoverState);
            }
        };
    }
    getClickHandlerNode = function (nodeID, domSource, nodeName) {
        return function () {
            argusObj.moveToNode({"nodeID": nodeID,
                                 "domSource": domSource,
                                 "nodeName": nodeName});
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
    getClickHandlerNodeHighlight = function () {
        return function () {
            // use source-node values copied from the target node
            console.log(">>> showing highlighted node info...");
            showObjectProperties( argusObj.highlightedNodeInfo );
        };
    };
    getClickHandlerEdgeHighlight = function () {
        return function () {
            // use source-node values copied from the target edge
            console.log(">>> showing highlighted edge info...");
            showObjectProperties( argusObj.highlightedEdgeInfo );
        };
    };

    // recursive function to draw nodes and branches for the "dominant" tree (the domSource)
    argusObj.drawNode = function (obj) {
        var node = obj.node;
        var isTargetNode = obj.isTargetNode;
        var domSource = obj.domSource;
        var curLeaf = obj.curLeaf;
        var nchildren;
        var circle;
        var label;
        var i;
        var childxs;
        var childys;
        var visiblePath, triggerPath;
        var branchSt;
        var fontSize = this.minTipRadius * this.fontScalar;
        var upwardSt;
        var spineSt;
        var nAltParents;

        // if this node has no children then we have hit a leaf
        nchildren = (node.children === undefined ? 0 : node.children.length);
        if (nchildren === 0) {
            // leaves are drawn at the rightmost x-coord, incrementally from the topmost y-coord
            node.x = this.xOffset;
            node.y = (curLeaf * this.nodeHeight) + this.yOffset;

            // draw the node
            var isActualLeafNode = node.hasChildren === false || node.nleaves === 0;
            circle = paper.circle(node.x, node.y, isActualLeafNode ? (this.minTipRadius * 0.7) : this.minTipRadius).attr({
                "fill": ((isTargetNode || isActualLeafNode) ? this.bgColor : this.tipColor),
                "title": "Click to move to this node",
                "stroke": this.pathColor
            }).insertBefore(dividerBeforeAnchoredUI);

            label = paper.text(node.x + this.xLabelMargin, node.y, node.name).attr({
                'text-anchor': 'start',
                "fill": this.labelColor,
                "font-size": fontSize
            }).insertBefore(dividerBeforeHighlights);

            circle.hover(getHoverHandlerNode('OVER', circle, {
                "fill": this.tipHoverColor
            }), getHoverHandlerNode('OUT', circle, {
                "fill": (isTargetNode || isActualLeafNode) ? this.bgColor : this.tipColor
            }));

            curLeaf++;

            // if the node has children then it is internal
        } else {
            childxs = [];
            childys = [];
            for (i = 0; i < nchildren; i++) {
                // postorder traverse the children of this node
                curLeaf = this.drawNode({
                    "node": node.children[i],
                    "domSource": domSource,
                    "curLeaf": curLeaf,
                    "isTargetNode": false
                });

                // the traversal generated the childrens' coordinates; now get them
                if (isNumeric(node.children[i].x)) {
                    childxs.push(node.children[i].x);
                }
                if (isNumeric(node.children[i].y)) {
                    childys.push(node.children[i].y);
                }
            }

            // calculate this node's coordinates based on the positions of its children
            node.x = Math.min.apply(null, childxs) - this.nodesWidth; // use this line for square trees
            node.y = childys.average();

            // scale size of node circle by number of contained leaves
            node.r = this.minTipRadius + this.nodeDiamScalar * Math.log(node.nleaves);

            // draw node circle
            label = paper.text(node.x - node.r, node.y + node.r, node.name).attr({
                'text-anchor': 'end',
                "fill": this.labelColor,
                "font-size": fontSize
            }).insertBefore(dividerBeforeHighlights);
            circle = paper.circle(node.x, node.y, node.r).attr({
                "fill": (isTargetNode ? this.pathColor : this.nodeColor),
                "title": "Click to move to this node",
                "stroke": this.pathColor
            }).insertBefore(dividerBeforeAnchoredUI);

            // assign hover behaviors
            circle.hover(getHoverHandlerNode('OVER', circle, {
                "fill": this.nodeHoverColor
            }), getHoverHandlerNode('OUT', circle, {
                "fill": (isTargetNode ? this.pathColor : this.nodeColor)
            }));

            // draw branches (square tree)
            spineSt = "M" + node.x + " " + node.children[0].y + "L" + node.x + " " + node.children[nchildren - 1].y;
            paper.path(spineSt).toBack().attr({
                "stroke": this.pathColor
            }).insertBefore(dividerBeforeLabels);
            for (i = 0; i < nchildren; i++) {
                branchSt = "M" + node.x + " " + node.children[i].y + "L" + node.children[i].x + " " + node.children[i].y;
                
                // draw a wide, invisible path to detect mouse-over
                triggerPath = paper.path(branchSt).toBack().attr({
                    "stroke-width": "5px",
                    "stroke": this.bgColor
                }).insertAfter(dividerBeforeEdges);
                // NOTE that these are pushed behind all visible paths!
                
                // ... and a congruent, visible path
                visiblePath = paper.path(branchSt).toBack().attr({
                    "stroke-width": "1px",
                    "stroke": this.pathColor
                }).insertBefore(dividerBeforeLabels);
                
                // assign hover behaviors
                triggerPath.hover(getHoverHandlerEdge('OVER', triggerPath, {}), getHoverHandlerEdge('OUT', triggerPath, {}));

                // copy nth child node's data into the path element (for use by highlight)
                triggerPath.data('sourceNodeInfo', {
                    'nodeID': node.children[i].nodeid,
                    'nodeName': node.children[i].name,
                    'domSource': domSource
                });
            }
        }
        if (isTargetNode) {
            this.targetNodeY = node.y;

            if (node.pathToRoot) {
                // try to draw upward path w/ up to 3 nodes, plus trailing edge if there's more
                var upwardNode;
                var maxUpwardNodes = 3;
                var alphaStep = 0.15;
                var xyStep = 25;
                for (i = 0; i < node.pathToRoot.length; i++) {
                    var startX = node.x - (xyStep * i);
                    var startY = node.y - (xyStep * i);
                    var endX = startX - xyStep;
                    var endY = startY - xyStep;
                    var pathOpacity = 1.0 - (alphaStep * (i+1));

                    upwardSt = "M" + startX+ "," + startY + "L" + endX + " " + endY;
                    paper.path(upwardSt).toBack().attr({
                        "stroke": this.pathColor,
                        "stroke-dasharray": '- ',
                        "opacity": pathOpacity
                    }).insertBefore(dividerBeforeLabels);

                    var ancestorNode, ancestorCircle;
                    if (i < maxUpwardNodes) {
                        ancestorNode = node.pathToRoot[i];
                        // draw node circle and label
                        ancestorCircle = paper.circle(endX, endY, this.minTipRadius).attr({
                            "fill": this.nodeColor,
                            "title": "Click to move to this node",
                            "stroke": this.pathColor
                        }).insertBefore(dividerBeforeAnchoredUI);
                        paper.text(endX - (this.minTipRadius * 1.2), endY + (this.minTipRadius * 1.2), ancestorNode.name).attr({
                            'text-anchor': 'end',
                            "fill": this.labelColor,
                            "font-size": fontSize
                        }).insertBefore(dividerBeforeHighlights);

                        // add handlers and metadata
                        ancestorCircle.click(getClickHandlerNode(ancestorNode.nodeid, domSource, ancestorNode.name));
                        // copy source data into the circle element (for use by highlight)
                        ancestorCircle.data('sourceNodeInfo', {
                            'nodeID': ancestorNode.nodeid,
                            'nodeName': ancestorNode.name,
                            'domSource': domSource
                        });
                        ancestorCircle.hover(getHoverHandlerNode('OVER', ancestorCircle, {
                            "fill": this.nodeHoverColor
                        }), getHoverHandlerNode('OUT', ancestorCircle, {
                            "fill": this.nodeColor
                        }));

                    }

                    if (i === maxUpwardNodes) {
                        break; // we've drawn a final path bit, now we're done
                    }
                }

            }
        }

        circle.click(getClickHandlerNode(node.nodeid, domSource, node.name));
        // copy source data into the circle element (for use by highlight)
        circle.data('sourceNodeInfo', {
            'nodeID': node.nodeid,
            'nodeName': node.name,
            'domSource': domSource
        });

        // if this node has cycles, record it; we will draw them once the tree is done
        nAltParents = (node.altrels === undefined ? 0 : node.altrels.length);
        if (nAltParents > 0) {
            this.nodesWithCycles.push(node.nodeid);
        }
        // store the node for fast access later
        this.nodesHash[node.nodeid] = node;
        return curLeaf;
    };


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

        tx = this.toggleAltBoxX;
        ty = this.toggleAltBoxY;
        var conflictsInView = this.nodesWithCycles.length > 0;

        var conflictLabel = "Show or hide conflicting relationships in this view";
        var disabledConflictLabel = "No conflicting relationships in this view";
        var toggleHeight = this.nodeHeight * 1.5;
        togglebox = paper.rect(tx, ty, this.nodesWidth, toggleHeight).attr({
            "stroke": "black",
            "stroke-width": "1px",
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
                                                                    {"stroke-width": "3px"
                            });
                    curHideAltRelFn = getHoverHandlerAltRelLineHide(altrelline,
                                                                    altrellabel,
                                                                    {"stroke-width": "1px"
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
