/* global graph, joint, paper */

var warning = '<path transform="scale(1.5) translate(-14,-8)" d="M 15 22 L 21 22 L 15 8 L 15 8 L 9 22 Z" fill="orange"/><path transform="scale(.4) translate(-13,20)" d="M 16 20 L 20 20 L 24 4 L 8 4 L 12 20 Z M 16 29 C 12 29 12 23 16 23 C 20 23 20 29 16 29 Z" fill="black"/><title class="warning"></title>';
var warningState = '<g class="element-tools"><g class="element-warning" transform="translate(-12, -12)">' + warning + '</g></g>';
var warningFilter = {
    name: 'highlight',
    args: {
        color: 'DarkOrange',
        width: 5,
        opacity: 0.5,
        blur: 5
    }
};
var goodFilter = {
    name: 'dropShadow',
    args: {
        color: 'Green',
        dx: 2,
        dy: 2,
        blur: 5
    }
};

//taille de la police d'ecriture du nom
var nameSize = 12;
//taille des entree et sorties
var eventSize = 12;
//taille de l'espacement a laquelle un etat enfant va apparaitre
var childBorder = 10;
//espacement entre le nom et le bord
var spaceRectText = 4;
//distance pour les element des outils
var toolO = 15;
//distance des bords (verticalement)des boutons alert
var heightAlert = 30;
//distance des bords (horizontalement) des boutons alert
var widthAlert = 45;
//distance region composite state
var compDist = 5;
//radius of circle tool
var radius = 11;
//space between normal vertex
var spaceNV = 20;
//space between loop vertex
var spaceLV = 20;

//Cette methode permet de mettre tout les enfants d'une cellule sur la couche supérieur.
var cellsToFront = function (cell) {
    son = cell.getEmbeddedCells();
    if (son.length > 0) {
        son.forEach(function (element) {
            element.toFront();
            if (element.attributes.type == "Statechart.States") {
                cellsToFront(element);
            }
        });
    }
};

//Cette methode permet de rafraichir le graphe
var resetCells = function () {
    //replace tout les éléments du graph sans les outils
    graph.resetCells(graph.getCells());
    //rajoute les outils aux transitions
    graph.getLinks().forEach(function (link) {
        addLinktools(link);
        link.findView(paper).hideTools();
        link.toFront();
    });
    //replace l'entite "outils" au sommet de tout les elements
    tools = graph.getCells().filter(elem => elem.attributes.type == "Statechart.Tools");
    if (tools.length > 0) {
        tools.forEach(function (element) {
            element.toFront();
        });
    }
};

//numero du prochain etat cree
var nameID = 1;

//permet de donner un nom par default a un etat
var newName = function (cell) {
    cell.prop("name", "state " + nameID);
    nameID++;
};

//permet d'ajouter un prefix et un suffixe a une chaine de caractere
var addPrefSuf = function (elem, pref, suff) {
    if (pref !== null) {
        elem = pref + elem;
    }
    if (suff !== null) {
        elem = elem + suff;
    }
    return(elem);
};

//detecte si une cellule est orthogonal.
var isOrthogonal = function (graph, cells) {
    if (cells.length == 1) {
        return false;
    }

    var res = true;
    cells.forEach(function (elem) {
        if (elem.attributes.type !== "Statechart.InitialState") {
            //verifie qu'auncun liens ne partent ou n'arrivent aux etats enfants sauf les boucles.
            var links = graph.getLinks().filter(link => (link.getSourceCell() == elem && link.getTargetCell() != elem) || (link.getTargetCell() == elem && link.getSourceCell() != elem));
            if (links.length > 0) {
                res = false;
            }
        } else {
            res = false;
        }
    });

    return res;
};

var checkLink = function (cell) {
    let links = graph.getLinks().filter(link => link.getSourceCell().id == cell.id || link.getTargetCell().id == cell.id);
    links.forEach(function (link) {
        let source = link.getSourceCell();
        let type = source.attributes.type;
        if ((type == 'Statechart.HistoricalState')
                || (type == 'Statechart.DeepHistoricalState')
                || (type == 'Statechart.InitialState')) {
            if (childHistInitLink(link, null, null)) {
                source.removeBadLink();
            } else {
                source.addBadLink();
            }
        }
    });
};

var showHideWarning = function () {
    let warning = this.get('attrs')['.warning'].list;
    if (warning.size == 0) {
        this.attr('.body/filter', "");
        this.attr('.element-warning/visibility', 'hidden');
        this.attr('.warning/text', "");
    } else {
        this.attr('.body/filter', warningFilter);
        this.attr('.element-warning/visibility', 'visible');
        let warn = [];
        warning.forEach(elem => warn.push(elem));
        this.attr('.warning/text', warn.join(' / '));
    }
};

var hadRootW = function () {
    return (this.get('attrs')['.warning'].list.get("badRoot") != null);
};

var haveProblem = function () {
    return (this.get('attrs')['.warning'].list.size > 0);
};

let rxState = 10;
let ryState = 10;

