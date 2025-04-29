export class fcoExtra extends Item {
    
    // Hide the object that has been set to store the settings for this World so it can't be accidentally tampered with
    get visible(){
        if (this.type === "Extra" && fromUuidSync(game.settings.get("fate-core-official","wid"))?.id == this.id && game.system.showWD !== true){
            return false;
        } 
        else {
            return super.visible;
        }
    }

    async _preCreate(...args){
        await super._preCreate(...args);
        let types = ["aspects", "tracks", "stunts", "skills"];
        if (this.type == "Extra"){
            for (let type of types) {
                let block = this.system[type];
                let output= {};
                for (let item in block){
                    output[fcoConstants.tob64(block[item].name)] = block[item];
                }
                let oldKeys = JSON.stringify(Object.keys(block));
                let newKeys = JSON.stringify(Object.keys(output));
                if (oldKeys != newKeys){
                    this.updateSource({"system":{[`==${type}`]:output}})
                }
            }
        }
    }

    async rationaliseKeys(){
        let types = ["aspects", "tracks", "stunts", "skills", "defaults"];
        if (this.type == "Extra"){
            for (let type of types) {
                let block = this.system[type];
                let output= {};
                for (let item in block){
                    if (type == "defaults"){
                        output[fcoConstants.tob64(block[item].default_name)] = block[item];
                    } else {
                        output[fcoConstants.tob64(block[item].name)] = block[item];
                    }
                }
                let oldKeys = JSON.stringify(Object.keys(block));
                let newKeys = JSON.stringify(Object.keys(output));
                if (oldKeys != newKeys){
                    await this.update({"system":{[`==${type}`]:output}})
                }
            }
        }
    }

    async _onCreate(...args){
        if ( args[2] !== game.user.id ) return;
        let itemData;
        args.forEach(arg =>{
            if (arg.type == "Extra") itemData = foundry.utils.duplicate(arg);
        })
        if (!itemData) return;
        if (this?.parent && this?.parent?.type == "fate-core-official") {
            await this.parent.updateFromExtra (foundry.utils.duplicate(itemData));
            await this.parent.render(false);
        }
        await super._onCreate(...args)
    }

    async _onDelete(options, userId){
        if (this?.parent && this?.parent?.type == "fate-core-official") {
            if (userId == game.user.id) await this.parent.deactivateExtra (this, true);
        }
        super._onDelete(options, userId);
    }

    get active (){
        return this.system.active;
    }

    get skills (){
        return this.system.skills;
    }

    get stunts (){
        return this.system.stunts;
    }

    get tracks (){
        return this.system.tracks;
    }

    get aspects (){
        return this.system.aspects;
    }

    get extraCost (){
        let toReturn = {}
        let paidTracks = 0;
        let paidStunts = 0;
        let refreshCost = this.system.refresh;
        let skillCost = 0;

        let tracks = this.system.tracks;
        for (let track in tracks){
            if (tracks[track].paid){
                paidTracks ++;
            }
        }

        let stunts = this.system.stunts;
        for (let stunt in stunts){
            paidStunts += stunts[stunt].refresh_cost;
        }

        toReturn.paidTracks = paidTracks;
        toReturn.paidStunts = paidStunts;
        toReturn.refreshCost = refreshCost;

        let skills = this.system.skills;
        if (this.system.countSkills){
            for (let skill in skills){
                skillCost += skills[skill].rank;
            }
        } else {
            for (let skill in skills){
                if (skills[skill].countMe) skillCost += skills[skill].rank;
            }
        }
        toReturn.skillCost = skillCost;
        return toReturn;
    }
}
