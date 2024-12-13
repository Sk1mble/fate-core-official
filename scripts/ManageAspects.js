//AspectSetup: This is the class called from the options to view and edit the aspects.
class AspectSetup extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
    constructor(...args){
        super(...args);
        game.system.manageAspects = this;
    }

    //Set up the default options for instances of this class
    static DEFAULT_OPTIONS = {
        tag: "form",
        id: "AspectSetup",
        window: {
            title: this.title,
            icon: "fas fa-gear",
        }
    }

    static PARTS = {
        "ManageAspects":{
            template:"systems/fate-core-official/templates/AspectSetup.html"
        }
    }

    get title (){
        return `${game.i18n.localize("fate-core-official.SetupAspectsForWorld")} ${game.world.title}`;
    }

    //The function that returns the data model for this window. In this case, we only need the game's aspect list.
    _prepareContext(options){
        this.aspects = fcoConstants.wd().system.aspects;
        const templateData = {
           aspects:this.aspects
        }
        return templateData;
    }
    
    //Here are the action listeners
    _onRender(context, options) {
        const editButton = this.element.querySelector("button[id='editAspect']");
        const deleteButton = this.element.querySelector("button[id='deleteAspect']");
        const addButton = this.element.querySelector("button[id='addAspect']");
        const selectBox = this.element.querySelector("select[id='aspectListBox']");
        const copyButton = this.element.querySelector("button[id='copyAspect']");
        const exportAspect = this.element.querySelector("button[id='exportAspect']");
        const importAspects = this.element.querySelector("button[id='importAspects']");
        const exportAspects = this.element.querySelector("button[id='exportAspects']");
        const orderAspects = this.element.querySelector("button[id='orderAspects']");

        editButton?.addEventListener("click", event => this._onEditButton(event));
        deleteButton?.addEventListener("click", event => this._onDeleteButton(event));
        addButton?.addEventListener("click", event => this._onAddButton(event));
        selectBox?.addEventListener("dblclick", event => this._onEditButton(event));
        copyButton?.addEventListener("click", event => this._onCopyButton(event));
        exportAspect?.addEventListener("click", event => this._onExportAspect(event));
        importAspects?.addEventListener("click", event => this._onImportAspects(event));
        exportAspects?.addEventListener("click", event => this._onExportAspects(event));
        orderAspects?.addEventListener("click", event => this._onOrderAspects(event));
    }

    //Here are the event listener functions.
    async _onOrderAspects (event){
        let oa = new OrderAspects();
        oa.manageAspects = this;
        oa.render(true);
    }

    async _onExportAspect(event){
        let aspects = fcoConstants.wd().system.aspects;
        let slb = this.element.querySelector("select[id='aspectListBox']").value;
        let key = fcoConstants.gkfn(aspects, slb)
        let aspect = aspects[key];
        let aspect_text = `{"${key}":${JSON.stringify(aspect, null, 5)}}`
        fcoConstants.getCopiableDialog(game.i18n.localize("fate-core-official.CopyPasteToSaveAspect"), aspect_text);
    }

    async _onExportAspects(event){
        let aspects = fcoConstants.wd().system.aspects;
        let aspects_text = JSON.stringify(aspects, null, 5);
        fcoConstants.getCopiableDialog(game.i18n.localize("fate-core-official.CopyPasteToSaveAspects"), aspects_text);
    }

    async getAspects(){
        return await fcoConstants.getImportDialog( game.i18n.localize("fate-core-official.PasteAspects"));        
    }

    async _onImportAspects(event){
        let text = await this.getAspects();
        try {
            let imported_aspects = JSON.parse(text);

            let aspects = foundry.utils.duplicate(fcoConstants.wd().system.aspects);
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
                await fcoConstants.wd().update({"system.aspects":imported_aspects});
                this.render(false);
            } else {
                // This is a single aspect
                let as = new fcoAspect(imported_aspects).toJSON();
                if (as){
                    let key = fcoConstants.tob64(as.name)
                    await fcoConstants.wd().update({
                        "system.aspects":{
                            [`${key}`]:as
                        }
                    });
                    this.render(false);
                }
            }
        } catch (e) {
            ui.notifications.error(e);
        }
    }


    async _onCopyButton(event){
        let selectBox = this.element.querySelector("select[id='aspectListBox']");
        let name = selectBox.value.trim();
        if (name=="" || name == undefined){
            ui.notifications.error(game.i18n.localize("fate-core-official.SelectAnAspectFirst"));
        } else {
            let aspects=await fcoConstants.wd().system.aspects;
            let aspect = foundry.utils.duplicate(fcoConstants.gbn(aspects, name));
            name = aspect.name+" "+game.i18n.localize("fate-core-official.copy");
            aspect.name=name;
            let key = fcoConstants.tob64(aspect.name);
            await fcoConstants.wd().update({
                "system.aspects":{
                    [`${key}`]:aspect
                }
            });
            this.render(true);
            try {
                this.bringToTop();
            } catch  {
                // Do nothing.
            }
        }
    }
    
    async _onEditButton(event){
        //Launch the EditAspect FormApplication.
        let aspects = fcoConstants.wd().system.aspects;
        let aspectName = this.element.querySelector("select[id='aspectListBox']").value;
        let aspect = fcoConstants.gbn(aspects, aspectName);
        let e = new EditAspect(aspect);
        e.render(true);
        try {
            e.bringToTop();
        } catch  {
            // Do nothing.
        }
    }

    async _onDeleteButton(event){
        let del = await fcoConstants.confirmDeletion();
        if (del){
            //Code to delete the selected aspect
            //First, get the name of the aspect from the HTML element aspectListBox
            let aspectName = this.element.querySelector("select[id='aspectListBox'").value;
            
            //Find that aspect in the list of aspects
            let aspects=fcoConstants.wd().system.aspects;
            let aspect = fcoConstants.gbn(aspects, aspectName);
            if (aspect != undefined){
                let key = fcoConstants.gkfn(aspects, aspect.name);
                await fcoConstants.wd().update({
                    "system.aspects":{
                        [`-=${key}`]:null
                    }
                });
                this.render(true);
                try {
                    e.bringToTop();
                } catch  {
                    // Do nothing.
                }
            }
        }
    }
    async _onAddButton(event){
        //Launch the EditAspect FormApplication.
        let e = new EditAspect(undefined);
        e.render(true);
    }
}//End AspectSetup

