export class ModularFateCharacter extends ActorSheet {

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.width="1000"
        return options;
    }

    get actorType() {
        return this.actor.data.type;
    }

    get template(){
        return 'systems/ModularFate/templates/ModularFateSheet.html';
    }

    //Here are the action listeners
    activateListeners(html) {
        super.activateListeners(html);
        const skillsButton = html.find("button[id='edit_player_skills']");;
        skillsButton.on("click", event => this._onSkillsButton(event, html));
        const skill_name=html.find("div[name='skill']");
        skill_name.on("click", event => this._onSkill_name(event, html));
        const sort = html.find("button[id='sort_player_skills'")
        sort.on("click", event => this._onSortButton(event, html));
    }

    //Here are the event listener functions.
    async _onSkillsButton(event, html){
        //Launch the EditPlayerSkills FormApplication.
        let editor = new EditPlayerSkills(this.actor);//Passing the actor works SOO much easier.
        editor.render(true);
    }
    async _onSortButton(){
        if (this.sortByRank == undefined){
            this.sortByRank == true;
        }
        this.sortByRank=!this.sortByRank;
        this.render(false);
    }

    async _onSkill_name(event, html){
        let r = new Roll(`4dF + ${this.object.data.data.skills[event.target.id].rank}`);
        let roll = r.roll();
        roll.toMessage({flavor: `Rolled ${event.target.id}`});
    }

    async initialise(){
        // Logic to set up aspects if this character doesn't already have them
        if (Object.keys(this.object.data.data.aspects)==0){
            let aspects = game.settings.get("ModularFate","aspects");
            let player_aspects = duplicate(aspects);
            for (let a in player_aspects){
                player_aspects[a].value = "";
            }
            //Now to store the aspect list to the character
            if (this.object.isToken){
                console.log("Is token")
                await this.object.token.update({["actorData.data.aspects"]:player_aspects});
            } else {
                await this.object.update({"data.aspects":player_aspects})    
            }
            this.render(false);
        }
    }
  
    getData() {
        this.initialise();
        const sheetData = super.getData();
        const unordered_skills = sheetData.data.skills;
        const ordered_skills = {}; 
        let sorted_by_rank = ModularFateConstants.sortByRank(unordered_skills);
        
        // Sort the skills to display them on the character sheet.
        Object.keys(unordered_skills).sort().forEach(function(key) {ordered_skills[key] = unordered_skills[key];});//You can use this code to sort a JSON object by creating a replacement object.
        sheetData.ordered_skills = ordered_skills;
        sheetData.sorted_by_rank = sorted_by_rank;

        let skillTotal =0;
        for (let s in ordered_skills){
            skillTotal+=ordered_skills[s].rank;
        }

        sheetData.skillTotal = skillTotal;
        sheetData.ladder = ModularFateConstants.getFateLadder();
        sheetData.sortByRank=this.sortByRank;
        sheetData.gameSkillPoints = game.settings.get("ModularFate","skillTotal")
        sheetData.GM = game.user.isGM;
        return sheetData;
    }
}