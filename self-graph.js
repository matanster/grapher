var esprima = require('esprima');
var fs = require('fs')
var source = fs.readFileSync('./grapher.js').toString()
var parsed = esprima.parse(source)
//var parsed = JSON.parse(fs.readFileSync('./parse.out'))
//console.dir(JSON.stringify(parsed, null, 2))
fs.writeFileSync('./parse.out', JSON.stringify(parsed, null, 2))

var functionDeclarations = []
var functionCalls = []

function getFunctions(dataTree) {

  function recurse(element, functionOwner) { 
    if (element != null) {
      if (element.type === 'FunctionDeclaration') { 
        var functionName = element.id.name
        functionDeclarations.push({function: functionName, owningFunction: functionOwner}) 
        recurse(element.body, functionName)
        return           
      }
      if (Array.isArray(element) || typeof(element) == 'object') for (i in element) recurse(element[i], functionOwner)
    }
  }

  recurse(dataTree);
}

function getCalls(dataTree) {

  var functionOwner

  function recurse(element) {
    if (element != null) {
      if (element.type === 'FunctionDeclaration') functionOwner = element.id.name
      if (element.callee) {
        if (element.callee.name) 
          functionCalls.push({callee: element.callee.name, caller: functionOwner})
      }
      if (Array.isArray(element) || typeof(element) == 'object') for (i in element) recurse(element[i])
    }
  }

  recurse(dataTree);
}

getFunctions(parsed)
console.log(functionDeclarations.length)
console.dir(functionDeclarations)

console.log()

getCalls(parsed)
console.log(functionCalls.length)
console.dir(functionCalls)
