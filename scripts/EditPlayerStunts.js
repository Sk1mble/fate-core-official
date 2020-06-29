class EditPlayerStunts extends FormApplication {

    constructor(actor, stunt){
        super(actor, stunt);
        this.actor = actor;
        this.stunt=duplicate(stunt);

        //This is a good place to set up some variables at the top level so we can access them with this.
        if (this.actor.isToken) {
            this.options.title=`Stunt editor for [Token] ${this.object.name}`
        } else {
            this.options.title=`Stunt editor for ${this.object.name}`
        }
       
    } //End constructor

    static get defaultOptions(){
        const options = super.defaultOptions;
        options.template = "systems/ModularFate/templates/EditPlayerStunts.html";
        options.width = "710";
        options.height = "auto";
        options.title = `Character stunt editor`;
        options.closeOnSubmit = true;
        options.id = "PlayerStuntSetup";
        options.resizable = true;
        return options 
    } // End getDefaultOptions

    async _updateObject(event, formData){
        if (formData["name"]!=this.stunt.name) {
            await this.object.update({"data.stunts":{[`-=${this.stunt.name}`]:null}});
        }
        
        for (let t in formData){
            this.stunt[t]=formData[t];
        }
        await this.actor.update({"data.stunts":{[this.stunt.name]:this.stunt}})
    }

    activateListeners(html) {
        super.activateListeners(html);
        const addButton = html.find("button[id='add']");
        addButton.on("click", event => this._onAddButton(event, html));
        const saveButton = html.find("button[id='save']");
        saveButton.on("click", event => this._onSaveButton(event, html));
    } //End activateListeners

    async _onSaveButton(event, html){
        this.submit();
    }

    async _onAddButton(event,html){
        let name=html.find("input[name='new_name']")[0].value;
        let description = html.find("textarea[name='new_description']")[0].value;
        let plusTwo = html.find("input[name='new_plusTwo']")[0].checked;
        let overcome = html.find("input[name='new_overcome']")[0].checked;
        let defend = html.find("input[name='new_defend']")[0].checked;
        let caa = html.find("input[name='new_caa']")[0].checked;
        let attack = html.find("input[name='new_attack']")[0].checked;
        let linked_skill = html.find("select[name='new_linked_skill']")[0]

        let stunt = {};
        stunt.name=name;
        stunt.description=description;
        stunt.plusTwo=plusTwo;
        stunt.overcome=overcome;
        stunt.defend=defend;
        stunt.caa=caa;
        stunt.attack=attack;
        stunt.linked_skill=linked_skill.value;
        this.submit();
        await this.object.update({"data.stunts":{[name]:stunt}})
    }

    setSheet (ActorSheet){
        this.sheet = ActorSheet;
    } //We will call render functions when change data here, and the sheet will tell us when to render as well.

    async getData(){
        let data={}
        data.stunt=this.stunt;
        data.skills=this.actor.data.data.skills;
        return data
    } //End getData
} //End EditPlayerTracks