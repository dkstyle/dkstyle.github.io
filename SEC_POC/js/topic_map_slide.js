var width, height, color, redraw, svgContainer, circleGroup, topicGroup, minX, maxX, maxY, rescaleX, rescaleY,
	circles, circleAttributes, topicList, topics, topicsAttributes, topicLabel, sortedTopics, totalDiameter;

d3.json("../data/Topic_Map.json", function(json) { //data/Video_Map.json
	width = 750;
	height = 520;
	color = d3.scale.category20();
	
	/*
	redraw = function() {
		  //console.log("here", d3.event.translate, d3.event.scale);
		  circleGroup.attr("transform",
		      "translate(" + d3.event.translate + ")"
		      + " scale(" + d3.event.scale + ")");
		  topicGroup.attr("transform",
			      "translate(" + d3.event.translate + ")"
			      + " scale(" + d3.event.scale + ")");
	};
	*/
	
    /* process DK start */
    minX = d3.min(json.nodes, function(d) { return d.pos_x; });
	maxX = d3.max(json.nodes, function(d) { return d.pos_x; });
  
	rescaleX = d3.scale.linear()
  		.domain([maxX, minX])  //input
  		.range([width - (width * 0.1), 100]); //output
	minY = d3.min(json.nodes, function(d) { return d.pos_y; });
	maxY = d3.max(json.nodes, function(d) { return d.pos_y; });
	rescaleY = d3.scale.linear()
		.domain([maxY, minY])  //input
		.range([height - 50, 50]); //output
	/* process DK end */
	
	// Container
	svgContainer = d3.select("#d3_map").append("svg")
		.attr("width", width)
		.attr("height", height)
		.on("click", function() {
							circles.style("stroke", function(d){
					return d3.rgb(color(d.cluster)).darker();
				})
				.style("opacity", function(d) {
					return "1";
				})
				.attr("r", function(d) {
					if (d.diameter > 1) {
						return ( Math.sqrt(d.diameter) / 2 + 2 );
					} else {
						return 2;
					}
				});
		});
		//.style("border", "1px solid black");
	 	//.call(d3.behavior.zoom().on("zoom", redraw));
	

	// Circle Group
	circleGroup = svgContainer.append("g");
	
	topicGroup = svgContainer.append("g");

	
	// Circles
	circles = circleGroup.selectAll("circle")
					.data(json.nodes.filter(function(d){return d.type == "Node"; }))
					.enter()
					.append("circle")
					.on("mouseover", mouseover).on("mouseout", mouseout);//.on("click", click)
	
	// Circle attributes
	circleAttributes = 
	circles.attr("cx", function(d) {
		return rescaleX(d.pos_x);
	})
	.attr("cy", function(d) {
		return rescaleY(d.pos_y);
	})
	.attr("r", function(d) {
		if (d.diameter > 1) {
			return ( Math.sqrt(d.diameter) / 2 + 2 );
		} else {
			return 2;
		}
	})
	.style("opacity", 0.8).style("fill", function(d) {
		return color(d.cluster);
	})
	.style("stroke", function(d) {
		return d3.rgb(color(d.cluster)).darker(); //default outline
	})
	.append("title").text(function(d) {
		return "[Cluster]-" + d.cluster + ", [Title]-" + d.name;
	});
	
	topicList = json.nodes.filter(function(d){return d.type == "Topic"; });
	// Topics
    topics = topicGroup.selectAll("path")
    				 .data(topicList)
    				 .enter()
    				 .append("path")
    				 .attr("transform", function(d) { return "translate(" + rescaleX(d.pos_x) + "," + rescaleY(d.pos_y) + ")"; })
				     .attr("d", d3.svg.symbol()
				    		 .size(function(d) { return d.diameter*4+20; })
				    		 .type(function(d) { return "square"; }))  
		    		 .on("mouseover", mouseover).on("mouseout", mouseout)//.on("click", click)
    				 .transition().delay(function (d,i){ return i * 70;}).duration(20);
    
	// topics attributes
	topicsAttributes = 
		topics.style("opacity", 0.8).style("fill", function(d) {
		return color(d.cluster);
	})
	.style("stroke", function(d) {
		return d3.rgb(color(d.cluster)).darker(); //default outline
	});
	
	// topic Labels
	topicLabel = topicGroup.selectAll("text")
		.data(topicList)
		.enter()
		.append("text").text(function(d) { return d.name;})
		.attr("text-anchor", "middle")
		.attr("alignment-baseline", "baseline")
		.style("fill", function(d) {
			return d3.rgb(color(d.cluster)).darker(2);
			//return "black";
		})
		.style("font", "11px sans-serif")
		.attr("transform", function(d) { return "translate(" + rescaleX(d.pos_x) + "," + rescaleY(d.pos_y - 25) + ")"; });

	sortedTopics = topicList.sort(function(a, b){
		return b.diameter - a.diameter;
	});
	
	totalDiameter = 0;
	for ( var i=0; i < topicList.length; i++ ) {
		totalDiameter += topicList[i].diameter;
	}
	
	var minDiameter = d3.min(topicList, function(d) { return d.diameter; });
	var maxDiameter = d3.max(topicList, function(d) { return d.diameter; });
	
	var index = d3.range(topicList.length);
	var legend_width =  150;
	var legend_height = height;

	var legendContainer = d3.select("#d3_legend").append("svg")
		.attr("width", legend_width)
		.attr("height", legend_height)
		.append("g");
	
	var x = d3.scale.linear()
		.domain([minDiameter, maxDiameter])
    	.range([0, 0]);

	var y = d3.scale.ordinal()
		.domain(index)
		.rangeRoundBands([0, legend_height], .1);

	var reverseList = topicList.reverse();
	var bar = legendContainer.selectAll(".bar")
    	.data(reverseList)
    	.enter().append("g")
    	.attr("class", "bar")
    	.attr("transform", function(d, i) { return "translate(0," + y(i) + ")"; });
	
		bar.append("rect")
			.style("fill", function(d){ return color(d.cluster); })
			.attr("width", 200)
			.attr("height", y.rangeBand())
			.style("stroke", "white")
			.on("mouseover", function(e) { 
				d3.select(this).style({ "stroke":"black", "stroke-width": "2px" });
				circles.style("stroke", function(d){
					if (e.cluster == d.cluster) {
						return "black";
					} else { return d3.rgb(color(d.cluster)).darker(); }
				})
				.style("opacity", function(d) {
					if (e.cluster == d.cluster) {
						return "1";
					} else { return "0.3"; }
				})
				.attr("r", function(d) {
					if (e.cluster == d.cluster) {
						return d.diameter * 2;
					} else {
						if (d.diameter > 1) {
							return ( Math.sqrt(d.diameter) / 2 + 2 );
						} else {
							return 2;
						}
					}
				});
				
			})
			.on("mouseout", function(e) {
				d3.select(this).style({ "stroke":"white", "stroke-width": "1px" });
			});
			//.on("dblclick", function(e) {});

		bar.append("text")
		    .attr({"text-anchor": "start"})
		    .attr("x", 10)
		    .attr("y", y.rangeBand() / 2)
		    .attr("dy", ".35em")
		    .text(function(d, i) { return reverseList[i].name; })
		    .style({"font": "12px 맑은고딕", "fill": "white"});
	
	var sort = false;

	setTimeout(function() {

	  if (sort = !sort) {
	    index.sort(function(a, b) { return reverseList[b].diameter - reverseList[a].diameter; });
	  } else {
	    index = d3.range(reverseList.length);
	  }

	  y.domain(index);

	  bar.transition()
	      .duration(750)
	      .delay(function(d, i) { return i * 50; })
	      .attr("transform", function(d, i) { return "translate(0," + y(i) + ")"; });

	}, 5000);
		
	function mouseover() {
		var cluster;
		
		d3.select(this).style("stroke", function(d) {
			return "yellow";
		}).style("stroke-width", function(d) {
			return 5;
		});
	};

	function mouseout() {
		var cluster;

		d3.select(this).style("stroke", function(d) {
			cluster = d.cluster;
			return d3.rgb(color(d.cluster)).brighter();
		}).style("stroke-width", 1);
	};
});

$(function(){ 
});