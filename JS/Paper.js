/* global joint, goodFilter, badFilter */

var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({
    el: $('#paper'),
    width: 800,
    height: 600,
    gridSize: 10,
    drawGrid: true,
    model: graph,
    defaultConnectionPoint: {
        name: 'boundary',
        args: {
            extrapolate: true,
            sticky: true
        }
    }
});


var popup = null;
var link = null;
var linkFrom = false;

var compToZ = [["Statechart.InitialState", 0], ["Statechart.EndState", 0], ["Statechart.DeepHistoricalState", 0], ["Statechart.HistoricalState", 0]];

var listOfError = new Map([["DuplicateName", new Map()],
    ["badRoot", new Map(compToZ)],
    ["multipleRoot", []],
    ["badIni", new Map()],
    ["missingTIni", new Map()]
]);

//methode pour mettre a jour la liste des erreurs
var updateListError = function () {
    updateNameErrCount();
    updateMultipleRoot();
    updateBadRoot();
    updateBadMissIni();
};

//methode pour supprimer les outils d'un etat
var hideTools = function () {
    if (StateTools != null) {
        StateTools.remove();
        StateTools = null;
    }
};

var deleteAlert = function () {
    if (popup != null) {
        popup.remove();
        popup = null;
    }
};

//methode pour ajouter les outils d'un lien
var addLinktools = function (link) {
    link.findView(paper).addTools(new joint.dia.ToolsView({
        tools: [
            new joint.linkTools.Vertices({snapRadius: 0}),
            new joint.linkTools.SourceArrowhead({attributes: {
                    'd': 'M -4 -15 4 -15 4 15 -4 15 Z',
                    'fill': '#33334F',
                    'stroke': '#FFFFFF',
                    'stroke-width': 2,
                    'cursor': 'move',
                    'class': 'target-arrowhead'
                }}),
            new joint.linkTools.TargetArrowhead(),
            new joint.linkTools.Remove({distance: 20, action: function (evt) {
                    removeElementProperty();
                    this.model.remove({ui: true});
                    if (this.sourceView) {
                        let modelS = this.sourceView.model;
                        if (modelS.attributes.type == "Statechart.InitialState") {
                            modelS.addMissigLink();
                        }
                    }
                }}),
            new joint.linkTools.SourceAnchor(),
            new joint.linkTools.TargetAnchor()
        ]
    }));
};

//methode pour ajouter les outils d'un etat
var showTools = function (cell) {
    posX = cell.get('position').x;
    posY = cell.get('position').y;
    width = cell.get('size').width;
    height = cell.get('size').height;
    StateTools = new joint.shapes.Statechart.Tools();
    toolx = posX - distanceOfTool;
    tooly = posY - distanceOfTool;
    StateTools.position(toolx, tooly);
    StateTools.resize(width + (2 * distanceOfTool), height + (2 * distanceOfTool));
    StateTools.addTo(graph);

    if (cell.attributes.type == "Statechart.EndState") {
        StateTools.attr('.element-tool-addLinkFrom/visibility', "hidden");
    } else if (cell.attributes.type == "Statechart.InitialState") {
        StateTools.attr('.element-tool-addLinkTo/visibility', "hidden");
    } else if (cell.attributes.type == "Statechart.States") {
        StateTools.attr('.element-tool-changeType/visibility', "visible");
        StateTools.changeType(cell.getType());
    }
};

//methode pour changer la taille d'un etat
var changeSizeElem = function (oldX, oldY, newX, newY) {
    //calcul les nouvelles valeurs
    diffX = newX - oldX;
    diffY = newY - oldY;
    cell = selectedCell.model;
    if (cell.get('position').x > oldX) {
        cell.set('position', {x: cell.get('position').x + diffX, y: cell.get('position').y});
        diffX = -diffX;
    }
    if (cell.get('position').y > oldY) {
        cell.set('position', {x: cell.get('position').x, y: cell.get('position').y + diffY});
        diffY = -diffY;
    }
    //applique les nouvelles valeurs a l'etat et son outil
    cell.set('size', {width: cell.get('size').width + diffX, height: cell.get('size').height + diffY});
    StateTools.position(cell.get('position').x - distanceOfTool, cell.get('position').y - distanceOfTool);
    StateTools.set('size', {width: cell.get('size').width + (2 * distanceOfTool), height: cell.get('size').height + (2 * distanceOfTool)});
};

