import { ExtraSheet } from "./ExtraSheet.js";

export class Thing extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
    constructor (...args){
        super(...args);
        this.editing = false;
    }

    async close(options){
        this.editing = false;
        await super.close(options);
    }

    static DEFAULT_OPTIONS = {
        tag: "form",
        position: {width:800, height:1000},
        form: {
            submitOnChange:true,
            closeOnSubmit: false
        },
        window: {
            title: this.title,
            icon: "fas fa-dagger",
            resizable: true,
        },
        classes: ['fate']
    }

    get title() {
        return `Thing: ${this.actor.name}`;
    }

    static PARTS = {
        form: {
            template:'systems/fate-core-official/templates/ThingSheet.html',
            scrollable: ['.mthing-extras__content'],
        }
    }

    get actorType() {
        return this.actor.type;
    }

    //Here are the action listeners
    _onRender(context, options) {
        let html = this.element;

        // Singleton elements
        const extras_button = html.querySelector("div[name='add_player_extra']");
        const isContainer = html.querySelector("input[name='system.container.isContainer']");
        const takeAll = html.querySelector("button[name='container_take_all']");
        const takeContainer = html.querySelector("button[name='container_take']");
        const expandAllExtras = html.querySelector("div[name='expandExtras']");
        const compressAllExtras = html.querySelector("div[name='compressExtras']")
        const input = html.querySelector('input[type="text"], input[type="number"], textarea');
        const expandExtraPane = html.querySelector("div[name='expandExtrasPane']");

        extras_button?.addEventListener("click", (event) => { 
            this._on_extras_click(event, this.element);
        });

        takeAll?.addEventListener("click", async event => {
            let character = game.user.character;

            if (character != undefined && character != null){
                await character.createEmbeddedDocuments("Item", this.document.items.contents);
                if (game.settings.get("fate-core-official", "DeleteOnTransfer")){ 
                    await this.actor.deleteEmbeddedDocuments("Item", this.actor.items.contents.map(item => item.id));
                }
            } else {
                ui.notifications.error ("You must be allocated a character to use these buttons. Drag items to the desired character instead.");
            }
        })

        takeContainer?.addEventListener("click", async event => {
            const character = game.user.character;
            if ( !character ) return ui.notifications.error ("You must be allocated a character to use these buttons. Drag items to the desired character instead.");
          
            // Create the container item if it does not already exist
            let container = new Item({name: this.actor.name, "description": this.actor.description, "type": "Extra"});

            if ( foundry.utils.isEmpty(this.actor.system.container.extra) ) {
                await this.actor.update({"system.container.extra": container.toObject()});
            } 
            else container = foundry.utils.duplicate(this.actor.system.container.extra);

            if (!container?.system?.contents && container?.data){
                container.system = {contents:container.data.contents};
            }

            // Populate the container contents
            container.system.contents = {
              locked: this.actor.system.container.locked,
              security: this.actor.system.container.security,
              extras: this.actor.items.contents
            };
          
            // Create the container item on the character
            await character.createEmbeddedDocuments("Item",[container]);
          
            // Delete tokens
            const tokens = this.actor.getActiveTokens();
            const tokenIds = tokens.map(t => t.id);
            if ( game.user.isGM ) {
              await canvas.scene.deleteEmbeddedDocuments("Token", tokenIds);
            } else {
              game.socket.emit("system.fate-core-official",{"action":"delete_token", "scene":game.scenes.viewed, "token":tokenIds});
            }
            // Close the actor sheet
            this.actor.sheet.close({force: true});
        })

        expandAllExtras?.addEventListener("click", event => {
            if (game.user.expanded == undefined){
                game.user.expanded = {};
            }

            this.actor.items.contents.forEach(item => {
                let key = this.actor.id+item.id+"_extra";
                game.user.expanded[key] = true;
            })  
            this.render(false);
        }) 

        compressAllExtras?.addEventListener("click", event => {
            if (game.user.expanded == undefined){
                game.user.expanded = {};
            }

            this.actor.items.contents.forEach(item => {
                let key = this.actor.id+item.id+"_extra";
                game.user.expanded[key] = false;
            })
            this.render(false);
        })

        input?.addEventListener("focus", event => {                
            if (this.editing == false) {
                this.editing = true;
            }
        });

        input?.addEventListener("blur", event => {
            this.editing = false
            if (this.renderBanked){
                this.renderBanked = false;
                this.render(false);
            }
        });

        input?.addEventListener("keyup", event => {
            if (event.keyCode === 13 && event.target.type == "input") {
                input.blur();
            }
        })

        expandExtraPane?.addEventListener("click", event=> {
            let key = this.actor.id + "_extras";
            if (game.user.expanded == undefined){
                game.user.expanded = {};
            }

            if (game.user.expanded[key] == undefined || game.user.expanded[key] == false){
                game.user.expanded[key] = true;
            } else {
                game.user.expanded[key] = false;
            }
            this.render(false);
        })

        // Elements that can be multiple
        const extras_edit = html.querySelectorAll("button[name='edit_extra']");
        const extras_delete = html.querySelectorAll("button[name='delete_extra']");
        const extras_grab = html.querySelectorAll("button[name='grab_extra']")
        const expandExtra = html.querySelectorAll("button[name='expandExtra']");
        
        for (let el of extras_edit){
            el?.addEventListener("click", (event) => { 
                this._on_extras_edit_click(event, this.element);
            });
        }

        for (let el of extras_delete){
            el?.addEventListener("click", (event) => { 
                this._on_extras_delete(event, this.element);
            });
        }

        for (let el of extras_grab){
            el?.addEventListener("click", (event) => { 
                this._on_extras_grab(event, this.element);
            });
        }

        for (let el of expandExtra) {
            el?.addEventListener("click", event => {
                let e_id = event.target.dataset.id;
                let key = this.actor.id+e_id+"_extra";
                if (game.user.expanded == undefined){
                    game.user.expanded = {};
                }

                if (game.user.expanded[key] == undefined || game.user.expanded[key] == false){
                    game.user.expanded[key] = true;
                } else {
                    game.user.expanded[key] = false;
                }
                this.render(false);
            })
        }

        // Implement drag/drop handling & double click item header to share
        const item = html.querySelectorAll("div[name='item_header']");
        for (let el of item){
            el?.addEventListener("dragstart", async event => this._on_item_drag (event, html));
            el?.addEventListener("dblclick", async event => {
                let content = `<strong>${game.i18n.format("fate-core-official.sharedFrom",{name:this.actor.name})}</strong><br/><hr>`
                let user = game.user;
                let item = await fromUuid(event.currentTarget.getAttribute("data-item"));
                item = foundry.utils.duplicate(item);
                
                content += `<strong>${item.name}</strong><br/>
                            <img style="display:block; padding:5px; margin-left:auto; margin-right:auto;" src="${item.img}"/><br/>
                            <strong>${game.i18n.localize("fate-core-official.Description")}:</strong> ${item.system.description.value}<br/>
                            <strong>${game.i18n.localize("fate-core-official.Permissions")}:</strong> ${item.system.permissions}<br/>
                            <strong>${game.i18n.localize("fate-core-official.Costs")}:</strong> ${item.system.costs}<br/>
                            <strong>${game.i18n.localize("fate-core-official.Refresh")}:</strong> ${item.system.refresh}<br/>`
    
                let items = [];
                for (let aspect in item.system.aspects){
                    items.push(`${item.system.aspects[aspect].value}`)
                }
                content += `<strong>${game.i18n.localize("fate-core-official.Aspects")}: </strong>${items.join(", ")}<br/>`;
                
                items = [];                            
                for (let skill in item.system.skills){
                    items.push (`${item.system.skills[skill].name} (${item.system.skills[skill].rank})`);
                }
                content += `<strong>${game.i18n.localize("fate-core-official.Skills")}: </strong>${items.join(", ")}<br/>`;
    
                items = [];                            
                for (let stunt in item.system.stunts){
                    items.push (item.system.stunts[stunt].name);
                }
                content += `<strong>${game.i18n.localize("fate-core-official.Stunts")}: </strong>${items.join(", ")}<br/>`;
    
                items = [];                            
                for (let track in item.system.tracks){
                    items.push (item.system.tracks[track].name);
                }
                content += `<strong>${game.i18n.localize("fate-core-official.tracks")}: </strong>${items.join(", ")}<br/>`;
    
                ChatMessage.create({content: content, speaker : {user}, type: CONST.CHAT_MESSAGE_STYLES.OOC })
            })
        }

        const things = html.querySelector("div[class='thingSheet']");
        things?.addEventListener("drop", async event => {
            let data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
            let item;
            if (data.type == "Item") {
                item = await fromUuid(data.uuid);
            }
            if (item) {
                if (item.type == "Extra" && item?.actor?.id != this.actor?.id && this?.actor?.isOwner){
                    await this.actor.createEmbeddedDocuments("Item", [item]);
                    Hooks.call("dropActorSheetData", this.actor, this, data);
                }
            } 
        })
    }

    async _on_extras_grab(event, html){
        // This is a convenience method for people who are controlling a single character.
        let id = event.target.dataset.id.split("_")[0];
        
        let character = game.user.character;

        if (character != undefined && character != null){
            let item = this.actor.items.find(item => item.id == id);
            await character.createEmbeddedDocuments("Item", [item]);
            if (game.settings.get("fate-core-official", "DeleteOnTransfer")){ 
                await this.actor.deleteEmbeddedDocuments("Item", [id]);
            }
        } else {
            ui.notifications.error ("You must be allocated a character to use these buttons. Drag items to the desired character instead.");
        }
    }

    // Handler for dragging extras from a ThingSheet (not to be confused with the main character sheet drag handler).
    // We should standardsise this given that all extras are the same!
    async _on_item_drag (event, html){
        let item = await fromUuid(event.target.getAttribute("data-item"));
        let data = {
            "type":"Item",
            "uuid":item.uuid
        }
        await event.dataTransfer.setData("text/plain", JSON.stringify(data));
    }

    async _on_extras_edit_click(event, html){
        let items = this.actor.items;
        let item = items.get(event.target.dataset.id);
        let e = new ExtraSheet(item);
        await e.render(true);
    }
    
    async _on_extras_delete(event, html){
        let del = await fcoConstants.confirmDeletion();
        if (del){
            await this.actor.deleteEmbeddedDocuments("Item", [event.target.dataset.id]);
        }
    }

    async _on_extras_click(event, html){
        const data = {
            "name": game.i18n.localize("New Extra"),
            "type": "Extra"
        };
        const created = await this.actor.createEmbeddedDocuments("Item", [data]);
    }

    async _prepareContext() {
        if (game.user.expanded == undefined){
            game.user.expanded = {};
        }
        this.displayTitle = `Thing Sheet for ${this.actor.name}`;

        if (game.user.expanded[this.actor.id+"_extras"] == undefined) game.user.expanded[this.actor.id+"_extras"] = true;
        const superData = await super._prepareContext();
        const sheetData = foundry.utils.duplicate(superData.source);
        sheetData.document = superData.document;
        let items = this.actor.items.contents;
        items.sort((a, b) => (a.sort || 0) - (b.sort || 0)); // Sort according to each item's sort parameter.
        for (let item of items){
            item.richName = await fcoConstants.fcoEnrich(item.name);
            item.richDesc = await fcoConstants.fcoEnrich(item.system.description.value);
        }
        sheetData.items = items;

        sheetData.numExtras = sheetData.items.length;

        let viewable = false;
        if (game.user.isGM) viewable = true;
        if (!this.actor.system.container.isContainer) viewable = true;
        if (this.actor.system.container.isContainer && !this.actor.system.container.locked) viewable = true;
        sheetData.viewable = viewable;
        sheetData.GM = game.user.isGM;

        return sheetData;
    }

    async render(...args){
        if (!this.actor?.parent?.sheet?.editing && !this.editing && !window.getSelection().toString()){
            if (!this.renderPending) {
                    this.renderPending = true;
                    setTimeout(async () => {
                        await super.render(...args);
                        this.renderPending = false;
                    }, 50);
            }
        } else this.renderBanked = true;
    }
}
//preCreate[documentName](document:Document, data:object, options:object, userId:string) {}
Hooks.on('preCreateItem', (item) => {
    let actor = item.parent;
    if (actor?.type == "Thing") {
        if (actor.items.contents.length == 1 && actor.system.container.isContainer == false){
            ui.notifications.error("This is not a container and can only represent a single Extra.");        
            return false;
        }
        if (actor.system?.container?.isContainer == true && actor.system?.container?.locked == true){
            ui.notifications.error("You can't put items in a locked container.");
            return false;
        }
    }
})

