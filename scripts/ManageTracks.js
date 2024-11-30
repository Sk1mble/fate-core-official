//EditEntityTrack is for editing the specifics of a track already on a character or extra.
class EditEntityTrack extends FormApplication {
    constructor (track, entity){
        // track is the entity's track being edited, entity is a reference to the actor or extra
        super(track, entity);
        this.track = foundry.utils.duplicate(track);
        this.entity = entity;
        this.originalName = track.name;
    }

    async getData(){

        let rich = {};
        for (let part in this.track){
            if (part == "description" || part == "when_marked" || part == "recovery_conditions") rich[part] = await fcoConstants.fcoEnrich(this.track[part]);
        }

        const templateData = {
            track:this.track,
            categories:game.settings.get("fate-core-official","track_categories"),
            skills:foundry.utils.duplicate(this.entity.system.skills),
            entity:this.entity,
            rich:rich
        }
        return templateData;
    }
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "systems/fate-core-official/templates/EditEntityTrack.html"; 
    
        //Define the FormApplication's options
        options.width = "1024";
        options.height = "auto";
        options.title = game.i18n.localize("fate-core-official.EntityTrackEditor");
        options.closeOnSubmit = true;
        options.submitOnClose = true;
        options.id = "EditEntityTrack"; // CSS id if you want to override default behaviors
        options.resizable = true;
        return options;
    }
    async _updateObject(){
        // Method for saving out the track once finished goes here. Called on submit();

    }

    //Here are the action listeners
    activateListeners(html) {
        super.activateListeners(html);
        const saveTrackButton = html.find("button[id='save_entity_track']");
        const edit_entity_linked_skillsButton = html.find("button[id='edit_entity_linked_skills']");
        const copy_track = html.find("button[id='copy_entity']");
        const export_track = html.find("button[id='exportEntityTrack']");

        const track_label_select = html.find("select[id='entity_track_label_select']");
        track_label_select.on("change", event => this._on_track_label_select(event, html))
        saveTrackButton.on("click", event => this._onSaveTrackButton(event, html));
        edit_entity_linked_skillsButton.on("click", event => {this._edit_entity_linked_skillsButtonClick(event, html)});
        copy_track.on("click", event => this._onCopyTrackButton(event, html));
        export_track.on("click", event => this._onExportTrack(event, html));
        fcoConstants.getPen("edit_entity_track_description");
        fcoConstants.getPen("edit_entity_track_when_marked");
        fcoConstants.getPen("edit_entity_track_when_recovers");

        $('#edit_entity_track_when_recovers_rich').on("keyup", event => {
            if (event.which == 9) $('#edit_entity_track_when_recovers_rich').trigger("click");
        })

        $('#edit_entity_track_when_recovers_rich').on("click", event => {
            if (event.target.outerHTML.startsWith("<a data")) return;
            $("#edit_entity_track_when_recovers_rich").css('display', 'none');
            $("#edit_entity_track_when_recovers").css('display', 'block');
            $("#edit_entity_track_when_recovers").focus();
        })

        $('#edit_entity_track_when_recovers_rich').on('contextmenu', async event => {
            let text = await fcoConstants.updateText("Edit raw HTML", event.currentTarget.innerHTML, true);
            if (text != "discarded") {
                $('#edit_entity_track_when_recovers_rich')[0].innerHTML = text;    
                $('#edit_entity_track_when_recovers')[0].innerHTML = text;    
            }
        })
        
        $('#edit_entity_track_when_recovers').on('blur', async event => {
            if (!window.getSelection().toString()){
                let desc = DOMPurify.sanitize(await TextEditor.enrichHTML(event.target.innerHTML, {secrets:this.object.isOwner, documents:true, async:true}));
                if (event.target.outerHTML.startsWith("<a data")) return;
                $('#edit_entity_track_when_recovers').css('display', 'none');
                $('#edit_entity_track_when_recovers_rich')[0].innerHTML = desc;    
                $('#edit_entity_track_when_recovers_rich').css('display', 'block');
            }
        })

        $('#edit_entity_track_when_marked_rich').on("keyup", event => {
            if (event.which == 9) $('#edit_entity_track_when_marked_rich').trigger("click");
        })

        $('#edit_entity_track_when_marked_rich').on('contextmenu', async event => {
            let text = await fcoConstants.updateText("Edit raw HTML", event.currentTarget.innerHTML, true);
            if (text != "discarded") {
                $('#edit_entity_track_when_marked_rich')[0].innerHTML = text;    
                $('#edit_entity_track_when_marked')[0].innerHTML = text;    
            }
        })

        $('#edit_entity_track_when_marked_rich').on("click", event => {
            if (event.target.outerHTML.startsWith("<a data")) return;
            $("#edit_entity_track_when_marked_rich").css('display', 'none');
            $("#edit_entity_track_when_marked").css('display', 'block');
            $("#edit_entity_track_when_marked").focus();
        })
        
        $('#edit_entity_track_when_marked').on('blur', async event => {
            if (!window.getSelection().toString()){
                let desc = DOMPurify.sanitize(await TextEditor.enrichHTML(event.target.innerHTML, {secrets:this.object.isOwner, documents:true, async:true}));
                $('#edit_entity_track_when_marked').css('display', 'none');
                $('#edit_entity_track_when_marked_rich')[0].innerHTML = desc;    
                $('#edit_entity_track_when_marked_rich').css('display', 'block');
            }
        })

        $('#edit_entity_track_description_rich').on("keyup", event => {
                if (event.which == 9) $('#edit_entity_track_description_rich').trigger("click");
        })
        $('#edit_entity_track_description_rich').on("click", event => {
            if (event.target.outerHTML.startsWith("<a data")) return;
            $("#edit_entity_track_description_rich").css('display', 'none');
            $("#edit_entity_track_description").css('display', 'block');
            $("#edit_entity_track_description").focus();
        })

        $('#edit_entity_track_description_rich').on('contextmenu', async event => {
            let text = await fcoConstants.updateText("Edit raw HTML", event.currentTarget.innerHTML, true);
            if (text != "discarded") {
                $('#edit_entity_track_description_rich')[0].innerHTML = text;    
                $('#edit_entity_track_description')[0].innerHTML = text;    
            }
        })
        
        $('#edit_entity_track_description').on('blur', async event => {
            if (!window.getSelection().toString()){
                let desc = DOMPurify.sanitize(await TextEditor.enrichHTML(event.target.innerHTML, {secrets:this.object.isOwner, documents:true, async:true}));
                $('#edit_entity_track_description').css('display', 'none');
                $('#edit_entity_track_description_rich')[0].innerHTML = desc;    
                $('#edit_entity_track_description_rich').css('display', 'block');
            }
        })
    }

    //Here are the event listener functions.

    async _on_track_label_select(event, html){
        if (event.target.value != "escalating" && event.target.value != "none"){
            document.getElementById("entity_track_custom_label").hidden = false
            $("#entity_track_custom_label").val("");
        }
        else {
            document.getElementById("entity_track_custom_label").hidden = true
            $("#entity_track_custom_label").val("");
        }
    }

    async _onExportTrack (event, html){
        let output = JSON.stringify(this.track, null, 5);
        fcoConstants.getCopiableDialog(game.i18n.localize("fate-core-official.CopyAndPasteToSaveThisTrack"), output);
    }

    async _onCopyTrackButton (event, html){
        // Copy this track to the existing actor with the name provided. If it already exists, create with 'copy' appended.
        let name = this.track.name;
        let num = 1;
        for (let t in this.entity.system.tracks){
            if (this.entity.system.tracks[t].name.startsWith (name)) num ++;
        }
        this.track.name = this.track.name+" "+num;
        await this.entity.update(
            {
                "system.tracks":{
                    [fcoConstants.tob64(this.track.name)]:this.track
                }
            }
        )
        this.close();
    }

    async _edit_entity_linked_skillsButtonClick(event, html){    
        let linked_skill_editor = new EditEntityLinkedSkills(this.track, this.entity);
        linked_skill_editor.render(true);
        try {
            linked_skill_editor.bringToTop();
        } catch  {
            // Do nothing.
        }
    }

    async _onSaveTrackButton(event,html){
        let name = document.getElementById("edit_entity_track_name").value;
        let description = DOMPurify.sanitize(document.getElementById("edit_entity_track_description").innerHTML);
        let recovery_type = document.getElementById("edit_entity_track_recovery_type").value;
        let aspect = document.getElementById("edit_entity_track_aspect").value;
        let when_marked = DOMPurify.sanitize(document.getElementById("edit_entity_track_when_marked").innerHTML);
        let when_recovers = DOMPurify.sanitize(document.getElementById("edit_entity_track_when_recovers").innerHTML);
        let boxes = parseInt(document.getElementById("edit_entity_track_boxes").value);
        let harm = parseInt(document.getElementById("edit_entity_track_harm").value);
        let paid = document.getElementById("edit_entity_track_paid").checked;
        let label = document.getElementById("entity_track_label_select").value;
        let custom_label = document.getElementById("entity_track_custom_label").value;
        let rollable = document.getElementById("entity_track_rollable").value;
        let category = document.getElementById("edit_entity_track_category").value;

        if (label!="escalating" && label != "none") {
            label=custom_label;
        }
        let track = this.track;
        if (!name) name = "Unnamed Track";
        track.name = name;

        track.description = description;
        track.recovery_type = recovery_type;
        
        let aspect_name = this.track?.aspect?.name;
        if (!aspect_name) aspect_name = "";

        if (aspect == "no"){
            track.aspect = "No";
        }
        if (aspect == "when_marked"){
            track.aspect = {name:aspect_name, when_marked:true, as_name:false};
        }
        if (aspect == "as_name"){
            track.aspect = {name:"", when_marked:false, as_name:true};
        }
        track.when_marked = when_marked;
        track.recovery_conditions = when_recovers;
        track.boxes=boxes;
        track.harm_can_absorb=harm;
        track.paid = paid;
        track.label = label;
        track.rollable = rollable;
        track.category = category;

        if (!track.box_values){
            track.box_values = [];
        }

        //If box_values < boxes, add
        if (track.box_values.length < track.boxes){
            for (let i = track.box_values.length; i < track.boxes; i++){
                track.box_values.push(false);
            }
        }

        //If box_values > boxes, trim
        if (track.box_values.length > track.boxes){
            for (let i = track.box_values.length; i > track.boxes; i--){
                track.box_values.pop();
            }
        }

        let tracks = foundry.utils.duplicate(this.entity.system.tracks);

        if (this.track.name != this.originalName) {
            let key = fcoConstants.gkfn(tracks, this.originalName);
            delete tracks[key];
            let num = 1;
            for (let t in tracks){
                if (tracks[t].name.startsWith (name)) num ++
            }
            if (num > 1) this.track.name = this.track.name+" "+num;

            await this.entity.update({   
                "system.tracks":null
            })    
        }
        let key = fcoConstants.gkfn(tracks, this.track.name);
        if (!key) key = fcoConstants.tob64(this.track.name);
        
        tracks [key] = this.track;

        let final_tracks = tracks;
        if (this.entity.type == "fate-core-official") {
            final_tracks = await this.entity.setupTracks(this.entity.system.skills, tracks);
        }
        await this.entity.update({   
                "system.tracks":final_tracks
        })
        this.origin.render(false);
        this.close();
    }
}
class EditEntityLinkedSkills extends FormApplication {
    constructor (track, entity){
        super(track, entity);
        this.track = track;
        this.entity = entity;
    }
    getData(){
        const templateData = {
            track:this.track,
            skills:foundry.utils.duplicate(this.entity.system.skills),
            entity:this.entity
        }
        return templateData;
    }
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "systems/fate-core-official/templates/EditLinkedSkills.html"; 
    
