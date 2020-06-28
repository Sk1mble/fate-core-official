export class ItemSheetFATE extends ItemSheet {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes = options.classes.concat(['fate', 'item']);
        options.width = 500;
        options.height = 400;
        options.resizable = false;
        options.submitOnChange = true;
        options.tabs = [
            {
                navSelector: '.tabs',
                contentSelector: '.sheet-body',
                initial: 'description',
            },
        ];
        return options;
    }
    get template() {
        return 'systems/ModularFate/templates/item-sheet.html';
    }
    getData() {
        const data = super.getData();
        data.type = this.item.type.toLowerCase();
        data.dataTemplate = () => `systems/ModularFate/templates/extra-data.html`;
        return data;
    }
    activateListeners(html) {
        super.activateListeners(html);
    }
}
