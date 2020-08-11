class EditPlayerStunts extends FormApplication {

    constructor(actor, stunt){
        super(actor, stunt);
        this.actor = actor;
        this.stunt=duplicate(stunt);

        //This is a good place to set up some variables at the top level so we can access them with this.
        if (this.actor.isToken) {
            this.options.title=`Stunt editor for [Token] ${this.object.name}`
        } else {
            this.options.title=`Stunt editor for ${this.object.name}`
        }
        game.system.apps["actor"].push(this);
    } //End constructor

    static get defaultOptions(){
        const options = super.defaultOptions;
        options.template = "systems/ModularFate/templates/EditPlayerStunts.html";
        options.width = "auto";
        options.height = "auto";
        options.title = `Character stunt editor`;
        options.closeOnSubmit = true;
        options.id = "PlayerStuntSetup";
        options.resizable = true;
        return options 
    } // End getDefaultOptions

    async _updateObject(event, formData){
        if (formData["name"]!=this.stunt.name) {
            await this.object.update({"data.stunts":{[`-=${this.stunt.name}`]:null}});
        }
        
        for (let t in formData){
            this.stunt[t]=formData[t];
        }
        this.stunt.name=this.stunt.name.split(".").join("․");
        await this.actor.update({"data.stunts":{[this.stunt.name]:this.stunt}})
    }

    activateListeners(html) {
        super.activateListeners(html);
        const addButton = html.find("button[id='add']");
        addButton.on("click", event => this._onAddButton(event, html));
        const saveButton = html.find("button[id='save']");
        saveButton.on("click", event => this._onSaveButton(event, html));
    } //End activateListeners

    async _onSaveButton(event, html){
        await this.submit();
    }

    renderMe(id,data){
        if (this.object.isToken){
            if (this.actor.token.data._id == id){
               let name = this.stunt.name;
                try {
                    if (data.actorData.data.stunts[name]!=undefined){
                        this.stunt = mergeObject(this.stunt, data.actorData.data.stunts[name]);
                        ui.notifications.info("Stunt has been edited.")
                        this.render(false);
                    }
                }
                catch {

                }
            }
        }
        else {
            if (this.actor.id == id){
                let name = this.stunt.name;
                try {
                    if (data.data.stunts[name]!=undefined){
                        this.stunt = mergeObject(this.stunt, data.data.stunts[name]);
                        ui.notifications.info("Stunt has been edited.")
                        this.render(false);
                    }
                }
                catch {

                }
            }
        }       
    }

    close(){
        game.system.apps["actor"].splice(game.system.apps["actor"].indexOf(this),1); 
        super.close();
    }

    setSheet (ActorSheet){
        this.sheet = ActorSheet;
    } 

    async getData(){
        let data={}
        data.stunt=this.stunt;
        data.skills=this.actor.data.data.skills;
        data.gm = game.user.isGM;
        return data
    } //End getData
} //End EditPlayerStunts

class StuntDB extends Application {

    constructor(actor){
        super();
        this.actor=actor;
    }

    async getData(){
        if (this.sort == undefined){
            this.sort="name";
        }
        let data = {};
        let stunts = game.settings.get("ModularFate","stunts");
        let stuntsA = [];
    
        for (let stunt in stunts){
            stuntsA.push(stunts[stunt])
        }
        ModularFateConstants.sort_key(stuntsA, this.sort);
        data.stunts = stuntsA;
        data.actor = this.actor;
        data.gm=game.user.isGM;
        return data;
    }

    static get defaultOptions(){
        const options = super.defaultOptions;
        options.template = "systems/ModularFate/templates/StuntDB.html";
        options.width = "auto";
        options.height = "auto";
        options.title = `Stunt Database`
        options.id = "StuntDB";
        options.resizable = false;
        return options; 
    } 

    activateListeners(html) {
        super.activateListeners(html);
        const addButton = html.find("button[name='add_stunt']");
        addButton.on("click", event => this._onAddButton(event, html));
        const deleteButton = html.find("button[name='del_stunt']");
        deleteButton.on("click", event => this._onDeleteButton(event, html));
        const sb_name = html.find("td[name='sb_name']");
        const sb_skill = html.find("td[name='sb_skill']");
        const sb_refresh = html.find("td[name='sb_refresh']");
        sb_name.on("click", event => {this.sort = "name"; this.render(false)});
        sb_skill.on("click", event => {this.sort = "linked_skill"; this.render(false)});
        sb_refresh.on("click", event => {this.sort = "refresh_cost"; this.render(false)});
        
    } //End activateListeners

    async _onAddButton(event, html){
        let stunt = game.settings.get("ModularFate","stunts")[event.target.id.split("_")[0]];
        this.actor.update({"data.stunts":{[`${stunt.name}`]:stunt}});
    }

    async _onDeleteButton(event, html){
        let stunts = duplicate (game.settings.get("ModularFate","stunts"));
        await delete stunts[event.target.id.split("_")[0]];
        await game.settings.set("ModularFate","stunts",stunts);
        await this.render(false);
    }
}