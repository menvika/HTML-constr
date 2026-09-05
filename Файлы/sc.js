let blocks = [];
let selectedBlockIndex = -1;
let clientsList = [];
let phoneMask; // Переменная для маски ввода телефона при добавлении заказчика

const STORAGE_KEY = 'user_email_templates';
const dropZone = document.getElementById('dropZone');
const propsEmpty = document.getElementById('propsEmpty');
const propsTitle = document.getElementById('propsTitle');
const propsText = document.getElementById('propsText');
const propsButton = document.getElementById('propsButton');
const propsImage = document.getElementById('propsImage');
const propsLink = document.getElementById('propsLink');
const preview = document.getElementById('preview');

document.addEventListener('DOMContentLoaded', init);

function init() {
    document.querySelectorAll('.block[draggable="true"]').forEach(block => {
        block.addEventListener('dragstart', handleDragStart);
    });
    if (dropZone) {
        dropZone.addEventListener('dragover', handleDragOver);
        dropZone.addEventListener('dragleave', handleDragLeave);
        dropZone.addEventListener('drop', handleDrop);
        dropZone.addEventListener('click', handleDropZoneClick);
    }
    bindPropsEvents();
    loadClients();
    updateJournalTable();
    renderUserTemplates();
    applyPhoneMask();
    bindAnchorScroll();
    render();
}

// перетаскивание
function handleDragStart(e) {
    e.dataTransfer.setData('type', e.target.dataset.type);
}

function handleDragOver(e) {
    e.preventDefault();
    dropZone.classList.add('drag-over');
}

function handleDragLeave() {
    dropZone.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const type = e.dataTransfer.getData('type');
    if (!type) return;
    const newBlock = createBlock(type);
    blocks.push(newBlock);
    selectedBlockIndex = blocks.length - 1;
    render();
}

// создание блока
function createBlock(type) {
    const blocksMap = {
        title: {
            type: 'title',
            content: 'Заголовок',
            align: 'left',
            fontSize: 32,
            fontFamily: 'Unbounded',
            color: '#000000',
            fontWeight: 600,
            lineHeight: 1.2
        },
        text: {
            type: 'text',
            content: 'Текст сообщения',
            align: 'left',
            fontSize: 16,
            fontFamily: 'Unbounded',
            fontWeight: 400,
            color: '#000000',
            lineHeight: 1.5
        },
        image: {
            type: 'image',
            src: 'https://via.placeholder.com/600x300',
            alt: 'Изображение',
            width: '100%',
            align: 'center',
            borderRadius: 8
        },
        link: {
            type: 'link',
            content: 'Ссылка',
            url: 'https://gitverse.ru/topit/16-20_team21_Sutormina',
            color: '#0066cc',
            fontSize: 16,
            fontFamily: 'Unbounded',
            fontWeight: 400,
            align: 'left',
            lineHeight: 1.2,
            textDecoration: 'underline'
        }
    };
    return JSON.parse(JSON.stringify(blocksMap[type] || blocksMap.text));
}

// Отображение блока
function render() {
    if (!dropZone) return;
    dropZone.innerHTML = '';
    blocks.forEach((block, index) => {
        const element = document.createElement('div');
        element.className = `email-block ${index === selectedBlockIndex ? 'selected' : ''}`;
        element.dataset.type = block.type;
        element.dataset.index = index;
        element.style.textAlign = block.align || 'left';
        if (block.type !== 'image') {
            element.style.fontSize = `${block.fontSize || 16}px`;
            element.style.color = block.color || '#000000';
            element.style.fontFamily = block.fontFamily || 'Unbounded';
            element.style.fontWeight = block.fontWeight || '400';
            element.style.lineHeight = block.lineHeight || 1.2;
        }
        element.innerHTML = renderBlock(block);
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            selectBlock(index);
        });
        dropZone.appendChild(element);
    });
    updatePropsPanel();
}

