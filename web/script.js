let blockCount = 0;
const socket = new WebSocket('ws://' + window.location.host + '/ws');

codeMirrorObjects = {};

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log(data);
    const output = document.querySelector(`#${data.blockId} .output`);
    
    let outputHtml = '';

    if (data.output.stdout) {
        outputHtml += `<pre class="pre-output">${data.output.stdout}</pre>`;
    }

    data.output.rich_output.forEach(item => {
        if (item.type === 'markdown') {
            // You might want to use a markdown parser library here
            // For now, we'll just display it as plain text
            outputHtml += `<div class="markdown">${item.content}</div>`;
        } else if (item.type === 'text') {
            outputHtml += `<pre class="pre-output">${item.content}</pre>`;
        }
    });

    if (data.output.error) {
        outputHtml += `<pre class="pre-error">${data.output.error}</pre>`;
    }

    output.innerHTML = outputHtml;
};

function addCodeBlock() {
    blockCount++;
    const blockId = `block-${blockCount}`;
    const newBlock = `
        <div id="${blockId}" class="code-block">
            <textarea id="code-${blockId}"></textarea>
            <div class="output"></div>
            <div class="block-buttons">
                <button class="run-button" onclick="runCodeBlock('${blockId}')"><img src="/other/images/icons/play.svg" alt="Run" /></button>
                <button class="remove-button" onclick="removeCodeBlock('${blockId}')"><img src="/other/images/icons/trash.svg" alt="Remove" /></button>

                <button class="more-button" onclick="toggleOptions()"><img src="/other/images/icons/more.svg" alt="More" /></button>
            </div>
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
            <div contenteditable="true" class="text-block-textarea"></div>
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

    const empty = document.querySelector('.empty');
    empty.classList.toggle('empty-hidden');
}

// Initialize with one code block
addCodeBlock();
