class EditPlayerTracks extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
    constructor(object){
        super(object);
        this.object = object;
        this.selected_category = "";
        this.tracks_by_category = undefined;
        game.system.apps["actor"].push(this);
        game.system.apps["item"].push(this);
    } //End constructor

    get title (){
        //This is a good place to set up some variables at the top level so we can access them with this.
        if (this.object.type=="Extra"){
            return `${game.i18n.localize("fate-core-official.ExtraTrackEditor")} ${this.object.name}`
        } else {
            if (this.object.isToken) {
                return `${game.i18n.localize("fate-core-official.TokenTrackEditor")} ${this.object.name}`
            } else {
                return `${game.i18n.localize("fate-core-official.ActorTrackEditor")} ${this.object.name}`
            }
        }
    }

    static DEFAULT_OPTIONS ={
        tag: "form",
        id: "PlayerTrackSetup",
        classes: ['fate'],
        window: {
            title: this.title,
            icon: "fas fa-scroll"
        },
        form: {
            closeOnSubmit: false,
        },
        position:{
        }
    }

    static PARTS = {
        EditPlayerTracksForm: {
            template: "systems/fate-core-official/templates/EditPlayerTracks.html",
            scrollable: ["#edit_tracks_body"]
        }
    }

    async renderMe(id, data){
        if (this.object.isToken){
            if (this.object.token.id == id){
                let check = false;
                if (data.delta.system != undefined && data.delta.system.tracks != undefined) check = true;
                if (check)
                    this.tracks_by_category=undefined;                   
                    if (!this.renderPending) {
                        this.renderPending = true;
                        setTimeout(() => {
                        this.render(false);
                        this.renderPending = false;
                        }, 50);
                    }
            }
        }

        else {
            if (this.object.id == id){
                if (data.system != undefined && data.system.tracks != undefined)
                    this.tracks_by_category=undefined;
                    if (!this.renderPending) {
                        this.renderPending = true;
                        setTimeout(() => {
                        this.render(false);
                        this.renderPending = false;
                        }, 50);
                    }
            }
        }       
    }

    async close(options){
        game.system.apps["actor"].splice(game.system.apps["actor"].indexOf(this),1); 
        game.system.apps["item"].splice(game.system.apps["item"].indexOf(this),1); 
        await super.close(options);
    }

    setSheet (ActorSheet){
        this.sheet = ActorSheet;
    }

    _onRender(context, options) {
        const select_box = this.element.querySelector("#fco_ept_select_box");
        select_box?.addEventListener("change", event => this._on_sb_change(event));       
        const nameField = this.element.querySelectorAll("td[name='nameField']");
        nameField.forEach(name => name?.addEventListener("contextmenu", event => this._onNameField (event)));
        const moveUp = this.element.querySelectorAll("button.move_up");
        moveUp?.forEach(button => button?.addEventListener("click", event => this._onMove (event, -1)));
        const moveDown = this.element.querySelectorAll("button.move_down");
        moveDown?.forEach(button => button?.addEventListener("click", event => this._onMove (event, 1)));
        const save = this.element.querySelector("button[name = 'save']");
        save?.addEventListener("click", event => this._save(event))
        const ad_hoc = this.element.querySelector("button[name='ad_hoc']");
        ad_hoc?.addEventListener("click", event => this._ad_hoc(event));
        const numberbox = this.element.querySelectorAll("input[type='number']");
        numberbox?.forEach(num => num?.addEventListener("change", event => this._numChange(event)));
        const checkbox = this.element.querySelectorAll("input[type='checkbox']");
        checkbox?.forEach(cb => cb?.addEventListener("click", event => this._check(event)));
        const edit = this.element.querySelectorAll("button[name='edit_entity_tracks']");
        edit.forEach(button => button?.addEventListener('click', async event => {
            let track = fcoConstants.gbn(this.object.system.tracks, event.target.id);
            let e = new EditEntityTrack(track, this.object).render(true);
            e.origin = this;
        }));
    } //End activateListeners
    // Here are the action functions

    async _ad_hoc (event){
        let catText = `<select name="category" style="color:black; background:white;">`
        for (let c in this.tracks_by_category){
            // Build the category list
            if (c !== "All"){
                if (c == "Combat"){
                    catText +=`<option value = "Combat"> ${game.i18n.localize("fate-core-official.Combat")}</option>`;
                } else {
                    if (c == "Other"){
                        catText +=`<option value = "Other"> ${game.i18n.localize("fate-core-official.Other")}</option>`;
                    }
                }
            }
        }
        catText += '</select>'

        let content = 
        `<div>
        <h1>${game.i18n.localize("fate-core-official.AddAnAdHocTrack")}</h1>
        <table border="0" cellpadding="4" cellspacing="4">
            <tr>
                <td width = "200px">
                    ${game.i18n.localize("fate-core-official.Category")}:
                </td>
                <td>
                    ${catText}
                </td>
            </tr>
            <tr>
                <td>
                    ${game.i18n.localize("fate-core-official.Name")}:
                </td>
                <td>
                    <input style="color:black; background:white;" name = "name" type="text" value="${game.i18n.localize("fate-core-official.NewTrack")}"></input>
                </td>
            </tr>
            <tr>
                <td>
                    ${game.i18n.localize("fate-core-official.Description")}:
                </td>
                <td>
                    <input style="color:black; background:white;" name = "description" type="text"></input>
                </td>
            </tr>
            <tr>
                <td>
                    ${game.i18n.localize("fate-core-official.Universal")}
                </td>
                <td>
                    ${game.i18n.localize("fate-core-official.AdHocTracksNotUniversal")}
                </td>
            </tr>
            <tr>
                <td>
                    ${game.i18n.localize("fate-core-official.Unique")}
                </td>
                <td>
                    <input type="checkbox" name="unique" checked></input>
                </td>
            </tr>
            <tr>
                <td>
                    ${game.i18n.localize("fate-core-official.RecoveryType")}:
                </td>
                <td>
                    <select style="color:black; background:white;" name = "recovery_type"><option value="Fleeting" selected="selected">${game.i18n.localize("fate-core-official.Fleeting")}</option><option value="Sticky">${game.i18n.localize("fate-core-official.Sticky")}</option><option value="Lasting">${game.i18n.localize("fate-core-official.Lasting")}</option></Select>
                </td>
            </tr>
            <tr>
                <td>
                    ${game.i18n.localize("fate-core-official.AspectWhenMarked")}:
                </td>
                <td>
                     <input name = "aspect_when_marked" type="checkbox">
                </td>
            </tr>
            <tr>
                <td>
                    ${game.i18n.localize("fate-core-official.AspectAsName?")}
                </td>
                <td>
                    <input name = "aspect_as_name" type="checkbox"></input>
                </td>
            </tr>
            <tr>
                <td>
                ${game.i18n.localize("fate-core-official.Boxes")}:
                </td>
                <td>
                    <input style="color:black; background:white;" name = "boxes" type="number" min = "0" value="0">
                <td>
            </tr>
            <tr>
            <td>
                ${game.i18n.localize("fate-core-official.BoxLabels")}:
            </td>
            <td>
                <select name="player_track_label_select" style="color:black; background:white;" >
                    <option value="escalating">
                        ${game.i18n.localize("fate-core-official.Escalating")}
                    </option>
                    <option value="custom">
                        ${game.i18n.localize("fate-core-official.Custom")}
                    </option>
                    <option selected="selected" value="none">
                        ${game.i18n.localize("fate-core-official.None")}
                    </option>
                </select>
                <input type="text" name="player_track_custom_label" maxlength="1" minlength="1" title="${game.i18n.localize("fate-core-official.EnterASingleCharacter")}" style="color:black; background:white; width:50px"/>
            </td>
        </tr>
            <tr>
                <td>
                    ${game.i18n.localize("fate-core-official.Harm")}:
                </td>
                <td>
                    <input style="color:black; background:white;" name = "harm" type="number" min = "0" value="0">
                </td>
            </tr>
            <tr>
            <td>
                ${game.i18n.localize('fate-core-official.Rollable')}
            </td>
            <td>
                <select name = "rollable" style="color:black; background:white;">
                    <option value="false">${game.i18n.localize('fate-core-official.False')}</option>
                    <option value="full"> ${game.i18n.localize('fate-core-official.RollFullBoxes')} </option>
                    <option value="empty"> ${game.i18n.localize('fate-core-official.RollEmptyBoxes')} </option>
                </select>
            </td>
        </tr>
            <tr>
                <td>
                    ${game.i18n.localize("fate-core-official.WhenMarked")}
                </td>
                <td>
                    <input style="color:black; background:white;" name="when_marked" type="text"></input>
                </td>
            </tr>
            <tr>
                <td>
                    ${game.i18n.localize("fate-core-official.HowRecover")}
                </td>
                <td>
                    <input style="color:black; background:white;" name="recovery_conditions" type="text"></input>
                </td>
            </tr>
            <tr>
                <td>
                    ${game.i18n.localize("fate-core-official.LinkedSkills")}:
                </td>
                <td>
                    ${game.i18n.localize("fate-core-official.AdHocTracksDoNotUseLinkedSkills")}
            </tr>
        </table>
        </div>`

        new foundry.applications.api.DialogV2({
            window:{
                title: game.i18n.localize("fate-core-official.AdHocTrackEditor"),
            },
            content: content,
            buttons: [{
                action:"ok",
                label: game.i18n.localize("fate-core-official.Save"),
                callback: (event, button, html) => {
                    let newTrack = {};
                    newTrack.category = button.form.elements.category.value; 
                    newTrack.name = button.form.elements.name.value; 
                    newTrack.description = button.form.elements.description.value 
                    newTrack.universal= false; 
                    newTrack.unique = button.form.elements.unique.checked;
                    newTrack.aspect = {};
                    newTrack.aspect.name = "";
                    newTrack.enabled=true;
                    newTrack.when_marked = button.form.elements.when_marked.value;
                    newTrack.recovery_conditions = button.form.elements.recovery_conditions.value; 
                    newTrack.recovery_type = button.form.elements.recovery_type.value; 
                    newTrack.harm_can_absorb = parseInt(button.form.elements.harm.value);
                    newTrack.aspect.when_marked = button.form.elements.aspect_when_marked.checked;
                    newTrack.aspect.as_name = button.form.elements.aspect_as_name.checked;
                    newTrack.boxes = parseInt(button.form.elements.boxes.value);
                    newTrack.rollable = button.form.elements.rollable.value; 
                    let box_values = []
                    for (let i = 0; i < newTrack.boxes; i++){
                        box_values.push(false);
                    }
                    newTrack.box_values = box_values;
                    let label = button.form.elements.player_track_label_select.value;
                    if (label == "custom"){
                        let val = button.form.elements.player_track_custom_label.value;
                        if (val != "" && val != undefined){
                            label = val;
                        } else {
                            label = "";
                        }
                    }
                    newTrack.label = label;
                    newTrack.toCopy=true;
                    this.tracks_by_category[newTrack.category][fcoConstants.tob64(newTrack.name)]=newTrack;
                    this.tracks_by_category["All"][fcoConstants.tob64(newTrack.name)]=newTrack;
                    this.render(false);
                }, 
                default:true
            }],
        },
        {
            width:500,
            height:"auto",
        }).render(true);

    }
    
    async _numChange (event){
        let name = event.target.id.split("_")[0]
        let track = fcoConstants.gbn(this.tracks_by_category[this.selected_category], name);
        track.number = parseInt(event.target.value);
    }

    async _check(event){
        let name = event.target.dataset.name;
        let track = fcoConstants.gbn(this.tracks_by_category[this.selected_category], name);
        track.toCopy=event.target.checked;
        //The copy/don't copy checkbox overrides this; we only needed the present checkbox when we initialised.
        delete track.present;
    }

    async _save(event){
        //Work out which tracks in tracks_by_category are being added, and which deleted
        //We'll do this by finding the existing tracks in current working object and copying them to a new working object ready for output.
        let input = {};
        let output = {};
        if (this.selected_category == "All"){
            input = this.tracks_by_category["All"];
        } else {
            for (let c in this.tracks_by_category){
                if (c == "All") continue;
                for (let t in this.tracks_by_category[c]){
                    input[t]=this.tracks_by_category[c][t];
                }
            }
        }
     
        //Copy each CHECKED track from input to output; but if it already exists in this.tracks we need to copy the version from that instead.
        //We also need to create multiple copies if there's a number in the number box. Each copy of the track needs to have a unique name.
        for (let t in input)
        {    
            let number = input[t].number;
            let track = fcoConstants.gbn(this.tracks, input[t].name);
            if (track){ //If this exists in the player's current track list
                if (input[t].toCopy == true  || input[t].present == true) { //If the track is selected in the editor)
                    track.enabled=true;
                    output[t]=track; //Write this track to the output object.
                    //If this is non-unique and the number >1, we need to add more copies if there aren't already enough copies.
                    //To manage this, we'll set a 'parent' attribute on copies that gives the name of the original track.

                    if (number > 1){
                        let numCopies = 1;
                        for (let t in this.tracks){
                            if ( this.tracks[t].parent==input[t].name){
                                numCopies ++;
                            }
                        }
                        //Copy from the input array rather than the current array as this is a new track.
    
                        if (numCopies < number){
                            for (let i = 0; i < number - numCopies; i++){
                                let dupeTrack = foundry.utils.duplicate(input[t]);
                                dupeTrack.parent = input[t].name;
                                dupeTrack.name = dupeTrack.name+" "+(i+2)
                                await this.prepareTrack(dupeTrack);
                                output[fcoConstants.tob64(dupeTrack.name)]=dupeTrack;
                            }
                        }
                    }
                }
            } else {
                //Check to see if this track is unique, and if not how many we're adding.
                if (number > 1) {
                    let numCopies = 0;
                    //Copy from the input array rather than the current array as this is a new track.
                    if (numCopies < number){
                        for (let i = 0; i< number - numCopies; i++){
                            let dupeTrack = foundry.utils.duplicate(input[t]);
                            if ( i == 0) {
                                
                            } else {
                                dupeTrack.parent = input[t].name;
                                dupeTrack.name = dupeTrack.name+" "+(i+1)
                            }
                            await this.prepareTrack(dupeTrack);
                            output[fcoConstants.tob64(dupeTrack.name)]=dupeTrack;
                        }
                    }
                } else {
                    if (input[t].toCopy){
                        input[t].enabled=true;
                        await this.prepareTrack(input[t]);
                        output[t]=input[t];
                    }
                }
            }
        } 
        ui.notifications.info(game.i18n.localize("fate-core-official.CharacterTrackChangesSaved"))   
        //Get an updated version of the tracks according to the character's skills if it's not an extra.
        if (this.object.type != "Extra") {
            let tracks = this.object.setupTracks(foundry.utils.duplicate(this.object.system.skills), output);
            await this.object.update({"system.tracks":null}, {renderSheet:false, noHook:true}) //This is needed to make the game see a change in order of keys as a difference.
            await this.object.update({"system.tracks":tracks});             
        } else {
            await this.object.update({"system.tracks":null}, {renderSheet:false, noHook:true}) //This is needed to make the game see a change in order of keys as a difference.
            await this.object.update({"system.tracks":output});             
        }
    }

    async _on_sb_change(event){
        this.selected_category = event.target.value;
        this.render(false);
    }
    
    async _onMove (event, direction){
        let info = event.target.name.split("_");
        let category = info[0]
        let tracks = this.tracks_by_category[category]
        let trackKey = fcoConstants.gkfn(tracks, info[1]);
        tracks = fcoConstants.moveKey(tracks, trackKey, direction);
        this.tracks_by_category[category]=tracks;
        this.render(false);
    }
  
    async _onNameField (event){
        let name = event.target.id.split("_")[0];
        let track;
        for (let c in this.tracks_by_category){
            let cat = this.tracks_by_category[c];
            let t = fcoConstants.gbn(cat, name);
           if (t != undefined) {
                track = t;
            }
        }

        let linked_skills_text =""
        if (track?.linked_skills != undefined && track?.linked_skills.length >0){
            for (let i = 0; i<track.linked_skills.length;i++)
            {
                let skill = track.linked_skills[i];
                linked_skills_text+=`Skill: ${skill.linked_skill}; Rank: ${skill.rank}; Boxes: ${skill.boxes}; Enables: ${skill.enables ? 'Yes':'No'}<br>`
            }
        }

        let rollable = "False";
        if (track.rollable == "false") rollable = "False";
        if (track.rollable == "full") rollable = game.i18n.localize("fate-core-official.RollFullBoxes");
        if (track.rollable == "empty") rollable = game.i18n.localize("fate-core-official.RollEmptyBoxes");

        let content = 
        `<h1>${game.i18n.localize("fate-core-official.DetailsFor")} ${track.name}</h1>
        <table border="1" cellpadding="4" cellspacing="4" style="width:950px">
            <tr>
                <td width = "200px">
                    ${game.i18n.localize("fate-core-official.Description")}:
                </td>
                <td>
                    ${track.description}
                </td>
            </tr>
            <tr>
                <td>
                    ${game.i18n.localize("fate-core-official.Universal")}<br>
                    ${game.i18n.localize("fate-core-official.Unique")}<br>
                    ${game.i18n.localize("fate-core-official.Paid")}<br>
                </td>
                <td>
                    ${track.universal ? game.i18n.localize("fate-core-official.Yes"):game.i18n.localize("fate-core-official.No")}<br>
                    ${track.unique ? game.i18n.localize("fate-core-official.Yes"):game.i18n.localize("fate-core-official.No")}<br>
                    ${track.paid ? game.i18n.localize("fate-core-official.Yes"):game.i18n.localize("fate-core-official.No")}<br>
                </td>
            </tr>
            <tr>
                <td>
                    ${game.i18n.localize("fate-core-official.RecoveryType")}:<br>
                    ${game.i18n.localize("fate-core-official.AspectWhenMarked")}:<br>
                    ${game.i18n.localize("fate-core-official.NameAsAspect")}:<br>
                    ${game.i18n.localize("fate-core-official.Boxes")}:<br>
                    ${game.i18n.localize("fate-core-official.Box_Label")}:<br>
                    ${game.i18n.localize("fate-core-official.Harm")}:<br>
                    ${game.i18n.localize("fate-core-official.Rollable")}:
                </td>
                <td>
                    ${track.recovery_type}<br>
                    ${track.aspect.when_marked ? game.i18n.localize("fate-core-official.Yes"):game.i18n.localize("fate-core-official.No")}<br>
                    ${track.aspect.as_name ? game.i18n.localize("fate-core-official.Yes"):game.i18n.localize("fate-core-official.No")}<br>
                    ${track.boxes}<br>
                    ${track.label}<br>
                    ${track.harm_can_absorb}<br>
                    ${rollable}
                </td>
            </tr>
            <tr>
                <td>
                    ${game.i18n.localize("fate-core-official.WhenMarked")}:
                </td>
                <td>
                    ${track.when_marked}
                </td>

            </tr>
            <tr>
                <td>
                    ${game.i18n.localize("fate-core-official.HowRecover")}:
                </td>
                <td>
                    ${track.recovery_conditions}
                </td>
            </tr>
            <tr>
                <td>
                ${game.i18n.localize("fate-core-official.LinkedSkills")}:
                </td>
                <td>
                    ${linked_skills_text}
            </tr>
        </table>`

        fcoConstants.awaitOKDialog(track.name, content, 1000);
    }

    async prepareTrack(track){
        if (track.toCopy){
            track.enabled = true;
        }

        delete track.toCopy;
        delete track.present;
        if (track.parent == undefined){
            delete track.number;
        }
        
        track.notes = "";

        //If this box is an aspect when marked, it needs an aspect.name data field.
        if (track.aspect == game.i18n.localize("fate-core-official.DefinedWhenMarked")
            || track.aspect == "Defined when marked"
            || track.aspect == "when_marked"
        ) {
            track.aspect = {};
            track.aspect.name = "";
            track.aspect.when_marked = true;
            track.aspect.as_name = false;
        }
        if (track.aspect == "Aspect as Name" 
            || track.aspect == "Name As Aspect" 
            || track.aspect == game.i18n.localize("aspectAsName") 
            || track.aspect == game.i18n.localize("NameAsAspect")
            || track.aspect == "as_name"
        ) {
            track.aspect = {};
            track.aspect.when_marked = false;
            track.aspect.as_name = true;
        }

        //Initialise the box array for this track 
        if (track.boxes > 0) {
            let box_values = [];
            for (let i = 0; i < track.boxes; i++) {
                box_values.push(false);
            }
            track.box_values = box_values;
        }
    }
        
    async _prepareContext(){
        let world_tracks = await foundry.utils.duplicate(fcoConstants.wd().system.tracks);
        //We need the list of track categories
        //We will use a dropdown list of categories in the editor to select which tracks are displayed

        if (this.tracks_by_category == undefined){
            this.tracks_by_category = await foundry.utils.duplicate(game.settings.get("fate-core-official","track_categories"));
             //Initialise the values from text (used in the category editor) to JSON objects (used here)
            this.tracks_by_category["All"]={};
            for (let c in this.tracks_by_category){
                this.tracks_by_category[c]={};
            }

            //Let's get a working copy of this actor's track information. We will work with this throughout and only save it to the actor when we're finished.
            this.tracks = await foundry.utils.duplicate(this.object.system.tracks);
            
            //The ones already on the player should be ticked as they already have them.DONE

            //First we add all the tracks on the player to the relevant categories in world tracks DONE
            
            try {
                    for (let t in this.tracks) {
                        if (this.tracks_by_category != undefined){
                            let track = await foundry.utils.duplicate(this.tracks[t]);
                            track.present=true;
                            track.number=1;
                            this.tracks_by_category["All"][t]=track;
                            this.tracks_by_category[track.category][t]=track;
                        }
                    }

                    let player_track_keys = Object.keys(this.tracks);
                    // Now we match the character tracks to world tracks - better to do this via name.
                    for (let t in world_tracks){
                        let present = false;
                        //t is the world track key. We want to get the track name and match to the player's tracks.
                        let pt = fcoConstants.gbn(this.tracks, world_tracks[t].name);
                        if (pt) present = true;
                        world_tracks[t].number = 1;
                        if (!present){
                            this.tracks_by_category[world_tracks[t].category][t]=world_tracks[t];
                            this.tracks_by_category["All"][t]=world_tracks[t];
                        }
                    }
                } catch(error){
                    console.error(error);
                }
        }
            
        //TemplateData is returned to the form for use with HandleBars.
        const templateData = {
                tracks_by_category:this.tracks_by_category,
                GM:game.user.isGM,
                character_tracks:this.tracks,
                cat:this.selected_category
        }
        return templateData;
    } //End getData
} //End EditPlayerTracks