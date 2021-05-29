/* global chai */

var expect = chai.expect;
var should = chai.should();
var assert = chai.assert;

let name = "Test Name";
let description = "une description simple";
let preamble = "current = 0 \n destination = 0 \n doors_open = True";
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
doorsClosed.prop("contrat", [["precondition", "current > 0"], ["postcondition", "destination == 0"]]);

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

let link7 = createLink(doorsClosed, movingUp);
link7.prop("attrs/.guard-text/text", ["destination > current"]);

let link8 = createLink(doorsClosed, movingDown);
link8.prop("attrs/.guard-text/text", ["destination < current and destination >= 0"]);

createLink(dinitial, doorsOpen);
createLink(finitial, floorSelecting);

let json = graphInJSON();
let yaml = getYaml();


describe("La traduction du graphe en JSON est faite correctement.", function () {
    let res = JSON.parse(json);

    it("Tout les états sont traduis.", function () {
        let cells = (Object.entries(res["Cells"]));
        assert.lengthOf(cells, 11);
        assert.equal(id.includes(cells[0][0]), true);
        assert.equal(id.includes(cells[2][0]), true);
        assert.equal(id.includes(cells[5][0]), true);
        assert.equal(id.includes(cells[6][0]), true);
        assert.equal(id.includes(cells[8][0]), true);
        assert.equal(id.includes(cells[10][0]), true);
    });


    it("Tout les liens sont traduis.", function () {
        let links = (Object.entries(res["Links"]));
        assert.lengthOf(links, 10);
    });

    it("Tout les information du statechart sont traduis.", function () {
        expect(res["Name"].join("\n")).to.equal(name);
        expect(res["Description"].join("\n")).to.equal(description);
        expect(res["Preamble"].join("\n")+"\n").to.equal(preamble);
    });
});

describe("La traduction du graphe en YAML est faite correctement.", function () {
    let informations = jsyaml.safeLoad(yaml);
    
    let root = informations["statechart"]["root state"];
    
    it("Tout les états sont traduis.", function () {

        assert.equal(root["name"], "active");
        assert.equal(root["parallel states"][0]["name"], "floorListener");
        assert.equal(root["parallel states"][0]["initial"], "floorSelecting");
        assert.equal(root["parallel states"][1]["states"][2]["name"], "moving");
    });


    it("Tout les liens sont traduis.", function () {
        assert.lengthOf(root["parallel states"][1]["states"][2]["transitions"], 1);
        assert.lengthOf(root["parallel states"][1]["states"][0]["transitions"], 2);
    });

    it("Tout les information du statechart sont traduis.", function () {
        expect(informations["statechart"]["name"]).to.equal(name);
        expect(informations["statechart"]["description"]).to.equal(description);
        expect(informations["statechart"]["preamble"]).to.equal(preamble);
    });
});


