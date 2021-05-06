class EditPlayerStunts extends FormApplication {

    constructor(actor, stunt, options){
        super(actor, stunt);
        this.actor = actor;
        this.stunt=duplicate(stunt);
        this.new = options?.new;

        //This is a good place to set up some variables at the top level so we can access them with this.
        
        if (this.actor == null){
            this.options.title=`${game.i18n.localize("fate-core-official.dbStuntEditor")}`
        } else {
            if (this?.actor?.type == "Extra"){
                this.options.title=`${game.i18n.localize("fate-core-official.ExtraStuntEditor")} ${this.object.name}`
            } else {
                if (this.actor.isToken) {
                    this.options.title=`${game.i18n.localize("fate-core-official.TokenStuntEditor")} ${this.object.name}`
                } else {
                    this.options.title=`${game.i18n.localize("fate-core-official.StuntEditorFor")} ${this.object.name}`
                }
            }
            game.system.apps["actor"].push(this);
        }
    } //End constructor

    static get defaultOptions(){
        const options = super.defaultOptions;
        options.template = "systems/fate-core-official/templates/EditPlayerStunts.html";
        options.width = "auto";
        options.height = "auto";
        options.title = game.i18n.localize("fate-core-official.CharacterStuntEditor");
        options.closeOnSubmit = true;
        options.id = "PlayerStuntSetup";
        options.resizable = true;
        options.classes = options.classes.concat(['fate']);
        return options 
    } // End getDefaultOptions

    async _updateObject(event, formData){
        if (this.actor == null){ // This is a stunt in the database
            let stunts = duplicate(game.settings.get("fate-core-official","stunts"));

            if (this.new){
                let count = 1;
                for (let stunt in stunts){
                    if (stunt.startsWith(formData["name"])) count++;
                }
                if (count >1) formData["name"] = this.stunt.name + " " + count;
            }
            if (formData["name"]!=this.stunt.name && !this.new) {
                delete stunts[this.stunt.name];
            }
            for (let t in formData){
                this.stunt[t]=formData[t];
            }
            this.stunt.name=this.stunt.name.split(".").join("․");
            stunts[this.stunt.name] = this.stunt;
            await game.settings.set("fate-core-official","stunts",stunts);
            this.originator.render(false);
        } else {
            if (this.new){
                let count = 1;
                for (let stunt in this.actor.data.data.stunts){
                    if (stunt.startsWith(formData["name"])) count++;
                }
                if (count > 1) formData["name"] = this.stunt.name + " " + count;
            }

            if (formData["name"]!=this.stunt.name && !this.new) {
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
    }

    activateListeners(html) {
        super.activateListeners(html);
        const addButton = html.find("button[id='add']");
        addButton.on("click", event => this._onAddButton(event, html));
        const saveButton = html.find("button[id='save']");
        saveButton.on("click", event => this._onSaveButton(event, html));

        let editor = html.find("div[id='edit_stunt_desc']")[0];
        var options = {
            editor: editor, // {DOM Element} [required]
            stay: false,
            class: 'pen', // {String} class of the editor,
            debug: false, // {Boolean} false by default
            textarea: '<textarea name="content"></textarea>', // fallback for old browsers
            linksInNewWindow: false // open hyperlinks in a new windows/tab
        }
        return new Pen(options);

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
                                ui.notifications.info(game.i18n.localize("fate-core-official.StuntEdited"))
                                this.render(false);
                                this.renderPending = false;
                            }, 5);
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
                                ui.notifications.info(game.i18n.localize("fate-core-official.StuntEdited"))
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
        if (this.actor == null){
            data.skills=game.settings.get("fate-core-official","skills");
        } else {
            if (this.actor.type=="Extra"){
                data.skills=game.settings.get("fate-core-official","skills");
            } else {
                data.skills=this.actor.data.data.skills;
            }
        }
        data.gm = game.user.isGM;
        return data
    } //End getData
} //End EditPlayerStunts

class StuntDB extends Application {

    constructor(actor){
        super();
        this.filter = "";
        this.ignoreCase = false;
        this.actor=actor;
    }    

    async getData(){
        if (this.sort == undefined){
            this.sort="name";
        }
        let data = {};
        let stunts = duplicate(game.settings.get("fate-core-official","stunts"));
        let stuntsA = [];
    
        for (let stunt in stunts){
            if (this.filter != ""){
                if (this.ignoreCase){
                    if ((stunts[stunt].name.toLowerCase()).includes(this.filter.toLowerCase()) || (stunts[stunt].linked_skill.toLowerCase()).includes(this.filter.toLowerCase()) || (stunts[stunt].description.toLowerCase()).includes(this.filter.toLowerCase())){
                        stuntsA.push(stunts[stunt]);
                    }
                } else {
                    if (stunts[stunt].name.includes(this.filter) || stunts[stunt].linked_skill.includes(this.filter) || stunts[stunt].description.includes(this.filter)){
                        stuntsA.push(stunts[stunt]);
                    }
                }
            }
            else {
                stuntsA.push(stunts[stunt])
            }
        }
        fcoConstants.sort_key(stuntsA, this.sort);
        data.stunts = stuntsA;
        data.actor = this.actor;
        data.gm=game.user.isGM;
        data.filter = this.filter;
        data.ignoreCase = this.ignoreCase;
        return data;
    }

