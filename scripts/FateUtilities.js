class FateUtilities extends Application{
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

    async close(options){
        game.system.apps["actor"].splice(game.system.apps["actor"].indexOf(this),1); 
        game.system.apps["combat"].splice(game.system.apps["combat"].indexOf(this),1); 
        game.system.apps["scene"].splice(game.system.apps["scene"].indexOf(this),1); 
        game.system.apps["user"].splice(game.system.apps["user"].indexOf(this),1); 
        await super.close(options);
    }

    _onResize(event){
        super._onResize(event);
        this._render(false);
    }

    activateListeners(html) {
        super.activateListeners(html);
        if (game.user.isGM){
            fcoConstants.getPen("game_notes");
            fcoConstants.getPen("scene_notes");
            fcoConstants.getPen("game_date_time");
            const countdowns = $('.cd_datum');
            countdowns.on('blur', event => this._on_cd_blur(event, html));
            countdowns.on('focus', event => {this.editing = true;})
            for (let c of countdowns){
                fcoConstants.getPen(c.id);
            }

            const roll_track = html.find("i[name='roll_track']");

            roll_track.on("click", async event => {
                let name = event.target.id;
                let uuid = event.currentTarget.getAttribute("data-uuid");
                let actor = await fromUuid(uuid);

                if (actor instanceof TokenDocument) {
                    actor = actor.actor;
                }

                let track = actor.system.tracks[name];

                if (track.rollable == "full" || track.rollable == "empty") {
                    let umr = false;
                    if (game.system["fco-shifted"] && !game.settings.get("fate-core-official","modifiedRollDefault")) umr = true;
                    if (!game.system["fco-shifted"] && game.settings.get("fate-core-official","modifiedRollDefault")) umr = true;
                    if (!umr) await actor.rollTrack(track.name);
                    if (umr) await actor.rollModifiedTrack(track.name);
                }
            })

            const countdowns_rich = $('.cd_datum_rich');
            countdowns_rich.on('click', async event => {
                if (event.target.outerHTML.startsWith("<a data")) return;
                let id = event.currentTarget.id.split("_rich").join("");
                $(`#${id}_rich`).css('display', 'none');
                $(`#${id}`).css('display', 'block');
                $(`#${id}`).focus();
            })

            const pinConflict = $('.fco-pin-conflict');
            pinConflict.on('click', async event => {
                let pinned = game.combat.scene;
                if (!pinned) await game.combat.update({scene:game.scenes.viewed.id});
                if (pinned) await game.combat.update({scene:null});
            })

            const id_conflict = html.find('input[id="conflict_name_input"]');
            id_conflict.on("change", async event => {
                let new_name = event.currentTarget.value;
                await game.combat.setFlag("fate-core-official","name",new_name);
            })

            countdowns_rich.on('contextmenu', async event => {
                let text = await fcoConstants.updateText("Edit raw HTML", event.currentTarget.innerHTML);
                if (text != "discarded") {
                    for (let c of countdowns){
                        if (event.currentTarget.id.startsWith(c.id)){
                            c.innerHTML = text;
                            event.currentTarget.innerHTML = text;
                            $(`#${c.id}`).trigger('blur');
                        }
                    }
                }
            })

            const game_notes_rich = $('#game_notes_rich');
            game_notes_rich.on('click', event => {
                if (event.target.outerHTML.startsWith("<a data")) return;
                $('#game_notes_rich').css('display', 'none');
                $('#game_notes').css('display', 'block');
                $('#game_notes').focus();
            })

            game_notes_rich.on('contextmenu', async event => {
                let text = await fcoConstants.updateText("Edit raw HTML", event.currentTarget.innerHTML);
                if (text != "discarded") {
                    $('#game_notes')[0].innerHTML = text;
                    event.currentTarget.innerHTML = text;
                    $('#game_notes').trigger('blur');
                }
            })

            const scene_notes_rich = $('#scene_notes_rich');
            scene_notes_rich.on('click', event => {
                if (event.target.outerHTML.startsWith("<a data")) return;
                $('#scene_notes_rich').css('display', 'none');
                $('#scene_notes').css('display', 'block');
                $('#scene_notes').focus();
            })

            scene_notes_rich.on('contextmenu', async event => {
                let text = await fcoConstants.updateText("Edit raw HTML", event.currentTarget.innerHTML);
                if (text != "discarded") {
                    $('#scene_notes')[0].innerHTML = text;
                    event.currentTarget.innerHTML = text;
                    $('#scene_notes').trigger('blur');
                }
            })

            const game_date_time_rich = $('#game_date_time_rich');
            game_date_time_rich.on('click', event => {
                if (event.target.outerHTML.startsWith("<a data")) return;
                $('#game_date_time_rich').css('display', 'none');
                $('#game_date_time').css('display', 'block');
                $('#game_date_time').focus();
            })

            game_date_time_rich.on('contextmenu', async event => {
                let text = await fcoConstants.updateText("Edit raw HTML", event.currentTarget.innerHTML);
                if (text != "discarded") {
                    $('#game_date_time')[0].innerHTML = text;
                    event.currentTarget.innerHTML = text;
                    $('#game_date_time').trigger('blur');
                }
            })

        }
        const cd_del = html.find('button[name="delete_cd"]');
        cd_del.on('click', event => this._on_delete_cd(event, html));

        const toggle_cd_visibility = html.find('button[name="toggle_cd_visibility"]');
        toggle_cd_visibility.on('click', event => this._on_toggle_cd_visibility(event, html));

        const addConflict = html.find('button[id="add_conflict"]');
        addConflict.on("click", async (event) => {
            let cbt = await Combat.create({scene: game.scenes.viewed.id});
            await cbt.activate();
            ui.combat.initialize({cbt});
        })

        const nextConflict = html.find('button[id="next_conflict"]');
        nextConflict.on("click", async (event) => {
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

        const input = html.find('input[type="text"], input[type="number"], .contenteditable');
        
        //Ensure that if a button is tabbed to or clicked, the window's selection is cleared to prevent any rendering issues.
        const button = html.find('button[type="button"]');
        button.on("focus", event => {
            window.getSelection().removeAllRanges();
        })

        input.on("keyup", event => {
            if (event.keyCode === 13 && event.target.type == "input") {
                input.blur();
            }
        })

        input.on("focus", event => {
            if (this.editing == false) {
                this.editing = true;
            }
        });

       input.on("blur", event => {
           if (this.renderBanked){
                this.renderBanked = false;
                this._render(false);
            }
            this.editing = false;
        });

        const fontDown = html.find("button[id='fu_shrink_font']");
        const fontUp = html.find("button[id='fu_grow_font']");

        fontUp.on("click", async event => {
            let font = game.settings.get("fate-core-official","fuFontSize");
            font +=1;
            if (font > 20){
                font = 20;
                ui.notifications.info("")
            }
            await game.settings.set ("fate-core-official","fuFontSize",font);
            await this._render(false);
        })

        fontDown.on("click", async event => {
            let font = game.settings.get("fate-core-official","fuFontSize");
            font -=1;
            if (font < 4){
                font = 4;
            }
            await game.settings.set ("fate-core-official","fuFontSize",font);
            await this._render(false);
        })

        const iseAspects = html.find("button[name='iseAspects']");
        iseAspects.on("click", event => this.iseAspect(event, html));

        const maximiseAspects = html.find("button[id='maximiseAllAspects']");
        const minimiseAspects = html.find("button[id='minimiseAllAspects']");

        maximiseAspects.on("click", event => {
            game.scenes.viewed.tokens.contents.forEach(token => token.aspectsMaximised = true);
            this._render(false);
        })

        minimiseAspects.on("click", event => {
            game.scenes.viewed.tokens.contents.forEach(token => token.aspectsMaximised = false);
            this._render(false);
        })

        const maximiseTracks = html.find("button[id='maximiseAllTracks']");
        const minimiseTracks = html.find("button[id='minimiseAllTracks']");

        maximiseTracks.on("click", event => {
            game.scenes.viewed.tokens.contents.forEach(token => token.tracksMaximised = true);
            this._render(false);
        })

        minimiseTracks.on("click", event => {
            game.scenes.viewed.tokens.contents.forEach(token => token.tracksMaximised = false);
            this._render(false);
        })

        const iseTracks = html.find("button[name='iseTracks']");
        iseTracks.on("click", event => this.iseTrack(event, html));

        const expandAspectNotes = html.find("div[name='FUexpandAspect']");
        expandAspectNotes.on("click", event => {
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
            this._render(false);
        })

        const fu_combatants_toggle = html.find("i[id='toggle_fu_combatants']");
        fu_combatants_toggle.on("click", async (event) => {
            let toggle = game.settings.get("fate-core-official","fu_combatants_only");
            if (toggle) {
                await game.settings.set("fate-core-official","fu_combatants_only",false);
            } else {
                await game.settings.set("fate-core-official","fu_combatants_only",true);
            }
            this._render(false);
        })

        const expandGameAspectNotes = html.find("button[name='FUexpandGameAspect']");
        expandGameAspectNotes.on("click", event => {
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
            this._render(false);
        })

        const FUGameAspectNotes = html.find("textarea[name='FUGameAspectNotesText']");
        FUGameAspectNotes.on("a", event => {
            let details = event.target.id.split("_");
            let aspectName = details[1];
            let aspects = duplicate(game.settings.get("fate-core-official", "gameAspects"));
            let aspect = aspects.find(a => a.name == aspectName);
            aspect.notes = event.target.value;
            game.settings.set("fate-core-official","gameAspects",aspects);
            game.socket.emit("system.fate-core-official",{"render":true});
        });

        const gameAspect = html.find("input[name='game_aspect']");
        gameAspect.on("change", async (event) => {
            let index = event.target.id.split("_")[0];
            let aspects = duplicate(game.settings.get("fate-core-official", "gameAspects")); // Should contain an aspect with the current name.
            let aspect = aspects[index];
            aspect.name = event.target.value;
            await game.settings.set("fate-core-official","gameAspects",aspects);
            await game.socket.emit("system.fate-core-official",{"render":true});
            this._render(false);
        })

        const trackNotesRich = html.find('div[name="FUTrackNotesText_rich"]');
        trackNotesRich.on("click", event => {
            if (event.target.outerHTML.startsWith("<a data")) return;
            let id = event.currentTarget.id.split("_rich").join("");
            let richid = event.currentTarget.id;
            if (!richid) richid = event.target.id;
            fcoConstants.getPen(id);
            $(`#${richid}`).css('display', 'none');
            $(`#${id}`).css('display', 'block');
            $(`#${id}`).focus();
        })

        trackNotesRich.on('contextmenu', async event => {
            let text = await fcoConstants.updateText("Edit raw HTML", event.currentTarget.innerHTML);
            if (text != "discarded") {
                let id = event.cusrrentTarget.id.split("_rich").join("");
                $(`#${id}`)[0].innerHTML = text;
                event.currentTarget.innerHTML = text;
                $(`#${id}`).trigger('blur');
            }
        })

        const expandTrackNotes = html.find("div[name='FUexpandTrack']");
        
        expandTrackNotes.on("click", async event => {
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
        })

        const rollTab = html.find("a[data-tab='rolls']");
        rollTab.on("click", event => {
            if (this.delayedRender){
                this._render(false);
            }
        })

        const sceneTab = html.find("a[data-tab='scene']");
        sceneTab.on("click", event => {
            if (this.delayedRender){
                this._render(false);
            }
        })

        const gameInfoTab = html.find("a[data-tab='game_info']");
        gameInfoTab.on("click", event => {
            if (this.delayedRender){
                this._render(false);
            }
        })

        const tokenName = html.find("td[class='tName'], span[class='tName']");
        tokenName.on("dblclick", event => this.tokenNameChange(event, html));
        const popcornButtons = html.find("button[name='popcorn']");
        popcornButtons.on("click", event => this._onPopcornButton(event, html));
        popcornButtons.on("contextmenu", event => this._onPopcornRemove(event, html));

        const nextButton = html.find("button[id='next_exchange']");
        nextButton.on("click", event => this._nextButton(event, html));
        const endButton = html.find("button[id='end_conflict']");
        endButton.on("click", event => this._endButton(event, html));
        const timed_event = html.find("button[id='timed_event']");
        timed_event.on("click", event => this._timed_event(event, html));
        const category_select = html.find("select[id='category_select']")
        category_select.on("change", event => {
                this.category = category_select[0].value;
                this._render(false);
        })
        const track_name = html.find("div[name='track_name']");
        const box = html.find("input[class='fco-box']");
        const cd_box = html.find("input[name='cd_box']");
        cd_box.on('click', event => this._on_cd_box_click(event, html));

        box.on("click", event => this._on_click_box(event, html));
        const track_aspect = html.find("input[name='track_aspect']");
        track_aspect.on("change", event => this._on_aspect_change(event, html));

        const roll = html.find("button[name='roll']");
        roll.on("click", event => this._roll(event,html));

        const clear_fleeting = html.find("button[id='clear_fleeting']");
        clear_fleeting.on("click", event => this._clear_fleeting(event,html));

        const add_sit_aspect = html.find("button[id='add_sit_aspect']")
        add_sit_aspect.on("click", event => this._add_sit_aspect(event, html));

        const add_sit_aspect_from_track = html.find("button[name='track_aspect_button']")
        add_sit_aspect_from_track.on("click", event => this._add_sit_aspect_from_track(event, html));

        //Situation Aspect Buttons
        const del_sit_aspect = html.find("button[name='del_sit_aspect']");
        del_sit_aspect.on("click", event => this._del_sit_aspect(event, html));

        const addToScene = html.find("button[name='addToScene']");
        addToScene.on("click", event => this._addToScene(event, html));

        addToScene.on("dragstart", event => {
            let drag_data = {type:"situation_aspect", aspect:event.target.getAttribute("data-aspect"), value:event.target.getAttribute("data-value")};
            event.originalEvent.dataTransfer.setData("text/plain", JSON.stringify(drag_data));
        })

        const panToAspect = html.find("button[name='panToAspect']");
        panToAspect.on("click", event => this._panToAspect(event, html));

        const free_i = html.find("input[name='free_i']");
        free_i.on("change", event => this._free_i_button(event, html));

        const sit_aspect = html.find("input[name='sit_aspect']");
        sit_aspect.on("change", event => this._sit_aspect_change(event, html));

        const scene_notes = html.find("div[id='scene_notes']");
        scene_notes.on("focus", event => this.scene_notes_edit(event, html));
        scene_notes.on("blur", event => this._notesFocusOut(event,html));

        const gmfp = html.find("input[name='gmfp']");
        gmfp.on("change", event=> this._edit_gm_points(event, html));

        const playerfp = html.find("input[name='player_fps']");
        playerfp.on("change", event=> this._edit_player_points(event, html));

        const playerboosts = html.find("input[name='player_boosts']");
        playerboosts.on("change", event=> this._edit_player_boosts(event, html))

        const refresh_fate_points = html.find("button[id='refresh_fate_points']");
        refresh_fate_points.on("click", event => this.refresh_fate_points(event, html));    

        const avatar = html.find("img[name='avatar']");
        avatar.on("contextmenu", event=> this._on_avatar_click(event,html));
        
        avatar.on("click", async event => {
            let t_id = event.target.id.split("_")[0];
            let token = game.scenes.viewed.getEmbeddedDocument("Token", t_id);
            if (token.actor.sheet.rendered){
                token.actor.sheet.maximize();
                token.actor.sheet.bringToTop();
            } else {
                token.actor.sheet.render(true);
            }
        })

        const fu_clear_rolls = html.find("button[id='fu_clear_rolls']");
        fu_clear_rolls.on("click", event => this._fu_clear_rolls(event, html));

        const fu_adhoc_roll = html.find("button[id='fu_ad_hoc_roll']");
        fu_adhoc_roll.on("click", event => this._fu_adhoc_roll(event, html));

        const fu_roll_button = html.find("button[name='fu_roll_button']");
        fu_roll_button.on("click",event => {this._fu_roll_button(event, html), event.target.blur()});

        const select = html.find("select[class='skill_select']");

        select.on("focus", event => {
            this.selectingSkill = true;
        });

        select.on("click", event => {
            if (isNewerVersion(game.version, "9.230")){
                this.shift = game.system["fco-shifted"]
            } else {
                if (event.shiftKey) {this.shift = true}
            }
        })
        select.on("change", event => this._selectRoll (event, html));

        select.on("blur", event => {
            this.selectingSkill = false;
            this._render(false);
        })

        const FUAspectNotes_rich = html.find("div[name='FUAspectNotesText_rich']");
        FUAspectNotes_rich.on('click', event => {
            if (event.target.outerHTML.startsWith("<a data")) return;
            let id = event.currentTarget.id.split("_rich").join("");
            fcoConstants.getPen(id);
            $(`#${id}_rich`).css('display', 'none');
            $(`#${id}`).css('display', 'block');
            $(`#${id}`).focus();
        })

        FUAspectNotes_rich.on('contextmenu', async event => {
            let text = await fcoConstants.updateText("Edit raw HTML", event.currentTarget.innerHTML);
            if (text != "discarded") {
                let id = event.currentTarget.id.split("_rich").join("");
                $(`#${id}`)[0].innerHTML = text;
                event.currentTarget.innerHTML = text;
                $(`#${id}`).trigger('blur');
            }
        })

        const FUAspectNotes = html.find("div[name ='FUAspectNotesText']");
        FUAspectNotes.on("blur", async event => {
            if (!window.getSelection().toString()){
                let desc = DOMPurify.sanitize(event.target.innerHTML);
                let token_id = event.target.getAttribute("data-tokenid");
                let aspect = event.target.getAttribute("data-name");
                let token = game.scenes.viewed.getEmbeddedDocument("Token", token_id);
                let actor = token.actor;
                await actor.update({[`system.aspects.${aspect}.notes`]:desc});
                this.editing = false;
                await this._render(false);
            }
        });

        const FUTrackNotesText = html.find("div[name ='FUTrackNotesText']");
        
        FUTrackNotesText.on("blur", async event => {
            if (!window.getSelection().toString()){
                let text = DOMPurify.sanitize(event.target.innerHTML);
                let token_id = event.target.getAttribute("data-tokenid")
                let track = event.target.getAttribute("data-name");//This is a much better way of accessing data than splitting the id.
                let token = game.scenes.viewed.getEmbeddedDocument("Token", token_id);
                let actor = token.actor;
                await actor.update({[`system.tracks.${track}.notes`]:text});
                this.editing = false;
                await this._render(false)
            }
        });

        const game_date_time = html.find(("div[id='game_date_time']"));
        game_date_time.on("blur", async event => {
            await game.settings.set("fate-core-official", "gameTime", DOMPurify.sanitize(event.currentTarget.innerHTML));
            await game.socket.emit("system.fate-core-official",{"render":true});
            this.editing = false;
            await this._render(false);
        })

        const game_notes = html.find(("div[id='game_notes']"));

        game_notes.on("focus", event => {
            this.editing=true;
        })

        game_notes.on("blur", async event => {
            await game.settings.set("fate-core-official", "gameNotes", DOMPurify.sanitize(event.currentTarget.innerHTML));
            await game.socket.emit("system.fate-core-official",{"render":true});
            this.editing = false;
            await this._render(false);
        })

        const add_game_aspect = html.find("button[id='add_game_aspect']")
        add_game_aspect.on("click", event => this._add_game_aspect(event, html));

        //Situation Aspect Buttons
        const del_game_aspect = html.find("button[name='del_game_aspect']");
        del_game_aspect.on("click", event => this._del_game_aspect(event, html));
        const game_a_free_i = html.find("input[name='game_a_free_i']");
        game_a_free_i.on("change", event => this._game_a_free_i_button(event, html));

        const fuLabelSettings = html.find('button[id="fuAspectLabelSettings"]');
        fuLabelSettings.on('click', async event => {
            new FUAspectLabelClass().render(true);
        })

        const addCountdown = html.find('button[id="add_countdown"]');
        addCountdown.on('click', async event => {
            new acd(this).render(true);
        })
    }

    async _sit_aspect_change(event, html){
        let index = event.target.id.split("_")[0];
        let aspects = duplicate(game.scenes.viewed.getFlag("fate-core-official","situation_aspects"));
        let aspect = aspects[index];

        let drawing = undefined;
        if (aspect.name != "") {
            drawing = canvas?.drawings?.objects?.children?.find(drawing => drawing.document?.text?.startsWith(aspect.name));
        }
        
        aspect.name = event.target.value;
        let value = aspect.free_invokes;

        if (aspect.name == "") {
            // As the aspect is blank, disable the free invokes field, pan to aspect button, and add note to canvas button.
            $(`#${index}_free_invokes`).prop("disabled", true);
            $(`#addToScene_${index}`).prop("disabled", true);
            $(`#panToAspect_${index}`).prop("disabled", true);
            
            // If there's a drawing for this aspect, delete it now that the name is blank.
            if (drawing != undefined){
                game.scenes.viewed.deleteEmbeddedDocuments ("Drawing", [drawing.id]);
                return;
            }
        } else {
            $(`#${index}_free_invokes`).prop("disabled", false);
            $(`#addToScene_${index}`).prop("disabled", false);
            $(`#panToAspect_${index}`).prop("disabled", false);
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
            drawing.document.update({
                "text":text,
                width: width,
                height: height,
                fontFamily: font,
            });
        }

        game.scenes.viewed.setFlag("fate-core-official", "situation_aspects",aspects);
        game.socket.emit("system.fate-core-official",{"render":true});
    }

    async _del_game_aspect(event, html){
        let del =   fcoConstants.confirmDeletion();
        if (del){
            let id = event.target.id;
            let name = id.split("_")[1];
            let game_aspects = duplicate(game.settings.get("fate-core-official", "gameAspects"));
            game_aspects.splice(game_aspects.findIndex(sit => sit.name == name),1);
            await game.settings.set("fate-core-official","gameAspects",game_aspects);
            game.socket.emit("system.fate-core-official",{"render":true});
            this._render(false);
        }
    }

    async _add_game_aspect(event, html){
        const game_aspect = html.find("input[id='game_aspect']");
        let game_aspects = [];
        let aspect = {
                                    "name":"",
                                    "free_invokes":0,
                                    "notes":""
                                };
        try {
            game_aspects = duplicate(game.settings.get("fate-core-official","gameAspects"));
        } catch {
        }                                
        game_aspects.push(aspect);
        await game.settings.set("fate-core-official","gameAspects",game_aspects);
        game.socket.emit("system.fate-core-official",{"render":true});
        this._render(false);
    }

    async _game_a_free_i_button(event,html){
        let index=event.target.id.split("_")[0];
        let value=html.find(`input[id="${index}_ga_free_invokes"]`)[0].value
        let game_aspects = duplicate(game.settings.get("fate-core-official","gameAspects"));
        let aspect = game_aspects[index];
        aspect.free_invokes = value;
        await game.settings.set("fate-core-official","gameAspects",game_aspects);
        game.socket.emit("system.fate-core-official",{"render":true});
    }

    async iseAspect(event, html){
        let token = game.scenes.viewed.getEmbeddedDocument("Token", event.target.id.split("_")[0]);
        if (token.aspectsMaximised == true || token.aspectsMaximised == undefined){
            token.aspectsMaximised = false;
        }else {
            if (token.aspectsMaximised == false){
                token.aspectsMaximised = true;
            }
        }
        await this._render(false);
    }

    async iseTrack(event, html){
        let token = game.scenes.viewed.getEmbeddedDocument("Token", event.target.id.split("_")[0]);
        if (token.tracksMaximised == true || token.tracksMaximised == undefined){
            token.tracksMaximised = false;
        }else {
            if (token.tracksMaximised == false){
                token.tracksMaximised = true;
            }
        }
        await this._render(false);
    }

    async tokenNameChange(event, html){
        let t_id = event.target.id.split("_")[0];
        let token = game.scenes.viewed.getEmbeddedDocument("Token", t_id);
        if (token != undefined){
            let name = await fcoConstants.updateShortText(game.i18n.localize("fate-core-official.whatShouldTokenNameBe"),token.name);
            await token.update({"name":name});
        }
    }

    async _selectRoll (event, html){
        let t_id = event.target.id.split("_")[0]
        let token = game.scenes.viewed.getEmbeddedDocument("Token", t_id);
        
        let sk = html.find(`select[id='${t_id}_selectSkill']`)[0];
        let skill;
        let stunt = undefined;
        let bonus=0;

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
            rank = token.actor.system.skills[skill].rank;
        } else {
            rank = token.actor.system.skills[skill].rank;
        }

        let ladder = fcoConstants.getFateLadder();
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
                    mrd.bringToTop();
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
        this._render(false);
    }

    async _notesFocusOut(event, html){
        let notes = DOMPurify.sanitize(html.find("div[id='scene_notes']")[0].innerHTML);
        await game.scenes.viewed.setFlag("fate-core-official","sceneNotes",notes);
        this.editing=false;
        await this._render(false);
    }

    async _fu_roll_button(event, html){
        let detail = event.target.id.split("_");
        let index = detail[1];
        let action = detail[2];
        let rolls = duplicate(game.scenes.viewed.getFlag("fate-core-official","rolls"));
        let roll = rolls[index]
        let message;
        if (roll.message_id) message = game.messages.get(roll.message_id)
        
        if (action == "manual" || action == "manualfp"){
            let gp = await gmfp(roll);
            // Render a dialog asking for the modifier and text description
            let content = 
            `<div>
                <table border="none">
                    <th style="text-align:left; padding-left:5px">
                        Modifier
                    </th>
                    <th style="text-align:left; padding-left:5px">
                        Description
                    </th>
                    <tr>
                        <td style="text-align:left; padding-left:5px"> 
                            <input type="number" style="background-color:white; max-width:5em" class="fco_manual_modifier" value="0">
                            </input>
                        </td>
                        <td style="text-align:left; padding-left:5px">
                            <input type="text" style="background-color:white;" class="fco_manual_description" value="">
                            </input>
                        </td>
                    </tr>
                </table>
            </div>`

            let modification = await new Promise(resolve => {
                new Dialog({
                    title: game.i18n.localize("fate-core-official.manualRollModifier"),
                    content: content,
                    buttons: {
                        ok: {
                            label: "OK",
                            callback: () => {
                                resolve({
                                    modifier:$('.fco_manual_modifier')[0].value,
                                    description:$('.fco_manual_description')[0].value
                                })
                            }
                        }
                    },
                    default:"ok"
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
                        game.scenes.viewed.setFlag("fate-core-official", "rolls", rolls);
                        if (message) {
                            let mrolls = duplicate(message.rolls)
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
                            game.scenes.viewed.setFlag("fate-core-official", "rolls", rolls);
                            if (message) {
                                let mrolls = duplicate(message.rolls);
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
                await game.scenes.viewed.setFlag("fate-core-official", "rolls", rolls);
                if (message) {
                    let mrolls = duplicate(message.rolls);
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
                await game.scenes.viewed.setFlag("fate-core-official", "rolls", rolls);
                if (message) {
                    let mrolls = duplicate (message.rolls);
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
            let asa = game.scenes.viewed.getFlag("fate-core-official", "situation_aspects");
            if (!asa) asa = {};
            let all_sit_aspects = duplicate(asa);

            let shift_down = false; 
            if (isNewerVersion(game.version, "9.230")){
                shift_down = game.system["fco-shifted"];    
            } else {
                shift_down = keyboard.isDown("Shift");
            }
            
            let gp = await gmfp(roll);
            let boosts = gp?.actor?.system?.details?.fatePoints?.boosts > 0 ? gp?.actor?.system?.details?.fatePoints?.boosts : 0;

            if (shift_down && game.user.isGM && ((Object.keys(asa).length > 0 && asa.filter(as => as.free_invokes > 0).length > 0) || boosts > 0)){
               // Add dialog here to pick aspect(s) being invoked.
               // Dialogue should display all situation aspects in current scene with number of free invokes;
               // We then need to harvest the number of invokes being used on each and set bonus accordingly.
               // Ideally we should add the flavour to the below.
                bonus = 0;
                let sit_aspects = duplicate(game.scenes.viewed.getFlag("fate-core-official", "situation_aspects")).filter(as => as.free_invokes > 0);
                for (let aspect of sit_aspects){
                    let options = "";
                    for (let i = 0; i < parseInt(aspect.free_invokes, 10)+1; i++){
                        options+=`<option value="${aspect.name}_${i}">${i}</option>`
                    }
                    aspect.options = options;
                }

                if (isNewerVersion(game.version, "9.230")){
                    game.system["fco-shifted"] = false;
                }
                
                let content =`<br/><div>`
                for (let aspect of sit_aspects){
                    content += `<div style="display:flex; flex-direction:row"><div style="min-width:75%; max-width:75%; padding:5px">${aspect.name}</div><div style="min-width:50px"><select class = "free_i_selector">${aspect.options}</select></div></div>`
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
                    new Dialog({
                        title: game.i18n.localize("fate-core-official.selectAspects"),
                        content: content,
                        buttons: {
                            ok: {
                                label: "OK",
                                callback: () => {
                                    resolve($('.free_i_selector'))
                                }
                            }
                        },
                        default:"ok",
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
                                    size = Math.floor(game.scenes.viewed.width*(1/100));
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
                        await game.scenes.viewed.updateEmbeddedDocuments("Drawing", updates);
                        flavor = `<br>${game.i18n.localize("fate-core-official.FreeInvokes")} +${bonus} (${aspectsInvoked.join(", ")})`
                        await game.scenes.viewed.setFlag("fate-core-official", "situation_aspects", all_sit_aspects);
                    }
                }
            }
            if (bonus > 0){
                roll.total+=bonus;
                roll.flavor+=flavor;
                if (game.user.isGM){
                    if (message) {
                        let mrolls = duplicate(message.rolls);
                        let mroll = mrolls[0];
                        mroll.total = roll.total;
                        roll.roll = mroll;
                        await message.update({flavor:roll.flavor, content:roll.total, rolls:mrolls})
                    } 
                    await game.scenes.viewed.setFlag("fate-core-official", "rolls", rolls);
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

            let asa = game.scenes.viewed.getFlag("fate-core-official", "situation_aspects");
            if (!asa) asa = {};
            let all_sit_aspects = duplicate(asa);

            let invokedAspect = undefined;

            let shift_down = false; 
            if (isNewerVersion(game.version, "9.230")){
                shift_down = game.system["fco-shifted"];    
            } else {
                shift_down = keyboard.isDown("Shift");
            }

            let invokedAspects = false;

            let gp = await gmfp(roll);
            let boosts = gp?.actor?.system?.details?.fatePoints?.boosts > 0 ? gp?.actor?.system?.details?.fatePoints?.boosts : 0;

            if (shift_down && game.user.isGM && ((Object.keys(asa).length > 0 && asa.filter(as => as.free_invokes > 0).length > 0) || boosts > 0)){
                let options = ""
                if (isNewerVersion(game.version, "9.230")){
                    game.system["fco-shifted"] = false;
                }
                let sit_aspects = duplicate(game.scenes.viewed.getFlag("fate-core-official", "situation_aspects")).filter(as => as.free_invokes > 0);
                for (let aspect of sit_aspects){
                    options +=`<option value="${aspect.name}">${aspect.name}</option>`
                }

                if (boosts > 0){
                    options+=`<option value="boost">${game.i18n.localize("fate-core-official.Boost")}</option>`
                }                                
                let content =`<br/><div style="min-width:100%; max-width:100%"><select style="min-width:100%; max-width:100%" class="free_i_r_selector">${options}</select></div><br/>`

               invokedAspects = await new Promise(resolve => {
                    new Dialog({
                        title: game.i18n.localize("fate-core-official.selectAspect"),
                        content: content,
                        buttons: {
                            ok: {
                                label: "OK",
                                callback: () => {
                                    resolve($('.free_i_r_selector'))
                                }
                            }
                        },
                        default:"ok",
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
                                    size = Math.floor(game.scenes.viewed.width*(1/100));
                                    if (size < 8) size = 8;
                                    if (size > 256) size = 256;
                                }
                                let height = size * 2;
                                let width = (text.length * size) / 1.5;
                                updates.push({_id:drawing.document.id, "text":text, "width":width, "height":height, "fontFamily":font})
                            }
                            flavor += ` (${sit_aspect.name})`
                            await game.scenes.viewed.updateEmbeddedDocuments("Drawing", updates);
                            await game.scenes.viewed.setFlag("fate-core-official", "situation_aspects", all_sit_aspects);
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
                    flavor: newFlavour
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
                        let mroll = duplicate(r2);
                        mroll.total = roll.total;
                        await message.update({flavor:roll.flavor, content:roll.total, rolls:[mroll]})
                    }
                    game.scenes.viewed.setFlag("fate-core-official", "rolls", rolls);
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

            let shift_down = false; 
            if (isNewerVersion(game.version, "9.230")){
                shift_down = game.system["fco-shifted"];    
            } else {
                shift_down = keyboard.isDown("Shift");
            }

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
                        let mrolls = duplicate (message.rolls)
                        let mroll = mrolls[0];
                        mroll.total = roll.total;
                        roll.roll = mroll;
                        await message.update({flavor:roll.flavor, content:roll.total, rolls:mrolls})
                    }
                    game.scenes.viewed.setFlag("fate-core-official", "rolls", rolls);
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
                            let mrolls = duplicate (message.rolls)
                            let mroll = mrolls[0];
                            mroll.total = roll.total;
                            roll.roll = mroll;
                            await message.update({flavor:roll.flavor, content:roll.total, rolls:mrolls})
                        }
                        game.scenes.viewed.setFlag("fate-core-official", "rolls", rolls);
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
                        flavor: `<h1>${game.i18n.localize("fate-core-official.PaidRerollExplainer")}</h1>${game.i18n.localize("fate-core-official.RolledBy")}: ${game.user.name}<br>`
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
                    roll.roll = duplicate(r2);
                    if (message) {
                        let mroll = duplicate(r2);
                        mroll.total = roll.total;
                        await message.update({flavor:roll.flavor, content:roll.total, rolls:[mroll]})
                    }
                    game.scenes.viewed.setFlag("fate-core-official", "rolls", rolls);
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
                        flavor: `<h1>${game.i18n.localize("fate-core-official.PaidRerollExplainer")}</h1>${game.i18n.localize("fate-core-official.RolledBy")}: ${game.user.name}<br>`
                    });
                    let oldDiceValue = 0;
                    for (let i = 0; i< roll.dice.length; i++){
                        oldDiceValue += roll.dice[i]
                    }
                    roll.total -= oldDiceValue;
                    roll.dice = r2.dice[0].values;
                    roll.total += r2.total;
                    roll.roll = duplicate(r2);
                    if (game.user.isGM){
                        if (message) {
                            let mroll = duplicate(r2);
                            mroll.total = roll.total;
                            await message.update({flavor:roll.flavor, content:roll.total, rolls:[mroll]})
                        }
                        game.scenes.viewed.setFlag("fate-core-official", "rolls", rolls);
                    } else {
                        game.socket.emit("system.fate-core-official",{"rolls":rolls, "scene":game.scenes.viewed})
                    }
                }
            }
        }
    }

    async _fu_clear_rolls(event,html){
        game.scenes.viewed.unsetFlag("fate-core-official","rolls");
    }

    _fu_adhoc_roll(event, html){
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
        let width = 400;
        let height = 230;
        if (showFormulae) height = 270;

        new Dialog({
                    title: game.i18n.localize("fate-core-official.fu-adhoc-roll"),
                    content: content,
                    buttons: {
                        ok: {
                            label: game.i18n.localize("fate-core-official.OK"),
                            callback: async ()=> {
                                // Do the stuff here
                                let formula = $('#fco-gmadhr-formula')[0]?.value;
                                if (!formula) formula = '4df';
                                name = $('#fco-gmadhr-name')[0].value;
                                if (!name) name = game.i18n.localize("fate-core-official.fu-adhoc-roll-mysteriousEntity");
                                skill = $('#fco-gmadhr-skill')[0].value;
                                if (!skill) skill = game.i18n.localize("fate-core-official.fu-adhoc-roll-mysteriousSkill");
                                modifier = $('#fco-gmadhr-modifier')[0].value;
                                if (!modifier) modifier = 0;
                                flavour = $('#fco-gmadhr-flavour')[0].value;
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
                            }
                            },
                        }
                },
                {
                    width:width,
                    height:height,
                }).render(true);
    }

    async _on_avatar_click(event, html){
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
            this._render(false);
            game.socket.emit("system.fate-core-official",{"render":true});
        }
    }

    async refresh_fate_points(event, html){
        let tokens = game.scenes.viewed.tokens.contents;
        let updates = [];
        for (let i = 0; i < tokens.length; i++){
            let token = tokens[i];
        
            if (token.actor == null || !token.actor.hasPlayerOwner || token.actor.type == "Thing"){
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

    async _edit_player_points(event, html){
        let id = event.target.id;
        let parts = id.split("_");
        let t_id = parts[0]
        let token = game.scenes.viewed.getEmbeddedDocument("Token", t_id);
        let fps = parseInt(event.target.value);

        await token.actor.update({
            ["system.details.fatePoints.current"]: fps
        })
        this.editing = false;
        await this._render(false);
    }

    async _edit_player_boosts(event, html){
        let id = event.target.id;
        let parts = id.split("_");
        let t_id = parts[0]
        let token = game.scenes.viewed.getEmbeddedDocument("Token", t_id);
        let boosts = parseInt(event.target.value);

        await token.actor.update({
            ["system.details.fatePoints.boosts"]: boosts
        })
        this.editing = false;
        await this._render(false);
    }

    async _edit_gm_points(event, html){
        let user = game.users.contents.find(user => user.id == event.target.id);
        let fp = parseInt(event.target.value)
        user.setFlag("fate-core-official","gmfatepoints",fp);
    }

    async scene_notes_edit(event,html){
        this.editing = true;
    }

    async _free_i_button(event,html){
        let index=event.target.id.split("_")[0];
        let value=html.find(`input[id="${index}_free_invokes"]`)[0].value
        let situation_aspects = duplicate(game.scenes.viewed.getFlag("fate-core-official","situation_aspects"))
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

    async _panToAspect(event, html){
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
                await DrawingDocument.create({
                    type: CONST.DRAWING_TYPES.RECTANGLE,
                    author: game.user.id,
                    x: x,
                    y: y,
                    width: width,
                    height: height,
                    fillType: CONST.DRAWING_FILL_TYPES.SOLID,
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

    async _addToScene(event, html){
        let index=event.target.id.split("_")[1];
        let value=html.find(`input[id="${index}_free_invokes"]`)[0].value;
        let name = game.scenes.viewed.getFlag("fate-core-official","situation_aspects")[index].name;
        
        this.addAspectDrawing(value, name, canvas.stage.pivot._x, canvas.stage.pivot._y);
    }

    async _del_sit_aspect(event, html){
        let del =   fcoConstants.confirmDeletion();
        if (del){
            let id = event.target.id;
            let index = id.split("_")[1];
            let situation_aspects = duplicate(game.scenes.viewed.getFlag("fate-core-official", "situation_aspects"));
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

    async _add_sit_aspect(event, html){
        let situation_aspects = [];
        let situation_aspect = {
                                    "name":"",
                                    "free_invokes":0
                                };
        try {
            situation_aspects = duplicate(game.scenes.viewed.getFlag("fate-core-official","situation_aspects"));
        } catch {
        }                                
        situation_aspects.push(situation_aspect);
        game.scenes.viewed.setFlag("fate-core-official","situation_aspects",situation_aspects);
    }

    async _add_sit_aspect_from_track(event, html){
        let aspect = event.target.id.split("_")[1];
        let name = event.target.id.split("_")[0];
        let text = name + " ("+aspect+")";
        let situation_aspects = [];
        let situation_aspect = {
                                    "name":text,
                                    "free_invokes":1,
                                    "linked":true
                                };
        try {
            situation_aspects = duplicate(game.scenes.viewed.getFlag("fate-core-official","situation_aspects"));
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

    async _saveNotes(event, html){
        this.editing=false;
    }

    async _clear_fleeting(event, html){
        let tokens = game.scenes.viewed.tokens.contents;
        let updates = [];
        let tokenUpdates = [];

        for (let i = 0; i<tokens.length; i++){
            let tracks = {};    
            let actor = tokens[i].actor;
            if (actor == null || actor == undefined) continue;

            if (actor?.system?.tracks != undefined) {
                tracks = duplicate (actor.system.tracks);
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
                    tokenUpdates.push({"_id":tokens[i].id, "actorData.system.tracks":tracks});
                }    
            }
        } 
        await Actor.updateDocuments(updates);
        await game.scenes.viewed.updateEmbeddedDocuments("Token", tokenUpdates);
    }

    async _on_aspect_change(event, html){
        let id = event.target.id;
        let parts = id.split("_");
        let t_id = parts[0];
        let name = parts[1];
        let text = event.target.value;
        let token = game.scenes.viewed.getEmbeddedDocument("Token", t_id);
        let tracks = duplicate(token.actor.system.tracks);
        let track = tracks[name]
        track.aspect.name=text;
        let previousText = `${token.actor.system.tracks[name].aspect.name} (${token.actor.name})`;
        token.actor.update({[`system.tracks.${name}.aspect`]:track.aspect})

        // See if this aspect exists in the list of game aspects and update it if so.
        let newText = `${text} (${token.actor.name})`;

        let situation_aspects = duplicate(game.scenes.viewed.getFlag("fate-core-official","situation_aspects"));
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
            drawing.document.update({
                "text":text,
                width: width,
                height: height,
                fontFamily: font,
            });
        }
    }

    async _on_click_box(event, html) {
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
        let tracks = duplicate(token.actor.system.tracks);
        let track = tracks[name]
        track.box_values[index] = checked;
        await token.actor.update({
            // By using this format, we can JUST update the box_values attribute.
            ["system.tracks"]:{[name]:{["box_values"]:track.box_values}}
        })
    }

    async _on_cd_box_click(event, html){
        let countdowns = game.settings.get("fate-core-official","countdowns");
        let data = event.target.id.split("_");
        let key = data[0];
        let box = data[1]
        let checked = event.target.checked;
        let countdown = countdowns[key];
        countdown.boxes[box] = checked;
        await game.settings.set("fate-core-official","countdowns",countdowns);
        await game.socket.emit("system.fate-core-official",{"render":true});
        await this._render(false);
    }

    async _on_delete_cd(event, html){
        let del = await fcoConstants.confirmDeletion();
        if (del){
            let data = event.target.id.split("_");
            let countdowns = game.settings.get("fate-core-official", "countdowns");
            delete countdowns[data[0]];
            await game.settings.set("fate-core-official", "countdowns", countdowns);
            await game.socket.emit("system.fate-core-official",{"render":true});
            await this._render(false);
        }
    }

    async _on_toggle_cd_visibility(event, html){
        this.editing = false;
        let data = event.target.id.split("_");
        let countdowns = game.settings.get("fate-core-official", "countdowns");
        let countdown = countdowns[data[0]];
        let vis = countdown.visible;
        // Valid values are visible, hidden, show_boxes

        let shift_down = false; 
        if (isNewerVersion(game.version, "9.230")){
            shift_down = game.system["fco-shifted"];    
        } else {
            shift_down = keyboard.isDown("Shift");
        }

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
        await this._render(false);
    }

    // Change name/desc on losing focus to editable divs
    async _on_cd_blur(event, html){
        let data = event.target.id.split("_");
        let sel = window.getSelection().toString();
        if (sel == ""){
            // No selected text so go off and make the changes
             if (data[1]== "name"){
                this.editing = false;
                let countdowns = game.settings.get("fate-core-official", "countdowns");
                let countdown = countdowns[data[0]];
                if (countdown.name != event.target.innerHTML){
                    let oldname = countdown.name;
                    let newname = DOMPurify.sanitize(event.target.innerHTML);
                    let testname = newname.replace(/<[^>]+>/g, '');
                    if (testname == ""){
                        event.target.innerHTML=oldname;
                        return ui.notifications.error(game.i18n.localize("fate-core-official.empty"));
                    }
                    let newCountdown = duplicate(countdown);
                    newCountdown.name = newname;
                    delete countdowns[fcoConstants.getKey(countdown.name)];
                    countdowns[fcoConstants.getKey(newname)]=newCountdown;
                    await game.settings.set("fate-core-official","countdowns", countdowns);
                    await game.socket.emit("system.fate-core-official",{"render":true});
                }
             }
             if (data[1] == "desc"){
                this.editing = false;
                let countdowns = game.settings.get("fate-core-official", "countdowns");
                let countdown = countdowns[data[0]];
                countdown.description = DOMPurify.sanitize(event.target.innerHTML);
                await game.settings.set("fate-core-official", "countdowns", countdowns);
                await game.socket.emit("system.fate-core-official",{"render":true});
            }
            await this._render(false);
        }
    }

    async _timed_event (event, html){
        let te = new TimedEvent();
        te.createTimedEvent();
    }

    async _onPopcornButton(event, html){

        let type = event.target.id.split("_")[1];
        let id = event.target.id.split("_")[0];

        if (type.startsWith("act")){
            let combatants = game.combat.combatants;
            let combatant = combatants.find(comb => comb.token.id == id);
            await combatant.setFlag("fate-core-official","hasActed", true);
        }

        if (type === "unact"){
            let combatants = game.combat.combatants;
            let combatant = combatants.find(comb => comb.token.id == id);
            await combatant.setFlag("fate-core-official","hasActed", false);
        }

        if (type === "find"){
            let t_id = id;
            let combatant = game.combat.getCombatantByToken(t_id);
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
            let combatant = game.combat.getCombatantByToken(t_id);
            let token = combatant.token;
            const sheet = token.actor.sheet;

            if (sheet.rendered){
                sheet.maximize();
                sheet.bringToTop();
            } else {
                sheet.render(true);
            }
        }
    }

    async _onPopcornRemove(event, html){
        let id = event.target.id.split("_")[0];
        await game.combat.getCombatantByToken(id).delete();
    }

    async _endButton(event, html){
        let fin = await Promise.resolve(game.combat.endCombat());
    }

    async _nextButton(event, html){
        let combatants = game.combat.combatants;
        let updates = [];

        for (let comb of combatants){
            updates.push({"_id":comb.id, "flags.fate-core-official.hasActed":false})
        }
        await game.combat.updateEmbeddedDocuments("Combatant", updates);
        game.combat.nextRound();
    }

    //Set up the default options for instances of this class
    static get defaultOptions() {
        const options = super.defaultOptions; //begin with the super's default options
        //The HTML file used to render this window
        options.template = "systems/fate-core-official/templates/FateUtilities.html"; 
        options.width=window.innerWidth*0.5;
        options.height=window.innerHeight*0.9;
        options.title = game.i18n.localize("fate-core-official.FateUtilities");
        options.id = "FateUtilities"; // CSS id if you want to override default behaviors
        options.resizable = true;
        options.scrollY=["#aspects", "#cd_panel", "#fu_game_info_tab", "#fu_aspects_tab","#fu_tracks_tab", "#fu_scene_tab", "#fu_scene_pane", "#fu_rolls_tab", "#fu_conflict_tracker", "#fu_aspects_pane", "#fu_scene_notes", "#fu_aspects_pane", "#fu_scene_notes_pane"]

        mergeObject(options, {
            tabs: [
                {
                    navSelector: '.foo',
                    contentSelector: '.utilities-body',
                    initial: 'aspects',
                },
            ],
        });
        return options;
    }

async getData(){
    //Let's prepare the data for the initiative tracker here
    //Check if we're using an initiative skill, if so disable the initiative tracker in favour of using the default one
    let init_skill = game.settings.get("fate-core-official","init_skill");
    let tracker_disabled = false;
    
    if (init_skill !== "None" || init_skill === "Disabled"){
        tracker_disabled = true;
    }
    
    const data = {};
    if (game.combat==null || tracker_disabled || (game?.combat?.scene == null && !isNewerVersion(game.version, "9.230"))){
        data.conflict = false;
    } else {
        data.conflict = true;
        data.conflictName = game.combat.getFlag("fate-core-official","name");
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
                if (token.actor.name.startsWith(check) || token.name.startsWith(check)){
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
    situation_aspects = duplicate(situation_aspects);
    
    data.situation_aspects = situation_aspects;
    fcoConstants.sort_key(all_tokens, "name");
    data.all_tokens = all_tokens;

    let enriched_tokens = {};
    for (let tk of all_tokens){
        let ass = duplicate (tk.actor.system.aspects);
        let trks = duplicate (tk.actor.system.tracks);
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
    data.rolls = duplicate(rolls);
    
    for (let roll of data.rolls){
        roll.richFlavor = await fcoConstants.fcoEnrich(roll.flavor);
    }

    data.user = game.user;
    let aspects = game.settings.get("fate-core-official","gameAspects");
    if (game.combat?.scene){
        data.combatSceneName = game.combat.scene.name;
        data.pinned = true;
    } else {
        data.combatSceneName = game.i18n.localize("fate-core-official.unpinned");
        data.pinned = false;
    }

    data.game_aspects = aspects;
    data.game_time = game.settings.get("fate-core-official","gameTime");
    data.rich_game_time = await fcoConstants.fcoEnrich (game.settings.get("fate-core-official","gameTime"));
    data.game_notes = game.settings.get("fate-core-official","gameNotes");
    data.rich_game_notes = await fcoConstants.fcoEnrich (game.settings.get("fate-core-official","gameNotes"))
    data.fontSize = game.settings.get("fate-core-official","fuFontSize");
    data.height = this.position.height;
    data.combatants_only = game.settings.get("fate-core-official","fu_combatants_only");

    if (data.combatants_only && data.conflict){
        let combatTokens = data.combat_tokens.concat(data.has_acted_tokens);
        data.all_tokens = combatTokens;
    }
    data.numConflicts = (game.combats.contents.filter(c => c.scene?.id == game?.scenes?.viewed?.id).length)+(game.combats.contents.filter(c => c.scene == null).length);
    
    let countdowns = duplicate(game.settings.get("fate-core-official", "countdowns"));
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

    data.fuNotesHeight = (this.position.height) - 350 - data.cdownheight - data.fuPaneHeight + modifier;

    data.gameAspectsHeight = 180;
    let gaModifier = data.gameAspectsHeight - data.game_aspects.length * 45;
    if (gaModifier <0) gaModifier = 0;
    data.gameNotesHeight = (this.position.height - 575) + gaModifier;
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
    let countdowns = await duplicate(game.settings.get("fate-core-official","countdowns"));
    let safeName = fcoConstants.getKey(countdown.name); 
    countdowns[safeName]=countdown;
    await game.settings.set("fate-core-official","countdowns",countdowns);
    await game.socket.emit("system.fate-core-official",{"render":true});
    this.fu.render(false);
}

async _render(...args){
    if (!this.editing && !window.getSelection().toString()){
        await super._render(...args);
        if (!this.renderPending) {
                this.renderPending = true;
                await setTimeout(async () => {
                    await super._render(...args);
                    this.renderPending = false;
                }, 150);
        }
    } else this.renderBanked = true;
}

async renderMe(...args){
    let tab = this._tabs[0].active;
    
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
            $(`.${args[1]}_fu`).addClass("fu_controlled");
            $(`.${args[1]}_fu_acted`).addClass("fu_controlled");
            $(`.${args[1]}_fu_acted`).removeClass("fu_uncontrolled");
        }
        if (args[2] === false){
            $(`.${args[1]}_fu`).removeClass("fu_controlled");
            $(`.${args[1]}_fu_acted`).removeClass("fu_controlled");
            $(`.${args[1]}_fu_acted`).addClass("fu_uncontrolled");
        }
        return;
    }
    //Code to execute when a hook is detected by fate-core-official. Will need to tackle hooks for Actor
    //Scene, User, and Combat.
    //The following code debounces the render, preventing multiple renders when multiple simultaneous update requests are received.
    if (!this.renderPending) {
        this.renderPending = true;
        setTimeout(() => {
          this._render(false);
          this.delayedRender = false;
          this.renderPending = false;
        }, 150);
      } 
    }
}

Hooks.on('ready', function()
{
    if (!canvas.ready && game.settings.get("core", "noCanvas")) {
        let fu = new FateUtilities().render(true);
    }
})

Hooks.on('getSceneControlButtons', function(hudButtons)
{
    let hud = hudButtons.find(val => {return val.name == "token";})
            if (hud){
                hud.tools.push({
                    name:"FateUtilities",//Completed
                    title:game.i18n.localize("fate-core-official.LaunchFateUtilities"),
                    icon:"fas fa-theater-masks",
                    onClick: async ()=> {
                        let fu = new FateUtilities;
                        for (let app in ui.windows){
                            if (ui.windows[app]?.options?.id == "FateUtilities"){
                                fu = ui.windows[app]
                                fu.maximize();
                            }
                        }
                        await fu.render(true); 
                        $('#FateUtilities').css({zIndex: Math.min(++_maxZ, 9999)});
                    },
                    button:true
                });
            }
})

class acd extends FormApplication {
    constructor(fu) {
        super();
        this.fu = fu;
    }

    static get defaultOptions (){
        const options = super.defaultOptions;
        options.template = "systems/fate-core-official/templates/new_cd_dialog.html";
        options.closeOnSubmit = true;
        options.submitOnClose = false;
        options.title = game.i18n.localize("fate-core-official.addCountdown");
        options.classes=options.classes.concat("fate");
        return options;
    }

    async _updateObject (event, data){
        let box_values = [];
        if (data.boxes < 3) data.boxes = 3;
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
        
        let countdowns = await duplicate(game.settings.get("fate-core-official","countdowns"));
        let safeName = fcoConstants.getKey(countdown.name); 
        countdowns[safeName]=countdown;
        await game.settings.set("fate-core-official","countdowns",countdowns);
        await game.socket.emit("system.fate-core-official",{"render":true});
        this.fu.render(false);
    }

    activateListeners(html){
        super.activateListeners(html);
        fcoConstants.getPen("cd_description");
        fcoConstants.getPen("cd_name");
        const save = $('#cd_dialog_save');
        save.on('click', (event, html) => this.submit());

        $('#cd_description').on('contextmenu', async event => {
            $('#cd_description').trigger('blur');
            let text = await fcoConstants.updateText("Edit raw HTML", event.currentTarget.innerHTML, true);
            if (text != "discarded") {
                $('#cd_description')[0].innerHTML = text;
            }
        })
    }
}

class TimedEvent extends Application {

    constructor(){
        super();
    }

    createTimedEvent(){
        var triggerRound=0;
        var triggerText="";
        var currentRound="NoCombat";
        try {
            currentRound = game.combat.round;
        } catch {
            var dp = {
                "title": game.i18n.localize("fate-core-official.Error"),
                "content": `${game.i18n.localize("fate-core-official.NoCurrentCombat")}<p>`,
                default:"oops",
                "buttons": {
                    oops: {
                        label: game.i18n.localize("fate-core-official.OK"),
                    }
                }
            }
            let d = new Dialog(dp);
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
                "title":game.i18n.localize("fate-core-official.TimedEvent"),
                "content":`<h1>${game.i18n.localize("fate-core-official.CreateATimedEvent")}</h1>
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
                    default:"create",
                    "buttons":{
                        create:{label:game.i18n.localize("fate-core-official.Create"), callback:async (teDialog) => {

                            //if no flags currently set, initialise
                            var timedEvents = game.combat.getFlag("fate-core-official","timedEvents");
                            
                            if (timedEvents ==null || timedEvents == undefined){
                                game.combat.setFlag("fate-core-official","timedEvents",[
                                                                                    {   "round":`${teDialog.find("#eventExchange")[0].value}`,
                                                                                        "event":`${teDialog.find("#eventToCreate")[0].value}`,
                                                                                        "complete":false
                                                                                    }
                                                                                ])
                                                                                timedEvents=game.combat.getFlag("fate-core-official","timedEvents");
                            } else {
                                timedEvents.push({   
                                                    "round":`${teDialog.find("#eventExchange")[0].value}`,
                                                    "event":`${teDialog.find("#eventToCreate")[0].value}`,
                                                    "complete":false
                                });
                                game.combat.setFlag("fate-core-official","timedEvents",timedEvents);
                                
                                }

                            triggerRound=document.getElementById("eventExchange").value;
                            triggerText=document.getElementById("eventToCreate").value;
                        }}
                    }
                }
            let dO = Dialog.defaultOptions;
            dO.width="auto";
            dO.height="auto";
            dO.resizable="true"
            let d = new Dialog(dp, dO);
            d.render(true);
        }
    }
}

class FUAspectLabelClass extends FormApplication {
    static get defaultOptions (){
        const options = super.defaultOptions;
        options.template = "systems/fate-core-official/templates/FULabelSettings.html";
        options.closeOnSubmit = true;
        options.submitOnClose = false;
        options.title = game.i18n.localize("fate-core-official.fuAspectLabelSettingsTitle");
        return options;
    }

    async _updateObject(event, formData){
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

    async getData(){
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

    async activateListeners(html){
        super.activateListeners(html);
        $('#save_fu_label_settings').on('click', async event => {
            this.submit();
        })
    }
}

Hooks.on('renderCombatTracker', () => {
    try {
        var r = game.combat.round;
        let pendingEvents = game.combat.getFlag("fate-core-official","timedEvents");
        for (let i = 0; i<pendingEvents.length;i++){
            var event = pendingEvents[i];
            if (r==event.round && event.complete != true){
                var dp = {
                    "title": game.i18n.localize("fate-core-official.TimedEvent"),
                    "content":`<h2>${game.i18n.localize("fate-core-official.TimedEventForExchange")} ${event.round}:</h2><p></p>
                                <h3>${event.event}</h3>`,
                    default:"oops",
                    "buttons": {
                        oops: {
                            label: game.i18n.localize("fate-core-official.OK"),
                        }
                    }
                }
                event.complete = true;
                let d = new Dialog(dp);
                d.render(true);
            }
        }
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

Hooks.on('createChatMessage', (message) => {
    // We're only interested if this is a chat message with a roll in it
    if (message.rolls.length == 0 || message?.flavor?.startsWith("<h1>Reroll")){
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
            let user = {name:message.user.name, _id:message.user._id};
            let rolls = game?.scenes?.viewed?.getFlag("fate-core-official","rolls");
            if (rolls == undefined){
                rolls = [];
            }
            rolls=duplicate(rolls);
            
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
            game.scenes?.viewed?.setFlag("fate-core-official","rolls",rolls);
        }
    }
})

Hooks.once('ready', async function () {
    if (game.user.isGM){
        game.socket.on("system.fate-core-official", rolls => {
            updateRolls(rolls);
        })
    }

    game.socket.on("system.fate-core-official", render => {
        if (render.render){
            let FU = Object.values(ui.windows).find(window=>window.options.id=="FateUtilities");
            if (FU != undefined){
                let tab = FU._tabs[0].active;

                if (tab !== "game_info" && tab !== "scene"){
                    FU.delayedRender = true; 
                    return;
                } else {
                    FU.render(false);
                }
            }
        }
    })

    game.socket.on("system.fate-core-official", onTop => {
        if (onTop?.drawingsOnTop == true && game.canvas.ready){
            canvas.drawings.foreground = canvas.drawings.addChildAt(new PIXI.Container(), 0);
            canvas.drawings.foreground.sortableChildren = true;
            for (let drawing of canvas.drawings.objects.children){
                canvas.drawings.foreground.addChild(drawing.shape);
                drawing.shape.zIndex = drawing.document.z;
            }
        }
        if (onTop?.drawingsOnTop == false && game.canvas.ready){
            for (let drawing of canvas.drawings.objects.children){
                canvas.primary.addChild(drawing.shape);
                drawing.shape.zIndex = drawing.document.z;
            }
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
        currRolls = duplicate(currRolls);
        let endRolls = mergeObject(currRolls, rolls.rolls);
        scene.setFlag("fate-core-official","rolls",endRolls);
        for (let r of endRolls){
            let message;
            if (r.message_id) message = game.messages.get(r.message_id)
            if (message) {
                let mrolls = duplicate(message.rolls);
                mrolls[0].total = r.total;
                await message.update({flavor:r.flavor, content:r.total, rolls:mrolls})
            }
        }
    }
}

Hooks.on('renderFateUtilities', function(){
    let numAspects = document.getElementsByName("sit_aspect").length;
    if (numAspects == undefined){
        numAspects = 0;
    }
    if (game.system.sit_aspects == undefined){
        game.system.sit_aspects = numAspects;
    }
    
    if (numAspects > game.system.sit_aspects){
        let pane = document.getElementById("fu_aspects_pane");
        pane.scrollTop=pane.scrollHeight;
        game.system.sit_aspects = numAspects;
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
        pane.scrollTop=pane.scrollHeight;
        game.system.num_rolls = numRolls;
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
