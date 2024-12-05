class EditPlayerStunts extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
    constructor(actor, stunt, options){
        super();
        this.actor = actor;
        this.stunt = foundry.utils.duplicate(stunt);
        this.new = options?.new;
    } //End constructor

   static DEFAULT_OPTIONS = {
        id: "PlayerStuntSetup",
        position: {
            "width":"auto",
            "height": "auto",
        },
        tag: "form",
        classes: ['fate'],
        form: {
            handler: EditPlayerStunts.#onSubmit,
            closeOnSubmit: true,
        },
        window: {
            title: this.title,
            icon: "fas fa=-book",
            resizable:false
        }
    }

    static PARTS = {
        PlayerStuntEditor: {
            template: "systems/fate-core-official/templates/EditPlayerStunts.html",
        }
    }

    get title (){
        if (this.actor == null){
             return `${game.i18n.localize("fate-core-official.dbStuntEditor")}`
        } else {
            if (this?.actor?.type == "Extra"){
                return `${game.i18n.localize("fate-core-official.ExtraStuntEditor")} ${this.actor.name}`
            } else {
                game.system.apps["actor"].push(this);
                if (this.actor.isToken) {
                    return `${game.i18n.localize("fate-core-official.TokenStuntEditor")} ${this.actor.name}`
                } else {
                    return `${game.i18n.localize("fate-core-official.StuntEditorFor")} ${this.actor.name}`
                }
            }
        }
    }

    static async #onSubmit (event, form, formDataExtended){
        let formData = formDataExtended.object;
        if (this.actor == null){ // This is a stunt in the database
           let wd = fcoConstants.wd();
           let stunts = foundry.utils.duplicate(wd.system.stunts);
           let update_object = {};
            if (this.new){
                let count = 1;
                for (let stunt in stunts){
                    if (stunts[stunt].name.startsWith(formData["name"])) count++;
                }
                if (count >1) formData["name"] = this.stunt.name + " " + count;
            }
            let stuntKey = fcoConstants.gkfn(stunts, this.stunt.name);

            if (formData["name"]!=this.stunt.name && !this.new) {
                update_object[`system.stunts.-=${stuntKey}`] = null;
            }
            for (let t in formData){
                this.stunt[t]=formData[t];
                update_object[`system.stunts.${fcoConstants.tob64(this.stunt.name)}`] = this.stunt;
            }
            await wd.update(update_object);
            this.originator.render(false);
        } else {
            if (this.new){
                let count = 1;
                for (let stunt in this.actor.system.stunts){
                    if (this.actor.system.stunts[stunt].name.startsWith(formData["name"])) count++;
                }
                if (count > 1) formData["name"] = this.stunt.name + " " + count;
            }

            if (formData["name"] != this.stunt.name && !this.new) {
                let stuntKey = fcoConstants.gkfn(this.actor.system.stunts, this.stunt.name);
                await this.actor.update({"system.stunts":{[`-=${stuntKey}`]:null}});
            }
            
            for (let t in formData){
                if (t == "macro" && formData[t] == ''){
                    this.stunt[t] = null;
                } else {
                    this.stunt[t]=formData[t];
                }
            }

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
            await this.actor.update({"system.stunts":{[fcoConstants.tob64(this.stunt.name)]:this.stunt}});
            // And now, a kludge to make sure the sheet refreshes after the macro details are changed.
            setTimeout(async () => {
                await this.actor.sheet.render(false);
            }, 250);
            if (this.actor.type == "Extra"){
                //code to render editplayerstunts.
                Hooks.call("updateItem", {"id":this.actor.id})
            }
        }
    }

    _onRender(context, options) {
        let editor = this.element.querySelector("div[id='edit_stunt_desc']");
        var options = {
            editor: editor, // {DOM Element} [required]
            stay: false,
            class: 'pen', // {String} class of the editor,
            debug: false, // {Boolean} false by default
            textarea: '<textarea name="content"></textarea>', // fallback for old browsers
            linksInNewWindow: false // open hyperlinks in a new windows/tab
        }

        // Edit the text field that shows the name of the macro when we edit the value of the macro UUid.
        const macro = this.element.querySelector("input[name='macro']")
        macro.addEventListener("change", (event) => {
            let search = `${this.stunt.name}_macroName`;
            if (event.target.value == ''){
                event.target.value = null;
                document.getElementById(search).textContent = '';
                return;
            } 
            let field = new foundry.data.fields.DocumentUUIDField({required:true, nullable:true, initial:null});
            let invalid = field.validate(event.target.value);
            if (invalid){
                ui.notifications.error (invalid.message);
                event.target.value = this.stunt.macro;
            } else {
                if (!event.target.value.includes("Macro")){
                    ui.notifications.error(game.i18n.localize("fate-core-official.must_be_a_macro"))
                    event.target.value = this.stunt.macro;
                } else {
                    let macro = fromUuidSync(event.target.value);
                    if (!macro) {
                        ui.notifications.error(game.i18n.localize("fate-core-official.macro_not_found"))
                        event.target.value = this.stunt.macro;
                    }
                }
            }
            document.getElementById(search).textContent = fromUuidSync(event.target.value)?.name;
        })

        const description_rich = this.element.querySelector("div[id='edit_stunt_desc_rich']");

        description_rich.addEventListener('keyup', async event => {
            if (event.which == 9) description_rich.trigger("click");
        })

        description_rich.addEventListener('contextmenu', async event => {
            let text = await fcoConstants.updateText("Edit raw HTML",event.currentTarget.innerHTML, true);
            if (text != "discarded") {
                this.element.querySelector('#edit_stunt_desc_rich').innerHTML = text;
                this.element.querySelector('#edit_stunt_desc').innerHTML = text;
            }
        })

        description_rich.addEventListener('click', async event => {
            this.element.querySelector("#edit_stunt_desc_rich").style.display = "none";
            this.element.querySelector("#edit_stunt_desc").style.display = 'block';
            this.element.querySelector("#edit_stunt_desc").focus();
        })

        const stunt_desc = this.element.querySelector("div[id='edit_stunt_desc']");
        stunt_desc.addEventListener('blur', async event => {
            if (!window.getSelection().toString()){
                let desc = DOMPurify.sanitize(await TextEditor.enrichHTML(event.target.innerHTML, {secrets:game.user.isGM, documents:true, async:true}));
                this.element.querySelector('#edit_stunt_desc').style.display = "none";
                this.element.querySelector('#edit_stunt_desc_rich').innerHTML = desc;    
                this.element.querySelector('#edit_stunt_desc_rich').style.display = "block";
            }
        })
        
        return new Pen(options);
    } //End _onRender

    //async _onSaveButton(event, html){
    //    await this.submit();
    // This has been replaced by removing button type=button from the Save button so it instead submits the form per #_onSubmit.
    //}

    renderMe(id, data){
        if (this.actor.isToken){
            if (this.actor.token.id == id){
               let name = this.stunt.name;
               let key;
                try {
                    let check = false;
                    key = fcoConstants.gkfn(data.delta.system.stunts, name);
                    if (key && data.delta.system.stunts[key]!=undefined) check = true;
                    if (check){
                        if (!this.renderPending) {
                            this.renderPending = true;
                            setTimeout(() => {
                                this.stunt = foundry.utils.mergeObject(this.stunt, data.delta.system.stunts[key]);
                                this.render(false);
                                this.renderPending = false;
                            }, 50);
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
                let key = fcoConstants.gkfn (data.system.stunts, name);
                try {
                    if (data.system.stunts[key]!=undefined){
                        if (!this.renderPending) {
                            this.renderPending = true;
                            setTimeout(() => {
                                this.stunt = foundry.utils.mergeObject(this.stunt, data.system.stunts[key]);
                                this.render(false);
                                this.renderPending = false;
                            }, 50);
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

    async _prepareContext (){
        let data={}
        data.stunt=foundry.utils.duplicate(this.stunt);
        data.stunt.richDesc = await fcoConstants.fcoEnrich(data.stunt.description, this.actor)
        if (this.actor == null){
            data.skills=fcoConstants.wd().system.skills;
        } else {
            if (this.actor.type=="Extra"){
                data.skills=foundry.utils.mergeObject(this.actor.system.skills, fcoConstants.wd().system.skills, {inplace:false});
            } else {
                data.skills=this.actor.system.skills;
            }
        }
        data.gm = game.user.isGM;
        data.actor = this.actor;
        data.macroName = fromUuidSync(this.stunt.macro)?.name;
        return data
    } //End getData
} //End EditPlayerStunts

class StuntDB extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
    constructor(actor){
        super();
        this.filter = "";
        this.ignoreCase = false;
        this.actor=actor;
        this.stunts=foundry.utils.duplicate(fcoConstants.wd().system.stunts);
    }   

    get title() {
        return game.i18n.localize("fate-core-official.StuntDatabase");
    }

    async _prepareContext(options){
        if (this.sort == undefined){
            this.sort="name";
        }
        let data = {};
        let stunts = foundry.utils.duplicate(fcoConstants.wd().system.stunts);
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

    static DEFAULT_OPTIONS = {
        id: "StuntDB",
        position: {
            width: "auto",
            height: "auto",
        },
        tag: "div",
        window: {
            title: this.title,
            icon: "fas fa-book",
            resizable: false,
        },
        classes: ['fate']
    }

    static PARTS = {
        FcoStuntDBMain: {
            template:"systems/fate-core-official/templates/StuntDB.html",
            scrollable: [".stunts_db"],
        }
    }

    // Add a drop handler that lets the GM drag stunts from anything into the database window.
    _onFirstRender(context, options){
        this.element.addEventListener("drop", async event => {
            let data = TextEditor.getDragEventData(event);
            if (data?.ident == "mf_draggable" && data?.type == "stunt" && game.user.isGM){
                // Add the stunt to the database and re-render
                let stunt = new fcoStunt(data.dragged);
                if (stunt) {
                    await fcoConstants.wd().update({"system.stunts": {[fcoConstants.tob64(stunt.name)]:stunt}});
                    await foundry.applications.instances.get("StuntDB")?.render();
                } 
            }
        })
    }

    _onRender(context, options) {
        const addButton = this.element.querySelector("button[name='add_stunt']");
        addButton?.addEventListener("click", event => {this._onAddButton(event)});
        const deleteButton = this.element.querySelectorAll("button[name='del_stunt']");
        deleteButton?.forEach(button => {button.addEventListener("click", event => {this._onDeleteButton(event)});}) 
        const sb_name = this.element.querySelector("div[name='sb_name']");
        const sb_skill = this.element.querySelector("div[name='sb_skill']");
        const sb_refresh = this.element.querySelector("div[name='sb_refresh']");
        sb_name.addEventListener("click", event => {this.sort = "name"; this.render(false)});
        sb_skill.addEventListener("click", event => {this.sort = "linked_skill"; this.render(false)});
        sb_refresh.addEventListener("click", event => {this.sort = "refresh_cost"; this.render(false)});
        const export_stunts = this.element.querySelector("button[id='export_stunts']");
        const import_stunts = this.element.querySelector("button[id='import_stunts']");
        export_stunts.addEventListener("click", event => this._onExportStunts(event));
        import_stunts.addEventListener("click", event => this._onImportStunts(event));
        const export_stunt = this.element.querySelectorAll("button[name='export_stunt']");
        export_stunt.forEach (stunt => {stunt. addEventListener("click", event => this._onExportStunt(event))});
        const edit_stunt = this.element.querySelectorAll ("button[name='edit_stunt']");
        edit_stunt.forEach (stunt => {stunt.addEventListener("click", event => this._onEditStunt(event))});
        const add_stunt = this.element.querySelector("button[id='add_db_stunt']");
        add_stunt.addEventListener("click", event => {
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

        let foc = false;
        if (this.element.querySelector(':focus')?.id == "stunt_db_filter_box") foc = true;
        let fo = this.element.querySelector ('input[id="stunt_db_filter_box"]');
        if (foc) fo.focus();
        fo.setSelectionRange(fo.value.length, fo.value.length);

        const mfdraggable = this.element.querySelectorAll('.mf_draggable');
        mfdraggable.forEach(draggable => {
            draggable.addEventListener("dragstart", event => {
                if (game.user.isGM){
                    let ident = "mf_draggable"
                    let type = event.target.getAttribute("data-mfdtype");
                    let origin = event.target.getAttribute("data-mfactorid");
                    let dragged_name = event.target.getAttribute("data-mfname");
                    
                    let shift_down = game.system["fco-shifted"]; 
                    let dragged= fcoConstants.gbn(this.stunts, dragged_name);
                    let user = game.user.id;
                    let drag_data = {ident:ident, userid:user, type:type, origin:origin, dragged:dragged, shift_down:shift_down};
                    event.dataTransfer.setData("text/plain", JSON.stringify(drag_data));
                }
            })

            draggable.addEventListener("dblclick", event => {
                let origin = event.target.getAttribute("data-mfactorid");
                let content = `<strong>Shared from Stunt Database:</strong><br/><hr>`
                let user = game.user;
                let type = event.target.getAttribute("data-mfdtype");
                
                let name = event.target.getAttribute("data-mfname");
                let entity;
                if (type == "stunt") {
                    entity = fcoConstants.gbn(this.stunts, name);
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
        })

        const filter_stunts = this.element.querySelector('#stunt_db_filter_box');
        filter_stunts.addEventListener('change', async event => {
            this.filter = event.target.value;
            await this.render(false);
        })

        const clear_filter = this.element.querySelector('#stunt_db_clear_filter');
        clear_filter.addEventListener('click', async event => {
            this.filter = "";
            await this.render(false);
        })

        if (this.filter != ""){
            this.element.querySelector("#stunt_db_clear_filter").style.opacity = 1;
        } else {
            this.element.querySelector("#stunt_db_clear_filter").style.opacity = 0.4;
        }

        const ignoreCase = this.element.querySelector('#stunt_db_ignore_case');
        ignoreCase.addEventListener('click', async event => {
            this.ignoreCase = !this.ignoreCase;
            if (this.ignoreCase) ignoreCase.style.opacity = 0.4;
            if (!this.ignoreCase) ignoreCase.style.opacity = 1;
            if (this.filter != "") await this.render(false);
        })
    } //End _onRender

    async _onExportStunts(event){
        let stunt_text = JSON.stringify(foundry.utils.duplicate(fcoConstants.wd().system.stunts),null,5);
        fcoConstants.getCopiableDialog(game.i18n.localize("fate-core-official.CopyAndPasteToSaveStunts"),stunt_text);
    }

    async _onExportStunt(event){
        let stuntName = event.target.id.split("_")[0];
        let stunts = foundry.utils.duplicate(fcoConstants.wd().system.stunts);
        let stunt = fcoConstants.gbn(stunts, stuntName);
        let key = fcoConstants.gkfn(stunts, stuntName);

        let stunt_text = `{"${key}":${JSON.stringify(stunt,null,5)}}`;
        fcoConstants.getCopiableDialog(game.i18n.localize("fate-core-official.CopyAndPasteToSaveStunt"),stunt_text);
    }

    async _onEditStunt(event){
        //Create a stunt editor with a null actor
        //Edit the stunt editor so if the actor is null it knows to save the stunt to the stunt DB on exit rather than to an actor's sheet.
        let stunt_name = event.target.id.split("_")[0];
        let stunt = fcoConstants.gbn(fcoConstants.wd().system.stunts, stunt_name);
        let eps = await new EditPlayerStunts(null, stunt, {new:false}).render(true);
        eps.originator = this;
    }

    async getStunts(){
        return await fcoConstants.getImportDialog(game.i18n.localize("fate-core-official.PasteOverStunts"));
    }

    async _onImportStunts(event){
        let text = await this.getStunts();
        try {
            let imported_stunts = JSON.parse(text);
            let stuntDB = foundry.utils.duplicate(fcoConstants.wd().system.stunts);
            if (stuntDB == undefined){
                stuntDB = {};
            }

            if (!imported_stunts.hasOwnProperty("name")){
                //THis is a stunts object
                // Validate the imported data to make sure they all match the schema
                for (let stunt in imported_stunts){
                    let st = new fcoStunt(imported_stunts[stunt]).toJSON();
                    if (st){
                        stuntDB[fcoConstants.tob64(st.name)] = st;  
                    }
                }
                await fcoConstants.wd().update({"system.stunts":imported_stunts});
            } else {
                // This is a single stunt.
                let st = new fcoStunt(imported_stunts).toJSON();
                if (st){
                    await fcoConstants.wd().update({
                        "system.stunts":{
                            [`${fcoConstants.tob64(st.name)}`]:st
                        }
                    });
                }
            }
            this.render(false);
        } catch (e) {
            ui.notifications.error(e);
        }
    }

    async _onAddButton(event){
        let stunts = fcoConstants.wd().system.stunts;
        let name = event.target.id.split("_")[0];
        let stunt = foundry.utils.duplicate(fcoConstants.gbn(stunts, name));
        this.actor.update({"system.stunts":{[`${fcoConstants.tob64(stunt.name)}`]:stunt}});
    }

    async _onDeleteButton(event){
        let del = await fcoConstants.confirmDeletion();
        if (del){
            let stunts = foundry.utils.duplicate(fcoConstants.wd().system.stunts);
            let key = fcoConstants.gkfn(stunts, event.target.id.split("_")[0]);
            let update_object = {};
            update_object[`system.stunts.-=${key}`] = null;
            await fcoConstants.wd().update(update_object);
            await this.render(false);
        }
    }
}
