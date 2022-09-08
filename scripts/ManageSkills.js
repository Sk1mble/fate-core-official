Hooks.once('ready', async function () {
    let defaultLabel = game.i18n.localize("fate-core-official.defaultSkillsLabel");
    game.settings.register("fate-core-official", "skillsLabel", {
        name: game.i18n.localize("fate-core-official.SkillsLabelName"),
        hint: game.i18n.localize("fate-core-official.SkillsLabelHint"),
        scope: "world",     // This specifies a client-stored setting.
        config: false,      // This specifies that the setting does not appear in the configuration view.
        type: String,
        restricted:true,
        default: defaultLabel,
      });
})

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
        options.template = "systems/fate-core-official/templates/SkillSetup.html"; 
        options.width = "auto";
        options.height = "auto";
        options.title = `${game.i18n.localize("fate-core-official.SetupSkillsTitle")} ${game.world.title}`;
        options.closeOnSubmit = false;
        options.id = "SkillSetup"; // CSS id if you want to override default behaviors
        options.resizable = false;
        return options;
    }
    //The function that returns the data model for this window. In this case, we only need the game's skill list.
    getData(){
        this.skills=fcoConstants.sortByKey(game.settings.get("fate-core-official","skills"))
        this.skills_label = game.settings.get("fate-core-official", "skillsLabel");
        const templateData = {
           skills: this.skills,
           skills_label: this.skills_label, 
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
        const skillsLabelEdit = html.find('#skillsLabelEdit');

        editButton.on("click", event => this._onEditButton(event, html));
        deleteButton.on("click", event => this._onDeleteButton(event, html));
        addButton.on("click", event => this._onAddButton(event, html));
        selectBox.on("dblclick", event => this._onEditButton(event, html));
        copyButton.on("click", event => this._onCopyButton(event, html));
        exportSkill.on("click", event => this._onExportSkill(event, html));
        importSkills.on("click", event => this._onImportSkills(event, html));
        exportSkills.on("click", event => this._onExportSkills(event, html));
        skillsLabelEdit.on("click", event => this._onLabelEdit(event, html, skillsLabelEdit));
    }
    
    //Here are the event listener functions.

    async _onExportSkill(event, html){
        let skills = game.settings.get("fate-core-official","skills");
        let slb = html.find("select[id='skillListBox']")[0].value;
        let sk = skills[slb];
        let skill_text = `{"${slb}":${JSON.stringify(sk, null, 5)}}`
 
        new Dialog({
            title: game.i18n.localize("fate-core-official.CopyAndPasteToSaveSkill"),
            content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:var(--fco-font-family); width:382px; background-color:white; border:1px solid var(--fco-foundry-interactable-color); color:black;">${skill_text}</textarea></div>`,
            buttons: {
            },
        }).render(true);
    }

    async _onExportSkills(event, html){
        let skills = game.settings.get("fate-core-official","skills");
        let skills_text = JSON.stringify(skills, null, 5);
 
        new Dialog({
            title: game.i18n.localize("fate-core-official.CopyAndPasteToSaveSkills"), 
            content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:var(--fco-font-family); width:382px; background-color:white; border:1px solid var(--fco-foundry-interactable-color); color:black;">${skills_text}</textarea></div>`,
            buttons: {
            },
        }).render(true);
    }

    async getSkills(){
        return new Promise(resolve => {
            new Dialog({
                title: game.i18n.localize("fate-core-official.PasteSkills"),
                content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:var(--fco-font-family); width:382px; background-color:white; border:1px solid var(--fco-foundry-interactable-color); color:black;" id="import_skills"></textarea></div>`,
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
            let skills = duplicate(game.settings.get("fate-core-official","skills"));
            if (skills == undefined){
                skills = {};
            }

            if (!imported_skills.hasOwnProperty("name")){
                // This is a skills object
                // Validate the imported data to make sure they all match the schema.
                for (let skill in imported_skills){
                    let sk = new fcoSkill(imported_skills[skill]).toJSON();
                    if (sk){
                        skills[skill] = sk;  
                    }
                }
            } else {
                // This is a single skill
                let sk = new fcoSkill(imported_skills).toJSON();
                if (sk){
                    skills[sk.name] = sk;
                }
            }
           
            await game.settings.set("fate-core-official","skills", skills);
            this.render(false);
        } catch (e) {
            ui.notifications.error(e);
        }
    }
    
    _onLabelEdit(event, html, skillsLabelEdit) {
        const input_id = `#${skillsLabelEdit.data('edit-element')}`;
        const skillsLabelInput = html.find(input_id);
        const is_editing = skillsLabelEdit.hasClass('inactive');
        if (skillsLabelInput.length && ! is_editing) {
            skillsLabelEdit.addClass('inactive');
            skillsLabelInput
                .removeAttr('disabled')
                .focus()
                .on('blur.edit_label', () => {
                    skillsLabelEdit.removeClass('inactive');
                    skillsLabelInput.attr('disabled', 'disabled');
                    skillsLabelInput.off('blur.edit_label');
                    const skills_label = skillsLabelInput.val();
                    game.settings.set("fate-core-official", "skillsLabel", skills_label);
                });
        }
    }

    async _onEditButton(event,html){
        //Launch the EditSkill FormApplication.
        let skills = game.settings.get("fate-core-official","skills");
        let slb = html.find("select[id='skillListBox']")[0].value;
        let sk = skills[slb]
        let e = new EditSkill(sk);
        e.render(true);
    }
    async _onDeleteButton(event,html){
        let del = await fcoConstants.confirmDeletion();
        if (del){
            //Code to delete the selected skill
            //First, get the name of the skill from the HTML element skillListBox
            let slb = html.find("select[id='skillListBox'")[0].value;
            
            //Find that skill in the list of skills
            let skills=game.settings.get("fate-core-official","skills");
            if (skills[slb] != undefined){
                delete skills[slb];
                await game.settings.set("fate-core-official","skills",skills);
                this.render(true);
            }
        }
    }
    async _onCopyButton(event,html){
        let selectBox = html.find("select[id='skillListBox']");
        let name = selectBox[0].value;
        if (name=="" || name == undefined){
            ui.notifications.error(game.i18n.localize("fate-core-official.SelectASkillToCopyFirst"));
        } else {
            let skills=await game.settings.get("fate-core-official", "skills");
            let skill = duplicate(skills[name]);
            name = skill.name+" "+game.i18n.localize("fate-core-official.copy");
            skill.name=name;
            skills[name]=skill;
            await game.settings.set("fate-core-official","skills",skills);
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
                this.skill= new fcoSkill().toObject();
            }
        }

        async _updateObject(event, f) {
            let skills=game.settings.get("fate-core-official","skills");
            let name = f.name.split(".").join("․").trim();
            let newSkill = new fcoSkill({"name":name, "description":f.description,"overcome":f.overcome,"caa":f.caa, "attack":f.attack,"defend":f.defend,"pc":f.pc}).toJSON();
            var existing = false;
            //First check if we already have a skill by that name, or the skill is blank; if so, throw an error.
            if (name == undefined || name ==""){
                ui.notifications.error(game.i18n.localize("fate-core-official.YouCannotHaveASkillWithABlankName"))
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
            await game.settings.set("fate-core-official","skills",skills);
        }

    //Here are the action listeners
    activateListeners(html) {
        super.activateListeners(html);
        const saveButton = html.find("button[id='edit_save_changes']");
        saveButton.on("click", event => this._onSaveButton(event, html));
        fcoConstants.getPen("edit_skill_description");
        fcoConstants.getPen("edit_skill_overcome");
        fcoConstants.getPen("edit_skill_caa");
        fcoConstants.getPen("edit_skill_attack");
        fcoConstants.getPen("edit_skill_defend");

        const description_rich = html.find('#edit_skill_description_rich');
        description_rich.on("keyup", event => {
            if (event.which == 9) description_rich.trigger("click");
        })
        
        description_rich.on("click", event => {
            $("#edit_skill_description_rich").css('display', 'none');
            $("#edit_skill_description").css('display', 'block');
            $("#edit_skill_description").focus();
        })

        description_rich.on('contextmenu', async event => {
            let text = await fcoConstants.updateText("Edit raw HTML", event.currentTarget.innerHTML, true);
            if (text != "discarded") {
                $('#edit_skill_description_rich')[0].innerHTML = text;    
                $('#edit_skill_description')[0].innerHTML = text;    
            }
        })

        const skill_description = html.find("div[id='edit_skill_description']");
        skill_description.on ('blur', async event => {
            if (!window.getSelection().toString()){
                let desc;
                if (isNewerVersion(game.version, '9.224')){
                    desc = DOMPurify.sanitize(await TextEditor.enrichHTML(event.target.innerHTML, {secrets:game.user.isGM, documents:true, async:true}));
                    $('#edit_skill_description_rich')[0].innerHTML = desc;     
                } else {
                    desc = DOMPurify.sanitize(await TextEditor.enrichHTML(event.target.innerHTML, {secrets:game.user.isGM, entities:true, async:true}));
                }
                
                $('#edit_skill_description').css('display', 'none');
                $('#edit_skill_description_rich')[0].innerHTML = desc;    
                $('#edit_skill_description_rich').css('display', 'block');
            }
        })

        $('#edit_skill_overcome_rich').on("keyup", event => {
            if (event.which == 9) $('#edit_skill_overcome_rich').trigger("click");
        })

        $('#edit_skill_overcome_rich').on("click", event => {
            $("#edit_skill_overcome_rich").css('display', 'none');
            $("#edit_skill_overcome").css('display', 'block');
            $("#edit_skill_overcome").focus();
        })

        $('#edit_skill_overcome_rich').on('contextmenu', async event => {
            let text = await fcoConstants.updateText("Edit raw HTML", event.currentTarget.innerHTML, true);
            if (text != "discarded") {
                $("#edit_skill_overcome_rich")[0].innerHTML = text;    
                $("#edit_skill_overcome")[0].innerHTML = text;    
            }
        })
        
        $('#edit_skill_overcome').on('blur', async event => {
            if (!window.getSelection().toString()){
                let desc = DOMPurify.sanitize(await TextEditor.enrichHTML(event.target.innerHTML, {secrets:game.user.isGM, entities:true, async:true}));
                $('#edit_skill_overcome').css('display', 'none');
                $('#edit_skill_overcome_rich')[0].innerHTML = desc;    
                $('#edit_skill_overcome_rich').css('display', 'block');
            }
        })

        $('#edit_skill_caa_rich').on("keyup", event => {
            if (event.which == 9) $('#edit_skill_caa_rich').trigger("click");
        })

        $('#edit_skill_caa_rich').on('contextmenu', async event => {
            let text = await fcoConstants.updateText("Edit raw HTML", event.currentTarget.innerHTML, true);
            if (text != "discarded") {
                $("#edit_skill_caa_rich")[0].innerHTML = text;    
                $("#edit_skill_caa")[0].innerHTML = text;    
            }
        })
        
        $('#edit_skill_caa_rich').on("click", event => {
            if (event.target.outerHTML.startsWith("<a data")) return;
            $("#edit_skill_caa_rich").css('display', 'none');
            $("#edit_skill_caa").css('display', 'block');
            $("#edit_skill_caa").focus();
        })
        
        $('#edit_skill_caa').on('blur', async event => {
            if (!window.getSelection().toString()){
                let desc;
                if (isNewerVersion(game.version, '9.224')){
                    desc = DOMPurify.sanitize(await TextEditor.enrichHTML(event.target.innerHTML, {secrets:game.user.isGM, documents:true, async:true}));
                } else {
                    desc = DOMPurify.sanitize(await TextEditor.enrichHTML(event.target.innerHTML, {secrets:game.user.isGM, entities:true, async:true}));   
                }
                $('#edit_skill_caa').css('display', 'none');
                $('#edit_skill_caa_rich')[0].innerHTML = desc;    
                $('#edit_skill_caa_rich').css('display', 'block');
            }
        })

        $('#edit_skill_attack_rich').on("keyup", event => {
            if (event.which == 9) $('#edit_skill_attack_rich').trigger("click");
        })

        $('#edit_skill_attack_rich').on('contextmenu', async event => {
            let text = await fcoConstants.updateText("Edit raw HTML", event.currentTarget.innerHTML, true);
            if (text != "discarded") {
                $("#edit_skill_attack_rich")[0].innerHTML = text;    
                $("#edit_skill_attack")[0].innerHTML = text;    
            }
        })

        $('#edit_skill_attack_rich').on("click", event => {
            if (event.target.outerHTML.startsWith("<a data")) return;
            $('#edit_skill_attack_rich').css('display', 'none');
            $('#edit_skill_attack').css('display', 'block');
            $('#edit_skill_attack').focus();
        })
        
        $('#edit_skill_attack').on('blur', async event => {
            if (!window.getSelection().toString()){
                let desc;
                if (isNewerVersion(game.version, '9.224')){
                    desc = DOMPurify.sanitize(await TextEditor.enrichHTML(event.target.innerHTML, {secrets:game.user.isGM, documents:true, async:true}));
                } else {
                    desc = DOMPurify.sanitize(await TextEditor.enrichHTML(event.target.innerHTML, {secrets:game.user.isGM, entities:true, async:true}));   
                }
                $('#edit_skill_attack').css('display', 'none');
                $('#edit_skill_attack_rich')[0].innerHTML = desc;    
                $('#edit_skill_attack_rich').css('display', 'block');
            }
        })

        $('#edit_skill_defend_rich').on("keyup", event => {
            if (event.which == 9) $('#edit_skill_defend_rich').trigger("click");
        })

        $('#edit_skill_defend_rich').on('contextmenu', async event => {
            let text = await fcoConstants.updateText("Edit raw HTML", event.currentTarget.innerHTML, true);
            if (text != "discarded") {
                $("#edit_skill_defend_rich")[0].innerHTML = text;    
                $("#edit_skill_defend")[0].innerHTML = text;    
            }
        })

        $('#edit_skill_defend_rich').on("click", event => {
            if (event.target.outerHTML.startsWith("<a data")) return;
            $("#edit_skill_defend_rich").css('display', 'none');
            $("#edit_skill_defend").css('display', 'block');
            $("#edit_skill_defend").focus();
        })
        
        $('#edit_skill_defend').on('blur', async event => {
            if (!window.getSelection().toString()){
                let desc;
                if (isNewerVersion(game.version, '9.224')){
                    desc = DOMPurify.sanitize(await TextEditor.enrichHTML(event.target.innerHTML, {secrets:game.user.isGM, documents:true, async:true}));
                } else {
                    desc = DOMPurify.sanitize(await TextEditor.enrichHTML(event.target.innerHTML, {secrets:game.user.isGM, entities:true, async:true}));   
                }
                $('#edit_skill_defend').css('display', 'none');
                $('#edit_skill_defend_rich')[0].innerHTML = desc;    
                $('#edit_skill_defend_rich').css('display', 'block');
            }
        })
    }
        
    //Here are the event listener functions.
    async _onSaveButton(event,html){
        this.submit();
    }    

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "systems/fate-core-official/templates/EditSkill.html"; 
        //Define the FormApplication's options
        options.width = "1000";
        options.height = "auto";
        options.title = game.i18n.localize("fate-core-official.SkillEditor");
        options.closeOnSubmit = true;
        options.id = "EditSkill"; // CSS id if you want to override default behaviors
        options.resizable = true;
        return options;
    }
    async getData(){
        let rich = {};
        let sk = duplicate (this.skill);
        for (let part in sk){
            if (part != "name" && part != "pc") rich[part] = await fcoConstants.fcoEnrich(sk[part]);
        }

        const templateData = {
           skill:this.skill,
           rich:rich
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
