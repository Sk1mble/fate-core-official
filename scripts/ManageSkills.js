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
class SkillSetup extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2){
    constructor(...args){
            super(...args);
            game.system.skillSetup = this;
    }

    //Set up the default options for instances of this class
    static DEFAULT_OPTIONS = {
        tag: "form",
        id: "SkillSetup",
        window: {
            title: this.title,
            icon: "fas fa-gear"
        }
    }

    static PARTS = {
        "SkillSetupForm":{
            template: "systems/fate-core-official/templates/SkillSetup.html",
            scrollable:["#skillListBox"]
        }
    }
    //The function that returns the data model for this window. In this case, we only need the game's skill list.
   _prepareContext(){
        this.skills=fcoConstants.sortByName(fcoConstants.wd().system.skills)
        this.skills_label = game.settings.get("fate-core-official", "skillsLabel");
        const templateData = {
           skills: this.skills,
           skills_label: this.skills_label, 
        }
        return templateData;
    }

    get title(){
        return `${game.i18n.localize("fate-core-official.SetupSkillsTitle")} ${game.world.title}`;
    }
    
      //Here are the action listeners
      _onRender(context, options) {
        const editButton = this.element.querySelector("button[id='editSkill']");
        const deleteButton = this.element.querySelector("button[id='deleteSkill']");
        const addButton = this.element.querySelector("button[id='addSkill']");
        const copyButton = this.element.querySelector("button[id='copySkill']");
        const selectBox = this.element.querySelector("select[id='skillListBox']");
        const exportSkill = this.element.querySelector("button[id='exportSkill']");
        const importSkills = this.element.querySelector("button[id='importSkills']");
        const exportSkills = this.element.querySelector("button[id='exportSkills']");
        const skillsLabelEdit = this.element.querySelector('#skillsLabelEdit');

        editButton?.addEventListener("click", event => this._onEditButton(event));
        deleteButton?.addEventListener("click", event => this._onDeleteButton(event));
        addButton?.addEventListener("click", event => this._onAddButton(event));
        selectBox?.addEventListener("dblclick", event => this._onEditButton(event));
        copyButton?.addEventListener("click", event => this._onCopyButton(event));
        exportSkill?.addEventListener("click", event => this._onExportSkill(event));
        importSkills?.addEventListener("click", event => this._onImportSkills(event));
        exportSkills?.addEventListener("click", event => this._onExportSkills(event));
        skillsLabelEdit?.addEventListener("click", event => this._onLabelEdit(event, skillsLabelEdit));
    }
    
    //Here are the event listener functions.
    async _onExportSkill(event){
        let skills = fcoConstants.wd().system.skills;
        let slb = this.element.querySelector("select[id='skillListBox']").value;
        let sk = fcoConstants.gbn(skills, slb);
        let key = fcoConstants.gkfn(skills, slb);
        let skill_text = `{"${key}":${JSON.stringify(sk, null, 5)}}`
        fcoConstants.getCopiableDialog(game.i18n.localize("fate-core-official.CopyAndPasteToSaveSkill"), skill_text);
    }

    async _onExportSkills(event){
        let skills = fcoConstants.wd().system.skills;
        let skills_text = JSON.stringify(skills, null, 5);
        fcoConstants.getCopiableDialog(game.i18n.localize("fate-core-official.CopyAndPasteToSaveSkills"), skills_text);
    }

    async getSkills(){
        return await fcoConstants.getImportDialog(game.i18n.localize("fate-core-official.PasteSkills"))
    }

    async _onImportSkills(event){
        let text = await this.getSkills();
        try {
            let imported_skills = JSON.parse(text);
            let skills = foundry.utils.duplicate(fcoConstants.wd().system.skills);
            if (skills == undefined){
                skills = {};
            }

            if (!imported_skills.hasOwnProperty("name")){
                // This is a skills object
                // Validate the imported data to make sure they all match the schema.
                for (let skill in imported_skills){
                    let sk = new fcoSkill(imported_skills[skill]).toJSON();
                    if (sk){
                        skills[fcoConstants.tob64(sk.name)] = sk;  
                    }
                }
                await fcoConstants.wd().update({"system.skills":imported_skills});
                this.render(false);
            } else {
                // This is a single skill
                let sk = new fcoSkill(imported_skills).toJSON();
                if (sk){
                    let key = fcoConstants.tob64(sk.name);
                    await fcoConstants.wd().update({
                        "system.skills":{
                            [`${key}`]:sk
                        }
                    });
                    this.render(false);
                }
            }
        } catch (e) {
            ui.notifications.error(e);
        }
    }
    
    _onLabelEdit(event, skillsLabelEdit) {
        const input_id = this.element.querySelector("#skillsLabelEdit").dataset.editElement;
        const skillsLabelInput = this.element.querySelector(`#${input_id}`);
        const is_editing = skillsLabelEdit.classList.contains('inactive');
        if (skillsLabelInput && ! is_editing) {
            skillsLabelInput.classList.add('inactive');
            skillsLabelInput.disabled = "";
            skillsLabelInput.focus();
            
            skillsLabelInput?.addEventListener('blur', event => {
                    skillsLabelInput.classList.remove('inactive');
                    skillsLabelInput.disabled = "disabled";
                    const skills_label = skillsLabelInput.value;
                    game.settings.set("fate-core-official", "skillsLabel", skills_label);
                });
        }
    }

