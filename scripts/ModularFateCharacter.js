import { ExtraSheet } from "./ExtraSheet.js";

Handlebars.registerHelper("add1", function(value) {
    return value+1;
});

Handlebars.registerHelper("str", function(value) {
    return JSON.stringify(value);
});

Handlebars.registerHelper("category", function(category1, category2) {
    if (category1 == "All" || category1 == category2){
        return true;
    } else {
        return false;
    }
})

Handlebars.registerHelper("hasBoxes", function(track) {
    if(track.box_values==undefined || track.box_values.length==0){
        return false;
    } else {
        return true;
    }
});

export class ModularFateCharacter extends ActorSheet {

    close(){
        this.editing = false;
        game.system.apps["actor"].splice(game.system.apps["actor"].indexOf(this),1); 
        super.close();
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.resizable=true;
        options.width = "1000"
        options.height = "1000"
        options.scrollY = ["#skills_body", "#aspects_body","#tracks_body", "#stunts_body", "#biography_body"]
        mergeObject(options, {
            tabs: [
                {
                    navSelector: '.foo',
                    contentSelector: '.sheet-body',
                    initial: 'sheet',
                },
            ],
        });
        return options;
    }

    get actorType() {
        return this.actor.data.type;
    }

    get template() {
        let template = game.settings.get("ModularFate","sheet_template");
        let limited_template = game.settings.get("ModularFate","limited_sheet_template");

        if (template != undefined & !this.actor.limited){
            return template;
        } else {
            if (limited_template != undefined & this.actor.limited){
                return limited_template;
            } else {
                return 'systems/ModularFate/templates/ModularFateSheet.html';
            }
        }
    }

    constructor (...args){
        super(...args);
        this.first_run = true;
        this.editing = false;
        this.track_category="All";
    }

    //Here are the action listeners
    activateListeners(html) {
        if (this.actor.owner){
            const skillsButton = html.find("div[name='edit_player_skills']");;
            skillsButton.on("click", event => this._onSkillsButton(event, html));
            const skill_name = html.find("div[name='skill']");
            skill_name.on("click", event => this._onSkill_name(event, html));
            const sort = html.find("div[name='sort_player_skills'")
            sort.on("click", event => this._onSortButton(event, html));
            
            const aspectButton = html.find("div[name='edit_player_aspects']");
            aspectButton.on("click", event => this._onAspectClick(event, html));

            const box = html.find("input[name='box']");
            box.on("click", event => this._on_click_box(event, html));
            const skills_block = html.find("div[name='skills_block']");
            skills_block.on("contextmenu", event => this._onSortButton(event, html));
            const track_name = html.find("div[name='track_name']");
            track_name.on("click", event => this._on_track_name_click(event, html));

            const delete_stunt = html.find("button[name='delete_stunt']");
            delete_stunt.on("click", event => this._onDelete(event,html));
            const edit_stunt = html.find("button[name='edit_stunt']")
            edit_stunt.on("click", event => this._onEdit (event,html));

            const tracks_button = html.find("div[name='edit_player_tracks']"); // Tracks, tracks, check
            const stunts_button = html.find("div[name='edit_player_stunts']");

            const extras_button = html.find("div[name='add_player_extra']");
            const extras_edit = html.find ("button[name='edit_extra']");
            const extras_delete = html.find("button[name='delete_extra']");

            extras_button.on("click", event => this._on_extras_click(event, html));
            extras_edit.on("click", event => this._on_extras_edit_click(event, html));
            extras_delete.on("click", event => this._on_extras_delete(event, html));

            const tracks_block = html.find("div[name='tracks_block']");
            const stunts_block = html.find("div[name='stunts_block']");

            stunts_button.on("click", event => this._onStunts_click(event, html));
            tracks_button.on("click", event => this._onTracks_click(event, html));

            const bio = html.find(`div[id='${this.object.id}_biography']`)
            bio.on("focus",event => this._onBioInput(event, html));
            const desc = html.find(`div[id='${this.object.id}_description']`)
            desc.on("focus",event => this._onDescInput(event, html));
            bio.on("focusout", event => this._onBioFocusOut(event, html));
            desc.on("focusout", event => this._onDescFocusOut(event, html));

            const stunt_roll = html.find("button[name='stunt_name']");
            stunt_roll.on("click", event => this._on_stunt_roll_click(event,html));

            const stunt_db = html.find("div[name='stunt_db']");
            stunt_db.on("click", event => this._stunt_db_click(event, html));

            const db_add = html.find("button[name='db_stunt']");
            db_add.on("click", event => this._db_add_click(event, html));

            const cat_select = html.find("select[id='track_category']");
            cat_select.on("change", event => this._cat_select_change (event, html));

            const item = html.find("div[name='item_header']");
            item.on("dragstart", event => this._on_item_drag (event, html));

            //const input = html.find("input");
            const input = html.find('input[type="text"], input[type="number"], textarea');

            input.on("focus", event => {
                
                console.log("input focus")
                if (this.editing == false) {
                    this.editing = true;
                }
            });
            input.on("focusout", event => {
                console.log("input focusout")
                this.editing = false
                if (this.renderBanked){
                    this.renderBanked = false;
                    this.render(false);
                }
            });
        }
        super.activateListeners(html);
    }

