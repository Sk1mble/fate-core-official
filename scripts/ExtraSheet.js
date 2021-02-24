export class ExtraSheet extends ItemSheet {

    constructor (...args){
        super(...args);
        this.track_category = "All";
    }

    async render(...args){
        if (!this.object?.parent?.sheet?.editing && !this.editing){
            if (!this.renderPending) {
                    this.renderPending = true;
                    setTimeout(() => {
                        super.render(...args);
                        this.renderPending = false;
                    }, 0);
            }
        } else this.renderBanked = true;
    }

    async getData() {        
        const data = this.document.data;
        data.type = this.item.type;
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
        if (this.object?.data?.data?.contents != undefined && !jQuery.isEmptyObject(this.object?.data?.data?.contents))
        {
            data.contents = this.object.data.data.contents;
        }
        else {
            data.contents = false;
        }
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

        // Let's do this update ourselves. I know how to make my own code work without fricking stack overflow errors and recursions!
        
        var avatar = document.querySelector('.mfate-sheet_extra-avatar')
        
        let doc = this.document;
        let newsrc;
        let target_id;
        let this_id = this.document.id;
        new MutationObserver(function onSrcChange(MutationRecord){
            // Code to update avatar goes here
            target_id = MutationRecord[0].target.id.split("_")[0];
            newsrc = (MutationRecord[0].target.src.replace(/^(?:\/\/|[^/]+)*\//, ''));
            if (target_id == this_id){
                doc.update({"img":newsrc});
            }
          })
            .observe(avatar,{attributes:true,attributeFilter:["src"]})

        const name = html.find("textarea[name='name']");
    
        name.on("change", async event => {
            let newName = event.target.value;
            await this.document.update({"name":newName});
        })

        const permissions = html.find("textarea[name='data.permissions']");
        permissions.on("change", async event => {
            let permissions = event.target.value;
            await this.document.update({"data.permissions":permissions});
        })

        const costs = html.find("textarea[name='data.costs']");
        costs.on("change", async event => {
            let costs = event.target.value;
            await this.document.update({"data.costs":costs});
        })

        const refresh = html.find("input[name='data.refresh']");
        refresh.on("change", async event => {
            let r = parseInt(event.target.value);
            await this.document.update({"data.refresh":r});
        })

        const description = html.find("textarea[name='data.description.value']");
        description.on("change", async event => {
            let text = event.target.value;
            await this.document.update({"data.description.value":text});
        })

        const overcome = html.find("textarea[name='data.actions.overcome']");
        overcome.on("change", async event => {
            let text = event.target.value;
            await this.document.update({"data.actions.overcome":text});
        })

        const create = html.find("textarea[name='data.actions.create']");
        create.on("change", async event => {
            let text = event.target.value;
            await this.document.update({"data.actions.create":text});
        })

        const attack = html.find("textarea[name='data.actions.attack']");
        attack.on("change", async event => {
            let text = event.target.value;
            await this.document.update({"data.actions.attack":text});
        })

        const defend = html.find("textarea[name='data.actions.defend']");
        defend.on("change", async event => {
            let text = event.target.value;
            await this.document.update({"data.actions.defend":text});
        })

        const countSkills = html.find("input[name='data.countSkills']");
        countSkills.on("change", async event => {
            let value = event.target.checked;
            await this.document.update({"data.countSkills":value})
        })

        const aspect = html.find("textarea[class='cs_box mfate-aspects-list__input']");
        aspect.on("change", async event => {
            let field = event.target.name;
            let value = event.target.value;
            await this.document.update({[field]:value});
        })
    }

    async _onTracks_click(event, html) {
        //Launch the EditPlayerTracks FormApplication.
        let editor = new EditPlayerTracks(this.object); //Passing the actor works SOO much easier.
        editor.render(true);
        editor.setSheet(this);
        await editor.render(true);
        try {
            editor.bringToTop();
        } catch  {
            // Do nothing.
        }
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
        try {
            editor.bringToTop();
        } catch  {
            // Do nothing.
        }
    }

    async _onAspectClick(event, html) {
            let av = new EditPlayerAspects(this.object);
            av.render(true);
            try {
                av.bringToTop();
            } catch  {
                // Do nothing.
            }
    }

    async _db_add_click(event, html){
        let name = event.target.id.split("_")[0];
        let db = duplicate(game.settings.get("ModularFate","stunts"));
        db[name]=this.object.data.data.stunts[name];
        await game.settings.set("ModularFate","stunts",db);
        ui.notifications.info(`${game.i18n.localize("ModularFate.Added")} ${name} ${game.i18n.localize("ModularFate.ToTheStuntDatabase")}`);
    }

    async _stunt_db_click(event, html){
        let sd = new StuntDB(this.object);
        sd.render(true);
        try {
            sd.bringToTop();
        } catch  {
            // Do nothing.
        }
    }

    async _onStunts_click(event, html) {
        //Launch the EditPlayerStunts FormApplication.
        let stunt = {
            "name":game.i18n.localize("ModularFate.NewStunt"),
            "linked_skill":game.i18n.localize("ModularFate.None"),
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
        try {
            editor.bringToTop();
        } catch  {
            // Do nothing.
        }
    }

    async _onEdit (event, html){
        let name=event.target.id.split("_")[0];

        let editor = new EditPlayerStunts(this.object, this.object.data.data.stunts[name]);
        editor.render(true);
        editor.setSheet(this);
        try {
            editor.bringToTop();
        } catch  {
            // Do nothing.
        }
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

    async _on_boxes_change(html, event){
        ////console.log(event.target.value)
        let num = parseInt(event.target.innerHTML);
        ////console.log(num);
    }
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes = options.classes.concat(['fate', 'item']);
        options.width = 850;
        options.height = "850";
        options.resizable = true;
        options.submitOnChange = false;  
        options.submitOnClose = false;
        options.title=`${game.i18n.localize("ModularFate.Extra")}: ${this.name}`
        return options;
    }

    async close(...args){
        await super.close(...args);
        if (this.document.parent){
            if (this.document.parent.type == "ModularFate"){
                await this.document.parent.updateFromExtra(this.document.data);
            }
        }
        this.editing = false;
    }
}
