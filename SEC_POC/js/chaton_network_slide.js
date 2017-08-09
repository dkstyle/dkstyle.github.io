var Network, RadialPlacement, activate, root;

root = typeof exports !== "undefined" && exports !== null ? exports : this;

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
	var allData, charge, curLinksData, curNodesData, filter, filterLinks, filterNodes, force, forceTick, groupCenters, height, hideDetails, highlight, layout, link, linkedByIndex, linksG, mapNodes, moveToRadialLayout, neighboring, network, node, nodeColors, nodeCounts, nodesG, radialTick, setFilter, setLayout, setSort, setHighlight, setupData, showDetails, sort, sortedClusters, strokeFor, tooltip, update, updateCenters, updateLinks, updateNodes, width;
	width = 940;
	height = 600;
	allData = [];
	curLinksData = [];
	curNodesData = [];
	linkedByIndex = {};
	nodesG = null;
	linksG = null;
	node = null;
	link = null;
	layout = "radial";
	filter = "all";
	sort = "clusters";
	highlight = "high_none";
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
		setLayout("radial");
		setFilter("all");
		return update();
	};
	update = function() {
		var clusters;
		curNodesData = filterNodes(allData.nodes).filter(function(d){ return d.cluster !== "9999"; });
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
		node.style("fill", function(d) {
			if (highlight == "high_none") {
				return nodeColors(d.cluster);
			} 
			if (highlight == "high_bc") {
				if (d.Rank_BC < 11 ) {
					return "red";
				} else {
					return nodeColors(d.cluster);
				};
			}
			if (highlight == "high_pr") {
				if (d.Rank_PG < 11 ) {
					return "red";
				} else {
					return nodeColors(d.cluster);
				};
			}
		});
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
	network.toggleHighlight = function(newHighlight) {
		force.stop();
		setHighlight(newHighlight);
		return update();
	};
	network.updateSearch = function(searchTerm) {
		var searchRegEx;
		searchRegEx = new RegExp(searchTerm.toLowerCase());
		return node.each(function(d) {
			var element, match;
			element = d3.select(this);
			match = d.name.toLowerCase().search(searchRegEx);
			if (searchTerm.length > 0 && match >= 0) {
				element.style("fill", "#F38630").style("stroke-width", 2.0)
						.style("stroke", "#555");
				return d.searched = true;
			} else {
				d.searched = false;
				return element.style("fill", function(d) {
						return nodeColors(d.cluster);
					//var parseRGB = d.rgb.split(',');
					//return d3.rgb(parseRGB[0],parseRGB[1],parseRGB[2]).toString();
				}).style("stroke-width", 1.0);
			}
		});
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
			return d.diameter;
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
	filterNodes = function(allNodes) {
		var cutoff, filteredNodes, sizeQuantile;
		filteredNodes = allNodes;
		if (filter === "popular" || filter === "obscure") {
			sizeQuantile = allNodes.map(function(d) {
				return d.diameter;
			}).sort(d3.ascending);
			cutoff = d3.quantile(sizeQuantile, 0.5);
			filteredNodes = allNodes.filter(function(n) {
				if (filter === "popular") {
					return n.diameter > cutoff;
				} else if (filter === "obscure") {
					return n.diameter <= cutoff;
				}
			});
		}
		if (filter === "topTier") {
			sizeQuantile = allNodes.map(function(d) {
				return d.diameter;
			}).sort(d3.ascending);
			cutoff = d3.quantile(sizeQuantile, 0.9);
			filteredNodes = allNodes.filter(function(n) {
				return n.diameter > cutoff;
			});
		}
		if (filter === "rank_bc" || filter === "rank_pr") {
			sizeQuantile = allNodes.map(function(d) {
				return d.diameter;
			}).sort(d3.ascending);
			cutoff = 5;
			filteredNodes = allNodes.filter(function(n) {
				if (filter === "rank_bc") {
					return n.Rank_BC <= cutoff;
				} else if (filter === "rank_pr") {
					return n.Rank_PG <= cutoff;
				}
			});
		}
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
			}).radius(200).increment(16).keys(clusters);
		}
	};
	filterLinks = function(allLinks, curNodes) {
		curNodes = mapNodes(curNodes);
		return allLinks.filter(function(l) {
			//if (parseInt(l.value) > 10) { //works!
				return curNodes.get(l.source.name)
						&& curNodes.get(l.target.name);
			//}
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
			return nodeColors(d.cluster);
		}).style("stroke", function(d) {
			return strokeFor(d);
		}).style("stroke-width", 1.0);
		
		node.on("mouseover", showDetails).on("mouseout", hideDetails);// .call(force.drag);
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
			return force.on("tick", forceTick).charge(charge).linkDistance(100);
			// return force.on("tick", forceTick).charge(-10 / k).gravity(100 *
			// k);
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
	setHighlight = function(newHighlight) {
		return highlight = newHighlight;
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
		return d3.rgb(nodeColors(d.cluster)).darker().toString();
		//return d3.rgb(d.rgb).darker().toString();
		//var parseRGB = d.rgb.split(',');
		//return d3.rgb(parseRGB[0],parseRGB[1],parseRGB[2]);
	};
	showDetails = function(d, i) {
		force.stop();
		var content, conList;
		content = '<p class="main">' + d.name + '</span></p>';
		content += '<hr class="tooltip-hr">';
		content += '<p class="main">Cluster: ' + d.cluster + '</span></p>';
		if (filter === "rank_bc" || filter === "rank_pr") {
			if (filter === "rank_bc") {
				content += '<p class="main">Rank BC: ' + d.Rank_BC + '</span></p>';
			} else {
				content += '<p class="main">Rank PR: ' + d.Rank_PG + '</span></p>';
			}
		}
		tooltip.showTooltip(content, d3.event);
		if (link) {
			conList = [];
			link.attr("stroke", function(l) {
				if (l.source === d || l.target === d) {
					// rec_lists function
					if (l.target.name !== d.name) {
						conList.push(l.target);
					}
					//return "#555";
					return nodeColors(l.source.cluster);
				} else {
					return "#ddd";
				}
			}).attr("stroke-opacity", function(l) {
				if (l.source === d || l.target === d) {
					return 1.0;
				} else {
					return 0.5;
				}
			}).style("stroke-width", function(l) {
				if (l.source === d || l.target === d) {
					return 4;
				} else {
					return 1;
				}				
			});
		}
		// content += '<hr class="tooltip-hr">';
		// if (rec_lists.length < 1) {
		// rec_lists = "없음";
		// }
		// content += '<p class="main">추천: ' + rec_lists + '</span></p>';
		// tooltip.showTooltip(content, d3.event);
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
		//console.dir(conList);
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
			return link.attr("stroke", "#ddd").attr("stroke-opacity", 0.8);
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
	d3.selectAll("#highlights a").on("click", function(d) {
		var newHighlight;
		newHighlight = d3.select(this).attr("id");
		activate("highlights", newHighlight);
		return myNetwork.toggleHighlight(newHighlight);
	});	
	/*
	$("#data_select").on("change", function(e) {
		var dataFile;
		dataFile = $(this).val();
		return d3.json("../data/" + dataFile, function(json) {
			return myNetwork.updateData(json);
		});
	});
	*/
	$("#search").keyup(function() {
		var searchTerm;
		searchTerm = $(this).val();
		return myNetwork.updateSearch(searchTerm);
	});
	return d3.json("../data/ChatOn.json", function(json) {
		return myNetwork("#vis", json);
	});
});