//EditAspect: This is the class to edit a specific Aspect
class EditAspect extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2){
    constructor(aspect){
            super(aspect);
            this.aspect = aspect;
            if (this.aspect == undefined){
                this.aspect = new fcoAspect().toJSON();
            }
        }

        async _updateObject(event, f){
            let name = f.name;
            let description = f.description;
            var existing = false;
            let aspects=fcoConstants.wd().system.aspects;
            let newAspect = new fcoAspect ({"name":name, "description":description, "notes":""}).toJSON();

            //First check if we already have an aspect by that name, or the aspect is blank; if so, throw an error.
            if (name == undefined || name ==""){
                ui.notifications.error(game.i18n.localize("fate-core-official.YouCannotHaveAnAspectWithABlankName"))
                return;
            } else {
                let aspect = fcoConstants.gbn(aspects, name);
                if (aspect != undefined){
                    let key = fcoConstants.gkfn(aspects, name);
                    //update with this aspect under the 'key'
                    await fcoConstants.wd().update({
                        "system.aspects":{
                            [`${key}`]:newAspect
                        }
                    });
                    existing = true;
                }
            }
            if (!existing){
                let key = fcoConstants.gkfn(aspects, this.aspect.name);
                if (this.aspect.name != ""){
                    //That means the name has been changed. Delete the original aspect and replace it with this one.
                    await fcoConstants.wd().update({
                        "system.aspects":{
                            [`-=${key}`]:null
                        }
                    });        
                }  
                await fcoConstants.wd().update({
                    "system.aspects":{
                        [`${fcoConstants.tob64(name)}`]:newAspect
                    }
                });
            }
            this.close();
        }

