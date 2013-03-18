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
var createArgus = function (spec) {
    var o;
    var argusObj;
    var paper;
    var getHoverHandlerNode;
    var getClickHandlerNode;
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

            if (spec.container === undefined) {
                paper = new Raphael(10, 10, 10, 10);
            } else {
                paper = new Raphael(spec.container, 10, 10);
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
            argusObjRef.drawCycles(treedata[0].children[0].nodeid);
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

    argusObj.drawNode = function (obj) {
        // if isfirst is undefined, then this is the root of a new tree; reset counters/containers
        var nchildren;
        var circle;
        var label;
        var i;
        var childxs;
        var childys;
        var branchSt;
        var node = obj.node;
        var domSource = obj.domSource;
        var curLeaf = obj.curLeaf;
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
    return argusObj;
};

var paper; // raphael canvas object
var curLeaf; // absolute leaf counter used in geometry
var nodesHash;
var nodesWithCycles;

// ------------------ begin geometry --------------------

// primary height scalar (also text size, node size, etc.)
var r = 5; // the minimum radius of the node/tip circles
// primary width scalar 
var nodesWidth = 100; // the distance between parent/child nodes

var nubDistScalar = 4; // the x/y distance of the nub from its child
var fontScalar = 2.6; // multiplied by radius to set font size
var nodeDiamScalar = 1.5; // how much nodes are scaled by logleafcount
var tipOffset = 300; // distance from right margin at which leaf nodes are drawn
var yNodeMargin = 4; // whitespace above/below nodes
var yOffset = 10; // distance from top margin at which topmost nodes are drawn
var xLabelMargin = 10; // the distance of the labels from the nodes
var nodeHeight = 2 * r + yNodeMargin;

/* coordinates determining where the first nodes (i.e. tips) are drawn.
 * these are scaled to the size of the tree, and are set by the loadData()
 * function below. We declare them here to give them global scope */
var xOffset;

// ------------------- end geometry ---------------------

// colors
var nodeColor = "#8af";
var nodeHoverColor = "#bdf";
var tipColor = "#14d";
var tipHoverColor = "#b8f";
var altRelColor = "#f00";
var altPColor = "#c69";
var altPLinkColor = "#900";

//functions defined in argus:
var drawNode, drawCycles;
// end function list

// this function queries the db and draws the resulting tree.
// 
// @param The `container` arg should be the DOM node that should serve as
//      as the parent element for the canvas

function loadData(argsobj) {

    /* accepts three named arguments:
     *    url               the address to which the HTTP request is sent
     *    jsonquerystring   a json string containing query information
     *    httpMethod            e.g. GET or POST; POST is required for queries to the Neo4J REST service*/

    var url = argsobj.url;
    var jsonquerystr = argsobj.jsonquerystring;
    var httpMethod = argsobj.httpMethod;
    var container = argsobj.container;

    var xobjPost = new XMLHttpRequest();
    xobjPost.open(httpMethod, url, false);
    xobjPost.setRequestHeader("Accept", "");

    /* NOTE: we pass parameters to the REST service by encoding them in a JSON string
     * and sending it through the XMLHttpRequest.send() method. We must specify the
     * format of the incoming data (in this case JSON) with a call to
     * XMLHttpRequest.SetRequestHeader() before we issue the send. */
    xobjPost.setRequestHeader("Content-Type", "application/json");

    xobjPost.onload = function () {

        var jsonrespstr = xobjPost.responseText;
        //    alert(jsonrespstr);
        var treedata = JSON.parse(eval(xobjPost.responseText));

        // calculate view-specific geometry parameters
        var pheight = ((2 * r) + yNodeMargin) * (treedata[0].nleaves) + (nubDistScalar * r) + (40 * nodeHeight);
        var pwidth = nodesWidth * (treedata[0].maxnodedepth + 1) + 1.5 * tipOffset + xLabelMargin;
        xOffset = pwidth - nodesWidth - tipOffset;

        var domsource = treedata[1].domsource;
        if (container === undefined) {
            paper = new Raphael(10, 10, 10, 10);
        } else {
            paper = new Raphael(container, 10, 10);
        }
        paper.setSize(pwidth, pheight);
        var sourcelabel = paper.text(10, 10, "source: " + domsource).attr({
            "font-size": String(fontScalar * r) + "px",
            "text-anchor": "start"
        });

        // draw the tree
        drawNode(treedata[0], domsource);

        // draw the cylces
        drawCycles(treedata[0].children[0].nodeid);
    };

    // TBD: maybe add an 'onerror' handler too

    jsonquerystr = jsonquerystr === "" ? undefined : jsonquerystr;
    xobjPost.send(jsonquerystr);
}


function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function isBlank(str) {
    return (!str || /^\s*$/.test(str));
}

function buildUrl(focalclade) {
    //var address = "http://localhost:7474"
    var address = "http://opentree-dev.bio.ku.edu:7476";
    var prefix = address + "/db/data/ext/GetJsons/node/";
    var suffix = "/getConflictTaxJsonAltRel";
    var url = prefix + focalclade + suffix;
    return url;
}

//@TEMP Shouldn't we just use some builtin for composing JSON?
function buildJSONQuery(argsobj) {

    /* An example JSON query string:
     *
     * '{"domsource":"ncbi","nubrelid":12345,"altrels":[123,124,125]}'
     *
     * much of this is irrelevant at this point. currently the only part of this
     * function in use is the domsource. it will be useful if/when we
     * decide to make queries more complex
     * */

    var previtem = false;
    var json = '{';
    var i;

    if (argsobj.domsource !== undefined) {
        json += '"domsource":"' + argsobj.domsource + '"';
        previtem = true;
    }

    if (argsobj.altrelids !== undefined) {
        if (previtem) {
            json += ",";
        }
        json += '"altrels":[';
        for (i = 0; i < argsobj.altrelids.length; i++) {
            json += argsobj.altrelids[i];
            if (i === argsobj.altrelids.length - 1) {
                json += ']';
            } else {
                json += ',';
            }
        }
        previtem = true;
    }

    if (argsobj.nubrelid !== undefined) {
        if (previtem) {
            json += ",";
        }
        json += '"nubrel":' + argsobj.nubrelid;
    }
    json += '}';
    return json;
}

function drawNode(node, domsource, isfirst) {
    // if isfirst is undefined, then this is the root of a new tree; reset counters/containers
    var nchildren;
    var circle;
    var label;
    var getHoverHandlerNode;
    var getClickHandlerNode;
    var i;
    var childxs;
    var childys;
    var branch;
    var branchSt;

    isfirst = (isfirst !== undefined ? isfirst : true);
    if (isfirst === true) {
        nodesHash = {};
        nodesWithCycles = [];
        isfirst = false;
        curLeaf = 0;
    }

    // if this node has no children then we have hit a leaf
    nchildren = (node.children === undefined ? 0 : node.children.length);
    if (nchildren === 0) {
        // leaves are drawn at the rightmost x-coord, incrementally from the topmost y-coord
        node.x = xOffset;
        node.y = curLeaf * nodeHeight + yOffset;

        // draw the node
        circle = paper.circle(node.x, node.y, r).attr({
            "fill": tipColor
        }).toFront();
        label = paper.text(node.x + xLabelMargin, node.y, node.name).attr({
            'text-anchor': 'start',
            "font-size": r * fontScalar
        });

        // create closure to access node attributes when hovering in/out

        getHoverHandlerNode = function (attributes) {
            var nodeCircle = circle;
            return function () {
                nodeCircle.attr(attributes);
            };
        };

        circle.hover(getHoverHandlerNode({
            "fill": tipHoverColor
        }), getHoverHandlerNode({
            "fill": tipColor
        }));

        curLeaf++;

        // if the node has children then it is internal
    } else {
        childxs = [];
        childys = [];

        for (i = 0; i < nchildren; i++) {
            // postorder traverse the children of this node
            drawNode(node.children[i], domsource, isfirst);

            // the traversal generated the childrens' coordinates; now get them
            if (isNumeric(node.children[i].x)) {
                childxs.push(node.children[i].x);
            }
            if (isNumeric(node.children[i].y)) {
                childys.push(node.children[i].y);
            }
        }

        // calculate this node's coordinates based on the positions of its children
        node.x = Math.min.apply(null, childxs) - nodesWidth; // use this line for square trees
        node.y = childys.average();

        // scale size of node circle by number of contained leaves
        node.r = r + nodeDiamScalar * Math.log(node.nleaves);

        // draw node circle
        label = paper.text(node.x - node.r, node.y + node.r, node.name).attr({
            'text-anchor': 'end',
            "font-size": r * fontScalar
        });
        circle = paper.circle(node.x, node.y, node.r).attr({
            "fill": nodeColor
        });

        // create closures to access node attributes when hovering in/out and clicking

        getHoverHandlerNode = function (attributes) {
            var nodeCircle = circle;
            return function () {
                nodeCircle.attr(attributes);
            };
        };

        // assign hover behaviors
        circle.hover(getHoverHandlerNode({
            "fill": nodeHoverColor
        }), getHoverHandlerNode({
            "fill": nodeColor
        }));

        // draw branches (square tree)
        var spine_st = "M" + node.x + " " + node.children[0].y + "L" + node.x + " " + node.children[nchildren - 1].y;
        paper.path(spine_st).toBack();
        for (i = 0; i < nchildren; i++) {
            branchSt = "M" + node.x + " " + node.children[i].y + "L" + node.children[i].x + " " + node.children[i].y;
            branch = paper.path(branchSt).toBack();
        }
    }

    getClickHandlerNode = function () {
        var thisnode = node;
        return function () {
            paper.clear();

            /* at some point we will probably want to retain a history of preferred alt relationships, etc.
             * these should be stored/retrieved from a base-level query info object that is passed back
             * and forth from the server. for now we are just keeping things simple and not remembering
             * anything about previous relationships.
             *                  var altrelids = new Array(); */

            var focalnodeid = thisnode.nodeid;
            //                var domsource = thisnode.source;
            var jsonargs = {
                "domsource": domsource
            };

            var loadargs = {
                "url": buildUrl(focalnodeid),
                "httpMethod": "POST",
                "jsonquerystring": buildJSONQuery(jsonargs),
                "container": paper.canvas.parentNode
            };

            /* This is weird... Despite the paper object being declared in the global scope,
             * we end up with a duplicated paper object from the first query to the database.
             * It can be removed here by putting in the following line, but if this line follows
             * the loadData function then it will remove the current instead of the last paper
             * object. It is not clear why the first paper object is not overwritten by later
             * assignments to that variable name, but the code seems to work alright as is. */
            paper.remove();
            loadData(loadargs);
        };
    };

    circle.click(getClickHandlerNode());

    // if this node has cycles, record it; we will draw them once the tree is done
    var naltparents = (node.altrels === undefined ? 0 : node.altrels.length);
    if (naltparents > 0) {
        nodesWithCycles.push(node.nodeid);
    }

    // store the node for fast access later
    nodesHash[node.nodeid] = node;
}

function drawCycles(focalnode) {
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
    var getClickHandlerNubRelLink, getNubLinkHoverHandler;
    var getHoverHandlerShow, getHoverHandlerHide;
    var infobox, nublabelbox, nublinks, linktext, thislink;
    var altrelsset = paper.set();
    altrelsset.hidden = false;

    function toggleAltRels() {
        var altrels = altrelsset;
        return function () {
            if (altrels.hidden) {
                altrels.show();
                altrels.hidden = false;
            } else {
                altrels.hide();
                altrels.hidden = true;
            }
        };
    }

    tx = 10;
    ty = 30;
    togglelabel = paper.text(tx + r, ty + nodeHeight * 0.95, "toggle alt rels").attr({
        'text-anchor': 'start',
        "font-size": r * fontScalar
    });

    togglebox = paper.rect(tx, ty, nodesWidth, nodeHeight * 2).attr({
        "stroke": "black",
        "stroke-width": "1px",
        "fill": "white",
        "fill-opacity": 0
    })
        .click(toggleAltRels());

    body = $("body");
    $(window).bind("scroll", function () {
        togglebox.animate({
            "y": body.scrollTop() + ty
        }, 200);
        togglelabel.animate({
            "y": body.scrollTop() + ty + nodeHeight
        }, 200);
    });

    // for each node found to have more than one parent
    for (i = 0; i < nodesWithCycles.length; i++) {

        // this node is the child
        child = nodesHash[nodesWithCycles[i]];
        cx = child.x;
        cy = child.y;

        // initialize nub object; it will contain links to topologies not present in the current tree
        nub = {};
        nub.nodes = [];

        // for each alternative parent
        naltparents = child.altrels.length;
        for (j = 0; j < naltparents; j++) {
            // try to find this parent in the current tree
            parent = nodesHash[child.altrels[j].parentid];

            // if the parent isn't in this tree, put it in the nub
            if (parent === undefined) {
                nub.nodes.push(child.altrels[j]);

                // the parent is in the tree; get its coordinates
            } else {
                px = parent.x;
                py = parent.y;

                // if the parent and child are vertically aligned, draw an offset line between them
                if (px === cx) {
                    x1 = cx - r;
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
                    dln1 = paper.path(dst1).attr({
                        "stroke": altRelColor
                    });
                    dln2 = paper.path(dst2).attr({
                        "stroke": altRelColor
                    });
                    altrelsset.push(dln1);
                    altrelsset.push(dln2);

                    // main vertical line
                    sst = "M" + x1 + " " + y1 + "L" + x1 + " " + y2;
                    altrelline = paper.path(sst).attr({
                        "stroke": altRelColor
                    });

                    // if the parent and child are not vertically aligned, draw a straight line between them
                } else {
                    dln = "M" + cx + " " + cy + "L" + px + " " + py;
                    altrelline = paper.path(dln).attr({
                        "stroke": altRelColor
                    });
                }
                altrelsset.push(altrelline);

                bw = 60;
                bh = nodeHeight;

                altrellabel = paper.set();
                altrellabelbox = paper.rect((cx + px) / 2 - bw / 2, (cy + py) / 2 - bh / 2, bw, bh).attr({
                    "stroke": "black",
                    "fill": "white"
                }).hide();
                altrellabeltext = paper.text((cx + px) / 2, (cy + py) / 2, child.altrels[j].source).attr({
                    "font-size": r * fontScalar
                }).hide();
                altrellabel.push(altrellabelbox);
                altrellabel.push(altrellabeltext);

                // create closure so we can access this alt rel info when the corresponding line is clicked

                getClickHandlerAltRelLine = function () {

                    /* at some point we will probably want to retain a history of preferred altrelationships, etc.
                     * these should be stored/retrieved from a base-level query info object that is passed back
                     * and forth from the server. for now we are just keeping things simple and not remembering
                     * anything about previous relationships.
                     *                  var altrelids = // get altrels ;
                     *                  altrelids.push(child.altrels[j].altrelid); */

                    var focalnodeid = child.altrels[j].parentid;
                    //                    var domsource = child.altrels[j].source;

                    var jsonargs = {
                        "domsource": child.altrels[j].source
                    };


                    return function () {
                        var loadargs = {
                            "url": buildUrl(focalnodeid),
                            "httpMethod": "POST",
                            "jsonquerystring": buildJSONQuery(jsonargs),
                            "container": paper.canvas.parentNode
                        };
                        paper.clear();
                        paper.remove();
                        loadData(loadargs);
                    };
                };

                // create closure so we can affect properties when we hover in/out

                getHoverHandlerAltRelLineShow = function (attributes) {
                    var linetomodify = altrelline;
                    var label = altrellabel;
                    return function () {
                        linetomodify.attr(attributes);
                        label.show().toFront();
                    };
                };

                getHoverHandlerAltRelLineHide = function (attributes) {
                    var linetomodify = altrelline;
                    var label = altrellabel;
                    return function () {
                        linetomodify.attr(attributes);
                        label.hide();
                    };
                };
                // apply behaviors
                altrelline.hover(getHoverHandlerAltRelLineShow({
                    "stroke-width": "3px"
                }), getHoverHandlerAltRelLineHide({
                    "stroke-width": "1px"
                })).click(getClickHandlerAltRelLine());
            }
        }

        // if there are parents not in the current tree, create a nub to represent them
        if (nub.nodes.length > 0) {

            // draw the nub
            nub.x = cx - (r * nubDistScalar);
            nub.y = cy + (r * nubDistScalar);
            nub.line = "M" + cx + " " + cy + "L" + nub.x + " " + nub.y;
            nub.dbr1 = paper.path(nub.line).attr({
                "stroke": altRelColor
            });
            nub.circle = paper.circle(nub.x, nub.y, r).attr({
                "fill": altPColor
            });

            // calc geometry for the nub info box, which contains links to alt topologies
            infobox = paper.set();
            infobox.x = nub.x - (nodesWidth * 2 + (xLabelMargin * 2));
            infobox.y = nub.y;
            infobox.w = nodesWidth * 2 + (xLabelMargin * 2);
            infobox.h = nodeHeight * (nub.nodes.length + 1);

            // draw the info box container
            nublabelbox = paper.rect(infobox.x, infobox.y, infobox.w, infobox.h).attr({
                "fill": "white"
            });

            // generate links for the infobox; use a paper.set object so we can easily toggle transparency
            nublinks = paper.set();
            for (j = 0; j < nub.nodes.length; j++) {

                // the link labels are the names of the corresponding sources
                linktext = nub.nodes[j].parentname + " > " + nub.nodes[j].source;

                // create closure so we can access nub.nodes[j] when we click a source link

                getClickHandlerNubRelLink = function () {

                    /* at some point we will probably want to retain a history of preferred altrelationships, etc.
                     * these should be stored/retrieved from a base-level query info object that is passed back
                     * and forth from the server. for now we are just keeping things simple and not remembering
                     * anything about previous relationships.
                     *                  var altrelids = new Array(); */

                    var focalnodeid = nub.nodes[j].parentid; // inherit this, passed to parent function
                    var domsource = nub.nodes[j].source;

                    var jsonargs = {
                        "domsource": domsource
                    };
                    var jsonquerystr = buildJSONQuery(jsonargs);

                    return function () {
                        paper.clear();
                        var loadargs = {
                            "url": buildUrl(focalnodeid),
                            "httpMethod": "POST",
                            "jsonquerystring": jsonquerystr,
                            "container": paper.canvas.parentNode
                        };
                        //                        alert(jsonquerystr);
                        paper.remove();
                        loadData(loadargs);
                    };
                };

                // links are drawn in a vertical sequence within the infobox container
                thislink = paper.text(infobox.x + xLabelMargin, infobox.y + nodeHeight + j * nodeHeight, linktext).attr({
                    "text-anchor": "start",
                    "font-size": r * fontScalar
                })
                    .click(getClickHandlerNubRelLink());

                // create closure so we can affect link properties when we hover in/out

                getNubLinkHoverHandler = function (attributes) {
                    var nublinktomodify = thislink;
                    return function () {
                        nublinktomodify.attr(attributes);
                    };
                };

                // assign hover behavior
                thislink.hover(getNubLinkHoverHandler({
                    "fill": altPLinkColor
                }), getNubLinkHoverHandler({
                    "fill": "black"
                }));

                nublinks.push(thislink);
            }

            // add links and infobox container to the infobox object, hide it from view
            infobox.push(nublinks);
            infobox.push(nublabelbox);
            infobox.hide();

            // create closures so we can set hover in/out behaviors on the infobox

            getHoverHandlerShow = function () {
                var cSet = infobox;
                return function () {
                    cSet.show();
                    // bring the box to the front of the page
                    cSet[1].toFront();
                    // put the links in front of the box
                    cSet[0].toFront();
                };
            };

            getHoverHandlerHide = function () {
                var cSet = infobox;
                return function () {
                    cSet.hide();
                };
            };

            // assign behaviors
            nub.circle.hover(getHoverHandlerShow(), getHoverHandlerHide());
            infobox.hover(getHoverHandlerShow(), getHoverHandlerHide());
        }
    }
}

// call this function on first page load to get initial tree
//  @param `container` is passed to loadData as the DOM node that is the parent of the canvas

function setupAtNode(nodeid, domsource, container) {
    if (isBlank(domsource)) {
        domsource = "ottol";
    }
    // call webservice to display graph for indicated node id
    if (!isBlank(nodeid)) {
        var jsonquerystring = buildJSONQuery({
            "domsource": domsource
        });
        var url = buildUrl(nodeid);
        var loadargs = {
            "url": url,
            "httpMethod": "POST",
            "jsonquerystring": jsonquerystring,
            "container": container
        };
        loadData(loadargs);
    }
}


// call this function on first page load to get initial tree based on
//  the query portion of the URL (the location.search string) 
//  @param `container` is passed to loadData as the DOM node that is the parent of the canvas

function setup(container) {

    // extract variables from url string
    var tokstr, toks, i, arg;
    var nodeid;
    var domsource = "";
    if (location.search !== "") {
        tokstr = location.search.substr(1).split("?");
        toks = String(tokstr).split("&");
        for (i = 0; i < toks.length; i++) {
            arg = toks[i].split("=");
            if (arg[0] === "nodeid") {
                nodeid = arg[1];
            } else if (arg[0] === "domsource") {
                domsource = arg[1];
            }
        }
    }

    setupAtNode(nodeid, domsource, container);
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
