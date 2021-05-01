//This script is for establishing the world settings in relation to conditions,
//stress and consequences.

Hooks.once('init',async function(){
    //Let's initialise the settings at the system level.
    game.settings.register("fate-core-official","tracks",{
        name:"tracks",
        hint:game.i18n.localize("fate-core-official.TrackManagerHint"),
        scope:"world",
        config:false,
        type: Object,
        default: {}
    });
    game.settings.register("fate-core-official","track_categories",{
        name:"track categories",
        hint:game.i18n.localize("fate-core-official.TrackCategoriesHint"),
        scope:"world",
        config:false,
        type: Object,
        default:{"Combat":"Combat","Other":"Other"}
    });

    // Register the menu to setup the world's conditions etc.
    game.settings.registerMenu("fate-core-official", "TrackSetup", {
        name: game.i18n.localize("fate-core-official.SetupTracks"),
        label: game.i18n.localize("fate-core-official.Setup"),      // The text label used in the button
        hint: game.i18n.localize("fate-core-official.TrackSetupHint"),
        type: TrackSetup,   // A FormApplication subclass which should be created
        restricted: true    // Restrict this submenu to gamemaster only?
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
            skills:game.settings.get("fate-core-official","skills")
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
            let tracks = game.settings.get("fate-core-official","tracks");
            let linked_skills = track.linked_skills;
    
            for (let i = 0; i< linked_skills.length; i++){
                let toCheck = `Skill: ${linked_skills[i].linked_skill}, Rank: ${linked_skills[i].rank}, Boxes: ${linked_skills[i].boxes}, Enables: ${linked_skills[i].enables}`;
                if(toCheck == toDelete){
                    linked_skills.splice(i,1);
                }
            }
            tracks[this.track.name]=this.track;
            await game.settings.set("fate-core-official","tracks",tracks);
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
            let tracks=game.settings.get("fate-core-official","tracks");
            tracks[this.track.name] = this.track
            await game.settings.set("fate-core-official","tracks",tracks);
            this.render(false);
    }
}

class EditTracks extends FormApplication {
    constructor (category){
        super(category);
        this.category = category;
        this.categories =game.settings.get("fate-core-official","track_categories");
        this.tracks = game.settings.get("fate-core-official","tracks");
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

    async _onExportTrack (event, html){
        let edit_track_name=html.find("input[id='edit_track_name']");
        let name = edit_track_name[0].value;
        if (name == "" || name == game.i18n.localize("fate-core-official.NewTrack")){
            ui.notifications.error(game.i18n.localize("fate-core-official.SelectATrackToCopyFirst"));
        }
        else {
            let track = `{"${name}":${JSON.stringify(this.tracks[name])}}`;
            new Dialog({
                title: game.i18n.localize("fate-core-official.CopyAndPasteToSaveThisTrack"), 
                content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:Montserrat; width:382px; background-color:white; border:1px solid lightsteelblue; color:black;">${track}</textarea></div>`,
                buttons: {
                },
            }).render(true);

        }
    }

    async _onCopyTrackButton (event, html){
        let edit_track_name=html.find("input[id='edit_track_name']");
        let name = edit_track_name[0].value;
        ////console.log(edit_track_name[0].value)
        if (name == "" || name == game.i18n.localize("fate-core-official.NewTrack")){
            ui.notifications.error(game.i18n.localize("fate-core-official.SelectATrackToCopyFirst"));
        }
        else {
            let track = duplicate(this.tracks[name]);
            track.name = track.name+" copy"
            this.tracks[track.name]=track;
            await game.settings.set("fate-core-official","tracks",this.tracks);
            this.render(false);
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
        let del = await fcoConstants.confirmDeletion();
        if (del){
             let name = document.getElementById("track_select").value;
            try {
                    delete this.tracks[name];
                    await game.settings.set("fate-core-official","tracks",this.tracks);
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
            let track=this.tracks[name];
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
            document.getElementById("edit_track_universal").checked=true;
            document.getElementById("edit_track_unique").checked=true;
            document.getElementById("edit_track_recovery_type").value="Fleeting";
            document.getElementById("edit_track_aspect").value="No";
            document.getElementById("edit_track_when_marked").innerHTML="";
            document.getElementById("edit_track_when_recovers").innerHTML="";
            document.getElementById("edit_track_boxes").value=0;
            document.getElementById("edit_track_harm").value=0;
            document.getElementById("edit_linked_skills").disabled=false;
            document.getElementById("edit_track_paid").checked=false;
            document.getElementById("track_label_select").value = "none";
        } else {
            let track=this.tracks[name];
            this.track=track;
            document.getElementById("edit_track_name").value=track.name;
            document.getElementById("edit_track_description").innerHTML=track.description;
            document.getElementById("edit_track_universal").checked=track.universal;
            document.getElementById("edit_track_unique").checked=track.unique;
            document.getElementById("edit_track_recovery_type").value=track.recovery_type;
            document.getElementById("edit_track_aspect").value=track.aspect;
            document.getElementById("edit_track_when_marked").innerHTML=track.when_marked;
            document.getElementById("edit_track_when_recovers").innerHTML=track.recovery_conditions;
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
        let description = document.getElementById("edit_track_description").innerHTML;
        let universal = document.getElementById("edit_track_universal").checked;
        let unique = document.getElementById("edit_track_unique").checked;
        let recovery_type = document.getElementById("edit_track_recovery_type").value;
        let aspect = document.getElementById("edit_track_aspect").value;
        let when_marked = document.getElementById("edit_track_when_marked").innerHTML;
        let when_recovers = document.getElementById("edit_track_when_recovers").innerHTML;
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
            await game.settings.set("fate-core-official","tracks",this.tracks);
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
        options.title = `${game.i18n.localize("fate-core-official.TrackCategorySetup")} ${game.world.data.title}`;
        options.closeOnSubmit = false;
        options.id = "TrackSetup"; // CSS id if you want to override default behaviors
        options.resizable = false;
        return options;
    }
    //The function that returns the data model for this window. In this case, we need the list of stress tracks
    //conditions, and consequences.
    getData(){
        this.tracks=game.settings.get("fate-core-official","tracks");
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
        const selectBox = html.find("select[id='track_categories_select']");
        const importTracks = html.find("button[id='import_tracks']");
        const exportTracks = html.find("button[id='export_tracks']");
        const orderTracks = html.find("button[id='order_tracks']");

        deleteCategoryButton.on("click", event => this._onDeleteCategoryButton(event, html));
        addCategoryButton.on("click", event => this._onAddCategoryButton(event, html));
        editTracksButton.on("click", event => this._onEditTracksButton(event, html));
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
        let tracks = game.settings.get("fate-core-official","tracks");
        let tracks_text = JSON.stringify(tracks);
     
        new Dialog({
            title: game.i18n.localize("fate-core-official.CopyAndPasteToSaveWorldTracks"),
            content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:Montserrat; width:382px; background-color:white; border:1px solid lightsteelblue; color:black;">${tracks_text}</textarea></div>`,
            buttons: {
            },
        }).render(true);    
    }

    async getTracks(){
        return new Promise(resolve => {
            new Dialog({
                title: game.i18n.localize("fate-core-official.PasteToReplaceWorldTracks"),
                content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:Montserrat; width:382px; background-color:white; border:1px solid lightsteelblue; color:black;" id="itracks"></textarea></div>`,
                buttons: {
                    ok: {
                        label: game.i18n.localize("Save"),
                        callback: () => {
                            resolve (document.getElementById("itracks").value);
                        }
                    }
                },
            }).render(true)
        });
    }

    async _importTracks(event, html){
        let text = await this.getTracks();
        try {
            let imported_tracks = JSON.parse(text);
            let tracks = duplicate(game.settings.get("fate-core-official","tracks"));
            let track_categories = duplicate (game.settings.get("fate-core-official", "track_categories"));
            if (tracks == undefined){
                tracks = {};
            }
            for (let track in imported_tracks){
                tracks[track]=imported_tracks[track];
                let cat = imported_tracks[track].category;
                track_categories[cat]=cat;
            }
            await game.settings.set("fate-core-official","tracks", tracks);
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
                track_categories[category]=category;
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
                            ui.notifications.error(`${game.i18n.localize("fate-core-official.CannotDeleteThe")} ${category} ${game.i18n.localize("fate-core-official.CategoryThatCannotDelete")}`)
                        } else {
                                    delete track_categories[cat];
                                }
                        } 
                }
                await game.settings.set("fate-core-official","track_categories",track_categories);
                this.render(false);
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
        let tracks = game.settings.get("fate-core-official", "tracks");
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
        options.title = `${game.i18n.localize("fate-core-official.OrderTracksTitle")} ${game.world.data.title}`;
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

        ot_save.on("click", event => {
            let tracks = {};
            for (let i = 0; i < this.data.length; i++){
                tracks[this.data[i].name] = this.data[i];
            }
            game.settings.set("fate-core-official", "tracks", tracks);
            this.close();
        })
    }
}
