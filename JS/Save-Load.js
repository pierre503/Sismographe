/* global joint, graph, jsyaml, paper */

let minimumVersion = "1.1.0";
let actualVersion = "1.1.0";

var verifVersion = function (version) {
    if (version == null) {
        return false;
    }
    let ver = version.split(".");
    let min = minimumVersion.split(".");

    if (ver[0] > min[0]) {
        return true;
    }
    if (ver[0] == min[0]) {
        if (ver[1] > min[1]) {
            return true;
        }
        if (ver[1] == min[1]) {
            if (ver[2] >= min[2]) {
                return true;
            }
        }
    }
    return false;

};

//methode qui permet de telecharger le graph
var downloadGraph = function (graph) {
    let text = "";

    text = graphInJSON(graph);


    download(text, getText("Statechart-Name") + ".json");
};

var download = function (text, filename) {
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
};

//methode pour traduire les informations du statechart en text en JSON.
var graphInJSON = function () {
    //recuperation des information du statechart.
    renitializationNE();

    let res = {'Cells': Object.fromEntries(cellInJSON()),
        'Links': Object.fromEntries(linkInJSON()),
        'Name': getText("Statechart-Name"),
        'Description': getText("Statechart-Description"),
        'Preamble': getText("Statechart-Preamble"),
        'Version': actualVersion};

    result = JSON.stringify(res);

    return result;
};

var cellInJSON = function () {
    let res = new Map();
    let cells = graph.getElements();
    cells.forEach(function (cell) {
        let map = new Map();
        let type = cell.attributes.type;
        map.set("type", type);
        map.set("position", cell.get("position"));
        map.set("size", cell.get("size"));
        map.set("listError", Object.fromEntries(cell.getLisError()));
        let parent = cell.getParentCell();
        let parentId = null;

        if (parent != null) {
            parentId = parent.id;
        }
        map.set("parentId", parentId);

        if (type != "Statechart.InitialState") {
            map.set("name", cell.getClassName());
            map.set("entry", cell.getEntry());
            map.set("exit", cell.getExit());
            map.set("contrat", cell.get('contrat'));
        }
        if (type == "Statechart.States") {
            map.set("typeS", cell.getType());
            map.set("internalTransitions", cell.get('internalTransitions'));
        }
        res.set(cell.id, Object.fromEntries(map));
    });
    return res;
};

var linkInJSON = function () {
    let res = new Map();
    let links = graph.getLinks();
    links.forEach(function (link) {
        let map = new Map();
        map.set("events", link.attr(".events-text/text"));
        map.set("guard", link.attr(".guard-text/text"));
        map.set("action", link.attr(".action-text/text"));
        map.set("vertice", link.vertices());
        map.set("linkS", link.source());
        map.set("linkT", link.target());
        map.set("contrat", link.get('contrat'));

        let sourceCell = link.getSourceCell();
        if (sourceCell != null) {
            map.set("sourceId", sourceCell.id);
        } else {
            map.set("sourcePoint", link.getSourcePoint());
        }
        let targetCell = link.getTargetCell();
        if (sourceCell != null) {
            map.set("targetId", targetCell.id);
        } else {
            map.set("targetPoint", link.getTargetPoint());
        }
        res.set(link.id, Object.fromEntries(map));
    });
    return res;
};

//methode pour charger un graph
var load = function (file) {

    let fR = new FileReader();
    var result = "";
    fR.onload = function (e) {
        result = e.target.result;

        jsonTograph(result);
    };
    fR.readAsText(file[0]);
};

var jsonTograph = function (result) {
    graph.clear();
    var information = JSON.parse(result);
    if (verifVersion(information['Version'])) {
        document.getElementById("Statechart-Name").value = information['Name'];
        document.getElementById("Statechart-Description").value = information['Description'].join("\n");
        document.getElementById("Statechart-Preamble").value = information['Preamble'].join("\n");

        let cellsId = loadState(information['Cells']);
        loadLink(information['Links'], cellsId);
        resetCells();
    } else {
        createNote("incorrect version of save");
    }
};