//definition de l'interface d'un etat
joint.shapes.basic.Generic.define('Statechart.StateInterface', {
    size: {width: 20, height: 20},
    attrs: {
        //partie qui contiendra le nom de l'etat
        '.name-text': {
        },
        //partie qui contiendra les entrees l'etat
        '.entry-text': {
        },
        //partie qui contiendra les sorties l'etat
        '.exit-text': {
        },
        '.warning': {
            'list': null
        },
        '.element-warning': {
            'visibility': 'hidden',
            'stroke': 'black', 'stroke-width': 1
        }
    },
    name: [""],
    entry: [""],
    exit: [""],
    contrat: []
}, {

    initialize: function () {

        this.on({
            'change:name': this.updateName,
            'change:entry': this.updateEntry,
            'change:exit': this.updateExit
        }, this);
        this.attr('.exit-text/text', this.get('exit'));
        this.attr('.name-text/text', this.get('name'));
        this.attr('.entry-text/text', this.get('entry'));
        this.initializeList();
        joint.shapes.basic.Generic.prototype.initialize.apply(this, arguments);
    },
    initializeList: function () {
        this.attr('.warning/list', new Map());
    },
    updateName: function () {
        this.attr('.name-text/text', this.get('name'));
    },
    updateEntry: function () {
        this.attr('.entry-text/text', this.get('entry'));
    },
    updateExit: function () {
        this.attr('.exit-text/text', this.get('exit'));
    },
    getClassName: function () {
        return this.get('name');
    },
    getEntry: function () {
        return this.get('entry');
    },
    getExit: function () {
        return this.get('exit');
    },
    getLisError: function () {
        return this.get('attrs')['.warning'].list;
    },
    setListError: function (list) {
        this.get('attrs')['.warning'].list = list;
    },
    updateAllText: function () {
        this.updateName();
        this.updateEntry();
        this.updateExit();
    },
    addDuplicate: function () {
        this.get('attrs')['.warning'].list.set("duplicate", "Duplicate name: this state has the same name as another");
        this.showHideWarning();
    },
    removeDuplicate: function () {
        this.get('attrs')['.warning'].list.delete("duplicate");
        this.showHideWarning();
    },
    removeMultiple: function () {
        this.get('attrs')['.warning'].list.delete("badRoot");
        this.showHideWarning();
    },
    isPossibleToaddLink: function () {
        return true;
    },
    canAcceptTarget: function () {
        return true;
    },
    canAcceptSource: function () {
        return true;
    },
    showHideWarning,
    hadRootW,
    haveProblem
});

//definition d'un etat final
joint.shapes.Statechart.StateInterface.define('Statechart.EndState', {
    size: {width: 20, height: 20},
    attrs: {
        'circle.body': {
            transform: 'translate(10, 10)',
            r: 10,
            fill: '#ffffff',
            stroke: '#2c3e50'
        },

        'circle.inner': {
            transform: 'translate(10, 10)',
            r: 6,
            fill: '#34495e'
        }
    }
}, {
    markup: [
        '<g class="rotatable">',
        '<g class="scalable">',
        '<circle class="body"/><circle class="inner"/>',
        '</g></g>',
        warningState].join(''),
    addMultipleRoot: function () {
        this.get('attrs')['.warning'].list.set("badRoot", "Bad Root: a 'final state' can't be a 'root state'");
        this.showHideWarning();
    },
    canAcceptSource: function () {
        return false;
    }
});

//definition d'un etat historique de type shallow
joint.shapes.Statechart.StateInterface.define('Statechart.HistoricalState', {
    size: {width: 20, height: 20},
    attrs: {
        'circle.body': {
            fill: '#ffffff',
            stroke: '#2c3e50',
            r: 10,
            cx: 10,
            cy: 10
        },
        'text.H': {
            'ref': 'circle',
            'font-size': 10,
            text: 'H',
            'text-anchor': 'middle',
            'ref-x': .5,
            'ref-y': .5,
            'y-alignment': 'middle',
            fill: '#000000',
            'font-family': 'Times New Roman'
        }
    }
}, {
    markup: [
        '<g class="rotatable">',
        '<g class="scalable">',
        '<circle class="body"/></g>',
        '<text class="H"/>',
        '</g>',
        warningState].join(''),

    addMultipleRoot: function () {
        this.get('attrs')['.warning'].list.set("badRoot", "Bad Root: a 'shallow history state' can't be a 'root state'");
        this.showHideWarning();
    },
    addBadLink: function () {
        this.get('attrs')['.warning'].list.set("badLink", "Bad Link: a 'history state' can't have a link that goes outside of his parent cell");
        this.showHideWarning();
    },
    removeBadLink: function () {
        this.get('attrs')['.warning'].list.delete("badLink");
        this.showHideWarning();
    },
    canAcceptSource: function () {
        let link = graph.getLinks().filter(link => link.getSourceCell() == this);
        return (link.length < 2);
    }
});

//definition d'un etat historique de type deep
joint.shapes.Statechart.HistoricalState.define('Statechart.DeepHistoricalState', {
    size: {width: 20, height: 20},
    attrs: {
        'text.asterisk': {
            'ref': 'text.H',
            'text': '*',
            'font-size': 10,
            'text-anchor': 'middle',
            'ref-x': .95,
            'ref-y': .2,
            'y-alignment': 'middle',
            'fill': '#000000',
            'font-family': 'Times New Roman'
        }
    }
}, {
    markup: [
        '<g class="rotatable">',
        '<g class="scalable">',
        '<circle class="body"/>',
        '</g><text class="asterisk"/>',
        '<text class="H"/>',
        '</g>',
        warningState].join(''),

    addMultipleRoot: function () {
        this.get('attrs')['.warning'].list.set("badRoot", "Bad Root: a 'deep history state' can't be a 'root state'");
        this.showHideWarning();
    }
});