function renderBlock(block) {
    const style = `
        font-family: '${block.fontFamily || 'Unbounded'}', sans-serif;
        font-weight: ${block.fontWeight || '400'};
        font-size: ${block.fontSize || 16}px;
        color: ${block.color || '#000000'};
        text-align: ${block.align || 'left'};
        line-height: ${block.lineHeight || 1.2};
        text-decoration: ${block.textDecoration || 'none'};
    `.replace(/\s+/g, ' ');
    if (block.type === 'title') {
        return `<h1 data-type="title" style="${style}">${block.content || 'Заголовок'}</h1>`;
    }
    if (block.type === 'text') {
        return `<div data-type="text" style="${style}">${block.content || 'Текст сообщения'}</div>`;
    }
    if (block.type === 'link' || block.type === 'button') {
        const wrapperAlign =
            block.align === 'center' ? 'center' :
                block.align === 'right' ? 'right' :
                    'left';
        return `
            <div style="text-align: ${wrapperAlign}; padding: 10px 0;">
                <a data-type="link"
                   href="${block.url || '#'}"
                   style="display: inline-block; ${style}">
                    ${block.content || 'Ссылка'}
                </a>
            </div>
        `;
    }
    if (block.type === 'image') {
        const margin =
            block.align === 'center' ? '0 auto' :
                block.align === 'right' ? '0 0 0 auto' :
                    '0 auto 0 0';
        return `
            <img data-type="image"
                 src="${block.src || ''}"
                 alt="${block.alt || 'Изображение'}"
                 style="
                    max-width: 100%;
                    width: ${block.width || '100%'};
                    height: auto;
                    display: block;
                    margin: ${margin};
                    border-radius: ${block.borderRadius || 0}px;
                 ">
        `;
    }
    return '';
}

function updatePropsPanel() {
    if (propsEmpty) propsEmpty.style.display = 'block'
    const panels = [propsTitle, propsText, propsButton, propsImage, propsLink];
    panels.forEach(panel => {
        if (panel) panel.style.display = 'none';
    });
    if (selectedBlockIndex === -1 || !blocks[selectedBlockIndex]) return;
    const block = blocks[selectedBlockIndex];
    if (propsEmpty) propsEmpty.style.display = 'none';
    if (block.type === 'title') {
        propsTitle.style.display = 'flex';
        setValue('propTitleText', block.content || '');
        setValue('propTitleFontSize', block.fontSize || 32);
        setValue('propTitleColor', block.color || '#000000');
        setValue('propTitleAlign', block.align || 'left');
        setValue('propTitleFontFamily', block.fontFamily || 'Unbounded');
        setValue('propTitleFontWeight', String(block.fontWeight || 600));
        return;
    }
    if (block.type === 'text') {
        propsText.style.display = 'flex';
        setValue('propTextText', block.content || '');
        setValue('propTextFontSize', block.fontSize || 16);
        setValue('propTextColor', block.color || '#000000');
        setValue('propTextAlign', block.align || 'left');
        setValue('propTextFontFamily', block.fontFamily || 'Unbounded');
        setValue('propTextLineHeight', block.lineHeight || 1.5);
        return;
    }
    if (block.type === 'link' || block.type === 'button') {
        if (!propsLink) return;
        propsLink.style.display = 'flex';
        setValue('propLinkText', block.content || '');
        setValue('propLinkUrl', block.url || '#');
        setValue('propLinkFontSize', block.fontSize || 16);
        setValue('propLinkColor', block.color || '#0066cc');
        setValue('propLinkAlign', block.align || 'left');
        setValue('propLinkFontFamily', block.fontFamily || 'Unbounded');
        setValue('propLinkDecoration', block.textDecoration || 'underline');
        return;
    }
    if (block.type === 'image') {
        propsImage.style.display = 'flex';
        setValue('propImageSrc', block.src || '');
        setValue('propImageAlt', block.alt || 'Изображение');
        setValue('propImageWidth', block.width || '100%');
        setValue('propImageAlign', block.align || 'center');
        setValue('propImageBorderRadius', block.borderRadius || 8);
    }
}

function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