var loadLink = function (map, cellsId) {
    let links = new Map(Object.entries(map));
    links.forEach(function (linkI) {
        let res = new Map(Object.entries(linkI));

        let link = new joint.shapes.Satechart.Link();
        let event = res.get("events");
        let action = res.get("action");
        let guard = res.get("guard");
        let contrat = res.get("contrat");
        link.prop("attrs/.guard-text/text", guard);
        link.prop("attrs/.action-text/text", action);
        link.prop("attrs/.events-text/text", event);
        link.prop("contrat", contrat);
        let vertices = res.get("vertice");
        if (vertices != null) {
            link.vertices(vertices);
        }

        let source = res.get("sourceId");
        if (source != null) {
            let sourceL = res.get("linkS").anchor;
            if (sourceL == null) {
                link.source(cellsId.get(source));
            } else {
                link.source(cellsId.get(source), {anchor: sourceL});
            }
        } else {
            link.source(res.get("sourcePoint"));
        }

        let target = res.get("targetId");
        if (target != null) {
            let targetL = res.get("linkT").anchor;
            if (targetL == null) {
                link.target(cellsId.get(target));
            } else {
                link.target(cellsId.get(target), {anchor: targetL});
            }
        } else {
            link.target(res.get("targetPoint"));
        }

        link.addTo(graph);
        link.connector('jumpover', {size: 10});
        link.appendLabel({
            attrs: {
                text: {
                    text: ''
                }
            }
        });
        selectedLink = link.findView(paper);
        changeLabel(link, event, guard, action);
        addLinktools(link);
        link.reparent();

        renitializationNE();
    });
};

var loadState = function (map) {
    let cells = new Map(Object.entries(map));
    let cellsId = new Map();
    cells.forEach(function (cellI, id) {
        let res = new Map(Object.entries(cellI));
        let type = res.get("type");
        let cell = createCell(type);
        if (cell != null) {
            if (type != 'Statechart.InitialState') {
                cell.prop("name", res.get("name"));
                cell.prop("entry", res.get("entry"));
                cell.prop("exit", res.get("exit"));
                cell.prop("contrat", res.get("contrat"));
                if (type == 'Statechart.States') {
                    cell.prop("internalTransitions", res.get("internalTransitions"));
                    if (res.get("typeS") != "composite") {
                        cell.changeType();
                    }
                }
            }
            cell.set("position", res.get("position"));
            cell.set("size", res.get("size"));
            cell.setListError(new Map(Object.entries(res.get("listError"))));
            cell.showHideWarning();
            graph.addCell(cell);
            cellsId.set(id, cell);
        }
    });
    cells.forEach(function (cellI, id) {
        let res = new Map(Object.entries(cellI));
        let parentId = res.get("parentId");
        if (parentId != null) {
            cellsId.get(parentId).addChild(cellsId.get(id));
        }
    });
    return cellsId;
};

var createCell = function (type) {
    if (type == 'Statechart.States') {
        return new joint.shapes.Statechart.States;
    } else if (type == 'Statechart.InitialState') {
        return new joint.shapes.Statechart.InitialState;
    } else if (type == 'Statechart.DeepHistoricalState') {
        return new joint.shapes.Statechart.DeepHistoricalState;
    } else if (type == 'Statechart.HistoricalState') {
        return new joint.shapes.Statechart.HistoricalState;
    } else if (type == 'Statechart.EndState') {
        return new joint.shapes.Statechart.EndState;
    } else {
        return null;
    }
};

//methode pour exporter le graph en YAML
var toYaml = function () {
    renitializationNE();

    let cells = graph.getElements();
    let problem = cells.filter(cell => cell.haveProblem());
    if (problem.length == 0) {
        download(getYaml(), getText("Statechart-Name") + ".yaml");
    } else {
        createNote("You can't translate a graph in YAML\nif it remains errors");
    }
};

