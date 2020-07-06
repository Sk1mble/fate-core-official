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
    }

    activateListeners(html){
        super.activateListeners(html);
        const saveButton = html.find("button[id='save_aspects']");
        saveButton.on("click", event => this.submit())
        const removeButton = html.find("button[name='remove_aspect']")
        removeButton.on("click", event => this._onRemove(event, html));

        const addButton = html.find("button[name='new_aspect']")
        addButton.on("click", event => this._onAdd(event, html));
    }

    async _onAdd(event, html){
        let newAspect = {"name":"New Aspect", "description":"New Aspect","value":"New Aspect"}
        let aspects = duplicate (this.object.data.data.aspects);
        aspects["New Aspect"] = newAspect;
        await this.object.update({"data.aspects":aspects})
        this.render(false);
    }

    async _onRemove(event, html){
        console.log("Removing")
        let name = event.target.id.split("_")[1];
        await this.object.update({"data.aspects": {[`-=${name}`]:null}})
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
        return this.object;
    }

    async _updateObject(event, formData){
        let aspects = {}
        console.log(formData)
        for (let i in formData){
            let working = i.split("_");
            let name = working[0];
            let value = working[1];
            let newAspect = {}

            if (name == "name"){
                newAspect["name"]=formData[i];
                aspects[newAspect.name]=newAspect;
                var newName = formData[i].trim()
            }
            if (name == "description") {
                console.log(newName)
                console.log(aspects[newName])
                aspects[newName].description=formData[i].trim();
            }
            if (name == "value"){
                aspects[newName].value=formData[i].trim();
            }
            if (name == "delete"){
                console.log(formData[i])
                delete aspects[newName]
            }
        }
        await this.object.update({"data.aspects":[]})//Name changes won't be propagated unless we delete.
        await this.object.update({"data.aspects":aspects})
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