//Si cellA se trouve dans cellB la fonction renvoit true, false sinon.
var isInside = function (cellA, cellB) {
    if (cellA.get('position').x >= cellB.get('position').x && cellA.get('position').y >= cellB.get('position').y) {
        if (cellA.get('size').width <= cellB.get('size').width && cellA.get('size').height <= cellB.get('size').height) {
            return true;
        }
    }
    return false;
};

//methode pour verifier que la cellule entrer en parametre a un nom differant des autres.
var checkName = function (cell) {
    cell.removeDuplicate();
    getAllStateM().forEach(function (cellSec) {
        if ((cell.id != cellSec.id) && (cellSec.getClassName() == cell.getClassName())) {
            cell.addDuplicate();
            cellSec.addDuplicate();
        }
    });
};

//methode pour mettre à jour le comptage des noms duplique.
var updateNameErrCount = function () {
    let listDup = listOfError.get("DuplicateName");
    listDup.clear();
    getAllStateM().forEach(function (cell) {
        let error = cell.getLisError();
        if (error.get("duplicate") != null) {
            let name = cell.getClassName();
            let nameCounter = listDup.get(name);
            if (nameCounter != null) {
                listDup.set(name, nameCounter + 1);
            } else {
                listDup.set(name, 1);
            }
        }
    });
    updateTextError();
};

//methode pour mettre a jour le comptage du nombre d'etat root.
var updateMultipleRoot = function () {
    let listState = graph.getElements().filter(cellSec => cellSec.attributes.type == "Statechart.States" && cellSec.getParentCell() == null);
    let listDup = [];
    listState.forEach(function (cell) {
        let error = cell.getLisError();
        if (error.get("badRoot") != null) {
            let name = cell.getClassName();
            listDup.push(name);
        }
    });
    listOfError.set("multipleRoot", listDup);
    updateTextError();
};

//methode pour mettre a jour le comptage des etats hitorique,initiaux et finaux qui sont root.
var updateBadRoot = function () {
    let listState = graph.getElements().filter(cellSec => isIEH(cellSec) && cellSec.getParentCell() == null);
    listOfError.set("badRoot", new Map(compToZ));
    let badRoot = listOfError.get("badRoot");
    listState.forEach(function (cell) {
        let type = cell.attributes.type;
        badRoot.set(type, badRoot.get(type) + 1);
    });
    updateTextError();
};

//methode pour ajouter l'erreur pour l'absence de transition d'un etat initial.
var addIniMissLink = function (cell) {
    let missIni = listOfError.get("missingTIni");
    let parent = cell.getParentCell();
    let parentN = null;
    if (parent != null) {
        parentN = parent.getClassName();
    }
    if (missIni.get(parentN) == null) {
        missIni.set(parentN, 1);
    } else {
        missIni.set(parentN, missIni.get(parentN) + 1);
    }
    updateTextError();
};

//methode pour supprimer l'erreur pour l'absence de transition d'un etat initial.
var removeIniMissLink = function (cell) {
    let missIni = listOfError.get("missingTIni");
    let parent = cell.getParentCell();
    let parentN = null;
    if (parent != null) {
        parentN = parent.getClassName();
    }
    if (missIni.get(parentN) == 1) {
        missIni.delete(parentN);
    } else {
        missIni.set(parentN, missIni.get(parentN) - 1);
    }
    updateTextError();
};

//methode pour mettre a jour les erreurs sur les etats initiaux.
var updateBadMissIni = function () {
    let listInitial = graph.getElements().filter(cellSec => cellSec.attributes.type == "Statechart.InitialState");
    let badIni = new Map();
    listOfError.set("missingTIni", new Map());
    listInitial.forEach(function (cell) {
        if (cell.getLisError().get("badIni") != null) {
            let parent = cell.getParentCell();
            if (parent != null) {
                let parentN = parent.getClassName();
                if (badIni.get(parentN) == null) {
                    badIni.set(parentN, 1);
                } else {
                    badIni.set(parentN, badIni.get(parentN) + 1);
                }
            }
        }
        if (cell.getLisError().get("missigLink") != null) {
            addIniMissLink(cell);
        }
    });
    listOfError.set("badIni", badIni);
    updateTextError();
};

//methode pour savoir si l'element envoye est un etat initial,historique ou final.
var isIEH = function (cell) {
    let type = cell.attributes.type;
    return (type == "Statechart.InitialState"
            || type == "Statechart.EndState"
            || type == "Statechart.DeepHistoricalState"
            || type == "Statechart.HistoricalState");
};

