var r = 960 / 2;

var cluster = d3.layout.cluster()
    .size([360, 1])
    .sort(null)
    .value(function(d) { return d.length; })
    .children(function(d) { return d.branchset; })
    .separation(function(a, b) { return 1; });

function project(d) {
  var r = d.y, a = (d.x - 90) / 180 * Math.PI;
  return [r * Math.cos(a), r * Math.sin(a)];
}

function cross(a, b) { return a[0] * b[1] - a[1] * b[0]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1]; }

function step(d) {
  var s = project(d.source),
      m = project({x: d.target.x, y: d.source.y}),
      t = project(d.target),
      r = d.source.y,
      sweep = d.target.x > d.source.x ? 1 : 0;
  return (
    "M" + s[0] + "," + s[1] +
    "A" + r + "," + r + " 0 0," + sweep + " " + m[0] + "," + m[1] +
    "L" + t[0] + "," + t[1]);
}

var wrap = d3.select("#vis").append("svg")
    .attr("width", r * 2)
    .attr("height", r * 2)
    .style("-webkit-backface-visibility", "hidden");

// Catch mouse events in Safari.
wrap.append("rect")
    .attr("width", r * 2)
    .attr("height", r * 2)
    .attr("fill", "none")

var vis = wrap.append("g")
    .attr("transform", "translate(" + r + "," + r + ")");

var start = null,
    rotate = 0,
    div = document.getElementById("vis");

function mouse(e) {
  return [
    e.pageX - div.offsetLeft - r,
    e.pageY - div.offsetTop - r
  ];
}

wrap.on("mousedown", function() {
  wrap.style("cursor", "move");
  start = mouse(d3.event);
  d3.event.preventDefault();
});
d3.select(window)
  .on("mouseup", function() {
    if (start) {
      wrap.style("cursor", "auto");
      var m = mouse(d3.event);
      var delta = Math.atan2(cross(start, m), dot(start, m)) * 180 / Math.PI;
      rotate += delta;
      if (rotate > 360) rotate %= 360;
      else if (rotate < 0) rotate = (360 + rotate) % 360;
      start = null;
      wrap.style("-webkit-transform", null);
      vis
          .attr("transform", "translate(" + r + "," + r + ")rotate(" + rotate + ")")
        .selectAll("text")
          .attr("text-anchor", function(d) { return (d.x + rotate) % 360 < 180 ? "start" : "end"; })
          .attr("transform", function(d) {
            return "rotate(" + (d.x - 90) + ")translate(" + (r - 170 + 8) + ")rotate(" + ((d.x + rotate) % 360 < 180 ? 0 : 180) + ")";
          });
    }
  })
  .on("mousemove", function() {
    if (start) {
      var m = mouse(d3.event);
      var delta = Math.atan2(cross(start, m), dot(start, m)) * 180 / Math.PI;
      wrap.style("-webkit-transform", "rotateZ(" + delta + "deg)");
    }
  });

function phylo(n, offset) {
  if (n.length != null) offset += n.length * 115;
  n.y = offset;
  if (n.children)
    n.children.forEach(function(n) {
      phylo(n, offset);
    });
}

d3.text("life.txt", function(text) {
  var x = newick.parse(text);
  var nodes = cluster.nodes(x);
  phylo(nodes[0], 0);

  var link = vis.selectAll("path.link")
      .data(cluster.links(nodes))
    .enter().append("path")
      .attr("class", "link")
      .attr("d", step);

  var node = vis.selectAll("g.node")
      .data(nodes.filter(function(n) { return n.x !== undefined; }))
    .enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })

  node.append("circle")
      .attr("r", 2.5);

  var label = vis.selectAll("text")
      .data(nodes.filter(function(d) { return d.x !== undefined && !d.children; }))
    .enter().append("text")
      .attr("dy", ".31em")
      .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
      .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (r - 170 + 8) + ")rotate(" + (d.x < 180 ? 0 : 180) + ")"; })
      .text(function(d) { return d.name.replace(/_/g, ' '); });
});
