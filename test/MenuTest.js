/* global chai */

var expect = chai.expect;
var should = chai.should();

describe("Boutons de création d'état fonctionnels.", function () {
    it("Bouton 'State' rajoute un état.", function () {
        document.getElementById("States").click();

        let res = graph.getCells().filter(cell => cell.attributes.type == "Statechart.States" && cell.getEmbeddedCells().length == 0);
        expect(res).to.have.lengthOf(1);
    });
 
    it("Bouton 'Composite state' rajoute un état avec un état enfant.", function () {
        document.getElementById("Composite_States").click();
        
        let res = graph.getCells().filter(cell => cell.attributes.type == "Statechart.States" && cell.getEmbeddedCells().length == 1);
        expect(res).to.have.lengthOf(1);
    });
    
    it("Bouton 'Initial state' rajoute un état initial.", function () {
        document.getElementById("Initial_State").click();
        
        let res = graph.getCells().filter(cell => cell.attributes.type == "Statechart.InitialState");
        expect(res).to.have.lengthOf(1);
    });
    
    it("Bouton 'Final state' rajoute un état final.", function () {
        document.getElementById("End_State").click();
        
        let res = graph.getCells().filter(cell => cell.attributes.type == "Statechart.EndState");
        expect(res).to.have.lengthOf(1);
    });
    
    it("Bouton 'Shallow history state' rajoute un état historique.", function () {
        document.getElementById("Historical_State").click();
        
        let res = graph.getCells().filter(cell => cell.attributes.type == "Statechart.HistoricalState");
        expect(res).to.have.lengthOf(1);
    });
    
    graph.clear();
});


describe("Menu de changement de propriétés complet.", function () {
    it("Changement de propriétés d'un état simple/composé/parallèle complet.", function () {
        let cell = new joint.shapes.Statechart.States({
            size: {width: 100, height: 40}
        });
        
        addNewState(cell);

        addingElementPropertyState(cell);
        
        let name = document.getElementById("Name");
        let entry = document.getElementById("Entry");
        let exit = document.getElementById("Exit");
        let internalTrans = document.getElementById("internalTrans");
        let contrat = document.getElementById("internalCond");
        
        should.exist(name);
        should.exist(entry);
        should.exist(exit);
        should.exist(internalTrans);
        should.exist(contrat);
        removeElementProperty();
    });
    
    it("Changement de propriétés d'un état historique/final complet.", function () {
        let cell = new joint.shapes.Statechart.EndState({
            size: {width: 100, height: 40}
        });
        
        addNewState(cell);

        addingElementPropertyState(cell);
        
        let name = document.getElementById("Name");
        let entry = document.getElementById("Entry");
        let exit = document.getElementById("Exit");
        let internalTrans = document.getElementById("internalTrans");
        let contrat = document.getElementById("internalCond");
        
        should.exist(name);
        should.exist(entry);
        should.exist(exit);
        should.not.exist(internalTrans);
        should.exist(contrat);
        removeElementProperty();
    });
    
    it("Changement de propriétés d'un lien complet.", function () {
        addingElementPropertyLink();
        
        let event = document.getElementById("EventsT");
        let guard = document.getElementById("Guard");
        let action = document.getElementById("Action");
        let contrat = document.getElementById("internalCond");
        
        should.exist(event);
        should.exist(guard);
        should.exist(action);
        should.exist(contrat);
        graph.clear();
    });
});