    async _onEditButton(event){
        //Launch the EditSkill FormApplication.
        let skills = fcoConstants.wd().system.skills;
        let slb = this.element.querySelector("select[id='skillListBox']").value;
        let sk = fcoConstants.gbn(skills, slb)
        let e = new EditSkill(sk);
        e.render(true);
    }
    async _onDeleteButton(event){
        let del = await fcoConstants.confirmDeletion();
        if (del){
            //Code to delete the selected skill
            //First, get the name of the skill from the HTML element skillListBox
            let slb = this.element.querySelector("select[id='skillListBox'").value;
            
            //Find that skill in the list of skills
            let skills=fcoConstants.wd().system.skills;
            let key = fcoConstants.gkfn(skills, slb);
            if (skills[key] != undefined){
                await fcoConstants.wd().update({
                    "system.skills":{
                        [`${key}`]:_del
                    }
                });
                this.render(true);
            }
        }
    }
    async _onCopyButton(event){
        let selectBox = this.element.querySelector("select[id='skillListBox']");
        let name = selectBox.value;
        if (name=="" || name == undefined){
            ui.notifications.error(game.i18n.localize("fate-core-official.SelectASkillToCopyFirst"));
        } else {
            let skills=await fcoConstants.wd().system.skills;
            let skill = foundry.utils.duplicate(fcoConstants.gbn (skills, name));
            name = skill.name+" "+game.i18n.localize("fate-core-official.copy");
            skill.name=name;
            let key = fcoConstants.tob64(name);
            await fcoConstants.wd().update({
                "system.skills":{
                    [`${key}`]:skill
                }
            });
            
            this.render(true);
            try {
                this.bringToFront();
            } catch  {
                // Do nothing.
            }
        }
    }
    async _onAddButton(event){
        //Launch the EditSkill FormApplication.
        let e = new EditSkill(undefined);
        e.render(true);
        try {
            e.bringToFront();
        } catch  {
            // Do nothing.
        }
    }
}

//EditSkill: This is the class to edit a specific skill
class EditSkill extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2){
    constructor(skill){
        super(skill);
            this.skill=skill;
            if (this.skill==undefined){
                this.skill= new fcoSkill().toObject();
            }
        }

        static DEFAULT_OPTIONS = {
            tag: "form",
            id: "EditSkill",
            form: {
                handler: EditSkill.#updateObject,
                closeOnSubmit: false,
                submitOnClose: false,
                submitOnChange: true
            },
            position:{
                width: 1000,
                height: "auto"
            },
            window:{
                reiszable: true,
                title: this.title,
                icon: "fas fa-gear"
            }
        }

        static PARTS = {
            EditSkillForm: {
                template: "systems/fate-core-official/templates/EditSkill.html"
            }
        }

        get title(){
            return  game.i18n.localize("fate-core-official.SkillEditor");
        }

        async _prepareContext(){
            let rich = {};
            let sk = this.skill;
            for (let part in sk){
                if (part != "name" && part != "pc") rich[part] = await fcoConstants.fcoEnrich(sk[part]);
            }
    
            const templateData = {
               skill:this.skill,
               rich:rich
            }
            return templateData;
            }

        static async #updateObject(event, form, formDataExtended) {
            let f = formDataExtended.object;
            let skills=fcoConstants.wd().system.skills;
            let name = f.name;
            let newSkill = new fcoSkill({"name":name, "description":f.description,"overcome":f.overcome,"caa":f.caa, "attack":f.attack,"defend":f.defend,"pc":f.pc}).toJSON();
            let existing = false;
            let key = fcoConstants.gkfn(skills, name);
            //First check if we already have a skill by that name, or the skill is blank; if so, throw an error.
            if (name == undefined || name ==""){
                ui.notifications.error(game.i18n.localize("fate-core-official.YouCannotHaveASkillWithABlankName"))
            } else {
                if (skills[key] != undefined){
                    existing = true;
                }
            }
            if (!existing){  
                if (this.skill.name != ""){
                    //That means the name has been changed. Delete the original skill and replace it with this one.
                    await fcoConstants.wd().update({
                        "system.skills":{
                            [`${fcoConstants.tob64(this.skill.name)}`]:_del
                        }
                    });
                }                      
            }
            await fcoConstants.wd().update({
                "system.skills":{
                    [`${fcoConstants.tob64(newSkill.name)}`]:newSkill
                }
            });
            this.skill = fcoConstants.wd().system.skills[`${fcoConstants.tob64(newSkill.name)}`];
            this.render(false);
            game.system.skillSetup.render(false);
        }

    //Here are the action listeners
    _onRender (context, options) {
        const proseMirrors = this.element.querySelectorAll(".fco_prose_mirror");
        proseMirrors.forEach(pm => {
            pm.addEventListener("change", async event => {
                await this.render(false);
            })
        })
    }
}

Hooks.on('closeEditSkill',async () => {
    game.system.skillSetup.render(true);
    try {
        game.system.skillSetup.bringToFront();
    } catch  {
        // Do nothing.
    }
})
