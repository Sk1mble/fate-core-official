// This is the main class called to launch the skills editor.
// Form applications always receive the object being worked on as a variable, so can use this.object to access it.
class EditPlayerSkills extends FormApplication{
    constructor(...args){
            super(...args);

                if (this.object.type == "Extra"){
                    let title = game.i18n.localize("fate-core-official.SkillEditorForItem");
                    this.options.title=`${title} ${this.object.name}`
                    game.system.apps["item"].push(this);
                } else {
                    if (this.object.isToken) {
                        this.options.title=`${game.i18n.localize("fate-core-official.SkillEditorForToken")} ${this.object.name}`
                    } else {
                        this.options.title=`${game.i18n.localize("fate-core-official.SkillEditorFor")} ${this.object.name}`
                    }
                }
                if (this.object.type != "Extra"){
                    this.firstRun=true;
                }
                this.player_skills=duplicate(this.object.system.skills);
                this.sortByRank = true;
                this.temp_presentation_skills=[];
                this.sorted = false;
                this.changed = false;
                game.system.apps["actor"].push(this);
                game.system.apps["item"].push(this);
    }

    setSheet (ActorSheet){
        this.sheet = ActorSheet;
    }

    //This function is called when an actor or item update is called.
    async renderMe(id, data, object){
        if (this?.object?.id == id){
            //The following code debounces the render, preventing multiple renders when multiple simultaneous update requests are received.
            if (!this.renderPending) {
                this.renderPending = true;
                setTimeout(() => {
                this.render(false);
                this.renderPending = false;
                }, 150);
            }
        }
    }

    //Set up the default options for instances of this class
    static get defaultOptions() {
        const options = super.defaultOptions; //begin with the super's default options
        //The HTML file used to render this window
        options.template = "systems/fate-core-official/templates/EditPlayerSkills.html"; 
        options.height = "auto";
        options.title = game.i18n.localize("fate-core-official.CharacterSkillEditor");
        options.closeOnSubmit = true;
        options.id = "PlayerSkillSetup"; // CSS id if you want to override default behaviors
        options.resizable = true;
        options.scrollY=["#skills_editor"];
        options.width = "auto";  
        options.classes = options.classes.concat(['fate']);
        return options;
    }

    // This returns all the forms fields with names as a JSON object with their values. 
    // It is required for a FormApplication.
    // It is called when you call this.submit();

    async _updateObject(event, formData){
        //Check if this is a player
        //Check if the player is currently allowed to save
        //OVerride these settings if the skill is being saved on an extra.
    
        for (let skill in formData){ //This goes through every field in the JSON object.
            let skill_name = skill.split("_")[0];
            let rank = parseInt(formData[skill]);//We can lookup JSON keys with a variable using square brackets
            let player_skill = this.player_skills[skill_name];//Find the player skill entry matching this item
            player_skill.rank = rank;//Set it to this value.
        }

        if (this.object.type=="Extra"){
            await this.object.update({"system.skills":this.player_skills}); 
            ui.notifications.info(game.i18n.localize("fate-core-official.ExtraSkillsSaved"));   
            this.changed = false;
            this.close();
        } else {
            let isPlayer = this.object.hasPlayerOwner;
            var canSave = await this.checkSkills(this.player_skills);
            if (!game.user.isGM && isPlayer && !canSave){
                ui.notifications.error(game.i18n.localize("fate-core-official.UnableToSave"));
            } else {
                let tracks = this.object.setupTracks (duplicate(this.player_skills), duplicate(this.object.system.tracks));
                await this.object.update({"system.tracks":tracks,"system.skills":this.player_skills}); 
                ui.notifications.info(game.i18n.localize("fate-core-official.SkillsSaved"));
                this.changed = false;
                this.close();
            }
        }
    }

    async close(...args){
        game.system.apps["actor"].splice(game.system.apps["actor"].indexOf(this),1); 
        game.system.apps["item"].splice(game.system.apps["item"].indexOf(this),1); 

        if (this.changed){
            let answer = await fcoConstants.awaitYesNoDialog(game.i18n.localize("fate-core-official.abandonChangesQ"), game.i18n.localize("fate-core-official.abandonChanges"));
            if (answer == "yes") await super.close(...args);
        } else {
            await super.close(...args);
        }
        
    }