    static get defaultOptions(){
        const options = super.defaultOptions;
        options.template = "systems/fate-core-official/templates/StuntDB.html";
        options.width = "auto";
        options.height = "auto";
        options.title = game.i18n.localize("fate-core-official.StuntDatabase");
        options.id = "StuntDB";
        options.resizable = false;
        options.scrollY = ["#stunts_db"]
        return options; 
    } 

    async _render(...args){
        let foc = false;
        if ($(':focus')[0]?.id == "stunt_db_filter_box") foc = true;
        await super._render(...args);
        let fo = $('input[id="stunt_db_filter_box"]')[0];
        if (foc) fo.select();
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
        const edit_stunt = html.find ("button[name='edit_stunt']");
        edit_stunt.on("click", event => this._onEditStunt(event, html));
        const add_stunt = html.find("button[id='add_db_stunt']");

        const filter_stunts = $('#stunt_db_filter_box');
        filter_stunts.on('change', async event => {
            this.filter = event.target.value;
            await this._render(false);
        })

        const clear_filter = $('#stunt_db_clear_filter');
        clear_filter.on('click', async event => {
            this.filter = "";
            await this._render(false);
        })

        const ignoreCase = $('#stunt_db_ignore_case');
        ignoreCase.on('click', async event => {
            this.ignoreCase = !this.ignoreCase;
            if (this.ignoreCase) ignoreCase.css('opacity','0.4');
            if (!this.ignoreCase) ignoreCase.css('opacity','1');
            if (this.filter != "") await this._render(false);
        })

        add_stunt.on("click", event => {
            let stunt = {
                "name":game.i18n.localize("fate-core-official.NewStunt"),
                "linked_skill":"None",
                "description":"",
                "refresh_cost":1,
                "overcome":false,
                "caa":false,
                "attack":false,
                "defend":false,
                "bonus":0
            }
            let editor = new EditPlayerStunts(null, stunt, {new:true});
            editor.originator = this;
            editor.render(true);
        })
    } //End activateListeners

    async _onExportStunts(event, html){
 
        let stunt_text = JSON.stringify(game.settings.get("fate-core-official","stunts"));
 
        new Dialog({
            title: game.i18n.localize("fate-core-official.CopyAndPasteToSaveStunts"), 
            content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:Montserrat; width:382px; background-color:white; border:1px solid lightsteelblue; color:black;" id="stunt_db">${stunt_text}</textarea></div>`,
            buttons: {
            },
        }).render(true);
    }

    async _onExportStunt(event, html){
        let stunt = event.target.id.split("_")[0];

        let stunt_text = `{"${stunt}":${JSON.stringify(game.settings.get("fate-core-official","stunts")[stunt])}}`;
 
        new Dialog({
            title: game.i18n.localize("fate-core-official.CopyAndPasteToSaveStunt"), 
            content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:Montserrat; width:382px; background-color:white; border:1px solid lightsteelblue; color:black;" id="stunt_db">${stunt_text}</textarea></div>`,
            buttons: {
            },
        }).render(true);
    }

    async _onEditStunt(event, html){
        //Create a stunt editor with a null actor
        //Edit the stunt editor so if the actor is null it knows to save the stunt to the stunt DB on exit rather than to an actor's sheet.
        let stunt_name = event.target.id.split("_")[0];
        let stunt = game.settings.get("fate-core-official","stunts")[stunt_name];
        let eps = new EditPlayerStunts(null, stunt, {new:false}).render(true);
        eps.originator = this;
    }

    async getStunts(){
        return new Promise(resolve => {
            new Dialog({
                title: game.i18n.localize("fate-core-official.PasteOverStunts"),
                content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:Montserrat; width:382px; background-color:white; border:1px solid lightsteelblue; color:black;" id="import_stunt_db"></textarea></div>`,
                buttons: {
                    ok: {
                        label: game.i18n.localize("fate-core-official.Save"),
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
            let stuntDB = duplicate(game.settings.get("fate-core-official","stunts"));
            if (stuntDB == undefined){
                stuntDB = {};
            }
            for (let stunt in imported_stunts){
                stuntDB[stunt]=imported_stunts[stunt];
            }
            await game.settings.set("fate-core-official","stunts", stuntDB);
            this.render(false);
        } catch (e) {
            ui.notifications.error(e);
        }
    }

    async _onAddButton(event, html){
        let stunt = game.settings.get("fate-core-official","stunts")[event.target.id.split("_")[0]];
        this.actor.update({"data.stunts":{[`${stunt.name}`]:stunt}});
    }

    async _onDeleteButton(event, html){
        let del = await fcoConstants.confirmDeletion();
        if (del){
            let stunts = duplicate (game.settings.get("fate-core-official","stunts"));
            await delete stunts[event.target.id.split("_")[0]];
            await game.settings.set("fate-core-official","stunts",stunts);
            await this.render(false);
        }
    }
}