var getYaml = function () {
    result = statechartDefToYaml();
    let state = graph.getCells().filter(cell => !cell.isLink());
    let root = state.filter(cell => cell.getParentCell() == null);
    if (root.length > 0) {
        let rootState = stateToYaml(root[0]);
        result['root state'] = rootState;
    }
    return jsyaml.safeDump({'statechart': result});
};

var statechartDefToYaml = function () {
    name = document.getElementById("Statechart-Name").value;
    description = document.getElementById("Statechart-Description").value;
    preamble = document.getElementById("Statechart-Preamble").value;
    result = {
        'name': name
    };
    if (description != "") {
        if (description.split('\n').length > 1) {
            description = description + "\n";
        }
        result['description'] = description;
    }
    if (preamble != "") {
        if (preamble.split('\n').length > 1) {
            preamble = preamble + "\n";
        }
        result['preamble'] = preamble;
    }
    return result;
};

var stateToYaml = function (state) {
    let result = {'name': state.getClassName()};

    let contrat = state.get('contrat');
    if (contrat.length > 0) {
        conditions = [];
        for (let i = 0; i < contrat.length; i++) {
            conditions.push(conditionToYaml(contrat[i]));
        }
        result['contract'] = conditions;
    }
    if (state.attributes.type == "Statechart.EndState") {
        result['type'] = 'final';
        result = getEntry(state, result);
        return result;
    } else if (state.attributes.type == "Statechart.HistoricalState") {
        result['type'] = 'shallow history';
        let memory = getMemory(state);
        if (memory != null) {
            result['memory'] = memory;
        }
        result = getEntry(state, result);
        result = getExit(state, result);
        return result;
    } else if (state.attributes.type == "Statechart.DeepHistoricalState") {
        result['type'] = 'deep history';
        let memory = getMemory(state);
        if (memory != null) {
            result['memory'] = memory;
        }
        result = getEntry(state, result);
        result = getExit(state, result);
        return result;
    } else {
        let child = state.getEmbeddedCells().filter(cell => cell.isElement());
        //recupere l'etat initial
        let ini = child.filter(cell => cell.attributes.type == "Statechart.InitialState");
        if (ini.length > 0) {
            let linkInitial = graph.getLinks().filter(link => link.getSourceCell() == ini[0]);
            let initial = linkInitial[0].getTargetCell().getClassName();
            result['initial'] = initial;
        }

        result = getEntry(state, result);
        result = getExit(state, result);

        //recupere les transtions
        let transitionsList = graph.getLinks().filter(link => link.getSourceCell() == state);
        let internalTList = state.get('internalTransitions');
        if (transitionsList.length > 0 | internalTList.length > 0) {
            let transitions = [];
            transitionsList.forEach(function (link) {
                transitions.push(transitionToYaml(link));
            });
            internalTList.forEach(function (link) {
                transitions.push(intransitionToYaml(link));
            });
            result['transitions'] = transitions;
        }

        if (child.length > 0) {
            let childs = [];
            child.forEach(function (cell) {
                if (cell.attributes.type != "Statechart.InitialState") {
                    childs.push(stateToYaml(cell));
                }
            });
            if (state.getType() == 'orthogonal') {
                result['parallel states'] = childs;
            } else {
                result['states'] = childs;
            }
        }


        return result;

    }
};

var getEntry = function (state, result) {
    let entry = state.get('entry').filter(elem => elem != "");
    if (entry.length != 0) {
        let entryBis = entry.join("\n");

        if (entry.length > 1) {
            entryBis = entryBis + "\n";
        }

        result['on entry'] = entryBis;
    }
    return result;
};

var getExit = function (state, result) {
    let exit = state.get('exit').filter(elem => elem != "");


    if (exit.length != 0) {
        let exitBis = exit.join("\n");
        if (exit.length > 1) {
            exitBis = exitBis + "\n";
        }

        result['on exit'] = exitBis;

    }
    return result;
};

//efface les espaces de debut et de fin de chaque element d'une liste
var removeAllBES = function (list) {
    list = list.map(function (el) {
        el = el.trim();
        return el;
    });
    return list;
};

