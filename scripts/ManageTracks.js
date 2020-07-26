//This script is for establishing the world settings in relation to conditions,
//stress and consequences.

Hooks.once('init',async function(){
    console.log("Initializing ManageTracks");
    //Let's initialise the settings at the system level.
    game.settings.register("ModularFate","tracks",{
        name:"tracks",
        hint:"This is the list of stress tracks, conditions, and consequences for this particular world",
        scope:"world",
        config:false,
        type: Object
    });
    game.settings.register("ModularFate","track_categories",{
        name:"track categories",
        hint:"This is the list of track categories available for this world.",
        scope:"world",
        config:false,
        type: Object
    });

    //Initialise the settings if they are currently empty.
    if (jQuery.isEmptyObject(game.settings.get("ModularFate","tracks"))){
        game.settings.set("ModularFate","tracks",{});
    }

    //Initialise the settings if they are currently empty.
    if (jQuery.isEmptyObject(game.settings.get("ModularFate","track_categories"))){
        game.settings.set("ModularFate","track_categories",{Combat:"Combat",Other:"Other"});
    }

    // Register the menu to setup the world's conditions etc.
    game.settings.registerMenu("ModularFate", "TrackSetup", {
        name: "Setup Tracks",
        label: "Setup",      // The text label used in the button
        hint: "Configure this world's stress, conditions, and consequences.",
        type: TrackSetup,   // A FormApplication subclass which should be created
        restricted: true                   // Restrict this submenu to gamemaster only?
      });

     // Register a setting for replacing the existing track list with one of the pre-defined default sets.
     game.settings.register("ModularFate", "defaultTracks", {
        name: "Replace Or Clear All World Tracks?",
        hint: "Pick a track set with which to override the world's current tracks. CANNOT BE UNDONE.",
        scope: "world",     // This specifies a client-stored setting
        config: true,        // This specifies that the setting appears in the configuration view
        type: String,
        restricted:true,
        choices: {           // If choices are defined, the resulting setting will be a select menu
            "nothing":"No",
            "fateCore":"Yes - Fate Core Defaults",
            "fateCondensed":"Yes - Fate Condensed Defaults",
            "accelerated":"Yes - Fate Accelerated Defaults",
            "clearAll":"Yes - Clear All tracks"
        },
        default: "nothing",        // The default value for the setting
        onChange: value => { // A callback function which triggers when the setting is changed
                if (value == "fateCore"){
                    if (game.user.isGM){
                        game.settings.set("ModularFate","tracks",ModularFateConstants.getFateCoreTracks());
                    }
                }
                if (value=="clearAll"){
                    if (game.user.isGM){
                        game.settings.set("ModularFate","tracks",{});
                    }
                }
                if (value=="fateCondensed"){
                    if (game.user.isGM){
                        game.settings.set("ModularFate","tracks",ModularFateConstants.getFateCondensedTracks());
                    }
                }
                if (value=="accelerated"){
                    if (game.user.isGM){
                        game.settings.set("ModularFate","tracks",ModularFateConstants.getFateAcceleratedTracks());
                    }
                }
                //This menu only does something when changed, so set back to 'nothing' to avoid
                //confusing or worrying the GM next time they open this menu.
                if (game.user.isGM){
                    game.settings.set("ModularFate","defaultTracks","nothing");
                }
            }
    });
});

class EditLinkedSkills extends FormApplication {
    constructor (track){
        super(track);
        this.track=track;
    }
    getData(){
        const templateData = {
            track:this.track,
            skills:game.settings.get("ModularFate","skills")
        }
        return templateData;
    }
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "systems/ModularFate/templates/EditLinkedSkills.html"; 
    
        //Define the FormApplication's options
        options.width = "1000";
        options.height = "auto";
        options.title = `Linked Skill Editor`;
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
        let toDelete = document.getElementById("linked_skills").value;
        let track = this.track;
        let tracks = game.settings.get("ModularFate","tracks");
        let linked_skills = track.linked_skills;
    