    async _on_item_drag (event, html){
        let info = event.target.id.split("_");
        let item_id = info[1];
        let actor_id = info[0];
        let item = JSON.parse(event.target.getAttribute("data-item"));
        let data = {
            "type":"Item",
                    "id":item_id,
                    "actorId":actor_id,
                    "data":item
                }
        await event.originalEvent.dataTransfer.setData("text/plain", JSON.stringify(data));
    }

    async _cat_select_change (event, html){
        this.track_category = event.target.value;
        this.render(false);
    }

    async _db_add_click(event, html){
        let name = event.target.id.split("_")[0];
        let db = duplicate(game.settings.get("ModularFate","stunts"));
        db[name]=this.object.data.data.stunts[name];
        await game.settings.set("ModularFate","stunts",db);
        ui.notifications.info("Added "+name+" to the stunt database");
    }

    async _stunt_db_click(event, html){
        let sd = new StuntDB(this.actor);
        sd.render(true);
    }

    async _on_stunt_roll_click(event,html){
        let items = event.target.id.split("_");
        let name = items[0];
        let skill = items[1];
        let bonus = parseInt(items[2]);

        let ladder = ModularFateConstants.getFateLadder();
        let rank = this.object.data.data.skills[skill].rank
        let rankS = rank.toString();
        let rung = ladder[rankS];

        let r = new Roll(`4dF + ${rank}+${bonus}`);
        let roll = r.roll();

        let msg = ChatMessage.getSpeaker(this.object.actor)
        msg.alias = this.object.name;

        roll.toMessage({
            flavor: `<h1>${skill}</h1>Rolled by: ${game.user.name}<br>
            Skill rank: ${rank} (${rung})<br> 
            Stunt: ${name} (+${bonus})`,
            speaker: msg
        });
    }

    async _onBioFocusOut (event, html){
        this.editing = false;
        let bio = event.target.innerHTML;
        await this.object.update({"data.details.biography.value":bio})
        this.render(false);
    }

    async _onDescFocusOut (event, html){
        this.editing = false;
        let desc = event.target.innerHTML;
        await this.object.update({"data.details.description.value":desc})
        this.render(false);
    }

    async _onBioInput(event, html){
        this.editing = true;
    }

    async _onDescInput(event, html){
        this.editing = true;
    }

    async render (...args){
        if (this.editing == false){
            super.render(...args);
        } else {
            this.renderBanked = true;
        }
    }

