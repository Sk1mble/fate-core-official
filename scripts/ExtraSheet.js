export class ExtraSheet extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2) {
    constructor (...args){
        super(...args);
        this.track_category = "All";
        this.object = this.document;
    }

    async render(...args){
        if (!this.object?.parent?.sheet?.editing && !this.editing && !window.getSelection().toString()){
            if (!this.renderPending) {
                    this.renderPending = true;
                    setTimeout(async () => {
                        await super.render(...args);
                        let avatar = this.element.querySelector('.mfate-sheet_extra-avatar');
                        let doc = this.document;
                        let newsrc;
                        let target_id;
                        let this_id = this.document.id;

                        new MutationObserver(async function onSrcChange(MutationRecord){
                            // Code to update avatar goes here
                            target_id = MutationRecord[0].target.id.split("_")[0];

                            // If we strip the absolute path, it will break the link for a Foundry installation hosted on The Forge, plus images directly hosted on websites etc. won't work. 
                            // So let's not do that for remotely hosted installations.
                            // Otherwise though we want a local link, to prevent a file set on localhost from breaking if connecting from outside, or a move of dynamic DNS service breaking it.

                            let src = MutationRecord[0].target.src;
                            if (src.startsWith(window.location.origin)){
                                newsrc = (MutationRecord[0].target.src.replace(/^(?:\/\/|[^/]+)*\//, ''));
                            } else {
                                newsrc = src;
                            }
                    
                            if (target_id == this_id){
                                await doc.update({"img":newsrc});
                                if (doc?.parent?.type == "Thing" && !doc?.parent?.system?.container?.isContainer){
                                    await doc.parent.update({"img":newsrc});  
                                    let tokens=game.scenes.viewed.tokens.contents;
                                    let token = tokens.find(tk => {
                                        if (tk.actorId == doc.parent._id) return tk;
                                    })
                                    game.scenes.viewed.updateEmbeddedDocuments("Token",[{_id:token.id, "texture.src":newsrc}]);

                                }
                            }
                        }).observe(avatar,{attributes:true,attributeFilter:["src"]})
                        this.renderPending = false;
                    }, 50);
            }
        } else this.renderBanked = true;
    }
    
    get title(){
        let title = this.object.name;
        let mode = "";
        if (!this.isEditable) mode = " ("+game.i18n.localize ("fate-core-official.viewOnly")+")";
        if (this.document.actor){
            title += ` - ${this.document.actor.name}`
        }
        return title;
    }

    async _prepareContext() {        
        const data = {};
        data.document = this.document;
        data.actorExists = !!this.document?.actor
        let fcoc = new fcoConstants();
        data.ladder = fcoc.getFateLadder();
        let track_categories = this.object.system.tracks;
        let cats = new Set();
        for (let c in track_categories){
            let cat = track_categories[c].category;
            cats.add(cat);
        }
        track_categories=Array.from(cats);
        data.category = this.track_category;
        data.track_categories = track_categories;
        let skills_label = game.settings.get("fate-core-official", "skillsLabel");
        data.skillsLabel = skills_label || game.i18n.localize("fate-core-official.defaultSkillsLabel");
        data.GM=game.user.isGM;
        if (this.object?.system?.contents != undefined && Object.keys(this?.object?.system?.contents).length > 0)
        {
            data.contents = this.object.system.contents;
        }
        else {
            data.contents = false;
        }

        data.rich = {};
        data.rich.description = await fcoConstants.fcoEnrich (data.document.system.description.value, this.object);
        data.rich.costs = await fcoConstants.fcoEnrich (data.document.system.costs, this.object);
        data.rich.permissions = await fcoConstants.fcoEnrich (data.document.system.permissions, this.object);
        data.rich.overcome = await fcoConstants.fcoEnrich (data.document.system.actions.overcome, this.object);
        data.rich.create = await fcoConstants.fcoEnrich (data.document.system.actions.create, this.object);
        data.rich.attack = await fcoConstants.fcoEnrich (data.document.system.actions.attack, this.object);
        data.rich.defend = await fcoConstants.fcoEnrich (data.document.system.actions.defend, this.object);
        data.rich.stunts = foundry.utils.duplicate(data.document.system.stunts);
        data.editable = this.isEditable;

        for (let st in data.rich.stunts){
            data.rich.stunts[st].richDesc = await fcoConstants.fcoEnrich (data.rich.stunts[st].description, this.object);
        }
        return data;
    }

    _onRender (context, options){
        // Disable form if not editable
        if (!this.isEditable) {
            for (const el of this.element.querySelectorAll(".window-content :is(input, button, select, textarea)")) {
                el.disabled = true;
            }
            return;
        }
        const delete_stunt = this.element.querySelectorAll("button[name='delete_item_stunt']"); //The button for deleting each stunt from the Extra. Multiple.
        delete_stunt?.forEach(button => button?.addEventListener("click", event => this._onDelete(event)));

        const edit_stunt = this.element.querySelectorAll("button[name='edit_item_stunt']") // The button for editing a stunt. Multiple.
        edit_stunt?.forEach(stunt => stunt?.addEventListener("click", event => this._onEdit (event)));
        
        const db_add = this.element.querySelectorAll("button[name='item_db_stunt']"); // The button for adding a stunt to the database. Multiple.
        db_add?.forEach(button => button?.addEventListener("click", event => this._db_add_click(event)));
        
        const stunts_button = this.element.querySelector("div[name='edit_item_stunts']"); // Button for adding a stunt. Singleton.
        stunts_button?.addEventListener("click", event => this._onStunts_click(event));

        const stunt_db = this.element.querySelector("div[name='item_stunt_db']"); // Button to launch the stunt database. Singleton.
        stunt_db?.addEventListener("click", event => this._stunt_db_click(event));

        const aspectButton = this.element.querySelector("div[name='edit_item_aspects']"); // Button for launching the aspect editor. Singleton.
        aspectButton?.addEventListener("click", event => this._onAspectClick(event));

        const skillsButton = this.element.querySelector("div[name='edit_item_skills']"); // Button for launching the skill editor. Singleton.
        skillsButton?.addEventListener("click", event => this._onSkillsButton(event));

        const cat_select = this.element.querySelector("select[name='item_track_category']"); // The selection box for filtering track categories. Singleton.
        cat_select?.addEventListener("change", event => this._cat_select_change (event));

        const tracks_button = this.element.querySelector("div[name='edit_item_tracks']"); // Button for launching the track editor. Singleton.
        tracks_button?.addEventListener("click", event => this._onTracks_click(event));

        const ul_all_stunts = this.element.querySelector('div[name="ul_all_extra_stunts"]'); // Button for uploading all stunts. Singleton.
        ul_all_stunts?.addEventListener('click', event => fcoConstants.ulStunts(this.object.system.stunts));

        const prose_mirrors = this.element.querySelectorAll(".fco_prose_mirror.extra_pm");
        prose_mirrors.forEach(mirror => {
            mirror.addEventListener("change", async event => {
                let field = event.target.name;
                let value = event.target.value;
                let updateObject = {};
                updateObject[field] = value;
                await this.document.update(updateObject);
            })
        })

        const input = this.element.querySelectorAll('input[type="text"], input[type="number"], div[name="textIn"], textarea'); // Find all the text areas for the purpose of dealing with blur, click, etc. events

        const mfdraggable = this.element.querySelectorAll('.mf_draggable'); // The draggable elements for Fate Core Official. Used to handle drag & drop and double click events.
            mfdraggable?.forEach(draggable => draggable?.addEventListener("dragstart", event => {
                if (game.user.isGM){
                    let ident = "mf_draggable"
                    let type = event.target.getAttribute("data-mfdtype");
                    let origin = event.target.getAttribute("data-mfactorid");
                    let dragged_name = event.target.getAttribute("data-mfname");

                    let shift_down = game.system["fco-shifted"];  
                    let dragged;
                    if (type == "skill") dragged = fcoConstants.gbn(this.document.system.skills, dragged_name);
                    if (type == "stunt") dragged = fcoConstants.gbn(this.document.system.stunts, dragged_name);
                    if (type == "aspect") dragged = fcoConstants.gbn(this.document.system.aspects, dragged_name);
                    if (type == "track") dragged = fcoConstants.gbn(this.document.system.tracks, dragged_name);
                    let user = game.user.id;
                    let drag_data = {ident:ident, userid:user, type:type, origin:origin, dragged:dragged, shift_down:shift_down};
                    event.dataTransfer.setData("text/plain", JSON.stringify(drag_data));
                }
            }))

            mfdraggable?.forEach(draggable => draggable?.addEventListener("dblclick", event => {
                let content = `<strong>${game.i18n.format("fate-core-official.sharedFrom",{name:this.object.name})}</strong><br/><hr>`
                let user = game.user;
                let type = event.currentTarget.getAttribute("data-mfdtype");
                let name = event.currentTarget.getAttribute("data-mfname");
                let entity;
                if (type == "skill") {
                    entity = fcoConstants.gbn(this.document.system.skills, name);
                    content += `<strong>${game.i18n.localize("fate-core-official.Name")}: </strong> ${entity.name}<br/>
                                <strong>${game.i18n.localize("fate-core-official.Rank")}: </strong> ${entity.rank}<br/>
                                <strong>${game.i18n.localize("fate-core-official.Description")}: </strong> ${entity.description}</br>`
                }
                if (type == "stunt") {
                    entity = fcoConstants.gbn(this.document.system.stunts, name);
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
                }
                if (type == "aspect"){
                    entity = entity = fcoConstants.gbn(this.document.system.aspects, name);
                    content += `<strong>${game.i18n.localize("fate-core-official.Name")}: </strong> ${entity.name}<br/>
                                <strong>${game.i18n.localize("fate-core-official.Value")}: </strong> ${entity.value}<br/>
                                <strong>${game.i18n.localize("fate-core-official.Description")}: </strong> ${entity.description}</br>
                                <strong>${game.i18n.localize("fate-core-official.Notes")}: </strong> ${entity.notes}`
                } 
                if (type == "track") {
                    entity = entity = fcoConstants.gbn(this.document.system.tracks, name);
                    content += `<strong>${game.i18n.localize("fate-core-official.Name")}: </strong> ${entity.name}<br/>
                                <strong>${game.i18n.localize("fate-core-official.Description")}: </strong> ${entity.description}</br>
                                <strong>${game.i18n.localize("fate-core-official.Notes")}: </strong> ${entity.notes}`
                    if (entity.aspect.when_marked) content += `<strong>${game.i18n.localize("fate-core-official.Aspect")}</strong>: ${entity.aspect.name}<br/>`
                    if (entity.boxes > 0){
                        content += `<em style="font-family:Fate; font-style:normal">`
                        for (let i = 0; i < entity.box_values.length; i++){
                            if (entity.box_values[i]) content += '.';
                            if (!entity.box_values[i]) content += '1';
                        }
                        content += `<\em>`
                    }
                }
                ChatMessage.create({content: content, speaker : {user}, type: CONST.CHAT_MESSAGE_STYLES.OOC })
            }))

        this.element.querySelector('.fcoExtraSheetForm')?.addEventListener('drop', async event => await this.onDrop(event));

        input?.forEach(field => field?.addEventListener("focus", event => {
            if (this.editing == false) {
                this.editing = true;
            }
        }));

        input?.forEach(field => field?.addEventListener("blur", async event => {
            if (this.renderBanked){
                this.renderBanked = false;
                await this.render(false);
            }
        }));
        
        input?.forEach(field => field?.addEventListener("keyup", event => {
            if (event.code === "Enter" && event.target.type == "input") {
                input.blur();
            }
        }))

        // Let's do this update ourselves. I know how to make my own code work without fricking stack overflow errors and recursions!
        const name = this.element.querySelector("textarea[name='name']");
    
        name?.addEventListener("change", async event => {
            let newName = event.target.value;
            await this.document.update({"name":newName});
        })

        const refresh = this.element.querySelector("input[name='system.refresh']");
        refresh?.addEventListener("change", async event => {
            let r = parseInt(event.target.value);
            await this.document.update({"system.refresh":r});
        })

        const countSkills = this.element.querySelector("input[name='system.countSkills']");
        countSkills?.addEventListener("change", async event => {
            let value = event.target.checked;
            await this.document.update({"system.countSkills":value});
        })

        const combineSkills = this.element.querySelector("input[name='system.combineSkills']");
        combineSkills?.addEventListener("change", async event => {
            let value = event.target.checked;
            await this.document.update({"system.combineSkills":value})
        })

        const countThisSkill = this.element.querySelectorAll("input[class='count_this_skill']");
        countThisSkill?.forEach(skill => skill?.addEventListener('click', async event => {
            let skill = foundry.utils.duplicate(fcoConstants.gbn(this.document.system.skills, event.target.getAttribute("data-skill")));
            skill.countMe = event.target.checked;
            let key = fcoConstants.gkfn(this.document.system.skills, skill.name);
            await this.document.update({"system.skills":{[`${key}`]:skill}});
        }))

        const combineThisSkill = this.element.querySelectorAll("input[class='combine_this_skill']");
        combineThisSkill?.forEach(skill => skill?.addEventListener('click', async event => {
            let skill = foundry.utils.duplicate(fcoConstants.gbn(this.document.system.skills, event.target.getAttribute("data-skill")));
            skill.combineMe = event.target.checked;
            let key = fcoConstants.gkfn(this.document.system.skills, skill.name);
            await this.document.update({"system.skills":{[`${key}`]:skill}})
        }))

        const hideThisSkill = this.element.querySelectorAll("input[class='hide_this_skill']");
        hideThisSkill?.forEach(skill => skill?.addEventListener('click', async event => {
            let skill = foundry.utils.duplicate(fcoConstants.gbn(this.document.system.skills, event.target.getAttribute("data-skill")));
            skill.hidden = event.target.checked;
            let key = fcoConstants.gkfn(this.document.system.skills, skill.name);
            await this.document.update({"system.skills":{[`${key}`]:skill}})
        }))

        const active = this.element.querySelector("input[name='system.active']");
        active?.addEventListener("change", async event => {
            await this.document.update({"system.active":event.target.checked})
            if (this.document.parent){
                if (event.target.checked){
                    await this.document.parent.updateFromExtra(this.document);
                } else {
                    await this.document.parent.deactivateExtra(this.document);
                }
            }    
        })

        const aspect = this.element.querySelectorAll("textarea[class='cs_box mfate-aspects-list__input']");
        aspect?.forEach(aspect => aspect.addEventListener("change", async event => {
            let name = event.target.name;
            let key = fcoConstants.gkfn(this.document.system.aspects, name);
            let value = event.target.value;
            let field = `system.aspects.${key}.value`
            await this.document.update({[field]:value});
        }))

        const applyToCharacterButton = this.element.querySelector("button[name='applyExtraToCharacter']");
        applyToCharacterButton?.addEventListener("click", async event => {
            if (this.document.parent){
                if (this.document.parent.type == "fate-core-official" && this.document.system.active){
                    await this.document.parent.updateFromExtra(this.document);
                } else {
                    if (this.document.parent.type == "fate-core-official" && !this.document.system.active){
                        await this.document.parent.deactivateExtra(this.object)
                    }
                }
                this.editing = false;
            }
        });
    }
    

    async _onTracks_click(event) {
        //Launch the EditPlayerTracks FormApplication.
        let editor = new EditPlayerTracks(this.object); //Passing the actor works SOO much easier.
        editor.render(true);
        editor.setSheet(this);
        await editor.render(true);
        try {
            editor.bringToFront();
        } catch  {
            // Do nothing.
        }
    }

    async _cat_select_change (event){
        this.track_category = event.target.value;
        this.render(false);
    }

    async onDrop(event){
        if (this.document.isOwner){
            let data = JSON.parse(event.dataTransfer.getData("text/plain"));
            let extra = this.document;
            //First check it's not from the same sheet
            if (data.ident !== "mf_draggable") return;
            if (extra.id == data.origin) return;
                
            if (data.type == "stunt"){
                let old = fcoConstants.gbn(extra.system.stunts, data.dragged.name);
                let key = fcoConstants.tob64(data.dragged.name);
                if (old) {
                    key = fcoConstants.gkfn(extra.system.stunts, data.dragged.name);
                    let answer = await fcoConstants.awaitYesNoDialog(game.i18n.localize("fate-core-official.overwrite_element"), game.i18n.localize("fate-core-official.exists"));
                    if (!answer) return
                } 
                await extra.update({"system.stunts":{[key]:data.dragged}});
            }
            if (data.type == "aspect"){
                let old = fcoConstants.gbn(extra.system.aspects, data.dragged.name);
                let key = fcoConstants.tob64(data.dragged.name);
                if (old) {
                    key = fcoConstants.gkfn(extra.system.aspects, data.dragged.name);
                    let answer = await fcoConstants.awaitYesNoDialog(game.i18n.localize("fate-core-official.overwrite_element"), game.i18n.localize("fate-core-official.exists"));
                    if (!answer) return
                } 
                if (!data.shift_down){
                    data.dragged.value = "";
                    data.dragged.notes = "";
                }
                await extra.update({"system.aspects":{[key]:data.dragged}});
            }
            if (data.type == "skill"){
                let old = fcoConstants.gbn(extra.system.skills, data.dragged.name);
                let key = fcoConstants.tob64(data.dragged.name);
                if (old) {
                    key = fcoConstants.gkfn(extra.system.skills, data.dragged.name);
                    let answer = await fcoConstants.awaitYesNoDialog(game.i18n.localize("fate-core-official.overwrite_element"), game.i18n.localize("fate-core-official.exists"));
                    if (!answer) return
                } 
                if (!data.shift_down){
                    data.dragged.rank = 0;
                }
                await extra.update({"system.skills":{[key]:data.dragged}});
            }
            if (data.type == "track"){
                let track = data.dragged;
                if (!data.shift_down){
                    if (track?.aspect && track?.aspect !== "No" 
                        && track?.aspect != "Name As Aspect"
                        && track?.aspect != "Aspect as name"
                        && track?.aspect != "as_name"
                    ){
                        track.aspect.name = "";
                    }
            
                    if (track?.boxes > 0){
                         for (let i = 0; i < track.box_values.length; i++){
                            track.box_values[i] = false;
                        }
                    }
            
                    if (track?.notes){
                        track.notes = "";
                    }
                }
                let old = fcoConstants.gbn(extra.system.tracks, data.dragged.name);
                let key = fcoConstants.tob64(data.dragged.name);
                if (old) {
                    key = fcoConstants.gkfn(extra.system.tracks, data.dragged.name);
                    let answer = await fcoConstants.awaitYesNoDialog(game.i18n.localize("fate-core-official.overwrite_element"), game.i18n.localize("fate-core-official.exists"));
                    if (!answer) return
                } 
                await extra.update({"system.tracks":{[key]:track}});
            }
        }
    }
    
    async _onSkillsButton(event) {
        //Launch the EditPlayerSkills FormApplication.
        let editor = new EditPlayerSkills(this.object); //Passing the actor works SOO much easier.
        editor.render(true);
        editor.setSheet(this);
        try {
            editor.bringToFront();
        } catch  {
            // Do nothing.
        }
    }

    async _onAspectClick(event) {
            let av = new EditPlayerAspects(this.object);
            av.render(true);
            try {
                av.bringToFront();
            } catch  {
                // Do nothing.
            }
    }

    async _db_add_click(event){
        let name = event.target.dataset.stuntname;
        let stunt = foundry.utils.duplicate(fcoConstants.gbn(this.object.system.stunts, name));
        let key = fcoConstants.tob64(stunt.name);
        await fcoConstants.wd().update({"system.stunts":{[`${key}`]:stunt}});
        ui.notifications.info(`${game.i18n.localize("fate-core-official.Added")} ${name} ${game.i18n.localize("fate-core-official.ToTheStuntDatabase")}`);
    }

    async _stunt_db_click(event){
        let sd = new StuntDB(this.object);
        sd.render(true);
        try {
            sd.bringToFront();
        } catch  {
            // Do nothing.
        }
    }

    async _onStunts_click(event) {
        //Launch the EditPlayerStunts FormApplication.
        let stunt = {
            "name":game.i18n.localize("fate-core-official.NewStunt"),
            "linked_skill":game.i18n.localize("fate-core-official.None"),
            "description":"",
            "refresh_cost":1,
            "overcome":false,
            "caa":false,
            "attack":false,
            "defend":false,
            "bonus":0
        }
        let editor = new EditPlayerStunts(this.object, stunt, {new:true});
        editor.render(true);
        editor.setSheet(this);
        try {
            editor.bringToFront();
        } catch  {
            // Do nothing.
        }
    }

    async _onEdit (event){
        let name=event.target.dataset.stuntname;
        let editor = new EditPlayerStunts(this.object, fcoConstants.gbn(this.object.system.stunts, name), {new:false});
        editor.render(true);
        editor.setSheet(this);
        try {
            editor.bringToFront();
        } catch  {
            // Do nothing.
        }
    }

    async _onDelete(event){
        let del = await fcoConstants.confirmDeletion();
        if (del){
            let name = event.target.dataset.stuntname;
            let key = fcoConstants.gkfn(this.object.system.stunts, name)
            await this.object.update({"system.stunts":{[`-=${key}`]:null}});
        }
    }

    async _on_boxes_change(event){
        let num = parseInt(DOMPurify.sanitize(event.target.innerHTML));
    }

    static DEFAULT_OPTIONS = {
        classes: ['fate', 'item', 'fcoExtra'],
        tag: "form",
        position: {
            width: 850,
        },
        window: {
            title: this.title,
            resizable: false,
            icon: "fas fa-scroll",
            resizable:true
        },
        form: {
            submitOnChange: false,
            submitOnClose: false,
            closeOnSubmit: false,
        }
    }

    static PARTS = {
        ExtraSheetForm: {
            template: 'systems/fate-core-official/templates/ExtraSheet.html',
            scrollable: ['.fcoExtraSheetForm']
        }
    }

    async close(...args){
        await super.close(...args);
        if (this.document.parent){
            if (this.document.parent.type == "fate-core-official" && this.document.system.active){
                await this.document.parent.updateFromExtra(this.document);
            } else {
                if (this.document.parent.type == "fate-core-official" && !this.document.system.active){
                    await this.document.parent.deactivateExtra(this.object)
                }
                
            }
        }
        this.editing = false;
    }
}