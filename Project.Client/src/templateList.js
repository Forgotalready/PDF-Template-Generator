export class TemplateList {
    constructor(containerId, onClick) {
        this.container = document.querySelector("#" + containerId);
        this.onClick = onClick;
    }

    render(list) {
        this.container.innerHTML = '';
        list.forEach(element => {
            const el = document.createElement('div');
            el.innerHTML = `${element.name}`;
            el.onclick = () => this.onClick(element.id);
            this.container.appendChild(el);
        });
    }
}