//methode pour mettre a jour le texte reprenant toute les erreurs.
var updateTextError = function () {
    let text = "";
    let count = 0;
    let nameMap = new Map();
    let badRoot = [];

    //recupere les etats
    let states = graph.getElements().filter(cellSec => cellSec.attributes.type === "Statechart.States");
    states.forEach(function (cell) {
        let subText = "";
        let error = cell.getLisError();


        let child = cell.getEmbeddedCells();
        let initChild = child.filter(cellC => cellC.attributes.type == "Statechart.InitialState");
        let histChild = child.filter(cellC => cellC.attributes.type == "Statechart.DeepHistoricalState"
                    || cellC.attributes.type == "Statechart.HistoricalState");

        let badIni = 0;
        let missingTIni = 0;
        let badLink = 0;
        initChild.forEach(function (init) {
            let errorList = init.getLisError();
            if (errorList.get("badIni") != null) {
                badIni = badIni + 1;
                count = count + 1;
            }
            if (errorList.get("missigLink") != null) {
                missingTIni = missingTIni + 1;
                count = count + 1;
            }
            if (errorList.get("badLink") != null) {
                badLink = badLink + 1;
                count = count + 1;
            }
        });

        let badLinkH = [];
        histChild.forEach(function (hist) {
            if (hist.getLisError().get("badLink") != null) {
                badLinkH.push(hist.getClassName());
                count = count + 1;
            }
        });

        if (badIni > 0) {
            subText = subText + "<li> There is " + badIni + " 'initial state' in this state when there can only be one.</li>";
        }

        if (missingTIni > 0) {
            subText = subText + "<li> There is " + missingTIni + " 'initial state' which have no transition. Every 'initial state' need a transition.</li>";
        }

        if (badLink > 0) {
            subText = subText + "<li> There is " + badLink + " 'initial state' having transition going out of this state (which is incorrect).</li>";
        }
        if (badLinkH.length > 0) {
            subText = subText + "<li> The 'historical state': " + badLinkH.join(",") + " , having transition going out of this state (which is incorrect).</li>";
        }

        let name = cell.getClassName();
        if (error.get("duplicate") != null) {
            count = count + 1;
            if (nameMap.get(name) == null) {
                if (subText != "") {
                    text = text + "<br> <FONT size='2'>" + name + "(1): </FONT> <ul style='list-style-type:square;'>" + subText + "</ul>";
                }
                nameMap.set(name, 1);
            } else {
                let comp = nameMap.get(name) + 1;
                if (subText != "") {
                    text = text + "<br> <FONT size='2'>" + name + "(" + comp + "): </FONT> <ul style='list-style-type:square;'>" + subText + "</ul>";
                }
                nameMap.set(name, comp);
            }
        } else {
            if (subText != "") {
                text = text + "<br> <FONT size='2'>" + name + ": </FONT> <ul style='list-style-type:square;'>" + subText + "</ul>";
            }
        }

        if (error.get("badRoot") != null) {
            count = count + 1;
            badRoot.push(name);
        }
    });

    let noState = getAllStateM().filter(cellSec => cellSec.attributes.type != "Statechart.States");
    noState.forEach(function (cell) {
        let name = cell.getClassName();
        if (cell.getLisError().get("duplicate") != null) {
            count = count + 1;
            if (nameMap.get(name) != null) {
                nameMap.set(name, 1);
            } else {
                nameMap.set(name, comp);
            }
        }
    });

    nameMap.forEach(function (value, key) {
        text = "There are " + value + " states named " + key + ", each state must have a different name.<br>" + text;
    });

    let iEH = graph.getElements().filter(cell => isIEH(cell));
    var compToZ = new Map([["Statechart.InitialState", 0], ["Statechart.EndState", 0], ["Statechart.DeepHistoricalState", 0], ["Statechart.HistoricalState", 0]]);
    iEH.forEach(function (cell) {
        let error = cell.getLisError();
        if (error.get("badRoot") != null) {
            count = count + 1;
            let type = cell.attributes.type;
            compToZ.set(type, compToZ.get(type) + 1);
        }
    });

    compToZ.forEach(function (value, key) {
        if (value > 0) {
            text = value + " '" + key + "' are root. But none '" + key + "' can be root.<br>" + text;
        }
    });

    if (badRoot.length > 0) {
        text = badRoot.length + " 'states' are root (" + badRoot.join(",") + "). But only one can be root.<br>" + text;
    }

    changeErrorText(text);
    changeErrorCount(count);
};

