export class ExtraSheet extends ItemSheet {

    constructor (...args){
        super(...args);
        this.options.title = `${game.i18n.localize("fate-core-official.Extra")}: ${this.object.name}`
        this.track_category = "All";
    }

    async _render(...args){
        if (!this.object?.parent?.sheet?.editing && !this.editing && !window.getSelection().toString()){
            if (!this.renderPending) {
                    this.renderPending = true;
                    setTimeout(async () => {
                        await super._render(...args);
                        var avatar = document.querySelector('.mfate-sheet_extra-avatar')
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
                            }
                        }).observe(avatar,{attributes:true,attributeFilter:["src"]})
                        this.renderPending = false;
                    }, 50);
            }
        } else this.renderBanked = true;
    }
    
    get title(){
        let mode = "";
        if (!this.isEditable) mode = " ("+game.i18n.localize ("fate-core-official.viewOnly")+")";
        return this.object.name + mode;
    }

    async getData() {        
        const data = this.document.data;
        data.type = this.item.type;
        data.stunts = this.object.data.data.stunts;
        data.aspects = this.object.data.data.aspects;
        data.skills = this.object.data.data.skills;
        data.ladder = fcoConstants.getFateLadder();
        let track_categories = this.object.data.data.tracks;
        let cats = new Set();
        for (let c in track_categories){
            let cat = track_categories[c].category;
            cats.add(cat);
        }
        track_categories=Array.from(cats);
        data.category = this.track_category;
        data.track_categories = track_categories;
        data.tracks = this.object.data.data.tracks;
        let skills_label = game.settings.get("fate-core-official", "skillsLabel");
        data.skillsLabel = skills_label || game.i18n.localize("fate-core-official.defaultSkillsLabel");

        data.dataTemplate = () => `systems/fate-core-official/templates/ExtraSheet.html`;
        data.GM=game.user.isGM;
        if (this.object?.data?.data?.contents != undefined && !jQuery.isEmptyObject(this.object?.data?.data?.contents))
        {
            data.contents = this.object.data.data.contents;
        }
        else {
            data.contents = false;
        }
        return data;
    }

    activateListeners(html){
        if (!this.isEditable) return;
        super.activateListeners(html);
        const delete_stunt = html.find("button[name='delete_item_stunt']");
        delete_stunt.on("click", event => this._onDelete(event,html));
        const edit_stunt = html.find("button[name='edit_item_stunt']")
        edit_stunt.on("click", event => this._onEdit (event,html));
        const db_add = html.find("button[name='item_db_stunt']");
        const stunts_button = html.find("div[name='edit_item_stunts']");
        db_add.on("click", event => this._db_add_click(event, html));
        stunts_button.on("click", event => this._onStunts_click(event, html));
        const stunt_db = html.find("div[name='item_stunt_db']");
        stunt_db.on("click", event => this._stunt_db_click(event, html));
        const aspectButton = html.find("div[name='edit_item_aspects']");
        aspectButton.on("click", event => this._onAspectClick(event, html));
        const skillsButton = html.find("div[name='edit_item_skills']");;
        skillsButton.on("click", event => this._onSkillsButton(event, html));
        const cat_select = html.find("select[id='item_track_category']");
        cat_select.on("change", event => this._cat_select_change (event, html));
        const tracks_button = html.find("div[name='edit_item_tracks']"); // Tracks, tracks, check
        tracks_button.on("click", event => this._onTracks_click(event, html));

        const ul_all_stunts = html.find('div[name="ul_all_extra_stunts"]');
        ul_all_stunts.on('click', event => fcoConstants.ulStunts(this.object.data.data.stunts));

        const input = html.find('input[type="text"], input[type="number"], div[name="textIn"], textarea');

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

                    let dragged;
                    if (type == "skill") dragged = this.document.data.data.skills[dragged_name];
                    if (type == "stunt") dragged = this.document.data.data.stunts[dragged_name];
                    if (type == "aspect") dragged = this.document.data.data.aspects[dragged_name];
                    if (type == "track") dragged = this.document.data.data.tracks[dragged_name]
                    let user = game.user.id;
                    let drag_data = {ident:ident, userid:user, type:type, origin:origin, dragged:dragged, shift_down:shift_down};
                    event.originalEvent.dataTransfer.setData("text/plain", JSON.stringify(drag_data));
                }
            })

            mfdraggable.on("dblclick", event => {
                let content = `<strong>${game.i18n.format("fate-core-official.sharedFrom",{name:this.object.name})}</strong><br/><hr>`
                let user = game.user;
                let type = event.currentTarget.getAttribute("data-mfdtype");
                let name = event.currentTarget.getAttribute("data-mfname");
                let entity;
                if (type == "skill") {
                    entity = this.document.data.data.skills[name];
                    content += `<strong>${game.i18n.localize("fate-core-official.Name")}: </strong> ${entity.name}<br/>
                                <strong>${game.i18n.localize("fate-core-official.Rank")}: </strong> ${entity.rank}<br/>
                                <strong>${game.i18n.localize("fate-core-official.Description")}: </strong> ${entity.description}</br>`
                }
                if (type == "stunt") {
                    entity = this.document.data.data.stunts[name];
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
                    entity = this.document.data.data.aspects[name];
                    content += `<strong>${game.i18n.localize("fate-core-official.Name")}: </strong> ${entity.name}<br/>
                                <strong>${game.i18n.localize("fate-core-official.Value")}: </strong> ${entity.value}<br/>
                                <strong>${game.i18n.localize("fate-core-official.Description")}: </strong> ${entity.description}</br>
                                <strong>${game.i18n.localize("fate-core-official.Notes")}: </strong> ${entity.notes}`
                } 
                if (type == "track") {
                    entity = this.document.data.data.tracks[name];
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

                ChatMessage.create({content: content, speaker : {user}, type: CONST.CHAT_MESSAGE_TYPES.OOC })
            })

        $('.fcoExtra').on('drop', async event => await this.onDrop(event, html))

        // We need one of these for each field that we're setting up as a contenteditable DIV rather than a simple textarea.
        //First, Create Pen editor
        fcoConstants.getPen(`${this.document.id}_descValue`);
        //Get reference to field so we can update extra on change
        const desc = $(`#${this.document.id}_descValue`);
        //Update the extra when the field loses focus.
        desc.on("blur", async event => {
            await this.document.update({"data.description.value":DOMPurify.sanitize(event.target.innerHTML)})
        })
        //That's the description field; still to come permissions, costs, caa, attack,overcome, defend
        // We need one of these for each field that we're setting up as a contenteditable DIV rather than a simple textarea.
        
        //First, Create Pen editors
        fcoConstants.getPen(`${this.document.id}_permValue`);
        fcoConstants.getPen(`${this.document.id}_costsValue`);
        fcoConstants.getPen(`${this.document.id}_overcomeValue`);
        fcoConstants.getPen(`${this.document.id}_attackValue`);
        fcoConstants.getPen(`${this.document.id}_createValue`);
        fcoConstants.getPen(`${this.document.id}_defendValue`);
    
        input.on("focus", event => {
            if (this.editing == false) {
                this.editing = true;
            }
        });
        input.on("blur", async event => {
            if (this.renderBanked){
                this.renderBanked = false;
                await this._render(false);
            }
        });
        
        input.on("keyup", event => {
            if (event.keyCode === 13 && event.target.type == "input") {
                input.blur();
            }
        })

        // Let's do this update ourselves. I know how to make my own code work without fricking stack overflow errors and recursions!

        const name = html.find("textarea[name='name']");
    
        name.on("change", async event => {
            let newName = event.target.value;
            await this.document.update({"name":newName});
        })

        let fields = ["descValue", "overcomeValue", "permValue", "costsValue", "createValue", "attackValue", "defendValue"];
        for (let field of fields){
            $(`#${this.document.id}_${field}_rich`).on('click', event => {
                if (event.target.outerHTML.startsWith ("<a data")) return;
                $(`#${this.document.id}_${field}_rich`).css('display', 'none');
                $(`#${this.document.id}_${field}`).css('display', 'block');
                $(`#${this.document.id}_${field}`).focus();
            })

            $(`#${this.document.id}_${field}_rich`).on('contextmenu', async event => {
                let text = await fcoConstants.updateText("Edit raw HTML",event.currentTarget.innerHTML);
                if (text != "discarded") {
                    this.editing = false;
                    if (field == "descValue"){
                        await this.document.update({"data.description.value":text});
                    }
                    if (field == "overcomeValue"){
                        await this.document.update({"data.actions.overcome":text});                        
                    }
                    if (field == "permValue"){
                        await this.document.update({"data.permissions":text});
                    }
                    if (field == "costsValue"){
                        await this.document.update({"data.costs":text});
                    }
                    if (field == "createValue"){
                        await this.document.update({"data.actions.create":text});
                    }
                    if (field == "attackValue"){
                        await this.document.update({"data.actions.attack":text});
                    }
                    if (field == "defendValue"){
                        await this.document.update({"data.actions.defend":text});
                    }
                    await this._render(false);
                }
            })

            $(`#${this.document.id}_${field}`).on('blur', async event => {
                if (!window.getSelection().toString()){
                    let data = DOMPurify.sanitize(event.target.innerHTML);
                    if (field == "descValue"){
                        await this.document.update({"data.description.value":data});
                        this.editing = false;
                        await this._render(false);
                    }
                    if (field == "overcomeValue"){
                        await this.document.update({"data.actions.overcome":data});
                        this.editing = false;
                        await this._render(false);
                    }
                    if (field == "permValue"){
                        await this.document.update({"data.permissions":data});
                        this.editing = false;
                        await this._render(false);
                    }
                    if (field == "costsValue"){
                        await this.document.update({"data.costs":data});
                        this.editing = false;
                        await this._render(false);
                    }
                    if (field == "createValue"){
                        await this.document.update({"data.actions.create":data});
                        this.editing = false;
                        await this._render(false);
                    }
                    if (field == "attackValue"){
                        await this.document.update({"data.actions.attack":data});
                        this.editing = false;
                        await this._render(false);
                    }
                    if (field == "defendValue"){
                        await this.document.update({"data.actions.defend":data});
                        this.editing = false;
                        await this._render(false)
                    }
                }
            })
        }

        const refresh = html.find("input[name='data.refresh']");
        refresh.on("change", async event => {
            let r = parseInt(event.target.value);
            await this.document.update({"data.refresh":r});
        })

        const countSkills = html.find("input[name='data.countSkills']");
        countSkills.on("change", async event => {
            let value = event.target.checked;
            await this.document.update({"data.countSkills":value});
        })

        const combineSkills = html.find("input[name='data.combineSkills']");
        combineSkills.on("change", async event => {
            let value = event.target.checked;
            await this.document.update({"data.combineSkills":value})
        })

        const countThisSkill = html.find("input[class='count_this_skill']");
        countThisSkill.on('click', async event => {
            let skill = duplicate(this.document.data.data.skills[event.target.getAttribute("data-skill")]);
            skill.countMe = event.target.checked;
            await this.document.update({"data.skills":{[`${skill.name}`]:skill}});
        })

        const combineThisSkill = html.find("input[class='combine_this_skill']");
        combineThisSkill.on('click', async event => {
            let skill = duplicate(this.document.data.data.skills[event.target.getAttribute("data-skill")]);
            skill.combineMe = event.target.checked;
            await this.document.update({"data.skills":{[`${skill.name}`]:skill}})
        })

        const active = html.find("input[name='data.active']");
        active.on("change", async event => {
            let value = event.target.checked;
            if (this.document.parent){
                if (value){
                    this.document.parent.updateFromExtra(this.document.data);
                } else {
                    this.document.parent.deactivateExtra(this.document);
                }
            }
            await this.document.update({"data.active":value})
        })

        const aspect = html.find("textarea[class='cs_box mfate-aspects-list__input']");
        aspect.on("change", async event => {
            let field = event.target.name;
            let value = event.target.value;
            await this.document.update({[field]:value});
        })
    }
    

    async _onTracks_click(event, html) {
        //Launch the EditPlayerTracks FormApplication.
        let editor = new EditPlayerTracks(this.object); //Passing the actor works SOO much easier.
        editor.render(true);
        editor.setSheet(this);
        await editor.render(true);
        try {
            editor.bringToTop();
        } catch  {
            // Do nothing.
        }
    }

    async _cat_select_change (event, html){
        this.track_category = event.target.value;
        this.render(false);
    }

    async onDrop(event, html){
        if (this.document.isOwner){
            let data = JSON.parse(event.originalEvent.dataTransfer.getData("text/plain"));
            let extra = this.document;
            //First check it's not from the same sheet
            if (data.ident !== "mf_draggable") return;
            if (extra.id == data.origin) return;
                
            if (data.type == "stunt"){
                let old = extra.data.data.stunts[data.dragged.name];
                if (old) {
                    let answer = await fcoConstants.awaitYesNoDialog(game.i18n.localize("fate-core-official.overwrite_element"), game.i18n.localize("fate-core-official.exists"));
                    if (answer == "no") return
                } 
                await extra.update({"data.stunts":{[data.dragged.name]:data.dragged}});
            }
            if (data.type == "aspect"){
                let old = extra.data.data.aspects[data.dragged.name];
                if (old) {
                    let answer = await fcoConstants.awaitYesNoDialog(game.i18n.localize("fate-core-official.overwrite_element"), game.i18n.localize("fate-core-official.exists"));
                    if (answer == "no") return
                } 
                if (!data.shift_down){
                    data.dragged.value = "";
                    data.dragged.notes = "";
                }
                await extra.update({"data.aspects":{[data.dragged.name]:data.dragged}});
            }
            if (data.type == "skill"){
                let old = extra.data.data.skills[data.dragged.name];
                if (old) {
                    let answer = await fcoConstants.awaitYesNoDialog(game.i18n.localize("fate-core-official.overwrite_element"), game.i18n.localize("fate-core-official.exists"));
                    if (answer == "no") return
                } 
                if (!data.shift_down){
                    data.dragged.rank = 0;
                }
                await extra.update({"data.skills":{[data.dragged.name]:data.dragged}});
            }
            if (data.type == "track"){
                let track = data.dragged;
                if (!data.shift_down){
                    if (track?.aspect && track?.aspect !== "No" && track?.aspect != "Name As Aspect"){
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
                let old = extra.data.data.tracks[track.name];
                if (old) {
                    let answer = await fcoConstants.awaitYesNoDialog(game.i18n.localize("fate-core-official.overwrite_element"), game.i18n.localize("fate-core-official.exists"));
                    if (answer == "no") return
                } 
                await extra.update({"data.tracks":{[track.name]:track}});
            }
        }
    }
    

    async _onSkillsButton(event, html) {
        //Launch the EditPlayerSkills FormApplication.
        let editor = new EditPlayerSkills(this.object); //Passing the actor works SOO much easier.
        editor.render(true);
        editor.setSheet(this);
        try {
            editor.bringToTop();
        } catch  {
            // Do nothing.
        }
    }

    async _onAspectClick(event, html) {
            let av = new EditPlayerAspects(this.object);
            av.render(true);
            try {
                av.bringToTop();
            } catch  {
                // Do nothing.
            }
    }

    async _db_add_click(event, html){
        let name = event.target.id.split("_")[0];
        let db = duplicate(game.settings.get("fate-core-official","stunts"));
        db[name]=this.object.data.data.stunts[name];
        await game.settings.set("fate-core-official","stunts",db);
        ui.notifications.info(`${game.i18n.localize("fate-core-official.Added")} ${name} ${game.i18n.localize("fate-core-official.ToTheStuntDatabase")}`);
    }

    async _stunt_db_click(event, html){
        let sd = new StuntDB(this.object);
        sd.render(true);
        try {
            sd.bringToTop();
        } catch  {
            // Do nothing.
        }
    }

    async _onStunts_click(event, html) {
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
            editor.bringToTop();
        } catch  {
            // Do nothing.
        }
    }

    async _onEdit (event, html){
        let name=event.target.id.split("_")[0];

        let editor = new EditPlayerStunts(this.object, this.object.data.data.stunts[name], {new:false});
        editor.render(true);
        editor.setSheet(this);
        try {
            editor.bringToTop();
        } catch  {
            // Do nothing.
        }
    }

    async _onDelete(event, html){
        let del = await fcoConstants.confirmDeletion();
        if (del){
            let name = event.target.id.split("_")[0];
            await this.object.update({"data.stunts":{[`-=${name}`]:null}});
        }
    }

    get template (){
        return 'systems/fate-core-official/templates/ExtraSheet.html';
    }

    async _on_boxes_change(html, event){
        ////console.log(event.target.value)
        let num = parseInt(DOMPurify.sanitize(event.target.innerHTML));
        ////console.log(num);
    }
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes = options.classes.concat(['fate', 'item', 'fcoExtra']);
        options.width = 850;
        options.height = 850;
        options.resizable = true;
        options.submitOnChange = false;  
        options.submitOnClose = false;
        return options;
    }

    async close(...args){
        await super.close(...args);
        if (this.document.parent){
            if (this.document.parent.type == "fate-core-official" && this.document.data.data.active){
                await this.document.parent.updateFromExtra(this.document.data);
            } else {
                if (this.document.parent.type == "fate-core-official" && !this.document.data.data.active){
                    await this.document.parent.deactivateExtra(this.object)
                }
                
            }
        }
        this.editing = false;
    }
}
