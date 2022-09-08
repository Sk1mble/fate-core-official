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
        options.template = "systems/fate-core-official/templates/AspectSetup.html"; 
        options.width = "auto";
        options.height = "auto";
        options.title = `${game.i18n.localize("fate-core-official.SetupAspectsForWorld")} ${game.world.title}`;
        options.closeOnSubmit = false;
        options.id = "AspectSetup"; // CSS id if you want to override default behaviors
        options.resizable = false;
        return options;
    }
    //The function that returns the data model for this window. In this case, we only need the game's aspect list.
    getData(){
        this.aspects=game.settings.get("fate-core-official","aspects");
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
        let aspects = game.settings.get("fate-core-official","aspects");
        let slb = html.find("select[id='aspectListBox']")[0].value;
        let sk = aspects[slb];
        let aspect_text = `{"${slb}":${JSON.stringify(sk, null, 5)}}`
 
        new Dialog({
            title: game.i18n.localize("fate-core-official.CopyPasteToSaveAspect"), 
            content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:var(--fco-font-family); width:382px; background-color:white; border:1px solid var(--fco-foundry-interactable-color); color:black;">${aspect_text}</textarea></div>`,
            buttons: {
            },
        }).render(true);
    }

    async _onExportAspects(event, html){
        let aspects = game.settings.get("fate-core-official","aspects");
        let aspects_text = JSON.stringify(aspects, null, 5);
 
        new Dialog({
            title: game.i18n.localize("fate-core-official.CopyPasteToSaveAspects"), 
            content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:var(--fco-font-family); width:382px; background-color:white; border:1px solid var(--fco-foundry-interactable-color); color:black;">${aspects_text}</textarea></div>`,
            buttons: {
            },
        }).render(true);
    }

    async getAspects(){
        return new Promise(resolve => {
            new Dialog({
                title: game.i18n.localize("fate-core-official.PasteAspects"),
                content: `<div style="background-color:white; color:black;"><textarea rows="20" style="font-family:var(--fco-font-family); width:382px; background-color:white; border:1px solid var(--fco-foundry-interactable-color); color:black;" id="import_aspects"></textarea></div>`,
                buttons: {
                    ok: {
                        label: game.i18n.localize("fate-core-official.Save"),
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

            let aspects = duplicate(game.settings.get("fate-core-official","aspects"));
            if (aspects == undefined){
                aspects = {};
            }

            if (!imported_aspects.hasOwnProperty("name")){
                // This is an aspects object
                // Validate the imported data to make sure they all match the schema
                for (let aspect in imported_aspects){
                    let as = new fcoAspect(imported_aspects[aspect]).toJSON();
                    if (as){
                        aspects[aspect]=as;
                    }
                }
            } else {
                // This is a single aspect
                let as = new fcoAspect(imported_aspects).toJSON();
                if (as){
                    skills[as.name] = as;
                }
            }
            
            await game.settings.set("fate-core-official","aspects", aspects);
            this.render(false);
        } catch (e) {
            ui.notifications.error(e);
        }
    }


    async _onCopyButton(event,html){
        let selectBox = html.find("select[id='aspectListBox']");
        let name = selectBox[0].value.trim();
        if (name=="" || name == undefined){
            ui.notifications.error(game.i18n.localize("fate-core-official.SelectAnAspectFirst"));
        } else {
            let aspects=await game.settings.get("fate-core-official", "aspects");
            let aspect = duplicate(aspects[name]);
            name = aspect.name+" "+game.i18n.localize("fate-core-official.copy");
            aspect.name=name;
            aspects[name]=aspect;
            await game.settings.set("fate-core-official","aspects",aspects);
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
        let aspects = game.settings.get("fate-core-official","aspects");       
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
        let del = await fcoConstants.confirmDeletion();
        if (del){
            //Code to delete the selected aspect
            //First, get the name of the aspect from the HTML element aspectListBox
            let aspect = html.find("select[id='aspectListBox'")[0].value;
            
            //Find that aspect in the list of aspects
            let aspects=game.settings.get("fate-core-official","aspects");
            if (aspects[aspect] != undefined){
                delete aspects[aspect];
                await game.settings.set("fate-core-official","aspects",aspects);
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
                this.aspect = new fcoAspect().toJSON();
            }
        }

        async _updateObject(event, f){
            let name = f.name;
            let description = f.description;
            var existing = false;
            let aspects=game.settings.get("fate-core-official","aspects");
            let newAspect = new fcoAspect ({"name":name, "description":description, "notes":""}).toJSON();

            //First check if we already have an aspect by that name, or the aspect is blank; if so, throw an error.
            if (name == undefined || name ==""){
                ui.notifications.error(game.i18n.localize("fate-core-official.YouCannotHaveAnAspectWithABlankName"))
                return;
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
            await game.settings.set("fate-core-official","aspects",aspects);
            this.close();
        }

    //Here are the action listeners
    activateListeners(html) {
        super.activateListeners(html);
        const saveButton = html.find("button[id='edit_aspect_save_changes']");
        saveButton.on("click", event => this._onSaveButton(event, html));
        fcoConstants.getPen("edit_aspect_description");

        const description_rich = html.find("div[id='edit_aspect_description_rich']");

        description_rich.on('click', async event => {
            if (event.target.outerHTML.startsWith("<a data")) return;
            $("#edit_aspect_description_rich").css('display', 'none');
            $("#edit_aspect_description").css('display', 'block');
            $("#edit_aspect_description").focus();
        })

        description_rich.on('keyup', async event => {
            if (event.which == 9) description_rich.trigger('click');
        })

        description_rich.on('contextmenu', async event => {
            let text = await fcoConstants.updateText("Edit raw HTML", event.currentTarget.innerHTML, true);
            if (text != "discarded") {
                $('#edit_aspect_description_rich')[0].innerHTML = text;    
                $('#edit_aspect_description')[0].innerHTML = text;    
            }
        })

        const aspect_desc = html.find("div[id='edit_aspect_description']");
        aspect_desc.on ('blur', async event => {
            if (!window.getSelection().toString()){
                
                let desc;
                if (isNewerVersion(game.version, '9.224')){
                    desc = DOMPurify.sanitize(await TextEditor.enrichHTML(event.target.innerHTML, {secrets:game.user.isGM, documents:true, async:true}));
                } else {
                    desc = DOMPurify.sanitize(await TextEditor.enrichHTML(event.target.innerHTML, {secrets:game.user.isGM, entities:true, async:true}));
                }
                $('#edit_aspect_description').css('display', 'none');
                $('#edit_aspect_description_rich')[0].innerHTML = desc;    
                $('#edit_aspect_description_rich').css('display', 'block');
            }
        })
    }
        
    //Here are the event listener functions.
    async _onSaveButton(event,html){
        //Get the name and description of the aspect
        let name = html.find("input[id='edit_aspect_name']")[0].value.split(".").join("․").trim();
        let description = DOMPurify.sanitize(html.find("div[id='edit_aspect_description']")[0].innerHTML);

        this._updateObject(event, {"name":name, "description":description})
    }    

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "systems/fate-core-official/templates/EditAspect.html"; 
    
        //Define the FormApplication's options
        options.width = "1000";
        options.height = "auto";
        options.title = game.i18n.localize("fate-core-official.AspectEditor");
        options.closeOnSubmit = true;
        options.id = "EditAspect"; // CSS id if you want to override default behaviors
        options.resizable = true;
        return options;
    }
    async getData(){
        const templateData = {
           aspect:this.aspect,
           richDesc:await fcoConstants.fcoEnrich(this.aspect.description)
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
        let aspects = game.settings.get("fate-core-official", "aspects");
        this.data = [];
        for (let aspect in aspects){
            this.data.push(aspects[aspect]);
        }
    }
    //Set up the default options for instances of this class
    static get defaultOptions() {
        const options = super.defaultOptions; //begin with the super's default options
        //The HTML file used to render this window
        options.template = "systems/fate-core-official/templates/OrderAspects.html"; 
        options.width = "auto";
        options.height = "auto";
        options.title = `${game.i18n.localize("fate-core-official.OrderAspectsTitle")} ${game.world.title}`;
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
            await game.settings.set("fate-core-official", "aspects", aspects);
            this.close();
        })
    }
}
