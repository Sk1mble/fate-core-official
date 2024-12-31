class FateUtilities extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2){
    constructor(){
        super();
        game.system.apps["actor"].push(this);
        game.system.apps["combat"].push(this);
        game.system.apps["scene"].push(this); //Maybe? If we want to store scene notes, aspects, etc.
        game.system.apps["user"].push(this);
        this.category="All";
        this.editing = false;
        if (game.system.tokenAvatar == undefined){
            game.system.tokenAvatar = true;
        }
    }

    getTabs () {
        let tabGroup = "fuApp";
        if (!this.tabGroups[tabGroup]) this.tabGroups[tabGroup] = 'aspects';
        let tabs = {
            aspects:{
                id:"aspects",
                group:"fuApp",
            },
            tracks:{
                id:"tracks",
                group: "fuApp",
            },
            scene:{
                id:"scene",
                group:"fuApp",
            },
            rolls: {
                id: "rolls",
                group:"fuApp"
            },
            game_info: {
                id:"game_info",
                group: "fuApp",
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

    get title(){
        return game.i18n.localize("fate-core-official.FateUtilities");
    }

    static DEFAULT_OPTIONS = {
        id:"FateUtilities",
        tag: "div",
        classes: ['fate', 'fu'],
        window: {
            title: this.title,
            icon: "fas fa-book-open",
            resizable: true,
        },
        position:{
            width: window.innerWidth*0.5,
            height: window.innerHeight*0.9,            
        }
    }

    static PARTS = {
        fateUtilitiesSheet: {
            template: "systems/fate-core-official/templates/FateUtilities.html",
            scrollable: ["#aspects", "#cd_panel", "#fu_game_info_tab", "#fu_aspects_tab","#fu_tracks_tab", "#fu_scene_tab", "#fu_scene_pane", "#fu_rolls_tab", "#fu_conflict_tracker", "#fu_aspects_pane", ".fco_prose_mirror.fu_scene_notes", "fco_ro_rich.fu_scene_notes", "#fu_aspects_pane", "#fu_scene_notes_pane",".fco_scrollable", ".long_text_rich.fco_scrollable"],
        }
    }

    async _onPosition(position){
        if (!this.currentWidth) this.currentWidth = position.width;
        if (!this.currentHeight) this.currentHeight = position.height;
        
        let resized = false;
        
        if (this.currentHeight != position.height) resized = true;
        if (this.currentWidth != position.width) resized = true;

        super._onPosition(position);
        if (resized){
            this.currentWidth = position.width;
            this.currentHeight = position.height; 
            await this.render(false);
        }
    }

    async close(options){
        game.system.apps["actor"].splice(game.system.apps["actor"].indexOf(this),1); 
        game.system.apps["combat"].splice(game.system.apps["combat"].indexOf(this),1); 
        game.system.apps["scene"].splice(game.system.apps["scene"].indexOf(this),1); 
        game.system.apps["user"].splice(game.system.apps["user"].indexOf(this),1); 
        await super.close(options);
    }

    async _onRender (context, options) {
        if (game.user.isGM){
            const countdowns_rich = this.element.querySelectorAll('.fco_prose_mirror.fu_cd');
            countdowns_rich.forEach(countdown => {
                    countdown?.addEventListener('change', async event => {
                        let name = event.target.dataset.name;
                        let field = event.target.dataset.field;
                        if (field == "name"){
                            this.editing = false;
                            let countdowns = game.settings.get("fate-core-official", "countdowns");
                            let countdown = countdowns[fcoConstants.getKey(name)];
                            if (countdown.name != event.target.value){
                                let oldname = countdown.name;
                                let newname = event.target.value;
                                let testname = newname.replace(/<[^>]+>/g, '');
                                if (testname == ""){
                                    event.target.value = oldname;
                                    await this.render(false);
                                    return ui.notifications.error(game.i18n.localize("fate-core-official.empty"));
                                }
                                let newCountdown = foundry.utils.duplicate(countdown);
                                newCountdown.name = newname;
                                delete countdowns[fcoConstants.getKey(countdown.name)];
                                countdowns[fcoConstants.getKey(newname)]=newCountdown;
                                await game.settings.set("fate-core-official","countdowns", countdowns);
                                await game.socket.emit("system.fate-core-official",{"render":true});
                            }
                         }
                         if (field == "description"){
                            this.editing = false;
                            let countdowns = game.settings.get("fate-core-official", "countdowns");
                            let countdown = countdowns[fcoConstants.getKey(name)];
                            countdown.description = event.target.value
                            await game.settings.set("fate-core-official", "countdowns", countdowns);
                            await game.socket.emit("system.fate-core-official",{"render":true});
                        }
                        await this.render(false);
                    });
            })

            const roll_track = this.element.querySelectorAll("i[name='roll_track']");

            roll_track.forEach(track => track?.addEventListener("click", async event => {
                let name = event.target.dataset.trackname;
                let uuid = event.currentTarget.getAttribute("data-uuid");
                let actor = await fromUuid(uuid);

                if (actor instanceof TokenDocument) {
                    actor = actor.actor;
                }

                let track = fcoConstants.gbn(actor.system.tracks, name);

                if (track.rollable == "full" || track.rollable == "empty") {
                    let umr = false;
                    if (game.system["fco-shifted"] && !game.settings.get("fate-core-official","modifiedRollDefault")) umr = true;
                    if (!game.system["fco-shifted"] && game.settings.get("fate-core-official","modifiedRollDefault")) umr = true;
                    if (!umr) await actor.rollTrack(track.name);
                    if (umr) await actor.rollModifiedTrack(track.name);
                }
            }))

            const pinConflict = this.element.querySelector('.fco-pin-conflict');
            pinConflict?.addEventListener('click', async event => {
                let pinned = game.combat.scene;
                if (!pinned) await game.combat.update({scene:game.scenes.viewed.id});
                if (pinned) await game.combat.update({scene:null});
            })

            const id_conflict = this.element.querySelector('input[id="fu_conflict_name_input"]');
            id_conflict?.addEventListener("change", async event => {
                let new_name = event.currentTarget.value;
                await game.combat.setFlag("fate-core-official","name",new_name);
            });

            const game_notes_rich = this.element.querySelector('.fco_prose_mirror.fu_game_notes');
            game_notes_rich?.addEventListener('change', async event => {
                await game.settings.set("fate-core-official", "gameNotes", event.target.value);
                await game.socket.emit("system.fate-core-official", {"render":true});
                this.editing = false;
                await this.render(false)
            })

            const scene_notes_rich = this.element.querySelector('.fco_prose_mirror.fu_scene_notes');
            scene_notes_rich?.addEventListener('change', async event => {
                await game.scenes.viewed.setFlag("fate-core-official","sceneNotes",event.target.value);
                await game.socket.emit("system.fate-core-official",{"render":true});
                this.editing = false;
                await this.render(false);
            })

            const game_date_time_rich = this.element.querySelector(".fco_prose_mirror.fu_date_time_notes");
            game_date_time_rich?.addEventListener('change', async event => {
                    await game.settings.set("fate-core-official", "gameTime", event.target.value);
                    await game.socket.emit("system.fate-core-official",{"render":true});
                    this.editing = false;
                    await this.render(false);
            })
        }
        const cd_del = this.element.querySelectorAll('button[name="delete_cd"]');
        cd_del.forEach(cdbutton => cdbutton?.addEventListener('click', event => this._on_delete_cd(event)));

        const toggle_cd_visibility = this.element.querySelectorAll('button[name="toggle_cd_visibility"]');
        toggle_cd_visibility.forEach(cdbutton => cdbutton?.addEventListener('click', event => this._on_toggle_cd_visibility(event)));

        const addConflict = this.element.querySelector('button[id="fco_add_conflict"]');
        addConflict?.addEventListener("click", async (event) => {
            let cbt = await Combat.create({scene: game.scenes.viewed.id});
            await cbt.activate();
            ui.combat.initialize({cbt});
        })

        const nextConflict = this.element.querySelector('button[id="fco_next_conflict"]');
        nextConflict?.addEventListener("click", async (event) => {
            let combats = game.combats.contents.filter(c => c.scene?.id == game.scenes.viewed.id);
            let unpinnedCombats = game.combats.contents.filter (c => c.scene == null);
            combats = combats.concat(unpinnedCombats);
            let combat = game.combats.viewed;
            let index = combats.indexOf(combat);
            index ++;
            if (index >= combats.length) index = 0;
            let nextCombat = combats[index];
            await nextCombat.activate();
            ui.combat.initialize({nextCombat});
        })

        const input = this.element.querySelectorAll('input[type="text"], input[type="number"], .contenteditable');
        
        //Ensure that if a button is tabbed to or clicked, the window's selection is cleared to prevent any rendering issues.
        const button = this.element.querySelectorAll('button[type="button"]');
        button.forEach(button => button. addEventListener("focus", event => {
            window.getSelection().removeAllRanges();
        }))

        input?.forEach(input => input.addEventListener("keyup", event => {
            if (event.code === "Enter" && event.target.type == "input") {
                input.blur();
            }
        }))

        input?.forEach(element => element.addEventListener("focus", event => {
            if (this.editing == false) {
                this.editing = true;
            }
        }));

       input?.forEach(element => element.addEventListener("blur", async event => {
           if (this.renderBanked){
                this.renderBanked = false;
                await this.render(false);
            }
            this.editing = false;
        }));

        const fontDown = this.element.querySelector("button[id='fu_shrink_font']");
        const fontUp = this.element.querySelector("button[id='fu_grow_font']");

        fontUp?.addEventListener("click", async event => {
            let font = game.settings.get("fate-core-official","fuFontSize");
            font +=1;
            if (font > 20){
                font = 20;
                ui.notifications.info("")
            }
            await game.settings.set ("fate-core-official","fuFontSize",font);
            await this.render(false);
        })

        fontDown?.addEventListener("click", async event => {
            let font = game.settings.get("fate-core-official","fuFontSize");
            font -=1;
            if (font < 4){
                font = 4;
            }
            await game.settings.set ("fate-core-official","fuFontSize",font);
            await this.render(false);
        })

        const iseAspects = this.element.querySelectorAll("button[name='iseAspects']");
        iseAspects?.forEach(element => element.addEventListener("click", event => this.iseAspect(event)));

        const maximiseAspects = this.element.querySelector("button[id='fco_fu_maximiseAllAspects']");
        const minimiseAspects = this.element.querySelector("button[id='fco_fu_minimiseAllAspects']");

        maximiseAspects?.addEventListener("click", async event => {
            game.scenes.viewed.tokens.contents.forEach(token => token.aspectsMaximised = true);
            await this.render(false);
        })

        minimiseAspects?.addEventListener("click", async event => {
            game.scenes.viewed.tokens.contents.forEach(token => token.aspectsMaximised = false);
            await this.render(false);
        })

        const maximiseTracks = this.element.querySelector("button[id='fco_fu_maximiseAllTracks']");
        const minimiseTracks = this.element.querySelector("button[id='fco_fu_minimiseAllTracks']");

        maximiseTracks?.addEventListener("click", async event => {
            game.scenes.viewed.tokens.contents.forEach(token => token.tracksMaximised = true);
            await this.render(false);
        })

        minimiseTracks?.addEventListener("click", async event => {
            game.scenes.viewed.tokens.contents.forEach(token => token.tracksMaximised = false);
            await this.render(false);
        })

        const iseTracks = this.element.querySelectorAll("button[name='iseTracks']");
        iseTracks?.forEach(element => element.addEventListener("click", event => this.iseTrack(event)));

        const expandAspectNotes = this.element.querySelectorAll("div[name='FUexpandAspect']");
        expandAspectNotes?.forEach(element => element.addEventListener("click", async event => {
            let details = event.target.id.split("_");
            let token_id = details[0];
            let aspect = details[1];
            let token = game.scenes.viewed.getEmbeddedDocument("Token", token_id);
            let key = token.actor.id+aspect+"_aspect";
        
            if (game.user.expanded == undefined){
                game.user.expanded = {};
            }

            if (game.user.expanded[key] == undefined || game.user.expanded[key] == false){
                game.user.expanded[key] = true;
            } else {
                game.user.expanded[key] = false;
            }
            await this.render(false);
        }))

        const fu_combatants_toggle = document.querySelector("i[id='toggle_fu_combatants']");
        fu_combatants_toggle?.addEventListener("click", async (event) => {
            let toggle = game.settings.get("fate-core-official","fu_combatants_only");
            if (toggle) {
                await game.settings.set("fate-core-official","fu_combatants_only",false);
            } else {
                await game.settings.set("fate-core-official","fu_combatants_only",true);
            }
            await this.render(false);
        })

        const expandGameAspectNotes = this.element.querySelectorAll("button[name='FUexpandGameAspect']");
        expandGameAspectNotes?.forEach(element => element.addEventListener("click", async event => {
            let details = event.target.id.split("_");
            let aspect = details[1];
            let key = "game"+aspect;
        
            if (game.user.expanded == undefined){
                game.user.expanded = {};
            }

            if (game.user.expanded[key] == undefined || game.user.expanded[key] == false){
                game.user.expanded[key] = true;
            } else {
                game.user.expanded[key] = false;
            }
            await this.render(false);
        }))

        const FUGameAspectNotes = this.element.querySelectorAll(".fco_prose_mirror.fu_game_aspect_notes");
        FUGameAspectNotes?.forEach(element => element.addEventListener("change", event => {
            let aspectName = event.target.name;
            let aspects = foundry.utils.duplicate(game.settings.get("fate-core-official", "gameAspects"));
            let aspect = aspects.find(a => a.name == aspectName);
            aspect.notes = event.target.value;
            game.settings.set("fate-core-official","gameAspects",aspects);
            game.socket.emit("system.fate-core-official",{"render":true});
        }));

        const gameAspect = this.element.querySelectorAll("input[name='game_aspect']");
        gameAspect?.forEach(element => element.addEventListener("change", async (event) => {
            let index = event.target.id.split("_")[0];
            let aspects = foundry.utils.duplicate(game.settings.get("fate-core-official", "gameAspects")); // Should contain an aspect with the current name.
            let aspect = aspects[index];
            aspect.name = event.target.value;
            await game.settings.set("fate-core-official","gameAspects",aspects);
            await game.socket.emit("system.fate-core-official",{"render":true});
            await this.render(false);
        }))

        const expandTrackNotes = this.element.querySelectorAll("div[name='FUexpandTrack']");
        
        expandTrackNotes?.forEach(element => element.addEventListener("click", async event => {
            let details = event.target.id.split("_");
            let token_id = details[0];
            let track = event.target.getAttribute("data-name");
            let token = game.scenes.viewed.tokens.contents.find(t => t.id == token_id);
            let key = token.actor.id+track+"_track";
            if (game.user.expanded == undefined){
                game.user.expanded = {};
            }

            if (game.user.expanded[key] == undefined || game.user.expanded[key] == false){
                game.user.expanded[key] = true;
            } else {
                game.user.expanded[key] = false;
            }
            await this.render(false);
        }))

        const rollTab = this.element.querySelector("a[data-tab='rolls']");
        rollTab?.addEventListener("click", async event => {
            if (this.delayedRender){
                await this.render(false);
            }
        })

        const sceneTab = this.element.querySelector("a[data-tab='scene']");
        sceneTab?.addEventListener("click", async event => {
            if (this.delayedRender){
                await this.render(false);
            }
        })

        const gameInfoTab = this.element.querySelector("a[data-tab='game_info']");
        gameInfoTab?.addEventListener("click", async event => {
            if (this.delayedRender){
                await this.render(false);
            }
        })

        const tokenName = this.element.querySelectorAll("td[class='tName'], span[class='tName'], div[class='tName']");
        tokenName.forEach(element => element?.addEventListener ("dblclick", event => this.tokenNameChange(event)));

        const popcornButtons = this.element.querySelectorAll("button[name='popcorn']");
        popcornButtons.forEach(button => button.addEventListener("click", event => this._onPopcornButton(event)));
        popcornButtons.forEach(button => button.addEventListener("contextmenu", event => this._onPopcornRemove(event)));

        const nextButton = this.element.querySelector("button[id='fco_next_exchange']");
        nextButton?.addEventListener("click", event => this._nextButton(event));
        const endButton = this.element.querySelector("button[id='fco_end_conflict']");
        endButton?.addEventListener("click", event => this._endButton(event));
        const timed_event = this.element.querySelector("button[id='fco_timed_event']");
        timed_event?.addEventListener("click", event => this._timed_event(event));
        const category_select = this.element.querySelector("select[id='fco_fu_category_select']")
        category_select?.addEventListener("change", async event => {
                this.category = category_select.value;
                await this.render(false);
        })
        const track_name = this.element.querySelectorAll("div[name='track_name']");
        const box = this.element.querySelectorAll("input[class='fco-box']");
        const cd_box = this.element.querySelectorAll("input[name='cd_box']");
        cd_box?.forEach(box => box.addEventListener('click', event => this._on_cd_box_click(event)));
        box?.forEach(element => element.addEventListener("click", event => this._on_click_box(event)));
        
        const track_aspect = this.element.querySelectorAll("input[name='track_aspect']");
        track_aspect.forEach(element => element.addEventListener("change", event => this._on_aspect_change(event)));

        const roll = this.element.querySelectorAll("button[name='roll']");
        roll?.forEach(element => element.addEventListener("click", event => this._roll(event)));

        const clear_fleeting = this.element.querySelector("button[id='clear_fleeting']");
        clear_fleeting?.addEventListener("click", event => this._clear_fleeting(event));

        const add_sit_aspect = this.element.querySelector("button[id='add_sit_aspect']")
        add_sit_aspect?.addEventListener("click", event => this._add_sit_aspect(event));

        const add_sit_aspect_from_track = this.element.querySelectorAll("button[name='track_aspect_button']")
        add_sit_aspect_from_track?.forEach(element => element.addEventListener("click", event => this._add_sit_aspect_from_track(event)));

        //Situation Aspect Buttons
        const del_sit_aspect = this.element.querySelectorAll("button[name='del_sit_aspect']");
        del_sit_aspect?.forEach(element => element.addEventListener("click", event => this._del_sit_aspect(event)));

        const addToScene = this.element.querySelectorAll("button[name='addToScene']");
        addToScene?.forEach(element => element.addEventListener("click", event => this._addToScene(event)));

        addToScene?.forEach(element => element.addEventListener("dragstart", event => {
            let drag_data = {type:"situation_aspect", aspect:event.target.getAttribute("data-aspect"), value:event.target.getAttribute("data-value")};
            event.dataTransfer.setData("text/plain", JSON.stringify(drag_data));
        }))

        const panToAspect = this.element.querySelectorAll("button[name='panToAspect']");
        panToAspect?.forEach(element => element.addEventListener("click", event => this._panToAspect(event)));

        const free_i = this.element.querySelectorAll("input[name='free_i']");
        free_i?.forEach(element => element.addEventListener("change", event => this._free_i_button(event)));

        const sit_aspect = this.element.querySelectorAll("input[name='sit_aspect']");
        sit_aspect?.forEach(element => element.addEventListener("change", event => this._sit_aspect_change(event)));

        const gmfp = this.element.querySelector("input[name='gmfp']");
        gmfp?.addEventListener("change", event=> this._edit_gm_points(event));

        const playerfp = this.element.querySelectorAll("input[name='player_fps']");
        playerfp?.forEach(element => element.addEventListener("change", event=> this._edit_player_points(event)));

        const playerboosts = this.element.querySelectorAll("input[name='player_boosts']");
        playerboosts?.forEach(element => element.addEventListener("change", event=> this._edit_player_boosts(event)));

        const refresh_fate_points = this.element.querySelector("button[id='refresh_fate_points']");
        refresh_fate_points?.addEventListener("click", event => this.refresh_fate_points(event));    

        const avatar = this.element.querySelectorAll("img[name='avatar']");
        avatar?.forEach(element => element.addEventListener("contextmenu", event=> this._on_avatar_click(event)));
        
        avatar?.forEach(element => element.addEventListener("click", async event => {
            let t_id = event.target.id.split("_")[0];
            let token = game.scenes.viewed.getEmbeddedDocument("Token", t_id);
            if (token.actor.sheet.rendered){
                token.actor.sheet.maximize();
                token.actor.sheet.bringToFront();
            } else {
                token.actor.sheet.render(true);
            }
        }))

        const fu_clear_rolls = this.element.querySelector("button[id='fu_clear_rolls']");
        fu_clear_rolls?.addEventListener("click", event => this._fu_clear_rolls(event));

        const fu_adhoc_roll = this.element.querySelector("button[id='fu_ad_hoc_roll']");
        fu_adhoc_roll?.addEventListener("click", event => this._fu_adhoc_roll(event));

        const fu_roll_button = this.element.querySelectorAll("button[name='fu_roll_button']");
        fu_roll_button?.forEach(element => element.addEventListener("click",event => {FateUtilities._fu_roll_button(event), event.target.blur()}));

        const select = this.element.querySelectorAll("select[class='skill_select']");

        select?.forEach(select => select.addEventListener("focus", event => {
            this.selectingSkill = true;
        }));

        select?.forEach(select => select.addEventListener("click", event => {
            this.shift = game.system["fco-shifted"];
        }))

        select?.forEach(select => select.addEventListener("change", event => this._selectRoll (event)));

        select?.forEach(select => select.addEventListener("blur", event => {
            this.selectingSkill = false
        }))

        const FUAspectNotes = this.element.querySelectorAll('.fco_prose_mirror.fu_aspect_notes');
        FUAspectNotes.forEach(pm =>{
            pm.addEventListener("change", async event => {
                let token_id = event.target.getAttribute("data-tokenid");
                let aspect = event.target.getAttribute("data-name");
                let token = game.scenes.viewed.getEmbeddedDocument("Token", token_id);
                let actor = token.actor;
                let key = fcoConstants.gkfn(actor.system.aspects, aspect);
                await actor.update({[`system.aspects.${key}.notes`]:event.target.value});
                this.editing = false;
                await this.render(false);
            })
        })

        const FUTrackNotes = this.element.querySelectorAll('.fco_prose_mirror.fu_track_notes');
        FUTrackNotes.forEach(pm => {
            pm.addEventListener("change", async event => {
                let token_id = event.target.getAttribute("data-tokenid")
                let track = event.target.getAttribute("data-name");//This is a much better way of accessing data than splitting the id.
                let token = game.scenes.viewed.getEmbeddedDocument("Token", token_id);
                let actor = token.actor;
                let key = fcoConstants.gkfn(actor.system.tracks, track);
                await actor.update({[`system.tracks.${key}.notes`]:event.target.value});
                this.editing = false;
                await this.render(false)
            })
        })

        const add_game_aspect = this.element.querySelector("button[id='add_game_aspect']")
        add_game_aspect?.addEventListener("click", event => this._add_game_aspect(event));

        //Situation Aspect Buttons
        const del_game_aspect = this.element.querySelectorAll("button[name='del_game_aspect']");
        del_game_aspect?.forEach(element => element.addEventListener("click", event => this._del_game_aspect(event)));
        
        const game_a_free_i = this.element.querySelectorAll("input[name='game_a_free_i']");
        game_a_free_i?.forEach(element => element.addEventListener("change", event => this._game_a_free_i_button(event)));

        const fuLabelSettings = this.element.querySelector('button[id="fuAspectLabelSettings"]');
        fuLabelSettings?.addEventListener('click', async event => {
            new FUAspectLabelClass().render(true);
        })

        const addCountdown = this.element.querySelector('button[id="add_countdown"]');
        addCountdown?.addEventListener('click', async event => {
            new acd(this).render(true);
        })
    }

    async _sit_aspect_change(event){
        let index = event.target.id.split("_")[0];
        let aspects = foundry.utils.duplicate(game.scenes.viewed.getFlag("fate-core-official","situation_aspects"));
        let aspect = aspects[index];

        let drawing = undefined;
        if (aspect.name != "") {
            drawing = canvas?.drawings?.objects?.children?.find(drawing => drawing.document?.text?.startsWith(aspect.name));
        }
        
        aspect.name = event.target.value;
        let value = aspect.free_invokes;

        if (aspect.name == "") {
            // As the aspect is blank, disable the free invokes field, pan to aspect button, and add note to canvas button.
            document.getElementById(`${index}_free_invokes`).disabled = "disabled";
            document.getElementById(`addToScene_${index}`).disabled = "disabled";
            document.getElementById(`panToAspect_${index}`).disabled = "disabled";
            
            // If there's a drawing for this aspect, delete it now that the name is blank.
            if (drawing != undefined){
                game.scenes.viewed.deleteEmbeddedDocuments ("Drawing", [drawing.id]);
                return;
            }
        } else {
            document.getElementById(`${index}_free_invokes`).disabled = "";
            document.getElementById(`addToScene_${index}`).disabled = "";
            document.getElementById(`panToAspect_${index}`).disabled = "";
        }

        if (drawing != undefined){
            let text;
            if (value == 1){
                text = aspect.name+` (${value} ${game.i18n.localize("fate-core-official.freeinvoke")})`;    
            } else {
                text = aspect.name+` (${value} ${game.i18n.localize("fate-core-official.freeinvokes")})`;
            }
            let size = game.settings.get("fate-core-official","fuAspectLabelSize");

            // Setup the aspect label font according to the user's settings
            let font = game.settings.get("fate-core-official","fuAspectLabelFont");
            if (FontConfig.getAvailableFonts().indexOf(font) == -1){
                 // What we have here is a numerical value (or font not found in config list; nothing we can do about that).
                font = FontConfig.getAvailableFonts()[game.settings.get("fate-core-official","fuAspectLabelFont")]
            }

            if (size === 0){
                size = Math.floor(game.scenes.viewed.width*(1/100));
                if (size < 8) size = 8;
                if (size > 256) size = 256;
            }
            let height = size * 2;
            let width = (text.length * size) / 1.5;
            await drawing.document.update({
                "text":text,
                width: width,
                height: height,
                fontFamily: font,
            });
        }

        game.scenes.viewed.setFlag("fate-core-official", "situation_aspects",aspects);
        game.socket.emit("system.fate-core-official",{"render":true});
    }

    async _del_game_aspect(event){
        let del =   fcoConstants.confirmDeletion();
        if (del){
            let id = event.target.id;
            let name = id.split("_")[1];
            let game_aspects = foundry.utils.duplicate(game.settings.get("fate-core-official", "gameAspects"));
            game_aspects.splice(game_aspects.findIndex(sit => sit.name == name),1);
            await game.settings.set("fate-core-official","gameAspects",game_aspects);
            game.socket.emit("system.fate-core-official",{"render":true});
            await this.render(false);
        }
    }

    async _add_game_aspect(event){
        const game_aspect = this.element.querySelector("input[id='game_aspect']");
        let game_aspects = [];
        let aspect = {
                                    "name":"",
                                    "free_invokes":0,
                                    "notes":""
                                };
        try {
            game_aspects = foundry.utils.duplicate(game.settings.get("fate-core-official","gameAspects"));
        } catch {
        }                                
        game_aspects.push(aspect);
        await game.settings.set("fate-core-official","gameAspects",game_aspects);
        game.socket.emit("system.fate-core-official",{"render":true});
        await this.render(false);
    }

    async _game_a_free_i_button(event){
        let index=event.target.id.split("_")[0];
        let value=this.element.querySelector(`input[id="${index}_ga_free_invokes"]`).value
        let game_aspects = foundry.utils.duplicate(game.settings.get("fate-core-official","gameAspects"));
        let aspect = game_aspects[index];
        aspect.free_invokes = value;
        await game.settings.set("fate-core-official","gameAspects",game_aspects);
        game.socket.emit("system.fate-core-official",{"render":true});
    }

    async iseAspect(event){
        let token = game.scenes.viewed.getEmbeddedDocument("Token", event.target.id.split("_")[0]);
        if (token.aspectsMaximised == true || token.aspectsMaximised == undefined){
            token.aspectsMaximised = false;
        }else {
            if (token.aspectsMaximised == false){
                token.aspectsMaximised = true;
            }
        }
        await this.render(false);
    }

    async iseTrack(event){
        let token = game.scenes.viewed.getEmbeddedDocument("Token", event.target.id.split("_")[0]);
        if (token.tracksMaximised == true || token.tracksMaximised == undefined){
            token.tracksMaximised = false;
        }else {
            if (token.tracksMaximised == false){
                token.tracksMaximised = true;
            }
        }
        await this.render(false);
    }

    async tokenNameChange(event){
        let t_id = event.target.dataset.id;
        let token = game.scenes.viewed.getEmbeddedDocument("Token", t_id);
        if (token != undefined && token.actor.isOwner){
            let name = await fcoConstants.updateShortText(game.i18n.localize("fate-core-official.whatShouldTokenNameBe"),token.name);
            await token.update({"name":name});
        }
    }

    async _selectRoll (event){
        let t_id = event.target.id.split("_")[0];
        let token = game.scenes.viewed.getEmbeddedDocument("Token", t_id);
        
        let sk = this.element.querySelector(`select[id='${t_id}_selectSkill']`);
        let skill;
        let stunt = undefined;
        let bonus=0;
        if (sk.value.startsWith("macro")){
            let macroID = sk.value.split("_")[1];
            let macro = await fromUuid(macroID);
            await macro.execute({actor:token.actor, token:token});
            return;   
        }

        if (sk.value.startsWith("stunt")){
            let items = sk.value.split("_");
            stunt=items[1]
            skill = items[2]
            bonus = parseInt(items[3]);
        } else {
            skill = sk.value.split("(")[0].trim();
        }

        let rank = 0;
        if (skill == "Special"){
            // We need to pop up a dialog to get a skill to roll.
            let skills = [];
            for (let x in token.actor.system.skills){
                skills.push(token.actor.system.skills[x].name);
            }
            let sk = await fcoConstants.getInputFromList (game.i18n.localize("fate-core-official.select_a_skill"), skills);
            skill = sk;
            let key = fcoConstants.gkfn(token.actor.system.skills, skill);
            rank = token.actor.system.skills[key].rank;
        } else {
            let key = fcoConstants.gkfn(token.actor.system.skills, skill);
            rank = token.actor.system.skills[key].rank;
        }

        let fcoc = new fcoConstants();
        let ladder = fcoc.getFateLadder();
        let rankS = rank.toString();
        let rung = ladder[rankS];

        let umr = false;
        if (this.shift && !game.settings.get("fate-core-official","modifiedRollDefault")) umr = true;
        if (!this.shift && game.settings.get("fate-core-official","modifiedRollDefault")) umr = true;

        if (umr && !sk.value.startsWith("stunt")) {
                let mrd = new ModifiedRollDialog (token.actor, skill);
                mrd.render(true);
                this.shift=false;
                try {
                    mrd.bringToFront();
                } catch  {
                    // Do nothing.
                }
        } else {
            let r;
            if (bonus >0){
                r = new Roll(`4dF + ${rank}+${bonus}`);    
            } else {
                r = new Roll(`4dF + ${rank}`);
            }
                let roll = await r.roll();
                roll.dice[0].options.sfx = {id:"fate4df",result:roll.result};
                let name = game.user.name

                let flavour;
                if (stunt != undefined){
                    flavour = `<h1>${skill}</h1>${game.i18n.localize("fate-core-official.RolledBy")}: ${game.user.name}<br>
                                ${game.i18n.localize("fate-core-official.SkillRank")}: ${rank} (${rung})<br> 
                                ${game.i18n.localize("fate-core-official.Stunt")}: ${stunt} (+${bonus})`
                } else {
                    flavour = `<h1>${skill}</h1>${game.i18n.localize("fate-core-official.RolledBy")}: ${game.user.name}<br>
                                ${game.i18n.localize("fate-core-official.SkillRank")}: ${rank} (${rung})`;
                }

                roll.toMessage({
                    flavor: flavour,
                    speaker: ChatMessage.getSpeaker({token:token}),
                });
        }
        this.selectingSkill = false;
        await this.render(false);
    }

    static async _fu_roll_button(event){
        let detail = event.target.getAttribute("data-roll").split("_");
        let msg_id = event.target.getAttribute("data-msg_id");
        let index = detail[1];
        let action = detail[2];
        let rolls = game.scenes.viewed?.getFlag("fate-core-official","rolls");
        if (rolls) rolls = foundry.utils.duplicate(rolls);
        let roll = undefined;
        if (index > -1){
            roll = rolls[index];
        } else {
            if (rolls) roll = rolls.find(r => r.message_id == msg_id);
        }
        let message;
        if (roll?.message_id) message = game.messages.get(roll.message_id)
        if (!message) message = game.messages.get(msg_id);

        if (!roll){
            let dice_formula = message.rolls[0].options?.fco_formula;
            if (!dice_formula) dice_formula = message.rolls[0].formula.split("+")[0].split("-")[0].trim();
            let speaker = message.speaker.alias;
            let fullSpeaker = message.speaker;
            let flavor = message.flavor;
            let formula = message.rolls[0].formula;
            let total = message.rolls[0].total;
            let message_id = message.id;
            let diceResult = message.rolls[0].dice[0].values;
            if (diceResult == undefined){
                let d = message.roll.dice[0].rolls;
                diceResult = [];
                for (let i=0; i< d.length; i++){
                    diceResult.push(d[i].roll)
                }
            }
            let user = null;
            user = {name:message.author.name, _id:message.author._id};
            roll = {
                "message_id":message_id,
                "speaker":speaker,
                "fullSpeaker":fullSpeaker,
                "formula":formula,
                "dice_formula":dice_formula,
                "flavor":flavor,
                "total":total,
                "dice":diceResult,
                "user":user,
                "roll":roll
            }

        }
        
        if (action == "manual" || action == "manualfp"){
            let gp = await gmfp(roll);
            // Render a dialog asking for the modifier and text description
            let content = 
            `<div>
                <table style="border:none">
                    <th style="text-align:left; padding-left:5px">
                        Modifier
                    </th>
                    <th style="text-align:left; padding-left:5px">
                        Description
                    </th>
                    <tr>
                        <td style="text-align:left; padding-left:5px"> 
                            <input type="number" style="background-color:white; max-width:5em" name="fco_manual_modifier" value="0">
                            </input>
                        </td>
                        <td style="text-align:left; padding-left:5px">
                            <input type="text" style="background-color:white;" name="fco_manual_description" value="">
                            </input>
                        </td>
                    </tr>
                </table>
            </div>`

            let modification = await new Promise(resolve => {
                new foundry.applications.api.DialogV2({
                    window:{title: game.i18n.localize("fate-core-official.manualRollModifier")},
                    content: content,
                    buttons: [{
                        action: "ok",
                        label: "OK",
                            callback: (event, button, dialog) => {
                                resolve({
                                    modifier:button.form.elements.fco_manual_modifier.value,
                                    description:button.form.elements.fco_manual_description.value
                                })
                            },
                            default: true
                    }],
                }).render(true);
            });

            //Find the right character and deduct one from their fate points
            let user = game.users.contents.find(user => user.id == roll.user._id)

            if (action == "manualfp"){
                if (gp.gmp){
                    let fps = user.getFlag("fate-core-official","gmfatepoints");
                    if (fps == 0 || fps == undefined){
                        ui.notifications.error(game.i18n.localize("fate-core-official.NoGMFatePoints"))
                    } else {
                        user.setFlag("fate-core-official","gmfatepoints",fps-1);
                        // Modify the dice result by the modifier & edit the flavour
                        let m = parseInt (modification.modifier);
                        roll.total+=m;
                        let sign = ""
                        if (m >= 0) sign = "+"; 
                        roll.flavor+=`<br>Paid Modifier: ${sign}${modification.modifier} (${modification.description})`
                        if (game.scenes.viewed) game.scenes.viewed.setFlag("fate-core-official", "rolls", rolls);
                        if (message) {
                            let mrolls = foundry.utils.duplicate(message.rolls)
                            let mroll = mroll[0];
                            mroll.total = roll.total;
                            await message.update({flavor:roll.flavor, content:roll.total, rolls:mrolls})
                        }
                    }
                } else {
                    let char = gp.actor;
                    let fps = char.system.details.fatePoints.current;

                    if (fps == 0){
                        ui.notifications.error(game.i18n.localize("fate-core-official.NoFatePoints"))
                    } else {
                        char.update({"system.details.fatePoints.current":fps-1})
                        // Modify the dice result by the modifier & edit the flavour
                        let m = parseInt (modification.modifier);
                        roll.total+=m;
                        let sign = ""
                        if (m >= 0) sign = "+"; 
                        roll.flavor+=`<br>Paid Modifier: ${sign}${modification.modifier} (${modification.description})`
                        if (game.user.isGM){
                            if (game.scenes.viewed) game.scenes.viewed.setFlag("fate-core-official", "rolls", rolls);
                            if (message) {
                                let mrolls = foundry.utils.duplicate(message.rolls);
                                let mroll = mrolls[0];
                                mroll.total = roll.total;
                                await message.update({flavor:roll.flavor, content:roll.total, rolls:mrolls})
                            }
                        } else {
                            game.socket.emit("system.fate-core-official",{"rolls":rolls, "scene":game.scenes.viewed})
                        }
                    }
                }
            } else {
                // Modify the dice result by the modifier & edit the flavour
                let m = parseInt (modification.modifier);
                roll.total+=m;
                let sign = ""
                if (m >= 0) sign = "+"; 
                roll.flavor+=`<br>Modifier: ${sign}${modification.modifier} (${modification.description})`
            }

            if (game.user.isGM){
                if (game.scenes.viewed) await game.scenes.viewed.setFlag("fate-core-official", "rolls", rolls);
                if (message) {
                    let mrolls = foundry.utils.duplicate(message.rolls);
                    let mroll = mrolls[0];
                    mroll.total = roll.total;
                    roll.roll = mroll;
                    await message.update({flavor:roll.flavor, content:roll.total, rolls:mrolls})
                }
            } else {
                //Create a socket call to update the scene's roll data
                game.socket.emit("system.fate-core-official",{"rolls":rolls, "scene":game.scenes.viewed})
            }
        }

        if (action == "plus1"){
            roll.total+=1;
            roll.flavor+=`<br>${game.i18n.localize("fate-core-official.PlusOne")}`
            if (game.user.isGM){
                if (game.scenes.viewed) {
                    await game.scenes.viewed.setFlag("fate-core-official", "rolls", rolls);
                }
                if (message) {
                    let mrolls = foundry.utils.duplicate(message.rolls);
                    let mroll = mrolls[0];
                    mroll.total = roll.total;
                    roll.roll = mroll;
                    await message.update({flavor:roll.flavor, content:roll.total, rolls:mrolls})
                }
            } else {
                //Create a socket call to update the scene's roll data
                game.socket.emit("system.fate-core-official",{"rolls":rolls, "scene":game.scenes.viewed})
            }
        }

        if (action == "plus2free"){
            let bonus = 2;
            let flavor = `<br>${game.i18n.localize("fate-core-official.FreeInvoke")}`
            let aspectsInvoked = [];
            let asa = game.scenes.viewed?.getFlag("fate-core-official", "situation_aspects");
            if (!asa) asa = {};
            let all_sit_aspects = foundry.utils.duplicate(asa);

            let shift_down = game.system["fco-shifted"];    

            let gp = await gmfp(roll);
            let boosts = gp?.actor?.system?.details?.fatePoints?.boosts > 0 ? gp?.actor?.system?.details?.fatePoints?.boosts : 0;

            if (shift_down && game.user.isGM && ((Object.keys(asa).length > 0 && asa.filter(as => as.free_invokes > 0).length > 0) || boosts > 0)){
               // Add dialog here to pick aspect(s) being invoked.
               // Dialogue should display all situation aspects in current scene with number of free invokes;
               // We then need to harvest the number of invokes being used on each and set bonus accordingly.
               // Ideally we should add the flavour to the below.
                bonus = 0;
                let sit_aspects = foundry.utils.duplicate(game.scenes.viewed?.getFlag("fate-core-official", "situation_aspects")).filter(as => as.free_invokes > 0);
                for (let aspect of sit_aspects){
                    let options = "";
                    for (let i = 0; i < parseInt(aspect.free_invokes, 10)+1; i++){
                        options+=`<option value="${aspect.name}_${i}">${i}</option>`
                    }
                    aspect.options = options;
                }

                
                game.system["fco-shifted"] = false;
                
                
                let content =`<br/><div>`
                for (let aspect of sit_aspects){
                    content += `<div style="display:flex; flex-direction:row; margin-bottom:5px"><div style="min-width:75%; max-width:75%; padding:5px">${aspect.name}</div><div style="min-width:50px"><select class = "free_i_selector">${aspect.options}</select></div></div>`
                }
                if (boosts > 0){
                    let options = "";
                    for (let i = 0; i < boosts+1; i++){
                        options+=`<option value="boosts_${i}">${i}</option>`
                    }
                    content += `<div style="display:flex; flex-direction:row"><div style="min-width:75%; max-width:75%; padding:5px">Boosts </div><div style="min-width:50px"><select class = "free_i_selector">${options}</select></div></div>`
                }
                content += `</div><br/>`

               let invokedAspects = await new Promise(resolve => {
                    new foundry.applications.api.DialogV2({
                        window:{title: game.i18n.localize("fate-core-official.selectAspects")},
                        content: content,
                        buttons: [{
                                label: "OK",
                                callback: (event, button, dialog) => {
                                    resolve (dialog.querySelectorAll(".free_i_selector"));
                            }, default:true
                        }],
                        close: () => resolve()
                    }).render(true);
                });
        
                if (invokedAspects){
                    let updates = [];
                    for (let aspect of invokedAspects){                
                        let name = aspect.value.split("_")[0];
                        let num_invokes = aspect.value.split("_")[1];
                        if (num_invokes > 0 && name !== "boosts"){
                            bonus += parseInt(num_invokes, 10)*2;
                            aspectsInvoked.push(`${name} x${num_invokes}`);
                            let sit_aspect = all_sit_aspects.find(asp => asp.name == name);
                            sit_aspect.free_invokes -= num_invokes;
                            let drawing = canvas?.drawings?.objects?.children?.find(drawing => drawing?.document.text?.startsWith(name));
                            if (drawing != undefined){
                                let text;
                                if (sit_aspect.free_invokes == 1){
                                    text = name+` (${sit_aspect.free_invokes} ${game.i18n.localize("fate-core-official.freeinvoke")})`;    
                                } else {
                                    text = name+` (${sit_aspect.free_invokes} ${game.i18n.localize("fate-core-official.freeinvokes")})`;
                                }
                                let size = game.settings.get("fate-core-official","fuAspectLabelSize");
                                
                                // Setup the aspect label font according to the user's settings
                                let font = game.settings.get("fate-core-official","fuAspectLabelFont");
                                if (FontConfig.getAvailableFonts().indexOf(font) == -1){
                                    // What we have here is a numerical value (or font not found in config list; nothing we can do about that).
                                    font = FontConfig.getAvailableFonts()[game.settings.get("fate-core-official","fuAspectLabelFont")]
                                }
                                
                                if (size === 0){
                                    size = Math.floor(game.scenes.viewed?.width*(1/100));
                                    if (size < 8) size = 8;
                                    if (size > 256) size = 256;
                                }
                                let height = size * 2;
                                let width = (text.length * size) / 1.5;
                                updates.push({_id:drawing.document.id, "text":text, "width":width, "height":height, "fontFamily":font})
                            }
                        }
                        if (num_invokes > 0 && name == "boosts"){
                            bonus += parseInt(num_invokes, 10)*2;
                            aspectsInvoked.push(`Boost x ${num_invokes}`);
                            let new_boosts = boosts - num_invokes;
                            await gp?.actor?.update({"system.details.fatePoints.boosts":new_boosts})
                        }
                    }
                    if (bonus > 0){
                        if (game.scenes.viewed){ 
                            await game.scenes.viewed.updateEmbeddedDocuments("Drawing", updates);
                            flavor = `<br>${game.i18n.localize("fate-core-official.FreeInvokes")} +${bonus} (${aspectsInvoked.join(", ")})`
                            await game.scenes.viewed.setFlag("fate-core-official", "situation_aspects", all_sit_aspects);
                        }
                    }
                }
            }
            if (bonus > 0){
                roll.total+=bonus;
                roll.flavor+=flavor;
                if (game.user.isGM){
                    if (message) {
                        let mrolls = foundry.utils.duplicate(message.rolls);
                        let mroll = mrolls[0];
                        mroll.total = roll.total;
                        roll.roll = mroll;
                        await message.update({flavor:roll.flavor, content:roll.total, rolls:mrolls})
                    } 
                    if (game.scenes.viewed) {
                        await game.scenes.viewed.setFlag("fate-core-official", "rolls", rolls);
                    }
                }
                else {
                    //Create a socket call to update the scene's roll data
                    game.socket.emit("system.fate-core-official",{"rolls":rolls, "scene":game.scenes.viewed})
                }
            }
        }

        if (action == "reroll"){
            let oldRoll= "";
            for (let r of roll.dice){
                if (r < 2){
                    if (r == -1) oldRoll += `<em style="font-family:fate; font-style:normal">-</em>`
                    if (r == -0) oldRoll += `<em style="font-family:fate; font-style:normal">0</em>`
                    if (r == 1) oldRoll += `<em style="font-family:fate; font-style:normal">+</em>`
                } else {
                    oldRoll += `<em style="font-style:normal">${r} </em>`
                } 
            }            
            let flavor = `<br>${game.i18n.localize("fate-core-official.FreeInvokeReroll")} ${oldRoll}`

            let asa = game.scenes.viewed?.getFlag("fate-core-official", "situation_aspects");
            if (!asa) asa = {};
            let all_sit_aspects = foundry.utils.duplicate(asa);

            let invokedAspect = undefined;

            let shift_down = game.system["fco-shifted"];    

            let invokedAspects = false;

            let gp = await gmfp(roll);
            let boosts = gp?.actor?.system?.details?.fatePoints?.boosts > 0 ? gp?.actor?.system?.details?.fatePoints?.boosts : 0;

            if (shift_down && game.user.isGM && ((Object.keys(asa).length > 0 && asa.filter(as => as.free_invokes > 0).length > 0) || boosts > 0)){
                let options = ""
                game.system["fco-shifted"] = false;
                let sit_aspects = foundry.utils.duplicate(game.scenes.viewed?.getFlag("fate-core-official", "situation_aspects")).filter(as => as.free_invokes > 0);
                for (let aspect of sit_aspects){
                    options +=`<option value="${aspect.name}">${aspect.name}</option>`
                }

                if (boosts > 0){
                    options+=`<option value="boost">${game.i18n.localize("fate-core-official.Boost")}</option>`
                }                                
                let content =`<br/><div style="min-width:100%; max-width:100%"><select style="min-width:100%; max-width:100%" class="free_i_r_selector">${options}</select></div><br/>`

               invokedAspects = await new Promise(resolve => {
                    new foundry.applications.api.DialogV2({
                        window:{title: game.i18n.localize("fate-core-official.selectAspects")},
                        content: content,
                        buttons: [{
                                label: "OK",
                                callback: (event, button, dialog) => {
                                    resolve (dialog.querySelectorAll(".free_i_r_selector"));
                            }, default: true
                        }],
                        close: () => resolve("aborted")
                    }).render(true);
                });

                let updates = [];

                if (invokedAspects && invokedAspects != "aborted"){
                    for (let aspect of invokedAspects){
                        let name = aspect.value;

                        if (name !== 'boost'){
                            let sit_aspect = all_sit_aspects.find(asp => asp.name == name);
                            sit_aspect.free_invokes -= 1;
                            let drawing = canvas?.drawings?.objects?.children?.find(drawing => drawing?.document.text?.startsWith(name));
                            if (drawing != undefined){
                                let text;
                                if (sit_aspect.free_invokes == 1){
                                    text = name+` (${sit_aspect.free_invokes} ${game.i18n.localize("fate-core-official.freeinvoke")})`;    
                                } else {
                                    text = name+` (${sit_aspect.free_invokes} ${game.i18n.localize("fate-core-official.freeinvokes")})`;
                                }
                                let size = game.settings.get("fate-core-official","fuAspectLabelSize");
                                
                                // Setup the aspect label font according to the user's settings
                                let font = game.settings.get("fate-core-official","fuAspectLabelFont");
                                if (FontConfig.getAvailableFonts().indexOf(font) == -1){
                                    // What we have here is a numerical value (or font not found in config list; nothing we can do about that).
                                    font = FontConfig.getAvailableFonts()[game.settings.get("fate-core-official","fuAspectLabelFont")]
                                }
    
                                if (size === 0){
                                    size = Math.floor(game.scenes.viewed?.width*(1/100));
                                    if (size < 8) size = 8;
                                    if (size > 256) size = 256;
                                }
                                let height = size * 2;
                                let width = (text.length * size) / 1.5;
                                updates.push({_id:drawing.document.id, "text":text, "width":width, "height":height, "fontFamily":font})
                            }
                            flavor += ` (${sit_aspect.name})`
                            if (game.scenes.viewed){
                                await game.scenes.viewed.updateEmbeddedDocuments("Drawing", updates);
                                await game.scenes.viewed.setFlag("fate-core-official", "situation_aspects", all_sit_aspects);    
                            }
                            invokedAspect = sit_aspect.name;
                        }

                        if (name == 'boost'){
                            flavor += ` (Boost)`;
                            await gp?.actor?.update({"system.details.fatePoints.boosts":gp?.actor?.system?.details?.fatePoints?.boosts - 1});
                            invokedAspect = game.i18n.localize("fate-core-official.Boost");
                        }
                    }
                }
            }

            if (invokedAspects != "aborted"){
                let dicepart = roll.formula.split("-")[0].split("+")[0];
                let r = new Roll (dicepart);
                let r2 = await r.roll();
                r2.dice[0].options.sfx = {id:"fate4df",result:r2.result};
                let newFlavour = `<h1>${game.i18n.localize("fate-core-official.FreeRerollExplainer")}</h1>${game.i18n.localize("fate-core-official.RolledBy")}: ${game.user.name}<br>`
                if (invokedAspect) {
                    newFlavour = `<h1>${game.i18n.localize("fate-core-official.FreeRerollExplainer")} (${invokedAspect})</h1>${game.i18n.localize("fate-core-official.RolledBy")}: ${game.user.name}<br>`
                }

                r2.toMessage({
                    flavor: newFlavour,
                    speaker: roll.fullSpeaker
                });
                let oldDiceValue = 0;
                for (let i = 0; i< roll.dice.length; i++){
                    oldDiceValue += roll.dice[i]
                }
                roll.total -= oldDiceValue;
                roll.dice = r2.dice[0].values;
                if (roll.dice == undefined){
                    let d = r2.dice[0].rolls;
                    roll.dice = [];
                    for (let i=0; i< d.length; i++){
                        roll.dice.push(d[i].roll)
                    }
                }
                roll.total += r2.total;
                roll.flavor+=flavor;
                roll.roll = r2;
                if (game.user.isGM){
                    if (message) {
                        let mroll = foundry.utils.duplicate(r2);
                        mroll.total = roll.total;
                        await message.update({flavor:roll.flavor, content:roll.total, rolls:[mroll]})
                    }
                    if (game.scenes.viewed) game.scenes.viewed.setFlag("fate-core-official", "rolls", rolls);
                } else {
                    //Create a socket call to update the scene's roll data
                    game.socket.emit("system.fate-core-official",{"rolls":rolls, "scene":game.scenes.viewed})
                }
            }
        }

        async function gmfp (roll){
            //If the character is not assigned to anyone, use the GM's fate points, otherwise use the character's.
            let user = await game.users.get(roll.user._id);
            let returnValue = false;

            // speaker.token is null if this is not a synthetic actor
            // speaker.actor is never null
            // speaker.scene is null if there is no active scene (so this can't be a token actor, by definition)
            let speaker = roll.fullSpeaker;
            if (!speaker) speaker = game.messages.get(roll.message_id).speaker;

            if (!speaker.actor || speaker.actor === null){
                return {gmp:true, actor:undefined};
            }
            
            let actor = null;
            // Case 1 - Token actor
            if ( speaker.scene && speaker.token ) {
                const scene = game.scenes.get(speaker.scene);
                const token = scene ? scene.tokens.get(speaker.token) : null;
                actor = token?.actor;
            }

            // Case 2 - explicit actor
            if ( speaker.actor && !actor ) {
                actor = game.actors.get(speaker.actor);
            }

            // Never use GM fate points if the actor has a player owner
            // If the user is a GM, and the actor doesn't have a player owner, and isn't assigned to this GM, use GM fate points
            if (!actor.hasPlayerOwner && user?.character?.id != actor.id) returnValue = true; 

            let shift_down = game.system["fco-shifted"];    
            if (shift_down) returnValue = true;

            return ({gmp:returnValue, actor:actor});
        }

        if (action == "plus2fp"){
            //Find the right character and deduct one from their fate points
            //First, get the user who made the roll
            let user = game.users.contents.find(u => u.id == roll.user._id)
            let gp = await (gmfp(roll));

            if (gp.gmp){
                let fps = user.getFlag("fate-core-official","gmfatepoints");
                if (fps == 0 || fps == undefined){
                    ui.notifications.error(game.i18n.localize("fate-core-official.NoGMFatePoints"))
                } else {
                    user.setFlag("fate-core-official","gmfatepoints",fps-1);
                    roll.total+=2;
                    roll.flavor+=`<br>${game.i18n.localize("fate-core-official.PaidInvoke")}`

                    if (message) {
                        let mrolls = foundry.utils.duplicate(message.rolls)
                        let mroll = mrolls[0];
                        mroll.total = roll.total;
                        roll.roll = mroll;
                        await message.update({flavor:roll.flavor, content:roll.total, rolls:mrolls})
                    }
                    if (game.scenes.viewed) game.scenes.viewed.setFlag("fate-core-official", "rolls", rolls);
                }
            } else {
                let char = gp.actor;
                let fps = char.system.details.fatePoints.current;
                if (fps == 0){
                    ui.notifications.error(game.i18n.localize("fate-core-official.NoFatePoints"))
                } else {
                    char.update({"system.details.fatePoints.current":fps-1})
                    roll.total+=2;
                    roll.flavor+=`<br>${game.i18n.localize("fate-core-official.PaidInvoke")}`
                    if (game.user.isGM){
                        if (message) {
                            let mrolls = foundry.utils.duplicate(message.rolls)
                            let mroll = mrolls[0];
                            mroll.total = roll.total;
                            roll.roll = mroll;
                            await message.update({flavor:roll.flavor, content:roll.total, rolls:mrolls})
                        }
                        if (game.scenes.viewed) game.scenes.viewed.setFlag("fate-core-official", "rolls", rolls);
                    } else {
                        game.socket.emit("system.fate-core-official",{"rolls":rolls, "scene":game.scenes.viewed})
                    }
                }
            }
        }

        if (action == "rerollfp"){
            //Find the right character and deduct one from their fate points
            let user = game.users.contents.find(user => user.id == roll.user._id)
            let gp = await (gmfp(roll));
            let oldRoll= "";
            for (let r of roll.dice){
                if (r < 2){
                    if (r == -1) oldRoll += `<em style="font-family:fate; font-style:normal">-</em>`
                    if (r == -0) oldRoll += `<em style="font-family:fate; font-style:normal">0</em>`
                    if (r == 1) oldRoll += `<em style="font-family:fate; font-style:normal">+</em>`
                } else {
                    oldRoll += `<em style="font-style:normal">${r} </em>`
                } 
            }            

            if (gp.gmp){
                let fps = user.getFlag("fate-core-official","gmfatepoints");
                if (fps == 0 || fps == undefined){
                    ui.notifications.error(game.i18n.localize("fate-core-official.NoGMFatePoints"))
                } else {
                    user.setFlag("fate-core-official","gmfatepoints",fps-1);
                    let dicepart = roll.formula.split("-")[0].split("+")[0];
                    let r = new Roll (dicepart);
                    let r2 = await r.roll();
                    r2.dice[0].options.sfx = {id:"fate4df",result:r2.result};
                    r2.toMessage({
                        flavor: `<h1>${game.i18n.localize("fate-core-official.PaidRerollExplainer")}</h1>${game.i18n.localize("fate-core-official.RolledBy")}: ${game.user.name}<br>`,
                        speaker: roll.fullSpeaker
                    });
                    let oldDiceValue = 0;
                    for (let i = 0; i< roll.dice.length; i++){
                        oldDiceValue += roll.dice[i]
                    }
                    roll.total -= oldDiceValue;
                    roll.dice = r2.dice[0].values;
                    if (roll.dice == undefined){
                        let d = r2.dice[0].rolls;
                        roll.dice = [];
                        for (let i=0; i< d.length; i++){
                            roll.dice.push(d[i].roll)
                        }
                    }
                    roll.total += r2.total;
                    roll.flavor+=`<br>${game.i18n.localize("fate-core-official.PaidInvokeReroll")} ${oldRoll}`
                    roll.roll = foundry.utils.duplicate(r2);
                    if (message) {
                        let mroll = foundry.utils.duplicate(r2);
                        mroll.total = roll.total;
                        await message.update({flavor:roll.flavor, content:roll.total, rolls:[mroll]})
                    }
                    if (game.scenes.viewed) game.scenes.viewed.setFlag("fate-core-official", "rolls", rolls);
                }
            } else {
                let char = gp.actor;
                let fps = char.system.details.fatePoints.current;
                if (fps == 0){
                    ui.notifications.error(game.i18n.localize("fate-core-official.NoFatePoints"))
                } else {
                    char.update({"system.details.fatePoints.current":fps-1})
                    roll.flavor+=`<br>${game.i18n.localize("fate-core-official.PaidInvokeReroll")} ${oldRoll}`
                    let dicepart = roll.formula.split("-")[0].split("+")[0];
                    let r = new Roll (dicepart);
                    let r2 = await r.roll();
                    r2.dice[0].options.sfx = {id:"fate4df",result:r2.result};
                    r2.toMessage({
                        flavor: `<h1>${game.i18n.localize("fate-core-official.PaidRerollExplainer")}</h1>${game.i18n.localize("fate-core-official.RolledBy")}: ${game.user.name}<br>`,
                        speaker: roll.fullSpeaker
                    });
                    let oldDiceValue = 0;
                    for (let i = 0; i< roll.dice.length; i++){
                        oldDiceValue += roll.dice[i]
                    }
                    roll.total -= oldDiceValue;
                    roll.dice = r2.dice[0].values;
                    roll.total += r2.total;
                    roll.roll = foundry.utils.duplicate(r2);
                    if (game.user.isGM){
                        if (message) {
                            let mroll = foundry.utils.duplicate(r2);
                            mroll.total = roll.total;
                            await message.update({flavor:roll.flavor, content:roll.total, rolls:[mroll]})
                        }
                        if (games.scenes.viewed) game.scenes.viewed.setFlag("fate-core-official", "rolls", rolls);
                    } else {
                        game.socket.emit("system.fate-core-official",{"rolls":rolls, "scene":game.scenes.viewed})
                    }
                }
            }
        }
    }

    async _fu_clear_rolls(event){
        game.scenes.viewed.unsetFlag("fate-core-official","rolls");
    }

    _fu_adhoc_roll(event){
        let name = "";
        let skill = ""; 
        let modifier = 0;
        let flavour = "";

        let fs = game.settings.get("fate-core-official","fu-roll-formulae");
        let showFormulae = false;
        let formulae = [];
        if (fs){
            formulae = fs.split(",").map(item => item.trim());
            if (formulae.length > 1) showFormulae = true;
            if (formulae.length == 1 && formulae[0].toLowerCase() != '4df') showFormulae = true;
            if (formulae.indexOf('4dF') == -1 && formulae.indexOf('4df') == -1) formulae.push('4df');
        }
        let formulaeContent = "";
        if (showFormulae){
            formulaeContent = `<tr><td>${game.i18n.localize("fate-core-official.diceFormula")}:</td><td><select style="background-color:white" type="text" id="fco-gmadhr-formula">`;
            for (let formula of formulae) formulaeContent += `<option value="${formula}">${formula}</option>`;
            formulaeContent += `</select></td></tr>`;
        }
        
        let content = `<table style="border:none;">
        ${formulaeContent}
        <tr><td>${game.i18n.localize("fate-core-official.fu-adhoc-roll-actor-name")}</td><td><input style="background-color:white" type="text" id="fco-gmadhr-name"></input></td></tr>
        <tr><td>${game.i18n.localize("fate-core-official.fu-adhoc-roll-skill-name")}</td><td><input style="background-color:white" type="text" id="fco-gmadhr-skill"></input></td></tr>
        <tr><td>${game.i18n.localize("fate-core-official.fu-adhoc-roll-modifier")}</td><td><input style="background-color:white" type="number" id="fco-gmadhr-modifier"></input></td></tr>
        <tr><td>${game.i18n.localize("fate-core-official.fu-adhoc-roll-description")}</td><td><input style="background-color:white" type="text" id="fco-gmadhr-flavour"></input></td></tr>
        </tr></table>`;
        let width = 500;

        let d = new foundry.applications.api.DialogV2({
                    window:{
                        title: game.i18n.localize("fate-core-official.fu-adhoc-roll"),
                    },
                    content: content,
                    buttons: [{
                            action: "ok",
                            label: game.i18n.localize("fate-core-official.OK"),
                            callback: async (event, button, dialog)=> {
                                // Do the stuff here
                                let formula = dialog.querySelector('#fco-gmadhr-formula')?.value;
                                if (!formula) formula = '4df';
                                name = dialog.querySelector('#fco-gmadhr-name').value;
                                if (!name) name = game.i18n.localize("fate-core-official.fu-adhoc-roll-mysteriousEntity");
                                skill = dialog.querySelector('#fco-gmadhr-skill').value;
                                if (!skill) skill = game.i18n.localize("fate-core-official.fu-adhoc-roll-mysteriousSkill");
                                modifier = dialog.querySelector('#fco-gmadhr-modifier').value;
                                if (!modifier) modifier = 0;
                                flavour = dialog.querySelector('#fco-gmadhr-flavour').value;
                                if (!flavour) flavour = game.i18n.localize("fate-core-official.fu-adhoc-roll-mysteriousReason");

                                let r = new Roll(`${formula} + ${modifier}`);
                                let roll = await r.roll();
                                roll.dice[0].options.sfx = {id:"fate4df",result:roll.result};
                                roll.options.fco_formula = formula;
                                let msg = ChatMessage.getSpeaker(game.user)
                                msg.scene = null;
                                msg.token = null;
                                msg.actor = null;
                                msg.alias = name;
                
                                roll.toMessage({
                                    flavor: `<h1>${skill}</h1>${formula} ${game.i18n.localize("fate-core-official.RolledBy")}: ${game.user.name}<br>
                                    Skill Rank & Modifiers: ${modifier} <br>Description: ${flavour}`,
                                    speaker: msg
                                });
                            },
                            default: true
                        }],
                });
                d.position.width = width;
                d.render(true);
    }

    async _on_avatar_click(event){
        if (game.user.isGM){
            let fu_actor_avatars = game.settings.get("fate-core-official","fu_actor_avatars");
            let t_id = event.target.id.split("_")[0];
            let token = game.scenes.viewed.getEmbeddedDocument("Token", t_id);
            if (!fu_actor_avatars){
                ui.notifications.info("Switching to actor avatars");
                await game.settings.set("fate-core-official","fu_actor_avatars",true);
            } else {
                if (fu_actor_avatars){
                    ui.notifications.info("Switching to token avatars");
                    await game.settings.set("fate-core-official","fu_actor_avatars",false);
                }
            }
            await this.render(false);
            game.socket.emit("system.fate-core-official",{"render":true});
        }
    }

    async refresh_fate_points(event){
        let tokens = game.scenes.viewed.tokens.contents;
        let updates = [];
        for (let i = 0; i < tokens.length; i++){
            let token = tokens[i];
        
            if (token?.actor == null || !token?.actor?.hasPlayerOwner || token?.actor.type == "Thing"){
                continue;
            }
            let current = parseInt(token.actor.system.details.fatePoints.current);
            let refresh = parseInt(token.actor.system.details.fatePoints.refresh);

            if (current < refresh){
                current = refresh;
            }
            updates.push({"_id":token.actor.id,"system.details.fatePoints.current":current})
        }
        Actor.updateDocuments(updates);
    }

    async _edit_player_points(event){
        let id = event.target.id;
        let parts = id.split("_");
        let t_id = parts[0]
        let token = game.scenes.viewed.getEmbeddedDocument("Token", t_id);
        let fps = parseInt(event.target.value);

        await token.actor.update({
            ["system.details.fatePoints.current"]: fps
        })
        this.editing = false;
        await this.render(false);
    }

    async _edit_player_boosts(event){
        let id = event.target.id;
        let parts = id.split("_");
        let t_id = parts[0]
        let token = game.scenes.viewed.getEmbeddedDocument("Token", t_id);
        let boosts = parseInt(event.target.value);

        await token.actor.update({
            ["system.details.fatePoints.boosts"]: boosts
        })
        this.editing = false;
        await this.render(false);
    }

    async _edit_gm_points(event){
        let user = game.users.contents.find(user => user.id == event.target.dataset.gmid);
        let fp = parseInt(event.target.value)
        user.setFlag("fate-core-official","gmfatepoints",fp);
    }

    async scene_notes_edit(event){
        this.editing = true;
    }

    async _free_i_button(event){
        let index=event.target.id.split("_")[0];
        let value=this.element.querySelector(`input[id="${index}_free_invokes"]`).value
        let situation_aspects = foundry.utils.duplicate(game.scenes.viewed.getFlag("fate-core-official","situation_aspects"))
        let aspect = situation_aspects[index];
        let name = aspect.name;
        aspect.free_invokes = value;
        game.scenes.viewed.setFlag("fate-core-official","situation_aspects",situation_aspects);
        //Done: Add code to change number of free invokes showing on the scene note for this aspect, if it exists.
        let drawing = canvas?.drawings?.objects?.children?.find(drawing => drawing.document?.text?.startsWith(name));
        if (drawing != undefined){
            let text;
            if (value == 1){
                text = name+` (${value} ${game.i18n.localize("fate-core-official.freeinvoke")})`;    
            } else {
                text = name+` (${value} ${game.i18n.localize("fate-core-official.freeinvokes")})`;
            }
            let size = game.settings.get("fate-core-official","fuAspectLabelSize");
            
            // Setup the aspect label font according to the user's settings
            let font = game.settings.get("fate-core-official","fuAspectLabelFont");
            if (FontConfig.getAvailableFonts().indexOf(font) == -1){
                // What we have here is a numerical value (or font not found in config list; nothing we can do about that).
                font = FontConfig.getAvailableFonts()[game.settings.get("fate-core-official","fuAspectLabelFont")]
            }

            if (size === 0){
                size = Math.floor(game.scenes.viewed.width*(1/100));
                if (size < 8) size = 8;
                if (size > 256) size = 256;
            }
            let height = size * 2;
            let width = (text.length * size) / 1.5;
            drawing.document.update({
                "text":text,
                width: width,
                height: height,
                fontFamily: font,
            });
        }
    }

    async _panToAspect(event){
        let index=event.target.id.split("_")[1];
        let name = game.scenes.viewed.getFlag("fate-core-official","situation_aspects")[index].name;
        let drawing = canvas?.drawings?.objects?.children?.find(drawing => drawing?.document.text?.startsWith(name));
        
        if (drawing != undefined) {
            let x = drawing.x;
            let y = drawing.y;
            canvas.animatePan({x:x, y:y});
        }
    }

    async addAspectDrawing(value, name, x, y){
        if (canvas?.drawings?.objects?.children?.find(drawing => drawing?.document.text?.startsWith(name))==undefined)
        {
            let text;
            if (value == 1){
                text = name+` (${value} ${game.i18n.localize("fate-core-official.freeinvoke")})`;    
            } else {
                text = name+` (${value} ${game.i18n.localize("fate-core-official.freeinvokes")})`;
            }
                let size = game.settings.get("fate-core-official","fuAspectLabelSize");
            
                // Setup the aspect label font according to the user's settings
                let font = game.settings.get("fate-core-official","fuAspectLabelFont");
                if (FontConfig.getAvailableFonts().indexOf(font) == -1){
                    // What we have here is a numerical value (or font not found in config list; nothing we can do about that).
                    font = FontConfig.getAvailableFonts()[game.settings.get("fate-core-official","fuAspectLabelFont")]
                }

                if (size === 0){
                    size = Math.floor(game.scenes.viewed.width*(1/100));
                    if (size < 8) size = 8;
                    if (size > 256) size = 256;
                }
                let height = size * 2;
                let width = (text.length * size / 1.5);
                let rec = foundry.data.ShapeData.TYPES.RECTANGLE;;
                
                await DrawingDocument.create({
                    type: rec,
                    author: game.user.id,
                    x: x,
                    y: y,
                    shape:{
                        width: width,
                        height: height
                    },
                    fillType: CONST.DRAWING_FILL_TYPES.SOLID,
                    interface: true,
                    fillColor: game.settings.get("fate-core-official", "fuAspectLabelFillColour"),
                    fillAlpha: game.settings.get("fate-core-official", "fuAspectLabelFillAlpha"),
                    strokeWidth: 4,
                    strokeColor: game.settings.get("fate-core-official", "fuAspectLabelBorderColour"),
                    strokeAlpha: game.settings.get("fate-core-official", "fuAspectLabelBorderAlpha"),
                    text: text,
                    fontFamily: font,
                    fontSize: size,
                    textColor: game.settings.get("fate-core-official", "fuAspectLabelTextColour"),
                    points: []
                }, {parent: game.scenes.viewed});   
                await canvas.drawings.activate();
        }
        else {
            ui.notifications.error(game.i18n.localize("fate-core-official.AlreadyANoteForThatAspect"));
        }
    }

    async _addToScene(event){
        let index=event.target.id.split("_")[1];
        let value=this.element.querySelector(`input[id="${index}_free_invokes"]`).value;
        let name = game.scenes.viewed.getFlag("fate-core-official","situation_aspects")[index].name;
        
        this.addAspectDrawing(value, name, canvas.stage.pivot._x, canvas.stage.pivot._y);
    }

    async _del_sit_aspect(event){
        let del =   fcoConstants.confirmDeletion();
        if (del){
            let id = event.target.id;
            let index = id.split("_")[1];
            let situation_aspects = foundry.utils.duplicate(game.scenes.viewed.getFlag("fate-core-official", "situation_aspects"));
            let name = situation_aspects[index].name;
            situation_aspects.splice(index,1);
            game.scenes.viewed.setFlag("fate-core-official","situation_aspects",situation_aspects);
        
            //If there's a note on the scene for this aspect, delete it
            let drawing = undefined;

            if (name !="") {
                drawing = canvas?.drawings?.objects?.children?.find(drawing => drawing?.document.text?.startsWith(name));
            }
            if (drawing != undefined){
                game.scenes.viewed.deleteEmbeddedDocuments("Drawing", [drawing.id]);
            }
        }
    }

    async _add_sit_aspect(event){
        let situation_aspects = [];
        let situation_aspect = {
                                    "name":"",
                                    "free_invokes":0
                                };
        try {
            situation_aspects = foundry.utils.duplicate(game.scenes.viewed.getFlag("fate-core-official","situation_aspects"));
        } catch {
        }                                
        situation_aspects.push(situation_aspect);
        game.scenes.viewed.setFlag("fate-core-official","situation_aspects",situation_aspects);
    }

    async _add_sit_aspect_from_track(event){
        let aspect = event.target.dataset.trackaspectbutton.split("_")[1];
        let name = event.target.id.split("_")[0];
        let text = name + " ("+aspect+")";
        let situation_aspects = [];
        let situation_aspect = {
                                    "name":text,
                                    "free_invokes":1,
                                    "linked":true
                                };
        try {
            situation_aspects = foundry.utils.duplicate(game.scenes.viewed.getFlag("fate-core-official","situation_aspects"));
        } catch {
        }
        let exists = false;
        situation_aspects.forEach(aspect => {
           if (aspect.name === text) {
                exists = true;
           } 
        })
        if (!exists){
            situation_aspects.push(situation_aspect);
            game.scenes.viewed.setFlag("fate-core-official","situation_aspects",situation_aspects);
       } else {
       }
    }

    async _saveNotes(event){
        this.editing=false;
    }

    async _clear_fleeting(event){
        let tokens = game.scenes.viewed.tokens.contents;
        let updates = [];
        let tokenUpdates = [];

        for (let i = 0; i<tokens.length; i++){
            let tracks = {};    
            let actor = tokens[i].actor;
            if (actor == null || actor == undefined) continue;

            if (actor?.system?.tracks != undefined) {
                tracks = foundry.utils.duplicate(actor.system.tracks);
                for (let t in tracks){
                    let track = tracks[t];
                    if (track.recovery_type == "Fleeting"){
                        for (let i = 0; i < track.box_values.length; i++){
                            track.box_values[i] = false;
                        }
                        if (track?.aspect?.name != undefined){
                            track.aspect.name = "";
                        }
                    }
                }
                if (!actor.isToken){  
                    updates.push({"_id":actor.id, "system.tracks":tracks});
                } else {
                    tokenUpdates.push({"_id":tokens[i].id, "delta.system.tracks":tracks});
                }    
            }
        } 
        await Actor.updateDocuments(updates);
        await game.scenes.viewed.updateEmbeddedDocuments("Token", tokenUpdates);
    }

    async _on_aspect_change(event){
        let data = event.target.dataset.tokenaspect;
        let parts = data.split("_");
        let t_id = parts[0];
        let name = parts[1];
        let text = event.target.value;
        let token = game.scenes.viewed.getEmbeddedDocument("Token", t_id);
        let tracks = foundry.utils.duplicate(token.actor.system.tracks);
        let key = fcoConstants.gkfn(tracks, name);
        let track = tracks[key]
        track.aspect.name=text;
        let previousText = `${token.actor.system.tracks[key].aspect.name} (${token.actor.name})`;
        token.actor.update({[`system.tracks.${key}.aspect`]:track.aspect})

        // See if this aspect exists in the list of game aspects and update it if so.
        let newText = `${text} (${token.actor.name})`;

        let situation_aspects = foundry.utils.duplicate(game.scenes.viewed.getFlag("fate-core-official","situation_aspects"));
        let aspect = situation_aspects.find(aspect => aspect.name == previousText);

        if (aspect == undefined){
            return;
        }
        if (text == ""){
            situation_aspects.splice(situation_aspects.indexOf(aspect),1);
            await game.scenes.viewed.setFlag("fate-core-official","situation_aspects",situation_aspects);
            let d = canvas?.drawings?.objects?.children?.find(drawing => drawing?.document.text?.startsWith(previousText));
            try {
                game.scenes.viewed.deleteEmbeddedDocuments("Drawing", [d.id])
            } catch (err) {
            }
            return;
        }
        aspect.name = newText;

        await game.scenes.viewed.setFlag("fate-core-official","situation_aspects",situation_aspects);

        let drawing = undefined;
        if (aspect.name != "") {
            drawing = canvas?.drawings?.objects?.children?.find(drawing => drawing?.document.text?.startsWith(previousText));
        }

        if (drawing != undefined){
            let text;
            let value = aspect.free_invokes;
            if (value == 1){
                text = aspect.name+` (${value} ${game.i18n.localize("fate-core-official.freeinvoke")})`;    
            } else {
                text = aspect.name+` (${value} ${game.i18n.localize("fate-core-official.freeinvokes")})`;
            }
            let size = game.settings.get("fate-core-official","fuAspectLabelSize");
            
            // Setup the aspect label font according to the user's settings
            let font = game.settings.get("fate-core-official","fuAspectLabelFont");
            if (FontConfig.getAvailableFonts().indexOf(font) == -1){
                 // What we have here is a numerical value (or font not found in config list; nothing we can do about that).
                font = FontConfig.getAvailableFonts()[game.settings.get("fate-core-official","fuAspectLabelFont")]
            }

            if (size === 0){
                size = Math.floor(game.scenes.viewed.width*(1/100));
                if (size < 8) size = 8;
                if (size > 256) size = 256;
            }
            let height = size * 2;
            let width = (text.length * size) / 1.5;
            await drawing.document.update({
                "text":text,
                width: width,
                height: height,
                fontFamily: font,
            });
        }
    }

    async _on_click_box(event) {
        let id = event.target.id;
        let parts = id.split("_");
        let name = parts[0]
        let index = parts[1]
        let checked = parts[2]
        let t_id = parts[3]
        index = parseInt(index)
        if (checked == "true") {
            checked = true
        }
        if (checked == "false") {
            checked = false
        }
        let token = game.scenes.viewed.getEmbeddedDocument("Token", t_id);
        let tracks = foundry.utils.duplicate(token.actor.system.tracks);
        let key = fcoConstants.gkfn(tracks, name);
        let track = tracks[key]
        track.box_values[index] = checked;
        await token.actor.update({
            // By using this format, we can JUST update the box_values attribute.
            ["system.tracks"]:{[key]:{["box_values"]:track.box_values}}
        })
    }

    async _on_cd_box_click(event){
        let countdowns = game.settings.get("fate-core-official","countdowns");
        let data = event.target.id.split("_");
        let key = data[0];
        let box = data[1]
        let checked = event.target.checked;
        let countdown = countdowns[key];
        countdown.boxes[box] = checked;
        await game.settings.set("fate-core-official","countdowns",countdowns);
        await game.socket.emit("system.fate-core-official",{"render":true});
        await this.render(false);
    }

    async _on_delete_cd(event){
        let del = await fcoConstants.confirmDeletion();
        if (del){
            let data = event.target.id.split("_");
            let countdowns = game.settings.get("fate-core-official", "countdowns");
            delete countdowns[data[0]];
            await game.settings.set("fate-core-official", "countdowns", countdowns);
            await game.socket.emit("system.fate-core-official",{"render":true});
            await this.render(false);
        }
    }

    async _on_toggle_cd_visibility(event){
        this.editing = false;
        let data = event.target.id.split("_");
        let countdowns = game.settings.get("fate-core-official", "countdowns");
        let countdown = countdowns[data[0]];
        let vis = countdown.visible;
        // Valid values are visible, hidden, show_boxes

        let shift_down = game.system["fco-shifted"];    

        if (shift_down){
            if (vis == "hidden") countdown.visible = "visible";
            if (vis == "show_boxes") countdown.visible = "hidden";
            if (vis == "visible") countdown.visible = "show_boxes";
        } else {
            if (vis == "hidden") countdown.visible = "show_boxes";
            if (vis == "show_boxes") countdown.visible = "visible";
            if (vis == "visible") countdown.visible = "hidden";    
        }

        await game.settings.set("fate-core-official", "countdowns", countdowns);
        await game.socket.emit("system.fate-core-official",{"render":true});
        await this.render(false);
    }

    // Change name/desc on losing focus to editable divs
    async _timed_event (event){
        let te = new TimedEvent();
        te.createTimedEvent();
    }

    async _onPopcornButton(event){
        let type = event.target.id.split("_")[1];
        let id = event.target.id.split("_")[0];

        if (type.startsWith("act")){
            let combatants = game.combat.combatants;
            let combatant = combatants.find(comb => comb.token.id == id);
            await combatant.setFlag("fate-core-official","hasActed", true);
            await game.socket.emit("system.fate-core-official",{"yourTurn":true, "tokenId":id});
            // Set combat tracker turn to index of current actor
            game.combat.update({turn:game.combat.turns.indexOf(combatant)});
        }

        if (type === "unact"){
            let combatants = game.combat.combatants;
            let combatant = combatants.find(comb => comb.token.id == id);
            await combatant.setFlag("fate-core-official","hasActed", false);
        }

        if (type === "find"){
            let t_id = id;
            let combatants = game.combat.combatants;
            let combatant = combatants.find(comb => comb.token.id == id);
            let token = combatant.token;
            //let token = game.scenes.viewed.getEmbeddedDocument("Token", t_id);
            if (game.combat.scene){
                canvas.animatePan(token.object, 5);
                if (token.isOwner) {
                    token.object.control({releaseOthers:true});
                }
            } else {
                if (combatant.sceneId){
                    let scene = game.scenes.get(combatant.sceneId);
                    if (scene.permission > 0){
                        await game.scenes.get(combatant.sceneId).view();
                        canvas.animatePan(token.object, 5);
                        if (token.isOwner) {
                            token.object.control({releaseOthers:true});
                        }   
                    } else {
                        ui.notifications.info(game.i18n.localize("fate-core-official.nopermissionsforscene"));
                    }
                }
            }
            
        }

        if (type === "sheet"){
            let t_id = id;
            let combatants = game.combat.combatants;
            let combatant = combatants.find(comb => comb.token.id == id);
            let token = combatant.token;
            const sheet = token.actor.sheet;

            if (sheet.rendered){
                sheet.maximize();
                sheet.bringToFront();
            } else {
                sheet.render(true);
            }
        }
    }

    async _onPopcornRemove(event){
        let id = event.target.id.split("_")[0];
        let combatants = game.combat.combatants;
        let combatant = combatants.find(comb => comb.token.id == id);
        combatant.delete();
    }

    async _endButton(event){
        let fin = await Promise.resolve(game.combat.endCombat());
    }

    async _nextButton(event){
        let combatants = game.combat.combatants;
        let updates = [];

        for (let comb of combatants){
            updates.push({"_id":comb.id, "flags.fate-core-official.hasActed":false})
        }
        await game.combat.updateEmbeddedDocuments("Combatant", updates);
        if (game.combat.round == 0) game.combat._playCombatSound("startEncounter")
        game.combat.update({turn:null, round:game.combat.round+1});
    }

    

async _prepareContext(){
    //Let's prepare the data for the initiative tracker here
    //Check if we're using an initiative skill, if so disable the initiative tracker in favour of using the default one
    let init_skill = game.settings.get("fate-core-official","init_skill");
    let tracker_disabled = false;
    
    if (init_skill !== "None" || init_skill === "Disabled"){
        tracker_disabled = true;
    }
    
    const data = {};
    data.tabGroups = this.tabGroups;
    data.tabs = this.getTabs();

    if (game.combat==null || tracker_disabled){
        data.conflict = false;
    } else {
        data.conflict = true;
        data.conflictName = game.combat.getFlag("fate-core-official","name");
        data.conflictExchange = game.combat.round;
        if (!data.conflictName) {
            let conflictNum = game.combats.combats.indexOf(game.combat)+1;
            data.conflictName = game.i18n.localize("fate-core-official.word_for_conflict") + " "+conflictNum;
        }

        //Let's build a list of the tokens from game.scenes.viewed.tokens.contents and feed them to the presentation layer
        let c = game.combat.combatants;
        let tokens = [];
        let has_acted = [];

        c.forEach(comb => {
            let foundToken = comb.token;
            let hidden = false;
            let hasActed = false;
            let ignore = false;

            if (foundToken == undefined){
                return;
            }

            // Check the FU ignore list
            let ignore_list = game.settings.get("fate-core-official","fu-ignore-list");
            
            if (ignore_list){
                let ignore_array = ignore_list.split(",");
                for (let check of ignore_array){
                    if (foundToken.actor.name.startsWith(check) || foundToken.name.startsWith(check)){
                        ignore = true;
                    }
                }
            }

            if (comb.defeated || (comb?.actor?.type !== "fate-core-official" && comb?.actor?.type !== "Thing")){
                hidden = true;
            }

            if ((comb.hidden || foundToken.hidden) && !game.user.isGM){
                hidden = true;
            } 

            hasActed = comb.getFlag("fate-core-official","hasActed");                       
                    
            if (!ignore && (hasActed == undefined || hasActed == false) && hidden == false){
                tokens.push(foundToken)
            }
            else {
                if (!ignore && hasActed == true && hidden == false){
                    has_acted.push(foundToken);
                }
            }
        })
        
        fcoConstants.sort_key(has_acted,"name");
        fcoConstants.sort_key(tokens,"name");
        data.has_acted_tokens = has_acted;
        data.combat_tokens=tokens;
        data.exchange = game.combat.round;   
    }
    let all_tokens = [];
    let notes = game?.scenes?.viewed?.getFlag("fate-core-official","sceneNotes");
    let richNotes = await fcoConstants.fcoEnrich(game?.scenes?.viewed?.getFlag("fate-core-official","sceneNotes"));
    if (notes == undefined){
        notes = ""
    }
    data.notes = notes;
    data.richNotes = richNotes;
    game?.scenes?.viewed?.tokens?.contents?.forEach(token => {
        let ignore = false;
        if (!token?.actor) ignore = true;
        if (token?.actor?.type !== "fate-core-official") ignore = true;
        if (token.hidden == true && !game.user.isGM) ignore = true;
    
        // Check the FU ignore list
        let ignore_list = game.settings.get("fate-core-official","fu-ignore-list");
        
        if (ignore_list){
            let ignore_array = ignore_list.split(",");
            for (let check of ignore_array){
                if (token?.actor?.name.startsWith(check) || token.name.startsWith(check)){
                    ignore = true;
                }
            }
        }

        if (!ignore){
            all_tokens.push(token)
        }
    })

    let situation_aspects = game?.scenes?.viewed?.getFlag("fate-core-official","situation_aspects")
    if (situation_aspects == undefined){
        situation_aspects = [];
    }
    situation_aspects = foundry.utils.duplicate(situation_aspects);
    
    data.situation_aspects = situation_aspects;
    fcoConstants.sort_key(all_tokens, "name");
    data.all_tokens = all_tokens;

    let enriched_tokens = {};
    for (let tk of all_tokens){
        let ass = foundry.utils.duplicate(tk.actor.system.aspects);
        let trks = foundry.utils.duplicate(tk.actor.system.tracks);
        for (let as in ass){
            ass[as].richNotes = await fcoConstants.fcoEnrich(ass[as].notes);
        }
        for (let tk in trks) {
            trks[tk].richNotes = await fcoConstants.fcoEnrich(trks[tk].notes);
        }
        enriched_tokens[tk.id]={aspects:ass, tracks:trks};
    }
    data.enriched_tokens = enriched_tokens;
    data.GM=game.user.isGM;
    
    let GMUsers={};
    game.users.contents.forEach(user => {
        if (user.isGM){
            GMUsers[user.name]=user;
            GMUsers[user.name]["fatepoints"]=user.getFlag("fate-core-official","gmfatepoints")
        }
    })
    data.GMUsers = GMUsers;

    data.category=this.category;
    let categories = new Set();
    for (let token of all_tokens){
        for (let t in token.actor.system.tracks){
            categories.add(token.actor.system.tracks[t].category);
        }
    }
    data.categories = Array.from(categories);
    data.tokenAvatar = !game.settings.get("fate-core-official","fu_actor_avatars");

    //Let's get the list of Fate rolls made
    let rolls = game?.scenes?.viewed?.getFlag("fate-core-official","rolls");
    if (rolls == undefined){
        rolls = [];
    }
    data.rolls = foundry.utils.duplicate(rolls);
    
    for (let roll of data.rolls){
        roll.richFlavor = await fcoConstants.fcoEnrich(roll.flavor);
    }

    data.user = game.user;
    let aspects = foundry.utils.duplicate(game.settings.get("fate-core-official","gameAspects"));
    if (game.combat?.scene){
        data.combatSceneName = game.combat.scene.name;
        data.pinned = true;
    } else {
        data.combatSceneName = game.i18n.localize("fate-core-official.unpinned");
        data.pinned = false;
    }

    aspects.forEach(async aspect => {
        aspect.rich_notes = await fcoConstants.fcoEnrich(aspect.notes)
    })

    data.game_aspects = aspects;
    data.game_time = game.settings.get("fate-core-official","gameTime");
    data.rich_game_time = await fcoConstants.fcoEnrich (game.settings.get("fate-core-official","gameTime"));
    data.game_notes = game.settings.get("fate-core-official","gameNotes");
    data.rich_game_notes = await fcoConstants.fcoEnrich (game.settings.get("fate-core-official","gameNotes"))
    data.fontSize = game.settings.get("fate-core-official","fuFontSize");
    data.height = this.position.height;
    data.actualGameAspectsHeight = document.getElementById("fu_game_aspects_container")?.offsetHeight;
    data.dateTimeHeight = document.getElementById("fu_date_and_time_container")?.offsetHeight;
    data.aspectsHeight = document.getElementById("fu_scene_sit_aspects_container")?.offsetHeight;
    data.cdHeight = document.getElementById("fu_scene_countdowns_container")?.offsetHeight;
    data.combatants_only = game.settings.get("fate-core-official","fu_combatants_only");

    if (data.combatants_only && data.conflict){
        let combatTokens = data.combat_tokens.concat(data.has_acted_tokens);
        data.all_tokens = combatTokens;
    }
    data.numConflicts = (game.combats.contents.filter(c => c.scene?.id == game?.scenes?.viewed?.id).length)+(game.combats.contents.filter(c => c.scene == null).length);
    
    let countdowns = foundry.utils.duplicate(game.settings.get("fate-core-official", "countdowns"));
    if (countdowns?.keys?.length < 1){
        data.countdowns = "none";
    }
    else {
        let cd_a = [];
        for (let cd in countdowns){
            countdowns[cd].richName = await await fcoConstants.fcoEnrich(countdowns[cd].name);
            countdowns[cd].richDesc = await await fcoConstants.fcoEnrich(countdowns[cd].description);
            cd_a.push(countdowns[cd]);
        }
        fcoConstants.sort_name(cd_a);

        data.countdowns = cd_a;
        data.cdownheight = 0;
        if (Object.keys(data.countdowns).length > 0) data.cdownheight = 200;
    }
    let aspectsHeight = situation_aspects.length * 45 ;
    data.fuPaneHeight = (this.position.height / 2) - 225; // Aspect pane height

    let modifier = data.fuPaneHeight - aspectsHeight;
    if (modifier < 0) modifier = 0;

    if (data.aspectsHeight > 0 && data.cdHeight > 0){
        data.fuNotesHeight = (this.position.height) - data.cdHeight - data.aspectsHeight - 225;
    } else {
        data.fuNotesHeight = (this.position.height) - 500 - data.cdownheight - data.fuPaneHeight + modifier;
    }

    if (data.actualGameAspectsHeight == 0 || data.actualGameAspectsHeight == undefined){
        data.gameAspectsHeight = data.game_aspects.length * 52 + 64 - 10; //Number of aspects * 52 pixels + H2 header - no padding on bottom aspect.
        if (game.user.isGM) data.gameAspectsHeight += 32; // Allow for the height of the 'add new aspect' button.
    } else {
        data.gameAspectsHeight = data.actualGameAspectsHeight
    }

    if (data.dateTimeHeight == 0 || data.dateTimeHeight == undefined) {
        if (game.user.isGM) {
            data.dateTimeHeight = 160;
        } else {
            data.dateTimeHeight = 111; // The date time notes field is smaller for non-GMs.
        }
    }
    data.gameNotesHeight = (this.position.height - data.dateTimeHeight - data.gameAspectsHeight - 65 - 150)
    if (data.gameNotesHeight < 0) data.gameNotesHeight = 75;
    data.aspectLabelWidth = game.settings.get("fate-core-official","aspectwidth");
    return data;
}

static async createCountdown (data){
    /**
     * Assign the project to an employee.
     * @param {Object} data - The parameters for the countdown to create
     * @param {array} data.boxes - Array of booleans representing the boxes for this countdown
     * @param {string} data.name - The countdown's name
     * @param {string} data.description - The countdown's description; usually includes triggers and outcome
     * @param {string} data.visible - Can be one of hidden, visible, or show_boxes
     */

    let countdown = {
        name:data.name,
        description:data.description,
        boxes:data.boxes,
        visible:data.visible
    }
    let countdowns = await foundry.utils.duplicate(game.settings.get("fate-core-official","countdowns"));
    let safeName = fcoConstants.getKey(countdown.name); 
    countdowns[safeName]=countdown;
    await game.settings.set("fate-core-official","countdowns",countdowns);
    await game.socket.emit("system.fate-core-official",{"render":true});
    this.fu.render(false);
}

async render(...args){
    if (!this.editing && !window.getSelection().toString()){
        await super.render(...args);
        if (!this.renderPending) {
                this.renderPending = true;
                await setTimeout(async () => {
                    await super.render(...args);
                    this.renderPending = false;
                }, 50);
        }
    } else this.renderBanked = true;
}

async renderMe(...args){
    let tab = this.tabGroups.fuApp;
    
    if (args[0][1]?.flags?.["fate-core-official"]?.rolls != undefined){
        // It was a roll.
        if (tab !== "rolls"){
            // change a boolean to remind us to update FateUtilities once the tab is changed, but don't re-render
            this.delayedRender = true;
            return;
        } 
    }

    if (args[0][0] === "scene"){
        if (tab !== "scene"){
            this.delayedRender = true;
            return;
        } 
    }

    if (args[0] === "controlToken"){
        // Use jquery to find the relevant token and highlight it in all relevant things.
        //args[1] == token id
        //args[2] == control true/false 

        if (args[2] === true){
            this.element.querySelectorAll(`.fu_${args[1]}`)?.forEach(element => element.classList?.add("fu_controlled"));
        }
        if (args[2] === false){
            this.element.querySelectorAll(`.fu_${args[1]}`).forEach(element => element.classList?.remove("fu_controlled"));
        }
        return;
    }
    //Code to execute when a hook is detected by fate-core-official. Will need to tackle hooks for Actor
    //Scene, User, and Combat.
    //The following code debounces the render, preventing multiple renders when multiple simultaneous update requests are received.
    if (!this.renderPending) {
        this.renderPending = true;
        setTimeout(async () => {
          await this.render(false);
          this.delayedRender = false;
          this.renderPending = false;
        }, 50);
      } 
    }
}

Hooks.on('ready', function()
{
    if (!canvas.ready && game.settings.get("core", "noCanvas")) {
        let fu = new FateUtilities().render(true);
    }
})

//v13This is now for v13 only!
Hooks.on('getSceneControlButtons', controls => {
    controls.tokens.tools.fateUtilities = {
      name: "fateUtilities",
      title: game.i18n.localize("fate-core-official.LaunchFateUtilities"),
      icon: "fas fa-theater-masks",
      onChange: async (event, active) => {
        if ( active ) {
            let fu = await foundry.applications.instances.get("FateUtilities") ?? new FateUtilities();
            await fu.render(true);
            fu.maximize();
        }
      },
      button: true
    };
  });

class acd extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
    constructor(fu) {
        super();
        this.fu = fu;
    }

    static DEFAULT_OPTIONS = {
        id: "addCountDown",
        tag: "form",
        classes: ['fate'],
        window: {
            icon: "fas fa-clock",
            title: this.title
        },
        form: {
            closeOnSubmit: true,
            submitOnClose: false,
            handler: acd.#onSubmit
        }
    }

    static PARTS = {
        acd: {
            template: "systems/fate-core-official/templates/new_cd_dialog.html",
        }
    }

    get title(){
        return game.i18n.localize("fate-core-official.addCountdown");
    }

    static async #onSubmit (event, form, formDataExtended){
        let data = formDataExtended.object;
        let box_values = [];
        if (data.boxes < 1) data.boxes = 1;
        if (data.boxes > 20) data.boxes = 20;

        for (let i = 0; i < data.boxes; i++){
            box_values.push(false);
        }

        let name = data.name;
        if (name == "") name = "New Countdown"

        let countdown = {
            name:name,
            description:data.description,
            boxes:box_values,
            visible:data.visible
        }
        
        let countdowns = await foundry.utils.duplicate(game.settings.get("fate-core-official","countdowns"));
        let safeName = fcoConstants.getKey(countdown.name); 
        countdowns[safeName]=countdown;
        await game.settings.set("fate-core-official","countdowns",countdowns);
        await game.socket.emit("system.fate-core-official",{"render":true});
        await this.fu.render(false);
    }

    _onRender(context, options){
        super._onRender(context, options);
    }
}

class TimedEvent {
    createTimedEvent(){
        var triggerRound=0;
        var triggerText="";
        var currentRound="NoCombat";
        try {
            currentRound = game.combat.round;
        } catch {
            var dp = {
                window:{"title": game.i18n.localize("fate-core-official.Error")},
                "content": `${game.i18n.localize("fate-core-official.NoCurrentCombat")}<p>`,
                "buttons": [{
                        label: game.i18n.localize("fate-core-official.OK"),
                        default: true
                }]
            }
            let d = new foundry.applications.api.DialogV2(dp);
            d.render(true);
        }
        if (currentRound != "NoCombat"){
            var peText = `${game.i18n.localize("fate-core-official.NoPendingEvents")}<p></p>`
            let pendingEvents = game.combat.getFlag("fate-core-official","timedEvents");
            if (pendingEvents != null || pendingEvents != undefined){
                peText=
                `<tr>
                    <td style="font-weight:bold">${game.i18n.localize("fate-core-official.Exchange")}</td>
                    <td style="font-weight:bold">${game.i18n.localize("fate-core-official.PendingEvent")}</td>
                </tr>`
                pendingEvents.forEach(event => {
                    if (event.complete === false){
                        peText+=`<tr><td>${event.round}</td><td>${event.event}</td></tr>`
                    }
                });
            }
            var dp = {
                window:{"title":game.i18n.localize("fate-core-official.TimedEvent")},
                "content":`<h3>${game.i18n.localize("fate-core-official.CreateATimedEvent")}</h3>
                            ${game.i18n.localize("fate-core-official.TheCurrentExchangeIs")} ${game.combat.round}.<p></p>
                            <table style="background:none; border:none">
                                ${peText}
                            </table>
                            <table style="background:none; border:none">
                                <tr>
                                    <td>${game.i18n.localize("fate-core-official.WhatIsYourEvent")}:</td>
                                    <td><input type="text" id="eventToCreate" name="eventToCreate" style="background: white; color: black;" autofocus></input></td>
                                </tr>
                                <tr>
                                    <td>${game.i18n.localize("fate-core-official.TriggerEventOnExchange")}:</td>
                                    <td><input type="number" value="${game.combat.round+1}" id="eventExchange" name="eventExchange"></input></td>
                                </tr>
                            </table>`,
                    "buttons":[{
                        action:"create",
                        label:game.i18n.localize("fate-core-official.Create"), 
                        callback:async (event, button, dialog) => {
                            //if no flags currently set, initialise
                            var timedEvents = game.combat.getFlag("fate-core-official","timedEvents");
                            
                            if (timedEvents ==null || timedEvents == undefined){
                                game.combat.setFlag("fate-core-official","timedEvents",[
                                                                                    {   "round":`${dialog.querySelector("#eventExchange").value}`,
                                                                                        "event":`${dialog.querySelector("#eventToCreate").value}`,
                                                                                        "complete":false
                                                                                    }
                                                                                ])
                                                                                timedEvents=game.combat.getFlag("fate-core-official","timedEvents");
                            } else {
                                timedEvents.push({   
                                                    "round":`${dialog.querySelector("#eventExchange").value}`,
                                                    "event":`${dialog.querySelector("#eventToCreate").value}`,
                                                    "complete":false
                                });
                                game.combat.setFlag("fate-core-official","timedEvents",timedEvents);
                                
                                }

                            triggerRound=document.getElementById("eventExchange").value;
                            triggerText=document.getElementById("eventToCreate").value;
                        },
                        default:true,
                    }]
                }
            let d = new foundry.applications.api.DialogV2(dp);
            d.render(true);
        }
    }
}

class FUAspectLabelClass extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
    static DEFAULT_OPTIONS = {
        tag: "form",
        id: "FUAspectLabelClass",
        window:{
            icon: "fas fa-cog",
            title: this.title
        },
        form: {
            handler: FUAspectLabelClass.#updateObject,
            closeOnSubmit: true,
            submitOnClose: false
        }
    }

    get title() {
        return game.i18n.localize("fate-core-official.fuAspectLabelSettingsTitle");
    }

    static PARTS = {
        FUAspectLabelClassForm: {
            template: "systems/fate-core-official/templates/FULabelSettings.html",
        }
    }

    static async #updateObject(event, form, formDataExtended){
        let formData = formDataExtended.object;
        let font = formData.fu_label_font;
        let size = formData.fu_font_size;
        if (size != 0 && size < 8) size = 8;
        if (size > 256) size = 256;
        let text = formData.fu_text_color;
        let fill = formData.fu_fill_color;
        let border = formData.fu_border_color;
        let border_alpha = formData.fu_border_alpha;
        let fill_alpha = formData.fu_fill_alpha;

        await game.settings.set("fate-core-official","fuAspectLabelFont", font);
        await game.settings.set("fate-core-official","fuAspectLabelSize", size);
        await game.settings.set("fate-core-official", "fuAspectLabelTextColour", text);
        await game.settings.set("fate-core-official", "fuAspectLabelFillColour", fill);
        await game.settings.set("fate-core-official", "fuAspectLabelBorderColour",border);
        await game.settings.set("fate-core-official", "fuAspectLabelBorderAlpha",border_alpha);
        await game.settings.set("fate-core-official", "fuAspectLabelFillAlpha",fill_alpha);

        this.close();
    }

    async _prepareContext (){
        let font = game.settings.get("fate-core-official","fuAspectLabelFont");
        if (FontConfig.getAvailableFonts().indexOf(font) == -1) font = FontConfig.getAvailableFonts()[font];
        
        return {
                    fonts:FontConfig.getAvailableFonts(),
                    currentFont:font,
                    fontSize:game.settings.get("fate-core-official", "fuAspectLabelSize"),
                    textColour:game.settings.get("fate-core-official","fuAspectLabelTextColour"),
                    fillColour:game.settings.get("fate-core-official","fuAspectLabelFillColour"),
                    borderColour:game.settings.get("fate-core-official","fuAspectLabelBorderColour"),
                    borderAlpha:game.settings.get("fate-core-official","fuAspectLabelBorderAlpha"),
                    fillAlpha:game.settings.get("fate-core-official", "fuAspectLabelFillAlpha")
                }
    }
}

