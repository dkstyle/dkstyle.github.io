d3.json("../data/Video_Map.json", function(json) { //data/Video_Map.json
	
	var width = 960;
	var height = 540;
	var color = d3.scale.category20();
	
	var redraw = function() {
		  //console.log("here", d3.event.translate, d3.event.scale);
		  circleGroup.attr("transform",
		      "translate(" + d3.event.translate + ")"
		      + " scale(" + d3.event.scale + ")");
		  labelGroup.attr("transform",
			      "translate(" + d3.event.translate + ")"
			      + " scale(" + d3.event.scale + ")");
	};
	
	// Container
	var svgContainer = d3.select("#d3_map").append("svg")
		.attr("width", width)
		.attr("height", height)
		//.style("border", "1px solid black");
		//.style("border", "2px solid #a1a1a1")
		//.style("border-radius", "25px")
	 	.call(d3.behavior.zoom().on("zoom", redraw));

	// Circle Group
	var circleGroup = svgContainer.append("g");
	var labelGroup = svgContainer.append("g");

	/* process DK start */
	var minX = d3.min(json.nodes, function(d) { return d.pos_x; });
	var maxX = d3.max(json.nodes, function(d) { return d.pos_x; });
	  
	var rescaleX = d3.scale.linear()
		.domain([maxX, minX])  //input
	  	.range([width - (width * 0.1), 100]); //output
	var minY = d3.min(json.nodes, function(d) { return d.pos_y; });
	var maxY = d3.max(json.nodes, function(d) { return d.pos_y; });
	var rescaleY = d3.scale.linear()
		.domain([maxY, minY])  //input
	  	.range([height - 50, 50]); //output
	
	/* process DK end */
	// text
	/*
	var text = circleGroup.selectAll("text").data(json).enter()
			.append("text").attr("text-anchor", "right").attr("x", function(d) {
				  var minX = d3.min(json.nodes, function(d) { return d.pos_x; });
				  var maxX = d3.max(json.nodes, function(d) { return d.pos_x; });
				  
				  var rescaleX = d3.scale.linear()
				  	.domain([maxX, minX])  //input
				  	.range([width, 0]); //output				
				return rescaleX(d.pos_x);
			}).attr("y", function(d) {
				  var minY = d3.min(json.nodes, function(d) { return d.pos_y; });
				  var maxY = d3.max(json.nodes, function(d) { return d.pos_y; });
				  var rescaleY = d3.scale.linear()
					.domain([maxY, minY])  //input
				  	.range([height, 0]); //output
				return rescaleY(d.pos_y);
			}).text(function(d) {
				return d.name;
			}).attr("font-size", "0px").attr("font-family", "sans-serif").attr(
					"text-decoration", "underline").attr("font-weight", "bold")
			.attr("fill", "black");
	*/
	
	// Circles
	var circles = circleGroup.selectAll("circle")
					.data(json.nodes)
					.enter()
					.append("circle")
					.on("mouseover", mouseover).on("mouseout", mouseout).on("click", click)
					//.transition().delay(function (d,i){ return i * 5;}).duration(1);
	
	// Circle attributes
	var circleAttributes = 
	circles.attr("cx", function(d) {
		return rescaleX(d.pos_x);
	})
	.attr("cy", function(d) {
		return rescaleY(d.pos_y);
	})
	.attr("r", function(d) {
		if (d.diameter > 1) {
			return ( Math.sqrt(d.diameter) / 7 + 2);
			//return ( Math.sqrt(d.diameter) / 2 + 2 );
		} else {
			return 2;
		}
	})
	.style("opacity", 0.8).style("fill", function(d) {
		return color(d.cluster);
	})
	.style("stroke", function(d) {
		return d3.rgb(color(d.cluster)).brighter(); //default outline
	})
	//.on("mouseover", mouseover).on("mouseout", mouseout).on("click", click)
	// .on("dblclick", dblclick)
	.append("title").text(function(d) {
		return "[Cluster]-" + d.cluster + ", [Title]-" + d.name;
	});
	
	// circle label
	var circleLabel = labelGroup.selectAll("text")
		.data(json.nodes.filter(function(d){return d.diameter > 4000; }))
		.enter()
		.append("text").text(function(d) { if (d.cluster !== "5" || (d.cluster == 5 && d.diameter > 7000) ) { return d.name; } })
		.attr("text-anchor", "middle")
		.style("fill", function(d) {
			return d3.rgb(color(d.cluster)).darker();
			//return "black";
		})
//		.style("stroke-width", "1")
//		.style("stroke", function(d) {
//			//return d3.rgb(color(d.cluster)).darker();
//			return "black"
//		})
		.style("font", "8px sans-serif")
		.transition().delay(function (d,i){ return i * 70;}).duration(20)
		.attr("transform", function(d) { return "translate(" + rescaleX(d.pos_x) + "," + rescaleY(d.pos_y) + ")"; });	
	
	//$("#test").hideLoading();
	function mouseover() {
		var cluster;
		/*
		d3.select(this).transition().duration(1000).style("stroke",
				function(d) {
					//return d3.rgb(color(d.cluster)).darker();
					return "white";
				}).style("stroke-width", 3);
		*/
		
		d3.select(this).style("stroke", function(d) {
			return "yellow";
		}).style("stroke-width", function(d) {
			return 5;
		});
		/*
		circles.style("stroke", function(d) {
			return d3.rgb(color(d.cluster)).darker();;
		}).style("stroke-width", function(d) {
			var sw = 1;
			if (d.cluster == cluster) {
				sw = 2;
			}

			return sw;
		}).style("opacity", 0.8);
		*/
		//text.attr("font-size", 0);
	}
	;

	function mouseout() {
		var cluster;

		d3.select(this).style("stroke", function(d) {
			cluster = d.cluster;
			return d3.rgb(color(d.cluster)).brighter();
		}).style("stroke-width", 1);

		/*
		circles.style("stroke", d3.rgb(color(d.cluster)).brighter())
			.style("opacity", 0.8)
			.style("stroke-width", function(d) {
					return 1;
				});

		text.attr("font-size", "0px");
		*/
	}
	;

	function click(d) {
		var cluster; 
		/*
		d3.select(this).transition().style("stroke", function(d) {
			cluster = d.cluster;
			return "white";
		}).style("stroke-width", 3);
		*/
		
		/*
		circles.style("opacity", function(d) {
			var opa;
			
			if (d.cluster == cluster) {
				opa = 0.8;
			} else {
				opa = 0.1;
			}
			return 1;
			//return opa;
		}).style("stroke", function(d) {
			var stroke = "black";

			if (d.cluster == cluster) {
				stroke = "blue";
			}

			return stroke;

		}).style("stroke-width", function(d) {
			var sw = 1;

			if (d.cluster == cluster) {
				sw = 3;
			}

			return sw;
		})//.attr("Response.Redirect", "Default.aspx")
		*/
		//circles.on("click", function (d) { 
		if (d.cluster !== "9999") {
			//var target = window.location.protocol + "//" + window.location.host;
			var target = "..";
			var cluster = d.cluster;
			var clusterColor = color(cluster).toString().substring(1,7);

			$.colorbox({ href: target + "/videoNetworkByCluster/index.html?cluster=" + cluster + "&color=" + clusterColor, iframe: true, width: width - 10, height: height - 10 }); 
		} else {
			alert("click function is not working for small island");
		}
		//}); //window.open("Default3.aspx")

	    /*
		text.attr("font-size", function(d) {
			//var fs;
			var px = 0;

			if (d.cluster == cluster) {
				px = 20;
			}

			return px;
		});
		*/
		
		/* Backup Origin *******************************************************
		 * var cluster = "nothing";
		 * 
		 * d3.select(this) .transition() .duration(1000) .delay(100)
		 * .style("stroke", function(d) { cluster = d.CLUSTER; return "red"; })
		 * .style("stroke-width", 2);
		 * 
		 * text .attr("font-size", function(d) { var px=0;
		 * 
		 * if(d.CLUSTER == cluster) { px = 15; }
		 * 
		 * return px; });
		 */
	};
	/*
	var x = d3.scale.linear()
    .range([0, width]);

	var y = d3.scale.linear()
	    .range([height, 0]);
	
	svgContainer.append("g")
    .attr("class", "brush")
    .call(d3.svg.brush().x(x).y(y)
    .on("brushstart", brushstart)
    .on("brush", brushmove)
    .on("brushend", brushend));

	function brushstart() {
		svgContainer.classed("selecting", true);
	}
	
	function brushmove() {
	  var e = d3.event.target.extent();
	  circleGroup.classed("selected", function(d) {
	    return e[0][0] <= d[0] && d[0] <= e[1][0]
	        && e[0][1] <= d[1] && d[1] <= e[1][1];
	  });
	}
	
	function brushend() {
		svgContainer.classed("selecting", !d3.event.target.empty());
	}
	*/
});

$(function(){ 
	//console.log("start");
	//$("#test").showLoading(); 
});