        //Define the FormApplication's options
        options.width = "1000";
        options.height = "auto";
        options.title = game.i18n.localize("fate-core-official.LinkedSkillEditor");
        options.closeOnSubmit = false;
        options.id = "EditLinkedSkills"; // CSS id if you want to override default behaviors
        options.resizable = true;
        return options;
    }
     //Here are the action listeners
     activateListeners(html) {
        super.activateListeners(html);
        const deleteLinkedSkillButton = html.find("button[id='delete_linked_skill']");
        const addLinkedSkillButton = html.find("button[id='add_linked_skill']");

        deleteLinkedSkillButton.on("click", event => this._onDeleteLinkedSkillButton(event, html));
        addLinkedSkillButton.on("click", event => this._onAddLinkedSkillButton(event,html));
    }
    //Here are the event listener functions.

    async _onDeleteLinkedSkillButton(event, html){
        let del = await fcoConstants.confirmDeletion();
        if (del){
             let toDelete = document.getElementById("linked_skills").value;
            let track = this.track;
            let linked_skills = track.linked_skills;
    
            for (let i = 0; i< linked_skills.length; i++){
                let toCheck = `Skill: ${linked_skills[i].linked_skill}, Rank: ${linked_skills[i].rank}, Boxes: ${linked_skills[i].boxes}, Enables: ${linked_skills[i].enables}`;
                if(toCheck == toDelete){
                    linked_skills.splice(i,1);
                }
            }
            this.render(false);
        }
    }

    async _onAddLinkedSkillButton(){
        let linked_skill = document.getElementById("skill_list").value;
            let rank = parseInt(document.getElementById("skill_rank").value);
            let boxes = parseInt(document.getElementById("added_boxes").value);
            let enables = document.getElementById("edit_enables").checked;
            
            if (this.track.linked_skills==undefined){
                this.track.linked_skills = []
            }
            this.track.linked_skills.push(
                {
                    "linked_skill":linked_skill,
                    "rank":rank,
                    "boxes":boxes,
                    "enables":enables
                }
            )
            this.render(false);
    }
}

