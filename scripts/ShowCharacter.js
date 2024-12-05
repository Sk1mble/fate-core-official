//This application lets the GM show their choice of data from a specific character or token to one or more players
//Even if the character or token is hidden or the user's permissions don't ordinarily allow them to see it.

class ShowCharacter extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
    constructor(){
        super();
    }
 
   _onRender(context, options) {
        const showButton = this.element.querySelector("button[id='show_button']");
        showButton.addEventListener("click", event => this._onShowButtonClick(event));
        const select_all_players = this.element.querySelector("button[id='all_players']");
        select_all_players?.addEventListener("click", event => this._onSelectAllPlayersClick(event))
        const select_all_elements = this.element.querySelector("button[id='all_elements']");
        select_all_elements?.addEventListener("click", event => this._onSelectAllElementsClick(event));
    }

    _onSelectAllPlayersClick(event){
        let players =this.element.querySelectorAll("input[class='player_select']")
        for (let i = 0; i < players?.length; i++){
            players[i].checked = true;
        }
    }

    _onSelectAllElementsClick(event){
        let elements = this.element.querySelectorAll ("input[class='element_select']")
        for (let i = 0; i < elements?.length; i++){
            elements[i].checked = true;
        }
    }

    async _onShowButtonClick(event){
        // Get list of players
        let player_ids = this.element.querySelectorAll("input[class='player_select']")
        let players = [];
        let elements = {};
        for (let i = 0; i< player_ids?.length; i++){
            if (player_ids[i].checked){
                players.push(game.users.players.find(player => player.id == player_ids[i].id))
            }
        }
        // Get the actor-data for the actor to be shown
        let actor_data;
        let actorInfo = this.element.querySelector("select[id='character']").value;
        actorInfo = actorInfo?.split("_");
        if (actorInfo[0]=="token"){
            let token = game.scenes.viewed.getEmbeddedDocument("Token", actorInfo[1]);
            actor_data = token.actor;
            elements.name=token.name;
        }
        if (actorInfo[0]=="actor"){
            let actor = game.actors.contents.find(actor => actor.id == actorInfo[1])
            actor_data = actor;
            elements.name=actor_data.name;
        }
        // Get values to be shown to the user
        let element_boxes = this.element.querySelectorAll("input[class='element_select']")
        for (let i = 0; i < element_boxes?.length; i++){
            let element = element_boxes[i];
            if (element.checked){
                if (element.id == "avatar"){
                    elements.avatar=actor_data.img;
                }
                if (element.id == "biography"){
                    elements.biography = await fcoConstants.fcoEnrich(actor_data.system.details.biography.value, actor_data);
                }
                if (element.id == "description"){
                    elements.description = await fcoConstants.fcoEnrich(actor_data.system.details.description.value, actor_data);
                }
                if (element.id == "aspects"){
                    elements.aspects = actor_data.system.aspects;
                }
                if (element.id == "skills"){
                    elements.skills = actor_data.system.skills;
                }
                if (element.id == "tracks"){
                    elements.tracks = actor_data.system.tracks;
                }
                if (element.id == "stunts"){
                    let stunts = foundry.utils.duplicate(actor_data.system.stunts);
                    for (let stunt in stunts){
                        stunts[stunt].richDesc = await fcoConstants.fcoEnrich (stunts[stunt].description, actor_data);
                    }
                    elements.stunts = stunts;
                }
                if (element.id == "extras"){
                    let extras = foundry.utils.duplicate(actor_data.items);
                    for (let extra of extras){
                        extra.richDesc = await fcoConstants.fcoEnrich (extra.system.description.value, actor_data);
                    }
                    elements.extras = extras;
                }
            }
        }
        // Create a socket call
        await game.socket.emit("system.fate-core-official",{"players":players,"elements":elements})
        this.close();
    }

    static DEFAULT_OPTIONS = {
        tag: "form",
        id:"ShowCharacter",
        position: {width:"auto", height:"auto"},
        window: {
            title: this.title,
            resizable: false
        }   
    }

    get title(){
        return game.i18n.localize("fate-core-official.ShowACharacter");
    }

    static PARTS = {
        "ShowCharacter":{
            template: "systems/fate-core-official/templates/ShowCharacter.html"
        }
    }

    async _prepareContext(){
        const data = await super._prepareContext();
        data.users = game.users.players;
        data.tokens = game.scenes.viewed.tokens.contents;
        data.actors = game.actors.contents;
        return data;
    }
}

//v13This is now for v13 only!
Hooks.on('getSceneControlButtons', controls => {
    if ( !game.user.isGM ) return;
    controls.tokens.tools.showCharacter = {
      name: "showCharacter",
      title: game.i18n.localize("fate-core-official.showCharacterTitle"),
      icon: "fas fa-binoculars",
      onChange: (event, active) => {
        if ( active ) {
            let sc = new ShowCharacter; sc.render(true);
        }
      },
      button: true
    };
  });

Hooks.once('ready', async function () {
    game.socket.on("system.fate-core-official", data => {
        //Players is an array of player IDs to which the character is to be shown
        //Elements is an object containing the data to be shown, which can be: avatar, aspects, tracks, bio, 
        //description, skills, stunts, extras
        let myId=game.users.current.id;
        if (data.players != undefined && data.players.find(player => player._id == myId)!=undefined){
            let cv = new CharacterView(data.elements);
            cv.render(true);
        }
    })  
})

class CharacterView extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
    constructor(elements){
        super();
        this.elements = elements;
    }

    get title(){
        return game.i18n.localize("fate-core-official.TemporaryView")+" "+game.i18n.localize("fate-core-official.of")+" "+this.elements.name
    }

    static DEFAULT_OPTIONS = {
        id: "CharacterView",
        tag: "div",
        classes: ['fate'],
        position: {
            width:800,
            height:800,
        },
        window: {
            title: this.title,
            icon: "fas fa-binoculars",
            resizable: true,
        },
    }

    static PARTS = {
        characterViewer:{
            template: "systems/fate-core-official/templates/CharacterView.html",
        } 
    }

    async _prepareContext (options){
        return this.elements;
    }
}