//methode pour verifier si un etat n'est pas en root alors qu'il ne devrait pas
var checkBadRoot = function (cell) {
    let type = cell.attributes.type;
    if (isIEH(cell)) {
        if (cell.getParentCell() == null) {
            cell.addMultipleRoot();
        } else if (cell.hadRootW()) {
            cell.removeMultiple();
        }
        updateBadRoot();
    } else if (type == "Statechart.States") {
        if (cell.getParentCell() == null) {
            let otherRoot = graph.getElements().filter(cellSec => cellSec.attributes.type == "Statechart.States" && cellSec.getParentCell() == null && cell.id != cellSec.id);
            if (otherRoot.length > 0) {
                cell.addMultipleRoot();
                otherRoot.forEach(function (cellSec) {
                    cellSec.addMultipleRoot();
                });
            }
        } else if (cell.hadRootW()) {
            cell.removeMultiple();
            chekRoot();
        }
        updateMultipleRoot();
    }
};

//methode pour verifier si les transitions depuis les etats initiaux existent toutes.
var checkMissTI = function () {
    let listInitial = graph.getElements().filter(cellSec => cellSec.attributes.type == "Statechart.InitialState");
    let links = graph.getLinks();
    listInitial.forEach(function (cell) {
        let res = links.filter(link => link.getSourceCell() == cell);
        if (res.length == 0) {
            cell.addMissigLink();
        } else {
            cell.removeMissigLink();
        }
    });
};

//methode pour verifier si il n'y a pas plus d'un etat root.
var chekRoot = function () {
    let roots = graph.getElements().filter(cellSec => cellSec.attributes.type == "Statechart.States" && cellSec.getParentCell() == null);
    if (roots.length > 1) {
        roots.forEach(function (cellSec) {
            cellSec.addMultipleRoot();
        });
    } else if (roots.length == 1) {
        roots[0].removeMultiple();
    }
};

//methode pour verifier si une transition est correct pour un etat initial ou historique.
var checkHistAndInitTrans = function (link) {
    if (!childHistInitLink(link)) {
        let source = link.source();
        source = graph.getCell(source);
        let type = source.attributes.type;
        if ((type == 'Statechart.HistoricalState') || (type == 'Statechart.DeepHistoricalState')) {
            createNote("Wrong target for a link\nfrom a 'Historical State'");
        } else {
            createNote("Wrong target for a link\nfrom a 'Initial State'");
        }

        let lS = link.attr(".info/lastTarget");
        if (lS != null) {
            link.target(lS);
        } else {
            link.remove();
        }
    }
};

//methode pour verifier si un lien peut etre cree entre une source et une cible.
var childHistInitLink = function (link, target, source) {
    if (link != null) {
        if (source == null) {
            source = link.source();
        }
        if (target == null) {
            target = link.target();
        }

        if ((source["id"] != null) && (target["id"] != null)) {
            source = graph.getCell(source);
            target = graph.getCell(target);
            let type = source.attributes.type;
            if ((type == 'Statechart.HistoricalState')
                    || (type == 'Statechart.DeepHistoricalState')
                    || (type == 'Statechart.InitialState')) {
                let parent = source.getParentCell();
                if (parent != null) {
                    let child = parent.getEmbeddedCells(deep = true);
                    if (child.filter(cell => cell.id == target.id).length > 0) {
                        return true;
                    }
                }
                return false;

            }
            return true;
        }
        return true;
    }
    return true;
};

//methode pour recuperer les elements qui sont des etats et qui peuvent avoir un nom.
var getAllStateM = function () {
    return graph.getElements().filter(cellSec => cellSec.attributes.type === "Statechart.States"
                || cellSec.attributes.type === "Statechart.DeepHistoricalState"
                || cellSec.attributes.type === "Statechart.HistoricalState"
                || cellSec.attributes.type === "Statechart.EndState");
};

//methode pour creer une fenetre avec choix.
var createPopup = function (func1, func2, text) {
    resetCells();
    stopEvent();
    popup = new joint.shapes.Statechart.Alert;
    popup.setFunction(func1, func2);
    popup.setText(text);
    graph.addCell(popup);
    popup.position(parseInt(-$ox.val()) + (parseInt($w.val()) / 2) - (popup.get('size').width / 2),
            parseInt(-$oy.val()) + (parseInt($h.val()) / 2) - (popup.get('size').height / 2));
};

//methode pour creer une fenetre avec message.
var createNote = function (text) {
    resetCells();
    stopEvent();
    popup = new joint.shapes.Statechart.Note;
    popup.setText(text);
    graph.addCell(popup);
    popup.position(parseInt(-$ox.val()) + (parseInt($w.val()) / 2) - (popup.get('size').width / 2),
            parseInt(-$oy.val()) + (parseInt($h.val()) / 2) - (popup.get('size').height / 2));
};

