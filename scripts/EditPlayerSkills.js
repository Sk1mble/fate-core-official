// This is the main class called to launch the skills editor.
// Form applications always receive the object being worked on as a variable, so can use this.object to access it.
class EditPlayerSkills extends FormApplication{
    constructor(...args){
            super(...args);
                if(this.object.isToken){
                    this.options.title=`Character skill editor for [Token] ${this.object.name}`                    
                } else {
                    this.options.title=`Character skill editor for ${this.object.name}`
                }
                this.firstRun=true;
                this.player_skills=duplicate(this.object.data.data.skills);
                this.sortByRank = true;
    }

    //Set up the default options for instances of this class
    static get defaultOptions() {
        const options = super.defaultOptions; //begin with the super's default options
        //The HTML file used to render this window
        options.template = "systems/ModularFate/templates/EditPlayerSkills.html"; 
        options.width = "auto";
        options.height = "auto";
        options.title = `Character Skill Editor`;
        options.closeOnSubmit = false;
        options.id = "PlayerSkillSetup"; // CSS id if you want to override default behaviors
        options.resizable = true;
        return options;
    }

    // This returns all the forms fields with names as a JSON object with their values. 
    // It is required for a FormApplication.
    // It is called when you call this.submit();

    async _updateObject(event, formData){
        //this.player_skills=duplicate(this.object.data.data.skills);
        //Check if this is a player
        //Check if the player is currently allowed to save
        let isPlayer = this.object.isPC;
    
        for (let skill in formData){ //This goes through every field in the JSON object.
            let skill_name = skill.split("_")[0];
            let rank = parseInt(formData[skill]);//We can lookup JSON keys with a variable using square brackets
            let player_skill = this.player_skills[skill_name];//Find the player skill entry matching this item
            player_skill.rank = rank;//Set it to this value.
        }
        var canSave = await this.checkSkills(this.player_skills);
        if (!game.user.isGM && isPlayer && !canSave){
            ui.notifications.error("Unable to save because this character violates skill cap or skill column enforcement.")
        } else {
            console.log(this.player_skills)
            if (this.object.isToken){
                await this.object.update({"data.skills":this.player_skills});
                this.player_skills=duplicate(this.object.data.data.skills);
            } else {
                await this.object.update({"data.skills":this.player_skills}); 
                this.player_skills=duplicate(this.object.data.data.skills);
            }
            ui.notifications.info("Character skills saved.")   
        }
    }

