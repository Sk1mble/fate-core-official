Handlebars.registerHelper("undefined", function(value) {
    if (value == undefined){
        return true;
    } else {
        return false;
    }
});

class EditPlayerTracks extends FormApplication {
    constructor(...args){
        super(...args);
        //This is a good place to set up some variables at the top level so we can access them with this.
        if (this.object.type=="Extra"){
            this.options.title=`${game.i18n.localize("ModularFate.ExtraTrackEditor")} ${this.object.name}`
        } else {
            if (this.object.isToken) {
                this.options.title=`${game.i18n.localize("ModularFate.TokenTrackEditor")} ${this.object.name}`
            } else {
                this.options.title=`${game.i18n.localize("ModularFate.ActorTrackEditor")} ${this.object.name}`
            }
        }
        this.selected_category = "";
        this.tracks_by_category = undefined;
        game.system.apps["actor"].push(this);
        game.system.apps["item"].push(this);
    } //End constructor

    static get defaultOptions(){
        const options = super.defaultOptions;
        options.template = "systems/ModularFate/templates/EditPlayerTracks.html";
        options.width = "auto";
        options.height = "auto";
        options.title = `${game.i18n.localize("ModularFate.CharacterTrackEditor")}`;
        options.closeOnSubmit = false;
        options.id = "PlayerTrackSetup";
        options.resizable = true;
        return options 
    } // End getDefaultOptions

    async _updateObject(event, formData){
        // This returns all the forms fields with names as a JSON object with their values. 
        // It is required for a FormApplication.
        // It is called when you call this.submit();
    }

    setSheet (ActorSheet){
        this.sheet = ActorSheet;
    }

    async renderMe(id, data){
        if (this.object.isToken){
            if (this.object.token.id == id){
                if (data.actorData.data != undefined && data.actorData.data.tracks != undefined)
                    this.tracks_by_category=undefined;                   
                    await this.render(false);
            }
        }

        else {
            if (this.object._id == id){
                if (data.data != undefined && data.data.tracks != undefined)
                    this.tracks_by_category=undefined;
                    await this.render(false);  
            }
        }       
    }

    async close(options){
        game.system.apps["actor"].splice(game.system.apps["actor"].indexOf(this),1); 
        game.system.apps["item"].splice(game.system.apps["item"].indexOf(this),1); 
        await super.close(options);
    }

    activateListeners(html) {
        super.activateListeners(html);
        const select_box = html.find("select[id='select_box");
        select_box.on("change", event => this._on_sb_change(event, html));
       
        const nameField = html.find("td[name='nameField']");
        nameField.on("contextmenu", event => this._onNameField (event,html));
        const moveUp = html.find("button[id='move_up']");
        moveUp.on("click", event => this._onMove (event, html, -1));
        const moveDown = html.find("button[id='move_down']");
        moveDown.on("click", event => this._onMove (event, html, 1));
        const save = html.find("button[id='save']");
        save.on("click", event => this._save(event, html))
        const ad_hoc = html.find("button[id='ad_hoc']");
        ad_hoc.on("click", event => this._ad_hoc(event, html));
        const checkboxes = html.find("input[type='checkbox']");
        const numberbox = html.find("input[type='number']");
        numberbox.on("change", event => this._numChange(event, html));
        const checkbox = html.find("input[type='checkbox']");
        checkbox.on("click", event => this._check(event,html));
    } //End activateListeners

    // Here are the action functions

