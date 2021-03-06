var EMPTY_ARRAY = require('./util').EMPTY_ARRAY;

var DocumentFragment;

function assignNamespace(node, namespaceURI) {
    node.namespaceURI = namespaceURI;
    var childNodes = node.childNodes;
    var childCount = node._childCount;

    for (var i=0; i<childCount; i++) {
        var child = childNodes[i];
        if (child._nsAware) {
            assignNamespace(childNodes[i], namespaceURI);
        }
    }
}

function Node(finalChildCount) {
    if (finalChildCount !== -1) {
        var childNodes;
        var firstChild;
        var lastChild;

        if (finalChildCount === 0) {
            childNodes = EMPTY_ARRAY;
        } else if (finalChildCount > 0) {
            childNodes = new Array(finalChildCount);
        } else {
            childNodes = [];
        }

        this.childNodes = childNodes;
        this._finalChildCount = finalChildCount;
        this._childCount = 0;
        this._firstChild = firstChild;
        this._lastChild = lastChild;
    }

    this.parentNode = undefined;
    this._nextSibling = undefined;
}

Node.prototype = {
    removeChildren: function() {
        this.childNodes.length = 0;
        this._firstChild = undefined;
        this._childCount = 0;
        this._lastChild = undefined;
    },

    get firstChild() {
        var firstChild = this._firstChild;

        if (firstChild && firstChild.nodeType === 11 /* DocumentFragment */) {
            var nestedFirstChild = firstChild.firstChild;
            // The first child is a DocumentFragment node.
            // If the DocumentFragment node has a first child then we will return that.
            // Otherwise, the DocumentFragment node is not *really* the first child and
            // we need to skip to its next sibling
            return nestedFirstChild || firstChild.nextSibling;
        }

        return firstChild;
    },

    get lastChild() {
        var lastChild = this._lastChild;

        if (lastChild && lastChild.nodeType === 11 /* DocumentFragment */) {
            return lastChild.lastChild;
        }

        return lastChild;
    },

    get nextSibling() {
        var nextSibling = this._nextSibling;

        if (nextSibling) {
            if (nextSibling.nodeType === 11 /* DocumentFragment */) {
                var firstChild = nextSibling.firstChild;
                return firstChild || nextSibling.nextSibling;
            }
        } else {
            var parentNode = this.parentNode;
            if (parentNode && parentNode.nodeType === 11) {
                return parentNode.nextSibling;
            }
        }

        return nextSibling;
    },

    appendDocumentFragment: function() {
        return this.appendChild(new DocumentFragment());
    },

    appendChild: function(child) {
        if (this._isTextArea) {
            if (child.nodeType === 3) {
                var currentValue = this.value;
                this.value = currentValue ? currentValue + child.nodeValue : child.nodeValue;
            } else {
                throw new Error('Invalid child');
            }
        } else {
            var namespaceURI;

            if (child._nsAware && (namespaceURI = this.namespaceURI) && !child.namespaceURI) {
                assignNamespace(child, namespaceURI);
            }

            var index = this._childCount++;
            this.childNodes[index] = child;

            child.parentNode = this;

            if (index === 0) {
                this._firstChild = child;
            } else {
                this._lastChild._nextSibling = child;
            }

            this._lastChild = child;
        }

        return child;
    },

    _finishChild: function() {
        if (this._childCount === this._finalChildCount && this.parentNode) {
            return this.parentNode._finishChild();
        } else {
            return this;
        }
    }

    // ,toJSON: function() {
    //     var clone = Object.assign({
    //         nodeType: this.nodeType
    //     }, this);
    //
    //     for (var k in clone) {
    //         if (k.startsWith('_')) {
    //             delete clone[k];
    //         }
    //     }
    //     delete clone._nextSibling;
    //     delete clone._lastChild;
    //     delete clone.parentNode;
    //     return clone;
    // }
};

module.exports = Node;

DocumentFragment = require('./DocumentFragment');