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
   
    getData() {
        const sheetData = super.getData();
        //If skills, aspects, etc. are not initialised, we need to set them up here.
        //If the character has skills that are no longer in the world list, 
        //we should pop up a box to offer deletion etc.
        //If the character is missing skills that are now in the world list, they should be added
        //and a notification given to the player.
        //Remember to include logic that prevents changes from being initiated by 
        //someone who doesn't own the character sheet.
        console.log(sheetData);
        return sheetData;
    }
}