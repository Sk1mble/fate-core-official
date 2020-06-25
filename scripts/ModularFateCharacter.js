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
        // Logic to set up Refresh and Current
        let refresh = game.settings.get("ModularFate","refreshTotal");
    
        if (this.object.data.data.details.fatePoints.refresh ==""){
            if (this.object.isToken){
                await this.object.token.update({["actorData.data.details.fatePoints.refresh"]:refresh});
                await this.object.token.update({["actorData.data.details.fatePoints.current"]:refresh});
            } else {
                await this.object.update({"data.details.fatePoints.refresh":refresh})    
                await this.object.update({"data.details.fatePoints.current":refresh})
            }
        }

        // Logic to set up aspects if this character doesn't already have them
        if (Object.keys(this.object.data.data.aspects)==0){
            let aspects = game.settings.get("ModularFate","aspects");
            let player_aspects = duplicate(aspects);
            for (let a in player_aspects){
                player_aspects[a].value = "";
            }
            //Now to store the aspect list to the character
            if (this.object.isToken){
                await this.object.token.update({["actorData.data.aspects"]:player_aspects});
            } else {
                await this.object.update({"data.aspects":player_aspects})    
            }
        }
        this.render(false);
    }
  
    getData() {
        this.initialise();
        this.refreshSpent = 0; //Will increase when we count tracks with the Paid field and stunts.
        this.freeStunts = game.settings.get("ModularFate","freeStunts");
        const sheetData = super.getData();
        let numStunts = Object.keys(sheetData.data.stunts).length;
        let paidTracks = 0;
        let paidStunts = 0;
        let paidExtras = 0;

        let tracks = sheetData.data.tracks;
        for (let track in tracks){
            if (tracks[track].paid){
                paidTracks++;
            }
        }
        paidStunts = numStunts - paidStunts;
        //TODO: Add code to count the cost of paid for extras, too.
        this.refreshSpent = paidTracks + paidStunts + paidExtras;
        
        const unordered_skills = sheetData.data.skills;
        const ordered_skills = {}; 
        let sorted_by_rank = ModularFateConstants.sortByRank(unordered_skills);
        
        // Sort the skills to display them on the character sheet.
        Object.keys(unordered_skills).sort().forEach(function(key) {ordered_skills[key] = unordered_skills[key];});//You can use this code to sort a JSON object by creating a replacement object.
        sheetData.ordered_skills = ordered_skills;
        sheetData.sorted_by_rank = sorted_by_rank;
        sheetData.gameRefresh=game.settings.get("ModularFate","refreshTotal");

        let skillTotal =0;
        for (let s in ordered_skills){
            skillTotal+=ordered_skills[s].rank;
        }

        sheetData.skillTotal = skillTotal;
        sheetData.refreshSpent = this.refreshSpent;
        sheetData.ladder = ModularFateConstants.getFateLadder();
        sheetData.sortByRank=this.sortByRank;
        sheetData.gameSkillPoints = game.settings.get("ModularFate","skillTotal")
        sheetData.GM = game.user.isGM;
        return sheetData;
    }
}