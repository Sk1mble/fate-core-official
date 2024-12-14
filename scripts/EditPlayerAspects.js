class EditPlayerAspects extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2){
    constructor(actor, application){
            super(actor, application);
            game.system.apps["actor"].push(this);
            game.system.apps["item"].push(this);
            this.aspects = foundry.utils.duplicate(actor.system.aspects);
            this.actor = actor;
    }

    get title(){
        if(this.actor.isToken){
            return`${game.i18n.localize("fate-core-official.EditTokenAspectsTitle")} ${this.actor.name}`                    
        } else {
            return`${game.i18n.localize("fate-core-official.EditAspectsTitle")} ${this.actor.name}`
        }
    }

    _onRender(context, options){
        const removeButton = this.element.querySelectorAll("button[name='remove_aspect']")
        removeButton.forEach(button => button?.addEventListener("click", event => this._onRemove(event)));

        const addButton = this.element.querySelector("button[name='new_aspect']")
        addButton?.addEventListener("click", event => this._onAdd(event));

        const up = this.element.querySelectorAll("button[name='aspect_up']");
        const down = this.element.querySelectorAll("button[name='aspect_down']");
        up.forEach(button => button?.addEventListener("click", event => this._on_move(event, -1)));
        down.forEach(button => button?.addEventListener("click", event => this._on_move(event, 1)));

        const name = this.element.querySelectorAll("input[class='aspect_name']")
        name.forEach(field => field?.addEventListener("change", event => this._on_name_change(event)));

        const value = this.element.querySelectorAll("textarea[class='aspect_value']")
        value.forEach(field => field?.addEventListener("change", event => this._on_value_change(event)));

        const notes = this.element.querySelectorAll("textarea[class='aspect_notes']");
        notes.forEach(field => field?.addEventListener ("change", event => this._on_notes_change(event)));

        for (let aspect in this.aspects){
            let id = `aspect_description_${fcoConstants.getKey(this.aspects[aspect].name)}`;
            let description = document.getElementById(id+"_rich");
            let description_editable = document.getElementById(id)
            let id2 = `notes_${fcoConstants.getKey(this.aspects[aspect].name)}`;
            let notes = document.getElementById(id2+"_rich");
            let notes_editable = document.getElementById (id2);
            fcoConstants.getPen(id);
            fcoConstants.getPen(id2);

            description?.addEventListener("keyup", event => {
                if (event.code == "Tab") {
                    description.click();
                }
            })

            description?.addEventListener('click', event => {
                if (event.target.outerHTML.startsWith("<a data")) return;
                description.style.display = "none";
                description_editable.style.display = "block"
                description_editable.focus();
            })

            if (this.actor.isOwner){
                description?.addEventListener("contextmenu", async event => {
                    let text = await fcoConstants.updateText("Edit raw HTML",event.currentTarget.innerHTML,true);
                    if (text != "discarded") {
                        description.innerHTML = text;
                        description_editable.innerHTML = text;
                        let key = event.currentTarget?.getAttribute("data-key");
                        let aspect = this.aspects[key];
                        aspect["description"] = text;
                    }
                })

                notes?.addEventListener('contextmenu', async event => {
                    let text = await fcoConstants.updateText("Edit raw HTML",event.currentTarget.innerHTML,true);
                    if (text != "discarded") {
                        notes_editable.innerHTML = text;   
                        notes.innerHTML = text;  
                        let key = event.currentTarget?.getAttribute("data-key");
                        let aspect = this.aspects[key];
                        aspect["notes"] = text;
                    }
                })
            }
    
            description_editable?.addEventListener('blur', async event => {
                if (!window.getSelection().toString()){
                    let desc = await DOMPurify.sanitize(await TextEditor.enrichHTML(event.currentTarget.innerHTML, {secrets:this.actor.isOwner, documents:true, async:true}));
                    description.style.display = "block";
                    description_editable.style.display = "none"
                    description_editable.innerHTML = desc;
                    description.innerHTML = desc;
                    let key = event.target.getAttribute("data-key");
                    let aspect = this.aspects[key];
                    aspect.description = desc;
                }
            })

            notes?.addEventListener("keyup", event => {
                if (event.code == "Tab") {
                    notes.click();
                }
            })
        
            notes?.addEventListener('click', event => {
                if (event.target.outerHTML.startsWith("<a data")) return;
                notes.style.display = "none";
                notes_editable.style.display = "block"
                notes_editable.focus();
            })

            notes_editable?.addEventListener('blur', async event => {
                if (!window.getSelection().toString()){
                    let text = DOMPurify.sanitize(await TextEditor.enrichHTML(event.currentTarget.innerHTML, {secrets:this.actor.isOwner, documents:true, async:true}));
                    notes.style.display = "block";
                    notes_editable.style.display = "none"
                    notes_editable.innerHTML = text;
                    notes.innerHTML = text;
                    let key = event.target.getAttribute("data-key");
                    let aspect = this.aspects[key];
                    aspect.notes = text;
                }
            })   
        }
    }

    async _on_name_change(event){
        let key = event.target.name.split("_")[1]
        let newName = event.target.value;

        if (!newName) {
            ui.notifications.error(game.i18n.localize("fate-core-official.YouCannotHaveAnAspectWithABlankName"));
            event.target.value = this.aspects[key].name;
            return;
        }

        let newAspect = new fcoAspect({
            name:newName,
            description:this.aspects[key].description,
            notes:this.aspects[key].notes,
            value:this.aspects[key].value
        }).toJSON();
        
        if (newAspect){
            // Find the aspect with the same name as the old name and delete it
            delete this.aspects[key]
            this.aspects[fcoConstants.tob64(newName)]=newAspect;
        }
        await this.render(false);
    }

    async _on_value_change(event){
        let key = event.target.getAttribute("data-key");
        let aspect = this.aspects[key];
        aspect.value = event.target.value;
    }

    async _on_notes_change(event){
        let key = event.target.getAttribute("data-key");
        let aspect = this.aspects[key];
        aspect.notes = event.target.value;
    }

    async _on_move(event, direction){
        let info = event.target.id.split("_");
        let aspect = info[1]
        this.aspects = fcoConstants.moveKey(this.aspects, aspect, direction)
        this.render(false);
    }

    async _onRemove(event){
        let del = await fcoConstants.confirmDeletion();
        if (del){
            let info = event.target.id.split("_");
            let aspectKey = info[1];
            delete this.aspects[aspectKey];
            this.render(false);
        }
    }

    async _onAdd(event){
        let count = 0;
        for (let a in this.aspects){
            if (this.aspects[a].name.startsWith(game.i18n.localize("fate-core-official.New_Aspect"))){
                count++
            }
        }
        let name = game.i18n.localize("fate-core-official.New_Aspect") + " "+ count;
        let newAspect = new fcoAspect({"name":name, "description":game.i18n.localize("fate-core-official.New_Aspect"),"value":game.i18n.localize("fate-core-official.New_Aspect"),"notes":"Notes"}).toJSON();
        if (newAspect){
            this.aspects[fcoConstants.tob64(newAspect.name)] = newAspect;
            this.render(false);
        }
    }

    //Set up the default options for instances of this class
    static DEFAULT_OPTIONS = {
        tag: "form",
        classes:['fate'],
        position: {
            width: 800
        },
        window: {
            title: this.title,
            icon: "fas fa-scroll",
            resizable: true
        },
        form: {
            closeOnSubmit: false,
            submitOnChange: false,
            handler: EditPlayerAspects.#updateAspects
        }
    }

    static PARTS = {
        "PlayerAspectSetup":{
            template: "systems/fate-core-official/templates/EditPlayerAspects.html",
            scrollable: ['#aspect_editor']
        }
    }

    async _prepareContext(){
        let current = foundry.utils.duplicate(this.actor.system.aspects);
        let updated = this.aspects;
        for (let aspect in current){
            if (current[aspect].notes == undefined){
                current[aspect].notes = "";
            }
        }
        for (let aspect in current){
            if (fcoConstants.gbn(updated, current[aspect].name) == undefined){
                delete current[aspect];
            }
        }
        let data = {};
        data.aspects = foundry.utils.mergeObject(foundry.utils.duplicate(this.aspects), current);//This allows us to update if any aspects change while we're editing this, but won't respawn deleted aspects.
        for (let as in data.aspects){
            data.aspects[as].richDesc = await fcoConstants.fcoEnrich(data.aspects[as].description, this.actor)
            data.aspects[as].richNotes = await fcoConstants.fcoEnrich(data.aspects[as].notes, this.actor)
        }
        return data;
    }

    static async #updateAspects(event, form, formData){
        await this.actor.update({"system.aspects":null}, {noHook:true, renderSheet:false})
        await this.actor.update({"system.aspects":this.aspects})
    }

    //This function is called when an actor or item update is called.

    async renderMe(id){
        await setTimeout(async () => {
                if (this?.actor?.id == id || this?.actor?.parent?.id == id){
                    if (!this.renderPending) {
                        this.renderPending = true;
                        setTimeout(() => {
                        this.render(false);
                        this.renderPending = false;
                        }, 50);
                    }
                }    
            }, 50);
        
    }
}