var Network, RadialPlacement, activate, root, clusterNo, clusterColor;

root = typeof exports !== "undefined" && exports !== null ? exports : this;

function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
}

clusterParam = getURLParameter("cluster");
clusterColor = getURLParameter("color");
$("#title").text("Cluster Network for " + clusterParam);

RadialPlacement = function() {
	var center, current, increment, place, placement, radialLocation, radius, setKeys, start, values;
	values = d3.map();
	increment = 20;
	radius = 200;
	center = {
		"x" : 0,
		"y" : 0
	};
	start = -120;
	current = start;
	radialLocation = function(center, angle, radius) {
		var x, y;
		x = center.x + radius * Math.cos(angle * Math.PI / 180);
		y = center.y + radius * Math.sin(angle * Math.PI / 180);
		return {
			"x" : x,
			"y" : y
		};
	};
	placement = function(key) {
		var value;
		value = values.get(key);
		if (!values.has(key)) {
			value = place(key);
		}
		return value;
	};
	place = function(key) {
		var value;
		value = radialLocation(center, current, radius);
		values.set(key, value);
		current += increment;
		return value;
	};
	setKeys = function(keys) {
		var firstCircleCount, firstCircleKeys, secondCircleKeys;
		values = d3.map();
		firstCircleCount = 360 / increment;
		if (keys.length < firstCircleCount) {
			increment = 360 / keys.length;
		}
		firstCircleKeys = keys.slice(0, firstCircleCount);
		firstCircleKeys.forEach(function(k) {
			return place(k);
		});
		secondCircleKeys = keys.slice(firstCircleCount);
		radius = radius + radius / 1.8;
		increment = 360 / secondCircleKeys.length;
		return secondCircleKeys.forEach(function(k) {
			return place(k);
		});
	};
	placement.keys = function(_) {
		if (!arguments.length) {
			return d3.keys(values);
		}
		setKeys(_);
		return placement;
	};
	placement.center = function(_) {
		if (!arguments.length) {
			return center;
		}
		center = _;
		return placement;
	};
	placement.radius = function(_) {
		if (!arguments.length) {
			return radius;
		}
		radius = _;
		return placement;
	};
	placement.start = function(_) {
		if (!arguments.length) {
			return start;
		}
		start = _;
		current = start;
		return placement;
	};
	placement.increment = function(_) {
		if (!arguments.length) {
			return increment;
		}
		increment = _;
		return placement;
	};
	return placement;
};