class EditLinkedSkills extends FormApplication {
    constructor (track){
        super(track);
        this.track=track;
    }
    getData(){
        const templateData = {
            track:this.track,
            skills:fcoConstants.wd().system.skills
        }
        return templateData;
    }
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "systems/fate-core-official/templates/EditLinkedSkills.html"; 
    
        //Define the FormApplication's options
        options.width = "1000";
        options.height = "auto";
        options.title = game.i18n.localize("fate-core-official.LinkedSkillEditor");
        options.closeOnSubmit = false;
        options.id = "EditLinkedSkills"; // CSS id if you want to override default behaviors
        options.resizable = true;
        return options;
    }
     //Here are the action listeners
     activateListeners(html) {
        super.activateListeners(html);
        const deleteLinkedSkillButton = html.find("button[id='delete_linked_skill']");
        const addLinkedSkillButton = html.find("button[id='add_linked_skill']");

        deleteLinkedSkillButton.on("click", event => this._onDeleteLinkedSkillButton(event, html));
        addLinkedSkillButton.on("click", event => this._onAddLinkedSkillButton(event,html));
    }
    //Here are the event listener functions.

    async _onDeleteLinkedSkillButton(event, html){
        let del = await fcoConstants.confirmDeletion();
        if (del){
             let toDelete = document.getElementById("linked_skills").value;
            let track = this.track;
            let tracks = fcoConstants.wd().system.tracks;
            let linked_skills = track.linked_skills;
    
            for (let i = 0; i< linked_skills.length; i++){
                let toCheck = `Skill: ${linked_skills[i].linked_skill}, Rank: ${linked_skills[i].rank}, Boxes: ${linked_skills[i].boxes}, Enables: ${linked_skills[i].enables}`;
                if(toCheck == toDelete){
                    linked_skills.splice(i,1);
                }
            }
            let key = fcoConstants.gkfn(tracks, this.track.name);
            if (!key) key = fcoConstants.tob64(this.track.name);
            await fcoConstants.wd().update({
                "system.tracks":{
                    [`${key}`]:this.track
                }
            });
            this.render(false);
        }
    }

    async _onAddLinkedSkillButton(){
        let linked_skill = document.getElementById("skill_list").value;
            let rank = parseInt(document.getElementById("skill_rank").value);
            let boxes = parseInt(document.getElementById("added_boxes").value);
            let enables = document.getElementById("edit_enables").checked;
            
            if (this.track.linked_skills==undefined){
                this.track.linked_skills = []
            }
            this.track.linked_skills.push(
                {
                    "linked_skill":linked_skill,
                    "rank":rank,
                    "boxes":boxes,
                    "enables":enables
                }
            )
            let tracks=fcoConstants.wd().system.tracks;
            let key = fcoConstants.gkfn(tracks, this.track.name);
            if (!key) key = fcoConstants.tob64(this.track.name);
            await fcoConstants.wd().update({
                "system.tracks":{
                    [`${key}`]:this.track
                }
            });
            this.render(false);
    }
}

