//This application lets the GM show their choice of data from a specific character or token to one or more players
//Even if the character or token is hidden or the user's permissions don't ordinarily allow them to see it.

class ShowCharacter extends Application {

    constructor(){
        super();
    }
 
    activateListeners(html) {
        super.activateListeners(html);
        const showButton = html.find("button[id='show_button']");
        showButton.on("click", event => this._onShowButtonClick(event, html));
        const select_all_players = html.find("button[id='all_players']");
        select_all_players.on("click", event => this._onSelectAllPlayersClick(event, html))
        const select_all_elements = html.find("button[id='all_elements']");
        select_all_elements.on("click", event => this._onSelectAllElementsClick(event, html))
    }

    _onSelectAllPlayersClick(event, html){
        let players = html.find("input[class='player_select']")
        for (let i = 0; i < players.length; i++){
            players[i].checked = true;
        }
    }

    _onSelectAllElementsClick(event, html){
        let elements = html.find("input[class='element_select']")
        for (let i = 0; i < elements.length; i++){
            elements[i].checked = true;
        }
    }

    async _onShowButtonClick(event, html){
        // Get list of players
        let player_ids = html.find("input[class='player_select']")
        let players = [];
        let elements = {};
        for (let i = 0; i< player_ids.length; i++){
            if (player_ids[i].checked){
                players.push(game.users.players.find(player => player.id == player_ids[i].id))
            }
        }
        // Get the actor-data for the actor to be shown
        let actor_data;
        let actorInfo = html.find("select[id='character']")[0].value;
        actorInfo = actorInfo.split("_");
        if (actorInfo[0]=="token"){
            let token = game.scenes.viewed.getEmbeddedDocument("Token", actorInfo[1]);
            actor_data = token.actor;
            elements.name=token.name;
        }
        if (actorInfo[0]=="actor"){
            let actor = game.actors.contents.find(actor => actor.id == actorInfo[1])
            actor_data = actor;
            elements.name=actor.data.name;
        }
        // Get values to be shown to the user
        let element_boxes = html.find("input[class='element_select']")
        for (let i = 0; i < element_boxes.length; i++){
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
                    let stunts = duplicate (actor_data.system.stunts);
                    for (let stunt in stunts){
                        stunts[stunt].richDesc = await fcoConstants.fcoEnrich (stunts[stunt].description, actor_data);
                    }
                    elements.stunts = stunts;
                }
                if (element.id == "extras"){
                    let extras = duplicate (actor_data.items);
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

    static get defaultOptions() {
        const options = super.defaultOptions; 
        options.template= "systems/fate-core-official/templates/ShowCharacter.html";
        options.title=game.i18n.localize("fate-core-official.ShowACharacter");
        options.id = "ShowCharacter";
        options.width="auto";
        options.height="auto";
        options.resizable = false;
        return options;
    }

    async getData(){
        const data = await super.getData();
        data.users = game.users.players;
        data.tokens = game.scenes.viewed.tokens.contents;
        data.actors = game.actors.contents;
        return data;
    }
}

Hooks.on('getSceneControlButtons', function(hudButtons)
{
    let hud = hudButtons.find(val => {return val.name == "token";})
            if (hud && game.user.isGM){
                hud.tools.push({
                    name:"ShowCharacter",
                    title:game.i18n.localize("fate-core-official.ShowCharacterTitle"),
                    icon:"fas fa-binoculars",
                    onClick: ()=> {let sc = new ShowCharacter; sc.render(true)},
                    button:true
                });
            }
})

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

class CharacterView extends Application {
    constructor(elements){
        super();
        this.elements = elements;
        this.options.title=game.i18n.localize("fate-core-official.TemporaryView")+" "+game.i18n.localize("fate-core-official.of")+" "+elements.name
    }

    static get defaultOptions() {
        const options = super.defaultOptions; 
        options.template= "systems/fate-core-official/templates/CharacterView.html";
        options.title=game.i18n.localize("fate-core-official.TemporaryView")
        options.width="1000";
        options.height="800";
        options.resizable = true;
        options.closeOnSubmit = false;
        options.id="CharacterView";
        return options;
    }

    async getData(){
        return this.elements;
    }
}
