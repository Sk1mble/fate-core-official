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
        game.settings.set("ModularFate","tracks",[]);
    }

    //Initialise the settings if they are currently empty.
    if (jQuery.isEmptyObject(game.settings.get("ModularFate","track_categories"))){
        game.settings.set("ModularFate","track_categories",["Combat","Other"]);
    }

    // Register the menu to setup the world's conditions etc.
    game.settings.registerMenu("ModularFate", "TrackSetup", {
        name: "Setup Tracks",
        label: "Setup",      // The text label used in the button
        hint: "Configure this world's stress, conditions, and consequences.",
        type: TrackSetup,   // A FormApplication subclass which should be created
        restricted: true                   // Restrict this submenu to gamemaster only?
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
        options.closeOnSubmit = true;
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
        tracks.forEach(t => {
            if (t.name.toUpperCase()==this.track.name.toUpperCase);
            let index = tracks.indexOf(t);
            if (index != undefined){
                tracks[index]=this.track;             
            }
        })
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
            let index = undefined;
            tracks.forEach(t => {
                if (t.name.toUpperCase()==this.track.name.toUpperCase);
                let index = tracks.indexOf(t);
                if (index != undefined){
                    tracks[index]=this.track;             
                }
            })
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
        this.tracks.forEach(track =>{
            if (track.category == this.category){
                tracks_of_category.push(track);
            }
        })
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
        options.width = "1000";
        options.height = "auto";
        options.title = `Track Editor`;
        options.closeOnSubmit = true;
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
        
        saveTrackButton.on("click", event => this._onSaveTrackButton(event, html));
        track_select.on("click", event => this._track_selectClick(event, html));
        edit_linked_skillsButton.on("click", event => this._edit_linked_skillsButtonClick(event,html));
        deleteTrackButton.on("click",event => this._onDeleteTrackButton(event, html));
  
        Hooks.on('closeEditTrack',async () => {
            this.render(true);
        })
    }
    //Here are the event listener functions.

    async _onDeleteTrackButton(event,html){
        let name = document.getElementById("track_select").value;
        let toDelete = this.tracks.find(t => t.name.toUpperCase() == name.toUpperCase());
        var toSplice = this.tracks.indexOf(toDelete);
        if (toSplice != -1){
            this.tracks.splice(toSplice,1);
            await game.settings.set("ModularFate","tracks",this.tracks);
            this.render(true)
        }
        else {
            ui.notifications.error("Can't delete that.")
        }
    }
    async _edit_linked_skillsButtonClick(event, html){
        let name = document.getElementById("track_select").value;
        if (name=="New Track"){
            ui.notifications.error("Please select a track before trying to add a linked skill.");
        }
        else {
            let track = this.tracks.find(track=> track.name.toUpperCase()==name.toUpperCase());
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
            let track = this.tracks.find(track=> track.name.toUpperCase()==name.toUpperCase());
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
        }
    }

    async _onSaveTrackButton(event,html){
        let name = document.getElementById("edit_track_name").value;
        let description = document.getElementById("edit_track_description").value;
        let universal = document.getElementById("edit_track_universal").checked;
        let unique = document.getElementById("edit_track_unique").checked;
        let recovery_type = document.getElementById("edit_track_recovery_type").value;
        let aspect = document.getElementById("edit_track_aspect").value;
        let when_marked = document.getElementById("edit_track_when_marked").value;
        let when_recovers = document.getElementById("edit_track_when_recovers").value;
        let boxes = parseInt(document.getElementById("edit_track_boxes").value);
        let harm = parseInt(document.getElementById("edit_track_harm").value);

        let existing = false;
        if (name == ""){
            ui.notifications.error("Name cannot be blank");
        }
        this.tracks.forEach(track =>{
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
            }
        })
        if (!existing){
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
                "harm_can_absorb":harm
            }
            this.tracks.push(newTrack);
        }
        await game.settings.set("ModularFate","tracks",this.tracks);
        this.render(true);
    }

}

//TrackSetup: The class called from the options to view and edit conditions etc.
class TrackSetup extends FormApplication{
    constructor(...args){
        super(...args);
    }
 //Set up the default options for instances of this class
    static get defaultOptions() {
        const options = super.defaultOptions; //begin with the super's default options
        //The HTML file used to render this window
        options.template = "systems/ModularFate/templates/TrackSetup.html"; 
        options.width = "auto";
        options.height = "auto";
        options.title = `Track Category Setup for world ${game.world.title}`;
        options.closeOnSubmit = true;
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

        Hooks.on('closeEditTrack',async () => {
            this.render(true);
        })
    }
    
    //Here are the event listener functions.
    async _onAddCategoryButton(event,html){
        let category = await ModularFateConstants.getInput("Choose the Category Name");
        let track_categories = game.settings.get("ModularFate","track_categories");
        var duplicate = false;
        track_categories.forEach(cat =>{
            if (cat.toUpperCase() == category.toUpperCase()){
                ui.notifications.error("Can't create duplicate category.")
                duplicate = true;
            }
        })
        if (!duplicate && category != "" && category != undefined){
            track_categories.push(category);
        }
        await game.settings.set("ModularFate","track_categories",track_categories);
        this.render(true);
    }

    async _onDeleteCategoryButton(event,html){
        let track_categories = game.settings.get("ModularFate","track_categories");
        let category  = document.getElementById("track_categories_select").value;
        console.log(category);
        for (let i = 0; i<track_categories.length; i++){
            if (track_categories[i].toUpperCase()==category.toUpperCase()){
                if (track_categories[i]=="Combat" || track_categories[i]=="Other"){
                    ui.notifications.error(`Can't delete the ${category} category as it's needed by the system.`)
                } else {
                    track_categories.splice(i,1);                    
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
/* Track setup data structure
basic description
recovery_type //fleeting, sticky, lasting. Consequences are all Lasting as they require a recovery action, but we don't need to overly concern ourselves with the difference between sticky and lasting.
aspect:(no|name_as_aspect|defined_when_marked)
when_marked_details //text that describes when and how this track is marked and what happens. If no aspect but a boost for the GM, describe that here.
recovery_conditions //text that describes how this track enters recovery and what happens
default_number_of_boxes -- technically consequences have one box that can absorb multiple stress as below. Do we use one box, or 0 boxes and count as marked when the aspect is filled?
harm_can_absorb (for the OG consequences and conditions like Wounded, which can absorb 4 stress), but don't have stress boxes
universal (boolean - true means all characters get this Track when initialised)
stress is just a specific type of fleeting condition. Clear stress becomes 'clear all fleeting tracks'.
linked_skill[{name:name, rank:number, boxes:number_of_boxes_added, enabled:true}] //use enabled if a certain skill level 'turns on' this consequence.
one_only //boolean - if true, a character can only have one track of this type. This is for situations like Wounded, where a character can have multiple of them if they buy them with refresh etc.
if aspect: = define_when_marked and default_number_of_boxes = 0, just display an aspect box rather than a checkbox for this track.

We'll use a prepareTracks function on rendering a character sheet to ensure its tracks are currently up to date with regard to the world settings.

When in use, tracks have boxes rather than default_number_of_boxes, and also have a notes field for things like tracking who Indebted is to, etc.
Combat tracks are shown on a specific section of the character sheet.
*/