class EditTracks extends FormApplication {
    constructor (category){
        super(category);
        this.category = category;
        this.categories =game.settings.get("fate-core-official","track_categories");
        this.tracks = foundry.utils.duplicate(fcoConstants.wd().system.tracks);
    }

    getData(){
        let tracks_of_category = [];
        for (let t in this.tracks){
            if (this.tracks[t].category == this.category){
                if (this.tracks[t].aspect == "No" || this.tracks[t].aspect == game.i18n.localize("No")){
                    this.tracks[t].aspect = "no";
                } 
                if (this.tracks[t].aspect == "Defined when marked" || this.tracks[t].aspect == game.i18n.localize("fate-core-official.DefinedWhenMarked") ){
                    this.tracks[t].aspect = "when_marked";
                }
                if (this.tracks[t].aspect == "Aspect as name" || this.tracks[t].aspect == "Name As Aspect" || this.tracks[t].aspect == game.i18n.localize("fate-core-official.AspectAsName" || this.tracks[t].aspect == game.i18n.localize("fate-core-official.NameAsAspect")) ){
                    this.tracks[t].aspect = "as_name";
                }
                tracks_of_category.push(this.tracks[t]);
            }
        }
        const templateData = {
            category:this.category,
            tracks:tracks_of_category, 
        }
        return templateData;
    }
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "systems/fate-core-official/templates/EditTrack.html"; 
    
