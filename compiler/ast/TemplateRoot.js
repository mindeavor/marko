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
        var body = this.body;
        codegen.addStaticVar('str', '__helpers.s');
        codegen.addStaticVar('empty', '__helpers.e');
        codegen.addStaticVar('notEmpty', '__helpers.ne');
        codegen.addStaticVar('escapeXml', '__helpers.x');

        var builder = codegen.builder;
        var program = builder.program;
        var functionDeclaration = builder.functionDeclaration;
        var vars = builder.vars;
        var returnStatement = builder.returnStatement;
        var slot = builder.slot;

        var staticsSlot = slot();

        var outputNode = program([
            functionDeclaration('create', ['__helpers'], [
                staticsSlot,

                returnStatement(
                    functionDeclaration('render', ['data', 'out'], body))
            ]),
            '(module.exports = require("marko").c(__filename)).c(create)'
        ]);

        codegen.generateCode(outputNode);

        var staticVars = codegen.getStaticVars();
        var staticCodeArray = codegen.getStaticCode();

        var staticContent = [vars(createVarsArray(staticVars))];
        if (staticCodeArray) {
            staticCodeArray.forEach((code) => {
                staticContent.push(code);
            });
        }

        staticsSlot.setContent(staticContent);
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