class EditPlayerAspects extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2){
    constructor(actor, application){
            super(actor, application);
            game.system.apps["actor"].push(this);
            game.system.apps["item"].push(this);
            this.aspects = foundry.utils.duplicate(actor.system.aspects);
            this.actor = actor;
    }

    get title(){
        if(this.actor.isToken){
            return`${game.i18n.localize("fate-core-official.EditTokenAspectsTitle")} ${this.actor.name}`                    
        } else {
            return`${game.i18n.localize("fate-core-official.EditAspectsTitle")} ${this.actor.name}`
        }
    }

    async updateAspects(){
        await this.actor.update({"system.aspects":_replace({})},{noHook:true, renderSheet:false}); 
        await this.actor.update({"system.aspects":_replace(this.aspects)})
    }

    _onRender(context, options){
        const removeButton = this.element.querySelectorAll("button[name='remove_aspect']")
        removeButton.forEach(button => button?.addEventListener("click", event => this._onRemove(event)));

        const addButton = this.element.querySelector("button[name='new_aspect']")
        addButton?.addEventListener("click", event => this._onAdd(event));

        const up = this.element.querySelectorAll("button[name='aspect_up']");
        const down = this.element.querySelectorAll("button[name='aspect_down']");
        up.forEach(button => button?.addEventListener("click", event => this._on_move(event, -1)));
        down.forEach(button => button?.addEventListener("click", event => this._on_move(event, 1)));

        const name = this.element.querySelectorAll("input[class='aspect_name']")
        name.forEach(field => field?.addEventListener("change", event => this._on_name_change(event)));

        const value = this.element.querySelectorAll("textarea[class='aspect_value']")
        value.forEach(field => field?.addEventListener("change", event => this._on_value_change(event)));

        const aspectDescriptions = this.element.querySelectorAll(".fco_prose_mirror.aspect_description");
        const aspectNotes = this.element.querySelectorAll(".fco_prose_mirror.aspect_notes");

        aspectDescriptions.forEach(aspect =>{ 
            aspect.addEventListener("change", async event => {
                let desc = event.target.value;
                let key = event.target.getAttribute("data-key");
                this.aspects[key].description = desc;
                await this.updateAspects();
                await this.render(false);
        })});

        aspectNotes.forEach(aspect => {
            aspect.addEventListener("change", async event => {
                let notes = event.target.value;
                let key = event.target.getAttribute("data-key");
                this.aspects[key].notes = notes;
                await this.updateAspects();
                await this.render(false);
        })});  
    }

    async _on_name_change(event){
        let key = event.target.name.split("_")[1]
        let newName = event.target.value;

        if (!newName) {
            ui.notifications.error(game.i18n.localize("fate-core-official.YouCannotHaveAnAspectWithABlankName"));
            event.target.value = this.aspects[key].name;
            return;
        }

        let newAspect = new fcoAspect({
            name:newName,
            description:this.aspects[key].description,
            notes:this.aspects[key].notes,
            value:this.aspects[key].value
        }).toJSON();
        
        if (newAspect){
            // Find the aspect with the same name as the old name and delete it
            delete this.aspects[key]
            this.aspects[fcoConstants.tob64(newName)]=newAspect;
        }
        await this.updateAspects();
        await this.render(false);
    }

    async _on_value_change(event){
        let key = event.target.getAttribute("data-key");
        this.aspects[key].value = event.target.value;
        await this.updateAspects();
        await this.render(false);
    }

    async _on_move(event, direction){
        let info = event.target.id.split("_");
        let aspect = info[1]
        this.aspects = fcoConstants.moveKey(this.aspects, aspect, direction);
        await this.updateAspects();
        await this.render(false);
    }

    async _onRemove(event){
        let del = await fcoConstants.confirmDeletion();
        if (del){
            let info = event.target.id.split("_");
            let aspectKey = info[1];
            delete this.aspects[aspectKey];
            await this.updateAspects();
            await this.render(false);
        }
    }

    async _onAdd(event){
        let count = 0;
        for (let a in this.aspects){
            if (this.aspects[a].name.startsWith(game.i18n.localize("fate-core-official.New_Aspect"))){
                count++
            }
        }
        let name = game.i18n.localize("fate-core-official.New_Aspect") + " "+ count;
        let newAspect = new fcoAspect({"name":name, "description":game.i18n.localize("fate-core-official.New_Aspect"),"value":game.i18n.localize("fate-core-official.New_Aspect"),"notes":"Notes"}).toJSON();
        if (newAspect){
            this.aspects[fcoConstants.tob64(newAspect.name)] = newAspect;
            await this.updateAspects();
            await this.render(false);
        }
    }

    //Set up the default options for instances of this class
    static DEFAULT_OPTIONS = {
        tag: "form",
        classes:['fate'],
        position: {
            width: 800
        },
        window: {
            title: this.title,
            icon: "fas fa-scroll",
            resizable: true
        },
        form: {
            closeOnSubmit: false,
            submitOnChange: false,
        }
    }

    static PARTS = {
        "PlayerAspectSetup":{
            template: "systems/fate-core-official/templates/EditPlayerAspects.html",
            scrollable: ['#aspect_editor']
        }
    }

    async _prepareContext(){
        let current = foundry.utils.duplicate(this.actor.system.aspects);
        let updated = foundry.utils.duplicate(this.aspects);
        for (let aspect in current){
            if (current[aspect].notes == undefined){
                current[aspect].notes = "";
            }
        }
        for (let aspect in current){
            if (fcoConstants.gbn(updated, current[aspect].name) == undefined){
                delete current[aspect];
            }
        }
        let data = {};
        let aspects = foundry.utils.mergeObject(updated, current);//This allows us to update if any aspects change while we're editing this, but won't respawn deleted aspects.
        this.aspects = foundry.utils.duplicate(aspects);
        data.aspects = this.aspects;
        for (let as in data.aspects){
            data.aspects[as].richDesc = await fcoConstants.fcoEnrich(data.aspects[as].description, this.actor)
            data.aspects[as].richNotes = await fcoConstants.fcoEnrich(data.aspects[as].notes, this.actor)
        }
        return data;
    }

    //This function is called when an actor or item update is called.

    async renderMe(id){
        if (this?.actor?.id == id || this?.actor?.parent?.id == id){
            if (!this.renderPending) {
                this.renderPending = true;
                await this.render(false);
                this.renderPending = false;
            }
        } 
    }
}