        //Define the FormApplication's options
        options.width = "auto";
        options.height = "auto";
        options.title = game.i18n.localize("fate-core-official.TrackEditor");
        options.closeOnSubmit = false;
        options.id = "EditTrack"; // CSS id if you want to override default behaviors
        options.resizable = true;
        return options;
    }
     //Here are the action listeners
     activateListeners(html) {
        super.activateListeners(html);
        const saveTrackButton = html.find("button[id='save_track']");
        const track_select = html.find("select[id='track_select']");
        const edit_linked_skillsButton = html.find("button[id='edit_linked_skills']");
        const deleteTrackButton = html.find("button[id='delete_track']");
        const edit_track_name=html.find("input[id='edit_track_name']");
        const copy_track = html.find("button[id='copy']");
        const export_track = html.find("button[id='exportTrack']");

        const track_label_select = html.find("select[id='track_label_select']");
        track_label_select.on("change", event => this._on_track_label_select(event, html))
        
        saveTrackButton.on("click", event => this._onSaveTrackButton(event, html));
        track_select.on("change", event => this._track_selectChange(event, html));
        edit_track_name.on("change", event => this._edit_track_name_change(event, html));
        edit_linked_skillsButton.on("click", event => this._edit_linked_skillsButtonClick(event,html));
        deleteTrackButton.on("click",event => this._onDeleteTrackButton(event, html));
        copy_track.on("click", event => this._onCopyTrackButton(event, html));
        export_track.on("click", event => this._onExportTrack(event, html));
        fcoConstants.getPen("edit_track_description");
        fcoConstants.getPen("edit_track_when_marked");
        fcoConstants.getPen("edit_track_when_recovers");

        $('#edit_track_when_recovers_rich').on("keyup", event => {
            if (event.which == 9) $('#edit_track_when_recovers_rich').trigger("click");
        })

        $('#edit_track_when_recovers_rich').on("click", event => {
            if (event.target.outerHTML.startsWith("<a data")) return;
            $("#edit_track_when_recovers_rich").css('display', 'none');
            $("#edit_track_when_recovers").css('display', 'block');
            $("#edit_track_when_recovers").focus();
        })

        $('#edit_track_when_recovers_rich').on('contextmenu', async event => {
            let text = await fcoConstants.updateText("Edit raw HTML", event.currentTarget.innerHTML, true);
            if (text != "discarded") {
                $('#edit_track_when_recovers_rich')[0].innerHTML = text;    
                $('#edit_track_when_recovers')[0].innerHTML = text;    
            }
        })
        
        $('#edit_track_when_recovers').on('blur', async event => {
            if (!window.getSelection().toString()){
                let desc= await fcoConstants.fcoEnrich(event.target.innerHTML);
                if (event.target.outerHTML.startsWith("<a data")) return;
                $('#edit_track_when_recovers').css('display', 'none');
                $('#edit_track_when_recovers_rich')[0].innerHTML = desc;    
                $('#edit_track_when_recovers_rich').css('display', 'block');
            }
        })

        $('#edit_track_when_marked_rich').on("keyup", event => {
            if (event.which == 9) $('#edit_track_when_marked_rich').trigger("click");
        })

        $('#edit_track_when_marked_rich').on("click", event => {
            if (event.target.outerHTML.startsWith("<a data")) return;
            $("#edit_track_when_marked_rich").css('display', 'none');
            $("#edit_track_when_marked").css('display', 'block');
            $("#edit_track_when_marked").focus();
        })

        $('#edit_track_when_marked_rich').on('contextmenu', async event => {
            let text = await fcoConstants.updateText("Edit raw HTML", event.currentTarget.innerHTML, true);
            if (text != "discarded") {
                $('#edit_track_when_marked_rich')[0].innerHTML = text;    
                $('#edit_track_when_marked')[0].innerHTML = text;    
            }
        })
        
        $('#edit_track_when_marked').on('blur', async event => {
            if (!window.getSelection().toString()){
                let desc = await fcoConstants.fcoEnrich(event.target.innerHTML);
                $('#edit_track_when_marked').css('display', 'none');
                $('#edit_track_when_marked_rich')[0].innerHTML = desc;    
                $('#edit_track_when_marked_rich').css('display', 'block');
            }
        })

        $('#edit_track_description_rich').on("keyup", event => {
            if (event.which == 9) $('#edit_track_description_rich').trigger("click");
        })
        $('#edit_track_description_rich').on("click", event => {
            if (event.target.outerHTML.startsWith("<a data")) return;
            $("#edit_track_description_rich").css('display', 'none');
            $("#edit_track_description").css('display', 'block');
            $("#edit_track_description").focus();
        })

        $('#edit_track_description_rich').on('contextmenu', async event => {
            let text = await fcoConstants.updateText("Edit raw HTML", event.currentTarget.innerHTML, true);
            if (text != "discarded") {
                $('#edit_track_description_rich')[0].innerHTML = text;    
                $('#edit_track_description')[0].innerHTML = text;    
            }
        })
        
        $('#edit_track_description').on('blur', async event => {
            if (!window.getSelection().toString()){
                let desc = await fcoConstants.fcoEnrich(event.target.innerHTML);
                $('#edit_track_description').css('display', 'none');
                $('#edit_track_description_rich')[0].innerHTML = desc;    
                $('#edit_track_description_rich').css('display', 'block');
            }
        })

    }
    //Here are the event listener functions.

    async _on_track_label_select(event, html){
        if (event.target.value == "custom"){
            document.getElementById("track_custom_label").hidden = false
            $("#track_custom_label").val("");
        }
        else {
            document.getElementById("track_custom_label").hidden = true
            $("#track_custom_label").val("");
        }
    }

    async _onExportTrack (event, html){
        let edit_track_name=html.find("input[id='edit_track_name']");
        let name = edit_track_name[0].value;
        if (name == "" || name == game.i18n.localize("fate-core-official.NewTrack")){
            ui.notifications.error(game.i18n.localize("fate-core-official.SelectATrackToCopyFirst"));
        }
        else {
            let t = fcoConstants.gkfn(this.tracks, name);
            let track = `{"${fcoConstants.tob64(name)}":${JSON.stringify(this.tracks[t], null, 5)}}`;
            fcoConstants.getCopiableDialog(game.i18n.localize("fate-core-official.CopyAndPasteToSaveThisTrack"), track)
        }
    }

    async _onCopyTrackButton (event, html){
        let edit_track_name=html.find("input[id='edit_track_name']");
        let name = edit_track_name[0].value;
        if (name == "" || name == game.i18n.localize("fate-core-official.NewTrack")){
            ui.notifications.error(game.i18n.localize("fate-core-official.SelectATrackToCopyFirst"));
        }
        else {
            let track = foundry.utils.duplicate(fcoConstants.gbn(this.tracks, name));
            track.name = track.name+" copy"
            let key = fcoConstants.tob64(track.name);
            await fcoConstants.wd().update({
                "system.tracks":{
                    [`${key}`]:track
                }
            });
            this.tracks = foundry.utils.duplicate(fcoConstants.wd().system.tracks);
            this.render(false);
        }
    }

    async _edit_track_name_change(event, html){
        let name = event.target.value;
        let track = fcoConstants.gbn(this.tracks, name);
        if (track == undefined){
            document.getElementById("edit_linked_skills").disabled=true;
        } else {
            document.getElementById("edit_linked_skills").disabled=false;
        }
    }

    async _onDeleteTrackButton(event,html){
        let del = await fcoConstants.confirmDeletion();
        if (del){
             let name = document.getElementById("track_select").value;
            try {
                    let key = fcoConstants.gkfn(this.tracks, name);
                    await fcoConstants.wd().update({
                        "system.tracks":{
                            [`-=${key}`]:null
                        }
                    });
                    this.tracks = foundry.utils.duplicate(fcoConstants.wd().system.tracks);
                    this.render(false);
            } catch {
                ui.notifications.error(game.i18n.localize("fate-core-official.CannotDeleteThat"))
                this.render(false)
            }
        }
    }
    async _edit_linked_skillsButtonClick(event, html){
        let name = document.getElementById("track_select").value;
        if (name=="New Track"){
            ui.notifications.error(game.i18n.localize("fate-core-official.SelectTrackBeforeAddingLinkedSkill"));
        }
        else {
            let track=fcoConstants.gbn(this.tracks, name);
            let linked_skill_editor = new EditLinkedSkills(track);
            linked_skill_editor.render(true);
            try {
                linked_skill_editor.bringToTop();
            } catch  {
                // Do nothing.
            }
        }
    }

    async _track_selectChange(event, html){
        let name = document.getElementById("track_select").value;
        if (name==game.i18n.localize("fate-core-official.NewTrack")){
            this.track=undefined;
            document.getElementById("edit_track_name").value="";
            document.getElementById("edit_track_description").innerHTML="";
            document.getElementById("edit_track_description_rich").innerHTML="";
            document.getElementById("edit_track_universal").checked=true;
            document.getElementById("edit_track_unique").checked=true;
            document.getElementById("edit_track_recovery_type").value="Fleeting";
            document.getElementById("edit_track_aspect").value="No";
            document.getElementById("edit_track_when_marked").innerHTML="";
            document.getElementById("edit_track_when_marked_rich").innerHTML="";
            document.getElementById("edit_track_when_recovers").innerHTML="";
            document.getElementById("edit_track_when_recovers_rich").innerHTML="";
            document.getElementById("edit_track_boxes").value=0;
            document.getElementById("edit_track_harm").value=0;
            document.getElementById("edit_linked_skills").disabled=false;
            document.getElementById("edit_track_paid").checked=false;
            document.getElementById("track_label_select").value = "none";
            document.getElementById("edit_track_rollable").value = "false";
        } else {
            let track=fcoConstants.gbn(this.tracks, name);
            this.track=track;
            document.getElementById("edit_track_name").value=track.name;
            document.getElementById("edit_track_description").innerHTML=DOMPurify.sanitize(track.description);
            document.getElementById("edit_track_description_rich").innerHTML= await fcoConstants.fcoEnrich(track.description);
            document.getElementById("edit_track_universal").checked=track.universal;
            document.getElementById("edit_track_unique").checked=track.unique;
            document.getElementById("edit_track_recovery_type").value=track.recovery_type;
            document.getElementById("edit_track_aspect").value=track.aspect;
            document.getElementById("edit_track_when_marked").innerHTML=DOMPurify.sanitize(track.when_marked);
            document.getElementById("edit_track_when_marked_rich").innerHTML= await fcoConstants.fcoEnrich(track.when_marked);
            document.getElementById("edit_track_when_recovers").innerHTML=DOMPurify.sanitize(track.recovery_conditions);
            document.getElementById("edit_track_when_recovers_rich").innerHTML= await fcoConstants.fcoEnrich(track.recovery_conditions);
            document.getElementById("edit_track_boxes").value=track.boxes;
            document.getElementById("edit_track_harm").value=track.harm_can_absorb;
            document.getElementById("edit_linked_skills").disabled=false;
            document.getElementById("edit_track_paid").checked=track.paid;
            document.getElementById("edit_track_rollable").value = track.rollable ? track.rollable : "false";
            
            if (track.label=="none"){
                document.getElementById("track_label_select").value = "none";
                document.getElementById("track_custom_label").value = "";
                document.getElementById("track_custom_label").hidden=true;     
            } else {
                if (track.label=="escalating"){
                    document.getElementById("track_label_select").value = "escalating";       
                    document.getElementById("track_custom_label").value = "";         
                    document.getElementById("track_custom_label").hidden=true;                                   
                } else {
                    if (track.label==undefined){ 
                        document.getElementById("track_label_select").value = "none";
                        document.getElementById("track_custom_label").value = "";     
                        document.getElementById("track_custom_label").hidden=true;                                   
                    } else {
                        document.getElementById("track_label_select").value = "custom";
                        document.getElementById("track_custom_label").value = track.label;
                        document.getElementById("track_custom_label").hidden=false;
                    }
                }
            }
        }
    }

    async _onSaveTrackButton(event,html){
        let name = document.getElementById("edit_track_name").value;
        let description = DOMPurify.sanitize(document.getElementById("edit_track_description").innerHTML);
        let universal = document.getElementById("edit_track_universal").checked;
        let unique = document.getElementById("edit_track_unique").checked;
        let recovery_type = document.getElementById("edit_track_recovery_type").value;
        let aspect = document.getElementById("edit_track_aspect").value;
        let when_marked = DOMPurify.sanitize(document.getElementById("edit_track_when_marked").innerHTML);
        let when_recovers = DOMPurify.sanitize(document.getElementById("edit_track_when_recovers").innerHTML);
        let boxes = parseInt(document.getElementById("edit_track_boxes").value);
        let harm = parseInt(document.getElementById("edit_track_harm").value);
        let paid = document.getElementById("edit_track_paid").checked;
        let label = document.getElementById("track_label_select").value;
        let custom_label = document.getElementById("track_custom_label").value;
        let rollable = document.getElementById("edit_track_rollable").value;

        if (label=="custom") {
            label=custom_label;
        }
        let linked_skills; 
        let existing = false;

        if (name == ""){
            ui.notifications.error("Name cannot be blank");
        } else {
            for (let t in this.tracks){
            let track = this.tracks[t];
                if (track.name==name){
                    //Logic for overwriting an existing track
                    existing = true;
                    track.description = description;
                    track.universal = universal;
                    track.unique = unique;
                    track.recovery_type = recovery_type;
                    track.aspect = aspect;
                    track.when_marked = when_marked;
                    track.recovery_conditions = when_recovers;
                    track.boxes=boxes;
                    track.harm_can_absorb=harm;
                    track.paid = paid;
                    track.label = label;
                    track.rollable = rollable;
                    await fcoConstants.wd().update({
                        "system.tracks":{
                            [`${t}`]:track
                        }
                    });
                }
            }
            if (!existing){
                if (this.track != undefined){
                    if (this.track.linked_skills != undefined){
                        linked_skills = foundry.utils.duplicate(this.track.linked_skills);
                    }
                    await fcoConstants.wd().update({
                        "system.tracks":{
                            [`-=${fcoConstants.gkfn(this.tracks, this.track.name)}`]:null
                        }
                    });
                }

                let newTrack = new fcoTrack({
                    "name":name,
                    "category":this.category,
                    "description":description,
                    "universal":universal,
                    "unique":unique,
                    "recovery_type":recovery_type,
                    "aspect":aspect,
                    "when_marked":when_marked,
                    "recovery_conditions":when_recovers,
                    "boxes":boxes,
                    "harm_can_absorb":harm,
                    "paid":paid,
                    "linked_skills":linked_skills,
                    "label":label,
                    "rollable":rollable,
                }).toJSON();
                await fcoConstants.wd().update({
                    "system.tracks":{
                        [`${fcoConstants.tob64(name)}`]:newTrack
                    }
                });
            }
            this.tracks = foundry.utils.duplicate(fcoConstants.wd().system.tracks);
            this.render(false);
        }
    }
}

