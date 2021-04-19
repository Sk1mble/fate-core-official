export class ModularFateExtra extends Item {
    async _onCreate(...args){
        let itemData;
        args.forEach(arg =>{
            if (arg.type == "Extra") itemData = duplicate (arg);
        })
        if (!itemData) return;
        if (this?.parent) await this.parent.updateFromExtra (duplicate(itemData));
        super._preCreate(...args)
    }

    async _preDelete(...args){
        let itemData;
        if (this?.parent) await this.parent.deactivateExtra (this);
        super._preDelete(...args)
    }

  /* Not used; updates from extras are handled on extra sheet close.  
    async _preUpdate(...args){
        let itemData = duplicate(this.data);

        super._preUpdate(...args)
    }
  */  
}