//definition d'un etat initial
joint.shapes.basic.Generic.define('Statechart.InitialState', {
    size: {width: 20, height: 20},
    attrs: {
        'circle.body': {
            transform: 'translate(10, 10)',
            r: 10,
            fill: '#34495e'
        },
        '.warning': {
            list: null
        },
        '.element-warning': {
            visibility: 'hidden',
            'stroke': 'black', 'stroke-width': 1
        }
    }
}, {
    markup: [
        '<g class="rotatable">',
        '<g class="scalable">',
        '<circle class="body"/>',
        '</g></g>',
        warningState].join(''),
    initialize: function () {
        this.on({
            'change:parent': this.checkIni
        }, this);

        this.initializeList();
        joint.shapes.basic.Generic.prototype.initialize.apply(this, arguments);
    },
    checkIni: function (element,newParent) {
        if (newParent == null) {
            this.removeMultipleIni();
        }
    },
    initializeList: function () {
        this.attr('.warning/list', new Map());
    },
    addBadLink: function () {
        this.get('attrs')['.warning'].list.set("badLink", "Bad Link: a 'initial state' can't have a link that goes outside of his parent cell");
        this.showHideWarning();
    },
    removeBadLink: function () {
        this.get('attrs')['.warning'].list.delete("badLink");
        this.showHideWarning();
    },
    showHideWarning,
    addMultipleRoot: function () {
        this.get('attrs')['.warning'].list.set("badRoot", "Bad Root: a 'initial state' can't be a 'root state'");
        this.showHideWarning();
    },
    removeMultiple: function () {
        this.get('attrs')['.warning'].list.delete("badRoot");
        this.showHideWarning();
    },
    addMultipleIni: function () {
        this.get('attrs')['.warning'].list.set("badIni", "Multiple initial state: a 'state' can only have one 'initial state'");
        this.showHideWarning();
    },
    removeMultipleIni: function () {
        this.get('attrs')['.warning'].list.delete("badIni");
        this.showHideWarning();
    },
    addMissigLink: function () {
        this.get('attrs')['.warning'].list.set("missigLink", "'Initial state' requires a link to another state");
        this.showHideWarning();
        addIniMissLink(this);
    },
    removeMissigLink: function () {
        this.get('attrs')['.warning'].list.delete("missigLink");
        this.showHideWarning();
        removeIniMissLink(this);
    },
    getLisError: function () {
        return this.get('attrs')['.warning'].list;
    },
    setListError: function (list) {
        this.get('attrs')['.warning'].list = list;
    },
    canAcceptTarget: function () {
        return false;
    },
    canAcceptSource: function () {
        let link = graph.getLinks().filter(link => link.getSourceCell() == this);
        return (link.length < 2);
    },
    hadRootW,
    haveProblem
});

