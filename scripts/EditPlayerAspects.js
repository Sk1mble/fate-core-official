class EditPlayerAspects extends FormApplication{
    constructor(...args){
            super(...args);
    
                if(this.object.isToken){
                    this.options.title=`${game.i18n.localize("fate-core-official.EditTokenAspectsTitle")} ${this.object.name}`                    
                } else {
                    this.options.title=`${game.i18n.localize("fate-core-official.EditAspectsTitle")} ${this.object.name}`
                }
                this.player_aspects=duplicate(this.object.system.aspects);
                
                game.system.apps["actor"].push(this);
                game.system.apps["item"].push(this);
                this.aspects=duplicate(this.object.system.aspects);
    }

    activateListeners(html){
        super.activateListeners(html);
        const saveButton = html.find("button[id='save_aspects']");
        saveButton.on("click", event => this.submit())
        const removeButton = html.find("button[name='remove_aspect']")
        removeButton.on("click", event => this._onRemove(event, html));

        const addButton = html.find("button[name='new_aspect']")
        addButton.on("click", event => this._onAdd(event, html));

        const up = html.find("button[name='aspect_up']");
        const down = html.find("button[name='aspect_down']");
        up.on("click", event => this._on_move(event, html, -1));
        down.on("click", event => this._on_move(event, html, 1));

        const name = html.find("input[class='aspect_name']")
        name.on("change", event => this._on_name_change(event, html));

        const value = html.find("textarea[class='aspect_value']")
        value.on("change", event => this._on_value_change(event, html));

        const notes = html.find("textarea[class='aspect_notes']");
        notes.on("change", event => this._on_notes_change(event, html));

        for (let aspect in this.aspects){
            let id = `aspect_description_${fcoConstants.getKey(aspect)}`;
            let id2 = `notes_${fcoConstants.getKey(aspect)}`;
            fcoConstants.getPen(id);
            fcoConstants.getPen(id2);

            $(`#${id}_rich`).on('keyup', event => {
                if (event.which == 9) $(`#${id}_rich`).trigger("click");
            })

            $(`#${id}_rich`).on('click', event => {
                if (event.target.outerHTML.startsWith("<a data")) return;
                $(`#${id}_rich`).css('display', 'none');
                $(`#${id}`).css('display', 'block');
                $(`#${id}`).focus();
            })

            if (this.object.isOwner){
                $(`#${id}_rich`).on('contextmenu', async event => {
                    let text = await fcoConstants.updateText("Edit raw HTML",event.currentTarget.innerHTML,true);
                    if (text != "discarded") {
                        $(`#${id}`)[0].innerHTML = text;   
                        $(`#${id}_rich`)[0].innerHTML = text; 
                        let name = event.currentTarget.getAttribute("name").split("_")[1];
                        this.aspects[name].description=text;
                    }
                })

                $(`#${id2}_rich`).on('contextmenu', async event => {
                    let text = await fcoConstants.updateText("Edit raw HTML",event.currentTarget.innerHTML,true);
                    if (text != "discarded") {
                        $(`#${id2}`)[0].innerHTML = text;   
                        $(`#${id2}_rich`)[0].innerHTML = text;  
                        let name = event.currentTarget.getAttribute("name").split("_")[1];
                        this.aspects[name].notes=text;
                    }
                })
            }
    
            $(`#${id}`).on('blur', async event => {
                if (!window.getSelection().toString()){
                    let desc; 
                    if (isNewerVersion(game.version, '9.224')){
                        desc = DOMPurify.sanitize(await TextEditor.enrichHTML(event.currentTarget.innerHTML, {secrets:this.object.isOwner, documents:true, async:true}));
                    } else {
                        desc = DOMPurify.sanitize(await TextEditor.enrichHTML(event.currentTarget.innerHTML, {secrets:this.object.isOwner, entities:true, async:true}));
                    }

                    $(`#${id}`).css('display', 'none');
                    $(`#${id}_rich`)[0].innerHTML = desc;    
                    $(`#${id}_rich`).css('display', 'block');
                    let name = event.target.getAttribute("name").split("_")[1];
                    this.aspects[name].description=event.target.innerHTML;
                }
            })
            $(`#${id2}_rich`).on('keyup', event => {
                if (event.which == 9) $(`#${id2}_rich`).trigger("click");
            })
        
            $(`#${id2}_rich`).on('click', event => {
                if (event.target.outerHTML.startsWith("<a data")) return;
                $(`#${id2}_rich`).css('display', 'none');
                $(`#${id2}`).css('display', 'block');
                $(`#${id2}`).focus();
            })
    
            $(`#${id2}`).on('blur', async event => {
                if (!window.getSelection().toString()){
                    let desc;
                    if (isNewerVersion(game.version, '9.224')){
                        desc = DOMPurify.sanitize(await TextEditor.enrichHTML(event.target.innerHTML, {secrets:this.object.isOwner, documents:true, async:true}))
                    } else {
                        desc = DOMPurify.sanitize(await TextEditor.enrichHTML(event.target.innerHTML, {secrets:this.object.isOwner, entities:true, async:true}))
                    }
                    
                    $(`#${id2}`).css('display', 'none');
                    $(`#${id2}_rich`)[0].innerHTML = desc;    
                    $(`#${id2}_rich`).css('display', 'block');
                    let name = event.target.getAttribute("name").split("_")[1];
                    this.aspects[name].notes=event.target.innerHTML;
                }
            })    
        }
    }

    async _on_name_change(event, html){
        let name = event.target.name.split("_")[1];
        let newName = event.target.value;
        if (!newName) {
            ui.notifications.error(game.i18n.localize("fate-core-official.YouCannotHaveAnAspectWithABlankName"));
            event.target.value = name;
            return;
        }
        
        let newAspect = new fcoAspect({
            name:newName.split(".").join("․").trim(),
            description:this.aspects[name].description,
            value:this.aspects[name].value
        }).toJSON();
        
        if (newAspect){
            delete this.aspects[name]
            this.aspects[newName]=newAspect;
            this.render(false);
        }
    }

    async _on_value_change(event, html){
        let name = event.target.name.split("_")[1];
        this.aspects[name].value=event.target.value;
    }

    async _on_notes_change(event, html){
        let name = event.target.name.split("_")[1];
        this.aspects[name].notes=event.target.value;
    }

    async _on_move(event,html, direction){
        let info = event.target.id.split("_");
        let aspect = info[1]
        this.aspects = fcoConstants.moveKey(this.aspects, aspect, direction)
        this.render(false);
    }

    async _onRemove(event,html){
        let del = await fcoConstants.confirmDeletion();
        if (del){
            let info = event.target.id.split("_");
            let name = info[1];
            delete this.aspects[name];
            this.render(false);
        }
    }

    async _onAdd(event, html){
        let count = 0;
        for (let a in this.aspects){
            if (a.startsWith(game.i18n.localize("fate-core-official.New_Aspect"))){
                count++
            }
        }
        let name = game.i18n.localize("fate-core-official.New_Aspect") + " "+ count;
        let newAspect = new fcoAspect({"name":name, "description":game.i18n.localize("fate-core-official.New_Aspect"),"value":game.i18n.localize("fate-core-official.New_Aspect")}).toJSON();
        if (newAspect){
            this.aspects[newAspect.name] = newAspect;
            this.render(false);
        }
    }

    //Set up the default options for instances of this class
    static get defaultOptions() {
        const options = super.defaultOptions; //begin with the super's default options
        //The HTML file used to render this window
        options.template = "systems/fate-core-official/templates/EditPlayerAspects.html"; 
        options.width = "650";
        options.height = "800";
        options.title = game.i18n.localize("fate-core-official.CharacterAspectEditor");
        options.closeOnSubmit = false;
        options.id = "PlayerAspectSetup"; // CSS id if you want to override default behaviors
        options.resizable = true;
        options.classes = options.classes.concat(['fate']);
        return options;
    }

    async getData(){
        let current = duplicate(this.object.system.aspects);
        let updated = this.aspects;
        for (let aspect in current){
            if (current[aspect].notes == undefined){
                current[aspect].notes = "";
            }
        }
        for (let aspect in current){
            if (updated[aspect] == undefined){
                delete current[aspect];
            }
        }
        let data = mergeObject (duplicate(this.aspects), current);//This allows us to update if any aspects change while we're editing this, but won't respawn deleted aspects.
        for (let as in data){
            data[as].richDesc = await fcoConstants.fcoEnrich(data[as].description, this.object)
            data[as].richNotes = await fcoConstants.fcoEnrich(data[as].notes, this.object)
        }
        return data;
    }

    async _updateObject(event, formData){
        await this.object.update({"system.aspects":null}, {noHook:true, render:false})
        await this.object.update({"system.aspects":this.aspects})
    }

    //This function is called when an actor or item update is called.

    async renderMe(id){
        await setTimeout(async () => {
                if (this?.object?.id == id || this?.object?.parent?.id == id){
                    if (!this.renderPending) {
                        this.renderPending = true;
                        setTimeout(() => {
                        this.render(false);
                        this.renderPending = false;
                        }, 150);
                    }
                }    
            }, 50);
        
    }
}