//methode pour placer les outils sur l'etat selectionne
var selectCell = function (cellView) {
    let cell = cellView.model;
    renitializationNE();
    selectedCell = cellView;
    showTools(cell);
    if (cell.attributes.type != "Statechart.InitialState") {
        addingElementPropertyState(cell);
        document.getElementById("Name").value = cell.attr(".name-text/text");
        document.getElementById("Entry").value = cell.attr(".entry-text/text").join('\n');
        document.getElementById("Exit").value = cell.attr(".exit-text/text").join('\n');
        if (cell.attributes.type == "Statechart.States") {
            let internal = cell.get('internalTransitions');
            for (let i = 0; i < internal.length; i++) {
                addingInternal(internal[i][0], internal[i][1], internal[i][2]);
            }
        }
        let contrat = cell.get('contrat');
        for (let i = 0; i < contrat.length; i++) {
            addingCondition(contrat[i][0], contrat[i][1]);
        }
    }
};

//methode utilisee pour afiicher les outils d'un lien ainsi que le menu de modification correpondant au lien.
var linkPointerDown = function (linkView) {
    renitializationNE();
    //rajoute le menu pour les proprietes du lien selectionne et place leur valeur 
    addingElementPropertyLink();
    selectedLink = linkView;
    selectedLink.showTools();
    let link = selectedLink.model;
    document.getElementById("EventsT").value = link.attr(".events-text/text");
    document.getElementById("Guard").value = link.attr(".guard-text/text");
    document.getElementById("Action").value = link.attr(".action-text/text").join("\n");
    let contrat = link.get('contrat');
    for (let i = 0; i < contrat.length; i++) {
        addingCondition(contrat[i][0], contrat[i][1]);
    }
};

//methode appelee lors de la pression du clic gauche de la souris sur un blanc du papier.
var blankPointerDown = function () {
    if (popup == null) {
        renitializationNE();
    }
};

//methode appelee lors du relachement du clic gauche de la souris sur un blanc du papier.
var blankPointerUp = function () {
    if (link != null) {
        link.remove();
        link = null;
    }
};

//methode appelee lors de la pression du clic gauche de la souris sur le contour de l'outils.
var elementContourPointerdown = function (cellView, evt) {
    evt.stopPropagation();
};

//methode appelee lors de la pression du clic gauche de la souris sur l'otpion de suppression de l'outils.
var elementRemovePointerDown = function (cellView, evt) {
    //evenement special du bouton remove tool(supprime la cellule et ses enfants)
    evt.stopPropagation();
    createPopup(function () {
        selectedCell.model.remove();
        selectedCell = null;
        hideTools();
        renitializationNE();
        getAllStateM().forEach(function (cell) {
            checkName(cell);
        });
        chekRoot();
        checkMissTI();
        updateListError();
    }, null, "are you sure you want to delete \n this element and all its children?");
};

//methode appelee lors de la pression du clic gauche de la souris sur l'otpion d'acceptation du message d'alerte.
var elementAcceptPointerDown = function (cellView, evt) {
    evt.stopPropagation();
    popup.accept();
    deleteAlert();
    activeEvent();
};

//methode appelee lors de la pression du clic gauche de la souris sur l'otpion de rejet du message d'alerte.
var elementRejectPointerDown = function (cellView, evt) {
    evt.stopPropagation();
    popup.reject();
    deleteAlert();
    activeEvent();
};

//methode appelee lors de la pression du clic gauche de la souris sur l'otpion d'acceptation du note.
var elementNoteAPointerDown = function (cellView, evt) {
    evt.stopPropagation();
    deleteAlert();
    activeEvent();
};

//methode pour demarer l'ajout d'un lien depuis un etat
var elementAddlinkTo = function (cellView, evt, x, y) {
    //evenement special du bouton add link
    let cell = selectedCell.model;
    link = createLink(cell);
    link.attr("line/filter", goodFilter);

    linkFrom = false;
};

//methode pour demarer l'ajout d'un lien vers un etat
var elementAddlinkFrom = function (cellView, evt, x, y) {
    //evenement special du bouton add link
    let cell = selectedCell.model;
    link = createLink(cell);
    link.attr("line/filter", goodFilter);
    linkFrom = true;
};

//methode appelee lors de la pression du clic gauche de la souris sur un element du graphe.
var elementPointerDown = function (cellView, evt, x, y) {
    let cell = cellView.model;

    if (link != null) {
        selectCell(cellView);
        return;
    }

    if (cell.attributes.type != "Statechart.Tools" && cell.attributes.type != "Statechart.Alert") {

        selectCell(cellView);

        if (!cell.get('embeds') || cell.get('embeds').length === 0) {
            //met la cellule sur la couche principal si elle n'a pas d'enfant
            cell.toFront();
        }

        if (cell.get('parent')) {
            //supprime le lien d'enfant/parent
            graph.getCell(cell.get('parent')).removeChild(cell);
        }
    } else {
        $x = x;
        $y = y;
    }


};