    async checkSkills(p){
            let p_skills=duplicate(p);
            var playerCanSave = true;
            let skillColumnViolated = false;
            let skillTotalViolated = false;
            
            //If the setting is on to enforce columns, make sure skills are valid for column format.
            if (game.settings.get("fate-core-official","enforceColumn")){
                let actor= this.object;
                skillColumnViolated = false;
                let ranks = [0,0,0,0,0,0,0,0,0,0,0];
                //Ignore skills from extras if the countSkills setting is false.
                for (let sk in p_skills){
                    if (p_skills[sk].extra_id != undefined){
                        let extra_id = p_skills[sk].extra_id;
                        let extra = this.object.items.find(item=>item.id == extra_id);
                
                        if (extra != undefined && extra.system.countSkills){
                            ranks[p_skills[sk].rank]++    
                        }
                    }else {
                        ranks[p_skills[sk].rank]++
                    }
                }

                //0=11 & 10; 1=10&9; 2=9&8; 3=8&7; 4=7&6; 5=6&5; 6=5&4; 7=4&3; 8=3&2; 9=2&1
                let columnErrors=new Array(10);
                let columnErrorText = `<div><p/>${game.i18n.localize('fate-core-official.TheViolationsAreAsFollows')}`
                for (let i = 11; i>1; i--){
                    if (ranks[i]>ranks[i-1]){
                        skillColumnViolated = true;
                        columnErrors[11-i]=true;
                    }
                }
                for (let i = 0; i<columnErrors.length; i++){
                    if (columnErrors[i]){
                        columnErrorText+=`<li>${game.i18n.localize('fate-core-official.MoreSkillsAt')} ${fcoConstants.getAdjective(11-i)}(+${11-i}) ${game.i18n.localize("fate-core-official.ThanAt")} ${fcoConstants.getAdjective(10-i)}(+${10-i})</li>`
                    }
                }
                columnErrorText+-`</div>`;

                if (skillColumnViolated){
                    if (!game.user.isGM) {
                        await fcoConstants.awaitOKDialog(game.i18n.localize("fate-core-official.ViolationDetected"),`<div>${game.i18n.localize("fate-core-official.ViolationExplanation1")} ${columnErrorText}</div>`);
                    } else {
                        if (actor.hasPlayerOwner){
                            await fcoConstants.awaitOKDialog(game.i18n.localize("fate-core-official.ViolationDetected"),`<div>${game.i18n.localize("fate-core-official.ViolationExplanation2")}</div>${columnErrorText}`);    
                        }
                    }    
                    playerCanSave=false;
                }
            }

            //If the setting is on to enforce the global skill total, check to ensure player skills aren't over that.
            if (game.settings.get("fate-core-official","enforceSkillTotal")){
                let actor = this.object;
                let skill_total = game.settings.get("fate-core-official","skillTotal");
                let player_total = 0;
            
                for (let sk in p_skills){
                    if (p_skills[sk].extra_id != undefined){
                        let extra_id = p_skills[sk].extra_id;
                        let extra = this.object.items.find(item=>item.id == extra_id);
                
                        if (extra != undefined && extra.system.countSkills){
                            player_total+=p_skills[sk].rank;   
                        }
                    }else {
                        player_total+=p_skills[sk].rank;
                    }
                }

                if (player_total > skill_total){
                    skillTotalViolated = true;
                    if (!game.user.isGM){
                        await fcoConstants.awaitOKDialog(game.i18n.localize("fate-core-official.SkillPointsExceedAllowedTotal"),`<div>${game.i18n.localize("fate-core-official.YouHave")} ${player_total} ${game.i18n.localize("fate-core-official.SkillPointsAndTheGamesTotalIs")} ${skill_total}. ${game.i18n.localize("fate-core-official.CannotSave1")}</div>`);
                    } else {
                        if (actor.hasPlayerOwner){
                            await fcoConstants.awaitOKDialog(game.i18n.localize("fate-core-official.SkillPointsExceedAllowedTotal"),`<div>${game.i18n.localize("fate-core-official.ThisCharacterHas")} ${player_total} ${game.i18n.localize("fate-core-official.SkillPointsAndTheGamesTotalIs")} ${skill_total}. ${game.i18n.localize("fate-core-official.CannotSave2")}</div>`);
                        }
                    }
                    playerCanSave=false;
                }
            }
            return (playerCanSave);
    }
//The function that returns the data model for this window. In this case, we need the character's sheet data/and the skill list.
    async getData(){
        this.player_skills=duplicate(this.object.system.skills);
        this.player_skills=fcoConstants.sortByKey(this.player_skills);

        if (this.firstRun){
            await this.checkSkills(this.player_skills);
            this.firstRun=false;
        }
        let presentation_skills=[];

        if (this.temp_presentation_skills.length > 0){
            presentation_skills=duplicate(this.temp_presentation_skills);
            this.temp_presentation_skills=[];
        } else {
            for (let x in this.player_skills){
                presentation_skills.push({"name":x,"rank":this.player_skills[x].rank,"extra_id":this.player_skills[x].extra_id});
            }
        }
        
        if (!this.sorted){
            this.sort_name(presentation_skills);
            this.sorted = true;
        }

        const templateData = {
            skill_list:game.settings.get("fate-core-official","skills"),
            character_skills:presentation_skills,
            isGM:game.user.isGM,
            isExtra:this.object.type=="Extra"
         }
        return templateData;
    }
    