    async _on_extras_click(event, html){
        const data = {
            "name": "New Extra", 
            "type": "Extra"
        };
        const created = await this.actor.createEmbeddedEntity("OwnedItem", data);
    }
    async _on_extras_edit_click(event, html){
        let items = this.object.items;
        let item = items.get(event.target.id);
        let e = new ExtraSheet(item);
        await e.render(true);
    }
    async _on_extras_delete(event, html){
        await this.actor.deleteOwnedItem(event.target.id);
        //const deleted = await x.deleteEmbeddedEntity("OwnedItem", event.target.id);
    }

    async _onDelete(event, html){
        let name = event.target.id.split("_")[0];
        await this.object.update({"data.stunts":{[`-=${name}`]:null}});
    }

    async _onEdit (event, html){
        let name=event.target.id.split("_")[0];

        let editor = new EditPlayerStunts(this.actor, this.object.data.data.stunts[name]);
        editor.render(true);
        editor.setSheet(this);
    }

    async _on_track_name_click(event, html) {
        // Launch a simple application that returns us some nicely formatted text.
        let tracks = duplicate(this.object.data.data.tracks);
        let track = tracks[event.target.innerHTML]
        let notes = track.notes;
        let text = await ModularFateConstants.updateText("Track Notes for "+track.name +" on "+this.actor.name, notes);
        await this.object.update({
            [`data.tracks.${event.target.innerHTML}.notes`]: text
        })
    }

    async _on_click_box(event, html) {
        let id = event.target.id;
        let parts = id.split("_");
        let name = parts[0]
        let index = parts[1]
        let checked = parts[2]
        index = parseInt(index)
        if (checked == "true") {
            checked = true
        }
        if (checked == "false") {
            checked = false
        }
        let tracks = duplicate(this.object.data.data.tracks);
        let track = tracks[name]
        track.box_values[index] = checked;
        await this.object.update({
            ["data.tracks"]: tracks
        })
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
        let editor = new EditPlayerStunts(this.actor, stunt);
        editor.render(true);
        editor.setSheet(this);
    }
    async _onTracks_click(event, html) {
        //Launch the EditPlayerTracks FormApplication.
        let editor = new EditPlayerTracks(this.actor); //Passing the actor works SOO much easier.
        editor.render(true);
        editor.setSheet(this);
    }

       async _onAspectClick(event, html) {
        if (game.user.isGM) {
            let av = new EditPlayerAspects(this.actor);
            av.render(true);
        }
    }
    async _onSkillsButton(event, html) {
        //Launch the EditPlayerSkills FormApplication.
        let editor = new EditPlayerSkills(this.actor); //Passing the actor works SOO much easier.
        editor.render(true);
        editor.setSheet(this);
    }
    async _onSortButton() {
        if (this.sortByRank == undefined) {
            this.sortByRank == true;
        }
        this.sortByRank = !this.sortByRank;
        this.render(false);
    }

    async _onSkill_name(event, html) {

        if (event.shiftKey){
           let mrd = new ModifiedRollDialog(this.actor, event.target.id);
            mrd.render(true);
        }
        else {
            let skill = this.object.data.data.skills[event.target.id];
            let rank = skill.rank;
            let r = new Roll(`4dF + ${rank}`);
            let ladder = ModularFateConstants.getFateLadder();
            let rankS = rank.toString();
            let rung = ladder[rankS];
            let roll = r.roll();

            let msg = ChatMessage.getSpeaker(this.object.actor)
            msg.alias = this.object.name;

            roll.toMessage({
                flavor: `<h1>${skill.name}</h1>Rolled by: ${game.user.name}<br>
                    Skill rank: ${rank} (${rung})`,
                speaker: msg
            });
        }
    }
    
