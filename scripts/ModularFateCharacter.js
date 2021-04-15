import { ExtraSheet } from "./ExtraSheet.js";

Handlebars.registerHelper("add1", function(value) {
    return value+1;
});

Handlebars.registerHelper("add5", function(value) {
    return value+5;
})

Handlebars.registerHelper("str", function(value) {
    return JSON.stringify(value);
});

Handlebars.registerHelper("concat", function(value1, value2){
    return value1.concat(value2);
});

Handlebars.registerHelper("category", function(category1, category2) {
    if (category1 == "All" || category1 == category2){
        return true;
    } else {
        return false;
    }
})

Handlebars.registerHelper("expanded", function (actor, item){
    let key;
    if (actor == "game"){
        key = "game"+item;
    } else {
        key = actor.id + item;
    }

    if (game.user.expanded != undefined){
        return game.user.expanded[key]==true;
    } else {
        return false;
    }
});

Handlebars.registerHelper("hasBoxes", function(track) {
    if(track.box_values==undefined || track.box_values.length==0){
        return false;
    } else {
        return true;
    }
});

export class ModularFateCharacter extends ActorSheet {

    async close(options){
        this.editing = false;
        await super.close(options);
    }

    toFront (){
        $(`#actor-${this.actor.id}`).css({zIndex: Math.min(++_maxZ, 9999)});
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.resizable=true;
        options.width = "1000"
        options.height = "1000"
        options.scrollY = ["#skills_body", "#aspects_body","#tracks_body", "#stunts_body", "#biography_body", "#notes_body"]
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
        if (this.actor.isOwner){
            const skillsButton = html.find("div[name='edit_player_skills']");;
            skillsButton.on("click", event => this._onSkillsButton(event, html));

            const skill_name = html.find("div[name='skill']");
            skill_name.on("contextmenu", event=> this._onSkillR(event, html));
            skill_name.on("click", event => this._onSkill_name(event, html));
            const sort = html.find("div[name='sort_player_skills'")
            sort.on("click", event => this._onSortButton(event, html));
            
            const aspectButton = html.find("div[name='edit_player_aspects']");
            aspectButton.on("click", event => this._onAspectClick(event, html));

            const box = html.find("input[name='box']");
            box.on("click", event => this._on_click_box(event, html));
            const skills_block = html.find("div[name='skills_block']");
            const track_name = html.find("div[name='track_name']");
            //Deprecated in favour of inline notes for tracks.
            //track_name.on("click", event => this._on_track_name_click(event, html));

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

            const notes = html.find (`div[id='${this.object.id}_notes']`);
            notes.on("focus", event => this._onNotesInput(event, html));

            const desc = html.find(`div[id='${this.object.id}_description']`)
            desc.on("focus",event => this._onDescInput(event, html));
            bio.on("blur", event => this._onBioFocusOut(event, html));
            desc.on("blur", event => this._onDescFocusOut(event, html));
            notes.on("blur", event => this._onNotesFocusOut(event, html));

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

            const extra_active = html.find('button[name = "extra_active"]');
            extra_active.on("click", async event => {
                console.log(event.target.id);
                let item_id = event.target.id.split("_")[0];
                let item = this.document.items.get(item_id);
                if (item.data.data.active){
                    await item.update({"data.active":false},{render:false});
                    this.document.deactivateExtra(item);
                } else {
                    await item.update({"data.active":true},{render:false});
                    this.document.updateFromExtra(item);
                }
            });

            const saveDefault = html.find("button[name='saveDefault']");
            saveDefault.on("click", async event => {
                let f = new FateCharacterDefaults();
                let content = 
                                `<table style="background-color:transparent; border:none">
                                    <tr>
                                        <td>
                                            ${game.i18n.localize("ModularFate.name")}
                                        </td>
                                        <td>
                                            <input id="${this.document.id}_choose_default_name" type="text"></input>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            ${game.i18n.localize("ModularFate.description")}
                                        </td>
                                        <td>
                                            <input id = "${this.document.id}_choose_default_description" type="text"></input>
                                        </td>
                                    </tr>
                                </table>`
                    let d = new Dialog({
                    title: game.i18n.localize("ModularFate.pickADefaultName"),
                    content: content,
                    buttons: {
                        ok: {
                            label:"OK",
                            callback: async () => {
                                let name = $(`#${this.document.id}_choose_default_name`)[0].value;
                                let desc = $(`#${this.document.id}_choose_default_description`)[0].value;
                                if (!name) name = this.document.name;
                                let f = new FateCharacterDefaults();
                                let def = await f.extractDefault(this.document.data, name, desc);
                                await f.storeDefault(def);
                                ui.sidebar.render(false);
                            }
                        }
                    },
                    default: "ok"
                }).render(true);
            })

            const applyDefault = html.find("button[name='applyDefault']");
            applyDefault.on("click", async event => {
                let f = new FateCharacterDefaults();
                let options = f.defaults.map(d => `<option>${d}</option>`).join("\n");
                let content = `
                <h2>${game.i18n.localize("ModularFate.applyDefault")}</h2>
                <select style="width:100%" id="${this.document.id}_select_default">
                                    ${options}
                </select>
                <table style="border:none, background-color:transparent">
                            <table style="border:none, background-color:transparent">
                                <th style="width:60%; text-align:left">
                                    ${game.i18n.localize("ModularFate.item")}
                                </th>
                                <th style="width:40%; text-align:left">
                                    ${game.i18n.localize("ModularFate.applyFromDefault")}
                                </th>
                                <tr>
                                    <td style="width:60%; text-align:left">
                                        ${game.i18n.localize("ModularFate.avatar")}
                                    </td>
                                    <td style="width:40%; text-align:left">
                                        <i id="${this.document.id}_def_avatar" class="def_toggle fas fa-toggle-on"></i>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="width:60%; text-align:left">
                                        ${game.i18n.localize("ModularFate.tracks")}
                                    </td>
                                    <td style="width:40%; text-align:left">
                                        <i id="${this.document.id}_def_tracks" class="def_toggle fas fa-toggle-on"></i>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="width:60%; text-align:left">
                                        ${game.i18n.localize("ModularFate.aspects")}
                                    </td>
                                    <td style="width:40%; text-align:left">
                                        <i id="${this.document.id}_def_aspects" class="def_toggle fas fa-toggle-on"></i>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="width:60%; text-align:left">
                                        ${game.i18n.localize("ModularFate.stunts")}
                                    </td>
                                    <td style="width:40%; text-align:left">
                                        <i id="${this.document.id}_def_stunts" class="def_toggle fas fa-toggle-on"></i>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="width:60%; text-align:left">
                                        ${game.i18n.localize("ModularFate.extras")}
                                    </td>
                                    <td style="width:40%; text-align:left">
                                        <i id="${this.document.id}_def_extras" class="def_toggle fas fa-toggle-on"></i>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="width:60%; text-align:left">
                                        ${game.settings.get("ModularFate","skillsLabel")}
                                    </td>
                                    <td style="width:40%; text-align:left">
                                        <i id="${this.document.id}_def_skills" class="def_toggle fas fa-toggle-on"></i>
                                    </td>
                                </tr>
                            </table>
                            <h2 style="text-align:center"><i id="${this.document.id}_def_overwrite" class="def_toggle fas fa-toggle-on"></i> <b id="def_mo">${game.i18n.localize("ModularFate.merge")}</b></h2>
                        </td>
                    </row>
                </table>
                `
                let d = await new Dialog({
                    title: game.i18n.localize("ModularFate.applyDefaultOptions"),
                    content: content,
                    buttons: {
                        ok: {
                            label:"OK",
                            callback: async () => {
                                let avatar = $(`#${this.document.id}_def_avatar`)[0].classList.contains("fa-toggle-on");
                                let tracks = $(`#${this.document.id}_def_tracks`)[0].classList.contains("fa-toggle-on");
                                let stunts = $(`#${this.document.id}_def_stunts`)[0].classList.contains("fa-toggle-on");
                                let extras = $(`#${this.document.id}_def_extras`)[0].classList.contains("fa-toggle-on");
                                let skills = $(`#${this.document.id}_def_skills`)[0].classList.contains("fa-toggle-on");
                                let aspects = $(`#${this.document.id}_def_aspects`)[0].classList.contains("fa-toggle-on");
                                let merge = $(`#${this.document.id}_def_overwrite`)[0].classList.contains("fa-toggle-on");
                                let default_name = $(`#${this.document.id}_select_default`)[0].value;
                                if (!avatar && !tracks && !stunts && !extras && !skills && !aspects){
                                    // Todo: Add a message here to explain why nothing happens?
                                    return;
                                }

                                let sections = [];
                                if (tracks) sections.push("tracks");
                                if (stunts) sections.push("stunts");
                                if (aspects) sections.push("aspects");
                                if (skills) sections.push("skills");

                                let options = {
                                    "overwrite":!merge,
                                    "extras":extras,
                                    "avatar":avatar,
                                    "sections":sections
                                }
                                
                                let prompt = "";
                                let content = "";
    
                                if (merge){
                                    prompt = `${game.i18n.localize("ModularFate.merge")} with '${default_name}' default`;
                                    content = game.i18n.localize("ModularFate.proceedToMerge");
                                } 
                                if (!merge) {
                                    prompt = `${game.i18n.localize("ModularFate.overwrite")} with '${default_name}' default`
                                    content = game.i18n.localize("ModularFate.proceedToOverwrite");
                                }
                                let proceed = await ModularFateConstants.awaitYesNoDialog(prompt, content);
                                if (proceed == "yes") {
                                    await f.applyDefault(this.document, default_name, options);
                                }
                            }
                        }
                    },
                    default: "ok"
                })._render(true); // Using _render because it's async
            
                $(`.def_toggle`).on('click', function (event) {
                    event.target.classList.toggle("fa-toggle-on");
                    event.target.classList.toggle("fa-toggle-off");
                })
            })

            const expandAspect = html.find("button[name='expandAspect']");

            expandAspect.on("click", event => {
                let a = event.target.id.split("_")[0];
                let aspect = this.actor.data.data.aspects[a];
                let key = this.actor.id+aspect.name+"_aspect";
        
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

            const expandTrack = html.find("button[name='expandTrack']");

            expandTrack.on("click", event => {
                let t = event.target.id.split("_")[0];
                let track = this.object.data.data.tracks[t];
                let key = this.actor.id+track.name+"_track";
            
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

            const expandStunt = html.find("button[name='expandStunt']");

            expandStunt.on("click", event => {
                let s = event.target.id.split("_")[0];
                let stunt = this.object.data.data.stunts[s];
                let key = this.actor.id+stunt.name+"_stunt";
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

            const expandExtra = html.find("button[name='expandExtra']");

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

            const expandBiography = html.find("div[name='expandBiography']");
            expandBiography.on("click", event => {
                let key = this.actor.id + "_biography";
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

            const expandDescription = html.find("div[name='expandDescription']");
            expandDescription.on("click", event => {
                let key = this.actor.id + "_description";
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


            const expandAllStunts = html.find("div[name='expandAllStunts']");
            const compressAllStunts = html.find("div[name='compressAllStunts']")

            expandAllStunts.on("click", event => {
                let stunts = this.object.data.data.stunts;
                if (game.user.expanded == undefined){
                    game.user.expanded = {};
                }

                for (let s in stunts){
                    let key = this.actor.id+s+"_stunt";
                    game.user.expanded[key] = true;
                }
                this.render(false);
            })

            compressAllStunts.on("click", event => {
                let stunts = this.object.data.data.stunts;
                if (game.user.expanded == undefined){
                    game.user.expanded = {};
                }

                for (let s in stunts){
                    let key = this.actor.id+s+"_stunt";
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

                this.actor.items.forEach(item => {
                    let key = this.actor.id+item.id+"_extra";
                    game.user.expanded[key] = true;
                })  
                this.render(false);
            })

            compressAllExtras.on("click", event => {
                if (game.user.expanded == undefined){
                    game.user.expanded = {};
                }

                this.actor.items.contents.forEach(item => {
                    let key = this.actor.id+item.id+"_extra";
                    game.user.expanded[key] = false;
                })
                this.render(false);
            })

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
        }
        super.activateListeners(html);
    }

    async _onSkillR(event,html){
        let name = event.target.id;
        let skill = this.actor.data.data.skills[name];
        ModularFateConstants.awaitOKDialog(game.i18n.localize("ModularFate.SkillDetails"),`
                                            <table cellspacing ="4" cellpadding="4" border="1">
                                                <h2>${skill.name}</h2>
                                                <tr>
                                                    <td style="width:400px;">
                                                        <b>${game.i18n.localize("ModularFate.Description")}:</b>
                                                    </td>
                                                    <td style="width:2000px; padding-left:5px">
                                                        ${skill.description}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <b>${game.i18n.localize("ModularFate.Overcome")}:</b>
                                                    </td>
                                                    <td style="width:2000px; padding-left:5px">
                                                        ${skill.overcome}
                                                    </td>
                                                </tr>
                                                <tr>
                                                   <td>
                                                        <b>${game.i18n.localize("ModularFate.CAA")}:</b>
                                                    </td>
                                                    <td style="width:2000px; padding-left:5px">
                                                        ${skill.caa}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <b>${game.i18n.localize("ModularFate.Attack")}:</b>
                                                    </td>
                                                    <td style="width:2000px; padding-left:5px">
                                                        ${skill.attack}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <b>${game.i18n.localize("ModularFate.Defend")}:</b>
                                                    </td>
                                                    <td style="width:2000px; padding-left:5px">
                                                        ${skill.defend}
                                                    </td>
                                                </tr>
                                            </table>`,1000)
    }

    async _on_item_drag (event, html){
        let info = event.target.id.split("_");
        let item_id = info[1];
        let actor_id = info[0];
        let item = JSON.parse(event.target.getAttribute("data-item"));
        let tokenId = undefined;

        if (this.actor.isToken === true){
            tokenId = this.actor.token.id;
        }

        let i = new Item(item);

        let data = {
                    "type":"Item",
                    "actor":this.actor,
                    "id":item_id,
                    "actorId":actor_id,
                    "data":i,
                    "tokenId":tokenId,
                    "scene":game.scenes.viewed
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
        ui.notifications.info(game.i18n.localize("ModularFate.Added")+" "+name+" "+game.i18n.localize("ModularFate.ToTheStuntDatabase"));
    }

    async _stunt_db_click(event, html){
        let sd = new StuntDB(this.actor);
        sd.render(true)
        try {
            sd.bringToTop();
        } catch  {
            // Do nothing.
        }
    }
    
    async _on_stunt_roll_click(event,html){
        let items = event.target.id.split("_");
        let name = items[0];
        let skill = items[1];
        let bonus = parseInt(items[2]);

        let ladder = ModularFateConstants.getFateLadder();
        let rank = 0;
        if (skill == "Special"){
            // We need to pop up a dialog to get a skill to roll.
            let skills = [];
            for (let x in this.object.data.data.skills){
                skills.push(this.object.data.data.skills[x].name);
            }
            let sk = await ModularFateConstants.getInputFromList (game.i18n.localize("ModularFate.select_a_skill"), skills);
            skill = sk;
            rank = this.object.data.data.skills[skill].rank;
        } else {
            rank = this.object.data.data.skills[skill].rank;
        }

        let rankS = rank.toString();
        let rung = ladder[rankS];

        let r = new Roll(`4dF + ${rank}+${bonus}`);
        let roll = await r.roll();

        let msg = ChatMessage.getSpeaker(this.object.actor)
        msg.alias = this.object.name;

        roll.toMessage({
            flavor: `<h1>${skill}</h1>${game.i18n.localize("ModularFate.RolledBy")}: ${game.user.name}<br>
            ${game.i18n.localize("ModularFate.SkillRank")}: ${rank} (${rung})<br> 
            ${game.i18n.localize("ModularFate.Stunt")}: ${name} (+${bonus})`,
            speaker: msg
        });
    }

    async _onBioFocusOut (event, html){
        this.editing = false;
        let bio = event.target.innerHTML;
        await this.object.update({"data.details.biography.value":bio})
        this.render(false);
    }

    async _onNotesFocusOut (event, html){
        this.editing = false;
        let notes = event.target.innerHTML;
        await this.object.update({"data.details.notes.value":notes})
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

    async _onNotesInput(event, html) {
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
            "name": game.i18n.localize("New Extra"),
            "type": "Extra"
        };
        const created = await this.document.createEmbeddedDocuments("Item", [data]);
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
            await this.actor.deleteEmbeddedDocuments("Item",[event.target.id.split("_")[0]]);
        }
    }

    async _onDelete(event, html){
        let del = await ModularFateConstants.confirmDeletion();
        if (del){
            let name = event.target.id.split("_")[0];
            await this.object.update({"data.stunts":{[`-=${name}`]:null}});
        }
    }

    async _onEdit (event, html){
        let name=event.target.id.split("_")[0];

        let editor = new EditPlayerStunts(this.actor, this.object.data.data.stunts[name]);
        editor.render(true);
        editor.setSheet(this);
        try {
            editor.bringToTop();
        } catch  {
            // Do nothing.
        }
    }

    async _on_track_name_click(event, html) {
        // Launch a simple application that returns us some nicely formatted text.
        let tracks = duplicate(this.object.data.data.tracks);
        let track = tracks[event.target.innerHTML]
        let notes = track.notes;
        let text = await ModularFateConstants.updateText( game.i18n.localize("ModularFate.TrackNotesFor")+" "+track.name +" "+game.i18n.localize("ModularFate.on")+" "+this.actor.name, notes);
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
            "name":game.i18n.localize("ModularFate.NewStunt"),
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
        try {
            editor.bringToTop();
        } catch  {
            // Do nothing.
        }
    }
    async _onTracks_click(event, html) {
        //Launch the EditPlayerTracks FormApplication.
        let editor = new EditPlayerTracks(this.actor); //Passing the actor works SOO much easier.
        editor.render(true);
        editor.setSheet(this);
        try {
            editor.bringToTop();
        } catch  {
            // Do nothing.
        }
    }

       async _onAspectClick(event, html) {
        if (game.user.isGM) {
            let av = new EditPlayerAspects(this.actor);
            av.render(true);
            try {
                av.bringToTop();
            } catch  {
                // Do nothing.
            }
        }
    }
    async _onSkillsButton(event, html) {
        //Launch the EditPlayerSkills FormApplication.
        let editor = new EditPlayerSkills(this.actor); //Passing the actor works SOO much easier.
        editor.render(true);
        editor.setSheet(this);
        try {
            editor.bringToTop();
        } catch  {
            // Do nothing.
        }
    }
    async _onSortButton() {
        if (this.sortByRank == undefined) {
            this.sortByRank == true;
        }
        this.sortByRank = !this.sortByRank;
        this.render(false);
        try {
            editor.bringToTop();
        } catch  {
            // Do nothing.
        }
    }

    async _onSkill_name(event, html) {

        if (event.shiftKey){
           let mrd = new ModifiedRollDialog(this.actor, event.target.id);
            mrd.render(true);
            try {
                editor.bringToTop();
            } catch  {
                // Do nothing.
            }
        }
        else {
            let skill = this.object.data.data.skills[event.target.id];
            let rank = skill.rank;
            let r = new Roll(`4dF + ${rank}`);
            let ladder = ModularFateConstants.getFateLadder();
            let rankS = rank.toString();
            let rung = ladder[rankS];
            let roll = await r.roll();

            let msg = ChatMessage.getSpeaker(this.object.actor)
            msg.alias = this.object.name;

            roll.toMessage({
                flavor: `<h1>${skill.name}</h1>${game.i18n.localize("ModularFate.RolledBy")}: ${game.user.name}<br>
                        ${game.i18n.localize("ModularFate.SkillRank")}: ${rank} (${rung})`,
                speaker: msg
            });
        }
    }

    async getData() {
        if (game.user.expanded == undefined){
                game.user.expanded = {};
        }

        if (game.user.expanded[this.actor.id+"_biography"] == undefined) game.user.expanded[this.actor.id+"_biography"] = true;
        if (game.user.expanded[this.actor.id+"_description"] == undefined) game.user.expanded[this.actor.id+"_description"] = true;
        if (game.user.expanded[this.actor.id+"_extras"] == undefined) game.user.expanded[this.actor.id+"_extras"] = true;
    
        // super.getData() now returns an object in this format:
        /*
            {
                actor: this.object,
                cssClass: isEditable ? "editable" : "locked",
                data: data, // A deepclone duplicate of the actor's data.
                effects: effects,
                items: items,
                limited: this.object.limited,
                options: this.options,
                owner: isOwner,
                title: this.title
                };
        */
        const superData = super.getData();
        const sheetData = superData.data;
        sheetData.document = superData.actor;
        let items = this.object.items.contents;
        items.sort((a, b) => (a.data.sort || 0) - (b.data.sort || 0)); // Sort according to each item's sort parameter.
        sheetData.items = items;

        sheetData.paidTracks = 0;
        sheetData.paidStunts = 0;
        sheetData.paidExtras = 0;   

        sheetData.refreshSpent = 0; //Will increase when we count tracks with the Paid field and stunts.
        sheetData.freeStunts = game.settings.get("ModularFate", "freeStunts");

        //Calculate cost of stunts here. Some cost more than 1 refresh, so stunts need a cost value        
        let tracks = sheetData.data.tracks; // Removed duplicate() here as we don't write to the tracks data, just read from it.
        for (let track in tracks) {
            if (tracks[track].paid) {
                sheetData.paidTracks++;
            }
        }

        sheetData.items.forEach(item => {
            let cost = parseInt(item.data.data.refresh);
            if (!isNaN(cost) && cost != undefined & item.data.data.active){
                sheetData.paidExtras += cost;
            }
        })

        let stunts = sheetData.data.stunts;
        for (let s in stunts){
            sheetData.paidStunts += parseInt(stunts[s].refresh_cost);
        }
        
        sheetData.paidStunts -= sheetData.freeStunts;
        sheetData.refreshSpent = sheetData.paidTracks + sheetData.paidStunts + sheetData.paidExtras;

        let isPlayer = this.object.hasPlayerOwner;
        let error = false;
        if (isPlayer) {
            // Refresh spent + refresh should = the game's refresh.
            let checkSpent = sheetData.data.details.fatePoints.refresh + sheetData.refreshSpent;
            let worldRefresh = game.settings.get("ModularFate", "refreshTotal");
            let checkWorld = worldRefresh - sheetData.data.details.fatePoints.refresh;

            let message = game.i18n.localize("ModularFate.SheetDoesNotAddUp")
            if (checkWorld < 0) {
                message += game.i18n.localize("ModularFate.RefreshGreaterThanGameRefresh")
                error = true;
            }
            if (checkSpent > worldRefresh) {
                if (error) {
                    message += game.i18n.localize("ModularFate.AndSpentRefreshPlusRefreshGreaterThanGameRefresh")
                } 
                else {
                    message += game.i18n.localize("ModularFate.SpentRefreshPlusRefreshGreaterThanGameRefresh")
                    error = true;
                }
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

        let skillTotal = 0;

        for (let s in ordered_skills) {
            //Ignore any skills with an extra field where the associated extra's countSkills is false.
            if (ordered_skills[s].extra_tag != undefined){
                let extra_id = ordered_skills[s].extra_tag.extra_id;
                let extra = sheetData.items.find(item=>item.id == extra_id);
        
                if (extra != undefined && extra.data.data.countSkills){
                    skillTotal += ordered_skills[s].rank;    
                }
            }else {
                skillTotal += ordered_skills[s].rank;
            }
        }

        sheetData.skillTotal = skillTotal;
        let skills_label = game.settings.get("ModularFate", "skillsLabel");
        sheetData.skillsLabel = skills_label || game.i18n.localize("ModularFate.defaultSkillsLabel");
        sheetData.ladder = ModularFateConstants.getFateLadder();
        sheetData.sortByRank = this.sortByRank;
        sheetData.gameSkillPoints = game.settings.get("ModularFate", "skillTotal")
        sheetData.GM = game.user.isGM;

        let track_categories = sheetData.data.tracks;
        let cats = new Set();
        for (let c in track_categories){
            let cat = track_categories[c].category;
            cats.add(cat);
        }
        sheetData.track_categories=Array.from(cats);
        sheetData.category = this.track_category;
    
        return sheetData;
    }
}