//methode appelee lors du passage la souris sur un element du graphe.
var elementMouseenter = function (cellView, evt, x, y) {
    var cell = cellView.model;
    if (link != null) {
        link.vertices([]);
        if (linkFrom) {
            if (cell.canAcceptTarget() && childHistInitLink(link, cell, null)) {
                link.target(cell);
            }
        } else {
            if (cell.canAcceptSource() && childHistInitLink(link, null, cell)) {
                link.source(cell);
            }
        }
    }
};

//methode appelee lors du relachement du clic gauche de la souris sur un element du graphe.
var elementPointerUp = function (cellView, evt, x, y) {
    var cell = cellView.model;
    if (link != null) {
        link.attr("line/filter", "");
        checkHistAndInitTrans(link);
        valChangeTargetLink(link, link.getTargetCell());
        valChangeSourceLink(link, link.getSourceCell());
        changelinkTS(link);


        link = null;
    } else {
        if (cell.attributes.type !== "Statechart.Tools") {
            let cellViewsBelow = paper.findViewsFromPoint(cell.getBBox().center());
            if (cellViewsBelow.length > 0) {
                //regarde si un etat peut devenir parent de celui lache
                bestParent = null;
                cellViewsBelow.forEach(function (possibleParent) {
                    candidate = possibleParent.model;
                    if (candidate.id !== cell.id && candidate.attributes.type == "Statechart.States" && candidate.get('parent') !== cell) {
                        if (bestParent == null && isInside(cell, candidate)) {
                            bestParent = candidate;
                        } else if (bestParent != null && isInside(candidate, bestParent) && isInside(cell, candidate)) {
                            bestParent = candidate;
                        }
                    }
                });
                if (bestParent != null) {
                    bestParent.addChild(cell);
                }
            }
            checkLink(cell);
            reparentLink(cell);
            checkBadRoot(cell);
            if (cell.attributes.type == "Statechart.InitialState") {
                updateBadMissIni();
            }
        }
    }
};

//methode appelee lors de la pression du clic gauche de la souris sur un element du graphe.
var elementPointerMove = function (cellView, evt, x, y) {
    var cell = cellView.model;

    if (cell.attributes.type != "Statechart.Tools") {
        StateTools.position(cell.get('position').x - distanceOfTool, cell.get('position').y - distanceOfTool);
    } else {
        changeSizeElem($x, $y, x, y);
        $x = x;
        $y = y;
    }
};

//methode appelee lors de la pression du clic gauche de la souris sur un element du graphe.
var elementChangeTypePointerDown = function () {
    let cell = selectedCell.model;
    cell.changeType();
    StateTools.changeType(cell.getType());
};

//methode appelee lors de la modification d'une connection d'un lien.
var linkConnect = function (linkView, evt, elementViewDisconnected) {
    let link = linkView.model;
    let elementDis = elementViewDisconnected.model;


    if (elementDis.attributes.type == "Statechart.InitialState") {
        elementDis.addMissigLink();
        updateTextError();
    }

    checkHistAndInitTrans(link);
    valChangeTargetLink(link, link.getTargetCell());
    valChangeSourceLink(link, link.getSourceCell());
};

//liste des evenements gere par le papier
paper.on({'link:pointerdown': linkPointerDown,
    'blank:pointerdown': blankPointerDown,
    'blank:pointerup': blankPointerUp,
    'element:contour:pointerdown': elementContourPointerdown,
    'element:element-tool-remove:pointerdown': elementRemovePointerDown,
    'element:element-tool-accept:pointerdown': elementAcceptPointerDown,
    'element:element-tool-reject:pointerdown': elementRejectPointerDown,
    'element:element-note-accept:pointerdown': elementNoteAPointerDown,
    'element:element-tool-addLinkTo:pointerdown': elementAddlinkTo,
    'element:element-tool-addLinkFrom:pointerdown': elementAddlinkFrom,
    'element:element-tool-changeType:pointerdown': elementChangeTypePointerDown,
    'element:pointerdown': elementPointerDown,
    'element:mouseenter': elementMouseenter,
    'element:pointerup': elementPointerUp,
    'element:pointermove': elementPointerMove,
    'link:connect': linkConnect,
    'scale': function (sx, sy) {

        $sx.val(sx).next().text(sx.toFixed(2));
        $sy.val(sy).next().text(sy.toFixed(2));

    },

    'translate': function (ox, oy) {

        $ox.val(ox).next().text(Math.round(ox));
        $oy.val(oy).next().text(Math.round(oy));

        // translate axis
        svgAxisX.translate(0, oy, {absolute: true});
        svgAxisY.translate(ox, 0, {absolute: true});

    },

    'resize': function (width, height) {
        $w.val(width).next().text(Math.round(width));
        $h.val(height).next().text(Math.round(height));
    }
});

