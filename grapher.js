
// anchor svg element
var width = 960, height = 500;
var svg = d3.select("body").append("svg")
  .attr("width", width)
  .attr("height", height);

// d3 force simulation layout
var forceSimulation = d3.layout.force()
  .linkDistance(80)
  .charge(-120)
  .gravity(.05)
  .size([width, height])
  .on("tick", tickHandler);

// tree representing the data -
// it will be mutated in order to hide and reshow nodes,
// or if we'd like to add nodes etc...
var dataTree;

// d3 managed svg nodes - d3 will manage bound data inside them
var linksD3 = svg.selectAll(".link")
var nodesD3 = svg.selectAll(".node")

// load the data from json
d3.json("graph.json", function(error, json) {
  dataTree = json;
  startVisualization();
});

function getLists() {
  // clever shortcut for de-structuring a links array and nodes array for force simulation input,
  // from a single json hierarchy
  var nodes = flattenDataTree(dataTree)
  var links = d3.layout.tree().links(nodes) // abusing the tree layout to get the links array through it...

  return {nodes, links}
}

//
// bind or re-bind the data to d3 -
// so that d3 can automagically do its transitions according to it
//
function rebind() {

  var data = getLists()
  var nodes = data.nodes
  var links = data.links

  nodesD3 = nodesD3.data(nodes, function(d) { return d.id; });
  linksD3 = linksD3.data(links, function(d) { return d.target.id; });

  return {nodesD3, linksD3}
}

function layoutRemoveCancelled(callback) {

  var fadeDuration = 1000

  var data = rebind()
  nodesD3 = data.nodesD3
  linksD3 = data.linksD3

  // sync away removed nodes
  var nodesTransition = nodesD3.exit().transition()
  nodesTransition.duration(fadeDuration).select("circle").style("opacity", 0)
  nodesTransition.duration(fadeDuration).select("text").style("opacity", 0)
  nodesTransition.delay(fadeDuration).remove()

  linksD3.exit().transition().duration(fadeDuration/2).ease('cubic').style("opacity", 0).remove()

  d3.timer(callback, fadeDuration/2)
  //node.exit().transition().delay(fadeDuration).each("end", force.start())

  // sync away removed links

}

//
// handle the syncing of new data with the visualization,
// among which, stacking the event behaviours they need
// to have to play nicely
//
function layoutInsertNew() {

  var data = rebind()
  nodesD3 = data.nodesD3
  linksD3 = data.linksD3

  var fadeDuration = 1000

  // sync away removed nodes
  var transition = nodesD3.exit().transition()
  transition.duration(fadeDuration).select("circle").style("opacity", 1)
  transition.duration(fadeDuration).select("text").style("opacity", 1)

  linksD3.enter().insert("line", ".node")
    .attr("class", "link");

  // sync nodes
  var nodeEnter = nodesD3.enter().append("g")
    .attr("class", "node")
    .on("click", click)
    .call(forceSimulation.drag);

  nodeEnter.append("circle")
    .attr("r", function(d) { return Math.sqrt(d.size) / 2 || 30; });

  nodeEnter.append("text")
    .attr("dy", ".35em")
    .text(function(d) { return d.name; });

  nodesD3.select("circle")
    .style("fill", colorByState);

}


function startVisualization() {

  // de-structure the data for d3
  var data = getLists()
  var nodes = data.nodes
  var links = data.links

  // second tier of d3 binding - bind the d3 data to the d3 simulation
  forceSimulation
    .nodes(nodes)
    .links(links)

  layoutInsertNew(); // cause all data is new when firstly bound

  // start the simulation
  forceSimulation.start()
}

//
// when the force simulation is running, synchronizes the location
// of the d3 managed svg elements to the current simulation values
//
function tickHandler() {
  linksD3.attr("x1", function(d) { return d.source.x; })
    .attr("y1", function(d) { return d.source.y; })
    .attr("x2", function(d) { return d.target.x; })
    .attr("y2", function(d) { return d.target.y; });

  nodesD3.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
}

function colorByState(d) {
  // TODO: this isn't really making the desired effect now. probably not called from the right places
  return d._children ? "#3182bd" // when children collapsed
    : d.children ? "#c6dbef"   // when children visible
    : "#c6dbef";               // leaf node color
}

// TODO: split into drag ignoring and actual children handling functions
// Stash away or recover node's children in the input tree
function click(d) {
  if (d3.event.defaultPrevented) return; // ignore drag

  if (d.children) {
    forceSimulation.stop()
    d._children = d.children
    d.children = null
    layoutRemoveCancelled(forceSimulation.resume)
  } else {
    d.children = d._children
    d._children = null
    layoutInsertNew()
  }
}

// Flattens an input tree into a list
function flattenDataTree(dataTree) {
  var nodes = [], i = 0;

  function recurse(node) {
    if (node.children) node.children.forEach(recurse);
    if (!node.id) node.id = ++i;
    nodes.push(node);
  }

  recurse(dataTree);
  return nodes;
}