    async checkSkills(p){
        if (!this.object.isToken){
            let p_skills=duplicate(p);
            var playerCanSave = true;
            //Check to see what skills the character has compared to the global skill list
            var skill_list = game.settings.get("ModularFate","skills");

            let skills_to_add = [];
            let skills_to_delete = [];
            let columnViolated = false;
            let skillTotalViolated = false;
            for (let w in skill_list){
                let w_skill = skill_list[w];
                if (p_skills[w]!=undefined){
                } else {
                    if(w_skill.pc){
                        skills_to_add.push(w_skill);
                    }
                }
            }

            if (skills_to_add.length >0){
                //Add any skills from the global list that they don't have at rank 0.
                skills_to_add.forEach(skill => {
                    skill.rank=0;
                    p_skills[skill.name]=skill;
                })

                await this.object.update({"data.skills":p_skills});
                this.player_skills=duplicate(p_skills);
                let added_skill_notification = `<div>Added these skills from the skill list that were missing from this character:<p></p>`
                for (let i = 0; i<skills_to_add.length; i++){
                    added_skill_notification +=`<li>${skills_to_add[i].name}</li>`
                }
                added_skill_notification += "</div>";
                await ModularFateConstants.awaitOKDialog("Detected missing skills",added_skill_notification)
            }

            //Check to see if the player has any skills that aren't in the global list. If they do, offer to delete those skills.

            for (let p in p_skills){
                if (skill_list[p] != undefined && !skill_list[p].adhoc){     
                }else {
                    skills_to_delete.push(p_skills[p]);
                }
            } 

            if (skills_to_delete.length >0){
                let delete_skills_query = `<div>The following skills are on this character but not in the skill list:<p></p>`
                for (let i = 0; i<skills_to_delete.length; i++){
                    delete_skills_query+=`<li>${skills_to_delete[i].name}</li>`
                }
                delete_skills_query+="<p></p>Click YES to delete these skills, or NO to keep them. This message will appear every time the skill editor is opened unless these skills are added to the skill list by the GM.</div>";
                if (this.object.isToken){
                    delete_skills_query+="<p>Because this is a token actor, the skills won't stay deleted on refreshing until you delete them from the actor this token represents.</p>";
                }
                let del = await ModularFateConstants.awaitYesNoDialog("Detected extraneous skills",delete_skills_query);
                if (del == "yes"){
                    for (let i = 0; i < skills_to_delete.length; i++){
                        let s = `-=${skills_to_delete[i].name}`
                        delete p_skills[skills_to_delete[i].name];
                        await this.object.update({"data.skills": {[`${s}`]:null}})
                    }
                    //await this.object.update({"data.skills":p_skills});
                    this.player_skills=duplicate(p_skills);;
                }
            }
            
            //If the setting is on to enforce columns, make sure skills are valid for column format.
            if (game.settings.get("ModularFate","enforceColumn")){
                let actor= this.object;
                let skillColumnViolated = false;
                let ranks = [0,0,0,0,0,0,0,0,0,0,0];

                for (let sk in p_skills){
                    ranks[p_skills[sk].rank]++
                }

                //0=11 & 10; 1=10&9; 2=9&8; 3=8&7; 4=7&6; 5=6&5; 6=5&4; 7=4&3; 8=3&2; 9=2&1
                let columnErrors=new Array(10);
                let columnErrorText = `<div><p/>The violations are as follows:`
                for (let i = 11; i>0; i--){
                    if (ranks[i]>ranks[i-1]){
                        skillColumnViolated = true;
                        columnErrors[11-i]=true;
                    }
                }
                for (let i = 0; i<columnErrors.length; i++){
                    if (columnErrors[i]){
                        columnErrorText+=`<li>More skills at ${ModularFateConstants.getAdjective(11-i)}(+${11-i}) than at ${ModularFateConstants.getAdjective(10-i)}(+${10-i})</li>`
                    }
                }
                columnErrorText+-`</div>`;

                if (skillColumnViolated){
                    if (!game.user.isGM) {
                        await ModularFateConstants.awaitOKDialog("Skill column violation detected",`<div>Your skill distribution is invalid due to not being in a column. You won't be able to save your changes until you correct this.${columnErrorText}</div>`);
                    } else {
                        if (actor.isPC){
                            await ModularFateConstants.awaitOKDialog("Skill column violation detected",`<div>This character's skill distribution is invalid due to not being in a column. The player won't be able to save any changes while this remains the case unless you turn off skill column enforcement in the system settings.</div>${columnErrorText}`);    
                        }
                    }    
                    playerCanSave=false;
                }
            }

            //If the setting is on to enforce the global skill total, check to ensure player skills aren't over that.
            if (game.settings.get("ModularFate","enforceSkillTotal")){
                let actor = this.object;
                let skill_total = game.settings.get("ModularFate","skillTotal");
                let player_total = 0;
            
                for (let sk in p_skills){
                    player_total+=p_skills[sk].rank;
                }

                if (player_total > skill_total){
                    skillTotalViolated = true;
                    if (!game.user.isGM){
                        await ModularFateConstants.awaitOKDialog("Skill points exceed allowed total",`<div>You have ${player_total} skill points and the game's skill total is ${skill_total}. You won't be able to save your changes until you correct this.</div>`);
                    } else {
                        if (actor.isPC){
                            await ModularFateConstants.awaitOKDialog("Skill points exceed allowed total",`<div>This character has ${player_total} skill points and the game's skill total is ${skill_total}. The player won't be able to save any changes while this remains the case unless you turn off skill total enforcement in the system settings.</div>`);
                        }
                    }
                    playerCanSave=false;
                }
            }
            return (playerCanSave);
        }
    }
//The function that returns the data model for this window. In this case, we need the character's sheet data/and the skill list.
    async getData(){
        this.player_skills=duplicate(this.object.data.data.skills);

        if (this.firstRun){
            await this.checkSkills(this.player_skills);
            this.firstRun=false;
        }
        let presentation_skills=[];
        for (let x in this.player_skills){
            presentation_skills.push({"name":x,"rank":this.player_skills[x].rank});
        }
        if (this.sortByRank){//sort by rank
            presentation_skills.sort((a, b) => parseInt(b.rank) - parseInt(a.rank));
        } else { //sort by name
            presentation_skills.sort((a, b) => b.name - a.name);
        }

        const templateData = {
            skill_list:game.settings.get("ModularFate","skills"),
            character_skills:presentation_skills
         }
        return templateData;
    }
    
