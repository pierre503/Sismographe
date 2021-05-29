/* global selectedCell, StateTools, distanceOfTool, selectedLink, joint, graph, getAllStateM */

//methode pour supprimer la boite de contexte des proprietes d'un element
var removeElementProperty = function () {
    $('#element_Property_body').remove();
    if (document.getElementById("Add") != null) {
        document.getElementById("Add").removeEventListener("click", changeElem);
    }
    removePR("EventsT");
    removePR("Guard");
};

//methode pour ajouter un boite de contexte pour un etat
var addingElementPropertyState = function (cell) {
    if (cell.attributes.type == "Statechart.States") {
        $('#element_Property_panel').append("<div class='panel-body' id='element_Property_body'>" + nameDiv + entryDiv + exitDiv + internalTrans + contract + addingButton + "</div>");
    } else {
        $('#element_Property_panel').append("<div class='panel-body' id='element_Property_body'>" + nameDiv + entryDiv + exitDiv + contract + addingButton + "</div>");
    }
    document.getElementById("Add").addEventListener("click", changeElem);
};

//methode pour ajouter un boite de contexte pour un lien
var addingElementPropertyLink = function () {
    $('#element_Property_panel').append("<div class='panel-body' id='element_Property_body'>" + eventTransDiv + guardDiv + actionDiv + contract + addingButton + "</div>");
    document.getElementById("Add").addEventListener("click", changeElem);
    preventReturn("EventsT");
    preventReturn("Guard");
};

//methode pour emepecher les retour la ligne par la touche enter
var preventReturn = function (id) {
    document.getElementById(id).addEventListener('keypress', function (event) {
        if (event.keyCode === 13) {
            event.preventDefault();
        }
    });
};

//methode pour retirer les EventListener empechant les retours a la ligne.
var removePR = function (id) {
    if (document.getElementById(id) != null) {
        document.getElementById(id).removeEventListener('keypress');
    }
};

//methode pour changer l'acchige du comptage des erreurs
var changeErrorCount = function (count) {
    let text = "There are " + count;
    if (count === 0) {
        document.getElementById("errorCount").style.color = "#000000";
    } else {
        document.getElementById("errorCount").style.color = "#F70707";
    }

    if (count > 1) {
        text = text + " errors left";
    } else {
        text = text + " error left";
    }
    document.getElementById("errorCount").innerHTML = text;
};

//methode pour changer le text recapitulatif des erreurs
var changeErrorText = function (text) {
    document.getElementById("textError").innerHTML = "<p>" + text + "<\p>";
};

//element pour recuperer les informations des transitions internes du menu de changement de propriétés.
var getInternalTrans = function () {
    let internalTrans = document.getElementById("internalTrans");
    let child = internalTrans.childNodes;
    let inTrans = [];
    for (let i = 0; i < child.length; i++) {
        let actualChild = child[i].firstChild;
        let actualTrans = [];
        let res = "";
        //partie pour recuperer les 3 elements d'une transition interne
        for (let j = 0; j < 3; j++) {
            let text = actualChild.childNodes[j].childNodes[1];
            actualTrans.push(text.value);
            if (j < 2) {
                res += text.value.join(";");
            }
        }
        if (res !== "") {
            inTrans.push(actualTrans);
        }
        
    }
    return inTrans;
};

//element pour recuperer les informations d'un contrat du menu de changement de propriétés.
var getInternalCondition = function () {
    let internalTrans = document.getElementById("internalCond");
    let child = internalTrans.childNodes;
    let cond = [];
    for (let i = 0; i < child.length; i++) {
        let actualChild = child[i].firstChild;
        condition = actualChild.childNodes[1].firstChild.value;
        if(condition !== "") {
            cond.push([actualChild.firstChild.childNodes[1].value,condition]);
        }
    }
    return cond;
};

//change les valeurs de l'element selectionne
var changeElem = function () {
    if (popup == null) {
        if (selectedCell != null) {
            var cell = selectedCell.model;
            if(cell.attributes.type != "Statechart.InitialState") {


                var name = document.getElementById("Name").value;
                cell.prop("name", name);
                cell.prop("entry", getText("Entry"));
                cell.prop("exit", getText("Exit"));
                if (cell.attributes.type == "Statechart.States") {
                    let listInternal = getInternalTrans();
                    cell.prop("internalTransitions", listInternal);
                }
                
                let listConditon = getInternalCondition();
                cell.prop("contrat", listConditon);

                StateTools.set('size', {width: cell.get('size').width + (2 * distanceOfTool), height: cell.get('size').height + (2 * distanceOfTool)});

                getAllStateM().forEach(cellC => checkName(cellC));
                updateNameErrCount();
            }
        } else if (selectedLink != null) {
            var cell = selectedLink.model;
            cell.prop("attrs/.guard-text/text", getText("Guard"));
            cell.prop("attrs/.action-text/text", getText("Action"));
            cell.prop("attrs/.events-text/text", getText("EventsT"));
            let guard = getText("Guard");
            let event = getText("EventsT");
            let action = getText("Action").join(";");
            
            let listConditon = getInternalCondition();
            cell.prop("contrat", listConditon);
                
            changeLabel(cell, event, guard, action);

        }
    }
};

//methode pour changer le label d'un lien
var changeLabel = function (link, event, guard, action) {
    let aff = "";
    if (event != "") {
        aff = event;
    }
    if (guard != "") {
        aff = aff + "[" + guard + "]";
    }
    if (action != "") {
        if (aff != "") {
            aff = aff + "/";
        }
        aff = aff + action;
    }
    link.label(0, {attrs: {text: {text: aff}}});
};

