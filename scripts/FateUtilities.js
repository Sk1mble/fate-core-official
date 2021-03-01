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
        this.render(false);
    }

    activateListeners(html) {
        super.activateListeners(html);

        const addConflict = html.find('button[id="add_conflict"]');
        addConflict.on("click", async (event) => {
            let cbt = await Combat.create({scene: game.scenes.viewed.id});
            await cbt.activate();
        })

        const nextConflict = html.find('button[id="next_conflict"]');
        nextConflict.on("click", async (event) => {
            let combats = game.combats.contents.filter(c => c.data.scene == game.scenes.viewed.id);
            let combat = game.combats.viewed;
            let index = combats.indexOf(combat);
            index ++;
            if (index >= combats.length) index = 0;
            await combats[index].activate();
        })

        const input = html.find('input[type="text"], input[type="number"], textarea');

        input.on("keyup", event => {
            if (event.keyCode === 13 && event.target.type != "textarea") {
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
                this.render(false);
            }
            this.editing = false;
        });

        const fontDown = html.find("button[id='fu_shrink_font']");
        const fontUp = html.find("button[id='fu_grow_font']");

        fontUp.on("click", async event => {
            let font = game.settings.get("ModularFate","fuFontSize");
            font +=1;
            if (font > 20){
                font = 20;
                ui.notifications.info("")
            }
            await game.settings.set ("ModularFate","fuFontSize",font);
            await this.render(false);
        })

        fontDown.on("click", async event => {
            let font = game.settings.get("ModularFate","fuFontSize");
            font -=1;
            if (font < 4){
                font = 4;
            }
            await game.settings.set ("ModularFate","fuFontSize",font);
            await this.render(false);
        })

        const iseAspects = html.find("button[name='iseAspects']");
        iseAspects.on("click", event => this.iseAspect(event, html));

        const maximiseAspects = html.find("button[id='maximiseAllAspects']");
        const minimiseAspects = html.find("button[id='minimiseAllAspects']");

        maximiseAspects.on("click", event => {
            game.scenes.viewed.tokens.contents.forEach(token => token.aspectsMaximised = true);
            this.render(false);
        })

        minimiseAspects.on("click", event => {
            game.scenes.viewed.tokens.contents.forEach(token => token.aspectsMaximised = false);
            this.render(false);
        })

        const maximiseTracks = html.find("button[id='maximiseAllTracks']");
        const minimiseTracks = html.find("button[id='minimiseAllTracks']");

        maximiseTracks.on("click", event => {
            game.scenes.viewed.tokens.contents.forEach(token => token.tracksMaximised = true);
            this.render(false);
        })

        minimiseTracks.on("click", event => {
            game.scenes.viewed.tokens.contents.forEach(token => token.tracksMaximised = false);
            this.render(false);
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
            this.render(false);
        })

        const fu_combatants_toggle = html.find("i[id='toggle_fu_combatants']");
        fu_combatants_toggle.on("click", async (event) => {
            let toggle = game.settings.get("ModularFate","fu_combatants_only");
            if (toggle) {
                await game.settings.set("ModularFate","fu_combatants_only",false);
            } else {
                await game.settings.set("ModularFate","fu_combatants_only",true);
            }
            this.render(false);
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
            this.render(false);
        })

        const FUGameAspectNotes = html.find("textarea[name='FUGameAspectNotesText']");
        FUGameAspectNotes.on("change", event => {
            let details = event.target.id.split("_");
            let aspectName = details[1];
            let aspects = duplicate(game.settings.get("ModularFate", "gameAspects"));
            let aspect = aspects.find(a => a.name == aspectName);
            aspect.notes = event.target.value;
            game.settings.set("ModularFate","gameAspects",aspects);
            game.socket.emit("system.ModularFate",{"render":true});
        });

        const gameAspect = html.find("input[name='game_aspect']");
        gameAspect.on("change", async (event) => {
            let index = event.target.id.split("_")[0];
            let aspects = duplicate(game.settings.get("ModularFate", "gameAspects")); // Should contain an aspect with the current name.
            let aspect = aspects[index];
            aspect.name = event.target.value;
            await game.settings.set("ModularFate","gameAspects",aspects);
            await game.socket.emit("system.ModularFate",{"render":true});
            this.render(false);
        })


        const expandTrackNotes = html.find("div[name='FUexpandTrack']");
        
        expandTrackNotes.on("click", event => {
            let details = event.target.id.split("_");
            let token_id = details[0];
            let track = details[1];
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
            this.render(false);
        })

        const rollTab = html.find("a[data-tab='rolls']");
        rollTab.on("click", event => {
            if (this.delayedRender){
                this.render(false);
            }
        })

        const sceneTab = html.find("a[data-tab='scene']");
        sceneTab.on("click", event => {
            if (this.delayedRender){
                this.render(false);
            }
        })

        const gameInfoTab = html.find("a[data-tab='game_info']");
        gameInfoTab.on("click", event => {
            if (this.delayedRender){
                this.render(false);
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
                this.render(false);
        })
        const track_name = html.find("div[name='track_name']");
        const box = html.find("input[name='box']");
        box.on("click", event => this._on_click_box(event, html));
        //track_name.on("click", event => this._on_track_name_click(event, html));
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

        const refresh_fate_points = html.find("button[id='refresh_fate_points']");
        refresh_fate_points.on("click", event => this.refresh_fate_points(event, html));    

        const avatar = html.find("img[name='avatar']");
        avatar.on("contextmenu", event=> this._on_avatar_click(event,html));
        
        avatar.on("click", event => {
            console.log(event.target.id)
            let t_id = event.target.id.split("_")[0];
            let token = game.scenes.viewed.getEmbeddedDocument("Token", t_id);
            const sheet = token.actor.sheet;
            sheet.render(true, {token: token});
            sheet.maximize();
            sheet.toFront();
        })

        const fu_clear_rolls = html.find("button[id='fu_clear_rolls']");
        fu_clear_rolls.on("click", event => this._fu_clear_rolls(event, html));

        const fu_roll_button = html.find("button[name='fu_roll_button']");
        fu_roll_button.on("click",event => this._fu_roll_button(event, html));

        const select = html.find("select[class='skill_select']");

        select.on("focus", event => {
            this.selectingSkill = true;
        });

        select.on("click", event => {if (event.shiftKey) {this.shift = true}})
        select.on("change", event => this._selectRoll (event, html));

        select.on("blur", event => {
            this.selectingSkill = false;
            this.render(false);
        })

        const FUAspectNotes = html.find("textarea[name ='FUAspectNotesText']");
        FUAspectNotes.on("change", event => {
            let details = event.target.id.split("_");
            let token_id = details[0];
            let aspect = details[1];
            let token = game.scenes.viewed.getEmbeddedDocument("Token", token_id);
            let actor = token.actor;
            actor.update({[`data.aspects.${aspect}.notes`]:event.target.value});
        });

        const FUTrackNotesText = html.find("textarea[name ='FUTrackNotesText']");
        FUTrackNotesText.on("change", event => {
            let details = event.target.id.split("_");
            let token_id = details[0];
            let track = details[1];
            let token = game.scenes.viewedgame.scenes.viewed.getEmbeddedDocument("Token", token_id);
            let actor = token.actor;
            actor.update({[`data.tracks.${track}.notes`]:event.target.value});
        });

        const game_date_time = html.find(("textarea[id='game_date_time']"));
        game_date_time.on("change", event => {
            game.settings.set("ModularFate", "gameTime", event.target.value);
            game.socket.emit("system.ModularFate",{"render":true});
        })

        const game_notes = html.find(("div[id='game_notes']"));

        game_notes.on("focus", event => {
            this.editing=true;
        })

        game_notes.on("blur", event => {
            game.settings.set("ModularFate", "gameNotes", event.target.innerHTML);
            game.socket.emit("system.ModularFate",{"render":true});
            this.editing = false;
        })

        const add_game_aspect = html.find("button[id='add_game_aspect']")
        add_game_aspect.on("click", event => this._add_game_aspect(event, html));

        //Situation Aspect Buttons
        const del_game_aspect = html.find("button[name='del_game_aspect']");
        del_game_aspect.on("click", event => this._del_game_aspect(event, html));
        const game_a_free_i = html.find("input[name='game_a_free_i']");
        game_a_free_i.on("change", event => this._game_a_free_i_button(event, html));
    }

    async _sit_aspect_change(event, html){
        let index = event.target.id.split("_")[0];
        let aspects = duplicate(game.scenes.viewed.getFlag("ModularFate","situation_aspects"));
        let aspect = aspects[index];

        let drawing = undefined;
        if (aspect.name != "") {
            drawing = canvas?.drawings?.objects?.children?.find(drawing => drawing.data?.text?.startsWith(aspect.name));
        }
        
        aspect.name = event.target.value;
        let value = aspect.free_invokes;

        if (drawing != undefined){
            let text;
            if (value == 1){
                text = aspect.name+` (${value} ${game.i18n.localize("ModularFate.freeinvoke")})`;    
            } else {
                text = aspect.name+` (${value} ${game.i18n.localize("ModularFate.freeinvokes")})`;
            }
            let size = game.settings.get("ModularFate","fuAspectLabelSize");
            let font = CONFIG.fontFamilies[game.settings.get("ModularFate","fuAspectLabelFont")];
            if (size === 0){
                size = game.scenes.viewed.data.width*(1/100);
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

        game.scenes.viewed.setFlag("ModularFate", "situation_aspects",aspects);
        game.socket.emit("system.ModularFate",{"render":true});
    }

    async _del_game_aspect(event, html){
        let del =   ModularFateConstants.confirmDeletion();
        if (del){
            let id = event.target.id;
            let name = id.split("_")[1];
            let game_aspects = duplicate(game.settings.get("ModularFate", "gameAspects"));
            game_aspects.splice(game_aspects.findIndex(sit => sit.name == name),1);
            await game.settings.set("ModularFate","gameAspects",game_aspects);
            game.socket.emit("system.ModularFate",{"render":true});
            this.render(false);
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
            game_aspects = duplicate(game.settings.get("ModularFate","gameAspects"));
        } catch {
        }                                
        game_aspects.push(aspect);
        await game.settings.set("ModularFate","gameAspects",game_aspects);
        game.socket.emit("system.ModularFate",{"render":true});
        this.render(false);
    }

    async _game_a_free_i_button(event,html){
        let index=event.target.id.split("_")[0];
        let value=html.find(`input[id="${index}_ga_free_invokes"]`)[0].value
        let game_aspects = duplicate(game.settings.get("ModularFate","gameAspects"));
        let aspect = game_aspects[index];
        aspect.free_invokes = value;
        await game.settings.set("ModularFate","gameAspects",game_aspects);
        game.socket.emit("system.ModularFate",{"render":true});
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
        await this.render(false);
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
        await this.render(false);
    }

    async tokenNameChange(event, html){
        let t_id = event.target.id.split("_")[0];
        let token = game.scenes.viewed.getEmbeddedDocument("Token", t_id);
        if (token != undefined){
            let name = await ModularFateConstants.updateShortText(game.i18n.localize("ModularFate.whatShouldTokenNameBe"),token.data.name);
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
        let rank = token.actor.data.data.skills[skill].rank;
        let ladder = ModularFateConstants.getFateLadder();
        let rankS = rank.toString();
        let rung = ladder[rankS];

        if (this.shift && !sk.value.startsWith("stunt")) {
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
                let roll = r.roll();
                let name = game.user.name

                let flavour;
                if (stunt != undefined){
                    flavour = `<h1>${skill}</h1>${game.i18n.localize("ModularFate.RolledBy")}: ${game.user.name}<br>
                                ${game.i18n.localize("ModularFate.SkillRank")}: ${rank} (${rung})<br> 
                                ${game.i18n.localize("ModularFate.Stunt")}: ${stunt} (+${bonus})`
                } else {
                    flavour = `<h1>${skill}</h1>${game.i18n.localize("ModularFate.RolledBy")}: ${game.user.name}<br>
                                ${game.i18n.localize("ModularFate.SkillRank")}: ${rank} (${rung})`;
                }

                roll.toMessage({
                    flavor: flavour,
                    speaker: ChatMessage.getSpeaker(token),
                });
        }
        this.selectingSkill = false;
        this.render(false);
    }

    async _notesFocusOut(event, html){
        let notes = html.find("div[id='scene_notes']")[0].innerHTML
        game.scenes.viewed.setFlag("ModularFate","sceneNotes",notes);
        this.editing=false;
    }

    async _fu_roll_button(event, html){
        let detail = event.target.id.split("_");
        let index = detail[1];
        let action = detail[2];
        let rolls = duplicate(game.scenes.viewed.getFlag("ModularFate","rolls"));
        let roll = rolls[index]
        
        if (action == "plus1"){
            roll.total+=1;
            roll.flavor+=`<br>${game.i18n.localize("ModularFate.PlusOne")}`
            if (game.user.isGM){
                game.scenes.viewed.setFlag("ModularFate", "rolls", rolls);
            } else {
                //Create a socket call to update the scene's roll data
                game.socket.emit("system.ModularFate",{"rolls":rolls, "scene":game.scenes.viewed})
            }
        }

        if (action == "plus2free"){
            roll.total+=2;
            roll.flavor+=`<br>${game.i18n.localize("ModularFate.FreeInvoke")}`
            if (game.user.isGM){ 
                game.scenes.viewed.setFlag("ModularFate", "rolls", rolls);
            }
            else {
                //Create a socket call to update the scene's roll data
                game.socket.emit("system.ModularFate",{"rolls":rolls, "scene":game.scenes.viewed})
            }
        }

        if (action == "reroll"){
            let r = new Roll ("4dF");
            let r2 = r.roll();
            r2.toMessage({
                flavor: `<h1>${game.i18n.localize("ModularFate.FreeRerollExplainer")}</h1>${game.i18n.localize("ModularFate.RolledBy")}: ${game.user.name}<br>`
            });
            let oldDiceValue = 0;
            for (let i = 0; i< 4; i++){
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
            roll.flavor+=`<br>${game.i18n.localize("ModularFate.FreeInvokeReroll")}`
            if (game.user.isGM){
                game.scenes.viewed.setFlag("ModularFate", "rolls", rolls);
            } else {
                //Create a socket call to update the scene's roll data
                game.socket.emit("system.ModularFate",{"rolls":rolls, "scene":game.scenes.viewed})
            }
        }

        if (action == "plus2fp"){
            //Find the right character and deduct one from their fate points

            let user = game.users.contents.find(u => u.id == roll.user._id)

            if (user.isGM){
                let fps = user.getFlag("ModularFate","gmfatepoints");
                if (fps == 0 || fps == undefined){
                    ui.notifications.error(game.i18n.localize("ModularFate.NoGMFatePoints"))
                } else {
                    user.setFlag("ModularFate","gmfatepoints",fps-1);
                    roll.total+=2;
                    roll.flavor+=`<br>${game.i18n.localize("ModularFate.PaidInvoke")}`
                    game.scenes.viewed.setFlag("ModularFate", "rolls", rolls);
                }
            } else {
                let char = user.character;
                if (char.name == roll.speaker){
                    let fps = char.data.data.details.fatePoints.current;
                    if (fps == 0){
                        ui.notifications.error(game.i18n.localize("ModularFate.NoFatePoints"))
                    } else {
                        char.update({"data.details.fatePoints.current":fps-1})
                        roll.total+=2;
                        roll.flavor+=`<br>${game.i18n.localize("ModularFate.PaidInvoke")}`
                        if (game.user.isGM){
                            game.scenes.viewed.setFlag("ModularFate", "rolls", rolls);
                        } else {
                            game.socket.emit("system.ModularFate",{"rolls":rolls, "scene":game.scenes.viewed})
                        }
                    }
                } else {
                    ui.notifications.error(game.i18n.localize("ModularFate.NotControllingCharacter"));
                }
            }
        }

        if (action == "rerollfp"){
            //Find the right character and deduct one from their fate points
            let user = game.users.contents.find(user => user.id == roll.user._id)

            if (user.isGM){
                let fps = user.getFlag("ModularFate","gmfatepoints");
                if (fps == 0 || fps == undefined){
                    ui.notifications.error(game.i18n.localize("ModularFate.NoGMFatePoints"))
                } else {
                    user.setFlag("ModularFate","gmfatepoints",fps-1);
                    let r = new Roll ("4dF");
                    let r2 = r.roll();
                    r2.toMessage({
                        flavor: `<h1>${game.i18n.localize("ModularFate.PaidRerollExplainer")}</h1>${game.i18n.localize("ModularFate.RolledBy")}: ${game.user.name}<br>`
                    });
                    let oldDiceValue = 0;
                    for (let i = 0; i< 4; i++){
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
                    roll.flavor+=`<br>${game.i18n.localize("ModularFate.PaidInvokeReroll")}`
                    game.scenes.viewed.setFlag("ModularFate", "rolls", rolls);
                }
            } else {
                let char = user.character;
                if (char.name == roll.speaker){
                    let fps = char.data.data.details.fatePoints.current;
                    if (fps == 0){
                        ui.notifications.error(game.i18n.localize("ModularFate.NoFatePoints"))
                    } else {
                        char.update({"data.details.fatePoints.current":fps-1})
                        roll.flavor+=`<br>${game.i18n.localize("ModularFate.PaidInvokeReroll")}`
                        let r = new Roll ("4dF");
                        let r2 = r.roll();
                        r2.toMessage({
                            flavor: `<h1>${game.i18n.localize("ModularFate.PaidRerollExplainer")}</h1>${game.i18n.localize("ModularFate.RolledBy")}: ${game.user.name}<br>`
                        });
                        let oldDiceValue = 0;
                        for (let i = 0; i< 4; i++){
                            oldDiceValue += roll.dice[i]
                        }
                        roll.total -= oldDiceValue;
                        roll.dice = r2.dice[0].values;
                        roll.total += r2.total;
                        if (game.user.isGM){
                            game.scenes.viewed.setFlag("ModularFate", "rolls", rolls);
                        } else {
                            game.socket.emit("system.ModularFate",{"rolls":rolls, "scene":game.scenes.viewed})
                        }
                    }
                } else {
                    ui.notifications.error(game.i18n.localize("ModularFate.NotControllingCharacter"))
                }
            }
        }
    }

    async _fu_clear_rolls(event,html){
        game.scenes.viewed.unsetFlag("ModularFate","rolls");
    }

    async _on_avatar_click(event, html){
        if (game.user.isGM){
            let fu_actor_avatars = game.settings.get("ModularFate","fu_actor_avatars");
            let t_id = event.target.id.split("_")[0];
            let token = game.scenes.viewed.getEmbeddedDocument("Token", t_id);
            if (!fu_actor_avatars){
                ui.notifications.info("Switching to actor avatars");
                await game.settings.set("ModularFate","fu_actor_avatars",true);
            } else {
                if (fu_actor_avatars){
                    ui.notifications.info("Switching to token avatars");
                    await game.settings.set("ModularFate","fu_actor_avatars",false);
                }
            }
            this.render(false);
            game.socket.emit("system.ModularFate",{"render":true});
        }
    }

    async refresh_fate_points(event, html){
        let tokens = game.scenes.viewed.tokens.contents;
        let updates = [];
        for (let i = 0; i < tokens.length; i++){
            let token = tokens[i];
        
            if (token.actor == null || !token.actor.hasPlayerOwner || token.actor.data.type == "Thing"){
                continue;
            }
            let current = parseInt(token.actor.data.data.details.fatePoints.current);
            let refresh = parseInt(token.actor.data.data.details.fatePoints.refresh);

            if (current < refresh){
                current = refresh;
            }
            updates.push({"_id":token.actor.id,"data.details.fatePoints.current":current})
        }
        Actor.updateDocuments(updates)
    }

    async _edit_player_points(event, html){
        let id = event.target.id;
        let parts = id.split("_");
        let t_id = parts[0]
        let token = game.scenes.viewed.getEmbeddedDocument("Token", t_id);
        let fps = parseInt(event.target.value);

        token.actor.update({
            ["data.details.fatePoints.current"]: fps
        })
    }

    async _edit_gm_points(event, html){
        let user = game.users.contents.find(user => user.id == event.target.id);
        let fp = parseInt(event.target.value)
        user.setFlag("ModularFate","gmfatepoints",fp);
    }

    async scene_notes_edit(event,html){
        this.editing = true;
    }

    async _free_i_button(event,html){
        let index=event.target.id.split("_")[0];
        let value=html.find(`input[id="${index}_free_invokes"]`)[0].value
        let situation_aspects = duplicate(game.scenes.viewed.getFlag("ModularFate","situation_aspects"))
        let aspect = situation_aspects[index];
        let name = aspect.name;
        aspect.free_invokes = value;
        game.scenes.viewed.setFlag("ModularFate","situation_aspects",situation_aspects);
        //Done: Add code to change number of free invokes showing on the scene note for this aspect, if it exists.
        let drawing = canvas?.drawings?.objects?.children?.find(drawing => drawing.data?.text?.startsWith(name));
        if (drawing != undefined){
            let text;
            if (value == 1){
                text = name+` (${value} ${game.i18n.localize("ModularFate.freeinvoke")})`;    
            } else {
                text = name+` (${value} ${game.i18n.localize("ModularFate.freeinvokes")})`;
            }
            let size = game.settings.get("ModularFate","fuAspectLabelSize");
            let font = CONFIG.fontFamilies[game.settings.get("ModularFate","fuAspectLabelFont")];
            if (size === 0){
                size = game.scenes.viewed.data.width*(1/100);
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
        let name = game.scenes.viewed.getFlag("ModularFate","situation_aspects")[index].name;
        let drawing = canvas?.drawings?.objects?.children?.find(drawing => drawing.data?.text?.startsWith(name));
        
        if (drawing != undefined) {
            let x = drawing.data.x;
            let y = drawing.data.y;
            canvas.animatePan({x:x, y:y});
        }
    }

    async _addToScene(event, html){
        let index=event.target.id.split("_")[1];
        let value=html.find(`input[id="${index}_free_invokes"]`)[0].value;
        let name = game.scenes.viewed.getFlag("ModularFate","situation_aspects")[index].name;
        
        if (canvas?.drawings?.objects?.children?.find(drawing => drawing.data?.text?.startsWith(name))==undefined)
        {
            let text;
            if (value == 1){
                text = name+` (${value} ${game.i18n.localize("ModularFate.freeinvoke")})`;    
            } else {
                text = name+` (${value} ${game.i18n.localize("ModularFate.freeinvokes")})`;
            }
                let size = game.settings.get("ModularFate","fuAspectLabelSize");
                let font = CONFIG.fontFamilies[game.settings.get("ModularFate","fuAspectLabelFont")];
                if (size === 0){
                    size = game.scenes.viewed.data.width*(1/100);
                }
                let height = size * 2;
                let width = (text.length * size / 1.5);
                DrawingDocument.create({
                    type: CONST.DRAWING_TYPES.RECTANGLE,
                    author: game.user.id,
                    x: canvas.stage.pivot._x,
                    y: canvas.stage.pivot._y,
                    width: width,
                    height: height,
                    fillType: CONST.DRAWING_FILL_TYPES.SOLID,
                    fillColor: "#FFFFFF",
                    fillAlpha: 1,
                    strokeWidth: 4,
                    strokeColor: "#000000",
                    strokeAlpha: 1,
                    text: text,
                    fontFamily: font,
                    fontSize: size,
                    textColor: "#000000",
                    points: []
                }, {parent: game.scenes.viewed});   
        }
        else {
            ui.notifications.error(game.i18n.localize("ModularFate.AlreadyANoteForThatAspect"));
        }
    }

    async _del_sit_aspect(event, html){
        let del =   ModularFateConstants.confirmDeletion();
        if (del){
            let id = event.target.id;
            let index = id.split("_")[1];
            let situation_aspects = duplicate(game.scenes.viewed.getFlag("ModularFate", "situation_aspects"));
            let name = situation_aspects[index].name;
            situation_aspects.splice(index,1);
            game.scenes.viewed.setFlag("ModularFate","situation_aspects",situation_aspects);
        
            //If there's a note on the scene for this aspect, delete it
            let drawing = undefined;

            if (name !="") {
                drawing = canvas?.drawings?.objects?.children?.find(drawing => drawing.data?.text?.startsWith(name));
            }
            if (drawing != undefined){
                drawing.delete();
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
            situation_aspects = duplicate(game.scenes.viewed.getFlag("ModularFate","situation_aspects"));
        } catch {
        }                                
        situation_aspects.push(situation_aspect);
        game.scenes.viewed.setFlag("ModularFate","situation_aspects",situation_aspects);
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
            situation_aspects = duplicate(game.scenes.viewed.getFlag("ModularFate","situation_aspects"));
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
            game.scenes.viewed.setFlag("ModularFate","situation_aspects",situation_aspects);
       } else {
       }
    }

    async _saveNotes(event, html){
        this.editing=false;
    }

    async _clear_fleeting(event, html){
        let tokens = game.scenes.viewed.tokens.contents;
        for (let i = 0; i<tokens.length; i++){
            this.clearFleeting(tokens[i].actor)
        }
    }

    async _on_aspect_change(event, html){
        let id = event.target.id;
        let parts = id.split("_");
        let t_id = parts[0];
        let name = parts[1];
        let text = event.target.value;
        let token = game.scenes.viewed.getEmbeddedDocument("Token", t_id);
        let tracks = duplicate(token.actor.data.data.tracks);
        let track = tracks[name]
        track.aspect.name=text;
        let previousText = `${token.actor.data.data.tracks[name].aspect.name} (${token.actor.name})`;
        token.actor.update({[`data.tracks.${name}.aspect`]:track.aspect})

        // See if this aspect exists in the list of game aspects and update it if so.
        let newText = `${text} (${token.actor.name})`;

        let situation_aspects = duplicate(game.scenes.viewed.getFlag("ModularFate","situation_aspects"));
        let aspect = situation_aspects.find(aspect => aspect.name == previousText);

        if (aspect == undefined){
            return;
        }
        if (text == ""){
            situation_aspects.splice(situation_aspects.indexOf(aspect),1);
            await game.scenes.viewed.setFlag("ModularFate","situation_aspects",situation_aspects);
            let d = canvas?.drawings?.objects?.children?.find(drawing => drawing.data?.text?.startsWith(previousText));
            try {
                d.delete();
            } catch (err) {

            }
            return;
        }
        aspect.name = newText;

        await game.scenes.viewed.setFlag("ModularFate","situation_aspects",situation_aspects);

        let drawing = undefined;
        if (aspect.name != "") {
            drawing = canvas?.drawings?.objects?.children?.find(drawing => drawing.data?.text?.startsWith(previousText));
        }

        if (drawing != undefined){
            let text;
            let value = aspect.free_invokes;
            if (value == 1){
                text = aspect.name+` (${value} ${game.i18n.localize("ModularFate.freeinvoke")})`;    
            } else {
                text = aspect.name+` (${value} ${game.i18n.localize("ModularFate.freeinvokes")})`;
            }
            let size = game.settings.get("ModularFate","fuAspectLabelSize");
            let font = CONFIG.fontFamilies[game.settings.get("ModularFate","fuAspectLabelFont")];
            if (size === 0){
                size = game.scenes.viewed.data.width*(1/100);
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
        let tracks = duplicate(token.actor.data.data.tracks);
        let track = tracks[name]
        track.box_values[index] = checked;
        //console.log(token);
        await token.actor.update({
            ["data.tracks"]: tracks
        })
    }


    async _on_track_name_click(event, html) {
        // Launch a simple application that returns us some nicely formatted text.
        //First, get the token
        let token_id = event.target.id;
        let token = game.scenes.viewed.getEmbeddedDocument("Token", token_id);
        let tracks = duplicate(token.actor.data.data.tracks);
        let track = tracks[event.target.innerHTML]
        let notes = track.notes;
        let text =  await ModularFateConstants.updateText(game.i18n.localize("ModularFate.TrackNotes"), notes);
        token.actor.update({
            [`data.tracks.${event.target.innerHTML}.notes`]: text
        })
    }

    async _timed_event (event, html){
        let te = new TimedEvent();
        te.createTimedEvent();
    }

    async _onPopcornButton(event, html){

        let type = event.target.id.split("_")[1];
        let id = event.target.id.split("_")[0];

        if (type.startsWith("act")){
            let t_id = id;
            let token = game.scenes.viewed.getEmbeddedDocument("Token", t_id);
            await token.actor.setFlag("ModularFate","hasActed", true);
        }

        if (type === "unact"){
            let t_id = id;
            let token = game.scenes.viewed.getEmbeddedDocument("Token", t_id);
            await token.actor.setFlag("ModularFate","hasActed", false);
        }

        if (type === "find"){
            let t_id = id;
            let token = game.scenes.viewed.getEmbeddedDocument("Token", t_id);
            canvas.animatePan(token, 1);
            if (token.isOwner) {
                token.object.control({releaseOthers:true});
            }
        }

        if (type === "sheet"){
            let t_id = id;
            let token = game.scenes.viewed.getEmbeddedDocument("Token", t_id);
            const sheet = token.actor.sheet;
            sheet.render(true, {token: token});
            sheet.maximize();
            sheet.toFront();
        }
    }

    async _onPopcornRemove(event, html){
        
        let id = event.target.id.split("_")[0];
        await game.combats.active.getCombatantByToken(id).delete();
        let token = game.scenes.viewed.getEmbeddedDocument("Token", t_id);;
        await token.setFlag("ModularFate","hasActed",false);
    }

    async _endButton(event, html){
        let combatants = game.combat.combatants;
        let fin = await Promise.resolve(game.combat.endCombat());
        if (fin != false){
                let updates = combatants.map(combatant => {
                                let update = {};
                                update._id = combatant.token.actor.id;
                                update.flags = {
                                                    "ModularFate":
                                                    {
                                                        "hasActed":false
                                                    }
                                                }        
                                        return update;
                                })
            await Actor.updateDocuments(updates);
        }
    }

    async _nextButton(event, html){
        let combatants = game.combat.combatants;
            let updates = combatants.map(combatant => {
                            let update = {};
                            update._id = combatant.actor.id;
                            update.flags = {
                                                "ModularFate":
                                                {
                                                    "hasActed":false
                                                }
                                            }        
                                    return update;
                            })
        await Actor.updateDocuments(updates);
        game.combat.nextRound();
    }

    //Set up the default options for instances of this class
    static get defaultOptions() {
        const options = super.defaultOptions; //begin with the super's default options
        //The HTML file used to render this window
        options.template = "systems/ModularFate/templates/FateUtilities.html"; 
        options.width=window.innerWidth*0.5;
        options.height=window.innerHeight*0.9;
        options.title = game.i18n.localize("ModularFate.FateUtilities");
        options.id = "FateUtilities"; // CSS id if you want to override default behaviors
        options.resizable = true;
        options.scrollY=["#aspects", "#fu_game_info_tab", "#fu_aspects_tab","#fu_tracks_tab", "#fu_scene_tab", "#fu_scene_pane", "#fu_rolls_tab", "#fu_conflict_tracker", "#fu_aspects_pane", "#fu_scene_notes", "#fu_aspects_pane", "#fu_scene_notes_pane"]

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
    let init_skill = game.settings.get("ModularFate","init_skill");
    let tracker_disabled = false;
    
    if (init_skill !== "None" || init_skill === "Disabled"){
        tracker_disabled = true;
    }
    
    const data = {};
    if (game.combat==null || tracker_disabled){
        data.conflict = false;
    } else {
        data.conflict = true;

        //Let's build a list of the tokens from game.scenes.viewed.tokens.contents and feed them to the presentation layer
        let c = game.combat.combatants;
        let tokens = [];
        let has_acted = [];
        let tokenId = undefined;
        c.forEach(comb => {
                tokenId= comb?.token?.id;
                let foundToken = undefined;
                let hidden = false;
                let hasActed = false;

                if (tokenId != undefined){
                    foundToken = game.scenes.viewed.getEmbeddedDocument("Token", tokenId);
                }

                if (foundToken == undefined){
                    return;
                }

                if (comb.defeated){
                    hidden = true;
                }

                if ((comb.hidden || foundToken.data.hidden) && !game.user.isGM){
                    hidden = true;
                } 

                hasActed = foundToken.actor.getFlag("ModularFate","hasActed");                       
                
                if ((hasActed == undefined || hasActed == false) && hidden == false){
                    tokens.push(foundToken)
                }
                else {
                    if (hasActed == true && hidden == false){
                        has_acted.push(foundToken);
                    }
                }
        })
        ModularFateConstants.sort_key(has_acted,"name");
        ModularFateConstants.sort_key(tokens,"name");
        data.has_acted_tokens = has_acted;
        data.combat_tokens=tokens;
        data.exchange = game.combat.round;   
    }
    let all_tokens = [];
    let notes = game?.scenes?.viewed?.getFlag("ModularFate","sceneNotes");
    if (notes == undefined){
        notes = ""
    }
    data.notes = notes;
    game?.scenes?.viewed?.tokens?.contents?.forEach(token => {
        if (token.actor != null && token.actor.data.type != "Thing" && (token.data.hidden == false || game.user.isGM)){
            all_tokens.push(token)
        } 
    })

    let situation_aspects = game?.scenes?.viewed?.getFlag("ModularFate","situation_aspects")
    if (situation_aspects == undefined){
        situation_aspects = [];
    }
    situation_aspects = duplicate(situation_aspects);
    
    data.situation_aspects = situation_aspects;
    ModularFateConstants.sort_key(all_tokens, "name");
    data.all_tokens = all_tokens;
    data.GM=game.user.isGM;
    
    let GMUsers={};
    game.users.contents.forEach(user => {
        if (user.isGM){
            GMUsers[user.name]=user;
            GMUsers[user.name]["fatepoints"]=user.getFlag("ModularFate","gmfatepoints")
        }
    })
    data.GMUsers = GMUsers;

    data.category=this.category;
    let categories = new Set();
    for (let token of all_tokens){
        for (let t in token.actor.data.data.tracks){
            categories.add(token.actor.data.data.tracks[t].category);
        }
    }
    data.categories = Array.from(categories);
    data.tokenAvatar = !game.settings.get("ModularFate","fu_actor_avatars");

    //Let's get the list of Fate rolls made
    let rolls = game?.scenes?.viewed?.getFlag("ModularFate","rolls");
    if (rolls == undefined){
        rolls = [];
    }
    data.rolls = rolls;
    data.user = game.user;
    let aspects = game.settings.get("ModularFate","gameAspects");

    data.game_aspects = aspects;
    data.game_time = game.settings.get("ModularFate","gameTime");
    data.game_notes = game.settings.get("ModularFate","gameNotes");
    data.fontSize = game.settings.get("ModularFate","fuFontSize");
    data.height = this.position.height;
    data.combatants_only = game.settings.get("ModularFate","fu_combatants_only");

    if (data.combatants_only && data.conflict){
        let combatTokens = data.combat_tokens.concat(data.has_acted_tokens);
        data.all_tokens = data.all_tokens.filter(t=>combatTokens.indexOf(t) != -1);
    }
    data.numConflicts = game.combats.contents.filter(c => c.data.scene == game.scenes.viewed.id).length;

    let aspectsHeight = situation_aspects.length * 45;

    data.fuPaneHeight = (this.position.height - 250) / 2;

    let modifier = data.fuPaneHeight - aspectsHeight;
    if (modifier < 0) modifier = 0;
    data.fuNotesHeight = (this.position.height - 220) / 2 - 35 + modifier;

    data.gameAspectsHeight = 180;
    let gaModifier = data.gameAspectsHeight - data.game_aspects.length * 45;
    if (gaModifier <0) gaModifier = 0;
    data.gameNotesHeight = (this.position.height - 525) + gaModifier;
    if (data.gameNotesHeight < 0) data.gameNotesHeight = 75;
    
    return data;
}

async render (...args){
    if (this.editing == false && (this.selectingSkill == false || this.selectingSkill == undefined)){
        await super.render(...args);
    } else {
        this.renderBanked = true;
    }
}

async renderMe(...args){
    let tab = this._tabs[0].active;

    if (args[0][1]?.flags?.ModularFate?.rolls != undefined){
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
        }
        if (args[2] === false){
            $(`.${args[1]}_fu`).removeClass("fu_controlled");
        }
        return;
    }
    //Code to execute when a hook is detected by ModularFate. Will need to tackle hooks for Actor
    //Scene, User, and Combat.
    //The following code debounces the render, preventing multiple renders when multiple simultaneous update requests are received.
    if (!this.renderPending) {
        this.renderPending = true;
        setTimeout(() => {
          this.render(false);
          this.delayedRender = false;
          this.renderPending = false;
        }, 0);
      }
}

async clearFleeting(object){
        //This is a convenience method which clears all fleeting Tracks.
        let tracks = {};
        let updates = [];
        if (object.data.data.tracks != undefined) {
            tracks = duplicate(object.data.data.tracks);
        }
        
        for (let t in tracks){
            let track = tracks[t];
            if (track.recovery_type == "Fleeting"){
                for (let i = 0; i < track.box_values.length; i++){
                    track.box_values[i] = false;
                }
                if (track.aspect.name != undefined){
                    track.aspect.name = "";
                }
            }
        }
        updates.push({"_id":object.id, ["data.tracks"]:tracks})
        
        Actor.updateDocuments(updates)
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
                    title:game.i18n.localize("ModularFate.LaunchFateUtilities"),
                    icon:"fas fa-theater-masks",
                    onClick: async ()=> {let fu = new FateUtilities; await fu.render(true); $('#FateUtilities').css({zIndex: Math.min(++_maxZ, 9999)});},
                    button:true
                });
            }
})

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
                "title": game.i18n.localize("ModularFate.Error"),
                "content": `${game.i18n.localize("ModularFate.NoCurrentCombat")}<p>`,
                default:"oops",
                "buttons": {
                    oops: {
                        label: game.i18n.localize("ModularFate.OK"),
                    }
                }
            }
            let d = new Dialog(dp);
            d.render(true);
        }
        if (currentRound != "NoCombat"){
            var peText = `${game.i18n.localize("ModularFate.NoPendingEvents")}<p></p>`
            let pendingEvents = game.combat.getFlag("ModularFate","timedEvents");
            if (pendingEvents != null || pendingEvents != undefined){
                peText=
                `<tr>
                    <td style="font-weight:bold">${game.i18n.localize("ModularFate.Exchange")}</td>
                    <td style="font-weight:bold">${game.i18n.localize("ModularFate.PendingEvent")}</td>
                </tr>`
                pendingEvents.forEach(event => {
                    if (event.complete === false){
                        peText+=`<tr><td>${event.round}</td><td>${event.event}</td></tr>`
                    }
                });
            }
            var dp = {
                "title":game.i18n.localize("ModularFate.TimedEvent"),
                "content":`<h1>${game.i18n.localize("ModularFate.CreateATimedEvent")}</h1>
                            ${game.i18n.localize("ModularFate.TheCurrentExchangeIs")} ${game.combat.round}.<p></p>
                            <table style="background:none; border:none">
                                ${peText}
                            </table>
                            <table style="background:none; border:none">
                                <tr>
                                    <td>${game.i18n.localize("ModularFate.WhatIsYourEvent")}:</td>
                                    <td><input type="text" id="eventToCreate" name="eventToCreate" style="background: white; color: black;" autofocus></input></td>
                                </tr>
                                <tr>
                                    <td>${game.i18n.localize("ModularFate.TriggerEventOnExchange")}:</td>
                                    <td><input type="number" value="${game.combat.round+1}" id="eventExchange" name="eventExchange"></input></td>
                                </tr>
                            </table>`,
                    default:"create",
                    "buttons":{
                        create:{label:game.i18n.localize("ModularFate.Create"), callback:async () => {
                            //if no flags currently set, initialise
                            var timedEvents = game.combat.getFlag("ModularFate","timedEvents");
                            
                            if (timedEvents ==null || timedEvents == undefined){
                                game.combat.setFlag("ModularFate","timedEvents",[
                                                                                        {   "round":`${document.getElementById("eventExchange").value}`,
                                                                                            "event":`${document.getElementById("eventToCreate").value}`,
                                                                                            "complete":false
                                                                                        }
                                                                                ])
                                                                                timedEvents=game.combat.getFlag("ModularFate","timedEvents");
                            } else {
                                timedEvents.push({   
                                                    "round":`${document.getElementById("eventExchange").value}`,
                                                    "event":`${document.getElementById("eventToCreate").value}`,
                                                    "complete":false
                                });
                                game.combat.setFlag("ModularFate","timedEvents",timedEvents);
                                
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

Hooks.on('renderCombatTracker', () => {
    try {
        var r = game.combat.round;
        let pendingEvents = game.combat.getFlag("ModularFate","timedEvents");
        for (let i = 0; i<pendingEvents.length;i++){
            var event = pendingEvents[i];
            if (r==event.round && event.complete != true){
                var dp = {
                    "title": game.i18n.localize("ModularFate.TimedEvent"),
                    "content":`<h2>${game.i18n.localize("ModularFate.TimedEventForExchange")} ${event.round}:</h2><p></p>
                                <h3>${event.event}</h3>`,
                    default:"oops",
                    "buttons": {
                        oops: {
                            label: game.i18n.localize("ModularFate.OK"),
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

Hooks.on('createChatMessage', (message) => {
    // We're only interested if this is a chat message with a roll in it
    if (message.data.roll == undefined || message?.data?.flavor?.startsWith("<h1>Reroll")){
        return;
    }

    // We only need to take action on this if we're the first logged-in GM.
    if (game.users.contents.find(user => user.active && user.isGM) == game.user){
        let roll = JSON.parse(message.data.roll)
        if (roll.formula.startsWith("4df") || roll.formula.startsWith("4dF")){
            //We're not interested in it unless it's a Fate roll.
            //If it is, we want to add this to the array of rolls in the scene's flags.
            let speaker = message.data.speaker.alias;
            let flavor = message.data.flavor;
            let formula = roll.formula;
            let total = roll.total;
            let dice ="";
            let diceResult = message.roll.dice[0].values;
            if (diceResult == undefined){
                let d = message.roll.dice[0].rolls;
                diceResult = [];
                for (let i=0; i< d.length; i++){
                    diceResult.push(d[i].roll)
                }
            }
            let user = message.user;
            let rolls = game?.scenes?.viewed?.getFlag("ModularFate","rolls");
            if (rolls == undefined){
                rolls = [];
            }
            rolls=duplicate(rolls);
            
            let mFRoll = {
                "speaker":speaker,
                "formula":formula,
                "flavor":flavor,
                "total":total,
                "dice":diceResult,
                "user":user
            }
            rolls.push(mFRoll);

            game.scenes.viewed.setFlag("ModularFate","rolls",rolls);
        }
    }
})

Hooks.once('ready', async function () {
    if (game.user.isGM){
        game.socket.on("system.ModularFate", rolls => {
            updateRolls(rolls);
        })
    }

    game.socket.on("system.ModularFate", render => {
        if (render.render){
            let FU = Object.values(ui.windows).find(window=>window.options.id=="FateUtilities");
            if (FU != undefined){
                let tab = FU._tabs[0].active;

                if (tab !== "game_info"){
                    FU.delayedRender = true; 
                    return;
                } else {
                    FU.render(false);
                }
            }
        }
    })
})

async function updateRolls (rolls) {
    if (rolls.rolls != undefined && game.users.contents.find(user => user.active && user.isGM) == game.user){
        
        let scene = game.scenes.get(rolls.scene._id);
        let currRolls = scene.getFlag("ModularFate","rolls"); 
        if (currRolls == undefined){
            currRolls = [];
        }
        currRolls = duplicate(currRolls);
        let endRolls = mergeObject(currRolls, rolls.rolls);
        scene.setFlag("ModularFate","rolls",endRolls);
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