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
        console.log(userId);
        if (this?.parent && this?.parent?.type == "fate-core-official") {
            if (userId == game.user.id) await this.parent.deactivateExtra (this, true);
        }
        super._onDelete(options, userId);
    }

    get active (){
        return this.data.data.active;
    }

    get skills (){
        return this.data.data.skills;
    }

    get stunts (){
        return this.data.data.stunts;
    }

    get tracks (){
        return this.data.data.tracks;
    }

    get aspects (){
        return this.data.data.aspects;
    }

    get extraCost (){
        let toReturn = {}
        let paidTracks = 0;
        let paidStunts = 0;
        let refreshCost = this.data.data.refresh;
        let skillCost = 0;

        let tracks = this.data.data.tracks;
        for (let track in tracks){
            if (tracks[track].paid){
                paidTracks ++;
            }
        }

        let stunts = this.data.data.stunts;
        for (let stunt in stunts){
            paidStunts += stunts[stunt].refresh_cost;
        }

        toReturn.paidTracks = paidTracks;
        toReturn.paidStunts = paidStunts;
        toReturn.refreshCost = refreshCost;

        let skills = this.data.data.skills;
        if (this.data.data.countSkills){
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
