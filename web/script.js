let blockCount = 0;
const socket = new WebSocket('ws://' + window.location.host + '/ws');

codeMirrorObjects = {};

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log(data);
    const output = document.querySelector(`#${data.blockId} .output`);
    
    let outputHtml = '';

    if (data.output.stdout) {
        outputHtml += `<pre>${data.output.stdout}</pre>`;
    }

    data.output.rich_output.forEach(item => {
        if (item.type === 'markdown') {
            // You might want to use a markdown parser library here
            // For now, we'll just display it as plain text
            outputHtml += `<div class="markdown">${item.content}</div>`;
        } else if (item.type === 'text') {
            outputHtml += `<pre>${item.content}</pre>`;
        }
    });

    if (data.output.error) {
        outputHtml += `<pre class="error">${data.output.error}</pre>`;
    }

    output.innerHTML = outputHtml;
};

function addCodeBlock() {
    blockCount++;
    const blockId = `block-${blockCount}`;
    const newBlock = `
        <div id="${blockId}" class="code-block">
            <textarea id="code-${blockId}"></textarea>
            <button class="run-button" onclick="runCodeBlock('${blockId}')">Run</button>
            <button class="remove-button" onclick="removeCodeBlock('${blockId}')">Remove</button>
            <div class="output"></div>
        </div>
    `;
    document.getElementById('notebook').insertAdjacentHTML('beforeend', newBlock);

    var e = CodeMirror.fromTextArea(document.getElementById(`code-${blockId}`), {
            value: "",
            mode:  "python",
            indentUnit: 4,
            lineNumbers: true,
    });

    codeMirrorObjects[blockId] = e;
}

function addTextBlock() {
    blockCount++;
    const blockId = `block-${blockCount}`;
    const newTextBlock = `
        <div id="${blockId}" class="text-block">
            <textarea class="text-block-textarea"></textarea>
            <button class="text-remove-button" onclick="removeCodeBlock('${blockId}')">Remove</button>
        </div>
    `;
    document.getElementById('notebook').insertAdjacentHTML('beforeend', newTextBlock);
    document.querySelector(`#${blockId} .text-block-textarea`).focus();
}

function runCodeBlock(blockId) {
    const code = codeMirrorObjects[blockId].getValue();
    
    socket.send(JSON.stringify({
        blockId: blockId,
        code: code
    }));
}

function removeCodeBlock(blockId) {
    document.getElementById(blockId).remove();
}

function toggleOptions() {
    const options = document.querySelector('.options');
    options.classList.toggle('hidden');
}

// Initialize with one code block
addCodeBlock();
