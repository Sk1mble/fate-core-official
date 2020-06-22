export class ModularFateCharacter extends ActorSheet {

    static get defaultOptions() {
        const options = super.defaultOptions;
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
    }

    //Here are the event listener functions.
    async _onSkillsButton(event, html){
        //Launch the EditPlayerSkills FormApplication.
        let editor = new EditPlayerSkills(this.actor);//Passing the actor works SOO much easier.
        editor.render(true);
    }
  
    getData() {
        const sheetData = super.getData();
        return sheetData;
    }
}