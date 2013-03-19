/*jslint indent: 4 */
/*globals XMLHttpRequest, Raphael, $, window, location */

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
    var o;
    var argusObj;
    var paper;

    var getHoverHandlerNode;
    var getClickHandlerNode;
    var getClickHandlerAltRelLine;

    var isNumeric = function (n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    };

    // helper function to create the URL and arg to be passed to URL. 
    //  Argument:
    //      o.nodeID
    //      o.domSource (default "ottol")  @TEMP will need to be modified for cases when ottol is not the value
    //      o.httpMethod (defaul "POST")
    //  Return an object with
    //      url -- URL for ajax call
    //      data -- object to be sent to the server
    //      httpMethod -- (currently "POST")
    var buildAjaxCallInfo = function (o) {
        //var address = "http://localhost:7474"
        var address = "http://opentree-dev.bio.ku.edu:7476";
        var prefix = address + "/db/data/ext/GetJsons/node/";
        var suffix = "/getConflictTaxJsonAltRel";
        // @TEMP assuming ottol
        var url = prefix + o.nodeID + suffix;
        var ds = o.domSource === undefined ? "ottol" : o.domSource;
        var ajaxData = {"domsource": ds}; // phylotastic TNRS API wants domsource, MTH believes.
        return {
            "url": url,
            "data": ajaxData,
            "httpMethod": "POST", //@TEMP assuming ottol
            "domSource": ds
        };
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
        spec.container = $("body");
    }
    argusObj = {
        "nodeID": spec.nodeID,
        "domSource": spec.domSource,
        "container": spec.container,
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
        "altPColor": "#c69",
        "altPLinkColor": "#900",
        "altRelColor": "#f00",
        "nodeColor": "#8af",
        "nodeHoverColor": "#bdf",
        "tipColor": "#14d",
        "tipHoverColor": "#b8f"
    };
    argusObj.nodeHeight = (2 * argusObj.minTipRadius) + argusObj.yNodeMargin;
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
            var treedata = $.parseJSON(dataStr);
            var node = treedata[0];
            var pheight, pwidth, xOffset, sourcelabel;
            //spec.container.text("proxy returned data..." + treedata);
            // calculate view-specific geometry parameters
            pheight = ((2 * argusObjRef.minTipRadius) + argusObjRef.yNodeMargin) * (node.nleaves);
            pheight += argusObjRef.nubDistScalar * argusObjRef.minTipRadius;
            pheight += 40 * argusObjRef.nodeHeight; //@TEMP not sure what 40 is for...

            pwidth = argusObjRef.nodesWidth * (node.maxnodedepth + 1);
            pwidth += 1.5 * argusObjRef.tipOffset + argusObjRef.xLabelMargin;
            argusObjRef.xOffset = pwidth - argusObjRef.nodesWidth - argusObjRef.tipOffset;
            argusObjRef.yOffset = 10;

            if (argusObjRef.container === undefined) {
                paper = new Raphael(10, 10, 10, 10);
            } else {
                paper = new Raphael(argusObjRef.container, 10, 10);
            }
            paper.setSize(pwidth, pheight);
            sourcelabel = paper.text(10, 10, "source: " + domSource).attr({
                "font-size": String(argusObjRef.fontScalar * argusObjRef.minTipRadius) + "px",
                "text-anchor": "start"
            });

            // refresh tree
            argusObjRef.nodesHash = {};
            argusObjRef.nodesWithCycles = [];
            // draw the tree
            argusObjRef.drawNode({
                "node": node,
                "domSource": domSource,
                "curLeaf": 0
            });

            // draw the cylces
            argusObjRef.drawCycles({
                "node": node,
                "domSource": domSource
            });
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
                spec.container.text("Whoops! The call to get the tree around a node did not work out the way we were hoping it would. That is a real shame.  I'm not sure what to suggest...");
            }
        });
    };

    argusObj.displayNode = function (nodeID, domSource) {
        var ajaxInfo = buildAjaxCallInfo({
            "nodeID": nodeID,
            "domSource": (domSource === undefined ? this.domSource : domSource)
        });
        if (paper !== undefined) {
            paper.clear();
            paper.remove();
        }
        this.nodeID = nodeID;
        this.loadData(ajaxInfo);
        return this;
    };

    // create closure to access node attributes when hovering in/out
    getHoverHandlerNode = function (circle, attributes) {
        var nodeCircle = circle;
        return function () {
            nodeCircle.attr(attributes);
        };
    };
    getClickHandlerNode = function (nodeID, domSource) {
        return function () {
            argusObj.displayNode(nodeID, domSource);
        };
    };

    getClickHandlerAltRelLine = function (nodeFromAJAX) {
        /* at some point we will probably want to retain a history of preferred altrelationships, etc.
         * these should be stored/retrieved from a base-level query info object that is passed back
         * and forth from the server. for now we are just keeping things simple and not remembering
         * anything about previous relationships.
         *                  var altrelids = // get altrels ;
         *                  altrelids.push(child.altrels[j].altrelid); */
        var focalnodeid = nodeFromAJAX.parentid;
        return function () {
            argusObj.displayNode(nodeFromAJAX.parentid, nodeFromAJAX.source);
        };
    };

    // recursive function to draw nodes and branches for the "dominant" tree (the domSource)
    argusObj.drawNode = function (obj) {
        var node = obj.node;
        var domSource = obj.domSource;
        var curLeaf = obj.curLeaf;
        var nchildren;
        var circle;
        var label;
        var i;
        var childxs;
        var childys;
        var branchSt;
        var fontSize = this.minTipRadius * this.fontScalar;
        var spineSt;
        var nAltParents;

        // if this node has no children then we have hit a leaf
        nchildren = (node.children === undefined ? 0 : node.children.length);
        if (nchildren === 0) {
            // leaves are drawn at the rightmost x-coord, incrementally from the topmost y-coord
            node.x = this.xOffset;
            node.y = (curLeaf * this.nodeHeight) + this.yOffset;

            // draw the node
            circle = paper.circle(node.x, node.y, this.minTipRadius).attr({
                "fill": this.tipColor
            }).toFront();
            label = paper.text(node.x + this.xLabelMargin, node.y, node.name).attr({
                'text-anchor': 'start',
                "font-size": fontSize
            });

            circle.hover(getHoverHandlerNode(circle, {
                "fill": this.tipHoverColor
            }), getHoverHandlerNode(circle, {
                "fill": this.tipColor
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
                    "curLeaf": curLeaf
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
                "font-size": fontSize
            });
            circle = paper.circle(node.x, node.y, node.r).attr({
                "fill": this.nodeColor
            });

            // assign hover behaviors
            circle.hover(getHoverHandlerNode(circle, {
                "fill": this.nodeHoverColor
            }), getHoverHandlerNode(circle, {
                "fill": this.nodeColor
            }));

            // draw branches (square tree)
            spineSt = "M" + node.x + " " + node.children[0].y + "L" + node.x + " " + node.children[nchildren - 1].y;
            paper.path(spineSt).toBack();
            for (i = 0; i < nchildren; i++) {
                branchSt = "M" + node.x + " " + node.children[i].y + "L" + node.children[i].x + " " + node.children[i].y;
                paper.path(branchSt).toBack();
            }
        }

        circle.click(getClickHandlerNode(node.nodeid, domSource));

        // if this node has cycles, record it; we will draw them once the tree is done
        nAltParents = (node.altrels === undefined ? 0 : node.altrels.length);
        if (nAltParents > 0) {
            this.nodesWithCycles.push(node.nodeid);
        }
        // store the node for fast access later
        this.nodesHash[node.nodeid] = node;
        return curLeaf;
    };


    argusObj.drawCycles = function (obj) {
        var node = obj.node;
        var domSource = obj.domSource;
        var curNub;
        var tx, ty, i, j, child, cx, cy, nub;
        var naltparents;
        var parent, px, py, offset, dst1, dst2, dln1, dln2;
        var togglelabel, togglebox, body;
        var sst, altrelline, dln;
        var bw, bh, altrellabel, altrellabelbox, altrellabeltext;
        var x1, y1, x2, y2;
        var getClickHandlerAltRelLine;
        var getHoverHandlerAltRelLineShow;
        var getHoverHandlerAltRelLineHide;
        var toggleAltRels;
        var getClickHandlerNubRelLink, getNubLinkHoverHandler;
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


        tx = 10;
        ty = 30;
        togglelabel = paper.text(tx + this.minTipRadius,
                                 ty + this.nodeHeight * 0.95,
                                 "toggle alt rels").attr({
            "text-anchor": "start",
            "font-size": fontSize
        });

        togglebox = paper.rect(tx, ty, this.nodesWidth, this.nodeHeight * 2).attr({
            "stroke": "black",
            "stroke-width": "1px",
            "fill": "white",
            "fill-opacity": 0
        }).click(toggleAltRels(altrelsset));

        body = this.container; // this used to be $(body) instead of this.container. Which is correct
        $(window).bind("scroll", function () {
            togglebox.animate({
                "y": body.scrollTop() + ty
            }, 200);
            togglelabel.animate({
                "y": body.scrollTop() + ty + this.nodeHeight
            }, 200);
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
                    "fill": this.altPColor
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