var transitionToYaml = function (link) {
    let result = {'target': link.getTargetCell().getClassName()};


    let event = link.attr(".events-text/text")[0];
    let guard = link.attr(".guard-text/text")[0];
    let action = link.attr(".action-text/text")[0].split(";");
    action = removeAllBES(action);
    action = action.join("\n");

    if (event != "") {
        result['event'] = event;
    }
    if (guard != "") {
        result['guard'] = guard;
    }
    if (action != "") {
        if (action.split('\n').length > 1) {
            action = action + "\n";
        }
        result['action'] = action;
    }

    contrat = link.get('contrat');
    if (contrat.length > 0) {
        conditions = [];
        for (let i = 0; i < contrat.length; i++) {
            conditions.push(conditionToYaml(contrat[i]));
        }
        result['contract'] = conditions;
    }

    return result;
};

var conditionToYaml = function (cond) {
    if (cond[0] === "precondition") {
        return{'before': cond[1]};
    } else if (cond[0] === "postcondition") {
        return{'after': cond[1]};
    } else if (cond[0] === "invariant") {
        return{'always': cond[1]};
    } else {
        return {};
    }
};

var intransitionToYaml = function (link) {
    let result = {};
    let event = link[0];
    let guard = link[1];
    let action = link[2].split(";");
    action = removeAllBES(action);
    action = action.join("\n");
    if (event != "") {
        result['event'] = event;
    }
    if (guard != "") {
        result['guard'] = guard;
    }
    if (action != "") {
        if (action.split('\n').length > 1) {
            action = action + "\n";
        }
        result['action'] = action;
    }
    return result;
};

var getMemory = function (cell) {
    let links = graph.getLinks().filter(link => link.getSourceCell() == cell);
    if (links.length > 0) {
        return(links[0].getTargetCell().getClassName());
    } else {
        return null;
    }
};

//permet de charger un graph
var fromYaml = function (file) {
    let fR = new FileReader();
    var result = "";
    fR.onload = function (e) {
        result = e.target.result;

        graphFromYaml(result);
    };
    fR.readAsText(file[0]);
};

var graphFromYaml = function (result) {
    graph.clear();
    let informations = jsyaml.safeLoad(result);
    statechartDefFromYaml(informations["statechart"]);
    let res = stateFromYaml(informations["statechart"]["root state"], new Map(), new Map());
    res[0].position(50, 50, {deep: true});
    createLinks(res[1], res[2]);
};

let space = 20;
var statechartDefFromYaml = function (yaml) {
    document.getElementById("Statechart-Name").value = yaml['name'];


    let description = yaml['description'];
    if (description != null) {
        description = removeBN(description).join("\n");
        document.getElementById("Statechart-Description").value = description;
    }


    let preamble = yaml['preamble'];
    if (preamble != null) {
        preamble = removeBN(preamble).join("\n");
        document.getElementById("Statechart-Preamble").value = preamble;
    }
};

