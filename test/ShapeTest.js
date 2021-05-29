/* global chai */

var expect = chai.expect;
var should = chai.should();

describe("Tout les éléments de Sismographe sont définis.", function () {
    it("Les états sont définis.", function () {
        let cell = new joint.shapes.Statechart.States({
            size: {width: 100, height: 40}
        });
        should.exist(cell);
    });

    it("Les états initiaux sont définis.", function () {
        let cell = new joint.shapes.Statechart.InitialState;
        should.exist(cell);
    });

    it("Les états finaux sont définis.", function () {
        let cell = new joint.shapes.Statechart.EndState;
        should.exist(cell);
    });

    it("Les ''shallow history state'' sont définis.", function () {
        let cell = new joint.shapes.Statechart.HistoricalState;
        should.exist(cell);
    });

    it("Les ''deep history state'' sont définis.", function () {
        let cell = new joint.shapes.Statechart.DeepHistoricalState;
        should.exist(cell);
    });
    it("L'outil pour les états est défini.", function () {
        let cell = new joint.shapes.Statechart.Tools;
        should.exist(cell);
    });

    it("Les notes sont définies.", function () {
        let cell = new joint.shapes.Statechart.Note;
        should.exist(cell);
    });

    it("Les popup d'alertes sont définis.", function () {
        let cell = new joint.shapes.Statechart.Alert;
        should.exist(cell);
    });

    it("Les transitions sont définis.", function () {
        let link = new joint.shapes.Satechart.Link();
        should.exist(link);
    });

    graph.clear();
});

describe("Création de transitions", function () {
    it("Les transitions directes sont correctement créées", function () {
        let cell = new joint.shapes.Statechart.States({
            size: {width: 100, height: 40}
        });
        
        let cell2 = new joint.shapes.Statechart.States({
            size: {width: 100, height: 40}
        });
        addNewState(cell);
        addNewState(cell2);
        
        let link = createLink(cell, cell2);
        
        should.exist(link);
        expect(link.getSourceCell().id).to.equal(cell.id);
        expect(link.getTargetCell().id).to.equal(cell2.id);
    });
    
    it("Les transitions qui boucles sont correctement créées", function () {
        let cell = new joint.shapes.Statechart.States({
            size: {width: 100, height: 40}
        });
        addNewState(cell);
        
        let link = createLink(cell);
        
        should.exist(link);
        expect(link.getSourceCell().id).to.equal(cell.id);
        expect(link.getTargetCell().id).to.equal(cell.id);
    });
    graph.clear();
});
