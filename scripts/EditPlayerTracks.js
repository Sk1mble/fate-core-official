class EditPlayerTracks extends FormApplication {
    constructor(...args){
        super(...args);
        //This is a good place to set up some variables at the top level so we can access them with this.
        if (this.object.isToken) {
            this.options.title=`Character track editor for [Token] ${this.object.name}`
        } else {
            this.options.title=`Character track editor for ${this.object.name}`
        }
        this.selected_category = "";
        this.tracks_by_category = undefined;

        Hooks.on("renderModularFateCharacter",(app, html, data)=> {
            this.render(false);
        });   
    } //End constructor

    static get defaultOptions(){
        const options = super.defaultOptions;
        options.template = "systems/ModularFate/templates/EditPlayerTracks.html";
        options.width = "auto";
        options.height = "auto";
        options.title = `Character track editor`;
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

    activateListeners(html) {
        super.activateListeners(html);
        const select_box = html.find("select[id='select_box");
        select_box.on("change", event => this._on_sb_change(event, html));
       
        const nameField = html.find("td[name='nameField']");
        nameField.on("click", event => this._onNameField (event,html));
        const moveUp = html.find("button[id='move_up']");
        moveUp.on("click", event => this._onMove (event, html, -1));
        const moveDown = html.find("button[id='move_down']");
        moveDown.on("click", event => this._onMove (event, html, 1));
        const save = html.find("button[id='save]");
        save.on("click", event => this._save(event, html))
        const ad_hoc = html.find("button[id='ad_hoc']");
        const checkboxes = html.find("input[type='checkbox']");
        const numberbox = html.find("input[type='number']");
    } //End activateListeners

    // Here are the action functions

    async _save(event, html){
        // Step 1, 
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
        console.log(this.tracks_by_category)
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
        `<h1>Details for ${track.name}</h1>
        <table border="1" cellpadding="4" cellspacing="4">
            <tr>
                <td width = "200px">
                    Description:
                </td>
                <td>
                    ${track.description}
                </td>
            </tr>
            <tr>
                <td>
                    Universal?<br>
                    Unique?<br>
                    Paid?<br>
                </td>
                <td>
                    ${track.universal ? 'Yes':'No'}<br>
                    ${track.unique ? 'Yes':'No'}<br>
                    ${track.paid ? 'Yes':'No'}<br>
                </td>
            </tr>
            <tr>
                <td>
                    Recovery Type:<br>
                    Aspect when marked?:<br>
                    Aspect as name?:<br>
                    Boxes:<br>
                    Harm:
                </td>
                <td>
                    ${track.recovery_type}<br>
                    ${track.aspect.when_marked ? 'Yes':'No'}<br>
                    ${track.aspect.as_name ? 'Yes' : 'No'}<br>
                    ${track.boxes}<br>
                    ${track.harm_can_absorb}
                </td>
            </tr>
            <tr>
                <td>
                    When is it marked?
                </td>
                <td>
                    ${track.when_marked}
                </td>

            </tr>
            <tr>
                <td>
                    How does it recover?
                </td>
                <td>
                    ${track.recovery_conditions}
                </td>
            </tr>
            <tr>
                <td>
                    Linked skills:
                </td>
                <td>
                    ${linked_skills_text}
            </tr>
        </table>`

        ModularFateConstants.awaitOKDialog(track.name, content, 1000);
        console.log(track);
    }
        
    async getData(){
        console.log(this.selected_category);
        let world_tracks = duplicate(game.settings.get("ModularFate","tracks"))
        //We need the list of track categories
        //We will use a dropdown list of categories in the editor to select which tracks are displayed

        if (this.tracks_by_category == undefined){
            this.tracks_by_category = duplicate(game.settings.get("ModularFate","track_categories"));
             //Initialise the values from text (used in the category editor) to JSON objects (used here)
            for (let c in this.tracks_by_category){
                this.tracks_by_category[c]={};
            }
            
            //Let's get a working copy of this actor's track information. We will work with this throughout and only save it to the actor when we're finished.
            this.tracks = duplicate(this.object.data.data.tracks);
            
            //The ones already on the player should be ticked as they already have them.DONE

            //First we add all the tracks on the player to the relevant categories in world tracks DONE
            
            for (let t in this.tracks) {
                let track = duplicate(this.tracks[t]);
                track["present"]=true;
                this.tracks_by_category[this.tracks[t].category][t]=track;
            }

            let player_track_keys = Object.keys(this.tracks);
            for (let t in world_tracks){
                let present = player_track_keys.indexOf(t);
                if (present < 0){
                    this.tracks_by_category[world_tracks[t].category][t]=world_tracks[t];
                }
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