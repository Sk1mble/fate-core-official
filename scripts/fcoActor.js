export class fcoActor extends Actor {

    get visible(){
        if (this.type === "Thing" && game.system.showThings !== true){
            return false;
        } 
        else {
            return super.visible;
        }
    }

    // Override the standard createDialog to just spawn a character called 'New Actor'.
    static async createDialog (...args){
        let perm  = {"default":CONST.DOCUMENT_OWNERSHIP_LEVELS[game.settings.get("fate-core-official", "default_actor_permission")]};

        if (args[0].folder) {
            Actor.create({"name":"New Character", "folder":args[0].folder, "type":"fate-core-official", ownership: perm});
        } else {
            Actor.create({"name":"New Character", "type":"fate-core-official", ownership: perm});
        }
    }

    async _preCreate(...args){
        await super._preCreate(...args);

        if (this.type == "ModularFate" || this.type == "FateCoreOfficial"){
            this.updateSource({type:"fate-core-official"})
        }

        if (this?.system?.details?.fatePoints?.refresh === ""){
            this.updateSource(this.initialisefcoCharacter());
        }
    }

    static migrateData (data){
        // Convert all extra_tags to being extra_id.
        if (data.system){
            let toProcess = ["skills","stunts","aspects","tracks"];
            for (let item of toProcess){
                for (let sub_item in data.system[item]){
                    if (data.system[item][sub_item]?.extra_tag?.extra_id){
                        let id = data.system[item][sub_item]?.extra_tag?.extra_id;
                        delete data.system[item][sub_item].extra_tag;
                        data.system[item][sub_item].extra_id = id;
                    }
                }
            }
        }
        return super.migrateData(data);
    }

    async _preUpdate(data, options, user){
        await super._preUpdate(data, options, user);
        if (data.type == "ModularFate" || data.type == "FateCoreOfficial"){
            data.type = "fate-core-official"; 
        }
    }

    initialisefcoCharacter () {
        let actor = this;
        //Modifies the data of the supplied actor to add tracks, aspects, etc. from system settings, then returns the data.
        let working_data = actor.toJSON();
        // Logic to set up Refresh and Current
    
        let refresh = game.settings.get("fate-core-official", "refreshTotal");
    
        working_data.system.details.fatePoints.refresh = refresh;
        working_data.system.details.fatePoints.current = refresh;
        
        let p_skills=working_data.system.skills;
        
        //Check to see what skills the character has compared to the global skill list
            var skill_list = game.settings.get("fate-core-official","skills");
            // This is the number of skills the character has currently.
            //We only need to add any skills if this is currently 0,
            
            
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
    
            let aspects = game.settings.get("fate-core-official", "aspects");
            let player_aspects = duplicate(aspects);
            for (let a in player_aspects) {
                player_aspects[a].value = "";
            }
            //Now to store the aspect list to the character
            working_data.system.aspects = player_aspects;
        
            //Step one, get the list of universal tracks.
            let world_tracks = duplicate(game.settings.get("fate-core-official", "tracks"));
            let tracks_to_write = working_data.system.tracks;
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
                if (track.aspect == game.i18n.localize("fate-core-official.DefinedWhenMarked")) {
                    track.aspect = {};
                    track.aspect.name = "";
                    track.aspect.when_marked = true;
                    track.aspect.as_name = false;
                }
                if (track.aspect == game.i18n.localize("fate-core-official.AspectAsName") || track.aspect == game.i18n.localize("fate-core-official.NameAsAspect")) {
                    track.aspect = {};
                    track.aspect.when_marked = false;
                    track.aspect.as_name = true;
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
        working_data.system.tracks = tracks_to_write;
        let tracks = working_data.system.tracks;
        
        let categories = game.settings.get("fate-core-official", "track_categories");
        //GO through all the tracks, find the ones with boxes, check the number of boxes and linked skills and initialise as necessary.
        for (let t in tracks) {
            let track = tracks[t];
    
            if (track.universal) {
                track.enabled = true;
            }
    
            // Check for linked skills and enable/add boxes as necessary.
            if (track.linked_skills != undefined && track.linked_skills.length > 0 && Object.keys(working_data.system.skills).length > 0) {
                let skills = working_data.system.skills;
                let linked_skills = tracks[t].linked_skills;
                let box_mod = 0;
                for (let i = 0; i < linked_skills.length; i++) {
                    let l_skill = linked_skills[i].linked_skill;
                    let l_skill_rank = linked_skills[i].rank;
                    let l_boxes = linked_skills[i].boxes;
                    let l_enables = linked_skills[i].enables;
    
                    //Get the value of the player's skill
                    if (working_data.system.skills[l_skill] == undefined){
    
                    }else {
                        let skill_rank = working_data.system.skills[l_skill].rank;
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
        return working_data;
    }

    getHighest (data, test, extra_id){
        let count = 1;
        // Get the highest number on any item relating to this one.
        // data = aspects, stunts etc. test = aspect, stunt etc. name including integer if already applied
        for (let item in data){
            if (item == test){
                // If item = New Stunt, then New Stunt 2, New Stunt 3, etc. will all begin with this.
                // We need to find the highest number on other items that start with this name, and go one higher.
                // We should not add a number to ourselves if we're the only one that matches us.
                if (data[item]?.extra_id == extra_id){
                    // The item on the character sheet is from the extra being investigated; do nothing.
                } else {
                    // NOW we need to know how many other things there are that start with my name
                    for (let item2 in data){
                        if (item2.startsWith(test)){
                            // Increment the count, because this is something other than me that starts with the same name.
                            if (data[item2]?.extra_id !== extra_id){
                                count ++;
                            }
                        }
                    }
                }
            }
        }
        return count;
    }

    async updateFromExtra(itemData) {
        let actor = this;

        if (!itemData.active && !itemData.system.active) {
            // This currently adds the stuff to the character sheet even if active is false, which we do not want.
            return;
        }

        actor.sheet.editing = true;
            let extra = duplicate(itemData);
    
            //Find each aspect, skill, stunt, and track attached to each extra
            //Add an extra data item to the data type containing the id of the original item.
            //Done: Edit editplayertracks to be blind to any object with the extra data type defined
            //Done: Edit editplayerskills to be blind to any object with the extra data type defined
            //Done: Edit editplayeraspects to be blind to any object with the extra data type defined
            //Check to see if the thing is already on the character sheet. If it is, update with the version from the item (should take care of diffing for me and only do a database update if changed)
            //Done: Remove the ability to delete stunts bestowed upon the character by their extras (disable the delete button if extra_id != undefined)
            
            let stunts_output = {};
            let skills_output = {};
            let aspects_output = {};
            let tracks_output = {};
    
                let extra_name = extra.name;
                let extra_id = extra._id;
    
                let stunts = duplicate(extra.system.stunts);
        
                if (!Array.isArray(stunts)){
                    for (let stunt in stunts){
                        let count = this.getHighest(actor.system.stunts, stunt, extra_id);
                        if (count > 1) {
                            let count2 = this.getHighest(stunts, stunt, extra_id);
                            // Count is the number of things starting with this on the actor
                            // Count2 is the number of things starting with this on the extra
                            // Do I just use the higher value? I think that will work
                            if (count2 > count) count = count2
                        }

                        stunts[stunt].extra_id = extra_id;
                        stunts[stunt].original_name = stunt;
                        
                        if (count > 1){    
                            stunts[stunt].name = stunts[stunt].name + ` ${count}`;
                        }
                        stunts_output[stunts[stunt].name]=stunts[stunt];
                    }
                }
    
                let skills = duplicate(extra.system.skills);

                if (!Array.isArray(skills)){
                    let askills = duplicate(actor.system.skills);  
                    for (let skill in skills){
                        let hidden = skills[skill].hidden;
                        // If this and its constituent skills are NOT set to combine skills, we need to create an entry for this skill.
                        if (!extra.system.combineSkills && !skills[skill].combineMe){
                            let count = this.getHighest(askills, skill, extra_id);
                        
                            skills[skill].original_name = skill;
                            skills[skill].extra_id = extra_id;

                            if (count > 1) {
                                let count2 = this.getHighest(skills, skill, extra_id);
                                // Count is the number of things starting with this on the actor
                                // Count2 is the number of things starting with this on the extra
                                // Do I just use the higher value? I think that will work
                                if (count2 > count) count = count2
                            }
                            
                            if (count > 1){    
                                let count2 = this.getHighest(skills, skill, extra_id);
                                if (count2 > count) count = count2;
                                skills[skill].name = skills[skill].name + ` ${count}`;
                            }
                            skills_output[skills[skill].name]=skills[skill];
                        } else {
                            // We need to ensure the combined skills are setup correctly; if we've just removed the setting here then we need to rebuild
                            // We need to build all the combined skills here and make sure that they're returned properly in skills_output
                            let combined_skill;
                            for (let ask in askills){
                                if (ask == skill){
                                    // This is the skill that everything is being merged into; 
                                    // only the skill with the raw name of the extra_skill works for merging 
                                    combined_skill = askills[ask];
                                    if (combined_skill) combined_skill = duplicate(combined_skill);                                    
                                }
                            }
                            if (combined_skill && !combined_skill.extra_id){
                                // The skill is a real one from the character and we cannot combine with it.
                            } else {
                                // If it is null, it needs to be created. That can only happen if this extra is newly creating a merged skill.
                                if (!combined_skill){
                                    combined_skill = duplicate(skills[skill]);
                                    combined_skill.extra_id = extra_id;
                                }
                                // Now we know for a fact that the base combined_skill is there and we have a reference to it, we can set its ranks & hidden status:
                                // Combined skills should only be hidden if ALL the skills that combine are set to hidden.
                                if (combined_skill){
                                    combined_skill.rank = 0;
                                    for (let extra of this.items){
                                        if (extra.system.active){
                                            if (extra.system.combineSkills || extra.system.skills[skill]?.combineMe || combined_skill.extra_id == extra.id){
                                                let esk = extra.system.skills[skill];
                                                if (esk){
                                                    if (!esk.hidden) hidden = false;
                                                    combined_skill.rank += esk.rank;
                                                    combined_skill.hidden = hidden;
                                                }
                                            }
                                        }
                                    }
                                    skills_output[combined_skill.name] = combined_skill;
                                }
                            }
                        }
                    }
                }
                let aspects = duplicate(extra.system.aspects);

                if (!Array.isArray(aspects)){
                    for (let aspect in aspects){
                        let count = this.getHighest(actor.system.aspects, aspect, extra_id);
                        
                        aspects[aspect].original_name = aspect;
                        aspects[aspect].extra_id = extra_id;
                        
                        if (count > 1){
                            let count2 = this.getHighest(aspects, aspect, extra_id);
                            if (count2 > count) count = count2;
                            aspects[aspect].name = aspects[aspect].name + ` ${count}`;
                        }
                        aspects_output[aspects[aspect].name]=aspects[aspect];
                    }
                }
                
                let tracks = duplicate(extra.system.tracks);
                if (!Array.isArray(tracks)){
                    for (let track in tracks){
                        let count = this.getHighest(actor.system.tracks, track, extra_id);
                        
                        tracks[track].original_name = track;
                        tracks[track].extra_id = extra_id;
                        
                        if (count >1 ){
                            let count2 = this.getHighest(tracks, track, extra_id);
                            if (count2 > count) count = count2;
                            tracks[track].name = tracks[track].name +` ${count}`;
                        }
                        tracks_output[tracks[track].name]=tracks[track];
                    }        
                }
    
            let actor_stunts = duplicate(actor.system.stunts);
    
            let actor_tracks = duplicate(actor.system.tracks);
    
            //Look for orphaned tracks on the character that aren't on the item any longer and delete them from the character
            //Find all tracks on this actor that have the item's ID in their extra_id attribute
            //Check to see that those tracks are also on the item's list of tracks
            //If they aren't, delete them from the character.
    
            let update_object = {};
    
            for (let t in actor_tracks){
                let track = actor_tracks[t];
                if (track.extra_id != undefined && track.extra_id == extra_id){
                    if (tracks_output[t] == undefined){
                        update_object[`system.tracks.-=${t}`] = null;
                    }
                }
            }
    
            for (let track in tracks_output){
                if (actor_tracks[track]!=undefined){
                    for (let i = 0; i < tracks_output[track]?.box_values?.length; i++){
                        tracks_output[track].box_values[i] = actor_tracks[track]?.box_values[i];
                    }
                    if (actor_tracks[track].aspect?.when_marked) tracks_output[track].aspect.name = actor_tracks[track].aspect?.name;
                    if (actor_tracks[track]?.notes) tracks_output[track].notes = actor_tracks[track].notes;
                }
            }
            
            let actor_aspects = duplicate(actor.system.aspects);
    
            //Ditto for orphaned aspects
            for (let a in actor_aspects){
                let aspect = actor_aspects[a];
                if (aspect != undefined && aspect.extra_id != undefined && aspect.extra_id == extra_id){
                    if (aspects_output[a] == undefined){
                        update_object[`system.aspects.-=${a}`] = null;
                    }
                }
            }
    
            let actor_skills = duplicate(actor.system.skills);
    
            //Ditto for orphaned skills
            for (let s in actor_skills){
                let skill = actor_skills[s];
                if (skill != undefined && skill.extra_id != undefined && skill.extra_id == extra_id){
                    if (skills_output[s] == undefined){
                        update_object[`system.skills.-=${s}`] = null;
                    }
                }
            }
    
            //Ditto for orphaned stunts
            for (let s in actor_stunts){
                let stunt = actor_stunts[s];
                if (stunt != undefined && stunt.extra_id != undefined && stunt.extra_id == extra_id){
                    if (stunts_output[s] == undefined){
                        update_object[`system.stunts.-=${s}`] = null;;
                    }
                }
            }
            actor.sheet.editing = false;
            await actor.update(update_object);

            let final_stunts = mergeObject(actor.system.stunts, stunts_output, {"inPlace":false});
            let working_tracks = mergeObject(actor.system.tracks, tracks_output, {"inPlace":false});
            let final_skills = mergeObject(actor.system.skills, skills_output, {"inPlace":false});
            let final_aspects = mergeObject(actor.system.aspects, aspects_output, {"inPlace":false});
            let final_tracks = this.setupTracks (duplicate(final_skills), duplicate(working_tracks));

            await actor.update({    
                "system.tracks":final_tracks,
                "system.aspects":final_aspects,
                "system.skills":final_skills,
                "system.stunts":final_stunts
            })
    }

    async deactivateExtra (item, deleting){
        this.sheet.editing = true;
        let actor = this;
        let itemData = item;
        if (deleting == undefined) deleting = true;

        //Add a parameter - 'deleting' - if false, push the existing track on the actor back to the extra
        //before removing it - if the extra is toggled on and off, any tracks on the character that are partially
        //filled in should remain that way. This should be as simple as adding a parameter to calls to this method
        //and then removing extra_id from each track and writing it back to the item in an update call.
        if (!deleting){
            let trackUpdates = duplicate(item.system.tracks);
            let tracks = actor?.system?.tracks;

            for (let t in trackUpdates){
                // Need to grab the original name from the ACTOR, not from the extra. So we need to reverse the order of operations here
                // to search through the actor's tracks to find one with an original name that matches this track.
                for (let at in tracks){
                    let name = tracks[at]?.original_name;
                    if (name == t && tracks[at]?.extra_id == item.id){
                        let track = duplicate(tracks[at]);
                        track.name = name;
                        delete track.extra_id;
                        delete track.original_name;
                        trackUpdates[name] = track;
                    }
                }
            }
            let stuntUpdates = duplicate(item.system.stunts);
            let stunts = actor?.system?.stunts;
            for (let s in stuntUpdates){
                for (let as in stunts){
                    let name = stunts[as]?.original_name;
                    if (name == s && stunts[as]?.extra_id == item.id){
                        let stunt = duplicate(stunts[as]);
                        stunt.name = name;
                        delete stunt.extra_id;
                        delete stunt.original_name;
                        stuntUpdates[name] = stunt;
                    }
                }
            }
            await item.update({"system.tracks":trackUpdates, "system.stunts":stuntUpdates},{renderSheet:false});
        }
        //Clean up any tracks, aspects, skills, or stunts that were on this extra but are now orphaned.
    
        let updateObject = {}
    
        let actor_aspects = duplicate(actor.system.aspects)
    
        for(let aspect in actor_aspects)
        {
            if ( actor_aspects[aspect]?.extra_id == itemData._id){
                updateObject[`system.aspects.-=${aspect}`] = null;
            }
        }
        
        let actor_stunts = duplicate(actor.system.stunts)
    
        for (let stunt in actor_stunts){
            if (actor_stunts[stunt]?.extra_id == itemData._id){
                updateObject[`system.stunts.-=${stunt}`] = null;
            }
        }
    
        let actor_tracks = duplicate(actor.system.tracks)
    
        for (let track in actor_tracks){
            if (actor_tracks[track]?.extra_id == itemData._id){
                updateObject[`system.tracks.-=${track}`] = null;
            }
        }
    
        let actor_skills = duplicate(actor.system.skills)
    
        for (let skill in actor_skills){
            if (actor_skills[skill]?.extra_id == itemData._id){
                updateObject[`system.skills.-=${skill}`] = null;
            }
        }      

        actor.sheet.editing = false;
        await actor.update(updateObject);
        let ctracks = duplicate(actor.system.tracks);
        let cskills = duplicate(actor.system.skills);
        let etracks = actor.setupTracks(cskills, ctracks);
        await actor.update({"system.tracks":etracks});
        // This is required in order to make sure we get the combined skills setup correctly
        for (let extra of actor.items){
            if (extra.id != item.id && extra.system.active) await actor.updateFromExtra(extra);
        }
        this.render(false);
    }
    
    async rollSkill (skillName){
        if (skillName){
            let actor = this;
            let skill = actor.system.skills[skillName];
            let rank = skill.rank;
            let r = new Roll(`4dF + ${rank}`);
            let ladder = fcoConstants.getFateLadder();
            let rankS = rank.toString();
            let rung = ladder[rankS];
            let roll = await r.roll();
            roll.dice[0].options.sfx = {id:"fate4df",result:roll.result};

            let msg = ChatMessage.getSpeaker({actor:actor})
            msg.alias = actor.name;

            roll.toMessage({
                flavor: `<h1>${skill.name}</h1>${game.i18n.localize("fate-core-official.RolledBy")}: ${game.user.name}<br>
                        ${game.i18n.localize("fate-core-official.SkillRank")}: ${rank} (${rung})`,
                speaker: msg,
            });
        }
    }

    async rollTrack (trackName){
        if (trackName){
            let actor = this;
            let track = actor.system.tracks[trackName];
            let rank = 0;
            if (track.rollable == "full"){
                // Get the number of full boxes
                for (let i = 0; i < track.box_values.length; i++){
                    if (track.box_values[i]) rank++;
                }
            }
            if (track.rollable == "empty"){
                // Get the number of empty boxes
                for (let i = 0; i < track.box_values.length; i++){
                    if (!track.box_values[i]) rank++;
                }
            }
            if (track.rollable != "empty" && track.rollable != "full") return;

            let r = new Roll(`4dF + ${rank}`);
            let ladder = fcoConstants.getFateLadder();
            let rankS = rank.toString();
            let rung = ladder[rankS];
            let roll = await r.roll();
            roll.dice[0].options.sfx = {id:"fate4df",result:roll.result};

            let msg = ChatMessage.getSpeaker({actor:actor})
            msg.alias = actor.name;

            roll.toMessage({
                flavor: `<h1>${track.name}</h1>${game.i18n.localize("fate-core-official.RolledBy")}: ${game.user.name}<br>
                        ${game.i18n.localize("fate-core-official.SkillRank")}: ${rank} (${rung})`,
                speaker: msg,
            });
        }
    }

    async rollModifiedTrack (trackName) {
        if (trackName){
            let actor = this;
            let track = actor.system.tracks[trackName];
            if (track.rollable == "full" || track.rollable == "empty"){
                let mrd = new ModifiedRollDialog(this, trackName, true);
                mrd.render(true);
                try {
                    mrd.bringToTop();
                } catch  {
                    // Do nothing.
                }
            } 
        }
    }

    async rollStunt(stuntName){
        if (stuntName){
            let stunt = this.system.stunts[stuntName];
            let skill = stunt.linked_skill;
            let bonus = parseInt(stunt.bonus);
    
            let ladder = fcoConstants.getFateLadder();
            let rank = 0;
            if (skill == "Special"){
                // We need to pop up a dialog to get a skill to roll.
                let skills = [];
                for (let x in this.system.skills){
                    skills.push(this.system.skills[x].name);
                }
                let sk = await fcoConstants.getInputFromList (game.i18n.localize("fate-core-official.select_a_skill"), skills);
                skill = sk;
                rank = this.system.skills[skill].rank;
            } else {
                rank = this.system.skills[skill].rank;
            }
    
            let rankS = rank.toString();
            let rung = ladder[rankS];
    
            let r = new Roll(`4dF + ${rank}+${bonus}`);
            let roll = await r.roll();
            roll.dice[0].options.sfx = {id:"fate4df",result:roll.result};
    
            let msg = ChatMessage.getSpeaker({actor:this})
            msg.alias = this.name;
    
            roll.toMessage({
                flavor: `<h1>${skill}</h1>${game.i18n.localize("fate-core-official.RolledBy")}: ${game.user.name}<br>
                ${game.i18n.localize("fate-core-official.SkillRank")}: ${rank} (${rung})<br> 
                ${game.i18n.localize("fate-core-official.Stunt")}: ${stunt.name} (+${bonus})`,
                speaker: msg
            });
        }
    }
    
    async rollModifiedSkill (skillName) {
        if (skillName){
            let mrd = new ModifiedRollDialog(this, skillName);
            mrd.render(true);
            try {
                mrd.bringToTop();
            } catch  {
                // Do nothing.
            }
        }
    }

    prepareData(...args){
        super.prepareData(...args);
        if (this.type == "fate-core-official"){
            this.system.details.fatePoints.max = this.system.details.fatePoints.refresh;
            this.system.details.fatePoints.value = this.system.details.fatePoints.current;

            let tracks = this.system.tracks;
            for (let track in tracks){
                if (tracks[track].box_values){
                    this.system.details[track] = {max:tracks[track].box_values.length, value:tracks[track].box_values.length-tracks[track].box_values.filter(b => b).length};
                }
            }
        }
    }

    setupTracks (skills, tracks) {
        // This method takes skill and track data and returns corrected tracks enabled and disabled etc. according to the values of those skills
        // and the tracks' settings for enabling/disabling tracks according to skill ranks.

        let categories = game.settings.get("fate-core-official", "track_categories");
        //GO through all the tracks, find the ones with boxes, check the number of boxes and linked skills and initialise as necessary.
        for (let t in tracks) {
            let track = tracks[t];

            if (track.universal) {
                track.enabled = true;
            }

            // Check for linked skills and enable/add boxes as necessary.
            if (track.linked_skills != undefined && track.linked_skills.length > 0 && Object.keys(skills).length > 0) {
                track.enabled = false;
                let linked_skills = tracks[t].linked_skills;
                let box_mod = 0;
                for (let i = 0; i < linked_skills.length; i++) {
                    let l_skill = linked_skills[i].linked_skill;
                    let l_skill_rank = linked_skills[i].rank;
                    let l_boxes = linked_skills[i].boxes;
                    let l_enables = linked_skills[i].enables;

                    //Get the value of the player's skill
                    if (skills[l_skill] == undefined && l_enables == false){
                        if (l_boxes > 0) {
                            track.enabled = true;
                        }
                    }else {
                        let skill_rank = skills[l_skill]?.rank;
                        //If this is 'enables' and the skill is high enough, enable.
                        if (l_enables && skill_rank >= l_skill_rank) {
                            track.enabled = true;
                        }
                    //If this adds boxes and the skill is high enough, add boxes if not already present.
                    //Telling if the boxes are already present is the hard part.
                    //If boxes.length > boxes it means we have added boxes, but how many? I think we need to store a count and add
                    //or subract them at the end of our run through the linked skills.
                        
                        if (l_boxes > 0 ) {
                            if (l_enables == false) track.enabled = true;
                            if (skill_rank >= l_skill_rank){
                                box_mod += l_boxes;
                            }
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
        return tracks;
    }

    get skills (){
        return this.system.skills;
    }
}