Hooks.on("renderCombatTracker", () => {
    try {
        var r = game.combat.round;
        let pendingEvents = foundry.utils.duplicate(game.combat.getFlag("fate-core-official","timedEvents"));
        for (let i = 0; i<pendingEvents.length;i++){
            var event = pendingEvents[i];
            if (r==event.round && event.complete != true){
                fcoConstants.awaitOKDialog(game.i18n.localize("fate-core-official.TimedEvent"), `<h3 style="text-align:center; margin:0">${game.i18n.localize("fate-core-official.TimedEventForExchange")} ${event.round}</h3><p style="text-align:center; font-size:var(--font-size-18)">${event.event}</p>`)
                event.complete = true;
            }
        }
        game.combat.setFlag("fate-core-official","timedEvents", pendingEvents);
    }catch {

    }
})

function checkFormula(formula){
    let formulae = game.settings.get("fate-core-official","fu-roll-formulae").split(",");
    let validFormula = false;
    formula = formula.trim().toLowerCase();
    for (let i = 0; i < formulae.length; i++){
        let testFormula = formulae[i].trim().toLowerCase();
        if (formula == testFormula) validFormula = true;
    }
    return validFormula;
}

// In v13, renderChatMessage is switching to renderChatMessageHTML which passes an HTMLElement instead of JQuery as the second paramater.
// This means we'll need to switch to using queryselector and other HTML element methods instead of jQuery.
// I will need to replace this.element.querySelector with html.querySelector and targetElement.before with targetElement.insertAdjacentHTML("beforebegin", `htmltoinsert`)
// For this particular one I think I'll want afterend.
// OOOORRR instead of changing everything, we can use the quick and dirty $html = $(html); to convert it back to jQuery.
/* valid parameters are: 
    "beforebegin"
    Before the element. Only valid if the element is in the DOM tree and has a parent element.

    "afterbegin"
    Just inside the element, before its first child.

    "beforeend"
    Just inside the element, after its last child.

    "afterend"
After the element. Only valid if the element is in the DOM tree and has a parent element.
*/