function bindPropsEvents() {
    bindInput('propTitleText', 'title', 'content');
    bindInput('propTitleFontSize', 'title', 'fontSize', parseIntValue, 32);
    bindInput('propTitleColor', 'title', 'color');
    bindInput('propTitleAlign', 'title', 'align');
    bindInput('propTitleFontFamily', 'title', 'fontFamily');
    bindInput('propTitleFontWeight', 'title', 'fontWeight', parseIntValue, 600);
    bindInput('propTextText', 'text', 'content');
    bindInput('propTextFontSize', 'text', 'fontSize', parseIntValue, 16);
    bindInput('propTextColor', 'text', 'color');
    bindInput('propTextAlign', 'text', 'align');
    bindInput('propTextFontFamily', 'text', 'fontFamily');
    bindInput('propTextLineHeight', 'text', 'lineHeight', parseFloatValue, 1.5);
    bindInput('propImageSrc', 'image', 'src');
    bindInput('propImageAlt', 'image', 'alt');
    bindInput('propImageWidth', 'image', 'width');
    bindInput('propImageAlign', 'image', 'align');
    bindInput('propImageBorderRadius', 'image', 'borderRadius', parseIntValue, 8);
    bindInput('propLinkText', 'link', 'content');
    bindInput('propLinkUrl', 'link', 'url');
    bindInput('propLinkColor', 'link', 'color');
    bindInput('propLinkFontSize', 'link', 'fontSize', parseIntValue, 16);
    bindInput('propLinkFontFamily', 'link', 'fontFamily');
    bindInput('propLinkAlign', 'link', 'align');
    bindInput('propLinkDecoration', 'link', 'textDecoration');
}

function bindInput(id, blockType, property, parser = null, fallback = null) {
    const el = document.getElementById(id);
    if (!el) return;
    const eventName = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(eventName, function (e) {
        if (selectedBlockIndex === -1) return;
        const block = blocks[selectedBlockIndex];
        if (!block || block.type !== blockType) return;
        let value = e.target.value;
        if (parser) {
            value = parser(value, fallback);
        }
        block[property] = value;
        render();
    });
}

function parseIntValue(value, fallback) {
    return parseInt(value) || fallback;
}

function parseFloatValue(value, fallback) {
    return parseFloat(value) || fallback;
}

function selectBlock(index) {
    selectedBlockIndex = index;
    render();
}

// дублировать
function duplicateBlock() {
    if (selectedBlockIndex === -1) return;
    const block = JSON.parse(JSON.stringify(blocks[selectedBlockIndex]));
    blocks.splice(selectedBlockIndex + 1, 0, block);
    selectedBlockIndex++;
    render();
}

// удалить
function deleteBlock() {
    if (selectedBlockIndex === -1) return;
    blocks.splice(selectedBlockIndex, 1);
    selectedBlockIndex =
        blocks.length > 0
            ? Math.min(selectedBlockIndex, blocks.length - 1)
            : -1;
    render();
}

function handleDropZoneClick(e) {
    const block = e.target.closest('.email-block');
    if (!block) {
        selectedBlockIndex = -1;
        render();
        return;
    }
    const index = parseInt(block.dataset.index);
    if (!isNaN(index)) {
        selectBlock(index);
    }
}

// предпросмотр
function generateHTML() {
    if (!preview) return;
    preview.srcdoc = getFullEmailHTML();
}

function getFullEmailHTML() {
    return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@200..900&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Unbounded', sans-serif;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
        }
        img {
            max-width: 100%;
            height: auto;
        }
    </style>
</head>
<body>
    ${blocks.map(block => renderBlock(block)).join('')}