    async initialise() {

        // Logic to set up Refresh and Current

        let refresh = game.settings.get("ModularFate", "refreshTotal");
        
        let working_data = duplicate(this.object.data);

        if (working_data.data.details.fatePoints.refresh == "") {
            this.newCharacter = true;
            working_data.data.details.fatePoints.refresh = refresh;
            working_data.data.details.fatePoints.current = refresh;
        }

        // Replace any plusTwo values on this character's stunts with a +2 bonus.
        
        for (let s in working_data.data.stunts){
            let stunt = working_data.data.stunts[s];
            if (stunt.plusTwo == true){
                stunt.bonus=2;
                stunt.plusTwo="deprecated"
            } else {
                stunt.plusTwo="deprecated"
                if (stunt.bonus==undefined){
                    stunt.bonus=0;    
                }
            }
        }
        
        let p_skills=working_data.data.skills;
        
        //Check to see what skills the character has compared to the global skill list
            var skill_list = game.settings.get("ModularFate","skills");
            // This is the number of skills the character has currently.
            //We only need to add any skills if this is currently 0,
            
            if (this.newCharacter){
                    let skills_to_add = [];

                    for (let w in skill_list){
                        let w_skill = skill_list[w];
                        if (p_skills[w]!=undefined){
                        } else {
                            if(w_skill.pc){
                                skills_to_add.push(w_skill);
                            }
                        }
                    }

                    if (skills_to_add.length >0){
                        //Add any skills from the global list that they don't have at rank 0.
                        skills_to_add.forEach(skill => {
                            skill.rank=0;
                            p_skills[skill.name]=skill;
                        })
                }
            }

        // Logic to set up aspects if this character doesn't already have them
        if (this.newCharacter) {
            let aspects = game.settings.get("ModularFate", "aspects");
            let player_aspects = duplicate(aspects);
            for (let a in player_aspects) {
                player_aspects[a].value = "";
            }
            //Now to store the aspect list to the character
            working_data.data.aspects = player_aspects;
        }

        if (this.newCharacter) {
            //Step one, get the list of universal tracks.
            let world_tracks = duplicate(game.settings.get("ModularFate", "tracks"));
            let tracks_to_write = working_data.data.tracks;
            for (let t in world_tracks) {
                let track = world_tracks[t];
                if (track.universal == true) {
                    tracks_to_write[t] = world_tracks[t];
                }
            }
            for (let t in tracks_to_write) {
                let track = tracks_to_write[t];
                //Add a notes field. This is a bit redundant for stress tracks,
                //but useful for aspects, indebted, etc. Maybe it's configurable whether we show the
                //notes or not for any given track. LATER NOTE: It is not.
                track.notes = "";

                //If this box is an aspect when marked, it needs an aspect.name data field.
                if (track.aspect == "Defined when marked") {
                    track.aspect = {};
                    track.aspect.name = "";
                    track.aspect.when_marked = true;
                    track.aspect.as_name = false;
                }
                if (track.aspect == "Aspect as name") {
                    track.aspect = {};
                    track.aspect.name = "";
                    track.aspect.when_marked = true;
                    track.aspect.as_name = false;
                }

                //Initialise the box array for this track 
                if (track.boxes > 0) {
                    let box_values = [];
                    for (let i = 0; i < track.boxes; i++) {
                        box_values.push(false);
                    }
                    track.box_values = box_values;
                }
            }
            working_data.data.tracks = tracks_to_write;
        }
        let tracks = working_data.data.tracks;
        
        let categories = game.settings.get("ModularFate", "track_categories");
        //GO through all the tracks, find the ones with boxes, check the number of boxes and linked skills and initialise as necessary.
        for (let t in tracks) {
            let track = tracks[t];

            if (track.universal) {
                track.enabled = true;
            }

            // Check for linked skills and enable/add boxes as necessary.
            if (track.linked_skills != undefined && track.linked_skills.length > 0 && Object.keys(working_data.data.skills).length > 0) {
                let skills = working_data.data.skills;
                let linked_skills = tracks[t].linked_skills;
                let box_mod = 0;
                for (let i = 0; i < linked_skills.length; i++) {
                    let l_skill = linked_skills[i].linked_skill;
                    let l_skill_rank = linked_skills[i].rank;
                    let l_boxes = linked_skills[i].boxes;
                    let l_enables = linked_skills[i].enables;

                    //Get the value of the player's skill
                    if (working_data.data.skills[l_skill] == undefined){

                    }else {
                        let skill_rank = working_data.data.skills[l_skill].rank;
                        //If this is 'enables' and the skill is too low, disable.
                        if (l_enables && skill_rank < l_skill_rank) {
                        track.enabled = false;
                    }

                    //If this adds boxes and the skill is high enough, add boxes if not already present.
                    //Telling if the boxes are already present is the hard part.
                    //If boxes.length > boxes it means we have added boxes, but how many? I think we need to store a count and add
                    //or subract them at the end of our run through the linked skills.
                        if (l_boxes > 0 && skill_rank >= l_skill_rank) {
                            box_mod += l_boxes;
                        }
                    }
                } //End of linked_skill iteration
                //Now to add or subtract the boxes

                //Only if this track works with boxes, though
                if (track.boxes > 0 || track.box_values != undefined) {
                    //If boxes + box_mod is greater than box_values.length add boxes
                    let toModify = track.boxes + box_mod - track.box_values.length;
                    if (toModify > 0) {
                        for (let i = 0; i < toModify; i++) {
                            track.box_values.push(false);
                        }
                    }
                    //If boxes + box_mod is less than box_values.length subtract boxes.
                    if (toModify < 0) {
                        for (let i = toModify; i < 0; i++) {
                            track.box_values.pop();
                        }
                    }
                }
            }
        }
        await this.actor.update(working_data)
        if (this.newCharacter) {
            console.log("Initialising new character!")
            let e = new EditPlayerSkills(this.actor);
            e.render(true);
            e.setSheet(this);
            this.newCharacter = false;
        }
    }