Hooks.on("renderChatMessageHTML", (message, html, data) => {
    if (message.rolls.length < 1) return;
    if (!message.isContentVisible) return;
    let scene = game.scenes.viewed;
    let rolls = scene?.getFlag("fate-core-official", "rolls");
    let roll = undefined;
    if (rolls) roll = rolls.find(roll => roll.message_id == message.id);

    let r = message.rolls[0];

    // Get the core dice formula specified for this roll.
    let dice_formula = r?.options?.fco_formula;

    // If there's no dice formula stored, make a best effort guess at working it out from the formula.
    if (!dice_formula) dice_formula = r.formula.split("+")[0].split("-")[0].trim();

    if (!(r.formula.startsWith("4df") || r.formula.startsWith("4dF") || checkFormula (dice_formula?.toLowerCase()))) return

    let index = rolls?.indexOf(roll);
    const rollTotal = html.querySelector('.dice-total');
    let ladder = new fcoConstants().getFateLadder();
    let adjective = ladder[message.rolls[0].total];
    if (adjective) rollTotal.insertAdjacentHTML("beforeend",`<span> (${adjective})</span>`);

    if (!message.flavor.startsWith("<h1>Reroll") && (message.speaker.actor == game?.user?.character?.id || game.user.isGM)){
        let gmText = "";
        if (game.user.isGM) gmText = game.i18n.localize('fate-core-official.gmHoldShiftToSelectAspects');
        // Add roll buttons here

        const targetElement = html.querySelector('.flavor-text');
        if (targetElement){
            targetElement.insertAdjacentHTML("beforeend",` 
                <div>
                    <table style="background:transparent; width:15em; border:none">
                        <tr style="background:transparent;">
                            <td style="padding:0">
                                <div style="display:flex;flex-direction:row;gap:2px; align-items:left">
                                    <div style="width:6em; text-align:left">${game.i18n.localize("fate-core-official.FreeActions")}</div>
                                    <button type="button" name="fco_chat_roll_button" data-msg_id="${message.id}" data-roll="roll_-1_plus1" style="border:2px groove var(--fco-foundry-interactable-color); background-color:var(--fco-sheet-input-colour); color:var(--fco-sheet-text-colour); width:35px; height:35px" title="${game.i18n.localize('fate-core-official.PlusOneExplainer')}">+1</button>
                                    <button type="button" name="fco_chat_roll_button" data-msg_id="${message.id}" data-roll="roll_-1_plus2free" style="border:2px groove var(--fco-foundry-interactable-color); background-color:var(--fco-sheet-input-colour); color:var(--fco-sheet-text-colour); width:35px; height:35px" title="${game.i18n.localize('fate-core-official.FreePlusTwoExplainer')} ${gmText}" i icon class="fas fa-plus"></button>
                                    <button type="button" name="fco_chat_roll_button" data-msg_id="${message.id}" data-roll="roll_-1_reroll" style="border:2px groove var(--fco-foundry-interactable-color); background-color:var(--fco-sheet-input-colour); color:var(--fco-sheet-text-colour); width:35px; height:35px" title="${game.i18n.localize('fate-core-official.FreeRerollExplainer')} ${gmText}" i icon class="fas fa-dice"></button>
                                    <button type="button" name="fco_chat_roll_button" data-msg_id="${message.id}" data-roll="roll_-1_manual" style="border:2px groove var(--fco-foundry-interactable-color); background-color:var(--fco-sheet-input-colour); color:var(--fco-sheet-text-colour); width:35px; height:35px" title="${game.i18n.localize('fate-core-official.manualExplainer')}" i icon class="fas fa-tools"></button>
                                </div>
                            </td>
                        </tr>
                        <tr style="background:transparent;">
                            <td style="padding:0">
                                <div style="display:flex;flex-direction:row;gap:2px; align-items:left">
                                    <div style="width:6em; text-align:left">${game.i18n.localize("fate-core-official.FatePointActions")}</div>
                                    <button type="button" name="fco_chat_roll_button" data-msg_id="${message.id}" data-roll="roll_-1_plus2fp" style="border:2px groove var(--fco-foundry-interactable-color); background-color:var(--fco-sheet-input-colour); color:var(--fco-sheet-text-colour); width:35px; height:35px" title="${game.i18n.localize('fate-core-official.PaidPlusTwoExplainer')}" i icon class="fas fa-plus"></button>
                                    <button type="button" name="fco_chat_roll_button" data-msg_id="${message.id}" data-roll="roll_-1_rerollfp" style="border:2px groove var(--fco-foundry-interactable-color); background-color:var(--fco-sheet-input-colour); color:var(--fco-sheet-text-colour); width:35px; height:35px" title="${game.i18n.localize('fate-core-official.PaidRerollExplainer')}" i icon class="fas fa-dice"></button>
                                    <button type="button" name="fco_chat_roll_button" data-msg_id="${message.id}" data-roll="roll_-1_manualfp" style="border:2px groove var(--fco-foundry-interactable-color); background-color:var(--fco-sheet-input-colour); color:var(--fco-sheet-text-colour); width:35px; height:35px" title="${game.i18n.localize('fate-core-official.manualExplainer')}" i icon class="fas fa-tools"></button>
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>
            `);
            const buttons = html.querySelectorAll("button[name='fco_chat_roll_button']");
            // This is how we add a click handler to an HTMLElement rather than a JQuery element.
            for (let button of buttons) button?.addEventListener("click", async event => {
                await FateUtilities._fu_roll_button(event);
            })
        }
    }
});

