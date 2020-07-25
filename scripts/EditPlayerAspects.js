class EditPlayerAspects extends FormApplication{
    constructor(...args){
            super(...args);
    
                if(this.object.isToken){
                    this.options.title=`Aspect editor for [Token] ${this.object.name}`                    
                } else {
                    this.options.title=`Aspect editor for ${this.object.name}`
                }
                this.player_aspects=duplicate(this.object.data.data.aspects);
                
                game.system.apps["actor"].push(this);
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
        //console.log("Name change triggered")
        let name = event.target.name.split("_")[1];
        //console.log(name)
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
        //console.log(event.target.value)
        let name = event.target.name.split("_")[1];
        this.aspects[name].description=event.target.value;
    }

    async _on_value_change(event, html){
        //console.log("value change triggered")
        //console.log(event.target.value)
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
        let info = event.target.id.split("_");
        let name = info[1];
        delete this.aspects[name];
        this.render(false);
    }

    async _onAdd(event, html){
        let count = 0;
        for (let a in this.aspects){
            if (a.startsWith("New Aspect")){
                count++
            }
        }
        let name = "New Aspect " + count;
        let newAspect = {"name":name, "description":"New Aspect","value":"New Aspect"}
       
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
        options.title = `Character Aspect Editor`;
        options.closeOnSubmit = false;
        options.id = "PlayerAspectSetup"; // CSS id if you want to override default behaviors
        options.resizable = true;
        return options;
    }

    async getData(){
        return this.aspects;
    }

    async _updateObject(event, formData){
        await this.object.update({"data.aspects":[]})//Name changes won't be propagated unless we delete.
        await this.object.update({"data.aspects":this.aspects})
        await this.render(false);
    }

    //This function is called when an actor update is called.
    renderMe(id){
        if (this.object.isToken){
            if (this.object.token.id == id){
                this.render(false);
            }
        }

        else {
            if (this.object._id == id){
                this.render(false);
            }
        }       
    }
}