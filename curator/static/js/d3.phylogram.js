/*
  d3.phylogram.js
  Wrapper around a d3-based phylogram (tree where branch lengths are scaled)
  Also includes a radial dendrogram visualization (branch lengths not scaled)
  along with some helper methods for building angled-branch trees.

  Contains extensive modifications to styles and mouse-responsive behaviors,
  detailed here:
  https://github.com/OpenTreeOfLife/opentree/commits/master/curator/static/js/d3.phylogram.js

  Copyright (c) 2013, Ken-ichi Ueda
  Copyright (c) 2014, Jim Allman

  All rights reserved.

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

  Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer. Redistributions in binary
  form must reproduce the above copyright notice, this list of conditions and
  the following disclaimer in the documentation and/or other materials
  provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
  LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
  CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
  SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
  INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
  CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
  POSSIBILITY OF SUCH DAMAGE.

  DOCUEMENTATION

  d3.phylogram.build(selector, nodes, options)
    Creates a phylogram.
    Arguments:
      selector: selector of an element that will contain the SVG
      nodes: JS object of nodes
    Options:
      width
        Width of the vis, will attempt to set a default based on the width of
        the container.
      height
        Height of the vis, will attempt to set a default based on the height
        of the container.
      vis
        Pre-constructed d3 vis.
      tree
        Pre-constructed d3 tree layout.
      children
        Function for retrieving an array of children given a node. Default is
        to assume each node has an attribute called "branchset"
      diagonal
        Function that creates the d attribute for an svg:path. Defaults to a
        right-angle diagonal.
      skipTicks
        Skip the tick rule.
      skipBranchLengthScaling
        Make a dendrogram instead of a phylogram.

  d3.phylogram.buildRadial(selector, nodes, options)
    Creates a radial dendrogram.
    Options: same as build, but without diagonal, skipTicks, and
      skipBranchLengthScaling

  d3.phylogram.rightAngleDiagonal()
    Similar to d3.diagonal except it create an orthogonal crook instead of a
    smooth Bezier curve.

  d3.phylogram.radialRightAngleDiagonal()
    d3.phylogram.rightAngleDiagonal for radial layouts.
*/

