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
                for (let stunt in this.actor.system.stunts){
                    if (stunt.startsWith(formData["name"])) count++;
                }
                if (count > 1) formData["name"] = this.stunt.name + " " + count;
            }

            if (formData["name"]!=this.stunt.name && !this.new) {
                await this.object.update({"system.stunts":{[`-=${this.stunt.name}`]:null}});
            }
            
            for (let t in formData){
                this.stunt[t]=formData[t];
            }
            this.stunt.name=this.stunt.name.split(".").join("․");

            let boxes = this.stunt.boxes;
            let old_box_values = this.stunt.box_values;
            let new_box_values = [];
            if (boxes != 0){
                if (!old_box_values) old_box_values = [];
                for (let i = 0; i< boxes; i++){
                    if (old_box_values[i]){
                        new_box_values.push(old_box_values[i]);
                    } else {
                        new_box_values.push(false);
                    }
                }
            }
            
            this.stunt.box_values = new_box_values;
            await this.actor.update({"system.stunts":{[this.stunt.name]:this.stunt}})
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

        const description_rich = html.find("div[id='edit_stunt_desc_rich']");

        description_rich.on('keyup', async event => {
            if (event.which == 9) description_rich.trigger("click");
        })

        description_rich.on('contextmenu', async event => {
            let text = await fcoConstants.updateText("Edit raw HTML",event.currentTarget.innerHTML, true);
            if (text != "discarded") {
                $('#edit_stunt_desc_rich')[0].innerHTML = text;
                $('#edit_stunt_desc')[0].innerHTML = text;
            }
        })

        description_rich.on('click', async event => {
            $("#edit_stunt_desc_rich").css('display', 'none');
            $("#edit_stunt_desc").css('display', 'block');
            $("#edit_stunt_desc").focus();
        })

        const stunt_desc = html.find("div[id='edit_stunt_desc']");
        stunt_desc.on ('blur', async event => {
            if (!window.getSelection().toString()){
                let desc;
                if (isNewerVersion(game.version, '9.224')){
                    desc = DOMPurify.sanitize(await TextEditor.enrichHTML(event.target.innerHTML, {secrets:game.user.isGM, documents:true, async:true}));
                } else {
                    desc = DOMPurify.sanitize(await TextEditor.enrichHTML(event.target.innerHTML, {secrets:game.user.isGM, entities:true, async:true}));
                }
                
                $('#edit_stunt_desc').css('display', 'none');
                $('#edit_stunt_desc_rich')[0].innerHTML = desc;    
                $('#edit_stunt_desc_rich').css('display', 'block');
            }
        })
        
        return new Pen(options);
    } //End activateListeners

    async _onSaveButton(event, html){
        await this.submit();
    }

    renderMe(id,data){
        if (this.object.isToken){
            if (this.actor.token.id == id){
               let name = this.stunt.name;
                try {
                    if (data.actorData.system.stunts[name]!=undefined){
                        if (!this.renderPending) {
                            this.renderPending = true;
                            setTimeout(() => {
                                this.stunt = mergeObject(this.stunt, data.actorData.system.stunts[name]);
                                ui.notifications.info(game.i18n.localize("fate-core-official.StuntEdited"))
                                this.render(false);
                                this.renderPending = false;
                            }, 150);
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
                    if (data.system.stunts[name]!=undefined){
                        if (!this.renderPending) {
                            this.renderPending = true;
                            setTimeout(() => {
                                this.stunt = mergeObject(this.stunt, data.system.stunts[name]);
                                ui.notifications.info(game.i18n.localize("fate-core-official.StuntEdited"))
                                this.render(false);
                                this.renderPending = false;
                            }, 150);
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
        data.stunt=duplicate(this.stunt);
        data.stunt.richDesc = await fcoConstants.fcoEnrich(data.stunt.description, this.actor)
        if (this.actor == null){
            data.skills=game.settings.get("fate-core-official","skills");
        } else {
            if (this.actor.type=="Extra"){
                data.skills=mergeObject(this.actor.system.skills, game.settings.get("fate-core-official","skills"), {inplace:false});
            } else {
                data.skills=this.actor.system.skills;
            }
        }
        data.gm = game.user.isGM;
        data.actor = this.actor;
        return data
    } //End getData
} //End EditPlayerStunts

class StuntDB extends Application {

    constructor(actor){
        super();
        this.filter = "";
        this.ignoreCase = false;
        this.actor=actor;
        this.stunts=duplicate(game.settings.get("fate-core-official","stunts"));
    }    

    async getData(){
        if (this.sort == undefined){
            this.sort="name";
        }
        let data = {};
        let stunts = duplicate(game.settings.get("fate-core-official","stunts"));
        for (let stunt in stunts){
            stunts[stunt].richDesc = await fcoConstants.fcoEnrich(stunts[stunt].description);
        }
        this.stunts = stunts;
        let stuntsA = [];
    
        for (let stunt in stunts){
            if (this.filter != ""){
                if (this.ignoreCase){
                    if ((stunts[stunt]?.name?.toLowerCase())?.includes(this.filter.toLowerCase()) || (stunts[stunt]?.linked_skill?.toLowerCase()).includes(this.filter.toLowerCase()) || (stunts[stunt]?.description?.toLowerCase())?.includes(this.filter.toLowerCase())){
                        stuntsA.push(stunts[stunt]);
                    }
                } else {
                    if (stunts[stunt]?.name?.includes(this.filter) || stunts[stunt]?.linked_skill?.includes(this.filter) || stunts[stunt]?.description?.includes(this.filter)){
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
        options.classes = options.classes.concat(['fate']);
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

        const mfdraggable = html.find('.mf_draggable');
        mfdraggable.on("dragstart", event => {
            if (game.user.isGM){
                let ident = "mf_draggable"
                let type = event.target.getAttribute("data-mfdtype");
                let origin = event.target.getAttribute("data-mfactorid");
                let dragged_name = event.target.getAttribute("data-mfname");
                
                let shift_down = false; 
                if (isNewerVersion(game.version, "9.230")){
                    shift_down = game.system["fco-shifted"];    
                } else {
                    shift_down = keyboard.isDown("Shift");
                }

                let dragged= this.stunts[dragged_name];
                let user = game.user.id;
                let drag_data = {ident:ident, userid:user, type:type, origin:origin, dragged:dragged, shift_down:shift_down};
                event.originalEvent.dataTransfer.setData("text/plain", JSON.stringify(drag_data));
            }
        })

        mfdraggable.on("dblclick", event => {
            let origin = event.target.getAttribute("data-mfactorid");
            let content = `<strong>Shared from Stunt Database:</strong><br/><hr>`
            let user = game.user;
            let type = event.target.getAttribute("data-mfdtype");
            
            let name = event.target.getAttribute("data-mfname");
            let entity;
            if (type == "stunt") {
                entity = this.stunts[name];
                content += `<strong>${game.i18n.localize("fate-core-official.Name")}: </strong> ${entity.name} (${game.i18n.localize("fate-core-official.Refresh")} ${entity.refresh_cost})<br/>
                            <strong>${game.i18n.localize("fate-core-official.Description")}:</strong> ${entity.description}<br/>
                            <strong>${game.i18n.localize("fate-core-official.Skill")}:</strong> ${entity.linked_skill}<br/>
                            <strong>${game.i18n.localize("fate-core-official.Bonus")}:</strong> ${entity.bonus}<br/>`;
                let actions = `<em style = "font-family:Fate; font-style:normal">`;
                if (entity.overcome) actions += 'O ';
                if (entity.caa) actions += 'C ';
                if (entity.attack) actions += 'A '
                if (entity.defend) actions += 'D';
                content += actions;
                ChatMessage.create({content: content, speaker : {user}, type: CONST.CHAT_MESSAGE_TYPES.OOC })
            }
        });

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
            let stunt = new fcoStunt({
                "name":game.i18n.localize("fate-core-official.NewStunt"),
                "linked_skill":"None",
                "description":"",
                "refresh_cost":1,
                "overcome":false,
                "caa":false,
                "attack":false,
                "defend":false,
                "bonus":0
            }).toJSON();
            let editor = new EditPlayerStunts(null, stunt, {new:true});
            editor.originator = this;
            editor.render(true);
        })
    } //End activateListeners

    async _onExportStunts(event, html){
 
        let stunt_text = JSON.stringify(game.settings.get("fate-core-official","stunts"),null,5);
 
        new Dialog({
            title: game.i18n.localize("fate-core-official.CopyAndPasteToSaveStunts"), 
            content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:var(--fco-font-family); width:382px; background-color:white; border:1px solid var(--fco-foundry-interactable-color); color:black;" id="stunt_db">${stunt_text}</textarea></div>`,
            buttons: {
            },
        }).render(true);
    }

    async _onExportStunt(event, html){
        let stunt = event.target.id.split("_")[0];

        let stunt_text = `{"${stunt}":${JSON.stringify(game.settings.get("fate-core-official","stunts")[stunt],null,5)}}`;
 
        new Dialog({
            title: game.i18n.localize("fate-core-official.CopyAndPasteToSaveStunt"), 
            content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:var(--fco-font-family); width:382px; background-color:white; border:1px solid var(--fco-foundry-interactable-color); color:black;" id="stunt_db">${stunt_text}</textarea></div>`,
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
                content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:var(--fco-font-family); width:382px; background-color:white; border:1px solid var(--fco-foundry-interactable-color); color:black;" id="import_stunt_db"></textarea></div>`,
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

            if (!imported_stunts.hasOwnProperty("name")){
                //THis is a stunts object
                // Validate the imported data to make sure they all match the schema
                for (let stunt in imported_stunts){
                    let st = new fcoStunt(imported_stunts[stunt]).toJSON();
                    if (st){
                        stuntDB[stunt] = st;  
                    }
                }
            } else {
                // This is a single stunt.
                let st = new fcoStunt(imported_stunts).toJSON();
                if (st){
                    stuntDB[st.name] = st;
                }
            }
            await game.settings.set("fate-core-official","stunts", stuntDB);
            this.render(false);
        } catch (e) {
            ui.notifications.error(e);
        }
    }

    async _onAddButton(event, html){
        let stunt = duplicate(game.settings.get("fate-core-official","stunts")[event.target.id.split("_")[0]]);
        this.actor.update({"system.stunts":{[`${stunt.name}`]:stunt}});
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
