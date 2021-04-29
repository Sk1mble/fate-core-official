Hooks.once('init', async function () {
    //On init, we initialise all settings and settings menus and override the HUD as required.
    //console.log(`Initializing manageAspects`);
    //We will be using this setting to store the world's list of aspects.
    
    game.settings.register("FateCoreOfficial", "aspects", {
        name: "Aspects",
        hint: "This is the list of aspects for this particular world.",
        scope: "world",
        config: false,
        type: Object,
        default:{}
    });

    // Register the menu to setup the world's aspect list.
    game.settings.registerMenu("FateCoreOfficial","AspectSetup", {
        name:game.i18n.localize("FateCoreOfficial.SetupAspects"),
        label:game.i18n.localize("FateCoreOfficial.Setup"),
        hint:game.i18n.localize("FateCoreOfficial.SetupAspectsHint"),
        type:AspectSetup,
        restricted:true
    });
});

//AspectSetup: This is the class called from the options to view and edit the aspects.
class AspectSetup extends FormApplication{
    constructor(...args){
        super(...args);
        game.system.manageAspects = this;
    }

    async _updateObject(event) {
    }

    //Set up the default options for instances of this class
    static get defaultOptions() {
        const options = super.defaultOptions; //begin with the super's default options
        //The HTML file used to render this window
        options.template = "systems/FateCoreOfficial/templates/AspectSetup.html"; 
        options.width = "auto";
        options.height = "auto";
        options.title = `${game.i18n.localize("FateCoreOfficial.SetupAspectsForWorld")} ${game.world.data.title}`;
        options.closeOnSubmit = false;
        options.id = "AspectSetup"; // CSS id if you want to override default behaviors
        options.resizable = false;
        return options;
    }
    //The function that returns the data model for this window. In this case, we only need the game's aspect list.
    getData(){
        this.aspects=game.settings.get("FateCoreOfficial","aspects");
        const templateData = {
           aspects:this.aspects
        }
        return templateData;
    }
    
    //Here are the action listeners
    activateListeners(html) {
        super.activateListeners(html);
        const editButton = html.find("button[id='editAspect']");
        const deleteButton = html.find("button[id='deleteAspect']");
        const addButton = html.find("button[id='addAspect']");
        const selectBox = html.find("select[id='aspectListBox']");
        const copyButton = html.find("button[id='copyAspect']");
        const exportAspect = html.find("button[id='exportAspect']");
        const importAspects = html.find("button[id='importAspects']");
        const exportAspects = html.find("button[id='exportAspects']");
        const orderAspects = html.find("button[id='orderAspects']");

        editButton.on("click", event => this._onEditButton(event, html));
        deleteButton.on("click", event => this._onDeleteButton(event, html));
        addButton.on("click", event => this._onAddButton(event, html));
        selectBox.on("dblclick", event => this._onEditButton(event, html));
        copyButton.on("click", event => this._onCopyButton(event, html));
        exportAspect.on("click", event => this._onExportAspect(event, html));
        importAspects.on("click", event => this._onImportAspects(event, html));
        exportAspects.on("click", event => this._onExportAspects(event, html));
        orderAspects.on("click", event => this._onOrderAspects(event, html));
    }

    //Here are the event listener functions.

    async _onOrderAspects (event, html){
        let oa = new OrderAspects();
        oa.manageAspects = this;
        oa.render(true);
    }

    async _onExportAspect(event, html){
        let aspects = game.settings.get("FateCoreOfficial","aspects");
        let slb = html.find("select[id='aspectListBox']")[0].value;
        let sk = aspects[slb];
        let aspect_text = `{"${slb}":${JSON.stringify(sk)}}`
 
        new Dialog({
            title: game.i18n.localize("FateCoreOfficial.CopyPasteToSaveAspect"), 
            content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:Montserrat; width:382px; background-color:white; border:1px solid lightsteelblue; color:black;">${aspect_text}</textarea></div>`,
            buttons: {
            },
        }).render(true);
    }

