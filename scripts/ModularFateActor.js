export class ModularFateActor extends Actor {

    async prepareData (...args){
        super.prepareData(...args);

        if (this.data.type === "Thing"){
            
        }
    }

    async updateFromExtra(itemData) {
        let actor = this;
    
        if (!shouldUpdate(actor)){
            return;
        } else {
            actor.sheet.editing = true;
            let extra = duplicate(itemData);
    
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
        
                if (!Array.isArray(stunts)){
                    for (let stunt in stunts){
                        stunts[stunt].extra_tag = extra_tag;
                        stunts[stunt].name = stunts[stunt].name+=" (Extra)";
                        stunts_output[stunts[stunt].name]=stunts[stunt];
                    }
                }
    
                let skills = duplicate(extra.data.skills);
                
                if (!Array.isArray(skills)){
                    for (let skill in skills){
                        let sk = duplicate(skills[skill])
                        sk.extra_tag = extra_tag;
                        sk.name = skills[skill].name+=" (Extra)";
                        skills_output[sk.name]=sk;
                    }
                }
                
                let aspects = duplicate(extra.data.aspects);

                if (!Array.isArray(aspects)){
                    for (let aspect in aspects){
                        aspects[aspect].extra_tag = extra_tag;
                        aspects[aspect].name = aspects[aspect].name+=" (Extra)";
                        aspects_output[aspects[aspect].name]=aspects[aspect];
                    }
                }
                
                let tracks = duplicate(extra.data.tracks);
                
                if (!Array.isArray(tracks)){
                    for (let track in tracks){
                        tracks[track].extra_tag = extra_tag;
                        tracks[track].name = tracks[track].name+=" (Extra)";
                        tracks_output[tracks[track].name]=tracks[track];
                    }        
                }
    
            let actor_stunts = duplicate(actor.data.data.stunts);
    
            let actor_tracks = duplicate(actor.data.data.tracks);
    
            //Look for orphaned tracks on the character that aren't on the item any longer and delete them from the character
            //Find all tracks on this actor that have the item's ID in their extra_tag attribute
            //Check to see that those tracks are also on the item's list of tracks
            //If they aren't, delete them from the character.
    
            let update_object = {};
    
            for (let t in actor_tracks){
                let track = actor_tracks[t];
                if (track.extra_tag != undefined && track.extra_tag.extra_id == extra_id){
                    if (tracks_output[t] == undefined){
                        update_object[`data.tracks.-=${t}`] = null;
                        //actor_tracks = duplicate(actor.data.data.tracks);
                    }
                }
            }
    
            for (let track in tracks_output){
                if (actor_tracks[track]!=undefined){
                    delete(tracks_output[track]);
                }
            }
            
            let actor_aspects = duplicate(actor.data.data.aspects);
    
            //Ditto for orphaned aspects
            for (let a in actor_aspects){
                let aspect = actor_aspects[a];
                if (aspect != undefined && aspect.extra_tag != undefined && aspect.extra_tag.extra_id == extra_id){
                    if (aspects_output[a] == undefined){
                        update_object[`data.aspects.-=${a}`] = null;
                        //actor_aspects = duplicate(actor.data.data.aspects);
                    }
                }
            }
    
            let actor_skills = duplicate(actor.data.data.skills);
    
            //Ditto for orphaned skills
            for (let s in actor_skills){
                let skill = actor_skills[s];
                if (skill != undefined && skill.extra_tag != undefined && skill.extra_tag.extra_id == extra_id){
                    if (skills_output[s] == undefined){
                        update_object[`data.skills.-=${s}`] = null;
                        //actor_skills = duplicate(actor.data.data.skills);
                    }
                }
            }
    
            //Ditto for orphaned stunts
            for (let s in actor_stunts){
                let stunt = actor_stunts[s];
                if (stunt != undefined && stunt.extra_tag != undefined && stunt.extra_tag.extra_id == extra_id){
                    if (stunts_output[s] == undefined){
                        update_object[`data.stunts.-=${s}`] = null;;
                        //actor_stunts = duplicate(actor.data.data.stunts);
                    }
                }
            }
    
            await actor.update(update_object);
            actor.sheet.editing = false;

            let final_stunts = mergeObject(actor.data.data.stunts, stunts_output, {"inPlace":false});
            let final_tracks = mergeObject(actor.data.data.tracks, tracks_output, {"inPlace":false});
            let final_skills = mergeObject(actor.data.data.skills, skills_output, {"inPlace":false});
            let final_aspects = mergeObject(actor.data.data.aspects, aspects_output, {"inPlace":false});

            await actor.update({    
                "data.tracks":final_tracks,
                "data.aspects":final_aspects,
                "data.skills":final_skills,
                "data.stunts":final_stunts
            })
        }
    }

    setupTracks (skills, tracks) {
        // This method takes skill and track data and returns corrected tracks enabled and disabled etc. according to the values of those skills
        // and the tracks' settings for enabling/disabling tracks according to skill ranks.

        let categories = game.settings.get("ModularFate", "track_categories");
        //GO through all the tracks, find the ones with boxes, check the number of boxes and linked skills and initialise as necessary.
        for (let t in tracks) {
            let track = tracks[t];

            if (track.universal) {
                track.enabled = true;
            }

            // Check for linked skills and enable/add boxes as necessary.
            if (track.linked_skills != undefined && track.linked_skills.length > 0 && Object.keys(skills).length > 0) {
                let linked_skills = tracks[t].linked_skills;
                let box_mod = 0;
                for (let i = 0; i < linked_skills.length; i++) {
                    let l_skill = linked_skills[i].linked_skill;
                    let l_skill_rank = linked_skills[i].rank;
                    let l_boxes = linked_skills[i].boxes;
                    let l_enables = linked_skills[i].enables;

                    //Get the value of the player's skill
                    if (skills[l_skill] == undefined){

                    }else {
                        let skill_rank = skills[l_skill].rank;
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
        return tracks;
    }
}

function shouldUpdate(actor){
    if (!actor.isOwner){
        return false;
    }
    const permissions = actor.data.permission; // Exists
    const activePlayers = game.users.contents // Exists
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

Hooks.on('deleteItem', async (actor, item) => {
    let itemData = item.data;

    if (actor.type != "ModularFate"){
        return;
    }

    if (!shouldUpdate(actor)){
        return;
    } else {
        actor.sheet.editing = true;
        //Clean up any tracks, aspects, skills, or stunts that were on this extra but are now orphaned.

        let updateObject = {}

        let actor_aspects = duplicate(actor.data.data.aspects)

        for(let aspect in actor_aspects)
        {
            let et = actor_aspects[aspect].extra_tag;
            if (et != undefined && et.extra_id == itemData._id){
                updateObject[`data.aspects.-=${aspect}`] = null;
            }
        }
        
        let actor_stunts = duplicate(actor.data.data.stunts)

        for (let stunt in actor_stunts){
            let et = actor_stunts[stunt].extra_tag;
            if (et != undefined && et.extra_id == itemData._id){
                updateObject[`data.stunts.-=${stunt}`] = null;
            }
        }

        let actor_tracks = duplicate(actor.data.data.tracks)

        for (let track in actor_tracks){
            let et = actor_tracks[track].extra_tag;
            if (et != undefined && et.extra_id == itemData._id){
                updateObject[`data.tracks.-=${track}`] = null;
            }
        }

        let actor_skills = duplicate(actor.data.data.skills)

        for (let skill in actor_skills){
            let et = actor_skills[skill].extra_tag;
            if (et!= undefined && et.extra_id == itemData._id){
                updateObject[`data.skills.-=${skill}`] = null;
            }
        }      
        actor.sheet.editing = false;
        await actor.update(updateObject);
    }
})

Hooks.on('createItem', async (actor, item) => {
    if (actor.type == "ModularFate") {
        await actor. updateFromExtra(item.data);
    }
})