Hooks.on('createChatMessage', async (message) => {
    // We're only interested if this is a chat message with a roll in it, the roll isn't whispered, and the roll isn't blind
    if (message.rolls.length == 0 || message?.flavor?.startsWith("<h1>Reroll") || message.blind || message.whisper.length > 0){
        return;
    }

    // We only need to take action on this if we're the first logged-in GM.
    if (game.users.contents.find(user => user.active && user.isGM) == game.user){
        let roll = message.rolls[0];

        // Get the core dice formula specified for this roll.
        let dice_formula = roll?.options?.fco_formula;

        // If there's no dice formula stored, make a best effort guess at working it out from the formula.
        if (!dice_formula) dice_formula = roll.formula.split("+")[0].split("-")[0].trim();

        if (roll.formula.startsWith("4df") || roll.formula.startsWith("4dF") || checkFormula (dice_formula?.toLowerCase())){
            //We're not interested in it unless it's a Fate roll.
            //If it is, we want to add this to the array of rolls in the scene's flags.
            let speaker = message.speaker.alias;
            let fullSpeaker = message.speaker;
            let flavor = message.flavor;
            let formula = roll.formula;
            let total = roll.total;
            let message_id = message.id;

            if (!flavor) {
                flavor = formula.replace(/ *\[[^\]]*]/g, '')+"<br/>";
                roll.terms.forEach(term => {
                    if (term.options.flavor){
                        flavor += term.options.flavor+"<br/>"
                    }
                });
            }
            let dice ="";
            let diceResult = message.rolls[0].dice[0].values;
            if (diceResult == undefined){
                let d = message.roll.dice[0].rolls;
                diceResult = [];
                for (let i=0; i< d.length; i++){
                    diceResult.push(d[i].roll)
                }
            }
            let user = {name:message.author.name, _id:message.author._id};
            let rolls = game?.scenes?.viewed?.getFlag("fate-core-official","rolls");
            if (rolls == undefined){
                rolls = [];
            }
            rolls=foundry.utils.duplicate(rolls);
            
            let mFRoll = {
                "message_id":message_id,
                "speaker":speaker,
                "fullSpeaker":fullSpeaker,
                "formula":formula,
                "dice_formula":dice_formula,
                "flavor":flavor,
                "total":total,
                "dice":diceResult,
                "user":user,
                "roll":roll
            }
            rolls.push(mFRoll);
            await game.scenes?.viewed?.setFlag("fate-core-official","rolls",rolls);
        }
    }
})

