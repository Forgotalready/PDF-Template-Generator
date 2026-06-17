import { API } from "./src/api.js";
import { TemplateList } from "./src/templateList.js";

class App {
    constructor() {
        this.api = new API();
        this.templateList = new TemplateList("templateList", (id) => this.loadTemplate(id));
        this.currentId = null;
        this.quill = new Quill('#editor', {
            theme: 'snow'
        });
        this.fields = {};
        this.bindEvents();
        this.loadTemplates();
    }

    bindEvents() {
        document.querySelector("#saveBtn").onclick = () => this.save();
        document.querySelector("#deleteBtn").onclick = () => this.delete();
        document.querySelector("#newBtn").onclick = () => this.create();
        document.querySelector('#addFieldBtn').onclick = () => this.addField();
        document.querySelector('#previewBtn').onclick = () => this.preview();
        document.querySelector('#downloadBtn').onclick = () => this.download();
        document.querySelector('#refreshPreviewBtn').onclick = () => this.preview();
    }

    async save() {
        const name = document.querySelector('#tplName').value.trim();
        if (!name) {
            return alert('Введите название');
        }
        const content = this.quill.root.innerHTML;
        if (this.currentId) {
            await this.api.updateTemplate(this.currentId, { name, content });
        } else {
            const created = await this.api.createTemplate({ name, content });
            this.currentId = created.id;
            document.querySelector('#tplId').textContent = `ID: ${created.id}`;
        }
        this.loadTemplates();
    }

    async delete() {
        if (!this.currentId) {
            return;
        }

        this.quill.root.innerHTML = "";
        document.querySelector("#tplName").value = "";
        document.querySelector('#tplId').textContent = "";

        await this.api.removeTemplate(this.currentId);
        this.currentId = null;
        this._resetPreview();
        this.loadTemplates();
    }

    create() {
        if (!this.currentId) {
            return;
        }

        this.quill.root.innerHTML = "";
        document.querySelector("#tplName").value = "";
        document.querySelector('#tplId').textContent = "";
        this.currentId = null;
        this._resetPreview();
        this.loadTemplates();
    }

    async loadTemplates() {
        const templates = await this.api.getTemplates();
        this.templateList.render(templates);
    }

    async loadTemplate(id) {
        if (id === this.currentId) {
            return;
        }

        this._resetPreview();

        const template = await this.api.getTemplate(id);
        this.currentId = template.id;
        this.fields = {};

        document.querySelector('#tplName').value = template.name;
        document.querySelector('#tplId').textContent = `ID: ${template.id}`
        this.quill.root.innerHTML = template.content;

        this.loadTemplates();
        this.renderFields();
    }

    addField() {
        const name = document.querySelector('#fieldName').value.trim();
        const value = document.querySelector('#fieldValue').value.trim();

        if (!name) {
            return alert('Введите имя поля');
        }

        this.fields[name] = value;
        this.renderFields();
        document.querySelector('#fieldName').value = '';
        document.querySelector('#fieldValue').value = '';
        document.querySelector('#fieldName').focus();
    }

    renderFields() {
        const cnt = document.querySelector('#fieldsList');
        cnt.innerHTML = '';
        for (const [k, v] of Object.entries(this.fields)) {
            const chip = document.createElement('span');
            chip.className = 'field-chip';
            chip.innerHTML = `<strong>{${k}}</strong> = ${v || '(пусто)'} `;
            const btn = document.createElement('button');
            btn.textContent = '×';
            btn.onclick = () => { delete this.fields[k]; this.renderFields(); };
            chip.appendChild(btn);
            cnt.appendChild(chip);
        }
    }

    async preview() {
        const status = document.querySelector('#previewStatus');

        if (!this.currentId) {
            status.textContent = "";
            document.querySelector('#previewContent').innerHTML = "";
            return;
        }

        
        status.textContent = 'Загрузка...';
        try {
            const data = await this.api.preview(this.currentId, this.fields);
            document.querySelector('#previewContent').innerHTML = data.html;
            status.textContent = 'Готово';
        } catch (e) {
            status.textContent = 'Ошибка';
            alert(e.message);
        }
    }

    async download(){
        if(!this.currentId){
            return alert('Сохраните шаблон');
        }

        try{
            const blob = await this.api.render(this.currentId, this.fields);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `document_${this.currentId}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            alert(e.message);
        }
    }

    _resetPreview(){
        this.fields = {};
        this.renderFields();
        this.preview();
    }
}

const app = new App();