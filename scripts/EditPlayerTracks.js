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

        //await this.object.update({"data.tracks":this.working_tracks}); 
    }

    activateListeners(html) {
        super.activateListeners(html);
        const select_box = html.find("select[id='select_box");
        select_box.on("change", event => this._on_sb_change(event, html));
        //const skillButtons = html.find("button[class='skill_button']");
        //skillButtons.on("click", event => this._onSkillButton(event, html));
        //skillButtons.on("click", event => this._onSkillButton(event, html));
        //async _onSortButton(event, html){
        //}
        
        Hooks.on("renderModularFateCharacter",(app, html, data)=> {
            this.render(false);
        });   
    } //End activateListeners

    // Here are the action functions
    async _on_sb_change(event, html){
        this.selected_category = event.target.value;
        this.render(false);
    }
        
    async getData(){
        console.log(this.selected_category)
        //We need the list of track categories
        //We will use a dropdown list of categories in the editor to select which tracks are displayed
        //There will also be a 'universal' category that shows all universal tracks regardless of category.
        let tracks_by_category = duplicate(game.settings.get("ModularFate","track_categories"));
        let world_tracks = duplicate(game.settings.get("ModularFate","tracks"))

        //Initialise the values from text (used in the category editor) to JSON objects (used here)
        for (let c in tracks_by_category){
            tracks_by_category[c]={};
        }
        
        //Let's get a working copy of this actor's track information. We will work with this throughout and only save it to the actor when we're finished.
        this.tracks = duplicate(this.object.data.data.tracks);
        
        //The ones already on the player should be ticked as they already have them.DONE

        //First we add all the tracks on the player to the relevant categories in world tracks DONE
        
        for (let t in this.tracks) {
            let track = duplicate(this.tracks[t]);
            track["present"]=true;
            tracks_by_category[this.tracks[t].category][t]=track;
        }

        let player_track_keys = Object.keys(this.tracks);
        for (let t in world_tracks){
            let present = player_track_keys.indexOf(t);
            if (present < 0){
                tracks_by_category[world_tracks[t].category][t]=world_tracks[t];
            }
        }

        //TemplateData is returned to the form for use with HandleBars.
        const templateData = {
                tracks_by_category:tracks_by_category,
                GM:game.user.isGM,
                character_tracks:this.tracks,
                cat:this.selected_category
        }
        return templateData;
    } //End getData
} //End EditPlayerTracks