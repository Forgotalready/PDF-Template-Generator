import sqlite3
from io import BytesIO
from pathlib import Path
from string import Template
from typing import Optional
import re

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel
from xhtml2pdf import pisa

DB_PATH = Path("./DB/database.db")
DB_PATH.parent.mkdir(exist_ok=True)


class TemplateCreate(BaseModel):
    name: str
    content: str


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None


class RenderRequest(BaseModel):
    fields: dict = {}


app = FastAPI(title="PDF Generator")


def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS templates (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            content TEXT NOT NULL
        )        
    ''')
    conn.commit()
    conn.close()


app.mount("/static", StaticFiles(directory="../Project.Client"), name="static")


@app.get("/")
async def root():
    return FileResponse("../Project.Client/index.html")


@app.get("/templates")
async def get_templates():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    rows = cursor.execute('''
        SELECT id
        , name 
        FROM templates
    ''').fetchall()
    conn.close()
    return [{"id": row[0], "name": row[1]} for row in rows]


@app.post('/templates')
async def create_templates(template: TemplateCreate):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO templates (name, content) VALUES (?, ?)", (template.name, template.content))
    conn.commit()
    conn.close()
    return {"id": cursor.lastrowid}


@app.get("/templates/{id}")
async def get_template_by_id(id: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    template = cursor.execute("SELECT * FROM templates WHERE id = ?", (id,)).fetchone()
    conn.close()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    return {"id": template[0], "name": template[1], "content": template[2]}


@app.put("/templates/{id}")
async def update_template(id: int, template: TemplateUpdate):
    conn = sqlite3.connect(DB_PATH)
    if not conn.execute("SELECT id FROM templates WHERE id= ?", (id,)).fetchone():
        conn.close()
        raise HTTPException(404, "Template not found")

    updates = []
    vals = []
    if template.name is not None:
        updates.append("name=?")
        vals.append(template.name)
    if template.content is not None:
        updates.append("content=?")
        vals.append(template.content)
    if updates:
        vals.append(id)
        conn.execute(f"UPDATE templates SET {', '.join(updates)} WHERE id=?", vals)
        conn.commit()
    conn.close()



@app.delete("/templates/{id}")
async def delete_template(id: int):
    conn = sqlite3.connect(DB_PATH)
    if not conn.execute("SELECT id FROM templates WHERE id= ?", (id,)).fetchone():
        conn.close()
        raise HTTPException(404, "Template not found")

    conn.execute("DELETE FROM templates WHERE id = ?", (id,) )
    conn.commit()
    conn.close()

    return {"message": "Template deleted"}


@app.post("/render/{id}")
async def render_template(id: int, request: RenderRequest):
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute("SELECT content FROM templates WHERE id= ?", (id,)).fetchone()
    conn.close()

    if not row:
        raise HTTPException(404, "Template not found")

    html_content = apply_t_string(row[0], request.fields)

    full_html = f"<html><body>{html_content}</body></html>"

    pdf_buffer = BytesIO()
    pisa.CreatePDF(full_html, pdf_buffer, encoding="utf-8")
    pdf_buffer.seek(0)

    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=document_{id}.pdf"}
    )


def conver_markers_to_tstrings(template_content):
    pattern = r'(?<!\$)\{([^}]+)\}'
    return re.sub(pattern, r'$\1', template_content)


def apply_t_string(template_content, fields):
    converted = conver_markers_to_tstrings(template_content)
    t = Template(converted)
    return t.substitute(**fields)


@app.post("/preview/{id}")
async def preview_template(id: int, request: RenderRequest):
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute("SELECT content FROM templates WHERE id= ?", (id,)).fetchone()
    conn.close()

    if not row:
        raise HTTPException(404, "Template not found")

    html_content = apply_t_string(row[0], request.fields)
    return {"html": html_content}


if __name__ == "__main__":
    init_db()
    uvicorn.run(app, host="0.0.0.0", port=8003)
