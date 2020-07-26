Hooks.once('init', async function () {
    //On init, we initialise all settings and settings menus for dealing with skills 
    console.log(`Initializing ManageSkills`);

    //We will be using this setting to store the world's list of skills.
    game.settings.register("ModularFate", "skills", {
        name: "Skill list",
        hint: "This is the list of skills for this particular world.",
        scope: "world",
        config: false,
        type: Object
    });
    //Initialise the setting if it is currently empty.
    if (jQuery.isEmptyObject(game.settings.get("ModularFate","skills"))){
        game.settings.set("ModularFate","skills",{});
    }

        //Register a setting for the game's current skill total
        game.settings.register("ModularFate", "skillTotal", {
            name: "Skill Point Total",
            hint: "This is the current skill total for characters in this world.",
            scope: "world",
            config: true,
            type: Number,
            restricted:true
        });
        //Initialise if not yet set
        if (isNaN(game.settings.get("ModularFate","skillTotal"))){
            game.settings.set("ModularFate","skillTotal",20);
        }

    game.settings.register("ModularFate","freeStunts", {
        name:"Free Stunts",
        hint:"How many free stunts do characters start with?",
        scope:"world",
        config:true,
        type:Number,
        restricted:true,
        default:3
    })

    game.settings.register("ModularFate","enforceColumn", {
        name: "Enforce Column?",
        hint: "Should the player skill editor enforce a skill column?",
        scope:"world",
        config:true,
        type: Boolean,
        restricted:true
    })

    game.settings.register("ModularFate","enforceSkillTotal", {
        name: "Enforce skill total?",
        hint: "Should the player skill editor ensure points spent are under the game's skill total??",
        scope:"world",
        config:true,
        type: Boolean,
        restricted:true
    })

    // Register a setting for replacing the existing skill list with one of the pre-defined default sets.
    game.settings.register("ModularFate", "defaultSkills", {
        name: "Replace Or Clear All World Skills?",
        hint: "Pick a skill set with which to override the world's current skills. CANNOT BE UNDONE.",
        scope: "world",     // This specifies a client-stored setting
        config: true,        // This specifies that the setting appears in the configuration view
        type: String,
        restricted:true,
        choices: {           // If choices are defined, the resulting setting will be a select menu
            "nothing":"No",
            "fateCore":"Yes - Fate Core Defaults",
            "fateCondensed":"Yes - Fate Condensed Defaults",
            "accelerated":"Yes - Fate Accelerated Defaults",
            "clearAll":"Yes - Clear All Skills"
        },
        default: "nothing",        // The default value for the setting
        onChange: value => { // A callback function which triggers when the setting is changed
                if (value == "fateCore"){
                    if (game.user.isGM){
                        game.settings.set("ModularFate","skills",ModularFateConstants.getFateCoreDefaultSkills());
                    }
                }
                if (value=="clearAll"){
                    if (game.user.isGM) {
                        game.settings.set("ModularFate","skills",{});
                    }
                }
                if (value=="fateCondensed"){
                    if (game.user.isGM){ 
                        game.settings.set("ModularFate","skills",ModularFateConstants.getFateCondensedDefaultSkills());
                    }
                }
                if (value=="accelerated"){
                    if (game.user.isGM){
                        game.settings.set("ModularFate","skills",ModularFateConstants.getFateAcceleratedDefaultSkills());
                    }
                }
                //This menu only does something when changed, so set back to 'nothing' to avoid
                //confusing or worrying the GM next time they open this menu.
                if (game.user.isGM){ 
                    game.settings.set("ModularFate","defaultSkills","nothing");
                }
            }
    });

    // Register the menu to setup the world's skill list.
    game.settings.registerMenu("ModularFate", "SkillSetup", {
        name: "Setup Skills",
        label: "Setup",      // The text label used in the button
        hint: "Configure this world's skill (or Approach) list.",
        type: SkillSetup,   // A FormApplication subclass which should be created
        restricted: true                   // Restrict this submenu to gamemaster only?
      });
});

// SkillSetup: This is the class called from the options to view and edit the skills.
class SkillSetup extends FormApplication{
    constructor(...args){
            super(...args);
            game.system.skillSetup = this;
    }

    _updateObject(){
    }

    //Set up the default options for instances of this class
    static get defaultOptions() {
        const options = super.defaultOptions; //begin with the super's default options
        //The HTML file used to render this window
        options.template = "systems/ModularFate/templates/SkillSetup.html"; 
        options.width = "auto";
        options.height = "auto";
        options.title = `Setup Skills for world ${game.world.title}`;
        options.closeOnSubmit = false;
        options.id = "SkillSetup"; // CSS id if you want to override default behaviors
        options.resizable = false;
        return options;
    }
    //The function that returns the data model for this window. In this case, we only need the game's skill list.
    getData(){
        this.skills=ModularFateConstants.sortByKey(game.settings.get("ModularFate","skills"))
        const templateData = {
           skills:this.skills
        }
        return templateData;
    }
    
