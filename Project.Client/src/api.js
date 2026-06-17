export class API {
    async createTemplate(template) {
        const res = await fetch(
            "/templates",
            {
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
                body: JSON.stringify(template)
            }
        );

        if (!res.ok) {
            throw new Error(await res.text());
        }

        return res.json();
    }

    async getTemplates() {
        const res = await fetch(
            "/templates",
            {
                headers: { 'Content-Type': 'application/json' },
            }
        );

        if (!res.ok) {
            throw new Error(await res.text());
        }

        return res.json();
    }

    async getTemplate(id) {
        const res = await fetch(
            `/templates/${id}`
        );

        if (!res.ok) {
            throw new Error(await res.text());
        }

        return res.json();
    }

    async updateTemplate(id, template) {
        const res = await fetch(
            `/templates/${id}`,
            {
                headers: { 'Content-Type': 'application/json' },
                method: 'PUT',
                body: JSON.stringify(template)
            }
        );

        if (!res.ok) {
            throw new Error(await res.text());
        }

        return res.json();
    }

    async removeTemplate(id) {
        const res = await fetch(
            `/templates/${id}`,
            {
                headers: { 'Content-Type': 'application/json' },
                method: 'DELETE'
            }
        );

        if (!res.ok) {
            throw new Error(await res.text());
        }

        return res.json();
    }

    async preview(id, fields) {
        const res = await fetch(
            `/preview/${id}`,
            {
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
                body: JSON.stringify({ fields })
            }
        );

        if (!res.ok) {
            throw new Error(await res.text());
        }

        return res.json();
    }

    async render(id, fields) {
        const res = await fetch(
            `/render/${id}`,
            {
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
                body: JSON.stringify({ fields })
            }
        );

        if (!res.ok) {
            throw new Error(await res.text());
        }

        return res.blob();
    }
}