</body>
</html>
    `;
}

// шаблоны
function loadTemplate(type) {
    let template = [];
    if (type === "template1") {
        template = [
            {
                type: "image",
                src: "https://images.unsplash.com/photo-1442512595331-e89e73853f31",
                alt: "header",
                width: "100%",
                align: "center",
                borderRadius: 0
            },
            {
                type: "title",
                content: "Добро пожаловать!",
                align: "center",
                fontSize: 32,
                fontFamily: "Unbounded",
                color: "#000000",
                fontWeight: 600,
                lineHeight: 1.2
            },
            {
                type: "text",
                content: "Спасибо что подписались на нашу рассылку.",
                align: "center",
                fontSize: 16,
                fontFamily: "Unbounded",
                fontWeight: 400,
                color: "#000000",
                lineHeight: 1.5
            }
        ];
    }
    if (type === "template2") {
        template = [
            {
                type: "title",
                content: "📚 Книжная пятница",
                align: "left",
                fontSize: 28,
                fontFamily: "Unbounded",
                color: "#000000",
                fontWeight: 600,
                lineHeight: 1.2
            },
            {
                type: "text",
                content: "Подборка интересных книг недели.",
                align: "left",
                fontSize: 16,
                fontFamily: "Unbounded",
                fontWeight: 400,
                color: "#000000",
                lineHeight: 1.5
            },
            {
                type: "image",
                src: "https://images.unsplash.com/photo-1512820790803-83ca734da794",
                alt: "books",
                width: "100%",
                align: "center",
                borderRadius: 8
            }
        ];
    }
    if (type === "template3") {
        template = [
            {
                type: "image",
                src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
                alt: "promo",
                width: "100%",
                align: "center",
                borderRadius: 0
            },
            {
                type: "title",
                content: "🔥 Специальное предложение",
                align: "center",
                fontSize: 32,
                fontFamily: "Unbounded",
                color: "#000000",
                fontWeight: 700,
                lineHeight: 1.2
            },
            {
                type: "text",
                content: "Только сегодня действует скидка 30%.",
                align: "center",
                fontSize: 18,
                fontFamily: "Unbounded",
                fontWeight: 400,
                color: "#000000",
                lineHeight: 1.5
            }
        ];
    }
    if (type === "template4") {
        template = [
            {
                type: "title",
                content: "Привет!",
                align: "left",
                fontSize: 32,
                fontFamily: "Unbounded",
                color: "#000000",
                fontWeight: 600,
                lineHeight: 1.2
            },
            {
                type: "text",
                content: "Спасибо за подписку",
                align: "left",
                fontSize: 16,
                fontFamily: "Unbounded",
                fontWeight: 400,
                color: "#000000",
                lineHeight: 1.5
            }
        ];
    }
    if (template.length > 0) {
        blocks = template;
        selectedBlockIndex = -1;
        render();
    }
}

// Функция сохранения шаблона
async function saveUserTemplate() {
    const canvas = document.getElementById('dropZone');
    if (!canvas) return;
    if (!blocks.length) {
        alert("Шаблон пуст!");
        return;
    }
    const savedBlocksHTML = Array.from(canvas.querySelectorAll('.email-block'))
        .map(el => el.outerHTML)
        .join('');
    if (!savedBlocksHTML.trim()) {
        alert("Шаблон пуст!");
        return;
    }
    const tplId = `template_${Date.now()}`;
    const tplName = `Свой шаблон ${Date.now()}`;
    try {
        const response = await fetch('/save_to_folder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: tplId,
                content: savedBlocksHTML
            })
        });
        if (!response.ok) {
            alert("Ошибка сохранения шаблона");
            return;
        }
        let templates = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        templates.push({
            id: tplId,
            name: tplName
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
        renderUserTemplates();
        downloadTemplateFile(savedBlocksHTML, `${tplName}.html`);
        alert("Шаблон сохранён");
        console.log("Сохранено на сервере:", tplId);
    } catch (error) {
        console.error("Ошибка сохранения на сервер:", error);
        alert("Ошибка сохранения на сервер");
    }
}

function downloadTemplateFile(content, filename) {
    const fullHTML = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@200..900&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Unbounded', sans-serif;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
        }
        img {
            max-width: 100%;
            height: auto;
        }
    </style>
</head>
<body>
    ${content}
</body>
</html>
    `;
    const blob = new Blob([fullHTML], {
        type: 'text/html;charset=utf-8'
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

function renderUserTemplates() {
    const container = document.querySelector('.panel.templates');
    if (!container) return;
    document.querySelectorAll('.user-tpl-card').forEach(el => el.remove());
    const templates = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    templates.forEach((tpl, index) => {
        const card = document.createElement('div');
        card.className = 'template-card user-tpl-card';
        card.style.cssText = `
            border: 2px solid #a68ecf;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            overflow: visible;
        `;
        const templateName = `Свой шаблон ${index + 1}`;
        card.innerHTML = `
            <div onclick="loadSavedTemplate('${tpl.id}')"
                 style="
                    width:100%;
                    height:100%;
                    cursor:pointer;
                    display:flex;
                    flex-direction:column;
                    align-items:center;
                    justify-content:center;
                    padding: 5px;
                 ">
                <span style="
                    color: #a68ecf;
                    font-weight: bold;
                    font-size: 14px;
                    line-height: 1.2;
                ">
                    ${templateName}
                </span>
            </div>
            <button class="delete-tpl-btn"
                    onclick="deleteSavedTemplate(event, '${tpl.id}')"
                    style="
                        position:absolute;
                        top:-8px;
                        right:-8px;
                        z-index:999;
                    ">
                ×
            </button>
        `;
        container.appendChild(card);
    });
}

async function loadSavedTemplate(tplId) {
    const cleanId = tplId.replace(/['"]/g, '');
    const fileName = cleanId.endsWith('.html') ? cleanId : `${cleanId}.html`;
    try {
        const response = await fetch(`/load_from_folder/${fileName}?v=${Date.now()}`);
        const data = await response.json();
        if (!data.content) {
            alert("Не удалось загрузить шаблон");
            return;
        }
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = data.content;
        const loadedElements = tempDiv.querySelectorAll('.email-block');
        blocks = [];
        loadedElements.forEach(el => {
            const restoredBlock = parseElementToBlock(el);
            blocks.push(restoredBlock);
        });
        selectedBlockIndex = -1;
        render();
        console.log("Шаблон загружен:", blocks);
    } catch (e) {
        console.error("Ошибка загрузки:", e);
        alert("Ошибка загрузки шаблона");
    }
}

// Функция удаления шаблона
async function deleteSavedTemplate(event, tplId) {
    event.stopPropagation();
    if (!confirm("Удалить этот шаблон навсегда?")) return;
    let templates = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    templates = templates.filter(t => t.id !== tplId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    try {
        await fetch(`/delete_template_file/${tplId}.html`, {
            method: 'DELETE'
        });
    } catch (e) {
        console.log("Файл на сервере не найден, удаляем только кнопку");
    }
    renderUserTemplates();
}

// Функции загрузки шаблона
function uploadUserFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        const content = e.target.result;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        const loadedElements = tempDiv.querySelectorAll('.email-block');
        if (!loadedElements.length) {
            alert('В файле не найдены блоки шаблона');
            return;
        }
        blocks = [];
        loadedElements.forEach(el => {
            const restoredBlock = parseElementToBlock(el);
            blocks.push(restoredBlock);
        });
        selectedBlockIndex = -1;
        render();
        alert('Шаблон успешно загружен и готов к редактированию!');
    };
    reader.readAsText(file);
}

function parseElementToBlock(el) {
    const inner = el.querySelector('[data-type]') || el;
    const type =
        el.dataset.type ||
        inner.dataset.type ||
        (inner.tagName === 'IMG' ? 'image' : inner.tagName === 'H1' ? 'title' : 'text');
    const block = {
        type: type,
        content: '',
        align: el.style.textAlign || inner.style.textAlign || 'left',
        fontSize: parseInt(inner.style.fontSize || el.style.fontSize) || 16,
        fontFamily: cleanFontFamily(inner.style.fontFamily || el.style.fontFamily || 'Unbounded'),
        fontWeight: parseInt(inner.style.fontWeight || el.style.fontWeight) || 400,
        color: rgbToHex(inner.style.color || el.style.color) || '#000000',
        lineHeight: parseFloat(inner.style.lineHeight || el.style.lineHeight) || 1.2,
        textDecoration: inner.style.textDecoration || inner.style.textDecorationLine || 'none'
    };
    if (type === 'title') {
        block.content = inner.innerHTML || inner.textContent || 'Заголовок';
        block.fontSize = block.fontSize || 32;
        block.fontWeight = block.fontWeight || 600;
    }
    if (type === 'text') {
        block.content = inner.innerHTML || inner.textContent || 'Текст сообщения';
        block.lineHeight = block.lineHeight || 1.5;
    }
    if (type === 'link' || type === 'button') {
        const link = el.querySelector('a') || inner;
        block.type = 'link';
        block.content = link.innerHTML || link.textContent || 'Ссылка';
        block.url = link.getAttribute('href') || '#';
        block.fontFamily = cleanFontFamily(link.style.fontFamily || block.fontFamily);
        block.fontWeight = parseInt(link.style.fontWeight) || block.fontWeight || 400;
        block.fontSize = parseInt(link.style.fontSize) || block.fontSize || 16;
        block.color = rgbToHex(link.style.color) || block.color || '#0066cc';
        block.textDecoration =
            link.style.textDecoration ||
            link.style.textDecorationLine ||
            block.textDecoration ||
            'underline';
    }
    if (type === 'image') {
        const img = el.querySelector('img') || inner;
        block.type = 'image';
        block.content = '';
        block.src = img.getAttribute('src') || '';
        block.alt = img.getAttribute('alt') || 'Изображение';
        block.width = img.style.width || '100%';
        block.borderRadius = parseInt(img.style.borderRadius) || 0;
    }
    return block;
}

function triggerImageUpload() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
        const file = input.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append("file", file);
        fetch("/upload-image", {
            method: "POST",
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                const url = data.url || data.path || data.file || data;
                if (!url) {
                    console.error("No URL returned from server");
                    return;
                }
                if (selectedBlockIndex !== -1 && blocks[selectedBlockIndex]) {
                    blocks[selectedBlockIndex].src = url;
                    render();
                }
                const inputField = document.getElementById("propImageSrc");
                if (inputField) inputField.value = url;
            })
            .catch(err => {
                console.error("Upload error:", err);
            });
    };
    input.click();
}

function replaceImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    fetch("/upload-image", {
        method: "POST",
        body: formData
    })
        .then(res => res.json())
        .then(data => {
            if (selectedBlockIndex !== -1 && blocks[selectedBlockIndex]) {
                blocks[selectedBlockIndex].src = data.url;
                render();
            }
        });
}