      //Here are the action listeners
      activateListeners(html) {
        super.activateListeners(html);
        const editButton = html.find("button[id='editSkill']");
        const deleteButton = html.find("button[id='deleteSkill']");
        const addButton = html.find("button[id='addSkill']");
        const copyButton = html.find("button[id='copySkill']");
        const selectBox = html.find("select[id='skillListBox']");

        editButton.on("click", event => this._onEditButton(event, html));
        deleteButton.on("click", event => this._onDeleteButton(event, html));
        addButton.on("click", event => this._onAddButton(event, html));
        selectBox.on("dblclick", event => this._onEditButton(event, html));
        copyButton.on("click", event => this._onCopyButton(event, html));
    }
    
    //Here are the event listener functions.
    async _onEditButton(event,html){
        //Launch the EditSkill FormApplication.
        let skills = game.settings.get("ModularFate","skills");
        let slb = html.find("select[id='skillListBox']")[0].value;
        let sk = skills[slb]
        let e = new EditSkill(sk);
        e.render(true);
    }
    async _onDeleteButton(event,html){
        //Code to delete the selected skill
        //First, get the name of the skill from the HTML element skillListBox
        let slb = html.find("select[id='skillListBox'")[0].value;
        
        //Find that skill in the list of skills
        let skills=game.settings.get("ModularFate","skills");
        if (skills[slb] != undefined){
            delete skills[slb];
            await game.settings.set("ModularFate","skills",skills);
            this.render(true);
        }
    }
    async _onCopyButton(event,html){
        let selectBox = html.find("select[id='skillListBox']");
        let name = selectBox[0].value;
        if (name=="" || name == undefined){
            ui.notifications.error("Select a skill to copy first");
        } else {
            let skills=await game.settings.get("ModularFate", "skills");
            let skill = duplicate(skills[name]);
            name = skill.name+" copy";
            skill.name=name;
            skills[name]=skill;
            await game.settings.set("ModularFate","skills",skills);
            this.render(true);
        }
    }
    async _onAddButton(event,html){
        //Launch the EditSkill FormApplication.
        let e = new EditSkill(undefined);
        e.render(true);
    }
}

//EditSkill: This is the class to edit a specific skill
class EditSkill extends FormApplication{
    constructor(skill){
            super(skill);
            this.skill=skill;
            if (this.skill==undefined){
                this.skill={
                    "name":"",
                    "description":"",
                    "overcome":"",
                    "caa":"",
                    "attack":"",
                    "defend":"",
                    "pc":"true"
                }
            }
        }

        async _updateObject(event, f) {
            let skills=game.settings.get("ModularFate","skills");
            let name = f.name.split(".").join("․").trim();
            let newSkill = {"name":name, "description":f.description,"overcome":f.overcome,"caa":f.caa, "attack":f.attack,"defend":f.defend,"pc":f.pc};
            var existing = false;
            //First check if we already have a skill by that name, or the skill is blank; if so, throw an error.
            if (name == undefined || name ==""){
                ui.notifications.error("You cannot have a skill with a blank name.")
            } else {
                if (skills[name] != undefined){
                    skills[name]=newSkill;
                    existing = true;
                }
            }
            if (!existing){  
                if (this.skill.name != ""){
                    //That means the name has been changed. Delete the original aspect and replace it with this one.
                    delete skills[this.skill.name]
                }                      
                skills[name]=newSkill;
            }
            await game.settings.set("ModularFate","skills",skills);
        }

    //Here are the action listeners
    activateListeners(html) {
        super.activateListeners(html);
        const saveButton = html.find("button[id='edit_save_changes']");
        saveButton.on("click", event => this._onSaveButton(event, html));
    }
        
    //Here are the event listener functions.
    async _onSaveButton(event,html){
        this.submit();
    }    

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "systems/ModularFate/templates/EditSkill.html"; 
    
        //Define the FormApplication's options
        options.width = "1000";
        options.height = "auto";
        options.title = `Skill Editor`;
        options.closeOnSubmit = true;
        options.id = "EditSkill"; // CSS id if you want to override default behaviors
        options.resizable = true;
        return options;
    }
    getData(){
        const templateData = {
           skill:this.skill
        }
        return templateData;
        }
}

Hooks.on('closeEditSkill',async () => {
    game.system.skillSetup.render(true);
})
