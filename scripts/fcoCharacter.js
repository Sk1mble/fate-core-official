import { ExtraSheet } from "./ExtraSheet.js";

export class fcoCharacter extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
    constructor (...args){
        super(...args);
        this.first_run = true;
        this.editing = false;
        this.track_category="All";
        this.object = this.actor;
    }
    
    async close(options){
        this.editing = false;
        await super.close(options);
    }

    static DEFAULT_OPTIONS = {
        tag: "form",
        classes: ['fcoSheet'],
        position: {
            height: 1000,
            width: 1200,
        },
        form: {
            submitOnChange:true,
            closeOnSubmit: false
        },
        window: {
            title: this.title,
            icon: "fas fa-scroll",
            resizable: true,
        }
    }

    static PARTS = {
        fcoCharacterForm: {
            scrollable: [".skills_body", ".aspects_body",".tracks_body", ".stunts_body", '.long_text_rich', '.mfate-biography__content', '.mfate-notes__content', '.mfate-extras__content'],
        }
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

    // Instead of setting the template in the PARTS object, we override _configureRenderParts
    // to return the value of the template from this.template as before.

   _configureRenderParts(){
        const parts = super._configureRenderParts();
        const userTemplate = this.template;
        parts.fcoCharacterForm.template = userTemplate;
        return parts;
    }

    get title(){
        let mode = "";
        if (!this.isEditable) mode = " ("+game.i18n.localize ("fate-core-official.viewOnly")+")";
        let token = ""; 
        if (this.object.isToken) token = "[Token] "
        return token + this.object.name + mode;
    }

    getTabs () {
        let tabGroup = "fcoSheet";
        if (this.minimal !== "full"){
            if (!this.tabGroups[tabGroup]) this.tabGroups[tabGroup] = 'notes';
        } else {
            if (!this.tabGroups[tabGroup]) this.tabGroups[tabGroup] = 'sheet';
        }
        let tabs = {
            sheet:{
                id:"sheet",
                group:"fcoSheet",
            },
            biography:{
                id:"biography",
                group: "fcoSheet",
            },
            notes:{
                id:"notes",
                group:"fcoSheet",
            }
        }
        for (let tab in tabs){
            if (this.tabGroups[tabGroup] === tabs[tab].id){
                tabs[tab].cssClass = "active";
                tabs[tab].active = true;
            }
        }
        return tabs;
    }

    //Here are the action listeners
    _onRender(context, options) {
        const actor = this.element.querySelector(".mfate-sheet");
        
        //Add a drop handler to cope with Extras and mf_draggable items being dropped on the sheet
        actor?.addEventListener("drop", async event => {
            let data = TextEditor.getDragEventData(event);
            // If this is an Extra, let's copy it to this actor.
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
            // If it's an mf_draggable, we need to copy it to the character, too.
            if (data?.ident == "mf_draggable" && this.actor.isOwner){
                Hooks.call("dropActorSheetData", this.actor, this, data);
            }
        })
        
        // The following functions need to be available to everyone, not just the owners
        const expandAspect = this.element.querySelectorAll("i[name='expandAspect']"); 
        expandAspect.forEach (exp => exp?.addEventListener ("click", event => {
            let a = event.target.id.split("_")[0];
            let aspect = fcoConstants.gbn(this.actor.system.aspects, a);
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
        }))

        const override_world = this.element.querySelector(`input[name="${this.object._id}_override"]`);
        override_world?.addEventListener("change", async event => {
            await this.object.update({"system.override.active":event.target.checked});
        })

        const expandTrack = this.element.querySelectorAll("i[name='expandTrack']");

        expandTrack.forEach(exp => exp?.addEventListener("click", event => {
            let t = event.target.id.split("_")[0];
            let track =fcoConstants.gbn(this.object.system.tracks, t)
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
        }))
        

        const sortStunts = this.element.querySelector('div[name="sort_stunts"]');
        sortStunts?.addEventListener('click', (event) => {
            if (this.sortStunts == undefined) {
                this.sortStunts = game.settings.get("fate-core-official","sortStunts");
            }
            this.sortStunts = !this.sortStunts;
            this.render(false);
        })

        const syncToken = this.element.querySelector("i[name='syncNameToToken']");
        syncToken?.addEventListener("click", async event => {
            if (this.actor.isToken){
                // Change only token name
                await this.actor.token.update({"name":this.actor.name});
                ui.notifications.info("Token name set to token actor's name.")
            } else {
                //Change prototype token name
                await this.actor.update({"prototypeToken.name":this.actor.name});
                ui.notifications.info("Prototype Token name set to actor's name.")
            }
        })

        const expandStunt = this.element.querySelectorAll("i[name='expandStunt']");

        expandStunt.forEach(exp => exp?.addEventListener("click", event => {
            let s = event.target.id.split("_")[0];
            let stunt = fcoConstants.gbn(this.object.system.stunts, s);
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
        }))

        const expandExtra = this.element.querySelectorAll("i[name='expandExtra']");

        expandExtra.forEach(extra => extra?.addEventListener("click", event => {
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
        }))

        const expandExtraPane = this.element.querySelector("div[name='expandExtrasPane']");
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

        const ul_all_stunts = this.element.querySelector('div[name="ul_all_stunts"]');
        ul_all_stunts?.addEventListener('click', event => fcoConstants.ulStunts(this.object.system.stunts));

        const expandBiography = this.element.querySelector("div[name='expandBiography']");
        expandBiography?.addEventListener("click", event => {
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

        const expandDescription = this.element.querySelector("div[name='expandDescription']");
        expandDescription?.addEventListener("click", event => {
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


        const expandAllStunts = this.element.querySelector("div[name='expandAllStunts']");
        const compressAllStunts = this.element.querySelector("div[name='compressAllStunts']")

        expandAllStunts?.addEventListener("click", event => {
            let stunts = this.object.system.stunts;
            if (game.user.expanded == undefined){
                game.user.expanded = {};
            }

            for (let s in stunts){
                let name = stunts[s].name;
                let key = this.actor.id+name+"_stunt";
                game.user.expanded[key] = true;
            }
            this.render(false);
        })

        compressAllStunts?.addEventListener("click", event => {
            let stunts = this.object.system.stunts;
            if (game.user.expanded == undefined){
                game.user.expanded = {};
            }

            for (let s in stunts){
                let name = stunts[s].name;
                let key = this.actor.id+name+"_stunt";
                game.user.expanded[key] = false;
            }
            this.render(false);
        })

        const expandAllExtras = this.element.querySelector("div[name='expandExtras']");
        const compressAllExtras = this.element.querySelector("div[name='compressExtras']")

        expandAllExtras?.addEventListener("click", event => {
            if (game.user.expanded == undefined){
                game.user.expanded = {};
            }

            this.actor.items.forEach(item => {
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

        const plug = this.element.querySelectorAll('.fa-plug');
            plug.forEach(result => result?.addEventListener("click", async event => {
                let id = event.currentTarget.getAttribute("data-extra_id");
                let items = this.object.items;
                let item = items.get(id);
                await item.sheet.render(true);
                await item.sheet.bringToFront();
            }))

        const skill_name = this.element.querySelectorAll("div[name='skill']");
        skill_name.forEach(sk => sk?.addEventListener("contextmenu", event=> this._onSkillR(event)));
        const sort = this.element.querySelector("div[name='sort_player_skills'")
        sort?.addEventListener("click", event => this._onSortButton(event));

        // These events are for the owners only.
        if (this.actor.isOwner){
            skill_name.forEach(sk => sk.addEventListener("click", event => this._onSkill_name(event)));
            const skillsButton = this.element.querySelector("div[name='edit_player_skills']");
            skillsButton?.addEventListener("click", event => this._onSkillsButton(event));

            const quick_add_skill = this.element.querySelector("div[name='quick_add_skill']");
            quick_add_skill?.addEventListener("click", event => {
                // Get name of skill and rank in a dialog (default to 0 if not defined)
                let content = `<table style="border:none;">
                <tr><td>${game.i18n.localize("fate-core-official.fu-adhoc-roll-skill-name")}</td><td><input style="background-color:white" type="text" id="fco-qaskillname"></input></td></tr>
                <tr><td>${game.i18n.localize("fate-core-official.Skill_Rank")}</td><td><input style="background-color:white" type="number" value = 0 id="fco-qaskillrank"></input></td></tr>
                </tr></table>`;
                let width = 400;
                let height = "auto";

                new foundry.applications.api.DialogV2({
                            window:{title: game.i18n.localize("fate-core-official.quick_add_skill")},
                            content: content,
                            buttons: [{
                                        label: game.i18n.localize("fate-core-official.OK"),
                                        callback: async (event, button, dialog) => {
                                            // Do the stuff here
                                            // Construct a new skill
                                            let name = undefined// Get name from dialog
                                            name = document.getElementById("fco-qaskillname").value;
                                            let rank = 0; // get rank from dialog
                                            rank = document.getElementById("fco-qaskillrank").value;
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
                                                newSkill.name=newSkill.name;
                                                this.object.update({"system.skills": {[fcoConstants.tob64(newSkill.name)]:newSkill}});
                                            }
                                        }
                                }], 
                                default:"ok",
                        },
                        {
                            width:width,
                            height:height,
                        }).render(true);
            })
            
            const aspectButton = this.element.querySelector("div[name='edit_player_aspects']");
            aspectButton?.addEventListener("click", event => this._onAspectClick(event));

            const t_notes = this.element.querySelectorAll('.mfate-tracks-notes__input.contenteditable');
            const a_notes = this.element.querySelectorAll('.mfate-aspects-notes__input.contenteditable');

            t_notes.forEach(field => field.addEventListener("blur", event => {this.updateNotes(event)}))
            a_notes.forEach(field => field.addEventListener("blur", event => {this.updateNotes(event)}))

            const t_notes2 = this.element.querySelectorAll('.mfate-tracks-notes__input:not(.contenteditable');
            const a_notes2 = this.element.querySelectorAll('.mfate-aspects-notes__input:not(.contenteditable)');

            t_notes2.forEach(field => field.addEventListener("contextmenu", event => {this.updateNotesHTML(event)}));
            a_notes2.forEach(field => field.addEventListener("contextmenu", event => {this.updateNotesHTML(event)}));

            const box = this.element.querySelectorAll("input[class='fco-box']");
            box.forEach(b => b.addEventListener("click", event => this._on_click_box(event)));
            const skills_block = this.element.querySelector("div[name='skills_block']");
            const track_name = this.element.querySelectorAll("div[class='mfate-tracks__list']");
            const roll_track = this.element.querySelectorAll("i[name='roll_track']");

            roll_track.forEach(element => element.addEventListener("click", async event => {
                let name = event.target.id;
                let track = fcoConstants.gbn(this.object.system.tracks, name);
                if (track.rollable == "full" || track.rollable == "empty") {
                    let umr = false;
                    if (game.system["fco-shifted"] && !game.settings.get("fate-core-official","modifiedRollDefault")) umr = true;
                    if (!game.system["fco-shifted"] && game.settings.get("fate-core-official","modifiedRollDefault")) umr = true;
                    if (!umr) await this.object.rollTrack(track.name);
                    if (umr) await this.object.rollModifiedTrack(track.name);
                }
            }))

            track_name.forEach(element => element.addEventListener("contextmenu", event => {
                    let name = event.currentTarget.id.split("_")[1]
                    let track = fcoConstants.gbn(this.object.system.tracks, name);
            
                    let linked_skills_text =""
                    if (track.linked_skills != undefined && track.linked_skills.length >0){
                        for (let i = 0; i<track.linked_skills.length;i++)
                        {
                            let skill = track.linked_skills[i];
                            linked_skills_text+=`Skill: ${skill.linked_skill}; Rank: ${skill.rank}; Boxes: ${skill.boxes}; Enables: ${skill.enables ? 'Yes':'No'}<br>`
                        }
                    }
            
                    let content = 
                    `<div>
                    <h1 style="padding: 10px">${track.name} (${track.recovery_type})</h1>
                    <table border="1" cellpadding="4" cellspacing="4" style="width:950px">
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
            }))

            const stunt_box = this.element.querySelectorAll("input[class='stunt_box']");
            stunt_box.forEach(element => element.addEventListener("click", event => this._on_click_stunt_box(event)));

            const delete_stunt = this.element.querySelectorAll("button[name='delete_stunt']");
            delete_stunt.forEach(element => element.addEventListener("click", event => this._onDelete(event)));
            const edit_stunt = this.element.querySelectorAll("button[name='edit_stunt']")
            edit_stunt.forEach(element => element.addEventListener("click", event => this._onEdit (event)));

            const tracks_button = this.element.querySelector("div[name='edit_player_tracks']"); // Tracks, tracks, check
            const stunts_button = this.element.querySelector("div[name='edit_player_stunts']");

            const extras_button = this.element.querySelector("div[name='add_player_extra']");
            const extras_edit = this.element.querySelectorAll ("button[name='edit_extra']");
            const extras_delete = this.element.querySelectorAll("button[name='delete_extra']");

            const gm_notes = this.element.querySelector(`i[id="${this.document.id}_toggle_gm_notes"]`);
            gm_notes?.addEventListener("click", async event => {
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
                    document.getElementById(`${id}_rich`)?.addEventListener("click", event => {
                    document.getElementById(`${id}_rich`).style.display = "none";
                    document.getElementById(`${id}`).style.display = "block";
                    document.getElementById(`${id}`).focus();
                })
                
                document.getElementById(`${id}`)?.addEventListener('blur', async event => {
                    if (!window.getSelection().toString()){
                        let desc = DOMPurify.sanitize(await TextEditor.enrichHTML(event.target.innerHTML, {secrets:this.object.isOwner, documents:true, async:true}))                            ;
                        document.getElementById(`${id}`).style.display = "none";
                        document.getElementById(`${id}_rich`).innerHTML = desc;    
                        document.getElementById(`${id}_rich`).style.display = "block";
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

                document.getElementById(`${id}_rich`)?.addEventListener("click", event => {
                    if (event.target.outerHTML.startsWith("<a data")) return;
                    document.getElementById(`${id}_rich`).style.display = "none";
                    document.getElementById(`${id}`).style.display = "block";
                    document.getElementById(`${id}`).focus();
                })
                
                document.getElementById(`${id}`)?.addEventListener('blur', async event => {
                    if (!window.getSelection().toString()){
                        let desc = DOMPurify.sanitize(await TextEditor.enrichHTML(event.target.innerHTML, {secrets:this.object.isOwner, documents:true, async:true}))                            ;
                        document.getElementById(`${id}`).style.display = "none";
                        document.getElementById(`${id}_rich`).innerHTML = desc;    
                        document.getElementById(`${id}_rich`).style.display = "block";
                    }
                })
            }

            extras_button?.addEventListener("click", event => this._on_extras_click(event));
            extras_edit.forEach(element => element.addEventListener("click", event => this._on_extras_edit_click(event)));
            extras_delete.forEach(element => element.addEventListener("click", event => this._on_extras_delete(event)));

            const tracks_block = this.element.querySelector("div[name='tracks_block']");
            const stunts_block = this.element.querySelector("div[name='stunts_block']");

            stunts_button?.addEventListener("click", event => this._onStunts_click(event));
            tracks_button?.addEventListener("click", event => this._onTracks_click(event));

            const bio = this.element.querySelector(`div[id='${this.object.id}_biography']`)
            fcoConstants.getPen(`${this.object.id}_biography`);

            const showyBio = this.element.querySelector(`div[id='${this.document.id}_biography_rich']`)
            showyBio?.addEventListener('click', async event => {
                if (event.target.outerHTML.startsWith("<a data")) return;
                this.editing = true;
                document.getElementById(`${this.object.id}_biography_rich`).style.display = "none";
                document.getElementById(`${this.object.id}_biography`).style.display = "block"
                document.getElementById(`${this.object.id}_biography`).focus();
            })

            showyBio?.addEventListener('contextmenu', async event => {
                let text = await fcoConstants.updateText("Edit raw HTML",event.currentTarget.innerHTML);
                if (text != "discarded") {
                    this.editing = false;
                    await this.object.update({"system.details.biography.value":text});
                }
            })

            const showyDesc = this.element.querySelector(`div[id='${this.document.id}_description_rich']`)
            showyDesc?.addEventListener('click', async event => {
                if (event.target.outerHTML.startsWith("<a data")) return;
                this.editing = true;
                console.log(document.getElementById(`${this.object.id}_description_rich`))
                document.getElementById(`${this.object.id}_description_rich`).style.display = "none"
                document.getElementById(`${this.object.id}_description`).style.display = "block";
                document.getElementById(`${this.object.id}_description`).focus();
            })

            showyDesc?.addEventListener('contextmenu', async event => {
                let text = await fcoConstants.updateText("Edit raw HTML",event.currentTarget.innerHTML);
                if (text != "discarded") {
                    this.editing = false;
                    await this.object.update({"system.details.description.value":text});
                }
            })

            const showyNotes = this.element.querySelector(`div[id='${this.document.id}_notes_rich']`)
            showyNotes?.addEventListener('click', async event => {
                if (event.target.outerHTML.startsWith("<a data")) return;
                this.editing = true;
                document.getElementById(`${this.object.id}_notes_rich`).style.display = "none";
                document.getElementById(`${this.object.id}_notes`).style.display = "block";
                document.getElementById(`${this.object.id}_notes`).focus();
            })

            showyNotes?.addEventListener('contextmenu', async event => {
                let text = await fcoConstants.updateText("Edit raw HTML",event.currentTarget.innerHTML);
                if (text != "discarded") {
                    this.editing = false;
                    await this.object.update({"system.details.notes.value":text});
                }
            })

            const notes = this.element.querySelector (`div[id='${this.object.id}_notes']`);
            fcoConstants.getPen(`${this.object.id}_notes`);

            const desc = this.element.querySelector(`div[id='${this.object.id}_description']`)
            fcoConstants.getPen(`${this.object.id}_description`);
            bio?.addEventListener("blur", event => this._onBioFocusOut(event));
            desc?.addEventListener("blur", event => this._onDescFocusOut(event));
            notes?.addEventListener("blur", event => this._onNotesFocusOut(event));

            const stunt_macro = this.element.querySelectorAll("button[name='stunt_macro']");
            stunt_macro.forEach(element => {
                element.addEventListener("click", event => this._on_stunt_macro_click(event));
                element.addEventListener("contextmenu", event => this._on_stunt_macro_contextmenu(event));
            });
            
            const stunt_roll = this.element.querySelectorAll("button[name='stunt_name']");
            stunt_roll.forEach(element => element.addEventListener("click", event => this._on_stunt_roll_click(event)));

            const stunt_db = this.element.querySelector("div[name='stunt_db']");
            stunt_db?.addEventListener("click", event => this._stunt_db_click(event));

            const db_add = this.element.querySelectorAll("button[name='db_stunt']");
            db_add.forEach(element => element.addEventListener("click", event => this._db_add_click(event)));

            const cat_select = this.element.querySelector("select[id='track_category']");
            cat_select?.addEventListener("change", event => this._cat_select_change (event));

            const item = this.element.querySelectorAll("div[class='item_header']");
            item.forEach(element => {
                element.addEventListener("dragstart", event => this._on_item_drag (event));
                element?.addEventListener("dblclick", async event => {
                    let content = `<strong>${game.i18n.format("fate-core-official.sharedFrom",{name:this.object.name})}</strong><br/><hr>`
                    let user = game.user;
                    let item = await fromUuid(event.currentTarget.getAttribute("data-item"));
                    item = foundry.utils.duplicate(item);
                    let activeIndicator = `<i class="fas fa-toggle-off"></i>`;
                    if (item.system.active) activeIndicator = `<i icon class="fas fa-toggle-on"></i>`;
                    
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
                    content += `<strong>${activeIndicator}</strong><br/>`;

                    ChatMessage.create({content: content, speaker : {user}, type: CONST.CHAT_MESSAGE_STYLES.OOC })
                })
            });

            const mfdraggable = this.element.querySelectorAll('.mf_draggable');
            mfdraggable.forEach(element => {
                element.addEventListener("dragstart", event => {
                    if (game.user.isGM){
                        let ident = "mf_draggable"
                        let type = event.target.getAttribute("data-mfdtype");
                        let origin = event.target.getAttribute("data-mfactorid");
                        let dragged_name = event.target.getAttribute("data-mfname");
                        
                        let shift_down = game.system["fco-shifted"];    

                        let dragged;
                        if (type == "skill") dragged = fcoConstants.gbn(this.actor.system.skills, dragged_name);
                        if (type == "stunt") dragged = fcoConstants.gbn(this.actor.system.stunts, dragged_name);
                        if (type == "aspect") dragged = fcoConstants.gbn(this.actor.system.aspects, dragged_name);
                        if (type == "track") dragged = fcoConstants.gbn(this.actor.system.tracks, dragged_name)
                        let user = game.user.id;
                        let drag_data = {ident:ident, userid:user, type:type, origin:origin, dragged:dragged, shift_down:shift_down};
                        event.dataTransfer.setData("text/plain", JSON.stringify(drag_data));
                    }
                });
                element.addEventListener("dblclick", event => {
                    let origin = event.target.getAttribute("data-mfactorid");
                    let content = `<strong>${game.i18n.format("fate-core-official.sharedFrom",{name:this.object.name})}</strong><br/><hr>`
                    let user = game.user;
                    let type = event.target.getAttribute("data-mfdtype");
                    
                    let name = event.target.getAttribute("data-mfname");
                    let entity;
                    if (type == "skill") {
                        entity = fcoConstants.gbn(this.actor.system.skills, name);
                        content += `<strong>${game.i18n.localize("fate-core-official.Name")}: </strong> ${entity.name}<br/>
                                    <strong>${game.i18n.localize("fate-core-official.Rank")}: </strong> ${entity.rank}<br/>
                                    <strong>${game.i18n.localize("fate-core-official.Description")}: </strong> ${entity.description}</br>`
                    }
                    if (type == "stunt") {
                        entity = fcoConstants.gbn(this.actor.system.stunts, name);
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
                        entity = fcoConstants.gbn(this.actor.system.aspects, name);
                        content += `<strong>${game.i18n.localize("fate-core-official.Name")}: </strong> ${entity.name}<br/>
                                    <strong>${game.i18n.localize("fate-core-official.Value")}: </strong> ${entity.value}<br/>
                                    <strong>${game.i18n.localize("fate-core-official.Description")}: </strong> ${entity.description}</br>
                                    <strong>${game.i18n.localize("fate-core-official.Notes")}: </strong> ${entity.notes}`
                    } 
                    if (type == "track") {
                        entity = fcoConstants.gbn(this.actor.system.tracks, name);
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
    
                    ChatMessage.create({content: content, speaker : {user}, type: CONST.CHAT_MESSAGE_STYLES.OOC })
                })
            })

            const input = this.element.querySelectorAll('input[type="text"], input[type="number"], textarea');

            const extra_active = this.element.querySelectorAll('button[name = "extra_active"]');
            extra_active.forEach(element => element.addEventListener("click", async event => {
                let item_id = event.target.id.split("_")[0];
                let item = this.document.items.get(item_id);
                if (item.system.active){
                    await item.update({"system.active":false},{renderSheet:false, noHook:true});
                    await this.document.deactivateExtra(item, false);
                    this.render(false);
                } else {
                    await item.update({"system.active":true},{renderSheet:false, noHook:true});
                    this.document.updateFromExtra(item);
                    this.render(false);
                }
            }));

            const saveDefault = this.element.querySelector("button[name='saveDefault']");
            saveDefault?.addEventListener("click", async event => {
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
                    let d = new foundry.applications.api.DialogV2({
                    window:{title: game.i18n.localize("fate-core-official.pickADefaultName")},
                    content: content,
                    buttons: [{
                        action:"ok",
                        label:"OK",
                        callback: async (event, button, dialog) => {
                            let name = document.getElementById(`${this.document.id}_choose_default_name`).value;
                            let desc = document.getElementById(`${this.document.id}_choose_default_description`).value;
                            if (!name) name = this.document.name;
                            let f = new FateCharacterDefaults();
                            let options = {
                                            keep_skills:dialog.querySelector(`#${this.document.id}_keep_skills`).checked,
                                            keep_aspects:dialog.querySelector(`#${this.document.id}_keep_aspects`).checked
                            }
                            let def = await f.extractDefault(this.document, name, desc, options);
                            def.options = options;
                            await f.storeDefault(def);
                            ui.sidebar.render(false);
                        }
                        
                    }],
                    default: "ok"
                }).render(true);
            })

            const changeSheetMode = this.element.querySelector("button[name='changeSheetMode']");
            changeSheetMode?.addEventListener('click', async event => {
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
                await this.render(false);
            })

            const applyDefault = this.element.querySelector("button[name='applyDefault']");
            applyDefault?.addEventListener("click", async event => {
                let f = new FateCharacterDefaults();
                let options = f.defaults.map(d => `<option>${d}</option>`).join("\n");
                let content = `
                <h3>${game.i18n.localize("fate-core-official.applyDefault")}</h3>
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
                let d = new foundry.applications.api.DialogV2({
                    window:{title: game.i18n.localize("fate-core-official.applyDefaultOptions")},
                    content: content,
                    buttons: [{
                        action:"ok",
                        label:"OK",
                        callback: async (event, button, dialog) => {                                
                            let avatar = dialog.querySelector(`#${this.document.id}_def_avatar`).classList.contains('fa-toggle-on');
                            let tracks = dialog.querySelector(`#${this.document.id}_def_tracks`).classList.contains('fa-toggle-on');
                            let stunts = dialog.querySelector(`#${this.document.id}_def_stunts`).classList.contains('fa-toggle-on');
                            let extras = dialog.querySelector(`#${this.document.id}_def_extras`).classList.contains('fa-toggle-on');
                            let skills = dialog.querySelector(`#${this.document.id}_def_skills`).classList.contains('fa-toggle-on');
                            let aspects = dialog.querySelector(`#${this.document.id}_def_aspects`).classList.contains('fa-toggle-on');
                            let merge = dialog.querySelector(`#${this.document.id}_def_overwrite`).classList.contains('fa-toggle-on');
                            let default_name = dialog.querySelector(`#${this.document.id}_select_default`).value;
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
                            if (proceed) {
                                await f.applyDefault(this.document, default_name, options);
                            }
                        }
                    }],
                    default: "ok"
                })
                await d.render(true);
            
                let toggles = document.querySelectorAll(`.def_toggle`);
                for (let toggle of toggles){
                    toggle?.addEventListener("click", event => {
                        event.target.classList.toggle("fa-toggle-on");
                        event.target.classList.toggle("fa-toggle-off");
                    })
                }
            })

            input.forEach(field => {
                field?.addEventListener("focus", event => {
                    if (this.editing == false) {
                        this.editing = true;
                    }
                });
                field?.addEventListener("blur", event => {
                    this.editing = false;
                    if (this.renderBanked){
                        this.renderBanked = false;
                        this.render(false);
                    }
                });
                field?.addEventListener("keyup", event => {
                    if (event.code === "Enter" && event.target.type == "input") {
                        field.blur();
                    }
                })
            });
        }
    }

    async _onSkillR(event){
        let name = event.target.id;
        let skill = fcoConstants.gbn(this.actor.system.skills, name);
        fcoConstants.presentSkill(skill);
    }

    async _on_item_drag (event){
        let item = await fromUuid(event.currentTarget.getAttribute("data-item"));
        if (item?.parent){
            // Store the status of stress tracks on the parent back to the extra if this extra is being dragged from a character.
            let trackUpdates = foundry.utils.duplicate(item.system.tracks); // Trackupdates is the item tracks
            let tracks = item?.parent?.system?.tracks; // Tracks is the actor tracks

            for (let t in trackUpdates){
                // Need to grab the original name from the ACTOR, not from the extra. So we need to reverse the order of operations here
                // to search through the actor's tracks to find one with an original name that matches this track.
                let extraTrack = trackUpdates[t];
                for (let at in tracks){
                    let actorTrack = tracks[at];
                    let name = actorTrack?.original_name;
                    
                    if (name == extraTrack.name && actorTrack?.extra_id == item.id){
                        let track = foundry.utils.duplicate(actorTrack);
                        track.name = name;
                        delete track.extra_id;
                        delete track.original_name;
                        trackUpdates[fcoConstants.tob64(name)] = track;
                    }
                }
            }
            let stuntUpdates = foundry.utils.duplicate(item.system.stunts);
            let stunts = item?.parent?.system?.stunts;

            for (let s in stuntUpdates){
                let extraStunt = stuntUpdates[s];
                for (let as in stunts){
                    let actorStunt = stunts[as];
                    let name = actorStunt.original_name;
                    if (name == extraStunt.name && actorStunt?.extra_id == item.id){
                        let stunt = foundry.utils.duplicate(actorStunt);
                        stunt.name = name;
                        delete stunt.extra_id;
                        delete stunt.original_name;
                        stuntUpdates[fcoConstants.tob64(name)] = stunt;
                    }
                }
            }
            // If we await this next update it causes an issue with the data below not being populated if the track is being
            // dragged from an actor.
           await item.update({"type":"Extra", "system.tracks":trackUpdates, "system.stunts":stuntUpdates},{renderSheet:false});
            let data = {
                "type":"Item", 
                "uuid":item.uuid
            }
            await event.dataTransfer.setData("text/plain", JSON.stringify(data));
        } else {
            let data = {
                "type":"Item", 
                "uuid":item.uuid
            }
            await event.dataTransfer.setData("text/plain", JSON.stringify(data));
        }
    }

    async _cat_select_change (event){
        this.track_category = event.target.value;
        this.render(false);
    }

    async _db_add_click(event){
        let name = event.target.id.split("_")[0];
        let key = fcoConstants.gkfn(this.object.system.stunts, name);
        let stunt = this.object.system.stunts[key];
        if (stunt) {
            await fcoConstants.wd().update({"system.stunts":{[`${key}`]:stunt}});
            ui.notifications.info(game.i18n.localize("fate-core-official.Added")+" "+name+" "+game.i18n.localize("fate-core-official.ToTheStuntDatabase"));
            await foundry.applications.instances.get("StuntDB")?.render();
        }
    }

    async _stunt_db_click(event){
        let sd = new StuntDB(this.actor);
        sd.render(true)
        try {
            sd.bringToFront();
        } catch  {
            // Do nothing.
        }
    }
    
    async _on_stunt_roll_click(event){
        let items = event.target.id.split("_");
        let name = items[0];
        this.object.rollStunt(name);
    }

    async _on_stunt_macro_click(event){
        let stunt = this.object.system.stunts[event.target.getAttribute("data-stunt")];
        let macrouuid = stunt.macro;
        let macro = await fromUuid(macrouuid);
        await macro.execute({actor:this.object.actor});
    }

    async _on_stunt_macro_contextmenu(event){
        let stunt = this.object.system.stunts[event.target.getAttribute("data-stunt")];
        let macrouuid = stunt.macro;
        let macro = await fromUuid(macrouuid);
        await macro.sheet.render(true);
    }

    async _onBioFocusOut (event){
        if (!window.getSelection().toString()){
            let bio = DOMPurify.sanitize(event.target.innerHTML);
            await this.object.update({"system.details.biography.value":bio})
            document.getElementById(`${this.object.id}_biography`).style.display = "none";
            document.getElementById(`${this.object.id}_biography_rich`).style.display = "block"
            this.editing = false;
            await this.render(false);
        }
    }

    async _onNotesFocusOut (event){
        if (!window.getSelection().toString()){
            let notes = DOMPurify.sanitize(event.target.innerHTML);
            await this.object.update({"system.details.notes.value":notes})
           document.getElementById(`${this.object.id}_notes`).style.display = "none";
           document.getElementById(`${this.object.id}_notes_rich`).style.display = "block";
            this.editing = false;
            await this.render(false);
        }
    }

    // This is required in order to ensure we update the data for track notes when changed.
    async updateNotes (event){
        if (!window.getSelection().toString()){
            let text = DOMPurify.sanitize(event.target.innerHTML);            
            let item = event.target.getAttribute("data-edit");
            //This is a much better way of accessing data than splitting the id.
            await this.actor.update({[item]:text});
            this.editing = false;
            await this.render(false)
        }
    }

    async updateNotesHTML (event){ //This is the method that updates the notes for tracks/aspects when the raw HTML is edited.
        let text = await fcoConstants.updateText("Edit raw HTML",event.currentTarget.innerHTML);
        if (text != "discarded") {
            this.editing = false;
            let item = event.currentTarget.getAttribute("data-edit");//This is a much better way of accessing data than splitting the id.
            await this.actor.update({[item]:text});
            this.editing = false;
            await this.render(false)
        }
    }
    
    async _onDescFocusOut (event){
        if (!window.getSelection().toString()){
            let desc = DOMPurify.sanitize(event.target.innerHTML);
            await this.object.update({"system.details.description.value":desc});
           document.getElementById(`${this.object.id}_description`).style.display = "none"
           document.getElementById(`${this.object.id}_description_rich`).style.display = "block"
            this.editing = false;
            await this.render(false);
        }
    }

    async render(...args){
        if (!this.object?.parent?.sheet?.editing && !this.editing && !window.getSelection().toString()){
            if (!this.renderPending) {
                    this.renderPending = true;
                    setTimeout(async () => {
                        await super.render(...args);
                        this.renderPending = false;
                    }, 50);
            }
        } else this.renderBanked = true;
    }

    async _on_extras_click(event){
        const data = {
            "name": game.i18n.localize("New Extra"),
            "type": "Extra"
        };
        const created = await this.document.createEmbeddedDocuments("Item", [data]);
    }
    async _on_extras_edit_click(event){
        let items = this.object.items;
        let item = items.get(event.target.id.split("_")[0]);
        item.sheet.render(true);
    }    

    async _on_extras_delete(event){
        let del = await fcoConstants.confirmDeletion();
        if (del){
            await this.actor.deleteEmbeddedDocuments("Item",[event.target.id.split("_")[0]]);
        }
    }

    async _onDelete(event){
        let del = await fcoConstants.confirmDeletion();
        if (del){
            let key = fcoConstants.gkfn(this.object.system.stunts, event.target.id.split("_")[0]);
            await this.object.update({"system.stunts":{[`-=${key}`]:null}});
        }
    }

    async _onEdit (event){
        let name=event.target.id.split("_")[0];
        let editor = new EditPlayerStunts(this.actor, fcoConstants.gbn(this.object.system.stunts, name), {new:false});
        editor.render(true);
        editor.setSheet(this);
        try {
            editor.bringToFront();
        } catch  {
            // Do nothing.
        }
    }

    async _on_click_box(event) {
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
        let tracks = foundry.utils.duplicate(this.object.system.tracks);
        let track = fcoConstants.gbn(tracks, name);
        let key = fcoConstants.gkfn (tracks, name);
        track.box_values[index] = checked;
        await this.object.update({
            // By using this format for the update we can drill right down to the box_values array and avoid updating anything else.
            ["system.tracks"]:{[key]:{["box_values"]:track.box_values}}
        })
    }

    async _on_click_stunt_box(event){
        let name = event.target.getAttribute("data-stunt");
        let index = event.target.getAttribute("data-index");
        let checked = event.target.checked;

        let stunts = foundry.utils.duplicate(this.object.system.stunts);
        let stunt = fcoConstants.gbn(stunts, name);
        stunt.box_values[index] = checked;
        await this.object.update({["system.stunts"]:stunts});
    }

    async _onStunts_click(event) {
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
            editor.bringToFront();
        } catch  {
            // Do nothing.
        }
    }
    async _onTracks_click(event) {
        //Launch the EditPlayerTracks FormApplication.
        let editor = new EditPlayerTracks(this.actor); //Passing the actor works SOO much easier.
        editor.render(true);
        editor.setSheet(this);
        try {
            editor.bringToFront();
        } catch  {
            // Do nothing.
        }
    }

       async _onAspectClick(event) {
        if (game.user.isGM) {
            let av = new EditPlayerAspects(this.actor);
            av.render(true);
            try {
                av.bringToFront();
            } catch  {
                // Do nothing.
            }
        }
    }
    async _onSkillsButton(event) {
        //Launch the EditPlayerSkills FormApplication.
        let editor = new EditPlayerSkills(this.actor); //Passing the actor works SOO much easier.
        editor.render(true);
        editor.setSheet(this);
        try {
            editor.bringToFront();
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
            editor.bringToFront();
        } catch  {
            // Do nothing.
        }
    }

    async _onSkill_name(event) {
        let target = this.object;
            if (event.detail > 1){
                this.clickPending = true;
                return;
            }
            if (event.detail == 1){
            setTimeout(async () => {
                if (this.clickPending) {
                    this.clickPending = false;
                    return;
                } else {
                    let umr = false;
                    if (game.system["fco-shifted"] && !game.settings.get("fate-core-official","modifiedRollDefault")) umr = true;              
                    if (!game.system["fco-shifted"] && game.settings.get("fate-core-official","modifiedRollDefault")) umr = true;        
                
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

   get minimal () {
        let mode = "full"
        if (this.actor.system.details.sheet_mode == "minimal") mode = "minimal";
        if (this.actor.system.details.sheet_mode == "minimal_at_refresh_0" && this.actor.system.details.fatePoints.refresh == 0) mode = "minimal";
        return mode;
    }

    async _prepareContext(options) {

        let origin = await super._prepareContext (options);
        const sheetData = foundry.utils.duplicate(origin.source);

        if (game.user.expanded == undefined){
                game.user.expanded = {};
        }

        if (game.user.expanded[this.actor.id+"_biography"] == undefined) game.user.expanded[this.actor.id+"_biography"] = true;
        if (game.user.expanded[this.actor.id+"_description"] == undefined) game.user.expanded[this.actor.id+"_description"] = true;
        if (game.user.expanded[this.actor.id+"_extras"] == undefined) game.user.expanded[this.actor.id+"_extras"] = true;
       
        sheetData.document = this.document;
        sheetData.actor = this.actor;
        sheetData.owner = this.document.isOwner;

        sheetData.system.displayStunts = foundry.utils.duplicate(sheetData.system.stunts);

        // Set the initial sort order for skills and stunts according to the user's preferences (defaulted to sorting by name for skills and not sorted for stunts)
        if (this.sortByRank == undefined) this.sortByRank = game.settings.get("fate-core-official","sortSkills");
        if (this.sortStunts == undefined) this.sortStunts = game.settings.get("fate-core-official","sortStunts");

        if (this.sortStunts) sheetData.system.displayStunts = fcoConstants.sortByName(sheetData.system.displayStunts);

        // Determine sheet view mode:
        // return minimal or full depending on:
        // data.data.details.sheet_mode is set to minimal
        // data.data.details.sheet_mode is set to minimal_at_refresh_0 and data.data.details.fatePoints.refresh is currently 0.
        // Otherwise, return full.

        sheetData.sheetMode = this.minimal;

        // In addition to the below declaration for tabs, the Nav block must have the 'tabs' class
        // Each tab must have a data-group attribute for the tab group that matches the ones here
        // Each nav must have a data-action="tab" attribute
        // Each tab div must have the data-group attribute as well as the tab class.
        // We must also get the cssClass attribute defined in getTabs in _prepareContext.

        sheetData.tabGroups = this.tabGroups;
        sheetData.tabs = this.getTabs();

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
        let tracks = sheetData.system.tracks; // Removed foundry.utils.duplicate() here as we don't write to the tracks data, just read from it.
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
            
            if (sheetData.system?.override?.active){
                if (sheetData.system?.override?.refresh) worldRefresh = sheetData.system?.override?.refresh
            }
            
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
        let presentation_skills = foundry.utils.duplicate(unordered_skills);
        if(this.sortByRank) {
            presentation_skills = fcoConstants.sortByRank(unordered_skills);
        }
        if (this.sortByName){
            presentation_skills = fcoConstants.sortByName(unordered_skills);
        }
        sheetData.presentation_skills = presentation_skills;
        
        sheetData.gameRefresh = game.settings.get("fate-core-official", "refreshTotal");

        let skillTotal = 0;
        // Exclude skills on extras which are not set to countMe/countSkills
        for (let s in unordered_skills) {
            skillTotal += unordered_skills[s].rank;
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
        let fcoc = new fcoConstants();
        sheetData.ladder = fcoc.getFateLadder();
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
        let exs = foundry.utils.duplicate(this.actor.items.contents);
        for (let ex of items){
            ex.richName = await fcoConstants.fcoEnrich(ex.name);
            ex.richDesc = await fcoConstants.fcoEnrich(ex.system.description.value);
        }
        return sheetData;
    }
}

Hooks.on ('dropActorSheetData', async (actor, sheet, data) => {
    console.log("Drop actorsheet hook fired!");
    if (game.user == game.users.find(e => e.isGM && e.active) || game.user.id === data.userid){
        //First check it's not from the same sheet
        if (data?.ident !== "mf_draggable") return;
        if (actor.id == data.origin) return;
        delete data.dragged?.extra_id;
        delete data.dragged?.original_name;
        if (data.type == "stunt"){
            let old = fcoConstants.gbn(actor.system.stunts, data.dragged.name);
            if (old) {
                let answer = await fcoConstants.awaitYesNoDialog(game.i18n.localize("fate-core-official.overwrite_element"), game.i18n.localize("fate-core-official.exists"));
                if (!answer) return
            } 
            await actor.update({"system.stunts":{[fcoConstants.tob64(data.dragged.name)]:data.dragged}});
        }
        if (data.type == "aspect"){
            let old = fcoConstants.gbn(actor.system.aspects, data.dragged.name);
            if (old) {
                let answer = await fcoConstants.awaitYesNoDialog(game.i18n.localize("fate-core-official.overwrite_element"), game.i18n.localize("fate-core-official.exists"));
                if (!answer) return
            } 
            if (!data.shift_down){
                data.dragged.value = "";
                data.dragged.notes = "";
            }
            await actor.update({"system.aspects":{[fcoConstants.tob64(data.dragged.name)]:data.dragged}});
        }
        if (data.type == "skill"){
            let old = fcoConstants.gbn(actor.system.skills, data.dragged.name);
            if (old) {
                let answer = await fcoConstants.awaitYesNoDialog(game.i18n.localize("fate-core-official.overwrite_element"), game.i18n.localize("fate-core-official.exists"));
                if (!answer) return
            } 
            if (!data.shift_down){
                data.dragged.rank = 0;
            }
            await actor.update({"system.skills":{[fcoConstants.tob64(data.dragged.name)]:data.dragged}});
        }
        if (data.type == "track"){
            let track = data.dragged;
            if (!data.shift_down){
                if (track?.aspect && track?.aspect !== "No" && track?.aspect != "Name As Aspect" && track?.aspect != "Aspect as Name" && track?.aspect !== game.i18n.localize("fate-core-official.No") && track?.aspect != game.i18n.localize("fate-core-official.AspectAsName") && track?.aspect != game.i18n.localize("fate-core-official.NameAsAspect")){
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
            let old = fcoConstants.gbn(actor.system.tracks, track.name);
            if (old) {
                let answer = await fcoConstants.awaitYesNoDialog(game.i18n.localize("fate-core-official.overwrite_element"), game.i18n.localize("fate-core-official.exists"));
                if (!answer) return
            } 
            await actor.update({"system.tracks":{[fcoConstants.tob64(track.name)]:track}});
        }
    }
})