    async getData() {

        if (this.first_run && this.actor.owner){
            this.initialise();
            this.first_run = false;
        }

        this.refreshSpent = 0; //Will increase when we count tracks with the Paid field and stunts.
        this.freeStunts = game.settings.get("ModularFate", "freeStunts");
        const sheetData = await super.getData();
        let numStunts = Object.keys(sheetData.data.stunts).length;
        let paidTracks = 0;
        let paidStunts = 0;
        let paidExtras = 0;    

        //Calculate cost of stunts here. Some cost more than 1 refresh, so stunts need a cost value

        let tracks = duplicate(sheetData.data.tracks);
        for (let track in tracks) {
            if (tracks[track].paid) {
                paidTracks++;
            }
        }

        this.object.items.entries.forEach(item => {
                paidExtras += parseInt(item.data.data.refresh);
        })

        let stunts = this.object.data.data.stunts;
        for (let s in stunts){
            paidStunts += parseInt(stunts[s].refresh_cost);
        }
        
        paidStunts -= this.freeStunts;

        this.refreshSpent = paidTracks + paidStunts + paidExtras;
        sheetData.paidTracks = paidTracks;
        sheetData.paidStunts = paidStunts;
        sheetData.paidExtras = paidExtras;
        sheetData.freeStunts = this.freeStunts;
        let isPlayer = this.object.hasPlayerOwner;
        let error = false;
        if (isPlayer) {
            // Refresh spent + refresh should = the game's refresh.
            let checkSpent = sheetData.data.details.fatePoints.refresh + this.refreshSpent;
            let worldRefresh = game.settings.get("ModularFate", "refreshTotal");
            let checkWorld = worldRefresh - sheetData.data.details.fatePoints.refresh;

            let message = "This player's sheet doesn't add up: "
            if (checkWorld < 0) {
                message += "Their refresh is greater than the game refresh."
                error = true;
            }
            if (checkSpent > worldRefresh) {
                if (error) {
                    message += "and their spent refresh plus refresh is greater than the game refresh."
                }
                message += "Their spent refresh plus refresh is greater than the game refresh."
                error = true;
            }
            if (error) {
                ui.notifications.error(message);
            }
        }
        const unordered_skills = sheetData.data.skills;
        const ordered_skills = {};
        let sorted_by_rank = ModularFateConstants.sortByRank(unordered_skills);

        // Sort the skills to display them on the character sheet.
        Object.keys(unordered_skills).sort().forEach(function(key) {
            ordered_skills[key] = unordered_skills[key];
        }); //You can use this code to sort a JSON object by creating a replacement object.
        sheetData.ordered_skills = ordered_skills;
        sheetData.sorted_by_rank = sorted_by_rank;
        sheetData.gameRefresh = game.settings.get("ModularFate", "refreshTotal");
        sheetData.item=this.object.items;

        let skillTotal = 0;
        for (let s in ordered_skills) {
            //Ignore any skills with an extra field where the associated extra's countSkills is false.
            if (ordered_skills[s].extra_tag != undefined){
                let extra_id = ordered_skills[s].extra_tag.extra_id;
                let extra = this.object.items.find(item=>item._id == extra_id);
        
                if (extra != undefined && extra.data.data.countSkills){
                    skillTotal += ordered_skills[s].rank;    
                }
            }else {
                skillTotal += ordered_skills[s].rank;
            }
        }

        sheetData.skillTotal = skillTotal;
        sheetData.refreshSpent = this.refreshSpent;
        sheetData.ladder = ModularFateConstants.getFateLadder();
        sheetData.sortByRank = this.sortByRank;
        sheetData.gameSkillPoints = game.settings.get("ModularFate", "skillTotal")
        sheetData.GM = game.user.isGM;

        let track_categories = this.object.data.data.tracks;
        let cats = new Set();
        for (let c in track_categories){
            let cat = track_categories[c].category;
            cats.add(cat);
        }
        track_categories=Array.from(cats);
        sheetData.category = this.track_category;
        sheetData.track_categories = track_categories;
        sheetData.tracks = this.object.data.data.tracks;
        sheetData.stunts = this.object.data.data.stunts;
        return sheetData;
    }
}