//definition d'un etat
joint.shapes.Statechart.StateInterface.define('Statechart.States', {
    type: 'Statechart.State',
    attrs: {
        '.body': {
            'width': 200, 'height': 200, 'rx': rxState, 'ry': ryState,
            'stroke': 'black', 'stroke-width': 3,
            'fill': 'rgba(240,240,200)',
            'child': false,
            'type': 'composite', 'depth': 0,
            'strokeDasharray': 0
        },
        '.name-text': {
            'ref': '.body',
            'ref-y': (nameSize / 2) + spaceRectText,
            'ref-x': .5,
            'text-anchor': 'middle',
            'y-alignment': 'middle',
            'font-weight': 'bold',
            'fill': 'black',
            'font-size': nameSize,
            'font-family': 'Times New Roman'
        },
        '.child': {
            'x': 1,
            'width': 0, 'height': 0,
            'rx': rxState, 'ry': ryState,
            'fill': '#fffff'
        },
        '.childCache': {
            'x': 1,
            'width': 0, 'height': ryState,
            'fill': '#fffff'
        },
        '.Allevents-text': {
            'ref': '.name-event-separator', 'ref-y': eventSize / 2, 'ref-x': eventSize / 2,
            'fill': 'black', 'font-size': eventSize, 'height': "100%", 'width': "50%", 'font-family': 'Times New Roman'
        },
        '.name-event-separator': {
            'stroke': 'black', 'stroke-width': 2
        },
        '.event-class-separator': {
            'stroke': 'black', 'stroke-width': 2, y: 0
        }
    },
    internalTransitions: []
}, {
    markup: [
        '<g class="rotatable">',
        '<g class="scalable">',
        '<rect class="body"/>',
        '<rect class="child"/>',
        '<rect class="childCache"/>',
        '</g>',
        '<path class="name-event-separator"/><path class="event-class-separator"/>',
        '<text class="name-text"/><text class="Allevents-text"/>',
        '</g>',
        warningState

    ].join(''),

    initialize: function () {

        this.on({
            'change:name': this.updateName,
            'change:entry': this.updateEntry,
            'change:exit': this.updateExit,
            'change:internalTransitions': this.updateSize,
            'change:size': this.updateSize,
            'change:embeds': this.checkIni,
            'change:parent': this.changeParent
        }, this);

        this.attr('.name-text/text', this.get('name'));
        this.attr('.entry-text/text', this.get('entry'));
        this.attr('.exit-text/text', this.get('exit'));
        this.initializeList();
        this.updateSize();

        joint.shapes.basic.Generic.prototype.initialize.apply(this, arguments);
    },
    updateName: function () {
        this.attr('.name-text/text', this.get('name'));
        this.updateSize();
    },

    updateEntry: function () {
        this.attr('.entry-text/text', this.get('entry'));
        this.updateSize();
    },

    updateExit: function () {
        this.attr('.exit-text/text', this.get('exit'));
        this.updateSize();
    },
    
    updateIT: function(newIT){
        this.internalTransitions = newIT;
    },
    
    removeChild: function (cell) {
        this.unembed(cell);
        if (this.get('embeds').length == 0) {
            this.get('attrs')['.body'].child = false;
            this.updateDepth(0);
            this.updateColor();
        }

        this.updateSize();
    },
    checkIni: function () {
        let ini = this.getEmbeddedCells().filter(cellSec => cellSec.attributes.type == "Statechart.InitialState");
        if (ini.length == 1) {
            ini[0].removeMultipleIni();
        }
        if (ini.length > 1) {
            ini.forEach(function (cellSec) {
                cellSec.addMultipleIni();
            });
        }
    },
    //rajoute une cellule enfant a l'etat
    addChild: function (cell) {
        let attrs = this.get('attrs');
        if (!this.get('attrs')['.body'].child) {
            this.get('attrs')['.body'].child = true;
            this.updateColor();
        }

        if (cell == null) {
            cell = new joint.shapes.Statechart.States({
                size: {width: 100, height: 40},
                position: {x: this.attributes.position.x + childBorder, y: this.attributes.position.y + attrs['.event-class-separator'].y + childBorder}
            });
            graph.addCell(cell);
            newName(cell);
        }

        this.embed(cell);

        cellsToFront(this);

        this.updateSize();
    },

    updateColor: function () {
        let alpha = 25 * (this.get('attrs')['.body'].depth);
        if (alpha > 125) {
            alpha = 125;
        }
        this.attr('.body/fill', "rgba(" + (240 - alpha) + "," + (240 - alpha) + "," + (200 - alpha) + ")");
    },

    changeType: function () {
        if (this.get('attrs')['.body'].type == "composite") {
            this.get('attrs')['.body'].type = "orthogonal";
            if (this.get('attrs')['.body'].type == "orthogonal") {
                this.attr('.body/strokeDasharray', "2,2,2");
            }
        } else {
            this.get('attrs')['.body'].type = "composite";
            this.attr('.body/strokeDasharray', 0);
        }
        this.updateColor();
    },

    getType: function () {
        return this.get('attrs')['.body'].type;
    },

    haveChild: function () {
        return this.get('attrs')['.body'].child;
    },

    getDepth: function () {
        return this.get('attrs')['.body'].depth;
    },

    updateDepth: function (depth) {
        this.get('attrs')['.body'].depth = depth;
        this.updateColor();
        this.changeParent(null,this.getParentCell());
    },

    changeParent: function (cell,newParent) {
        if (newParent != null) {
            graph.getCell(newParent).updateDepth(this.get('attrs')['.body'].depth + 1);
        }
    },

    //met a jour la taille de l'etat et ses composants.
    updateSize: function () {
        //taille et affichage du nom 
        let nameHeight = 2 * (spaceRectText) + nameSize;
        let name = this.getClassName();
        let minimumWidth = name.length * nameSize;
        //calcul de la taille des entrees et sorties
        let rectHeight = 0;

        let entry = [];
        this.get('entry').forEach(function (element) {
            if (element !== "") {
                entry.push(addPrefSuf(element, "entry / ", null));
            }
        });

        let exit = [];
        this.get('exit').forEach(function (element) {
            if (element !== "") {
                exit.push(addPrefSuf(element, "exit / ", null));
            }
        });
        
        let internalTrans =[];
        this.get('internalTransitions').forEach(function (element) {
            let text = "";
            if (element[0] !== "") {
                text += element[0];
            }
            text += " / ";
            if (element[1] !== "") {
                text += "["+element[1]+"]";
            }
            if (element[2] !== "") {
                var actions = element[2].split("\n").filter( function(val){return val !== '';} );
                text += actions.join(';');
            }
            
            if (text !== " / ") {
                internalTrans.push(text);
            }
        });

        let textEvent = [
            entry,
            exit,
            internalTrans
        ];

        let lines = [];
        textEvent.forEach(function (text) {
            newLines = Array.isArray(text) ? text : [text];
            if (!(newLines.length == 0 && newLines[0] == "")) {
                newLines.forEach(function (aLine) {
                    let possibleSize = aLine.length * eventSize / 2;
                    if (possibleSize > minimumWidth) {
                        minimumWidth = possibleSize;
                    }
                });
                lines = lines.concat(newLines);
            }
        });

        minimumWidth = minimumWidth + rxState;

        if (lines.length) {
            rectHeight = eventSize + (lines.length * eventSize);
        }

        //longeur et largeur minimum de l'etat
        let minimumHeight = rectHeight + nameHeight + ryState;
        let stateHeight = this.attributes.size.height;

        //affichage des entrees et sorties
        this.attr('.Allevents-text/text', lines.join('\n'));

        let offsetY = nameHeight + rectHeight;

        this.attr('.body/strokeDasharray', 0);

        if (this.haveChild()) {
            if (this.get('attrs')['.body'].type == "orthogonal") {
                this.attr('.body/strokeDasharray', "2,2,2");
            }
            this.attr('.event-class-separator/visibility', 'visible');
            this.attr('.child/visibility', 'visible');
            this.attr('.childCache/visibility', 'visible');
            let xMin = 999999;
            let yMin = 999999;
            let widthMax = 0;
            let heightMax = 0;
            let thisCell = this;
            this.getEmbeddedCells().forEach(function (child) {
                if (!child.isLink()) {
                    let x = child.get('position').x;
                    let y = child.get('position').y;
                    let width = child.get('size').width;
                    let height = child.get('size').height;
                    let xBis = thisCell.get('position').x;
                    let yBis = thisCell.get('position').y;

                    if (y < yMin) {
                        yMin = y;
                    }
                    if (x < xMin) {
                        xMin = x;
                    }
                    if (width + Math.abs(x - xBis) > widthMax) {
                        widthMax = width + Math.abs(x - xBis) + rxState;
                    }
                    if (height + Math.abs(y - yBis) > heightMax) {
                        heightMax = height + Math.abs(y - yBis) + childBorder;
                    }
                }
            });
            if (this.get('position').x > xMin) {
                this.position(xMin, this.get('position').y, {deep: false});
            }
            if (this.get('position').y + offsetY > yMin) {
                heightMax = heightMax + this.get('position').y + offsetY - yMin;
                this.position(this.get('position').x, yMin - offsetY, {deep: false});
            }
            if (minimumHeight < heightMax) {
                minimumHeight = heightMax;
            }
            if (minimumWidth < widthMax) {
                minimumWidth = widthMax;
            }
        } else {
            this.attr('.event-class-separator/visibility', 'hidden');
            this.attr('.child/visibility', 'hidden');
            this.attr('.childCache/visibility', 'hidden');
        }

        if (stateHeight < minimumHeight) {
            this.attributes.size.height = minimumHeight;
        }

        let stateWidth = this.attributes.size.width;
        if (stateWidth < minimumWidth) {
            this.attributes.size.width = minimumWidth;
        }

        var nameEventD = 'M 0 ' + nameHeight + ' L ' + this.get('size').width + ' ' + nameHeight;
        this.attr('.name-event-separator/d', nameEventD, {silent: true});

        var eventClassD = 'M 0 ' + offsetY + ' L ' + this.get('size').width + ' ' + offsetY;
        this.attr('.event-class-separator/d', eventClassD);
        this.attr('.event-class-separator/y', offsetY);


        this.attr('.child/width', this.get('size').width - 2);
        this.attr('.child/height', this.get('size').height - 1 - offsetY);
        this.attr('.child/y', offsetY);
        this.attr('.childCache/width', this.get('size').width - 2);
        this.attr('.childCache/y', offsetY);

        this.attr('.body/width', this.get('size').width);
        this.attr('.body/height', this.get('size').height);


        if (this.getParentCell() != null) {
            this.getParentCell().updateSize();
        }
        resetCells();
    },
    addMultipleRoot: function () {
        this.get('attrs')['.warning'].list.set("badRoot", "Multiple Root: only one 'root state' is authorized");
        this.showHideWarning();
    }
});