Hooks.on('deleteToken', async (token) => {
    // Delete the actor associated with this token if it is a Thing.
    if (game.user == game.users.find(e => e.isGM && e.active)){
        let actor = game.actors.get(token?.actor?.id)

        if (actor?.type !== "Thing"){
            return;
        } else {
            if (game.user.isGM){
                await actor.delete();
            }
        }
    }
})

Hooks.on('deleteItem', async (item) => {
    let actor = item.parent;
    if (actor?.type !== "Thing"){
        return;
    }

    // Delete if this isn't a container and now has no items in it.
    if (actor.items.contents.length == 0){
        if (actor.type =="Thing" && !actor.system?.container?.isContainer){
            await actor.sheet.close({"force":true});
            if (game.user == game.users.find(e => e.isGM && e.active)){
                let t = game.scenes.viewed.tokens.contents.find(token => token?.actor?.id === actor.id);
                game.scenes.viewed.deleteEmbeddedDocuments("Token", [t.id])
            } else {
                let t = game.scenes.viewed.tokens.contents.find(token => token?.actor?.id === actor.id); //game.scenes.viewed.tokens.contents is the no-canvas safe alternative to game.scenes.viewed.tokens.contents.
                game.socket.emit("system.fate-core-official",{"action":"delete_token", "scene":game.scenes.viewed, "token":[t.id]});
            }
        }
    }
})