//TrackSetup: The class called from the options to view and edit conditions etc.
class TrackSetup extends FormApplication{
    constructor(...args){
        super(...args);
        game.system.manageTracks = this;
    }
 //Set up the default options for instances of this class
    static get defaultOptions() {
        const options = super.defaultOptions; //begin with the super's default options
        //The HTML file used to render this window
        options.template = "systems/fate-core-official/templates/TrackSetup.html"; 
        options.width = "auto";
        options.height = "auto";
        options.title = `${game.i18n.localize("fate-core-official.TrackCategorySetup")} ${game.world.title}`;
        options.closeOnSubmit = false;
        options.id = "TrackSetup"; // CSS id if you want to override default behaviors
        options.resizable = false;
        return options;
    }
    //The function that returns the data model for this window. In this case, we need the list of stress tracks
    //conditions, and consequences.
    getData(){
        this.tracks=fcoConstants.wd().system.tracks;
        this.track_categories=game.settings.get("fate-core-official","track_categories")

        const templateData = {
           track_categories:this.track_categories,
        }
        return templateData;
    }

        //Here are the action listeners
        activateListeners(html) {
        super.activateListeners(html);
        const deleteCategoryButton = html.find("button[id='delete_category']");
        const addCategoryButton = html.find("button[id='add_category']");
        const editTracksButton = html.find("button[id='edit_tracks']");
        const setCategoriesButton = html.find("button[id='set_track_categories']");
        const selectBox = html.find("select[id='track_categories_select']");
        const importTracks = html.find("button[id='import_tracks']");
        const exportTracks = html.find("button[id='export_tracks']");
        const orderTracks = html.find("button[id='order_tracks']");

        deleteCategoryButton.on("click", event => this._onDeleteCategoryButton(event, html));
        addCategoryButton.on("click", event => this._onAddCategoryButton(event, html));
        editTracksButton.on("click", event => this._onEditTracksButton(event, html));

        setCategoriesButton.on("click", event => {
            let content = `<div style="display:flex; flex-direction:column;">`;
            let tracks = foundry.utils.duplicate(fcoConstants.wd().system.tracks);
            let categories = game.settings.get("fate-core-official","track_categories");

            for (let track in tracks){
                let categories_select = `<select name="fco_track_cat_select" data-track="${track}">`
                for (let category in categories){
                    if (tracks[track].category == category){
                        categories_select += `<option selected = "selected" value="${category}">`
                    }else {
                        categories_select += `<option value = "${category}">`
                    }
                    if (category == "Combat"){
                        categories_select += `${game.i18n.localize("fate-core-official.Combat")}</option>`   
                    } else {
                        if (category == "Other"){
                            categories_select += `${game.i18n.localize("fate-core-official.Other")}</option>`
                        } else {
                            categories_select += `${category}</option>`   
                        }
                    }
                }
                categories_select += `</select>`;
                content += `<div style="display:flex; flex-direction:row; padding:5px"><div style="width:25rem">${tracks[track].name}</div><div>${categories_select}</div></div>`
            }
            content += `</div>`
            let width = 800;
            new foundry.applications.api.DialogV2({
                        window: {title: `Change Track Categories`},
                        content: content,
                        buttons: [{
                                action: "ok",
                                label: game.i18n.localize("fate-core-official.OK"),
                                callback: async (event, button,dialog) => {
                                // Do the stuff here
                                    let results = button.form.elements.fco_track_cat_select;
                                    for (let result of results){
                                        let track = tracks[result.getAttribute("data-track")];
                                        track.category = result.value;
                                    }
                                    await fcoConstants.wd().update({"system.tracks":null},{noHook:true, renderSheet:false});
                                    await fcoConstants.wd().update({"system.tracks":tracks});
                                }
                            }]
                    },
                    {
                        width:width,
                        height:"auto",
                    }).render(true);
        })
        selectBox.on("dblclick", event => this._onEditTracksButton(event,html));
        importTracks.on("click", event => this._importTracks(event,html));
        exportTracks.on("click", event => this._exportTracks(event,html));
        orderTracks.on("click", event => this._orderTracks (event, html));
    }
    
