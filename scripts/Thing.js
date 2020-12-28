import { ExtraSheet } from "./ExtraSheet.js";

export class Thing extends ActorSheet {

    constructor (...args){
        super(...args);
        this.editing = false;
    }
    
    async submit(options) {
    }

    async close(options){
        this.editing = false;
        await super.close(options);
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.resizable=true;
        options.width = "800"
        options.height = "1000"
        options.scrollY = ['#mthing-content']
        return options;
    }

    get actorType() {
        return this.actor.data.type;
    }

    get template() {
        let template = 'systems/ModularFate/templates/ThingSheet.html'
        return template;
    }

    //Here are the action listeners
    activateListeners(html) {
        super.activateListeners(html);
        const extras_button = html.find("div[name='add_player_extra']");
        const extras_edit = html.find ("button[name='edit_extra']");
        const extras_delete = html.find("button[name='delete_extra']");
        const extras_grab = html.find("button[name='grab_extra']")

        extras_button.on("click", event => this._on_extras_click(event, html));
        extras_edit.on("click", event => this._on_extras_edit_click(event, html));
        extras_delete.on("click", event => this._on_extras_delete(event, html));
        extras_grab.on("click", event => this._on_extras_grab(event, html));


        const expandExtra = html.find("button[name='expandExtra']");

        const input = html.find('input[type="text"], input[type="number"], textarea');

        input.on("focus", event => {
                
            if (this.editing == false) {
                this.editing = true;
            }
        });
        input.on("blur", event => {
            this.editing = false
            if (this.renderBanked){
                this.renderBanked = false;
                this.render(false);
            }
        });

        input.on("keyup", event => {
            if (event.keyCode === 13 && event.target.type != "textarea") {
                input.blur();
            }
        })

        expandExtra.on("click", event => {
            let e_id = event.target.id.split("_")[0];
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

        const expandExtraPane = html.find("div[name='expandExtrasPane']");
        expandExtraPane.on("click", event=> {
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

        const expandAllExtras = html.find("div[name='expandExtras']");
        const compressAllExtras = html.find("div[name='compressExtras']")

        expandAllExtras.on("click", event => {
            if (game.user.expanded == undefined){
                game.user.expanded = {};
            }

            this.actor.items.entries.forEach(item => {
                let key = this.actor.id+item._id+"_extra";
                game.user.expanded[key] = true;
            })  
            this.render(false);
        })

        compressAllExtras.on("click", event => {
            if (game.user.expanded == undefined){
                game.user.expanded = {};
            }

            this.actor.items.entries.forEach(item => {
                let key = this.actor.id+item._id+"_extra";
                game.user.expanded[key] = false;
            })
            this.render(false);
        })

        const item = html.find("div[name='item_header']");
        item.on("dragstart", event => this._on_item_drag (event, html));
    }

    async _on_extras_grab(event, html){
        // This is a convenience method for people who are controlling a single character.
        let id = event.target.id.split("_")[0];
        
        let character = game.user.character;

        if (character != undefined && character != null){
            let item = this.actor.items.find(item => item._id == id);
            await character.createOwnedItem(item.data);
            await this.actor.deleteOwnedItem(id);
        } else {
            ui.notifications.error ("You must be allocated a character to use these buttons. Drag items to the desired character instead.");
        }
    }

    async _on_item_drag (event, html){
        let info = event.target.id.split("_");
        let item_id = info[1];
        let actor_id = info[0];
        let item = JSON.parse(event.target.getAttribute("data-item"));
        let tokenId = undefined;

        if (this.actor?.token?.data?.actorLink === false){
            tokenId = this.actor.token.id;
        }
        let data = {
                    "type":"Item",
                    "id":item_id,
                    "actorId":actor_id,
                    "data":item,
                    "tokenId":tokenId,
                    "scene":game.scenes.viewed
                }
        await event.originalEvent.dataTransfer.setData("text/plain", JSON.stringify(data));
    }

    async _on_extras_edit_click(event, html){
        let items = this.object.items;
        let item = items.get(event.target.id.split("_")[0]);
        let e = new ExtraSheet(item);
        await e.render(true);
    }
    
    async _on_extras_delete(event, html){
        let del = await ModularFateConstants.confirmDeletion();
        if (del){
            await this.actor.deleteOwnedItem(event.target.id.split("_")[0]);
        }
    }

    async _on_extras_click(event, html){
        const data = {
            "name": game.i18n.localize("New Extra"),
            "type": "Extra"
        };
        const created = await this.actor.createEmbeddedEntity("OwnedItem", data);
    }

    async getData() {
        if (game.user.expanded == undefined){
            game.user.expanded = {};
        }

        if (shouldUpdate(this.actor)){
            if (this.actor.data.data.container.isContainer){
                let img = this.actor.data.data.container.img;
                if (img == undefined) img = "icons/svg/mystery-man.svg";
                if (this.actor?.token?.img != img){
                    await this.actor.update({"token.img":img,"img":img})
                }
                if (this.actor.token != null && this.actor?.token?.img != img){
                    await this.actor.token.update({"img":img});
                }
            } else {
                let img = this.actor.items.entries[0]?.data?.img;
                if (img == undefined) img = "icons/svg/mystery-man.svg";

                if (this.actor?.token?.img != img){
                    await this.actor.update({"token.img":img,"img":img})
                }
                if (this.actor.token != null && this.actor.token.img != img){
                    await this.actor.token.update({"img":img});
                }
            }   
        }

        if (game.user.expanded[this.actor.id+"_extras"] == undefined) game.user.expanded[this.actor.id+"_extras"] = true;

        const sheetData = await super.getData();
        let numExtras = this.actor.items.entries.length;
        sheetData.numExtras = numExtras;
        let itemImg = this.actor.items.entries[0]?.img ?? "icons/svg/mystery-man.svg";
        let itemName = this.actor.items.entries[0]?.name ?? "Blank Item";
        sheetData.itemImg = itemImg;
        sheetData.itemName = itemName;

        let viewable = false;
        if (game.user.isGM) viewable = true;
        if (!this.actor.data.data.container.isContainer) viewable = true;
        if (this.actor.data.data.container.isContainer && !this.actor.data.data.container.locked) viewable = true;
        sheetData.viewable = viewable;
        sheetData.GM = game.user.isGM;

        return sheetData;
    }

    async render (...args){
        if (this.editing == false){
            super.render(...args);
        } else {
            this.renderBanked = true;
        }
    }
}

Hooks.on('preCreateOwnedItem', (actorData, itemData) => {
    if (actorData.type == "Thing") {
        let actor = game.actors.find(a=>a.id == actorData.id);
            if (actor.items.entries.length == 1 && actor.data.data.container.isContainer == false){
                ui.notifications.error("This is not a container and can only represent a single Extra.");        
                return false;
            }
            if (actor.data.data?.container?.isContainer == true && actor.data.data?.container?.locked == true){
                ui.notifications.error("You can't put items in a locked container.");
                return false;
            }
    }
})

Hooks.on('preUpdateToken', (scene, tokenData, aData) => {
    let token = canvas.tokens.placeables.find(t => t.id == tokenData._id);
    let actor = undefined;
    
    if (token != undefined) {
        actor = token.actor;
    } 

    if (actor?.data?.type != "Thing" || aData?.actorData?.items == undefined){
        return;
    }

        let changedItems = aData.actorData.items;
        let originalItems = actor.items.entries;
        if (changedItems.length > originalItems.length){
            if (originalItems.length == 1 && actor.data.data.container.isContainer == false){
                ui.notifications.error("This is not a container and can only represent a single Extra.")        
                return false;
            }

            if (actor.data.data?.container?.isContainer == true && actor.data.data?.container?.locked == true){
                ui.notifications.error("You can't put items in a locked container.");
                return false;
            }
        }
})

Hooks.on('updateToken', async (scene, tokenData, aData) => {

    let token = canvas.tokens.placeables.find(t => t.id == tokenData._id);
    let actor = undefined;
    
    if (token != undefined) {
        actor = token.actor;
    } 

    if (actor?.data?.type != "Thing" || aData?.actorData?.items == undefined){
        return;
    }
 
    if (actor.data.items.length == 0){
        if (actor.data.type =="Thing" && !actor.data.data?.container?.isContainer){
            await actor.sheet.close({"force":true});
            if (actor.token != undefined){
                if (game.user.isGM){
                    actor.token.delete();
                } else {
                    game.socket.emit("system.ModularFate",{"action":"delete_token", "scene":game.scenes.viewed, "token":actor.token.id});
                }
            }
        }
    }
})

async function createThing (canvas_scene, data, user_id){
    if (data.type != "Item"){
        return;
    }

    let itemActor = undefined;

    if (data.data != undefined){ // This means it came from a token
        let itemData = data.data;
        let newItem = new Item(itemData);
        let folder = game.folders.find (f => f.name.startsWith("ModularFate Things"));
                if (folder == undefined){
                    folder = await Folder.create({name:"ModularFate Things", type:"Actor", parent:null})
                }

                let things = game.actors.entries.filter(a => a.data.type=="Thing");
                itemActor = things.find(thing => thing.name == newItem.name);

                if (itemActor == undefined) {
                    itemActor = await Actor.create({
                        name: newItem.name,
                        type: "Thing",
                        data:{"container.isContainer":false},
                        img:newItem.img,
                        folder: folder.id,
                        sort: 12000,
                        items: [newItem],
                        permission:{"default":3} // Owner permissions are really necessary to succesfully interact with objects.
                      });
                }
                if (itemActor != undefined){ //Creation was successful, delete the item from the original actor.
                    if (data.tokenId === undefined){
                        let actor=game.actors.get(data.actorId);
                        await actor.deleteOwnedItem(data.data._id); 
                    } else { // This is a token actor. Respond accordingly.
                        let scene = game.scenes.get(canvas_scene._id)
                        let token = new Token(scene.data.tokens.find(token=>token._id == data.tokenId));
                        token.actor.deleteOwnedItem(data.data._id);
                    }
                }
    } else {
        if (data.pack != undefined){ // This means it came from a compendium
            const pack = game.packs.get(data.pack);
            let newItem = await pack.getEntity(data.id);
            let permission = newItem.data.permission;
            
            let folder = game.folders.find (f => f.name.startsWith("ModularFate Things"));
                if (folder == undefined){
                    folder = await Folder.create({name:"ModularFate Things", type:"Actor", parent:null})
                }


                let things = game.actors.entries.filter(a => a.data.type=="Thing");
                itemActor = things.find(thing => thing.name == newItem.name);

                if (itemActor == undefined) {
                    itemActor = await Actor.create({
                        name: newItem.name,
                        type: "Thing",
                        data:{"container.isContainer":false},
                        img:newItem.img,
                        folder: folder.id,
                        sort: 12000,
                        items: [newItem],
                        permission:{"default":3} // Owner permissions are really necessary to succesfully interact with objects.
                      });
                }
        } else {
            if (data.type == "Item"){ // This means it was dropped straight from the items list.
                let itemData = game.items.entries.find(it => it.id == data.id).data
                let permission = itemData.permission;

                let newItem = new Item(itemData);
            
                let folder = game.folders.find (f => f.name.startsWith("ModularFate Things"));
                if (folder == undefined){
                    folder = await Folder.create({name:"ModularFate Things", type:"Actor", parent:null})
                }

                let things = game.actors.entries.filter(a => a.data.type=="Thing");
                itemActor = things.find(thing => thing.name == newItem.name);

                if (itemActor == undefined) {
                    itemActor = await Actor.create({
                        name: newItem.name,
                        type: "Thing",
                        data:{"container.isContainer":false},
                        img:newItem.img,
                        folder: folder.id,
                        sort: 12000,
                        items: [newItem],
                        permission:{"default":3} // Owner permissions are required to see and interact with items.
                      });
                }
            }
        }
    }
    let token = {
        name: itemActor.name,
        x: data.x,
        y: data.y,
        img: itemActor.img,
        width: 1,
        height: 1,
        vision: false,
        hidden: false,
        actorId: itemActor.id,
        actorLink: false,
        actorData: {},
      }

    let scene =new Scene(canvas_scene);
    scene.createEmbeddedEntity("Token",token);
}

Hooks.on ('dropCanvasData', async (canvas, data) => {
    if (game.user.isGM){
        createThing (canvas.scene, data, game.user.id);
    } else {
        if (game.settings.get("ModularFate","PlayerThings")){
            let GMs = game.users.entries.filter(user => user.active && user.isGM);
            if (GMs.length == 0) {
                ui.notifications.error("A GM has to be logged in for you to create item tokens.")
            } else {
                game.socket.emit("system.ModularFate", {"action":"create_thing", "scene":canvas.scene, "data":data, "id":game.user.id})
            }
        }
    }
})

Hooks.on ('dropActorSheetData', async (target, unknown, data) => {

    if (target.data.data?.container?.isContainer == false && target.data?.items?.length == 1){
        return;
    }

    if (data.pack != undefined){
        return;
    }

    if (data.data == undefined){
        return;
    }

    if (target.data.data?.container?.isContainer == true && target.data?.data?.container?.locked == true){
        return;
    }

    if (target.id !== data.actorId){
        if (data.tokenId === undefined){ //This is from a real actor
            let actor = game.actors.get(data.actorId);
            //Need to check if the user has ownership of the target. If not, do nothing.
            if (target.owner){
                if (!keyboard.isDown("Shift")){
                    await actor.deleteOwnedItem(data.data._id); 
                }
            }
        } else { // This is a token actor. Respond accordingly.
            let token = data.scene.tokens.find(token=> token._id === data.tokenId);
                if (token !== undefined){
                    let t = new Token(token);
                    if (t.actor.owner && target.owner){
                        if (!keyboard.isDown("Shift")){
                            await t.actor.deleteOwnedItem(data.data._id);
                        }
                    }
                }
        }
    }
})

function shouldUpdate(actor){
    if (!actor.owner){
        return false;
    }
    const permissions = actor.data.permission;
    const activePlayers = game.users.entries
       .filter(user => user.active)
       .map(user => user.id);

    for (let playerId in permissions) {
        var isOwner = permissions[playerId] === CONST.ENTITY_PERMISSIONS.OWNER;
        var isActive = activePlayers.includes(playerId);

        if (isOwner && isActive) {
            return playerId === game.user.id;
        }
    }
}

Hooks.once('ready', async function () {

    if (game.user.isGM){
        game.socket.on("system.ModularFate", async (data) => {
            let GMs = game.users.filter(user => user.isGM && user.active);
                
            if (GMs[0].id != game.user.id){
                    return;
            }
            if (data.action == "create_thing"){
                    await createThing (data.scene, data.data, data.id);                
            }  
            if (data.action == "delete_token"){
                let scene = new Scene(data.scene);
                scene.deleteEmbeddedEntity("Token", data.token);
            }
        })
    }

    game.socket.on("system.ModularFate", async (data) => {
        if (data.action == "error_msg" && data.id == game.user.id){
            ui.notifications.error(data.error);
        }
    })
})

Hooks.once('init', async function () {
    game.settings.register ("ModularFate","PlayerThings", {
        name:game.i18n.localize("ModularFate.AllowPlayerThingCreation"),
        label:game.i18n.localize("ModularFate.ThingCreationLabel"),
        hint:game.i18n.localize("ModularFate.ThingCreationHint"),
        type:Boolean,
        scope:"world",
        config:true,
        restricted:true,
        default:true
    });
})