var stateFromYaml = function (ob, links, name) {
    let cell = null;
    let type = ob['type'];
    if (type != null) {
        if (type == 'final') {
            cell = new joint.shapes.Statechart.EndState;
        } else {
            if (type == 'shallow history') {
                cell = new joint.shapes.Statechart.HistoricalState;
            } else if (type == 'deep history') {
                cell = new joint.shapes.Statechart.DeepHistoricalState;
            }
        }
    } else {
        cell = new joint.shapes.Statechart.States;
    }

    cell.prop("name", ob['name']);
    let entry = ob['on entry'];
    if (entry != null) {
        cell.prop("entry", removeBN(entry));
    }

    let exit = ob['on exit'];
    if (exit != null) {
        cell.prop("exit", removeBN(exit));
    }

    let memory = ob['memory'];
    if (memory != null) {
        let link = new Map();
        link.set('target', memory);
        links.set(cell.id, link);
    }

    let contract = ob['contract'];
    if (contract != null) {
        cell.prop('contrat', contractFromYAML(contract));
    }

    graph.addCell(cell);
    let val = space;
    if (ob['initial'] != null) {
        let newCells = new joint.shapes.Statechart.InitialState;
        graph.addCell(newCells);

        newCells.position(space, space);
        cell.addChild(newCells);
        val = val * 2 + newCells.get("size").width;

        let link = new Map();
        link.set('target', ob['initial']);
        links.set(newCells.id, [link]);
    }


    if (ob['parallel states'] != null) {
        cell.changeType();
        ob['parallel states'].forEach(function (elem) {
            let res = stateFromYaml(elem, links, name);
            let newCells = res[0];
            links = res[1];
            name = res[2];

            newCells.position(space, val, {deep: true});
            val = val + newCells.get("size").height + space;
            cell.addChild(newCells);
        });
        cell.updateSize();
    }
    if (ob['states'] != null) {
        ob['states'].forEach(function (elem) {
            let res = stateFromYaml(elem, links, name);
            let newCells = res[0];
            links = res[1];
            name = res[2];

            newCells.position(val, space, {deep: true});
            val = val + newCells.get("size").width + space;
            cell.addChild(newCells);
        });
    }

    if (ob['transitions'] != null) {
        let list = [];
        let inter = [];
        ob['transitions'].forEach(function (elem) {
            target = elem['target'];
            if (target != null) {
                list.push(linkFromYAML(elem));
            } else {
                inter.push(interLinkFromYAML(elem));
            }
        });
        if (type == null) {
            cell.prop('internalTransitions', inter);
        }
        links.set(cell.id, list);
    }

    name.set(cell.getClassName(), cell.id);
    return [cell, links, name];
};

var contractFromYAML = function (contract) {
    contractList = [];
    for (let i = 0; i < contract.length; i++) {
        let cond = contract[i];
        if (cond["before"] != null) {
            contractList.push(["precondition", cond["before"]]);
        } else if (cond["after"] != null) {
            contractList.push(["postcondition", cond["after"]]);
        } else if (cond["always"] != null) {
            contractList.push(["invariant", cond["always"]]);
        }
    }
    return contractList;
};

var linkFromYAML = function (link) {
    let map = new Map();
    map.set('target', link['target']);

    let contract = link['contract'];
    if (contract != null) {
        map.set('contract', contractFromYAML(contract));
    }

    let action = link['action'];
    if (action != null) {
        map.set('action', action);
    }

    let event = link['event'];
    if (event != null) {
        map.set('event', event);
    }

    let guard = link['guard'];
    if (guard != null) {
        map.set('guard', guard);
    }


    return map;
};

var interLinkFromYAML = function (link) {
    let res = [];



    let event = link['event'];
    if (event != null) {
        res.push(event);
    } else {
        res.push("");
    }

    let guard = link['guard'];
    if (guard != null) {
        res.push(guard);
    } else {
        res.push("");
    }

    let action = link['action'];
    if (action != null) {
        res.push(action);
    } else {
        res.push("");
    }


    return res;
};

var createLinks = function (links, name) {
    links.forEach(function (link, key) {
        link.forEach(function (value) {
            let target = name.get(value.get('target'));
            let link = createLink(graph.getCell(key), graph.getCell(target));

            let guard = "";
            let action = "";
            let event = "";

            if (value.get('guard') != null) {
                guard = removeBN(value.get('guard'));
                guard = guard.join(" and ");
                link.prop("attrs/.guard-text/text", [guard]);
            }
            if (value.get('event') != null) {
                event = removeBN(value.get('event'));
                event = event.join(" and ");
                link.prop("attrs/.events-text/text", [event]);
            }
            if (value.get('action') != null) {
                action = removeBN(value.get('action'));
                action = action.join(";");
                link.prop("attrs/.action-text/text", [action]);
            }

            if (value.get('contract') != null) {
                link.prop("contrat", value.get('contract'));
            }

            changeLabel(link, event, guard, action);
            changelinkTS(link);
        });
    });
};

var removeBN = function (ob) {
    ob = ob.split("\n");
    if (ob.length > 1) {
        ob.pop();
    }
    return ob;
};