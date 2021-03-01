Hooks.once('init', async function () {
    //On init, we initialise all settings and settings menus for dealing with skills 
    //We will be using this setting to store the world's list of skills.
    game.settings.register("ModularFate", "skills", {
        name: "Skill list",
        hint: "This is the list of skills for this particular world.",
        scope: "world",
        config: false,
        type: Object,
        default:{}
    });

        //Register a setting for the game's current skill total
        game.settings.register("ModularFate", "skillTotal", {
            name: game.i18n.localize("ModularFate.SkillPointTotal"),
            hint: game.i18n.localize("ModularFate.SkillPointTotalHint"),
            scope: "world",
            config: true,
            type: Number,
            restricted:true,
            default:20,
        });

    game.settings.register("ModularFate","freeStunts", {
        name:game.i18n.localize("ModularFate.FreeStunts"),
        hint:game.i18n.localize("ModularFate.FreeStuntsHint"),
        scope:"world",
        config:true,
        type:Number,
        restricted:true,
        default:3
    })

    game.settings.register("ModularFate","enforceColumn", {
        name: game.i18n.localize("ModularFate.EnforceColumn"),
        hint: game.i18n.localize("ModularFate.EnforceColumnHint"),
        scope:"world",
        config:true,
        type: Boolean,
        restricted:true,
        default:true
    })

    game.settings.register("ModularFate","enforceSkillTotal", {
        name: game.i18n.localize("ModularFate.EnforceSkillTotal"),
        hint: game.i18n.localize("ModularFate.EnforceSkillTotalHint"),
        scope:"world",
        config:true,
        type: Boolean,
        restricted:true,
        default:true
    })

    // Register a setting for replacing the existing skill list with one of the pre-defined default sets.
    game.settings.register("ModularFate", "defaultSkills", {
        name: game.i18n.localize("ModularFate.ReplaceSkills"),
        hint: game.i18n.localize("ModularFate.ReplaceSkillsHint"),
        scope: "world",     // This specifies a client-stored setting
        config: true,        // This specifies that the setting appears in the configuration view
        type: String,
        restricted:true,
        choices: {           // If choices are defined, the resulting setting will be a select menu
            "nothing":game.i18n.localize("ModularFate.No"),
            "fateCore":game.i18n.localize("ModularFate.YesFateCore"),
            "fateCondensed":game.i18n.localize("ModularFate.YesFateCondensed"),
            "accelerated":game.i18n.localize("ModularFate.YesFateAccelerated"),
            "dfa":game.i18n.localize("ModularFate.YesDFA"),
            "clearAll":game.i18n.localize("ModularFate.YesClearAll")
        },
        default: "nothing",        // The default value for the setting
        onChange: value => { // A callback function which triggers when the setting is changed
                if (value == "fateCore"){
                    if (game.user.isGM){
                        game.settings.set("ModularFate","skills",game.i18n.localize("ModularFate.FateCoreDefaultSkills"));
                        game.settings.set("ModularFate","defaultSkills","nothing");
                    }
                }
                if (value=="clearAll"){
                    if (game.user.isGM) {
                        game.settings.set("ModularFate","skills",{});
                    }
                }
                if (value=="fateCondensed"){
                    if (game.user.isGM){ 
                        game.settings.set("ModularFate","skills",game.i18n.localize("ModularFate.FateCondensedDefaultSkills"));
                        game.settings.set("ModularFate","defaultSkills","nothing");
                    }
                }
                if (value=="accelerated"){
                    if (game.user.isGM){
                        game.settings.set("ModularFate","skills",game.i18n.localize("ModularFate.FateAcceleratedDefaultSkills"));
                        game.settings.set("ModularFate","defaultSkills","nothing");
                    }
                }
                if (value=="dfa"){
                    if (game.user.isGM){
                        game.settings.set("ModularFate","skills",game.i18n.localize("ModularFate.DresdenFilesAcceleratedDefaultSkills"));
                        game.settings.set("ModularFate","defaultSkills","nothing");
                    }
                }
            }
    });

    game.settings.register("ModularFate","stunts", {
        name: "Stunts Database",
        hint:"A list of approved stunts that can be added to characters",
        scope:"world",
        config:false,
        type:Object,
        default:{}
    })

    let skill_choices = {};
    let skills = game.settings.get("ModularFate", "skills")
    
    skill_choices["None"]="None";
    skill_choices["Disable"]="Disable";
    for (let skill in skills){skill_choices[skill]=skill};

    game.settings.register("ModularFate","init_skill", {
        name:game.i18n.localize("ModularFate.initiativeSkill"),
        hint:game.i18n.localize("ModularFate.initiativeSetting"),
        "scope":"world",
        "config":true,
        "restricted":true,
        type:String,
        default:"None",
        choices:skill_choices
    })


    // Register the menu to setup the world's skill list.
    game.settings.registerMenu("ModularFate", "SkillSetup", {
        name: game.i18n.localize("ModularFate.SetupSkills"),
        label: game.i18n.localize("ModularFate.Setup"),      // The text label used in the button
        hint: game.i18n.localize("ModularFate.SetupSkillsHint"),
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

    async _updateObject(){
    }

    //Set up the default options for instances of this class
    static get defaultOptions() {
        const options = super.defaultOptions; //begin with the super's default options
        //The HTML file used to render this window
        options.template = "systems/ModularFate/templates/SkillSetup.html"; 
        options.width = "auto";
        options.height = "auto";
        options.title = `${game.i18n.localize("ModularFate.SetupSkillsTitle")} ${game.world.title}`;
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
        const exportSkill = html.find("button[id='exportSkill']");
        const importSkills = html.find("button[id='importSkills']");
        const exportSkills = html.find("button[id='exportSkills']");

        editButton.on("click", event => this._onEditButton(event, html));
        deleteButton.on("click", event => this._onDeleteButton(event, html));
        addButton.on("click", event => this._onAddButton(event, html));
        selectBox.on("dblclick", event => this._onEditButton(event, html));
        copyButton.on("click", event => this._onCopyButton(event, html));
        exportSkill.on("click", event => this._onExportSkill(event, html));
        importSkills.on("click", event => this._onImportSkills(event, html));
        exportSkills.on("click", event => this._onExportSkills(event, html));
    }
    
    //Here are the event listener functions.

    async _onExportSkill(event, html){
        let skills = game.settings.get("ModularFate","skills");
        let slb = html.find("select[id='skillListBox']")[0].value;
        let sk = skills[slb];
        let skill_text = `{"${slb}":${JSON.stringify(sk)}}`
 
        new Dialog({
            title: game.i18n.localize("ModularFate.CopyAndPasteToSaveSkill"),
            content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:Montserrat; width:382px; background-color:white; border:1px solid lightsteelblue; color:black;">${skill_text}</textarea></div>`,
            buttons: {
            },
        }).render(true);
    }

    async _onExportSkills(event, html){
        let skills = game.settings.get("ModularFate","skills");
        let skills_text = JSON.stringify(skills);
 
        new Dialog({
            title: game.i18n.localize("ModularFate.CopyAndPasteToSaveSkills"), 
            content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:Montserrat; width:382px; background-color:white; border:1px solid lightsteelblue; color:black;">${skills_text}</textarea></div>`,
            buttons: {
            },
        }).render(true);
    }

    async getSkills(){
        return new Promise(resolve => {
            new Dialog({
                title: game.i18n.localize("ModularFate.PasteSkills"),
                content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:Montserrat; width:382px; background-color:white; border:1px solid lightsteelblue; color:black;" id="import_skills"></textarea></div>`,
                buttons: {
                    ok: {
                        label: "Save",
                        callback: () => {
                            resolve (document.getElementById("import_skills").value);
                        }
                    }
                },
            }).render(true)
        });
    }

    async _onImportSkills(event, html){
        let text = await this.getSkills();
        try {
            let imported_skills = JSON.parse(text);
            let skills = duplicate(game.settings.get("ModularFate","skills"));
            if (skills == undefined){
                skills = {};
            }
            for (let skill in imported_skills){
                skills[skill]=imported_skills[skill];
            }
            await game.settings.set("ModularFate","skills", skills);
            this.render(false);
        } catch (e) {
            ui.notifications.error(e);
        }
    }

    async _onEditButton(event,html){
        //Launch the EditSkill FormApplication.
        let skills = game.settings.get("ModularFate","skills");
        let slb = html.find("select[id='skillListBox']")[0].value;
        let sk = skills[slb]
        let e = new EditSkill(sk);
        e.render(true);
    }
    async _onDeleteButton(event,html){
        let del = await ModularFateConstants.confirmDeletion();
        if (del){
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
    }
    async _onCopyButton(event,html){
        let selectBox = html.find("select[id='skillListBox']");
        let name = selectBox[0].value;
        if (name=="" || name == undefined){
            ui.notifications.error(game.i18n.localize("ModularFate.SelectASkillToCopyFirst"));
        } else {
            let skills=await game.settings.get("ModularFate", "skills");
            let skill = duplicate(skills[name]);
            name = skill.name+" "+game.i18n.localize("ModularFate.copy");
            skill.name=name;
            skills[name]=skill;
            await game.settings.set("ModularFate","skills",skills);
            this.render(true);
            try {
                this.bringToTop();
            } catch  {
                // Do nothing.
            }
        }
    }
    async _onAddButton(event,html){
        //Launch the EditSkill FormApplication.
        let e = new EditSkill(undefined);
        e.render(true);
        try {
            e.bringToTop();
        } catch  {
            // Do nothing.
        }
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
                ui.notifications.error(game.i18n.localize("ModularFate.YouCannotHaveASkillWithABlankName"))
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
        options.title = game.i18n.localize("ModularFate.SkillEditor");
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
    try {
        game.system.skillSetup.bringToTop();
    } catch  {
        // Do nothing.
    }
})