if (!d3) { throw "d3 wasn't included!"};
(function() {
  d3.phylogram = {}
  d3.phylogram.rightAngleDiagonal = function() {
    var projection = function(d) { return [d.y, d.x]; }

    var path = function(pathData) {
      return "M" + pathData[0] + ' ' + pathData[1] + " " + pathData[2];
    }

    function diagonal(diagonalPath, i) {
      ///console.log("calculating path "+ diagonalPath.target['@id']);
      var source = diagonalPath.source,
          target = diagonalPath.target,
          midpointX = (source.x + target.x) / 2,
          midpointY = (source.y + target.y) / 2,
          pathData = [source, {x: target.x, y: source.y}, target];
      pathData = pathData.map(projection);
      return path(pathData)
    }

    diagonal.projection = function(x) {
      if (!arguments.length) return projection;
      projection = x;
      return diagonal;
    };

    diagonal.path = function(x) {
      if (!arguments.length) return path;
      path = x;
      return diagonal;
    };

    return diagonal;
  }

  d3.phylogram.radialRightAngleDiagonal = function() {
    return d3.phylogram.rightAngleDiagonal()
      .path(function(pathData) {
        var src = pathData[0],
            mid = pathData[1],
            dst = pathData[2],
            radius = Math.sqrt(src[0]*src[0] + src[1]*src[1]),
            srcAngle = d3.phylogram.coordinateToAngle(src, radius),
            midAngle = d3.phylogram.coordinateToAngle(mid, radius),
            clockwise = Math.abs(midAngle - srcAngle) > Math.PI ? midAngle <= srcAngle : midAngle > srcAngle,
            rotation = 0,
            largeArc = 0,
            sweep = clockwise ? 0 : 1;
        return 'M' + src + ' ' +
          "A" + [radius,radius] + ' ' + rotation + ' ' + largeArc+','+sweep + ' ' + mid +
          'L' + dst;
      })
      .projection(function(d) {
        var r = d.y, a = (d.x - 90) / 180 * Math.PI;
        return [r * Math.cos(a), r * Math.sin(a)];
      })
  }

  // Convert XY and radius to angle of a circle centered at 0,0
  d3.phylogram.coordinateToAngle = function(coord, radius) {
    var wholeAngle = 2 * Math.PI,
        quarterAngle = wholeAngle / 4

    var coordQuad = coord[0] >= 0 ? (coord[1] >= 0 ? 1 : 2) : (coord[1] >= 0 ? 4 : 3),
        coordBaseAngle = Math.abs(Math.asin(coord[1] / radius))

    // Since this is just based on the angle of the right triangle formed
    // by the coordinate and the origin, each quad will have different
    // offsets
    switch (coordQuad) {
      case 1:
        coordAngle = quarterAngle - coordBaseAngle
        break
      case 2:
        coordAngle = quarterAngle + coordBaseAngle
        break
      case 3:
        coordAngle = 2*quarterAngle + quarterAngle - coordBaseAngle
        break
      case 4:
        coordAngle = 3*quarterAngle + coordBaseAngle
    }
    return coordAngle
  }

  d3.phylogram.styleTreeNodes = function(vis) {
    /* Moving this style to inline CSS (views/study/edit.html)
    vis.selectAll('g.node circle')
        .attr("r", 3.5);

    vis.selectAll('g.node.outgroup circle')
        .attr("r", 2.5);

    vis.selectAll('g.leaf.node circle')
        .attr("r", 3.5);

    vis.selectAll('g.root.node circle')
        .attr("r", 4.5);
    */
  }

  function scaleBranchLengths(nodes, w) {
    // Visit all nodes and adjust y pos width distance metric
    var visitPreOrder = function(root, callback) {
      callback(root)
      if (root.children) {
        for (var i = root.children.length - 1; i >= 0; i--){
          visitPreOrder(root.children[i], callback)
        };
      }
    }
    visitPreOrder(nodes[0], function(node) {
      // TODO: if we have mixed trees (some edges with lengths), consider 1
      // as default length versus 0?
      node.rootDist = (node.parent ? node.parent.rootDist : 0) + (node.length || 0)
    })
    var rootDists = nodes.map(function(n) { return n.rootDist; });
    var yscale = d3.scale.linear()
      .domain([0, d3.max(rootDists)])
      .range([0, w]);
    visitPreOrder(nodes[0], function(node) {
      node.y = yscale(node.rootDist)
    })
    return yscale
  }


  d3.phylogram.build = function(selector, nodes, options) {
    options = options || {}
    var w = options.width || d3.select(selector).style('width') || d3.select(selector).attr('width'),
        h = options.height || d3.select(selector).style('height') || d3.select(selector).attr('height'),
        w = parseInt(w),
        h = parseInt(h);
    var tree = options.tree || d3.layout.cluster()
      .size([h, w])
      .sort(function(node) { return node.children ? node.children.length : -1; })
      .children(options.children || function(node) {
        return node.branchset
      });
    var diagonal = options.diagonal || d3.phylogram.rightAngleDiagonal();
    var vis = options.vis || d3.select(selector).append("svg:svg")
        .attr("width", w + 200)
        .attr("height", h + 30)
      .append("svg:g")
        .attr("transform", "translate(120, 20)");

    if (!options.vis) {
      // add any special filters (once only)
      d3.select(selector).selectAll('svg')
       .append('defs')
         .append("svg:filter")
           .attr("id", "highlight")
           .each(function(d) {
               // add multiple elements to this parent
               d3.select(this).append("svg:feFlood")
                 //.attr("flood-color", "#ffeedd")  // matches .help-box bg color!
                 .attr("flood-color", "#ffb265")    // darkened to allow tint
                 .attr("flood-opacity", "0.5")      // animate this?
                 .attr("result", "tint")
               /* Add a sub-element to feFlood to pulse its opacity:
                * <animate attributeName="flood-opacity" dur="1s" values="0.5;0.8;0.5;0.2;0.5" repeatCount="indefinite"></animate>
                * */
                 .append("svg:animate")
                   .attr("attributeName", "flood-opacity")
                   .attr("dur", "0.75s")
                   .attr("values", "0.6;1.0;0.6;0.2;0.6")
                   .attr("repeatCount","indefinite");
               d3.select(this).append("svg:feGaussianBlur")
                 .attr("stdDeviation", "5")        // expand area for highlight effect
                 .attr("in", "tint")
                 .attr("result", "blurtint")
               d3.select(this).append("svg:feBlend")
                 .attr("mode", "multiply")
                 .attr("in", "SourceGraphic")
                 .attr("in2", "blurtint")
                 .attr("in3", "BackgroundImage");
               /* ALTERNATIVE SOLUTION, using feComposite
               d3.select(this).append("svg:feComposite")
                 .attr("in", "SourceGraphic");
                */
           });
    }

    var nodes = tree(nodes);

    if (options.skipBranchLengthScaling) {
      var yscale = d3.scale.linear()
        .domain([0, w])
        .range([0, w]);
    } else {
      var yscale = scaleBranchLengths(nodes, w)
    }

    if (!options.skipTicks) {
      var lines = vis.selectAll('line')
          .data(yscale.ticks(10));

      lines
        .enter().append('svg:line')
          .attr('y1', 0)
          .attr('y2', h)
          .attr('x1', yscale)
          .attr('x2', yscale)
          .attr("stroke", "#eee");

      lines
        .exit().remove();

      var text_rules = vis.selectAll("text.rule")
          .data(yscale.ticks(10));

      text_rules
        .enter().append("svg:text")
          .attr("class", "rule")
          .attr("x", yscale)
          .attr("y", 0)
          .attr("dy", -3)
          .attr("text-anchor", "middle")
          .attr('font-size', '8px')
          .attr('fill', '#ccc')
          .text(function(d) { return Math.round(d*100) / 100; });

      text_rules
        .exit().remove();
    }


    // DATA JOIN
    var timestamp = new Date().getTime();
    ///console.log("NEW keys on timestamp: "+ timestamp);

    var path_links = vis.selectAll("path.link")
        .data(tree.links(nodes), function(d) { return d.source['@id'] +'_'+ d.target['@id']; });

    var path_link_triggers = vis.selectAll("path.link-trigger")
        .data(tree.links(nodes), function(d) { return d.source['@id'] +'_'+ d.target['@id'] +'_trigger'; });

    var g_nodes = vis.selectAll("g.node")
        .data(nodes, function(d) { return d['@id']; });


    // UPDATE (only affects existing links)
    path_links
        .attr("stroke", "#aaa");

    path_link_triggers
        .attr("stroke", "orange");


    // ENTER (only affects new links; do one-time initialization here)
    path_links
      .enter()
          .append("svg:path")                   // styled (visible) edge
            .attr("class", "link")
            .attr("fill", "none")
            .attr("stroke", "#f33")
            .attr("stroke-width", "4px");

    path_link_triggers
      .enter()
          .append("svg:path")                   // "hit area" for clicking edge
            .attr("class", "link-trigger")
            .attr("fill", "none")
            .attr("stroke", "red")
            .attr("stroke-width", "4px")
            //.attr('pointer-events', 'all')

    g_nodes
      .enter()
        .append("svg:g")
          .append("svg:circle")
            .attr("r", 2.5)
            .attr('stroke', 'red')
            .attr('pointer-events', 'all')      // detect on invisible stuff
            .attr('stroke-opacity', '0.0')
            .attr('stroke-width', '8px');


    // ENTER + UPDATE (affects all new AND existing links)
    path_links
        .attr("d", diagonal)
        .attr("class", function(d) {
            var cls = "link "+ (d.source.ingroup ? "ingroup" : "outgroup");
            if (d.target.conflictDetails) {
                cls += " conflict-"+d.target.conflictDetails.status;
            }
            return cls;
        });

    path_link_triggers
        .attr("d", diagonal)
        .attr("class", function(d) { return "link-trigger "+ (d.source.ingroup ? "ingroup" : "outgroup"); });

    g_nodes
        .attr("class", function(n) {
          // N.B. These classes are overridden by study-editor.js!
          if (n.children) {
            if (n.depth == 0) {
              return "root node";
            } else {
              return "inner node";
            }
          } else {
            return "leaf node";
          }
        })
        .attr("id", function(d) { return ("nodebox-"+ d['@id']); })
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })

    // EXIT
    path_links
      .exit()
        .remove();

    path_link_triggers
      .exit()
        .remove();

    g_nodes
      .exit().remove();

    // any dynamic readjustments of non-CSS attributes
    d3.phylogram.styleTreeNodes(vis);


    // TODO: why is this SUPER-SLOW with large trees? like MINUTES to run...
    // Is there a faster/cruder way to clear the decks?
    vis.selectAll('g.node text').remove();

    if (!options.skipLabels) {
      // refresh all labels based on tree position
      vis.selectAll('g.node')
        .append("svg:text")
          .attr('font-family', 'Helvetica Neue, Helvetica, sans-serif')
          // Default label placement is for internal nodes (overridden below for tips).
          // N.B. that "empty" labels are centered and used for node highlighting.
          .attr("dx", function(d) {return (d.labelType === 'empty') ? 0 : -6;})
          .attr("dy", function(d) {return (d.labelType === 'empty') ? 3 : -6;})
          .attr("text-anchor", function(d) {return (d.labelType === 'empty') ? 'middle' : 'end';})
          .attr('font-size', '10px')
          .attr('pointer-events', 'none')
          .attr('fill', function(d) {
              switch(d.labelType) {
                  case ('tip (mapped OTU)'):
                      return '#000';
                  case ('tip (original)'):
                      return '#888';
                  case ('internal node (support)'):
                      return '#888';
                  case ('internal node (other)'):
                      return '#888';
                  case ('internal node (ambiguous)'):
                      return '#b94a48';  // show ambiguous labels, match red prompts
                  case ('empty'):
                      return '#888';
                  default:
                      console.error('Unknown label type! ['+ d.labelType +']');;
                      return '#3f3';
              }
          })
          .attr('font-style', function(d) {
              return (d.labelType === 'tip (mapped OTU)' ? 'inherit' : 'italic');
          })
          .html(function(d) {
              /*
              console.log("name: "+ d.name
                      + "\nlabelType: "+ d.labelType
                      + "\nlength: "+ d.length
                      + "\nadjacentEdgeLabel: "+ d.adjacentEdgeLabel);
              */
              switch(d.labelType) {
                  case ('tip (mapped OTU)'):
                  case ('tip (original)'):
                  case ('internal node (support)'):
                  case ('internal node (other)'):
                  case ('internal node (ambiguous)'):
                      return d.name;
                  case ('empty'):
                      /* N.B. empty label should hide, but still have layout to
                       * support a legible highlight.
                       */
                      return '&nbsp; &nbsp; &nbsp; &nbsp;';
                  default:
                      console.error('Unknown label type! ['+ d.labelType +']');;
                      return "???";
              }
          });

      /* Add a second field to show any edge support values?
       * COMMENTING THIS OUT based on further discussion. (It seems we do not expect
       * any scenario where a tree has multiple labels per node.)
       *
      vis.selectAll('g.node')
        .filter(function(d) { return d.adjacentEdgeLabel ? true : false;})
        .append("svg:text")
          .attr('font-family', 'Helvetica Neue, Helvetica, sans-serif')
          // Show *beneath* the branch, directly under any internal node label
          // N.B. that "empty" labels are centered and used for node highlighting.
          .attr('fill', '#888')
          .attr("dx", -6)
          .attr("dy", 12)
          .attr("text-anchor", 'end')
          .attr('font-size', '10px')
          .attr('pointer-events', 'none')
          .html(function(d) { return d.adjacentEdgeLabel || '???'});
      */

      vis.selectAll('g.root.node text')
          .attr("dx", -8)
          .attr("dy", 3);

      vis.selectAll('g.leaf.node text')
        .attr("dx", 8)
        .attr("dy", 3)
        .attr("text-anchor", "start");
    }

    /*
    // Finalize SVG height/width/scale/left/top to match rendered labels
    // (prevents cropping when some labels exceed our estimated `labelWidth` above)
    var renderedBounds = vis.node().getBBox();
    var svgNode = d3.select( vis.node().parentNode );
    // match SVG size to the rendered bounds incl. all labels
    svgNode.style('width', renderedBounds.width +'px')
           .style('border', '1px red solid')
           .style('height', renderedBounds.height +'px')
    // re-center the main group to allow for assymetric label sizes
    vis.attr('transform', 'translate('+ -(renderedBounds.x) +','+ -(renderedBounds.y) +')');
    */

    return {tree: tree, vis: vis}
  }

  d3.phylogram.buildRadial = function(selector, nodes, options) {
    options = options || {}
    var w = options.width || d3.select(selector).style('width') || d3.select(selector).attr('width'),
        r = w / 2,
        labelWidth = options.skipLabels ? 10 : options.labelWidth || 160;

    var vis = d3.select(selector).append("svg:svg")
        .attr("width", r * 2)
        .attr("height", r * 2)
      .append("svg:g")
        .attr("transform", "translate(" + r + "," + r + ")");

    var tree = d3.layout.cluster()
      .size([360, r - labelWidth])
      .sort(function(node) { return node.children ? node.children.length : -1; })
      .children(options.children || function(node) {
        return node.branchset
      })
      .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });

    var phylogram = d3.phylogram.build(selector, nodes, {
      vis: vis,
      tree: tree,
      skipBranchLengthScaling: true,
      skipTicks: true,
      skipLabels: options.skipLabels,
      diagonal: d3.phylogram.radialRightAngleDiagonal()
    })
    vis.selectAll('g.node')
      .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })

    if (!options.skipLabels) {
      vis.selectAll('g.leaf.node text')
        .attr("dx", function(d) { return d.x < 180 ? 8 : -8; })
        .attr("dy", ".31em")
        .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
        .attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; })
        .attr('font-family', 'Helvetica Neue, Helvetica, sans-serif')
        .attr('font-size', '10px')
        .attr('fill', 'black');

      vis.selectAll('g.inner.node text')
        .attr("dx", function(d) { return d.x < 180 ? -6 : 6; })
        .attr("text-anchor", function(d) { return d.x < 180 ? "end" : "start"; })
        .attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; });
    }

    /*
    // Finalize SVG height/width/scale/left/top to match rendered labels
    // (prevents cropping when some labels exceed our estimated `labelWidth` above)
    var renderedBounds = vis.node().getBBox();
    var svgNode = d3.select( vis.node().parentNode );
    // match SVG size to the rendered bounds incl. all labels
    svgNode.style('width', renderedBounds.width +'px')
           .style('height', renderedBounds.height +'px')
    // re-center the main group to allow for assymetric label sizes
    vis.attr('transform', 'translate('+ -(renderedBounds.x) +','+ -(renderedBounds.y) +')');
    */

    return {tree: tree, vis: vis}
  }
}());
