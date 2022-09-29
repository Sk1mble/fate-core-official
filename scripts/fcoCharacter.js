import { ExtraSheet } from "./ExtraSheet.js";

export class fcoCharacter extends ActorSheet {

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
        options.classes = options.classes.concat(['fcoSheet']);
        //options.viewPermission = 1; //This allows us to explicitly override the level of permissions needed to see the sheet.
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
        return this.actor.type;
    }

    get template() {
        let template = game.settings.get("fate-core-official","sheet_template");
        let limited_template = game.settings.get("fate-core-official","limited_sheet_template");

        if (template != undefined & !this.actor.limited){
            return template;
        } else {
            if (limited_template != undefined & this.actor.limited){
                return limited_template;
            } else {
                return 'systems/fate-core-official/templates/fate-core-officialSheet.html';
            }
        }
    }

    constructor (...args){
        super(...args);
        this.first_run = true;
        this.editing = false;
        this.track_category="All";
    }

    get title(){
        let mode = "";
        if (!this.isEditable) mode = " ("+game.i18n.localize ("fate-core-official.viewOnly")+")";
        let token = ""; 
        if (this.object.isToken) token = "[Token] "
        return token + this.object.name + mode;
    }

    //Here are the action listeners
    activateListeners(html) {
        // The following functions need to be available to everyone, not just the owners
        const expandAspect = html.find("i[name='expandAspect']"); //TODO: Change these expandy buttons to icons rather than a button.

        expandAspect.on("click", event => {
            let a = event.target.id.split("_")[0];
            let aspect = this.actor.system.aspects[a];
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

        const expandTrack = html.find("i[name='expandTrack']");

        expandTrack.on("click", event => {
            let t = event.target.id.split("_")[0];
            let track = this.object.system.tracks[t];
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

        const sortStunts = html.find('div[name="sort_stunts"]');
        sortStunts.on('click', (event) => {
            if (this.sortStunts == undefined) {
                this.sortStunts = game.settings.get("fate-core-official","sortStunts");
            }
            this.sortStunts = !this.sortStunts;
            this.render(false);
        })


        const expandStunt = html.find("i[name='expandStunt']");

        expandStunt.on("click", event => {
            let s = event.target.id.split("_")[0];
            let stunt = this.object.system.stunts[s];
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

        const expandExtra = html.find("i[name='expandExtra']");

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

        const ul_all_stunts = html.find('div[name="ul_all_stunts"]');
        ul_all_stunts.on('click', event => fcoConstants.ulStunts(this.object.system.stunts));

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
            let stunts = this.object.system.stunts;
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
            let stunts = this.object.system.stunts;
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

        const plug = $('.fa-plug');
            plug.on("click", async event => {
                let id = event.currentTarget.getAttribute("data-extra_id");
                let items = this.object.items;
                let item = items.get(id);
                await item.sheet.render(true);
            })

        const skill_name = html.find("div[name='skill']");
        skill_name.on("contextmenu", event=> this._onSkillR(event, html));
        const sort = html.find("div[name='sort_player_skills'")
        sort.on("click", event => this._onSortButton(event, html));

        // These events are for the owners only.
        if (this.actor.isOwner){
            skill_name.on("click", event => this._onSkill_name(event, html));
            const skillsButton = html.find("div[name='edit_player_skills']");
            skillsButton.on("click", event => this._onSkillsButton(event, html));

            const quick_add_skill = html.find("div[name='quick_add_skill']");
            quick_add_skill.on("click", event => {
                // Get name of skill and rank in a dialog (default to 0 if not defined)
                let content = `<table style="border:none;">
                <tr><td>${game.i18n.localize("fate-core-official.fu-adhoc-roll-skill-name")}</td><td><input style="background-color:white" type="text" id="fco-qaskillname"></input></td></tr>
                <tr><td>${game.i18n.localize("fate-core-official.Skill_Rank")}</td><td><input style="background-color:white" type="number" value = 0 id="fco-qaskillrank"></input></td></tr>
                </tr></table>`;
                let width = 400;
                let height = "auto";

                new Dialog({
                            title: game.i18n.localize("fate-core-official.quick_add_skill"),
                            content: content,
                            buttons: {
                                ok: {
                                        label: game.i18n.localize("fate-core-official.OK"),
                                        callback: async ()=> {
                                            // Do the stuff here
                                            // Construct a new skill
                                            let name = undefined// Get name from dialog
                                            name = $("#fco-qaskillname")[0].value;
                                            let rank = 0; // get rank from dialog
                                            rank = $("#fco-qaskillrank")[0].value;
                                            var newSkill=undefined;
                                            if (name!= undefined && name !=""){
                                                newSkill= new fcoSkill({
                                                    "name":name,
                                                    "description":game.i18n.localize("fate-core-official.AdHocSkill"),
                                                    "pc":false,
                                                    "overcome":"",
                                                    "caa":"",
                                                    "attack":"",
                                                    "defend":"",
                                                    "rank":rank,
                                                    "adhoc":true
                                                }).toJSON();
                                            }
                                            if (newSkill != undefined){
                                                newSkill.name=newSkill.name.split(".").join("․");
                                                this.object.update({"system.skills": {[newSkill.name]:newSkill}});
                                            }
                                        }
                                    },
                                }, 
                                default:"ok",
                        },
                        {
                            width:width,
                            height:height,
                        }).render(true);
            })
            
            const aspectButton = html.find("div[name='edit_player_aspects']");
            aspectButton.on("click", event => this._onAspectClick(event, html));

            const t_notes = html.find('.mfate-tracks-notes__input.contenteditable');
            const a_notes = html.find('.mfate-aspects-notes__input.contenteditable');

            t_notes.on("blur", event => {this.updateNotes(event, html)})
            a_notes.on("blur", event => {this.updateNotes(event, html)})

            const t_notes2 = html.find('.mfate-tracks-notes__input').not('.contenteditable');
            const a_notes2 = html.find('.mfate-aspects-notes__input').not('contenteditable');

            t_notes2.on("contextmenu", event => {this.updateNotesHTML(event, html)});
            a_notes2.on("contextmenu", event => {this.updateNotesHTML(event, html)});

            const box = html.find("input[class='fco-box']");
            box.on("click", event => this._on_click_box(event, html));
            const skills_block = html.find("div[name='skills_block']");
            const track_name = html.find("div[class='mfate-tracks__list']");
            const roll_track = html.find("i[name='roll_track']");

            roll_track.on("click", async event => {
                let name = event.target.id;
                let track = this.object.system.tracks[name];
                if (track.rollable == "full" || track.rollable == "empty") {
                    let umr = false;
                    if (game.system["fco-shifted"] && !game.settings.get("fate-core-official","modifiedRollDefault")) umr = true;
                    if (!game.system["fco-shifted"] && game.settings.get("fate-core-official","modifiedRollDefault")) umr = true;
                    if (!umr) await this.object.rollTrack(track.name);
                    if (umr) await this.object.rollModifiedTrack(track.name);
                }
            })
            track_name.on("contextmenu", event => {
                    let name = event.currentTarget.id.split("_")[1]
                    let track = this.object.system.tracks[name];
            
                    let linked_skills_text =""
                    if (track.linked_skills != undefined && track.linked_skills.length >0){
                        for (let i = 0; i<track.linked_skills.length;i++)
                        {
                            let skill = track.linked_skills[i];
                            linked_skills_text+=`Skill: ${skill.linked_skill}; Rank: ${skill.rank}; Boxes: ${skill.boxes}; Enables: ${skill.enables ? 'Yes':'No'}<br>`
                        }
                    }
            
                    let content = 
                    `<div style="background-color:white">
                    <h1 style="padding: 10px">${track.name} (${track.recovery_type})</h1>
                    <table border="1" cellpadding="4" cellspacing="4" style="background-color:white;">
                        <tr>
                            <td width = "200px" style="padding:10px">
                                ${game.i18n.localize("fate-core-official.Description")}:
                            </td>
                            <td style="padding:10px">
                                ${track.description}
                            </td>
                        </tr>
                        <tr>
                        <tr>
                            <td style="padding:10px">
                                ${game.i18n.localize("fate-core-official.Boxes")}:<br>
                                ${game.i18n.localize("fate-core-official.Harm")}:
                            </td>
                            <td style="padding:10px">
                                ${track.boxes}<br>
                                ${track.harm_can_absorb}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:10px">
                                ${game.i18n.localize("fate-core-official.WhenMarked")}:
                            </td>
                            <td style="padding:10px">
                                ${track.when_marked}
                            </td>
            
                        </tr>
                        <tr>
                            <td style="padding:10px">
                                ${game.i18n.localize("fate-core-official.HowRecover")}:
                            </td>
                            <td style="padding:10px">
                                ${track.recovery_conditions}
                            </td>
                        </tr>
                    </table>
                    </div>`
            
                    fcoConstants.awaitOKDialog(track.name, content, 1000);
            })

            const stunt_box = html.find("input[class='stunt_box']");
            stunt_box.on("click", event => this._on_click_stunt_box(event, html));

            const delete_stunt = html.find("button[name='delete_stunt']");
            delete_stunt.on("click", event => this._onDelete(event,html));
            const edit_stunt = html.find("button[name='edit_stunt']")
            edit_stunt.on("click", event => this._onEdit (event,html));

            const tracks_button = html.find("div[name='edit_player_tracks']"); // Tracks, tracks, check
            const stunts_button = html.find("div[name='edit_player_stunts']");

            const extras_button = html.find("div[name='add_player_extra']");
            const extras_edit = html.find ("button[name='edit_extra']");
            const extras_delete = html.find("button[name='delete_extra']");

            const gm_notes = html.find(`i[id="${this.document.id}_toggle_gm_notes"]`);
            gm_notes.on("click", async event => {
                if (this.document.system.details.notes.GM){
                    await this.document.update({"system.details.notes.GM":false});
                } else {
                    await this.document.update({"system.details.notes.GM":true});
                }
            })

            let tracks = this.object.system.tracks;
            for (let track in tracks){
                let id = fcoConstants.getKey(tracks[track].name)+"_track_notes";
                fcoConstants.getPen(id);

                $(`#${id}_rich`).on("click", event => {
                    $(`#${id}_rich`).css('display', 'none');
                    $(`#${id}`).css('display', 'block');
                    $(`#${id}`).focus();
                })
                
                $(`#${id}`).on('blur', async event => {
                    if (!window.getSelection().toString()){
                        let desc;
                        if (isNewerVersion(game.version, '9.224')){
                            desc = DOMPurify.sanitize(await TextEditor.enrichHTML(event.target.innerHTML, {secrets:this.object.isOwner, documents:true, async:true}))                            
                        } else {
                            desc = DOMPurify.sanitize(await TextEditor.enrichHTML(event.target.innerHTML, {secrets:this.object.isOwner, entities:true, async:true}))    
                        }
                        $(`#${id}`).css('display', 'none');
                        $(`#${id}_rich`)[0].innerHTML = desc;    
                        $(`#${id}_rich`).css('display', 'block');
                    }
                })
            }

            let aspects = this.object.system.aspects;
            for (let aspect in aspects){
                if (aspects[aspect].notes == undefined){
                    aspects[aspect].notes = "";
                }
                let id = fcoConstants.getKey(aspects[aspect].name)+"_aspect_notes";
                if (!aspects[aspect].extra_id) fcoConstants.getPen(id);

                $(`#${id}_rich`).on("click", event => {
                    if (event.target.outerHTML.startsWith("<a data")) return;
                    $(`#${id}_rich`).css('display', 'none');
                    $(`#${id}`).css('display', 'block');
                    $(`#${id}`).focus();
                })
                
                $(`#${id}`).on('blur', async event => {
                    if (!window.getSelection().toString()){
                        let desc;
                        if (isNewerVersion(game.version, '9.224')){
                            desc = DOMPurify.sanitize(await TextEditor.enrichHTML(event.target.innerHTML, {secrets:this.object.isOwner, documents:true, async:true}))
                        } else {
                            desc = DOMPurify.sanitize(await TextEditor.enrichHTML(event.target.innerHTML, {secrets:this.object.isOwner, entities:true, async:true}))
                        }
                        $(`#${id}`).css('display', 'none');
                        $(`#${id}_rich`)[0].innerHTML = desc;    
                        $(`#${id}_rich`).css('display', 'block');
                    }
                })
            }

            extras_button.on("click", event => this._on_extras_click(event, html));
            extras_edit.on("click", event => this._on_extras_edit_click(event, html));
            extras_delete.on("click", event => this._on_extras_delete(event, html));

            const tracks_block = html.find("div[name='tracks_block']");
            const stunts_block = html.find("div[name='stunts_block']");

            stunts_button.on("click", event => this._onStunts_click(event, html));
            tracks_button.on("click", event => this._onTracks_click(event, html));

            const bio = html.find(`div[id='${this.object.id}_biography']`)
            fcoConstants.getPen(`${this.object.id}_biography`);

            const showyBio = html.find(`div[id='${this.document.id}_biography_rich']`)
            showyBio.on('click', async event => {
                if (event.target.outerHTML.startsWith("<a data")) return;
                this.editing = true;
                $(`#${this.object.id}_biography_rich`).css('display', 'none');
                $(`#${this.object.id}_biography`).css('display', 'block');
                $(`#${this.object.id}_biography`).focus();
            })

            showyBio.on('contextmenu', async event => {
                let text = await fcoConstants.updateText("Edit raw HTML",event.currentTarget.innerHTML);
                if (text != "discarded") {
                    this.editing = false;
                    await this.object.update({"system.details.biography.value":text});
                }
            })

            const showyDesc = html.find(`div[id='${this.document.id}_description_rich']`)
            showyDesc.on('click', async event => {
                if (event.target.outerHTML.startsWith("<a data")) return;
                this.editing = true;
                $(`#${this.object.id}_description_rich`).css('display', 'none');
                $(`#${this.object.id}_description`).css('display', 'block');
                $(`#${this.object.id}_description`).focus();
            })

            showyDesc.on('contextmenu', async event => {
                let text = await fcoConstants.updateText("Edit raw HTML",event.currentTarget.innerHTML);
                if (text != "discarded") {
                    this.editing = false;
                    await this.object.update({"system.details.description.value":text});
                }
            })

            const showyNotes = html.find(`div[id='${this.document.id}_notes_rich']`)
            showyNotes.on('click', async event => {
                if (event.target.outerHTML.startsWith("<a data")) return;
                this.editing = true;
                $(`#${this.object.id}_notes_rich`).css('display', 'none');
                $(`#${this.object.id}_notes`).css('display', 'block');
                $(`#${this.object.id}_notes`).focus();
            })

            showyNotes.on('contextmenu', async event => {
                let text = await fcoConstants.updateText("Edit raw HTML",event.currentTarget.innerHTML);
                if (text != "discarded") {
                    this.editing = false;
                    await this.object.update({"system.details.notes.value":text});
                }
            })

            const notes = html.find (`div[id='${this.object.id}_notes']`);
            fcoConstants.getPen(`${this.object.id}_notes`);

            const desc = html.find(`div[id='${this.object.id}_description']`)
            fcoConstants.getPen(`${this.object.id}_description`);
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

            const item = html.find("div[class='item_header']");
            item.on("dragstart", event => this._on_item_drag (event, html));

            item.on("dblclick", async event => {
                let content = `<strong>${game.i18n.format("fate-core-official.sharedFrom",{name:this.object.name})}</strong><br/><hr>`
                let user = game.user;
                let item = await fromUuid(event.currentTarget.getAttribute("data-item"));
                item = duplicate(item);
                
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

                ChatMessage.create({content: content, speaker : {user}, type: CONST.CHAT_MESSAGE_TYPES.OOC })
            })

            const mfdraggable = html.find('.mf_draggable');
            mfdraggable.on("dragstart", event => {
                if (game.user.isGM){
                    let ident = "mf_draggable"
                    let type = event.target.getAttribute("data-mfdtype");
                    let origin = event.target.getAttribute("data-mfactorid");
                    let dragged_name = event.target.getAttribute("data-mfname");
                    
                    let shift_down = false; 
                    if (isNewerVersion(game.version, "9.230")){
                        shift_down = game.system["fco-shifted"];    
                    } else {
                        shift_down = keyboard.isDown("Shift");
                    }

                    let dragged;
                    if (type == "skill") dragged = this.actor.system.skills[dragged_name];
                    if (type == "stunt") dragged = this.actor.system.stunts[dragged_name];
                    if (type == "aspect") dragged = this.actor.system.aspects[dragged_name];
                    if (type == "track") dragged = this.actor.system.tracks[dragged_name]
                    let user = game.user.id;
                    let drag_data = {ident:ident, userid:user, type:type, origin:origin, dragged:dragged, shift_down:shift_down};
                    event.originalEvent.dataTransfer.setData("text/plain", JSON.stringify(drag_data));
                }
            })

            mfdraggable.on("dblclick", event => {
                let origin = event.target.getAttribute("data-mfactorid");
                let content = `<strong>${game.i18n.format("fate-core-official.sharedFrom",{name:this.object.name})}</strong><br/><hr>`
                let user = game.user;
                let type = event.target.getAttribute("data-mfdtype");
                
                let name = event.target.getAttribute("data-mfname");
                let entity;
                if (type == "skill") {
                    entity = this.actor.system.skills[name];
                    content += `<strong>${game.i18n.localize("fate-core-official.Name")}: </strong> ${entity.name}<br/>
                                <strong>${game.i18n.localize("fate-core-official.Rank")}: </strong> ${entity.rank}<br/>
                                <strong>${game.i18n.localize("fate-core-official.Description")}: </strong> ${entity.description}</br>`
                }
                if (type == "stunt") {
                    entity = this.actor.system.stunts[name];
                    content += `<strong>${game.i18n.localize("fate-core-official.Name")}: </strong> ${entity.name} (${game.i18n.localize("fate-core-official.Refresh")} ${entity.refresh_cost})<br/>
                                <strong>${game.i18n.localize("fate-core-official.Description")}:</strong> ${entity.description}<br/>
                                <strong>${game.i18n.localize("fate-core-official.Skill")}:</strong> ${entity.linked_skill}<br/>
                                <strong>${game.i18n.localize("fate-core-official.Bonus")}:</strong> ${entity.bonus}<br/>`;
                    let actions = `<em style = "font-family:Fate; font-style:normal">`;
                    if (entity.overcome) actions += 'O ';
                    if (entity.caa) actions += 'C ';
                    if (entity.attack) actions += 'A '
                    if (entity.defend) actions += 'D';
                    content += actions;
                }
                if (type == "aspect"){
                    entity = this.actor.system.aspects[name];
                    content += `<strong>${game.i18n.localize("fate-core-official.Name")}: </strong> ${entity.name}<br/>
                                <strong>${game.i18n.localize("fate-core-official.Value")}: </strong> ${entity.value}<br/>
                                <strong>${game.i18n.localize("fate-core-official.Description")}: </strong> ${entity.description}</br>
                                <strong>${game.i18n.localize("fate-core-official.Notes")}: </strong> ${entity.notes}`
                } 
                if (type == "track") {
                    entity = this.actor.system.tracks[name];
                    content += `<strong>${game.i18n.localize("fate-core-official.Name")}: </strong> ${entity.name}<br/>
                                <strong>${game.i18n.localize("fate-core-official.Description")}: </strong> ${entity.description}</br>
                                <strong>${game.i18n.localize("fate-core-official.Notes")}: </strong> ${entity.notes}`
                    if (entity.aspect.when_marked) content += `<strong>${game.i18n.localize("fate-core-official.Aspect")}</strong>: ${entity.aspect.name}<br/>`
                    if (entity.boxes > 0){
                        content += `<em style="font-family:Fate; font-style:normal">`
                        for (let i = 0; i < entity.box_values.length; i++){
                            if (entity.box_values[i]) content += '.';
                            if (!entity.box_values[i]) content += '1';
                        }
                        content += `<\em>`
                    }
                }

                ChatMessage.create({content: content, speaker : {user}, type: CONST.CHAT_MESSAGE_TYPES.OOC })
            })

            const input = html.find('input[type="text"], input[type="number"], textarea');

            const extra_active = html.find('button[name = "extra_active"]');
            extra_active.on("click", async event => {
                let item_id = event.target.id.split("_")[0];
                let item = this.document.items.get(item_id);
                if (item.system.active){
                    await item.update({"system.active":false},{render:false, noHook:true});
                    await this.document.deactivateExtra(item, false);
                    this.render(false);
                } else {
                    await item.update({"system.active":true},{render:false, noHook:true});
                    this.document.updateFromExtra(item);
                    this.render(false);
                }
            });

            const saveDefault = html.find("button[name='saveDefault']");

            saveDefault.on("click", async event => {
                let f = new FateCharacterDefaults();
                let content = 
                                `<form>
                                    <div style="display:table;">
                                        <div style="display:table-row">
                                            <div style="display:table-cell; width:25%; padding:5px">
                                                ${game.i18n.localize("fate-core-official.name")}
                                            </div>
                                            <div style="display:table-cell; padding:5px">
                                                <input tabindex="0" id="${this.document.id}_choose_default_name" type="text"></input>
                                            </div>
                                        </div>
                                        <div style="display:table-row">
                                            <div style="display:table-cell; padding:5px">
                                                ${game.i18n.localize("fate-core-official.description")}
                                            </div>
                                            <div style="display:table-cell; padding:5px">
                                                <input tabindex="0" id = "${this.document.id}_choose_default_description" type="text"></input>
                                            </div>
                                        </div>
                                        <div style="display:table-row">
                                            <div style="display:table-cell: width:50%; padding:5px">
                                                Keep Skill Ranks?
                                            </div>
                                            <div style="display:table-cell; padding:5px">
                                                <input tabindex="0" id = "${this.document.id}_keep_skills" type="checkbox"></input>
                                            </div>
                                        </div>
                                        <div style="display:table-row">
                                            <div style="display:table-cell; width:50%; padding:5px">
                                                Keep Aspect Values?
                                            </div>
                                            <div style="display:table-cell; padding:5px">
                                                <input tabindex="0" id = "${this.document.id}_keep_aspects" type="checkbox"></input>
                                            </div>
                                        </div>
                                    </div>
                                </form>`
                    let d = new Dialog({
                    title: game.i18n.localize("fate-core-official.pickADefaultName"),
                    content: content,
                    buttons: {
                        ok: {
                            label:"OK",
                            callback: async () => {
                                let name = $(`#${this.document.id}_choose_default_name`)[0].value;
                                let desc = $(`#${this.document.id}_choose_default_description`)[0].value;
                                if (!name) name = this.document.name;
                                let f = new FateCharacterDefaults();
                                let options = {
                                                keep_skills:$(`#${this.document.id}_keep_skills`)[0].checked,
                                                keep_aspects:$(`#${this.document.id}_keep_aspects`)[0].checked
                                }
                                let def = await f.extractDefault(this.document, name, desc, options);
                                def.options = options;
                                await f.storeDefault(def);
                                ui.sidebar.render(false);
                            }
                        }
                    },
                    default: "ok"
                }).render(true);
            })

            const changeSheetMode = html.find("button[name='changeSheetMode']");
            changeSheetMode.on('click', async event => {
                // Cycle between the display options and tell the user what the new option is.
                let current_mode = this.actor.system.details.sheet_mode;
                if (current_mode == "minimal_at_refresh_0") {
                    // Switch to full
                    await this.actor.update({"system.details.sheet_mode":"full"})
                    ui.notifications.info(game.i18n.localize("fate-core-official.modeToFull"))
                }
                if (current_mode == "minimal"){
                    //Switch to minimal_at_refresh_0
                    await this.actor.update({"system.details.sheet_mode":"minimal_at_refresh_0"})
                    ui.notifications.info(game.i18n.localize("fate-core-official.modeToMinimal0"))

                }
                if (current_mode == "full"){
                    // Switch to minimal
                    await this.actor.update({"system.details.sheet_mode":"minimal"})
                    ui.notifications.info(game.i18n.localize("fate-core-official.modeToMinimal"))
                }
            })

            const applyDefault = html.find("button[name='applyDefault']");
            applyDefault.on("click", async event => {
                let f = new FateCharacterDefaults();
                let options = f.defaults.map(d => `<option>${d}</option>`).join("\n");
                let content = `
                <h2>${game.i18n.localize("fate-core-official.applyDefault")}</h2>
                <select style="width:100%" id="${this.document.id}_select_default">
                                    ${options}
                </select>
                <table style="border:none, background-color:transparent">
                            <table style="border:none, background-color:transparent">
                                <th style="width:60%; text-align:left">
                                    ${game.i18n.localize("fate-core-official.item")}
                                </th>
                                <th style="width:40%; text-align:left">
                                    ${game.i18n.localize("fate-core-official.applyFromDefault")}
                                </th>
                                <tr>
                                    <td style="width:60%; text-align:left">
                                        ${game.i18n.localize("fate-core-official.avatar")}
                                    </td>
                                    <td style="width:40%; text-align:left">
                                        <i id="${this.document.id}_def_avatar" class="def_toggle fas fa-toggle-on"></i>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="width:60%; text-align:left">
                                        ${game.i18n.localize("fate-core-official.tracks")}
                                    </td>
                                    <td style="width:40%; text-align:left">
                                        <i id="${this.document.id}_def_tracks" class="def_toggle fas fa-toggle-on"></i>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="width:60%; text-align:left">
                                        ${game.i18n.localize("fate-core-official.aspects")}
                                    </td>
                                    <td style="width:40%; text-align:left">
                                        <i id="${this.document.id}_def_aspects" class="def_toggle fas fa-toggle-on"></i>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="width:60%; text-align:left">
                                        ${game.i18n.localize("fate-core-official.stunts")}
                                    </td>
                                    <td style="width:40%; text-align:left">
                                        <i id="${this.document.id}_def_stunts" class="def_toggle fas fa-toggle-on"></i>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="width:60%; text-align:left">
                                        ${game.i18n.localize("fate-core-official.extras")}
                                    </td>
                                    <td style="width:40%; text-align:left">
                                        <i id="${this.document.id}_def_extras" class="def_toggle fas fa-toggle-on"></i>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="width:60%; text-align:left">
                                        ${game.settings.get("fate-core-official","skillsLabel")}
                                    </td>
                                    <td style="width:40%; text-align:left">
                                        <i id="${this.document.id}_def_skills" class="def_toggle fas fa-toggle-on"></i>
                                    </td>
                                </tr>
                            </table>
                            <h2 style="text-align:center"><i id="${this.document.id}_def_overwrite" class="def_toggle fas fa-toggle-on"></i> <b id="def_mo">${game.i18n.localize("fate-core-official.merge")}</b></h2>
                        </td>
                    </row>
                </table>
                `
                let d = await new Dialog({
                    title: game.i18n.localize("fate-core-official.applyDefaultOptions"),
                    content: content,
                    buttons: {
                        ok: {
                            label:"OK",
                            callback: async () => {                                
                                let avatar = $(`#${this.document.id}_def_avatar`).hasClass('fa-toggle-on');
                                let tracks = $(`#${this.document.id}_def_tracks`).hasClass('fa-toggle-on');
                                let stunts = $(`#${this.document.id}_def_stunts`).hasClass('fa-toggle-on');
                                let extras = $(`#${this.document.id}_def_extras`).hasClass('fa-toggle-on');
                                let skills = $(`#${this.document.id}_def_skills`).hasClass('fa-toggle-on');
                                let aspects = $(`#${this.document.id}_def_aspects`).hasClass('fa-toggle-on');
                                let merge = $(`#${this.document.id}_def_overwrite`).hasClass('fa-toggle-on');
                                let default_name = $(`#${this.document.id}_select_default`).val();
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
                                    prompt = `${game.i18n.localize("fate-core-official.merge")} from '${default_name}' default`;
                                    content = game.i18n.localize("fate-core-official.proceedToMerge");
                                } 
                                if (!merge) {
                                    prompt = `${game.i18n.localize("fate-core-official.overwrite")} with '${default_name}' default`
                                    content = game.i18n.localize("fate-core-official.proceedToOverwrite");
                                }
                                let proceed = await fcoConstants.awaitYesNoDialog(prompt, content);
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

            input.on("focus", event => {
                if (this.editing == false) {
                    this.editing = true;
                }
            });

            input.on("blur", event => {
                this.editing = false;
                if (this.renderBanked){
                    this.renderBanked = false;
                    this._render(false);
                }
            });

            input.on("keyup", event => {
                if (event.keyCode === 13 && event.target.type == "input") {
                    input.blur();
                }
            })
        }
        super.activateListeners(html);
    }

    async _onSkillR(event,html){
        let name = event.target.id;
        let skill = this.actor.system.skills[name];
        fcoConstants.awaitOKDialog(game.i18n.localize("fate-core-official.SkillDetails"),`
                                            <div style="background-color:white">
                                            <table cellspacing ="4" cellpadding="4" border="1" style="background-color:white">
                                                <h2 style="padding:10px;">${skill.name}</h2>
                                                <tr>
                                                    <td style="width:400px; padding:10px">
                                                        <b>${game.i18n.localize("fate-core-official.Description")}:</b>
                                                    </td>
                                                    <td style="width:2000px; padding:10px">
                                                        ${skill.description}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:10px;">
                                                        <b>${game.i18n.localize("fate-core-official.Overcome")}:</b>
                                                    </td>
                                                    <td style="width:2000px;  padding:10px">
                                                        ${skill.overcome}
                                                    </td>
                                                </tr>
                                                <tr>
                                                   <td style="padding:10px;">
                                                        <b>${game.i18n.localize("fate-core-official.CAA")}:</b>
                                                    </td>
                                                    <td style="width:2000px;  padding:10px">
                                                        ${skill.caa}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:10px;">
                                                        <b>${game.i18n.localize("fate-core-official.Attack")}:</b>
                                                    </td>
                                                    <td style="width:2000px; padding-left:5px">
                                                        ${skill.attack}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:10px;">
                                                        <b>${game.i18n.localize("fate-core-official.Defend")}:</b>
                                                    </td>
                                                    <td style="width:2000px; padding-left:5px">
                                                        ${skill.defend}
                                                    </td>
                                                </tr>
                                            </table>
                                            </div>`,1000)
    }

    async _on_item_drag (event, html){
        let item = await fromUuid(event.currentTarget.getAttribute("data-item"));
        let data = {
            "type":"Item", 
            "uuid":item.uuid
        }
        await event.originalEvent.dataTransfer.setData("text/plain", JSON.stringify(data));
    }

    async _cat_select_change (event, html){
        this.track_category = event.target.value;
        this.render(false);
    }

    async _db_add_click(event, html){
        let name = event.target.id.split("_")[0];
        let db = duplicate(game.settings.get("fate-core-official","stunts"));
        db[name]=this.object.system.stunts[name];
        await game.settings.set("fate-core-official","stunts",db);
        ui.notifications.info(game.i18n.localize("fate-core-official.Added")+" "+name+" "+game.i18n.localize("fate-core-official.ToTheStuntDatabase"));
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
        this.object.rollStunt(name);
    }

    async _onBioFocusOut (event, html){
        if (!window.getSelection().toString()){
            let bio = DOMPurify.sanitize(event.target.innerHTML);
            await this.object.update({"system.details.biography.value":bio})
            $(`#${this.object.id}_biography`).css('display', 'none');
            $(`#${this.object.id}_biography_rich`).css('display', 'block');
            this.editing = false;
            await this._render(false);
        }
    }

    async _onNotesFocusOut (event, html){
        if (!window.getSelection().toString()){
            let notes = DOMPurify.sanitize(event.target.innerHTML);
            await this.object.update({"system.details.notes.value":notes})
            $(`#${this.object.id}_notes`).css('display', 'none');
            $(`#${this.object.id}_notes_rich`).css('display', 'block');
            this.editing = false;
            await this._render(false);
        }
    }

    // This is required in order to ensure we update the data for track notes when changed.
    async updateNotes (event, html){
        if (!window.getSelection().toString()){
            let text = DOMPurify.sanitize(event.target.innerHTML);            
            let item = event.target.getAttribute("data-edit");//This is a much better way of accessing data than splitting the id.
            await this.actor.update({[item]:text});
            this.editing = false;
            await this._render(false)
        }
    }

    async updateNotesHTML (event, html){ //This is the method that updates the notes for tracks/aspects when the raw HTML is edited.
        let text = await fcoConstants.updateText("Edit raw HTML",event.currentTarget.innerHTML);
        if (text != "discarded") {
            this.editing = false;
            let item = event.currentTarget.getAttribute("data-edit");//This is a much better way of accessing data than splitting the id.
            await this.actor.update({[item]:text});
            this.editing = false;
            await this._render(false)
        }
    }
    
    async _onDescFocusOut (event, html){
        if (!window.getSelection().toString()){
            let desc = DOMPurify.sanitize(event.target.innerHTML);
            await this.object.update({"system.details.description.value":desc});
            $(`#${this.object.id}_description`).css('display', 'none');
            $(`#${this.object.id}_description_rich`).css('display', 'block');
            this.editing = false;
            await this._render(false);
        }
    }

    async _render(...args){
        if (!this.object?.parent?.sheet?.editing && !this.editing && !window.getSelection().toString()){
            if (!this.renderPending) {
                    this.renderPending = true;
                    setTimeout(async () => {
                        await super._render(...args);
                        this.renderPending = false;
                    }, 150);
            }
        } else this.renderBanked = true;
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
        item.sheet.render(true);
    }    

    async _on_extras_delete(event, html){
        let del = await fcoConstants.confirmDeletion();
        if (del){
            await this.actor.deleteEmbeddedDocuments("Item",[event.target.id.split("_")[0]]);
        }
    }

    async _onDelete(event, html){
        let del = await fcoConstants.confirmDeletion();
        if (del){
            let name = event.target.id.split("_")[0];
            await this.object.update({"system.stunts":{[`-=${name}`]:null}});
        }
    }

    async _onEdit (event, html){
        let name=event.target.id.split("_")[0];

        let editor = new EditPlayerStunts(this.actor, this.object.system.stunts[name], {new:false});
        editor.render(true);
        editor.setSheet(this);
        try {
            editor.bringToTop();
        } catch  {
            // Do nothing.
        }
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
        let tracks = duplicate(this.object.system.tracks);
        let track = tracks[name]
        track.box_values[index] = checked;
        await this.object.update({
            // By using this format for the update we can drill right down to the box_values array and avoid updating anything else.
            ["system.tracks"]:{[name]:{["box_values"]:track.box_values}}
        })
    }

    async _on_click_stunt_box(event, html){
        let name = event.target.getAttribute("data-stunt");
        let index = event.target.getAttribute("data-index");
        let checked = event.target.checked;

        let stunts = duplicate(this.object.system.stunts);
        let stunt = stunts[name];
        stunt.box_values[index] = checked;
        await this.object.update({["system.stunts"]:stunts});
    }

    async _onStunts_click(event, html) {
        //Launch the EditPlayerStunts FormApplication.
        let stunt = new fcoStunt({
            "name":game.i18n.localize("fate-core-official.NewStunt"),
            "linked_skill":"None",
            "description":"",
            "refresh_cost":1,
            "overcome":false,
            "caa":false,
            "attack":false,
            "defend":false,
            "bonus":0,
        }).toJSON();
        let editor = new EditPlayerStunts(this.actor, stunt, {new:true});
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
            this.sortByRank = game.settings.get("fate-core-official","sortSkills");
        }
        this.sortByRank = !this.sortByRank;
        this.render(false);
        try {
            editor.bringToTop();
        } catch  {
            // Do nothing.
        }
    }llskill

    async _onSkill_name(event, html) {
        let target = this.object;
            if (event.originalEvent.detail > 1){
                this.clickPending = true;
                return;
            }
            if (event.originalEvent.detail == 1){
            setTimeout(async () => {
                if (this.clickPending) {
                    this.clickPending = false;
                    return;
                } else {
                    let umr = false;

                    if (isNewerVersion(game.version, "9.230")){
                        if (game.system["fco-shifted"] && !game.settings.get("fate-core-official","modifiedRollDefault")) umr = true;              
                        if (!game.system["fco-shifted"] && game.settings.get("fate-core-official","modifiedRollDefault")) umr = true;              
                    } else {
                        if (event.shiftKey && !game.settings.get("fate-core-official","modifiedRollDefault")) umr = true;
                        if (!event.shiftKey && game.settings.get("fate-core-official","modifiedRollDefault")) umr = true;
                    }
                
                    if (umr){
                        await target.rollModifiedSkill(event.target.id);
                    }
                    else {
                        await target.rollSkill(event.target.id);
                    }
                }
            }, 300);
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
        const sheetData = duplicate(superData.data);
        sheetData.document = superData.actor;
        sheetData.owner = superData.owner;

        sheetData.system.displayStunts = duplicate(sheetData.system.stunts);

        // Set the initial sort order for skills and stunts according to the user's preferences (defaulted to sorting by name for skills and not sorted for stunts)
        if (this.sortByRank == undefined) this.sortByRank = game.settings.get("fate-core-official","sortSkills");
        if (this.sortStunts == undefined) this.sortStunts = game.settings.get("fate-core-official","sortStunts");

        if (this.sortStunts) sheetData.system.displayStunts = fcoConstants.sortByKey(sheetData.system.displayStunts);

        // Determine sheet view mode:
        // return minimal or full depending on:
        // data.data.details.sheet_mode is set to minimal
        // data.data.details.sheet_mode is set to minimal_at_refresh_0 and data.data.details.fatePoints.refresh is currently 0.
        // Otherwise, return full.

        sheetData.sheetMode = "full";
        if (sheetData.system.details.sheet_mode == "minimal") sheetData.sheetMode = "minimal";
        if (sheetData.system.details.sheet_mode == "minimal_at_refresh_0" && sheetData.system.details.fatePoints.refresh == 0) sheetData.sheetMode = "minimal";

        sheetData.showPronouns = game.settings.get("fate-core-official", "showPronouns");
        let items = this.object.items.contents;
        items.sort((a, b) => (a.sort || 0) - (b.sort || 0)); // Sort according to each item's sort parameter.
        sheetData.items = items;

        sheetData.paidTracks = 0;
        sheetData.paidStunts = 0;
        sheetData.paidExtras = 0;   

        sheetData.refreshSpent = 0; //Will increase when we count tracks with the Paid field and stunts.
        sheetData.freeStunts = game.settings.get("fate-core-official", "freeStunts");

        //Calculate cost of stunts here. Some cost more than 1 refresh, so stunts need a cost value        
        let tracks = sheetData.system.tracks; // Removed duplicate() here as we don't write to the tracks data, just read from it.
        for (let track in tracks) {
            if (tracks[track].paid) {
                sheetData.paidTracks++;
            }
        }

        sheetData.items.forEach(item => {
            let cost = parseInt(item.system.refresh);
            if (!isNaN(cost) && cost != undefined & item.system.active){
                sheetData.paidExtras += cost;
            }
        })

        let stunts = sheetData.system.stunts;
        for (let s in stunts){
            sheetData.paidStunts += parseInt(stunts[s].refresh_cost);
        }
        
        sheetData.paidStunts -= sheetData.freeStunts;
        sheetData.refreshSpent = sheetData.paidTracks + sheetData.paidStunts + sheetData.paidExtras;

        let isPlayer = this.object.hasPlayerOwner;
        let error = false;
        if (isPlayer && game.settings.get("fate-core-official","enforceRefresh")) {
            // Refresh spent + refresh should = the game's refresh.
            let checkSpent = sheetData.system.details.fatePoints.refresh + sheetData.refreshSpent;
            let worldRefresh = game.settings.get("fate-core-official", "refreshTotal");
            let checkWorld = worldRefresh - sheetData.system.details.fatePoints.refresh;

            let message = game.i18n.localize("fate-core-official.SheetDoesNotAddUp")
            if (checkWorld < 0) {
                message += game.i18n.localize("fate-core-official.RefreshGreaterThanGameRefresh")
                error = true;
            }
            if (checkSpent > worldRefresh) {
                if (error) {
                    message += game.i18n.localize("fate-core-official.AndSpentRefreshPlusRefreshGreaterThanGameRefresh")
                } 
                else {
                    message += game.i18n.localize("fate-core-official.SpentRefreshPlusRefreshGreaterThanGameRefresh")
                    error = true;
                }
            }
            if (error) {
                ui.notifications.error(message);
            }
        }
        const unordered_skills = sheetData.system.skills;
        const ordered_skills = {};
        let sorted_by_rank = fcoConstants.sortByRank(unordered_skills);

        // Sort the skills to display them on the character sheet.
        Object.keys(unordered_skills).sort().forEach(function(key) {
            ordered_skills[key] = unordered_skills[key];
        }); //You can use this code to sort a JSON object by creating a replacement object.
        sheetData.ordered_skills = ordered_skills;
        sheetData.sorted_by_rank = sorted_by_rank;
        sheetData.gameRefresh = game.settings.get("fate-core-official", "refreshTotal");

        let skillTotal = 0;
        // Exclude skills on extras which are not set to countMe/countSkills
        for (let s in ordered_skills) {
            skillTotal += ordered_skills[s].rank;
        }

        for (let extra of sheetData.items){
            for (let sk in extra.system.skills){
                if (extra.system.active && (!extra.system.countSkills && !extra.system.skills[sk].countMe)){
                    skillTotal -= extra.system.skills[sk].rank;
                }
            }
        }

        sheetData.skillTotal = skillTotal;
        let skills_label = game.settings.get("fate-core-official", "skillsLabel");
        sheetData.skillsLabel = skills_label || game.i18n.localize("fate-core-official.defaultSkillsLabel");
        sheetData.ladder = fcoConstants.getFateLadder();
        sheetData.sortByRank = this.sortByRank;
        sheetData.gameSkillPoints = game.settings.get("fate-core-official", "skillTotal")
        sheetData.GM = game.user.isGM;

        let track_categories = sheetData.system.tracks;
        let cats = new Set();
        for (let c in track_categories){
            let cat = track_categories[c].category;
            cats.add(cat);
        }
        sheetData.track_categories=Array.from(cats);
        sheetData.category = this.track_category;

        let scheme = await game.user.getFlag ("fate-core-official","current-sheet-scheme");
        if (!scheme) scheme = game.settings.get("fate-core-official","fco-world-sheet-scheme");  
        
        let logo = scheme.fco_user_sheet_logo;
        sheetData.logo = logo;
    
        // Enrich things that need to be enriched
        sheetData.system.details.notes.rich = await fcoConstants.fcoEnrich(sheetData.system.details.notes.value, this.actor);
        sheetData.system.details.biography.rich = await fcoConstants.fcoEnrich(sheetData.system.details.biography.value, this.actor);
        sheetData.system.details.description.rich = await fcoConstants.fcoEnrich(sheetData.system.details.description.value, this.actor);
        let trs = sheetData.system.tracks;
        for (let tr in trs){
            trs[tr].richNotes = await fcoConstants.fcoEnrich(trs[tr].notes);
        }
        let ass = sheetData.system.aspects;
        for (let as in ass){
            ass[as].richNotes = await fcoConstants.fcoEnrich(ass[as].notes);
            ass[as].richDesc = await fcoConstants.fcoEnrich(ass[as].description)
        }
        let sts = sheetData.system.displayStunts;
        for (let st in sts){
            sts[st].richDesc = await fcoConstants.fcoEnrich(sts[st].description);
        }
        let exs = duplicate(this.actor.items.contents);
        for (let ex of items){
            ex.richName = await fcoConstants.fcoEnrich(ex.name);
            ex.richDesc = await fcoConstants.fcoEnrich(ex.system.description.value);
        }
        return sheetData;
    }
}

Hooks.on ('dropActorSheetData', async (actor, sheet, data) => {
    if (game.user == game.users.find(e => e.isGM && e.active) || game.user.id === data.userid){
        //First check it's not from the same sheet
        if (data.ident !== "mf_draggable") return;
        if (actor.id == data.origin) return;
        delete data.dragged?.extra_id;
        delete data.dragged?.original_name;
        if (data.type == "stunt"){
            let old = actor.system.stunts[data.dragged.name];
            if (old) {
                let answer = await fcoConstants.awaitYesNoDialog(game.i18n.localize("fate-core-official.overwrite_element"), game.i18n.localize("fate-core-official.exists"));
                if (answer == "no") return
            } 
            await actor.update({"system.stunts":{[data.dragged.name]:data.dragged}});
        }
        if (data.type == "aspect"){
            let old = actor.system.aspects[data.dragged.name];
            if (old) {
                let answer = await fcoConstants.awaitYesNoDialog(game.i18n.localize("fate-core-official.overwrite_element"), game.i18n.localize("fate-core-official.exists"));
                if (answer == "no") return
            } 
            if (!data.shift_down){
                data.dragged.value = "";
                data.dragged.notes = "";
            }
            await actor.update({"system.aspects":{[data.dragged.name]:data.dragged}});
        }
        if (data.type == "skill"){
            let old = actor.system.skills[data.dragged.name];
            if (old) {
                let answer = await fcoConstants.awaitYesNoDialog(game.i18n.localize("fate-core-official.overwrite_element"), game.i18n.localize("fate-core-official.exists"));
                if (answer == "no") return
            } 
            if (!data.shift_down){
                data.dragged.rank = 0;
            }
            await actor.update({"system.skills":{[data.dragged.name]:data.dragged}});
        }
        if (data.type == "track"){
            let track = data.dragged;
            if (!data.shift_down){
                if (track?.aspect && track?.aspect !== "No" && track?.aspect != game.i18n.localize("fate-core-official.AspectAsName") && track?.aspect != game.i18n.localize("fate-core-official.NameAsAspect")){
                    track.aspect.name = "";
                }
    
                if (track?.boxes > 0){
                    for (let i = 0; i < track.box_values.length; i++){
                        track.box_values[i] = false;
                    }
                }
    
                if (track?.notes){
                    track.notes = "";
                }
            }
            let old = actor.system.tracks[track.name];
            if (old) {
                let answer = await fcoConstants.awaitYesNoDialog(game.i18n.localize("fate-core-official.overwrite_element"), game.i18n.localize("fate-core-official.exists"));
                if (answer == "no") return
            } 
            await actor.update({"system.tracks":{[track.name]:track}});
        }
    }
})