    //Here are the action listeners
    _onRender(context, options) {
        const saveButton = this.element.querySelector("button[id='edit_aspect_save_changes']");
        saveButton?.addEventListener("click", event => this._onSaveButton(event));
        fcoConstants.getPen("edit_aspect_description");
        const description_rich = document.getElementById("edit_aspect_description_rich");
        const description = document.getElementById("edit_aspect_description");

        description_rich?.addEventListener('click', async event => {
            if (event.target.outerHTML.startsWith("<a data")) return;
            description_rich.style.display = "none"; 
            description.style.display = "block";
            description.focus();
        })

        description_rich?.addEventListener('keyup', async event => {
            if (event.code == "Tab") description_rich.click();
        })

        description_rich?.addEventListener('contextmenu', async event => {
            let text = await fcoConstants.updateText("Edit raw HTML", event.currentTarget.innerHTML, true);
            if (text != "discarded") {
                description_rich.innerHTML = text;    
                description.innerHTML = text;    
            }
        })

        description?.addEventListener ('blur', async event => {
            if (!window.getSelection().toString()){
                let desc = DOMPurify.sanitize(await TextEditor.enrichHTML(event.target.innerHTML, {secrets:true, documents:true, async:true}));
                description.style.display = "none";
                description_rich.style.display = "block";
                description_rich.innerHTML = desc;
            }
        })
    }
        
    //Here are the event listener functions.
    async _onSaveButton(event){
        //Get the name and description of the aspect
        let name = document.getElementById("edit_aspect_name").value;
        let description = DOMPurify.sanitize(document.getElementById("edit_aspect_description").innerHTML);
        this._updateObject(event, {"name":name, "description":description})
    }    

    static DEFAULT_OPTIONS ={
        id: "EditAspect",
        tag: "form",
        position: {
            width:1000
        },
        window: {
            icon: "fas fa-gear",
            title: this.title
        },
    }

    static PARTS = {
        "EditSingleAspect":{
            template: "systems/fate-core-official/templates/EditAspect.html"
        }
    }

    get title(){
        return game.i18n.localize("fate-core-official.AspectEditor");
    }

    async _prepareContext(){
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

class OrderAspects extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
    constructor(...args){
        super(...args);
        let aspects = fcoConstants.wd().system.aspects;
        this.data = [];
        for (let aspect in aspects){
            this.data.push(aspects[aspect]);
        }
    }
    //Set up the default options for instances of this class
    static DEFAULT_OPTIONS = {
        id: "OrderAspects",
        tag: "form",
        window: {
            icon: "fas fa-gear",
            title: this.title
        }
    }

    static PARTS = {
        "OrderAspectsForm":{
            template: "systems/fate-core-official/templates/OrderAspects.html"
        }
    }

    get title() {
        return `${game.i18n.localize("fate-core-official.OrderAspectsTitle")} ${game.world.title}`;
    }

    //The function that returns the data model for this window. In this case, we need the list of stress tracks
    //conditions, and consequences.
    _prepareContext(){
        return this.data;
    }

    //Here are the action listeners
    _onRender(context, options) {
        const oa_up = this.element.querySelectorAll("button[name='oa_up']");
        const oa_down = this.element.querySelectorAll("button[name='oa_down']");
        const oa_save = this.element.querySelector("button[id='oa_save']");
        
        oa_up.forEach(button => button?.addEventListener("click", event => {
            let index = parseInt(event.target.id.split("_")[2]);
            if (index > 0){
                let aspect = this.data.splice(index,1)[0];
                this.data.splice(index - 1, 0, aspect);
                this.render(false);
            }
        }))

        oa_down.forEach(button => button?.addEventListener("click", event => {
            let index = parseInt(event.target.id.split("_")[2]);
            if (index < this.data.length){
                let aspect = this.data.splice(index, 1)[0];
                this.data.splice(index + 1, 0, aspect);
                this.render(false);
            }
        }))

        oa_save?.addEventListener("click", async event => {
            let aspects = {};
            for (let i = 0; i < this.data.length; i++){
                aspects[fcoConstants.tob64(this.data[i].name)] = this.data[i];
            }
            await fcoConstants.wd().update({"system.aspects":null}, {noHook:true, renderSheet:false});
            await fcoConstants.wd().update({"system.aspects":aspects});
            this.close();
        })
    }
}