//recupere le texte contenu dans une balise HTML
var getText = function (type) {
    var text = document.getElementById(type).value;
    return(text.split("\n"));
};

//ajout d'une transition interne
var addingInternal = function (eventText = "",gardText = "",actionText = "") {
    let div = document.createElement('div');
    let buttonRemove = "<button class='button-remove' onclick='removeDivParent(this.parentNode);'>Remove transition</button>";
    let event = "<p><label>Events</label><textarea type='text' cols='28' rows='2'>"+eventText+"</textarea></p>";
    let guard = "<p><label>Guard</label><textarea type='text' cols='28' rows='2'>"+gardText+"</textarea></p>";
    let action = "<p><label>Action</label><textarea type='text' cols='28' rows='2'>"+actionText+"</textarea></p>";
    div.innerHTML = "<fieldset>" + event + guard + action + buttonRemove + "</fieldset><br/>";
    document.getElementById('internalTrans').appendChild(div);
};

//ajout une condition a un contrat
var addingCondition = function (typeS = "", conditionText = "") {
    let div = document.createElement('div');
    let buttonRemove = "<button class='button-remove' onclick='removeDivParent(this.parentNode);'>Remove</button>";
    let types = ["precondition","postcondition","invariant"];
    let type = "<p><label>Type condition:</label><select>";
    for (let i = 0; i < types.length; i++) {
        if(types[i] === typeS){
            type += "<option value='"+types[i]+"' selected='selected'>"+types[i]+"</option>";
        }else{
            type += "<option value='"+types[i]+"'>"+types[i]+"</option>";
        }
    }
    type += "</select></p>";
    let condition = "<p><textarea type='text' cols='28' rows='2'>"+conditionText+"</textarea></p>";
    div.innerHTML = "<fieldset>" + type + condition + buttonRemove + "</fieldset><br/>";
    document.getElementById('internalCond').appendChild(div);
};

//methode pour supprimer le noeud parent
var removeDivParent = function (f) {
    f.parentNode.remove();
};

var nameDiv = "<p><label>Name </label><input id='Name' type='text' size='32'></p>";
var entryDiv = "<p><label>Entry</label><textarea id='Entry' type='text' cols='33' rows='2'></textarea></p>";
var exitDiv = "<p><label>Exit</label><textarea id='Exit' type='text' cols='33' rows='2'></textarea></p>";
var eventTransDiv = "<p><label>Events</label><textarea id='EventsT' type='text' cols='33' rows='4'></textarea></p>";
var guardDiv = "<p><label>Guard</label><textarea id='Guard' type='text' cols='33' rows='4'></textarea></p>";
var actionDiv = "<p><label>Action</label><textarea id='Action' type='text' cols='33' rows='4'></textarea></p>";
var addingButton = "<div class='form-group'><button class='button-adding' id='Add'>Change</button></div>";
var internalTrans = "<details><summary>Internal transition</summary><div class='form-group' id='internalTrans'></div><button class='button-add' style='margin-bottom: 10px' onclick='addingInternal();'>Add Internal transition</button></details>";
var contract = "<details><summary>contract</summary><div class='form-group' id='internalCond'></div><button class='button-add' style='margin-bottom: 10px' onclick='addingCondition();'>Add condition to contract</button></details>";

//methode pour rajouter un etat au graph
var addNewState = function (cell) {
    graph.addCell(cell);
    newName(cell);

    checkName(cell);
    updateNameErrCount();
    checkBadRoot(cell);
};

document.getElementById("States").addEventListener("click", function () {
    if (popup == null) {
        let cell = new joint.shapes.Statechart.States({
            size: {width: 100, height: 40}
        });

        addNewState(cell);
        resetCells();
    }

});

document.getElementById("Composite_States").addEventListener("click", function () {
    if (popup == null) {
        let cell = new joint.shapes.Statechart.States({
            size: {width: 400, height: 400}
        });
        addNewState(cell);
        cell.addChild(null);
        resetCells();
    }
});

document.getElementById("Orthogonal_States").addEventListener("click", function () {
    if (popup == null) {
        let cell = new joint.shapes.Statechart.States({
            size: {width: 400, height: 400}
        });
        addNewState(cell);
        cell.changeType();
        cell.addChild(null);
        resetCells();
    }
});

document.getElementById("Initial_State").addEventListener("click", function () {
    if (popup == null) {
        let cell = new joint.shapes.Statechart.InitialState;
        graph.addCell(cell);
        cell.addMissigLink();

        checkBadRoot(cell);
    }
});

document.getElementById("End_State").addEventListener("click", function () {
    if (popup == null) {
        let cell = new joint.shapes.Statechart.EndState;
        addNewState(cell);
    }
});

document.getElementById("Historical_State").addEventListener("click", function () {
    if (popup == null) {
        let cell = new joint.shapes.Statechart.HistoricalState;
        addNewState(cell);
    }
});

document.getElementById("Deep_Historical_State").addEventListener("click", function () {
    if (popup == null) {
        let cell = new joint.shapes.Statechart.DeepHistoricalState;
        addNewState(cell);
    }
});

document.getElementById("Save").addEventListener("click", function () {
    if (popup == null) {
        downloadGraph(graph);

    }
});

document.getElementById("Load").addEventListener("click", function () {
    if (popup == null) {
        document.getElementById("loadElem").click();
    }
});

document.getElementById("toYaml").addEventListener("click", function () {
    if (popup == null) {
        toYaml();
    }
});

document.getElementById("importYaml").addEventListener("click", function () {
    if (popup == null) {
        document.getElementById("loadYaml").click();
    }
});