//methode pour renitialiser l'affichage des elements selectionnes
var renitializationNE = function () {
    removeElementProperty();
    if (selectedCell != null) {
        hideTools();
        selectedCell = null;
    }
    if (selectedLink != null) {
        selectedLink.hideTools();
        selectedLink = null;
    }
};

//methode utilisee pour desactive tout les evenements hors ceux attache au message d'alert.
var stopEvent = function () {
    graph.getCells().forEach(function (cell) {
        if (cell.attributes.type !== "Statechart.Alert") {
            cell.attr('root/pointerEvents', 'none');
        }
    });
};

//methode utilisee pour activer tout les evenements.
var activeEvent = function () {
    graph.getCells().forEach(function (cell) {
        if (cell.attributes.type !== "Statechart.Alert") {
            cell.attr('root/pointerEvents', null);
        }
    });
};

var StateTools = null; //outil d'un etat actuellement affiche sur le graph
var distanceOfTool = 10; //distance de separation d'un etat et de l'outil
var link; //lien en attente de creation 
var selectedLink; // lien selectionne
var selectedCell; // celulle selectionnee
var $x = 0;
var $y = 0;
var $ox = $('#ox'); //origine x du graphe
var $oy = $('#oy'); //origine y du graphe
var $sx = $('#sx'); //scale x du graphe
var $sy = $('#sy'); //scale y du graphe
var $w = $('#width'); //largeur du graphe
var $h = $('#height'); //longeur du graphe
var $ftcPadding = $('#ftc-padding');
var $ftcGridW = $('#ftc-grid-width');
var $ftcGridH = $('#ftc-grid-height');
var $ftcNewOrigin = $('#ftc-new-origin');
var $stfPadding = $('#stf-padding');
var $stfMinScale = $('#stf-min-scale');
var $stfMaxScale = $('#stf-max-scale');
var $stfScaleGrid = $('#stf-scale-grid');
var $stfRatio = $('#stf-ratio');
var $bboxX = $('#bbox-x');
var $bboxY = $('#bbox-y');
var $bboxW = $('#bbox-width');
var $bboxH = $('#bbox-height');
var $grid = $('#grid');

// cache important svg elements
var svg = V(paper.svg);
var svgVertical = V('path').attr('d', 'M -10000 -1 L 10000 -1');
var svgHorizontal = V('path').attr('d', 'M -1 -10000 L -1 10000');
var svgRect = V('rect');
var svgAxisX = svgVertical.clone().addClass('axis');
var svgAxisY = svgHorizontal.clone().addClass('axis');
var svgBBox = svgRect.clone().addClass('bbox');

svgBBox.hide = joint.util.debounce(function () {
    svgBBox.removeClass('active');
}, 500);

// Permet de déplacer les formes
var svgContainer = [];

svgContainer.removeAll = function () {
    while (this.length > 0) {
        this.pop().remove();
    }
};

// Axis has to be appended to the svg, so it won't affect the viewport.
svg.append([svgAxisX, svgAxisY, svgBBox]);