// Функция для клиентов
async function loadClients() {
    const select = document.getElementById('customerSelect');
    if (!select) return;
    select.innerHTML = '<option value="">Загрузка...</option>';
    try {
        const response = await fetch('/get_clients');
        clientsList = await response.json();
        select.innerHTML = '<option value="">-- Выберите из списка --</option>';
        clientsList.forEach((client, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = client.fio;
            select.appendChild(option);
        });
    } catch (err) {
        console.error("Ошибка загрузки:", err);
        select.innerHTML = '<option value="">Ошибка загрузки базы</option>';
    }
}
const customerSelect = document.getElementById('customerSelect');
if (customerSelect) {
    customerSelect.addEventListener('change', function (e) {
        const index = e.target.value;
        if (index === "") {
            resetFields();
            return;
        }
        const client = clientsList[index];
        document.getElementById('customerFIO').textContent = client.fio || '—';
        document.getElementById('customerEmail').textContent = client.email || '—';
        document.getElementById('customerPhone').textContent = client.phone || '—';
    });
}

function resetFields() {
    document.getElementById('customerFIO').textContent = '—';
    document.getElementById('customerEmail').textContent = '—';
    document.getElementById('customerPhone').textContent = '—';
}

function insertCustomerName() {
    const fio = document.getElementById('customerFIO').textContent;
    if (fio !== '—') {
        alert("ФИО " + fio + " готово к вставке!");
    }
}

