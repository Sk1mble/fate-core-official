class fcoActorShapeManager extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
    constructor(token, hud){
        super(token, hud);
        this.token = token;
        this.actor = token.actor;
        this.hud = hud;
    } //End constructor

    get title (){
	// return title here
        return game.i18n.format("fate-core-official.shapeManagerTitle",{name:this.actor.name});
    }

    static DEFAULT_OPTIONS = {
        tag: "form",
        id: "fcoActorShapeManager",
        classes:['fate'],
        window: {
            title: this.title,
            icon: 'fa fa-arrows-rotate'
        },
        form: {
            closeOnSubmit: 'false'
        },
        position: {
        },
        actions: {
            fcoShapeAdd: fcoActorShapeManager.#addShape,
            delete: fcoActorShapeManager.#deleteShape,
            changeShape: fcoActorShapeManager.#changeShape
        }
    }

    static PARTS = {
        fcoActorShapeManagerForm: {
            template: 'systems/fate-core-official/templates/fcoActorShapeManager.hbs',
            scrollable: [".fcoShapeList"]
        }
    }

    static async #addShape (event, element){
        //storeShape (shapeName, tokenImg, avatarImg, token, transition)
        let name = this.element.querySelector("input[name='fcoShapeAddName']")?.value;
        let transition = null;
        transition = this.element.querySelector("select[name ='fcotransition']").value;
        if (name) {
            await this.actor.storeShape(name, null, null, this.token, transition);
            await this.render();
        } else {
            ui.notifications.error(game.i18n.localize("fate-core-official.empty"));
        }
    }

    static async #deleteShape (event, element){
        let key = event.target.closest('div').dataset.key;
        let shapes = this.actor.getFlag("fate-core-official","shapes");
        let shape = undefined; 
        if (shapes) shape = shapes[key];
        let del = await fcoConstants.confirmDeletion();
        if (del){
            await this.actor.deleteShape(shape.name);
            await this.render();
        }
    }

    static async #changeShape (event, element){
        let key = event.target.closest('div').dataset.key;
        if (key){
            let shape = undefined;
            let shapes = this.actor.getFlag("fate-core-official","shapes");
            if (shapes) shape = shapes[key];
            if (shape) await this.actor.changeShape(shape.name, this.token);
            if (!game.system["fco-shifted"]){
                this.close();
            }
        }
    }

    _prepareContext (options){
        let data = {};
        data.actor = this.actor;
        data.shapes = this.actor.getFlag("fate-core-official","shapes");
        data.transitionsObject = foundry.canvas.rendering.filters.TextureTransitionFilter.TYPES;
        data.transitions = Object.keys(foundry.canvas.rendering.filters.TextureTransitionFilter.TYPES);
        return data;
    }

    _onFirstRender(context, options) {
        let left = this.hud.getBoundingClientRect().right+25;
        let top = this.hud.getBoundingClientRect().top;
        this.setPosition({left:left, top:top})
        super._onFirstRender(context, options);
    }

    _onRender(context, options){

    }
}