//definition des outils de selection d'un etat
joint.shapes.basic.Generic.define('Statechart.Tools', {
    size: {width: 20, height: 20},
    attrs: {
        '.name-rect': {
            'fill': '#31d0c6',
            'strokeDasharray': '3,1',
            'stroke': 'black',
            'stroke-width': 2,
            'event': 'element:contour:pointerdown'
        },
        '.NO': {
            'fill': '#ffffff',
            'stroke': '#2c3e50',
            'ref': '.name-rect',
            'ref-y': 0,
            'ref-x': '100%'
        },
        '.NE': {
            'fill': '#ffffff',
            'stroke': '#2c3e50',
            'ref': '.name-rect',
            'ref-y': 0,
            'ref-x': 0
        },
        '.SO': {
            'fill': '#ffffff',
            'stroke': '#2c3e50',
            'ref': '.name-rect',
            'ref-y': '100%',
            'ref-x': 0
        },
        '.SE': {
            'fill': '#ffffff',
            'stroke': '#2c3e50',
            'ref': '.name-rect',
            'ref-y': '100%',
            'ref-x': '100%'
        },
        '.element-tool-remove': {
            'visibility': 'visible',
            'event': 'element:element-tool-remove:pointerdown'
        },
        '.element-tool-addLinkTo': {
            'visibility': 'visible',
            'event': 'element:element-tool-addLinkTo:pointerdown'
        },
        '.element-tool-addLinkFrom': {
            'visibility': 'visible',
            'event': 'element:element-tool-addLinkFrom:pointerdown'
        },
        '.element-tool-changeType': {
            'visibility': 'hidden',
            'event': 'element:element-tool-changeType:pointerdown'
        }
    }}, {
    markup: [
        '<g class="rotatable">',
        '<g class="scalable">',
        '<path class="name-rect" transform="scale(.8) translate(-16, -16)" d="M16 48 L48 48 M48 48 L48 16 M48 16 L16 16 M16 16 L16 48"/>',
        '</g></g>',
        '<g class="NE"><circle fill="black" r="5"/></g>',
        '<g class="NO"><circle fill="black" r="5"/></g>',
        '<g class="SE"><circle fill="black" r="5"/></g>',
        '<g class="SO"><circle fill="black" r="5"/></g>',
        '<g class="element-tools">',
        '<g class="element-tool-remove" transform="translate(-15, -15)"><circle fill="red" r="' + radius + '"/>',
        '<path transform="scale(.8) translate(-16, -16)" d="M24.778,21.419 19.276,15.917 24.777,10.415 21.949,7.585 16.447,13.087 10.945,7.585 8.117,10.415 13.618,15.917 8.116,21.419 10.946,24.248 16.447,18.746 21.948,24.248z"/>',
        '<title>Remove this element from the model</title>',
        '</g></g>',
        '<g class="element-tools">',
        '<g class="element-tool-addLinkTo" transform="translate(15, -15)">',
        '<path transform="scale(1.5) translate(-20, -19)" d="M 34 18 L 27 18 L 27 15 L 22 19 L 27 23 L 27 20 L 34 20 Z M 13 15 L 13 23 L 22 23 L 22 15" style="fill: Black"/>',
        '<title>Add a link to this state</title>',
        '</g></g>',
        '<g class="element-tools">',
        '<g class="element-tool-addLinkFrom" transform="translate(15, -15)">',
        '<path transform="scale(1.5) translate(-20, -19)" d="M 13 18 L 19 18 L 19 15 L 24 19 L 19 23 L 19 20 L 13 20 Z M 24 15 L 24 23 L 32 23 L 32 15" style="fill: Black"/>',
        '<title>Add a link from this state</title>',
        '</g></g>',
        '<g class="element-tools">',
        '<g class="element-tool-changeType" transform="translate(-15, -15)"><circle fill="blue" r="' + radius + '"/>',
        '<path transform="scale(1) translate(-23, -14)" d="M 19 15 L 16 11 L 18 11 C 18 6 29 5 29 12 L 27 12 C 27 7 20 8 20 11 L 22 11 L 19 15 Z M 28 14 L 31 18 L 29 18 C 29 23 18 23 18 17 L 20 17 C 20 21 27 21 27 18 L 25 18 L 28 14 Z"/>',
        '<title class="type"></title>',
        '</g></g>'
    ].join(''),

    initialize: function () {

        this.on({
            'change:size': this.updateSize
        }, this);

        this.updateSize();

        joint.shapes.basic.Generic.prototype.initialize.apply(this, arguments);
    },

    changeType: function (type) {
        if (type == 'orthogonal') {
            this.attr('.type/text', 'change to "composite state"');
        } else {
            this.attr('.type/text', 'change to "orthogonal state"');
        }
    },

    updateSize: function () {
        let space = (radius * 2) + 4;
        this.get('attrs')['.element-tool-remove'].transform = "translate(" + (this.get("size").width + toolO + space) + "," + -toolO + ")";
        this.get('attrs')['.element-tool-changeType'].transform = "translate(" + (this.get("size").width + toolO) + "," + -toolO + ")";
        this.get('attrs')['.element-tool-addLinkFrom'].transform = "translate(" + (this.get("size").width + toolO) + "," + ((this.get("size").height / 2) - toolO) + ")";
        this.get('attrs')['.element-tool-addLinkTo'].transform = "translate(" + (this.get("size").width + toolO) + "," + ((this.get("size").height / 2) + toolO) + ")";
    }
});