    //Here are the event listener functions.

    async _orderTracks (event, html){
        let ot = new OrderTracks();
        ot.render(true);
    }

    async _exportTracks(event, html){
        let tracks = fcoConstants.wd().system.tracks;
        let tracks_text = JSON.stringify(tracks, null, 5);
        fcoConstants.getCopiableDialog(game.i18n.localize("fate-core-official.CopyAndPasteToSaveWorldTracks"), tracks_text);
    }

    async getTracks(){
        return await fcoConstants.getImportDialog(game.i18n.localize("fate-core-official.PasteToReplaceWorldTracks"));
    }

    async _importTracks(event, html){
        let text = await this.getTracks();
        try {
            let imported_tracks = JSON.parse(text);
            let tracks = foundry.utils.duplicate(fcoConstants.wd().system.tracks);
            let track_categories = foundry.utils.duplicate(game.settings.get("fate-core-official", "track_categories"));
            if (tracks == undefined){
                tracks = {};
            }

            if (!imported_tracks.hasOwnProperty("name")){
                // This object contains multiple tracks; overwrite the current list of tracks
                for (let track in imported_tracks){
                    let tr = new fcoTrack(imported_tracks[track]).toJSON();
                    if (tr){
                        tracks[track]=tr;
                    }
                    let cat = imported_tracks[track].category;
                    track_categories[cat]=cat;
                }
                await fcoConstants.wd().update({"system.tracks":imported_tracks});
            } else {
                // This is a track object
                let tr = new fcoTrack(imported_tracks).toJSON();
                    if (tr){
                        let key = fcoConstants.tob64(tr.name);
                        await fcoConstants.wd().update({
                            "system.tracks":{
                                [`${key}`]:tr
                            }
                        });
                        track_categories[tr.category]=tr.category;
                    }
            }
            await game.settings.set("fate-core-official", "track_categories", track_categories);
            this.render(false);
        } catch (e) {
            ui.notifications.error(e);
        }
    }