async function saveClient() {
    const payload = {
        fio: document.getElementById('new-fio').value,
        phone: document.getElementById('new-phone').value,
        email: document.getElementById('new-email').value
    };
    try {
        const response = await fetch('/add_client', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        if (response.ok) {
            closeModal();
            alert('Заказчик добавлен!');
            location.reload();
        } else {
            const errorData = await response.json();
            alert('Ошибка 1С: ' + (errorData.error || 'Неизвестно'));
        }
    } catch (e) {
        console.error("Критический сбой:", e);
        alert("Ошибка связи с сервером. Проверьте консоль F12");
    }
}

// Функция маски для ввода телефона при добавлении заказчика
function applyPhoneMask() {
    const phoneInput = document.getElementById('new-phone');
    if (!phoneInput) return;
    if (phoneMask) {
        phoneMask.destroy();
    }
    phoneMask = IMask(phoneInput, {
        mask: '8 (000) 000-00-00',
        lazy: true,
        placeholderChar: '_'
    });
}

// Универсальная функция открытия модального окна
function openModal() {
    const modal = document.getElementById('modalAdd');
    if (modal) {
        modal.style.display = 'flex';
        const phoneInput = document.getElementById('new-phone');
        if (phoneInput) phoneInput.value = '';
        applyPhoneMask();
    }
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

window.onclick = function (event) {
    const contactModal = document.getElementById('contactModal');
    const modalAdd = document.getElementById('modalAdd');
    if (event.target === contactModal || event.target === modalAdd) {
        closeModal();
    }
};

// Функция кнопки "Контакты для связи"
function loadManagementContacts() {
    const modal = document.getElementById('contactModal');
    const container = document.getElementById('contactsContainer');
    if (modal) modal.style.display = "block";
    if (container) container.innerHTML = "<p>Загрузка данных из 1С...</p>";
    fetch('/get-management-contacts')
        .then(res => res.json())
        .then(data => {
            if (!container) return;
            container.innerHTML = "";
            if (data.error) {
                container.innerHTML = `<p style="color:red">Ошибка: ${data.error}</p>`;
                return;
            }
            data.forEach(emp => {
                const card = document.createElement('div');
                card.className = 'contact-card';
                card.innerHTML = `
                    <div style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                        <div style="font-weight: bold; color: #320783; font-size: 1.1em;">
                            ${emp.fio || 'Без имени'}
                        </div>
                        <div style="margin-top: 8px;">
                            <a href="tel:${emp.phone}"
                               style="text-decoration: none; color: #000; display: block; margin-bottom: 5px;">
                                📞 ${emp.phone || '-'}
                            </a>
                            <a href="mailto:${emp.email}"
                               style="text-decoration: none; color: #320783; display: block; font-size: 0.9em;">
                                ✉️ ${emp.email || '-'}
                            </a>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        })
        .catch(err => {
            if (container) container.innerHTML = "<p>Ошибка связи с сервером Python</p>";
            console.error("Fetch error:", err);
        });
}

// Функция для журнала
async function updateJournalTable() {
    const tableBody = document.getElementById('journal-body');
    if (!tableBody) return;
    try {
        const response = await fetch('/get_journal');
        const data = await response.json();
        tableBody.innerHTML = '';
        if (!data || data.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center; padding: 20px;">
                        Журнал пуст
                    </td>
                </tr>
            `;
            return;
        }
        data.forEach(item => {
            let statusClass = 'status-read';
            const statusText = item.status ? item.status.toLowerCase() : '';
            if (statusText.includes('отправлено')) {
                statusClass = 'status-sent';
            } else if (statusText.includes('ошиб')) {
                statusClass = 'status-error';
            } else if (statusText.includes('ожидании')) {
                statusClass = 'status-pending';
            }
            const row = `
                <tr>
                    <td style="white-space: nowrap;">${item.time}</td>
                    <td>${item.fio}</td>
                    <td class="subject-cell">${item.subject || '—'}</td>
                    <td class="text-center">
                        <span class="status ${statusClass}">${item.status}</span>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
    } catch (error) {
        console.error("Ошибка обновления журнала:", error);
    }
}

function importData() {
    const input = document.getElementById('fileImport');
    if (!input || !input.files[0]) {
        alert("Выбери файл");
        return;
    }
    const formData = new FormData();
    formData.append("file", input.files[0]);
    fetch("/import", {
        method: "POST",
        body: formData
    })
        .then(res => res.json())
        .then(() => {
            alert("Импорт успешен");
        })
        .catch(err => {
            console.error(err);
            alert("Ошибка импорта");
        });
}

function sendEmail() {
    alert('заглушка отправки');
}

// Функция скролла
function safeScrollTo(targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;
    const offset = 20;
    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
    try {
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    } catch (err) {
        window.scrollTo(0, targetPosition);
    }
}

function bindAnchorScroll() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href').substring(1);
            if (targetId && document.getElementById(targetId)) {
                e.preventDefault();
                safeScrollTo(targetId);
            }
        });
    });
}

function rgbToHex(rgb) {
    if (!rgb) return '#000000';
    if (rgb.startsWith('#')) {
        return rgb;
    }
    const rgbValues = rgb.match(/\d+/g);
    if (!rgbValues || rgbValues.length < 3) {
        return '#000000';
    }
    return "#" + (
        (1 << 24) +
        (parseInt(rgbValues[0]) << 16) +
        (parseInt(rgbValues[1]) << 8) +
        parseInt(rgbValues[2])
    ).toString(16).slice(1).toUpperCase();
}

function cleanFontFamily(fontFamily) {
    if (!fontFamily) return 'Unbounded';
    return fontFamily
        .replace(/['"]/g, '')
        .split(',')[0]
        .trim();
}

// Экспорт функций
window.loadTemplate = loadTemplate;
window.importData = importData;
window.duplicateBlock = duplicateBlock;
window.deleteBlock = deleteBlock;
window.generateHTML = generateHTML;
window.triggerImageUpload = triggerImageUpload;
window.replaceImage = replaceImage;
window.sendEmail = sendEmail;
window.insertCustomerName = insertCustomerName;
window.loadManagementContacts = loadManagementContacts;
window.closeModal = closeModal;
window.openModal = openModal;
window.saveClient = saveClient;
window.saveUserTemplate = saveUserTemplate;
window.loadSavedTemplate = loadSavedTemplate;
window.deleteSavedTemplate = deleteSavedTemplate;
window.uploadUserFile = uploadUserFile;