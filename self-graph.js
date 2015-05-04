var esprima = require('esprima');
var fs = require('fs')
var source = fs.readFileSync('./grapher.js').toString()
var parsed = esprima.parse(source)
//var parsed = JSON.parse(fs.readFileSync('./parse.out'))
//console.dir(JSON.stringify(parsed, null, 2))
fs.writeFileSync('./parse.out', JSON.stringify(parsed, null, 2))

var functionDeclarations = []
var functionCalls        = []
var functionPassing      = []

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

function getPlainCalls(dataTree) {

  function recurse(element, functionOwner) {
    if (element != null) {
      if (element.type === 'FunctionDeclaration') functionOwner = element.id.name
      if (element.callee) {
        if (element.callee.name) 
          functionCalls.push({callee: element.callee.name, caller: functionOwner})
      }
      if (Array.isArray(element) || typeof(element) == 'object') for (i in element) recurse(element[i], functionOwner)
    }
  }

  recurse(dataTree);
}

function getFunctionPassing(dataTree) {

  // javascript functions known to expect a function as their first argument
  var functionSinks = ['forEach']

  function recurse(element, functionOwner) {
    if (element != null) {
      if (element.type === 'FunctionDeclaration') functionOwner = element.id.name
      if (element.type === 'CallExpression') 
        if (element.callee.object)
          if (functionSinks.some(function(f) { return f === element.callee.property.name })) 
            functionPassing.push({callee: element.arguments[0].name, caller: functionOwner})
      if (Array.isArray(element) || typeof(element) == 'object') for (i in element) recurse(element[i], functionOwner)
    }
  }

  recurse(dataTree);
}

function debugArray(array) { 
  console.log()
  console.log(array.length)
  console.dir(array)
}

getFunctions(parsed)
debugArray(functionDeclarations)

getPlainCalls(parsed)
debugArray(functionCalls)

getFunctionPassing(parsed)
debugArray(functionPassing)

var calls = functionCalls.concat(functionPassing)

var sameSourceCalls = 
  calls.filter(function(fcall) { 
          return functionDeclarations.some(function(fdecl) { 
            return fcall.callee === fdecl.function })
        })

debugArray(sameSourceCalls)