Network = function() {
	var allData, charge, curLinksData, curNodesData, filter, filterLinks, filterNodes, force, forceTick, groupCenters, height, hideDetails, layout, link, linkedByIndex, linksG, mapNodes, moveToRadialLayout, neighboring, network, node, nodeColors, nodeCounts, nodesG, radialTick, setFilter, setLayout, setSort, setupData, showDetails, sort, sortedClusters, strokeFor, tooltip, update, updateCenters, updateLinks, updateNodes, width;
	width = 600;
	height = 400;
	allData = [];
	curLinksData = [];
	curNodesData = [];
	linkedByIndex = {};
	nodesG = null;
	linksG = null;
	node = null;
	link = null;
	layout = "force";
	filter = "all";
	sort = "clusters";
	groupCenters = null;
	force = d3.layout.force();
	nodeColors = d3.scale.category20();
	tooltip = Tooltip("vis-tooltip", 230);
	charge = function(node) {
		return -Math.pow(node.radius, 2.0) / 2;
	};
	network = function(selection, data) {
		var vis;
		allData = setupData(data);
		vis = d3.select(selection).append("svg").attr("width", width).attr(
				"height", height);
		linksG = vis.append("g").attr("id", "links");
		nodesG = vis.append("g").attr("id", "nodes");
		force.size([ width, height ]);
		setLayout("force");
		setFilter("all");
		return update();
	};
	update = function() {
		var clusters;
		curNodesData = filterNodes(allData.nodes, clusterParam);
		curLinksData = filterLinks(allData.links, curNodesData);
		if (layout === "radial") {
			clusters = sortedClusters(curNodesData, curLinksData);
			updateCenters(clusters);
		}
		force.nodes(curNodesData);
		updateNodes();
		if (layout === "force") {
			force.links(curLinksData);
			updateLinks();
		} else {
			force.links([]);
			if (link) {
				link.data([]).exit().remove();
				link = null;
			}
		}
		return force.start();
	};
	network.toggleLayout = function(newLayout) {
		force.stop();
		setLayout(newLayout);
		return update();
	};
	network.toggleFilter = function(newFilter) {
		force.stop();
		setFilter(newFilter);
		return update();
	};
	network.toggleSort = function(newSort) {
		force.stop();
		setSort(newSort);
		return update();
	};
	network.updateData = function(newData) {
		allData = setupData(newData);
		link.remove();
		node.remove();
		return update();
	};
	setupData = function(data) {
		var circleRadius, countExtent, nodesMap;
		countExtent = d3.extent(data.nodes, function(d) {
			return d.diameter * 2;
		});
		circleRadius = d3.scale.sqrt().range([ 2.5, 10 ]).domain(countExtent);
		data.nodes.forEach(function(n) {
			var randomnumber;
			// n.fixed = true;
			n.x = randomnumber = Math.floor(Math.random() * width);
			n.y = randomnumber = Math.floor(Math.random() * height);
			return n.radius = circleRadius(n.diameter);
		});
		nodesMap = mapNodes(data.nodes);
		data.links
				.forEach(function(l) {
					l.source = nodesMap.get(l.source);
					l.target = nodesMap.get(l.target);
						return linkedByIndex["" + l.source.name + ","
					                     + l.target.name] = 1;
				});
		return data;
	};
	mapNodes = function(nodes) {
		var nodesMap;
		nodesMap = d3.map();
		nodes.forEach(function(n) {
			return nodesMap.set(n.name, n);
		});
		return nodesMap;
	};
	nodeCounts = function(nodes, attr) {
		var counts;
		counts = {};
		nodes.forEach(function(d) {
			var _name, _ref;
			if ((_ref = counts[_name = d[attr]]) == null) {
				counts[_name] = 0;
			}
			return counts[d[attr]] += 1;
		});
		return counts;
	};
	neighboring = function(a, b) {
		return linkedByIndex[a.name + "," + b.name]
				|| linkedByIndex[b.name + "," + a.name];
	};
	filterNodes = function(allNodes, cluster) {
		var cluster, filteredNodes;
		filteredNodes = allNodes;
		filteredNodes = allNodes.filter(function(n) {
				return n.cluster == cluster;
		});			
		return filteredNodes;
	};
	sortedClusters = function(nodes, links) {
		var clusters, counts;
		clusters = [];
		if (sort === "links") {
			counts = {};
			links.forEach(function(l) {
				var _name, _name1, _ref, _ref1;
				if ((_ref = counts[_name = l.source.cluster]) == null) {
					counts[_name] = 0;
				}
				counts[l.source.cluster] += 1;
				if ((_ref1 = counts[_name1 = l.target.cluster]) == null) {
					counts[_name1] = 0;
				}
				return counts[l.target.cluster] += 1;
			});
			nodes.forEach(function(n) {
				var _name, _ref;
				return (_ref = counts[_name = n.cluster]) != null ? _ref
						: counts[_name] = 0;
			});
			clusters = d3.entries(counts).sort(function(a, b) {
				return b.value - a.value;
			});
			clusters = clusters.map(function(v) {
				return v.key;
			});
		} else {
			counts = nodeCounts(nodes, "cluster");
			clusters = d3.entries(counts).sort(function(a, b) {
				return b.value - a.value;
			});
			clusters = clusters.map(function(v) {
				return v.key;
			});
		}
		return clusters;
	};
	updateCenters = function(clusters) {
		if (layout === "radial") {
			return groupCenters = RadialPlacement().center({
				"x" : width / 2,
				"y" : height / 2 - 100
			}).radius(300).increment(18).keys(clusters);
		}
	};
	filterLinks = function(allLinks, curNodes) {
		curNodes = mapNodes(curNodes);
		return allLinks.filter(function(l) {
				return curNodes.get(l.source.name)
						&& curNodes.get(l.target.name);
		});
	};
	updateNodes = function() {
		node = nodesG.selectAll("circle.node").data(curNodesData, function(d) {
			return d.name;
		});
		
		node.enter().append("circle").attr("class", "node").attr("cx",
				function(d) {
					return d.x;
				}).attr("cy", function(d) {
			return d.y;
		}).attr("r", function(d) {
			return d.radius;
		}).style("fill", function(d) {
			return d3.rgb("#" + clusterColor);
		}).style("stroke", function(d) {
			return strokeFor(d);
		}).style("stroke-width", 1.0);
		
		node.on("mouseover", showDetails).on("mouseout", hideDetails);//.call(force.drag);
		return node.exit().remove();
	};
	updateLinks = function() {
		link = linksG.selectAll("line.link").data(curLinksData, function(d) {
			return "" + d.source.name + "_" + d.target.name;
		});
		link.enter().append("line").attr("class", "link")
				.attr("stroke", "#ddd").attr("stroke-opacity", 0.8).attr("x1",
						function(d) {
							return d.source.x;
						}).attr("y1", function(d) {
					return d.source.y;
				}).attr("x2", function(d) {
					return d.target.x;
				}).attr("y2", function(d) {
					return d.target.y;
				});
		return link.exit().remove();
	};
	setLayout = function(newLayout) {
		layout = newLayout;
		var k = Math.sqrt(nodes.length / (width * height));
		if (layout === "force") {
			return force.on("tick", forceTick).charge(charge).linkDistance(80);
		} else if (layout === "radial") {
			return force.on("tick", radialTick).charge(charge);
		}
	};
	setFilter = function(newFilter) {
		return filter = newFilter;
	};
	setSort = function(newSort) {
		return sort = newSort;
	};
	forceTick = function(e) {
		node.attr("cx", function(d) {
			// return d.x;
			return d.x = Math.max(6, Math.min(width - 6, d.x));
		}).attr("cy", function(d) {
			// return d.y;
			return d.y = Math.max(6, Math.min(height - 6, d.y));
		});
		return link.attr("x1", function(d) {
			return d.source.x;
		}).attr("y1", function(d) {
			return d.source.y;
		}).attr("x2", function(d) {
			return d.target.x;
		}).attr("y2", function(d) {
			return d.target.y;
		});
	};
	radialTick = function(e) {
		node.each(moveToRadialLayout(e.alpha));
		node.attr("cx", function(d) {
			// return d.x;
			return d.x = Math.max(6, Math.min(width - 6, d.x));
		}).attr("cy", function(d) {
			// return d.y;
			return d.y = Math.max(6, Math.min(height - 6, d.y));
		});
		if (e.alpha < 0.03) {
			force.stop();
			return updateLinks();
		}
	};
	moveToRadialLayout = function(alpha) {
		var k;
		k = alpha * 0.1;
		return function(d) {
			var centerNode;
			centerNode = groupCenters(d.cluster);
			d.x += (centerNode.x - d.x) * k;
			return d.y += (centerNode.y - d.y) * k;
		};
	};
	strokeFor = function(d) {
		return d3.rgb("#" + clusterColor).darker();
		//return d3.rgb(d.rgb).darker().toString();
		//var parseRGB = d.rgb.split(',');
		//return d3.rgb(parseRGB[0],parseRGB[1],parseRGB[2]);
	};
	showDetails = function(d, i) {
		var content, prevList, nextList, prevResult, nextResult, emptyText;
		force.stop();
		function unique(a){
			  var arr = [];
			  for (var i=0;i<a.length;i++){
			    if ( arr.indexOf(a[i]) == -1){
			        arr.push(a[i]);
			    }
			}
			return arr;
		};
		content = '<p class="main">' + d.name + '</span></p>';
		content += '<hr class="tooltip-hr">';
		content += '<p class="main">Cluster: ' + d.cluster + '</span></p>';
		if (filter === "rank_bc" || filter === "rank_pg") {
			if (filter === "rank_bc") {
				content += '<p class="main">Rank BC: ' + d.Rank_BC + '</span></p>';
			} else {
				content += '<p class="main">Rank PG: ' + d.Rank_PG + '</span></p>';
			}
		}
		tooltip.showTooltip(content, d3.event);
		if (link) {
			prevList = [];  
			nextList = [];
			link.attr("stroke", function(l) {
				if (l.source === d || l.target === d) {
					if (l.target === d) {
						l.source["linkValue"] = parseInt(l.value);
						prevList.push(l.source);
					} else {
						nextList.push(l.target);
					}
					
					// sort by link value 
					prevList.sort(function(a, b){
						return b.linkValue - a.linkValue;
					});
					
					nextList.sort(function(a, b){
						return b.linkValue - a.linkValue;
					});
					
					// make node unique
					//prevList = unique(prevList);
					return "#555";
				}
				return "#ddd";
			}).attr("stroke-opacity", function(l) {
				if (l.source === d || l.target === d) {
					return 1.0;
				} else {
					return 0.5;
				}
			}).style("stroke-width", function(l) {
				if (l.source === d || l.target === d) {
					return 3;
				} else {
					return 1;
				}				
			});
		}
		node.style("stroke", function(n) {
			if (n.searched || neighboring(d, n)) {
				return "#555";
			} else {
				return strokeFor(n);
			}
		}).style("stroke-width", function(n) {
			if (n.searched || neighboring(d, n)) {
				return 2.0;
			} else {
				return 1.0;
			}
		});
		
		prevResult = "";
		nextResult = "";
		emptyText = "N/A";
		
		prevList.splice(5, prevList.length);
		if (prevList.length > 0) {
			
			for (var i=0; i < prevList.length; i ++) {
				prevResult += prevList[i].name + " " + "<br>"; //+ prevList[i].linkValue
			}
		} else {
			prevResult = emptyText;
		}
		$("#prev_info").html(prevResult);
		
		nextList.splice(5, nextList.length);
		if (nextList.length > 0) {
			for (var i=0; i < nextList.length; i ++) {
				nextResult += nextList[i].name + " " + "<br>";
			}
		} else {
			nextResult = emptyText;
		}
		$("#next_info").html(nextResult);
		
		return d3.select(this).style("stroke", "white").style("stroke-width",
				2.0);
	};
	hideDetails = function(d, i) {
		tooltip.hideTooltip();
		force.start();
		node.style("stroke", function(n) {
			if (!n.searched) {
				return strokeFor(n);
			} else {
				return "#555";
			}
		}).style("stroke-width", function(n) {
			if (!n.searched) {
				return 1.0;
			} else {
				return 2.0;
			}
		});
		if (link) {
			return link.attr("stroke", "#ddd").attr("stroke-opacity", 0.8).style("stroke-width", 1);
		}
	};
	return network;
};

activate = function(group, link) {
	d3.selectAll("#" + group + " a").classed("active", false);
	return d3.select("#" + group + " #" + link).classed("active", true);
};

$(function() {
	var myNetwork;
	myNetwork = Network();
	d3.selectAll("#layouts a").on("click", function(d) {
		var newLayout;
		newLayout = d3.select(this).attr("id");
		activate("layouts", newLayout);
		return myNetwork.toggleLayout(newLayout);
	});
	d3.selectAll("#filters a").on("click", function(d) {
		var newFilter;
		newFilter = d3.select(this).attr("id");
		activate("filters", newFilter);
		return myNetwork.toggleFilter(newFilter);
	});
	d3.selectAll("#sorts a").on("click", function(d) {
		var newSort;
		newSort = d3.select(this).attr("id");
		activate("sorts", newSort);
		return myNetwork.toggleSort(newSort);
	});
	return d3.json("../data/Video_Network.json", function(json) {
		return myNetwork("#vis", json);
	});
});