       //Here are the action listeners
        activateListeners(html) {
        super.activateListeners(html);
        const skillButtons = html.find("button[class='skill_button']");
        skillButtons.on("click", event => this._onSkillButton(event, html));
        const saveButton = html.find("button[id='save_player_skills']")
        saveButton.on("click", event => this._onSaveButton(event,html));
        const sortButton = html.find("button[id='sort']");
        sortButton.on("click", event => this._onSortButton(event, html));
        const editButton = html.find("button[id='edit_p_skills']");
        editButton.on("click", event => this._onEditButton(event, html));

        Hooks.on("renderModularFateCharacter",(app, html, data)=> {
            this.render(false);
        });    
    }
    async _onSortButton(event, html){
        this.sortByRank=!this.sortByRank;
        this.render(false);
    }

    async _onEditButton (event, html){
        if (game.user.isGM){
            let e = new EditGMSkills (this.object);
            e.render(true);
        }
        else {
            ui.notifications.error("Only GMs can manually edit player skills.");
        }
    }

    async _onSkillButton(event,html){
        let name = event.target.id;
        let skill = this.player_skills[name];
        ModularFateConstants.awaitOKDialog("Skill Details",`
                                            <table cellspacing ="4" cellpadding="4" border="1">
                                                <h2>${skill.name}</h2>
                                                <tr>
                                                    <td style="width:400px;">
                                                        <b>Description:</b>
                                                    </td>
                                                    <td style="width:2000px;">
                                                        ${skill.description}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <b>Overcome:</b>
                                                    </td>
                                                    <td>
                                                        ${skill.overcome}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <b>Create an Advantage:</b>
                                                    </td>
                                                    <td>
                                                        ${skill.caa}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <b>Attack:</b>
                                                    </td>
                                                    <td>
                                                        ${skill.attack}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <b>Defend:</b>
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
            if(this.object.isToken){
                this.options.title=`GM skill editor for [Token] ${this.object.name}`                    
            } else {
                this.options.title=`GM skill editor for ${this.object.name}`
            }
            this.player_skills=duplicate(this.object.data.data.skills);
            console.log(this.player_skills);
    }

    //Set up the default options for instances of this class
    static get defaultOptions() {
        const options = super.defaultOptions; //begin with the super's default options
        //The HTML file used to render this window
        options.template = "systems/ModularFate/templates/EditGMSkills.html"; 
        options.width = "auto";
        options.height = "auto";
        options.title = `GM Skill Editor`;
        options.closeOnSubmit = false;
        options.id = "GMSkillSetup"; // CSS id if you want to override default behaviors
        options.resizable = true;
        return options;
    }

    async getData(){
        this.player_skills=duplicate(this.object.data.data.skills);

        // Need to check which skills the player has, including non-pc skills and ad-hoc skills.
        // Need to build a presentation array that includes whether it's currently on the sheet.
        // GM checks or unchecks each box accordingly
        // On saving, all unchecked skills are deleted.
        // Note to self, ad-hoc skills have only a name, but we populate the other data with blanks 
        // to avoid compatibility issues.



        const templateData = {
            skill_list:game.settings.get("ModularFate","skills"),
            character_skills:this.player_skills
         }
        return templateData;
    }
}