//definition d'un message
joint.shapes.basic.Generic.define('Statechart.Note', {
    size: {width: 200, height: 100},
    attrs: {
        '.name-rect': {
            'pointerEvents': 'none',
            'stroke': 'black',
            'stroke-width': 2,
            'width': 10,
            'height': 10,
            'functionOfYes': null
        },
        '.name-text': {
            'pointerEvents': 'none',
            'ref': '.name-rect',
            'ref-y': .5,
            'ref-x': .5,
            'text-anchor': 'middle',
            'y-alignment': -40,
            'font-weight': 'bold',
            'fill': 'black',
            'font-size': nameSize,
            'font-family': 'Times New Roman',
            'text': ''
        },
        '.element-tool-accept': {
            'visibility': 'visible',
            'event': 'element:element-note-accept:pointerdown'
        },
        '.buttonAccept': {
            'fill': "green",
            'width': "20",
            'height': "20"
        }
    }
}, {
    markup: [
        '<g class="rotatable">',
        '<g class="scalable">',
        '<rect class="name-rect"/>',
        '</g>',
        '<text class="name-text"/>',
        '</g>',
        '<g class="element-tools">',
        '<g class="element-tool-accept" transform="translate(90, 70)"><rect class="buttonAccept"/>',
        '<path transform="scale(.8) translate(-6,-8)" d="M 10 20 L 17 27 L 27 14 L 24 12 L 17 21 L 13 17 L 10 20 Z"/>',
        '<title>Accept</title>',
        '</g></g>'
    ].join(''),

    initialize: function () {
        this.updateSize();
        joint.shapes.basic.Generic.prototype.initialize.apply(this, arguments);
    },

    updateSize: function () {
        let maxWidth = 2 * this.get('attrs')['.buttonAccept'].width;
        let text = this.get('attrs')['.name-text'].text.split("\n");

        text.forEach(function (line) {
            let width = (nameSize / 2) * line.length;
            if (width > maxWidth) {
                maxWidth = width;
            }
        });

        this.attributes.size.width = maxWidth + widthAlert;
        this.attributes.size.heigth = text.length * nameSize + heightAlert + this.get('attrs')['.buttonAccept'].height * 2;

        let width = (this.get("size").width / 2 - this.get('attrs')['.buttonAccept'].width / 2);
        let height = (this.get("size").height - this.get('attrs')['.buttonAccept'].height / 2 - heightAlert);
        this.get('attrs')['.element-tool-accept'].transform = "translate(" + width + "," + height + ")";
    },

    setText: function (text) {
        if (text !== null) {
            this.get('attrs')['.name-text'].text = text;
            this.updateSize();
        }
    }
});

