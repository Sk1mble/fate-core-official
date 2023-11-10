export class fcoExtra extends Item {
    async _onCreate(...args){
        if ( args[2] !== game.user.id ) return;
        let itemData;
        args.forEach(arg =>{
            if (arg.type == "Extra") itemData = duplicate (arg);
        })
        if (!itemData) return;
        if (this?.parent && this?.parent?.type == "fate-core-official") {
            await this.parent.updateFromExtra (duplicate(itemData));
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


    static migrateData (data){
        // Convert all keys on skills, aspects, stunts, and tracks to base-64 encoded versions of their names.
        if (data.system && data.name){ //This restricts the processing to when the whole model is being migrated.
            let toProcess = ["skills","stunts","aspects","tracks"];
            for (let item of toProcess){
                let output = {};
                for (let sub_item in data.system[item]){
                    let object = data.system[item][sub_item];
                    if (object.name){
                        output[fcoConstants.tob64(object.name)] = object;
                    }
                }
                data.system[item] = output;
            }
        }
        return super.migrateData(data);
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