function shouldUpdate(actor){
    if (!actor.owner){
        return false;
    }

    const permissions = actor.data.permission;
    const activePlayers = game.users.entities
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

async function updateFromExtra(actorData, itemData) {

    let actor = game.actors.find(a=>a.id == actorData.id);
    if (!shouldUpdate(actor)){
        return;
    } else {
        let extra = itemData;

        //Find each aspect, skill, stunt, and track attached to each extra
        //Add an extra data item to the data type containing the id of the original item.
        //Done: Edit editplayertracks to be blind to any object with the extra data type defined
        //Done: Edit editplayerskills to be blind to any object with the extra data type defined
        //Done: Edit editplayeraspects to be blind to any object with the extra data type defined
        //Check to see if the thing is already on the character sheet. If it is, update with the version from the item (should take care of diffing for me and only do a database update if changed)
        //Done: Remove the ability to delete stunts bestowed upon the character by their extras (disable the delete button if extra_tag != undefined)
        //After conversation with Fred, we decided that tracks can only use core world skills and not extra versions of them to automate modification of tracks.
        //Anything else can be done manually.
        
        let stunts_output = {};
        let skills_output = {};
        let aspects_output = {};
        let tracks_output = {};

            let extra_name = extra.name;
            let extra_id = extra._id;
            let extra_tag = {"extra_name":extra_name, "extra_id":extra_id};

            let stunts = duplicate(extra.data.stunts);
    
            for (let stunt in stunts){
                stunts[stunt].extra_tag = extra_tag;
                stunts[stunt].name = stunts[stunt].name+=" (Extra)";
                stunts_output[stunts[stunt].name]=stunts[stunt];
            }

            let skills = duplicate(extra.data.skills);
            for (let skill in skills){
                skills[skill].extra_tag = extra_tag;
                skills[skill].name = skills[skill].name+=" (Extra)";
                skills_output[skills[skill].name]=skills[skill];
            }

            let aspects = duplicate(extra.data.aspects);
            for (let aspect in aspects){
                aspects[aspect].extra_tag = extra_tag;
                aspects[aspect].name = aspects[aspect].name+=" (Extra)";
                aspects_output[aspects[aspect].name]=aspects[aspect];
            }

            let tracks = duplicate(extra.data.tracks);
            for (let track in tracks){
                if (!Array.isArray(tracks)){
                    tracks[track].extra_tag = extra_tag;
                    tracks[track].name = tracks[track].name+=" (Extra)";
                    tracks_output[tracks[track].name]=tracks[track];
                }        
            }

        let actor_stunts = duplicate(actor.data.data.stunts);
        let final_stunts = mergeObject(actor_stunts, stunts_output);
        await actor.update({"data.stunts":final_stunts});

        let actor_tracks = duplicate(actor.data.data.tracks);

        //Look for orphaned tracks on the character that aren't on the item any longer and delete them from the character
        for (let t in actor_tracks){
            let track = actor_tracks[t];
            if (track.extra_tag != undefined && track.extra_tag.extra_id == extra_id){
                if (tracks_output[t] == undefined){
                    let st =`-=${t}`
                    await actor.update({"data.tracks":{[st]:null}});
                    actor_tracks = duplicate(actor.data.data.tracks);
                }
            }
        }

        for (let track in tracks_output){
            if (actor_tracks[track]!=undefined){
                delete(tracks_output[track]);
            }
        }

        //Find all tracks on this actor that have the item's ID in their extra_tag attribute
        //Check to see that those tracks are also on the item's list of tracks
        //If they aren't, delete them from the character.
        let final_tracks = mergeObject(actor_tracks, tracks_output);
        
        let actor_aspects = duplicate(actor.data.data.aspects);
        let final_aspects = mergeObject(actor_aspects, aspects_output);

        let actor_skills = duplicate(actor.data.data.skills);
        let final_skills = mergeObject(actor_skills, skills_output);

        await actor.update({
                                "data.tracks":final_tracks,
                                "data.aspects":final_aspects,
                                "data.skills":final_skills,
                                "data.stunts":final_stunts
                            });
    }
}


Hooks.on('updateOwnedItem',async (actorData, itemData) => {
    updateFromExtra(actorData,itemData);
})

Hooks.on('deleteOwnedItem',async (actorData, itemData) => {
    let actor = game.actors.find(a=>a.id == actorData.id);
    
    if (!shouldUpdate(actor)){
        return;
    } else {
        //Clean up any tracks, aspects, skills, or stunts that were on this extra but are now orphaned.

        let actor_aspects = duplicate(actor.data.data.aspects)

        for (let aspect in actor_aspects){
            let et = actor_aspects[aspect].extra_tag;
            if (et != undefined && et.extra_id == itemData._id){
                let st =`-=${aspect}`
                await actor.update({"data.aspects":{[st]:null}});
            }
        } 
    
        let actor_stunts = duplicate(actor.data.data.stunts)

        for (let stunt in actor_stunts){
            let et = actor_stunts[stunt].extra_tag;
            if (et != undefined && et.extra_id == itemData._id){
                let st =`-=${stunt}`
                await actor.update({"data.stunts":{[st]:null}});
            }
        }

        let actor_tracks = duplicate(actor.data.data.tracks)

        for (let track in actor_tracks){
            let et = actor_tracks[track].extra_tag;
            if (et != undefined && et.extra_id == itemData._id){
                let st =`-=${track}`
                await actor.update({"data.tracks":{[st]:null}});
            }
        }

        let actor_skills = duplicate(actor.data.data.skills)

        for (let skill in actor_skills){
            let et = actor_skills[skill].extra_tag;
            if (et!= undefined && et.extra_id == itemData._id){
                let st =`-=${skill}`
                await actor.update({"data.skills":{[st]:null}});
            }
        }         
    }
})

Hooks.on('createOwnedItem',(actorData, itemData) => {
    updateFromExtra(actorData,itemData);
})