describe("La traduction d'un graphe YAML est faite correctement.", function () {
    graphFromYaml(yaml);
    
    it("Les information du statechart sont restitués correctement.", function () {
        expect(getText("Statechart-Name").join('\n')).to.equal(name);
        expect(getText("Statechart-Description").join('\n')).to.equal(description);
        expect(getText("Statechart-Preamble").join('\n')+"\n").to.equal(preamble);
    });

    let cells = graph.getElements();
    let roots = graph.getElements().filter(cellSec => cellSec.attributes.type == "Statechart.States" && cellSec.getParentCell() == null);
    let root = roots[0];
    let rootchild = root.getEmbeddedCells();
    let floorSelecting = graph.getElements().filter(cellSec => cellSec.attributes.type == "Statechart.States" && cellSec.getClassName() == "floorSelecting");
    let movingUp = graph.getElements().filter(cellSec => cellSec.attributes.type == "Statechart.States" && cellSec.getClassName() == "movingUp");
    let moving = movingUp[0].getParentCell();
    let doorsClosed = graph.getElements().filter(cellSec => cellSec.attributes.type == "Statechart.States" && cellSec.getClassName() == "doorsClosed")[0];
    it("Les états sont restitués correctement.", function () {
        assert.lengthOf(cells, 11);
        
        assert.lengthOf(roots, 1);
        
        
        expect(root.getClassName()).to.equal('active');
        assert.lengthOf(rootchild, 2);
        

        assert.lengthOf(root.get("contrat"),3);
        
        assert.lengthOf(floorSelecting, 1);
        assert.lengthOf(movingUp, 1);
        
        assert.lengthOf(movingUp[0].get("entry"), 1);
        
        expect(moving.getClassName()).to.equal('moving');
        
        assert.lengthOf(doorsClosed.get("contrat"),2);
    });
    
    
    let links = graph.getLinks();
    let link1 = links.filter(link => link.getSourceCell().attributes.type == "Statechart.States" && link.getSourceCell().getClassName() == "floorSelecting")[0];
    let link = links.filter(link => link.getSourceCell().attributes.type == "Statechart.States" && link.getSourceCell().getClassName() == "doorsOpen");
    let initial = links.filter(link => link.getSourceCell().attributes.type == "Statechart.InitialState");

    
    it("Les liens sont restitués correctement.", function () {
        assert.lengthOf(links,10);
        
        assert.lengthOf(link,2);
        
        expect(link1.attr(".events-text/text")[0]).to.equal("floorSelected");
        expect(link1.attr(".action-text/text")[0]).to.equal("destination = event.floor");
        
        assert.lengthOf(initial,2);
    });


});


describe("La traduction d'un graphe JSON est faite correctement.", function () {
    jsonTograph(json);
    
    it("Les information du statechart sont restitués correctement.", function () {
        expect(getText("Statechart-Name").join('\n')).to.equal(name);
        expect(getText("Statechart-Description").join('\n')).to.equal(description);
        expect(getText("Statechart-Preamble").join('\n')+"\n").to.equal(preamble);
    });

    let cells = graph.getElements();
    let roots = graph.getElements().filter(cellSec => cellSec.attributes.type == "Statechart.States" && cellSec.getParentCell() == null);
    let root = roots[0];
    let rootchild = root.getEmbeddedCells();
    let floorSelecting = graph.getElements().filter(cellSec => cellSec.attributes.type == "Statechart.States" && cellSec.getClassName() == "floorSelecting");
    let movingUp = graph.getElements().filter(cellSec => cellSec.attributes.type == "Statechart.States" && cellSec.getClassName() == "movingUp");
    let moving = movingUp[0].getParentCell();
    let doorsClosed = graph.getElements().filter(cellSec => cellSec.attributes.type == "Statechart.States" && cellSec.getClassName() == "doorsClosed")[0];
    it("Les états sont restitués correctement.", function () {
        assert.lengthOf(cells, 11);
        
        assert.lengthOf(roots, 1);
        
        
        expect(root.getClassName()).to.equal('active');
        assert.lengthOf(rootchild, 2);
        

        assert.lengthOf(root.get("contrat"),3);
        
        assert.lengthOf(floorSelecting, 1);
        assert.lengthOf(movingUp, 1);
        
        assert.lengthOf(movingUp[0].get("entry"), 1);
        
        expect(moving.getClassName()).to.equal('moving');
        
        assert.lengthOf(doorsClosed.get("contrat"),2);
    });
    
    
    let links = graph.getLinks();
    let link1 = links.filter(link => link.getSourceCell().attributes.type == "Statechart.States" && link.getSourceCell().getClassName() == "floorSelecting")[0];
    let link = links.filter(link => link.getSourceCell().attributes.type == "Statechart.States" && link.getSourceCell().getClassName() == "doorsOpen");
    let initial = links.filter(link => link.getSourceCell().attributes.type == "Statechart.InitialState");

    
    it("Les liens sont restitués correctement.", function () {
        assert.lengthOf(links,10);
        
        assert.lengthOf(link,2);
        
        expect(link1.attr(".events-text/text")[0]).to.equal("floorSelected");
        expect(link1.attr(".action-text/text")[0]).to.equal("destination = event.floor");
        
        assert.lengthOf(initial,2);
    });


});