//definition d'une alerte
joint.shapes.Statechart.Note.define('Statechart.Alert', {
    attrs: {
        '.element-tool-reject': {
            'visibility': 'visible',
            'event': 'element:element-tool-reject:pointerdown'
        },
        '.element-tool-accept': {
            'visibility': 'visible',
            'event': 'element:element-tool-accept:pointerdown'
        },
        '.buttonAccept': {
            'fill': "green",
            'width': "20",
            'height': "20"
        },
        '.buttonReject': {
            'fill': "red",
            'width': "20",
            'height': "20"
        }
    }}, {
    markup: [
        '<g class="rotatable">',
        '<g class="scalable">',
        '<rect class="name-rect"/>',
        '</g>',
        '<text class="name-text"/>',
        '</g>',
        '<g class="element-tools">',
        '<g class="element-tool-reject" transform="translate(70, 70)"><rect class="buttonReject"/>',
        '<path transform="scale(.8) translate(-4,-4)" d="M24.778,21.419 19.276,15.917 24.777,10.415 21.949,7.585 16.447,13.087 10.945,7.585 8.117,10.415 13.618,15.917 8.116,21.419 10.946,24.248 16.447,18.746 21.948,24.248z"/>',
        '<title>Reject</title>',
        '</g></g>',
        '<g class="element-tools">',
        '<g class="element-tool-accept" transform="translate(10, 70)"><rect class="buttonAccept"/>',
        '<path transform="scale(.8) translate(-6,-8)" d="M 10 20 L 17 27 L 27 14 L 24 12 L 17 21 L 13 17 L 10 20 Z"/>',
        '<title>Accept</title>',
        '</g></g>'
    ].join(''),

    updateSize: function () {
        let buttonWidth = Math.max(this.get('attrs')['.buttonAccept'].width, this.get('attrs')['.buttonReject'].width);
        let maxWidth = widthAlert + (3 * buttonWidth);
        let text = this.get('attrs')['.name-text'].text.split("\n");

        text.forEach(function (line) {
            let width = (nameSize / 2) * line.length;
            if (width > maxWidth) {
                maxWidth = width;
            }
        });

        this.attributes.size.width = maxWidth + widthAlert;
        this.attributes.size.heigth = text.length * nameSize + heightAlert + Math.max(this.get('attrs')['.buttonAccept'].height * 2, this.get('attrs')['.buttonReject'].height * 2);
        let height = (this.get("size").height - this.get('attrs')['.buttonAccept'].height / 2 - heightAlert);

        this.get('attrs')['.element-tool-accept'].transform = "translate(" + (widthAlert - (buttonWidth / 2)) + "," + height + ")";
        this.get('attrs')['.element-tool-reject'].transform = "translate(" + (this.get("size").width - widthAlert - (buttonWidth / 2)) + "," + height + ")";
    },

    accept: function () {
        if (this.get('attrs')['.name-rect'].functionOfYes != null) {
            this.get('attrs')['.name-rect'].functionOfYes();
        }
        ;
    },

    reject: function () {
        if (this.get('attrs')['.name-rect'].functionOfNo != null) {
            this.get('attrs')['.name-rect'].functionOfNo();
        }
        ;
    },

    setFunction: function (func1, func2) {
        this.get('attrs')['.name-rect'].functionOfYes = func1;
        this.get('attrs')['.name-rect'].functionOfNo = func2;
    }
});

//definition des transitions
joint.dia.Link.define('Satechart.Link', {
    attrs: {
        'line': {
            connection: true,
            stroke: '#333333',
            strokeWidth: 2,
            strokeLinejoin: 'round',
            targetMarker: {
                'type': 'path',
                'd': 'M 10 -5 0 0 10 5 z'
            }
        },
        'wrapper': {
            connection: true,
            strokeWidth: 10,
            strokeLinejoin: 'round'
        },
        '.guard-text': {
            'text': ""
        },
        '.action-text': {
            'text': ""
        },
        '.events-text': {
            'text': ""
        },
        'info': {
            'lastSource': null,
            'lasttarget': null
        }

    },
    contrat: [],
    defaultLabel: {
        markup: [
            {
                tagName: 'rect',
                selector: 'body'
            }, {
                tagName: 'text',
                selector: 'label'
            }
        ],
        attrs: {
            label: {
                fill: 'black', // default text color
                fontSize: 12,
                textAnchor: 'middle',
                yAlignment: 'middle',
                pointerEvents: 'none'
            },
            body: {
                ref: 'label',
                fill: 'white',
                opacity: 0.8,
                refWidth: '120%',
                refHeight: '120%',
                refX: '-10%',
                refY: '-10%'
            }
        }
    }
}, {
    markup: [{
            tagName: 'path',
            selector: 'wrapper',
            attributes: {
                'fill': 'none',
                'cursor': 'pointer',
                'stroke': 'transparent'
            }
        }, {
            tagName: 'path',
            selector: 'line',
            attributes: {
                'fill': 'none',
                'pointer-events': 'none'
            }
        }]
});

graph.on('change:source change:target', function (link) {
    link.reparent();
    changelinkTS(link);
});

//methode pour creer une transition
var createLink = function (cell, cell2 = cell) {
    let link = new joint.shapes.Satechart.Link();

    link.prop("attrs/.guard-text/text", [""]);
    link.prop("attrs/.action-text/text", [""]);
    link.prop("attrs/.events-text/text", [""]);


    link.source(cell);
    link.target(cell2);
    link.addTo(graph);
    link.connector('jumpover', {size: 10});
    link.appendLabel({
        attrs: {
            text: {
                text: ''
            }
        }
    });
    addLinktools(link);
    selectedLink = link.findView(paper);
    renitializationNE();

    link.reparent();
    changelinkTS(link);

    return link;
};


