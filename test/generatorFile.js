


document.getElementById("importYamlTest").addEventListener("click", function () {
    if (popup == null) {
        document.getElementById("loadYamlTest").click();
    }
});

toTransformfromYaml = function (file) {
    document.getElementById("hello").innerHTML = '<p>Documents en cour de création ...”</p>';

    let name = "newElevator";
    let description = "une description simple";
    let preamble = "current = 0 \ndestination = 0 \ndoors_open = True";
    document.getElementById("Statechart-Name").value = name;
    document.getElementById("Statechart-Description").value = description;
    document.getElementById("Statechart-Preamble").value = preamble;
    let id = [];

    let movingDown = new joint.shapes.Statechart.States({
        size: {width: 100, height: 40}
    });
    graph.addCell(movingDown);
    movingDown.prop("entry", ["current = current - 1"]);
    movingDown.prop("name", "movingDown");
    id.push(movingDown.id);

    let movingUp = new joint.shapes.Statechart.States({
        size: {width: 100, height: 40}
    });
    graph.addCell(movingUp);
    movingUp.prop("name", "movingUp");
    movingUp.prop("entry", ["current = current + 1"]);
    id.push(movingUp.id);

    let moving = new joint.shapes.Statechart.States({
        size: {width: 100, height: 40}
    });
    graph.addCell(moving);
    moving.prop("name", "moving");
    moving.addChild(movingUp);
    moving.addChild(movingDown);
    id.push(moving.id);

    let dinitial = new joint.shapes.Statechart.InitialState;
    graph.addCell(dinitial);
    let doorsOpen = new joint.shapes.Statechart.States({
        size: {width: 100, height: 40}
    });
    graph.addCell(doorsOpen);
    doorsOpen.prop("name", "doorsOpen");
    id.push(dinitial.id);
    id.push(doorsOpen.id);

    let doorsClosed = new joint.shapes.Statechart.States({
        size: {width: 100, height: 40}
    });
    graph.addCell(doorsClosed);
    doorsClosed.prop("name", "doorsClosed");
    id.push(doorsClosed.id);
    

    let movingElevator = new joint.shapes.Statechart.States({
        size: {width: 100, height: 40}
    });
    graph.addCell(movingElevator);
    movingElevator.prop("name", "movingElevator");
    movingElevator.addChild(doorsClosed);
    movingElevator.addChild(doorsOpen);
    movingElevator.addChild(moving);
    movingElevator.addChild(dinitial);
    id.push(movingElevator.id);

    let finitial = new joint.shapes.Statechart.InitialState;
    graph.addCell(finitial);
    let floorSelecting = new joint.shapes.Statechart.States({
        size: {width: 100, height: 40}
    });
    graph.addCell(floorSelecting);
    floorSelecting.prop("name", "floorSelecting");
    id.push(finitial.id);
    id.push(floorSelecting.id);


    let floorListener = new joint.shapes.Statechart.States({
        size: {width: 100, height: 40}
    });
    graph.addCell(floorListener);
    floorListener.prop("name", "floorListener");
    floorListener.addChild(floorSelecting);
    floorListener.addChild(finitial);
    id.push(floorListener.id);


    let root = new joint.shapes.Statechart.States({
        size: {width: 100, height: 40}
    });
    graph.addCell(root);
    root.prop("name", "active");
    root.prop("contrat", [["precondition", "current == 0"], ["invariant", "destination >= 0"], ["invariant", "current >= 0"]]);
    root.changeType();
    root.addChild(floorListener);
    root.addChild(movingElevator);

    id.push(root.id);

    let link1 = createLink(floorSelecting, floorSelecting);
    link1.prop("attrs/.events-text/text", ["floorSelected"]);
    link1.prop("attrs/.action-text/text", ["destination = event.floor"]);

    let link2 = createLink(moving, doorsOpen);
    link2.prop("attrs/.guard-text/text", ["destination == current"]);
    link2.prop("attrs/.action-text/text", ["doors_open = True"]);

    let link3 = createLink(movingDown, movingDown);
    link3.prop("attrs/.guard-text/text", ["destination < current"]);

    let link4 = createLink(movingUp, movingUp);
    link4.prop("attrs/.guard-text/text", ["destination > current"]);

    let link5 = createLink(doorsOpen, doorsClosed);
    link5.prop("attrs/.guard-text/text", ["destination != current"]);
    link5.prop("attrs/.action-text/text", ["doors_open = False"]);

    let link6 = createLink(doorsOpen, doorsClosed);
    link6.prop("attrs/.guard-text/text", ["after(10) and current > 0"]);
    link6.prop("attrs/.action-text/text", ["destination = 0", "doors_open = False"]);
    link6.prop("contrat", [["precondition", "current > 0"], ["postcondition", "destination == 0"]]);

    let link7 = createLink(doorsClosed, movingUp);
    link7.prop("attrs/.guard-text/text", ["destination > current"]);

    let link8 = createLink(doorsClosed, movingDown);
    link8.prop("attrs/.guard-text/text", ["destination < current and destination >= 0"]);

    createLink(dinitial, doorsOpen);
    createLink(finitial, floorSelecting);

    toYaml();

    fromYaml(file);

    document.getElementById("Statechart-Name").value = "updateElevator";

    active = graph.getElements().filter(cellSec => cellSec.attributes.type == "Statechart.States" && cellSec.getClassName() == "active")[0];
    active.prop("contrat", [["precondition", "current == 0"], ["invariant", "destination >= 0"], ["invariant", "current >= 0"]]);

    moving = graph.getElements().filter(cellSec => cellSec.attributes.type == "Statechart.States" && cellSec.getClassName() == "moving")[0];
    moving.prop("contrat", [["precondition", "destination != current"], ["invariant", "not doors_open"], ["postcondition", "destination == current"], ["postcondition", "current != __old__.current"]]);

    movingUp = graph.getElements().filter(cellSec => cellSec.attributes.type == "Statechart.States" && cellSec.getClassName() == "movingUp")[0];
    movingUp.prop("contrat", [["precondition", "current < destination"], ["invariant", "current <= destination"], ["postcondition", "current > __old__.current"]]);
    movingUp.prop("name", "movingUP");
    movingUp.prop("entry", [["current = current + 2 - 1"]]);

    movingDown = graph.getElements().filter(cellSec => cellSec.attributes.type == "Statechart.States" && cellSec.getClassName() == "movingDown")[0];
    movingDown.prop("contrat", [["precondition", "current > destination"], ["invariant", "current >= destination"], ["postcondition", "current < __old__.current"]]);
    movingDown.prop("name", "movingDOWN");


    links = graph.getLinks();
    link = links.filter(link => link.getSourceCell().attributes.type == "Statechart.States" && link.getSourceCell().getClassName() == "moving" && link.getTargetCell().getClassName() == "doorsOpen")[0];
    link.prop("contrat", [["precondition", "not doors_open"], ["postcondition", "doors_open"]]);

    toYaml();

    document.getElementById("hello").innerHTML = '<p>Document créé merci de les placer dans le dossier resuts avant de lancer le fichier “testExport.py”</p>';
};