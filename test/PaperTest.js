/* global chai */

var expect = chai.expect;
var should = chai.should();

describe("La liste des erreurs est correctement instanciée.", function () {
    it("Tout les types d'erreurs apparaissent.", function () {
        should.exist(listOfError.get('DuplicateName'));
        should.exist(listOfError.get('badRoot'));
        should.exist(listOfError.get('multipleRoot'));
        should.exist(listOfError.get('badIni'));
        should.exist(listOfError.get('missingTIni'));
    });


    it("Les structures de stockage des erreurs sont correctement instanciés.", function () {
        listOfError.get('DuplicateName').should.be.a('Map');


        listOfError.get('badRoot').should.be.a('Map');
        expect(listOfError.get('badRoot')).to.have.lengthOf(4);

        listOfError.get('multipleRoot').should.be.a('Array');


        listOfError.get('missingTIni').should.be.a('Map');

        listOfError.get('missingTIni').should.be.a('Map');
    });
});

describe("Affichage et supression des outils d'un état.", function () {
    it("Ajout des outils d'un états.", function () {
        let cell = new joint.shapes.Statechart.States({
            size: {width: 100, height: 40}
        });

        addNewState(cell);
        
        showTools(cell);
        should.exist(StateTools);
    });
    
    it("Suppression des outils d'un état.", function () {
        hideTools();
        should.not.exist(StateTools);
    });
    
    it("Outil d'ajout d'une transition depuis les 'état finaux' est caché.", function () {
        let cell = new joint.shapes.Statechart.EndState;
        graph.addCell(cell);
        showTools(cell);
        
        
        expect(StateTools.get('attrs')['.element-tool-addLinkFrom'].visibility).to.equal('hidden');
    });
    
    it("Outil d'ajout d'une transition vers les 'état initiaux' est caché.", function () {
        let cell = new joint.shapes.Statechart.InitialState;
        graph.addCell(cell);
        showTools(cell);
        
        
        expect(StateTools.get('attrs')['.element-tool-addLinkTo'].visibility).to.equal('hidden');
    });
    
    graph.clear();
});

describe("Utilisation de l'outil d'un état.", function () {
    it("Etat correctement sélectionné.", function () {
        let cell = new joint.shapes.Statechart.States({
            size: {width: 100, height: 40}
        });
        
        addNewState(cell);
        
        selectCell(paper.findViewByModel(cell));
        
        let position = cell.get('position');
        let size = cell.get('size');
        expect(position.x).to.equal(0);
        expect(position.y).to.equal(0);
        
        let StateToolsP = StateTools.get('position');
        let StateToolsS = StateTools.get('size');
        expect(StateToolsP.x ).to.equal(position.x - distanceOfTool);
        expect(StateToolsP.y ).to.equal(position.y - distanceOfTool);
        expect(StateToolsS.width ).to.equal(size.width+2* distanceOfTool);
        expect(StateToolsS.height ).to.equal(size.height+2* distanceOfTool);
    });
    
    it("Redimentionnement de l'outil et de l'état.", function () {
        changeSizeElem(100,40,200,60);
        
        let position = cell.get('position');
        let size = cell.get('size');
        expect(position.x).to.equal(0);
        expect(position.y).to.equal(0);
        expect(size.width).to.equal(200);
        expect(size.height).to.equal(60);
        
        let StateToolsP = StateTools.get('position');
        let StateToolsS = StateTools.get('size');
        expect(StateToolsP.x ).to.equal(position.x - distanceOfTool);
        expect(StateToolsP.y ).to.equal(position.y - distanceOfTool);
        expect(StateToolsS.width ).to.equal(size.width+2* distanceOfTool);
        expect(StateToolsS.height ).to.equal(size.height+2* distanceOfTool);
    });
    
    it("Ajout d'un lien vers l'état depuis un autre état", function () {
        let cell2 = new joint.shapes.Statechart.States({
            size: {width: 100, height: 40}
        });
        
        addNewState(cell2);
        
        elementAddlinkTo();
        
        elementMouseenter(paper.findViewByModel(cell2));
        elementPointerDown(paper.findViewByModel(cell2));
        elementPointerUp(paper.findViewByModel(cell2));
        
        let links = graph.getLinks();
        expect(links.length).to.equal(1);
        
        expect(links[0].getSourceCell().id).to.equal(cell2.id);
        
        links[0].remove();
    });
    
    it("Ajout d'un lien depuis l'état vers un autre état", function () {
        let cell3 = new joint.shapes.Statechart.States({
            size: {width: 100, height: 40}
        });
        
        addNewState(cell3);
        
        elementAddlinkFrom();
        
        elementMouseenter(paper.findViewByModel(cell3));
        elementPointerDown(paper.findViewByModel(cell3));
        elementPointerUp(paper.findViewByModel(cell3));
        
        let links = graph.getLinks();
        expect(links.length).to.equal(1);
        
        expect(links[0].getTargetCell().id).to.equal(cell3.id);
    });
    
    it("Déselection d'un état.", function () {
        renitializationNE();
        
        should.not.exist(StateTools);

    });
    
    it("Supression de l'état sélectionné", function () {
        let cell4 = new joint.shapes.Statechart.States({
            size: {width: 100, height: 40}
        });
         
        addNewState(cell4);
        
        selectCell(paper.findViewByModel(cell4));
        
        let id = cell4.id;
        var e = jQuery.Event( "click" );
        
        elementRemovePointerDown(null,e);
        elementAcceptPointerDown(null,e);
        
        should.not.exist(graph.getCell(id));
        graph.clear();
    });
});

describe("Création et suppression de messages d'alerte.", function () {
    it("Création et suppression d'une fenêtre message.", function () {
        createNote("Test");
        
        should.exist(popup);
        expect(popup.attributes.type).to.equal('Statechart.Note');
        
        deleteAlert();
        should.not.exist(popup);
        
        graph.clear();
    });
    
    it("Création et suppression d'une fenêtre choix.", function () {
        createPopup(null,null,"Test");
        
        should.exist(popup);
        expect(popup.attributes.type).to.equal('Statechart.Alert');
        
        deleteAlert();
        should.not.exist(popup);
        
        graph.clear();
    });
    
    
 
    
});