Hooks.once('ready', async function () {
    game.socket.on("system.fate-core-official", rolls => {
        if (game.user == game.users.activeGM) {
            updateRolls(rolls);
        }
    })

    game.socket.on("system.fate-core-official", render => {
        if (render.render){
            let FU = foundry.applications.instances.get("FateUtilities");
            if (FU != undefined){
                let tab = FU.tabGroups.fuApp;

                if (tab !== "game_info" && tab !== "scene"){
                    FU.delayedRender = true; 
                    return;
                } else {
                    FU.render(false);
                }
            }
        }
    })

    game.socket.on("system.fate-core-official", yourTurn => {
        if (yourTurn.yourTurn) {
            let combatant = game.combat.combatants.find(comb => comb.token.id == yourTurn.tokenId);
            if (combatant && !game.user.isGM && combatant.isOwner) game.combat._playCombatSound("yourAction");
        }
    })
})

async function updateRolls (rolls) {
    if (rolls.rolls != undefined && game.users.contents.find(user => user.active && user.isGM) == game.user){
        let scene = game.scenes.get(rolls.scene._id);
        let currRolls = scene.getFlag("fate-core-official","rolls"); 
        if (currRolls == undefined){
            currRolls = [];
        }
        currRolls = foundry.utils.duplicate(currRolls);
        let endRolls = foundry.utils.mergeObject(currRolls, rolls.rolls);
        scene.setFlag("fate-core-official","rolls",endRolls);
        for (let r of endRolls){
            let message;
            if (r.message_id) message = game.messages.get(r.message_id)
            if (message) {
                let mrolls = foundry.utils.duplicate(message.rolls);
                mrolls[0].total = r.total;
                await message.update({flavor:r.flavor, content:r.total, rolls:mrolls})
            }
        }
    }
}