    async _onExportAspects(event, html){
        let aspects = game.settings.get("FateCoreOfficial","aspects");
        let aspects_text = JSON.stringify(aspects);
 
        new Dialog({
            title: game.i18n.localize("FateCoreOfficial.CopyPasteToSaveAspects"), 
            content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:Montserrat; width:382px; background-color:white; border:1px solid lightsteelblue; color:black;">${aspects_text}</textarea></div>`,
            buttons: {
            },
        }).render(true);
    }

    async getAspects(){
        return new Promise(resolve => {
            new Dialog({
                title: game.i18n.localize("FateCoreOfficial.PasteAspects"),
                content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:Montserrat; width:382px; background-color:white; border:1px solid lightsteelblue; color:black;" id="import_aspects"></textarea></div>`,
                buttons: {
                    ok: {
                        label: game.i18n.localize("FateCoreOfficial.Save"),
                        callback: () => {
                            resolve (document.getElementById("import_aspects").value);
                        }
                    }
                },
            }).render(true)
        });
    }

    async _onImportAspects(event, html){
        let text = await this.getAspects();
        try {
            let imported_aspects = JSON.parse(text);
            let aspects = duplicate(game.settings.get("FateCoreOfficial","aspects"));
            if (aspects == undefined){
                aspects = {};
            }
            for (let aspect in imported_aspects){
                aspects[aspect]=imported_aspects[aspect];
            }
            await game.settings.set("FateCoreOfficial","aspects", aspects);
            this.render(false);
        } catch (e) {
            ui.notifications.error(e);
        }
    }


    async _onCopyButton(event,html){
        let selectBox = html.find("select[id='aspectListBox']");
        let name = selectBox[0].value.trim();
        if (name=="" || name == undefined){
            ui.notifications.error(game.i18n.localize("FateCoreOfficial.SelectAnAspectFirst"));
        } else {
            let aspects=await game.settings.get("FateCoreOfficial", "aspects");
            let aspect = duplicate(aspects[name]);
            name = aspect.name+" "+game.i18n.localize("FateCoreOfficial.copy");
            aspect.name=name;
            aspects[name]=aspect;
            await game.settings.set("FateCoreOfficial","aspects",aspects);
            this.render(true);
            try {
                this.bringToTop();
            } catch  {
                // Do nothing.
            }
        }
    }
    
    async _onEditButton(event,html){
        //Launch the EditAspect FormApplication.
        let aspects = game.settings.get("FateCoreOfficial","aspects");       
        let aspect = html.find("select[id='aspectListBox']")[0].value;
        let e = new EditAspect(aspects[aspect]);
        e.render(true);
        try {
            e.bringToTop();
        } catch  {
            // Do nothing.
        }
    }

    async _onDeleteButton(event,html){
        let del = await FateCoreOfficialConstants.confirmDeletion();
        if (del){
            //Code to delete the selected aspect
            //First, get the name of the aspect from the HTML element aspectListBox
            let aspect = html.find("select[id='aspectListBox'")[0].value;
            
            //Find that aspect in the list of aspects
            let aspects=game.settings.get("FateCoreOfficial","aspects");
            if (aspects[aspect] != undefined){
                delete aspects[aspect];
                await game.settings.set("FateCoreOfficial","aspects",aspects);
                this.render(true);
                try {
                    e.bringToTop();
                } catch  {
                    // Do nothing.
                }
            }
        }
    }
    async _onAddButton(event,html){
        //Launch the EditAspect FormApplication.
        let e = new EditAspect(undefined);
        e.render(true);
    }
}//End AspectSetup

//EditAspect: This is the class to edit a specific Aspect
class EditAspect extends FormApplication{
    constructor(aspect){
            super(aspect);
            this.aspect=aspect;
            if (this.aspect==undefined){
                this.aspect={
                    "name":"",
                    "description":""
                }
            }
        }

        _updateObject(){

        }