function fitToContent() {
    svgContainer.removeAll();

    var padding = parseInt($ftcPadding.val(), 10);
    var gridW = parseInt($ftcGridW.val(), 10);
    var gridH = parseInt($ftcGridH.val(), 10);
    var allowNewOrigin = $ftcNewOrigin.val();

    paper.fitToContent({
        padding: padding,
        gridWidth: gridW,
        gridHeight: gridH,
        allowNewOrigin: allowNewOrigin
    });

    var bbox = paper.getContentBBox();

    var translatedX = allowNewOrigin == 'any' || (allowNewOrigin == 'positive' && bbox.x - paper.options.origin.x >= 0) || (allowNewOrigin == 'negative' && bbox.x - paper.options.origin.x < 0);
    var translatedY = allowNewOrigin == 'any' || (allowNewOrigin == 'positive' && bbox.y - paper.options.origin.y >= 0) || (allowNewOrigin == 'negative' && bbox.y - paper.options.origin.y < 0);

    if (padding) {

        var svgPaddingRight = svgHorizontal.clone().addClass('padding')
                .translate(paper.options.width - padding / 2, 0, {absolute: true})
                .attr('stroke-width', padding);

        var svgPaddingBottom = svgVertical.clone().addClass('padding')
                .translate(0, paper.options.height - padding / 2, {absolute: true})
                .attr('stroke-width', padding);

        svg.append([svgPaddingBottom, svgPaddingRight]);
        svgContainer.push(svgPaddingBottom, svgPaddingRight);
    }

    if (padding && (translatedX || translatedY)) {

        var paddings = [];

        if (translatedY) {

            var svgPaddingTop = svgVertical.clone().addClass('padding')
                    .translate(0, padding / 2, {absolute: true})
                    .attr('stroke-width', padding);

            paddings.push(svgPaddingTop);
        }

        if (translatedX) {

            var svgPaddingLeft = svgHorizontal.clone().addClass('padding')
                    .translate(padding / 2, 0, {absolute: true})
                    .attr('stroke-width', padding);

            paddings.push(svgPaddingLeft);
        }

        if (paddings.length) {
            svg.append(paddings);
            svgContainer.push.apply(svgContainer, paddings);
        }
    }

    if (gridW > 2) {

        var x = gridW;

        if (translatedX)
            x += padding;

        do {

            var svgGridX = svgHorizontal.clone().translate(x, 0, {absolute: true}).addClass('grid');
            svg.append(svgGridX);
            svgContainer.push(svgGridX);

            x += gridW;

        } while (x < paper.options.width - padding);
    }

    if (gridH > 2) {

        var y = gridH;

        if (translatedY)
            y += padding;

        do {

            var svgGridY = svgVertical.clone().translate(0, y, {absolute: true}).addClass('grid');
            svg.append(svgGridY);
            svgContainer.push(svgGridY);
            y += gridH;

        } while (y < paper.options.height - padding);
    }

    svgContainer.showAll();
}

function scaleToFit() {
    svgContainer.removeAll();

    var padding = parseInt($stfPadding.val(), 10);

    paper.scaleContentToFit({
        padding: padding,
        minScale: parseFloat($stfMinScale.val()),
        maxScale: parseFloat($stfMaxScale.val()),
        scaleGrid: parseFloat($stfScaleGrid.val()),
        preserveAspectRatio: $stfRatio.is(':checked')
    });

    paper.viewport.getBoundingClientRect(); // MS Edge hack to fix the invisible text.

    if (padding) {

        var svgPaddingRight = svgHorizontal.clone().addClass('padding')
                .translate(paper.options.width - padding / 2, 0, {absolute: true})
                .attr('stroke-width', padding);

        var svgPaddingBottom = svgVertical.clone().addClass('padding')
                .translate(0, paper.options.height - padding / 2, {absolute: true})
                .attr('stroke-width', padding);

        var svgPaddingLeft = svgVertical.clone().addClass('padding')
                .translate(0, padding / 2, {absolute: true})
                .attr('stroke-width', padding);

        var svgPaddingTop = svgHorizontal.clone().addClass('padding')
                .translate(padding / 2, 0, {absolute: true})
                .attr('stroke-width', padding);

        svg.append([svgPaddingBottom, svgPaddingRight, svgPaddingTop, svgPaddingLeft]);
        svgContainer.push(svgPaddingBottom, svgPaddingRight, svgPaddingTop, svgPaddingLeft);
    }

    svgContainer.showAll();
}

/* events */

$('#fit-to-content input, #fit-to-content select').on('input change', fitToContent);
$('#scale-to-fit input').on('input change', scaleToFit);

$ox.on('input change', function () {
    paper.setOrigin(parseInt(this.value, 10), parseInt($oy.val(), 10));
});
$oy.on('input change', function () {
    paper.setOrigin(parseInt($ox.val(), 10), parseInt(this.value, 10));
});
$sx.on('input change', function () {
    paper.scale(parseFloat(this.value), parseFloat($sy.val()));
});
$sy.on('input change', function () {
    paper.scale(parseFloat($sx.val()), parseFloat(this.value));
});
$w.on('input change', function () {
    paper.setDimensions(parseInt(this.value, 10), parseInt($h.val(), 10));
});
$h.on('input change', function () {
    paper.setDimensions(parseInt($w.val(), 10), parseInt(this.value, 10));
});
$grid.on('input change', function () {
    paper.options.gridSize = this.value;
    paper.drawGrid();
});
$('.range').on('input change', function () {
    $(this).next().text(this.value);
});