Hooks.on("renderFateUtilities", async function(){
    let numAspects = document.getElementsByName("sit_aspect").length;
    if (numAspects == undefined){
        numAspects = 0;
    }
    if (game.system.sit_aspects == undefined){
        game.system.sit_aspects = numAspects;
    }
    
    if (numAspects > game.system.sit_aspects){
        let pane = document.getElementById("fu_aspects_pane");
        await setTimeout(async () => {
            pane.scrollTop=pane.scrollHeight;
            game.system.sit_aspects = numAspects;
        }, 50);
    }
    
    if (numAspects < game.system.sit_aspects){
        game.system.sit_aspects = numAspects;
    }

    let numRolls = document.getElementsByName("fu_roll").length;
    if (numRolls == undefined){
        numRolls = 0;
    }
    if (game.system.num_rolls == undefined){
        game.system.num_rolls = numRolls;
    }
    
    if (numRolls > game.system.num_rolls){
        let pane = document.getElementById("fu_rolls_tab")
        await setTimeout(async () => {
            pane.scrollTop=pane.scrollHeight;
            game.system.num_rolls = numRolls;
        }, 50);
    }
    
    if (numRolls < game.system.num_rolls){
        game.system.num_rolls = numRolls;
    }
})

Hooks.on ('dropCanvasData', async (canvas, data) => {
    if (data.type =="situation_aspect") {
        let aspect = game.scenes.viewed.getFlag("fate-core-official","situation_aspects")[data.aspect].name;
        let value = data.value;
        let x = data.x;
        let y = data.y;
        let f = new FateUtilities();
        f.addAspectDrawing(value, aspect, x, y);
    }
})