    async _ad_hoc (event, html){

        let catText = `<select id="category">`
        for (let c in this.tracks_by_category){
            // Build the category list
            catText +=`<option> ${c}</option>`
        }
        catText += '</select>'

        let content = 
        `<h1>${game.i18n.localize("ModularFate.AddAnAdHocTrack")}</h1>
        <table border="1" cellpadding="4" cellspacing="4">
            <tr>
                <td width = "200px">
                ${game.i18n.localize("ModularFate.Category")}:
                </td>
                <td>
                    ${catText}
                </td>
            </tr>
            <tr>
                <td>
                ${game.i18n.localize("ModularFate.Namer")}:
                </td>
                <td>
                    <input id = "name" type="text" value="${game.i18n.localize("ModularFate.NewTrack")}"></input>
                </td>
            </tr>
            <tr>
                <td>
                    ${game.i18n.localize("ModularFate.Description")}:
                </td>
                <td>
                    <input id = "description" type="text"></input>
                </td>
            </tr>
            <tr>
                <td>
                    ${game.i18n.localize("ModularFate.Universal")}
                </td>
                <td>
                    ${game.i18n.localize("ModularFate.AdHocTracksNotUniversal")}
                </td>
            </tr>
            <tr>
                <td>
                    ${game.i18n.localize("ModularFate.Unique")}
                </td>
                <td>
                    <input type="checkbox" id="unique" checked></input>
                </td>
            </tr>
            <tr>
                <td>
                    ${game.i18n.localize("ModularFate.RecoveryType")}:
                </td>
                <td>
                    <select id = "recovery_type"><option selected="selected">${game.i18n.localize("ModularFate.Fleeting")}</option><option>${game.i18n.localize("ModularFate.Sticky")}</option><option>${game.i18n.localize("ModularFate.Lasting")}</option></Select>
                </td>
            </tr>
            <tr>
                <td>
                    ${game.i18n.localize("ModularFate.AspectWhenMarked")}:
                </td>
                <td>
                     <input id = "aspect_when_marked" type="checkbox">
                </td>
            </tr>
            <tr>
                <td>
                    ${game.i18n.localize("ModularFate.AspectAsName?")}
                </td>
                <td>
                    <input id = "aspect_as_name" type="checkbox"></input>
                </td>
            </tr>
            <tr>
                <td>
                ${game.i18n.localize("ModularFate.Boxes")}:
                </td>
                <td>
                    <input id = "boxes" type="number" min = "0" value="0">
                <td>
            </tr>
            <tr>
            <td>
                ${game.i18n.localize("ModularFate.BoxLabels")}:
            </td>
            <td>
                <select id="player_track_label_select" style="color:black; background:white;" >
                    <option value="escalating">
                        ${game.i18n.localize("ModularFate.Escalating")}
                    </option>
                    <option value="custom">
                        ${game.i18n.localize("ModularFate.Custom")}
                    </option>
                    <option selected="selected" value="${game.i18n.localize("ModularFate.none")}">
                        ${game.i18n.localize("ModularFate.None")}
                    </option>
                </select>
                <input type="text" id="player_track_custom_label" maxlength="1" minlength="1" title="${game.i18n.localize("ModularFate.EnterASingleCharacter")}" style="color:black; background:white; width:50px"/>
            </td>
        </tr>
            <tr>
                <td>
                    ${game.i18n.localize("ModularFate.Harm")}:
                </td>
                <td>
                    <input id = "harm" type="number" min = "0" value="0">
                </td>
            </tr>
            <tr>
                <td>
                    ${game.i18n.localize("ModularFate.WhenMarked")}
                </td>
                <td>
                    <input id="when_marked" type="text"></input>
                </td>
            </tr>
            <tr>
                <td>
                    ${game.i18n.localize("ModularFate.HowRecover")}
                </td>
                <td>
                    <input id="recovery_conditions" type="text"></input>
                </td>
            </tr>
            <tr>
                <td>
                    ${game.i18n.localize("ModularFate.LinkedSkills")}:
                </td>
                <td>
                    ${game.i18n.localize("ModularFate.AdHocTracksDoNotUseLinkedSkills")}
            </tr>
        </table>`

        new Dialog({
            title: game.i18n.localize("ModularFate.AdHocTrackEditor"),
            content: content,
            buttons: {
                ok: {
                    label: game.i18n.localize("ModularFate.Save"),
                    callback: (html) => {
                        //Todo: code to save goes here;
                        let newTrack = {};
                        newTrack.category=html.find("select[id='category']")[0].value;
                        newTrack.name=html.find("input[id='name']")[0].value.split(".").join("․");
                        newTrack.description= html.find("input[id='description']")[0].value;
                        newTrack.universal= false; 
                        newTrack.unique = html.find("input[id='unique']")[0].checked;
                        newTrack.aspect = {};
                        newTrack.aspect.name = "";
                        newTrack.enabled=true;
                        newTrack.when_marked = html.find("input[id='when_marked']")[0].value;
                        newTrack.recovery_conditions = html.find("input[id='recovery_conditions']")[0].value;
                        newTrack.recovery_type = html.find("select[id='recovery_type']")[0].value;
                        newTrack.harm_can_absorb=parseInt(html.find("input[id='harm']")[0].value);
                        newTrack.aspect.when_marked = html.find("input[id='aspect_when_marked']")[0].checked;
                        newTrack.aspect.as_name = html.find("input[id='aspect_as_name']")[0].checked;
                        newTrack.boxes = parseInt(html.find("input[id='boxes']")[0].value);
                        let box_values = []
                        for (let i = 0; i < newTrack.boxes; i++){
                            box_values.push(false);
                        }
                        newTrack.box_values = box_values;
                        let label = html.find("select[id='player_track_label_select']")[0].value;
                        if (label == "custom"){
                            let val = html.find("input[id='player_track_custom_label']")[0].value;
                            if (val != "" && val != undefined){
                                label = val;
                            } else {
                                label = "";
                            }
                        }
                        newTrack.label = label;

                        newTrack.toCopy=true;
                        this.tracks_by_category[newTrack.category][newTrack.name]=newTrack;
                        this.render(false);
                    }
                }
            },
            default:"ok",
        },
        {
            width:500,
            height:"auto",
        }).render(true);

    }
    
