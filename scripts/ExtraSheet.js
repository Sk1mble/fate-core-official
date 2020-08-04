export class ExtraSheet extends ItemSheet {
    async getData() {
        const data = await super.getData();
        data.type = this.item.type.toLowerCase();
        data.dataTemplate = () => `systems/ModularFate/templates/ExtraSheet.html`;
        if (data.data.box_values == undefined || data.data.box_values.length == 0){
           //data.box_values = [false,false,false,false,false,false,false,false,false,false];
        }
        return data;
    }
    

    get template (){
        return 'systems/ModularFate/templates/ExtraSheet.html';
    }

    _updateObject(event, formData){
        super._updateObject(event, formData);
    }

    async _on_boxes_change(html, event){
        //console.log(event.target.value)
        let num = parseInt(event.target.innerHTML);
        //console.log(num);
    }
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes = options.classes.concat(['fate', 'item']);
        options.width = 850;
        options.height = "auto";
        options.resizable = true;
        options.submitOnChange = true;
        options.title=`Extra: ${this.name}`
        return options;
    }
}