    async _onAddCategoryButton(event,html){
        let category = await fcoConstants.getInput(game.i18n.localize("fate-core-official.ChooseCategoryName"));
        let track_categories = game.settings.get("fate-core-official","track_categories");
        var duplicate = false;

        for (let cat in track_categories){
            if (track_categories[cat].toUpperCase == category.toUpperCase()){
                ui.notifications.error(game.i18n.localize("fate-core-official.CannotCreateDuplicateCategory"));
                duplicate = true;
            }
            if (!duplicate && category != "" && category != undefined){
                track_categories[category.split(".").join("․")]=category;
            }
            await game.settings.set("fate-core-official","track_categories",track_categories);
            this.render(false);
        }
    }

    async _onDeleteCategoryButton(event,html){
        let del = await fcoConstants.confirmDeletion();
        if (del){
                    let track_categories = game.settings.get("fate-core-official","track_categories");
                    let category  = document.getElementById("track_categories_select").value;

                    for (let cat in track_categories){
                        if (track_categories[cat].toUpperCase() == category.toUpperCase()){
                            if (track_categories[cat]=="Combat" || track_categories[cat]=="Other"){
                                ui.notifications.error(`${game.i18n.localize("fate-core-official.CannotDeleteThe")} ${game.i18n.localize("fate-core-official",category)} ${game.i18n.localize("fate-core-official.CategoryThatCannotDelete")}`);
                            } else {
                                        let tracks = foundry.utils.duplicate(fcoConstants.wd().system.tracks);
                                        let toDelete = [];
                                        for (let tr in tracks){
                                            if (tracks[tr].category == track_categories[cat]) toDelete.push(tracks[tr]);
                                        }

                                        if (toDelete.length == 0){
                                            delete track_categories[cat];
                                            await game.settings.set("fate-core-official","track_categories",track_categories);
                                            this.render(false);
                                        } else {
                                            let content = `${cat} ${game.i18n.localize("fate-core-official.checkDeleteCategory")}<br/>`
                                            for (let ttd of toDelete){
                                                content += ttd.name + '<br/>'
                                            }
                                            let del = await fcoConstants.awaitYesNoDialog(game.i18n.localize("fate-core-official.deleteCategory"), content);
                                            if (del) {
                                                delete track_categories[cat];
                                                for (let ttd of toDelete){
                                                    delete tracks[fcoConstants.gkfn(tracks, ttd.name)];
                                                }
                                                await game.settings.set("fate-core-official","track_categories",track_categories);
                                                await fcoConstants.wd().update({"system.tracks":null},{noHook:true, renderSheet:false});
                                                await fcoConstants.wd().update({"system.tracks":tracks});
                                                this.render(false);    
                                            }
                                        }
                            }
                        } 
                    }
        }
    }
    
    async _onEditTracksButton(event,html){

        let category = html.find("select[id='track_categories_select']")[0].value;

        if (category !="" && category != undefined){
            let track_editor = new EditTracks(category);
            track_editor.render(true);
            try {
                track_editor.bringToTop();
            } catch  {
                // Do nothing.
            }
        } else {
            ui.notifications.error(game.i18n.localize("fate-core-official.PleaseSelectACategoryFirst"))
        }
    }
}

Hooks.on('closeEditTracks',async () => {
    game.system.manageTracks.render(true);
    try {
        game.system.manageTracks.bringToTop();
    } catch  {
        // Do nothing.
    }
})

class OrderTracks extends FormApplication {
    constructor(...args){
        super(...args);
        let tracks = fcoConstants.wd().system.tracks;
        this.data = [];
        for (let track in tracks){
            this.data.push(tracks[track]);
        }
    }
    //Set up the default options for instances of this class
    static get defaultOptions() {
        const options = super.defaultOptions; //begin with the super's default options
        //The HTML file used to render this window
        options.template = "systems/fate-core-official/templates/OrderTracks.html"; 
        options.width = "auto";
        options.height = "auto";
        options.title = `${game.i18n.localize("fate-core-official.OrderTracksTitle")} ${game.world.title}`;
        options.closeOnSubmit = true;
        options.id = "OrderTracks"; // CSS id if you want to override default behaviors
        options.resizable = false;
        return options;
    }
    //The function that returns the data model for this window. In this case, we need the list of stress tracks
    //conditions, and consequences.
    getData(){
        return this.data;
    }

        //Here are the action listeners
        activateListeners(html) {
        super.activateListeners(html);
        const ot_up = html.find("button[name='ot_up']");
        const ot_down = html.find("button[name='ot_down']");
        const ot_save = html.find("button[id='ot_save']");
        
        ot_up.on("click", event => {
            let index = parseInt(event.target.id.split("_")[2]);
            if (index > 0){
                let track = this.data.splice(index,1)[0];
                this.data.splice(index - 1, 0, track);
                this.render(false);
            }
        })

        ot_down.on("click", event => {
            let index = parseInt(event.target.id.split("_")[2]);
            if (index < this.data.length){
                let track = this.data.splice(index, 1)[0];
                this.data.splice(index + 1, 0, track);
                this.render(false);
            }
        })

        ot_save.on("click", async event => {
            let tracks = {};
            for (let i = 0; i < this.data.length; i++){
                tracks[fcoConstants.tob64(this.data[i].name)] = this.data[i];
            }
            await fcoConstants.wd().update({"system.tracks":null},{noHook:true, renderSheet:false});
            await fcoConstants.wd().update({"system.tracks":tracks});
            this.close();
        })
    }
}
