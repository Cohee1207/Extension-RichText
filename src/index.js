import './style.css';
import 'quill/dist/quill.bubble.css';

import Quill from 'quill/core';

import Toolbar from 'quill/modules/toolbar';
import Bubble from 'quill/themes/bubble';

import Bold from 'quill/formats/bold';
import Italic from 'quill/formats/italic';
import Underline from 'quill/formats/underline';
import Header from 'quill/formats/header';
import Blockquote from 'quill/formats/blockquote';
import Image from 'quill/formats/image';
import List from 'quill/formats/list';
import Indent from 'quill/formats/indent';
import Code, { Code as CodeInline } from 'quill/formats/code';
import Icon from 'quill/ui/icons';

import TurndownService from 'turndown';
import DOMPurify from 'dompurify';
import markdownit from 'markdown-it';

const send = document.getElementById('send_but');
const textarea = document.getElementById('send_textarea');
const placeholder = textarea.placeholder;
const value = textarea.value;
const container = document.createElement('div');
container.innerHTML = value;
container.classList.add('rich-editor', 'mes_text');
textarea.parentNode.insertBefore(container, textarea.nextSibling);
textarea.style.display = 'none';

// Markdown to HTML
const md = markdownit();

// HTML to Markdown
const turndownService = new TurndownService();
turndownService.addRule('underline', {
    filter: ['u'],
    replacement: function (content) {
        return `__${content}__`;
    }
});
turndownService.addRule('code-block', {
    filter: ['pre'],
    replacement: function (content) {
        return `\n\`\`\`\n${content}\`\`\`\n`;
    }
});
turndownService.addRule('quotes', {
    filter: ['q'],
    replacement: function (content) {
        return `"${content}"`;
    }
});

const {
    shouldSendOnEnter,
} = SillyTavern.getContext();


Quill.register({
    'modules/toolbar': Toolbar,
    'themes/bubble': Bubble,
    'formats/bold': Bold,
    'formats/italic': Italic,
    'formats/underline': Underline,
    'formats/header': Header,
    'formats/code': CodeInline,
    'formats/code-block': Code,
    'formats/blockquote': Blockquote,
    'formats/image': Image,
    'formats/list': List,
    'formats/indent': Indent,
    'ui/icons': Icon,
});

const quill = new Quill(container, {
    theme: 'bubble',
    placeholder: placeholder,
    debug: 'info',
    modules: {
        toolbar: [
            ['bold', 'italic', 'underline', 'code'],
            ['blockquote', 'code-block', 'link'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            ['clean'],
        ],
        keyboard: {
            bindings: {
                enter: {
                    key: 'Enter',
                    handler: function () {
                        if (typeof shouldSendOnEnter !== 'function') {
                            return true;
                        }

                        if (shouldSendOnEnter()) {
                            send.click();
                            return false;
                        }

                        return true;
                    },
                },
            }
        }
    }
});

quill.on(Quill.events.TEXT_CHANGE, function () {
    const html = DOMPurify.sanitize(quill.getSemanticHTML());
    const markdown = turndownService.turndown(html);
    textarea.value = markdown;
    localStorage.setItem('userInput', markdown);
});

const attributesObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
        if (mutation.type == 'attributes') {
            if (mutation.attributeName == 'placeholder') {
                quill.root.dataset.placeholder = textarea.placeholder;
            }
        }
    });
});

attributesObserver.observe(textarea, {
    attributes: true,
});

jQuery(textarea).on('focus', function () {
    quill.focus();
});

jQuery(textarea).on('input', function () {
    const html = DOMPurify.sanitize(md.render(textarea.value));
    quill.root.innerHTML = html;
});

export default Quill;
