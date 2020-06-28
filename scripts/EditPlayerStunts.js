class EditPlayerStunts extends FormApplication {

    constructor(...args){
        super(...args);
        //This is a good place to set up some variables at the top level so we can access them with this.
        if (this.object.isToken) {
            this.options.title=`Stunt editor for token ${this.object.name}`
        } else {
            this.options.title=`Stunt editor for ${this.object.name}`
        }
    } //End constructor

    static get defaultOptions(){
        const options = super.defaultOptions;
        options.template = "systems/ModularFate/templates/EditPlayerStunts.html";
        options.width = auto;
        options.height = auto;
        options.title = `Character stunt editor`;
        options.closeOnSubmit = false;
        options.id = "PlayerStuntSetup";
        options.resizable = true;
        return options 
    } // End getDefaultOptions

    async _updateObject(event, formData){
        // This returns all the forms fields with names as a JSON object with their values. 
        // It is required for a FormApplication.
        // It is called when you call this.submit();

        //await this.object.update({"data.tracks":this.working_tracks}); 
    }

    activateListeners(html) {
        super.activateListeners(html);
        //const skillButtons = html.find("button[class='skill_button']");
        //skillButtons.on("click", event => this._onSkillButton(event, html));
        //skillButtons.on("click", event => this._onSkillButton(event, html));
        
        
    } //End activateListeners

    setSheet (ActorSheet){
        this.sheet = ActorSheet;
    } //We will call render functions when change data here, and the sheet will tell us when to render as well.

    async getData(){

        //TemplateData is returned to the form for use with HandleBars.
        const templateData = {
            
        }
        return templateData;
    } //End getData
} //End EditPlayerTracks