export class ExtraSheet extends ItemSheet {

    constructor (...args){
        super(...args);
        this.track_category = "All";
    }

    async getData() {
        const data = await super.getData();
        data.type = this.item.type.toLowerCase();
        data.stunts = this.object.data.data.stunts;
        data.aspects = this.object.data.data.aspects;
        data.skills = this.object.data.data.skills;
        data.ladder = ModularFateConstants.getFateLadder();
        let track_categories = this.object.data.data.tracks;
        let cats = new Set();
        for (let c in track_categories){
            let cat = track_categories[c].category;
            cats.add(cat);
        }
        track_categories=Array.from(cats);
        data.category = this.track_category;
        data.track_categories = track_categories;
        data.tracks = this.object.data.data.tracks;

        data.dataTemplate = () => `systems/ModularFate/templates/ExtraSheet.html`;
        data.GM=game.user.isGM;
        return data;
    }

    activateListeners(html){
        super.activateListeners(html);
        const delete_stunt = html.find("button[name='delete_item_stunt']");
        delete_stunt.on("click", event => this._onDelete(event,html));
        const edit_stunt = html.find("button[name='edit_item_stunt']")
        edit_stunt.on("click", event => this._onEdit (event,html));
        const db_add = html.find("button[name='item_db_stunt']");
        const stunts_button = html.find("div[name='edit_item_stunts']");
        db_add.on("click", event => this._db_add_click(event, html));
        stunts_button.on("click", event => this._onStunts_click(event, html));
        const stunt_db = html.find("div[name='item_stunt_db']");
        stunt_db.on("click", event => this._stunt_db_click(event, html));
        const aspectButton = html.find("div[name='edit_item_aspects']");
        aspectButton.on("click", event => this._onAspectClick(event, html));
        const skillsButton = html.find("div[name='edit_item_skills']");;
        skillsButton.on("click", event => this._onSkillsButton(event, html));
        const cat_select = html.find("select[id='item_track_category']");
        cat_select.on("change", event => this._cat_select_change (event, html));
        const tracks_button = html.find("div[name='edit_item_tracks']"); // Tracks, tracks, check
        tracks_button.on("click", event => this._onTracks_click(event, html));
    }

    async _onTracks_click(event, html) {
        //Launch the EditPlayerTracks FormApplication.
        let editor = new EditPlayerTracks(this.object); //Passing the actor works SOO much easier.
        editor.render(true);
        editor.setSheet(this);
    }

    async _cat_select_change (event, html){
        this.track_category = event.target.value;
        this.render(false);
    }

    async _onSkillsButton(event, html) {
        //Launch the EditPlayerSkills FormApplication.
        let editor = new EditPlayerSkills(this.object); //Passing the actor works SOO much easier.
        editor.render(true);
        editor.setSheet(this);
    }

    async _onAspectClick(event, html) {
            let av = new EditPlayerAspects(this.object);
            av.render(true);
    }

    async _db_add_click(event, html){
        let name = event.target.id.split("_")[0];
        let db = duplicate(game.settings.get("ModularFate","stunts"));
        db[name]=this.object.data.data.stunts[name];
        await game.settings.set("ModularFate","stunts",db);
        ui.notifications.info("Added "+name+" to the stunt database");
    }

    async _stunt_db_click(event, html){
        let sd = new StuntDB(this.object);
        sd.render(true);
    }

    async _onStunts_click(event, html) {
        //Launch the EditPlayerStunts FormApplication.
        let stunt = {
            "name":"New Stunt",
            "linked_skill":"None",
            "description":"",
            "refresh_cost":1,
            "overcome":false,
            "caa":false,
            "attack":false,
            "defend":false,
            "bonus":0
        }
        let editor = new EditPlayerStunts(this.object, stunt);
        editor.render(true);
        editor.setSheet(this);
    }

    async _onEdit (event, html){
        let name=event.target.id.split("_")[0];

        let editor = new EditPlayerStunts(this.object, this.object.data.data.stunts[name]);
        editor.render(true);
        editor.setSheet(this);
    }

    async _onDelete(event, html){
        let del = await ModularFateConstants.confirmDeletion();
        if (del){
            let name = event.target.id.split("_")[0];
            await this.object.update({"data.stunts":{[`-=${name}`]:null}});
        }
    }
    

    get template (){
        return 'systems/ModularFate/templates/ExtraSheet.html';
    }

    _updateObject(event, formData){
        super._updateObject(event, formData);
    }

    async _on_boxes_change(html, event){
        //console.log(event.target.value)
        let num = parseInt(event.target.innerHTML);
        //console.log(num);
    }
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes = options.classes.concat(['fate', 'item']);
        options.width = 850;
        options.height = "850";
        options.resizable = true;
        options.submitOnChange = true;
        options.title=`Extra: ${this.name}`
        return options;
    }
}