    //Here are the action listeners
    activateListeners(html) {
        super.activateListeners(html);
        const saveButton = html.find("button[id='edit_aspect_save_changes']");
        saveButton.on("click", event => this._onSaveButton(event, html));
    }
        
    //Here are the event listener functions.
    async _onSaveButton(event,html){
        //Get the name and description of the aspect
        let name = html.find("input[id='edit_aspect_name']")[0].value.split(".").join("․").trim();
        let description = html.find("textarea[id='edit_aspect_description']")[0].value;
        let aspects=game.settings.get("FateCoreOfficial","aspects");
        let newAspect = {"name":name, "description":description};
        var existing = false;

        //First check if we already have an aspect by that name, or the aspect is blank; if so, throw an error.
        if (name == undefined || name ==""){
            ui.notifications.error(game.i18n.localize("FateCoreOfficial.YouCannotHaveAnAspectWithABlankName"))
        } else {
            if (aspects[name] != undefined){
                aspects[name] = newAspect;
                existing = true;
            }
        }
        if (!existing){
            if (this.aspect.name != ""){
                //That means the name has been changed. Delete the original aspect and replace it with this one.
                delete aspects[this.aspect.name]
            }            
            aspects[name]=newAspect;
        }
        await game.settings.set("FateCoreOfficial","aspects",aspects);
        this.close();
    }    

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "systems/FateCoreOfficial/templates/EditAspect.html"; 
    
        //Define the FormApplication's options
        options.width = "1000";
        options.height = "auto";
        options.title = game.i18n.localize("FateCoreOfficial.AspectEditor");
        options.closeOnSubmit = true;
        options.id = "EditAspect"; // CSS id if you want to override default behaviors
        options.resizable = true;
        return options;
    }
    getData(){
        const templateData = {
           aspect:this.aspect
        }
        return templateData;
        }
}

Hooks.on('closeEditAspect',async () => {
    game.system.manageAspects.render(true);
})

Hooks.on('closeOrderAspects', async () => {
    game.system.manageAspects.render(true);
})

class OrderAspects extends FormApplication {
    constructor(...args){
        super(...args);
        let aspects = game.settings.get("FateCoreOfficial", "aspects");
        this.data = [];
        for (let aspect in aspects){
            this.data.push(aspects[aspect]);
        }
    }
    //Set up the default options for instances of this class
    static get defaultOptions() {
        const options = super.defaultOptions; //begin with the super's default options
        //The HTML file used to render this window
        options.template = "systems/FateCoreOfficial/templates/OrderAspects.html"; 
        options.width = "auto";
        options.height = "auto";
        options.title = `${game.i18n.localize("FateCoreOfficial.OrderAspectsTitle")} ${game.world.data.title}`;
        options.closeOnSubmit = true;
        options.id = "OrderAspects"; // CSS id if you want to override default behaviors
        options.resizable = false;
        return options;
    }
    //The function that returns the data model for this window. In this case, we need the list of stress tracks
    //conditions, and consequences.
    getData(){
        return this.data;
    }

        //Here are the action listeners
        activateListeners(html) {
        super.activateListeners(html);
        const oa_up = html.find("button[name='oa_up']");
        const oa_down = html.find("button[name='oa_down']");
        const oa_save = html.find("button[id='oa_save']");
        
        oa_up.on("click", event => {
            let index = parseInt(event.target.id.split("_")[2]);
            if (index > 0){
                let aspect = this.data.splice(index,1)[0];
                this.data.splice(index - 1, 0, aspect);
                this.render(false);
            }
        })

        oa_down.on("click", event => {
            let index = parseInt(event.target.id.split("_")[2]);
            if (index < this.data.length){
                let aspect = this.data.splice(index, 1)[0];
                this.data.splice(index + 1, 0, aspect);
                this.render(false);
            }
        })

        oa_save.on("click", async event => {
            let aspects = {};
            for (let i = 0; i < this.data.length; i++){
                aspects[this.data[i].name] = this.data[i];
            }
            await game.settings.set("FateCoreOfficial", "aspects", aspects);
            this.close();
        })
    }
}