var reparentLink = function(cell){
    let links = graph.getLinks().filter(link => cell.id === link.getSourceCell().id || cell.id === link.getTargetCell().id );
    links.forEach(function(link){
        link.reparent();
    });
};

//methode pour rajouter les vertices a une transition qui change de source/cible
let changelinkTS = function (link) {
    if (link != null) {
        let sourceId = link.get('source').id;
        let targetId = link.get('target').id;
        if (!sourceId || !targetId) {
            return;
        }
        if (link.getSourceCell() != null) {
            if (sourceId === targetId) {
                //meme source meme cible
                if (link.vertices().length === 0) {
                    loop(link, sourceId, targetId);
                }
            } else {
                //source differante de cible
                if (link.vertices().length === 0) {
                    directLink(link, sourceId, targetId);
                }
            }
        }
    }
};

//methode pour rajouter les vertices a une transition directe
var directLink = function (link, sourceId, targetId) {
    let neighbour = graph.getLinks().filter(linkbis => linkbis.id !== link.id
                && (linkbis.get('source').id === sourceId && linkbis.get('target').id === targetId)
                || (linkbis.get('source').id === targetId && linkbis.get('target').id === sourceId)
                && (_.isEqual(link.getSourcePoint(), linkbis.getSourcePoint()) && _.isEqual(link.getTargetPoint(), linkbis.getTargetPoint()))
                || (_.isEqual(link.getSourcePoint(), linkbis.getTargetPoint()) && _.isEqual(link.getTargetPoint(), linkbis.getSourcePoint())));



    // milieu de la transition
    var sourceCenter = graph.getCell(sourceId).getBBox().center();
    var targetCenter = graph.getCell(targetId).getBBox().center();
    var midPoint = g.Line(sourceCenter, targetCenter).midpoint();

    var theta = sourceCenter.theta(targetCenter);

    let i = 0;

    let vertice = [];

    let needTest = true;
    while (needTest === true) {
        var offset = spaceNV * Math.ceil(i / 2);
        var sign = ((i % 2) ? 1 : -1);
        var reverse = ((theta < 180) ? 1 : -1);

        // we found the vertex
        let angle = g.toRad(theta + (sign * reverse * 90));
        vertice = [g.Point.fromPolar(offset, angle, midPoint)];

        let sup = neighbour.filter(linkBis => _.isEqual(linkBis.vertices(), vertice));
        if (sup.length === 0) {
            needTest = false;
        }
        i = i + 1;
    }
    link.vertices(vertice);
};

//methode pour rajouter les vertices a une transition qui boucle
var loop = function (link, sourceId, targetId) {
    let neighbour = graph.getLinks().filter(linkbis => linkbis.id !== link.id && linkbis.get('source').id === sourceId && linkbis.get('target').id === targetId);

    let sourceC = link.getSourceCell();
    let midPointX = (sourceC.get("size").width / 2) + sourceC.get("position").x;
    let pointY = sourceC.get("position").y;

    let i = 1;
    let vertice = [{x: midPointX - 20 * i, y: pointY - (2 * i * spaceLV)}, {x: midPointX + 20 * i, y: pointY - (2 * i * spaceLV)}];

    if (neighbour.length === 0) {
        let needTest = true;
        while (needTest === true) {
            i = i + 1;

            let sup = neighbour.filter(linkBis => _.isEqual(linkBis.vertices(), vertice));
            if (sup.length > 0) {
                vertice = [{x: midPointX - 20 * i, y: pointY - (2 * i * spaceLV)}, {x: midPointX + 20 * i, y: pointY - (2 * i * spaceLV)}];
            } else {
                needTest = false;
            }
        }
    }
    link.vertices(vertice);

};

//methode pour changer la source d'un lien et verifier que cela peut etre fait
var valChangeSourceLink = function (link, source) {
    if (link != null && source != null) {
        if (source.canAcceptSource()) {
            if (source.attributes.type == "Statechart.InitialState") {
                source.removeMissigLink();
                updateTextError();
            }
            link.prop("attrs/.info/lastSource", source);
        } else {
            if (source.attributes.type == "Statechart.EndState") {
                createNote("'End State'\ncan't be a 'source' of a link");
                let lS = link.attr(".info/lastSource");
                if (lS != null) {
                    link.source(lS);
                } else {
                    link.remove();
                }
            } else {
                createPopup(function () {
                    graph.getLinks().filter(newLink => newLink.getSourceCell().id == source.id && link.id != newLink.id)[0].remove();
                    link.prop("attrs/.info/lastSource", source);
                }, function () {
                    let lS = link.attr(".info/lastSource");
                    if (lS != null) {
                        link.source(lS);
                    } else {
                        link.remove();
                    }
                }, "do you want to replace\nthe current attached link\nwith the new attached link");
            }
        }
    }
};

//methode pour changer la cible d'un lien et verifier que cela peut etre fait
var valChangeTargetLink = function (link, target) {
    if (link != null && target != null) {
        if (target.canAcceptTarget()) {
            link.prop("attrs/.info/lastTarget", target);
        } else {
            if (target.attributes.type == "Statechart.InitialState") {
                createNote("'Initial State'\ncan't be a 'target' of a link");
                let lS = link.attr(".info/lastTarget");
                if (lS != null) {
                    link.target(lS);
                } else {
                    link.remove();
                }
            }
        }
    }
};