        for (let i = 0; i< linked_skills.length; i++){
            let toCheck = `Skill: ${linked_skills[i].linked_skill}, Rank: ${linked_skills[i].rank}, Boxes: ${linked_skills[i].boxes}, Enables: ${linked_skills[i].enables}`;
            if(toCheck == toDelete){
                linked_skills.splice(i,1);
            }
        }
        tracks[this.track.name]=this.track;
        await game.settings.set("ModularFate","tracks",tracks);
        this.render(true);
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
            let tracks=game.settings.get("ModularFate","tracks");
            tracks[this.track.name] = this.track
            await game.settings.set("ModularFate","tracks",tracks);
            this.render(true);
    }
}

class EditTracks extends FormApplication {
    constructor (category){
        super(category);
        this.category = category;
        this.categories =game.settings.get("ModularFate","track_categories");
        this.tracks = game.settings.get("ModularFate","tracks");
    }

    getData(){
        let tracks_of_category = [];
        for (let t in this.tracks){
            if (this.tracks[t].category == this.category){
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
        options.template = "systems/ModularFate/templates/EditTrack.html"; 
    
        //Define the FormApplication's options
        options.width = "auto";
        options.height = "auto";
        options.title = `Track Editor`;
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

        const track_label_select = html.find("select[id='track_label_select']");
        track_label_select.on("change", event => this._on_track_label_select(event, html))
        
        saveTrackButton.on("click", event => this._onSaveTrackButton(event, html));
        track_select.on("click", event => this._track_selectClick(event, html));
        edit_track_name.on("change", event => this._edit_track_name_change(event, html));
        edit_linked_skillsButton.on("click", event => this._edit_linked_skillsButtonClick(event,html));
        deleteTrackButton.on("click",event => this._onDeleteTrackButton(event, html));
        copy_track.on("click", event => this._onCopyTrackButton(event, html));
    }
    //Here are the event listener functions.

    async _on_track_label_select(event, html){
        if (event.target.value == "custom"){
            document.getElementById("track_custom_label").hidden = false
        }
        else {
            document.getElementById("track_custom_label").hidden = true
            document.getElementById("track.custom_label").value = "";
        }
    }

    async _onCopyTrackButton (event, html){
        let edit_track_name=html.find("input[id='edit_track_name']");
        let name = edit_track_name[0].value;
        //console.log(edit_track_name[0].value)
        if (name == "" || name == "New Track"){
            ui.notifications.error("Select a track to copy first");
        }
        else {
            let track = duplicate(this.tracks[name]);
            track.name = track.name+" copy"
            this.tracks[track.name]=track;
            await game.settings.set("ModularFate","tracks",this.tracks);
            this.render(true);
        }
    }

    async _edit_track_name_change(event, html){
        let name = event.target.value.split(".").join("․").trim();
        let track = this.tracks[name];
        if (track == undefined){
            document.getElementById("edit_linked_skills").disabled=true;
        } else {
            document.getElementById("edit_linked_skills").disabled=false;
        }
    }

    async _onDeleteTrackButton(event,html){
        let name = document.getElementById("track_select").value;
        try {
                delete this.tracks[name];
                await game.settings.set("ModularFate","tracks",this.tracks);
                this.render(true);
        } catch {
            ui.notifications.error("Can't delete that.")
            this.render(true)
        }
    }
    async _edit_linked_skillsButtonClick(event, html){
        let name = document.getElementById("track_select").value;
        if (name=="New Track"){
            ui.notifications.error("Please select a track before trying to add a linked skill.");
        }
        else {
            let track=this.tracks[name];
            let linked_skill_editor = new EditLinkedSkills(track);
            linked_skill_editor.render(true);
        }
    }

    async _track_selectClick(event, html){
        let name = document.getElementById("track_select").value;
        if (name=="New Track"){
            document.getElementById("edit_track_name").value="";
            document.getElementById("edit_track_description").value="";
            document.getElementById("edit_track_when_marked").value="";
            document.getElementById("edit_track_when_recovers").value="";
            document.getElementById("edit_linked_skills").disabled=true;
            
        } else {
            let track=this.tracks[name];
            this.track=track;
            document.getElementById("edit_track_name").value=track.name;
            document.getElementById("edit_track_description").value=track.description;
            document.getElementById("edit_track_universal").checked=track.universal;
            document.getElementById("edit_track_unique").checked=track.unique;
            document.getElementById("edit_track_recovery_type").value=track.recovery_type;
            document.getElementById("edit_track_aspect").value=track.aspect;
            document.getElementById("edit_track_when_marked").value=track.when_marked;
            document.getElementById("edit_track_when_recovers").value=track.recovery_conditions;
            document.getElementById("edit_track_boxes").value=track.boxes;
            document.getElementById("edit_track_harm").value=track.harm_can_absorb;
            document.getElementById("edit_linked_skills").disabled=false;
            document.getElementById("edit_track_paid").checked=track.paid;
            
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
        let name = document.getElementById("edit_track_name").value.split(".").join("․").trim();
        let description = document.getElementById("edit_track_description").value;
        let universal = document.getElementById("edit_track_universal").checked;
        let unique = document.getElementById("edit_track_unique").checked;
        let recovery_type = document.getElementById("edit_track_recovery_type").value;
        let aspect = document.getElementById("edit_track_aspect").value;
        let when_marked = document.getElementById("edit_track_when_marked").value;
        let when_recovers = document.getElementById("edit_track_when_recovers").value;
        let boxes = parseInt(document.getElementById("edit_track_boxes").value);
        let harm = parseInt(document.getElementById("edit_track_harm").value);
        let paid = document.getElementById("edit_track_paid").checked;
        let label = document.getElementById("track_label_select").value;
        let custom_label = document.getElementById("track_custom_label").value;
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
                }
            }
            if (!existing){
                if (this.track != undefined){
                    if (this.track.linked_skills != undefined){
                        linked_skills = duplicate(this.track.linked_skills);
                    }
                    delete this.tracks[this.track.name]
                }
                let newTrack = {
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
                    "label":label
                }
                this.tracks[name]=newTrack;
            }
            await game.settings.set("ModularFate","tracks",this.tracks);
            this.render(true);
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
        options.template = "systems/ModularFate/templates/TrackSetup.html"; 
        options.width = "auto";
        options.height = "auto";
        options.title = `Track Category Setup for world ${game.world.title}`;
        options.closeOnSubmit = false;
        options.id = "TrackSetup"; // CSS id if you want to override default behaviors
        options.resizable = false;
        return options;
    }
    //The function that returns the data model for this window. In this case, we need the list of stress tracks
    //conditions, and consequences.
    getData(){
        this.tracks=game.settings.get("ModularFate","tracks");
        this.track_categories=game.settings.get("ModularFate","track_categories")

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
        const selectBox = html.find("select[id='track_categories_select']");

        deleteCategoryButton.on("click", event => this._onDeleteCategoryButton(event, html));
        addCategoryButton.on("click", event => this._onAddCategoryButton(event, html));
        editTracksButton.on("click", event => this._onEditTracksButton(event, html));
        selectBox.on("dblclick", event => this._onEditTracksButton(event,html));
    }
    
    //Here are the event listener functions.
    async _onAddCategoryButton(event,html){
        let category = await ModularFateConstants.getInput("Choose the Category Name");
        let track_categories = game.settings.get("ModularFate","track_categories");
        var duplicate = false;

        for (let cat in track_categories){
            if (track_categories[cat].toUpperCase == category.toUpperCase()){
                ui.notifications.error("Can't create duplicate category.")
                duplicate = true;
            }
            if (!duplicate && category != "" && category != undefined){
                track_categories[category]=category;
            }
            await game.settings.set("ModularFate","track_categories",track_categories);
            this.render(true);
        }
    }

    async _onDeleteCategoryButton(event,html){
        let track_categories = game.settings.get("ModularFate","track_categories");
        let category  = document.getElementById("track_categories_select").value;

        for (let cat in track_categories){
            if (track_categories[cat].toUpperCase() == category.toUpperCase()){
                if (track_categories[cat]=="Combat" || track_categories[cat]=="Other"){
                    ui.notifications.error(`Can't delete the ${category} category as it's needed by the system.`)
                } else {
                    delete track_categories[cat];
                }
            } 
        }
    
        await game.settings.set("ModularFate","track_categories",track_categories);
        this.render(true);
    }
    
    async _onEditTracksButton(event,html){
        let category = html.find("select[id='track_categories_select']")[0].value;
        if (category !="" && category != undefined){
            let track_editor = new EditTracks(category);
            track_editor.render(true);
        } else {
            ui.notifications.error(`Please select a category first.`)
        }
    }
}

Hooks.on('closeEditTracks',async () => {
    game.system.manageTracks.render(true);
})