       //Here are the action listeners
        activateListeners(html) {
        super.activateListeners(html);

        const rankBoxes = html.find("input[class='rank_input']");
        rankBoxes.on("change", event => {
            this.changed = true;
        })

        const skillButtons = html.find("button[class='skill_button']");
        skillButtons.on("click", event => this._onSkillButton(event, html));
        const saveButton = html.find("button[id='save_player_skills']")
        saveButton.on("click", event => this._onSaveButton(event,html));
        const sortButton = html.find("button[id='sort']");
        sortButton.on("click", event => this._onSortButton(event, html));
        const editButton = html.find("button[id='edit_p_skills']");
        editButton.on("click", event => this._onEditButton(event, html));  
    }

    async sort_name(array){
        array.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);//This actually properly sorts by name; case sensitive.
    }

    async sort_rank(array){
        array.sort((a, b) => parseInt(b.rank) - parseInt(a.rank));
    }

    async _onSortButton(event, html){
        this.temp_presentation_skills=[];
        let tps = [];
        let inputs = html.find("input[type='number']");
        
        for (let i = 0 ; i < inputs.length; i++){ 
            let skill_name = inputs[i].id.split("_")[0];
            let rank = parseInt(inputs[i].value);
            tps.push({"name":skill_name,"rank":rank})
        }
        if (this.sortByRank) {
            this.sort_rank(tps);
        } else {
            this.sort_name(tps);
        }
        this.temp_presentation_skills = tps;
        await this.render(false);
        this.sortByRank=!this.sortByRank;
    }

    async _onEditButton (event, html){
        if (game.user.isGM || this.object.type=="Extra"){
            let e = new EditGMSkills (this.object);
            await e.render(true);
            e.skillsWindow = this;
            try {
                e.bringToTop();
            } catch  {
                // Do nothing.
            }
        }
        else {
            ui.notifications.error(game.i18n.localize("fate-core-official.OnlyGMsCanManuallyEdit"));
        }
    }

    async _onSkillButton(event,html){
        let name = event.target.id;
        let skill = this.player_skills[name];
        fcoConstants.awaitOKDialog(game.i18n.localize("fate-core-official.SkillDetails"),`
                                            <table cellspacing ="4" cellpadding="4" border="1">
                                                <h2>${skill.name}</h2>
                                                <tr>
                                                    <td style="width:400px;">
                                                        <b>${game.i18n.localize("fate-core-official.Description")}:</b>
                                                    </td>
                                                    <td style="width:2000px;">
                                                        ${skill.description}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <b>${game.i18n.localize("fate-core-official.Overcome")}:</b>
                                                    </td>
                                                    <td>
                                                        ${skill.overcome}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <b>${game.i18n.localize("fate-core-official.CAA")}:</b>
                                                    </td>
                                                    <td>
                                                        ${skill.caa}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <b>${game.i18n.localize("fate-core-official.Attack")}:</b>
                                                    </td>
                                                    <td>
                                                        ${skill.attack}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <b>${game.i18n.localize("fate-core-official.Defend")}:</b>
                                                    </td>
                                                    <td>
                                                        ${skill.defend}
                                                    </td>
                                                </tr>
                                            </table>`,1000)
    }

    async _onSaveButton(event, html){
       this.submit();
    }
}

class EditGMSkills extends FormApplication{
    // This class is for the editor that pops out to allow the GM to add GM skills and adhoc skills to any character.
    //Also allows the GM to add or delete any given skill from the worldlist to any character.
    constructor(actor){
        super(actor);
            if (this.object.type=="Extra"){ 
                this.options.title=`${game.i18n.localize("fate-core-official.ExtraSkillEditor")} ${this.object.name}`                    
            } else {
                if(this.object.isToken){
                    this.options.title=`${game.i18n.localize("fate-core-official.TokenSkillEditor")} ${this.object.name}`                    
                } else {
                    this.options.title=`${game.i18n.localize("fate-core-official.GMSkillEditor")} ${this.object.name}`
                }
            }
            this.player_skills=duplicate(this.object.system.skills);
    }

    //Set up the default options for instances of this class
    static get defaultOptions() {
        const options = super.defaultOptions; //begin with the super's default options
        //The HTML file used to render this window
        options.template = "systems/fate-core-official/templates/EditGMSkills.html"; 
        options.width = "auto";
        options.height = "auto";
        options.title = game.i18n.localize("fate-core-official.GMSkillEditor2");
        options.closeOnSubmit = false;
        options.id = "GMSkillSetup"; // CSS id if you want to override default behaviors
        options.resizable = true;
        return options;
    }