Hooks.on('updateActor', async (actor) => {
    if (actor.type !== "Thing"){
        return;
    }

    // Handle the necessary item management if this is turned into a container.
    if (game.user == game.users.find(e => e.isGM && e.active)){
        await checkContainer(actor);
    }
})

async function checkContainer (actor){
    if (!actor.updatePending) {
        actor.updatePending = true;
        setTimeout(() => {
            if (actor.items.contents.length === 1 && actor.system?.container?.isContainer){
                if (actor.items.contents[0].name == actor.system.container.extra.name){
                    actor.deleteEmbeddedDocuments("Item", [actor.items.contents[0].id]);
                }
            }
        
            if (actor.system.container.isContainer === false && actor.items.contents.length === 0){
                if (actor?.system?.container?.extra?.name !== undefined){
                    let item = foundry.utils.duplicate(actor.system.container.extra);
                    item.system.contents.extras = undefined;
                    actor.createEmbeddedDocuments("Item",[item]);
                }
            }
            actor.updatePending = false;
        }, 50);
    }
}

async function createThing (canvas_scene, data, user_id, shiftDown, x, y, actord){    
    if (data.type != "Item" && data.type != "Extra"){
        return;
    }

    let itemActor = undefined;
    let contents = undefined;
    let newItem;    

    newItem = new Item(data);
        
    //Let's get the contents, if there are any, so we can do some stuff with them later.
    if (newItem?.system?.contents){
        contents = foundry.utils.duplicate(newItem.system.contents);
        delete newItem.system.contents;
    }

    let folder = game.folders.find (f => f.name.startsWith("fate-core-official Things"));
            if (folder != undefined){
                folder.delete();
            }

            let isContainer = contents.extras != undefined;
            
            let toCreate = {
                name: newItem.name,
                type: "Thing",
                system:{"container.isContainer":isContainer, "container.extra":newItem.toJSON()},
                img:newItem.img,
                sort: 12000,
                ownership:{"default":3} // Owner permissions are really necessary to succesfully interact with objects.
            }
            if (!isContainer) toCreate.items = [newItem.toJSON()];

            itemActor = await Actor.create(toCreate
            ,{"renderSheet":false,"thing":true});   

            if (itemActor != undefined){ //Creation was successful, delete the item from the original actor.
                if (actord) {
                    let actor = fromUuidSync(actord);
                    if (game.settings.get("fate-core-official", "DeleteOnTransfer")){ 
                        if (shiftDown === false){
                            if (actor.constructor.name == "TokenDocument"){
                                actor = actor.actor;
                            }
                            let item = actor.items.get(data._id)
                            await item.delete();
                        }
                    } else {
                        if (shiftDown === true){
                            let item = actor.items.get(data._id)
                            await item.delete();
                        }
                    }
                }
            }

    let token = {
        name: itemActor.name,
        x:x,
        y:y,
        texture:{src:itemActor.img},
        width: 1,
        height: 1,
        vision: false,
        hidden: false,
        actorId: itemActor.id,
        actorLink: true,
        //actorData: {}
      }

    let scene = game.scenes.get(canvas_scene._id);
    await scene.createEmbeddedDocuments("Token", [token]); //createEmbeddedDocuments takes an array of creation data.
    //Now we need to create the contents and set the container parameters.
    if (contents?.extras != undefined){
        await itemActor.createEmbeddedDocuments("Item", contents.extras);
        await itemActor.update({
            "system.container.locked":contents.locked,
            "system.container.security":contents.security,
            "system.container.movable":true,
            "system.img":newItem.img,
        })
    }
}

