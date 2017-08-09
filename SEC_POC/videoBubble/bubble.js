var diameter = 650, //960
    format = d3.format(",d"),
    color = d3.scale.category20();

var bubble = d3.layout.pack()
    .sort(null)
    .size([diameter, diameter])
    .padding(1.5);

var svg = d3.select("body").append("svg")
    .attr("width", diameter)
    .attr("height", diameter)
    .attr("class", "bubble");

d3.json("../data/Video_Network.json", function(error, json) {
  var root = { "name": "root", "children": json.nodes }; 
  
  /* process DK start */
  var minX = d3.min(root.children, function(d) { return d.pos_x; });
  var maxX = d3.max(root.children, function(d) { return d.pos_x; });
  var minY = d3.min(root.children, function(d) { return d.pos_y; });
  var maxY = d3.max(root.children, function(d) { return d.pos_y; });
  
  var rescaleX = d3.scale.linear()
  	.domain([maxX, minX])  //input
  	.range([diameter, 0]); //output

  var rescaleY = d3.scale.linear()
	.domain([maxY, minY])  //input
  	.range([diameter, 0]); //output
  /* process DK end */
  
  console.log(rescaleY(maxY));
  
  var node = svg.selectAll(".node")
      .data(bubble.nodes(classes(root))
      .filter(function(d) { return !d.children; }))
	  //.filter(function(d) { return d.cluster == "5"; }))	  
    		  .enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  
  node.append("title")
      .text(function(d) { return d.className + ": " + format(d.value); });

  node.append("circle")
      .attr("r", function(d) { return d.r; })
      .style("fill", function(d) { return color(d.cluster); });

  node.append("text")
      .attr("dy", ".3em")
      .style("text-anchor", "middle")
      .text(function(d) { return d.className.substring(0, d.r / 3); });
});

// Returns a flattened hierarchy containing all leaf nodes under the root.
function classes(root) {
  var classes = [];

  function recurse(name, node) {
    if (node.children) node.children.forEach(function(child) { recurse(node.name, child); });
    else classes.push({className: node.name, value: node.diameter, cluster: node.cluster, x: node.pos_x, y: node.pos_y}); //packageName: name, 
  }

  recurse(null, root);
  return {children: classes};
}

d3.select(self.frameElement).style("height", diameter + "px");