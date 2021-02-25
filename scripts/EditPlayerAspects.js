class EditPlayerAspects extends FormApplication{
    constructor(...args){
            super(...args);
    
                if(this.object.isToken){
                    this.options.title=`${game.i18n.localize("ModularFate.EditTokenAspectsTitle")} ${this.object.name}`                    
                } else {
                    this.options.title=`${game.i18n.localize("ModularFate.EditAspectsTitle")} ${this.object.name}`
                }
                this.player_aspects=duplicate(this.object.data.data.aspects);
                
                game.system.apps["actor"].push(this);
                game.system.apps["item"].push(this);
                this.aspects=duplicate(this.object.data.data.aspects)
    }

    activateListeners(html){
        super.activateListeners(html);
        const saveButton = html.find("button[id='save_aspects']");
        saveButton.on("click", event => this.submit())
        const removeButton = html.find("button[name='remove_aspect']")
        removeButton.on("click", event => this._onRemove(event, html));

        const addButton = html.find("button[name='new_aspect']")
        addButton.on("click", event => this._onAdd(event, html));

        const up = html.find("button[name='aspect_up']");
        const down = html.find("button[name='aspect_down']");
        up.on("click", event => this._on_move(event, html, -1));
        down.on("click", event => this._on_move(event, html, 1));

        const name = html.find("input[class='aspect_name']")
        name.on("change", event => this._on_name_change(event, html));

        const desc = html.find("textarea[class='aspect_description']")
        desc.on("change", event => this._on_desc_change(event, html));

        const value = html.find("textarea[class='aspect_value']")
        value.on("change", event => this._on_value_change(event, html));
    }

    async _on_name_change(event, html){
        let name = event.target.name.split("_")[1];
        let newName = event.target.value;
        let newAspect = {};
        newName = newName.split(".").join("․").trim();
        newAspect.name = newName;
    
        newAspect.description = this.aspects[name].description;
        newAspect.value = this.aspects[name].value;
        delete this.aspects[name]
        this.aspects[newName]=newAspect;
        this.render(false);
    }

    async _on_desc_change(event, html){
        let name = event.target.name.split("_")[1];
        this.aspects[name].description=event.target.value;
    }

    async _on_value_change(event, html){
        let name = event.target.name.split("_")[1];
        this.aspects[name].value=event.target.value;
    }

    async _on_move(event,html, direction){
        let info = event.target.id.split("_");
        let aspect = info[1]
        this.aspects = ModularFateConstants.moveKey(this.aspects, aspect, direction)
        this.render(false);
    }

    async _onRemove(event,html){
        let del = await ModularFateConstants.confirmDeletion();
        if (del){
            let info = event.target.id.split("_");
            let name = info[1];
            delete this.aspects[name];
            this.render(false);
        }
    }

    async _onAdd(event, html){
        let count = 0;
        for (let a in this.aspects){
            if (a.startsWith(game.i18n.localize("ModularFate.New_Aspect"))){
                count++
            }
        }
        let name = game.i18n.localize("ModularFate.New_Aspect") + " "+ count;
        let newAspect = {"name":name, "description":game.i18n.localize("ModularFate.New_Aspect"),"value":game.i18n.localize("ModularFate.New_Aspect")}
       
        this.aspects[newAspect.name] = newAspect;
        this.render(false);
    }

    //Set up the default options for instances of this class
    static get defaultOptions() {
        const options = super.defaultOptions; //begin with the super's default options
        //The HTML file used to render this window
        options.template = "systems/ModularFate/templates/EditPlayerAspects.html"; 
        options.width = "650";
        options.height = "800";
        options.title = game.i18n.localize("ModularFate.CharacterAspectEditor");
        options.closeOnSubmit = false;
        options.id = "PlayerAspectSetup"; // CSS id if you want to override default behaviors
        options.resizable = true;
        return options;
    }

    async getData(){
        let current = duplicate(this.object.data.data.aspects);
        let updated = this.aspects;
        for (let aspect in current){
            if (updated[aspect] == undefined){
                delete current[aspect];
            }
        }
        return mergeObject(this.aspects, current);//This allows us to update if any aspects change while we're editing this, but won't respawn deleted aspects.
    }

    async _updateObject(event, formData){
        await this.object.update({"data.aspects":[]}, {render:false})
        this.object.update({"data.aspects":this.aspects})
    }

    //This function is called when an actor or item update is called.

    async renderMe(id){
        await setTimeout(async () => {
                if (this?.object?.id == id || this?.object?.parent?.id == id){
                    if (!this.renderPending) {
                        this.renderPending = true;
                        setTimeout(() => {
                        this.render(false);
                        this.renderPending = false;
                        }, 0);
                    }
                }    
            }, 0);
        
    }
}