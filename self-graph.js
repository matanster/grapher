var esprima = require('esprima');
var fs = require('fs')
var source = fs.readFileSync('./grapher.js').toString()
var parsed = esprima.parse(source)
//var parsed = JSON.parse(fs.readFileSync('./parse.out'))
//console.dir(JSON.stringify(parsed, null, 2))
fs.writeFileSync('./parse.out', JSON.stringify(parsed, null, 2))

var declaredFunctions = []
var functionCalls = []

function getFunctions(dataTree) {

  function recurse(node) {
    for (e in node) {
      element = node[e]
      if (element != null) {
        if (element.type === 'FunctionDeclaration') declaredFunctions.push(element.id.name)            
        if (Array.isArray(element)) recurse(element)
        else if (typeof(element) == 'object') recurse(element)
      }
    }
  }

  recurse(dataTree);
}

function getCalls(dataTree) {

  var functionOwner

  function recurse(node) {
    for (e in node) {
      element = node[e]

      if (element != null) {
        if (element.type === 'FunctionDeclaration') functionOwner = element.id.name         
        if (element.callee) {
          if (element.callee.name) 
            functionCalls.push({callee: element.callee.name, caller: functionOwner})
        }
        if (Array.isArray(element)) recurse(element)
        else if (typeof(element) == 'object') recurse(element)
      }
    }
  }

  recurse(dataTree);
}

getFunctions(parsed)
console.log(declaredFunctions.length)
console.dir(declaredFunctions)

console.log()

getCalls(parsed)
console.log(functionCalls.length)
console.dir(functionCalls)