     //Here are the action listeners
     activateListeners(html) {
        super.activateListeners(html);
        const add_ad_hoc = html.find("button[id='add_ah_button']");
        add_ad_hoc.on("click", event => this._adHocButton(event, html));
        const confirm = html.find("button[id='add_remove_button']")
        confirm.on("click", event => this._confirm(event, html));

        const selectAll = html.find("button[id='select_all_skills_button']");
        selectAll.on("click", event => {
            const boxes = $("input[class='skill_check_box']");
    
            for (let box of boxes){
                box.checked = true;
            }
        })

        const deSelectAll = html.find("button[id='deselect_all_skills_button']");
        deSelectAll.on("click", event => {
            const boxes = $("input[class='skill_check_box']");
            
            for (let box of boxes){
                box.checked = false;
            }
        })

        const asn = $('input[name="adhoc_skill_name"]');
        asn.on('blur', async (event, html)=>{
            let oldSkill = event.target.getAttribute("data-oldName");
            let newSkill = event.target.value.split(".").join("․");
            if (oldSkill != newSkill){
                let rank = this.object.system.skills[oldSkill].rank;
                newSkill= new fcoSkill({
                    "name":newSkill,
                    "description":game.i18n.localize("fate-core-official.AdHocSkill"),
                    "pc":false,
                    "overcome":"",
                    "caa":"",
                    "attack":"",
                    "defend":"",
                    "rank":rank,
                    "adhoc":true
                }).toJSON();
    
                if (newSkill != undefined){
                    newSkill.name=newSkill.name.split(".").join("․");
                    this.object.update({"system.skills": {[newSkill.name]:newSkill, [`-=${oldSkill}`]:null}}).then(() => this.render(false));
                }
            }
        })
    }

    async _confirm(event,html){

        let actor=undefined;
        let updateObject = {};
        for (let s in this.player_skills){
            let cbox;
            try{
                cbox = html.find(`input[id='${s}']`)[0];
                if (!cbox) cbox = html.find(`input[id="${s}"]`)[0];
            } catch {

            }
            if (cbox != undefined && !cbox.checked){
                updateObject[`system.skills.-=${s}`] = null;
            }
        } 
        
        //Now we need to add skills that have checks and which aren't already checked.
        let world_skills=game.settings.get("fate-core-official","skills")
        for (let w in world_skills){
            let cbox;
            try{
                cbox = html.find(`input[id="${w}"]`)[0];
                if (!cbox) cbox = html.find(`input[id='${w}']`)[0];
            } catch {
        
            }  
            if (cbox && cbox.checked){
                if (this.player_skills[w]==undefined){
                    let skill = world_skills[w];
                    skill.rank=0;
                    updateObject[`system.skills.${w}`] = skill;
                }
            }
        }
        await this.object.update(updateObject);
        this.skillsWindow.render(false);
        this.close();
    }

    async _adHocButton(event, html){
        let name = html.find("input[id='ad_hoc_input']")[0].value
        var newSkill=undefined;
        if (name!= undefined && name !=""){
            newSkill= new fcoSkill({
                "name":name,
                "description":game.i18n.localize("fate-core-official.AdHocSkill"),
                "pc":false,
                "overcome":"",
                "caa":"",
                "attack":"",
                "defend":"",
                "rank":0,
                "adhoc":true
            }).toJSON();
        }
        if (newSkill != undefined){
            newSkill.name=newSkill.name.split(".").join("․");
            this.object.update({"system.skills": {[newSkill.name]:newSkill}}).then(() => this.render(false));
        }
    }

    async _updateObject(event, html){
    }

    async getData(){
        this.player_skills=duplicate(this.object.system.skills);

        let world_skills=duplicate(game.settings.get("fate-core-official","skills"));
        let present = [];
        let absent = [];
        let non_pc_world_skills=[];
        let ad_hoc = [];
        let orphaned = [];

        for (let w in world_skills){
            let s = this.player_skills[w];
            if (s == undefined || s?.extra_id){
                if (!world_skills[w].pc && !s?.extra_id){ 
                    non_pc_world_skills.push(world_skills[w])
                } else {
                    if (!s?.extra_id)
                    absent.push(world_skills[w])
                }
            } else {
                present.push(world_skills[w])
            }
        }
        for (let s in this.player_skills){
            let ps = this.player_skills[s];
            if (ps.adhoc){
                ad_hoc.push(ps)
            }
            if (world_skills[s]==undefined && !ps.adhoc){
                orphaned.push(ps);
            }
        }

        const templateData = {
            skill_list:game.settings.get("fate-core-official","skills"),
            character_skills:this.player_skills,
            present_skills:present,
            absent_skills:absent,
            non_pc:non_pc_world_skills,
            ad_hoc:ad_hoc,
            orphaned:orphaned,
         }
        return templateData;
    }
}