Hooks.on ('dropCanvasData', async (canvas, data) => {
    if (data.type == "Item"){
        let item = fromUuidSync(data.uuid);
        if (item.pack){
            const pack = game.packs.get(item.pack);
            item = await pack.getDocument(item._id);
        }

        let itemd = item.toJSON();
        let actor = item?.actor?.uuid;

        if (game.user.isGM){
            let shift_down = game.system["fco-shifted"];    
            createThing (canvas.scene, itemd, game.user.id, shift_down, data.x, data.y, actor);
        } else {
            if (game.settings.get("fate-core-official","PlayerThings")){
                let GMs = game.users.contents.filter(user => user.active && user.isGM);
                if (GMs.length == 0) {
                    ui.notifications.error("A GM has to be logged in for you to create item tokens.")
                } else {
                    let shift_down = game.system["fco-shifted"];    
                    game.socket.emit("system.fate-core-official", {"action":"create_thing", "scene":canvas.scene, "data":itemd, "id":game.user.id, "shiftDown":shift_down, "x":data.x, "y":data.y, "actor":actor})
                }
            }
        }
    }
})

Hooks.on ('dropActorSheetData', async (target, sheet, data) => {
    if (data?.ident == "mf_draggable"){
        return;
    }
    let i = fromUuidSync(data.uuid);

    if (i?.type != "Extra"){
        return;
    }

    if (target.type == "Thing" && !target?.system?.container?.isContainer){
        return;
    }

    if (target.system?.container?.isContainer == true && target.system?.container?.locked == true){
        return;
    }

    if (data.uuid.startsWith("Compendium")){
        //target.createEmbeddedDocuments("Item",[i]);
        return;
    }

    if (data.uuid.startsWith("Item")){
        //target.createEmbeddedDocuments("Item",[i]);
        return;
    }

    if (target.id === i?.parent?.id){
        if (!data.uuid.startsWith("Scene")){ // This is being dragged on the same linked actor, do nothing.
            return;
        } else {
            // This is a token actor, so it could be being dragged from one instance of the token to another. 
            // We need to check if the token IDs are the same rather than the actor IDs.
            if (target.token.id === i?.parent?.token?.id){ // Being dragged within token sheet.
                return;
            } 
        }
    }

    if (target.isOwner){
        //target.createEmbeddedDocuments("Item",[i]);
        let shift_down = false; 
        shift_down = game.system["fco-shifted"];  
        if (game.settings.get("fate-core-official", "DeleteOnTransfer")){ 
            if (!shift_down){
                await i.delete();
            }
        } else {
            if (shift_down){
                await i.delete();
            }
        }
    }
})

Hooks.once('ready', async function () {
    game.socket.on("system.fate-core-official", async (data) => {
        if (game.user == game.users.activeGM){
            if (data.action == "create_thing"){
                await createThing (data.scene, data.data, data.id, data.shiftDown, data.x, data.y, data.actor);                
            }  
            if (data.action == "delete_token"){
                let scene = game.scenes.get(data.scene._id);
                await scene.deleteEmbeddedDocuments("Token", data.token);
            }
        }
    })    

    game.socket.on("system.fate-core-official", async (data) => {
        if (data.action == "error_msg" && data.id == game.user.id){
            ui.notifications.error(data.error);
        }
    })
})