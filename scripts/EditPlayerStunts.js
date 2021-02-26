class EditPlayerStunts extends FormApplication {

    constructor(actor, stunt){
        super(actor, stunt);
        this.actor = actor;
        this.stunt=duplicate(stunt);

        //This is a good place to set up some variables at the top level so we can access them with this.
        if (this.actor.type == "Extra"){
            this.options.title=`${game.i18n.localize("ModularFate.ExtraStuntEditor")} ${this.object.name}`
        } else {
            if (this.actor.isToken) {
                this.options.title=`${game.i18n.localize("ModularFate.TokenStuntEditor")} ${this.object.name}`
            } else {
                this.options.title=`${game.i18n.localize("ModularFate.StuntEditorFor")} ${this.object.name}`
            }
        }
        game.system.apps["actor"].push(this);
    } //End constructor

    static get defaultOptions(){
        const options = super.defaultOptions;
        options.template = "systems/ModularFate/templates/EditPlayerStunts.html";
        options.width = "auto";
        options.height = "auto";
        options.title = game.i18n.localize("ModularFate.CharacterStuntEditor");
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
        if (this.object.type == "Extra"){
            //code to render editplayerstunts.
            Hooks.call("updateItem", {"id":this.object.id})
        }
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
            if (this.actor.token.data.id == id){
               let name = this.stunt.name;
                try {
                    if (data.actorData.data.stunts[name]!=undefined){
                        if (!this.renderPending) {
                            this.renderPending = true;
                            setTimeout(() => {
                                this.stunt = mergeObject(this.stunt, data.actorData.data.stunts[name]);
                                ui.notifications.info(game.i18n.localize("ModularFate.StuntEdited"))
                                this.render(false);
                                this.renderPending = false;
                            }, 0);
                        }
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
                        
                        if (!this.renderPending) {
                            this.renderPending = true;
                            setTimeout(() => {
                                this.stunt = mergeObject(this.stunt, data.data.stunts[name]);
                                ui.notifications.info(game.i18n.localize("ModularFate.StuntEdited"))
                                this.render(false);
                                this.renderPending = false;
                            }, 0);
                        }
                    }
                }
                catch {

                }
            }
        }       
    }

    async close(options){
        game.system.apps["actor"].splice(game.system.apps["actor"].indexOf(this),1); 
        await super.close(options);
    }

    setSheet (ActorSheet){
        this.sheet = ActorSheet;
    } 

    async getData(){
        let data={}
        data.stunt=this.stunt;
        if (this.actor.type=="Extra"){
            data.skills=game.settings.get("ModularFate","skills");
        } else {
            data.skills=this.actor.data.data.skills;
        }
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
        options.title = game.i18n.localize("ModularFate.StuntDatabase");
        options.id = "StuntDB";
        options.resizable = false;
        options.scrollY = ["#stunts_db"]
        return options; 
    } 

    activateListeners(html) {
        super.activateListeners(html);
        const addButton = html.find("button[name='add_stunt']");
        addButton.on("click", event => this._onAddButton(event, html));
        const deleteButton = html.find("button[name='del_stunt']");
        deleteButton.on("click", event => this._onDeleteButton(event, html));
        const sb_name = html.find("div[name='sb_name']");
        const sb_skill = html.find("div[name='sb_skill']");
        const sb_refresh = html.find("div[name='sb_refresh']");
        sb_name.on("click", event => {this.sort = "name"; this.render(false)});
        sb_skill.on("click", event => {this.sort = "linked_skill"; this.render(false)});
        sb_refresh.on("click", event => {this.sort = "refresh_cost"; this.render(false)});
        const export_stunts = html.find("button[id='export_stunts']");
        const import_stunts = html.find("button[id='import_stunts']");
        export_stunts.on("click", event => this._onExportStunts(event, html));
        import_stunts.on("click", event => this._onImportStunts(event, html));
        const export_stunt = html.find("button[name='export_stunt']");
        export_stunt.on("click", event => this._onExportStunt(event, html));
    } //End activateListeners

    async _onExportStunts(event, html){
 
        let stunt_text = JSON.stringify(game.settings.get("ModularFate","stunts"));
 
        new Dialog({
            title: game.i18n.localize("ModularFate.CopyAndPasteToSaveStunts"), 
            content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:Montserrat; width:382px; background-color:white; border:1px solid lightsteelblue; color:black;" id="stunt_db">${stunt_text}</textarea></div>`,
            buttons: {
            },
        }).render(true);
    }

    async _onExportStunt(event, html){
        let stunt = event.target.id.split("_")[0];

        let stunt_text = `{"${stunt}":${JSON.stringify(game.settings.get("ModularFate","stunts")[stunt])}}`;
 
        new Dialog({
            title: game.i18n.localize("ModularFate.CopyAndPasteToSaveStunt"), 
            content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:Montserrat; width:382px; background-color:white; border:1px solid lightsteelblue; color:black;" id="stunt_db">${stunt_text}</textarea></div>`,
            buttons: {
            },
        }).render(true);
    }

    async getStunts(){
        return new Promise(resolve => {
            new Dialog({
                title: game.i18n.localize("ModularFate.PasteOverStunts"),
                content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:Montserrat; width:382px; background-color:white; border:1px solid lightsteelblue; color:black;" id="import_stunt_db"></textarea></div>`,
                buttons: {
                    ok: {
                        label: game.i18n.localize("ModularFate.Save"),
                        callback: () => {
                            resolve (document.getElementById("import_stunt_db").value);
                        }
                    }
                },
            }).render(true)
        });
    }

    async _onImportStunts(event, html){
        let text = await this.getStunts();
        try {
            let imported_stunts = JSON.parse(text);
            let stuntDB = duplicate(game.settings.get("ModularFate","stunts"));
            if (stuntDB == undefined){
                stuntDB = {};
            }
            for (let stunt in imported_stunts){
                stuntDB[stunt]=imported_stunts[stunt];
            }
            await game.settings.set("ModularFate","stunts", stuntDB);
            this.render(false);
        } catch (e) {
            ui.notifications.error(e);
        }
    }

    async _onAddButton(event, html){
        let stunt = game.settings.get("ModularFate","stunts")[event.target.id.split("_")[0]];
        this.actor.update({"data.stunts":{[`${stunt.name}`]:stunt}});
    }

    async _onDeleteButton(event, html){
        let del = await ModularFateConstants.confirmDeletion();
        if (del){
            let stunts = duplicate (game.settings.get("ModularFate","stunts"));
            await delete stunts[event.target.id.split("_")[0]];
            await game.settings.set("ModularFate","stunts",stunts);
            await this.render(false);
        }
    }
}
