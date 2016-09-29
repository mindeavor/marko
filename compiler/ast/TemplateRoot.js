'use strict';
var Node = require('./Node');

function createVarsArray(vars) {
    return Object.keys(vars).map(function(varName) {
        var varInit = vars[varName];
        return {
            id: varName,
            init: varInit
        };
    });
}

class TemplateRoot extends Node {
    constructor(def) {
        super('TemplateRoot');
        this.body = this.makeContainer(def.body);
    }

    generateCode(codegen) {
        var context = codegen.context;

        var body = this.body;
        codegen.addStaticVar('str', '__helpers.s');
        codegen.addStaticVar('empty', '__helpers.e');
        codegen.addStaticVar('notEmpty', '__helpers.ne');
        codegen.addStaticVar('escapeXml', '__helpers.x');

        var builder = codegen.builder;
        var program = builder.program;
        var functionDeclaration = builder.functionDeclaration;
        var functionCall = builder.functionCall;
        var memberExpression = builder.memberExpression;
        var returnStatement = builder.returnStatement;
        var code = builder.code;
        var slot = builder.slot;

        var staticsSlot = slot();
        var varsSlot = slot();
        var createSlot = slot();
        varsSlot.noOutput = true;

        body = [ varsSlot ].concat(body.items);

        var outputNode = program([
            functionDeclaration('create', ['__helpers'], [
                staticsSlot,

                returnStatement(
                    functionDeclaration('render', ['data', 'out'], body))
            ]),
            createSlot
        ]);

        codegen.generateCode(outputNode);

        var staticVars = context.getStaticVars();
        var staticCodeArray = context.getStaticCode();

        var staticContent = [builder.vars(createVarsArray(staticVars))];
        if (staticCodeArray) {
            staticCodeArray.forEach((code) => {
                staticContent.push(code);
            });
        }

        staticsSlot.setContent(staticContent);

        var vars = context.getVars();
        varsSlot.setContent(builder.vars(createVarsArray(vars)));

        var exports = code('(module.exports = require("marko").c(__filename))');
        var createFunction = memberExpression(exports, 'c');
        var createArgs = ['create'];

        if(context.meta) {
            createArgs.push(context.meta);
        }

        createSlot.setContent(functionCall(createFunction, createArgs));
    }

    toJSON(prettyPrinter) {
        return {
            type: this.type,
            body: this.body
        };
    }

    walk(walker) {
        this.body = walker.walk(this.body);
    }
}

module.exports = TemplateRoot;