    async _numChange (event, html){
        let name = event.target.id.split("_")[0]
        this.tracks_by_category[this.selected_category][name].number = parseInt(event.target.value);
    }

    async _check(event, html){
        let name = event.target.id;
        this.tracks_by_category[this.selected_category][name].toCopy=event.target.checked;
        //The copy/don't copy checkbox overrides this; we only needed the present checkbox when we initialised.
        delete this.tracks_by_category[this.selected_category][name].present;
    }

    async _save(event, html){
        //Work out which tracks in tracks_by_category are being added, and which deleted
        //We'll do this by finding the existing tracks in current working object and copying them to a new working object ready for output.

        let input = {};
        let output = {};

        //Let's flatten tracks_by_category first.
        for (let c in this.tracks_by_category){
            for (let t in this.tracks_by_category[c]){
                input[t]=this.tracks_by_category[c][t];
            }
        }
     
        //Copy each CHECKED track from input to output; but if it already exists in this.tracks we need to copy the version from that instead.
        //We also need to create multiple copies if there's a number in the number box. Each copy of the track needs to have a unique name.
        for (let t in input)
        {    
            let number = input[t].number;
            if (this.tracks[t]!=undefined){ //If this exists in the player's current track list
                if (input[t].toCopy == true  || input[t].present == true) { //If the track is selected in the editor)
                    this.tracks[t].enabled=true;
                    output[t]=this.tracks[t]; //Write this track to the output object.
                    //If this is non-unique and the number >1, we need to add more copies if there aren't already enough copies.
                    //To manage this, we'll set a 'parent' attribute on copies that gives the name of the original track.

                    if (number > 1){
                        let numCopies = 1;
                        for (let t in this.tracks){
                            if ( this.tracks[t].parent==t){
                                numCopies ++;
                            }
                        }
                        //Copy from the input array rather than the current array as this is a new track.
    
                        if (numCopies < number){
                            for (let i = 0; i < number - numCopies; i++){
                                let dupeTrack = duplicate(input[t]);
                                dupeTrack.parent = t;
                                let name = dupeTrack.name;
                                dupeTrack.name = dupeTrack.name+" "+(i+2)
                                await this.prepareTrack(dupeTrack);
                                output[dupeTrack.name]=dupeTrack;
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
                            let dupeTrack = duplicate(input[t]);
                            if ( i == 0) {
                                
                            } else {
                                dupeTrack.parent = t;
                                dupeTrack.name = dupeTrack.name+" "+(i+1)
                            }
                            await this.prepareTrack(dupeTrack);
                            output[dupeTrack.name]=dupeTrack;
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

        await this.object.update({"data.tracks":[{"empty":"empty"}]}) //This is needed to make the game see a change in order of keys as a difference.
        await this.object.update({"data.tracks":output}); 

        ui.notifications.info(game.i18n.localize("ModularFate.CharacterTrackChangesSaved"))   
        //Initialise the actor sheet; this will automatically set up the boxes etc on tracks.
        if (this.object.type != "Extra") {
            this.sheet.initialise();
        }
        this.render(false);
    }

    async _on_sb_change(event, html){
        this.selected_category = event.target.value;
        this.render(false);
    }

    async _onMove (event, html, direction){
        let info = event.target.name.split("_");
        let category = info[0]
        let track = info[1]
        let tracks = this.tracks_by_category[category]
        tracks = ModularFateConstants.moveKey(tracks, track, direction);
        this.tracks_by_category[category]=tracks;
        this.render(false);
    }

    async _onNameField (event, html){
        let name = event.target.id.split("_")[0];
        let track;
        for (let c in this.tracks_by_category){
            let cat = this.tracks_by_category[c];
            if (cat[name] != undefined) {
                track = cat[name]
            }
        }

        let linked_skills_text =""
        if (track.linked_skills != undefined && track.linked_skills.length >0){
            for (let i = 0; i<track.linked_skills.length;i++)
            {
                let skill = track.linked_skills[i];
                linked_skills_text+=`Skill: ${skill.linked_skill}; Rank: ${skill.rank}; Boxes: ${skill.boxes}; Enables: ${skill.enables ? 'Yes':'No'}<br>`
            }
        }

        let content = 
        `<h1>${game.i18n.localize("ModularFate.DetailsFor")} ${track.name}</h1>
        <table border="1" cellpadding="4" cellspacing="4">
            <tr>
                <td width = "200px">
                    ${game.i18n.localize("ModularFate.Description")}:
                </td>
                <td>
                    ${track.description}
                </td>
            </tr>
            <tr>
                <td>
                    ${game.i18n.localize("ModularFate.Universal")}br>
                    ${game.i18n.localize("ModularFate.Unique")}<br>
                    ${game.i18n.localize("ModularFate.Paid")}<br>
                </td>
                <td>
                    ${track.universal ? game.i18n.localize("ModularFate.Yes"):game.i18n.localize("ModularFate.No")}<br>
                    ${track.unique ? game.i18n.localize("ModularFate.Yes"):game.i18n.localize("ModularFate.No")}<br>
                    ${track.paid ? game.i18n.localize("ModularFate.Yes"):game.i18n.localize("ModularFate.No")}<br>
                </td>
            </tr>
            <tr>
                <td>
                    ${game.i18n.localize("ModularFate.AspectWhenMarked")}:<br>
                    ${game.i18n.localize("ModularFate.NameAAspect?")}:<br>
                    ${game.i18n.localize("ModularFate.Boxes")}:<br>
                    ${game.i18n.localize("ModularFate.Box_Label")}:<br>
                    ${game.i18n.localize("ModularFate.Harm")}:
                </td>
                <td>
                    ${track.recovery_type}<br>
                    ${track.aspect.when_marked ? game.i18n.localize("ModularFate.Yes"):game.i18n.localize("ModularFate.No")}<br>
                    ${track.aspect.as_name ? game.i18n.localize("ModularFate.Yes"):game.i18n.localize("ModularFate.No")}<br>
                    ${track.boxes}<br>
                    ${track.label}<br>
                    ${track.harm_can_absorb}
                </td>
            </tr>
            <tr>
                <td>
                    ${game.i18n.localize("ModularFate.WhenMarked")}:
                </td>
                <td>
                    ${track.when_marked}
                </td>

            </tr>
            <tr>
                <td>
                    ${game.i18n.localize("ModularFate.HowRecover")}:
                </td>
                <td>
                    ${track.recovery_conditions}
                </td>
            </tr>
            <tr>
                <td>
                ${game.i18n.localize("ModularFate.LinkedSkills")}:
                </td>
                <td>
                    ${linked_skills_text}
            </tr>
        </table>`

        ModularFateConstants.awaitOKDialog(track.name, content, 1000);
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
        if (track.aspect == game.i18n.localize("ModularFate.DefinedWhenMarked")) {
            track.aspect = {};
            track.aspect.name = "";
            track.aspect.when_marked = true;
            track.aspect.as_name = false;
        }
        if (track.aspect == game.i18n.localize("aspectAsName")) {
            track.aspect = {};
            track.aspect.name = "";
            track.aspect.when_marked = true;
            track.aspect.as_name = false;
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
        
    async getData(){
        let world_tracks = await duplicate(game.settings.get("ModularFate","tracks"))
        //We need the list of track categories
        //We will use a dropdown list of categories in the editor to select which tracks are displayed

        if (this.tracks_by_category == undefined){
            this.tracks_by_category = await duplicate(game.settings.get("ModularFate","track_categories"));
             //Initialise the values from text (used in the category editor) to JSON objects (used here)
            for (let c in this.tracks_by_category){
                this.tracks_by_category[c]={};
            }
            
            //Let's get a working copy of this actor's track information. We will work with this throughout and only save it to the actor when we're finished.
            this.tracks = await duplicate(this.object.data.data.tracks);
            
            //The ones already on the player should be ticked as they already have them.DONE

            //First we add all the tracks on the player to the relevant categories in world tracks DONE
            
            try {
                    for (let t in this.tracks) {

                        if (this.tracks_by_category != undefined){
                            let track = await duplicate(this.tracks[t]);
                            track.present=true;
                            track.number=1;
                            this.tracks_by_category[track.category][t]=track;
                        }
                    }

                    let player_track_keys = Object.keys(this.tracks);
                    for (let t in world_tracks){
                        let present = player_track_keys.indexOf(t);
                        world_tracks[t].number = 1;
                        if (present < 0){
                            this.tracks_by_category[world_tracks[t].category][t]=world_tracks[t];
                        }
                    }
                } catch(error){
                    //console.log(error)
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